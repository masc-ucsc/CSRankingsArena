#!/usr/bin/env python3
"""
Paper Evaluation League Runner

This script serves as the entry point for the paper evaluation system.
It handles paper collection, match generation, and competition execution.
"""

import os
import sys
import logging
import argparse
import datetime
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('agent_runner.log')
    ]
)
logger = logging.getLogger(__name__)

# Import project modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from src.collectors.arxiv_collector import ArxivCollector
from src.models.openai_agent import OpenAIReviewAgent
from src.models.anthropic_agent import AnthropicReviewAgent
from src.models.judge import EvaluationJudge
from src.competition.league import PaperEvaluationLeague

# Get environment variables
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

# Define arXiv categories of interest
ARXIV_CATEGORIES = {
    "Architecture": ["cs.AR", "cs.DC"],
    "Programming": ["cs.PL", "cs.SE"],
    "AI": ["cs.AI", "cs.LG", "cs.CL", "cs.CV"]
}

def collect_papers(days_back: int = 30) -> List[Dict[str, Any]]:
    """
    Collect recent papers from arXiv.
    
    Args:
        days_back: Number of days back to collect papers from
        
    Returns:
        List of collected paper documents
    """
    logger.info(f"Collecting papers from the last {days_back} days")
    
    # Flatten categories
    all_categories = []
    for cat_list in ARXIV_CATEGORIES.values():
        all_categories.extend(cat_list)
    
    # Create date threshold
    date_threshold = datetime.datetime.now() - datetime.timedelta(days=days_back)
    
    # Initialize collector
    collector = ArxivCollector(db_uri=MONGODB_URI)
    
    # Collect papers
    papers = collector.fetch_and_save(
        categories=all_categories,
        date_threshold=date_threshold,
        max_results=100  # Adjust based on needs
    )
    
    logger.info(f"Collected {len(papers)} papers")
    return papers

def create_agents() -> List[Dict[str, Any]]:
    """
    Create agent instances.
    
    Returns:
        List of agent instances
    """
    logger.info("Creating review agents")
    
    agents = []
    
    # Create OpenAI agents
    if OPENAI_API_KEY:
        agents.append(
            OpenAIReviewAgent(
                name="GPT-4 Reviewer",
                model="gpt-4",
                api_key=OPENAI_API_KEY
            )
        )
        agents.append(
            OpenAIReviewAgent(
                name="GPT-3.5 Reviewer",
                model="gpt-3.5-turbo",
                api_key=OPENAI_API_KEY
            )
        )
    
    # Create Anthropic agents
    if ANTHROPIC_API_KEY:
        agents.append(
            AnthropicReviewAgent(
                name="Claude-3 Reviewer",
                model="claude-3-opus-20240229",
                api_key=ANTHROPIC_API_KEY
            )
        )
        agents.append(
            AnthropicReviewAgent(
                name="Claude-3-Sonnet Reviewer",
                model="claude-3-sonnet-20240229",
                api_key=ANTHROPIC_API_KEY
            )
        )
    
    logger.info(f"Created {len(agents)} agents")
    return agents

def run_competition(papers_per_agent: int = 5) -> Dict[str, Any]:
    """
    Run the paper evaluation competition.
    
    Args:
        papers_per_agent: Number of papers each agent will review
        
    Returns:
        Dictionary with results and leaderboard
    """
    logger.info("Starting paper evaluation competition")
    
    # Create league
    league = PaperEvaluationLeague(db_uri=MONGODB_URI)
    
    # Register agents
    agents = create_agents()
    for agent in agents:
        league.register_agent(agent)
    
    # Create and register judge
    judge = EvaluationJudge(
        model="gpt-4",
        api_key=OPENAI_API_KEY
    )
    league.register_judge(judge)
    
    # Load papers from database
    papers = league.load_papers(
        # Filter for specific topics
        filter_query={"main_topic": {"$in": list(ARXIV_CATEGORIES.keys())}},
        limit=papers_per_agent * len(agents)
    )
    
    # Generate matches
    league.generate_matches(papers, papers_per_agent)
    
    # Run competition
    results = league.run_competition()
    
    # Get leaderboard
    leaderboard = league.get_leaderboard()
    
    return {
        "results": results,
        "leaderboard": leaderboard
    }

def print_leaderboard(leaderboard: List[Dict[str, Any]]) -> None:
    """
    Print the competition leaderboard.
    
    Args:
        leaderboard: List of agent standings
    """
    print("\n=== PAPER EVALUATION LEAGUE LEADERBOARD ===\n")
    print(f"{'Rank':<5}{'Agent':<25}{'Points':<8}{'W':<5}{'D':<5}{'L':<5}{'Win %':<8}")
    print("-" * 60)
    
    for i, entry in enumerate(leaderboard, 1):
        print(
            f"{i:<5}"
            f"{entry['name']:<25}"
            f"{entry['points']:<8}"
            f"{entry['matches_won']:<5}"
            f"{entry['matches_drawn']:<5}"
            f"{entry['matches_lost']:<5}"
            f"{entry['win_percentage']:.1f}%"
        )
    print("\n")

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Paper Evaluation League")
    parser.add_argument("--collect-only", action="store_true", help="Only collect papers")
    parser.add_argument("--compete-only", action="store_true", help="Only run competition")
    parser.add_argument("--days", type=int, default=30, help="Days back to collect papers")
    parser.add_argument("--papers", type=int, default=5, help="Papers per agent")
    
    args = parser.parse_args()
    
    # Check for required API keys
    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY environment variable not set")
        return
    
    try:
        # Run paper collection unless --compete-only is specified
        if not args.compete_only:
            collect_papers(days_back=args.days)
        
        # Run competition unless --collect-only is specified
        if not args.collect_only:
            competition_results = run_competition(papers_per_agent=args.papers)
            print_leaderboard(competition_results["leaderboard"])
    
    except Exception as e:
        logger.error(f"Error in main process: {str(e)}", exc_info=True)

if __name__ == "__main__":
    main()