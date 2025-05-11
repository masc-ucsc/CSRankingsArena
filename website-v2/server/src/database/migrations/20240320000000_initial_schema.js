exports.up = function(knex) {
    return knex.schema
        .createTable('papers', function(table) {
            table.increments('id').primary();
            table.string('title').notNullable();
            table.string('authors').notNullable();
            table.string('url').notNullable();
            table.string('arxiv_id').unique();
            table.string('doi').unique();
            table.string('category').notNullable();
            table.string('subcategory').notNullable();
            table.integer('year').notNullable();
            table.jsonb('arxiv_details');
            table.jsonb('validation');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        .createTable('categories', function(table) {
            table.increments('id').primary();
            table.string('slug').unique().notNullable();
            table.string('name').notNullable();
            table.string('parent_slug').references('slug').inTable('categories');
            table.jsonb('arxiv_categories').notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        });
};

exports.down = function(knex) {
    return knex.schema
        .dropTable('papers')
        .dropTable('categories');
}; 