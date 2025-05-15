const axios = require('axios');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

class ArxivService {
  constructor() {
    this.baseUrl = 'http://export.arxiv.org/api/query';
  }

  async searchPapers(category, subcategory, year) {
    try {
      // Construct the search query based on category and subcategory
      const searchQuery = this._constructSearchQuery(category, subcategory);
      
      // Make the request to arXiv API
      const response = await axios.get(this.baseUrl, {
        params: {
          search_query: searchQuery,
          start: 0,
          max_results: 100,
          sortBy: 'submittedDate',
          sortOrder: 'descending'
        }
      });

      // Parse the XML response
      const result = await parser.parseStringPromise(response.data);
      
      // Transform the entries into our paper format
      const papers = this._transformEntries(result.feed.entry || [], year);
      
      return papers;
    } catch (error) {
      console.error('Error fetching papers from arXiv:', error);
      throw new Error('Failed to fetch papers from arXiv');
    }
  }

  _constructSearchQuery(category, subcategory) {
    // Convert category and subcategory to arXiv search terms
    // This is a basic implementation - you might want to expand this
    const categoryMap = {
      'machine-learning': 'cat:cs.LG',
      'computer-vision': 'cat:cs.CV',
      'natural-language-processing': 'cat:cs.CL',
      // Add more mappings as needed
    };

    const subcategoryMap = {
      'deep-learning': 'deep learning',
      'reinforcement-learning': 'reinforcement learning',
      'computer-vision': 'computer vision',
      // Add more mappings as needed
    };

    const categoryTerm = categoryMap[category] || '';
    const subcategoryTerm = subcategoryMap[subcategory] || '';

    return `${categoryTerm} AND ${subcategoryTerm}`.trim();
  }

  _transformEntries(entries, year) {
    return entries.map(entry => {
      const published = new Date(entry.published[0]);
      
      // Only include papers from the specified year
      if (published.getFullYear() !== year) {
        return null;
      }

      return {
        id: entry.id[0].split('/').pop(),
        title: entry.title[0].replace(/\n/g, ' ').trim(),
        authors: entry.author.map(author => author.name[0]),
        abstract: entry.summary[0].replace(/\n/g, ' ').trim(),
        published: published.toISOString(),
        pdfUrl: entry.link.find(link => link.$.title === 'pdf').$.href,
        url: entry.id[0],
        venue: 'arXiv',
        year: published.getFullYear()
      };
    }).filter(paper => paper !== null);
  }
}

module.exports = new ArxivService(); 