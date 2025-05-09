import os, json

from litellm import completion
from pydantic import BaseModel 
from typing import List, Dict, Optional


def classify_paper_topic(
    keywords: List[str],
    title: str,
    abstract: str,
    api_key: Optional[str] = None
) -> Dict:
    
    """
    Classify a paper into a main topic based on its metadata.
    
    Args:
        keywords: List of paper index terms/keywords
        title: The paper's title
        abstract: The paper's abstract
        api_key: OpenAI API key
        
    Returns:
        Dictionary containing main and secondary topic classification in format {'main_topic': "", 'secondary_topic':""}
    """

    os.environ["OPENAI_API_KEY"] = api_key
    
    categories = ["Artificial Intelligence", "Computer Vision", "Machine Learning", "Natural Language Processing", 
                    "The Web & Information Retrieval", "Computer Architecture", "Computer Networks", "Computer Security", "Databases", "Design Automation", 
                    "Embedded & Real-time Systems", "High-performance Computing", "Mobile Computing", "Measurement & Perf. Analysis", "Operating Systems", 
                    "Programming Languages", "Software Engineering", "Algorithms & Complexity", "Cryptography", "Logic & Verification", "Comp. Bio & Bioinformatics", 
                    "Computer Graphics", "Computer Science Education", "Economics & Computation", "Human-computer Interaction", "Robotics", "Visualization", "Other" ]

    messages = [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": f"Here is the abstract of a paper titled {title} : {abstract}. The paper has the following keywords: {keywords}",
                }
            ],
        },

        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"Here is a list of topics for papers: {str(categories)}"
                    "What topic does this paper fit into? If only one applies, leave the secondary topic empty.",
                }
            ],
        },
    ]

    class topics(BaseModel):
        main_topic: str
        secondary_topic: str

    response = completion(model="gpt-4o-mini", messages=messages, response_format=topics)

    categories = json.loads(response['choices'][0]['message']['content'])

    return categories

