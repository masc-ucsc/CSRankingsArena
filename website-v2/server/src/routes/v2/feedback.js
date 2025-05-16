'use strict';

const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const { db } = require('../../config/db');
//const logger = require('../utils/logger');

module.exports = [
  {
    method: 'GET',
    path: '/api/v2/feedback/{matchId}',
    options: {
      // auth: { mode: 'try' }, // Temporarily disabled auth
      tags: ['api', 'feedback'],
      description: 'Get feedback for a match',
      validate: {
        params: Joi.object({
          matchId: Joi.string().required()
        })
      },
      handler: async (request, h) => {
        try {
          const { matchId } = request.params;
          const userId = request.auth.credentials?.id;

          // Get feedback for the match
          const feedback = await db('match_feedback')
            .select(
              'match_feedback.*',
              'users.username',
              'users.avatar_url'
            )
            .leftJoin('users', 'match_feedback.user_id', 'users.id')
            .where('match_feedback.match_id', matchId)
            .orderBy('match_feedback.created_at', 'desc');

          // Get user's like status for each feedback
          const feedbackWithUserStatus = await Promise.all(feedback.map(async (item) => {
            let userLiked = false;
            if (userId) {
              const like = await db('feedback_likes')
                .where({
                  feedback_id: item.id,
                  user_id: userId
                })
                .first();
              userLiked = !!like;
            }

            return {
              ...item,
              user: item.user_id ? {
                id: item.user_id,
                username: item.username,
                avatar_url: item.avatar_url
              } : null,
              user_liked: userLiked
            };
          }));

          return { feedback: feedbackWithUserStatus };
        } catch (error) {
          console.error('Error fetching feedback:', error);
          throw Boom.badImplementation('Error fetching feedback');
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/v2/feedback',
    options: {
      // auth: 'jwt', // Temporarily disabled auth
      tags: ['api', 'feedback'],
      description: 'Add feedback for a match',
      validate: {
        payload: Joi.object({
          matchId: Joi.string().required(),
          liked: Joi.boolean().default(false),
          disliked: Joi.boolean().default(false),
          comment: Joi.string().allow('').max(1000)
        })
      },
      handler: async (request, h) => {
        try {
          const { matchId, liked, disliked, comment } = request.payload;
          const userId = request.auth.credentials.id;

          // Check if user already provided feedback for this match
          const existingFeedback = await db('match_feedback')
            .where({
              match_id: matchId,
              user_id: userId
            })
            .first();

          let feedback;
          if (existingFeedback) {
            // Update existing feedback
            [feedback] = await db('match_feedback')
              .where('id', existingFeedback.id)
              .update({
                liked,
                disliked,
                comment: comment || existingFeedback.comment,
                updated_at: new Date()
              })
              .returning('*');
          } else {
            // Create new feedback
            [feedback] = await db('match_feedback')
              .insert({
                match_id: matchId,
                user_id: userId,
                liked,
                disliked,
                comment,
                likes: 0
              })
              .returning('*');
          }

          // Get user info for the response
          const user = await db('users')
            .where('id', userId)
            .select('id', 'username', 'avatar_url')
            .first();

          return {
            ...feedback,
            user: {
              id: user.id,
              username: user.username,
              avatar_url: user.avatar_url
            },
            user_liked: false
          };
        } catch (error) {
          console.error('Error adding feedback:', error);
          throw Boom.badImplementation('Error adding feedback');
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/v2/feedback/{feedbackId}/like',
    options: {
      // auth: 'jwt', // Temporarily disabled auth
      tags: ['api', 'feedback'],
      description: 'Like or unlike a feedback',
      validate: {
        params: Joi.object({
          feedbackId: Joi.number().integer().required()
        })
      },
      handler: async (request, h) => {
        try {
          const { feedbackId } = request.params;
          const userId = request.auth.credentials.id;

          // Check if feedback exists
          const feedback = await db('match_feedback')
            .where('id', feedbackId)
            .first();

          if (!feedback) {
            throw Boom.notFound('Feedback not found');
          }

          // Check if user already liked this feedback
          const existingLike = await db('feedback_likes')
            .where({
              feedback_id: feedbackId,
              user_id: userId
            })
            .first();

          if (existingLike) {
            // Unlike
            await db('feedback_likes')
              .where('id', existingLike.id)
              .delete();

            await db('match_feedback')
              .where('id', feedbackId)
              .decrement('likes', 1);

            return { liked: false };
          } else {
            // Like
            await db('feedback_likes')
              .insert({
                feedback_id: feedbackId,
                user_id: userId
              });

            await db('match_feedback')
              .where('id', feedbackId)
              .increment('likes', 1);

            return { liked: true };
          }
        } catch (error) {
          console.error('Error liking feedback:', error);
          throw Boom.badImplementation('Error liking feedback');
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v2/feedback/match/{matchId}',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'feedback'],
      description: 'Get feedback for a specific match',
      validate: {
        params: Joi.object({
          matchId: Joi.string().uuid().required()
        })
      },
      handler: async (request, h) => {
        try {
          const { matchId } = request.params;
          
          // Get all feedback for the match
          const feedback = await db('feedback')
            .select(
              'feedback.*',
              'agents.name as agent_name',
              'agents.category as agent_category'
            )
            .leftJoin('agents', 'feedback.agent_id', 'agents.id')
            .where('feedback.match_id', matchId)
            .orderBy('feedback.created_at', 'desc');
          
          // Get match details
          const match = await db('matches')
            .select(
              'matches.*',
              'papers.title as paper_title',
              'a1.name as agent1_name',
              'a2.name as agent2_name',
              'w.name as winner_name'
            )
            .leftJoin('papers', 'matches.paper_id', 'papers.id')
            .leftJoin('agents as a1', 'matches.agent1_id', 'a1.id')
            .leftJoin('agents as a2', 'matches.agent2_id', 'a2.id')
            .leftJoin('agents as w', 'matches.winner_id', 'w.id')
            .where('matches.id', matchId)
            .first();
            
          if (!match) {
            return h.response({ message: 'Match not found' }).code(404);
          }
          
          // Calculate average ratings by type
          const averageRatings = await db('feedback')
            .where('match_id', matchId)
            .select('feedback_type')
            .avg('rating as average_rating')
            .count('* as count')
            .groupBy('feedback_type');
          
          return {
            match,
            feedback,
            average_ratings: averageRatings
          };
        } catch (error) {
          //logger.error('Error fetching match feedback:', error);
          throw error;
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v2/feedback/agent/{agentId}',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'feedback'],
      description: 'Get feedback for a specific agent',
      validate: {
        params: Joi.object({
          agentId: Joi.number().integer().required()
        }),
        query: Joi.object({
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          feedbackType: Joi.string().valid('quality', 'accuracy', 'relevance', 'other').optional()
        })
      },
      handler: async (request, h) => {
        try {
          const { agentId } = request.params;
          const { page, limit, feedbackType } = request.query;
          const offset = (page - 1) * limit;
          
          // Verify agent exists
          const agent = await db('agents')
            .where('id', agentId)
            .first();
            
          if (!agent) {
            return h.response({ message: 'Agent not found' }).code(404);
          }
          
          // Build feedback query
          let query = db('feedback')
            .select(
              'feedback.*',
              'matches.paper_id',
              'papers.title as paper_title',
              'matches.agent1_id',
              'matches.agent2_id',
              'a1.name as agent1_name',
              'a2.name as agent2_name'
            )
            .leftJoin('matches', 'feedback.match_id', 'matches.id')
            .leftJoin('papers', 'matches.paper_id', 'papers.id')
            .leftJoin('agents as a1', 'matches.agent1_id', 'a1.id')
            .leftJoin('agents as a2', 'matches.agent2_id', 'a2.id')
            .where('feedback.agent_id', agentId);
          
          // Apply feedback type filter if provided
          if (feedbackType) {
            query = query.where('feedback.feedback_type', feedbackType);
          }
          
          // Get total count
          const totalCount = await query.clone().count('* as count').first();
          
          // Get paginated feedback
          const feedback = await query
            .orderBy('feedback.created_at', 'desc')
            .limit(limit)
            .offset(offset);
          
          // Calculate average ratings by type
          const averageRatings = await db('feedback')
            .where('agent_id', agentId)
            .select('feedback_type')
            .avg('rating as average_rating')
            .count('* as count')
            .groupBy('feedback_type');
          
          return {
            agent,
            feedback,
            average_ratings: averageRatings,
            pagination: {
              page,
              limit,
              total: parseInt(totalCount.count),
              total_pages: Math.ceil(parseInt(totalCount.count) / limit)
            }
          };
        } catch (error) {
          //logger.error('Error fetching agent feedback:', error);
          throw error;
        }
      }
    }
  }
]; 