const { db } = require('../config/db');

const MatchInteraction = {
    initialize: async (db) => {
        try {
            // Check if table exists
            const tableExists = await db.schema.hasTable('match_interactions');
            
            if (!tableExists) {
                await db.schema.createTable('match_interactions', (table) => {
                    table.increments('id').primary();
                    table.string('match_id').notNullable();
                    table.string('user_id').notNullable();
                    table.string('type').notNullable(); // 'like', 'dislike', or 'comment'
                    table.text('content').nullable(); // For comments
                    table.boolean('is_anonymous').defaultTo(false);
                    table.timestamp('created_at').defaultTo(db.fn.now());
                    table.timestamp('updated_at').defaultTo(db.fn.now());
                    
                    // Add indexes for better query performance
                    table.index(['match_id', 'user_id', 'type']);
                    table.index(['match_id', 'type']);
                });
                console.log('Created match_interactions table');
            }
        } catch (error) {
            console.error('Error initializing match_interactions table:', error);
            throw error;
        }
    },

    addInteraction: async (db, matchId, userId, data) => {
        const { type, content, isAnonymous } = data;
        return await db('match_interactions').insert({
            match_id: matchId,
            user_id: userId,
            type,
            content,
            is_anonymous: isAnonymous,
            created_at: new Date(),
            updated_at: new Date()
        }).returning('*');
    },

    getInteractions: async (db, matchId, page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        return await db('match_interactions')
            .where('match_id', matchId)
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
    },

    getCounts: async (db, matchId) => {
        const counts = await db('match_interactions')
            .where('match_id', matchId)
            .whereIn('type', ['like', 'dislike'])
            .groupBy('type')
            .select('type')
            .count('* as count');

        return {
            likes: parseInt(counts.find(c => c.type === 'like')?.count || 0),
            dislikes: parseInt(counts.find(c => c.type === 'dislike')?.count || 0)
        };
    },

    getUserInteraction: async (db, matchId, userId) => {
        return await db('match_interactions')
            .where('match_id', matchId)
            .where('user_id', userId)
            .whereIn('type', ['like', 'dislike'])
            .orderBy('created_at', 'desc')
            .first();
    },

    deleteInteraction: async (db, interactionId) => {
        return await db('match_interactions')
            .where('id', interactionId)
            .del();
    }
};

module.exports = MatchInteraction; 