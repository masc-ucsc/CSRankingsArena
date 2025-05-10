'use strict';

const db = require('../config/db');

// Get papers by category, subcategory, and year
const getPapersByFilters = async (categorySlug, subcategorySlug, year) => {
  const query = `
    WITH paper_categories AS (
      SELECT 
        p.id, 
        array_agg(DISTINCT ac.name) as arxiv_cat_names
      FROM papers p
      JOIN paper_arxiv_categories pac ON p.id = pac.paper_id
      JOIN arxiv_categories ac ON pac.arxiv_category_id = ac.id
      GROUP BY p.id
    )
    SELECT 
      p.id, p.arxiv_id, p.title, p.abstract, p.published, p.updated, p.url, p.pdf_url,
      p.journal, p.doi, p.comments, p.published_year,
      array_agg(DISTINCT a.name) as authors,
      pc.arxiv_cat_names as categories
    FROM papers p
    JOIN paper_authors pa ON p.id = pa.paper_id
    JOIN authors a ON pa.author_id = a.id
    JOIN paper_categories pc ON p.id = pc.id
    JOIN paper_subcategories ps ON p.id = ps.paper_id
    JOIN subcategories s ON ps.subcategory_id = s.id
    JOIN categories c ON s.category_id = c.id
    WHERE c.slug = $1
      AND s.slug = $2
      AND p.published_year = $3
    GROUP BY p.id, p.arxiv_id, p.title, p.abstract, p.published, p.updated, p.url, p.pdf_url,
      p.journal, p.doi, p.comments, p.published_year, pc.arxiv_cat_names
    ORDER BY p.published DESC
    LIMIT 100
  `;
  
  try {
    const result = await db.query(query, [categorySlug, subcategorySlug, year]);
    
    // Transform the result
    return result.rows.map(row => ({
      id: row.id,
      arxivId: row.arxiv_id,
      title: row.title,
      authors: row.authors.filter(a => a !== null),
      abstract: row.abstract,
      categories: row.categories.filter(c => c !== null),
      published: row.published,
      updated: row.updated,
      url: row.url,
      pdfUrl: row.pdf_url,
      journal: row.journal,
      doi: row.doi,
      comments: row.comments,
      publishedYear: row.published_year
    }));
  } catch (error) {
    console.error('Error fetching papers:', error);
    throw error;
  }
};

