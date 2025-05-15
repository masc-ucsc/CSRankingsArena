'use strict';

// Mock papers organized by category and subcategory
const mockPapers = {
    'computer-architecture': {
        'processors': [
            {
                arxivId: '2301.12345',
                title: 'Advanced RISC-V Processor Design with Novel Branch Prediction',
                authors: ['John Smith', 'Jane Doe', 'Robert Johnson'],
                abstract: 'This paper presents a novel branch prediction algorithm for RISC-V processors that achieves 95% prediction accuracy while reducing power consumption by 30%. We demonstrate our approach on a custom RISC-V core implementation and show significant performance improvements across SPEC CPU benchmarks.',
                categories: ['cs.AR', 'cs.OS'],
                published: new Date('2023-01-15'),
                updated: new Date('2023-01-20'),
                url: 'https://arxiv.org/abs/2301.12345',
                pdfUrl: 'https://arxiv.org/pdf/2301.12345.pdf',
                publishedYear: 2023
            },
            {
                arxivId: '2302.23456',
                title: 'Energy-Efficient Multi-Core Architecture for Edge Computing',
                authors: ['Alice Brown', 'Charlie Wilson', 'David Lee'],
                abstract: 'We propose a new multi-core architecture specifically designed for edge computing applications. Our design features dynamic voltage and frequency scaling, adaptive cache management, and novel power gating techniques that reduce energy consumption by 40% compared to traditional designs.',
                categories: ['cs.AR', 'cs.DC'],
                published: new Date('2023-02-20'),
                updated: new Date('2023-02-25'),
                url: 'https://arxiv.org/abs/2302.23456',
                pdfUrl: 'https://arxiv.org/pdf/2302.23456.pdf',
                publishedYear: 2023
            },
            {
                arxivId: '2303.34567',
                title: 'Quantum-Inspired Classical Processor Architecture',
                authors: ['Sarah Chen', 'Michael Zhang', 'Lisa Wang'],
                abstract: 'We present a novel processor architecture inspired by quantum computing principles. Our design achieves significant speedup for specific computational patterns while maintaining compatibility with existing software ecosystems.',
                categories: ['cs.AR', 'cs.ET'],
                published: new Date('2023-03-10'),
                updated: new Date('2023-03-15'),
                url: 'https://arxiv.org/abs/2303.34567',
                pdfUrl: 'https://arxiv.org/pdf/2303.34567.pdf',
                publishedYear: 2023
            }
        ],
        'accelerators': [
            {
                arxivId: '2304.45678',
                title: 'FPGA-Based Neural Network Accelerator with Dynamic Precision',
                authors: ['Emma Davis', 'Frank Miller', 'Grace Taylor'],
                abstract: 'This work introduces a novel FPGA-based neural network accelerator that dynamically adjusts computation precision based on layer requirements. Our approach achieves 2x speedup over fixed-precision designs while maintaining accuracy within 1% of floating-point implementations.',
                categories: ['cs.AR', 'cs.AI'],
                published: new Date('2023-04-05'),
                updated: new Date('2023-04-10'),
                url: 'https://arxiv.org/abs/2304.45678',
                pdfUrl: 'https://arxiv.org/pdf/2304.45678.pdf',
                publishedYear: 2023
            },
            {
                arxivId: '2305.56789',
                title: 'Domain-Specific Accelerator for Graph Neural Networks',
                authors: ['Henry Wilson', 'Ivy Chen', 'Jack Brown'],
                abstract: 'We present a specialized accelerator architecture for graph neural networks that exploits the sparse and irregular nature of graph computations. Our design achieves 5x better energy efficiency compared to GPU implementations while maintaining flexibility across different GNN models.',
                categories: ['cs.AR', 'cs.AI'],
                published: new Date('2023-05-15'),
                updated: new Date('2023-05-20'),
                url: 'https://arxiv.org/abs/2305.56789',
                pdfUrl: 'https://arxiv.org/pdf/2305.56789.pdf',
                publishedYear: 2023
            },
            {
                arxivId: '2306.67890',
                title: 'Reconfigurable Accelerator for Cryptography and Security',
                authors: ['David Kim', 'Sophie Lee', 'Alex Wong'],
                abstract: 'This paper presents a reconfigurable accelerator architecture optimized for cryptographic operations and security protocols. Our design achieves 10x speedup for common cryptographic primitives while maintaining flexibility for emerging security standards.',
                categories: ['cs.AR', 'cs.CR'],
                published: new Date('2023-06-20'),
                updated: new Date('2023-06-25'),
                url: 'https://arxiv.org/abs/2306.67890',
                pdfUrl: 'https://arxiv.org/pdf/2306.67890.pdf',
                publishedYear: 2023
            }
        ],
        'memory': [
            {
                arxivId: '2307.78901',
                title: 'Novel Non-Volatile Memory Architecture for Persistent Computing',
                authors: ['Karen Lee', 'Liam Wilson', 'Mia Chen'],
                abstract: 'This paper introduces a new non-volatile memory architecture that enables efficient persistent computing. Our design features novel wear-leveling algorithms and error correction techniques that improve memory lifetime by 3x while maintaining performance comparable to DRAM.',
                categories: ['cs.AR', 'cs.OS'],
                published: new Date('2023-07-10'),
                updated: new Date('2023-07-15'),
                url: 'https://arxiv.org/abs/2307.78901',
                pdfUrl: 'https://arxiv.org/pdf/2307.78901.pdf',
                publishedYear: 2023
            },
            {
                arxivId: '2308.89012',
                title: 'Cache Coherence Protocol for Heterogeneous Memory Systems',
                authors: ['Noah Brown', 'Olivia Davis', 'Peter Wilson'],
                abstract: 'We propose a new cache coherence protocol specifically designed for heterogeneous memory systems. Our approach reduces coherence traffic by 40% while maintaining correctness guarantees, enabling efficient use of emerging memory technologies.',
                categories: ['cs.AR', 'cs.DC'],
                published: new Date('2023-08-15'),
                updated: new Date('2023-08-20'),
                url: 'https://arxiv.org/abs/2308.89012',
                pdfUrl: 'https://arxiv.org/pdf/2308.89012.pdf',
                publishedYear: 2023
            },
            {
                arxivId: '2309.90123',
                title: 'Memory-Centric Computing Architecture for Big Data Applications',
                authors: ['Rachel Zhang', 'Tom Chen', 'Emma Wilson'],
                abstract: 'We present a memory-centric computing architecture optimized for big data applications. Our design reduces data movement by 70% and improves energy efficiency by 3x compared to traditional architectures.',
                categories: ['cs.AR', 'cs.DC'],
                published: new Date('2023-09-20'),
                updated: new Date('2023-09-25'),
                url: 'https://arxiv.org/abs/2309.90123',
                pdfUrl: 'https://arxiv.org/pdf/2309.90123.pdf',
                publishedYear: 2023
            }
        ]
    },
    'ai': {
        'vision': [
            {
                arxivId: '2310.01234',
                title: 'Efficient Vision Transformer for Mobile Devices',
                authors: ['Quinn Lee', 'Rachel Chen', 'Sam Wilson'],
                abstract: 'This paper presents an efficient vision transformer architecture optimized for mobile devices. Our design achieves 2x speedup and 50% reduction in model size while maintaining accuracy comparable to standard vision transformers.',
                categories: ['cs.CV', 'cs.AI'],
                published: new Date('2023-10-05'),
                updated: new Date('2023-10-10'),
                url: 'https://arxiv.org/abs/2310.01234',
                pdfUrl: 'https://arxiv.org/pdf/2310.01234.pdf',
                publishedYear: 2023
            },
            {
                arxivId: '2311.12345',
                title: 'Self-Supervised Learning for Medical Image Analysis',
                authors: ['Dr. Sarah Chen', 'Prof. Michael Brown', 'Dr. Lisa Wang'],
                abstract: 'We propose a novel self-supervised learning approach for medical image analysis that achieves state-of-the-art performance with limited labeled data. Our method improves accuracy by 15% while reducing annotation requirements by 80%.',
                categories: ['cs.CV', 'cs.AI', 'cs.LG'],
                published: new Date('2023-11-15'),
                updated: new Date('2023-11-20'),
                url: 'https://arxiv.org/abs/2311.12345',
                pdfUrl: 'https://arxiv.org/pdf/2311.12345.pdf',
                publishedYear: 2023
            },
            {
                arxivId: '2312.23456',
                title: 'Robust Object Detection in Adverse Weather Conditions',
                authors: ['Alex Zhang', 'Emma Wilson', 'David Lee'],
                abstract: 'This work introduces a robust object detection framework that maintains high accuracy in adverse weather conditions. Our approach improves detection rates by 40% in fog, rain, and snow while maintaining real-time performance.',
                categories: ['cs.CV', 'cs.AI'],
                published: new Date('2023-12-20'),
                updated: new Date('2023-12-25'),
                url: 'https://arxiv.org/abs/2312.23456',
                pdfUrl: 'https://arxiv.org/pdf/2312.23456.pdf',
                publishedYear: 2023
            }
        ],
        'nlp': [
            {
                arxivId: '2401.34567',
                title: 'Lightweight Language Model for Resource-Constrained Devices',
                authors: ['Tom Brown', 'Uma Davis', 'Victor Wilson'],
                abstract: 'We introduce a lightweight language model architecture that achieves 90% of the performance of larger models while requiring only 10% of the computational resources. Our approach enables efficient natural language processing on edge devices.',
                categories: ['cs.CL', 'cs.AI'],
                published: new Date('2024-01-15'),
                updated: new Date('2024-01-20'),
                url: 'https://arxiv.org/abs/2401.34567',
                pdfUrl: 'https://arxiv.org/pdf/2401.34567.pdf',
                publishedYear: 2024
            },
            {
                arxivId: '2402.45678',
                title: 'Multilingual Language Model for Low-Resource Languages',
                authors: ['Maria Garcia', 'John Smith', 'Sarah Chen'],
                abstract: 'This paper presents a novel approach to training multilingual language models that significantly improves performance on low-resource languages. Our method achieves 30% better accuracy on 50+ languages with limited training data.',
                categories: ['cs.CL', 'cs.AI'],
                published: new Date('2024-02-20'),
                updated: new Date('2024-02-25'),
                url: 'https://arxiv.org/abs/2402.45678',
                pdfUrl: 'https://arxiv.org/pdf/2402.45678.pdf',
                publishedYear: 2024
            },
            {
                arxivId: '2403.56789',
                title: 'Interpretable Neural Machine Translation',
                authors: ['David Kim', 'Lisa Wang', 'Michael Zhang'],
                abstract: 'We propose a novel neural machine translation architecture that provides interpretable attention mechanisms and translation decisions. Our approach maintains translation quality while offering insights into the translation process.',
                categories: ['cs.CL', 'cs.AI'],
                published: new Date('2024-03-10'),
                updated: new Date('2024-03-15'),
                url: 'https://arxiv.org/abs/2403.56789',
                pdfUrl: 'https://arxiv.org/pdf/2403.56789.pdf',
                publishedYear: 2024
            }
        ],
        'reinforcement-learning': [
            {
                arxivId: '2404.67890',
                title: 'Sample-Efficient Reinforcement Learning for Robotics',
                authors: ['Emma Wilson', 'Alex Chen', 'Sarah Brown'],
                abstract: 'This work introduces a sample-efficient reinforcement learning algorithm for robotic control tasks. Our approach reduces training time by 60% while maintaining robust performance across various robotic platforms.',
                categories: ['cs.AI', 'cs.RO'],
                published: new Date('2024-04-15'),
                updated: new Date('2024-04-20'),
                url: 'https://arxiv.org/abs/2404.67890',
                pdfUrl: 'https://arxiv.org/pdf/2404.67890.pdf',
                publishedYear: 2024
            },
            {
                arxivId: '2405.78901',
                title: 'Multi-Agent Reinforcement Learning for Smart Grid Optimization',
                authors: ['Michael Lee', 'Rachel Zhang', 'Tom Wilson'],
                abstract: 'We present a multi-agent reinforcement learning framework for optimizing smart grid operations. Our approach improves grid efficiency by 25% while maintaining stability and reliability.',
                categories: ['cs.AI', 'cs.SY'],
                published: new Date('2024-05-20'),
                updated: new Date('2024-05-25'),
                url: 'https://arxiv.org/abs/2405.78901',
                pdfUrl: 'https://arxiv.org/pdf/2405.78901.pdf',
                publishedYear: 2024
            }
        ]
    },
    'systems': {
        'operating-systems': [
            {
                arxivId: '2406.89012',
                title: 'Secure and Efficient Microkernel Design',
                authors: ['John Chen', 'Lisa Wang', 'David Brown'],
                abstract: 'This paper presents a novel microkernel architecture that improves security while maintaining performance. Our design reduces the trusted computing base by 70% while achieving comparable performance to monolithic kernels.',
                categories: ['cs.OS', 'cs.SE'],
                published: new Date('2024-06-15'),
                updated: new Date('2024-06-20'),
                url: 'https://arxiv.org/abs/2406.89012',
                pdfUrl: 'https://arxiv.org/pdf/2406.89012.pdf',
                publishedYear: 2024
            },
            {
                arxivId: '2407.90123',
                title: 'Energy-Aware Scheduling for Mobile Operating Systems',
                authors: ['Sarah Wilson', 'Michael Zhang', 'Emma Lee'],
                abstract: 'We propose an energy-aware scheduling algorithm for mobile operating systems that extends battery life by 30% while maintaining responsive user experience.',
                categories: ['cs.OS', 'cs.DC'],
                published: new Date('2024-07-20'),
                updated: new Date('2024-07-25'),
                url: 'https://arxiv.org/abs/2407.90123',
                pdfUrl: 'https://arxiv.org/pdf/2407.90123.pdf',
                publishedYear: 2024
            }
        ],
        'distributed-systems': [
            {
                arxivId: '2408.01234',
                title: 'Consensus Protocol for High-Performance Blockchain',
                authors: ['Alex Brown', 'Rachel Chen', 'Tom Wilson'],
                abstract: 'This work introduces a novel consensus protocol that achieves high throughput and low latency for blockchain systems. Our approach improves transaction processing by 5x while maintaining security guarantees.',
                categories: ['cs.DC', 'cs.CR'],
                published: new Date('2024-08-15'),
                updated: new Date('2024-08-20'),
                url: 'https://arxiv.org/abs/2408.01234',
                pdfUrl: 'https://arxiv.org/pdf/2408.01234.pdf',
                publishedYear: 2024
            },
            {
                arxivId: '2409.12345',
                title: 'Fault-Tolerant Distributed Database Design',
                authors: ['David Lee', 'Sarah Wang', 'Michael Chen'],
                abstract: 'We present a fault-tolerant distributed database architecture that maintains consistency while achieving high availability. Our design improves system reliability by 99.99% while maintaining performance.',
                categories: ['cs.DC', 'cs.DB'],
                published: new Date('2024-09-20'),
                updated: new Date('2024-09-25'),
                url: 'https://arxiv.org/abs/2409.12345',
                pdfUrl: 'https://arxiv.org/pdf/2409.12345.pdf',
                publishedYear: 2024
            }
        ]
    },
    'security': {
        'cryptography': [
            {
                arxivId: '2410.23456',
                title: 'Post-Quantum Cryptography for IoT Devices',
                authors: ['Emma Wilson', 'John Chen', 'Lisa Brown'],
                abstract: 'This paper presents efficient implementations of post-quantum cryptographic algorithms for IoT devices. Our approach reduces computational overhead by 40% while maintaining security against quantum attacks.',
                categories: ['cs.CR', 'cs.ET'],
                published: new Date('2024-10-15'),
                updated: new Date('2024-10-20'),
                url: 'https://arxiv.org/abs/2410.23456',
                pdfUrl: 'https://arxiv.org/pdf/2410.23456.pdf',
                publishedYear: 2024
            },
            {
                arxivId: '2411.34567',
                title: 'Secure Multi-Party Computation for Privacy-Preserving Machine Learning',
                authors: ['Michael Zhang', 'Sarah Lee', 'David Wang'],
                abstract: 'We propose a novel secure multi-party computation protocol that enables privacy-preserving machine learning. Our approach maintains model accuracy while ensuring data privacy across multiple parties.',
                categories: ['cs.CR', 'cs.AI'],
                published: new Date('2024-11-20'),
                updated: new Date('2024-11-25'),
                url: 'https://arxiv.org/abs/2411.34567',
                pdfUrl: 'https://arxiv.org/pdf/2411.34567.pdf',
                publishedYear: 2024
            }
        ],
        'network-security': [
            {
                arxivId: '2412.45678',
                title: 'AI-Driven Network Intrusion Detection',
                authors: ['Tom Brown', 'Rachel Chen', 'Alex Wilson'],
                abstract: 'This work introduces an AI-driven approach to network intrusion detection that achieves 99% detection rate with less than 1% false positives. Our system adapts to emerging threats in real-time.',
                categories: ['cs.CR', 'cs.AI'],
                published: new Date('2024-12-15'),
                updated: new Date('2024-12-20'),
                url: 'https://arxiv.org/abs/2412.45678',
                pdfUrl: 'https://arxiv.org/pdf/2412.45678.pdf',
                publishedYear: 2024
            },
            {
                arxivId: '2501.56789',
                title: 'Zero-Trust Architecture for Cloud-Native Applications',
                authors: ['Sarah Wang', 'Michael Lee', 'Emma Chen'],
                abstract: 'We present a zero-trust architecture specifically designed for cloud-native applications. Our approach improves security posture while maintaining scalability and performance.',
                categories: ['cs.CR', 'cs.DC'],
                published: new Date('2025-01-20'),
                updated: new Date('2025-01-25'),
                url: 'https://arxiv.org/abs/2501.56789',
                pdfUrl: 'https://arxiv.org/pdf/2501.56789.pdf',
                publishedYear: 2025
            }
        ]
    }
};

class MockPaperService {
    /**
     * Get mock papers for a specific category and subcategory
     * @param {string} category - Category slug
     * @param {string} subcategory - Subcategory slug
     * @param {number} year - Publication year
     * @returns {Array} Array of mock papers
     */
    getMockPapers(category, subcategory, year) {
        // Get papers for the category and subcategory
        const categoryPapers = mockPapers[category] || {};
        const subcategoryPapers = categoryPapers[subcategory] || [];
        
        // Filter by year if specified
        if (year) {
            return subcategoryPapers.filter(paper => paper.publishedYear === year);
        }
        
        return subcategoryPapers;
    }

    /**
     * Get all available categories and subcategories
     * @returns {Object} Object containing available categories and subcategories
     */
    getAvailableCategories() {
        const categories = {};
        
        for (const [category, subcategories] of Object.entries(mockPapers)) {
            categories[category] = Object.keys(subcategories);
        }
        
        return categories;
    }
}

module.exports = new MockPaperService(); 