const express = require('express');
const router = express.Router();
const db = require('../../db');

// Create a new match
router.post('/', async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const {
      paperId,
      paper1Id,
      paper2Id,
      agent1Id,
      agent2Id,
      judgeId,
      category,
      subcategory,
      year,
      matchType
    } = req.body;

    // Validate required fields
    if (!agent1Id || !agent2Id || !judgeId) {
      throw new Error('Missing required agent selections');
    }

    if (matchType === 'single' && !paperId) {
      throw new Error('Missing paper selection for single match');
    }

    if (matchType === 'comparison' && (!paper1Id || !paper2Id)) {
      throw new Error('Missing paper selections for comparison match');
    }

    // Create the match record
    const [matchId] = await trx('matches').insert({
      category,
      subcategory,
      year,
      match_type: matchType,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    // Create match participants
    const participants = [
      { match_id: matchId, agent_id: agent1Id, role: 'agent1' },
      { match_id: matchId, agent_id: agent2Id, role: 'agent2' },
      { match_id: matchId, agent_id: judgeId, role: 'judge' }
    ];

    await trx('match_participants').insert(participants);

    // Create match papers
    const papers = matchType === 'single' 
      ? [{ match_id: matchId, paper_id: paperId }]
      : [
          { match_id: matchId, paper_id: paper1Id },
          { match_id: matchId, paper_id: paper2Id }
        ];

    await trx('match_papers').insert(papers);

    await trx.commit();

    // Fetch the complete match details
    const match = await getMatchDetails(matchId);
    res.json(match);
  } catch (error) {
    await trx.rollback();
    console.error('Error creating match:', error);
    res.status(500).json({ error: error.message || 'Failed to create match' });
  }
});

// Get match details
router.get('/:id', async (req, res) => {
  try {
    const match = await getMatchDetails(req.params.id);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Error fetching match details:', error);
    res.status(500).json({ error: 'Failed to fetch match details' });
  }
});

// Get recent matches for a category and subcategory
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, limit = 5 } = req.query;

    const matches = await db('matches')
      .where({ category, subcategory })
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit));

    const matchesWithDetails = await Promise.all(
      matches.map(match => getMatchDetails(match.id))
    );

    res.json(matchesWithDetails);
  } catch (error) {
    console.error('Error fetching recent matches:', error);
    res.status(500).json({ error: 'Failed to fetch recent matches' });
  }
});

// Submit feedback for a match
router.post('/:id/feedback', async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    const matchId = req.params.id;

    await db('match_feedback').insert({
      match_id: matchId,
      feedback,
      rating,
      created_at: new Date()
    });

    // Update match status if needed
    await db('matches')
      .where({ id: matchId })
      .update({ 
        status: 'completed',
        updated_at: new Date()
      });

    const match = await getMatchDetails(matchId);
    res.json(match);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Helper function to get complete match details
async function getMatchDetails(matchId) {
  const match = await db('matches')
    .where({ id: matchId })
    .first();

  if (!match) return null;

  // Get participants
  const participants = await db('match_participants')
    .where({ match_id: matchId })
    .join('agents', 'match_participants.agent_id', 'agents.id')
    .select('agents.*', 'match_participants.role');

  // Get papers
  const matchPapers = await db('match_papers')
    .where({ match_id: matchId })
    .join('papers', 'match_papers.paper_id', 'papers.id')
    .select('papers.*');

  // Get feedback
  const feedback = await db('match_feedback')
    .where({ match_id: matchId })
    .first();

  return {
    ...match,
    agents: participants.map(p => ({
      id: p.id,
      name: p.name,
      role: p.role
    })),
    papers: matchPapers,
    feedback
  };
}

module.exports = router; 