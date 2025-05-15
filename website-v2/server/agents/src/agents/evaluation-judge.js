// src/agents/evaluation-judge.js
const { Configuration, OpenAIApi } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { db } = require('../../../../server/src/config/db')
const config = require('../agents/config');


/**
 * Judge that evaluates paper reviews and determines winners
 */
class EvaluationJudge {
  /**
   * Create a new evaluation judge
   * @param {string} provider - Provider to use ('openai' or 'anthropic')
   * @param {string} model - Model identifier
   * @param {Object} options - Additional configuration options
   */
  constructor(provider, model, options = {}) {
    this.provider = provider;
    this.model = model;
    this.options = options;
    
    // Setup client based on provider
    if (provider === 'openai') {
      const apiKey = options.apiKey || config.openai.apiKey;
      if (!apiKey) {
        throw new Error('OpenAI API key is required');
      }
      
      const configuration = new Configuration({ apiKey });
      this.client = new OpenAIApi(configuration);
    } else if (provider === 'anthropic') {
      const apiKey = options.apiKey || config.anthropic.apiKey;
      if (!apiKey) {
        throw new Error('Anthropic API key is required');
      }
      
      this.client = new Anthropic({ apiKey });
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    this.temperature = options.temperature || 0.2;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Evaluate two reviews and determine which is better
   * @param {Object} paper - Paper being reviewed
   * @param {Object} review1 - First review
   * @param {Object} review2 - Second review
   * @param {string} agent1Name - Name of first agent
   * @param {string} agent2Name - Name of second agent
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateReviews(paper, review1, review2, agent1Name, agent2Name) {
    const prompt = this._createEvaluationPrompt(paper, review1, review2, agent1Name, agent2Name);
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        //logger.info(`Evaluating reviews for paper "${paper.title}" by ${agent1Name} and ${agent2Name}`);
        
        let evaluationText;
        
        if (this.provider === 'openai') {
          const response = await this.client.createChatCompletion({
            model: this.model,
            messages: [
              {
                role: "system",
                content: "You are an expert academic meta-reviewer. Your task is to evaluate the quality of peer reviews and determine which review is more helpful, thorough, and insightful."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: this.temperature,
            max_tokens: 1500
          });
          
          evaluationText = response.data.choices[0].message.content;
        } else if (this.provider === 'anthropic') {
          const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 1500,
            temperature: this.temperature,
            system: "You are an expert academic meta-reviewer. Your task is to evaluate the quality of peer reviews and determine which review is more helpful, thorough, and insightful.",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          });
          
          evaluationText = response.content[0].text;
        }
        
        // Parse the evaluation
        const evaluation = this._parseEvaluation(evaluationText, agent1Name, agent2Name);
        
        //logger.info(`Successfully evaluated reviews. Winner: ${evaluation.winner || 'Draw'}`);
        return evaluation;
      } catch (error) {
        //logger.warn(`Attempt ${attempt + 1}/${this.maxRetries} failed:`, error);
        
        if (attempt < this.maxRetries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          //logger.error(`Failed to evaluate reviews after ${this.maxRetries} attempts`);
          throw error;
        }
      }
    }
  }

