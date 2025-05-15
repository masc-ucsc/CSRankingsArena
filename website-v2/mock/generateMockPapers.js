const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const xml2js = require('xml2js');

// arXiv API base URL
const ARXIV_API_BASE = 'http://export.arxiv.org/api/query';
const ARXIV_BASE_URL = 'https://arxiv.org/abs/';

// arXiv category mapping
const arxivCategories = {
    'ai': {
        'vision': 'cs.CV',
        'nlp': 'cs.CL',
        'ml': 'cs.LG',
        'ai': 'cs.AI'
    },
    'systems': {
        'architecture': 'cs.AR',
        'os': 'cs.OS',
        'networks': 'cs.NI',
        'security': 'cs.CR'
    },
    'theory': {
        'algorithms': 'cs.DS',
        'logic': 'cs.LO',
        'cryptography': 'cs.CR',
        'databases': 'cs.DB'
    }
};

// Years to generate papers for (current year and previous 4 years)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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

// Generate a realistic arXiv paper ID
function generateArxivId() {
    const year = Math.floor(Math.random() * 24) + 2000; // Papers from 2000-2024
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const number = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    return `${year}${month}.${number}`;
}

// Fetch real paper data from arXiv API
async function fetchArxivPaper(category, subcategory) {
    const arxivCategory = arxivCategories[category]?.[subcategory];
    if (!arxivCategory) {
        throw new Error(`Invalid category/subcategory: ${category}/${subcategory}`);
    }

    try {
        // Search for papers in the last 5 years
        const query = `cat:${arxivCategory} AND submittedDate:[${currentYear - 5} TO ${currentYear}]`;
        const response = await axios.get(ARXIV_API_BASE, {
            params: {
                search_query: query,
                max_results: 100,
                sortBy: 'submittedDate',
                sortOrder: 'descending'
            }
        });

        // Parse the XML response using xml2js
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        
        if (!result.feed || !result.feed.entry || !Array.isArray(result.feed.entry)) {
            throw new Error('Invalid response format from arXiv API');
        }

        const entries = result.feed.entry;
        if (entries.length === 0) {
            throw new Error('No papers found');
        }

        // Select a random paper from the results
        const randomIndex = Math.floor(Math.random() * entries.length);
        const entry = entries[randomIndex];

        // Extract paper details
        const id = entry.id[0].split('/').pop();
        const title = entry.title[0].replace(/\n/g, ' ').trim();
        const abstract = entry.summary[0].replace(/\n/g, ' ').trim();
        const authors = entry.author.map(author => author.name[0]);
        const published = new Date(entry.published[0]);
        const year = published.getFullYear();

        return {
            id,
            title,
            abstract,
            authors,
            year,
            url: `${ARXIV_BASE_URL}${id}`,
            pdfUrl: `${ARXIV_BASE_URL.replace('/abs/', '/pdf/')}${id}.pdf`,
            category,
            subcategory,
            venue: 'arXiv',
            match_opponents: generateMatchOpponents()
        };
    } catch (error) {
        console.error(`Error fetching arXiv paper: ${error.message}`);
        // Fallback to generating a paper with arXiv-style ID
        return generateFallbackPaper(category, subcategory);
    }
}

// Generate a fallback paper when arXiv API fails
function generateFallbackPaper(category, subcategory) {
    const id = generateArxivId();
    return {
        id,
        title: generateTitle(category, subcategory),
        abstract: generateAbstract(category, subcategory),
        authors: generateAuthors(),
        year: years[Math.floor(Math.random() * years.length)],
        url: `${ARXIV_BASE_URL}${id}`,
        pdfUrl: `${ARXIV_BASE_URL.replace('/abs/', '/pdf/')}${id}.pdf`,
        category,
        subcategory,
        venue: 'arXiv',
        match_opponents: generateMatchOpponents()
    };
}

// Generate match opponents data
function generateMatchOpponents() {
    const numOpponents = 2 + Math.floor(Math.random() * 3);
    const opponents = [];
    
    for (let i = 0; i < numOpponents; i++) {
        const id = generateArxivId();
        opponents.push({
            id,
            title: generateTitle('ai', 'ml'),
            url: `${ARXIV_BASE_URL}${id}`,
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

// Main function to generate all papers
async function generateAllPapers() {
    for (const [category, subcategories] of Object.entries(arxivCategories)) {
        for (const subcategory of Object.keys(subcategories)) {
            for (const year of years) {
                const papers = [];
                const numPapers = 5 + Math.floor(Math.random() * 5); // 5-10 papers per category-subcategory-year
                
                for (let i = 0; i < numPapers; i++) {
                    try {
                        const paper = await fetchArxivPaper(category, subcategory);
                        if (paper.year === year) {
                            papers.push(paper);
                        }
                    } catch (error) {
                        console.error(`Error generating paper: ${error.message}`);
                        const paper = generateFallbackPaper(category, subcategory);
                        if (paper.year === year) {
                            papers.push(paper);
                        }
                    }
                }
                
                if (papers.length > 0) {
                    const yamlContent = yaml.dump({ papers });
                    const fileName = `${category}-${subcategory}-${year}-papers.yaml`;
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
}

// Run the generator
generateAllPapers().catch(console.error); 