'use strict';

const Joi = require('@hapi/joi');
const { db } = require('../../config/db');
const Boom = require('@hapi/boom');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
//const logger = require('../utils/logger');

// Helper function to read matches from YAML file
async function getMatchesFromYaml(category, subcategory, year) {
    const yamlFile = path.join(__dirname, "../../../mock/matches", category, subcategory, `${category}-${subcategory}-${year}-matches.yaml`);
    try {
        const yamlData = yaml.load(fs.readFileSync(yamlFile, "utf8"));
        return yamlData.matches || [];
    } catch (err) {
        console.error("Error reading matches YAML file:", err);
        throw Boom.notFound("Matches YAML file not found or invalid");
    }
}

// Helper function to calculate paper rankings from matches
function calculatePaperRankings(matches) {
    const paperStats = new Map();
    const paperMatches = new Map(); // Store detailed match data for each paper

    // Process each match to build paper statistics
    matches.forEach(match => {
        if (match.status !== 'completed') return;

        const [paper1Id, paper2Id] = match.paperIds;
        const winner = match.comparison.winner;

        // Initialize paper stats and matches if not exists
        [paper1Id, paper2Id].forEach(paperId => {
            if (!paperStats.has(paperId)) {
                paperStats.set(paperId, {
                    paperId,
                    title: match.reviews.find(r => r.paperId === paperId)?.paperTitle || paperId,
                    authors: match.reviews.find(r => r.paperId === paperId)?.paperAuthors || [],
                    venue: match.reviews.find(r => r.paperId === paperId)?.paperVenue || '',
                    matches: 0,
                    wins: 0,
                    score: 0,
                    totalScore: 0
                });
                paperMatches.set(paperId, []); // Initialize empty array for match details
            }
        });

        // Update stats for both papers
        const paper1Stats = paperStats.get(paper1Id);
        const paper2Stats = paperStats.get(paper2Id);

        // Update match counts
        paper1Stats.matches++;
        paper2Stats.matches++;

        // Update scores
        const paper1Score = match.reviews.find(r => r.paperId === paper1Id)?.overallScore || 0;
        const paper2Score = match.reviews.find(r => r.paperId === paper2Id)?.overallScore || 0;
        
        paper1Stats.totalScore += paper1Score;
        paper2Stats.totalScore += paper2Score;

        // Update wins
        if (winner === paper1Id) {
            paper1Stats.wins++;
        } else if (winner === paper2Id) {
            paper2Stats.wins++;
        }

        // Store detailed match data for both papers
        const matchDetails = {
            matchId: match.id,
            opponent: {
                paperId: paper1Id === paperId ? paper2Id : paper1Id,
                title: match.reviews.find(r => r.paperId === (paper1Id === paperId ? paper2Id : paper1Id))?.paperTitle,
                score: paper1Id === paperId ? paper2Score : paper1Score
            },
            score: paper1Id === paperId ? paper1Score : paper2Score,
            result: winner === paperId ? 'win' : winner === (paper1Id === paperId ? paper2Id : paper1Id) ? 'loss' : 'draw',
            date: match.createdAt,
            reviews: match.reviews.map(review => ({
                reviewer: review.reviewer,
                metrics: review.metrics,
                analysis: review.analysis
            })),
            comparison: match.comparison
        };

        paperMatches.get(paper1Id).push({ ...matchDetails, opponent: { ...matchDetails.opponent, paperId: paper2Id } });
        paperMatches.get(paper2Id).push({ ...matchDetails, opponent: { ...matchDetails.opponent, paperId: paper1Id } });
    });

    // Calculate final scores and convert to array
    const rankings = Array.from(paperStats.values()).map(stats => ({
        ...stats,
        score: stats.matches > 0 ? Math.round((stats.totalScore / stats.matches) * 10) / 10 : 0,
        winRate: stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) / 100 : 0,
        matches: paperMatches.get(stats.paperId) // Include detailed match data
    }));

    // Sort by score (descending) and then by win rate (descending)
    return rankings.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.winRate - a.winRate;
    }).map((paper, index) => ({
        ...paper,
        rank: index + 1
    }));
}

module.exports = [
  {
    method: 'GET',
    path: '/api/v2/leaderboard',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'leaderboard'],
      description: 'Get the paper rankings leaderboard with detailed match data',
      validate: {
        query: Joi.object({
          category: Joi.string().required(),
          subcategory: Joi.string().required(),
          year: Joi.number().integer().required(),
          limit: Joi.number().integer().min(1).max(100).default(10),
          includeMatches: Joi.boolean().default(true)
        })
      },
      handler: async (request, h) => {
        try {
          const { category, subcategory, year, limit, includeMatches } = request.query;
          
          // Get matches from YAML file
          const matches = await getMatchesFromYaml(category, subcategory, year);
          
          // Calculate rankings with detailed match data
          const rankings = calculatePaperRankings(matches);
          
          // Apply limit
          const limitedRankings = rankings.slice(0, limit);

          // If includeMatches is false, remove detailed match data
          const processedRankings = includeMatches 
              ? limitedRankings 
              : limitedRankings.map(({ matches, ...rest }) => rest);
          
          return {
            rankings: processedRankings,
            total: rankings.length,
            category,
            subcategory,
            year
          };
        } catch (error) {
          //logger.error('Error fetching leaderboard:', error);
          throw error;
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v2/leaderboard/stats',
    options: {
      // auth: { mode: 'try' },
      tags: ['api', 'leaderboard'],
      description: 'Get leaderboard statistics',
      handler: async (request, h) => {
        try {
          // Get total number of active agents
          const totalAgents = await db('agents')
            .where('is_active', true)
            .count('* as count')
            .first();
          
          // Get total number of completed matches
          const totalMatches = await db('matches')
            .where('status', 'completed')
            .count('* as count')
            .first();
          
          // Get category distribution
          const categoryStats = await db('agents')
            .where('is_active', true)
            .select('category')
            .count('* as count')
            .groupBy('category');
          
          // Get top performing agents by win rate
          const topWinRate = await db('agents')
            .select('*')
            .where('is_active', true)
            .where('matches_played', '>', 0)
            .orderBy(db.raw('matches_won::float / matches_played::float'), 'desc')
            .limit(5);
          
          // Get most active agents
          const mostActive = await db('agents')
            .select('*')
            .where('is_active', true)
            .orderBy('matches_played', 'desc')
            .limit(5);
          
          return {
            total_agents: parseInt(totalAgents.count),
            total_matches: parseInt(totalMatches.count),
            category_distribution: categoryStats,
            top_by_win_rate: topWinRate,
            most_active: mostActive
          };
        } catch (error) {
          //logger.error('Error fetching leaderboard stats:', error);
          throw error;
        }
      }
    }
  }
]; 