const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
function generateURL() {
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

// Generate a single paper
function generatePaper(category, subcategory, year) {
    const id = generateArxivId(year);
    return {
        abstract: generateAbstract(category, subcategory),
        keywords: '',
        references: '', // You can add reference generation if needed
        title: generateTitle(category, subcategory),
        url: generateURL()
    };
}

// Generate papers in batches
async function generateBatchPapers() {
    try {
        // Get user input
        const numPapers = await new Promise(resolve => {
            rl.question('Enter number of papers to generate: ', resolve);
        });

        const year = await new Promise(resolve => {
            rl.question('Enter year (e.g., 2023): ', resolve);
        });

        console.log('\nAvailable categories:');
        Object.keys(arxivCategories).forEach(cat => console.log(`- ${cat}`));
        const category = await new Promise(resolve => {
            rl.question('\nEnter category: ', resolve);
        });

        if (!arxivCategories[category]) {
            throw new Error(`Invalid category: ${category}`);
        }

        console.log('\nAvailable subcategories:');
        Object.keys(arxivCategories[category]).forEach(subcat => console.log(`- ${subcat}`));
        const subcategory = await new Promise(resolve => {
            rl.question('\nEnter subcategory: ', resolve);
        });

        if (!arxivCategories[category][subcategory]) {
            throw new Error(`Invalid subcategory: ${subcategory}`);
        }

        // Generate papers
        const papers = [];
        for (let i = 0; i < numPapers; i++) {
            papers.push(generatePaper(category, subcategory, year));
        }

        // Create YAML content
        const yamlContent = yaml.dump({ papers });

        // Create directory if it doesn't exist
        const dirPath = path.join('papers', category, subcategory, year);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Generate base filename
        let fileName = `${category}-${subcategory}-${year}-batch-papers.yaml`;
        let filePath = path.join(dirPath, fileName);

        // If file exists, append date and sequential number
        if (fs.existsSync(filePath)) {
            const date = new Date().toISOString().split('T')[0].replace(/-/g, '-');
            
            // Find the next available number for today's date
            let counter = 1;
            let newFileName;
            do {
                newFileName = `${category}-${subcategory}-${year}-batch-papers-${date}-${String(counter).padStart(2, '0')}.yaml`;
                filePath = path.join(dirPath, newFileName);
                counter++;
            } while (fs.existsSync(filePath));
            
            fileName = newFileName;
        }

        fs.writeFileSync(filePath, yamlContent);

        console.log(`\nSuccessfully generated ${numPapers} papers in ${filePath}`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        rl.close();
    }
}

// Export functions for API use
module.exports = {
    generatePaper,
    generateAbstract,
    generateTitle,
    generateURL,
    generateArxivId
};

// Only run the CLI if this file is run directly
if (require.main === module) {
    generateBatchPapers();
} 