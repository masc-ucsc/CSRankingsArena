const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Configuration
const YEARS = [2022, 2023, 2024];
const CATEGORIES = {
    ai: {
        name: 'Artificial Intelligence',
        subcategories: ['vision', 'nlp', 'learning'],
        venues: ['ICLR', 'ICML', 'NeurIPS', 'CVPR', 'ACL']
    },
    systems: {
        name: 'Computer Systems',
        subcategories: ['architecture', 'os', 'networks'],
        venues: ['ISCA', 'MICRO', 'ASPLOS', 'SOSP', 'SIGCOMM']
    },
    theory: {
        name: 'Theoretical Computer Science',
        subcategories: ['algorithms', 'complexity', 'crypto'],
        venues: ['STOC', 'FOCS', 'CRYPTO', 'EUROCRYPT', 'ICALP']
    }
};

// Sample abstracts for each category/subcategory
const SAMPLE_ABSTRACTS = {
    ai: {
        vision: [
            "This paper presents a novel approach to computer vision using transformer architectures. We demonstrate that our method achieves state-of-the-art performance on multiple benchmark datasets while requiring significantly less computational resources than previous approaches.",
            "We introduce a new framework for visual representation learning that leverages self-supervised learning techniques. Our approach shows remarkable improvements in downstream tasks and provides insights into the nature of visual representations.",
            "This work explores the application of attention mechanisms in computer vision tasks. We propose an efficient implementation that reduces memory requirements while maintaining high accuracy.",
            "We present a comprehensive study of vision-language models and their applications in real-world scenarios. Our findings suggest new directions for multimodal learning."
        ],
        nlp: [
            "This paper introduces a new language model architecture that significantly reduces computational requirements while maintaining performance. We demonstrate its effectiveness across multiple NLP tasks.",
            "We present a novel approach to natural language understanding that combines transformer architectures with structured knowledge. Our method shows improved performance on complex reasoning tasks.",
            "This work explores efficient fine-tuning techniques for large language models. We propose a method that reduces the computational cost while preserving model capabilities.",
            "We investigate the role of attention mechanisms in language models and propose improvements that enhance both efficiency and performance."
        ],
        learning: [
            "This paper presents a new framework for reinforcement learning that improves sample efficiency and stability. We demonstrate its effectiveness in complex environments.",
            "We introduce a novel approach to meta-learning that enables rapid adaptation to new tasks. Our method shows significant improvements in few-shot learning scenarios.",
            "This work explores the application of deep learning in robotics. We propose a new architecture that improves learning efficiency and generalization.",
            "We present a comprehensive study of transfer learning techniques and their applications in real-world scenarios."
        ]
    },
    systems: {
        architecture: [
            "This paper presents a novel processor architecture designed for deep learning workloads. We demonstrate significant improvements in energy efficiency and performance.",
            "We introduce a new memory hierarchy design that reduces latency and improves bandwidth utilization. Our approach shows remarkable improvements in system performance.",
            "This work explores the application of specialized accelerators in modern computing systems. We propose a flexible architecture that adapts to various workloads.",
            "We present a comprehensive study of cache coherence protocols and their impact on system performance."
        ],
        os: [
            "This paper introduces a new operating system design that improves security and performance. We demonstrate its effectiveness in real-world applications.",
            "We present a novel approach to resource management in modern operating systems. Our method shows improved efficiency and fairness.",
            "This work explores the role of virtualization in cloud computing environments. We propose improvements to existing systems.",
            "We investigate new techniques for operating system security and present a framework for secure system design."
        ],
        networks: [
            "This paper presents a new network protocol that improves reliability and performance. We demonstrate its effectiveness in various network conditions.",
            "We introduce a novel approach to network congestion control that adapts to changing conditions. Our method shows significant improvements in throughput.",
            "This work explores the application of machine learning in network management. We propose a system that optimizes network performance.",
            "We present a comprehensive study of network security and propose new methods for threat detection and prevention."
        ]
    },
    theory: {
        algorithms: [
            "This paper presents a new algorithm for solving complex optimization problems. We prove its theoretical guarantees and demonstrate practical effectiveness.",
            "We introduce a novel approach to algorithm design that improves efficiency and scalability. Our method shows significant improvements in various applications.",
            "This work explores the theoretical foundations of machine learning algorithms. We provide new insights into their behavior and limitations.",
            "We present a comprehensive study of approximation algorithms and their applications in real-world problems."
        ],
        complexity: [
            "This paper investigates the computational complexity of important problems in computer science. We present new results and open questions.",
            "We introduce a new framework for analyzing algorithm complexity that provides deeper insights into problem hardness.",
            "This work explores the relationship between different complexity classes and their implications for algorithm design.",
            "We present a comprehensive study of complexity theory and its applications in various domains."
        ],
        crypto: [
            "This paper presents a new cryptographic protocol that improves security and efficiency. We provide formal proofs of its security properties.",
            "We introduce a novel approach to secure computation that reduces communication overhead. Our method shows significant improvements in practical applications.",
            "This work explores the application of zero-knowledge proofs in modern cryptographic systems. We propose new protocols with improved efficiency.",
            "We present a comprehensive study of post-quantum cryptography and propose new candidates for standardization."
        ]
    }
};

