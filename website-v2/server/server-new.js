'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Joi = require('joi');
const routes = require('./src/routes');
const plugins = require('./plugins');
const config = require('./src/config');

// Server initialization
const init = async () => {
    const server = Hapi.server({
        port: config.server.port,
        host: config.server.host,
        routes: {
            cors: {
                origin: ['*'],
                headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
                exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
                credentials: true
            }
        }
    });

    // Register plugins
    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: {
                info: {
                    title: 'Paper Evaluation League API',
                    version: '1.0.0',
                    description: 'API documentation for the Paper Evaluation League'
                },
                securityDefinitions: {
                    jwt: {
                        type: 'apiKey',
                        name: 'Authorization',
                        in: 'header'
                    }
                },
                security: [{ jwt: [] }],
                grouping: 'tags'
            }
        },
        ...plugins
    ]);

    // Register routes
    server.route(routes);

    // Error handling
    server.ext('onPreResponse', (request, h) => {
        const response = request.response;
        
        if (!response.isBoom) {
            return h.continue;
        }
        
        // Log error
        request.server.log(['error'], {
            error: response,
            request: {
                path: request.path,
                method: request.method,
                payload: request.payload,
                params: request.params,
                query: request.query
            }
        });
        
        // Return structured error response
        return h.response({
            statusCode: response.output.statusCode,
            error: response.output.payload.error,
            message: response.message || response.output.payload.message
        }).code(response.output.statusCode);
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
    
    return server;
};

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    process.exit(1);
});

// Start server
if (!module.parent) {
    init();
}

module.exports = { init };