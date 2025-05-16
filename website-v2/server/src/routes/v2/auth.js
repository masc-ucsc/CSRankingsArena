const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { db } = require('../../config/db');
const config = require('../../config');

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id,
            username: user.username,
            github_id: user.github_id
        },
        config.auth.jwt.secret,
        { expiresIn: config.auth.jwt.expiresIn }
    );
};

module.exports = [
    {
        method: 'GET',
        path: '/api/v2/auth/github',
        options: {
            // auth: false, // Temporarily disabled auth
            tags: ['api', 'auth'],
            description: 'Initiate GitHub OAuth login',
            handler: async (request, h) => {
                const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&scope=user:email`;
                return h.redirect(githubAuthUrl);
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/auth/github/callback',
        options: {
            // auth: false, // Temporarily disabled auth
            tags: ['api', 'auth'],
            description: 'Handle GitHub OAuth callback',
            validate: {
                query: Joi.object({
                    code: Joi.string().required()
                })
            },
            handler: async (request, h) => {
                try {
                    // Exchange code for access token
                    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
                        client_id: GITHUB_CLIENT_ID,
                        client_secret: GITHUB_CLIENT_SECRET,
                        code: request.query.code
                    }, {
                        headers: {
                            Accept: 'application/json'
                        }
                    });

                    const accessToken = tokenResponse.data.access_token;

                    // Get user data from GitHub
                    const userResponse = await axios.get('https://api.github.com/user', {
                        headers: {
                            Authorization: `token ${accessToken}`
                        }
                    });

                    const githubUser = userResponse.data;

                    // Get user email from GitHub
                    const emailResponse = await axios.get('https://api.github.com/user/emails', {
                        headers: {
                            Authorization: `token ${accessToken}`
                        }
                    });

                    const primaryEmail = emailResponse.data.find(email => email.primary)?.email;

                    // Find or create user
                    let user = await db('users').where('github_id', githubUser.id.toString()).first();

                    if (!user) {
                        // Create new user
                        [user] = await db('users').insert({
                            github_id: githubUser.id.toString(),
                            username: githubUser.login,
                            email: primaryEmail,
                            avatar_url: githubUser.avatar_url,
                            access_token: accessToken
                        }).returning('*');
                    } else {
                        // Update existing user
                        [user] = await db('users')
                            .where('id', user.id)
                            .update({
                                username: githubUser.login,
                                email: primaryEmail,
                                avatar_url: githubUser.avatar_url,
                                access_token: accessToken,
                                updated_at: new Date()
                            })
                            .returning('*');
                    }

                    // Generate JWT token
                    const token = generateToken(user);

                    // Redirect to frontend with token
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    return h.redirect(`${frontendUrl}/auth/callback?token=${token}`);
                } catch (error) {
                    console.error('GitHub OAuth error:', error);
                    throw Boom.unauthorized('Failed to authenticate with GitHub');
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/auth/profile',
        options: {
            // auth: 'jwt', // Temporarily disabled auth
            tags: ['api', 'auth'],
            description: 'Get current user profile',
            handler: async (request, h) => {
                try {
                    const user = await db('users')
                        .where('id', request.auth.credentials.id)
                        .select('id', 'username', 'email', 'avatar_url', 'created_at')
                        .first();

                    if (!user) {
                        throw Boom.notFound('User not found');
                    }

                    return { user };
                } catch (error) {
                    throw Boom.unauthorized('Failed to get user profile');
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/v2/auth/logout',
        options: {
            // auth: 'jwt', // Temporarily disabled auth
            tags: ['api', 'auth'],
            description: 'Logout user',
            handler: async (request, h) => {
                // In a JWT-based system, we don't need to do anything server-side
                // The client should remove the token
                return { message: 'Logged out successfully' };
            }
        }
    }
]; 