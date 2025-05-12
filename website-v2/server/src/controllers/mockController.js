const { mockPapers, mockMatches, mockLeaderboard } = require('../mock/mockData');

const getMockPapers = async (request) => {
    const { category, subcategory, year } = request.query;
    let filteredPapers = [...mockPapers];
    
    if (category) {
        filteredPapers = filteredPapers.filter(paper => paper.category === category);
    }
    
    if (subcategory) {
        filteredPapers = filteredPapers.filter(paper => 
            paper.subcategories?.includes(subcategory)
        );
    }
    
    if (year) {
        filteredPapers = filteredPapers.filter(paper => {
            const paperYear = new Date(paper.published).getFullYear();
            return paperYear === year;
        });
    }

    return {
        papers: filteredPapers,
        metadata: {
            category,
            subcategory,
            year,
            totalFound: filteredPapers.length,
            filters: { category, subcategory, year }
        }
    };
};

const searchMockPapers = async (request) => {
    const { q, category, subcategory, year, page = 1, limit = 20 } = request.query;
    let searchResults = [...mockPapers];
    
    if (category) {
        searchResults = searchResults.filter(paper => paper.category === category);
    }
    
    if (subcategory) {
        searchResults = searchResults.filter(paper => 
            paper.subcategories?.includes(subcategory)
        );
    }
    
    if (year) {
        searchResults = searchResults.filter(paper => {
            const paperYear = new Date(paper.published).getFullYear();
            return paperYear === year;
        });
    }

    const searchQuery = q.toLowerCase();
    searchResults = searchResults.filter(paper => {
        const searchableText = [
            paper.title,
            paper.abstract,
            ...(paper.authors || [])
        ].filter(Boolean).join(' ').toLowerCase();
        return searchableText.includes(searchQuery);
    });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = searchResults.slice(startIndex, endIndex);

    return {
        results: paginatedResults,
        metadata: {
            total: searchResults.length,
            page,
            limit,
            totalPages: Math.ceil(searchResults.length / limit),
            filters: { query: q, category, subcategory, year: year || null }
        }
    };
};

const getMockMatches = async (request) => {
    const { category, subcategory, limit = 10 } = request.query;
    let filteredMatches = [...mockMatches];
    
    if (category) {
        filteredMatches = filteredMatches.filter(match => match.category === category);
    }
    
    if (subcategory) {
        filteredMatches = filteredMatches.filter(match => match.subcategory === subcategory);
    }

    return {
        matches: filteredMatches.slice(0, limit),
        metadata: {
            total: filteredMatches.length,
            category,
            subcategory,
            limit
        }
    };
};

const getMockLeaderboard = async (request) => {
    const { category, subcategory, limit = 50 } = request.query;
    let filteredLeaderboard = [...mockLeaderboard];
    
    if (category) {
        filteredLeaderboard = filteredLeaderboard.filter(entry => entry.category === category);
    }
    
    if (subcategory) {
        filteredLeaderboard = filteredLeaderboard.filter(entry => entry.subcategory === subcategory);
    }

    // Sort by ELO rating
    filteredLeaderboard.sort((a, b) => b.eloRating - a.eloRating);

    return {
        leaderboard: filteredLeaderboard.slice(0, limit),
        metadata: {
            total: filteredLeaderboard.length,
            category,
            subcategory,
            limit
        }
    };
};

const postMockVote = async (request) => {
    const { matchId, winnerId } = request.payload;
    // In a real app, you would update the match and leaderboard here
    return {
        success: true,
        message: `Vote recorded for match ${matchId}, winner: ${winnerId}`
    };
};

module.exports = {
    getMockPapers,
    searchMockPapers,
    getMockMatches,
    getMockLeaderboard,
    postMockVote
}; 