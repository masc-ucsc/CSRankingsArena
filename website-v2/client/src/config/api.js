const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v2',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

export default API_CONFIG; 