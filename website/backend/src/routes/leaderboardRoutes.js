/**
 * Leaderboard Routes
 * 
 * API endpoints for leaderboard-related operations.
 */

const express = require('express');
const router = express.Router();
const { Match, Result } = require('../models');

/**
 * GET /api/leaderboard
 * Get the current leaderboard
 */
router.get('/', async (req, res, next) => {
  try {
    // Get all completed matches
    const matchResults = await Result.find().lean();
    
    if (matchResults.length === 0) {
      return res.json([]);
    }
    
    // Calculate agent statistics
    const agentStats = {};
    
    matchResults.forEach(result => {
      // Initialize agent stats if not exists
      if (!agentStats[result.agent1]) {
        agentStats[result.agent1] = {
          name: result.agent1,
          matches_played: 0,
          matches_won: 0,
          matches_drawn: 0,
          matches_lost: 0,
          points: 0,
          total_score: 0
        };
      }
      
      if (!agentStats[result.agent2]) {
        agentStats[result.agent2] = {
          name: result.agent2,
          matches_played: 0,
          matches_won: 0,
          matches_drawn: 0,
          matches_lost: 0,
          points: 0,
          total_score: 0
        };
      }
      
      // Update match counts
      agentStats[result.agent1].matches_played++;
      agentStats[result.agent2].matches_played++;
      
      // Update win/loss/draw counts
      if (result.result === 'win_agent1') {
        agentStats[result.agent1].matches_won++;
        agentStats[result.agent1].points += 3;
        agentStats[result.agent2].matches_lost++;
      } else if (result.result === 'win_agent2') {
        agentStats[result.agent2].matches_won++;
        agentStats[result.agent2].points += 3;
        agentStats[result.agent1].matches_lost++;
      } else { // Draw
        agentStats[result.agent1].matches_drawn++;
        agentStats[result.agent2].matches_drawn++;
        agentStats[result.agent1].points += 1;
        agentStats[result.agent2].points += 1;
      }
      
      // Add evaluation scores if available
      if (result.evaluation?.total_scores) {
        agentStats[result.agent1].total_score += result.evaluation.total_scores.agent1 || 0;
        agentStats[result.agent2].total_score += result.evaluation.total_scores.agent2 || 0;
      }
    });
    
    // Calculate win percentages and average scores
    Object.values(agentStats).forEach(agent => {
      agent.win_percentage = agent.matches_played > 0
        ? (agent.matches_won / agent.matches_played) * 100
        : 0;
      
      agent.avg_score = agent.matches_played > 0
        ? agent.total_score / agent.matches_played
        : 0;
      
      // Round to 2 decimal places
      agent.win_percentage = Math.round(agent.win_percentage * 100) / 100;
      agent.avg_score = Math.round(agent.avg_score * 100) / 100;
    });
    
    // Convert to array and sort by points (descending)
    const leaderboard = Object.values(agentStats)
      .sort((a, b) => {
        // Sort by points first
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        // If points are equal, sort by win percentage
        if (b.win_percentage !== a.win_percentage) {
          return b.win_percentage - a.win_percentage;
        }
        // If win percentage is equal, sort by average score
        return b.avg_score - a.avg_score;
      });
    
    // Add rank
    leaderboard.forEach((agent, index) => {
      agent.rank = index + 1;
    });
    
    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/leaderboard/topic/:topic
 * Get leaderboard for a specific topic
 */
router.get('/topic/:topic', async (req, res, next) => {
  try {
    const topic = req.params.topic;
    
    // Get matches for papers with the specified topic
    const matches = await Match.find({
      'paper.main_topic': topic,
      status: 'completed'
    }).lean();
    
    if (matches.length === 0) {
      return res.json([]);
    }
    
    // Get match IDs
    const matchIds = matches.map(match => match.id);
    
    // Get results for these matches
    const results = await Result.find({
      match_id: { $in: matchIds }
    }).lean();
    
    // Calculate agent statistics
    const agentStats = {};
    
    results.forEach(result => {
      // Initialize agent stats if not exists
      if (!agentStats[result.agent1]) {
        agentStats[result.agent1] = {
          name: result.agent1,
          matches_played: 0,
          matches_won: 0,
          matches_drawn: 0,
          matches_lost: 0,
          points: 0,
          total_score: 0
        };
      }
      
      if (!agentStats[result.agent2]) {
        agentStats[result.agent2] = {
          name: result.agent2,
          matches_played: 0,
          matches_won: 0,
          matches_drawn: 0,
          matches_lost: 0,
          points: 0,
          total_score: 0
        };
      }
      
      // Update match counts
      agentStats[result.agent1].matches_played++;
      agentStats[result.agent2].matches_played++;
      
      // Update win/loss/draw counts
      if (result.result === 'win_agent1') {
        agentStats[result.agent1].matches_won++;
        agentStats[result.agent1].points += 3;
        agentStats[result.agent2].matches_lost++;
      } else if (result.result === 'win_agent2') {
        agentStats[result.agent2].matches_won++;
        agentStats[result.agent2].points += 3;
        agentStats[result.agent1].matches_lost++;
      } else { // Draw
        agentStats[result.agent1].matches_drawn++;
        agentStats[result.agent2].matches_drawn++;
        agentStats[result.agent1].points += 1;
        agentStats[result.agent2].points += 1;
      }
      
      // Add evaluation scores if available
      if (result.evaluation?.total_scores) {
        agentStats[result.agent1].total_score += result.evaluation.total_scores.agent1 || 0;
        agentStats[result.agent2].total_score += result.evaluation.total_scores.agent2 || 0;
      }
    });
    
    // Calculate win percentages and average scores
    Object.values(agentStats).forEach(agent => {
      agent.win_percentage = agent.matches_played > 0
        ? (agent.matches_won / agent.matches_played) * 100
        : 0;
      
      agent.avg_score = agent.matches_played > 0
        ? agent.total_score / agent.matches_played
        : 0;
      
      // Round to 2 decimal places
      agent.win_percentage = Math.round(agent.win_percentage * 100) / 100;
      agent.avg_score = Math.round(agent.avg_score * 100) / 100;
    });
    
    // Convert to array and sort by points (descending)
    const leaderboard = Object.values(agentStats)
      .sort((a, b) => {
        // Sort by points first
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        // If points are equal, sort by win percentage
        if (b.win_percentage !== a.win_percentage) {
          return b.win_percentage - a.win_percentage;
        }
        // If win percentage is equal, sort by average score
        return b.avg_score - a.avg_score;
      });
    
    // Add rank and topic
    leaderboard.forEach((agent, index) => {
      agent.rank = index + 1;
      agent.topic = topic;
    });
    
    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/leaderboard/criteria
 * Get agent rankings by evaluation criteria
 */
router.get('/criteria', async (req, res, next) => {
  try {
    // Get all results
    const results = await Result.find().lean();
    
    if (results.length === 0) {
      return res.json({});
    }
    
    // Initialize criteria scores
    const criteriaScores = {
      technical_correctness: {},
      depth_of_analysis: {},
      constructive_feedback: {},
      clarity: {},
      fairness: {}
    };
    
    // Count agent matches
    const agentMatches = {};
    
    // Aggregate scores by criteria
    results.forEach(result => {
      const { agent1, agent2 } = result;
      
      // Initialize agent counts
      if (!agentMatches[agent1]) agentMatches[agent1] = 0;
      if (!agentMatches[agent2]) agentMatches[agent2] = 0;
      
      // Increment match counts
      agentMatches[agent1]++;
      agentMatches[agent2]++;
      
      // Process criteria scores if evaluation exists
      if (result.evaluation?.scores) {
        const { scores } = result.evaluation;
        
        // Process each criterion
        Object.entries(scores).forEach(([criterion, agentScores]) => {
          // Initialize agent scores for this criterion
          if (!criteriaScores[criterion][agent1]) criteriaScores[criterion][agent1] = 0;
          if (!criteriaScores[criterion][agent2]) criteriaScores[criterion][agent2] = 0;
          
          // Add scores
          criteriaScores[criterion][agent1] += agentScores.agent1 || 0;
          criteriaScores[criterion][agent2] += agentScores.agent2 || 0;
        });
      }
    });
    
    // Calculate average scores and create rankings
    const rankings = {};
    
    Object.entries(criteriaScores).forEach(([criterion, scores]) => {
      // Calculate averages
      const averageScores = Object.entries(scores).map(([agent, totalScore]) => ({
        agent,
        score: agentMatches[agent] > 0 ? totalScore / agentMatches[agent] : 0
      }));
      
      // Sort by score (descending)
      averageScores.sort((a, b) => b.score - a.score);
      
      // Add ranks
      const rankedScores = averageScores.map((item, index) => ({
        rank: index + 1,
        agent: item.agent,
        score: Math.round(item.score * 100) / 100
      }));
      
      rankings[criterion] = rankedScores;
    });
    
    res.json(rankings);
  } catch (err) {
    next(err);
  }
});

module.exports = router;