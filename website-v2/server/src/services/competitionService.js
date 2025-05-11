const { Pool } = require('pg');
const config = require('../config');
const agentService = require('./agentService');

const pool = new Pool(config.db);

class CompetitionService {
    async createMatch(paperId, agent1Id, agent2Id, judgeId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Create match
            const matchQuery = `
                INSERT INTO matches (paper_id, agent1_id, agent2_id, judge_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const matchResult = await client.query(matchQuery, [paperId, agent1Id, agent2Id, judgeId]);
            const match = matchResult.rows[0];

            // Get paper content
            const paperQuery = 'SELECT title, abstract FROM papers WHERE id = $1';
            const paperResult = await client.query(paperQuery, [paperId]);
            const paper = paperResult.rows[0];

            // Generate reviews
            const paperContent = `Title: ${paper.title}\n\nAbstract: ${paper.abstract}`;
            const [review1, review2] = await Promise.all([
                agentService.generateReview(agent1Id, paperContent),
                agentService.generateReview(agent2Id, paperContent)
            ]);

            // Store reviews
            const reviewQuery = `
                INSERT INTO reviews (match_id, agent_id, content)
                VALUES ($1, $2, $3), ($1, $4, $5)
                RETURNING *
            `;
            await client.query(reviewQuery, [match.id, agent1Id, review1, agent2Id, review2]);

            // Evaluate reviews
            const [evaluation1, evaluation2] = await Promise.all([
                agentService.evaluateReview(judgeId, review1, paperContent),
                agentService.evaluateReview(judgeId, review2, paperContent)
            ]);

            // Update reviews with scores
            const updateQuery = `
                UPDATE reviews
                SET technical_score = $1,
                    depth_score = $2,
                    feedback_score = $3,
                    clarity_score = $4,
                    fairness_score = $5,
                    overall_score = $6
                WHERE match_id = $7 AND agent_id = $8
            `;
            await Promise.all([
                client.query(updateQuery, [
                    evaluation1.technical_score,
                    evaluation1.depth_score,
                    evaluation1.feedback_score,
                    evaluation1.clarity_score,
                    evaluation1.fairness_score,
                    evaluation1.overall_score,
                    match.id,
                    agent1Id
                ]),
                client.query(updateQuery, [
                    evaluation2.technical_score,
                    evaluation2.depth_score,
                    evaluation2.feedback_score,
                    evaluation2.clarity_score,
                    evaluation2.fairness_score,
                    evaluation2.overall_score,
                    match.id,
                    agent2Id
                ])
            ]);

            // Update match status
            await client.query('UPDATE matches SET status = $1 WHERE id = $2', ['completed', match.id]);

            // Update agent performance
            await this._updateAgentPerformance(agent1Id, evaluation1.overall_score, evaluation2.overall_score);
            await this._updateAgentPerformance(agent2Id, evaluation2.overall_score, evaluation1.overall_score);

            await client.query('COMMIT');
            return match;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getMatch(matchId) {
        const query = `
            SELECT m.*, 
                   p.title as paper_title,
                   p.abstract as paper_abstract,
                   a1.name as agent1_name,
                   a2.name as agent2_name,
                   j.name as judge_name,
                   r1.content as review1_content,
                   r1.technical_score as review1_technical_score,
                   r1.depth_score as review1_depth_score,
                   r1.feedback_score as review1_feedback_score,
                   r1.clarity_score as review1_clarity_score,
                   r1.fairness_score as review1_fairness_score,
                   r1.overall_score as review1_overall_score,
                   r2.content as review2_content,
                   r2.technical_score as review2_technical_score,
                   r2.depth_score as review2_depth_score,
                   r2.feedback_score as review2_feedback_score,
                   r2.clarity_score as review2_clarity_score,
                   r2.fairness_score as review2_fairness_score,
                   r2.overall_score as review2_overall_score
            FROM matches m
            JOIN papers p ON m.paper_id = p.id
            JOIN agents a1 ON m.agent1_id = a1.id
            JOIN agents a2 ON m.agent2_id = a2.id
            JOIN agents j ON m.judge_id = j.id
            JOIN reviews r1 ON m.id = r1.match_id AND m.agent1_id = r1.agent_id
            JOIN reviews r2 ON m.id = r2.match_id AND m.agent2_id = r2.agent_id
            WHERE m.id = $1
        `;
        const result = await pool.query(query, [matchId]);
        return result.rows[0];
    }

    async getLeaderboard(limit = 10) {
        const query = `
            SELECT a.id, a.name, a.model_type, a.provider,
                   p.total_matches, p.wins, p.losses, p.draws,
                   p.avg_technical_score, p.avg_depth_score,
                   p.avg_feedback_score, p.avg_clarity_score,
                   p.avg_fairness_score, p.avg_overall_score
            FROM agents a
            JOIN agent_performance p ON a.id = p.agent_id
            WHERE a.is_active = true
            ORDER BY p.avg_overall_score DESC, p.wins DESC
            LIMIT $1
        `;
        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    async addCommunityFeedback(reviewId, userId, rating, comment) {
        const query = `
            INSERT INTO community_feedback (review_id, user_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [reviewId, userId, rating, comment]);
        return result.rows[0];
    }

    async getCommunityFeedback(reviewId) {
        const query = `
            SELECT cf.*, u.username
            FROM community_feedback cf
            LEFT JOIN users u ON cf.user_id = u.id
            WHERE cf.review_id = $1
            ORDER BY cf.created_at DESC
        `;
        const result = await pool.query(query, [reviewId]);
        return result.rows;
    }

