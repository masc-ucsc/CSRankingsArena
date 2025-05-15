const matchController = require('../controllers/matchController');
const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const db = require('../config/db');

module.exports = [
    {
        method: 'POST',
        path: '/api/competition/matches',
        handler: matchController.createMatch,
        options: {
            description: 'Create a new match between two agents for a paper',
            tags: ['api', 'matches'],
            validate: {
                payload: Joi.object({
                    paperId: Joi.number().when('paper1Id', {
                        is: Joi.exist(),
                        then: Joi.forbidden(),
                        otherwise: Joi.required()
                    }).description('ID of the paper to match (for single paper matches)'),
                    paper1Id: Joi.number().when('paperId', {
                        is: Joi.exist(),
                        then: Joi.forbidden(),
                        otherwise: Joi.required()
                    }).description('ID of first paper (for comparison matches)'),
                    paper2Id: Joi.number().when('paperId', {
                        is: Joi.exist(),
                        then: Joi.forbidden(),
                        otherwise: Joi.required()
                    }).description('ID of second paper (for comparison matches)'),
                    agent1Id: Joi.number().required().description('ID of first agent'),
                    agent2Id: Joi.number().required().description('ID of second agent'),
                    judgeId: Joi.number().required().description('ID of judge agent'),
                    category: Joi.string().description('Category for demo paper fallback'),
                    subcategory: Joi.string().description('Subcategory for demo paper fallback')
                })
                .xor('paperId', 'paper1Id')
                .with('paper1Id', ['paper2Id'])
                .with('category', ['subcategory'])
            }
        }
    },
    {
        method: 'GET',
        path: '/api/matches/{matchId}',
        handler: matchController.getMatch,
        options: {
            description: 'Get match by ID',
            tags: ['api', 'matches'],
            validate: {
                params: {
                    matchId: Joi.string().uuid().required().description('UUID of the match')
                }
            }
        }
    },
    {
        method: 'PATCH',
        path: '/api/matches/{matchId}',
        handler: matchController.updateMatch,
        options: {
            description: 'Update match status and results',
            tags: ['api', 'matches'],
            validate: {
                params: {
                    matchId: Joi.string().uuid().required().description('UUID of the match')
                },
                payload: {
                    status: Joi.string().valid('pending', 'in_progress', 'completed', 'failed')
                        .description('New status of the match'),
                    winner_id: Joi.number().description('ID of the winning agent'),
                    error: Joi.string().description('Error message if match failed'),
                    match_data: Joi.object().description('Additional match data')
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/matches/{matchId}/reviews',
        handler: matchController.addReview,
        options: {
            description: 'Add a review to a match',
            tags: ['api', 'matches', 'reviews'],
            validate: {
                params: {
                    matchId: Joi.string().uuid().required().description('UUID of the match')
                },
                payload: {
                    agent_id: Joi.number().required().description('ID of the reviewing agent'),
                    paper_id: Joi.number().required().description('ID of the paper being reviewed'),
                    content: Joi.string().required().description('Review content'),
                    technical_score: Joi.number().min(0).max(5).required()
                        .description('Technical score (0-5)'),
                    depth_score: Joi.number().min(0).max(5).required()
                        .description('Depth score (0-5)'),
                    feedback_score: Joi.number().min(0).max(5).required()
                        .description('Feedback score (0-5)'),
                    clarity_score: Joi.number().min(0).max(5).required()
                        .description('Clarity score (0-5)'),
                    fairness_score: Joi.number().min(0).max(5).required()
                        .description('Fairness score (0-5)'),
                    overall_score: Joi.number().min(0).max(5).required()
                        .description('Overall score (0-5)')
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/reviews/{reviewId}/feedback',
        handler: matchController.addFeedback,
        options: {
            description: 'Add community feedback to a review',
            tags: ['api', 'reviews', 'feedback'],
            validate: {
                params: {
                    reviewId: Joi.number().required().description('ID of the review')
                },
                payload: {
                    user_id: Joi.number().description('ID of the user giving feedback (optional)'),
                    rating: Joi.number().min(1).max(5).required()
                        .description('Rating (1-5)'),
                    comment: Joi.string().description('Feedback comment (optional)')
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/matches',
        handler: matchController.getMatches,
        options: {
            description: 'Get matches with optional filters',
            tags: ['api', 'matches'],
            validate: {
                query: {
                    status: Joi.string().valid('pending', 'in_progress', 'completed', 'failed')
                        .description('Filter by match status'),
                    paperId: Joi.number().description('Filter by paper ID'),
                    agentId: Joi.number().description('Filter by agent ID'),
                    limit: Joi.number().min(1).max(100).default(20)
                        .description('Number of results to return'),
                    offset: Joi.number().min(0).default(0)
                        .description('Number of results to skip'),
                    orderBy: Joi.string().valid('created_at', 'completed_at', 'status')
                        .default('created_at')
                        .description('Field to order results by'),
                    order: Joi.string().valid('ASC', 'DESC').default('DESC')
                        .description('Order direction')
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/competition/matches/recent',
        handler: async (request, h) => {
            try {
                const matches = await db('matches')
                    .select(
                        'matches.*',
                        'p1.title as paper1_title',
                        'p1.abstract as paper1_abstract',
                        'p1.venue as paper1_venue',
                        'p1.year as paper1_year',
                        'p2.title as paper2_title',
                        'p2.abstract as paper2_abstract',
                        'p2.venue as paper2_venue',
                        'p2.year as paper2_year',
                        'a1.name as agent1_name',
                        'a1.id as agent1_id',
                        'a1.avatar_url as agent1_avatar',
                        'a2.name as agent2_name',
                        'a2.id as agent2_id',
                        'a2.avatar_url as agent2_avatar',
                        'j.name as judge_name',
                        'j.id as judge_id',
                        'j.avatar_url as judge_avatar',
                        'w.name as winner_name',
                        'w.id as winner_id',
                        'w.avatar_url as winner_avatar',
                        db.raw(`
                            (SELECT COUNT(*) FROM reviews r 
                             WHERE r.match_id = matches.id AND r.agent_id = a1.id) as agent1_review_count
                        `),
                        db.raw(`
                            (SELECT COUNT(*) FROM reviews r 
                             WHERE r.match_id = matches.id AND r.agent_id = a2.id) as agent2_review_count
                        `),
                        db.raw(`
                            (SELECT AVG(r.rating) FROM reviews r 
                             WHERE r.match_id = matches.id AND r.agent_id = a1.id) as agent1_avg_rating
                        `),
                        db.raw(`
                            (SELECT AVG(r.rating) FROM reviews r 
                             WHERE r.match_id = matches.id AND r.agent_id = a2.id) as agent2_avg_rating
                        `)
                    )
                    .leftJoin('papers as p1', 'matches.paper1_id', 'p1.id')
                    .leftJoin('papers as p2', 'matches.paper2_id', 'p2.id')
                    .leftJoin('agents as a1', 'matches.agent1_id', 'a1.id')
                    .leftJoin('agents as a2', 'matches.agent2_id', 'a2.id')
                    .leftJoin('agents as j', 'matches.judge_id', 'j.id')
                    .leftJoin('agents as w', 'matches.winner_id', 'w.id')
                    .orderBy('matches.created_at', 'desc')
                    .limit(10);

                // Format the response to include paper and agent details
                const formattedMatches = matches.map(match => ({
                    ...match,
                    paper: match.paper1_id ? {
                        id: match.paper1_id,
                        title: match.paper1_title,
                        abstract: match.paper1_abstract,
                        venue: match.paper1_venue,
                        year: match.paper1_year
                    } : null,
                    paper2: match.paper2_id ? {
                        id: match.paper2_id,
                        title: match.paper2_title,
                        abstract: match.paper2_abstract,
                        venue: match.paper2_venue,
                        year: match.paper2_year
                    } : null,
                    agent1: {
                        id: match.agent1_id,
                        name: match.agent1_name,
                        avatar_url: match.agent1_avatar,
                        review_count: match.agent1_review_count,
                        avg_rating: match.agent1_avg_rating
                    },
                    agent2: {
                        id: match.agent2_id,
                        name: match.agent2_name,
                        avatar_url: match.agent2_avatar,
                        review_count: match.agent2_review_count,
                        avg_rating: match.agent2_avg_rating
                    },
                    judge: {
                        id: match.judge_id,
                        name: match.judge_name,
                        avatar_url: match.judge_avatar
                    },
                    winner: match.winner_id ? {
                        id: match.winner_id,
                        name: match.winner_name,
                        avatar_url: match.winner_avatar
                    } : null
                }));

                return formattedMatches;
            } catch (error) {
                console.error('Error fetching recent matches:', error);
                return Boom.badImplementation('Error fetching recent matches');
            }
        },
        options: {
            description: 'Get recent matches with detailed information about papers, agents, and performance metrics',
            tags: ['api', 'matches']
        }
    }
]; 