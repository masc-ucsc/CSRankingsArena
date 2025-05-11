// src/agents/base-agent.js
const { v4: uuidv4 } = require('uuid');
const db = require('../../../src/config/db');

/**
 * Base class for all review agents
 */
class ReviewAgent {
  /**
   * Initialize a review agent
   * @param {string} name - Display name for the agent
   * @param {string} model - Model identifier
   * @param {string} provider - Provider name (e.g., 'openai', 'anthropic')
   * @param {Object} options - Additional configuration options
   */
  constructor(name, model, provider, options = {}) {
    this.name = name;
    this.model = model;
    this.provider = provider;
    this.options = options;
    this.id = options.id || null;
  }

  /**
   * Register the agent in the database if not already registered
   * @returns {Promise<Object>} The agent record
   */
  async register() {
    try {
      // Check if agent already exists by name and model
      const existingAgent = await db('agents')
        .where({ name: this.name, model: this.model })
        .first();

      if (existingAgent) {
        this.id = existingAgent.id;
        //logger.info(`Agent ${this.name} already registered with ID ${this.id}`);
        return existingAgent;
      }

      // Insert new agent
      const [agent] = await db('agents')
        .insert({
          name: this.name,
          model: this.model,
          provider: this.provider,
          options: JSON.stringify(this.options),
          created_at: new Date()
        })
        .returning('*');

      this.id = agent.id;
      //logger.info(`Registered new agent ${this.name} with ID ${this.id}`);
      return agent;
    } catch (error) {
      //logger.error(`Error registering agent ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Generate a review for a paper
   * @param {Object} paper - Paper to review
   * @returns {Promise<Object>} The review
   */
  async reviewPaper(paper) {
    throw new Error('Method reviewPaper must be implemented by subclass');
  }

  /**
   * Create a standardized prompt for reviewing a paper
   * @param {Object} paper - Paper to review
   * @returns {string} The review prompt
   */
  createReviewPrompt(paper) {
    return `
      Please review the following research paper and provide a structured academic review.
      
      Paper Title: ${paper.title}
      Authors: ${paper.authors}
      
      Abstract:
      ${paper.abstract}
      
      ${paper.introduction ? `Introduction:\n${paper.introduction}\n\n` : ''}
      
      Your review should include:
      1. Summary: A brief summary of the paper's contributions and approach
      2. Strengths: At least 3 specific strengths of the paper
      3. Weaknesses: At least 3 specific weaknesses or limitations
      4. Questions: 2-3 questions for the authors
      5. Rating: A numerical rating from 1-10
      6. Confidence: Your confidence in this review (low, medium, high)
      
      Format your response as follows:
      
      Summary:
      [Your summary here]
      
      Strengths:
      - [Strength 1]
      - [Strength 2]
      - [Strength 3]
      
      Weaknesses:
      - [Weakness 1]
      - [Weakness 2]
      - [Weakness 3]
      
      Questions:
      1. [Question 1]
      2. [Question 2]
      3. [Question 3]
      
      Rating: [1-10]
      
      Confidence: [low/medium/high]
    `;
  }

  /**
   * Parse a review text into a structured object
   * @param {string} reviewText - Raw review text
   * @returns {Object} Structured review
   */
  parseReviewText(reviewText) {
    const review = {
      summary: '',
      strengths: [],
      weaknesses: [],
      questions: [],
      rating: 0,
      confidence: 'low'
    };
    
    let currentSection = null;
    
    // Split by lines and parse each section
    for (const line of reviewText.split('\n')) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;
        
      if (trimmedLine.toLowerCase().startsWith('summary:')) {
        currentSection = 'summary';
        review.summary = trimmedLine.substring(8).trim();
      } else if (trimmedLine.toLowerCase().startsWith('strengths:')) {
        currentSection = 'strengths';
      } else if (trimmedLine.toLowerCase().startsWith('weaknesses:')) {
        currentSection = 'weaknesses';
      } else if (trimmedLine.toLowerCase().startsWith('questions:')) {
        currentSection = 'questions';
      } else if (trimmedLine.toLowerCase().startsWith('rating:')) {
        const ratingStr = trimmedLine.substring(7).trim();
        const rating = parseInt(ratingStr, 10);
        if (!isNaN(rating)) {
          review.rating = rating;
        }
      } else if (trimmedLine.toLowerCase().startsWith('confidence:')) {
        const confidence = trimmedLine.substring(11).trim().toLowerCase();
        if (['low', 'medium', 'high'].includes(confidence)) {
          review.confidence = confidence;
        }
      } else if (currentSection === 'summary') {
        // Append to existing summary
        review.summary += ' ' + trimmedLine;
      } else if (currentSection && ['strengths', 'weaknesses', 'questions'].includes(currentSection)) {
        // Check if line starts with a list marker (-, *, 1., etc.)
        if (/^[-*0-9.)\s]/.test(trimmedLine)) {
          const item = trimmedLine.replace(/^[-*0-9.)]+\s*/, '').trim();
          if (item) {
            review[currentSection].push(item);
          }
        }
      }
    }
    
    return review;
  }

  /**
   * Save a review to the database
   * @param {Object} review - Review object
   * @param {number} matchId - ID of the match
   * @param {number} paperId - ID of the paper
   * @returns {Promise<Object>} Saved review
   */
  async saveReview(review, matchId, paperId) {
    try {
      // Make sure agent is registered
      if (!this.id) {
        await this.register();
      }
      
      const [savedReview] = await db('reviews')
        .insert({
          match_id: matchId,
          agent_id: this.id,
          paper_id: paperId,
          summary: review.summary,
          strengths: JSON.stringify(review.strengths),
          weaknesses: JSON.stringify(review.weaknesses),
          questions: JSON.stringify(review.questions),
          rating: review.rating,
          confidence: review.confidence,
          created_at: new Date()
        })
        .returning('*');
        
      //logger.info(`Saved review for match ${matchId} by agent ${this.name}`);
      return savedReview;
    } catch (error) {
      //logger.error(`Error saving review for match ${matchId}:`, error);
      throw error;
    }
  }
}

module.exports = ReviewAgent;