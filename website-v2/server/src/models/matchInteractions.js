const { db } = require('../config/db');

const MatchInteraction = {
    initialize: async (db) => {
        try {
            // Check if table exists
            const tableExists = await db.schema.hasTable('match_interactions');
            
            if (!tableExists) {
                await db.schema.createTable('match_interactions', (table) => {
                    table.increments('id').primary();
                    table.integer('match_id').notNullable();
                    table.string('type').notNullable(); // 'like', 'dislike', or 'comment'
                    table.text('content').nullable(); // For comments
                    table.boolean('is_anonymous').defaultTo(false);
                    table.timestamp('created_at').defaultTo(db.fn.now());
                    table.timestamp('updated_at').defaultTo(db.fn.now());
                });
                console.log('Created match_interactions table');
            }
        } catch (error) {
            console.error('Error initializing match_interactions table:', error);
            throw error;
        }
    },

    addInteraction: async (db, matchId, data) => {
        const { type, content, isAnonymous } = data;
        return await db('match_interactions').insert({
            match_id: matchId,
            type,
            content,
            is_anonymous: isAnonymous
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
            likes: counts.find(c => c.type === 'like')?.count || 0,
            dislikes: counts.find(c => c.type === 'dislike')?.count || 0
        };
    },

    deleteInteraction: async (db, interactionId) => {
        return await db('match_interactions')
            .where('id', interactionId)
            .del();
    }
};

module.exports = MatchInteraction; 