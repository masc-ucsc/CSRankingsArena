// src/agents/openai-agent.js
const { Configuration, OpenAIApi } = require('openai');
const ReviewAgent = require('./base-agent');
const config = require('../agents/config');
//const logger = require('../utils/logger');

/**
 * Review agent implementation using OpenAI API
 */
class OpenAIReviewAgent extends ReviewAgent {
  /**
   * Create a new OpenAI-based review agent
   * @param {string} name - Display name for the agent
   * @param {string} model - OpenAI model to use (e.g., 'gpt-4', 'gpt-3.5-turbo')
   * @param {Object} options - Additional configuration options
   */
  constructor(name, model, options = {}) {
    super(name, model, 'openai', options);
    
    const apiKey = options.apiKey || config.openai.apiKey;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);
    this.temperature = options.temperature || 0.3;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Generate a review for a paper using OpenAI
   * @param {Object} paper - Paper to review
   * @param {Object} match - Match object
   * @returns {Promise<Object>} The review
   */
  async reviewPaper(paper, match) {
    const prompt = this.createReviewPrompt(paper);
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        //logger.info(`Generating review for paper "${paper.title}" using ${this.name} (attempt ${attempt + 1}/${this.maxRetries})`);
        
        const response = await this.openai.createChatCompletion({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are an expert academic reviewer. Your task is to provide detailed, constructive reviews of research papers."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: this.temperature,
          max_tokens: 2000
        });
        
        const reviewText = response.data.choices[0].message.content;
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

module.exports = OpenAIReviewAgent;





