'use strict';

const Boom = require('@hapi/boom');
const paperModel = require('../models/paperModel');
const categoryModel = require('../models/categoryModel');
const arxivService = require('../services/arxivService');

// Get papers by category, subcategory, and year
exports.getPapers = async (request, h) => {
  try {
    const { category: categorySlug, subcategory: subcategorySlug, year } = request.query;
    
    // Validate year
    const parsedYear = parseInt(year);
    if (isNaN(parsedYear)) {
      return Boom.badRequest('Invalid year parameter');
    }
    
    // Get arXiv categories
    const arxivCategories = await categoryModel.getArxivCategories(categorySlug, subcategorySlug);
    
    if (!arxivCategories || arxivCategories.length === 0) {
      return Boom.notFound(`No arXiv categories found for ${categorySlug}/${subcategorySlug}`);
    }
    
    // Search in database first
    let papers = await paperModel.getPapersByFilters(categorySlug, subcategorySlug, parsedYear);
    
    // If we don't have enough papers in the database, fetch from arXiv
    if (papers.length < 10) {
      try {
        // Fetch papers from arXiv
        const arxivPapers = await arxivService.fetchPapersByCategory(arxivCategories, parsedYear);
        
        // Save to database and get updated list
        if (arxivPapers && arxivPapers.length > 0) {
          // Save each paper to the database
          for (const paper of arxivPapers) {
            await paperModel.savePaper({
              ...paper,
              subcategories: [subcategorySlug]
            });
          }
          
          // Get the updated list of papers
          papers = await paperModel.getPapersByFilters(categorySlug, subcategorySlug, parsedYear);
        }
      } catch (arxivError) {
        console.error('Error fetching from arXiv:', arxivError);
        // Continue with papers from database, don't fail the request
      }
    }
    
    return h.response(papers);
  } catch (error) {
    console.error('Error getting papers:', error);
    return Boom.badImplementation('Failed to retrieve papers');
  }
};

// Search papers
exports.searchPapers = async (request, h) => {
  try {
    const { q, category, subcategory, year, page = 1, limit = 20 } = request.query;
    
    const filters = {
      category,
      subcategory,
      year: year ? parseInt(year) : undefined,
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const results = await paperModel.searchPapers(q, filters);
    
    return h.response(results);
  } catch (error) {
    console.error('Error searching papers:', error);
    return Boom.badImplementation('Failed to search papers');
  }
};