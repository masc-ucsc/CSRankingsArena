/**
 * Migration to create papers table with support for demo papers
 */
exports.up = function(knex) {
  return knex.schema.createTable('papers', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('abstract').notNullable();
    table.string('arxiv_id').nullable(); // For real papers
    table.string('authors').notNullable();
    table.string('venue').nullable();
    table.integer('year').nullable();
    table.string('category').notNullable(); // Main category
    table.string('subcategory').notNullable(); // Subcategory
    table.boolean('is_demo').notNullable().defaultTo(false); // Flag for demo papers
    table.json('metadata').defaultTo('{}'); // Additional metadata like PDF URL, etc.
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();
    
    // Add indexes for common queries
    table.index(['category', 'subcategory']);
    table.index('arxiv_id');
    table.index('is_demo');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('papers');
}; 