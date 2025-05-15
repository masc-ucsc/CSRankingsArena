const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const yamlLeaderboardService = require('../services/yamlLeaderboardService');

module.exports = [
    {
        method: 'GET',
        path: '/api/leaderboard/{category}/{subcategory}',
        options: {
            description: 'Get paper rankings for a category/subcategory',
            tags: ['api', 'leaderboard'],
            validate: {
                params: Joi.object({
                    category: Joi.string().required().description('Category slug'),
                    subcategory: Joi.string().required().description('Subcategory slug')
                }),
                query: Joi.object({
                    year: Joi.number().integer().required().description('Year to get rankings for')
                })
            },
            handler: async (request, h) => {
                try {
                    const { category, subcategory } = request.params;
                    const { year } = request.query;

                    const rankings = await yamlLeaderboardService.calculateRankings(
                        category,
                        subcategory,
                        year
                    );

                    return {
                        category,
                        subcategory,
                        year,
                        rankings
                    };
                } catch (error) {
                    console.error('Error fetching leaderboard:', error);
                    throw Boom.badImplementation('Error fetching leaderboard');
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/leaderboard/{category}/{subcategory}/years',
        options: {
            description: 'Get available years for a category/subcategory',
            tags: ['api', 'leaderboard'],
            validate: {
                params: Joi.object({
                    category: Joi.string().required().description('Category slug'),
                    subcategory: Joi.string().required().description('Subcategory slug')
                })
            },
            handler: async (request, h) => {
                try {
                    const { category, subcategory } = request.params;
                    const years = await yamlLeaderboardService.getAvailableYears(category, subcategory);
                    return { years };
                } catch (error) {
                    console.error('Error fetching available years:', error);
                    throw Boom.badImplementation('Error fetching available years');
                }
            }
        }
    }
]; 