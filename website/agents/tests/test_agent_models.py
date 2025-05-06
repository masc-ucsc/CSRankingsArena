import unittest
from unittest.mock import patch, MagicMock
from src.models.agent_base import ReviewAgent
from src.models.openai_agent import OpenAIReviewAgent
from src.models.judge import EvaluationJudge

class TestReviewAgent(unittest.TestCase):
    def test_base_agent_init(self):
        # Create a concrete subclass for testing
        class ConcreteAgent(ReviewAgent):
            def review_paper(self, paper):
                return {"summary": "Test"}
        
        # Test initialization
        agent = ConcreteAgent("Test Agent")
        self.assertEqual(agent.name, "Test Agent")
        
        # Check that stats are initialized correctly
        self.assertEqual(agent.stats["matches_played"], 0)
        self.assertEqual(agent.stats["matches_won"], 0)
        self.assertEqual(agent.stats["matches_drawn"], 0)
        self.assertEqual(agent.stats["matches_lost"], 0)
        self.assertEqual(agent.stats["points"], 0)
        self.assertEqual(agent.stats["win_percentage"], 0.0)
    
    def test_update_stats_win(self):
        class ConcreteAgent(ReviewAgent):
            def review_paper(self, paper):
                return {"summary": "Test"}
        
        agent = ConcreteAgent("Test Agent")
        
        # Test win
        agent.update_stats("win")
        self.assertEqual(agent.stats["matches_played"], 1)
        self.assertEqual(agent.stats["matches_won"], 1)
        self.assertEqual(agent.stats["matches_drawn"], 0)
        self.assertEqual(agent.stats["matches_lost"], 0)
        self.assertEqual(agent.stats["points"], 3)
        self.assertEqual(agent.stats["win_percentage"], 100.0)
    
    def test_update_stats_draw(self):
        class ConcreteAgent(ReviewAgent):
            def review_paper(self, paper):
                return {"summary": "Test"}
        
        agent = ConcreteAgent("Test Agent")
        
        # Test draw
        agent.update_stats("draw")
        self.assertEqual(agent.stats["matches_played"], 1)
        self.assertEqual(agent.stats["matches_won"], 0)
        self.assertEqual(agent.stats["matches_drawn"], 1)
        self.assertEqual(agent.stats["matches_lost"], 0)
        self.assertEqual(agent.stats["points"], 1)
        self.assertEqual(agent.stats["win_percentage"], 0.0)
    
    def test_update_stats_loss(self):
        class ConcreteAgent(ReviewAgent):
            def review_paper(self, paper):
                return {"summary": "Test"}
        
        agent = ConcreteAgent("Test Agent")
        
        # Test loss
        agent.update_stats("loss")
        self.assertEqual(agent.stats["matches_played"], 1)
        self.assertEqual(agent.stats["matches_won"], 0)
        self.assertEqual(agent.stats["matches_drawn"], 0)
        self.assertEqual(agent.stats["matches_lost"], 1)
        self.assertEqual(agent.stats["points"], 0)
        self.assertEqual(agent.stats["win_percentage"], 0.0)
    
    def test_update_stats_multiple(self):
        class ConcreteAgent(ReviewAgent):
            def review_paper(self, paper):
                return {"summary": "Test"}
        
        agent = ConcreteAgent("Test Agent")
        
        # Test multiple updates
        agent.update_stats("win")  # +3 points
        agent.update_stats("win")  # +3 points
        agent.update_stats("draw") # +1 point
        agent.update_stats("loss") # +0 points
        
        self.assertEqual(agent.stats["matches_played"], 4)
        self.assertEqual(agent.stats["matches_won"], 2)
        self.assertEqual(agent.stats["matches_drawn"], 1)
        self.assertEqual(agent.stats["matches_lost"], 1)
        self.assertEqual(agent.stats["points"], 7)
        self.assertEqual(agent.stats["win_percentage"], 50.0)


