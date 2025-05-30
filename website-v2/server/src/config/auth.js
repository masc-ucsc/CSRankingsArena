const jwt = require('jsonwebtoken');
const Boom = require('@hapi/boom');
const { query } = require('../config/db');

// Get JWT secret from environment variable or use a default for development
const JWT_SECRET = process.env.JWT_SECRET || 'a4305c89bedf2d80a844b0296bb3912b3cd1bb05bf302d6beb6578d03df948183e7fb97f9e4a5427c7580c367c481997a1cf1d98aff6d124fa3cf71f1ab3b5ba';
const JWT_EXPIRATION = '24h';

if (!JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set in environment variables. Using default secret for development only.');
}

const validateJWT = async (decoded, request) => {
    try {
        console.log('Validating JWT:', {
            decoded,
            headers: request.headers
        });

        // First verify the token signature
        try {
            jwt.verify(request.auth.token, JWT_SECRET);
        } catch (error) {
            console.error('Token signature verification failed:', error);
            return { credentials: null, isValid: false };
        }

        if (!decoded || !decoded.id) {
            console.error('Invalid token payload:', decoded);
            return { credentials: null, isValid: false };
        }

        // Validate that the user exists in the database
        const { rows } = await query(
            'SELECT id, username, email, role FROM users WHERE id = $1',
            [decoded.id]
        );

        if (!rows.length) {
            console.error('User not found for token:', decoded.id);
            return { credentials: null, isValid: false };
        }

        console.log('Token validation successful for user:', rows[0].username);

        // Return the decoded token as credentials
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
        return { credentials: null, isValid: false };
    }
};

const generateToken = (user) => {
    try {
        console.log('Generating JWT token for user:', {
            userId: user.id,
            username: user.username
        });

        const payload = {
            id: user.id,
            email: user.email,
            username: user.username
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRATION
        });

        console.log('Token generated successfully');
        return token;
    } catch (error) {
        console.error('Token generation error:', error);
        throw error;
    }
};

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token verified successfully:', decoded);
        return decoded;
    } catch (error) {
        console.error('Token verification error:', error);
        throw error;
    }
};

module.exports = {
    JWT_SECRET,
    validateJWT,
    generateToken,
    verifyToken
}; 