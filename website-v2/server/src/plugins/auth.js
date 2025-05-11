'use strict';

const HapiAuthJwt2 = require('hapi-auth-jwt2');
const config = require('../config');
const usersService = require('../services/users.service');

const validateUser = async (decoded, request, h) => {
    try {
        const user = await usersService.findById(decoded.id);
        
        if (!user) {
            return { isValid: false };
        }
        
        return { isValid: true, credentials: { id: user.id, username: user.username, role: user.role } };
    } catch (error) {
        console.error('Error validating token:', error);
        return { isValid: false };
    }
};

exports.plugin = {
    name: 'auth',
    version: '1.0.0',
    register: async function (server, options) {
        await server.register(HapiAuthJwt2);
        
        server.auth.strategy('jwt', 'jwt', {
            key: config.auth.jwt.secret,
            validate: validateUser,
            verifyOptions: { algorithms: ['HS256'] }
        });
        
        server.auth.default('jwt');
    }
};
