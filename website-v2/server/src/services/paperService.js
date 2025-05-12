const db = require('../config/db');

class PaperService {
    /**
     * Get papers for a subcategory, with demo papers as fallback
     * @param {string} category - Main category
     * @param {string} subcategory - Subcategory
     * @param {number} limit - Maximum number of papers to return
     * @returns {Promise<Array>} Array of papers
     */
    async getPapersForSubcategory(category, subcategory, limit = 10) {
        // First try to get real papers
        let papers = await db('papers')
            .where({
                category,
                subcategory,
                is_demo: false
            })
            .orderBy('created_at', 'desc')
            .limit(limit);

        // If no real papers found, get demo papers
        if (papers.length === 0) {
            papers = await db('papers')
                .where({
                    category,
                    subcategory,
                    is_demo: true
                })
                .orderBy('created_at', 'desc')
                .limit(limit);
        }

        return papers;
    }

    /**
     * Get a specific paper by ID
     * @param {number} paperId - ID of the paper
     * @returns {Promise<Object>} Paper object
     */
    async getPaper(paperId) {
        const paper = await db('papers')
            .where('id', paperId)
            .first();
        
        if (!paper) {
            throw new Error('Paper not found');
        }
        
        return paper;
    }

    /**
     * Get random demo papers for a subcategory
     * @param {string} category - Main category
     * @param {string} subcategory - Subcategory
     * @param {number} count - Number of papers to return
     * @returns {Promise<Array>} Array of demo papers
     */
    async getRandomDemoPapers(category, subcategory, count = 1) {
        return db('papers')
            .where({
                category,
                subcategory,
                is_demo: true
            })
            .orderByRaw('RANDOM()')
            .limit(count);
    }

    async getPapersByCategory(categorySlug) {
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
            GROUP BY p.id, p.arxiv_id, p.title, p.abstract, p.published, p.updated, p.url, p.pdf_url,
                p.journal, p.doi, p.comments, p.published_year, pc.arxiv_cat_names
            ORDER BY p.published DESC
            LIMIT 100
        `;
        
        try {
            const result = await db.query(query, [categorySlug]);
            
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
            console.error('Error fetching papers by category:', error);
            throw error;
        }
    }
}

module.exports = new PaperService(); 