class TestOpenAIAgent(unittest.TestCase):
    @patch('src.models.openai_agent.openai')
    def test_init(self, mock_openai):
        # Test initialization with API key
        agent = OpenAIReviewAgent("Test OpenAI", model="gpt-4", api_key="test-key")
        self.assertEqual(agent.name, "Test OpenAI")
        self.assertEqual(agent.model, "gpt-4")
        mock_openai.api_key = "test-key"
    
    @patch('src.models.openai_agent.openai.OpenAI')
    def test_review_paper_success(self, mock_openai_client):
        # Setup mock response
        mock_message = MagicMock()
        mock_message.content = """
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
        """
        
        mock_choice = MagicMock()
        mock_choice.message = mock_message
        
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        
        mock_client_instance = MagicMock()
        mock_client_instance.chat.completions.create.return_value = mock_response
        mock_openai_client.return_value = mock_client_instance
        
        # Create agent
        agent = OpenAIReviewAgent("Test OpenAI", model="gpt-4")
        
        # Test paper
        paper = {
            "title": "Test Paper",
            "authors": ["Test Author"],
            "abstract": "Test abstract"
        }
        
        # Call method
        review = agent.review_paper(paper)
        
        # Assertions
        self.assertEqual(review["summary"], "This is a test summary.")
        self.assertEqual(len(review["strengths"]), 3)
        self.assertEqual(review["strengths"][0], "Strength 1")
        self.assertEqual(len(review["weaknesses"]), 2)
        self.assertEqual(review["weaknesses"][0], "Weakness 1")
        self.assertEqual(len(review["questions"]), 2)
        self.assertEqual(review["questions"][0], "Question 1?")
        self.assertEqual(review["rating"], 8)
        self.assertEqual(review["confidence"], "high")
        
        # Check API call
        mock_client_instance.chat.completions.create.assert_called_once()
        call_args = mock_client_instance.chat.completions.create.call_args[1]
        self.assertEqual(call_args["model"], "gpt-4")
        self.assertEqual(call_args["temperature"], 0.3)
        self.assertEqual(len(call_args["messages"]), 2)
    
    @patch('src.models.openai_agent.openai.OpenAI')
    def test_review_paper_error(self, mock_openai_client):
        # Setup mock to raise exception
        mock_client_instance = MagicMock()
        mock_client_instance.chat.completions.create.side_effect = Exception("API error")
        mock_openai_client.return_value = mock_client_instance
        
        # Create agent
        agent = OpenAIReviewAgent("Test OpenAI", model="gpt-4")
        
        # Test paper
        paper = {
            "title": "Test Paper",
            "authors": ["Test Author"],
            "abstract": "Test abstract"
        }
        
        # Call method - should handle exception
        review = agent.review_paper(paper)
        
        # Assertions for error case
        self.assertEqual(review["summary"], "Failed to generate review")
        self.assertEqual(review["error"], "API error")
        self.assertEqual(review["rating"], 0)
        self.assertEqual(review["confidence"], "low")
    
    def test_parse_review_text(self):
        agent = OpenAIReviewAgent("Test OpenAI", model="gpt-4")
        
        # Test parsing with different formats
        review_text = """
        Summary: This is a summary.
        
        Strengths:
        - First strength
        * Second strength
        
        Weaknesses:
        - First weakness
        - Second weakness
        
        Questions:
        1. First question?
        2. Second question?
        
        Rating: 7/10
        
        Confidence: medium
        """
        
        parsed = agent._parse_review_text(review_text)
        
        self.assertEqual(parsed["summary"], "This is a summary.")
        self.assertEqual(len(parsed["strengths"]), 2)
        self.assertEqual(parsed["strengths"][0], "First strength")
        self.assertEqual(parsed["strengths"][1], "Second strength")
        self.assertEqual(len(parsed["weaknesses"]), 2)
        self.assertEqual(parsed["questions"][0], "First question?")
        self.assertEqual(parsed["rating"], 7)
        self.assertEqual(parsed["confidence"], "medium")


