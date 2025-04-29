"""
Paper Evaluation League

This module implements the core competition framework for the paper evaluation league.
"""

import logging
import datetime
import uuid
from typing import List, Dict, Any, Optional
from pymongo import MongoClient

from ..models.agent_base import ReviewAgent
from ..models.judge import EvaluationJudge

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PaperEvaluationLeague:
    """Main class for running paper evaluation competitions."""
    
    def __init__(self, db_uri: Optional[str] = None):
        """
        Initialize the league.
        
        Args:
            db_uri: MongoDB connection URI
        """
        self.agents = []
        self.judge = None
        self.matches = []
        self.results = []
        
        # Connect to database if URI is provided
        self.client = None
        if db_uri:
            self.client = MongoClient(db_uri)
            self.db = self.client.paper_evaluation
            self.papers_collection = self.db.papers
            self.matches_collection = self.db.matches
            self.results_collection = self.db.results
    
    def register_agent(self, agent: ReviewAgent) -> None:
        """
        Register an agent to participate in the league.
        
        Args:
            agent: Review agent instance
        """
        self.agents.append(agent)
        logger.info(f"Registered agent: {agent.name}")
    
    def register_judge(self, judge: EvaluationJudge) -> None:
        """
        Register a judge for evaluating reviews.
        
        Args:
            judge: Evaluation judge instance
        """
        self.judge = judge
        logger.info(f"Registered judge: {judge.name}")
    
    def load_papers(self, filter_query: Dict = None, limit: int = 100) -> List[Dict]:
        """
        Load papers from the database.
        
        Args:
            filter_query: MongoDB filter query
            limit: Maximum number of papers to load
            
        Returns:
            List of paper documents
        """
        if not self.client:
            logger.error("No database connection")
            return []
            
        filter_query = filter_query or {}
        
        papers = list(self.papers_collection.find(filter_query).limit(limit))
        logger.info(f"Loaded {len(papers)} papers from database")
        
        return papers
    
    def generate_matches(self, papers: List[Dict], papers_per_agent: int = 5) -> List[Dict]:
        """
        Generate matches between agents for papers.
        
        Args:
            papers: List of paper documents
            papers_per_agent: Number of papers each agent will review
            
        Returns:
            List of match documents
        """
        if len(self.agents) < 2:
            logger.error("Need at least 2 agents to generate matches")
            return []
            
        if not papers:
            logger.error("No papers available for matches")
            return []
        
        matches = []
        
        # Generate all agent pairs
        agent_pairs = []
        for i in range(len(self.agents)):
            for j in range(i + 1, len(self.agents)):
                agent_pairs.append((self.agents[i], self.agents[j]))
        
        # Limit papers if necessary
        max_papers = min(len(papers), papers_per_agent * len(agent_pairs))
        selected_papers = papers[:max_papers]
        
        # Create matches
        for i, paper in enumerate(selected_papers):
            # Select agent pair (round-robin)
            agent1, agent2 = agent_pairs[i % len(agent_pairs)]
            
            # Create match
            match_id = str(uuid.uuid4())
            match = {
                "id": match_id,
                "paper_id": str(paper["_id"]),
                "paper": {
                    "title": paper["title"],
                    "authors": paper["authors"],
                    "abstract": paper["abstract"],
                    "main_topic": paper["main_topic"]
                },
                "agent1": agent1.name,
                "agent2": agent2.name,
                "status": "pending",
                "created_at": datetime.datetime.utcnow()
            }
            
            matches.append(match)
            
            # Save to database if connected
            if self.client:
                self.matches_collection.insert_one(match)
        
        self.matches.extend(matches)
        logger.info(f"Generated {len(matches)} matches")
        
        return matches
    
    def run_match(self, match: Dict) -> Dict:
        """
        Run a single match between two agents.
        
        Args:
            match: Match document
            
        Returns:
            Match result document
        """
        if not self.judge:
            logger.error("No judge registered")
            return None
            
        logger.info(f"Running match {match['id']} for paper: {match['paper']['title']}")
        
        # Find agent objects
        agent1 = next((a for a in self.agents if a.name == match["agent1"]), None)
        agent2 = next((a for a in self.agents if a.name == match["agent2"]), None)
        
        if not agent1 or not agent2:
            logger.error(f"Could not find agents: {match['agent1']} and/or {match['agent2']}")
            return None
        
        try:
            # Get paper from database
            paper = None
            if self.client:
                paper = self.papers_collection.find_one({"_id": match["paper_id"]})
            
            if not paper:
                paper = match["paper"]
            
            # Generate reviews
            logger.info(f"Generating review from {agent1.name}")
            review1 = agent1.review_paper(paper)
            
            logger.info(f"Generating review from {agent2.name}")
            review2 = agent2.review_paper(paper)
            
            # Judge reviews
            logger.info("Evaluating reviews")
            evaluation = self.judge.evaluate_reviews(paper, review1, review2, agent1.name, agent2.name)
            
            # Determine winner
            if evaluation["winner"] == agent1.name:
                result = "win_agent1"
                agent1.update_stats("win")
                agent2.update_stats("loss")
            elif evaluation["winner"] == agent2.name:
                result = "win_agent2"
                agent1.update_stats("loss")
                agent2.update_stats("win")
            else:
                result = "draw"
                agent1.update_stats("draw")
                agent2.update_stats("draw")
            
            # Create result document
            match_result = {
                "match_id": match["id"],
                "paper_id": match["paper_id"],
                "agent1": agent1.name,
                "agent2": agent2.name,
                "review1": review1,
                "review2": review2,
                "evaluation": evaluation,
                "result": result,
                "completed_at": datetime.datetime.utcnow()
            }
            
            # Save to database if connected
            if self.client:
                self.results_collection.insert_one(match_result)
                self.matches_collection.update_one(
                    {"id": match["id"]},
                    {"$set": {"status": "completed", "result": result}}
                )
            
            self.results.append(match_result)
            logger.info(f"Match completed with result: {result}")
            
            return match_result
            
        except Exception as e:
            logger.error(f"Error running match {match['id']}: {str(e)}")
            
            # Update match status
            if self.client:
                self.matches_collection.update_one(
                    {"id": match["id"]},
                    {"$set": {"status": "error", "error": str(e)}}
                )
            
            return None
    
    def run_competition(self) -> List[Dict]:
        """
        Run all pending matches in the competition.
        
        Returns:
            List of match results
        """
        results = []
        
        for match in self.matches:
            if match["status"] == "pending":
                result = self.run_match(match)
                if result:
                    results.append(result)
        
        return results
    
    def get_leaderboard(self) -> List[Dict]:
        """
        Generate a leaderboard based on agent performance.
        
        Returns:
            List of agent standings
        """
        leaderboard = []
        
        for agent in self.agents:
            entry = {
                "name": agent.name,
                "matches_played": agent.stats["matches_played"],
                "matches_won": agent.stats["matches_won"],
                "matches_drawn": agent.stats["matches_drawn"],
                "matches_lost": agent.stats["matches_lost"],
                "points": agent.stats["points"],
                "win_percentage": agent.stats["win_percentage"]
            }
            leaderboard.append(entry)
        
        # Sort by points (descending)
        leaderboard.sort(key=lambda x: x["points"], reverse=True)
        
        return leaderboard