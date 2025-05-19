const jwt = require('jsonwebtoken');
const Boom = require('@hapi/boom');

// Get JWT secret from environment variable or use a default for development
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set in environment variables. Using default secret for development only.');
}

const validateJWT = async (decoded, request) => {
    try {
        // Here you would typically validate the user exists in your database
        // For now, we'll just return the decoded token
        return { isValid: true, credentials: decoded };
    } catch (error) {
        return { isValid: false };
    }
};

const generateToken = (user) => {
    if (!JWT_SECRET) {
        throw Boom.badImplementation('JWT_SECRET is not configured');
    }
    
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const verifyToken = (token) => {
    if (!JWT_SECRET) {
        throw Boom.badImplementation('JWT_SECRET is not configured');
    }
    
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw Boom.unauthorized('Invalid token');
    }
};

module.exports = {
    JWT_SECRET,
    validateJWT,
    generateToken,
    verifyToken
}; 