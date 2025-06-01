import yaml
import os
import argparse

from collections import defaultdict
from typing import Optional
from llm_topic_classifier import classify_paper_topic, count_ref_topics


def classify_papers(input_file: str, output_folder:str, api_key: Optional[str] = None):
    """
    Classify papers and seperate them into clusters.
    
    Args:
        input_file: Yaml file containing papers to classify
        output_folder: Folder to output clusters to
        api_key: OpenAI API key

    """
        
    base_output_folder = output_folder

    os.makedirs(base_output_folder, exist_ok=True)


    with open(input_file, encoding="utf-8") as yamlfile:
        yaml_content = yaml.safe_load(yamlfile)

    output_dict = defaultdict(lambda: defaultdict(list))

    # Perform classification
    for paper in yaml_content['papers']:
        id = paper.get('id', "")
        keywords = paper.get('keywords', "")
        abstract = paper.get('abstract', "")
        title = paper.get('title', "")
        references = paper.get('references', [])
        reference_counts = count_ref_topics(references)

        topics = classify_paper_topic(keywords, title, abstract, reference_counts, api_key)

        classified_paper = {}
        classified_paper['topics'] = topics
        classified_paper['id'] = id

        output_dict[topics['main_topic']][topics['main_topic_sub']].append(classified_paper)

        if topics['secondary_topic']:
            output_dict[topics['secondary_topic']][topics['secondary_topic_sub']].append(classified_paper)

    # Seperate papers into folders
    for topic in output_dict.keys():
        for sub_topic in output_dict[topic].keys():
            output_path = os.path.join(base_output_folder, topic + "/" + sub_topic)
        os.makedirs(output_path, exist_ok=True)
        with open(os.path.join(output_path, "papers.yaml"), "w", encoding="utf-8") as f:
            yaml.safe_dump({"papers": output_dict[topic][sub_topic]}, f, allow_unicode=True, sort_keys=False)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Filter papers by qualification status.")
    parser.add_argument("-f", "--file", required=True, help="Path to input yaml containing papers")
    parser.add_argument("-o", "--output", required=True, help="Path to output folder")
    parser.add_argument("-a", "--key", help="OpenAI API key")
    args = parser.parse_args()

    classify_papers(args.file, args.output, args.key)