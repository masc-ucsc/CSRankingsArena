const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Helper function to get complete match details from YAML file
async function getMatchDetails(matchId) {
    // Assume matchId is of the form "match-{category}-{subcategory}-{year}-{num}" (e.g. "match-ai-vision-2024-01")
    const parts = matchId.split("-");
    if (parts.length < 5) {
        throw Boom.badRequest("Invalid match id format");
    }
    const category = parts[1];
    const subcategory = parts[2];
    const year = parts[3];

    // Load match data
    
    const matchYamlFile = path.join(__dirname, "../../../../papers", category, subcategory, year, `${category}-${subcategory}-${year}-matches.yaml`);
    let matchYamlData;
    try {
        matchYamlData = yaml.load(fs.readFileSync(matchYamlFile, "utf8"));
    } catch (err) {
        console.error("Error reading match YAML file:", err);
        throw Boom.notFound("Match YAML file not found or invalid");
    }

    const match = matchYamlData.matches.find(m => m.id === matchId);
    if (!match) {
        throw Boom.notFound("Match not found in YAML");
    }

    // Load paper data
    const papersYamlFile = path.join(__dirname, "../../../../papers", category, subcategory, year, `${category}-${subcategory}-${year}-papers.yaml`);
    let papersYamlData;
    try {
        papersYamlData = yaml.load(fs.readFileSync(papersYamlFile, "utf8"));
    } catch (err) {
        console.error("Error reading papers YAML file:", err);
        throw Boom.notFound("Papers YAML file not found or invalid");
    }

    // Find paper data for both papers
    const paper1 = papersYamlData.papers.find(p => p.id === match.paper1_id);
    const paper2 = papersYamlData.papers.find(p => p.id === match.paper2_id);

    // Add paper data to match object
    // For backward compatibility, include both paper1/paper2 and paper fields
    return {
        ...match,
        paper1: paper1 || null,
        paper2: paper2 || null,
        // For single paper matches, set paper to paper1
        paper: paper1 || null
    };
}

// Add feedback schema
const feedbackSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  comment: Joi.string().max(1000).allow(''),
  isAnonymous: Joi.boolean().default(false),
  type: Joi.string().valid('like', 'dislike', 'liked', 'disliked', 'comment').optional(),
  action: Joi.string().valid('add', 'remove').optional()
}).or('rating', 'comment', 'type');

