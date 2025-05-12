const Boom = require('@hapi/boom');
const matchService = require('../services/matchService');

// Create a new match
exports.createMatch = async (request, h) => {
    try {
        const { paperId, paper1Id, paper2Id, agent1Id, agent2Id, judgeId, category, subcategory } = request.payload;
        
        // Validate required fields
        if ((!paperId && (!paper1Id || !paper2Id)) || !agent1Id || !agent2Id || !judgeId) {
            return Boom.badRequest('Missing required fields: paperId or (paper1Id and paper2Id), agent1Id, agent2Id, judgeId');
        }
        
        const match = await matchService.createMatch({
            paperId,
            paper1Id,
            paper2Id,
            agent1Id,
            agent2Id,
            judgeId,
            category,
            subcategory
        });
        
        return h.response(match).code(201);
    } catch (error) {
        console.error('Error creating match:', error);
        return Boom.badImplementation('Error creating match', { error: error.message });
    }
};

// Get match by ID
exports.getMatch = async (request, h) => {
    try {
        const { matchId } = request.params;
        const match = await matchService.getMatch(matchId);
        
        if (!match) {
            return Boom.notFound('Match not found');
        }
        
        return match;
    } catch (error) {
        console.error('Error fetching match:', error);
        return Boom.badImplementation('Error fetching match', { error: error.message });
    }
};

// Update match
exports.updateMatch = async (request, h) => {
    try {
        const { matchId } = request.params;
        const updateData = request.payload;
        
        // Validate match exists
        const existingMatch = await matchService.getMatch(matchId);
        if (!existingMatch) {
            return Boom.notFound('Match not found');
        }
        
        // Validate status transition
        if (updateData.status) {
            const validTransitions = {
                'pending': ['in_progress', 'failed'],
                'in_progress': ['completed', 'failed'],
                'completed': [],
                'failed': []
            };
            
            if (!validTransitions[existingMatch.status].includes(updateData.status)) {
                return Boom.badRequest(
                    `Invalid status transition from ${existingMatch.status} to ${updateData.status}`
                );
            }
        }
        
        const updatedMatch = await matchService.updateMatch(matchId, updateData);
        return updatedMatch;
    } catch (error) {
        console.error('Error updating match:', error);
        return Boom.badImplementation('Error updating match', { error: error.message });
    }
};

// Add review to match
exports.addReview = async (request, h) => {
    try {
        const { matchId } = request.params;
        const reviewData = {
            ...request.payload,
            match_id: matchId
        };
        
        // Validate required fields
        const requiredFields = ['agent_id', 'paper_id', 'content', 'technical_score', 'depth_score', 
            'feedback_score', 'clarity_score', 'fairness_score', 'overall_score'];
        
        for (const field of requiredFields) {
            if (!reviewData[field]) {
                return Boom.badRequest(`Missing required field: ${field}`);
            }
        }
        
        // Validate scores are between 0 and 5
        const scoreFields = ['technical_score', 'depth_score', 'feedback_score', 
            'clarity_score', 'fairness_score', 'overall_score'];
        
        for (const field of scoreFields) {
            const score = parseFloat(reviewData[field]);
            if (isNaN(score) || score < 0 || score > 5) {
                return Boom.badRequest(`${field} must be a number between 0 and 5`);
            }
        }
        
        const review = await matchService.addReview(reviewData);
        return h.response(review).code(201);
    } catch (error) {
        console.error('Error adding review:', error);
        if (error.message === 'Review already exists for this agent and paper') {
            return Boom.conflict(error.message);
        }
        if (error.message === 'Invalid paper ID for this match') {
            return Boom.badRequest(error.message);
        }
        return Boom.badImplementation('Error adding review', { error: error.message });
    }
};

// Add feedback to review
exports.addFeedback = async (request, h) => {
    try {
        const { reviewId } = request.params;
        const feedbackData = {
            ...request.payload,
            review_id: reviewId
        };
        
        // Validate required fields
        if (!feedbackData.rating) {
            return Boom.badRequest('Missing required field: rating');
        }
        
        // Validate rating is between 1 and 5
        const rating = parseInt(feedbackData.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            return Boom.badRequest('Rating must be a number between 1 and 5');
        }
        
        const feedback = await matchService.addFeedback(feedbackData);
        return h.response(feedback).code(201);
    } catch (error) {
        console.error('Error adding feedback:', error);
        return Boom.badImplementation('Error adding feedback', { error: error.message });
    }
};

// Get matches with filters
exports.getMatches = async (request, h) => {
    try {
        const {
            status,
            paperId,
            agentId,
            limit = 20,
            offset = 0,
            orderBy = 'created_at',
            order = 'DESC'
        } = request.query;
        
        // Validate pagination parameters
        const parsedLimit = parseInt(limit);
        const parsedOffset = parseInt(offset);
        
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            return Boom.badRequest('Limit must be a number between 1 and 100');
        }
        
        if (isNaN(parsedOffset) || parsedOffset < 0) {
            return Boom.badRequest('Offset must be a non-negative number');
        }
        
        // Validate orderBy
        const allowedOrderBy = ['created_at', 'completed_at', 'status'];
        if (!allowedOrderBy.includes(orderBy)) {
            return Boom.badRequest(`orderBy must be one of: ${allowedOrderBy.join(', ')}`);
        }
        
        // Validate order
        if (!['ASC', 'DESC'].includes(order.toUpperCase())) {
            return Boom.badRequest('order must be either ASC or DESC');
        }
        
        const matches = await matchService.getMatches({
            status,
            paperId,
            agentId,
            limit: parsedLimit,
            offset: parsedOffset,
            orderBy,
            order: order.toUpperCase()
        });
        
        return matches;
    } catch (error) {
        console.error('Error fetching matches:', error);
        return Boom.badImplementation('Error fetching matches', { error: error.message });
    }
}; 