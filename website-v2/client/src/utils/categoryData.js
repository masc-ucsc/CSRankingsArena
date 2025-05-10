export const CATEGORIES = [
  {
    id: 'ai',
    slug: 'ai',
    name: 'Artificial Intelligence',
    description: 'Research in AI, machine learning, and computational intelligence.',
    color: '#3498db',
    subcategories: [
      {
        slug: 'vision',
        name: 'Computer Vision',
        description: 'Image recognition, object detection, and scene understanding.'
      },
      {
        slug: 'ml',
        name: 'Machine Learning',
        description: 'Algorithms and methods for training systems from data.'
      },
      {
        slug: 'nlp',
        name: 'Natural Language Processing',
        description: 'Text analysis, language understanding, and generation.'
      },
      {
        slug: 'llm',
        name: 'Large Language Models',
        description: 'Research on transformer-based language models and their applications.'
      },
      {
        slug: 'robotics',
        name: 'Robotics & AI',
        description: 'AI methods for robotics and autonomous systems.'
      }
    ]
  },
  {
    id: 'architecture',
    slug: 'architecture',
    name: 'Computer Architecture',
    description: 'Design and optimization of computer hardware systems.',
    color: '#e74c3c',
    subcategories: [
      {
        slug: 'processors',
        name: 'Processor Design',
        description: 'CPU architecture, pipeline design, and instruction sets.'
      },
      {
        slug: 'memory',
        name: 'Memory Systems',
        description: 'Memory hierarchies, caching, and storage systems.'
      },
      {
        slug: 'accelerators',
        name: 'Hardware Accelerators',
        description: 'Specialized processors for AI, graphics, and other domains.'
      }
    ]
  },
  // Additional categories would be defined here
];

// Helper functions
export const getAllCategories = () => CATEGORIES;

export const getCategoryBySlug = (slug) => 
  CATEGORIES.find(category => category.slug === slug);

export const getSubcategoryBySlug = (categorySlug, subcategorySlug) => {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return null;
  
  return category.subcategories.find(sub => sub.slug === subcategorySlug);
};