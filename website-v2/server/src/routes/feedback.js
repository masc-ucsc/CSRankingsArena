const Joi = require('@hapi/joi');
const db = require('../config/db');
const websocketService = require('../services/websocketService');
//const logger = require('../utils/logger');

module.exports = [
  {
    method: 'GET',
    path: '/api/feedback/{matchId}',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'feedback'],
      description: 'Get feedback for a match',
      validate: {
        params: Joi.object({
          matchId: Joi.string().guid().required()
        })
      },
      handler: async (request, h) => {
        try {
          const { matchId } = request.params;
          
          // Check if match exists
          const match = await db('matches').where('id', matchId).first();
          
          if (!match) {
            return h.response({ message: 'Match not found' }).code(404);
          }
          
          // Get feedback for the match
          const feedback = await db('feedback')
            .select(
              'feedback.*',
              'users.username as username'
            )
            .leftJoin('users', 'feedback.user_id', 'users.id')
            .where('feedback.match_id', matchId)
            .orderBy('feedback.created_at', 'desc');
            
          // Format feedback
          const formattedFeedback = feedback.map(item => ({
            ...item,
            user: item.user_id ? {
              id: item.user_id,
              username: item.username
            } : null
          }));
          
          // Remove duplicate fields
          formattedFeedback.forEach(item => {
            delete item.username;
          });
          
          return { feedback: formattedFeedback };
        } catch (error) {
          //logger.error(`Error fetching feedback for match ${request.params.matchId}:`, error);
          throw error;
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/feedback',
    options: {
      // auth: 'jwt',
      tags: ['api', 'feedback'],
      description: 'Add feedback for a match',
      validate: {
        payload: Joi.object({
          matchId: Joi.string().required(),
          agentId: Joi.string().required(),
          rating: Joi.number().min(1).max(5).required(),
          comment: Joi.string().allow('').optional(),
          liked: Joi.boolean().optional()
        })
      },
      handler: async (request, h) => {
        const { matchId, agentId, rating, comment, liked } = request.payload;
        const userId = request.auth.credentials.id;

        try {
          const feedback = await db('feedback')
            .insert({
              match_id: matchId,
              agent_id: agentId,
              user_id: userId,
              rating,
              comment,
              liked,
              likes: 0,
              created_at: new Date()
            })
            .returning('*')
            .first();

          // Get user and agent info for the response
          const [user, agent] = await Promise.all([
            db('users').where('id', userId).first(),
            db('agents').where('id', agentId).first()
          ]);

          const feedbackWithDetails = {
            ...feedback,
            user: {
              id: user.id,
              username: user.username
            },
            agent: {
              id: agent.id,
              name: agent.name
            }
          };

          // Broadcast the new feedback via WebSocket
          await websocketService.handleNewFeedback(matchId, feedbackWithDetails);

          return h.response(feedbackWithDetails).code(201);
        } catch (error) {
          //logger.error('Error adding feedback:', error);
          return h.response({ error: 'Failed to add feedback' }).code(500);
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/feedback/{feedbackId}/like',
    options: {
      // auth: 'jwt',
      tags: ['api', 'feedback'],
      description: 'Like a feedback comment',
      validate: {
        params: Joi.object({
          feedbackId: Joi.string().required()
        }),
        payload: Joi.object({
          matchId: Joi.string().required(),
          liked: Joi.boolean().required()
        })
      },
      handler: async (request, h) => {
        const { feedbackId } = request.params;
        const { matchId, liked } = request.payload;

        try {
          // Update likes count and broadcast via WebSocket
          await websocketService.handleFeedbackLike(matchId, feedbackId, liked);
          return h.response({ success: true }).code(200);
        } catch (error) {
          //logger.error(`Error updating feedback like: ${request.params.feedbackId}:`, error);
          return h.response({ error: 'Failed to update feedback like' }).code(500);
        }
      }
    }
  }
];