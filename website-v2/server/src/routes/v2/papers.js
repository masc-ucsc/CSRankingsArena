const express = require('express');
const router = express.Router();
const arxivService = require('../../services/v2/arxiv');
const db = require('../../db');

// Get papers for a category and subcategory
router.get('/:category/:subcategory', async (req, res) => {
  try {
    const { category, subcategory } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    // First try to get papers from our database
    let papers = await db('papers')
      .where({
        category,
        subcategory,
        year: parseInt(year)
      })
      .orderBy('published', 'desc');

    // If no papers found in database, fetch from arXiv
    if (papers.length === 0) {
      papers = await arxivService.searchPapers(category, subcategory, parseInt(year));
      
      // Store papers in database for future use
      if (papers.length > 0) {
        await db('papers').insert(papers.map(paper => ({
          ...paper,
          category,
          subcategory
        })));
      }
    }

    res.json(papers);
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

// Get paper details
router.get('/:id', async (req, res) => {
  try {
    const paper = await db('papers')
      .where({ id: req.params.id })
      .first();

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json(paper);
  } catch (error) {
    console.error('Error fetching paper details:', error);
    res.status(500).json({ error: 'Failed to fetch paper details' });
  }
});

// Get venues for a category and subcategory
router.get('/:category/:subcategory/venues', async (req, res) => {
  try {
    const { category, subcategory } = req.params;
    const { year } = req.query;

    const query = db('papers')
      .where({ category, subcategory })
      .distinct('venue');

    if (year) {
      query.where({ year: parseInt(year) });
    }

    const venues = await query;
    res.json(venues.map(v => v.venue));
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

module.exports = router; 