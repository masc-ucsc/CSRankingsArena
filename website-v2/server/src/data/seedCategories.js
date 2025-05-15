const mongoose = require('mongoose');
const Category = require('../models/category');
require('dotenv').config();

// arXiv categories mapping to our custom categories
const categoriesData = [
  {
    name: 'Artificial Intelligence',
    slug: 'ai',
    description: 'Research in AI, machine learning, and computational intelligence.',
    color: '#3498db',
    subcategories: [
      {
        name: 'Computer Vision',
        slug: 'vision',
        description: 'Image recognition, object detection, and scene understanding.',
        arxivCategories: ['cs.CV']
      },
      {
        name: 'Machine Learning',
        slug: 'ml',
        description: 'Algorithms and methods for training systems from data.',
        arxivCategories: ['cs.LG', 'stat.ML']
      },
      {
        name: 'Natural Language Processing',
        slug: 'nlp',
        description: 'Text analysis, language understanding, and generation.',
        arxivCategories: ['cs.CL']
      },
      {
        name: 'Large Language Models',
        slug: 'llm',
        description: 'Research on transformer-based language models and their applications.',
        arxivCategories: ['cs.CL', 'cs.LG']
      },
      {
        name: 'Robotics & AI',
        slug: 'robotics',
        description: 'AI methods for robotics and autonomous systems.',
        arxivCategories: ['cs.RO']
      }
    ]
  },
  {
    name: 'Computer Architecture',
    slug: 'architecture',
    description: 'Design and optimization of computer hardware systems.',
    color: '#e74c3c',
    subcategories: [
      {
        name: 'Processor Design',
        slug: 'processors',
        description: 'CPU architecture, pipeline design, and instruction sets.',
        arxivCategories: ['cs.AR']
      },
      {
        name: 'Memory Systems',
        slug: 'memory',
        description: 'Memory hierarchies, caching, and storage systems.',
        arxivCategories: ['cs.AR']
      },
      {
        name: 'Hardware Accelerators',
        slug: 'accelerators',
        description: 'Specialized processors for AI, graphics, and other domains.',
        arxivCategories: ['cs.AR', 'cs.DC']
      }
    ]
  },
  {
    name: 'Operating Systems',
    slug: 'os',
    description: 'Research on OS design, resource management, and system software.',
    color: '#2ecc71',
    subcategories: [
      {
        name: 'Kernel Design',
        slug: 'kernel',
        description: 'OS kernel architecture, scheduling, and resource management.',
        arxivCategories: ['cs.OS']
      },
      {
        name: 'Virtualization',
        slug: 'virtualization',
        description: 'Virtual machines, containers, and system virtualization.',
        arxivCategories: ['cs.OS', 'cs.DC']
      },
      {
        name: 'Distributed Systems',
        slug: 'distributed',
        description: 'Distributed operating systems and coordination.',
        arxivCategories: ['cs.OS', 'cs.DC']
      }
    ]
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to database - use the mongoose imported at the top
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('MongoDB Connected');
    
    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');
    
    // Insert new categories
    await Category.insertMany(categoriesData);
    console.log('Categories seeded successfully!');
    
    // Disconnect from database
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding
seedDatabase();