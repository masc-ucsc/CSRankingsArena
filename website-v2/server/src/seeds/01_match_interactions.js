exports.seed = function(knex) {
    // Deletes ALL existing entries
    return knex('match_interactions').del()
        .then(function () {
            // Inserts seed entries
            return knex('match_interactions').insert([
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
                }
            ]);
        });
}; 