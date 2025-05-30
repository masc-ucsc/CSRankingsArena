const Joi = require('@hapi/joi');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

// Import the paper generation functions
const { generatePaper, generateAbstract, generateTitle, generateURL, generateArxivId } = require('../../../../scripts/generate-batch-mock-papers')
const routes = [
    {
        method: 'POST',
        path: '/api/v2/mock/generate-papers',
        options: {
            description: 'Generate mock papers in batches',
            tags: ['api', 'mock'],
            validate: {
                payload: Joi.object({
                    numPapers: Joi.number().integer().min(1).max(100).required(),
                    year: Joi.string().pattern(/^\d{4}$/).required(),
                    category: Joi.string().required(),
                    subcategory: Joi.string().required()
                })
            },
            handler: async (request, h) => {
                try {
                    const { numPapers, year, category, subcategory } = request.payload;

                    // Generate papers
                    const papers = [];
                    for (let i = 0; i < numPapers; i++) {
                        papers.push(generatePaper(category, subcategory, year));
                    }

                    // Create YAML content
                    const yamlContent = yaml.dump({ papers });

                    // Create directory if it doesn't exist
                    const dirPath = path.join(__dirname, '..', '..', '..', 'papers', category, subcategory, year);
                    if (!fs.existsSync(dirPath)) {
                        fs.mkdirSync(dirPath, { recursive: true });
                    }

                    // Generate base filename
                    let fileName = `${category}-${subcategory}-${year}-batch-papers.yaml`;
                    let filePath = path.join(dirPath, fileName);

                    // If file exists, append date and sequential number
                    if (fs.existsSync(filePath)) {
                        const date = new Date().toISOString().split('T')[0].replace(/-/g, '-');
                        
                        // Find the next available number for today's date
                        let counter = 1;
                        let newFileName;
                        do {
                            newFileName = `${category}-${subcategory}-${year}-batch-papers-${date}-${String(counter).padStart(2, '0')}.yaml`;
                            filePath = path.join(dirPath, newFileName);
                            counter++;
                        } while (fs.existsSync(filePath));
                        
                        fileName = newFileName;
                    }

                    // Write to file
                    fs.writeFileSync(filePath, yamlContent);

                    return {
                        success: true,
                        message: `Successfully generated ${numPapers} papers`,
                        filePath: path.relative(path.join(__dirname, '..', '..', '..'), filePath)
                    };
                } catch (error) {
                    console.error('Error generating papers:', error);
                    return h.response({
                        success: false,
                        message: error.message
                    }).code(500);
                }
            }
        }
    }
];

module.exports = routes; 