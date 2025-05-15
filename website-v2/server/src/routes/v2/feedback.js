'use strict';

const Joi = require('@hapi/joi');
const { db } = require('../../config/db');
//const logger = require('../utils/logger');

module.exports = [
  {
    method: 'POST',
    path: '/api/v2/feedback',
    options: {
      // auth: { mode: 'required' },
      tags: ['api', 'feedback'],
      description: 'Submit feedback for a match',
      validate: {
        payload: Joi.object({
          matchId: Joi.string().uuid().required(),
          rating: Joi.number().integer().min(1).max(5).required(),
          comment: Joi.string().max(1000).allow('').optional(),
          feedbackType: Joi.string().valid('quality', 'accuracy', 'relevance', 'other').required(),
          agentId: Joi.number().integer().required()
        })
      },
      handler: async (request, h) => {
        try {
          const { matchId, rating, comment, feedbackType, agentId } = request.payload;
          
          // Verify match exists and is completed
          const match = await db('matches')
            .where('id', matchId)
            .where('status', 'completed')
            .first();
            
          if (!match) {
            return h.response({ message: 'Match not found or not completed' }).code(404);
          }
          
          // Verify agent exists and was part of the match
          const agent = await db('agents')
            .where('id', agentId)
            .where(function() {
              this.where('id', match.agent1_id).orWhere('id', match.agent2_id);
            })
            .first();
            
          if (!agent) {
            return h.response({ message: 'Agent not found or not part of this match' }).code(404);
          }
          
          // Check if feedback already exists for this match and agent
          const existingFeedback = await db('feedback')
            .where({
              match_id: matchId,
              agent_id: agentId,
              feedback_type: feedbackType
            })
            .first();
            
          if (existingFeedback) {
            return h.response({ message: 'Feedback already submitted for this match and agent' }).code(400);
          }
          
          // Insert feedback
          const [feedbackId] = await db('feedback').insert({
            match_id: matchId,
            agent_id: agentId,
            rating,
            comment,
            feedback_type: feedbackType,
            created_at: new Date()
          }).returning('id');
          
          // Update agent stats based on feedback
          if (feedbackType === 'quality') {
            await db('agents')
              .where('id', agentId)
              .update({
                quality_rating: db.raw('(quality_rating * quality_rating_count + ?) / (quality_rating_count + 1)', [rating]),
                quality_rating_count: db.raw('quality_rating_count + 1')
              });
          }
          
          return {
            id: feedbackId,
            message: 'Feedback submitted successfully'
          };
        } catch (error) {
          //logger.error('Error submitting feedback:', error);
          throw error;
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