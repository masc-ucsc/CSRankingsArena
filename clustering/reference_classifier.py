from typing import List
from collections import Counter

import re, yaml


TOPICS = ["Artificial Intelligence", "Computer Vision", "Machine Learning", "Natural Language Processing", 
                    "The Web & Information Retrieval", "Computer Architecture", "Computer Networks", "Computer Security", "Databases", "Design Automation", 
                    "Embedded & Real-time Systems", "High-performance Computing", "Mobile Computing", "Measurement & Perf. Analysis", "Operating Systems", 
                    "Programming Languages", "Software Engineering", "Algorithms & Complexity", "Cryptography", "Logic & Verification", "Comp. Bio & Bioinformatics", 
                    "Computer Graphics", "Computer Science Education", "Economics & Computation", "Human-computer Interaction", "Robotics", "Visualization", "Other" ]

TOPIC_CONFERENCES = {
    "Artificial Intelligence": ["AAAI", "IJCAI", "International Joint Conference on Artificial Intelligence"],
    "Computer Vision": ["CVPR", "ECCV", "ICCV"],
    "Machine Learning": ["ICLR", "ICML", "NeurIPS"],
    "Natural Language Processing": ["ACL", "EMNLP", "NAACL"],
    "The Web & Information Retrieval": ["SIGIR", "WWW", "The Web Conference"],
    "Computer Architecture": ["ASPLOS", "ISCA", "MICRO", "HPCA"],
    "Computer Networks": ["SIGCOMM", "NSDI"],
    "Computer Security": ["CCS", "SP", "S&P", "USENIX"],
    "Databases": ["SIGMOD", "VLDB", "ICDE", "PODS"],
    "Design Automation": ["DAC", "ICCAD"],
    "Embedded & Real-time Systems": ["EMSOFT", "RTAS", "RTSS"],
    "High-performance Computing": ["HPDC", "ICS", "SC"],
    "Mobile Computing": ["MobiCom", "MobiSys", "SenSys"],
    "Measurement & Perf. Analysis": ["IMC", "SIGMETRICS"],
    "Operating Systems": ["OSDI", "SOSP", "EuroSys", "FAST", "USENIX ATC"],
    "Programming Languages": ["PLDI", "POPL", "ICFP", "OOPSLA"],
    "Software Engineering": ["FSE", "ICSE", "ASE", "ISSTA"],
    "Algorithms & Complexity": ["FOCS", "SODA", "STOC"],
    "Cryptography": ["CRYPTO", "EuroCrypt"],
    "Logic & Verification": ["CAV", "LICS"],
    "Comp. Bio & Bioinformatics": ["ISMB", "RECOMB"],
    "Computer Graphics": ["SIGGRAPH", "EUROGRAPHICS"],
    "Computer Science Education": ["SIGCSE"],
    "Economics & Computation": ["EC", "WINE"],
    "Human-computer Interaction": ["CHI", "UbiComp", "IMWUT", "International Conference on Pervasive", "UIST"],
    "Robotics": ["ICRA", "IROS", "RSS"],
    "Visualization": ["VIS", "VR"]


}

TOPIC_KEYWORDS = {
    "Artificial Intelligence": ["artificial intelligence","intelligent systems","reasoning","planning","knowledge representation","expert systems","multi-agent systems","heuristic search","decision making","automated reasoning","constraint satisfaction","symbolic AI","belief networks","inference engines","cognitive architectures","case-based reasoning","rule-based systems","goal-directed behavior","intelligent agents","AI planning","logic programming","ontology","game AI","symbolic reasoning","automated planning","commonsense reasoning","human-level AI","machine reasoning","AI ethics","AI alignment"],
    "Computer Vision": [],
    "Machine Learning": [],
    "Natural Language Processing": [],
    "The Web & Information Retrieval": [],
    "Computer Architecture": [],
    "Computer Networks": [],
    "Computer Security": [],
    "Databases": [],
    "Design Automation": [],
    "Embedded & Real-time Systems": [],
    "High-performance Computing": [],
    "Mobile Computing": [],
    "Measurement & Perf. Analysis": [],
    "Operating Systems": [],
    "Programming Languages": [],
    "Software Engineering": [],
    "Algorithms & Complexity": [],
    "Cryptography": [],
    "Logic & Verification": [],
    "Comp. Bio & Bioinformatics": [],
    "Computer Graphics": [],
    "Computer Science Education": [],
    "Economics & Computation": [],
    "Human-computer Interaction": [],
    "Robotics": [],
    "Visualization": []
}

def classify_ref(reference: str):
    for topic, conferences in TOPIC_CONFERENCES.items():
        for conf in conferences:
            if re.search(r'\b' + conf + r'\b', reference):
                return topic


def count_ref_topics(references: List[str]):
    topic_counts = Counter()
    for ref in references:
        topic = classify_ref(ref)
        if topic:
            topic_counts[topic] += 1


        
    return topic_counts
