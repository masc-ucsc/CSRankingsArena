import os, json, yaml

import litellm
from litellm import completion
from pydantic import BaseModel 
from typing import Dict, Optional

# track_cost_callback
def track_cost_callback(
    kwargs,                 # kwargs to completion
    completion_response,    # response from completion
    start_time, end_time    # start/end time
):
    try:
      response_cost = kwargs.get("response_cost", 0)
      print("streaming response_cost", response_cost)
    except:
        pass
# set callback
litellm.success_callback = [track_cost_callback]

def classify_paper_topic(
    keywords: str,
    title: str,
    abstract: str,
    api_key: Optional[str] = None
) -> Dict:
    
    """
    Classify a paper into a main topic based on its metadata.
    
    Args:
        keywords: String containing keywords/index terms for the paper
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
                    "text": f"Here is a list of topics for papers: {str(categories)}."
                    "What topic from this list does this paper fit into? If only one applies, leave the secondary topic empty.",
                }
            ],
        },
    ]

    class topics_structure(BaseModel):
        main_topic: str
        secondary_topic: str

    response1 = completion(model="gpt-4o-mini", messages=messages, response_format=topics_structure)

    topics_dict = json.loads(response1['choices'][0]['message']['content'])

    
    # Prompt for a subcategory from each topic
    sub_topics = {}
    for topic in topics_dict.keys():
        # No subcategories for paper's classified as Other or empty secondary categories
        if topics_dict[topic] != '' and topics_dict[topic] != 'Other':

            # Load subcategory dictionary from file
            with open(os.path.join(os.path.dirname(__file__), "subcategories.yaml")) as yamlfile:
                all_subcategories = yaml.safe_load(yamlfile)

            new_messages = messages.copy()
            new_messages.append(response1['choices'][0]['message'])
            new_messages.append({
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"Here is a list of sub-categories for {topics_dict[topic]} papers: {all_subcategories.get(topics_dict[topic], []) + ["Other"]}. Pick the sub-category from this list that this paper fits into."
                }
            ],
            })

            class sub_topic_structure(BaseModel):
                sub_category: str

            response2 = completion(model="gpt-4o-mini", messages=new_messages, response_format=sub_topic_structure)

            response2_dict = json.loads(response2['choices'][0]['message']['content'])

            sub_topics[topic + '_sub'] = response2_dict['sub_category']

        else:
            sub_topics[topic + '_sub'] = ''
        
    

    return topics_dict|sub_topics



