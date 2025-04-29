import unittest
from src.utils.topic_classifier import classify_paper_topic

class TestTopicClassifier(unittest.TestCase):
    def test_classify_by_arxiv_category(self):
        # Architecture category
        self.assertEqual(
            classify_paper_topic(
                categories=["cs.AR"],
                title="Test Paper",
                abstract="Test abstract"
            ),
            "Architecture"
        )
        
        # Programming category
        self.assertEqual(
            classify_paper_topic(
                categories=["cs.PL"],
                title="Test Paper",
                abstract="Test abstract"
            ),
            "Programming"
        )
        
        # AI category
        self.assertEqual(
            classify_paper_topic(
                categories=["cs.AI"],
                title="Test Paper",
                abstract="Test abstract"
            ),
            "AI"
        )
        
        # Test with mixed categories - should pick the one that maps directly
        self.assertEqual(
            classify_paper_topic(
                categories=["cs.PL", "cs.SE", "math.ST"],
                title="Test Paper",
                abstract="Test abstract"
            ),
            "Programming"
        )
    
    def test_classify_by_text_content(self):
        # Architecture keywords in abstract
        self.assertEqual(
            classify_paper_topic(
                categories=["cs.DC"],  # Not in category mappings
                title="Hardware Design",
                abstract="This paper discusses microarchitecture and cache optimizations."
            ),
            "Architecture"
        )
        
        # Programming keywords in title
        self.assertEqual(
            classify_paper_topic(
                categories=["cs.LO"],  # Not directly mapped
                title="Type System for Functional Programming",
                abstract="We present a new approach."
            ),
            "Programming"
        )
        
        # AI keywords in abstract
        self.assertEqual(
            classify_paper_topic(
                categories=["cs.CR"],  # Not directly mapped
                title="Algorithm Analysis",
                abstract="Using reinforcement learning and neural networks."
            ),
            "AI"
        )
    
    def test_classify_with_no_matches(self):
        # No mapping and no keyword matches
        self.assertEqual(
            classify_paper_topic(
                categories=["math.ST"],
                title="Statistical Analysis",
                abstract="Pure statistics with no CS applications."
            ),
            "Other"
        )
    
    def test_classify_competing_topics(self):
        # Text has keywords from multiple topics - should pick the one with most matches
        self.assertEqual(
            classify_paper_topic(
                categories=[],
                title="Machine Learning for Compiler Optimization",
                abstract="This paper presents a neural network approach to optimize compiler performance."
            ),
            "AI"  # Should have more AI keywords than Programming keywords
        )
        
        self.assertEqual(
            classify_paper_topic(
                categories=[],
                title="Programming Language Design",
                abstract="This paper discusses the semantics and syntax of a new language with type inference."
            ),
            "Programming"  # Should have more Programming keywords
        )
    
    def test_case_insensitivity(self):
        # Keywords should match regardless of case
        self.assertEqual(
            classify_paper_topic(
                categories=[],
                title="NEURAL NETWORKS",
                abstract="DEEP LEARNING approaches."
            ),
            "AI"
        )


if __name__ == '__main__':
    unittest.main()