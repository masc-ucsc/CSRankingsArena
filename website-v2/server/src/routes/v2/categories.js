const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Get default categories
 * @returns {Array} Default category data
 */
const getDefaultCategories = () => {
    return [
        {
            id: 'ai',
            name: 'Artificial Intelligence',
            slug: 'ai',
            description: 'Research in artificial intelligence, machine learning, and intelligent systems, including both theoretical foundations and practical applications.',
            color: '#3498db',
            subcategories: [
                {
                    name: 'Computer Vision',
                    slug: 'vision',
                    description: 'Research in visual perception, including image and video understanding, object detection, scene reconstruction, and visual reasoning.',
                    arxivCategories: ['cs.CV', 'cs.AI']
                },
                {
                    name: 'Machine Learning',
                    slug: 'ml',
                    description: 'Core machine learning research, including deep learning, statistical learning, optimization methods, and learning theory.',
                    arxivCategories: ['cs.LG', 'stat.ML', 'cs.AI']
                },
                {
                    name: 'Natural Language Processing',
                    slug: 'nlp',
                    description: 'Research in language understanding, generation, and processing, including syntax, semantics, discourse, and multilingual systems.',
                    arxivCategories: ['cs.CL', 'cs.AI']
                },
                {
                    name: 'Large Language Models',
                    slug: 'llm',
                    description: 'Research on transformer-based models, including architecture design, training methods, evaluation, and applications of large language models.',
                    arxivCategories: ['cs.CL', 'cs.AI', 'cs.LG']
                },
                {
                    name: 'Robotics & AI',
                    slug: 'robotics',
                    description: 'Research at the intersection of AI and robotics, including robot learning, control, perception, and human-robot interaction.',
                    arxivCategories: ['cs.RO', 'cs.AI', 'cs.SY']
                },
                {
                    name: 'Reinforcement Learning',
                    slug: 'rl',
                    description: 'Research in reinforcement learning, including policy optimization, multi-agent systems, inverse RL, and applications in decision-making.',
                    arxivCategories: ['cs.AI', 'cs.LG', 'cs.SY']
                },
                {
                    name: 'AI Safety & Ethics',
                    slug: 'ai-safety',
                    description: 'Research in AI safety, alignment, interpretability, fairness, and ethical considerations in AI systems.',
                    arxivCategories: ['cs.AI', 'cs.CY', 'cs.LG']
                }
            ]
        },
        {
            id: 'architecture',
            name: 'Computer Architecture',
            slug: 'architecture',
            description: 'Research in computer hardware design, including processors, memory systems, accelerators, and emerging computing paradigms.',
            color: '#e74c3c',
            subcategories: [
                {
                    name: 'Processor Design',
                    slug: 'processors',
                    description: 'Research in CPU and GPU architecture, including instruction sets, pipeline design, branch prediction, and performance optimization.',
                    arxivCategories: ['cs.AR', 'cs.DC']
                },
                {
                    name: 'Memory Systems',
                    slug: 'memory',
                    description: 'Research in memory hierarchies, caching, storage systems, and emerging memory technologies.',
                    arxivCategories: ['cs.AR', 'cs.DC', 'cs.OS']
                },
                {
                    name: 'Hardware Accelerators',
                    slug: 'accelerators',
                    description: 'Research in specialized hardware for AI, graphics, cryptography, and other domains, including ASICs, FPGAs, and domain-specific architectures.',
                    arxivCategories: ['cs.AR', 'cs.DC', 'cs.AI']
                },
                {
                    name: 'Quantum Computing',
                    slug: 'quantum',
                    description: 'Research in quantum computer architecture, quantum algorithms, error correction, and quantum-classical hybrid systems.',
                    arxivCategories: ['quant-ph', 'cs.ET', 'cs.AR']
                },
                {
                    name: 'Energy-Efficient Computing',
                    slug: 'energy',
                    description: 'Research in low-power design, energy-efficient architectures, and sustainable computing systems.',
                    arxivCategories: ['cs.AR', 'cs.DC', 'cs.ET']
                }
            ]
        },
        {
            id: 'systems',
            name: 'Computer Systems',
            slug: 'systems',
            description: 'Research in operating systems, distributed systems, networking, and large-scale computing infrastructure.',
            color: '#2ecc71',
            subcategories: [
                {
                    name: 'Operating Systems',
                    slug: 'os',
                    description: 'Research in OS design, kernel development, resource management, virtualization, and system security.',
                    arxivCategories: ['cs.OS', 'cs.DC', 'cs.CR']
                },
                {
                    name: 'Distributed Systems',
                    slug: 'distributed',
                    description: 'Research in distributed algorithms, consensus protocols, fault tolerance, and large-scale distributed computing.',
                    arxivCategories: ['cs.DC', 'cs.DS', 'cs.PF']
                },
                {
                    name: 'Networking',
                    slug: 'networking',
                    description: 'Research in network protocols, routing, congestion control, network security, and emerging networking technologies.',
                    arxivCategories: ['cs.NI', 'cs.CR', 'cs.DC']
                },
                {
                    name: 'Cloud Computing',
                    slug: 'cloud',
                    description: 'Research in cloud infrastructure, virtualization, containerization, serverless computing, and cloud-native systems.',
                    arxivCategories: ['cs.DC', 'cs.SE', 'cs.OS']
                },
                {
                    name: 'Database Systems',
                    slug: 'databases',
                    description: 'Research in database design, query optimization, transaction processing, distributed databases, and data management systems.',
                    arxivCategories: ['cs.DB', 'cs.DC', 'cs.DS']
                },
                {
                    name: 'Edge Computing',
                    slug: 'edge',
                    description: 'Research in edge computing, mobile computing, IoT systems, and distributed computing at the network edge.',
                    arxivCategories: ['cs.DC', 'cs.NI', 'cs.OS']
                }
            ]
        },
        {
            id: 'security',
            name: 'Security & Privacy',
            slug: 'security',
            description: 'Research in computer security, cryptography, privacy-preserving technologies, and secure systems design.',
            color: '#9b59b6',
            subcategories: [
                {
                    name: 'Cryptography',
                    slug: 'crypto',
                    description: 'Research in cryptographic protocols, algorithms, post-quantum cryptography, and cryptographic applications.',
                    arxivCategories: ['cs.CR', 'math.CO', 'quant-ph']
                },
                {
                    name: 'Systems Security',
                    slug: 'systems-security',
                    description: 'Research in system security, including secure OS design, network security, malware analysis, and security verification.',
                    arxivCategories: ['cs.CR', 'cs.OS', 'cs.SE']
                },
                {
                    name: 'Privacy',
                    slug: 'privacy',
                    description: 'Research in privacy-preserving technologies, differential privacy, secure computation, and privacy in machine learning.',
                    arxivCategories: ['cs.CR', 'cs.CY', 'cs.AI']
                },
                {
                    name: 'Blockchain',
                    slug: 'blockchain',
                    description: 'Research in blockchain technology, consensus mechanisms, smart contracts, and decentralized systems.',
                    arxivCategories: ['cs.CR', 'cs.DC', 'cs.DS']
                },
                {
                    name: 'Security Verification',
                    slug: 'verification',
                    description: 'Research in formal methods for security, program verification, security protocol analysis, and automated security testing.',
                    arxivCategories: ['cs.CR', 'cs.LO', 'cs.SE']
                }
            ]
        },
        {
            id: 'theory',
            name: 'Theory & Algorithms',
            slug: 'theory',
            description: 'Research in theoretical computer science, algorithm design and analysis, and computational complexity.',
            color: '#f1c40f',
            subcategories: [
                {
                    name: 'Algorithms',
                    slug: 'algorithms',
                    description: 'Research in algorithm design, analysis, optimization, and applications across various computational domains.',
                    arxivCategories: ['cs.DS', 'cs.CC', 'cs.DM']
                },
                {
                    name: 'Computational Complexity',
                    slug: 'complexity',
                    description: 'Research in complexity theory, computational models, lower bounds, and the foundations of computation.',
                    arxivCategories: ['cs.CC', 'cs.DS', 'math.CO']
                },
                {
                    name: 'Formal Methods',
                    slug: 'formal-methods',
                    description: 'Research in program verification, model checking, type systems, and formal semantics of programming languages.',
                    arxivCategories: ['cs.LO', 'cs.PL', 'cs.SE']
                },
                {
                    name: 'Graph Theory',
                    slug: 'graph-theory',
                    description: 'Research in graph algorithms, combinatorial optimization, network science, and applications of graph theory.',
                    arxivCategories: ['cs.DS', 'math.CO', 'cs.DM']
                },
                {
                    name: 'Quantum Algorithms',
                    slug: 'quantum-algorithms',
                    description: 'Research in quantum algorithms, quantum complexity theory, and quantum information processing.',
                    arxivCategories: ['quant-ph', 'cs.CC', 'cs.DS']
                }
            ]
        },
        {
            id: 'software',
            name: 'Software Engineering',
            slug: 'software',
            description: 'Research in software development, programming languages, software systems, and software engineering methodologies.',
            color: '#1abc9c',
            subcategories: [
                {
                    name: 'Programming Languages',
                    slug: 'pl',
                    description: 'Research in language design, type systems, compilers, runtime systems, and programming language theory.',
                    arxivCategories: ['cs.PL', 'cs.SE', 'cs.LO']
                },
                {
                    name: 'Software Systems',
                    slug: 'software-systems',
                    description: 'Research in large-scale software systems, software architecture, middleware, and system software.',
                    arxivCategories: ['cs.SE', 'cs.SW', 'cs.DC']
                },
                {
                    name: 'Software Testing',
                    slug: 'testing',
                    description: 'Research in software testing, verification, debugging, program analysis, and quality assurance.',
                    arxivCategories: ['cs.SE', 'cs.PL', 'cs.LO']
                },
                {
                    name: 'Human-Computer Interaction',
                    slug: 'hci',
                    description: 'Research in user interfaces, interaction design, usability, accessibility, and human-centered computing.',
                    arxivCategories: ['cs.HC', 'cs.AI', 'cs.SE']
                },
                {
                    name: 'Software Evolution',
                    slug: 'evolution',
                    description: 'Research in software maintenance, evolution, refactoring, and software engineering for modern development practices.',
                    arxivCategories: ['cs.SE', 'cs.SW', 'cs.PL']
                }
            ]
        }
    ];
};

// Define the categories route
const categoriesRoutes = [
    {
        method: 'GET',
        path: '/api/v2/categories',
        options: {
            description: 'Get all categories with their subcategories',
            tags: ['api', 'categories'],
            response: {
                schema: Joi.array().items(
                    Joi.object({
                        id: Joi.string().required(),
                        name: Joi.string().required(),
                        slug: Joi.string().required(),
                        description: Joi.string().required(),
                        color: Joi.string().required(),
                        subcategories: Joi.array().items(
                            Joi.object({
                                name: Joi.string().required(),
                                slug: Joi.string().required(),
                                description: Joi.string().required(),
                                arxivCategories: Joi.array().items(Joi.string()).required()
                            })
                        ).required()
                    })
                )
            }
        },
        handler: async (request, h) => {
            try {
                const categories = getDefaultCategories();
                return h.response(categories).code(200);
            } catch (error) {
                request.log('error', error);
                throw Boom.badImplementation('Error fetching categories');
            }
        }
    }
];

module.exports = categoriesRoutes; 