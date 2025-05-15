const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Categories and subcategories based on CSRankings structure
const categories = {
    'ai': ['vision', 'nlp', 'ml', 'ai'],
    'systems': ['architecture', 'os', 'networks', 'security'],
    'theory': ['algorithms', 'logic', 'cryptography', 'databases']
};

// Years to generate papers for
const years = [2020, 2021, 2022, 2023, 2024];

// Common academic paper patterns
const paperPatterns = {
    titles: [
        "A Novel Approach to {topic} Using {method}",
        "Efficient {method} for {topic} in {domain}",
        "Scalable {method} Framework for {topic}",
        "Optimizing {topic} Through {method}",
        "Deep Learning Based {method} for {topic}",
        "A Survey of {method} in {domain}",
        "Real-time {method} for {topic} Applications",
        "Distributed {method} Systems for {topic}",
        "Privacy-Preserving {method} in {domain}",
        "Adaptive {method} for Dynamic {topic}"
    ],
    methods: [
        "Transformer", "Neural Network", "Reinforcement Learning", "Federated Learning",
        "Graph Neural Network", "Attention Mechanism", "Quantum Computing", "Blockchain",
        "Edge Computing", "Distributed Systems", "Optimization", "Cryptography",
        "Computer Vision", "Natural Language Processing", "Machine Learning"
    ],
    topics: [
        "Image Recognition", "Text Classification", "Network Security", "Data Privacy",
        "System Performance", "Resource Allocation", "Algorithm Design", "Database Management",
        "Cloud Computing", "IoT Applications", "Mobile Computing", "Parallel Processing",
        "Software Engineering", "Human-Computer Interaction", "Robotics"
    ],
    domains: [
        "Healthcare", "Finance", "Education", "Manufacturing", "Transportation",
        "Entertainment", "Social Media", "E-commerce", "Cybersecurity", "Smart Cities"
    ]
};

// Generate a realistic abstract
function generateAbstract(category, subcategory) {
    const sentences = [
        `Recent advances in ${subcategory} have led to significant improvements in performance and efficiency.`,
        `Traditional approaches to ${subcategory} often face challenges in scalability and real-world applications.`,
        `We propose a novel framework that addresses these limitations through innovative techniques.`,
        `Our experimental results demonstrate state-of-the-art performance across multiple benchmarks.`,
        `The proposed method achieves up to 30% improvement in accuracy while reducing computational overhead.`,
        `Extensive evaluations on real-world datasets validate the effectiveness of our approach.`,
        `We further demonstrate the practical applicability through case studies in various domains.`,
        `The theoretical analysis provides insights into the fundamental properties of our solution.`
    ];
    
    // Shuffle and select 4-6 sentences
    return sentences
        .sort(() => Math.random() - 0.5)
        .slice(0, 4 + Math.floor(Math.random() * 3))
        .join(' ');
}

// Generate a realistic title
function generateTitle(category, subcategory) {
    const pattern = paperPatterns.titles[Math.floor(Math.random() * paperPatterns.titles.length)];
    const method = paperPatterns.methods[Math.floor(Math.random() * paperPatterns.methods.length)];
    const topic = paperPatterns.topics[Math.floor(Math.random() * paperPatterns.topics.length)];
    const domain = paperPatterns.domains[Math.floor(Math.random() * paperPatterns.domains.length)];
    
    return pattern
        .replace('{method}', method)
        .replace('{topic}', topic)
        .replace('{domain}', domain);
}

// Generate a realistic URL
function generateURL(title) {
    const baseURL = 'https://dl.acm.org/doi/10.1145/';
    const randomId = Math.random().toString(36).substring(2, 10);
    return `${baseURL}${randomId}`;
}

// Generate a paper with match-opponent data
function generatePaper(category, subcategory, year) {
    const title = generateTitle(category, subcategory);
    const paper = {
        title,
        abstract: generateAbstract(category, subcategory),
        keywords: '',
        references: generateReferences(),
        url: generateURL(title),
        year,
        category,
        subcategory,
        match_opponents: generateMatchOpponents()
    };
    return paper;
}

// Generate realistic references
function generateReferences() {
    const numRefs = 20 + Math.floor(Math.random() * 10);
    const refs = [];
    
    for (let i = 0; i < numRefs; i++) {
        const authors = generateAuthors();
        const year = 2015 + Math.floor(Math.random() * 10);
        const title = generateTitle('ai', 'ml'); // Using any category for references
        const venue = generateVenue();
        refs.push(`${authors}. ${title}. ${venue}, ${year}.`);
    }
    
    return refs.join(' ');
}

// Generate match opponents data
function generateMatchOpponents() {
    const numOpponents = 2 + Math.floor(Math.random() * 3);
    const opponents = [];
    
    for (let i = 0; i < numOpponents; i++) {
        opponents.push({
            title: generateTitle('ai', 'ml'),
            score: Math.floor(Math.random() * 100),
            similarity: (0.5 + Math.random() * 0.5).toFixed(2)
        });
    }
    
    return opponents;
}

// Helper functions
function generateAuthors() {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    const numAuthors = 1 + Math.floor(Math.random() * 3);
    const authors = [];
    
    for (let i = 0; i < numAuthors; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        authors.push(`${firstName} ${lastName}`);
    }
    
    return authors.join(', ');
}

function generateVenue() {
    const venues = [
        'Proceedings of the International Conference on Machine Learning',
        'Advances in Neural Information Processing Systems',
        'IEEE Transactions on Pattern Analysis and Machine Intelligence',
        'ACM SIGKDD International Conference on Knowledge Discovery and Data Mining',
        'International Conference on Learning Representations',
        'Conference on Computer Vision and Pattern Recognition',
        'International Conference on Computer Vision',
        'European Conference on Computer Vision'
    ];
    return venues[Math.floor(Math.random() * venues.length)];
}

// Main function to generate all papers
function generateAllPapers() {
    for (const [category, subcategories] of Object.entries(categories)) {
        for (const subcategory of subcategories) {
            for (const year of years) {
                const papers = [];
                const numPapers = 5 + Math.floor(Math.random() * 5); // 5-10 papers per category-subcategory-year
                
                for (let i = 0; i < numPapers; i++) {
                    papers.push(generatePaper(category, subcategory, year));
                }
                
                const yamlContent = yaml.dump({ papers });
                const fileName = `${category}-${subcategory}-${year}-papers.yaml`;
                // Create nested directory structure: category/subcategory/year/
                const filePath = path.join(__dirname, '..', 'papers', category, subcategory, year.toString(), fileName);
                
                // Ensure directory exists
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                fs.writeFileSync(filePath, yamlContent);
                console.log(`Generated ${fileName} in ${path.relative(path.join(__dirname, '..'), dir)}`);
            }
        }
    }
}

// Run the generator
generateAllPapers(); 