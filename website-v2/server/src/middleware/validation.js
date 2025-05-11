const Boom = require('@hapi/boom');

/**
 * Validates if a category is supported
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateCategory = (req, res, next) => {
    const { category } = req.body;
    
    // This would typically come from a database or configuration
    const supportedCategories = ['computerArchitecture'];
    
    if (!category || !supportedCategories.includes(category)) {
        return res.status(400).json({
            error: 'Invalid category',
            details: `Supported categories are: ${supportedCategories.join(', ')}`,
            providedCategory: category
        });
    }
    
    next();
};

/**
 * Validates YAML file path
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateYamlPath = (req, res, next) => {
    const { yamlPath } = req.body;
    
    if (!yamlPath) {
        return res.status(400).json({
            error: 'Missing yamlPath parameter'
        });
    }
    
    // Basic path validation
    if (!yamlPath.endsWith('.yaml')) {
        return res.status(400).json({
            error: 'Invalid file path',
            details: 'File must have .yaml extension'
        });
    }
    
    // Prevent directory traversal
    if (yamlPath.includes('..')) {
        return res.status(400).json({
            error: 'Invalid file path',
            details: 'Directory traversal not allowed'
        });
    }
    
    next();
};

/**
 * Validates directory path
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateDirectoryPath = (req, res, next) => {
    const { directoryPath } = req.body;
    
    if (!directoryPath) {
        return res.status(400).json({
            error: 'Missing directoryPath parameter'
        });
    }
    
    // Prevent directory traversal
    if (directoryPath.includes('..')) {
        return res.status(400).json({
            error: 'Invalid directory path',
            details: 'Directory traversal not allowed'
        });
    }
    
    next();
};

module.exports = {
    validateCategory,
    validateYamlPath,
    validateDirectoryPath
}; 