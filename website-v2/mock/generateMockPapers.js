const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const xml2js = require('xml2js');

// arXiv API base URL
const ARXIV_API_BASE = 'http://export.arxiv.org/api/query';
const ARXIV_BASE_URL = 'https://arxiv.org/abs/';

// arXiv category mapping with all categories and subcategories
const arxivCategories = {
    'ai': {
        'vision': 'cs.CV',
        'nlp': 'cs.CL',
        'ml': 'cs.LG',
        'ai': 'cs.AI',
        'robotics': 'cs.RO'
    },
    'systems': {
        'architecture': 'cs.AR',
        'os': 'cs.OS',
        'networks': 'cs.NI',
        'security': 'cs.CR',
        'distributed': 'cs.DC',
        'performance': 'cs.PF'
    },
    'theory': {
        'algorithms': 'cs.DS',
        'logic': 'cs.LO',
        'cryptography': 'cs.CR',
        'databases': 'cs.DB',
        'complexity': 'cs.CC',
        'formal': 'cs.FL'
    },
    'software': {
        'programming': 'cs.PL',
        'engineering': 'cs.SE',
        'verification': 'cs.SC',
        'testing': 'cs.SE',
        'maintenance': 'cs.SE'
    },
    'applications': {
        'graphics': 'cs.GR',
        'multimedia': 'cs.MM',
        'games': 'cs.GT',
        'bioinformatics': 'cs.BI',
        'computational': 'cs.CE'
    }
};

// Years to generate papers for (2020-2025)
const years = Array.from({ length: 6 }, (_, i) => 2020 + i);

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

// Generate a realistic arXiv paper ID for a specific year
function generateArxivId(year) {
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const number = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    return `${year}${month}.${number}`;
}

// Fetch real paper data from arXiv API with year-specific query
async function fetchArxivPaper(category, subcategory, year) {
    const arxivCategory = arxivCategories[category]?.[subcategory];
    if (!arxivCategory) {
        throw new Error(`Invalid category/subcategory: ${category}/${subcategory}`);
    }

    try {
        // Search for papers in the specific year
        const startDate = `${year}0101`;
        const endDate = `${year}1231`;
        const query = `cat:${arxivCategory} AND submittedDate:[${startDate} TO ${endDate}]`;
        
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
            throw new Error(`No papers found for ${year}`);
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
        const paperYear = published.getFullYear();

        // Only return if the paper is from the requested year
        if (paperYear === year) {
            return {
                id,
                title,
                abstract,
                authors,
                year: paperYear,
                url: `${ARXIV_BASE_URL}${id}`,
                pdfUrl: `${ARXIV_BASE_URL.replace('/abs/', '/pdf/')}${id}.pdf`,
                category,
                subcategory,
                venue: 'arXiv',
                match_opponents: generateMatchOpponents(year)
            };
        }
        throw new Error(`No papers found for ${year}`);
    } catch (error) {
        console.error(`Error fetching arXiv paper for ${year}: ${error.message}`);
        // Fallback to generating a paper with year-specific arXiv ID
        return generateFallbackPaper(category, subcategory, year);
    }
}

// Generate a fallback paper when arXiv API fails
function generateFallbackPaper(category, subcategory, year) {
    const id = generateArxivId(year);
    return {
        id,
        title: generateTitle(category, subcategory),
        abstract: generateAbstract(category, subcategory),
        authors: generateAuthors(),
        year,
        url: `${ARXIV_BASE_URL}${id}`,
        pdfUrl: `${ARXIV_BASE_URL.replace('/abs/', '/pdf/')}${id}.pdf`,
        category,
        subcategory,
        venue: 'arXiv',
        match_opponents: generateMatchOpponents(year)
    };
}

// Generate match opponents data with year-specific IDs
function generateMatchOpponents(year) {
    const numOpponents = 2 + Math.floor(Math.random() * 3);
    const opponents = [];
    
    for (let i = 0; i < numOpponents; i++) {
        const id = generateArxivId(year);
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
    const outputDir = path.join(__dirname, '..', 'papers');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate papers for each category, subcategory, and year
    for (const [category, subcategories] of Object.entries(arxivCategories)) {
        // Create category directory
        const categoryDir = path.join(outputDir, category);
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }

        for (const subcategory of Object.keys(subcategories)) {
            // Create subcategory directory
            const subcategoryDir = path.join(categoryDir, subcategory);
            if (!fs.existsSync(subcategoryDir)) {
                fs.mkdirSync(subcategoryDir, { recursive: true });
            }

            for (const year of years) {
                // Create year directory
                const yearDir = path.join(subcategoryDir, year.toString());
                if (!fs.existsSync(yearDir)) {
                    fs.mkdirSync(yearDir, { recursive: true });
                }

                console.log(`Generating papers for ${category}/${subcategory}/${year}...`);
                const papers = [];
                const numPapers = 5 + Math.floor(Math.random() * 5); // 5-10 papers per category-subcategory-year
                
                for (let i = 0; i < numPapers; i++) {
                    try {
                        const paper = await fetchArxivPaper(category, subcategory, year);
                        papers.push(paper);
                        
                        // Add a small delay to avoid hitting rate limits
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error) {
                        console.error(`Error generating paper for ${category}/${subcategory}/${year}: ${error.message}`);
                        // Generate a fallback paper
                        const fallbackPaper = generateFallbackPaper(category, subcategory, year);
                        papers.push(fallbackPaper);
                    }
                }

                // Save papers to YAML file with new naming convention
                const fileName = `${category}-${subcategory}-${year}-papers.yaml`;
                const outputPath = path.join(yearDir, fileName);
                
                // Write file (this will overwrite if it exists)
                const yamlContent = yaml.dump({ papers });
                fs.writeFileSync(outputPath, yamlContent, { flag: 'w' }); // 'w' flag ensures overwrite
                
                console.log(`Generated ${papers.length} papers in ${fileName}`);
            }
        }
    }
}

// Run the generator
generateAllPapers().catch(console.error); 