exports.seed = function(knex) {
    // Deletes ALL existing entries
    return knex('match_interactions').del()
        .then(function () {
            // Inserts seed entries
            return knex('match_interactions').insert([
                // First match interactions (already in 01_match_interactions.js)
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.08990v1',
                    type: 'like',
                    content: null,
                    is_anonymous: true,
                    created_at: new Date('2024-03-22T10:00:00Z'),
                    updated_at: new Date('2024-03-22T10:00:00Z')
                },
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.08990v1',
                    type: 'comment',
                    content: 'This is a great comparison! The analysis is very thorough.',
                    is_anonymous: false,
                    created_at: new Date('2024-03-22T10:30:00Z'),
                    updated_at: new Date('2024-03-22T10:30:00Z')
                },
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.08990v1',
                    type: 'dislike',
                    content: null,
                    is_anonymous: true,
                    created_at: new Date('2024-03-22T11:00:00Z'),
                    updated_at: new Date('2024-03-22T11:00:00Z')
                },
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.08990v1',
                    type: 'comment',
                    content: 'I disagree with some of the technical assessments.',
                    is_anonymous: false,
                    created_at: new Date('2024-03-22T11:30:00Z'),
                    updated_at: new Date('2024-03-22T11:30:00Z')
                },
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.08990v1',
                    type: 'like',
                    content: null,
                    is_anonymous: false,
                    created_at: new Date('2024-03-22T12:00:00Z'),
                    updated_at: new Date('2024-03-22T12:00:00Z')
                },

                // Second match interactions
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.09193v1',
                    type: 'like',
                    content: null,
                    is_anonymous: false,
                    created_at: new Date('2024-03-22T13:00:00Z'),
                    updated_at: new Date('2024-03-22T13:00:00Z')
                },
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.09193v1',
                    type: 'comment',
                    content: 'The novelty comparison is particularly interesting here.',
                    is_anonymous: false,
                    created_at: new Date('2024-03-22T13:30:00Z'),
                    updated_at: new Date('2024-03-22T13:30:00Z')
                },
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.09193v1',
                    type: 'like',
                    content: null,
                    is_anonymous: true,
                    created_at: new Date('2024-03-22T14:00:00Z'),
                    updated_at: new Date('2024-03-22T14:00:00Z')
                },
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.09193v1',
                    type: 'dislike',
                    content: null,
                    is_anonymous: false,
                    created_at: new Date('2024-03-22T14:30:00Z'),
                    updated_at: new Date('2024-03-22T14:30:00Z')
                },

                // Third match interactions
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.09073v1',
                    type: 'like',
                    content: null,
                    is_anonymous: true,
                    created_at: new Date('2024-03-22T15:00:00Z'),
                    updated_at: new Date('2024-03-22T15:00:00Z')
                },
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.09073v1',
                    type: 'comment',
                    content: 'The technical depth comparison is very insightful.',
                    is_anonymous: false,
                    created_at: new Date('2024-03-22T15:30:00Z'),
                    updated_at: new Date('2024-03-22T15:30:00Z')
                },
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.09073v1',
                    type: 'like',
                    content: null,
                    is_anonymous: false,
                    created_at: new Date('2024-03-22T16:00:00Z'),
                    updated_at: new Date('2024-03-22T16:00:00Z')
                },
                {
                    match_id: 'match-ai-vision-2025-2505.09139v1-2505.09073v1',
                    type: 'comment',
                    content: 'I appreciate the detailed metric comparison.',
                    is_anonymous: false,
                    created_at: new Date('2024-03-22T16:30:00Z'),
                    updated_at: new Date('2024-03-22T16:30:00Z')
                }
            ]);
        });
}; 