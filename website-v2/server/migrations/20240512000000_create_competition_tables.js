// migrations/20240512000000_create_competition_tables.js
/**
 * Migration to create tables for the competition system
 */
exports.up = function(knex) {
  return Promise.all([
    // Create agents table
    knex.schema.createTable('agents', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('model').notNullable();
      table.string('provider').notNullable();
      table.json('options').defaultTo('{}');
      table.integer('matches_played').defaultTo(0);
      table.integer('matches_won').defaultTo(0);
      table.integer('matches_drawn').defaultTo(0);
      table.integer('matches_lost').defaultTo(0);
      table.integer('points').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at');
      
      // Add unique constraint on name and model
      table.unique(['name', 'model']);
    }),
    
    // Create matches table
    knex.schema.createTable('matches', function(table) {
      table.uuid('id').primary();
      table.integer('paper_id').notNullable().references('id').inTable('papers').onDelete('CASCADE');
      table.integer('agent1_id').notNullable().references('id').inTable('agents').onDelete('CASCADE');
      table.integer('agent2_id').notNullable().references('id').inTable('agents').onDelete('CASCADE');
      table.integer('winner_id').nullable().references('id').inTable('agents').onDelete('SET NULL');
      table.string('status').notNullable().defaultTo('pending');
      table.text('error').nullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('completed_at').nullable();
      
      // Add index on status
      table.index('status');
    }),
    
    // Create reviews table
    knex.schema.createTable('reviews', function(table) {
      table.increments('id').primary();
      table.uuid('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
      table.integer('agent_id').notNullable().references('id').inTable('agents').onDelete('CASCADE');
      table.integer('paper_id').notNullable().references('id').inTable('papers').onDelete('CASCADE');
      table.text('summary').notNullable();
      table.json('strengths').notNullable();
      table.json('weaknesses').notNullable();
      table.json('questions').notNullable();
      table.integer('rating').notNullable();
      table.string('confidence').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      
      // Add unique constraint on match_id and agent_id
      table.unique(['match_id', 'agent_id']);
    }),
    
    // Create evaluations table
    knex.schema.createTable('evaluations', function(table) {
      table.increments('id').primary();
      table.uuid('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
      table.integer('review1_id').notNullable().references('id').inTable('reviews').onDelete('CASCADE');
      table.integer('review2_id').notNullable().references('id').inTable('reviews').onDelete('CASCADE');
      table.integer('winner_id').nullable().references('id').inTable('agents').onDelete('SET NULL');
      table.text('reasoning').notNullable();
      table.integer('technical_correctness_1').notNullable();
      table.integer('technical_correctness_2').notNullable();
      table.integer('depth_of_analysis_1').notNullable();
      table.integer('depth_of_analysis_2').notNullable();
      table.integer('constructive_feedback_1').notNullable();
      table.integer('constructive_feedback_2').notNullable();
      table.integer('clarity_1').notNullable();
      table.integer('clarity_2').notNullable();
      table.integer('fairness_1').notNullable();
      table.integer('fairness_2').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      
      // Add unique constraint on match_id
      table.unique(['match_id']);
    }),
    
    // Create feedback table
    knex.schema.createTable('feedback', function(table) {
      table.increments('id').primary();
      table.uuid('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('vote').nullable().checkIn(['agree', 'disagree']);
      table.text('comment').nullable();
      table.integer('likes').notNullable().defaultTo(0);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').nullable();
      
      // Add index on match_id
      table.index('match_id');
    }),
    
    // Create tournaments table
    knex.schema.createTable('tournaments', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description').nullable();
      table.timestamp('start_date').notNullable();
      table.timestamp('end_date').nullable();
      table.string('status').notNullable().defaultTo('upcoming');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').nullable();
    }),
    
    // Create tournament_matches junction table
    knex.schema.createTable('tournament_matches', function(table) {
      table.increments('id').primary();
      table.integer('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
      table.uuid('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
      table.integer('round').notNullable();
      table.integer('position').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      
      // Add unique constraint on tournament_id and match_id
      table.unique(['tournament_id', 'match_id']);
    })
  ]);
};

/**
 * Rollback migration
 */
exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('tournament_matches'),
    knex.schema.dropTableIfExists('tournaments'),
    knex.schema.dropTableIfExists('feedback'),
    knex.schema.dropTableIfExists('evaluations'),
    knex.schema.dropTableIfExists('reviews'),
    knex.schema.dropTableIfExists('matches'),
    knex.schema.dropTableIfExists('agents')
  ]);
};