// Search papers
const searchPapers = async (query, filters = {}) => {
  const { category, subcategory, year, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  
  // Build query conditionally
  let sqlParts = {
    select: `
      WITH paper_categories AS (
        SELECT 
          p.id, 
          array_agg(DISTINCT ac.name) as arxiv_cat_names
        FROM papers p
        JOIN paper_arxiv_categories pac ON p.id = pac.paper_id
        JOIN arxiv_categories ac ON pac.arxiv_category_id = ac.id
        GROUP BY p.id
      )
      SELECT 
        p.id, p.arxiv_id, p.title, p.abstract, p.published, p.updated, p.url, p.pdf_url,
        p.journal, p.doi, p.comments, p.published_year,
        array_agg(DISTINCT a.name) as authors,
        pc.arxiv_cat_names as categories
    `,
    from: `
      FROM papers p
      JOIN paper_authors pa ON p.id = pa.paper_id
      JOIN authors a ON pa.author_id = a.id
      JOIN paper_categories pc ON p.id = pc.id
    `,
    joins: ``,
    where: [],
    groupBy: `
      GROUP BY p.id, p.arxiv_id, p.title, p.abstract, p.published, p.updated, p.url, p.pdf_url,
        p.journal, p.doi, p.comments, p.published_year, pc.arxiv_cat_names
    `,
    orderBy: `ORDER BY p.published DESC`,
    limit: `LIMIT $${1} OFFSET $${2}`
  };
  
  const params = [limit, offset];
  let paramIndex = 3;
  
  // Add search query condition if provided
  if (query) {
    sqlParts.where.push(`(p.title ILIKE $${paramIndex} OR p.abstract ILIKE $${paramIndex})`);
    params.push(`%${query}%`);
    paramIndex++;
    
    // Change order by to prioritize matches in title
    sqlParts.orderBy = `
      ORDER BY 
        CASE WHEN p.title ILIKE $${paramIndex} THEN 0
             WHEN p.abstract ILIKE $${paramIndex} THEN 1
             ELSE 2
        END,
        p.published DESC
    `;
    params.push(`%${query}%`);
    paramIndex++;
  }
  
  // Add category condition if provided
  if (category) {
    sqlParts.joins += `
      JOIN paper_subcategories ps ON p.id = ps.paper_id
      JOIN subcategories s ON ps.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
    `;
    
    sqlParts.where.push(`c.slug = $${paramIndex}`);
    params.push(category);
    paramIndex++;
    
    // Add subcategory condition if provided
    if (subcategory) {
      sqlParts.where.push(`s.slug = $${paramIndex}`);
      params.push(subcategory);
      paramIndex++;
    }
  }
  
  // Add year condition if provided
  if (year) {
    sqlParts.where.push(`p.published_year = $${paramIndex}`);
    params.push(parseInt(year));
    paramIndex++;
  }
  
  // Combine where clauses if they exist
  const whereClause = sqlParts.where.length > 0 
    ? `WHERE ${sqlParts.where.join(' AND ')}` 
    : '';
  
  // Build the final query
  const sqlQuery = `
    ${sqlParts.select}
    ${sqlParts.from}
    ${sqlParts.joins}
    ${whereClause}
    ${sqlParts.groupBy}
    ${sqlParts.orderBy}
    ${sqlParts.limit}
  `;
  
  // Query to count total results for pagination
  const countParams = params.slice(0, -2); // Remove LIMIT and OFFSET params
  const whereForCount = sqlParts.where.length > 0 
    ? `WHERE ${sqlParts.where.join(' AND ')}` 
    : '';
  
  const countQuery = `
    SELECT COUNT(DISTINCT p.id)
    FROM papers p
    JOIN paper_authors pa ON p.id = pa.paper_id
    JOIN authors a ON pa.author_id = a.id
    JOIN paper_arxiv_categories pac ON p.id = pac.paper_id
    JOIN arxiv_categories ac ON pac.arxiv_category_id = ac.id
    ${sqlParts.joins}
    ${whereForCount}
  `;
  
  try {
    // Execute main query
    const result = await db.query(sqlQuery, params);
    
    // Execute count query
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    // Transform the result
    const papers = result.rows.map(row => ({
      id: row.id,
      arxivId: row.arxiv_id,
      title: row.title,
      authors: row.authors.filter(a => a !== null),
      abstract: row.abstract,
      categories: row.categories.filter(c => c !== null),
      published: row.published,
      updated: row.updated,
      url: row.url,
      pdfUrl: row.pdf_url,
      journal: row.journal,
      doi: row.doi,
      comments: row.comments,
      publishedYear: row.published_year
    }));
    
    return {
      papers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error searching papers:', error);
    throw error;
  }
};

// Save a paper to the database
const savePaper = async (paperData) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Insert paper
    const paperQuery = `
      INSERT INTO papers (arxiv_id, title, abstract, published, updated, url, pdf_url, 
        journal, doi, comments, published_year)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (arxiv_id) DO UPDATE SET
        title = EXCLUDED.title,
        abstract = EXCLUDED.abstract,
        updated = EXCLUDED.updated,
        url = EXCLUDED.url,
        pdf_url = EXCLUDED.pdf_url,
        journal = EXCLUDED.journal,
        doi = EXCLUDED.doi,
        comments = EXCLUDED.comments
      RETURNING id
    `;
    
    const paperResult = await client.query(paperQuery, [
      paperData.arxivId,
      paperData.title,
      paperData.abstract,
      paperData.published,
      paperData.updated,
      paperData.url,
      paperData.pdfUrl,
      paperData.journal || null,
      paperData.doi || null,
      paperData.comments || null,
      new Date(paperData.published).getFullYear()
    ]);
    
    const paperId = paperResult.rows[0].id;
    
    // Insert authors and link to paper
    for (const authorName of paperData.authors) {
      // Insert author if doesn't exist
      const authorQuery = `
        INSERT INTO authors (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING
        RETURNING id
      `;
      
      const authorResult = await client.query(authorQuery, [authorName]);
      
      // Get author ID
      let authorId;
      if (authorResult.rows.length > 0) {
        authorId = authorResult.rows[0].id;
      } else {
        const getAuthorResult = await client.query('SELECT id FROM authors WHERE name = $1', [authorName]);
        authorId = getAuthorResult.rows[0].id;
      }
      
      // Link author to paper
      await client.query(
        'INSERT INTO paper_authors (paper_id, author_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [paperId, authorId]
      );
    }
    
    // Link paper to arXiv categories
    for (const categoryName of paperData.categories) {
      // Get arXiv category ID
      const arxivCategoryResult = await client.query(
        'SELECT id FROM arxiv_categories WHERE name = $1 LIMIT 1',
        [categoryName]
      );
      
      if (arxivCategoryResult.rows.length > 0) {
        const arxivCategoryId = arxivCategoryResult.rows[0].id;
        
        // Link paper to arXiv category
        await client.query(
          'INSERT INTO paper_arxiv_categories (paper_id, arxiv_category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [paperId, arxivCategoryId]
        );
      }
    }
    
    // Link paper to subcategories if provided
    if (paperData.subcategories && paperData.subcategories.length > 0) {
      for (const subcategorySlug of paperData.subcategories) {
        // Get subcategory ID from slug
        const subcategoryResult = await client.query(
          'SELECT id FROM subcategories WHERE slug = $1 LIMIT 1',
          [subcategorySlug]
        );
        
        if (subcategoryResult.rows.length > 0) {
          const subcategoryId = subcategoryResult.rows[0].id;
          
          // Link paper to subcategory
          await client.query(
            'INSERT INTO paper_subcategories (paper_id, subcategory_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [paperId, subcategoryId]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    return { id: paperId, ...paperData };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving paper:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getPapersByFilters,
  searchPapers,
  savePaper
};