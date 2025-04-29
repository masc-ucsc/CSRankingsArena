"""
Configuration file for pytest
"""

import os
import sys
import pytest
import mongomock
import datetime

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock fixtures for testing

@pytest.fixture
def mock_mongodb_client():
    """Mock MongoDB client for testing."""
    return mongomock.MongoClient()

@pytest.fixture
def mock_paper():
    """Sample paper for testing."""
    return {
        "id": "test-paper-1",
        "source": "arxiv",
        "title": "Test Paper for Agent Testing",
        "authors": ["Test Author 1", "Test Author 2"],
        "abstract": "This is a test abstract for testing agent functionality.",
        "categories": ["cs.AI"],
        "main_topic": "AI",
        "pdf_url": "http://example.com/test.pdf",
        "published_date": datetime.datetime(2024, 1, 1),
        "collected_date": datetime.datetime.now()
    }

@pytest.fixture
def mock_papers_collection(mock_mongodb_client, mock_paper):
    """Mock papers collection with sample data."""
    db = mock_mongodb_client.paper_evaluation
    papers = db.papers
    papers.insert_one(mock_paper)
    return papers

@pytest.fixture
def mock_matches_collection(mock_mongodb_client):
    """Mock matches collection."""
    db = mock_mongodb_client.paper_evaluation
    return db.matches

@pytest.fixture
def mock_results_collection(mock_mongodb_client):
    """Mock results collection."""
    db = mock_mongodb_client.paper_evaluation
    return db.results

@pytest.fixture
def mock_openai_response():
    """Mock response for OpenAI API calls."""
    class MockChoice:
        def __init__(self, text):
            self.message = type('obj', (object,), {'content': text})
    
    class MockResponse:
        def __init__(self, text):
            self.choices = [MockChoice(text)]
    
    return MockResponse("""
    Summary: This is a test summary.
    
    Strengths:
    - Strength 1
    - Strength 2
    - Strength 3
    
    Weaknesses:
    - Weakness 1
    - Weakness 2
    
    Questions:
    - Question 1?
    - Question 2?
    
    Rating: 8
    
    Confidence: high
    """)

@pytest.fixture
def mock_anthropic_response():
    """Mock response for Anthropic API calls."""
    class MockContent:
        def __init__(self, text):
            self.text = text
    
    class MockResponse:
        def __init__(self, text):
            self.content = [MockContent(text)]
    
    return MockResponse("""
    Summary: This is a test summary from Claude.
    
    Strengths:
    - Strength A
    - Strength B
    - Strength C
    
    Weaknesses:
    - Weakness A
    - Weakness B
    
    Questions:
    - Question A?
    - Question B?
    
    Rating: 7
    
    Confidence: medium
    """)

# Environment variable fixtures

@pytest.fixture
def mock_env_vars(monkeypatch):
    """Set mock environment variables for testing."""
    monkeypatch.setenv("MONGODB_URI", "mongodb://localhost:27017/test")
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-anthropic-key")
    monkeypatch.setenv("PAPERS_PER_AGENT", "2")
    monkeypatch.setenv("COLLECTION_DAYS_BACK", "7")