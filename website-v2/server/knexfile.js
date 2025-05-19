require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT || 5432,
      user: process.env.PGUSER || 'cs_rankings_admin',
      password: process.env.PGPASSWORD || 'cse-247-admin',
      database: process.env.PGDATABASE || 'cs_rankings'
    },
    migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE
    },
    migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    }
  }
}; 