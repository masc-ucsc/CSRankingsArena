/**
 * Migration to update reviews table for paper comparison matches
 */
exports.up = function(knex) {
    return knex.schema.alterTable('reviews', function(table) {
        // Add paper_id to reviews to track which paper is being reviewed
        table.integer('paper_id').references('id').inTable('papers').onDelete('CASCADE');
        
        // Add unique constraint to ensure one review per agent per paper per match
        table.unique(['match_id', 'agent_id', 'paper_id']);
        
        // Add index for faster lookups
        table.index(['match_id', 'paper_id']);
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('reviews', function(table) {
        table.dropUnique(['match_id', 'agent_id', 'paper_id']);
        table.dropIndex(['match_id', 'paper_id']);
        table.dropColumn('paper_id');
    });
}; 