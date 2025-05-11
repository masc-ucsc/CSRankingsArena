/**
 * Migration to add enhanced feedback fields
 */
exports.up = function(knex) {
  return knex.schema.alterTable('feedback', function(table) {
    // Add fields for agent-specific feedback
    table.integer('agent_id').references('id').inTable('agents').onDelete('SET NULL');
    table.integer('rating').nullable().checkIn([1, 2, 3, 4, 5]);
    table.boolean('liked').nullable();
    table.text('agent_feedback').nullable();
    
    // Add index on agent_id
    table.index('agent_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('feedback', function(table) {
    table.dropColumn('agent_id');
    table.dropColumn('rating');
    table.dropColumn('liked');
    table.dropColumn('agent_feedback');
  });
}; 