const { Pool } = require('pg');
const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const config = require('../config');
const db = require('../config/db');
const axios = require('axios');

const pool = new Pool(config.db);

class AgentService {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    async getAgent(agentId) {
        const query = 'SELECT * FROM agents WHERE id = $1';
        const result = await pool.query(query, [agentId]);
        return result.rows[0];
    }

    async getAllAgents() {
        const query = 'SELECT * FROM agents WHERE is_active = true';
        const result = await pool.query(query);
        return result.rows;
    }

    async createAgent(name, modelType, provider, description) {
        const query = `
            INSERT INTO agents (name, model_type, provider, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [name, modelType, provider, description]);
        return result.rows[0];
    }

    async generateReview(agentId, paperContent) {
        const agent = await this.getAgent(agentId);
        if (!agent) throw new Error('Agent not found');

        const prompt = this._createReviewPrompt(paperContent);
        let review;

        try {
            switch (agent.provider.toLowerCase()) {
                case 'openai':
                    review = await this._generateOpenAIReview(agent.modelType, prompt);
                    break;
                case 'anthropic':
                    review = await this._generateAnthropicReview(agent.modelType, prompt);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${agent.provider}`);
            }
            return review;
        } catch (error) {
            console.error(`Error generating review for agent ${agentId}:`, error);
            throw error;
        }
    }

    async evaluateReview(judgeId, review, paperContent) {
        const judge = await this.getAgent(judgeId);
        if (!judge) throw new Error('Judge agent not found');

        const prompt = this._createEvaluationPrompt(review, paperContent);
        let evaluation;

        try {
            switch (judge.provider.toLowerCase()) {
                case 'openai':
                    evaluation = await this._generateOpenAIEvaluation(judge.modelType, prompt);
                    break;
                case 'anthropic':
                    evaluation = await this._generateAnthropicEvaluation(judge.modelType, prompt);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${judge.provider}`);
            }
            return this._parseEvaluationScores(evaluation);
        } catch (error) {
            console.error(`Error evaluating review with judge ${judgeId}:`, error);
            throw error;
        }
    }

    _createReviewPrompt(paperContent) {
        return `Please provide a detailed review of the following academic paper. 
        Focus on technical correctness, depth of analysis, quality of feedback, clarity, and fairness.
        Consider both strengths and areas for improvement.

        Paper content:
        ${paperContent}

        Please structure your review with the following sections:
        1. Technical Analysis
        2. Depth of Review
        3. Feedback Quality
        4. Clarity
        5. Fairness
        6. Overall Assessment`;
    }

    _createEvaluationPrompt(review, paperContent) {
        return `As an expert judge, please evaluate the following paper review on a scale of 0-5 for each criterion.
        Provide numerical scores and brief justifications.

        Paper content:
        ${paperContent}

        Review to evaluate:
        ${review}

        Please evaluate the following aspects:
        1. Technical Correctness (0-5)
        2. Depth of Analysis (0-5)
        3. Feedback Quality (0-5)
        4. Clarity (0-5)
        5. Fairness (0-5)
        6. Overall Score (0-5)

        Format your response as JSON with scores and justifications.`;
    }

    async _generateOpenAIReview(model, prompt) {
        const response = await this.openai.chat.completions.create({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000
        });
        return response.choices[0].message.content;
    }

    async _generateAnthropicReview(model, prompt) {
        const response = await this.anthropic.messages.create({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000
        });
        return response.content[0].text;
    }

    async _generateOpenAIEvaluation(model, prompt) {
        const response = await this.openai.chat.completions.create({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1000
        });
        return response.choices[0].message.content;
    }

    async _generateAnthropicEvaluation(model, prompt) {
        const response = await this.anthropic.messages.create({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000
        });
        return response.content[0].text;
    }

    _parseEvaluationScores(evaluation) {
        try {
            const scores = JSON.parse(evaluation);
            return {
                technical_score: parseFloat(scores['Technical Correctness']),
                depth_score: parseFloat(scores['Depth of Analysis']),
                feedback_score: parseFloat(scores['Feedback Quality']),
                clarity_score: parseFloat(scores['Clarity']),
                fairness_score: parseFloat(scores['Fairness']),
                overall_score: parseFloat(scores['Overall Score'])
            };
        } catch (error) {
            console.error('Error parsing evaluation scores:', error);
            throw new Error('Invalid evaluation format');
        }
    }

    async checkAgentAvailability(agent) {
        try {
            // For OpenAI agents
            if (agent.provider === 'openai') {
                const response = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: agent.model,
                        messages: [{ role: 'user', content: 'ping' }],
                        max_tokens: 1
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${config.openai.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 5000 // 5 second timeout
                    }
                );
                return response.status === 200;
            }
            
            // For Anthropic agents
            if (agent.provider === 'anthropic') {
                const response = await axios.post(
                    'https://api.anthropic.com/v1/messages',
                    {
                        model: agent.model,
                        messages: [{ role: 'user', content: 'ping' }],
                        max_tokens: 1
                    },
                    {
                        headers: {
                            'x-api-key': config.anthropic.apiKey,
                            'anthropic-version': '2023-06-01',
                            'Content-Type': 'application/json'
                        },
                        timeout: 5000
                    }
                );
                return response.status === 200;
            }

            // For other providers, assume available if agent exists
            return true;
        } catch (error) {
            console.error(`Error checking availability for agent ${agent.id}:`, error);
            return false;
        }
    }
}

module.exports = new AgentService(); 