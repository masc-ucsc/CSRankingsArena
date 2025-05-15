const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const arxivService = require('../../services/v2/arxiv');
const { db } = require('../../config/db');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');


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
        path: '/api/v2/papers/{id}',
        options: {
            description: 'Get paper details by ID',
            tags: ['api', 'v2', 'papers'],
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().description('Paper ID')
                })
            },
            handler: async (request, h) => {
                try {
                    const paper = await db('papers')
                        .where({ id: request.params.id })
                        .first();

                    if (!paper) {
                        throw Boom.notFound('Paper not found');
                    }

                    return h.response(paper);
                } catch (error) {
                    if (error.isBoom) throw error;
                    console.error('Error fetching paper details:', error);
                    throw Boom.badImplementation('Failed to fetch paper details', error);
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
    }
]; 