  /**
   * Save evaluation to the database
   * @param {Object} evaluation - Evaluation result
   * @param {number} matchId - Match ID
   * @param {number} review1Id - First review ID
   * @param {number} review2Id - Second review ID
   * @param {number|null} winnerId - Winner agent ID (null for draw)
   * @returns {Promise<Object>} Saved evaluation
   */
  async saveEvaluation(evaluation, matchId, review1Id, review2Id, winnerId) {
    try {
      const [savedEvaluation] = await db('evaluations')
        .insert({
          match_id: matchId,
          review1_id: review1Id,
          review2_id: review2Id,
          winner_id: winnerId,
          reasoning: evaluation.reasoning,
          technical_correctness_1: evaluation.scores.technical_correctness.agent1,
          technical_correctness_2: evaluation.scores.technical_correctness.agent2,
          depth_of_analysis_1: evaluation.scores.depth_of_analysis.agent1,
          depth_of_analysis_2: evaluation.scores.depth_of_analysis.agent2,
          constructive_feedback_1: evaluation.scores.constructive_feedback.agent1,
          constructive_feedback_2: evaluation.scores.constructive_feedback.agent2,
          clarity_1: evaluation.scores.clarity.agent1,
          clarity_2: evaluation.scores.clarity.agent2,
          fairness_1: evaluation.scores.fairness.agent1,
          fairness_2: evaluation.scores.fairness.agent2,
          created_at: new Date()
        })
        .returning('*');
        
      //logger.info(`Saved evaluation for match ${matchId}`);
      return savedEvaluation;
    } catch (error) {
      //logger.error(`Error saving evaluation for match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Create a prompt for the evaluation model
   * @private
   */
  _createEvaluationPrompt(paper, review1, review2, agent1Name, agent2Name) {
    return `
      Compare the following two reviews of the same academic paper and evaluate which review is better.
      
      Paper Title: ${paper.title}
      Authors: ${paper.authors}
      
      Abstract:
      ${paper.abstract}
      
      Review by ${agent1Name}:
      
      Summary: ${review1.summary}
      
      Strengths:
      ${this._formatList(review1.strengths)}
      
      Weaknesses:
      ${this._formatList(review1.weaknesses)}
      
      Questions:
      ${this._formatList(review1.questions)}
      
      Rating: ${review1.rating}
      Confidence: ${review1.confidence}
      
      Review by ${agent2Name}:
      
      Summary: ${review2.summary}
      
      Strengths:
      ${this._formatList(review2.strengths)}
      
      Weaknesses:
      ${this._formatList(review2.weaknesses)}
      
      Questions:
      ${this._formatList(review2.questions)}
      
      Rating: ${review2.rating}
      Confidence: ${review2.confidence}
      
      Evaluate these reviews based on the following criteria:
      1. Technical Correctness (1-10): Does the review accurately assess the paper's methods and claims?
      2. Depth of Analysis (1-10): Does the review provide insightful technical analysis?
      3. Constructive Feedback (1-10): Does the review offer actionable suggestions?
      4. Clarity (1-10): Is the review well-structured and clearly written?
      5. Fairness (1-10): Does the review maintain objectivity and balance?
      
      For each criterion, provide a score for both reviews. Then determine which review is better overall or if they are equally good (a draw).
      
      Format your response exactly as follows:
      
      Technical Correctness:
      ${agent1Name}: [score]
      ${agent2Name}: [score]
      
      Depth of Analysis:
      ${agent1Name}: [score]
      ${agent2Name}: [score]
      
      Constructive Feedback:
      ${agent1Name}: [score]
      ${agent2Name}: [score]
      
      Clarity:
      ${agent1Name}: [score]
      ${agent2Name}: [score]
      
      Fairness:
      ${agent1Name}: [score]
      ${agent2Name}: [score]
      
      Winner: [${agent1Name}/${agent2Name}/draw]
      
      Reasoning:
      [Your reasoning for the winner determination]
    `;
  }

  /**
   * Format a list of items as bullet points
   * @private
   */
  _formatList(items) {
    return items.map(item => `- ${item}`).join('\n');
  }

  /**
   * Parse the evaluation text into a structured object
   * @private
   */
  _parseEvaluation(evaluationText, agent1Name, agent2Name) {
    const lines = evaluationText.trim().split('\n');
    
    const scores = {
      technical_correctness: { agent1: 0, agent2: 0 },
      depth_of_analysis: { agent1: 0, agent2: 0 },
      constructive_feedback: { agent1: 0, agent2: 0 },
      clarity: { agent1: 0, agent2: 0 },
      fairness: { agent1: 0, agent2: 0 }
    };
    
    let winner = null;
    let reasoning = '';
    
    let currentSection = null;
    let reasoningStarted = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;
      
      if (trimmedLine.toLowerCase().startsWith('technical correctness:')) {
        currentSection = 'technical_correctness';
      } else if (trimmedLine.toLowerCase().startsWith('depth of analysis:')) {
        currentSection = 'depth_of_analysis';
      } else if (trimmedLine.toLowerCase().startsWith('constructive feedback:')) {
        currentSection = 'constructive_feedback';
      } else if (trimmedLine.toLowerCase().startsWith('clarity:')) {
        currentSection = 'clarity';
      } else if (trimmedLine.toLowerCase().startsWith('fairness:')) {
        currentSection = 'fairness';
      } else if (trimmedLine.toLowerCase().startsWith('winner:')) {
        const winnerText = trimmedLine.substring(7).trim().toLowerCase();
        if (winnerText.includes(agent1Name.toLowerCase())) {
          winner = agent1Name;
        } else if (winnerText.includes(agent2Name.toLowerCase())) {
          winner = agent2Name;
        } else {
          winner = null; // Draw
        }
      } else if (trimmedLine.toLowerCase().startsWith('reasoning:')) {
        reasoningStarted = true;
        reasoning = trimmedLine.substring(10).trim();
      } else if (reasoningStarted) {
        reasoning += ' ' + trimmedLine;
      } else if (currentSection) {
        // Parse scores for current section
        if (trimmedLine.includes(agent1Name + ':')) {
          try {
            const scoreStr = trimmedLine.split(':')[1].trim();
            const score = parseInt(scoreStr, 10);
            if (!isNaN(score)) {
              scores[currentSection].agent1 = score;
            }
          } catch (error) {
            // Skip invalid score format
          }
        } else if (trimmedLine.includes(agent2Name + ':')) {
          try {
            const scoreStr = trimmedLine.split(':')[1].trim();
            const score = parseInt(scoreStr, 10);
            if (!isNaN(score)) {
              scores[currentSection].agent2 = score;
            }
          } catch (error) {
            // Skip invalid score format
          }
        }
      }
    }
    
    return {
      winner,
      reasoning,
      scores
    };
  }
}

module.exports = EvaluationJudge;