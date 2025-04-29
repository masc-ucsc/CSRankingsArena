/**
 * Paper Routes
 * 
 * API endpoints for paper-related operations.
 */

const express = require('express');
const router = express.Router();
const { Paper } = require('../models');

/**
 * GET /api/papers
 * Get all papers with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      topic,     // Filter by main_topic
      search,    // Search in title and abstract
      limit = 20,
      page = 1,
      sort = '-published_date'  // Default sort by newest first
    } = req.query;
    
    // Build filter query
    const filter = {};
    
    if (topic) {
      filter.main_topic = topic;
    }
    
    if (search) {
      // Search in title and abstract
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { abstract: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const papers = await Paper.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Paper.countDocuments(filter);
    
    res.json({
      papers,
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
 * GET /api/papers/:id
 * Get a single paper by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const paper = await Paper.findById(req.params.id);
    
    if (!paper) {
      return res.status(404).json({ error: true, message: 'Paper not found' });
    }
    
    res.json(paper);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/papers/topic/:topic
 * Get papers by topic
 */
router.get('/topic/:topic', async (req, res, next) => {
  try {
    const {
      limit = 20,
      page = 1,
      sort = '-published_date'
    } = req.query;
    
    const topic = req.params.topic;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const papers = await Paper.find({ main_topic: topic })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Paper.countDocuments({ main_topic: topic });
    
    res.json({
      papers,
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
 * GET /api/papers/stats/topics
 * Get paper count by topic
 */
router.get('/stats/topics', async (req, res, next) => {
  try {
    const topicStats = await Paper.aggregate([
      {
        $group: {
          _id: '$main_topic',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Transform to more readable format
    const result = topicStats.map(item => ({
      topic: item._id,
      count: item.count
    }));
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/papers/stats/recent
 * Get paper count by month (recent activity)
 */
router.get('/stats/recent', async (req, res, next) => {
  try {
    // Get papers from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentStats = await Paper.aggregate([
      {
        $match: {
          published_date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: '$published_date' },
            month: { $month: '$published_date' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Transform to more readable format
    const result = recentStats.map(item => {
      const date = new Date(item._id.year, item._id.month - 1, 1);
      return {
        date: date.toISOString().slice(0, 7), // YYYY-MM format
        count: item.count
      };
    });
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;