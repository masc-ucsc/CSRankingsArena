'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const hapiRateLimit = require('hapi-rate-limit');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import services and controllers
const paperController = require('./src/controllers/paperController');
const categoryController = require('./src/controllers/categoryController');
const competitionService = require('./src/services/competitionService');
const agentService = require('./src/services/agentService');
const websocketService = require('./src/services/websocketService');
const { db } = require('./src/config/db');
const mockController = require('./src/controllers/mockController');

// Import plugins
const databasePlugin = require('./src/plugins/database');

// Import routes
const papersRoutes = require('./src/routes/v2/papers');
const matchesRoutes = require('./src/routes/v2/matches');
const agentsRoutes = require('./src/routes/v2/agents');
const leaderboardRoutes = require('./src/routes/v2/leaderboard');
const feedbackRoutes = require('./src/routes/v2/feedback');
const categoriesRoutes = require('./src/routes/v2/categories');

// Server configuration
const config = {
    server: {
        host: process.env.HOST || 'localhost',
        port: process.env.PORT || 5000,
        routes: {
            cors: {
                origin: ['http://localhost:3000', 'http://localhost:3001'],
                additionalHeaders: ['Access-Control-Allow-Origin'],
                credentials: true
            },
            validate: {
                failAction: async (request, h, err) => {
                    if (process.env.NODE_ENV === 'production') {
                        console.error('Validation error:', err.message);
                        throw Boom.badRequest('Invalid request payload');
                    } else {
                        console.error('Validation error:', err);
                        throw err;
                    }
                }
            }
        }
    },
    auth: {
        jwt: {
            secret: process.env.JWT_SECRET || 'your-secret-key'
        }
    }
};

// Initialize server
const init = async () => {
    // Create Hapi server
    const server = Hapi.server(config.server);

    // Register plugins
    await server.register([
        Inert, // For serving static files
        databasePlugin,
        {
            plugin: hapiRateLimit,
            options: {
                userLimit: 300,
                pathLimit: 50,
                userCache: {
                    expiresIn: 15 * 60 * 1000 // 15 minutes
                }
            }
        },
        require('@hapi/jwt')
    ]);

    // Initialize WebSocket service
    websocketService.initialize(server.listener);

    // Register JWT authentication strategy
    server.auth.strategy('jwt', 'jwt', {
        keys: config.auth.jwt.secret,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            maxAgeSec: 14400 // 4 hours
        },
        validate: async (artifacts, request, h) => {
            try {
                // Verify the token
                const decoded = jwt.verify(artifacts.token, config.auth.jwt.secret);
                
                // Get user from database to ensure they still exist
                const user = await db('users')
                    .where('id', decoded.id)
                    .first();
                
                if (!user) {
                    return { credentials: null, isValid: false };
                }

                return {
                    isValid: true,
                    credentials: {
                        id: user.id,
                        username: user.username,
                        github_id: user.github_id
                    }
                };
            } catch (err) {
                return { credentials: null, isValid: false };
            }
        }
    });

    // Set default auth strategy
    // server.auth.default('jwt'); // Temporarily disabled default auth

    // Register routes
    server.route([
        // Health check
        {
            method: 'GET',
            path: '/api/v2/health',
            options: {
                description: 'Health check endpoint',
                tags: ['api', 'health'],
                handler: async (request, h) => {
                    return { status: 'ok', timestamp: new Date().toISOString() };
                }
            }
        },
        // Mock YAML files endpoint (for development)
        {
            method: 'GET',
            path: '/api/v2/mock/papers/{category}/{subcategory}/{year}/{file}',
            options: {
                tags: ['api', 'mock'],
                description: 'Get mock YAML file (development only)',
                validate: {
                    params: Joi.object({
                        category: Joi.string().required(),
                        subcategory: Joi.string().required(),
                        year: Joi.string().pattern(/^\d{4}$/).required(),
                        file: Joi.string().required()
                    })
                },
                handler: async (request, h) => {
                    if (!process.env.USE_MOCK_DATA) {
                        return h.response({ message: 'Mock data is disabled' }).code(403);
                    }
                    
                    const { category, subcategory, year, file } = request.params;
                    const yamlPath = path.join(__dirname, 'mock', 'papers', category, subcategory, year, file);
                    
                    try {
                        const yamlContent = await fs.promises.readFile(yamlPath, 'utf8');
                        return h.response(yamlContent).type('text/yaml');
                    } catch (error) {
                        return h.response({ message: 'YAML file not found' }).code(404);
                    }
                }
            }
        }
    ]);

    // Register v2 route modules
    server.route(papersRoutes);
    server.route(matchesRoutes);
    server.route(agentsRoutes);
    server.route(leaderboardRoutes);
    server.route(feedbackRoutes);
    server.route(categoriesRoutes);
    server.route(require('./src/routes/v2/auth'));

    // Error handling
    server.ext('onPreResponse', (request, h) => {
        const response = request.response;
        
        if (Boom.isBoom(response)) {
            console.error(`Error ${response.output.statusCode}: ${response.message}`);
            return h.response({
                error: response.output.payload.error,
                message: response.message,
                statusCode: response.output.statusCode
            }).code(response.output.statusCode);
        }

        return h.continue;
    });

    // Start server
    try {
        await server.start();
        console.log('Server running on %s', server.info.uri);
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    process.exit(1);
});

// Start the server
init();