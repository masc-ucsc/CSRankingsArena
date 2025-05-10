// client/src/services/mockApi.js

import config from '../config';

// Debug log helper
const debugLog = (message, data) => {
  if (config.debug) {
    console.log(`🔍 [MockAPI] ${message}`, data);
  }
};

/**
 * Helper to fetch mock data from public folder
 * @param {string} path - Path to mock data file
 * @returns {Promise<any>} The JSON data
 */
const fetchMockData = async (path) => {
  try {
    debugLog(`Fetching mock data from: ${config.mockDataPath}/${path}`);
    const response = await fetch(`${config.mockDataPath}/${path}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch mock data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    debugLog(`Mock data loaded: ${path}`, data);
    return data;
  } catch (error) {
    console.error(`Error loading mock data (${path}):`, error);
    
    // Return appropriate fallback data for different types of requests
    if (path === 'categories.json') {
      return getDefaultCategories();
    } else if (path.includes('papers')) {
      return [];
    } else if (path.includes('search')) {
      return { papers: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } };
    }
    
    throw error;
  }
};

/**
 * Get default categories if mock file is missing
 * @returns {Array} Default category data
 */
const getDefaultCategories = () => {
  return [
    {
      id: 'ai',
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
        }
      ]
    },
    {
      id: 'architecture',
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
        }
      ]
    }
  ];
};

/**
 * Get default paper data if mock file is missing
 * @returns {Array} Default paper data
 */
const getDefaultPapers = () => {
  return [
    {
      id: 'default-1',
      arxivId: '2201.00001',
      title: 'Sample Paper Title: Advanced Research Topics',
      authors: ['John Smith', 'Jane Doe'],
      abstract: 'This is a sample abstract for a mock paper. It contains a brief summary of the research presented in the paper.',
      categories: ['cs.CV'],
      published: new Date(2023, 0, 15).toISOString(),
      updated: new Date(2023, 0, 20).toISOString(),
      url: 'https://arxiv.org/abs/2201.00001',
      pdfUrl: 'https://arxiv.org/pdf/2201.00001.pdf',
      publishedYear: 2023
    },
    {
      id: 'default-2',
      arxivId: '2201.00002',
      title: 'Another Sample Paper on Important Topics',
      authors: ['Alice Johnson', 'Bob Brown'],
      abstract: 'This is another sample abstract. It demonstrates what paper data looks like when using mock data instead of real API calls.',
      categories: ['cs.LG'],
      published: new Date(2023, 1, 10).toISOString(),
      updated: new Date(2023, 1, 12).toISOString(),
      url: 'https://arxiv.org/abs/2201.00002',
      pdfUrl: 'https://arxiv.org/pdf/2201.00002.pdf',
      publishedYear: 2023
    }
  ];
};

/**
 * Fetch all categories with their subcategories (mock implementation)
 * @returns {Promise<Array>} List of categories with subcategories
 */
export const fetchCategories = async () => {
  try {
    debugger; // Breakpoint for debugging
    return await fetchMockData('categories.json');
  } catch (error) {
    debugger; // Breakpoint for error debugging
    console.error('Error fetching mock categories:', error);
    return getDefaultCategories();
  }
};

/**
 * Fetch papers for a specific subcategory and year (mock implementation)
 * @param {string} categorySlug - Category slug
 * @param {string} subcategorySlug - Subcategory slug
 * @param {number} year - Publication year
 * @returns {Promise<Array>} List of papers
 */
export const fetchPapers = async (categorySlug, subcategorySlug, year) => {
  try {
    debugger; // Breakpoint for debugging
    debugLog('Fetching mock papers', { categorySlug, subcategorySlug, year });
    
    // Try to fetch from specific mock file first
    try {
      const papers = await fetchMockData(`papers/${categorySlug}/${subcategorySlug}/${year}.json`);
      return papers;
    } catch (specificError) {
      // If specific file doesn't exist, try the general papers file
      debugLog('Specific mock file not found, trying general papers file');
      const allPapers = await fetchMockData('papers.json');
      
      // Filter papers based on category, subcategory, and year
      const filtered = allPapers.filter(paper => {
        // Check if paper matches the requested category/subcategory
        const matchesCategory = paper.categories.some(cat => 
          cat.toLowerCase().includes(categorySlug.toLowerCase())
        );
        
        const matchesSubcategory = paper.subcategories?.some(sub => 
          sub.toLowerCase().includes(subcategorySlug.toLowerCase())
        );
        
        const matchesYear = paper.publishedYear === parseInt(year);
        
        return matchesCategory && matchesSubcategory && matchesYear;
      });
      
      return filtered;
    }
  } catch (error) {
    debugger; // Breakpoint for error debugging
    console.error('Error fetching mock papers:', error);
    return getDefaultPapers();
  }
};

/**
 * Search papers based on query and filters (mock implementation)
 * @param {string} query - Search query
 * @param {Object} filters - Additional search filters
 * @returns {Promise<Object>} Search results with pagination
 */
export const searchPapers = async (query, filters = {}) => {
  try {
    debugger; // Breakpoint for debugging
    debugLog('Searching mock papers', { query, filters });
    
    // Try to fetch mock search results
    try {
      const searchResults = await fetchMockData('search.json');
      
      // Filter based on query and filters
      let filtered = searchResults.papers || [];
      
      if (query) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(paper => 
          paper.title.toLowerCase().includes(lowerQuery) || 
          paper.abstract.toLowerCase().includes(lowerQuery) ||
          paper.authors.some(author => author.toLowerCase().includes(lowerQuery))
        );
      }
      
      if (filters.category) {
        filtered = filtered.filter(paper => 
          paper.categories.some(cat => cat.toLowerCase().includes(filters.category.toLowerCase()))
        );
      }
      
      if (filters.year) {
        filtered = filtered.filter(paper => 
          paper.publishedYear === parseInt(filters.year)
        );
      }
      
      // Apply pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const total = filtered.length;
      
      return {
        papers: filtered.slice(startIndex, endIndex),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (searchError) {
      // Fallback to general papers file and apply search/filters
      const allPapers = await fetchMockData('papers.json');
      
      // Apply search/filters as above
      let filtered = allPapers || [];
      
      if (query) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(paper => 
          paper.title.toLowerCase().includes(lowerQuery) || 
          paper.abstract.toLowerCase().includes(lowerQuery) ||
          paper.authors.some(author => author.toLowerCase().includes(lowerQuery))
        );
      }
      
      // Apply pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const total = filtered.length;
      
      return {
        papers: filtered.slice(startIndex, endIndex),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }
  } catch (error) {
    debugger; // Breakpoint for error debugging
    console.error('Error during mock search:', error);
    return {
      papers: getDefaultPapers(),
      pagination: {
        total: 2,
        page: 1,
        limit: 20,
        pages: 1
      }
    };
  }
};