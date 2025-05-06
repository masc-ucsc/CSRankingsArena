import unittest
from unittest.mock import patch, MagicMock
import datetime
from src.collectors.arxiv_collectors import ArxivCollector
from src.utils.topic_classifier import classify_paper_topic

class TestArxivCollector(unittest.TestCase):
    def setUp(self):
        self.collector = ArxivCollector()
        
    @patch('src.collectors.arxiv_collector.arxiv.Search')
    @patch('src.collectors.arxiv_collector.classify_paper_topic')
    def test_fetch_papers(self, mock_classify, mock_search):
        # Setup mock data
        mock_author = MagicMock()
        mock_author.name = "Test Author"
        
        mock_result = MagicMock()
        mock_result.entry_id = "http://arxiv.org/abs/2401.01234"
        mock_result.title = "Test Paper"
        mock_result.authors = [mock_author]
        mock_result.summary = "This is a test paper abstract."
        mock_result.categories = ["cs.AI"]
        mock_result.pdf_url = "http://arxiv.org/pdf/2401.01234"
        mock_result.published = datetime.datetime(2024, 1, 1)
        mock_result.updated = datetime.datetime(2024, 1, 2)
        
        # Setup search mock to return our mock_result
        mock_search_instance = MagicMock()
        mock_search_instance.results.return_value = [mock_result]
        mock_search.return_value = mock_search_instance
        
        # Setup classifier mock
        mock_classify.return_value = "AI"
        
        # Call the method
        date_threshold = datetime.datetime(2023, 12, 1)
        papers = self.collector.fetch_papers(["cs.AI"], date_threshold, max_results=1)
        
        # Assertions
        self.assertEqual(len(papers), 1)
        
        paper = papers[0]
        self.assertEqual(paper["arxiv_id"], "2401.01234")
        self.assertEqual(paper["title"], "Test Paper")
        self.assertEqual(paper["authors"], ["Test Author"])
        self.assertEqual(paper["abstract"], "This is a test paper abstract.")
        self.assertEqual(paper["categories"], ["cs.AI"])
        self.assertEqual(paper["main_topic"], "AI")
        self.assertEqual(paper["pdf_url"], "http://arxiv.org/pdf/2401.01234")
        self.assertEqual(paper["published_date"], datetime.datetime(2024, 1, 1))
        
        # Check that mock was called correctly
        mock_search.assert_called_with(
            query="cat:cs.AI",
            max_results=1,
            sort_by=mock_search.return_value.sort_by
        )
    
    @patch('src.collectors.arxiv_collector.arxiv.Search')
    def test_filter_by_date(self, mock_search):
        # Setup mock data for a paper published before threshold
        mock_author = MagicMock()
        mock_author.name = "Test Author"
        
        mock_result = MagicMock()
        mock_result.entry_id = "http://arxiv.org/abs/2401.01234"
        mock_result.title = "Test Paper"
        mock_result.authors = [mock_author]
        mock_result.summary = "This is a test paper abstract."
        mock_result.categories = ["cs.AI"]
        mock_result.pdf_url = "http://arxiv.org/pdf/2401.01234"
        mock_result.published = datetime.datetime(2023, 1, 1)  # Old paper
        
        # Setup search mock
        mock_search_instance = MagicMock()
        mock_search_instance.results.return_value = [mock_result]
        mock_search.return_value = mock_search_instance
        
        # Call the method with a threshold after the paper's date
        date_threshold = datetime.datetime(2024, 1, 1)
        papers = self.collector.fetch_papers(["cs.AI"], date_threshold, max_results=1)
        
        # Should filter out the paper
        self.assertEqual(len(papers), 0)
    
    @patch('src.collectors.arxiv_collector.MongoClient')
    def test_save_papers(self, mock_mongo_client):
        # Setup MongoDB mock
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_insert_result = MagicMock()
        mock_insert_result.inserted_ids = ["id1", "id2"]
        
        mock_collection.insert_many.return_value = mock_insert_result
        mock_db.papers = mock_collection
        
        mock_client_instance = MagicMock()
        mock_client_instance.paper_evaluation = mock_db
        mock_mongo_client.return_value = mock_client_instance
        
        # Create collector with mock DB
        collector = ArxivCollector(db_uri="mongodb://test")
        
        # Test papers
        papers = [
            {"title": "Paper 1", "authors": ["Author 1"]},
            {"title": "Paper 2", "authors": ["Author 2"]}
        ]
        
        # Call method
        ids = collector.save_papers(papers)
        
        # Assertions
        mock_collection.insert_many.assert_called_with(papers)
        self.assertEqual(ids, ["id1", "id2"])
    
    def test_save_papers_no_db(self):
        # Test when no DB connection is available
        collector = ArxivCollector()
        papers = [{"title": "Paper 1"}]
        
        # Should return empty list
        self.assertEqual(collector.save_papers(papers), [])
    
    def test_save_papers_empty_list(self):
        # Create collector with mocked DB
        collector = ArxivCollector(db_uri="mongodb://test")
        collector.papers = MagicMock()
        
        # Test with empty list
        self.assertEqual(collector.save_papers([]), [])
        
        # Verify that insert_many was not called
        collector.papers.insert_many.assert_not_called()


if __name__ == '__main__':
    unittest.main()