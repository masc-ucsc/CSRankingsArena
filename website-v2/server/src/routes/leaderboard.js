const db = require('../config/db');
//const logger = require('../utils/logger');
const Joi = require('@hapi/joi');

module.exports = [
  {
    method: 'GET',
    path: '/api/leaderboard',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'leaderboard'],
      description: 'Get agent leaderboard',
      handler: async (request, h) => {
        try {
          const leaderboard = await db('agents')
            .select('*')
            .orderBy('points', 'desc')
            .orderBy('matches_won', 'desc');
            
          // Add win percentage
          const formattedLeaderboard = leaderboard.map(agent => {
            const winPercentage = agent.matches_played > 0
              ? (agent.matches_won / agent.matches_played) * 100
              : 0;
              
            return {
              ...agent,
              win_percentage: parseFloat(winPercentage.toFixed(2))
            };
          });
          
          return { leaderboard: formattedLeaderboard };
        } catch (error) {
          //logger.error('Error fetching leaderboard:', error);
          throw error;
        }
      }
    }
  }
];