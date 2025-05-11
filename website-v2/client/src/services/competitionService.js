import axios from 'axios';

const API_BASE_URL = '/api/competition';

export const competitionService = {
    // Match creation and retrieval
    async createMatch(matchData) {
        const response = await axios.post(`${API_BASE_URL}/matches`, matchData);
        return response.data;
    },

    async getMatch(matchId) {
        const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
        return response.data;
    },

    // Feedback operations
    async submitFeedback(matchId, feedback) {
        const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/feedback`, {
            feedback
        });
        return response.data;
    },

    async getMatchFeedback(matchId) {
        const response = await axios.get(`${API_BASE_URL}/matches/${matchId}/feedback`);
        return response.data;
    },

    async getAgentStats(agentId) {
        const response = await axios.get(`${API_BASE_URL}/agents/${agentId}/feedback-stats`);
        return response.data;
    },

    // Agent operations
    async getAgents() {
        const response = await axios.get(`${API_BASE_URL}/agents`);
        return response.data;
    },

    // Leaderboard
    async getLeaderboard(limit = 10) {
        const response = await axios.get(`${API_BASE_URL}/leaderboard`, {
            params: { limit }
        });
        return response.data;
    }
};

export const addFeedback = async (feedbackData) => {
    try {
        const response = await axios.post('/api/feedback', feedbackData);
        return response.data;
    } catch (error) {
        console.error('Error adding feedback:', error);
        throw error;
    }
};

export const likeFeedback = async (feedbackId, matchId, liked) => {
    try {
        const response = await axios.post(`/api/feedback/${feedbackId}/like`, {
            matchId,
            liked
        });
        return response.data;
    } catch (error) {
        console.error('Error liking feedback:', error);
        throw error;
    }
}; 