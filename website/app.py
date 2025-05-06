"""
Agent Competition Framework for Paper Evaluation League
This module handles the competition between AI agents for paper evaluation.
"""

import json
import uuid
import datetime
import logging
import random
import pandas as pd
from pymongo import MongoClient
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PaperReviewAgent(ABC):
    """Abstract base class for paper review agents."""
    
    def __init__(self, name):
        self.name = name
        self.stats = {
            'matches_played': 0,
            'matches_won': 0,
            'matches_drawn': 0,
            'points': 0
        }
    
    @abstractmethod
    def review_paper(self, paper):
        """
        Review a paper and return a structured review.
        
        Args:
            paper: Paper object containing metadata and content
            
        Returns:
            Review object with structured feedback
        """
        pass
    
    def update_stats(self, result):
        """Update agent stats based on match result."""
        self.stats['matches_played'] += 1
        
        if result == 'win':
            self.stats['matches_won'] += 1
            self.stats['points'] += 3
        elif result == 'draw':
            self.stats['matches_drawn'] += 1
            self.stats['points'] += 1


class OpenAIReviewAgent(PaperReviewAgent):
    """Paper review agent using OpenAI API."""
    
    def __init__(self, name, model="gpt-4", api_key=None):
        super().__init__(name)
        self.model = model
        
        import openai
        if api_key:
            openai.api_key = api_key
        self.client = openai.Client()
    
    def review_paper(self, paper):
        """
        Generate a paper review using OpenAI models.
        
        Args:
            paper: Paper object with metadata and content
            
        Returns:
            Review dictionary
        """
        # Create prompt for the model
        prompt = self._create_review_prompt(paper)
        
        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert academic paper reviewer. Provide detailed, constructive reviews of research papers following the standard academic review format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            # Parse the response
            review_text = response.choices[0].message.content
            
            # Parse the structured review 
            # (assuming the model returns the review in a structured format)
            review = self._parse_review_text(review_text)
            
            return review
        
        except Exception as e:
            logger.error(f"Error generating review with {self.name}: {e}")
            return {
                "error": str(e),
                "summary": "Failed to generate review",
                "strengths": [],
                "weaknesses": [],
                "questions": [],
                "rating": 0,
                "confidence": 0
            }
    
    def _create_review_prompt(self, paper):
        """Create a prompt for the review model."""
        return f"""
        Please review the following research paper and provide a structured academic review.
        
        Paper Title: {paper['title']}
        Authors: {', '.join(paper['authors'])}
        
        Abstract:
        {paper['abstract']}
        
        Your review should include:
        1. Summary: A brief summary of the paper's contributions
        2. Strengths: At least 3 specific strengths of the paper
        3. Weaknesses: At least 3 specific weaknesses or limitations
        4. Questions: 2-3 questions for the authors
        5. Rating: A numerical rating from 1-10
        6. Confidence: Your confidence in this review (low, medium, high)
        
        Format your response as follows:
        
        Summary:
        [Your summary here]
        
        Strengths:
        - [Strength 1]
        - [Strength 2]
        - [Strength 3]
        
        Weaknesses:
        - [Weakness 1]
        - [Weakness 2]
        - [Weakness 3]
        
        Questions:
        1. [Question 1]
        2. [Question 2]
        3. [Question 3]
        
        Rating: [1-10]
        
        Confidence: [low/medium/high]
        """
    
    def _parse_review_text(self, review_text):
        """Parse the structured review text into a dictionary."""
        # This is a simplified parser assuming a specific format
        # You may need a more robust parser depending on model output
        
        sections = {
            "summary": "",
            "strengths": [],
            "weaknesses": [],
            "questions": [],
            "rating": 0,
            "confidence": "low"
        }
        
        current_section = None
        
        for line in review_text.split('\n'):
            line = line.strip()
            
            if not line:
                continue
                
            if line.lower().startswith('summary:'):
                current_section = "summary"
                sections[current_section] = line[8:].strip()
            elif line.lower().startswith('strengths:'):
                current_section = "strengths"
            elif line.lower().startswith('weaknesses:'):
                current_section = "weaknesses"
            elif line.lower().startswith('questions:'):
                current_section = "questions"
            elif line.lower().startswith('rating:'):
                try:
                    sections["rating"] = int(line[7:].strip())
                except ValueError:
                    sections["rating"] = 0
            elif line.lower().startswith('confidence:'):
                sections["confidence"] = line[11:].strip().lower()
            elif current_section in ["strengths", "weaknesses", "questions"]:
                # Extract the item (removing leading dash or number)
                item = line.lstrip('-0123456789.() ').strip()
                if item:
                    sections[current_section].append(item)
            elif current_section == "summary":
                # Append to existing summary
                sections[current_section] += " " + line
        
        return sections


