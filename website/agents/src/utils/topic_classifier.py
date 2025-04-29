"""
Topic Classifier

This module classifies papers into main topics based on categories, titles, and abstracts.
"""

import re
from typing import List, Dict, Any, Optional

# Define topic keywords
TOPIC_KEYWORDS = {
    "Architecture": [
        "architecture", "processor", "cpu", "gpu", "fpga", "asic", "hardware",
        "microarchitecture", "memory", "cache", "pipeline", "chip", "circuit",
        "accelerator", "multicore", "parallel", "distributed"
    ],
    "Programming": [
        "programming", "language", "compiler", "interpreter", "runtime", "type",
        "code", "software", "verification", "syntax", "semantics", "analysis",
        "static", "dynamic", "functional", "object-oriented", "imperative"
    ],
    "AI": [
        "ai", "artificial intelligence", "machine learning", "neural", "deep learning",
        "reinforcement", "nlp", "natural language", "vision", "transformer", "llm",
        "gpt", "agent", "model", "training", "inference", "supervised", "unsupervised"
    ]
}

# Define arXiv category mappings
ARXIV_CATEGORY_MAPPINGS = {
    "Architecture": ["cs.AR", "cs.DC", "cs.PF", "cs.HC"],
    "Programming": ["cs.PL", "cs.SE", "cs.FL", "cs.LO"],
    "AI": ["cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE", "cs.RO"]
}

def classify_paper_topic(
    categories: List[str],
    title: str,
    abstract: str
) -> str:
    """
    Classify a paper into a main topic based on its metadata.
    
    Args:
        categories: List of arXiv categories (e.g. 'cs.AI')
        title: Paper title
        abstract: Paper abstract
        
    Returns:
        Main topic classification (Architecture, Programming, AI, or Other)
    """
    # First check if any categories clearly map to a topic
    for topic, topic_categories in ARXIV_CATEGORY_MAPPINGS.items():
        if any(category in topic_categories for category in categories):
            return topic
    
    # If not, analyze text content
    text = f"{title} {abstract}".lower()
    
    # Count keyword matches for each topic
    scores = {}
    
    for topic, keywords in TOPIC_KEYWORDS.items():
        scores[topic] = sum(1 for keyword in keywords if re.search(r'\b' + keyword + r'\b', text))
    
    # Find topic with highest score
    max_score = 0
    max_topic = "Other"
    
    for topic, score in scores.items():
        if score > max_score:
            max_score = score
            max_topic = topic
    
    # If no significant matches, return Other
    if max_score < 2:
        return "Other"
    
    return max_topic