module.exports = [
    {
        method: 'POST',
        path: '/api/v2/matches',
        options: {
            description: 'Create a new match (mock endpoint, does not persist)',
            tags: ['api', 'v2', 'matches'],
            validate: {
                payload: Joi.object({
                    paperId: Joi.number().integer().description('ID of the paper to match (for single paper matches)'),
                    paper1Id: Joi.number().integer().description('ID of first paper (for comparison matches)'),
                    paper2Id: Joi.number().integer().description('ID of second paper (for comparison matches)'),
                    agent1Id: Joi.number().integer().required().description('ID of first agent'),
                    agent2Id: Joi.number().integer().required().description('ID of second agent'),
                    judgeId: Joi.number().integer().required().description('ID of judge agent'),
                    category: Joi.string().required().description('Category slug'),
                    subcategory: Joi.string().required().description('Subcategory slug'),
                    year: Joi.number().integer().required().description('Publication year'),
                    matchType: Joi.string().valid('single', 'comparison').required().description('Type of match')
                })
                .oxor('paperId', 'paper1Id', 'paper2Id')
                .and('paper1Id', 'paper2Id')
            },
            handler: async (request, h) => {
                // (Mock endpoint, does not persist; in a real endpoint you'd insert into a DB.)
                const { category, subcategory, year, matchType, paperId, paper1Id, paper2Id, agent1Id, agent2Id, judgeId } = request.payload;
                const matchId = `match-${category}-${subcategory}-${year}-01`; // (mock id)
                const match = {
                     id: matchId,
                     paper1_id: (matchType === "single") ? paperId : paper1Id,
                     paper2_id: (matchType === "single") ? null : paper2Id,
                     agent1_id: agent1Id,
                     agent2_id: agent2Id,
                     judge_id: judgeId,
                     status: "pending",
                     feedback: "Mock feedback (not persisted)",
                     rating: 0,
                     created_at: new Date().toISOString(),
                     updated_at: new Date().toISOString(),
                     paper1_analysis: "Mock analysis (not persisted)",
                     paper2_analysis: (matchType === "single") ? null : "Mock analysis (not persisted)",
                     judge_analysis: "Mock judge analysis (not persisted)",
                     comments: []
                };
                return h.response(match).code(201);
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/matches/{id}',
        options: {
            description: 'Get match details by ID (from YAML)',
            tags: ['api', 'v2', 'matches'],
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('Match ID (e.g. match-ai-vision-2024-01)')
                })
            },
            handler: async (request, h) => {
                try {
                     const match = await getMatchDetails(request.params.id);
                     return h.response(match);
                } catch (error) {
                     if (error.isBoom) throw error;
                     console.error("Error fetching match details:", error);
                     throw Boom.badImplementation("Failed to fetch match details", error);
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/matches',
        options: {
            description: 'Get recent matches for a category and subcategory (from YAML)',
             tags: ['api', 'v2', 'matches'],
             validate: {
                 query: Joi.object({
                     category: Joi.string().required().description('Category slug (e.g. ai)'),
                     subcategory: Joi.string().required().description('Subcategory slug (e.g. vision)'),
                     limit: Joi.number().integer().min(1).max(100).default(5).description('Number of matches to return')
                 })
             },
             handler: async (request, h) => {
                 try {
                     const { category, subcategory, limit } = request.query;
                     const year = (new Date()).getFullYear(); // (or pass year as query param if needed)
                     const yamlFile = path.join(__dirname, "../../../mock/matches", category, subcategory, `${category}-${subcategory}-${year}-matches.yaml`);
                     let yamlData;
                     try {
                          yamlData = yaml.load(fs.readFileSync(yamlFile, "utf8"));
                     } catch (err) {
                          console.error("Error reading YAML file:", err);
                          throw Boom.notFound("Matches YAML file not found or invalid");
                     }
                     const matches = yamlData.matches.slice(0, limit);
                     return h.response(matches);
                 } catch (error) {
                     console.error("Error fetching recent matches:", error);
                     throw Boom.badImplementation("Failed to fetch recent matches", error);
                 }
             }
        }
    },
    {
        method: 'POST',
        path: '/api/v2/matches/{id}/feedback',
        options: {
            description: 'Submit feedback for a match',
            tags: ['api', 'v2', 'matches'],
            //auth: 'jwt',
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('Match ID')
                }),
                payload: feedbackSchema
            },
            handler: async (request, h) => {
                try {
                    console.log('POST feedback', request.payload);
                    const { id } = request.params;
                    const feedback = request.payload;
                    
                    // Verify match exists
                    console.log("HELOOOOOOOOOOO", id);
                    const match = await getMatchDetails(id);
                    if (!match) {
                        throw Boom.notFound('Match not found');
                    }

                    // Get user ID from auth credentials or use a dummy ID for anonymous users
                    const userId = request.auth?.credentials?.id || 'anonymous-' + Date.now();
                    
                    if (feedback.type === 'comment') {
                        // Handle comment
                        await request.db('match_interactions').insert({
                            match_id: id,
                            user_id: userId,
                            type: 'comment',
                            content: feedback.comment,
                            is_anonymous: feedback.isAnonymous || false,
                            created_at: new Date(),
                            updated_at: new Date()
                        });
                    } else {
                        // Handle like/dislike
                        const existingInteraction = await request.db('match_interactions')
                            .where('match_id', id)
                            .where('user_id', userId)
                            .whereIn('type', ['like', 'dislike'])
                            .first();

                        if (existingInteraction) {
                            // If user is trying to add the same type of interaction, remove it
                            if (existingInteraction.type === feedback.type) {
                                await request.db('match_interactions')
                                    .where('id', existingInteraction.id)
                                    .del();
                            } else {
                                // If user is changing their interaction type, update it
                                await request.db('match_interactions')
                                    .where('id', existingInteraction.id)
                                    .update({
                                        type: feedback.type,
                                        updated_at: new Date()
                                    });
                            }
                        } else {
                            // Create new interaction
                            await request.db('match_interactions').insert({
                                match_id: id,
                                user_id: userId,
                                type: feedback.type,
                                is_anonymous: feedback.isAnonymous || false,
                                created_at: new Date(),
                                updated_at: new Date()
                            });
                        }
                    }

                    // Get updated counts
                    const [likeCount, dislikeCount] = await Promise.all([
                        request.db('match_interactions')
                            .where('match_id', id)
                            .where('type', 'like')
                            .count('* as count')
                            .first(),
                        request.db('match_interactions')
                            .where('match_id', id)
                            .where('type', 'dislike')
                            .count('* as count')
                            .first()
                    ]);

                    // Get all interactions for the match
                    const interactions = await request.db('match_interactions')
                        .where('match_id', id)
                        .orderBy('created_at', 'desc');

                    return h.response({
                        success: true,
                        data: {
                            items: interactions.map(f => ({
                                id: f.id,
                                type: f.type,
                                content: f.content,
                                isAnonymous: f.is_anonymous,
                                createdAt: f.created_at
                            })),
                            counts: {
                                likes: parseInt(likeCount.count),
                                dislikes: parseInt(dislikeCount.count)
                            }
                        }
                    }).code(201);
                } catch (error) {
                    if (error.isBoom) throw error;
                    console.error('Error submitting feedback:', error);
                    throw Boom.badImplementation('Failed to submit feedback');
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/matches/{matchId}/feedback',
        options: {
            description: 'Get feedback for a match',
            tags: ['api', 'v2', 'matches'],
            validate: {
                params: Joi.object({
                    matchId: Joi.string().required().description('Match ID')
                }),
                query: Joi.object({
                    page: Joi.number().integer().min(1).default(1),
                    limit: Joi.number().integer().min(1).max(100).default(10)
                })
            },
            handler: async (request, h) => {
                try {
                    const { matchId } = request.params;
                    const { page, limit } = request.query;
                    const offset = (page - 1) * limit;

                    // Verify match exists
                    const match = await getMatchDetails(matchId);
                    if (!match) {
                        throw Boom.notFound('Match not found');
                    }

                    // Get feedback from database with pagination
                    const feedback = await request.db('match_interactions')
                        .where('match_id', matchId)
                        .orderBy('created_at', 'desc')
                        .limit(limit)
                        .offset(offset);

                    // Get total count for pagination
                    const total = await request.db('match_interactions')
                        .where('match_id', matchId)
                        .count('* as count')
                        .first();

                    return h.response({
                        success: true,
                        data: {
                            items: feedback.map(f => ({
                                id: f.id,
                                type: f.type,
                                content: f.content,
                                isAnonymous: f.is_anonymous,
                                createdAt: f.created_at
                            })),
                            pagination: {
                                page,
                                limit,
                                total: parseInt(total.count),
                                totalPages: Math.ceil(parseInt(total.count) / limit)
                            }
                        }
                    });
                } catch (error) {
                    if (error.isBoom) throw error;
                    console.error('Error fetching match feedback:', error);
                    throw Boom.badImplementation('Failed to fetch match feedback');
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/v2/matches/{id}/comments',
        options: {
            description: 'Add a comment to a match',
            tags: ['api', 'v2', 'matches'],
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('Match ID')
                }),
                payload: Joi.object({
                    text: Joi.string().required().min(1).max(1000),
                    isAnonymous: Joi.boolean().default(false)
                })
            },
            handler: async (request, h) => {
                try {
                    const { id } = request.params;
                    const { text, isAnonymous } = request.payload;
                    
                    // Verify match exists
                    const match = await getMatchDetails(id);
                    if (!match) {
                        throw Boom.notFound('Match not found');
                    }

                    // Create the comment
                    await request.db('match_interactions').insert({
                        match_id: id,
                        type: 'comment',
                        content: text,
                        is_anonymous: isAnonymous,
                        created_at: new Date(),
                        updated_at: new Date()
                    });

                    // Get all interactions for the match
                    const interactions = await request.db('match_interactions')
                        .where('match_id', id)
                        .orderBy('created_at', 'desc');

                    return h.response({
                        success: true,
                        data: {
                            items: interactions.map(f => ({
                                id: f.id,
                                type: f.type,
                                content: f.content,
                                isAnonymous: f.is_anonymous,
                                createdAt: f.created_at
                            }))
                        }
                    }).code(201);
                } catch (error) {
                    if (error.isBoom) throw error;
                    console.error('Error adding comment:', error);
                    throw Boom.badImplementation('Failed to add comment');
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/matches/download',
        options: {
            description: 'Download matches YAML file for a category/subcategory/year',
            tags: ['api', 'v2', 'matches'],
            validate: {
                query: Joi.object({
                    category: Joi.string().required().description('Category slug (e.g. ai)'),
                    subcategory: Joi.string().required().description('Subcategory slug (e.g. vision)'),
                    year: Joi.number().integer().required().description('Year')
                })
            },
            handler: async (request, h) => {
                try {
                    const { category, subcategory, year } = request.query;
                    console.log(category, subcategory, year)
                    const yearStr = String(year);
                    
                    // Try to read from actual data directory first
                    const dataPath = path.join(__dirname, "../../../../papers", category, subcategory, yearStr, `${category}-${subcategory}-${yearStr}-matches.yaml`);
                    console.log('dataPath', dataPath);
                    let filePath;
                    if (fs.existsSync(dataPath)) {
                        filePath = dataPath;
                    } else {
                        throw Boom.notFound(`No match data found for ${category}/${subcategory}/${yearStr}`);
                    }
                    
                    // Read the YAML file
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const matchesData = yaml.load(fileContent);

                    // Get all match IDs from the YAML
                    const matchIds = matchesData.matches.map(match => match.id);

                    // Fetch all interactions for these matches
                    const interactions = await request.db('match_interactions')
                        .whereIn('match_id', matchIds)
                        .orderBy('created_at', 'asc');

                    // Fetch user information for all interactions
                    const userIds = [...new Set(interactions.map(i => i.user_id))];
                    // Filter out non-numeric user IDs
                    const numericUserIds = userIds.filter(id => !isNaN(Number(id)));
                    
                    let users = [];
                    if (numericUserIds.length > 0) {
                        users = await request.db('users')
                            .whereIn('id', numericUserIds)
                            .select('id', 'username', 'email', 'created_at');
                    }

                    // Create a map of user IDs to user data
                    const userMap = new Map(users.map(user => [user.id, user]));

                    // Default user for anonymous or missing user data
                    const defaultUser = {
                        id: 'system',
                        username: 'System User',
                        email: 'system@csrankingsarena.com',
                        created_at: new Date('2024-01-01').toISOString()
                    };

                    // Group interactions by match_id and include user information
                    const interactionsByMatch = interactions.reduce((acc, interaction) => {
                        if (!acc[interaction.match_id]) {
                            acc[interaction.match_id] = [];
                        }
                        const user = userMap.get(interaction.user_id) || defaultUser;
                        acc[interaction.match_id].push({
                            type: interaction.type,
                            content: interaction.content,
                            is_anonymous: interaction.is_anonymous,
                            created_at: interaction.created_at,
                            user: interaction.is_anonymous ? defaultUser : {
                                id: user.id,
                                username: user.username,
                                email: user.email,
                                created_at: user.created_at
                            }
                        });
                        return acc;
                    }, {});

                    // Add interactions to each match in the YAML data
                    matchesData.matches = matchesData.matches.map(match => ({
                        ...match,
                        interactions: interactionsByMatch[match.id] || []
                    }));

                    // Convert back to YAML
                    const updatedYamlContent = yaml.dump(matchesData, {
                        indent: 2,
                        lineWidth: -1,
                        noRefs: true
                    });

                    const fileName = `${category}-${subcategory}-${yearStr}-matches.yaml`;
                    return h.response(updatedYamlContent)
                        .header('Content-Type', 'application/x-yaml')
                        .header('Content-Disposition', `attachment; filename="${fileName}"`);
                } catch (error) {
                    if (error.isBoom) throw error;
                    console.error("Error downloading matches YAML file:", error);
                    throw Boom.badImplementation("Failed to download matches YAML file", error);
                }
            }
        }
    }
]; 