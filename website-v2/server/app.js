const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Load environment variables
require('dotenv').config();

// Import routes
const paperRoutes = require('./routes/papers');
const categoryRoutes = require('./routes/categories');
const v2PaperRoutes = require('./src/routes/v2/papers');
const v2MatchRoutes = require('./src/routes/v2/matches');

// Initialize Express app
const app = express();

// Middleware
// More permissive CORS configuration

// In app.js
if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode with relaxed security');
  app.use(cors({ origin: '*' }));
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
} else {
  // Production security settings
  app.use(cors({ origin: ['https://your-app.com'] }));
  app.use(helmet());
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));


// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', apiLimiter);

// Routes
app.use('/api/papers', paperRoutes);
app.use('/api/categories', categoryRoutes);

// V2 Routes
app.use('/api/v2/papers', v2PaperRoutes);
app.use('/api/v2/matches', v2MatchRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Not found route
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

module.exports = app;
	