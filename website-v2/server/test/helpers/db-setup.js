/**
 * Test database setup and teardown utilities
 */
const { db } = require('../../src/config/db');
const fs = require('fs');
const path = require('path');

/**
 * Initialize test database
 */
const setupTestDb = async () => {
  try {
    // Check if we're in a test environment
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('setupTestDb should only be run in test environment');
    }

    // Make sure we're using the test database
    const currentDb = await db.raw('SELECT current_database()');
    const dbName = currentDb.rows[0].current_database;
    
    if (!dbName.includes('test')) {
      throw new Error(`Not a test database: ${dbName}`);
    }

    // Run migrations
    await db.migrate.latest();
    
    // Run test seeds
    await db.seed.run({
      directory: path.join(__dirname, '../../seeds/test')
    });

    return db;
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
};

/**
 * Clean up test database
 */
const teardownTestDb = async () => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('teardownTestDb should only be run in test environment');
    }

    // Truncate all tables (except migrations)
    const tables = await db
      .raw(`SELECT tablename FROM pg_tables 
             WHERE schemaname='public' 
             AND tablename != 'knex_migrations' 
             AND tablename != 'knex_migrations_lock'`);
    
    await db.raw('BEGIN');
    
    // Disable foreign key checks during truncation
    await db.raw('SET CONSTRAINTS ALL DEFERRED');
    
    for (const { tablename } of tables.rows) {
      await db.raw(`TRUNCATE TABLE "${tablename}" CASCADE`);
    }
    
    // Re-enable foreign key checks
    await db.raw('SET CONSTRAINTS ALL IMMEDIATE');
    await db.raw('COMMIT');

    return true;
  } catch (error) {
    console.error('Test database teardown failed:', error);
    throw error;
  }
};

/**
 * Create mock data for tests
 */
const createMockData = async () => {
  // Create test users
  const users = await db('users').insert([
    { username: 'testuser1', github_id: '12345', email: 'test1@example.com' },
    { username: 'testuser2', github_id: '67890', email: 'test2@example.com' }
  ]).returning('*');

  // Create test categories
  const categories = await db('categories').insert([
    { name: 'Artificial Intelligence', slug: 'ai', description: 'AI research papers' },
    { name: 'Machine Learning', slug: 'ml', description: 'ML research papers' }
  ]).returning('*');

  // Create test papers
  const papers = await db('papers').insert([
    { 
      title: 'Test Paper 1', 
      authors: JSON.stringify(['Author 1', 'Author 2']), 
      abstract: 'Test abstract 1',
      venue: 'Test Conference 1',
      year: 2023,
      category_id: categories[0].id,
      url: 'https://example.com/paper1'
    },
    { 
      title: 'Test Paper 2', 
      authors: JSON.stringify(['Author 3', 'Author 4']), 
      abstract: 'Test abstract 2',
      venue: 'Test Conference 2',
      year: 2023,
      category_id: categories[1].id,
      url: 'https://example.com/paper2'
    }
  ]).returning('*');

  // Create test agents
  const agents = await db('agents').insert([
    { 
      name: 'Test Agent 1', 
      user_id: users[0].id,
      description: 'Test agent 1 description',
      status: 'active',
      config: JSON.stringify({ model: 'test-model-1' })
    },
    { 
      name: 'Test Agent 2', 
      user_id: users[1].id,
      description: 'Test agent 2 description',
      status: 'active',
      config: JSON.stringify({ model: 'test-model-2' })
    }
  ]).returning('*');

  // Create test matches
  const matches = await db('matches').insert([
    {
      status: 'completed',
      result: JSON.stringify({ winner: agents[0].id, loser: agents[1].id }),
      paper_id: papers[0].id,
      category_id: categories[0].id
    },
    {
      status: 'pending',
      paper_id: papers[1].id,
      category_id: categories[1].id
    }
  ]).returning('*');

  // Create match_agents relations
  await db('match_agents').insert([
    { match_id: matches[0].id, agent_id: agents[0].id },
    { match_id: matches[0].id, agent_id: agents[1].id },
    { match_id: matches[1].id, agent_id: agents[0].id },
    { match_id: matches[1].id, agent_id: agents[1].id }
  ]);

  return {
    users,
    categories,
    papers,
    agents,
    matches
  };
};

module.exports = {
  setupTestDb,
  teardownTestDb,
  createMockData,
  db
}; 