class AnthropicReviewAgent(PaperReviewAgent):
    """Paper review agent using Anthropic Claude API."""
    
    def __init__(self, name, model="claude-3-opus-20240229", api_key=None):
        super().__init__(name)
        self.model = model
        
        import anthropic
        self.client = anthropic.Anthropic(api_key=api_key)
    
    def review_paper(self, paper):
        """Generate a paper review using Anthropic Claude."""
        # Create prompt for the model
        prompt = self._create_review_prompt(paper)
        
        try:
            # Call Anthropic API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.3,
                system="You are an expert academic paper reviewer. Provide detailed, constructive reviews of research papers following the standard academic review format.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Parse the response
            review_text = response.content[0].text
            
            # Parse the structured review
            review = self._parse_review_text(review_text)
            
            return review
            
        except Exception as e:
            logger.error(f"Error generating review with {self.name}: {e}")
            return {
                "error": str(e),
                "summary": "Failed to generate review",
                "strengths": [],
                "weaknesses": [],
                "questions": [],
                "rating": 0,
                "confidence": 0
            }
    
    def _create_review_prompt(self, paper):
        """Create a prompt for the review model."""
        # Similar prompt structure as the OpenAI agent
        return f"""
        Please review the following research paper and provide a structured academic review.
        
        Paper Title: {paper['title']}
        Authors: {', '.join(paper['authors'])}
        
        Abstract:
        {paper['abstract']}
        
        Your review should include:
        1. Summary: A brief summary of the paper's contributions
        2. Strengths: At least 3 specific strengths of the paper
        3. Weaknesses: At least 3 specific weaknesses or limitations
        4. Questions: 2-3 questions for the authors
        5. Rating: A numerical rating from 1-10
        6. Confidence: Your confidence in this review (low, medium, high)
        
        Format your response as follows:
        
        Summary:
        [Your summary here]
        
        Strengths:
        - [Strength 1]
        - [Strength 2]
        - [Strength 3]
        
        Weaknesses:
        - [Weakness 1]
        - [Weakness 2]
        - [Weakness 3]
        
        Questions:
        1. [Question 1]
        2. [Question 2]
        3. [Question 3]
        
        Rating: [1-10]
        
        Confidence: [low/medium/high]
        """
    
    def _parse_review_text(self, review_text):
        """Parse the structured review text into a dictionary."""
        # Similar parser as the OpenAI agent
        sections = {
            "summary": "",
            "strengths": [],
            "weaknesses": [],
            "questions": [],
            "rating": 0,
            "confidence": "low"
        }
        
        current_section = None
        
        for line in review_text.split('\n'):
            line = line.strip()
            
            if not line:
                continue
                
            if line.lower().startswith('summary:'):
                current_section = "summary"
                sections[current_section] = line[8:].strip()
            elif line.lower().startswith('strengths:'):
                current_section = "strengths"
            elif line.lower().startswith('weaknesses:'):
                current_section = "weaknesses"
            elif line.lower().startswith('questions:'):
                current_section = "questions"
            elif line.lower().startswith('rating:'):
                try:
                    sections["rating"] = int(line[7:].strip())
                except ValueError:
                    sections["rating"] = 0
            elif line.lower().startswith('confidence:'):
                sections["confidence"] = line[11:].strip().lower()
            elif current_section in ["strengths", "weaknesses", "questions"]:
                # Extract the item (removing leading dash or number)
                item = line.lstrip('-0123456789.() ').strip()
                if item:
                    sections[current_section].append(item)
            elif current_section == "summary":
                # Append to existing summary
                sections[current_section] += " " + line
        
        return sections


