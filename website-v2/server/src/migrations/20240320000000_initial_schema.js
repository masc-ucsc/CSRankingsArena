exports.up = function(knex) {
    return knex.schema
        // Enable trigram extension for text search
        .raw('CREATE EXTENSION IF NOT EXISTS pg_trgm')
        
        // Categories table
        .createTable('categories', function(table) {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('slug').unique().notNullable();
            table.string('description');
            table.string('color', 50);
            table.string('parent_slug').references('slug').inTable('categories');
            table.jsonb('arxiv_categories').notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        
        // Subcategories table
        .createTable('subcategories', function(table) {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('slug').notNullable();
            table.string('description');
            table.integer('category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['category_id', 'slug']);
        })
        
        // Authors table
        .createTable('authors', function(table) {
            table.increments('id').primary();
            table.string('name').notNullable().unique();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        
        // Papers table
        .createTable('papers', function(table) {
            table.increments('id').primary();
            table.string('arxiv_id').unique();
            table.string('title').notNullable();
            table.text('abstract').notNullable();
            table.timestamp('published').notNullable();
            table.timestamp('updated').notNullable();
            table.string('url').notNullable();
            table.string('pdf_url').notNullable();
            table.string('journal');
            table.string('doi').unique();
            table.text('comments');
            table.integer('published_year').notNullable();
            table.jsonb('metadata');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        
        // Paper-Author junction table
        .createTable('paper_authors', function(table) {
            table.integer('paper_id').notNullable().references('id').inTable('papers').onDelete('CASCADE');
            table.integer('author_id').notNullable().references('id').inTable('authors').onDelete('CASCADE');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.primary(['paper_id', 'author_id']);
        })
        
        // Paper-Subcategory junction table
        .createTable('paper_subcategories', function(table) {
            table.integer('paper_id').notNullable().references('id').inTable('papers').onDelete('CASCADE');
            table.integer('subcategory_id').notNullable().references('id').inTable('subcategories').onDelete('CASCADE');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.primary(['paper_id', 'subcategory_id']);
        })
        
        // Agents table
        .createTable('agents', function(table) {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('model').notNullable();
            table.string('provider').notNullable();
            table.jsonb('options').defaultTo('{}');
            table.integer('matches_played').defaultTo(0);
            table.integer('matches_won').defaultTo(0);
            table.integer('matches_drawn').defaultTo(0);
            table.integer('matches_lost').defaultTo(0);
            table.integer('points').defaultTo(0);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['name', 'model']);
        })
        
        // Matches table
        .createTable('matches', function(table) {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.integer('paper_id').notNullable().references('id').inTable('papers').onDelete('CASCADE');
            table.integer('agent1_id').notNullable().references('id').inTable('agents').onDelete('CASCADE');
            table.integer('agent2_id').notNullable().references('id').inTable('agents').onDelete('CASCADE');
            table.integer('winner_id').nullable().references('id').inTable('agents').onDelete('SET NULL');
            table.string('status').notNullable().defaultTo('pending');
            table.text('error').nullable();
            table.jsonb('match_data');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('completed_at').nullable();
            table.index('status');
            table.check('agent1_id != agent2_id');
        })
        
        // Reviews table
        .createTable('reviews', function(table) {
            table.increments('id').primary();
            table.uuid('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
            table.integer('agent_id').notNullable().references('id').inTable('agents').onDelete('CASCADE');
            table.text('content').notNullable();
            table.decimal('technical_score', 3, 2);
            table.decimal('depth_score', 3, 2);
            table.decimal('feedback_score', 3, 2);
            table.decimal('clarity_score', 3, 2);
            table.decimal('fairness_score', 3, 2);
            table.decimal('overall_score', 3, 2);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            table.unique(['match_id', 'agent_id']);
        })
        
        // Community feedback table
        .createTable('community_feedback', function(table) {
            table.increments('id').primary();
            table.integer('review_id').notNullable().references('id').inTable('reviews').onDelete('CASCADE');
            table.integer('user_id').nullable(); // NULL for anonymous feedback
            table.integer('rating').notNullable().checkBetween(1, 5);
            table.text('comment');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        
        // Match interactions table
        .createTable('match_interactions', function(table) {
            table.increments('id').primary();
            table.string('match_id').notNullable();
            table.string('type').notNullable(); // 'like', 'dislike', or 'comment'
            table.text('content').nullable(); // For comments
            table.boolean('is_anonymous').defaultTo(false);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        
        // Create indexes for better performance
        .raw('CREATE INDEX papers_published_year_idx ON papers(published_year)')
        .raw('CREATE INDEX papers_title_trgm_idx ON papers USING GIN(title gin_trgm_ops)')
        .raw('CREATE INDEX papers_abstract_trgm_idx ON papers USING GIN(abstract gin_trgm_ops)')
        .raw('CREATE INDEX matches_paper_id_idx ON matches(paper_id)')
        .raw('CREATE INDEX matches_status_idx ON matches(status)')
        .raw('CREATE INDEX reviews_match_id_idx ON reviews(match_id)')
        .raw('CREATE INDEX community_feedback_review_id_idx ON community_feedback(review_id)');
};

exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('community_feedback')
        .dropTableIfExists('reviews')
        .dropTableIfExists('matches')
        .dropTableIfExists('agents')
        .dropTableIfExists('paper_subcategories')
        .dropTableIfExists('paper_authors')
        .dropTableIfExists('papers')
        .dropTableIfExists('authors')
        .dropTableIfExists('subcategories')
        .dropTableIfExists('categories')
        .dropTableIfExists('match_interactions')
        .raw('DROP EXTENSION IF EXISTS pg_trgm');
}; 