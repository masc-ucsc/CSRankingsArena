'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const hapiRateLimit = require('hapi-rate-limit');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
require('dotenv').config();

// Import services and controllers
const paperController = require('./src/controllers/paperController');
const categoryController = require('./src/controllers/categoryController');
const competitionService = require('./src/services/competitionService');
const agentService = require('./src/services/agentService');
const websocketService = require('./src/services/websocketService');
const { db } = require('./src/config/db');

// Import plugins
const databasePlugin = require('./src/plugins/database');

// Server configuration
const config = {
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost',
        routes: {
            cors: true,
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
    }
};

// Initialize server
const init = async () => {
    // Create server instance
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
        }
    ]);

    // Initialize WebSocket service
    websocketService.initialize(server.listener);

    // Register routes
    server.route([
        // Health check
        {
            method: 'GET',
            path: '/api/health',
            options: {
                description: 'Health check endpoint',
                tags: ['api', 'health'],
                handler: () => ({
                    status: 'ok',
                    message: 'Server is running',
                    timestamp: new Date().toISOString()
                })
            }
        },

        // Paper routes
        {
            method: 'GET',
            path: '/api/papers',
            options: {
                description: 'Get papers by category, subcategory, and year',
                tags: ['api', 'papers'],
                validate: {
                    query: Joi.object({
                        category: Joi.string().required().description('Category slug'),
                        subcategory: Joi.string().optional().description('Subcategory slug'),
                        year: Joi.number().required().description('Publication year')
                    })
                },
                handler: async (request, h) => {
                    try {
                        const { category, subcategory, year } = request.query;
                        const result = await paperController.processAllYamlFiles('papers', category);
                        let filteredPapers = result.results.flatMap(r => r.papers || []);
                        
                        if (subcategory) {
                            filteredPapers = filteredPapers.filter(paper => 
                                paper.subcategories?.includes(subcategory)
                            );
                        }
                        
                        if (year) {
                            filteredPapers = filteredPapers.filter(paper => {
                                const paperYear = new Date(paper.published || paper.arxivDetails?.published).getFullYear();
                                return paperYear === year;
                            });
                        }

                        return h.response({
                            papers: filteredPapers,
                            metadata: {
                                category,
                                subcategory,
                                year,
                                totalFound: filteredPapers.length,
                                filters: { category, subcategory, year }
                            }
                        });
                    } catch (error) {
                        throw Boom.badImplementation('Failed to retrieve papers', error);
                    }
                }
            }
        },
        {
            method: 'GET',
            path: '/api/papers/search',
            options: {
                description: 'Search papers by query',
                tags: ['api', 'papers', 'search'],
                validate: {
                    query: Joi.object({
                        q: Joi.string().required().description('Search query'),
                        category: Joi.string().required().description('Category slug'),
                        subcategory: Joi.string().optional().description('Subcategory slug'),
                        year: Joi.number().optional().description('Publication year'),
                        page: Joi.number().default(1).min(1).description('Page number'),
                        limit: Joi.number().default(20).min(1).max(100).description('Results per page')
                    })
                },
                handler: async (request, h) => {
                    try {
                        const { q, category, subcategory, year, page, limit } = request.query;
                        const result = await paperController.processAllYamlFiles('papers', category);
                        let searchResults = result.results.flatMap(r => r.papers || []);
                        
                        if (subcategory) {
                            searchResults = searchResults.filter(paper => 
                                paper.subcategories?.includes(subcategory)
                            );
                        }
                        
                        if (year) {
                            searchResults = searchResults.filter(paper => {
                                const paperYear = new Date(paper.published || paper.arxivDetails?.published).getFullYear();
                                return paperYear === year;
                            });
                        }

                        const searchQuery = q.toLowerCase();
                        searchResults = searchResults.filter(paper => {
                            const searchableText = [
                                paper.title,
                                paper.abstract,
                                paper.arxivDetails?.title,
                                paper.arxivDetails?.abstract,
                                ...(paper.authors || []),
                                ...(paper.arxivDetails?.authors || [])
                            ].filter(Boolean).join(' ').toLowerCase();
                            return searchableText.includes(searchQuery);
                        });

                        const startIndex = (page - 1) * limit;
                        const endIndex = startIndex + limit;
                        const paginatedResults = searchResults.slice(startIndex, endIndex);

                        return h.response({
                            results: paginatedResults,
                            metadata: {
                                total: searchResults.length,
                                page,
                                limit,
                                totalPages: Math.ceil(searchResults.length / limit),
                                filters: { query: q, category, subcategory, year: year || null }
                            }
                        });
                    } catch (error) {
                        throw Boom.badImplementation('Failed to search papers', error);
                    }
                }
            }
        },
        {
            method: 'POST',
            path: '/api/papers/process-yaml',
            options: {
                description: 'Process papers from a YAML file',
                tags: ['api', 'papers'],
                validate: {
                    payload: Joi.object({
                        yamlPath: Joi.string().required().description('Path to YAML file'),
                        category: Joi.string().required().description('Category slug'),
                        forceRefresh: Joi.boolean().default(false).description('Force refresh cache')
                    })
                },
                handler: async (request, h) => {
                    try {
                        const { yamlPath, category, forceRefresh } = request.payload;
                        
                        if (forceRefresh) {
                            paperController.clearCache(`yaml_${yamlPath}_${category}`);
                        }

                        const result = await paperController.processPapersFromYaml(yamlPath, category);
                        return h.response(result);
                    } catch (error) {
                        if (error.code === 'ENOENT') {
                            throw Boom.notFound('YAML file not found');
                        }
                        if (error.message.includes('Invalid YAML format')) {
                            throw Boom.badRequest('Invalid YAML format', error);
                        }
                        throw Boom.badImplementation('Failed to process papers', error);
                    }
                }
            }
        },

        // Category routes
        {
            method: 'GET',
            path: '/api/categories',
            options: {
                description: 'Get all categories',
                tags: ['api', 'categories'],
                handler: async (request, h) => {
                    try {
                        const categories = await categoryController.getCategories();
                        return h.response(categories);
                    } catch (error) {
                        throw Boom.badImplementation('Failed to retrieve categories', error);
                    }
                }
            }
        },
        {
            method: 'GET',
            path: '/api/categories/{slug}',
            options: {
                description: 'Get a specific category by slug',
                tags: ['api', 'categories'],
                validate: {
                    params: Joi.object({
                        slug: Joi.string().required().description('Category slug')
                    })
                },
                handler: async (request, h) => {
                    try {
                        const category = await categoryController.getCategory(request.params.slug);
                        if (!category) {
                            throw Boom.notFound('Category not found');
                        }
                        return h.response(category);
                    } catch (error) {
                        if (error.isBoom) throw error;
                        throw Boom.badImplementation('Failed to retrieve category', error);
                    }
                }
            }
        },

        // Competition routes
        {
            method: 'GET',
            path: '/api/competition/agents',
            options: {
                description: 'Get all active agents',
                tags: ['api', 'competition', 'agents'],
                handler: async (request, h) => {
                    try {
                        const agents = await agentService.getAllAgents();
                        return h.response(agents);
                    } catch (error) {
                        throw Boom.badImplementation('Failed to retrieve agents', error);
                    }
                }
            }
        },
        {
            method: 'GET',
            path: '/api/competition/leaderboard',
            options: {
                description: 'Get competition leaderboard',
                tags: ['api', 'competition', 'leaderboard'],
                validate: {
                    query: Joi.object({
                        limit: Joi.number().integer().min(1).max(100).default(10)
                    })
                },
                handler: async (request, h) => {
                    try {
                        const leaderboard = await competitionService.getLeaderboard(request.query.limit);
                        return h.response(leaderboard);
                    } catch (error) {
                        throw Boom.badImplementation('Failed to retrieve leaderboard', error);
                    }
                }
            }
        },

        // Match routes
        {
            method: 'GET',
            path: '/api/matches/{id}',
            options: {
                description: 'Get match by ID',
                tags: ['api', 'matches'],
                validate: {
                    params: Joi.object({
                        id: Joi.string().guid().required()
                    })
                },
                handler: async (request, h) => {
                    try {
                        const match = await db('matches')
                            .select(
                                'matches.*',
                                'papers.title as paper_title',
                                'papers.abstract as paper_abstract',
                                'papers.authors as paper_authors',
                                'papers.main_topic as paper_topic',
                                'papers.pdf_url as paper_pdf_url',
                                'a1.name as agent1_name',
                                'a1.model as agent1_model',
                                'a1.provider as agent1_provider',
                                'a2.name as agent2_name',
                                'a2.model as agent2_model',
                                'a2.provider as agent2_provider',
                                'w.name as winner_name'
                            )
                            .leftJoin('papers', 'matches.paper_id', 'papers.id')
                            .leftJoin('agents as a1', 'matches.agent1_id', 'a1.id')
                            .leftJoin('agents as a2', 'matches.agent2_id', 'a2.id')
                            .leftJoin('agents as w', 'matches.winner_id', 'w.id')
                            .where('matches.id', request.params.id)
                            .first();
                            
                        if (!match) {
                            throw Boom.notFound('Match not found');
                        }
                        
                        return h.response(match);
                    } catch (error) {
                        if (error.isBoom) throw error;
                        throw Boom.badImplementation('Failed to retrieve match', error);
                    }
                }
            }
        }
    ]);

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
    await server.start();
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on ${server.info.uri}`);
    
    return server;
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Start server
init();