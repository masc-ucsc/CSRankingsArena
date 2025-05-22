const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const arxivService = require('../../services/v2/arxiv');
const { db } = require('../../config/db');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const fsPromises = require('fs').promises;


// Helper function to read papers from a YAML file (for example, for ai/vision, read from papers/ai/vision/{year}/ai-vision-{year}-papers.yaml)
async function fetchPapersFromYaml(category, subcategory, year) {
    // Resolve path to the papers directory in the project root
    const papersDir = path.resolve(__dirname, '../../../../papers');
    console.log('papersDir', papersDir);
    const yamlFile = path.join(papersDir, category, subcategory, year.toString(), `${category}-${subcategory}-${year}-papers.yaml`);
    console.log('Fetching papers from YAML file:', yamlFile);
    let yamlData;
    try {
        if (!fs.existsSync(yamlFile)) {
            console.error(`YAML file does not exist: ${yamlFile}`);
            throw Boom.notFound(`Papers YAML file not found for ${category}/${subcategory}/${year}`);
        }
        yamlData = yaml.load(fs.readFileSync(yamlFile, "utf8"));
        if (!yamlData || !yamlData.papers) {
            console.error(`Invalid YAML format in ${yamlFile}: missing papers array`);
            throw Boom.badImplementation(`Invalid YAML format in ${yamlFile}`);
        }
    } catch (err) {
        console.error("Error reading YAML file:", err);
        if (err.isBoom) throw err;
        throw Boom.badImplementation(`Failed to read papers from ${yamlFile}`, err);
    }
    return yamlData.papers;
}

