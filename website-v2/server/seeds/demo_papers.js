/**
 * Seed file for demo papers
 */

const demoPapers = [
  // AI/ML Category
  {
    title: "Neural Architecture Search for Efficient Model Compression",
    abstract: "This paper presents a novel approach to neural architecture search that focuses on model compression while maintaining performance. We introduce a multi-objective optimization framework that balances model size, inference speed, and accuracy. Our method achieves state-of-the-art results on ImageNet with models 3x smaller than previous approaches.",
    authors: "Jane Smith, John Doe, Alice Johnson",
    category: "AI/ML",
    subcategory: "Neural Architecture Search",
    is_demo: true,
    year: 2024,
    venue: "Demo Conference on AI",
    metadata: {
      pdf_url: "https://arxiv.org/pdf/demo1.pdf",
      code_url: "https://github.com/demo/nas-compression"
    }
  },
  {
    title: "Reinforcement Learning for Multi-Agent Systems in Dynamic Environments",
    abstract: "We propose a new framework for multi-agent reinforcement learning that handles dynamic environments with partial observability. Our approach uses a novel communication protocol between agents and achieves superior performance in complex scenarios. The method is validated on both simulated and real-world robotics tasks.",
    authors: "Robert Brown, Sarah Wilson, Michael Chen",
    category: "AI/ML",
    subcategory: "Reinforcement Learning",
    is_demo: true,
    year: 2024,
    venue: "Demo Conference on AI",
    metadata: {
      pdf_url: "https://arxiv.org/pdf/demo2.pdf",
      code_url: "https://github.com/demo/marl-dynamic"
    }
  },
  {
    title: "Interpretable Machine Learning for Healthcare Decision Support",
    abstract: "This work introduces a new interpretable machine learning framework specifically designed for healthcare applications. We demonstrate how our approach provides transparent decision-making while maintaining high accuracy in disease prediction and treatment recommendation tasks.",
    authors: "Emily Davis, David Miller, Lisa Wang",
    category: "AI/ML",
    subcategory: "Interpretable ML",
    is_demo: true,
    year: 2024,
    venue: "Demo Conference on AI",
    metadata: {
      pdf_url: "https://arxiv.org/pdf/demo3.pdf",
      code_url: "https://github.com/demo/interpretable-healthcare"
    }
  },
  
  // Systems Category
  {
    title: "Distributed Systems for Real-time Data Processing at Scale",
    abstract: "We present a novel distributed system architecture that enables real-time processing of large-scale data streams. Our system achieves sub-millisecond latency while maintaining consistency and fault tolerance. The architecture is validated on production workloads processing over 1M events per second.",
    authors: "James Wilson, Maria Garcia, Tom Lee",
    category: "Systems",
    subcategory: "Distributed Systems",
    is_demo: true,
    year: 2024,
    venue: "Demo Conference on Systems",
    metadata: {
      pdf_url: "https://arxiv.org/pdf/demo4.pdf",
      code_url: "https://github.com/demo/distributed-streaming"
    }
  },
  {
    title: "Energy-Efficient Computing for Edge Devices",
    abstract: "This paper introduces a new approach to energy-efficient computing for edge devices. We propose a dynamic power management system that adapts to workload characteristics and device constraints, achieving up to 40% energy savings while maintaining performance.",
    authors: "Alex Chen, Rachel Green, Kevin Park",
    category: "Systems",
    subcategory: "Energy-Efficient Computing",
    is_demo: true,
    year: 2024,
    venue: "Demo Conference on Systems",
    metadata: {
      pdf_url: "https://arxiv.org/pdf/demo5.pdf",
      code_url: "https://github.com/demo/energy-efficient-edge"
    }
  },
  
  // Theory Category
  {
    title: "Quantum Algorithms for Optimization Problems",
    abstract: "We present new quantum algorithms for solving complex optimization problems. Our approach combines quantum annealing with classical optimization techniques, demonstrating significant speedup for certain problem classes. Theoretical analysis and experimental results are provided.",
    authors: "Daniel Kim, Sophia Lee, Peter Zhang",
    category: "Theory",
    subcategory: "Quantum Computing",
    is_demo: true,
    year: 2024,
    venue: "Demo Conference on Theory",
    metadata: {
      pdf_url: "https://arxiv.org/pdf/demo6.pdf",
      code_url: "https://github.com/demo/quantum-optimization"
    }
  },
  {
    title: "Approximation Algorithms for Network Design",
    abstract: "This paper introduces novel approximation algorithms for network design problems. We prove tight bounds on the approximation ratios and demonstrate practical applications in network routing and resource allocation.",
    authors: "William Brown, Emma Davis, Richard Wilson",
    category: "Theory",
    subcategory: "Approximation Algorithms",
    is_demo: true,
    year: 2024,
    venue: "Demo Conference on Theory",
    metadata: {
      pdf_url: "https://arxiv.org/pdf/demo7.pdf",
      code_url: "https://github.com/demo/network-approximation"
    }
  }
];

exports.seed = function(knex) {
  // Deletes ALL existing demo papers
  return knex('papers')
    .where('is_demo', true)
    .del()
    .then(function() {
      // Inserts seed entries
      return knex('papers').insert(demoPapers);
    });
}; 