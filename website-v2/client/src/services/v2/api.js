import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v2' || process.env.REACT_APP_API_URL;
console.log('API_BASE_URL:', API_BASE_URL);

// Papers API
export const fetchPapers = async (category, subcategory, year) => {
  try {
    console.log('Fetching papers for:', { category, subcategory, year });
    console.log('Search path:', `${API_BASE_URL}/papers/${category}/${subcategory}`);
    const response = await axios.get(`${API_BASE_URL}/papers/${category}/${subcategory}`, {
      params: { year }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching papers:', error);
    throw error;
  }
};

export const fetchPaperById = async (paperId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/papers/${paperId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching paper details:', error);
    throw error;
  }
};

export const fetchVenues = async (category, subcategory, year) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/papers/${category}/${subcategory}/venues`, {
      params: { year }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching venues:', error);
    throw error;
  }
};

// Matches API
export const createMatch = async (matchData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/matches`, matchData);
    return response.data;
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
};

export const fetchMatchDetails = async (matchId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching match details:', error);
    throw error;
  }
};

export const fetchRecentMatches = async (category, subcategory, limit = 5) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/matches`, {
      params: { category, subcategory, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent matches:', error);
    throw error;
  }
};

export const submitMatchFeedback = async (matchId, feedback) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/feedback`, feedback);
    return response.data;
  } catch (error) {
    console.error('Error submitting match feedback:', error);
    throw error;
  }
};

// Feedback API functions
export const fetchMatchFeedback = async (matchId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/matches/${matchId}/feedback`);
    return response.data;
  } catch (error) {
    console.error('Error fetching match feedback:', error);
    throw error;
  }
};

export const submitMatchComment = async (matchId, comment) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/comments`, comment);
    return response.data;
  } catch (error) {
    console.error('Error submitting match comment:', error);
    throw error;
  }
}; 

// Agents API
export const fetchAgents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/agents`);
    return response.data;
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
}; 