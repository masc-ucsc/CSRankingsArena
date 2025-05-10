// client/src/config.js

// Debug current environment
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Available env variables:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_USE_MOCK_DATA: process.env.REACT_APP_USE_MOCK_DATA
});

/**
 * Application configuration object with environment-specific settings
 * 
 * @property {string} apiUrl - Base URL for API requests
 * @property {boolean} useMockData - Flag to use mock data instead of real API
 * @property {string} mockDataPath - Path to mock data files
 * @property {number} apiTimeout - Timeout in ms for API requests
 * @property {boolean} debug - Enable verbose debug logging
 */
const config = {
  // Development environment configuration
  development: {
    // API URL - prioritize environment variable, fall back to localhost
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    
    // Mock data configuration - control with environment variable or default to false
    useMockData: process.env.REACT_APP_USE_MOCK_DATA === 'true' || false,
    mockDataPath: '/mock-data',
    
    // Network settings
    apiTimeout: 10000, // 10 seconds
    
    // Debug settings
    debug: true,
    logRequests: true,
    logResponses: true
  },
  
  // Test environment configuration
  test: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    useMockData: true, // Always use mock data in test environment
    mockDataPath: '/mock-data',
    apiTimeout: 5000,
    debug: true,
    logRequests: true,
    logResponses: true
  },
  
  // Production environment configuration
  production: {
    apiUrl: process.env.REACT_APP_API_URL || '/api', // Relative path for production
    useMockData: false, // Never use mock data in production
    apiTimeout: 15000, // Longer timeout for production
    debug: false,
    logRequests: false, 
    logResponses: false
  }
};

// Get configuration for current environment
const currentEnv = process.env.NODE_ENV || 'development';
const currentConfig = config[currentEnv];

// Log selected configuration
console.log(`Using ${currentEnv} configuration:`, currentConfig);

// Check for critical configuration issues
if (!currentConfig.apiUrl) {
  console.error('WARNING: API URL is not defined in configuration!');
}

if (currentConfig.useMockData) {
  console.warn('NOTICE: Using mock data instead of real API calls');
}

export default currentConfig;