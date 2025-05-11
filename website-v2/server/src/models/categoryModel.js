'use strict';

const db = require('../config/db');

// Get all categories with subcategories and arXiv categories
const getAllCategories = async () => {
  const query = `
    SELECT 
      c.id, c.name, c.slug, c.description, c.color,
      s.id as subcategory_id, s.name as subcategory_name, s.slug as subcategory_slug, 
      s.description as subcategory_description,
      array_agg(DISTINCT ac.name) as arxiv_categories
    FROM categories c
    LEFT JOIN subcategories s ON c.id = s.category_id
    LEFT JOIN arxiv_categories ac ON s.id = ac.subcategory_id
    GROUP BY c.id, c.name, c.slug, c.description, c.color, s.id, s.name, s.slug, s.description
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
            description: row.subcategory_description,
            arxivCategories: row.arxiv_categories.filter(ac => ac !== null)
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
      c.id, c.name, c.slug, c.description, c.color,
      s.id as subcategory_id, s.name as subcategory_name, s.slug as subcategory_slug, 
      s.description as subcategory_description,
      array_agg(DISTINCT ac.name) as arxiv_categories
    FROM categories c
    LEFT JOIN subcategories s ON c.id = s.category_id
    LEFT JOIN arxiv_categories ac ON s.id = ac.subcategory_id
    WHERE c.slug = $1
    GROUP BY c.id, c.name, c.slug, c.description, c.color, s.id, s.name, s.slug, s.description
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
            description: row.subcategory_description,
            arxivCategories: row.arxiv_categories.filter(ac => ac !== null)
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

// Get arXiv categories for a specific category/subcategory
const getArxivCategories = async (categorySlug, subcategorySlug = null) => {
  let query;
  let params;
  
  if (subcategorySlug) {
    // Get arXiv categories for a specific subcategory
    query = `
      SELECT ac.name
      FROM arxiv_categories ac
      JOIN subcategories s ON ac.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
      WHERE c.slug = $1 AND s.slug = $2
    `;
    params = [categorySlug, subcategorySlug];
  } else {
    // Get all arXiv categories for a category
    query = `
      SELECT DISTINCT ac.name
      FROM arxiv_categories ac
      JOIN subcategories s ON ac.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
      WHERE c.slug = $1
    `;
    params = [categorySlug];
  }
  
  try {
    const result = await db.query(query, params);
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error fetching arXiv categories:', error);
    throw error;
  }
};

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  getArxivCategories
};