'use strict';

const Joi = require('@hapi/joi');
const { db } = require('../../config/db');
//const logger = require('../utils/logger');

module.exports = [
  {
    method: 'GET',
    path: '/api/v2/agents',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'agents'],
      description: 'Get all agents',
      handler: async (request, h) => {
        try {
          const agents = await db('agents')
            .select('*')
            .orderBy('points', 'desc')
            .orderBy('matches_won', 'desc');
            
          return { agents };
        } catch (error) {
          ////logger.error('Error fetching agents:', error);
          throw error;
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v2/agents/{id}',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'agents'],
      description: 'Get agent by ID',
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        })
      },
      handler: async (request, h) => {
        try {
          const agent = await db('agents')
            .where('id', request.params.id)
            .first();
            
          if (!agent) {
            return h.response({ message: 'Agent not found' }).code(404);
          }
          
          return { agent };
        } catch (error) {
          //logger.error(`Error fetching agent ${request.params.id}:`, error);
          throw error;
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v2/agents/{id}/matches',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'agents'],
      description: 'Get matches for an agent',
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        }),
        query: Joi.object({
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          status: Joi.string().valid('pending', 'completed', 'error').optional()
        })
      },
      handler: async (request, h) => {
        try {
          const { id } = request.params;
          const { page, limit, status } = request.query;
          const offset = (page - 1) * limit;
          
          // Verify agent exists
          const agent = await db('agents').where('id', id).first();
          
          if (!agent) {
            return h.response({ message: 'Agent not found' }).code(404);
          }
          
          // Get matches where agent is agent1 or agent2
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
            .leftJoin('agents as w', 'matches.winner_id', 'w.id')
            .where(function() {
              this.where('matches.agent1_id', id).orWhere('matches.agent2_id', id);
            })
            .orderBy('matches.created_at', 'desc');
          
          // Apply status filter if provided
          if (status) {
            matchesQuery.where('matches.status', status);
          }
          
          // Get total count
          const countQuery = db('matches')
            .count('* as count')
            .where(function() {
              this.where('agent1_id', id).orWhere('agent2_id', id);
            });
          
          // Apply same status filter to count query
          if (status) {
            countQuery.where('status', status);
          }
          
          // Execute both queries
          const [matches, countResult] = await Promise.all([
            matchesQuery.limit(limit).offset(offset),
            countQuery.first()
          ]);
          
          const totalMatches = parseInt(countResult.count);
          const totalPages = Math.ceil(totalMatches / limit);
          
          // Get agent stats
          const stats = {
            total: totalMatches,
            wins: await db('matches')
              .count('* as count')
              .where('winner_id', id)
              .first()
              .then(result => parseInt(result.count)),
            draws: await db('matches')
              .count('* as count')
              .where(function() {
                this.where('status', 'completed')
                  .whereNull('winner_id')
                  .where(function() {
                    this.where('agent1_id', id).orWhere('agent2_id', id);
                  });
              })
              .first()
              .then(result => parseInt(result.count))
          };
          
          stats.losses = agent.matches_played - stats.wins - stats.draws;
          
          return {
            agent,
            matches,
            stats,
            pagination: {
              page,
              limit,
              total: totalMatches,
              totalPages
            }
          };
        } catch (error) {
          //logger.error(`Error fetching matches for agent ${request.params.id}:`, error);
          throw error;
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v2/agents/stats',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'agents'],
      description: 'Get agent comparison statistics',
      validate: {
        query: Joi.object({
          agents: Joi.string().required().description('Comma-separated list of agent IDs')
        })
      },
      handler: async (request, h) => {
        try {
          const agentIds = request.query.agents.split(',').map(id => parseInt(id.trim()));
          
          if (agentIds.length < 2) {
            return h.response({ message: 'At least two agents are required for comparison' }).code(400);
          }
          
          // Get agents
          const agents = await db('agents')
            .select('*')
            .whereIn('id', agentIds);
            
          if (agents.length !== agentIds.length) {
            return h.response({ message: 'One or more agents not found' }).code(404);
          }
          
          // Get head-to-head stats
          const headToHead = await Promise.all(agentIds.map(async (id1) => {
            const stats = await Promise.all(agentIds.map(async (id2) => {
              if (id1 === id2) return null;
              
              const matches = await db('matches')
                .where(function() {
                  this.where(function() {
                    this.where('agent1_id', id1).where('agent2_id', id2);
                  }).orWhere(function() {
                    this.where('agent1_id', id2).where('agent2_id', id1);
                  });
                })
                .where('status', 'completed');
                
              const wins = matches.filter(m => m.winner_id === id1).length;
              const losses = matches.filter(m => m.winner_id === id2).length;
              const draws = matches.filter(m => m.winner_id === null).length;
              
              return {
                opponent: id2,
                matches: matches.length,
                wins,
                losses,
                draws
              };
            }));
            
            return {
              agent: id1,
              stats: stats.filter(Boolean)
            };
          }));
          
          return {
            agents,
            headToHead
          };
        } catch (error) {
          //logger.error('Error fetching agent stats:', error);
          throw error;
        }
      }
    }
  }
]; 