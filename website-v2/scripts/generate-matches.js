const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const BASE_DIR = path.join(__dirname, '../papers');
const CATEGORIES = ['ai', 'architecture'];
const AI_SUBCATEGORIES = ['vision', 'llm', 'ml'];
const ARCHITECTURE_SUBCATEGORIES = ['systems', 'security', 'networks'];
const YEARS = [2023, 2024]; // Adjust as needed

// Helper function to read YAML files
function readYamlFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        // Support both { papers: [...] } and just [...]
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.papers)) return data.papers;
        return [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`No papers file found at ${filePath}`);
        } else {
            console.error(`Error reading file ${filePath}:`, error);
        }
        return [];
    }
}

// Helper function to write YAML files
function writeYamlFile(filePath, data) {
    try {
        const yamlContent = yaml.dump(data, { 
            indent: 2,
            lineWidth: -1,
            noRefs: true
        });
        fs.writeFileSync(filePath, yamlContent, 'utf8');
        console.log(`Successfully wrote matches to ${filePath}`);
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
    }
}

// Generate a random score between 0 and 10 with 1 decimal place
function generateScore() {
    return Math.round((Math.random() * 10) * 10) / 10;
}

// Generate a realistic review
function generateReview(paper1, paper2) {
    const aspects = [
        'technical depth',
        'novelty',
        'experimental validation',
        'clarity of presentation',
        'potential impact'
    ];
    
    const review = aspects.map(aspect => {
        const score = generateScore();
        return {
            aspect,
            score,
            comment: `The paper demonstrates ${score >= 7 ? 'strong' : score >= 5 ? 'adequate' : 'limited'} ${aspect}.`
        };
    });

    const overallScore = review.reduce((acc, curr) => acc + curr.score, 0) / aspects.length;
    
    return {
        scores: review,
        overallScore: Math.round(overallScore * 10) / 10,
        summary: `This paper ${overallScore >= 7 ? 'makes significant contributions' : overallScore >= 5 ? 'presents interesting work' : 'has some limitations'} in the field.`
    };
}

// Helper to get a unique paper identifier
function getPaperId(paper) {
    return paper.id || paper.url || null;
}

// Generate a match between two papers
function generateMatch(paper1, paper2, category, subcategory, year) {
    const id1 = getPaperId(paper1);
    const id2 = getPaperId(paper2);
    const matchId = `match-${category}-${subcategory}-${year}-${id1}-${id2}`;
    const timestamp = new Date().toISOString();
    
    const review1 = generateReview(paper1, paper2);
    const review2 = generateReview(paper2, paper1);
    
    // Determine winner based on overall scores
    const winner = review1.overallScore > review2.overallScore ? id1 : 
                  review2.overallScore > review1.overallScore ? id2 : 'tie';
    
    return {
        id: matchId,
        paperIds: [id1, id2],
        category,
        subcategory,
        year,
        createdAt: timestamp,
        status: 'completed',
        reviews: [
            {
                paperId: id1,
                reviewer: {
                    id: 'reviewer-1',
                    name: 'Dr. Sarah Chen',
                    provider: 'academic'
                },
                ...review1
            },
            {
                paperId: id2,
                reviewer: {
                    id: 'reviewer-2',
                    name: 'Prof. Michael Rodriguez',
                    provider: 'academic'
                },
                ...review2
            }
        ],
        comparison: {
            winner,
            reasoning: winner === 'tie' ? 
                'Both papers demonstrate comparable strengths and contributions.' :
                `The winning paper shows ${winner === id1 ? 'stronger' : 'more consistent'} performance across all evaluation metrics.`,
            overallScores: {
                [id1]: review1.overallScore,
                [id2]: review2.overallScore
            },
            metricComparison: review1.scores.map((score, i) => ({
                metric: score.aspect,
                scores: {
                    [id1]: score.score,
                    [id2]: review2.scores[i].score
                },
                difference: Math.round((score.score - review2.scores[i].score) * 10) / 10
            }))
        }
    };
}

// Main function to generate matches for all categories and years
async function generateAllMatches() {
    for (const category of CATEGORIES) {
        const subcategories = category === 'ai' ? AI_SUBCATEGORIES : ARCHITECTURE_SUBCATEGORIES;
        
        for (const subcategory of subcategories) {
            for (const year of YEARS) {
                // Look for papers in the year subdirectory as YAML
                const papersPath = path.join(BASE_DIR, category, subcategory, year.toString(), `${category}-${subcategory}-${year}-papers.yaml`);
                const papers = readYamlFile(papersPath);
                
                if (papers.length < 2) {
                    console.log(`Not enough papers in ${category}/${subcategory}/${year} to generate matches`);
                    continue;
                }
                
                // Generate matches between all possible pairs of papers
                const matches = [];
                for (let i = 0; i < papers.length; i++) {
                    for (let j = i + 1; j < papers.length; j++) {
                        const match = generateMatch(papers[i], papers[j], category, subcategory, year);
                        matches.push(match);
                    }
                }
                
                // Write matches to YAML file in the same directory
                const matchesPath = path.join(BASE_DIR, category, subcategory, year.toString(), `${category}-${subcategory}-${year}-matches.yaml`);
                writeYamlFile(matchesPath, { matches });
            }
        }
    }
}

// Run the script
generateAllMatches().catch(console.error); 