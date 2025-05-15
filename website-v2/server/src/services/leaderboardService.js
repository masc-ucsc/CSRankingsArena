const { db } = require('../config/db');

class LeaderboardService {
    /**
     * Calculate rankings for papers in a subcategory for a specific year
     * @param {string} category - Category slug
     * @param {string} subcategory - Subcategory slug
     * @param {number} year - Year to calculate rankings for
     * @returns {Promise<Array>} Array of ranked papers with their stats
     */
    async calculateRankings(category, subcategory, year) {
        // Get all completed matches for the category/subcategory/year
        const matches = await db('matches')
            .select(
                'matches.*',
                'p1.id as paper1_id',
                'p1.title as paper1_title',
                'p2.id as paper2_id',
                'p2.title as paper2_title',
                'w.id as winner_id'
            )
            .join('papers as p1', 'matches.paper1_id', 'p1.id')
            .join('papers as p2', 'matches.paper2_id', 'p2.id')
            .leftJoin('agents as w', 'matches.winner_id', 'w.id')
            .where({
                'matches.category': category,
                'matches.subcategory': subcategory,
                'matches.status': 'completed'
            })
            .whereRaw('EXTRACT(YEAR FROM p1.published) = ?', [year])
            .whereRaw('EXTRACT(YEAR FROM p2.published) = ?', [year]);

        // Initialize paper stats
        const paperStats = new Map();

        // Process each match to update paper stats
        for (const match of matches) {
            // Initialize stats for paper1 if not exists
            if (!paperStats.has(match.paper1_id)) {
                paperStats.set(match.paper1_id, {
                    id: match.paper1_id,
                    title: match.paper1_title,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    points: 0,
                    matches: 0
                });
            }

            // Initialize stats for paper2 if not exists
            if (!paperStats.has(match.paper2_id)) {
                paperStats.set(match.paper2_id, {
                    id: match.paper2_id,
                    title: match.paper2_title,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    points: 0,
                    matches: 0
                });
            }

            const paper1Stats = paperStats.get(match.paper1_id);
            const paper2Stats = paperStats.get(match.paper2_id);

            // Update stats based on match result
            if (match.winner_id) {
                if (match.winner_id === match.paper1_id) {
                    paper1Stats.wins++;
                    paper1Stats.points += 3;
                    paper2Stats.losses++;
                } else {
                    paper2Stats.wins++;
                    paper2Stats.points += 3;
                    paper1Stats.losses++;
                }
            } else {
                // Draw
                paper1Stats.draws++;
                paper2Stats.draws++;
                paper1Stats.points += 1;
                paper2Stats.points += 1;
            }

            paper1Stats.matches++;
            paper2Stats.matches++;
        }

        // Convert to array and sort by points (descending)
        const rankings = Array.from(paperStats.values())
            .sort((a, b) => {
                // First sort by points
                if (b.points !== a.points) {
                    return b.points - a.points;
                }
                // Then by wins
                if (b.wins !== a.wins) {
                    return b.wins - a.wins;
                }
                // Then by goal difference (wins - losses)
                const bDiff = b.wins - b.losses;
                const aDiff = a.wins - a.losses;
                if (bDiff !== aDiff) {
                    return bDiff - aDiff;
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
        const years = await db('matches')
            .select(db.raw('DISTINCT EXTRACT(YEAR FROM papers.published) as year'))
            .join('papers', function() {
                this.on('papers.id', '=', 'matches.paper1_id')
                    .orOn('papers.id', '=', 'matches.paper2_id');
            })
            .where({
                'matches.category': category,
                'matches.subcategory': subcategory,
                'matches.status': 'completed'
            })
            .orderBy('year', 'desc');

        return years.map(y => parseInt(y.year));
    }
}

module.exports = new LeaderboardService(); 