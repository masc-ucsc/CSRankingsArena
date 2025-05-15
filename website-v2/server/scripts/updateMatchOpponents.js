const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Updates opponent IDs in matches.yaml files to use valid paper IDs
 * Converts from "Category Opponent N" to "category-year-N" format
 */
async function updateMatchOpponents() {
    const baseDir = path.join(__dirname, '..', 'mock', 'papers');
    const categories = await fs.readdir(baseDir);

    for (const category of categories) {
        const categoryPath = path.join(baseDir, category);
        const subcategories = await fs.readdir(categoryPath);

        for (const subcategory of subcategories) {
            const subcategoryPath = path.join(categoryPath, subcategory);
            const years = await fs.readdir(subcategoryPath);

            for (const year of years) {
                const yearPath = path.join(subcategoryPath, year);
                const files = await fs.readdir(yearPath);

                // Find the matches file
                const matchesFile = files.find(f => f.endsWith('-matches.yaml'));
                if (!matchesFile) continue;

                const matchesPath = path.join(yearPath, matchesFile);
                console.log(`Processing ${matchesPath}`);

                try {
                    // Read and parse the matches file
                    const fileContent = await fs.readFile(matchesPath, 'utf8');
                    const data = yaml.load(fileContent);

                    if (!data || !data.matches) {
                        console.log(`No matches found in ${matchesPath}`);
                        continue;
                    }

                    // Create a map of paper titles to IDs for this category/year
                    const paperIdMap = new Map();
                    data.matches.forEach(paper => {
                        // Extract the number from the title (e.g., "Llm Paper 1 (2024)" -> "1")
                        const titleMatch = paper.title.match(/\d+/);
                        if (titleMatch) {
                            const paperNum = titleMatch[0];
                            paperIdMap.set(paper.title, `${subcategory}-${year}-${paperNum}`);
                        }
                    });

                    // Update opponent IDs in match details
                    let updated = false;
                    data.matches.forEach(paper => {
                        if (paper.match_details) {
                            paper.match_details.forEach(match => {
                                // Convert "Category Opponent N" to "category-year-N"
                                const oldOpponent = match.opponent;
                                const opponentMatch = oldOpponent.match(/(\w+)\s+Opponent\s+(\d+)/i);
                                if (opponentMatch) {
                                    const [_, category, num] = opponentMatch;
                                    const newOpponent = `${subcategory}-${year}-${num}`;
                                    if (paperIdMap.has(`${category} Paper ${num} (${year})`)) {
                                        match.opponent = newOpponent;
                                        updated = true;
                                    }
                                }
                            });
                        }
                    });

                    if (updated) {
                        // Write back the updated file
                        const updatedContent = yaml.dump(data, {
                            lineWidth: -1, // No line wrapping
                            noRefs: true, // Don't use YAML references
                            sortKeys: false // Maintain original key order
                        });
                        await fs.writeFile(matchesPath, updatedContent, 'utf8');
                        console.log(`Updated ${matchesPath}`);
                    } else {
                        console.log(`No updates needed for ${matchesPath}`);
                    }

                } catch (error) {
                    console.error(`Error processing ${matchesPath}:`, error);
                }
            }
        }
    }
}

// Run the update
updateMatchOpponents().then(() => {
    console.log('Finished updating match opponents');
}).catch(error => {
    console.error('Error updating match opponents:', error);
    process.exit(1);
}); 