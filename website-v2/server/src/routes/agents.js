// src/routes/agents.js
'use strict';

const Joi = require('joi');
const { db } = require('../../../server/src/config/db');
//const logger = require('../utils/logger');

module.exports = [
  {
    method: 'GET',
    path: '/api/agents',
    options: {
      auth: { mode: 'try' },
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
    path: '/api/agents/{id}',
    options: {
      auth: { mode: 'try' },
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
    path: '/api/agents/{id}/matches',
    options: {
      auth: { mode: 'try' },
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
    path: '/api/agents/stats',
    options: {
      auth: { mode: 'try' },
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
          
          // Get head-to-head stats for each pair of agents
          const headToHead = [];
          
          for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
              const agent1 = agents[i];
              const agent2 = agents[j];
              
              // Matches where agent1 won against agent2
              const agent1Wins = await db('matches')
                .count('* as count')
                .where(function() {
                  this.where('agent1_id', agent1.id)
                    .where('agent2_id', agent2.id)
                    .where('winner_id', agent1.id);
                })
                .orWhere(function() {
                  this.where('agent1_id', agent2.id)
                    .where('agent2_id', agent1.id)
                    .where('winner_id', agent1.id);
                })
                .first()
                .then(result => parseInt(result.count));
              
              // Matches where agent2 won against agent1
              const agent2Wins = await db('matches')
                .count('* as count')
                .where(function() {
                  this.where('agent1_id', agent1.id)
                    .where('agent2_id', agent2.id)
                    .where('winner_id', agent2.id);
                })
                .orWhere(function() {
                  this.where('agent1_id', agent2.id)
                    .where('agent2_id', agent1.id)
                    .where('winner_id', agent2.id);
                })
                .first()
                .then(result => parseInt(result.count));
              
              // Matches that ended in a draw
              const draws = await db('matches')
                .count('* as count')
                .where(function() {
                  this.where('status', 'completed')
                    .whereNull('winner_id')
                    .where(function() {
                      this.where(function() {
                        this.where('agent1_id', agent1.id)
                          .where('agent2_id', agent2.id);
                      })
                      .orWhere(function() {
                        this.where('agent1_id', agent2.id)
                          .where('agent2_id', agent1.id);
                      });
                    });
                })
                .first()
                .then(result => parseInt(result.count));
              
              headToHead.push({
                agent1: {
                  id: agent1.id,
                  name: agent1.name
                },
                agent2: {
                  id: agent2.id,
                  name: agent2.name
                },
                agent1_wins: agent1Wins,
                agent2_wins: agent2Wins,
                draws: draws,
                total: agent1Wins + agent2Wins + draws
              });
            }
          }
          
          // Get average scores per criterion for each agent
          const criteriaScores = {};
          
          for (const agent of agents) {
            // Get scores when agent was agent1
            const agent1Scores = await db('evaluations')
              .select(
                db.raw('AVG(technical_correctness_1) as technical_correctness'),
                db.raw('AVG(depth_of_analysis_1) as depth_of_analysis'),
                db.raw('AVG(constructive_feedback_1) as constructive_feedback'),
                db.raw('AVG(clarity_1) as clarity'),
                db.raw('AVG(fairness_1) as fairness')
              )
              .join('reviews as r1', 'evaluations.review1_id', 'r1.id')
              .where('r1.agent_id', agent.id)
              .first();
            
            // Get scores when agent was agent2
            const agent2Scores = await db('evaluations')
              .select(
                db.raw('AVG(technical_correctness_2) as technical_correctness'),
                db.raw('AVG(depth_of_analysis_2) as depth_of_analysis'),
                db.raw('AVG(constructive_feedback_2) as constructive_feedback'),
                db.raw('AVG(clarity_2) as clarity'),
                db.raw('AVG(fairness_2) as fairness')
              )
              .join('reviews as r2', 'evaluations.review2_id', 'r2.id')
              .where('r2.agent_id', agent.id)
              .first();
            
            // Calculate weighted average of both sets of scores
            const reviewCount1 = await db('reviews')
              .count('* as count')
              .where('agent_id', agent.id)
              .first()
              .then(result => parseInt(result.count));
            
            const criteria = [
              'technical_correctness',
              'depth_of_analysis',
              'constructive_feedback',
              'clarity',
              'fairness'
            ];
            
            const averageScores = {};
            
            for (const criterion of criteria) {
              // Convert from string to float
              const score1 = parseFloat(agent1Scores[criterion] || 0);
              const score2 = parseFloat(agent2Scores[criterion] || 0);
              
              // Calculate average, handling case where there are no reviews
              if (reviewCount1 > 0) {
                averageScores[criterion] = parseFloat(((score1 + score2) / 2).toFixed(2));
              } else {
                averageScores[criterion] = 0;
              }
            }
            
            criteriaScores[agent.id] = averageScores;
          }
          
          return {
            agents,
            headToHead,
            criteriaScores
          };
        } catch (error) {
          //logger.error('Error fetching agent comparison stats:', error);
          throw error;
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/agents/{id}/performance',
    options: {
      auth: { mode: 'try' },
      tags: ['api', 'agents'],
      description: 'Get detailed performance metrics for an agent',
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        })
      },
      handler: async (request, h) => {
        try {
          const { id } = request.params;
          
          // Verify agent exists
          const agent = await db('agents').where('id', id).first();
          
          if (!agent) {
            return h.response({ message: 'Agent not found' }).code(404);
          }
          
          // Get performance by topic
          const topicPerformance = await db('matches')
            .select(
              'papers.main_topic as topic',
              db.raw('COUNT(*) as total'),
              db.raw('SUM(CASE WHEN matches.winner_id = ? THEN 1 ELSE 0 END) as wins', [id]),
              db.raw('SUM(CASE WHEN matches.status = \'completed\' AND matches.winner_id IS NULL THEN 1 ELSE 0 END) as draws'),
              db.raw('SUM(CASE WHEN matches.status = \'completed\' AND matches.winner_id IS NOT NULL AND matches.winner_id != ? THEN 1 ELSE 0 END) as losses', [id])
            )
            .leftJoin('papers', 'matches.paper_id', 'papers.id')
            .where(function() {
              this.where('matches.agent1_id', id).orWhere('matches.agent2_id', id);
            })
            .where('matches.status', 'completed')
            .groupBy('papers.main_topic');
          
          // Calculate win rates
          const performanceByTopic = topicPerformance.map(topic => ({
            topic: topic.topic,
            total: parseInt(topic.total),
            wins: parseInt(topic.wins),
            draws: parseInt(topic.draws),
            losses: parseInt(topic.losses),
            win_rate: topic.total > 0 ? parseFloat(((topic.wins / topic.total) * 100).toFixed(2)) : 0
          }));
          
          // Get average review metrics
          const reviewMetrics = await db('reviews')
            .select(
              db.raw('AVG(rating) as avg_rating'),
              db.raw('COUNT(DISTINCT match_id) as review_count')
            )
            .where('agent_id', id)
            .first();
          
          // Get average evaluation scores
          const evaluation1Metrics = await db('evaluations')
            .select(
              db.raw('AVG(technical_correctness_1) as technical_correctness'),
              db.raw('AVG(depth_of_analysis_1) as depth_of_analysis'),
              db.raw('AVG(constructive_feedback_1) as constructive_feedback'),
              db.raw('AVG(clarity_1) as clarity'),
              db.raw('AVG(fairness_1) as fairness')
            )
            .join('reviews as r1', 'evaluations.review1_id', 'r1.id')
            .where('r1.agent_id', id)
            .first();
          
          const evaluation2Metrics = await db('evaluations')
            .select(
              db.raw('AVG(technical_correctness_2) as technical_correctness'),
              db.raw('AVG(depth_of_analysis_2) as depth_of_analysis'),
              db.raw('AVG(constructive_feedback_2) as constructive_feedback'),
              db.raw('AVG(clarity_2) as clarity'),
              db.raw('AVG(fairness_2) as fairness')
            )
            .join('reviews as r2', 'evaluations.review2_id', 'r2.id')
            .where('r2.agent_id', id)
            .first();
          
          // Combine evaluation metrics (average of both positions)
          const evaluationMetrics = {
            technical_correctness: (parseFloat(evaluation1Metrics.technical_correctness || 0) + parseFloat(evaluation2Metrics.technical_correctness || 0)) / 2,
            depth_of_analysis: (parseFloat(evaluation1Metrics.depth_of_analysis || 0) + parseFloat(evaluation2Metrics.depth_of_analysis || 0)) / 2,
            constructive_feedback: (parseFloat(evaluation1Metrics.constructive_feedback || 0) + parseFloat(evaluation2Metrics.constructive_feedback || 0)) / 2,
            clarity: (parseFloat(evaluation1Metrics.clarity || 0) + parseFloat(evaluation2Metrics.clarity || 0)) / 2,
            fairness: (parseFloat(evaluation1Metrics.fairness || 0) + parseFloat(evaluation2Metrics.fairness || 0)) / 2
          };
          
          // Format metrics with 2 decimal places
          Object.keys(evaluationMetrics).forEach(key => {
            evaluationMetrics[key] = parseFloat(evaluationMetrics[key].toFixed(2));
          });
          
          // Get recent match history (last 10 matches)
          const recentMatches = await db('matches')
            .select(
              'matches.id',
              'matches.status',
              'matches.created_at',
              'matches.completed_at',
              'papers.title as paper_title',
              'papers.main_topic as paper_topic',
              'a1.name as agent1_name',
              'a2.name as agent2_name',
              'w.name as winner_name',
              'w.id as winner_id'
            )
            .leftJoin('papers', 'matches.paper_id', 'papers.id')
            .leftJoin('agents as a1', 'matches.agent1_id', 'a1.id')
            .leftJoin('agents as a2', 'matches.agent2_id', 'a2.id')
            .leftJoin('agents as w', 'matches.winner_id', 'w.id')
            .where(function() {
              this.where('matches.agent1_id', id).orWhere('matches.agent2_id', id);
            })
            .orderBy('matches.created_at', 'desc')
            .limit(10);
          
          // Format match results from agent perspective
          const matchHistory = recentMatches.map(match => {
            let result;
            if (match.status !== 'completed') {
              result = match.status;
            } else if (match.winner_id === parseInt(id)) {
              result = 'win';
            } else if (match.winner_id === null) {
              result = 'draw';
            } else {
              result = 'loss';
            }
            
            return {
              id: match.id,
              paper_title: match.paper_title,
              paper_topic: match.paper_topic,
              opponent: match.agent1_id === parseInt(id) ? match.agent2_name : match.agent1_name,
              result,
              date: match.completed_at || match.created_at
            };
          });
          
          return {
            agent,
            performance_by_topic: performanceByTopic,
            review_metrics: {
              average_rating: parseFloat(reviewMetrics.avg_rating || 0).toFixed(2),
              review_count: parseInt(reviewMetrics.review_count || 0)
            },
            evaluation_metrics: evaluationMetrics,
            match_history: matchHistory
          };
        } catch (error) {
          //logger.error(`Error fetching performance for agent ${request.params.id}:`, error);
          throw error;
        }
      }
    }
  }
];