'use strict';

const Boom = require('@hapi/boom');
const categoryModel = require('../models/categoryModel');

// Get all categories
exports.getCategories = async (request, h) => {
  try {
    const categories = await categoryModel.getAllCategories();
    return h.response(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    return Boom.badImplementation('Failed to retrieve categories');
  }
};

// Get single category
exports.getCategory = async (request, h) => {
  try {
    const { slug } = request.params;
    
    const category = await categoryModel.getCategoryBySlug(slug);
    
    if (!category) {
      return Boom.notFound(`Category with slug "${slug}" not found`);
    }
    
    return h.response(category);
  } catch (error) {
    console.error(`Error getting category ${request.params.slug}:`, error);
    return Boom.badImplementation('Failed to retrieve category');
  }
};