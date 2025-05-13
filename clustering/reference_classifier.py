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
    "Computer Vision": ["computer vision","image recognition","object detection","image segmentation","semantic segmentation","instance segmentation","scene understanding","image classification","visual recognition","face recognition","facial analysis","pose estimation","depth estimation","3D reconstruction","stereo vision","optical flow","motion tracking","action recognition","video analysis","visual SLAM","image retrieval","feature extraction","keypoint detection","image generation","image synthesis","super-resolution","image enhancement","computer vision in robotics","medical image analysis","multiview geometry","vision transformers","convolutional neural networks","object tracking","instance-level recognition","self-supervised vision","vision-language models"],
    "Machine Learning": ["machine learning","supervised learning","unsupervised learning","semi-supervised learning","self-supervised learning","reinforcement learning","deep learning","neural networks","convolutional neural networks","recurrent neural networks","transformers","graph neural networks","generative models","generative adversarial networks","autoencoders","bayesian networks","support vector machines","decision trees","random forests","ensemble methods","boosting","gradient boosting","feature selection","feature engineering","model selection","hyperparameter tuning","cross-validation","loss functions","optimization","stochastic gradient descent","backpropagation","probabilistic models","unsupervised clustering","k-means","expectation-maximization","dimensionality reduction","principal component analysis","t-SNE","active learning","online learning","transfer learning","meta-learning","multi-task learning","federated learning","continual learning","few-shot learning","zero-shot learning","explainable AI","model interpretability","bias and fairness in ML","robustness","model compression","knowledge distillation","automated machine learning","AutoML"],
    "Natural Language Processing": ["Natural Language Processing", "Computational Linguistics", "Syntax", "Semantics", "Morphology","Phonology", "Pragmatics", "Lexical Semantics", "Part-of-Speech Tagging", "Named Entity Recognition","Chunking", "Parsing", "Dependency Parsing", "Constituency Parsing","Text Classification", "Sentiment Analysis", "Machine Translation", "Text Summarization","Question Answering", "Language Modeling", "Text Generation", "Relation Extraction","Coreference Resolution", "Dialogue Systems", "Information Extraction", "Information Retrieval","Text-to-Speech", "Speech-to-Text", "Topic Modeling", "Text Mining", "Keyword Extraction","Zero-shot Classification", "Few-shot Learning","Transformer", "BERT", "GPT", "T5", "RoBERTa", "XLNet", "ELECTRA", "DistilBERT", "LSTM","GRU", "RNN", "Seq2Seq", "Encoder-Decoder", "Pointer-Generator", "BiLSTM","Attention Mechanism", "Self-Attention", "Multi-head Attention", "Pretrained Language Model","GLUE", "SuperGLUE", "SQuAD", "CoNLL", "WikiText", "XNLI", "MultiNLI", "Common Crawl","OpenSubtitles", "LibriSpeech", "TREC", "Penn Treebank", "OntoNotes","BLEU", "ROUGE", "METEOR", "F1 Score", "Precision", "Recall", "Accuracy", "Perplexity","Word Error Rate", "WER", "NDCG","Tokenization", "Word Embeddings", "Word2Vec", "GloVe", "FastText", "Contextual Embeddings","Sentence Embeddings", "Subword Models", "Byte Pair Encoding", "Vocabulary Pruning","Knowledge Graph", "Ontology", "Language Resource", "Dialogue Act", "Transfer Learning","Multilingual NLP", "Cross-lingual Transfer", "Code-switching", "Speech Recognition","Text Normalization", "Low-resource Languages", "Commonsense Reasoning", "Prompt Engineering","Retrieval-Augmented Generation", "Instruction Tuning", "Alignment"],
    "The Web & Information Retrieval": ["Information Retrieval", "Web Search", "Search Engines", "Ranking", "Relevance", "Query Processing","Indexing", "Inverted Index", "Crawling", "Web Crawling", "PageRank", "Link Analysis", "Anchor Text","Clickthrough Data", "User Behavior", "Query Logs", "Personalized Search", "Semantic Search","Federated Search", "Vertical Search", "Multilingual Search", "Cross-lingual IR", "Entity Retrieval","Passage Retrieval", "Document Retrieval", "Question Answering", "Open-domain QA", "Answer Ranking","Snippet Generation", "Result Diversification", "Search Result Clustering", "Search Engine Evaluation","Evaluation Metrics", "Precision", "Recall", "F1 Score", "MAP", "MRR", "NDCG", "CTR", "Dwell Time","Session-based Search", "Interactive IR", "Exploratory Search", "Information Filtering","Collaborative Filtering", "Content-based Filtering", "Recommender Systems", "Web Mining","Web Data Mining", "Text Mining", "Click Models", "Learning to Rank", "BM25", "TF-IDF", "Neural IR","Dense Retrieval", "Sparse Retrieval", "Retrieval-Augmented Generation", "Dual Encoder","ColBERT", "ANN Search", "FAISS", "Index Compression", "Scalability", "Efficiency","Latency", "ElasticSearch", "Lucene", "OpenSearch", "TREC", "ClueWeb", "MS MARCO", "BEIR Benchmark"],
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
    
    scores = Counter()
    for topic, keywords in TOPIC_KEYWORDS.items():
        for keyword in keywords:
            if re.search(r'\b' + keyword + r'\b', reference, re.IGNORECASE):
                scores[topic] += 1

    if scores:
        return max(scores, key=scores.get)
    else:
        return None


def count_ref_topics(references: List[str]):
    topic_counts = Counter()
    for ref in references:
        topic = classify_ref(ref)
        if topic:
            topic_counts[topic] += 1


        
    return topic_counts


