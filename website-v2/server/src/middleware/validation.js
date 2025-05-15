const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const fs = require('fs');
const path = require('path');

/**
 * Validates if a category is supported
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 */
const validateCategory = async (request, h) => {
    const { category } = request.payload;
    
    // This would typically come from a database or configuration
    const supportedCategories = ['computerArchitecture'];
    
    if (!category || !supportedCategories.includes(category)) {
        throw Boom.badRequest('Invalid category', {
            details: `Supported categories are: ${supportedCategories.join(', ')}`,
            providedCategory: category
        });
    }
    
    return h.continue;
};

/**
 * Validates if a subcategory is supported for a given category
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 */
const validateSubcategory = async (request, h) => {
    const { category, subcategory } = request.payload;
    
    // This would typically come from a database or configuration
    const supportedSubcategories = {
        computerArchitecture: ['cpu', 'gpu', 'memory', 'storage']
    };
    
    if (!category || !subcategory || 
        !supportedSubcategories[category] || 
        !supportedSubcategories[category].includes(subcategory)) {
        throw Boom.badRequest('Invalid subcategory', {
            details: `Supported subcategories for ${category} are: ${supportedSubcategories[category]?.join(', ') || 'none'}`,
            providedSubcategory: subcategory
        });
    }
    
    return h.continue;
};

/**
 * Validates if a year is within supported range
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 */
const validateYear = async (request, h) => {
    const { year } = request.payload;
    const currentYear = new Date().getFullYear();
    const minYear = 2000; // Example minimum year
    
    if (!year || year < minYear || year > currentYear) {
        throw Boom.badRequest('Invalid year', {
            details: `Year must be between ${minYear} and ${currentYear}`,
            providedYear: year
        });
    }
    
    return h.continue;
};

/**
 * Validates if a YAML file path exists and is accessible
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 */
const validateYamlPath = async (request, h) => {
    const { yamlPath } = request.payload;
    
    try {
        const fullPath = path.resolve(process.cwd(), yamlPath);
        const stats = await fs.promises.stat(fullPath);
        
        if (!stats.isFile() || !yamlPath.endsWith('.yml') && !yamlPath.endsWith('.yaml')) {
            throw Boom.badRequest('Invalid YAML file path', {
                details: 'Path must point to a valid YAML file',
                providedPath: yamlPath
            });
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw Boom.notFound('YAML file not found', {
                details: 'The specified YAML file does not exist',
                providedPath: yamlPath
            });
        }
        throw Boom.badRequest('Invalid YAML file path', {
            details: error.message,
            providedPath: yamlPath
        });
    }
    
    return h.continue;
};

/**
 * Validates if a directory path exists and is accessible
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 */
const validateDirectoryPath = async (request, h) => {
    const { directoryPath } = request.payload;
    
    try {
        const fullPath = path.resolve(process.cwd(), directoryPath);
        const stats = await fs.promises.stat(fullPath);
        
        if (!stats.isDirectory()) {
            throw Boom.badRequest('Invalid directory path', {
                details: 'Path must point to a valid directory',
                providedPath: directoryPath
            });
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw Boom.notFound('Directory not found', {
                details: 'The specified directory does not exist',
                providedPath: directoryPath
            });
        }
        throw Boom.badRequest('Invalid directory path', {
            details: error.message,
            providedPath: directoryPath
        });
    }
    
    return h.continue;
};

module.exports = {
    validateCategory,
    validateSubcategory,
    validateYear,
    validateYamlPath,
    validateDirectoryPath
}; 