// Helper function to generate a unique paper ID
const generatePaperId = (category, subcategory, year, index) => {
    return `${category}-${subcategory}-${year}-${String(index).padStart(2, '0')}`;
};

// Helper function to generate a unique match ID
const generateMatchId = (category, subcategory, year, index) => {
    return `match-${category}-${subcategory}-${year}-${String(index).padStart(2, '0')}`;
};

// Generate mock paper data
const generatePaper = (category, subcategory, year, index) => {
    const paperId = generatePaperId(category, subcategory, year, index);
    const venue = CATEGORIES[category].venues[Math.floor(Math.random() * CATEGORIES[category].venues.length)];
    const abstract = SAMPLE_ABSTRACTS[category][subcategory][index - 1];
    
    return {
        abstract: abstract,
        keywords: '',
        references: "Reference 1, Reference 2, Reference 3", // Simplified for mock data
        title: `${abstract.split('.')[0]}`,
        url: `https://example.com/papers/${paperId}`
    };
};

// Generate mock match data
const generateMatch = (category, subcategory, year, index) => {
    const matchId = generateMatchId(category, subcategory, year, index);
    const paper1Id = generatePaperId(category, subcategory, year, index * 2 - 1);
    const paper2Id = generatePaperId(category, subcategory, year, index * 2);
    
    return {
        id: matchId,
        paper1_id: paper1Id,
        paper2_id: paper2Id,
        agent1_id: 1,
        agent2_id: 2,
        judge_id: 3,
        status: "completed",
        winner_id: Math.random() > 0.5 ? 1 : 2,
        feedback: `Match analysis for ${paper1Id} vs ${paper2Id}`,
        rating: Math.floor(Math.random() * 3) + 3, // Rating between 3-5
        created_at: `${year}-${String(index).padStart(2, '0')}-01T10:00:00Z`,
        updated_at: `${year}-${String(index).padStart(2, '0')}-01T11:00:00Z`,
        paper1_analysis: `Analysis of paper ${paper1Id}`,
        paper2_analysis: `Analysis of paper ${paper2Id}`,
        judge_analysis: `Judge's decision for match ${matchId}`,
        comments: [
            {
                user: "User1",
                text: "Interesting match!",
                timestamp: `${year}-${String(index).padStart(2, '0')}-01T12:00:00Z`
            }
        ]
    };
};

// Generate and save papers for a category/subcategory/year
const generatePapersForCategory = (category, subcategory, year) => {
    const papers = [];
    // Generate 4 papers per subcategory per year
    for (let i = 1; i <= 4; i++) {
        papers.push(generatePaper(category, subcategory, year, i));
    }
    
    const papersDir = path.join(__dirname, '..', '..', '..', 'papers', category);
    if (!fs.existsSync(papersDir)) {
        fs.mkdirSync(papersDir, { recursive: true });
    }
    
    const filePath = path.join(papersDir, `${subcategory}-${year}.yaml`);
    fs.writeFileSync(filePath, yaml.dump({ papers }));
    console.log(`Generated papers for ${category}/${subcategory}/${year}`);
};

// Generate and save matches for a category/subcategory/year
const generateMatchesForCategory = (category, subcategory, year) => {
    const matches = [];
    // Generate 2 matches per subcategory per year
    for (let i = 1; i <= 2; i++) {
        matches.push(generateMatch(category, subcategory, year, i));
    }
    
    const matchesDir = path.join(__dirname, '..', '..', '..', 'mock', 'matches', category);
    if (!fs.existsSync(matchesDir)) {
        fs.mkdirSync(matchesDir, { recursive: true });
    }
    
    const filePath = path.join(matchesDir, `${subcategory}-${year}-matches.yaml`);
    fs.writeFileSync(filePath, yaml.dump({ matches }));
    console.log(`Generated matches for ${category}/${subcategory}/${year}`);
};

// Main function to generate all mock data
const generateAllMockData = () => {
    // Create necessary directories
    const papersRootDir = path.join(__dirname, '..', '..', '..', 'papers');
    const matchesRootDir = path.join(__dirname, '..', '..', '..', 'mock', 'matches');
    
    if (!fs.existsSync(papersRootDir)) {
        fs.mkdirSync(papersRootDir, { recursive: true });
    }
    if (!fs.existsSync(matchesRootDir)) {
        fs.mkdirSync(matchesRootDir, { recursive: true });
    }
    
    // Generate data for each category, subcategory, and year
    for (const [category, categoryData] of Object.entries(CATEGORIES)) {
        for (const subcategory of categoryData.subcategories) {
            for (const year of YEARS) {
                generatePapersForCategory(category, subcategory, year);
                generateMatchesForCategory(category, subcategory, year);
            }
        }
    }
    
    console.log('All mock data generated successfully!');
};

// Run the generator
generateAllMockData(); 