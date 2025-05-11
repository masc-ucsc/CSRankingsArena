'use strict';

require('dotenv').config();

module.exports = {
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'cs_rankings',
        user: process.env.DB_USER || 'cse-247-admin',
        password: process.env.DB_PASSWORD || 'postgres'
    },
    auth: {
        jwt: {
            secret: process.env.JWT_SECRET || 'your-secret-key',
            expiresIn: process.env.JWT_EXPIRES || '7d'
        }
    }
};