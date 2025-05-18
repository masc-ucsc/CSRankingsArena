const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const MatchInteraction = require('../../models/matchInteractions');

// Validation schemas
const interactionSchema = Joi.object({
    type: Joi.string().valid('like', 'dislike', 'comment').required(),
    content: Joi.string().when('type', {
        is: 'comment',
        then: Joi.string().required().max(1000),
        otherwise: Joi.string().optional()
    }),
    isAnonymous: Joi.boolean().default(false)
});

const routes = [
    {
        method: 'POST',
        path: '/api/v2/matches/{matchId}/interactions',
        options: {
            description: 'Add a like, dislike, or comment to a match',
            tags: ['api', 'v2', 'matches'],
            validate: {
                params: Joi.object({
                    matchId: Joi.string().required()
                }),
                payload: Joi.object({
                    type: Joi.string().valid('like', 'dislike', 'comment').required(),
                    content: Joi.string().when('type', {
                        is: 'comment',
                        then: Joi.required(),
                        otherwise: Joi.forbidden()
                    }),
                    isAnonymous: Joi.boolean().default(false)
                })
            },
            handler: async (request, h) => {
                const { matchId } = request.params;
                const interactionData = request.payload;
                
                try {
                    const interaction = await MatchInteraction.addInteraction(request.db, matchId, interactionData);
                    return h.response(interaction[0]).code(201);
                } catch (error) {
                    console.error('Error adding interaction:', error);
                    return h.response({ error: 'Failed to add interaction' }).code(500);
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/matches/{matchId}/interactions',
        options: {
            description: 'Get all interactions for a match',
            tags: ['api', 'v2', 'matches'],
            validate: {
                params: Joi.object({
                    matchId: Joi.string().required()
                }),
                query: Joi.object({
                    page: Joi.number().integer().min(1).default(1),
                    limit: Joi.number().integer().min(1).max(100).default(10)
                })
            },
            handler: async (request, h) => {
                const { matchId } = request.params;
                const { page, limit } = request.query;
                
                try {
                    const [interactions, counts] = await Promise.all([
                        MatchInteraction.getInteractions(request.db, matchId, page, limit),
                        MatchInteraction.getCounts(request.db, matchId)
                    ]);
                    
                    return {
                        interactions,
                        counts
                    };
                } catch (error) {
                    console.error('Error fetching interactions:', error);
                    return h.response({ error: 'Failed to fetch interactions' }).code(500);
                }
            }
        }
    },
    {
        method: 'DELETE',
        path: '/api/v2/matches/{matchId}/interactions/{interactionId}',
        options: {
            description: 'Remove an interaction from a match',
            tags: ['api', 'v2', 'matches'],
            validate: {
                params: Joi.object({
                    matchId: Joi.string().required(),
                    interactionId: Joi.number().integer().required()
                })
            },
            handler: async (request, h) => {
                const { interactionId } = request.params;
                
                try {
                    await MatchInteraction.deleteInteraction(request.db, interactionId);
                    return h.response().code(204);
                } catch (error) {
                    console.error('Error deleting interaction:', error);
                    return h.response({ error: 'Failed to delete interaction' }).code(500);
                }
            }
        }
    }
];

module.exports = routes; 