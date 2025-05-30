'use strict';

const db = require('../config/db');

// Get papers by category, subcategory, and year
const getPapersByFilters = async (categorySlug, subcategorySlug, year) => {
  const query = `
    WITH paper_categories AS (
      SELECT 
        p.id,
        c.arxiv_categories
      FROM papers p
      JOIN paper_subcategories ps ON p.id = ps.paper_id
      JOIN subcategories s ON ps.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
      WHERE c.slug = $1 AND s.slug = $2
    )
    SELECT 
      p.id, p.arxiv_id, p.title, p.abstract, p.published, p.updated, p.url, p.pdf_url,
      p.journal, p.doi, p.comments, p.published_year,
      array_agg(DISTINCT a.name) as authors,
      pc.arxiv_categories as categories
    FROM papers p
    JOIN paper_authors pa ON p.id = pa.paper_id
    JOIN authors a ON pa.author_id = a.id
    JOIN paper_categories pc ON p.id = pc.id
    WHERE p.published_year = $3
    GROUP BY p.id, p.arxiv_id, p.title, p.abstract, p.published, p.updated, p.url, p.pdf_url,
      p.journal, p.doi, p.comments, p.published_year, pc.arxiv_categories
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
      categories: row.categories || [],
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
  const { category, subcategory, year, page = 1, limit = 20, type = 'all' } = filters;
  const offset = (page - 1) * limit;
  
  // Build query conditionally
  let sqlParts = {
    select: `
      WITH matching_papers AS (
        SELECT DISTINCT p.id
        FROM papers p
        JOIN paper_authors pa ON p.id = pa.paper_id
        JOIN authors a ON pa.author_id = a.id
        WHERE 
          CASE 
            WHEN $${paramIndex} = 'title' THEN p.title ILIKE $${paramIndex + 1}
            WHEN $${paramIndex} = 'author' THEN a.name ILIKE $${paramIndex + 1}
            WHEN $${paramIndex} = 'abstract' THEN p.abstract ILIKE $${paramIndex + 1}
            ELSE (
              p.title ILIKE $${paramIndex + 1} OR 
              p.abstract ILIKE $${paramIndex + 1} OR
              a.name ILIKE $${paramIndex + 1}
            )
          END
      ),
      matching_paper_categories AS (
        SELECT 
          p.id,
          c.slug as category_slug,
          s.slug as subcategory_slug,
          p.published_year
        FROM papers p
        JOIN paper_subcategories ps ON p.id = ps.paper_id
        JOIN subcategories s ON ps.subcategory_id = s.id
        JOIN categories c ON s.category_id = c.id
        WHERE p.id IN (SELECT id FROM matching_papers)
      ),
      subcategory_leaderboards AS (
        SELECT 
          p.id,
          c.slug as category_slug,
          s.slug as subcategory_slug,
          p.published_year,
          json_agg(
            json_build_object(
              'id', p2.id,
              'title', p2.title,
              'authors', array_agg(DISTINCT a2.name),
              'score', pm2.avg_score,
              'matches', pm2.total_matches,
              'wins', pm2.wins,
              'win_rate', CASE 
                WHEN pm2.total_matches > 0 THEN pm2.wins::float / pm2.total_matches
                ELSE 0
              END,
              'match_details', (
                SELECT json_agg(
                  json_build_object(
                    'match_id', m.id,
                    'opponent_id', CASE WHEN m.paper1_id = p2.id THEN m.paper2_id ELSE m.paper1_id END,
                    'opponent_title', CASE 
                      WHEN m.paper1_id = p2.id THEN p3.title 
                      ELSE p4.title 
                    END,
                    'score', m.score,
                    'winner_id', m.winner_id,
                    'created_at', m.created_at
                  ) ORDER BY m.created_at DESC
                )
                FROM matches m
                LEFT JOIN papers p3 ON m.paper1_id = p3.id
                LEFT JOIN papers p4 ON m.paper2_id = p4.id
                WHERE (m.paper1_id = p2.id OR m.paper2_id = p2.id)
              ),
              'rank', ROW_NUMBER() OVER (
                PARTITION BY c.slug, s.slug, p.published_year 
                ORDER BY pm2.avg_score DESC NULLS LAST
              )
            )
            ORDER BY pm2.avg_score DESC NULLS LAST
          ) as leaderboard
        FROM matching_paper_categories mpc
        JOIN papers p ON p.id = mpc.id
        JOIN paper_subcategories ps ON p.id = ps.paper_id
        JOIN subcategories s ON ps.subcategory_id = s.id
        JOIN categories c ON s.category_id = c.id
        JOIN papers p2 ON p2.published_year = mpc.published_year
        JOIN paper_subcategories ps2 ON p2.id = ps2.paper_id
        JOIN subcategories s2 ON ps2.subcategory_id = s2.id
        JOIN categories c2 ON s2.category_id = c2.id
        JOIN paper_authors pa2 ON p2.id = pa2.paper_id
        JOIN authors a2 ON pa2.author_id = a2.id
        LEFT JOIN paper_matches pm2 ON p2.id = pm2.id
        WHERE c2.slug = mpc.category_slug 
          AND s2.slug = mpc.subcategory_slug
        GROUP BY p.id, c.slug, s.slug, p.published_year
      ),
      paper_matches AS (
        SELECT 
          p.id,
          COUNT(m.id) as total_matches,
          COUNT(CASE WHEN m.winner_id = p.id THEN 1 END) as wins,
          COALESCE(AVG(m.score), 0) as avg_score,
          json_agg(
            json_build_object(
              'match_id', m.id,
              'opponent_id', CASE WHEN m.paper1_id = p.id THEN m.paper2_id ELSE m.paper1_id END,
              'opponent_title', CASE 
                WHEN m.paper1_id = p.id THEN p2.title 
                ELSE p1.title 
              END,
              'score', m.score,
              'winner_id', m.winner_id,
              'created_at', m.created_at
            ) ORDER BY m.created_at DESC
          ) as match_details
        FROM papers p
        LEFT JOIN matches m ON p.id = m.paper1_id OR p.id = m.paper2_id
        LEFT JOIN papers p1 ON m.paper1_id = p1.id
        LEFT JOIN papers p2 ON m.paper2_id = p2.id
        WHERE p.id IN (SELECT id FROM matching_papers)
        GROUP BY p.id
      ),
      paper_status AS (
        SELECT 
          p.id,
          CASE 
            WHEN d.id IS NOT NULL THEN 'disqualified'
            ELSE 'qualified'
          END as status,
          d.reason as disqualification_reason
        FROM papers p
        LEFT JOIN disqualifications d ON p.id = d.paper_id
        WHERE p.id IN (SELECT id FROM matching_papers)
      )
      SELECT 
        p.id, p.arxiv_id, p.title, p.abstract, p.published, p.updated, p.url, p.pdf_url,
        p.journal, p.doi, p.comments, p.published_year,
        array_agg(DISTINCT a.name) as authors,
        mpc.category_slug,
        mpc.subcategory_slug,
        ps.status,
        ps.disqualification_reason,
        pm.total_matches,
        pm.wins,
        pm.avg_score as score,
        pm.match_details,
        sl.leaderboard,
        CASE 
          WHEN pm.total_matches > 0 THEN pm.wins::float / pm.total_matches
          ELSE 0
        END as win_rate
    `,
    from: `
      FROM papers p
      JOIN paper_authors pa ON p.id = pa.paper_id
      JOIN authors a ON pa.author_id = a.id
      JOIN matching_paper_categories mpc ON p.id = mpc.id
      JOIN paper_status ps ON p.id = ps.id
      LEFT JOIN paper_matches pm ON p.id = pm.id
      LEFT JOIN subcategory_leaderboards sl ON p.id = sl.id
    `,
    joins: ``,
    where: [],
    groupBy: `
      GROUP BY p.id, p.arxiv_id, p.title, p.abstract, p.published, p.updated, p.url, p.pdf_url,
        p.journal, p.doi, p.comments, p.published_year, pc.arxiv_categories,
        pc.category_slug, pc.subcategory_slug, ps.status, ps.disqualification_reason,
        pm.total_matches, pm.wins, pm.avg_score, pm.match_details, sl.leaderboard
    `,
    orderBy: `ORDER BY ps.status, pm.avg_score DESC NULLS LAST, p.published DESC`,
    limit: `LIMIT $${1} OFFSET $${2}`
  };
  
  const params = [limit, offset];
  let paramIndex = 3;
  
  // Add search query condition if provided
  if (query) {
    let searchCondition;
    switch (type) {
      case 'title':
        searchCondition = `p.title ILIKE $${paramIndex}`;
        break;
      case 'author':
        searchCondition = `EXISTS (
          SELECT 1 FROM paper_authors pa2
          JOIN authors a2 ON pa2.author_id = a2.id
          WHERE pa2.paper_id = p.id AND a2.name ILIKE $${paramIndex}
        )`;
        break;
      case 'abstract':
        searchCondition = `p.abstract ILIKE $${paramIndex}`;
        break;
      default: // 'all'
        searchCondition = `(
          p.title ILIKE $${paramIndex} OR 
          p.abstract ILIKE $${paramIndex} OR
          EXISTS (
            SELECT 1 FROM paper_authors pa2
            JOIN authors a2 ON pa2.author_id = a2.id
            WHERE pa2.paper_id = p.id AND a2.name ILIKE $${paramIndex}
          )
        )`;
    }
    
    sqlParts.where.push(searchCondition);
    params.push(`%${query}%`);
    paramIndex++;
    
    // Change order by to prioritize matches based on search type
    if (type === 'all') {
      sqlParts.orderBy = `
        ORDER BY 
          CASE 
            WHEN p.title ILIKE $${paramIndex} THEN 0
            WHEN EXISTS (
              SELECT 1 FROM paper_authors pa2
              JOIN authors a2 ON pa2.author_id = a2.id
              WHERE pa2.paper_id = p.id AND a2.name ILIKE $${paramIndex}
            ) THEN 1
            WHEN p.abstract ILIKE $${paramIndex} THEN 2
            ELSE 3
          END,
          p.published DESC
      `;
      params.push(`%${query}%`);
      paramIndex++;
    }
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
    JOIN paper_subcategories ps ON p.id = ps.paper_id
    JOIN subcategories s ON ps.subcategory_id = s.id
    JOIN categories c ON s.category_id = c.id
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
      categorySlug: row.category_slug,
      subcategorySlug: row.subcategory_slug,
      published: row.published,
      updated: row.updated,
      url: row.url,
      pdfUrl: row.pdf_url,
      journal: row.journal,
      doi: row.doi,
      comments: row.comments,
      publishedYear: row.published_year,
      status: row.status,
      disqualificationReason: row.disqualification_reason,
      score: row.score,
      matches: row.total_matches,
      winRate: row.win_rate,
      matchDetails: row.match_details || [],
      leaderboard: row.leaderboard || []
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