exports.seed = async function(knex) {
    // First, get all matches
    const matches = await knex('matches').select('id');
    
    // Get all users (or create some if none exist)
    let users = await knex('users').select('id');
    if (users.length === 0) {
        // Create some sample users if none exist
        const sampleUsers = [
            { username: 'user1', email: 'user1@example.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1' },
            { username: 'user2', email: 'user2@example.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2' },
            { username: 'user3', email: 'user3@example.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3' },
            { username: 'user4', email: 'user4@example.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4' },
            { username: 'user5', email: 'user5@example.com', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5' }
        ];
        
        users = await knex('users').insert(sampleUsers).returning('id');
    }

    // Sample comments for variety
    const sampleComments = [
        "Great analysis! Very thorough and well-reasoned.",
        "The comparison was fair and balanced.",
        "Interesting perspective on the paper's methodology.",
        "The evaluation criteria were well-defined and appropriate.",
        "The feedback provided was constructive and helpful.",
        "The analysis could have been more detailed in some areas.",
        "Good job highlighting the key contributions.",
        "The evaluation was objective and unbiased.",
        "The comparison was comprehensive and insightful.",
        "The feedback was clear and actionable."
    ];

    // Create feedback for each match
    const feedbackPromises = matches.map(async (match) => {
        // Generate 2-5 feedback entries per match
        const numFeedback = Math.floor(Math.random() * 4) + 2;
        const feedbackEntries = [];

        for (let i = 0; i < numFeedback; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const liked = Math.random() > 0.5;
            const disliked = !liked && Math.random() > 0.7; // 30% chance of dislike if not liked
            const hasComment = Math.random() > 0.3; // 70% chance of having a comment

            const feedback = {
                match_id: match.id,
                user_id: user.id,
                liked,
                disliked,
                comment: hasComment ? sampleComments[Math.floor(Math.random() * sampleComments.length)] : null,
                created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date within last 30 days
                updated_at: new Date()
            };

            feedbackEntries.push(feedback);
        }

        // Insert feedback entries
        await knex('match_feedback').insert(feedbackEntries);

        // Create some likes for the feedback
        const insertedFeedback = await knex('match_feedback')
            .where('match_id', match.id)
            .select('id');

        for (const entry of insertedFeedback) {
            // 0-3 likes per feedback
            const numLikes = Math.floor(Math.random() * 4);
            const likePromises = [];

            for (let i = 0; i < numLikes; i++) {
                const user = users[Math.floor(Math.random() * users.length)];
                likePromises.push(
                    knex('feedback_likes').insert({
                        feedback_id: entry.id,
                        user_id: user.id,
                        created_at: new Date()
                    })
                );
            }

            await Promise.all(likePromises);
        }
    });

    await Promise.all(feedbackPromises);
}; 