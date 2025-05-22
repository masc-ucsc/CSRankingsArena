// client/src/services/api.js

import axios from 'axios';
import config from '../config';
import * as mockApi from './mockApi'; // Import mock API service

// Debug log helper - only logs when debug is enabled
const debugLog = (message, data) => {
  if (config.debug) {
    console.log(`🔍 [API] ${message}`, data);
  }
};

// Error log helper - always logs errors
const errorLog = (message, error) => {
  console.error(`❌ [API] ${message}`, error);
  
  // Enhanced error logging
  if (error.response) {
    console.error(`Response status: ${error.response.status}`);
    console.error('Response data:', error.response.data);
  } else if (error.request) {
    console.error('No response received', {
      url: error.config?.url,
      method: error.config?.method
    });
  } else {
    console.error(`Error message: ${error.message}`);
  }
  
  // Check for specific error types
  if (error.code === 'ECONNABORTED') {
    console.error(`Request timed out after ${config.apiTimeout}ms`);
  } else if (error.message?.includes('Network Error')) {
    console.error('Network error - server may be unreachable');
  }
};

// Debug logging info about API setup
debugLog('Initializing API service with config:', {
  apiUrl: config.apiUrl, 
  timeout: config.apiTimeout,
  useMockData: config.useMockData
});



// Create axios instance with configuration
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('api', api);

// Request interceptor for logging and debugging
api.interceptors.request.use(
  (requestConfig) => {
    if (config.logRequests) {
      debugLog(`📤 Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`, {
        params: requestConfig.params,
        data: requestConfig.data
      });
    }
    
    // Add timestamp for latency tracking
    requestConfig.metadata = { startTime: new Date() };
    return requestConfig;
  },
  (error) => {
    errorLog('Request setup error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and debugging
api.interceptors.response.use(
  (response) => {
    if (config.logResponses) {
      // Calculate request duration
      const startTime = response.config.metadata?.startTime;
      const endTime = new Date();
      const duration = startTime ? endTime - startTime : 0;
      
      debugLog(`📥 Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        duration: `${duration}ms`,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    errorLog('Response error:', error);
    return Promise.reject(error);
  }
);

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip auth redirect for feedback endpoints
    if (error.response?.status === 401 && !error.config.url.includes('/feedback')) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      // Store current location for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = encodeURIComponent(currentPath);
      const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v2';
      window.location.href = `${serverUrl}/auth/github?redirect=${redirectUrl}`;
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch all categories with their subcategories
 * @returns {Promise<Array>} List of categories with subcategories
 */
export const fetchCategories = async () => {
  try {
    // Check if using mock data
    if (config.useMockData) {
      debugLog('Using mock data for categories');
      return mockApi.fetchCategories();
    }
    
    debugLog('Fetching categories');
    const response = await api.get('/v2/categories');
    return response.data;
  } catch (error) {
    errorLog('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Fetch papers for a specific subcategory and year
 * @param {string} categorySlug - Category slug
 * @param {string} subcategorySlug - Subcategory slug
 * @param {number} year - Publication year
 * @returns {Promise<Array>} List of papers
 */
export const fetchPapers = async (categorySlug, subcategorySlug, year) => {
  try {
    // Check if using mock data
    if (config.useMockData) {
      debugLog('Using mock data for papers');
      return mockApi.fetchPapers(categorySlug, subcategorySlug, year);
    }
    
    debugger; // Breakpoint for debugging
    debugLog('Fetching papers', { categorySlug, subcategorySlug, year });
    const response = await api.get('/papers', {
      params: {
        category: categorySlug,
        subcategory: subcategorySlug,
        year,
      },
    });
    debugger; // Breakpoint for debugging
    return response.data;
  } catch (error) {
    debugger; // Breakpoint for debugging on error
    errorLog('Error fetching papers:', error);
    throw error;
  }
};

/**
 * Search papers based on query and filters
 * @param {string} query - Search query
 * @param {Object} filters - Additional search filters
 * @returns {Promise<Object>} Search results with pagination
 */
export const searchPapers = async (query, filters = {}) => {
  try {
    const { type = 'all', category, year, page = 1, limit = 20 } = filters;
    const params = new URLSearchParams({
      q: query,
      type,
      page,
      limit
    });

    if (category) params.append('category', category);
    if (year) params.append('year', year);

    const response = await api.get('/v2/papers/search', {
      params: {
        q: query,
        ...filters,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching papers:', error);
    throw error;
  }
};

// Agentic APIs

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

export const getMatches = async (params = {}) => {
  return await api.get('/matches', { params });
};

export const getMatch = async (id) => {
  return await api.get(`/v2/matches/${id}`);
};

// export const getMatchReviews = async (id) => {
//   return await api.get(`/matches/${id}/reviews`);
// };

// export const getMatchEvaluation = async (id) => {
//   return await api.get(`/matches/${id}/evaluation`);
// };

// export const runMatch = async (id) => {
//   return await api.post(`/matches/run/${id}`);
// };

// export const generateMatches = async (data) => {
//   return await api.post('/matches/generate', data);
// };

// export const runPendingMatches = async (data) => {
//   return await api.post('/matches/run-pending', data);
// };

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

// Match feedback endpoints
export const submitMatchFeedback = async (matchId, feedback) => {
  try {
    const response = await api.post(`/v2/matches/${matchId}/feedback`, feedback);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to submit feedback'
    };
  }
};

export const getMatchFeedback = async (matchId) => {
  try {
    const response = await api.get(`/v2/matches/${matchId}/feedback`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching match feedback:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch feedback'
    };
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get('/v2/auth/profile');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch profile'
    };
  }
};

/**
 * Test API connectivity
 * @returns {Promise<Object>} Connection test results
 */
export const testApiConnection = async () => {
  try {
    // Skip test if using mock data
    if (config.useMockData) {
      return {
        success: true,
        mock: true,
        message: 'Using mock data, no real API connection test performed'
      };
    }
    
    debugLog('Testing API connection');
    const startTime = new Date();
    // Use the v2 health endpoint since we're using the Hapi server
    const response = await api.get('/v2/health');
    const endTime = new Date();
    const duration = endTime - startTime;
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      latency: `${duration}ms`,
      url: `${config.apiUrl}/v2/health`,
      config: {
        apiUrl: config.apiUrl,
        timeout: config.apiTimeout,
        useMockData: config.useMockData
      }
    };
  } catch (error) {
    errorLog('API connection test failed:', error);
    
    // Enhanced error details
    const errorDetails = {
      success: false,
      error: error.message,
      url: `${config.apiUrl}/v2/health`,
      config: {
        apiUrl: config.apiUrl,
        timeout: config.apiTimeout,
        useMockData: config.useMockData
      }
    };

    if (error.response) {
      errorDetails.details = {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };
    } else if (error.request) {
      errorDetails.details = {
        type: 'no_response',
        message: 'No response received from server',
        request: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      };
    } else {
      errorDetails.details = {
        type: 'request_error',
        message: error.message
      };
    }

    return errorDetails;
  }
};

/**
 * Get paper suggestions based on search type and query
 * @param {string} query - Search query
 * @param {string} type - Search type (title or author)
 * @returns {Promise<Array>} List of suggestions
 */
export const getPaperSuggestions = async (query, type = 'title') => {
  try {
    const response = await api.get('/papers/suggestions', {
      params: {
        q: query,
        type
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching paper suggestions:', error);
    return [];
  }
};

export default api;