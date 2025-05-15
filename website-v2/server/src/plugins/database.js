'use strict';

const Knex = require('knex');
const { Model } = require('objection');
const config = require('../config');

exports.plugin = {
    name: 'database',
    version: '1.0.0',
    register: async function (server, options) {
        // Initialize Knex
        const knex = Knex({
            client: 'pg',
            connection: {
                host: config.database.host,
                port: config.database.port,
                database: config.database.database,
                user: config.database.user,
                password: config.database.password
            },
            debug: process.env.NODE_ENV !== 'production',
            pool: {
                min: 2,
                max: 10
            }
        });
        
        // Bind Objection.js to Knex
        Model.knex(knex);
        
        // Make knex available through server
        server.app.knex = knex;
        
        // Close database connection when server stops
        server.ext('onPostStop', async (server) => {
            await server.app.knex.destroy();
            console.log('Database connection closed');
        });
    }
};