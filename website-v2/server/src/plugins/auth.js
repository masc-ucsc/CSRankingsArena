const { validateJWT } = require('../config/auth');

const authPlugin = {
    name: 'auth',
    register: async (server) => {
        await server.register(require('@hapi/jwt'));

        server.auth.strategy('jwt', 'jwt', {
            keys: process.env.JWT_SECRET || 'your-secret-key',
            verify: {
                aud: false,
                iss: false,
                sub: false,
                maxAgeSec: 24 * 60 * 60 // 24 hours
            },
            validate: validateJWT
        });

        server.auth.default('jwt');
    }
};

module.exports = authPlugin; 