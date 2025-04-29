"""
Evaluation Judge

This module implements a judge that evaluates paper reviews and determines winners.
"""

import logging
import re
from typing import Dict, Any, Optional
import openai

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EvaluationJudge:
    """Judge that evaluates paper reviews and determines winners."""
    
    def __init__(self, name: str = "Evaluation Judge", model: str = "gpt-4", api_key: Optional[str] = None):
        """
        Initialize an evaluation judge.
        
        Args:
            name: Judge name
            model: OpenAI model to use
            api_key: OpenAI API key
        """
        self.name = name
        self.model = model
        
        if api_key:
            openai.api_key = api_key
        
        self.client = openai.OpenAI()
    
    def evaluate_reviews(
        self, 
        paper: Dict[str, Any], 
        review1: Dict[str, Any], 
        review2: Dict[str, Any],
        agent1_name: str,
        agent2_name: str
    ) -> Dict[str, Any]:
        """
        Compare two reviews and determine which is better.
        
        Args:
            paper: Paper document
            review1: First review document
            review2: Second review document
            agent1_name: Name of first agent
            agent2_name: Name of second agent
            
        Returns:
            Evaluation document with winner and reasoning
        """
        logger.info(f"Evaluating reviews for paper: {paper['title']}")
        
        # Create prompt for evaluation
        prompt = self._create_evaluation_prompt(
            paper, review1, review2, agent1_name, agent2_name
        )
        
        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            # Extract evaluation text
            evaluation_text = response.choices[0].message.content
            
            # Parse evaluation
            evaluation = self._parse_evaluation(
                evaluation_text, agent1_name, agent2_name
            )
            
            logger.info(f"Evaluation complete. Winner: {evaluation['winner']}")
            return evaluation
            
        except Exception as e:
            logger.error(f"Error evaluating reviews: {str(e)}")
            return {
                "winner": "draw",
                "reasoning": f"Error during evaluation: {str(e)}",
                "scores": {
                    "technical_correctness": {"agent1": 5, "agent2": 5},
                    "depth_of_analysis": {"agent1": 5, "agent2": 5},
                    "constructive_feedback": {"agent1": 5, "agent2": 5},
                    "clarity": {"agent1": 5, "agent2": 5},
                    "fairness": {"agent1": 5, "agent2": 5}
                }
            }
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the model."""
        return """
        You are an expert academic meta-reviewer tasked with evaluating the quality of paper reviews.
        Your job is to compare two reviews of the same paper and determine which review is more thorough,
        insightful, and helpful.
        
        Evaluate the reviews based on:
        1. Technical Correctness: Does the review accurately assess the paper's methods and claims?
        2. Depth of Analysis: Does the review provide insightful technical analysis?
        3. Constructive Feedback: Does the review offer actionable suggestions?
        4. Clarity: Is the review well-structured and clearly written?
        5. Fairness: Does the review maintain objectivity and balance?
        
        Provide numerical scores (1-10) for each criterion and determine the overall winner.
        """
    
    def _create_evaluation_prompt(
        self,
        paper: Dict[str, Any],
        review1: Dict[str, Any],
        review2: Dict[str, Any],
        agent1_name: str,
        agent2_name: str
    ) -> str:
        """
        Create a prompt for the evaluation model.
        
        Args:
            paper: Paper document
            review1: First review document
            review2: Second review document
            agent1_name: Name of first agent
            agent2_name: Name of second agent
            
        Returns:
            Formatted prompt string
        """
        # Format strengths as bulleted list
        strengths1 = "\n".join([f"- {item}" for item in review1["strengths"]])
        strengths2 = "\n".join([f"- {item}" for item in review2["strengths"]])
        
        # Format weaknesses as bulleted list
        weaknesses1 = "\n".join([f"- {item}" for item in review1["weaknesses"]])
        weaknesses2 = "\n".join([f"- {item}" for item in review2["weaknesses"]])
        
        # Format questions as bulleted list
        questions1 = "\n".join([f"- {item}" for item in review1["questions"]])
        questions2 = "\n".join([f"- {item}" for item in review2["questions"]])
        
        return f"""
        Compare the following two reviews of the same academic paper and evaluate which review is better.
        
        Paper Title: {paper['title']}
        Authors: {', '.join(paper['authors'])}
        
        Abstract:
        {paper['abstract']}
        
        Review by {agent1_name}:
        
        Summary: {review1['summary']}
        
        Strengths:
        {strengths1}
        
        Weaknesses:
        {weaknesses1}
        
        Questions:
        {questions1}
        
        Rating: {review1['rating']}
        Confidence: {review1['confidence']}
        
        Review by {agent2_name}:
        
        Summary: {review2['summary']}
        
        Strengths:
        {strengths2}
        
        Weaknesses:
        {weaknesses2}
        
        Questions:
        {questions2}
        
        Rating: {review2['rating']}
        Confidence: {review2['confidence']}
        
        Evaluate these reviews based on the following criteria:
        1. Technical Correctness (1-10): Does the review accurately assess the paper's methods and claims?
        2. Depth of Analysis (1-10): Does the review provide insightful technical analysis?
        3. Constructive Feedback (1-10): Does the review offer actionable suggestions?
        4. Clarity (1-10): Is the review well-structured and clearly written?
        5. Fairness (1-10): Does the review maintain objectivity and balance?
        
        For each criterion, provide a score for both reviews. Then determine which review is better overall or if they are equally good (a draw).
        
        Format your response exactly as follows:
        
        Technical Correctness:
        {agent1_name}: [score]
        {agent2_name}: [score]
        
        Depth of Analysis:
        {agent1_name}: [score]
        {agent2_name}: [score]
        
        Constructive Feedback:
        {agent1_name}: [score]
        {agent2_name}: [score]
        
        Clarity:
        {agent1_name}: [score]
        {agent2_name}: [score]
        
        Fairness:
        {agent1_name}: [score]
        {agent2_name}: [score]
        
        Winner: [{agent1_name}/{agent2_name}/draw]
        
        Reasoning:
        [Your reasoning for the winner determination]
        """
    
    def _parse_evaluation(
        self, 
        evaluation_text: str, 
        agent1_name: str, 
        agent2_name: str
    ) -> Dict[str, Any]:
        """
        Parse the evaluation text into a structured format.
        
        Args:
            evaluation_text: Raw evaluation text from the model
            agent1_name: Name of first agent
            agent2_name: Name of second agent
            
        Returns:
            Structured evaluation dictionary
        """
        scores = {
            "technical_correctness": {"agent1": 0, "agent2": 0},
            "depth_of_analysis": {"agent1": 0, "agent2": 0},
            "constructive_feedback": {"agent1": 0, "agent2": 0},
            "clarity": {"agent1": 0, "agent2": 0},
            "fairness": {"agent1": 0, "agent2": 0}
        }
        
        winner = "draw"
        reasoning = ""
        
        current_section = None
        reasoning_started = False
        
        for line in evaluation_text.strip().split('\n'):
            line = line.strip()
            
            if not line:
                continue
            
            if line.lower().startswith('technical correctness:'):
                current_section = "technical_correctness"
                
            elif line.lower().startswith('depth of analysis:'):
                current_section = "depth_of_analysis"
                
            elif line.lower().startswith('constructive feedback:'):
                current_section = "constructive_feedback"
                
            elif line.lower().startswith('clarity:'):
                current_section = "clarity"
                
            elif line.lower().startswith('fairness:'):
                current_section = "fairness"
                
            elif line.lower().startswith('winner:'):
                winner_text = line[7:].strip().lower()
                if agent1_name.lower() in winner_text:
                    winner = agent1_name
                elif agent2_name.lower() in winner_text:
                    winner = agent2_name
                else:
                    winner = "draw"
                    
            elif line.lower().startswith('reasoning:'):
                reasoning_started = True
                reasoning = line[10:].strip()
                
            elif reasoning_started:
                reasoning += " " + line
                
            elif current_section and agent1_name in line:
                try:
                    # Extract score using regex to handle various formats
                    score_match = re.search(r'\d+', line.split(':')[1].strip())
                    if score_match:
                        scores[current_section]["agent1"] = int(score_match.group())
                except (ValueError, IndexError):
                    pass
                    
            elif current_section and agent2_name in line:
                try:
                    score_match = re.search(r'\d+', line.split(':')[1].strip())
                    if score_match:
                        scores[current_section]["agent2"] = int(score_match.group())
                except (ValueError, IndexError):
                    pass
        
        # Calculate total scores
        total_agent1 = sum(scores[key]["agent1"] for key in scores)
        total_agent2 = sum(scores[key]["agent2"] for key in scores)
        
        # If no winner was explicitly stated, determine based on scores
        if winner == "draw" and total_agent1 != total_agent2:
            winner = agent1_name if total_agent1 > total_agent2 else agent2_name
        
        return {
            "winner": winner,
            "reasoning": reasoning,
            "scores": scores,
            "total_scores": {
                "agent1": total_agent1,
                "agent2": total_agent2
            }
        }