"""
OpenAI Review Agent

This module implements a paper review agent using OpenAI models.
"""

import logging
import json
from typing import Dict, Any, Optional
import openai

from .agent_base import ReviewAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class OpenAIReviewAgent(ReviewAgent):
    """Paper review agent using OpenAI models."""
    
    def __init__(self, name: str, model: str = "gpt-4", api_key: Optional[str] = None):
        """
        Initialize an OpenAI review agent.
        
        Args:
            name: Agent name
            model: OpenAI model to use (e.g., "gpt-4", "gpt-3.5-turbo")
            api_key: OpenAI API key
        """
        super().__init__(name)
        self.model = model
        
        if api_key:
            openai.api_key = api_key
        
        self.client = openai.OpenAI()
    
    def review_paper(self, paper: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a review for a paper using OpenAI models.
        
        Args:
            paper: Paper document with metadata and content
            
        Returns:
            Review document with structured feedback
        """
        logger.info(f"Generating review for paper: {paper['title']}")
        
        # Create prompt for the model
        prompt = self._create_review_prompt(paper)
        
        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            # Extract review text
            review_text = response.choices[0].message.content
            
            # Parse into structured format
            review = self._parse_review_text(review_text)
            
            logger.info(f"Generated review with rating: {review['rating']}")
            return review
            
        except Exception as e:
            logger.error(f"Error generating review: {str(e)}")
            return {
                "error": str(e),
                "summary": "Failed to generate review",
                "strengths": [],
                "weaknesses": [],
                "questions": [],
                "rating": 0,
                "confidence": "low"
            }
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the model."""
        return """
        You are an expert academic paper reviewer with expertise in computer science, 
        specializing in computer architecture, programming languages, and artificial intelligence.
        
        Your task is to provide a comprehensive, fair, and constructive review of research papers.
        Focus on both strengths and weaknesses of the paper, and provide specific, actionable feedback.
        
        Your review should follow academic review standards and evaluate the paper on:
        1. Technical correctness and soundness
        2. Novelty and significance of contribution
        3. Clarity of presentation
        4. Thoroughness of evaluation
        5. Related work coverage
        
        Provide your review in a structured format with clear sections.
        """
    
    def _create_review_prompt(self, paper: Dict[str, Any]) -> str:
        """
        Create a prompt for the review model.
        
        Args:
            paper: Paper document
            
        Returns:
            Formatted prompt string
        """
        return f"""
        Please review the following research paper and provide a structured academic review.
        
        Paper Title: {paper['title']}
        Authors: {', '.join(paper['authors'])}
        
        Abstract:
        {paper['abstract']}
        
        Your review should include:
        1. Summary: A brief summary of the paper's contributions (2-3 sentences)
        2. Strengths: At least 3 specific strengths of the paper
        3. Weaknesses: At least 3 specific weaknesses or limitations
        4. Questions: 2-3 questions for the authors
        5. Rating: A numerical rating from 1-10 (where 10 is excellent)
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
        - [Question 1]
        - [Question 2]
        - [Question 3]
        
        Rating: [1-10]
        
        Confidence: [low/medium/high]
        """
    
    def _parse_review_text(self, review_text: str) -> Dict[str, Any]:
        """
        Parse the model's response into a structured review format.
        
        Args:
            review_text: Raw review text from the model
            
        Returns:
            Structured review dictionary
        """
        sections = {
            "summary": "",
            "strengths": [],
            "weaknesses": [],
            "questions": [],
            "rating": 0,
            "confidence": "low"
        }
        
        current_section = None
        
        for line in review_text.strip().split('\n'):
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
                    rating_text = line[7:].strip()
                    # Extract just the number if there's additional text
                    import re
                    match = re.search(r'\d+', rating_text)
                    if match:
                        sections["rating"] = int(match.group())
                    else:
                        sections["rating"] = int(rating_text)
                except ValueError:
                    sections["rating"] = 0
                    
            elif line.lower().startswith('confidence:'):
                confidence_text = line[11:].strip().lower()
                if 'high' in confidence_text:
                    sections["confidence"] = "high"
                elif 'medium' in confidence_text:
                    sections["confidence"] = "medium"
                else:
                    sections["confidence"] = "low"
                    
            elif current_section in ["strengths", "weaknesses", "questions"]:
                # Extract item (removing list markers like -, *, 1., etc.)
                if line.startswith('-') or line.startswith('*'):
                    item = line[1:].strip()
                    if item:
                        sections[current_section].append(item)
                elif line[0].isdigit() and '. ' in line:
                    item = line[line.find('. ')+2:].strip()
                    if item:
                        sections[current_section].append(item)
                elif current_section == "summary":
                    sections[current_section] += " " + line
        
        return sections