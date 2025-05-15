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
    const yamlFile = path.join(__dirname, "../../../mock/matches", category, subcategory, `${category}-${subcategory}-${year}-matches.yaml`);
    let yamlData;
    try {
         yamlData = yaml.load(fs.readFileSync(yamlFile, "utf8"));
    } catch (err) {
         console.error("Error reading YAML file:", err);
         throw Boom.notFound("Match YAML file not found or invalid");
    }
    const match = yamlData.matches.find(m => m.id === matchId);
    if (!match) {
         throw Boom.notFound("Match not found in YAML");
    }
    // (Optionally, if you need to "join" with agents or papers, you can read additional YAML files or mock data.)
    return match;
}

// Add feedback schema
const feedbackSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow(''),
  isAnonymous: Joi.boolean().default(false),
  matchId: Joi.string().required()
});

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
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('Match ID')
                }),
                payload: feedbackSchema
            },
            handler: async (request, h) => {
                try {
                    const { id } = request.params;
                    const feedback = request.payload;
                    
                    // Verify match exists
                    const match = await getMatchDetails(id);
                    if (!match) {
                        throw Boom.notFound('Match not found');
                    }

                    // In a real implementation, you would:
                    // 1. Get the user ID from the session/auth token
                    // 2. Store the feedback in a database
                    // 3. Update match statistics
                    
                    // For now, we'll just return a success response
                    return h.response({
                        message: 'Feedback submitted successfully',
                        feedback: {
                            ...feedback,
                            submittedAt: new Date().toISOString(),
                            // In a real implementation, include userId if not anonymous
                            userId: feedback.isAnonymous ? null : 'user-123' // Mock user ID
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
        path: '/api/v2/matches/{id}/feedback',
        options: {
            description: 'Get feedback for a match',
            tags: ['api', 'v2', 'matches'],
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('Match ID')
                }),
                query: Joi.object({
                    page: Joi.number().integer().min(1).default(1),
                    limit: Joi.number().integer().min(1).max(100).default(10)
                })
            },
            handler: async (request, h) => {
                try {
                    const { id } = request.params;
                    const { page, limit } = request.query;
                    
                    // Verify match exists
                    const match = await getMatchDetails(id);
                    if (!match) {
                        throw Boom.notFound('Match not found');
                    }

                    // In a real implementation, you would:
                    // 1. Query the database for feedback
                    // 2. Apply pagination
                    // 3. Filter out anonymous feedback if needed
                    
                    // For now, return mock feedback
                    const mockFeedback = {
                        items: [
                            {
                                id: 'feedback-1',
                                rating: 5,
                                comment: 'Great comparison! Very insightful analysis.',
                                isAnonymous: false,
                                userId: 'user-123',
                                submittedAt: new Date().toISOString()
                            },
                            {
                                id: 'feedback-2',
                                rating: 4,
                                comment: 'Good match, but could use more technical details.',
                                isAnonymous: true,
                                submittedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                            }
                        ],
                        pagination: {
                            page,
                            limit,
                            total: 2,
                            totalPages: 1
                        }
                    };

                    return h.response(mockFeedback);
                } catch (error) {
                    if (error.isBoom) throw error;
                    console.error('Error fetching match feedback:', error);
                    throw Boom.badImplementation('Failed to fetch match feedback');
                }
            }
        }
    }
]; 