const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const paperService = require('./paperService');

class MatchService {
    /**
     * Create a new match between two agents for a paper
     * @param {Object} params
     * @param {number} [params.paperId] - ID of the paper to match (for single paper matches)
     * @param {number} [params.paper1Id] - ID of first paper (for comparison matches)
     * @param {number} [params.paper2Id] - ID of second paper (for comparison matches)
     * @param {number} params.agent1Id - ID of first agent
     * @param {number} params.agent2Id - ID of second agent
     * @param {number} params.judgeId - ID of judge agent
     * @param {string} [params.category] - Category for demo paper fallback
     * @param {string} [params.subcategory] - Subcategory for demo paper fallback
     * @returns {Promise<Object>} Created match object
     */
    async createMatch({ paperId, paper1Id, paper2Id, agent1Id, agent2Id, judgeId, category, subcategory }) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            let paper1, paper2;
            
            // Handle single paper match
            if (paperId) {
                try {
                    paper1 = await paperService.getPaper(paperId);
                } catch (error) {
                    // If paper not found and category/subcategory provided, try demo papers
                    if (category && subcategory) {
                        const demoPapers = await paperService.getRandomDemoPapers(category, subcategory, 1);
                        if (demoPapers.length > 0) {
                            paper1 = demoPapers[0];
                            paperId = paper1.id;
                        } else {
                            throw new Error('No papers (real or demo) found for this category/subcategory');
                        }
                    } else {
                        throw error;
                    }
                }
            }
            // Handle comparison match
            else if (paper1Id && paper2Id) {
                try {
                    [paper1, paper2] = await Promise.all([
                        paperService.getPaper(paper1Id),
                        paperService.getPaper(paper2Id)
                    ]);
                } catch (error) {
                    // If papers not found and category/subcategory provided, try demo papers
                    if (category && subcategory) {
                        const demoPapers = await paperService.getRandomDemoPapers(category, subcategory, 2);
                        if (demoPapers.length === 2) {
                            [paper1, paper2] = demoPapers;
                            paper1Id = paper1.id;
                            paper2Id = paper2.id;
                        } else {
                            throw new Error('Not enough demo papers found for comparison');
                        }
                    } else {
                        throw error;
                    }
                }
            } else {
                throw new Error('Either paperId or both paper1Id and paper2Id must be provided');
            }
            
            // Validate agents exist and are different
            const agentsResult = await client.query(
                'SELECT id FROM agents WHERE id IN ($1, $2, $3)',
                [agent1Id, agent2Id, judgeId]
            );
            
            if (agentsResult.rows.length !== 3) {
                throw new Error('One or more agents not found');
            }
            
            if (agent1Id === agent2Id || agent1Id === judgeId || agent2Id === judgeId) {
                throw new Error('All agents must be different');
            }
            
            // Create match
            const matchId = uuidv4();
            const matchResult = await client.query(
                `INSERT INTO matches 
                (id, paper_id, paper1_id, paper2_id, agent1_id, agent2_id, judge_id, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
                RETURNING *`,
                [matchId, paperId, paper1Id, paper2Id, agent1Id, agent2Id, judgeId]
            );
            
            await client.query('COMMIT');
            
