/**
 * Match Routes
 * 
 * API endpoints for match-related operations.
 */

const express = require('express');
const router = express.Router();
const { Match, Result } = require('../models');

/**
 * GET /api/matches
 * Get all matches with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      status,     // Filter by status
      agent,      // Filter by agent
      limit = 20,
      page = 1,
      sort = '-created_at'  // Default sort by newest first
    } = req.query;
    
    // Build filter query
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (agent) {
      // Search for matches where agent is either agent1 or agent2
      filter.$or = [
        { agent1: agent },
        { agent2: agent }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const matches = await Match.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Enrich matches with results for completed matches
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const matchObj = match.toObject();
        
        if (matchObj.status === 'completed') {
          const result = await Result.findOne({ match_id: matchObj.id });
          if (result) {
            // Add review and evaluation data
            matchObj.review1 = result.review1;
            matchObj.review2 = result.review2;
            matchObj.evaluation = result.evaluation;
            matchObj.winner = result.evaluation.winner;
          }
        }
        
        return matchObj;
      })
    );
    
    // Get total count for pagination
    const total = await Match.countDocuments(filter);
    
    res.json({
      matches: enrichedMatches,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/:id
 * Get a single match by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const match = await Match.findOne({ id: req.params.id });
    
    if (!match) {
      return res.status(404).json({ error: true, message: 'Match not found' });
    }
    
    const matchObj = match.toObject();
    
    // Add result data for completed matches
    if (matchObj.status === 'completed') {
      const result = await Result.findOne({ match_id: matchObj.id });
      if (result) {
        matchObj.review1 = result.review1;
        matchObj.review2 = result.review2;
        matchObj.evaluation = result.evaluation;
        matchObj.winner = result.evaluation.winner;
      }
    }
    
    res.json(matchObj);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/agent/:name
 * Get matches for a specific agent
 */
router.get('/agent/:name', async (req, res, next) => {
  try {
    const {
      status,
      limit = 20,
      page = 1,
      sort = '-created_at'
    } = req.query;
    
    const agentName = req.params.name;
    const filter = {
      $or: [
        { agent1: agentName },
        { agent2: agentName }
      ]
    };
    
    if (status) {
      filter.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const matches = await Match.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Match.countDocuments(filter);
    
    res.json({
      matches,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/paper/:paperId
 * Get matches for a specific paper
 */
router.get('/paper/:paperId', async (req, res, next) => {
  try {
    const paperId = req.params.paperId;
    
    const matches = await Match.find({ paper_id: paperId });
    
    res.json(matches);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/stats/status
 * Get match count by status
 */
router.get('/stats/status', async (req, res, next) => {
  try {
    const statusStats = await Match.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Transform to more readable format
    const result = statusStats.map(item => ({
      status: item._id,
      count: item.count
    }));
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/stats/agents
 * Get match count by agent
 */
router.get('/stats/agents', async (req, res, next) => {
  try {
    // Count matches per agent
    const matches = await Match.find();
    
    // Create agent stats map
    const agentStats = {};
    
    // Count agent appearances
    matches.forEach(match => {
      if (!agentStats[match.agent1]) {
        agentStats[match.agent1] = { matches: 0 };
      }
      if (!agentStats[match.agent2]) {
        agentStats[match.agent2] = { matches: 0 };
      }
      
      agentStats[match.agent1].matches++;
      agentStats[match.agent2].matches++;
    });
    
    // Transform to array
    const result = Object.entries(agentStats).map(([agent, stats]) => ({
      agent,
      matches: stats.matches
    }));
    
    // Sort by match count, descending
    result.sort((a, b) => b.matches - a.matches);
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;