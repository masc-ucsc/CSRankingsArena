const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const axios = require('axios');
const { query } = require('../../config/db');
const config = require('../../config');
const { generateToken, verifyToken } = require('../../config/auth');

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/v2/auth/github/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

module.exports = [
    {
        method: 'GET',
        path: '/api/v2/auth/github',
        options: {
            // auth: false, // Temporarily disabled auth
            tags: ['api', 'auth'],
            description: 'Initiate GitHub OAuth login',
            handler: async (request, h) => {
                console.log('GitHub OAuth initiation:', {
                    redirect: request.query.redirect,
                    clientId: GITHUB_CLIENT_ID ? 'present' : 'missing',
                    clientSecret: GITHUB_CLIENT_SECRET ? 'present' : 'missing',
                    callbackUrl: GITHUB_CALLBACK_URL,
                    headers: request.headers,
                    url: request.url
                });

                if (!GITHUB_CLIENT_ID) {
                    console.error('GitHub Client ID is missing');
                    throw Boom.badImplementation('GitHub OAuth is not configured');
                }

                const redirect = request.query.redirect || '/';
                const state = encodeURIComponent(redirect);
                const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=user:email&state=${state}`;
                
                console.log('Redirecting to GitHub:', githubAuthUrl);
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
                    code: Joi.string().required(),
                    state: Joi.string().optional()
                })
            },
            handler: async (request, h) => {
                try {
                    console.log('GitHub OAuth callback received:', {
                        code: request.query.code ? 'present' : 'missing',
                        state: request.query.state,
                        clientId: GITHUB_CLIENT_ID ? 'present' : 'missing',
                        clientSecret: GITHUB_CLIENT_SECRET ? 'present' : 'missing',
                        callbackUrl: GITHUB_CALLBACK_URL
                    });

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

                    console.log('GitHub token response:', {
                        status: tokenResponse.status,
                        hasAccessToken: !!tokenResponse.data.access_token,
                        error: tokenResponse.data.error
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
                    const { rows: existingUsers } = await query(
                        'SELECT * FROM users WHERE github_id = $1',
                        [githubUser.id.toString()]
                    );
                    let user = existingUsers[0];

                    if (!user) {
                        // Create new user
                        const { rows: newUsers } = await query(
                            `INSERT INTO users (github_id, username, email, avatar_url, access_token)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING *`,
                            [
                                githubUser.id.toString(),
                                githubUser.login,
                                primaryEmail,
                                githubUser.avatar_url,
                                accessToken
                            ]
                        );
                        user = newUsers[0];
                    } else {
                        // Update existing user
                        const { rows: updatedUsers } = await query(
                            `UPDATE users 
                             SET username = $1, email = $2, avatar_url = $3, access_token = $4, updated_at = NOW()
                             WHERE id = $5
                             RETURNING *`,
                            [
                                githubUser.login,
                                primaryEmail,
                                githubUser.avatar_url,
                                accessToken,
                                user.id
                            ]
                        );
                        user = updatedUsers[0];
                    }

                    // Generate JWT token
                    const token = generateToken(user);

                    // Get the original redirect URL from state parameter
                    const state = request.query.state;
                    const redirectUrl = state ? decodeURIComponent(state) : '/';

                    // Log the final redirect details
                    console.log('Preparing to redirect to frontend:', {
                        frontendUrl: FRONTEND_URL,
                        token: token ? 'present' : 'missing',
                        redirectUrl,
                        fullRedirectUrl: `${FRONTEND_URL}/auth/callback?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`
                    });

                    // Redirect to frontend with token and original redirect URL
                    return h.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`);
                } catch (error) {
                    console.error('GitHub OAuth error:', error);
                    console.error('Error details:', {
                        message: error.message,
                        stack: error.stack,
                        response: error.response?.data
                    });
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
                    const user = await query(
                        'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = $1',
                        [request.auth.credentials.id]
                    );

                    if (!user.rows.length) {
                        throw Boom.notFound('User not found');
                    }

                    return { user: user.rows[0] };
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
    },
    {
        method: 'POST',
        path: '/api/v2/auth/login',
        options: {
            description: 'Login user and return JWT token',
            tags: ['api', 'v2', 'auth'],
            auth: false, // No auth required for login
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().required()
                })
            },
            handler: async (request, h) => {
                try {
                    const { email, password } = request.payload;

                    // Here you would typically validate credentials against your database
                    // For now, we'll use a mock user
                    const mockUser = {
                        id: '1',
                        email: 'test@example.com',
                        role: 'user'
                    };

                    // In a real application, you would:
                    // 1. Find the user by email
                    // 2. Verify the password
                    // 3. Generate a token
                    const token = generateToken(mockUser);

                    return h.response({
                        success: true,
                        token,
                        user: mockUser
                    });
                } catch (error) {
                    console.error('Login error:', error);
                    throw Boom.unauthorized('Invalid credentials');
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v2/auth/verify',
        options: {
            description: 'Verify JWT token and return user info',
            tags: ['api', 'v2', 'auth'],
            auth: 'jwt',
            handler: async (request, h) => {
                try {
                    // The user info is already available in request.auth.credentials
                    // because of the JWT strategy validation
                    return h.response({
                        success: true,
                        user: request.auth.credentials
                    });
                } catch (error) {
                    console.error('Token verification error:', error);
                    throw Boom.unauthorized('Invalid token');
                }
            }
        }
    }
]; 