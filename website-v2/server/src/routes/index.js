'use strict';

const categoryController = require('../controllers/categoryController');
const paperController = require('../controllers/paperController');
const Joi = require('@hapi/joi');
const matches = require('./matches');
const leaderboard = require('./leaderboard');
const feedback = require('./feedback');
//const auth = require('./auth.routes');

module.exports = [
  // Categories routes
  {
    method: 'GET',
    path: '/api/categories',
    handler: categoryController.getCategories,
    options: {
      description: 'Get all categories',
      tags: ['api', 'categories']
    }
  },
  {
    method: 'GET',
    path: '/api/categories/{slug}',
    handler: categoryController.getCategory,
    options: {
      description: 'Get a specific category by slug',
      tags: ['api', 'categories'],
      validate: {
        params: Joi.object({
          slug: Joi.string().required().description('Category slug')
        })
      }
    }
  },
  
  // Papers routes
  {
    method: 'GET',
    path: '/api/papers',
    handler: paperController.getPapers,
    options: {
      description: 'Get papers by category, subcategory, and year',
      tags: ['api', 'papers'],
      validate: {
        query: Joi.object({
          category: Joi.string().required().description('Category slug'),
          subcategory: Joi.string().required().description('Subcategory slug'),
          year: Joi.number().required().description('Publication year')
        })
      }
    }
  },
  
  // Search papers route
  {
    method: 'GET',
    path: '/api/papers/search',
    handler: paperController.searchPapers,
    options: {
      description: 'Search papers',
      tags: ['api', 'papers', 'search'],
      validate: {
        query: Joi.object({
          q: Joi.string().optional().description('Search query'),
          category: Joi.string().optional().description('Category slug'),
          subcategory: Joi.string().optional().description('Subcategory slug'),
          year: Joi.number().optional().description('Publication year'),
          page: Joi.number().default(1).description('Page number'),
          limit: Joi.number().default(20).description('Results per page')
        })
      }
    }
  },




  
  // Not found handler - must be the last route
  {
    method: '*',
    path: '/{any*}',
    handler: (request, h) => {
      return h.response({
        error: 'Not Found',
        message: 'Route not found',
        statusCode: 404
      }).code(404);
    }
  },
    ...matches,
    ...leaderboard,
    ...feedback
    // ...auth
];