const Joi = require('@hapi/joi');
const db = require('../config/db');

const CompetitionManager = require('../../agents/src/competiton/competition-manager');

module.exports = [
  {
    method: 'GET',
    path: '/api/matches',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'matches'],
      description: 'Get all matches with pagination and filtering',
      validate: {
        query: Joi.object({
          status: Joi.string().valid('pending', 'completed', 'error'),
          agent: Joi.number().integer(),
          paper: Joi.number().integer(),
          topic: Joi.string(),
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10)
        })
      },
      handler: async (request, h) => {
        try {
          const { status, agent, paper, topic, page, limit } = request.query;
          const offset = (page - 1) * limit;
          
          // Build query
          const matchesQuery = db('matches')
            .select(
              'matches.*',
              'papers.title as paper_title',
              'papers.authors as paper_authors',
              'papers.main_topic as paper_topic',
              'a1.name as agent1_name',
              'a2.name as agent2_name',
              'w.name as winner_name'
            )
            .leftJoin('papers', 'matches.paper_id', 'papers.id')
            .leftJoin('agents as a1', 'matches.agent1_id', 'a1.id')
            .leftJoin('agents as a2', 'matches.agent2_id', 'a2.id')
            .leftJoin('agents as w', 'matches.winner_id', 'w.id');
          
          // Apply filters
          if (status) {
            matchesQuery.where('matches.status', status);
          }
          
          if (agent) {
            matchesQuery.where(function() {
              this.where('matches.agent1_id', agent).orWhere('matches.agent2_id', agent);
            });
          }
          
          if (paper) {
            matchesQuery.where('matches.paper_id', paper);
          }
          
          if (topic) {
            matchesQuery.where('papers.main_topic', topic);
          }
          
          // Order by created_at
          matchesQuery.orderBy('matches.created_at', 'desc');
          
          // Get total count with same filters
          const countQuery = db('matches')
            .count('* as count')
            .leftJoin('papers', 'matches.paper_id', 'papers.id');
          
          // Apply same filters to count query
          if (status) {
            countQuery.where('matches.status', status);
          }
          
          if (agent) {
            countQuery.where(function() {
              this.where('matches.agent1_id', agent).orWhere('matches.agent2_id', agent);
            });
          }
          
          if (paper) {
            countQuery.where('matches.paper_id', paper);
          }
          
          if (topic) {
            countQuery.where('papers.main_topic', topic);
          }
          
          // Execute both queries
          const [matches, countResult] = await Promise.all([
            matchesQuery.limit(limit).offset(offset),
            countQuery.first()
          ]);
          
          const totalMatches = parseInt(countResult.count);
          const totalPages = Math.ceil(totalMatches / limit);
          
          return {
            matches,
            pagination: {
              page,
              limit,
              total: totalMatches,
              totalPages
            }
          };
        } catch (error) {
          //logger.error('Error fetching matches:', error);
          throw error;
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/matches/{id}',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'matches'],
      description: 'Get match by ID',
      validate: {
        params: Joi.object({
          id: Joi.string().guid().required()
        })
      },
      handler: async (request, h) => {
        try {
          // Get match with related data
          const match = await db('matches')
            .select(
              'matches.*',
              'papers.title as paper_title',
              'papers.abstract as paper_abstract',
              'papers.authors as paper_authors',
              'papers.main_topic as paper_topic',
              'papers.pdf_url as paper_pdf_url',
              'a1.name as agent1_name',
              'a1.model as agent1_model',
              'a1.provider as agent1_provider',
              'a2.name as agent2_name',
              'a2.model as agent2_model',
              'a2.provider as agent2_provider',
              'w.name as winner_name'
            )
            .leftJoin('papers', 'matches.paper_id', 'papers.id')
            .leftJoin('agents as a1', 'matches.agent1_id', 'a1.id')
            .leftJoin('agents as a2', 'matches.agent2_id', 'a2.id')
            .leftJoin('agents as w', 'matches.winner_id', 'w.id')
            .where('matches.id', request.params.id)
            .first();
            
          if (!match) {
            return h.response({ message: 'Match not found' }).code(404);
          }
          
          // Restructure response
          const response = {
            ...match,
            paper: {
              id: match.paper_id,
              title: match.paper_title,
              abstract: match.paper_abstract,
              authors: match.paper_authors,
              main_topic: match.paper_topic,
              pdf_url: match.paper_pdf_url
            },
            agent1: {
              id: match.agent1_id,
              name: match.agent1_name,
              model: match.agent1_model,
              provider: match.agent1_provider
            },
            agent2: {
              id: match.agent2_id,
              name: match.agent2_name,
              model: match.agent2_model,
              provider: match.agent2_provider
            },
            winner: match.winner_id ? {
              id: match.winner_id,
              name: match.winner_name
            } : null
          };
          
          // Remove duplicate fields
          delete response.paper_id;
          delete response.paper_title;
          delete response.paper_abstract;
          delete response.paper_authors;
          delete response.paper_topic;
          delete response.paper_pdf_url;
          delete response.agent1_id;
          delete response.agent1_name;
          delete response.agent1_model;
          delete response.agent1_provider;
          delete response.agent2_id;
          delete response.agent2_name;
          delete response.agent2_model;
          delete response.agent2_provider;
          delete response.winner_id;
          delete response.winner_name;
          
          return { match: response };
        } catch (error) {
          //logger.error(`Error fetching match ${request.params.id}:`, error);
          throw error;
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/matches/{id}/reviews',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'matches'],
      description: 'Get reviews for a match',
      validate: {
        params: Joi.object({
          id: Joi.string().guid().required()
        })
      },
      handler: async (request, h) => {
        try {
          const { id } = request.params;
          
          // Check if match exists
          const match = await db('matches').where('id', id).first();
          
          if (!match) {
            return h.response({ message: 'Match not found' }).code(404);
          }
          
          // Get reviews for the match
          const reviews = await db('reviews')
            .select(
              'reviews.*',
              'agents.name as agent_name',
              'agents.model as agent_model',
              'agents.provider as agent_provider'
            )
            .leftJoin('agents', 'reviews.agent_id', 'agents.id')
            .where('reviews.match_id', id);
            
          // Parse JSON fields
          const formattedReviews = reviews.map(review => ({
            ...review,
            strengths: JSON.parse(review.strengths),
            weaknesses: JSON.parse(review.weaknesses),
            questions: JSON.parse(review.questions),
            agent: {
              id: review.agent_id,
              name: review.agent_name,
              model: review.agent_model,
              provider: review.agent_provider
            }
          }));
          
          // Remove duplicate fields
          formattedReviews.forEach(review => {
            delete review.agent_id;
            delete review.agent_name;
            delete review.agent_model;
            delete review.agent_provider;
          });
          
          return { reviews: formattedReviews };
        } catch (error) {
          //logger.error(`Error fetching reviews for match ${request.params.id}:`, error);
          throw error;
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/matches/{id}/evaluation',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'matches'],
      description: 'Get evaluation for a match',
      validate: {
        params: Joi.object({
          id: Joi.string().guid().required()
        })
      },
      handler: async (request, h) => {
        try {
          const { id } = request.params;
          
          // Check if match exists
          const match = await db('matches').where('id', id).first();
          
          if (!match) {
            return h.response({ message: 'Match not found' }).code(404);
          }
          
          // Get evaluation for the match
          const evaluation = await db('evaluations')
            .select(
              'evaluations.*',
              'a.name as winner_name',
              'r1.agent_id as review1_agent_id',
              'a1.name as review1_agent_name',
              'r2.agent_id as review2_agent_id',
              'a2.name as review2_agent_name'
            )
            .leftJoin('agents as a', 'evaluations.winner_id', 'a.id')
            .leftJoin('reviews as r1', 'evaluations.review1_id', 'r1.id')
            .leftJoin('agents as a1', 'r1.agent_id', 'a1.id')
            .leftJoin('reviews as r2', 'evaluations.review2_id', 'r2.id')
            .leftJoin('agents as a2', 'r2.agent_id', 'a2.id')
            .where('evaluations.match_id', id)
            .first();
            
          if (!evaluation) {
            return h.response({ message: 'Evaluation not found' }).code(404);
          }
          
          // Structure scores object
          const scores = {
            technical_correctness: {
              [evaluation.review1_agent_name]: evaluation.technical_correctness_1,
              [evaluation.review2_agent_name]: evaluation.technical_correctness_2
            },
            depth_of_analysis: {
              [evaluation.review1_agent_name]: evaluation.depth_of_analysis_1,
              [evaluation.review2_agent_name]: evaluation.depth_of_analysis_2
            },
            constructive_feedback: {
              [evaluation.review1_agent_name]: evaluation.constructive_feedback_1,
              [evaluation.review2_agent_name]: evaluation.constructive_feedback_2
            },
            clarity: {
              [evaluation.review1_agent_name]: evaluation.clarity_1,
              [evaluation.review2_agent_name]: evaluation.clarity_2
            },
            fairness: {
              [evaluation.review1_agent_name]: evaluation.fairness_1,
              [evaluation.review2_agent_name]: evaluation.fairness_2
            }
          };
          
          // Format response
          const formattedEvaluation = {
            id: evaluation.id,
            match_id: evaluation.match_id,
            review1_id: evaluation.review1_id,
            review2_id: evaluation.review2_id,
            winner: evaluation.winner_id ? {
              id: evaluation.winner_id,
              name: evaluation.winner_name
            } : null,
            reasoning: evaluation.reasoning,
            scores,
            created_at: evaluation.created_at
          };
          
          return { evaluation: formattedEvaluation };
        } catch (error) {
          //logger.error(`Error fetching evaluation for match ${request.params.id}:`, error);
          throw error;
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/matches/run/{id}',
    options: {
      // auth: 'jwt',
      tags: ['api', 'matches'],
      description: 'Run a specific match',
      validate: {
        params: Joi.object({
          id: Joi.string().guid().required()
        })
      },
      handler: async (request, h) => {
        try {
          // Check if user has admin role
          // const user = request.auth.credentials;
          // if (user.role !== 'admin') {
          //   return h.response({ message: 'Insufficient permissions' }).code(403);
          // }
          
          const { id } = request.params;
          
          // Initialize competition manager
          const manager = new CompetitionManager();
          await manager.initialize();
          
          // Run the match
          const result = await manager.runMatch(id);
          
          return { message: 'Match processed successfully', match: result };
        } catch (error) {
          //logger.error(`Error running match ${request.params.id}:`, error);
          return h.response({ 
            message: 'Error running match', 
            error: error.message 
          }).code(500);
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/matches/generate',
    options: {
      // auth: 'jwt',
      tags: ['api', 'matches'],
      description: 'Generate new matches',
      validate: {
        payload: Joi.object({
          topic: Joi.string().optional(),
          limit: Joi.number().integer().min(1).max(100).default(10),
          papersPerAgent: Joi.number().integer().min(1).max(20).default(3)
        })
      },
      handler: async (request, h) => {
        try {
          // Check if user has admin role
          // const user = request.auth.credentials;
          // if (user.role !== 'admin') {
          //   return h.response({ message: 'Insufficient permissions' }).code(403);
          // }
          
          const { topic, limit, papersPerAgent } = request.payload;
          
          // Initialize competition manager
          const manager = new CompetitionManager();
          await manager.initialize();
          
          // Generate matches
          const matches = await manager.generateMatches({
            topic,
            limit,
            papersPerAgent
          });
          
          return { 
            message: `Generated ${matches.length} matches`, 
            matches 
          };
        } catch (error) {
          //logger.error('Error generating matches:', error);
          return h.response({ 
            message: 'Error generating matches', 
            error: error.message 
          }).code(500);
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/matches/run-pending',
    options: {
      //auth: 'jwt',
      tags: ['api', 'matches'],
      description: 'Run pending matches',
      validate: {
        payload: Joi.object({
          limit: Joi.number().integer().min(1).max(20).default(5)
        })
      },
      handler: async (request, h) => {
        try {
          // // Check if user has admin role
          // const user = request.auth.credentials;
          // if (user.role !== 'admin') {
          //   return h.response({ message: 'Insufficient permissions' }).code(403);
          // }
          
          const { limit } = request.payload;
          
          // Initialize competition manager
          const manager = new CompetitionManager();
          await manager.initialize();
          
          // Run pending matches
          const results = await manager.runPendingMatches(limit);
          
          return { 
            message: `Processed ${results.length} matches`, 
            results 
          };
        } catch (error) {
          //logger.error('Error running pending matches:', error);
          return h.response({ 
            message: 'Error running pending matches', 
            error: error.message 
          }).code(500);
        }
      }
    }
  }
];