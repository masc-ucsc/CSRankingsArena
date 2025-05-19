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
    // Convert year to string for path.join
    const yearStr = String(year);
    
    // Try to read from actual data directory first
    const dataPath = path.join(__dirname, "../../../../papers", category, subcategory, yearStr, `${category}-${subcategory}-${yearStr}-matches.yaml`);
    const mockPath = path.join(__dirname, "../../../mock/papers", category, subcategory, yearStr, `${category}-${subcategory}-${yearStr}-matches.yaml`);
    
    try {
        // Try to read from actual data directory first
        console.log(`dataPathExists : ${dataPath}`, fs.existsSync(dataPath)); 
        if (fs.existsSync(dataPath)) {
            const yamlData = yaml.load(fs.readFileSync(dataPath, "utf8"));
            return yamlData.matches || [];
        }


        
        // If actual data doesn't exist, try mock data
        if (fs.existsSync(mockPath)) {
            console.log(`Using mock data for ${category}/${subcategory}/${yearStr} matches`);
            const yamlData = yaml.load(fs.readFileSync(mockPath, "utf8"));
            return yamlData.matches || [];
        }
        
        throw Boom.notFound(`No match data found for ${category}/${subcategory}/${yearStr}`);
    } catch (err) {
        if (err.isBoom) {
            throw err;
        }
        console.error("Error reading matches YAML file:", err);
        throw Boom.badImplementation("Error processing match data");
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

        console.log('paperId1', paper1Id, 'paperId2', paper2Id);
        console.log('match', match);

        // Initialize paper stats and matches if not exists

        [paper1Id, paper2Id].forEach(paperId => {
            if (!paperStats.has(paperId)) {
                // Load paper data from YAML
                const parts = match.id.split("-");
                const category = parts[1];
                const subcategory = parts[2];
                const year = parts[3];
                
                // Load papers YAML file
                const papersYamlFile = path.join(__dirname, "../../../../papers", category, subcategory, year, `${category}-${subcategory}-${year}-papers.yaml`);
                let papersYamlData;
                try {
                    papersYamlData = yaml.load(fs.readFileSync(papersYamlFile, "utf8"));
                } catch (err) {
                    console.error("Error reading papers YAML file:", err);
                    throw Boom.notFound("Papers YAML file not found or invalid");
                }

                // Find paper data in YAML
                const paperData = papersYamlData.papers.find(p => p.id === paperId);

                paperStats.set(paperId, {
                    paperId,
                    title: paperData?.title || paperId,
                    authors: paperData?.authors || [],
                    venue: paperData?.venue || '',
                    url: paperData?.url || '',
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
        const createMatchDetails = (currentPaperId, opponentPaperId, currentScore, opponentScore) => {
            // Load paper data from YAML for opponent
            const parts = match.id.split("-");
            const category = parts[1];
            const subcategory = parts[2];
            const year = parts[3];
            
            // Load papers YAML file
            const papersYamlFile = path.join(__dirname, "../../../../papers", category, subcategory, year, `${category}-${subcategory}-${year}-papers.yaml`);
            let papersYamlData;
            try {
                papersYamlData = yaml.load(fs.readFileSync(papersYamlFile, "utf8"));
            } catch (err) {
                console.error("Error reading papers YAML file:", err);
                throw Boom.notFound("Papers YAML file not found or invalid");
            }

            // Find opponent paper data in YAML
            const opponentPaperData = papersYamlData.papers.find(p => p.id === opponentPaperId);

            return {
                matchId: match.id,
                opponent: {
                    paperId: opponentPaperId,
                    title: opponentPaperData?.title || opponentPaperId,
                    url: opponentPaperData?.url || '',
                    score: opponentScore
                },
                score: currentScore,
                result: winner === currentPaperId ? 'win' : winner === opponentPaperId ? 'loss' : 'draw',
                date: match.createdAt,
                reviews: match.reviews.map(review => ({
                    reviewer: review.reviewer,
                    metrics: review.metrics,
                    analysis: review.analysis
                })),
                comparison: match.comparison
            };
        };

        // Add match details for both papers
        paperMatches.get(paper1Id).push(createMatchDetails(paper1Id, paper2Id, paper1Score, paper2Score));
        paperMatches.get(paper2Id).push(createMatchDetails(paper2Id, paper1Id, paper2Score, paper1Score));
    });
    console.log('paperMatches', paperStats);
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
          
          // Check if we're using mock data
          const yearStr = String(year);
          const isMockData = !fs.existsSync(path.join(__dirname, "../../../../papers", category, subcategory, yearStr, `${category}-${subcategory}-${yearStr}-matches.yaml`));
          console.log('isMockData', category, subcategory, yearStr, isMockData);
          return {
            rankings: processedRankings,
            total: rankings.length,
            category,
            subcategory,
            year,
            isMockData // Add flag to indicate if mock data is being used
          };
        } catch (error) {
          if (error.isBoom) {
            throw error;
          }
          console.error('Error fetching leaderboard:', error);
          throw Boom.badImplementation('Error processing leaderboard data');
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