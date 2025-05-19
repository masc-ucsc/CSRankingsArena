const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

exports.seed = async function(knex) {
    // Read all YAML files from the papers directory
    const papersDir = path.join(__dirname, '../../../papers');
    const yamlFiles = fs.readdirSync(papersDir)
        .filter(file => file.endsWith('matches.yaml'));

    for (const yamlFile of yamlFiles) {
        const filePath = path.join(papersDir, yamlFile);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const matchData = yaml.load(fileContent);

        // Get or create the paper
        let paper = await knex('papers')
            .where('title', matchData.paper.title)
            .first();

        if (!paper) {
            [paper] = await knex('papers')
                .insert({
                    title: matchData.paper.title,
                    authors: matchData.paper.authors,
                    year: matchData.paper.year,
                    venue: matchData.paper.venue,
                    category: matchData.paper.category,
                    subcategory: matchData.paper.subcategory
                })
                .returning('*');
        }

        // Get or create agents
        const agentPromises = matchData.agents.map(async (agentData) => {
            let agent = await knex('agents')
                .where('name', agentData.name)
                .first();

            if (!agent) {
                [agent] = await knex('agents')
                    .insert({
                        name: agentData.name,
                        description: agentData.description,
                        category: agentData.category,
                        subcategory: agentData.subcategory
                    })
                    .returning('*');
            }

            return agent;
        });

        const agents = await Promise.all(agentPromises);
        const agentMap = new Map(agents.map(agent => [agent.name, agent]));

        // Create matches
        const matches = matchData.matches.map(match => ({
            paper_id: paper.id,
            agent1_id: agentMap.get(match.agent1).id,
            agent2_id: agentMap.get(match.agent2).id,
            winner_id: match.winner ? agentMap.get(match.winner).id : null,
            status: match.status || 'completed',
            created_at: new Date(),
            updated_at: new Date()
        }));

        // Insert matches
        await knex('matches').insert(matches);
    }
}; 