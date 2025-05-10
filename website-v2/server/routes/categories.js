const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Get all categories
router.get('/', categoryController.getCategories);

// Get single category
router.get('/:slug', categoryController.getCategory);

module.exports = router;