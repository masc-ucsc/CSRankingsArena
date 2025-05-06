/**
 * Paper Evaluation League - Backend Server
 * 
 * Main Express server file that sets up API routes and database connection.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

// Import route handlers
const paperRoutes = require('./src/routes/paperRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const resultRoutes = require('./src/routes/resultRoutes');
const leaderboardRoutes = require('./src/routes/leaderboardRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paper_evaluation';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// API routes
app.use('/api/papers', paperRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Paper Evaluation League API',
    version: '1.0.0',
    endpoints: [
      '/api/papers',
      '/api/matches',
      '/api/results',
      '/api/leaderboard',
      '/api/feedback'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;