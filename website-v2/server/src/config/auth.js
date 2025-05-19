const jwt = require('jsonwebtoken');
const Boom = require('@hapi/boom');
const { query } = require('../config/db');

// Get JWT secret from environment variable or use a default for development
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set in environment variables. Using default secret for development only.');
}

const validateJWT = async (decoded, request) => {
    try {
        // Validate that the user exists in the database
        const { rows } = await query(
            'SELECT id, username, email, role FROM users WHERE id = $1',
            [decoded.id]
        );

        if (!rows.length) {
            return { isValid: false };
        }

        // Return the user data as credentials
        return {
            isValid: true,
            credentials: {
                id: rows[0].id,
                username: rows[0].username,
                email: rows[0].email,
                role: rows[0].role
            }
        };
    } catch (error) {
        console.error('JWT validation error:', error);
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