// Helper function to find paper by ID in YAML files
async function findPaperById(paperId) {
    const papersDir = path.resolve(__dirname, '../../../../papers');
    const categories = fs.readdirSync(papersDir);
    
    for (const category of categories) {
        const categoryPath = path.join(papersDir, category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;
        
        const subcategories = fs.readdirSync(categoryPath);
        for (const subcategory of subcategories) {
            const subcategoryPath = path.join(categoryPath, subcategory);
            if (!fs.statSync(subcategoryPath).isDirectory()) continue;
            
            const years = fs.readdirSync(subcategoryPath);
            for (const year of years) {
                const yearPath = path.join(subcategoryPath, year);
                if (!fs.statSync(yearPath).isDirectory()) continue;
                
                const yamlFile = path.join(yearPath, `${category}-${subcategory}-${year}-papers.yaml`);
                if (!fs.existsSync(yamlFile)) continue;
                
                try {
                    const yamlData = yaml.load(fs.readFileSync(yamlFile, "utf8"));
                    if (!yamlData || !yamlData.papers) continue;
                    
                    const paper = yamlData.papers.find(p => p.id === paperId);
                    if (paper) {
                        return {
                            ...paper,
                            category,
                            subcategory,
                            year: parseInt(year)
                        };
                    }
                } catch (err) {
                    console.error(`Error reading YAML file ${yamlFile}:`, err);
                    continue;
                }
            }
        }
    }
    return null;
}

module.exports = [
    {
        method: 'GET',
        path: '/api/v2/papers/{category}/{subcategory}',
        options: {
            description: 'Get papers for a given category and subcategory (from YAML)',
            tags: ['api', 'v2', 'papers'],
            validate: {
                params: Joi.object({
                    category: Joi.string().required().description('Category slug (e.g. ai)'),
                    subcategory: Joi.string().required().description('Subcategory slug (e.g. vision)')
                }),
                query: Joi.object({
                    year: Joi.number().integer().required().description('Publication year (e.g. 2024)')
                })
            },
            handler: async (request, h) => {
                const { category, subcategory } = request.params;
                const { year } = request.query;
                try {
                    console.log('Fetching papers for:  HAHAHAHAH', { category, subcategory, year });
                    const papers = await fetchPapersFromYaml(category, subcategory, year);
                    return h.response(papers);
                } catch (error) {
                    if (error.isBoom) throw error;
                    console.error("Error fetching papers:", error);
                    throw Boom.badImplementation("Failed to fetch papers", error);
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/papers/{paperId}',
        options: {
            description: 'Get paper details by ID (from database or YAML files)',
            tags: ['api', 'v2', 'papers'],
            validate: {
                params: Joi.object({
                    paperId: Joi.alternatives().try(
                        Joi.number().integer(),
                        Joi.string()
                    ).required().description('Paper ID (numeric for database, string for YAML)')
                })
            },
            handler: async (request, h) => {
                const { paperId } = request.params;
                try {
                    // First try to find in database if paperId is numeric
                    if (!isNaN(paperId)) {
                        const dbPaper = await db('papers')
                            .where({ id: parseInt(paperId) })
                            .first();
                        
                        if (dbPaper) {
                            return h.response(dbPaper);
                        }
                    }
                    
                    // If not found in database or paperId is string, try YAML files
                    const yamlPaper = await findPaperById(paperId.toString());
                    if (yamlPaper) {
                        return h.response(yamlPaper);
                    }
                    
                    throw Boom.notFound(`Paper with ID ${paperId} not found`);
                } catch (error) {
                    if (error.isBoom) throw error;
                    console.error("Error fetching paper:", error);
                    throw Boom.badImplementation("Failed to fetch paper", error);
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/papers/{category}/{subcategory}/venues',
        options: {
            description: 'Get venues for a category and subcategory',
            tags: ['api', 'v2', 'papers', 'venues'],
            validate: {
                params: Joi.object({
                    category: Joi.string().required().description('Category slug'),
                    subcategory: Joi.string().required().description('Subcategory slug')
                }),
                query: Joi.object({
                    year: Joi.number().integer().optional().description('Publication year')
                })
            },
            handler: async (request, h) => {
                try {
                    const { category, subcategory } = request.params;
                    const { year } = request.query;

                    // Build the SQL query
                    let sqlQuery = `
                        SELECT DISTINCT venue 
                        FROM papers 
                        WHERE category = $1 AND subcategory = $2
                    `;
                    const params = [category, subcategory];

                    if (year) {
                        sqlQuery += ` AND year = $3`;
                        params.push(parseInt(year));
                    }

                    const result = await db.query(sqlQuery, params);
                    return h.response(result.rows.map(row => row.venue));
                } catch (error) {
                    console.error('Error fetching venues:', error);
                    throw Boom.badImplementation('Failed to fetch venues', error);
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/papers/{category}/{subcategory}/{year}/disqualified',
        options: {
            description: 'Get disqualified papers for a category/subcategory/year',
            tags: ['api', 'papers'],
            validate: {
                params: Joi.object({
                    category: Joi.string().required(),
                    subcategory: Joi.string().required(),
                    year: Joi.string().pattern(/^\d{4}$/).required()
                })
            },
            handler: async (request, h) => {
                try {
                    const { category, subcategory, year } = request.params;
                    console.log('Fetching disqualified papers for:', { category, subcategory, year });
                    
                    // Resolve path to the papers directory in the project root
                    const papersDir = path.resolve(__dirname, '../../../../papers');
                    console.log('papersDir', papersDir);


                    try {

                        // Read and parse the YAML file
                        const yamlFile = path.join(papersDir, category, subcategory, year.toString(), `${category}-${subcategory}-${year}-disqualification.yaml`);
                        if (!fs.existsSync(yamlFile)) {
                            console.error(`YAML file does not exist: ${yamlFile}`);
                            throw Boom.notFound(`Papers YAML file not found for ${category}/${subcategory}/${year}`);
                        }
                        let yamlData = yaml.load(fs.readFileSync(yamlFile, "utf8"));
                        //const yamlContent = await fs.readFile(yamlPath, 'utf8');
                        console.log('Successfully read YAML file');
                        //console.log('Parsed YAML data:', yamlData);

                        if (!yamlData || !yamlData.papers) {
                            console.log('No papers found in YAML data');
                            return h.response({ papers: [] });
                        }

                        const response = {
                            category,
                            subcategory,
                            year,
                            papers: yamlData.papers
                        };
                        //console.log('Sending Disqualification response:', response);
                        return response;
                    } catch (error) {
                        console.error('Error reading YAML file:', error);
                        if (error.code === 'ENOENT') {
                            console.log('YAML file not found');
                            return h.response({ papers: [] });
                        }
                        throw error;
                    }
                } catch (error) {
                    console.error('Error in disqualified papers endpoint:', error);
                    throw Boom.badImplementation('Error fetching disqualified papers');
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/papers/search',
        options: {
            description: 'Search papers with suggestions',
            tags: ['api', 'v2', 'papers'],
            validate: {
                query: Joi.object({
                    q: Joi.string().required().description('Search query'),
                    type: Joi.string().valid('all', 'title', 'author', 'category', 'subcategory', 'year').default('all'),
                    category: Joi.string().allow('').optional(),
                    year: Joi.number().integer().allow('').optional(),
                    page: Joi.number().integer().min(1).default(1),
                    limit: Joi.number().integer().min(1).max(100).default(20)
                })
            },
            handler: async (request, h) => {
                try {
                    const { q, type, category, year, page, limit } = request.query;
                    const papersDir = path.resolve(__dirname, '../../../../papers');
                    
                    console.log('Searching papers for:', { q, type, category, year, page, limit });
                    // Get all categories
                    const categories = fs.readdirSync(papersDir);
                    let results = [];
                    
                    // Search through all YAML files
                    for (const cat of categories) {
                        const categoryPath = path.join(papersDir, cat);
                        if (!fs.statSync(categoryPath).isDirectory()) continue;
                        
                        const subcategories = fs.readdirSync(categoryPath);
                        for (const subcat of subcategories) {
                            const subcategoryPath = path.join(categoryPath, subcat);
                            if (!fs.statSync(subcategoryPath).isDirectory()) continue;
                            
                            const years = fs.readdirSync(subcategoryPath);
                            for (const yr of years) {
                                const yearPath = path.join(subcategoryPath, yr);
                                if (!fs.statSync(yearPath).isDirectory()) continue;
                                
                                // Skip if year filter is set and doesn't match
                                if (year && year !== '' && parseInt(yr) !== parseInt(year)) continue;
                                
                                // Skip if category filter is set and doesn't match
                                if (category && category !== '' && cat !== category) continue;
                                
                                const yamlFile = path.join(yearPath, `${cat}-${subcat}-${yr}-papers.yaml`);
                                if (!fs.existsSync(yamlFile)) continue;
                                
                                try {
                                    const yamlData = yaml.load(fs.readFileSync(yamlFile, "utf8"));
                                    if (!yamlData || !yamlData.papers) continue;
                                    
                                    // Filter papers based on search type and query
                                    const matchingPapers = yamlData.papers.filter(paper => {
                                        const searchQuery = q.toLowerCase();
                                        
                                        switch (type) {
                                            case 'title':
                                                return paper.title?.toLowerCase().includes(searchQuery) || false;
                                            case 'author':
                                                return Array.isArray(paper.authors) && paper.authors.some(author => 
                                                    author?.toLowerCase().includes(searchQuery)
                                                );
                                            case 'category':
                                                return cat.toLowerCase().includes(searchQuery);
                                            case 'subcategory':
                                                return subcat.toLowerCase().includes(searchQuery);
                                            case 'year':
                                                return yr.includes(searchQuery);
                                            default: // 'all'
                                                return (
                                                    (paper.title?.toLowerCase().includes(searchQuery) || false) ||
                                                    (Array.isArray(paper.authors) && paper.authors.some(author => 
                                                        author?.toLowerCase().includes(searchQuery)
                                                    )) ||
                                                    cat.toLowerCase().includes(searchQuery) ||
                                                    subcat.toLowerCase().includes(searchQuery) ||
                                                    yr.includes(searchQuery)
                                                );
                                        }
                                    });
                                    
                                    // Add category and subcategory info to each paper
                                    const enrichedPapers = matchingPapers.map(paper => ({
                                        ...paper,
                                        category: cat,
                                        subcategory: subcat,
                                        year: parseInt(yr)
                                    }));
                                    
                                    results = results.concat(enrichedPapers);
                                } catch (err) {
                                    console.error(`Error reading YAML file ${yamlFile}:`, err);
                                    continue;
                                }
                            }
                        }
                    }
                    
                    // Sort results by relevance (exact matches first)
                    results.sort((a, b) => {
                        const aTitle = a.title.toLowerCase();
                        const bTitle = b.title.toLowerCase();
                        const query = q.toLowerCase();
                        
                        const aExactMatch = aTitle === query;
                        const bExactMatch = bTitle === query;
                        
                        if (aExactMatch && !bExactMatch) return -1;
                        if (!aExactMatch && bExactMatch) return 1;
                        
                        const aStartsWith = aTitle.startsWith(query);
                        const bStartsWith = bTitle.startsWith(query);
                        
                        if (aStartsWith && !bStartsWith) return -1;
                        if (!aStartsWith && bStartsWith) return 1;
                        
                        return 0;
                    });
                    
                    // Apply pagination
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    const paginatedResults = results.slice(startIndex, endIndex);
                    
                    return h.response({
                        papers: paginatedResults,
                        pagination: {
                            total: results.length,
                            page: parseInt(page),
                            limit: parseInt(limit),
                            pages: Math.ceil(results.length / limit)
                        }
                    });
                } catch (error) {
                    console.error('Error searching papers:', error);
                    throw Boom.badImplementation('Failed to search papers', error);
                }
            }
        },
    },
    {
        method: 'GET',
        path: '/api/v2/papers/suggestions',
        options: {
            description: 'Get paper suggestions for autocomplete',
            tags: ['api', 'v2', 'papers'],
            validate: {
                query: Joi.object({
                    q: Joi.string().required().min(2).description('Search query'),
                    type: Joi.string().valid('title', 'author').required().description('Search type')
                })
            },
            handler: async (request, h) => {
                try {
                    const { q, type } = request.query;
                    const papersDir = path.resolve(__dirname, '../../../../papers');
                    const suggestions = new Set();
                    
                    // Get all categories
                    const categories = fs.readdirSync(papersDir);
                    
                    // Search through all YAML files
                    for (const cat of categories) {
                        const categoryPath = path.join(papersDir, cat);
                        if (!fs.statSync(categoryPath).isDirectory()) continue;
                        
                        const subcategories = fs.readdirSync(categoryPath);
                        for (const subcat of subcategories) {
                            const subcategoryPath = path.join(categoryPath, subcat);
                            if (!fs.statSync(subcategoryPath).isDirectory()) continue;
                            
                            const years = fs.readdirSync(subcategoryPath);
                            for (const yr of years) {
                                const yearPath = path.join(subcategoryPath, yr);
                                if (!fs.statSync(yearPath).isDirectory()) continue;
                                
                                const yamlFile = path.join(yearPath, `${cat}-${subcat}-${yr}-papers.yaml`);
                                if (!fs.existsSync(yamlFile)) continue;
                                
                                try {
                                    const yamlData = yaml.load(fs.readFileSync(yamlFile, "utf8"));
                                    if (!yamlData || !yamlData.papers) continue;
                                    
                                    const searchQuery = q.toLowerCase();
                                    
                                    if (type === 'title') {
                                        // Add matching titles
                                        yamlData.papers.forEach(paper => {
                                            if (paper.title.toLowerCase().includes(searchQuery)) {
                                                suggestions.add(JSON.stringify({
                                                    title: paper.title,
                                                    authors: paper.authors,
                                                    year: parseInt(yr)
                                                }));
                                            }
                                        });
                                    } else if (type === 'author') {
                                        // Add matching authors
                                        yamlData.papers.forEach(paper => {
                                            paper.authors.forEach(author => {
                                                if (author.toLowerCase().includes(searchQuery)) {
                                                    suggestions.add(JSON.stringify({
                                                        name: author,
                                                        paperCount: yamlData.papers.filter(p => 
                                                            p.authors.includes(author)
                                                        ).length
                                                    }));
                                                }
                                            });
                                        });
                                    }
                                } catch (err) {
                                    console.error(`Error reading YAML file ${yamlFile}:`, err);
                                    continue;
                                }
                            }
                        }
                    }
                    
                    // Convert Set to Array and parse JSON strings
                    const results = Array.from(suggestions).map(item => JSON.parse(item));
                    
                    // Sort results by relevance
                    results.sort((a, b) => {
                        const query = q.toLowerCase();
                        const aValue = type === 'title' ? a.title.toLowerCase() : a.name.toLowerCase();
                        const bValue = type === 'title' ? b.title.toLowerCase() : b.name.toLowerCase();
                        
                        const aExactMatch = aValue === query;
                        const bExactMatch = bValue === query;
                        
                        if (aExactMatch && !bExactMatch) return -1;
                        if (!aExactMatch && bExactMatch) return 1;
                        
                        const aStartsWith = aValue.startsWith(query);
                        const bStartsWith = bValue.startsWith(query);
                        
                        if (aStartsWith && !bStartsWith) return -1;
                        if (!aStartsWith && bStartsWith) return 1;
                        
                        return 0;
                    });
                    
                    // Return top 10 suggestions
                    return h.response(results.slice(0, 10));
                } catch (error) {
                    console.error('Error getting suggestions:', error);
                    throw Boom.badImplementation('Failed to get suggestions', error);
                }
            }
        }
    }
]; 