class EvaluationJudge:
    """Judge that evaluates paper reviews and determines winners."""
    
    def __init__(self, model="gpt-4", api_key=None):
        self.model = model
        
        import openai
        if api_key:
            openai.api_key = api_key
        self.client = openai.Client()
    
    def evaluate_reviews(self, paper, review1, review2, agent1_name, agent2_name):
        """
        Compare two reviews and determine which is better.
        
        Args:
            paper: Paper object being reviewed
            review1: First review
            review2: Second review
            agent1_name: Name of first agent
            agent2_name: Name of second agent
            
        Returns:
            Dictionary with winner and reasoning
        """
        prompt = self._create_evaluation_prompt(paper, review1, review2, agent1_name, agent2_name)
        
        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert academic meta-reviewer tasked with evaluating the quality of paper reviews. Your job is to compare two reviews of the same paper and determine which review is more thorough, insightful, and helpful."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=1000
            )
            
            # Parse the response
            evaluation_text = response.choices[0].message.content
            
            # Parse the evaluation
            evaluation = self._parse_evaluation(evaluation_text, agent1_name, agent2_name)
            
            return evaluation
            
        except Exception as e:
            logger.error(f"Error evaluating reviews: {e}")
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
    
    def _create_evaluation_prompt(self, paper, review1, review2, agent1_name, agent2_name):
        """Create a prompt for the evaluation model."""
        return f"""
        Compare the following two reviews of the same academic paper and evaluate which review is better.
        
        Paper Title: {paper['title']}
        Authors: {', '.join(paper['authors'])}
        
        Abstract:
        {paper['abstract']}
        
        Review by {agent1_name}:
        
        Summary: {review1['summary']}
        
        Strengths:
        {self._format_list(review1['strengths'])}
        
        Weaknesses:
        {self._format_list(review1['weaknesses'])}
        
        Questions:
        {self._format_list(review1['questions'])}
        
        Rating: {review1['rating']}
        Confidence: {review1['confidence']}
        
        Review by {agent2_name}:
        
        Summary: {review2['summary']}
        
        Strengths:
        {self._format_list(review2['strengths'])}
        
        Weaknesses:
        {self._format_list(review2['weaknesses'])}
        
        Questions:
        {self._format_list(review2['questions'])}
        
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
    
    def _format_list(self, items):
        """Format a list of items as bullet points."""
        return '\n'.join([f"- {item}" for item in items])
    
    def _parse_evaluation(self, evaluation_text, agent1_name, agent2_name):
        """Parse the evaluation text into a structured format."""
        lines = evaluation_text.strip().split('\n')
        
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
        
        for line in lines:
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
                    score = int(line.split(':')[1].strip())
                    scores[current_section]["agent1"] = score
                except (ValueError, IndexError):
                    pass
            elif current_section and agent2_name in line:
                try:
                    score = int(line.split(':')[1].strip())
                    scores[current_section]["agent2"] = score
                except (ValueError, IndexError):
                    pass
        
        return {
            "winner": winner,
            "reasoning": reasoning,
            "scores": scores
        }


class PaperEvaluationLeague:
    """Main class for running the paper evaluation competition."""
    
    def __init__(self, db_connection_string=None):
        """Initialize the league with optional database connection."""
        self.agents = []
        self.papers = []
        self.matches = []
        self.results = []
        self.judge = None
        
        # Set up database connection if provided
        self.db_client = None
        if db_connection_string:
            self.db_client = MongoClient(db_connection_string)
            self.db = self.db_client['paper_evaluation_league']
            self.papers_collection = self.db['papers']
            self.matches_collection = self.db['matches']
            self.results_collection = self.db['results']
    
    def register_agent(self, agent):
        """Register an agent to participate in the league."""
        self.agents.append(agent)
        logger.info(f"Registered agent: {agent.name}")
    
    def register_judge(self, judge):
        """Register a judge for evaluating reviews."""
        self.judge = judge
        logger.info(f"Registered judge: {type(judge).__name__}")
    
    def load_papers(self, papers_data):
        """
        Load papers into the league.
        
        Args:
            papers_data: List of paper dictionaries or path to JSON/CSV file
        """
        if isinstance(papers_data, str):
            # Load from file
            if papers_data.endswith('.json'):
                with open(papers_data, 'r') as f:
                    self.papers = json.load(f)
            elif papers_data.endswith('.csv'):
                df = pd.read_csv(papers_data)
                self.papers = df.to_dict('records')
            else:
                raise ValueError("Unsupported file format. Use JSON or CSV.")
        else:
            # Assume list of dictionaries
            self.papers = papers_data
        
        logger.info(f"Loaded {len(self.papers)} papers")
    
    def load_papers_from_db(self, filter_query=None, limit=100):
        """Load papers from MongoDB database."""
        if not self.db_client:
            raise ValueError("No database connection")
        
        if filter_query is None:
            filter_query = {}
        
        papers = list(self.papers_collection.find(filter_query).limit(limit))
        self.papers = papers
        
        logger.info(f"Loaded {len(self.papers)} papers from database")
    
    def generate_matches(self, papers_per_agent=5, random_seed=None):
        """
        Generate matches between agents for paper reviews.
        
        Args:
            papers_per_agent: Number of papers each agent will review
            random_seed: Optional seed for reproducibility
        """
        if random_seed is not None:
            random.seed(random_seed)
        
        if not self.agents or len(self.agents) < 2:
            raise ValueError("Need at least 2 agents to generate matches")
        
        if not self.papers:
            raise ValueError("No papers loaded")
        
        # Sample papers if we have more than needed
        if len(self.papers) > papers_per_agent * len(self.agents):
            selected_papers = random.sample(self.papers, papers_per_agent * len(self.agents))
        else:
            selected_papers = self.papers
        
        # Generate all possible agent pairs
        agent_pairs = []
        for i in range(len(self.agents)):
            for j in range(i+1, len(self.agents)):
                agent_pairs.append((self.agents[i], self.agents[j]))
        
        # Assign papers to agent pairs
        self.matches = []
        paper_index = 0
        
        for paper in selected_papers:
            if paper_index >= len(selected_papers):
                break
                
            # Get next agent pair (cycling through all pairs)
            pair_index = paper_index % len(agent_pairs)
            agent1, agent2 = agent_pairs[pair_index]
            
            match_id = str(uuid.uuid4())
            match = {
                'id': match_id,
                'paper_id': paper['id'],
                'paper': paper,
                'agent1': agent1.name,
                'agent2': agent2.name,
                'status': 'pending',
                'created_at': datetime.datetime.now()
            }
            
            self.matches.append(match)
            
            # Save to database if connected
            if self.db_client:
                self.matches_collection.insert_one(match)
            
            paper_index += 1
        
        logger.info(f"Generated {len(self.matches)} matches")
    
    def run_competition(self):
        """Run all pending matches in the competition."""
        if not self.judge:
            raise ValueError("No judge registered")
        
        for match in self.matches:
            if match['status'] != 'pending':
                continue
                
            logger.info(f"Running match {match['id']} for paper '{match['paper']['title']}'")
            
            # Find agent objects
            agent1 = next(a for a in self.agents if a.name == match['agent1'])
            agent2 = next(a for a in self.agents if a.name == match['agent2'])
            
            try:
                # Generate reviews
                logger.info(f"Getting review from {agent1.name}")
                review1 = agent1.review_paper(match['paper'])
                
                logger.info(f"Getting review from {agent2.name}")
                review2 = agent2.review_paper(match['paper'])
                
                # Judge the reviews
                logger.info("Evaluating reviews")
                evaluation = self.judge.evaluate_reviews(
                    match['paper'], 
                    review1, 
                    review2, 
                    agent1.name, 
                    agent2.name
                )
                
                # Determine result
                if evaluation['winner'] == agent1.name:
                    agent1.update_stats('win')
                    agent2.update_stats('loss')
                    result = f"{agent1.name} wins"
                elif evaluation['winner'] == agent2.name:
                    agent2.update_stats('win')
                    agent1.update_stats('loss')
                    result = f"{agent2.name} wins"
                else:  # draw
                    agent1.update_stats('draw')
                    agent2.update_stats('draw')
                    result = "Draw"
                
                # Record result
                match_result = {
                    'match_id': match['id'],
                    'paper_id': match['paper_id'],
                    'paper_title': match['paper']['title'],
                    'agent1': agent1.name,
                    'agent2': agent2.name,
                    'review1': review1,
                    'review2': review2,
                    'evaluation': evaluation,
                    'winner': evaluation['winner'],
                    'result': result,
                    'completed_at': datetime.datetime.now()
                }
                
                self.results.append(match_result)
                
                # Update match status
                match['status'] = 'completed'
                
                # Save to database if connected
                if self.db_client:
                    self.results_collection.insert_one(match_result)
                    self.matches_collection.update_one(
                        {'id': match['id']},
                        {'$set': {'status': 'completed'}}
                    )
                
                logger.info(f"Match completed: {result}")
                
            except Exception as e:
                logger.error(f"Error running match {match['id']}: {e}")
                match['status'] = 'error'
                match['error'] = str(e)
                
                if self.db_client:
                    self.matches_collection.update_one(
                        {'id': match['id']},
                        {'$set': {'status': 'error', 'error': str(e)}}
                    )
    
    def get_leaderboard(self):
        """Generate a leaderboard based on agent performance."""
        leaderboard = []
        
        for agent in self.agents:
            entry = {
                'name': agent.name,
                'matches_played': agent.stats['matches_played'],
                'matches_won': agent.stats['matches_won'],
                'matches_drawn': agent.stats['matches_drawn'],
                'matches_lost': agent.stats['matches_played'] - agent.stats['matches_won'] - agent.stats['matches_drawn'],
                'points': agent.stats['points'],
                'win_percentage': (agent.stats['matches_won'] / agent.stats['matches_played'] * 100) if agent.stats['matches_played'] > 0 else 0
            }
            leaderboard.append(entry)
        
        # Sort by points (descending)
        leaderboard.sort(key=lambda x: x['points'], reverse=True)
        
        return leaderboard
    
    def export_results(self, output_file='results.json'):
        """Export competition results to a JSON file."""
        data = {
            'leaderboard': self.get_leaderboard(),
            'results': self.results
        }
        
        with open(output_file, 'w') as f:
            json.dump(data, f, default=str)
        
        logger.info(f"Exported results to {output_file}")


# Example usage
if __name__ == "__main__":
    # Initialize league
    league = PaperEvaluationLeague()
    
    # Register agents
    agent1 = OpenAIReviewAgent(
        name="GPT-4 Reviewer",
        model="gpt-4",
        api_key="your_openai_api_key"  # Set your API key
    )
    
    agent2 = AnthropicReviewAgent(
        name="Claude Reviewer",
        model="claude-3-opus-20240229",
        api_key="your_anthropic_api_key"  # Set your API key
    )
    
    league.register_agent(agent1)
    league.register_agent(agent2)
    
    # Register judge
    judge = EvaluationJudge(
        model="gpt-4",
        api_key="your_openai_api_key"  # Set your API key
    )
    
    league.register_judge(judge)
    
    # Load papers
    league.load_papers("papers.json")
    
    # Generate matches
    league.generate_matches(papers_per_agent=5)
    
    # Run competition
    league.run_competition()
    
    # Print leaderboard
    leaderboard = league.get_leaderboard()
    print("Leaderboard:")
    for rank, entry in enumerate(leaderboard, 1):
        print(f"{rank}. {entry['name']}: {entry['points']} points ({entry['matches_won']} wins, {entry['matches_drawn']} draws, {entry['matches_lost']} losses)")
    
    # Export results
    league.export_results()