    async _updateAgentPerformance(agentId, ownScore, opponentScore) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get current performance
            const getQuery = 'SELECT * FROM agent_performance WHERE agent_id = $1';
            const getResult = await client.query(getQuery, [agentId]);
            let performance = getResult.rows[0];

            if (!performance) {
                // Create new performance record
                const createQuery = `
                    INSERT INTO agent_performance (agent_id)
                    VALUES ($1)
                    RETURNING *
                `;
                const createResult = await client.query(createQuery, [agentId]);
                performance = createResult.rows[0];
            }

            // Update performance
            const totalMatches = performance.total_matches + 1;
            let wins = performance.wins;
            let losses = performance.losses;
            let draws = performance.draws;

            if (ownScore > opponentScore) wins++;
            else if (ownScore < opponentScore) losses++;
            else draws++;

            // Calculate new averages
            const updateQuery = `
                UPDATE agent_performance
                SET total_matches = $1,
                    wins = $2,
                    losses = $3,
                    draws = $4,
                    avg_technical_score = (avg_technical_score * total_matches + $5) / $1,
                    avg_depth_score = (avg_depth_score * total_matches + $6) / $1,
                    avg_feedback_score = (avg_feedback_score * total_matches + $7) / $1,
                    avg_clarity_score = (avg_clarity_score * total_matches + $8) / $1,
                    avg_fairness_score = (avg_fairness_score * total_matches + $9) / $1,
                    avg_overall_score = (avg_overall_score * total_matches + $10) / $1
                WHERE agent_id = $11
            `;
            await client.query(updateQuery, [
                totalMatches,
                wins,
                losses,
                draws,
                ownScore,
                ownScore,
                ownScore,
                ownScore,
                ownScore,
                ownScore,
                agentId
            ]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async addFeedback(matchId, userId, feedbackData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Validate match exists
            const matchQuery = 'SELECT * FROM matches WHERE id = $1';
            const matchResult = await client.query(matchQuery, [matchId]);
            if (!matchResult.rows[0]) {
                throw new Error('Match not found');
            }

            // Add feedback for each agent
            const feedbackQuery = `
                INSERT INTO feedback (
                    match_id, user_id, agent_id, rating, liked, 
                    agent_feedback, vote, comment
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const feedbackPromises = feedbackData.map(async (feedback) => {
                const { agentId, rating, liked, comment, vote } = feedback;
                const result = await client.query(feedbackQuery, [
                    matchId,
                    userId,
                    agentId,
                    rating,
                    liked,
                    comment,
                    vote,
                    comment
                ]);
                return result.rows[0];
            });

            const feedbackResults = await Promise.all(feedbackPromises);

            // Update agent statistics based on feedback
            for (const feedback of feedbackResults) {
                if (feedback.rating) {
                    await this._updateAgentFeedbackStats(feedback.agent_id, feedback.rating, feedback.liked);
                }
            }

            await client.query('COMMIT');
            return feedbackResults;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getMatchFeedback(matchId) {
        const query = `
            SELECT f.*, 
                   a.name as agent_name,
                   a.model as agent_model,
                   a.provider as agent_provider,
                   u.username as user_name
            FROM feedback f
            JOIN agents a ON f.agent_id = a.id
            LEFT JOIN users u ON f.user_id = u.id
            WHERE f.match_id = $1
            ORDER BY f.created_at DESC
        `;
        const result = await pool.query(query, [matchId]);
        return result.rows;
    }

    async getAgentFeedbackStats(agentId) {
        const query = `
            SELECT 
                COUNT(*) as total_feedback,
                AVG(rating) as avg_rating,
                COUNT(CASE WHEN liked = true THEN 1 END) as total_likes,
                COUNT(CASE WHEN liked = false THEN 1 END) as total_dislikes,
                COUNT(CASE WHEN vote = 'agree' THEN 1 END) as total_agrees,
                COUNT(CASE WHEN vote = 'disagree' THEN 1 END) as total_disagrees
            FROM feedback
            WHERE agent_id = $1
        `;
        const result = await pool.query(query, [agentId]);
        return result.rows[0];
    }

    async _updateAgentFeedbackStats(agentId, rating, liked) {
        const query = `
            UPDATE agents
            SET 
                avg_rating = (
                    SELECT AVG(rating)
                    FROM feedback
                    WHERE agent_id = $1 AND rating IS NOT NULL
                ),
                total_likes = (
                    SELECT COUNT(*)
                    FROM feedback
                    WHERE agent_id = $1 AND liked = true
                ),
                updated_at = NOW()
            WHERE id = $1
        `;
        await pool.query(query, [agentId]);
    }

    async getRecentMatches(category = null) {
        const query = `
            SELECT 
                m.*,
                p1.title as paper1_title,
                p2.title as paper2_title,
                a1.name as agent1_name,
                a2.name as agent2_name,
                j.name as judge_name
            FROM matches m
            LEFT JOIN papers p1 ON m.paper1_id = p1.id
            LEFT JOIN papers p2 ON m.paper2_id = p2.id
            LEFT JOIN agents a1 ON m.agent1_id = a1.id
            LEFT JOIN agents a2 ON m.agent2_id = a2.id
            LEFT JOIN agents j ON m.judge_id = j.id
            ${category ? 'WHERE m.category = $1' : ''}
            ORDER BY m.created_at DESC
            LIMIT 10
        `;

        try {
            const result = await pool.query(query, category ? [category] : []);
            return result.rows;
        } catch (error) {
            console.error('Error getting recent matches:', error);
            throw error;
        }
    }
}

module.exports = new CompetitionService(); 