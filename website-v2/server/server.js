'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const hapiRateLimit = require('hapi-rate-limit');
const Boom = require('@hapi/boom');
require('dotenv').config();

// Import routes
const routes = require('./routes');

// Set up the server
const init = async () => {
  // Create server instance with CORS configuration
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*'],  // Allow all origins in development
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        additionalHeaders: ['X-Requested-With'],
        exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        credentials: true
      }
    }
  });

  // Register plugins
  await server.register([
    Inert, // For serving static files
    
    // Rate limiting
    {
      plugin: hapiRateLimit,
      options: {
        userLimit: 300, // Requests per window per user
        pathLimit: 50,  // Requests per window per path
        userCache: {
          expiresIn: 15 * 60 * 1000 // 15 minutes
        }
      }
    }
  ]);

  // Error handling
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    
    // Handle Boom errors
    if (Boom.isBoom(response)) {
      // Log the error
      console.error(`Error ${response.output.statusCode}: ${response.message}`);
      
      // Return formatted error response
      return h.response({
        error: response.output.payload.error,
        message: response.message,
        statusCode: response.output.statusCode
      }).code(response.output.statusCode);
    }

    return h.continue;
  });

  // Register routes
  server.route(routes);

  // Health check route
  server.route({
    method: 'GET',
    path: '/api/health',
    handler: () => {
      return {
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
      };
    }
  });

  // Start the server
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