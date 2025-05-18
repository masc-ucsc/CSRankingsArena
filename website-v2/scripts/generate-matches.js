const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const BASE_DIR = path.join(__dirname, '../papers');
const CATEGORIES = ['ai', 'architecture'];
const AI_SUBCATEGORIES = ['vision', 'llm', 'ml'];
const ARCHITECTURE_SUBCATEGORIES = ['systems', 'security', 'networks'];
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025]; // Adjust as needed

// List of LLM models to use as reviewers
const LLM_REVIEWERS = [
    {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic'
    },
    {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI'
    },
    {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google'
    },
    {
        id: 'llama-3-70b',
        name: 'Llama 3 70B',
        provider: 'Meta'
    }
];

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

// Generate detailed feedback based on scores
function generateDetailedFeedback(scores, paper) {
    const feedback = [];
    
    // Technical Depth feedback
    if (scores.technicalDepth >= 8) {
        feedback.push("The paper demonstrates exceptional technical depth with rigorous mathematical foundations and comprehensive theoretical analysis.");
    } else if (scores.technicalDepth >= 6) {
        feedback.push("The technical approach is solid, though some aspects could benefit from deeper theoretical analysis.");
    } else {
        feedback.push("The technical foundations could be strengthened with more rigorous analysis and theoretical grounding.");
    }

    // Novelty feedback
    if (scores.novelty >= 8) {
        feedback.push("The work introduces groundbreaking concepts that significantly advance the field.");
    } else if (scores.novelty >= 6) {
        feedback.push("The paper presents some novel insights, though the innovation could be more substantial.");
    } else {
        feedback.push("The work largely builds upon existing approaches without significant innovation.");
    }

    // Experimental Validation feedback
    if (scores.experimentalValidation >= 8) {
        feedback.push("The experimental results are comprehensive and thoroughly validate the proposed approach.");
    } else if (scores.experimentalValidation >= 6) {
        feedback.push("The experimental evaluation is adequate but could benefit from more extensive testing.");
    } else {
        feedback.push("The experimental validation is limited and could be strengthened with more comprehensive testing.");
    }

    // Clarity feedback
    if (scores.clarity >= 8) {
        feedback.push("The paper is exceptionally well-written with clear explanations and logical flow.");
    } else if (scores.clarity >= 6) {
        feedback.push("The presentation is generally clear though some sections could be better organized.");
    } else {
        feedback.push("The paper's organization and clarity could be improved for better readability.");
    }

    // Impact feedback
    if (scores.impact >= 8) {
        feedback.push("The work has significant potential to influence both research and practical applications.");
    } else if (scores.impact >= 6) {
        feedback.push("The work has moderate potential impact in specific application domains.");
    } else {
        feedback.push("The practical impact of the work appears limited in its current form.");
    }

    // Overall summary
    const avgScore = (scores.technicalDepth + scores.novelty + scores.experimentalValidation + scores.clarity + scores.impact) / 5;
    let overallSummary;
    
    if (avgScore >= 8) {
        overallSummary = `This is an outstanding paper that makes significant contributions to ${paper.category}/${paper.subcategory}. The work demonstrates exceptional technical depth, introduces novel concepts, and is thoroughly validated through comprehensive experiments. The clear presentation and strong potential impact make this a valuable addition to the field.`;
    } else if (avgScore >= 6) {
        overallSummary = `This paper presents solid work in ${paper.category}/${paper.subcategory} with good technical foundations and reasonable experimental validation. While not groundbreaking, it offers valuable insights and improvements to existing approaches. The presentation is clear and the work has potential for practical applications.`;
    } else {
        overallSummary = `This paper in ${paper.category}/${paper.subcategory} has several limitations that need to be addressed. The technical depth could be strengthened, and the experimental validation is not comprehensive enough to fully support the claims. The presentation could be improved for better clarity, and the practical impact appears limited.`;
    }

    return {
        detailedFeedback: feedback,
        overallSummary
    };
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
    
    const scores = {};
    const review = aspects.map(aspect => {
        const score = generateScore();
        scores[aspect.replace(/\s+/g, '')] = score;
        return {
            aspect,
            score,
            comment: `The paper demonstrates ${score >= 7 ? 'strong' : score >= 5 ? 'adequate' : 'limited'} ${aspect}.`
        };
    });

    const overallScore = review.reduce((acc, curr) => acc + curr.score, 0) / aspects.length;
    const feedback = generateDetailedFeedback(scores, paper1);
    
    return {
        scores: review,
        overallScore: Math.round(overallScore * 10) / 10,
        summary: feedback.overallSummary,
        detailedFeedback: feedback.detailedFeedback
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
    
    // Randomly select two different reviewers
    const reviewers = [...LLM_REVIEWERS];
    const reviewer1 = reviewers.splice(Math.floor(Math.random() * reviewers.length), 1)[0];
    const reviewer2 = reviewers[Math.floor(Math.random() * reviewers.length)];
    
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
                reviewer: reviewer1,
                ...review1
            },
            {
                paperId: id2,
                reviewer: reviewer2,
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