class TestEvaluationJudge(unittest.TestCase):
    @patch('src.models.judge.openai')
    def test_init(self, mock_openai):
        # Test initialization
        judge = EvaluationJudge(name="Test Judge", model="gpt-4", api_key="test-key")
        self.assertEqual(judge.name, "Test Judge")
        self.assertEqual(judge.model, "gpt-4")
    
    @patch('src.models.judge.openai.OpenAI')
    def test_evaluate_reviews(self, mock_openai_client):
        # Setup mock response
        mock_message = MagicMock()
        mock_message.content = """
        Technical Correctness:
        Agent 1: 8
        Agent 2: 7
        
        Depth of Analysis:
        Agent 1: 9
        Agent 2: 7
        
        Constructive Feedback:
        Agent 1: 8
        Agent 2: 8
        
        Clarity:
        Agent 1: 7
        Agent 2: 8
        
        Fairness:
        Agent 1: 8
        Agent 2: 7
        
        Winner: Agent 1
        
        Reasoning: Agent 1 provided a more technically accurate and deeper analysis of the paper's contributions.
        """
        
        mock_choice = MagicMock()
        mock_choice.message = mock_message
        
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        
        mock_client_instance = MagicMock()
        mock_client_instance.chat.completions.create.return_value = mock_response
        mock_openai_client.return_value = mock_client_instance
        
        # Create judge
        judge = EvaluationJudge(model="gpt-4")
        
        # Test paper and reviews
        paper = {
            "title": "Test Paper",
            "authors": ["Test Author"],
            "abstract": "Test abstract"
        }
        
        review1 = {
            "summary": "Review 1 summary",
            "strengths": ["Strength 1", "Strength 2"],
            "weaknesses": ["Weakness 1", "Weakness 2"],
            "questions": ["Question 1?", "Question 2?"],
            "rating": 8,
            "confidence": "high"
        }
        
        review2 = {
            "summary": "Review 2 summary",
            "strengths": ["Strength A", "Strength B"],
            "weaknesses": ["Weakness A", "Weakness B"],
            "questions": ["Question A?", "Question B?"],
            "rating": 7,
            "confidence": "medium"
        }
        
        # Call method
        evaluation = judge.evaluate_reviews(
            paper, review1, review2, "Agent 1", "Agent 2"
        )
        
        # Assertions
        self.assertEqual(evaluation["winner"], "Agent 1")
        self.assertTrue("Agent 1 provided" in evaluation["reasoning"])
        
        # Check scores
        self.assertEqual(evaluation["scores"]["technical_correctness"]["agent1"], 8)
        self.assertEqual(evaluation["scores"]["technical_correctness"]["agent2"], 7)
        self.assertEqual(evaluation["scores"]["depth_of_analysis"]["agent1"], 9)
        self.assertEqual(evaluation["scores"]["clarity"]["agent2"], 8)
        
        # Check total scores
        self.assertEqual(evaluation["total_scores"]["agent1"], 40)
        self.assertEqual(evaluation["total_scores"]["agent2"], 37)
        
        # Check API call
        mock_client_instance.chat.completions.create.assert_called_once()
        call_args = mock_client_instance.chat.completions.create.call_args[1]
        self.assertEqual(call_args["model"], "gpt-4")
        self.assertEqual(call_args["temperature"], 0.2)
    
    @patch('src.models.judge.openai.OpenAI')
    def test_evaluate_reviews_error(self, mock_openai_client):
        # Setup mock to raise exception
        mock_client_instance = MagicMock()
        mock_client_instance.chat.completions.create.side_effect = Exception("API error")
        mock_openai_client.return_value = mock_client_instance
        
        # Create judge
        judge = EvaluationJudge(model="gpt-4")
        
        # Test data
        paper = {"title": "Test Paper"}
        review1 = {"summary": "Review 1"}
        review2 = {"summary": "Review 2"}
        
        # Call method - should handle exception
        evaluation = judge.evaluate_reviews(
            paper, review1, review2, "Agent 1", "Agent 2"
        )
        
        # Assertions for error case
        self.assertEqual(evaluation["winner"], "draw")
        self.assertTrue("Error during evaluation" in evaluation["reasoning"])
        self.assertEqual(evaluation["scores"]["technical_correctness"]["agent1"], 5)
        self.assertEqual(evaluation["scores"]["technical_correctness"]["agent2"], 5)
    
    def test_parse_evaluation(self):
        judge = EvaluationJudge()
        
        # Test evaluation text
        evaluation_text = """
        Technical Correctness:
        Agent 1: 8
        Agent 2: 7
        
        Depth of Analysis:
        Agent 1: 9
        Agent 2: 7
        
        Constructive Feedback:
        Agent 1: 8
        Agent 2: 8
        
        Clarity:
        Agent 1: 7
        Agent 2: 8
        
        Fairness:
        Agent 1: 8
        Agent 2: 7
        
        Winner: Agent 1
        
        Reasoning: Agent 1 provided better analysis.
        """
        
        parsed = judge._parse_evaluation(evaluation_text, "Agent 1", "Agent 2")
        
        # Check parsing
        self.assertEqual(parsed["winner"], "Agent 1")
        self.assertEqual(parsed["reasoning"], "Agent 1 provided better analysis.")
        self.assertEqual(parsed["scores"]["technical_correctness"]["agent1"], 8)
        self.assertEqual(parsed["scores"]["technical_correctness"]["agent2"], 7)
        self.assertEqual(parsed["scores"]["depth_of_analysis"]["agent1"], 9)
        self.assertEqual(parsed["scores"]["clarity"]["agent2"], 8)
        
        # Check total scores calculation
        self.assertEqual(parsed["total_scores"]["agent1"], 40)
        self.assertEqual(parsed["total_scores"]["agent2"], 37)
    
    def test_parse_evaluation_draw(self):
        judge = EvaluationJudge()
        
        # Test draw case
        evaluation_text = """
        Technical Correctness:
        Agent 1: 8
        Agent 2: 8
        
        Depth of Analysis:
        Agent 1: 7
        Agent 2: 7
        
        Winner: draw
        
        Reasoning: Both reviews were equally good.
        """
        
        parsed = judge._parse_evaluation(evaluation_text, "Agent 1", "Agent 2")
        
        self.assertEqual(parsed["winner"], "draw")
        self.assertEqual(parsed["reasoning"], "Both reviews were equally good.")
        self.assertEqual(parsed["total_scores"]["agent1"], 15)
        self.assertEqual(parsed["total_scores"]["agent2"], 15)
    
    def test_parse_evaluation_no_explicit_winner(self):
        judge = EvaluationJudge()
        
        # Test case where no winner is explicitly stated, but scores differ
        evaluation_text = """
        Technical Correctness:
        Agent 1: 8
        Agent 2: 7
        
        Depth of Analysis:
        Agent 1: 9
        Agent 2: 7
        
        Constructive Feedback:
        Agent 1: 8
        Agent 2: 8
        
        Clarity:
        Agent 1: 9
        Agent 2: 8
        
        Fairness:
        Agent 1: 8
        Agent 2: 7
        """
        
        parsed = judge._parse_evaluation(evaluation_text, "Agent 1", "Agent 2")
        
        # Should determine winner based on total scores
        self.assertEqual(parsed["winner"], "Agent 1")
        self.assertEqual(parsed["total_scores"]["agent1"], 42)
        self.assertEqual(parsed["total_scores"]["agent2"], 37)


if __name__ == '__main__':
    unittest.main()