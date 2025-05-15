const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

class QualificationEngine {
    constructor() {
        // Keep the criteria for reference but we won't use it
        this.criteria = {
            computerArchitecture: {
                keywords: [
                    'accelerator', 'architecture', 'processor', 'hardware', 
                    'quantization', 'inference', 'training', 'FP8', 'int8',
                    'transformer', 'neural network', 'deep learning'
                ],
                requiredFields: ['title', 'abstract', 'references'],
                minReferences: 5,
                minAbstractLength: 100
            }
        };
    }

    /**
     * Dummy validation that always qualifies papers
     * @param {Object} paper - The paper object from YAML
     * @param {string} category - The category to validate against
     * @returns {Object} - Always returns qualified: true
     */
    validatePaper(paper, category) {
        // Log that we're using dummy validation
        console.log(`[DUMMY] Validating paper "${paper.title}" for category ${category}`);
        
        // Always return qualified with some dummy validation info
        return {
            qualified: true,
            reasons: [],
            foundKeywords: ['dummy_keyword'],
            isDummyValidation: true
        };
    }

    /**
     * Loads papers from a YAML file and marks them all as qualified
     * @param {string} yamlPath - Path to the YAML file
     * @param {string} category - Category to validate against
     * @returns {Object[]} - Array of papers with dummy validation results
     */
    async loadAndValidatePapers(yamlPath, category) {
        try {
            console.log(`[DUMMY] Loading papers from ${yamlPath} for category ${category}`);
            const fileContents = fs.readFileSync(yamlPath, 'utf8');
            const data = yaml.load(fileContents);
            
            if (!data.papers || !Array.isArray(data.papers)) {
                throw new Error('Invalid YAML format: papers array not found');
            }

            // Mark all papers as qualified
            return data.papers.map(paper => ({
                paper,
                validation: this.validatePaper(paper, category)
            }));
        } catch (error) {
            console.error('[DUMMY] Error loading papers:', error);
            throw error;
        }
    }
}

module.exports = new QualificationEngine(); 