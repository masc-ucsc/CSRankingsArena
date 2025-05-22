const Joi = require('@hapi/joi');
const { db } = require('../../config/db');

const routes = [
    {
        method: 'POST',
        path: '/api/v2/papers/{paperPath}/interactions',
        options: {
            auth: 'jwt',
            validate: {
                params: Joi.object({
                    paperPath: Joi.string().required()
                }),
                payload: Joi.object({
                    interactionType: Joi.string().valid('like', 'dislike').required(),
                    comment: Joi.string().allow('').optional()
                })
            },
            handler: async (request, h) => {
                const { paperPath } = request.params;
                const { interactionType, comment } = request.payload;
                const userId = request.auth.credentials.id;

                try {
                    // Check if user already has an interaction of this type
                    const existingInteraction = await db('paper_interactions')
                        .where({
                            user_id: userId,
                            paper_path: paperPath,
                            interaction_type: interactionType
                        })
                        .first();

                    if (existingInteraction) {
                        // Remove the interaction if it exists (toggle off)
                        await db('paper_interactions')
                            .where('id', existingInteraction.id)
                            .delete();
                        return { message: 'Interaction removed' };
                    }

                    // Remove any existing interaction of the opposite type
                    await db('paper_interactions')
                        .where({
                            user_id: userId,
                            paper_path: paperPath,
                            interaction_type: interactionType === 'like' ? 'dislike' : 'like'
                        })
                        .delete();

                    // Add new interaction
                    const [id] = await db('paper_interactions').insert({
                        user_id: userId,
                        paper_path: paperPath,
                        interaction_type: interactionType,
                        comment: comment || null
                    });

                    return { id, message: 'Interaction added' };
                } catch (error) {
                    console.error('Error handling paper interaction:', error);
                    throw error;
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/papers/{paperPath}/interactions',
        options: {
            auth: 'jwt',
            validate: {
                params: Joi.object({
                    paperPath: Joi.string().required()
                })
            },
            handler: async (request, h) => {
                const { paperPath } = request.params;
                const userId = request.auth.credentials.id;

                try {
                    const interactions = await db('paper_interactions')
                        .where('paper_path', paperPath)
                        .select('*');

                    const userInteraction = await db('paper_interactions')
                        .where({
                            paper_path: paperPath,
                            user_id: userId
                        })
                        .first();

                    const stats = {
                        likes: interactions.filter(i => i.interaction_type === 'like').length,
                        dislikes: interactions.filter(i => i.interaction_type === 'dislike').length,
                        comments: interactions.filter(i => i.comment).map(i => ({
                            id: i.id,
                            comment: i.comment,
                            user_id: i.user_id,
                            created_at: i.created_at
                        })),
                        userInteraction: userInteraction ? {
                            type: userInteraction.interaction_type,
                            comment: userInteraction.comment
                        } : null
                    };

                    return stats;
                } catch (error) {
                    console.error('Error fetching paper interactions:', error);
                    throw error;
                }
            }
        }
    }
];

module.exports = routes; 