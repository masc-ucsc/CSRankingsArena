// src/competition/competition-manager.js
const uuid = require('uuid');
const db = require('../../../../server/src/config/db');
const { createAgents } = require('../agents');
const EvaluationJudge = require('../agents/evaluation-judge');
const config = require('../agents/config');


/**
 * Manager for paper evaluation competitions
 */
class CompetitionManager {
  /**
   * Create a new competition manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      judgeProvider: options.judgeProvider || config.judge.provider || 'openai',
      judgeModel: options.judgeModel || config.judge.model || 'gpt-4',
      ...options
    };
    
    this.agents = [];
    this.judge = null;
  }

  /**
   * Initialize the competition manager
   */
  async initialize() {
    // Create agent instances
    this.agents = await createAgents();
    
    // Register all agents
    for (const agent of this.agents) {
      await agent.register();
    }
    
    // Create evaluation judge
    this.judge = new EvaluationJudge(
      this.options.judgeProvider,
      this.options.judgeModel,
      this.options
    );
    
    //logger.info(`Competition manager initialized with ${this.agents.length} agents`);
  }

  /**
   * Generate matches between agents for paper reviews
   * @param {Object} options - Match generation options
   * @returns {Promise<Array>} Generated matches
   */
  async generateMatches(options = {}) {
    const {
      topic = null,
      limit = 10,
      papersPerAgent = 3,
      randomSeed = Date.now()
    } = options;
    
    //logger.info(`Generating matches for topic: ${topic || 'All'}, limit: ${limit}`);
    
    // Make sure agents are initialized
    if (this.agents.length < 2) {
      await this.initialize();
    }
    
    // Fetch papers
    const papers = await this._fetchPapers(topic, limit);
    
    if (papers.length === 0) {
      //logger.warn('No papers available for matches');
      return [];
    }
    
    // Generate all possible agent pairs
    const agentPairs = [];
    for (let i = 0; i < this.agents.length; i++) {
      for (let j = i + 1; j < this.agents.length; j++) {
        agentPairs.push([this.agents[i], this.agents[j]]);
      }
    }
    
    // Create matches
    const matches = [];
    
    // Use a deterministic "random" selection if seed provided
    const random = (max) => {
      const x = Math.sin(randomSeed++) * 10000;
      return Math.floor((x - Math.floor(x)) * max);
    };
    
    // Generate matches
    for (let i = 0; i < Math.min(papers.length, limit); i++) {
      const paper = papers[i];
      
      // Select a random agent pair
      const pairIndex = random(agentPairs.length);
      const [agent1, agent2] = agentPairs[pairIndex];
      
      // Create match
      const matchId = uuid.v4();
      const match = {
        id: matchId,
        paper_id: paper.id,
        agent1_id: agent1.id,
        agent2_id: agent2.id,
        status: 'pending',
        created_at: new Date()
      };
      
      // Insert match into database
      try {
        await db('matches').insert(match);
        matches.push(match);
        //logger.info(`Created match ${matchId} for paper "${paper.title}" between ${agent1.name} and ${agent2.name}`);
      } catch (error) {
        //logger.error(`Error creating match for paper ${paper.id}:`, error);
      }
    }
    
    //logger.info(`Generated ${matches.length} matches`);
    return matches;
  }
  
  /**
   * Fetch papers from the database
   * @private
   */
  async _fetchPapers(topic, limit) {
    try {
      let query = db('papers')
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(limit);
      
      if (topic) {
        query = query.where('main_topic', topic);
      }
      
      const papers = await query;
      //logger.info(`Fetched ${papers.length} papers for topic: ${topic || 'All'}`);
      return papers;
    } catch (error) {
      //logger.error('Error fetching papers:', error);
      return [];
    }
  }

