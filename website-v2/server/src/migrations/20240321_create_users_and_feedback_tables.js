exports.up = function(knex) {
    return knex.schema
        .createTable('users', function(table) {
            table.increments('id').primary();
            table.string('github_id').unique().notNullable();
            table.string('username').notNullable();
            table.string('email');
            table.string('avatar_url');
            table.string('access_token');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        .createTable('match_feedback', function(table) {
            table.increments('id').primary();
            table.string('match_id').notNullable();
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.boolean('liked').defaultTo(false);
            table.boolean('disliked').defaultTo(false);
            table.text('comment');
            table.integer('likes').defaultTo(0);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            
            // Ensure a user can only provide one feedback per match
            table.unique(['match_id', 'user_id']);
        })
        .createTable('feedback_likes', function(table) {
            table.increments('id').primary();
            table.integer('feedback_id').unsigned().references('id').inTable('match_feedback').onDelete('CASCADE');
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            
            // Ensure a user can only like a feedback once
            table.unique(['feedback_id', 'user_id']);
        });
};

exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('feedback_likes')
        .dropTableIfExists('match_feedback')
        .dropTableIfExists('users');
}; 