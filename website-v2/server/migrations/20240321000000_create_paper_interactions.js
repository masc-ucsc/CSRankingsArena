exports.up = function(knex) {
    return knex.schema.createTable('paper_interactions', function(table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.string('paper_path').notNullable();
        table.enum('interaction_type', ['like', 'dislike']).notNullable();
        table.text('comment').nullable();
        table.timestamps(true, true);
        
        // Composite unique constraint to prevent multiple interactions of same type from same user
        table.unique(['user_id', 'paper_path', 'interaction_type']);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('paper_interactions');
}; 