  /**
   * Run a specific match
   * @param {string} matchId - ID of the match to run
   * @returns {Promise<Object>} Result of the match
   */
  async runMatch(matchId) {
    try {
      // Fetch match
      const match = await db('matches').where('id', matchId).first();
      
      if (!match) {
        throw new Error(`Match with ID ${matchId} not found`);
      }
      
      if (match.status !== 'pending') {
        //logger.info(`Match ${matchId} already processed (status: ${match.status})`);
        return match;
      }
      
      //logger.info(`Running match ${matchId}`);
      
      // Fetch paper
      const paper = await db('papers').where('id', match.paper_id).first();
      
      if (!paper) {
        throw new Error(`Paper with ID ${match.paper_id} not found`);
      }
      
      // Find agents
      const agent1 = this.agents.find(a => a.id === match.agent1_id);
      const agent2 = this.agents.find(a => a.id === match.agent2_id);
      
      if (!agent1 || !agent2) {
        throw new Error(`Could not find agents for match ${matchId}`);
      }
      
      // Generate reviews
      //logger.info(`Generating review from ${agent1.name}`);
      const review1 = await agent1.reviewPaper(paper, match);
      
      //logger.info(`Generating review from ${agent2.name}`);
      const review2 = await agent2.reviewPaper(paper, match);
      
      // Save reviews to database
      const savedReview1 = await agent1.saveReview(review1, match.id, paper.id);
      const savedReview2 = await agent2.saveReview(review2, match.id, paper.id);
      
      // Judge the reviews
      //logger.info(`Evaluating reviews`);
      const evaluation = await this.judge.evaluateReviews(
        paper,
        review1,
        review2,
        agent1.name,
        agent2.name
      );
      
      // Determine winner
      let winnerId = null;
      
      if (evaluation.winner === agent1.name) {
        winnerId = agent1.id;
        await this._updateAgentStats(agent1.id, 'win');
        await this._updateAgentStats(agent2.id, 'loss');
      } else if (evaluation.winner === agent2.name) {
        winnerId = agent2.id;
        await this._updateAgentStats(agent2.id, 'win');
        await this._updateAgentStats(agent1.id, 'loss');
      } else {
        // Draw
        await this._updateAgentStats(agent1.id, 'draw');
        await this._updateAgentStats(agent2.id, 'draw');
      }
      
      // Save evaluation
      await this.judge.saveEvaluation(
        evaluation,
        match.id,
        savedReview1.id,
        savedReview2.id,
        winnerId
      );
      
      // Update match
      await db('matches')
        .where('id', match.id)
        .update({
          status: 'completed',
          winner_id: winnerId,
          completed_at: new Date()
        });
      
      //logger.info(`Match ${matchId} completed. Winner: ${evaluation.winner || 'Draw'}`);
      
      return {
        ...match,
        status: 'completed',
        winner_id: winnerId,
        evaluation
      };
      
    } catch (error) {
      //logger.error(`Error running match ${matchId}:`, error);
      
      // Update match status to error
      await db('matches')
        .where('id', matchId)
        .update({
          status: 'error',
          error: error.message,
          completed_at: new Date()
        });
      
      throw error;
    }
  }
  
  /**
   * Run multiple matches
   * @param {Array} matchIds - IDs of matches to run
   * @returns {Promise<Array>} Results of matches
   */
  async runMatches(matchIds) {
    const results = [];
    
    for (const matchId of matchIds) {
      try {
        const result = await this.runMatch(matchId);
        results.push(result);
      } catch (error) {
        //logger.error(`Error running match ${matchId}:`, error);
        results.push({
          id: matchId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Run pending matches
   * @param {number} limit - Maximum number of matches to run
   * @returns {Promise<Array>} Results of matches
   */
  async runPendingMatches(limit = 10) {
    try {
      // Fetch pending matches
      const pendingMatches = await db('matches')
        .where('status', 'pending')
        .orderBy('created_at', 'asc')
        .limit(limit);
      
      //logger.info(`Found ${pendingMatches.length} pending matches`);
      
      const matchIds = pendingMatches.map(match => match.id);
      return await this.runMatches(matchIds);
    } catch (error) {
      //logger.error('Error running pending matches:', error);
      throw error;
    }
  }
  
  /**
   * Update agent statistics
   * @private
   */
  async _updateAgentStats(agentId, result) {
    try {
      // Get current stats
      const agent = await db('agents').where('id', agentId).first();
      
      if (!agent) {
        throw new Error(`Agent with ID ${agentId} not found`);
      }
      
      // Update stats based on result
      const updates = {
        matches_played: agent.matches_played + 1,
        updated_at: new Date()
      };
      
      if (result === 'win') {
        updates.matches_won = agent.matches_won + 1;
        updates.points = agent.points + 3;
      } else if (result === 'draw') {
        updates.matches_drawn = agent.matches_drawn + 1;
        updates.points = agent.points + 1;
      } else if (result === 'loss') {
        updates.matches_lost = agent.matches_lost + 1;
      }
      
      // Update in database
      await db('agents')
        .where('id', agentId)
        .update(updates);
        
      //logger.info(`Updated stats for agent ${agentId}: ${result}`);
    } catch (error) {
      //logger.error(`Error updating stats for agent ${agentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get current leaderboard
   * @returns {Promise<Array>} Leaderboard data
   */
  async getLeaderboard() {
    try {
      const leaderboard = await db('agents')
        .select('*')
        .orderBy('points', 'desc')
        .orderBy('matches_won', 'desc');
      
      return leaderboard;
    } catch (error) {
      //logger.error('Error getting leaderboard:', error);
      throw error;
    }
  }
}

module.exports = CompetitionManager;