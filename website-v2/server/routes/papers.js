const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');

// Get papers with filters
router.get('/', paperController.getPapers);

// Search papers
router.get('/search', paperController.searchPapers);

module.exports = router;