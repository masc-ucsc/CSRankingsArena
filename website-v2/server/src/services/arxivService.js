'use strict';

const axios = require('axios');
const xml2js = require('xml2js');
const { promisify } = require('util');
const parseXml = promisify(new xml2js.Parser().parseString);

const BASE_URL = 'http://export.arxiv.org/api/query';

// Fetch papers by arXiv category and date range
const fetchPapersByCategory = async (categories, year, maxResults = 100) => {
  try {
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // If requested year is in the future, adjust to current year
    const adjustedYear = year > currentYear ? currentYear : year;
    if (year > currentYear) {
      console.log(`Requested year ${year} is in the future, adjusting to current year ${currentYear}`);
    }
    
    // Calculate date range for the given year
    const startDate = new Date(adjustedYear, 0, 1).toISOString();
    // For current year, use current date as end date
    let endDate;
    if (adjustedYear === currentYear) {
      endDate = new Date().toISOString();
    } else {
      endDate = new Date(adjustedYear, 11, 31).toISOString();
    }
    
    // Construct search query
    const categoryQuery = categories.map(cat => `cat:${cat}`).join('+OR+');
    const dateQuery = `submittedDate:[${startDate}+TO+${endDate}]`;
    const searchQuery = `(${categoryQuery})+AND+${dateQuery}`;
    
    // Construct URL with parameters
    const url = `${BASE_URL}?search_query=${searchQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    
    console.log(`Fetching papers from arXiv: ${url}`);
    
    // Make API request
    const response = await axios.get(url, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'CS RankingsArena/1.0 (research paper aggregator) info@example.com'
      }
    });
    
    // Parse XML response
    const result = await parseXml(response.data);
    const entries = result.feed.entry || [];
    
    console.log(`Received ${entries.length} papers from arXiv`);
    
    // Process entries
    const papers = entries.map(entry => {
      // Extract authors
      const authors = entry.author
        ? entry.author.map(author => author.name[0])
        : [];
      
      // Extract categories
      const entryCategories = entry.category
        ? entry.category.map(category => category.$.term)
        : [];
      
      // Get links (PDF and abstract page)
      const links = entry.link || [];
      const pdfLink = links.find(link => link.$.title === 'pdf');
      const abstractLink = links.find(link => link.$.rel === 'alternate');
      
      return {
        arxivId: entry.id[0].split('/').pop().split('v')[0],
        title: entry.title[0].replace(/\n/g, ' ').trim(),
        authors,
        abstract: entry.summary[0].replace(/\n/g, ' ').trim(),
        categories: entryCategories,
        published: new Date(entry.published[0]),
        updated: new Date(entry.updated[0]),
        url: abstractLink ? abstractLink.$.href : null,
        pdfUrl: pdfLink ? pdfLink.$.href : null,
        journal: entry['arxiv:journal'] ? entry['arxiv:journal'][0]._ : null,
        doi: entry['arxiv:doi'] ? entry['arxiv:doi'][0]._ : null,
        comments: entry['arxiv:comment'] ? entry['arxiv:comment'][0]._ : null
      };
    });
    
    return papers;
  } catch (error) {
    console.error('Error fetching papers by category:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('ArXiv API response error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('ArXiv API request error - no response received');
    } else {
      console.error('ArXiv API error:', error.message);
    }
    
    throw new Error('Failed to fetch papers by category from arXiv');
  }
};

module.exports = {
  fetchPapersByCategory
};