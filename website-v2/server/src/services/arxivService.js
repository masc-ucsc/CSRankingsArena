'use strict';

const axios = require('axios');
const xml2js = require('xml2js');
const { promisify } = require('util');
const parseXml = promisify(new xml2js.Parser().parseString);

const BASE_URL = 'http://export.arxiv.org/api/query';
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds

class ArxivService {
    constructor() {
        this.baseUrl = BASE_URL;
        this.parser = new xml2js.Parser();
        this.axiosInstance = axios.create({
            timeout: 10000, // 10 second timeout
            headers: {
                'User-Agent': 'CSRankingsArena/1.0 (research paper aggregator)'
            }
        });
    }

    /**
     * Retry a function with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {number} retries - Number of retries
     * @param {number} delay - Initial delay in ms
     * @returns {Promise<any>}
     */
    async retryWithBackoff(fn, retries = MAX_RETRIES, delay = RETRY_DELAY) {
        try {
            return await fn();
        } catch (error) {
            if (retries === 0) throw error;
            
            // Check if error is rate limit related
            const isRateLimit = error.response?.status === 429 || 
                              error.message.includes('rate limit') ||
                              error.message.includes('too many requests');
            
            if (isRateLimit) {
                // For rate limits, wait longer
                await new Promise(resolve => setTimeout(resolve, delay * 2));
            } else {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            return this.retryWithBackoff(fn, retries - 1, delay * 2);
        }
    }

    /**
     * Extracts arXiv ID from a URL or string
     * @param {string} url - The URL or string containing arXiv ID
     * @returns {string|null} - The extracted arXiv ID or null
     */
    extractArxivId(url) {
        if (!url) return null;
        
        // Handle direct arXiv URLs
        const arxivUrlMatch = url.match(/arxiv\.org\/(?:abs|pdf)\/(\d+\.\d+)/);
        if (arxivUrlMatch) {
            return arxivUrlMatch[1];
        }

        // Handle DOI URLs that might contain arXiv IDs
        const doiMatch = url.match(/doi\.org\/10\.\d+\/(\d+\.\d+)/);
        if (doiMatch) {
            return doiMatch[1];
        }

        // Handle raw arXiv IDs
        const rawMatch = url.match(/(\d+\.\d+)/);
        if (rawMatch) {
            return rawMatch[1];
        }

        return null;
    }

    /**
     * Fetches paper details from arXiv with retry logic
     * @param {string} arxivId - The arXiv ID
     * @returns {Promise<Object>} - Paper details
     */
    async fetchPaperDetails(arxivId) {
        return this.retryWithBackoff(async () => {
            try {
                const response = await this.axiosInstance.get(this.baseUrl, {
                    params: {
                        id_list: arxivId,
                        max_results: 1
                    }
                });

                const result = await this.parser.parseStringPromise(response.data);
                const entry = result.feed.entry[0];

                if (!entry) {
                    throw new Error(`No paper found for arXiv ID: ${arxivId}`);
                }

                // Extract authors
                const authors = entry.author.map(author => author.name[0]);

                // Extract categories
                const categories = entry.category.map(cat => cat.$.term);

                // Extract DOI if available
                const doi = entry['arxiv:doi'] ? entry['arxiv:doi'][0]._ : null;

                // Extract journal reference if available
                const journalRef = entry['arxiv:journal_ref'] ? entry['arxiv:journal_ref'][0]._ : null;

                return {
                    arxivId,
                    title: entry.title[0].replace(/\n/g, ' ').trim(),
                    abstract: entry.summary[0].replace(/\n/g, ' ').trim(),
                    authors,
                    categories,
                    published: entry.published[0],
                    updated: entry.updated[0],
                    pdfUrl: entry.link.find(link => link.$.title === 'pdf').$.href,
                    arxivUrl: entry.link.find(link => link.$.title === 'abstract').$.href,
                    doi,
                    journalRef,
                    primaryCategory: entry['arxiv:primary_category'] ? 
                        entry['arxiv:primary_category'][0].$.term : null
                };
            } catch (error) {
                if (error.response?.status === 404) {
                    throw new Error(`Paper not found on arXiv: ${arxivId}`);
                }
                throw error;
            }
        });
    }

    /**
     * Fetches details for multiple papers with improved batching
     * @param {string[]} arxivIds - Array of arXiv IDs
     * @returns {Promise<Object[]>} - Array of paper details
     */
    async fetchMultiplePapers(arxivIds) {
        const uniqueIds = [...new Set(arxivIds)];
        const results = [];
        const errors = [];

        // Process in smaller batches to reduce rate limiting
        const BATCH_SIZE = 5;
        for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
            const batch = uniqueIds.slice(i, i + BATCH_SIZE);
            try {
                const batchResults = await Promise.allSettled(
                    batch.map(id => this.fetchPaperDetails(id))
                );

                // Process results and errors
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        errors.push({
                            arxivId: batch[index],
                            error: result.reason.message
                        });
                    }
                });

                // Add a delay between batches
                if (i + BATCH_SIZE < uniqueIds.length) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
            } catch (error) {
                console.error(`Error processing batch starting at index ${i}:`, error);
                errors.push(...batch.map(id => ({
                    arxivId: id,
                    error: 'Batch processing failed'
                })));
            }
        }

        return {
            papers: results,
            errors: errors.length > 0 ? errors : null
        };
    }
}

module.exports = new ArxivService();