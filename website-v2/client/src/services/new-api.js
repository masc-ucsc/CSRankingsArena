// src/services/api.js
import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle API errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login page if needed
      localStorage.removeItem('token');
      
      // If we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Extract error message
    const message = 
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      'An unexpected error occurred';
      
    return Promise.reject({ message });
  }
);

// Agent endpoints
export const getAgents = async () => {
  return await api.get('/agents');
};

export const getAgent = async (id) => {
  return await api.get(`/agents/${id}`);
};

export const getAgentMatches = async (id, params = {}) => {
  return await api.get(`/agents/${id}/matches`, { params });
};

export const getAgentPerformance = async (id) => {
  return await api.get(`/agents/${id}/performance`);
};

export const getAgentComparison = async (agentIds) => {
  if (!Array.isArray(agentIds)) {
    throw new Error('agentIds must be an array');
  }
  
  return await api.get(`/agents/stats`, { 
    params: { agents: agentIds.join(',') } 
  });
};

// Match endpoints
export const getMatches = async (params = {}) => {
  return await api.get('/matches', { params });
};

export const getMatch = async (id) => {
  return await api.get(`/matches/${id}`);
};

export const getMatchReviews = async (id) => {
  return await api.get(`/matches/${id}/reviews`);
};

export const getMatchEvaluation = async (id) => {
  return await api.get(`/matches/${id}/evaluation`);
};

export const runMatch = async (id) => {
  return await api.post(`/matches/run/${id}`);
};

export const generateMatches = async (data) => {
  return await api.post('/matches/generate', data);
};

export const runPendingMatches = async (data) => {
  return await api.post('/matches/run-pending', data);
};

// Leaderboard endpoint
export const getLeaderboard = async () => {
  return await api.get('/leaderboard');
};

// Papers endpoints
export const getPapers = async (params = {}) => {
  return await api.get('/papers', { params });
};

export const getPaper = async (id) => {
  return await api.get(`/papers/${id}`);
};

export const getPapersByTopic = async (topic, params = {}) => {
  return await api.get(`/papers/topic/${topic}`, { params });
};

export const getPaperMatches = async (id, params = {}) => {
  return await api.get(`/papers/${id}/matches`, { params });
};

// Feedback endpoints
export const getFeedback = async (matchId) => {
  return await api.get(`/feedback/${matchId}`);
};

export const addFeedback = async (data) => {
  return await api.post('/feedback', data);
};

export const likeFeedback = async (id) => {
  return await api.post(`/feedback/${id}/like`);
};

// Auth endpoints
export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  // Store token
  if (response.token) {
    localStorage.setItem('token', response.token);
  }
  return response;
};

