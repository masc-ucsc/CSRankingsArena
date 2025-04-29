"""
Base Agent Class

This module defines the base class for paper review agents.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any

class ReviewAgent(ABC):
    """Abstract base class for paper review agents."""
    
    def __init__(self, name: str):
        """
        Initialize a review agent.
        
        Args:
            name: Agent name
        """
        self.name = name
        self.stats = {
            "matches_played": 0,
            "matches_won": 0,
            "matches_drawn": 0,
            "matches_lost": 0,
            "points": 0,
            "win_percentage": 0.0
        }
    
    @abstractmethod
    def review_paper(self, paper: Dict[str, Any]) -> Dict[str, Any]:
        """
        Review a paper and return a structured review.
        
        Args:
            paper: Paper document with metadata and content
            
        Returns:
            Review document with structured feedback
        """
        pass
    
    def update_stats(self, result: str) -> None:
        """
        Update agent statistics based on match result.
        
        Args:
            result: Match result ('win', 'loss', or 'draw')
        """
        self.stats["matches_played"] += 1
        
        if result == "win":
            self.stats["matches_won"] += 1
            self.stats["points"] += 3
        elif result == "draw":
            self.stats["matches_drawn"] += 1
            self.stats["points"] += 1
        elif result == "loss":
            self.stats["matches_lost"] += 1
        
        # Calculate win percentage
        if self.stats["matches_played"] > 0:
            self.stats["win_percentage"] = (self.stats["matches_won"] / self.stats["matches_played"]) * 100
        else:
            self.stats["win_percentage"] = 0.0