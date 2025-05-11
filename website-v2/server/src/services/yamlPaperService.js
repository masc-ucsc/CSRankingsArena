const yaml = require('js-yaml');
const fs = require('fs').promises;
const path = require('path');
const arxivService = require('./arxivService');
const paperModel = require('../models/paperModel');

class YamlPaperService {
    /**
     * Process a YAML file and import papers
     * @param {string} yamlFilePath - Path to the YAML file
     * @param {string} categorySlug - Category slug
     * @param {string} subcategorySlug - Subcategory slug
     * @returns {Promise<Array>} Array of imported papers
     */
    async processYamlFile(yamlFilePath, categorySlug, subcategorySlug) {
        try {
            // Read and parse YAML file
            const fileContents = await fs.readFile(yamlFilePath, 'utf8');
            const yamlData = yaml.load(fileContents);

            if (!yamlData || !yamlData.papers || !Array.isArray(yamlData.papers)) {
                throw new Error('Invalid YAML format: papers array not found');
            }

            const importedPapers = [];

            // Process each paper in the YAML
            for (const paperData of yamlData.papers) {
                try {
                    // Extract arXiv ID from URL if available
                    let arxivId = null;
                    if (paperData.url) {
                        const match = paperData.url.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
                        if (match) {
                            arxivId = match[1];
                        }
                    }

                    // If we have an arXiv ID, fetch additional details
                    if (arxivId) {
                        const arxivPaper = await arxivService.fetchPaperById(arxivId);
                        if (arxivPaper) {
                            // Merge YAML data with arXiv data
                            const mergedPaper = {
                                ...arxivPaper,
                                // Override with YAML data if available
                                title: paperData.title || arxivPaper.title,
                                abstract: paperData.abstract || arxivPaper.abstract,
                                // Add category and subcategory
                                categories: [...new Set([...arxivPaper.categories, categorySlug])],
                                subcategories: [subcategorySlug]
                            };

                            // Save to database
                            const savedPaper = await paperModel.savePaper(mergedPaper);
                            importedPapers.push(savedPaper);
                            continue;
                        }
                    }

                    // If no arXiv data available, save what we have from YAML
                    const paperToSave = {
                        arxivId,
                        title: paperData.title,
                        abstract: paperData.abstract,
                        authors: paperData.authors || [],
                        categories: [categorySlug],
                        subcategories: [subcategorySlug],
                        url: paperData.url,
                        published: paperData.published || new Date(),
                        updated: paperData.updated || new Date()
                    };

                    const savedPaper = await paperModel.savePaper(paperToSave);
                    importedPapers.push(savedPaper);

                } catch (paperError) {
                    console.error(`Error processing paper in YAML:`, paperError);
                    // Continue with next paper
                }
            }

            return importedPapers;

        } catch (error) {
            console.error('Error processing YAML file:', error);
            throw error;
        }
    }

    /**
     * Process all YAML files in a directory
     * @param {string} directoryPath - Path to directory containing YAML files
     * @returns {Promise<Object>} Object containing import results by category
     */
    async processYamlDirectory(directoryPath) {
        try {
            const results = {};
            const files = await fs.readdir(directoryPath);

            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    const categorySlug = path.basename(file, path.extname(file));
                    const filePath = path.join(directoryPath, file);

                    try {
                        const importedPapers = await this.processYamlFile(filePath, categorySlug, 'general');
                        results[categorySlug] = {
                            success: true,
                            count: importedPapers.length,
                            papers: importedPapers
                        };
                    } catch (fileError) {
                        results[categorySlug] = {
                            success: false,
                            error: fileError.message
                        };
                    }
                }
            }

            return results;

        } catch (error) {
            console.error('Error processing YAML directory:', error);
            throw error;
        }
    }
}

module.exports = new YamlPaperService(); 