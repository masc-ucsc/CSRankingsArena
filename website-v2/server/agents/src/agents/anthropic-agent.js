// src/agents/anthropic-agent.js
const Anthropic = require('@anthropic-ai/sdk');
const ReviewAgent = require('./base-agent');
const config = require('../agents/config');
// const logger = require('../utils/logger');

/**
 * Review agent implementation using Anthropic API
 */
class AnthropicReviewAgent extends ReviewAgent {
  /**
   * Create a new Anthropic-based review agent
   * @param {string} name - Display name for the agent
   * @param {string} model - Anthropic model to use (e.g., 'claude-3-opus')
   * @param {Object} options - Additional configuration options
   */
  constructor(name, model, options = {}) {
    super(name, model, 'anthropic', options);
    
    const apiKey = options.apiKey || config.anthropic.apiKey;
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    this.client = new Anthropic({ apiKey });
    this.temperature = options.temperature || 0.3;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Generate a review for a paper using Anthropic
   * @param {Object} paper - Paper to review
   * @param {Object} match - Match object
   * @returns {Promise<Object>} The review
   */
  async reviewPaper(paper, match) {
    const prompt = this.createReviewPrompt(paper);
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        //logger.info(`Generating review for paper "${paper.title}" using ${this.name} (attempt ${attempt + 1}/${this.maxRetries})`);
        
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 2000,
          temperature: this.temperature,
          system: "You are an expert academic reviewer. Your task is to provide detailed, constructive reviews of research papers.",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        });
        
        const reviewText = response.content[0].text;
        const review = this.parseReviewText(reviewText);
        
        // Save review to database
        if (match?.id && paper?.id) {
          await this.saveReview(review, match.id, paper.id);
        }
        
        //logger.info(`Successfully generated review for paper "${paper.title}"`);
        return review;
      } catch (error) {
        //logger.warn(`Attempt ${attempt + 1}/${this.maxRetries} failed:`, error);
        
        if (attempt < this.maxRetries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          //logger.error(`Failed to generate review after ${this.maxRetries} attempts`);
          throw error;
        }
      }
    }
  }
}

module.exports = AnthropicReviewAgent;