export const login = async (data) => {
  const response = await api.post('/auth/login', data);
  // Store token
  if (response.token) {
    localStorage.setItem('token', response.token);
  }
  return response;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getProfile = async () => {
  return await api.get('/auth/profile');
};

// Dashboard analytics
export const getDashboardStats = async () => {
  // This is a helper function that combines multiple API calls for the dashboard
  try {
    const [leaderboardData, matchesData, papersData] = await Promise.all([
      getLeaderboard(),
      getMatches({ limit: 5 }),
      getPapers({ limit: 0 }) // Just get the counts
    ]);
    
    // Calculate top agent
    const topAgent = leaderboardData.leaderboard && leaderboardData.leaderboard.length > 0
      ? leaderboardData.leaderboard[0]
      : null;
    
    // Calculate match stats
    const completedMatches = matchesData.matches
      ? matchesData.matches.filter(m => m.status === 'completed').length
      : 0;
    
    const pendingMatches = matchesData.matches
      ? matchesData.matches.filter(m => m.status === 'pending').length
      : 0;
    
    return {
      agents: leaderboardData.leaderboard || [],
      matches: matchesData.matches || [],
      totalPapers: papersData.pagination?.total || 0,
      totalAgents: (leaderboardData.leaderboard || []).length,
      totalMatches: matchesData.pagination?.total || 0,
      completedMatches,
      pendingMatches,
      topAgent,
      papersByTopic: papersData.papersByTopic || {}
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Tournament endpoints
export const getTournaments = async (params = {}) => {
  return await api.get('/tournaments', { params });
};

export const getTournament = async (id) => {
  return await api.get(`/tournaments/${id}`);
};

export const getTournamentMatches = async (id, params = {}) => {
  return await api.get(`/tournaments/${id}/matches`, { params });
};

export const createTournament = async (data) => {
  return await api.post('/tournaments', data);
};

export const updateTournament = async (id, data) => {
  return await api.put(`/tournaments/${id}`, data);
};

export const deleteTournament = async (id) => {
  return await api.delete(`/tournaments/${id}`);
};

// Admin functions
export const AdminAPI = {
  // Agent management
  createAgent: async (data) => {
    return await api.post('/admin/agents', data);
  },
  
  updateAgent: async (id, data) => {
    return await api.put(`/admin/agents/${id}`, data);
  },
  
  deleteAgent: async (id) => {
    return await api.delete(`/admin/agents/${id}`);
  },
  
  // Match management
  generateMatches: async (options) => {
    return await api.post('/matches/generate', options);
  },
  
  runMatch: async (id) => {
    return await api.post(`/matches/run/${id}`);
  },
  
  runPendingMatches: async (limit = 5) => {
    return await api.post('/matches/run-pending', { limit });
  },
  
  // Paper management
  importPapers: async (data) => {
    return await api.post('/admin/papers/import', data);
  },
  
  // Tournament management
  createTournament: async (data) => {
    return await api.post('/tournaments', data);
  },
  
  updateTournamentStatus: async (id, status) => {
    return await api.put(`/tournaments/${id}/status`, { status });
  },
  
  // System configuration
  getSystemSettings: async () => {
    return await api.get('/admin/settings');
  },
  
  updateSystemSettings: async (data) => {
    return await api.put('/admin/settings', data);
  }
};

// Paper Network Analysis
export const getPaperNetwork = async (params = {}) => {
  return await api.get('/papers/network', { params });
};

export const getPaperRecommendations = async (id) => {
  return await api.get(`/papers/${id}/recommendations`);
};

// Research Insights
export const getResearchTrends = async (params = {}) => {
  return await api.get('/insights/trends', { params });
};

export const getTopConcepts = async (params = {}) => {
  return await api.get('/insights/concepts', { params });
};

export const getTrendingPapers = async (params = {}) => {
  return await api.get('/insights/trending', { params });
};

// Learning API
export const getLearningResources = async (topic) => {
  return await api.get('/learning/resources', { params: { topic } });
};

export const getLearningPathway = async (topicId) => {
  return await api.get(`/learning/pathways/${topicId}`);
};

// Mock data (for development without backend)
export const getMockData = () => {
  return {
    agents: [
      {
        id: 1,
        name: 'GPT-4 Reviewer',
        model: 'gpt-4-turbo-preview',
        provider: 'openai',
        matches_played: 25,
        matches_won: 18,
        matches_drawn: 4,
        matches_lost: 3,
        points: 58,
        win_percentage: 72.0,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Claude 3 Opus Reviewer',
        model: 'claude-3-opus-20240229',
        provider: 'anthropic',
        matches_played: 25,
        matches_won: 15,
        matches_drawn: 6,
        matches_lost: 4,
        points: 51,
        win_percentage: 60.0,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: 'GPT-3.5 Reviewer',
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        matches_played: 25,
        matches_won: 8,
        matches_drawn: 5,
        matches_lost: 12,
        points: 29,
        win_percentage: 32.0,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 4,
        name: 'Claude 3 Sonnet Reviewer',
        model: 'claude-3-sonnet-20240229',
        provider: 'anthropic',
        matches_played: 25,
        matches_won: 9,
        matches_drawn: 3,
        matches_lost: 13,
        points: 30,
        win_percentage: 36.0,
        created_at: '2024-01-01T00:00:00Z'
      }
    ],
    matches: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        paper_id: 1,
        paper_title: 'Transformer Architecture Optimization for Low-Latency Inference',
        paper_topic: 'Architecture',
        agent1_id: 1,
        agent1_name: 'GPT-4 Reviewer',
        agent2_id: 2,
        agent2_name: 'Claude 3 Opus Reviewer',
        status: 'completed',
        winner_id: 1,
        winner_name: 'GPT-4 Reviewer',
        created_at: '2024-05-01T14:30:00Z',
        completed_at: '2024-05-01T14:35:00Z'
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        paper_id: 2,
        paper_title: 'Neural Program Synthesis with Type-Guided Search',
        paper_topic: 'Programming',
        agent1_id: 1,
        agent1_name: 'GPT-4 Reviewer',
        agent2_id: 3,
        agent2_name: 'GPT-3.5 Reviewer',
        status: 'completed',
        winner_id: 1,
        winner_name: 'GPT-4 Reviewer',
        created_at: '2024-05-02T10:15:00Z',
        completed_at: '2024-05-02T10:20:00Z'
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        paper_id: 3,
        paper_title: 'Multi-Agent Reinforcement Learning for Distributed Systems Management',
        paper_topic: 'AI',
        agent1_id: 2,
        agent1_name: 'Claude 3 Opus Reviewer',
        agent2_id: 3,
        agent2_name: 'GPT-3.5 Reviewer',
        status: 'completed',
        winner_id: 2,
        winner_name: 'Claude 3 Opus Reviewer',
        created_at: '2024-05-03T09:45:00Z',
        completed_at: '2024-05-03T09:50:00Z'
      },
      {
        id: '423e4567-e89b-12d3-a456-426614174003',
        paper_id: 4,
        paper_title: 'Hardware-Aware Neural Architecture Search',
        paper_topic: 'Architecture',
        agent1_id: 3,
        agent1_name: 'GPT-3.5 Reviewer',
        agent2_id: 4,
        agent2_name: 'Claude 3 Sonnet Reviewer',
        status: 'completed',
        winner_id: 4,
        winner_name: 'Claude 3 Sonnet Reviewer',
        created_at: '2024-05-04T16:20:00Z',
        completed_at: '2024-05-04T16:25:00Z'
      },
      {
        id: '523e4567-e89b-12d3-a456-426614174004',
        paper_id: 5,
        paper_title: 'Explainable Artificial Intelligence: Concepts, Applications, and Challenges',
        paper_topic: 'AI',
        agent1_id: 1,
        agent1_name: 'GPT-4 Reviewer',
        agent2_id: 4,
        agent2_name: 'Claude 3 Sonnet Reviewer',
        status: 'pending',
        created_at: '2024-05-05T11:30:00Z'
      }
    ],
    papers: {
      data: [
        {
          id: 1,
          title: 'Transformer Architecture Optimization for Low-Latency Inference',
          abstract: 'We present a novel approach to optimize transformer architectures for low-latency inference on specialized hardware. Our method reduces computational requirements while maintaining model accuracy.',
          authors: 'Jane Smith, John Doe',
          main_topic: 'Architecture',
          created_at: '2024-01-15T00:00:00Z'
        },
        {
          id: 2,
          title: 'Neural Program Synthesis with Type-Guided Search',
          abstract: 'This paper introduces a neural program synthesis approach that leverages type information to guide the search process. We demonstrate significant improvements in synthesis accuracy and efficiency.',
          authors: 'Alex Johnson, Maria Garcia',
          main_topic: 'Programming',
          created_at: '2024-02-10T00:00:00Z'
        },
        {
          id: 3,
          title: 'Multi-Agent Reinforcement Learning for Distributed Systems Management',
          abstract: 'We propose a multi-agent reinforcement learning framework for managing complex distributed systems. Our approach coordinates multiple learning agents to optimize system performance under varying workloads and failure conditions.',
          authors: 'Wei Zhang, Sophia Lee, David Brown',
          main_topic: 'AI',
          created_at: '2024-03-05T00:00:00Z'
        },
        {
          id: 4,
          title: 'Hardware-Aware Neural Architecture Search',
          abstract: 'This paper presents a hardware-aware neural architecture search framework that jointly optimizes model accuracy and hardware efficiency. We demonstrate our approach on edge devices with constrained resources.',
          authors: 'Michael Chen, Emily Wilson',
          main_topic: 'Architecture',
          created_at: '2024-03-22T00:00:00Z'
        },
        {
          id: 5,
          title: 'Explainable Artificial Intelligence: Concepts, Applications, and Challenges',
          abstract: 'We provide a comprehensive survey of explainable artificial intelligence (XAI) methods, applications, and challenges. We analyze the trade-offs between model performance and explainability across different domains.',
          authors: 'Sarah Miller, James Wilson, Robert Johnson',
          main_topic: 'AI',
          created_at: '2024-04-18T00:00:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1
      },
      papersByTopic: {
        'Architecture': 2,
        'Programming': 1,
        'AI': 2
      }
    }
  };
};

export default {
  getAgents,
  getAgent,
  getAgentMatches,
  getAgentPerformance,
  getAgentComparison,
  getMatches,
  getMatch,
  getMatchReviews,
  getMatchEvaluation,
  runMatch,
  generateMatches,
  runPendingMatches,
  getLeaderboard,
  getPapers,
  getPaper,
  getPapersByTopic,
  getPaperMatches,
  getFeedback,
  addFeedback,
  likeFeedback,
  register,
  login,
  logout,
  getProfile,
  getDashboardStats,
  getTournaments,
  getTournament,
  getTournamentMatches,
  createTournament,
  updateTournament,
  deleteTournament,
  getPaperNetwork,
  getPaperRecommendations,
  getResearchTrends,
  getTopConcepts,
  getTrendingPapers,
  getLearningResources,
  getLearningPathway,
  AdminAPI,
  getMockData
};