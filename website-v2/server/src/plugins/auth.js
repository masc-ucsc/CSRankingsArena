const { validateJWT } = require('../config/auth');

const authPlugin = {
    name: 'auth',
    register: async (server) => {
        await server.register(require('@hapi/jwt'));

        server.auth.strategy('jwt', 'jwt', {
            keys: process.env.JWT_SECRET || 'a4305c89bedf2d80a844b0296bb3912b3cd1bb05bf302d6beb6578d03df948183e7fb97f9e4a5427c7580c367c481997a1cf1d98aff6d124fa3cf71f1ab3b5ba',
            verify: {
                aud: false,
                iss: false,
                sub: false,
                maxAgeSec: 24 * 60 * 60 // 24 hours
            },
            validate: async (artifacts, request, h) => {
                try {
                    console.log('JWT validation started:', {
                        path: request.path,
                        method: request.method,
                        token: artifacts.token ? 'present' : 'missing',
                        decoded: artifacts.decoded,
                        headers: request.headers,
                        auth: request.auth
                    });

                    if (!artifacts.token) {
                        console.error('No token provided');
                        return { credentials: null, isValid: false };
                    }

                    if (!artifacts.decoded) {
                        console.error('No decoded token data');
                        return { credentials: null, isValid: false };
                    }

                    console.log('Calling validateJWT with:', {
                        decoded: artifacts.decoded,
                        token: artifacts.token
                    });

                    const result = await validateJWT(artifacts.decoded, request);
                    
                    console.log('validateJWT result:', result);

                    if (!result.isValid) {
                        console.error('JWT validation failed:', result);
                        return { credentials: null, isValid: false };
                    }

                    console.log('JWT validation successful');
                    return result;
                } catch (error) {
                    console.error('JWT validation error:', {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    });
                    return { credentials: null, isValid: false };
                }
            }
        });

        server.auth.default('jwt');
    }
};

module.exports = authPlugin; 