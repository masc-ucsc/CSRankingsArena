const Joi = require('@hapi/joi');
const db = require('../config/db');
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
          match_id: Joi.string().guid().required(),
          vote: Joi.string().valid('agree', 'disagree').optional(),
          comment: Joi.string().min(1).max(1000).optional()
        })
      },
      handler: async (request, h) => {
        try {
          const { match_id, vote, comment } = request.payload;
          const user_id = request.auth.credentials.id;
          
          // Validate that at least vote or comment is provided
          if (!vote && !comment) {
            return h.response({ message: 'Either vote or comment must be provided' }).code(400);
          }
          
          // Check if match exists
          const match = await db('matches').where('id', match_id).first();
          
          if (!match) {
            return h.response({ message: 'Match not found' }).code(404);
          }
          
          // Check if user already submitted feedback with a vote
          if (vote) {
            const existingVote = await db('feedback')
              .where({
                match_id,
                user_id
              })
              .whereNotNull('vote')
              .first();
              
            if (existingVote) {
              // Update existing vote
              await db('feedback')
                .where('id', existingVote.id)
                .update({
                  vote,
                  comment: comment || existingVote.comment,
                  updated_at: new Date()
                });
                
              const updatedFeedback = await db('feedback')
                .where('id', existingVote.id)
                .first();
                
              return { 
                message: 'Feedback updated', 
                feedback: updatedFeedback 
              };
            }
          }
          
          // Create new feedback
          const [feedback] = await db('feedback')
            .insert({
              match_id,
              user_id,
              vote,
              comment,
              created_at: new Date()
            })
            .returning('*');
            
          return { message: 'Feedback added', feedback };
        } catch (error) {
          //logger.error('Error adding feedback:', error);
          return h.response({ 
            message: 'Error adding feedback', 
            error: error.message 
          }).code(500);
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/feedback/{id}/like',
    options: {
      // auth: 'jwt',
      tags: ['api', 'feedback'],
      description: 'Like a feedback comment',
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        })
      },
      handler: async (request, h) => {
        try {
          const { id } = request.params;
          
          // Check if feedback exists
          const feedback = await db('feedback').where('id', id).first();
          
          if (!feedback) {
            return h.response({ message: 'Feedback not found' }).code(404);
          }
          
          // Increment likes
          const [updatedFeedback] = await db('feedback')
            .where('id', id)
            .increment('likes', 1)
            .returning('*');
            
          return { message: 'Feedback liked', feedback: updatedFeedback };
        } catch (error) {
          //logger.error(`Error liking feedback ${request.params.id}:`, error);
          return h.response({ 
            message: 'Error liking feedback', 
            error: error.message 
          }).code(500);
        }
      }
    }
  }
];