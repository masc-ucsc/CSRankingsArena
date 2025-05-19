exports.up = function(knex) {
    return knex.schema
        .dropTableIfExists('match_interactions')
        .createTable('match_interactions', function(table) {
            table.increments('id').primary();
            table.string('match_id').notNullable();
            table.string('type').notNullable(); // 'like', 'dislike', or 'comment'
            table.text('content').nullable(); // For comments
            table.boolean('is_anonymous').defaultTo(false);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        });
};

exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('match_interactions')
        .createTable('match_interactions', function(table) {
            table.increments('id').primary();
            table.integer('match_id').notNullable();
            table.string('type').notNullable(); // 'like', 'dislike', or 'comment'
            table.text('content').nullable(); // For comments
            table.boolean('is_anonymous').defaultTo(false);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        });
}; 