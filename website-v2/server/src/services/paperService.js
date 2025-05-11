const db = require('../config/db');

class PaperService {
    // ... existing code ...

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