const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

class YamlLeaderboardService {
    /**
     * Calculate rankings for papers in a subcategory for a specific year
     * @param {string} category - Category slug
     * @param {string} subcategory - Subcategory slug
     * @param {number} year - Year to calculate rankings for
     * @returns {Promise<Array>} Array of ranked papers with their stats
     */
    async calculateRankings(category, subcategory, year) {
        // Load papers and matches from YAML files
        const papersPath = path.join(__dirname, '..', '..', 'mock', 'papers', category, subcategory, year, `${category}-${subcategory}-${year}-papers.yaml`);
        const matchesPath = path.join(__dirname, '..', '..', 'mock', 'papers', category, subcategory, year, `${category}-${subcategory}-${year}-matches.yaml`);
        
        let papersData = [];
        let matchesData = [];

        try {
            papersData = yaml.load(fs.readFileSync(papersPath, 'utf8'));
            matchesData = yaml.load(fs.readFileSync(matchesPath, 'utf8'));
        } catch (error) {
            console.error('Error loading YAML files:', error);
            return [];
        }

        // Initialize paper stats
        const paperStats = new Map();

        // Initialize stats for all papers
        papersData.forEach(paper => {
            paperStats.set(paper.id, {
                id: paper.id,
                title: paper.title,
                wins: 0,
                losses: 0,
                draws: 0,
                points: 0,
                matches: 0,
                ratingDiff: 0,
                recentMatches: [], // Store last 5 matches for form
                matchHistory: [] // Store all matches for tooltips
            });
        });

        // Process each match to update paper stats
        for (const match of matchesData) {
            const paper1Stats = paperStats.get(match.id);
            if (!paper1Stats) continue;

            // Update stats based on match data
            paper1Stats.wins = match.wins || 0;
            paper1Stats.draws = match.draws || 0;
            paper1Stats.losses = match.losses || 0;
            paper1Stats.points = match.points || 0;
            paper1Stats.matches = match.matches || 0;
            paper1Stats.ratingDiff = match.ratingDiff || 0;
            paper1Stats.winRate = match.winRate || 0;
            paper1Stats.form = match.form || '';
            paper1Stats.trend = match.trend || 'stable';

            // Process match details
            if (match.match_details) {
                paper1Stats.matchHistory = match.match_details.map(detail => ({
                    date: detail.date,
                    result: detail.result,
                    opponent: detail.opponent,
                    rating: detail.rating
                }));

                // Get last 5 matches for form
                paper1Stats.recentMatches = paper1Stats.matchHistory.slice(0, 5);
            }
        }

        // Convert to array and sort
        const rankings = Array.from(paperStats.values()).sort((a, b) => {
            // First sort by points
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            // Then by wins
            if (b.wins !== a.wins) {
                return b.wins - a.wins;
            }
            // Then by rating difference
            if (b.ratingDiff !== a.ratingDiff) {
                return b.ratingDiff - a.ratingDiff;
            }
            // Finally by matches played (ascending)
            return a.matches - b.matches;
        });

        return rankings;
    }

    /**
     * Get all available years for a category/subcategory
     * @param {string} category - Category slug
     * @param {string} subcategory - Subcategory slug
     * @returns {Promise<Array<number>>} Array of years
     */
    async getAvailableYears(category, subcategory) {
        const basePath = path.join(__dirname, '..', '..', 'mock', 'papers', category, subcategory);
        
        try {
            const years = fs.readdirSync(basePath)
                .filter(dir => /^\d{4}$/.test(dir)) // Only directories that are years
                .map(year => parseInt(year))
                .sort((a, b) => b - a); // Sort descending
            
            return years;
        } catch (error) {
            console.error('Error getting available years:', error);
            return [];
        }
    }
}

module.exports = new YamlLeaderboardService(); 