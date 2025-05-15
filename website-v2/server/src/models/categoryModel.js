'use strict';

const db = require('../config/db');

// Get all categories with subcategories and arXiv categories
const getAllCategories = async () => {
  const query = `
    SELECT 
      c.id, c.name, c.slug, c.description, c.color, c.arxiv_categories,
      s.id as subcategory_id, s.name as subcategory_name, s.slug as subcategory_slug, 
      s.description as subcategory_description
    FROM categories c
    LEFT JOIN subcategories s ON c.id = s.category_id
    GROUP BY c.id, c.name, c.slug, c.description, c.color, c.arxiv_categories, s.id, s.name, s.slug, s.description
    ORDER BY c.name, s.name
  `;
  
  try {
    const result = await db.query(query);
    
    // Transform the flat result into a nested structure
    const categoriesMap = new Map();
    
    result.rows.forEach(row => {
      if (!categoriesMap.has(row.id)) {
        categoriesMap.set(row.id, {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          color: row.color,
          arxivCategories: row.arxiv_categories || [],
          subcategories: []
        });
      }
      
      // Add subcategory if it exists
      if (row.subcategory_id) {
        const category = categoriesMap.get(row.id);
        
        // Check if this subcategory is already added
        const existingSubIndex = category.subcategories.findIndex(sub => sub.id === row.subcategory_id);
        
        if (existingSubIndex === -1) {
          category.subcategories.push({
            id: row.subcategory_id,
            name: row.subcategory_name,
            slug: row.subcategory_slug,
            description: row.subcategory_description
          });
        }
      }
    });
    
    return Array.from(categoriesMap.values());
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Get a single category by slug
const getCategoryBySlug = async (slug) => {
  const query = `
    SELECT 
      c.id, c.name, c.slug, c.description, c.color, c.arxiv_categories,
      s.id as subcategory_id, s.name as subcategory_name, s.slug as subcategory_slug, 
      s.description as subcategory_description
    FROM categories c
    LEFT JOIN subcategories s ON c.id = s.category_id
    WHERE c.slug = $1
    GROUP BY c.id, c.name, c.slug, c.description, c.color, c.arxiv_categories, s.id, s.name, s.slug, s.description
    ORDER BY s.name
  `;
  
  try {
    const result = await db.query(query, [slug]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Transform the flat result into a nested structure
    const category = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      slug: result.rows[0].slug,
      description: result.rows[0].description,
      color: result.rows[0].color,
      arxivCategories: result.rows[0].arxiv_categories || [],
      subcategories: []
    };
    
    // Add subcategories
    result.rows.forEach(row => {
      if (row.subcategory_id) {
        // Check if this subcategory is already added
        const existingSubIndex = category.subcategories.findIndex(sub => sub.id === row.subcategory_id);
        
        if (existingSubIndex === -1) {
          category.subcategories.push({
            id: row.subcategory_id,
            name: row.subcategory_name,
            slug: row.subcategory_slug,
            description: row.subcategory_description
          });
        }
      }
    });
    
    return category;
  } catch (error) {
    console.error(`Error fetching category with slug ${slug}:`, error);
    throw error;
  }
};

module.exports = {
  getAllCategories,
  getCategoryBySlug
};