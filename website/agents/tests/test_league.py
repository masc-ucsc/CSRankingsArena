import unittest
from unittest.mock import patch, MagicMock, call
import datetime
import uuid
from src.competition.league import PaperEvaluationLeague
from src.models.agent_base import ReviewAgent
from src.models.judge import EvaluationJudge

# Mock implementations for testing
class MockAgent(ReviewAgent):
    def review_paper(self, paper):
        return {
            "summary": f"Summary by {self.name}",
            "strengths": ["Strength 1", "Strength 2"],
            "weaknesses": ["Weakness 1", "Weakness 2"],
            "questions": ["Question 1", "Question 2"],
            "rating": 7,
            "confidence": "high"
        }

class MockJudge(EvaluationJudge):
    def evaluate_reviews(self, paper, review1, review2, agent1_name, agent2_name):
        # Simple mock evaluation - agent1 always wins
        return {
            "winner": agent1_name,
            "reasoning": "Agent 1 gave a better review",
            "scores": {
                "technical_correctness": {"agent1": 8, "agent2": 7},
                "depth_of_analysis": {"agent1": 8, "agent2": 7},
                "constructive_feedback": {"agent1": 8, "agent2": 7},
                "clarity": {"agent1": 8, "agent2": 7},
                "fairness": {"agent1": 8, "agent2": 7}
            },
            "total_scores": {"agent1": 40, "agent2": 35}
        }

