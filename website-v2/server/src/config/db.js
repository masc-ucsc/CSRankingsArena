'use strict';

const { Pool } = require('pg');
require('dotenv').config();

// Create a PostgreSQL pool
const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'cs_rankings',
    password: process.env.PGPASSWORD || 'postgres',
    port: process.env.PGPORT || 5432,
    // Add connection timeout
    connectionTimeoutMillis: 5000,
    // Add idle timeout
    idleTimeoutMillis: 30000,
    // Add max connections
    max: 20
});

// Test connection
pool.on('connect', () => {
    console.log('New client connected to database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test initial connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.stack);
        process.exit(-1);
    } else {
        console.log('Database connected successfully:', res.rows[0].now);
    }
});

// Export query function and client getter
module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: async () => {
        const client = await pool.connect();
        const query = client.query;
        const release = client.release;
        
        // Set a timeout of 5 seconds, after which we will log this client's last query
        const timeout = setTimeout(() => {
            console.error('A client has been checked out for more than 5 seconds!');
            console.error(`The last executed query on this client was: ${client.lastQuery}`);
        }, 5000);
        
        // Monkey patch the query method to keep track of the last query executed
        client.query = (...args) => {
            client.lastQuery = args;
            return query.apply(client, args);
        };
        
        client.release = () => {
            clearTimeout(timeout);
            client.query = query;
            client.release = release;
            return release.apply(client);
        };
        
        return client;
    },
    // Export pool for direct access if needed
    pool
};