"""
ArXiv Paper Collector

This module handles fetching and processing papers from the arXiv API.
"""

import arxiv
import logging
import datetime
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from bson.objectid import ObjectId

from ..utils.topic_classifier import classify_paper_topic

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ArxivCollector:
    """Collector for arXiv papers."""
    
    def __init__(self, db_uri: Optional[str] = None):
        """
        Initialize the ArXiv collector.
        
        Args:
            db_uri: MongoDB connection URI
        """
        self.client = None
        if db_uri:
            self.client = MongoClient(db_uri)
            self.db = self.client.paper_evaluation
            self.papers = self.db.papers
    
    def fetch_papers(
        self,
        categories: List[str],
        date_threshold: datetime.datetime,
        max_results: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Fetch papers from arXiv based on categories and date.
        
        Args:
            categories: List of arXiv categories (e.g. 'cs.AI', 'cs.AR')
            date_threshold: Only fetch papers published after this date
            max_results: Maximum number of results to return
            
        Returns:
            List of paper dictionaries
        """
        logger.info(f"Fetching papers for categories: {categories}")
        
        # Build query
        query = " OR ".join(f"cat:{cat}" for cat in categories)
        
        # Create search
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate
        )
        
        # Process results
        papers = []
        for result in search.results():
            # Skip papers published before threshold
            if result.published < date_threshold:
                continue
                
            # Extract paper data
            paper_data = {
                "source": "arxiv",
                "arxiv_id": result.entry_id.split('/')[-1],
                "title": result.title,
                "authors": [author.name for author in result.authors],
                "abstract": result.summary,
                "categories": result.categories,
                "main_topic": classify_paper_topic(result.categories, result.title, result.summary),
                "pdf_url": result.pdf_url,
                "published_date": result.published,
                "updated_date": result.updated,
                "collected_date": datetime.datetime.utcnow()
            }
            
            papers.append(paper_data)
        
        logger.info(f"Fetched {len(papers)} papers")
        return papers
    
    def save_papers(self, papers: List[Dict[str, Any]]) -> List[str]:
        """
        Save papers to MongoDB.
        
        Args:
            papers: List of paper dictionaries
            
        Returns:
            List of inserted document IDs
        """
        if not self.client:
            logger.warning("No database connection, papers not saved")
            return []
            
        if not papers:
            logger.info("No papers to save")
            return []
            
        # Insert papers
        result = self.papers.insert_many(papers)
        logger.info(f"Saved {len(result.inserted_ids)} papers to database")
        
        # Return string IDs
        return [str(id) for id in result.inserted_ids]
    
    def fetch_and_save(
        self,
        categories: List[str],
        date_threshold: datetime.datetime,
        max_results: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Fetch papers from arXiv and save to database.
        
        Args:
            categories: List of arXiv categories
            date_threshold: Only fetch papers published after this date
            max_results: Maximum number of results to return
            
        Returns:
            List of paper dictionaries
        """
        papers = self.fetch_papers(categories, date_threshold, max_results)
        if self.client:
            self.save_papers(papers)
        return papers