class TestPaperEvaluationLeague(unittest.TestCase):
    def setUp(self):
        self.league = PaperEvaluationLeague()
        self.agent1 = MockAgent("Agent 1")
        self.agent2 = MockAgent("Agent 2")
        self.judge = MockJudge("Test Judge")
        
        # Sample papers for testing
        self.papers = [
            {
                "_id": "paper1",
                "title": "Paper 1",
                "authors": ["Author 1"],
                "abstract": "Abstract 1",
                "main_topic": "AI"
            },
            {
                "_id": "paper2",
                "title": "Paper 2",
                "authors": ["Author 2"],
                "abstract": "Abstract 2",
                "main_topic": "Programming"
            }
        ]
    
    def test_register_agent(self):
        self.league.register_agent(self.agent1)
        self.assertEqual(len(self.league.agents), 1)
        self.assertEqual(self.league.agents[0].name, "Agent 1")
    
    def test_register_judge(self):
        self.league.register_judge(self.judge)
        self.assertEqual(self.league.judge.name, "Test Judge")
    
    @patch('src.competition.league.uuid.uuid4')
    def test_generate_matches(self, mock_uuid):
        # Setup mocks
        mock_uuid.return_value = "test-uuid"
        
        # Register agents
        self.league.register_agent(self.agent1)
        self.league.register_agent(self.agent2)
        
        # Generate matches
        matches = self.league.generate_matches(self.papers, papers_per_agent=1)
        
        # Assertions
        self.assertEqual(len(matches), 1)
        
        match = matches[0]
        self.assertEqual(match["id"], "test-uuid")
        self.assertEqual(match["paper_id"], "paper1")
        self.assertEqual(match["paper"]["title"], "Paper 1")
        self.assertEqual(match["agent1"], "Agent 1")
        self.assertEqual(match["agent2"], "Agent 2")
        self.assertEqual(match["status"], "pending")
    
    def test_generate_matches_insufficient_agents(self):
        # Only one agent
        self.league.register_agent(self.agent1)
        
        # Should raise error
        with self.assertRaises(ValueError):
            self.league.generate_matches(self.papers)
    
    def test_generate_matches_no_papers(self):
        self.league.register_agent(self.agent1)
        self.league.register_agent(self.agent2)
        
        # Should raise error
        with self.assertRaises(ValueError):
            self.league.generate_matches([])
    
    @patch('src.competition.league.uuid.uuid4')
    @patch('src.competition.league.MongoClient')
    def test_generate_matches_db_save(self, mock_mongo, mock_uuid):
        # Setup mocks
        mock_uuid.return_value = "test-uuid"
        
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.matches_collection = mock_collection
        
        mock_client_instance = MagicMock()
        mock_client_instance.paper_evaluation = mock_db
        mock_mongo.return_value = mock_client_instance
        
        # Create league with mock DB
        league = PaperEvaluationLeague(db_uri="mongodb://test")
        league.matches_collection = mock_collection
        
        # Register agents
        league.register_agent(self.agent1)
        league.register_agent(self.agent2)
        
        # Generate matches
        league.generate_matches(self.papers, papers_per_agent=1)
        
        # Should save to DB
        mock_collection.insert_one.assert_called_once()
    
    def test_run_match(self):
        # Setup
        self.league.register_agent(self.agent1)
        self.league.register_agent(self.agent2)
        self.league.register_judge(self.judge)
        
        match = {
            "id": "match1",
            "paper_id": "paper1",
            "paper": self.papers[0],
            "agent1": "Agent 1",
            "agent2": "Agent 2",
            "status": "pending"
        }
        
        # Run match
        result = self.league.run_match(match)
        
        # Check result structure
        self.assertEqual(result["match_id"], "match1")
        self.assertEqual(result["paper_id"], "paper1")
        self.assertEqual(result["agent1"], "Agent 1")
        self.assertEqual(result["agent2"], "Agent 2")
        self.assertEqual(result["result"], "win_agent1")
        
        # Check reviews
        self.assertEqual(result["review1"]["summary"], "Summary by Agent 1")
        self.assertEqual(result["review2"]["summary"], "Summary by Agent 2")
        
        # Check evaluation
        self.assertEqual(result["evaluation"]["winner"], "Agent 1")
        
        # Check agent stats were updated
        self.assertEqual(self.agent1.stats["matches_won"], 1)
        self.assertEqual(self.agent1.stats["points"], 3)
        self.assertEqual(self.agent2.stats["matches_lost"], 1)
    
    def test_run_match_no_judge(self):
        # Setup without judge
        self.league.register_agent(self.agent1)
        self.league.register_agent(self.agent2)
        
        match = {
            "id": "match1",
            "paper_id": "paper1",
            "paper": self.papers[0],
            "agent1": "Agent 1",
            "agent2": "Agent 2",
            "status": "pending"
        }
        
        # Should return None
        result = self.league.run_match(match)
        self.assertIsNone(result)
    
    def test_run_competition(self):
        # Setup
        self.league.register_agent(self.agent1)
        self.league.register_agent(self.agent2)
        self.league.register_judge(self.judge)
        
        # Add some matches
        self.league.matches = [
            {
                "id": "match1",
                "paper_id": "paper1",
                "paper": self.papers[0],
                "agent1": "Agent 1",
                "agent2": "Agent 2",
                "status": "pending"
            },
            {
                "id": "match2",
                "paper_id": "paper2",
                "paper": self.papers[1],
                "agent1": "Agent 1",
                "agent2": "Agent 2",
                "status": "completed"  # Already completed, should be skipped
            }
        ]
        
        # Run competition
        results = self.league.run_competition()
        
        # Should have 1 result
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["match_id"], "match1")
    
    def test_get_leaderboard(self):
        # Setup agents with stats
        self.agent1.stats = {
            "matches_played": 3,
            "matches_won": 2,
            "matches_drawn": 1,
            "matches_lost": 0,
            "points": 7,
            "win_percentage": 66.67
        }
        
        self.agent2.stats = {
            "matches_played": 3,
            "matches_won": 1,
            "matches_drawn": 0,
            "matches_lost": 2,
            "points": 3,
            "win_percentage": 33.33
        }
        
        self.league.register_agent(self.agent1)
        self.league.register_agent(self.agent2)
        
        # Get leaderboard
        leaderboard = self.league.get_leaderboard()
        
        # Check sorting by points
        self.assertEqual(len(leaderboard), 2)
        self.assertEqual(leaderboard[0]["name"], "Agent 1")
        self.assertEqual(leaderboard[0]["points"], 7)
        self.assertEqual(leaderboard[1]["name"], "Agent 2")
        self.assertEqual(leaderboard[1]["points"], 3)


if __name__ == '__main__':
    unittest.main()