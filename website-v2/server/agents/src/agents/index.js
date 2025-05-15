// src/agents/index.js
const OpenAIReviewAgent = require('./openai-agent');
const AnthropicReviewAgent = require('./anthropic-agent');
const config = require('../agents/config');

/**
 * Factory function to create agent instances
 * @param {Array} agentConfigs - Agent configuration objects
 * @returns {Array} Array of agent instances
 */
function createAgents(agentConfigs = []) {
  // If no configs provided, use defaults from config
  if (!agentConfigs || agentConfigs.length === 0) {
    agentConfigs = config.agents;
  }
  
  return agentConfigs.map(agentConfig => {
    if (agentConfig.provider === 'openai') {
      return new OpenAIReviewAgent(
        agentConfig.name,
        agentConfig.model,
        agentConfig.options
      );
    } else if (agentConfig.provider === 'anthropic') {
      return new AnthropicReviewAgent(
        agentConfig.name,
        agentConfig.model, 
        agentConfig.options
      );
    } else {
      throw new Error(`Unknown agent provider: ${agentConfig.provider}`);
    }
  });
}

module.exports = {
  OpenAIReviewAgent,
  AnthropicReviewAgent,
  createAgents
};