            // Return match with paper details
            const match = matchResult.rows[0];
            return {
                ...match,
                paper: paper1,
                paper2: paper2
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Get match by ID with all reviews for both papers
     * @param {string} matchId - UUID of the match
     * @returns {Promise<Object>} Match object with related data
     */
    async getMatch(matchId) {
        const query = `
            WITH paper_reviews AS (
                SELECT 
                    m.id as match_id,
                    p.id as paper_id,
                    p.title as paper_title,
                    p.abstract as paper_abstract,
                    p.url as paper_url,
                    json_agg(
                        json_build_object(
                            'id', r.id,
                            'agent_id', r.agent_id,
                            'agent_name', a.name,
                            'content', r.content,
                            'technical_score', r.technical_score,
                            'depth_score', r.depth_score,
                            'feedback_score', r.feedback_score,
                            'clarity_score', r.clarity_score,
                            'fairness_score', r.fairness_score,
                            'overall_score', r.overall_score,
                            'created_at', r.created_at
                        ) ORDER BY r.created_at
                    ) FILTER (WHERE r.id IS NOT NULL) as reviews
                FROM matches m
                LEFT JOIN papers p ON p.id IN (m.paper_id, m.paper1_id, m.paper2_id)
                LEFT JOIN reviews r ON r.match_id = m.id AND r.paper_id = p.id
                LEFT JOIN agents a ON r.agent_id = a.id
                WHERE m.id = $1
                GROUP BY m.id, p.id, p.title, p.abstract, p.url
            )
            SELECT 
                m.*,
                a1.name as agent1_name,
                a2.name as agent2_name,
                w.name as winner_name,
                json_agg(
                    json_build_object(
                        'paper_id', pr.paper_id,
                        'paper_title', pr.paper_title,
                        'paper_abstract', pr.paper_abstract,
                        'paper_url', pr.paper_url,
                        'reviews', pr.reviews
                    )
                ) as papers
            FROM matches m
            JOIN agents a1 ON m.agent1_id = a1.id
            JOIN agents a2 ON m.agent2_id = a2.id
            LEFT JOIN agents w ON m.winner_id = w.id
            LEFT JOIN paper_reviews pr ON pr.match_id = m.id
            WHERE m.id = $1
            GROUP BY m.id, a1.name, a2.name, w.name
        `;
        
        const result = await db.query(query, [matchId]);
        return result.rows[0];
    }
    
    /**
     * Update match status and results
     * @param {string} matchId - UUID of the match
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated match object
     */
    async updateMatch(matchId, updateData) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            const allowedUpdates = ['status', 'winner_id', 'error', 'match_data', 'completed_at'];
            const updates = [];
            const values = [matchId];
            let paramCount = 1;
            
            for (const [key, value] of Object.entries(updateData)) {
                if (allowedUpdates.includes(key)) {
                    updates.push(`${key} = $${++paramCount}`);
                    values.push(value);
                }
            }
            
            if (updates.length === 0) {
                throw new Error('No valid updates provided');
            }
            
            // If status is being updated to 'completed', set completed_at
            if (updateData.status === 'completed' && !updateData.completed_at) {
                updates.push('completed_at = NOW()');
            }
            
            const query = `
                UPDATE matches 
                SET ${updates.join(', ')}, updated_at = NOW()
                WHERE id = $1
                RETURNING *
            `;
            
            const result = await client.query(query, values);
            
            // If winner is set, update agent statistics
            if (updateData.winner_id) {
                const match = result.rows[0];
                
                // Update agent1 stats
                await client.query(`
                    UPDATE agents
                    SET 
                        matches_played = matches_played + 1,
                        matches_won = matches_won + CASE WHEN $1 = id THEN 1 ELSE 0 END,
                        matches_lost = matches_lost + CASE WHEN $1 != id AND $1 IS NOT NULL THEN 1 ELSE 0 END,
                        matches_drawn = matches_drawn + CASE WHEN $1 IS NULL THEN 1 ELSE 0 END,
                        points = points + CASE 
                            WHEN $1 = id THEN 3
                            WHEN $1 IS NULL THEN 1
                            ELSE 0
                        END,
                        updated_at = NOW()
                    WHERE id IN ($2, $3)
                `, [updateData.winner_id, match.agent1_id, match.agent2_id]);
            }
            
            await client.query('COMMIT');
            return result.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Add a review to a match
     * @param {Object} reviewData - Review data
     * @returns {Promise<Object>} Created review object
     */
    async addReview(reviewData) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // Validate match exists and is completed
            const matchResult = await client.query(
                'SELECT status, paper_id, paper1_id, paper2_id FROM matches WHERE id = $1',
                [reviewData.match_id]
            );
            
            if (matchResult.rows.length === 0) {
                throw new Error('Match not found');
            }
            
            const match = matchResult.rows[0];
            
            if (match.status !== 'completed') {
                throw new Error('Cannot review an incomplete match');
            }
            
            // Validate paper_id is valid for this match
            const validPaperIds = [match.paper_id, match.paper1_id, match.paper2_id].filter(Boolean);
            if (!validPaperIds.includes(reviewData.paper_id)) {
                throw new Error('Invalid paper ID for this match');
            }
            
            // Check if review already exists for this agent and paper
            const existingReview = await client.query(
                'SELECT id FROM reviews WHERE match_id = $1 AND agent_id = $2 AND paper_id = $3',
                [reviewData.match_id, reviewData.agent_id, reviewData.paper_id]
            );
            
            if (existingReview.rows.length > 0) {
                throw new Error('Review already exists for this agent and paper');
            }
            
            // Insert review
            const reviewResult = await client.query(
                `INSERT INTO reviews 
                (match_id, agent_id, paper_id, content, technical_score, depth_score, 
                feedback_score, clarity_score, fairness_score, overall_score)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *`,
                [
                    reviewData.match_id,
                    reviewData.agent_id,
                    reviewData.paper_id,
                    reviewData.content,
                    reviewData.technical_score,
                    reviewData.depth_score,
                    reviewData.feedback_score,
                    reviewData.clarity_score,
                    reviewData.fairness_score,
                    reviewData.overall_score
                ]
            );
            
            await client.query('COMMIT');
            return reviewResult.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Add community feedback to a review
     * @param {Object} feedbackData - Feedback data
     * @returns {Promise<Object>} Created feedback object
     */
    async addFeedback(feedbackData) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // Validate review exists
            const reviewResult = await client.query(
                'SELECT id FROM reviews WHERE id = $1',
                [feedbackData.review_id]
            );
            
            if (reviewResult.rows.length === 0) {
                throw new Error('Review not found');
            }
            
            // Insert feedback
            const feedbackResult = await client.query(
                `INSERT INTO community_feedback 
                (review_id, user_id, rating, comment)
                VALUES ($1, $2, $3, $4)
                RETURNING *`,
                [
                    feedbackData.review_id,
                    feedbackData.user_id || null,
                    feedbackData.rating,
                    feedbackData.comment
                ]
            );
            
            await client.query('COMMIT');
            return feedbackResult.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Get matches with optional filters
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} Array of matches
     */
    async getMatches(filters = {}) {
        const {
            status,
            paperId,
            agentId,
            limit = 20,
            offset = 0,
            orderBy = 'created_at',
            order = 'DESC'
        } = filters;
        
        const conditions = [];
        const values = [];
        let paramCount = 0;
        
        if (status) {
            conditions.push(`m.status = $${++paramCount}`);
            values.push(status);
        }
        
        if (paperId) {
            conditions.push(`m.paper_id = $${++paramCount}`);
            values.push(paperId);
        }
        
        if (agentId) {
            conditions.push(`(m.agent1_id = $${++paramCount} OR m.agent2_id = $${paramCount})`);
            values.push(agentId);
        }
        
        const whereClause = conditions.length > 0 
            ? `WHERE ${conditions.join(' AND ')}` 
            : '';
        
        const query = `
            SELECT 
                m.*,
                p.title as paper_title,
                a1.name as agent1_name,
                a2.name as agent2_name,
                w.name as winner_name,
                COUNT(r.id) as review_count
            FROM matches m
            JOIN papers p ON m.paper_id = p.id
            JOIN agents a1 ON m.agent1_id = a1.id
            JOIN agents a2 ON m.agent2_id = a2.id
            LEFT JOIN agents w ON m.winner_id = w.id
            LEFT JOIN reviews r ON m.id = r.match_id
            ${whereClause}
            GROUP BY m.id, p.title, a1.name, a2.name, w.name
            ORDER BY m.${orderBy} ${order}
            LIMIT $${++paramCount} OFFSET $${++paramCount}
        `;
        
        values.push(limit, offset);
        
        const result = await db.query(query, values);
        return result.rows;
    }
}

module.exports = new MatchService(); 