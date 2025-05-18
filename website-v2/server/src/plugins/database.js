'use strict';

const knex = require('knex');
const { Model } = require('objection');
const config = require('../config');
const MatchInteraction = require('../models/matchInteractions');

const db = knex({
    client: 'pg',
    connection: {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT || 5432,
        user: process.env.PGUSER || 'cs_rankings_admin',
        password: process.env.PGPASSWORD || 'cse-247-admin',
        database: process.env.PGDATABASE || 'cs_rankings'
    }
});

const plugin = {
    name: 'database',
    register: async (server) => {
        // Add db to server
        server.decorate('server', 'db', db);
        server.decorate('request', 'db', db);

        // Bind Objection.js to Knex
        Model.knex(db);
        
        // Initialize tables
        try {
            await MatchInteraction.initialize(db);
        } catch (error) {
            console.error('Error initializing tables:', error);
            throw error;
        }

        // Close db connection when server stops
        server.ext('onPreStop', async () => {
            await db.destroy();
        });
    }
};

module.exports = plugin;