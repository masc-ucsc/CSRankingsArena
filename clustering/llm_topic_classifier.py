import os, json, yaml, re

from collections import Counter
from litellm import completion
from pydantic import BaseModel 
from typing import List, Dict, Optional

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
    "Computer Architecture": ["Computer Architecture", "Processor Architecture", "Microarchitecture", "Instruction Set Architecture","ISA", "Pipelining", "Out-of-Order Execution", "Speculative Execution", "Branch Prediction","Superscalar", "Multicore", "Manycore", "Chip Multiprocessor", "Heterogeneous Computing","Heterogeneous Architecture", "Accelerators", "GPUs", "TPUs", "ASIC", "FPGA","Cache Hierarchy", "Cache Coherence", "Memory Hierarchy", "Virtual Memory", "TLB","Prefetching", "Memory Consistency", "NUMA", "Interconnect", "Network-on-Chip", "NoC","Load Balancing", "Parallel Processing", "Parallel Architecture", "SIMD", "MIMD", "VLIW","Dataflow Architecture", "Reconfigurable Computing", "Domain-Specific Architecture", "Edge Computing","Near-Data Processing", "Processing-in-Memory", "Memory-Centric Computing", "Compute-in-Memory","Instruction-Level Parallelism", "Thread-Level Parallelism", "Memory-Level Parallelism","Vector Processing", "RISC", "CISC", "RISC-V", "x86", "ARM", "Power Efficiency", "Performance per Watt","Energy-Efficient Design", "Thermal Management", "DVFS", "Hardware Prefetching","Speculative Multithreading", "Simultaneous Multithreading", "Coarse-Grain Multithreading","Hardware Security", "Side-Channel Attacks", "Speculative Side Channels", "Rowhammer","Trusted Execution", "Secure Architecture", "Fault Tolerance", "Reliability", "Checkpointing","Architecture Simulation", "Cycle-Accurate Simulation", "Gem5", "Simics", "DRAMSim", "Cacti","Benchmarking", "SPEC", "PARSEC", "Rodinia", "Performance Counters", "Perf", "Roofline Model","Amdahl's Law", "Gustafson's Law"],
    "Computer Networks": ["Computer Networks", "Network Architecture", "Network Protocols", "Network Layering","OSI Model", "TCP/IP", "Ethernet", "IP", "IPv4", "IPv6", "TCP", "UDP", "QUIC", "HTTP", "HTTPS","Routing", "BGP", "OSPF", "Distance Vector Routing", "Link State Routing", "Routing Protocols","Congestion Control", "Flow Control", "Packet Switching", "Circuit Switching", "MAC Protocols","CSMA/CD", "CSMA/CA", "LAN", "WAN", "MAN", "Internet", "Intranet", "Overlay Networks","Peer-to-Peer", "Content Delivery Network", "CDN", "Edge Computing", "Fog Computing","Data Center Networking", "Cloud Networking", "Network Virtualization", "Software-Defined Networking","SDN", "Network Function Virtualization", "NFV", "Overlay Networks", "Network Slicing","5G", "6G", "Mobile Networks", "Cellular Networks", "WiFi", "Bluetooth", "ZigBee","Ad Hoc Networks", "Mesh Networks", "Vehicular Networks", "VANETs", "Wireless Sensor Networks","WSN", "IoT Networking", "Delay Tolerant Networks", "DTN", "Satellite Networks","Network Measurement", "Network Monitoring", "Traffic Analysis", "Throughput", "Latency","Jitter", "Packet Loss", "Bandwidth", "Quality of Service", "QoS", "Quality of Experience", "QoE","Network Security", "Firewalls", "Intrusion Detection", "DDoS", "Man-in-the-Middle","End-to-End Encryption", "VPN", "TLS", "SSL", "Network Anonymity", "Tor", "Traffic Engineering","Multicast", "Broadcast", "Unicast", "Anycast", "Network Coding", "Forward Error Correction","ARQ", "Network Simulation", "NS2", "NS3", "Mininet", "Emulation", "Wireshark", "Packet Sniffing"],
    "Computer Security": ["Computer Security", "Cybersecurity", "Information Security", "System Security", "Network Security",     "Application Security", "Operating System Security", "Hardware Security", "Security Architecture",     "Access Control", "Authentication", "Authorization", "Multifactor Authentication", "Single Sign-On",     "Security Policy","Cryptography", "Public Key Cryptography", "Symmetric Cryptography", "Asymmetric Cryptography","RSA", "AES", "Elliptic Curve Cryptography", "ECC", "Key Exchange", "Diffie-Hellman","Digital Signatures", "Hash Functions", "SHA-2", "SHA-3", "HMAC", "Zero Knowledge Proofs","Homomorphic Encryption", "Secure Multiparty Computation", "Post-Quantum Cryptography", "Malware", "Virus", "Worm", "Trojan", "Ransomware", "Rootkit", "Spyware", "Botnet","Phishing", "Spear Phishing", "Social Engineering", "Drive-by Download", "Exploit Kit","Vulnerabilities", "Buffer Overflow", "Heap Overflow", "Format String Vulnerability","Use-after-Free", "Race Condition", "Integer Overflow", "SQL Injection", "Cross-Site Scripting","XSS", "Cross-Site Request Forgery", "CSRF", "Command Injection", "Privilege Escalation","Intrusion Detection", "Intrusion Prevention", "IDS", "IPS", "Anomaly Detection","DDoS", "Denial of Service", "Man-in-the-Middle", "Replay Attack", "Side Channel Attack","Timing Attack", "Power Analysis", "Rowhammer", "Spectre", "Meltdown", "Foreshadow", "ZombieLoad","Secure Boot", "Trusted Computing", "Trusted Platform Module", "TPM", "Trusted Execution Environment","TEE", "Intel SGX", "ARM TrustZone", "Remote Attestation", "Code Integrity", "Control-Flow Integrity","ASLR", "DEP", "Stack Canaries", "Sandboxes", "Virtualization Security", "Hypervisor Security","Web Security", "TLS", "SSL", "HTTPS", "Certificate Pinning", "Public Key Infrastructure", "PKI","OAuth", "OpenID Connect", "SAML", "CAPTCHA", "Browser Security", "Content Security Policy","Security Auditing", "Penetration Testing", "Red Team", "Blue Team", "Security Monitoring","Security Logs", "SIEM", "Threat Intelligence", "Threat Modeling", "Risk Assessment","Compliance", "GDPR", "HIPAA", "SOC 2"],
    "Databases": ["Database Systems", "Relational Database", "Relational Model", "Entity-Relationship Model","ER Diagram", "SQL", "DDL", "DML", "DCL", "Schema", "Table", "Tuple", "Attribute", "Primary Key","Foreign Key", "Normalization", "Denormalization", "Functional Dependency", "Normal Forms","1NF", "2NF", "3NF", "BCNF", "Decomposition","Indexing", "B-Tree", "B+-Tree", "Hash Index", "Bitmap Index", "Clustered Index","Non-clustered Index", "Query Optimization", "Query Planner", "Join Algorithms","Nested Loop Join", "Hash Join", "Merge Join", "Query Execution Plan", "Cost-based Optimization","Transactions", "ACID Properties", "Atomicity", "Consistency", "Isolation", "Durability","Concurrency Control", "Locking", "Two-Phase Locking", "Deadlock", "Timestamp Ordering","Serializable Schedule", "Isolation Levels", "Read Committed", "Repeatable Read", "Serializable","Write-Ahead Logging", "Recovery", "Checkpointing","Distributed Databases", "CAP Theorem", "Consistency", "Availability", "Partition Tolerance","Replication", "Sharding", "Horizontal Partitioning", "Vertical Partitioning","Consensus Protocols", "Paxos", "Raft", "Two-Phase Commit", "Three-Phase Commit","NoSQL", "Document Store", "Key-Value Store", "Column Store", "Graph Database","MongoDB", "Redis", "Cassandra", "HBase", "Neo4j", "RDF", "SPARQL", "GraphQL","BASE Properties", "Eventual Consistency","NewSQL", "HTAP", "Materialized View", "Streaming Data", "Stream Processing","Windowed Aggregates", "Temporal Database", "Time-Series Database", "InfluxDB", "TimescaleDB","Cloud Databases", "Database-as-a-Service", "Amazon RDS", "Google BigQuery", "Snowflake","Serverless Database", "Data Warehouse", "OLTP", "OLAP", "ETL", "ELT", "Data Lake", "Data Lakehouse","Big Data", "Hadoop", "Hive", "Spark SQL", "Presto", "Delta Lake","Security in Databases", "Access Control", "RBAC", "Auditing", "Data Masking", "Encryption"],
    "Design Automation": ["EDA","CAD","CAED","VLSI","RTL","ASIC","SoC","FPGA","HDL","Verilog","SystemVerilog","VHDL","HLS","logic synthesis","place and route","physical design","timing analysis","formal verification","circuit simulation","power estimation","layout generation","netlist optimization","design space exploration","floorplanning","chip design","custom design","EDA tools","circuit design automation","automated design flow","hardware synthesis","logic optimization","RTL generation","DFT","DFM","PPA","EDA software","EDA workflow","schematic capture","hardware design automation"],
    "Embedded & Real-time Systems": ["embedded systems","real-time systems","real-time operating system","RTOS","firmware","microcontroller","MCU","system-on-chip","SoC","bare-metal","real-time scheduling","task scheduling","interrupt handling","low-power computing","power-aware computing","resource-constrained devices","time-critical systems","deadline scheduling","deterministic execution","latency-sensitive","real-time constraints","embedded software","embedded programming","hardware-software co-design","cyber-physical systems","CPS","sensor networks","IoT devices","edge computing","embedded Linux","real-time Linux","time-triggered architecture","event-driven systems","safety-critical systems","automotive systems","aerospace systems","medical devices","industrial control","real-time communication","real-time monitoring","real-time control","WCET analysis", "periodic task model","schedulability analysis","task preemption","execution predictability","embedded control systems"],
    "High-performance Computing": [ "high-performance computing","HPC","supercomputing","supercomputer","parallel computing","parallel processing","distributed computing","cluster computing","GPU computing","GPGPU","manycore","multicore","accelerator-based computing","heterogeneous computing","hybrid computing","high-throughput computing","massively parallel","message passing","MPI","OpenMP","CUDA","OpenCL","task parallelism","data parallelism","scalable computing","performance optimization","performance tuning","load balancing","memory hierarchy optimization","communication overhead","latency hiding","bandwidth optimization","NUMA","vectorization","SIMD","compiler optimizations","auto-parallelization","scientific computing","large-scale simulation","exascale computing","petascale computing","high-performance interconnect","network topology","runtime systems","scheduling on HPC","job scheduling","HPC applications","computational science","domain decomposition"],
    "Mobile Computing": ["mobile computing","mobile devices","smartphones","tablets","wearable devices","mobile applications","mobile apps","mobile OS","Android","iOS","mobile operating system","mobile networks","wireless networks","wireless communication","cellular networks","5G","4G","LTE","mobile broadband","mobile cloud computing","mobile edge computing","MEC","context-aware computing","ubiquitous computing","pervasive computing","location-based services","location tracking","mobility management","handover management","mobile security","mobile privacy","energy-efficient mobile computing","battery-aware computing","resource-constrained devices","mobile sensing","mobile data management","mobile user interfaces","mobile web","mobile development","cross-platform mobile","mobile middleware","mobile software engineering","mobile augmented reality","mobile human-computer interaction","mobile networking"],
    "Measurement & Perf. Analysis": ["performance analysis","performance measurement","profiling","runtime profiling","code profiling","execution profiling","tracing","instrumentation","benchmarking","microbenchmarking","load testing","latency analysis","throughput measurement","execution time","response time","CPU utilization","memory usage","cache analysis","cache misses","branch prediction","pipeline analysis","instruction count","hardware counters","performance counters","perf events","sampling-based profiling","event-based sampling","dynamic analysis","static analysis","bottleneck detection","hotspot analysis","scalability analysis","resource usage","energy profiling","power measurement","system monitoring","real-time performance","overhead analysis","fine-grained measurement","coarse-grained profiling","performance debugging","performance regression","parallel performance","distributed performance","network performance","I/O performance","performance modeling","performance tuning"],
    "Operating Systems": ["operating system","OS kernel","kernel","process management","thread management","multithreading","concurrency","scheduling","CPU scheduling","preemptive scheduling","non-preemptive scheduling","context switching","memory management","virtual memory","paging","segmentation","address space","file system","filesystem","I/O management","device driver","interrupt handling","system call","interprocess communication","IPC","deadlock","synchronization","mutex","semaphore","race condition","thread synchronization","process synchronization","real-time operating system","RTOS","distributed operating system","microkernel","monolithic kernel","exokernel","security","access control","user mode","kernel mode","bootloader","system initialization","virtualization","hypervisor","containerization","Linux","Windows","macOS","Unix","POSIX","system performance","resource management","load balancing","power management","file caching","filesystem journaling"],
    "Programming Languages": ["programming language","compiler","interpreter","syntax","semantics","type system","static typing","dynamic typing","type inference","garbage collection","memory management","runtime environment","virtual machine","bytecode","parsing","lexical analysis","code generation","optimization","just-in-time compilation","JIT","functional programming","imperative programming","object-oriented programming","OOP","procedural programming","declarative programming","concurrent programming","parallel programming","domain-specific language","DSL","scripting language","markup language","program analysis","type checking","polymorphism","inheritance","encapsulation","abstraction","lambda calculus","first-class functions","closures","generics","templates","metaprogramming","reflection","macro system","syntax tree","abstract syntax tree","formal language","language semantics","program verification","static analysis","dynamic analysis","language interoperability","domain-specific language","language design","language implementation","language runtime","multi-paradigm","concurrency model","actor model","message passing","event-driven programming","coroutines","continuations","tail call optimization"],
    "Software Engineering": ["software engineering","software development","software design","software architecture","software testing","unit testing","integration testing","system testing","acceptance testing","test automation","software maintenance","software lifecycle","software process","agile development","Scrum","Kanban","waterfall model","devops","continuous integration","continuous delivery","version control","Git","code review","software quality","code quality","refactoring","technical debt","software metrics","software reliability","software verification","software validation","requirements engineering","requirement analysis","software documentation","configuration management","build automation","software project management","risk management","software modeling","UML","design patterns","object-oriented design","component-based software","microservices","software reuse","software security","software usability","human-computer interaction","bug tracking","issue tracking","software evolution","software portability","software scalability","performance engineering","software deployment","software testing tools","static code analysis","dynamic code analysis","software development methodologies","pair programming","code coverage","software reliability engineering"],
    "Algorithms & Complexity": ["algorithm","algorithms","algorithm design","complexity theory","computational complexity","time complexity","space complexity","big O notation","asymptotic analysis","worst-case complexity","average-case complexity","best-case complexity","NP-complete","NP-hard","P versus NP","approximation algorithms","heuristic algorithms","randomized algorithms","probabilistic algorithms","divide and conquer","dynamic programming","greedy algorithms","graph algorithms","search algorithms","sorting algorithms","shortest path","minimum spanning tree","string algorithms","pattern matching","backtracking","branch and bound","recursive algorithms","iterative algorithms","parallel algorithms","streaming algorithms","online algorithms","offline algorithms","algorithm optimization","algorithm analysis","computability theory","decision problems","reduction","space-bounded computation","time-bounded computation","lower bounds","upper bounds","trade-offs","algorithmic efficiency","data structures","amortized analysis","probabilistic analysis","computational hardness","circuit complexity","communication complexity"],
    "Cryptography": ["cryptography","cryptographic","encryption","decryption","symmetric encryption","asymmetric encryption","public key cryptography","private key","public key","key exchange","key management","digital signature","hash function","cryptographic hash","message authentication code","MAC","digital certificate","certificate authority","block cipher","stream cipher","AES","DES","3DES","RSA","Diffie-Hellman","Elliptic Curve Cryptography","ECC","zero-knowledge proof","zero knowledge","homomorphic encryption","secure multiparty computation","quantum cryptography","post-quantum cryptography","random oracle model","cryptanalysis","side-channel attack","ciphertext","plaintext","nonce","initialization vector","IV","padding","key derivation function","KDF","hash collision","perfect forward secrecy","message integrity","TLS","SSL","PKI","cryptographic protocol","entropy","randomness","one-way function","trapdoor function","blockchain","cryptocurrency","digital ledger"],
    "Logic & Verification": ["formal verification","model checking","theorem proving","automated theorem proving","symbolic model checking","bounded model checking","SMT solving","satisfiability modulo theories","SAT solving","satisfiability","formal methods","verification","hardware verification","software verification","equivalence checking","property checking","assertion checking","temporal logic","linear temporal logic","LTL","computation tree logic","CTL","mu-calculus","fixed point logic","proof assistant","interactive theorem prover","Coq","Isabelle","HOL","Z3","nuXmv","SPIN","TLA+","program verification","model extraction","symbolic execution","abstract interpretation","static analysis","dynamic analysis","type checking","runtime verification","counterexample generation","invariant generation","refinement checking","compositional verification","inductive invariants","proof obligations","logical inference","deductive verification","constraint solving","formal specification","specification languages","Hoare logic","temporal properties","correctness proof","soundness","completeness","decision procedures","model abstraction","counterexample-guided abstraction refinement","CEGAR","safety properties","liveness properties","proof certificates"],
    "Comp. Bio & Bioinformatics": ["computational biology","bioinformatics","genomics","proteomics","transcriptomics","metabolomics","sequence analysis","DNA sequencing","RNA sequencing","protein sequencing","genome assembly","sequence alignment","multiple sequence alignment","phylogenetics","phylogenetic tree","gene expression","microarray analysis","next-generation sequencing","NGS","structural bioinformatics","protein structure prediction","molecular modeling","homology modeling","docking","systems biology","pathway analysis","network biology","biological networks","machine learning","data mining","biostatistics","computational genomics","functional genomics","genetic variation","SNP","mutation analysis","epigenetics","bioinformatics tools","BLAST","FASTA","genome annotation","sequence databases","protein databases","biological databases","computational proteomics","metagenomics","computational systems biology","gene ontology","high-throughput screening","biological data analysis","computational modeling","biomolecular simulation","structural alignment","gene regulatory networks","microRNA analysis","computational neuroscience","biomedical informatics"],
    "Computer Graphics": ["computer graphics","rendering","ray tracing","rasterization","3D modeling","mesh generation","texture mapping","shading","lighting","global illumination","photon mapping","ambient occlusion","shader programming","GPU programming","graphics pipeline","vertex processing","fragment processing","geometric modeling","animation","keyframe animation","motion capture","simulation","particle systems","collision detection","level of detail","anti-aliasing","image processing","visualization","virtual reality","augmented reality","mixed reality","computer vision","3D reconstruction","camera calibration","mesh simplification","surface reconstruction","procedural modeling","non-photorealistic rendering","real-time rendering","graphics APIs","OpenGL","DirectX","Vulkan","shader languages","GLSL","HLSL","compute shaders","framebuffer","depth buffering","stencil buffering","image synthesis","color models","RGB","HSV","color space","texture filtering","bump mapping","normal mapping","displacement mapping"],
    "Computer Science Education": ["computer science education","CS education","computing education","programming education","coding education","computer programming","computer literacy","informatics education","educational technology","e-learning","online learning","distance education","blended learning","CS pedagogy","curriculum design","computer science curriculum","teaching methods","active learning","project-based learning","peer instruction","collaborative learning","educational assessment","formative assessment","summative assessment","student engagement","learning analytics","computer science concepts","algorithm education","data structures education","computational thinking","problem solving","software development education","debugging skills","programming languages education","CS1","CS2","intro to programming","CS pedagogy research","education outreach","coding bootcamp","computer science outreach","educational games","serious games","virtual labs","simulations in education","learning environments","instructional design","teacher training","CS teacher education"],
    "Economics & Computation": ["economics and computation","computational economics","algorithmic game theory","game theory","mechanism design","auction theory","market design","computational social choice","social choice theory","incentive design","strategic behavior","equilibrium computation","Nash equilibrium","market equilibrium","matching theory","resource allocation","pricing algorithms","online algorithms","algorithmic mechanism design","computational finance","financial modeling","agent-based modeling","multi-agent systems","network economics","peer-to-peer networks","trust and reputation systems","cryptoeconomics","blockchain economics","smart contracts","digital currencies","token economics","economic incentives","computational complexity in economics","computational markets","social networks analysis","behavioral economics","decision theory","optimization in economics","market simulation","economic experiments","computational mechanism design"],
    "Human-computer Interaction": ["human-computer interaction","HCI","user interface","UI design","user experience","UX design","interaction design","usability","accessibility","user-centered design","human factors","cognitive ergonomics","user studies","user evaluation","usability testing","interface design","multimodal interaction","touch interface","gesture recognition","voice interaction","natural language interface","virtual reality","augmented reality","mixed reality","wearable computing","brain-computer interface","BCI","eye tracking","attention tracking","user modeling","adaptive interfaces","personalization","collaborative systems","computer-supported cooperative work","CSCW","social computing","human-robot interaction","mobile interaction","ubiquitous computing","context-aware computing","tangible user interfaces","information visualization","data visualization","affordances","heuristic evaluation","interaction techniques","input devices","output devices","dialogue systems","user feedback","prototyping","wireframing","human-centered AI","experience design"],
    "Robotics": ["robotics","robot","robotic system","autonomous robot","mobile robot","manipulator","robot arm","robot kinematics","robot dynamics","robot control","path planning","motion planning","trajectory planning","sensor fusion","SLAM","simultaneous localization and mapping","robot perception","computer vision","robot navigation","robot localization","robot mapping","robot learning","reinforcement learning","robot manipulation","grasping","end effector","actuators","robot sensors","LIDAR","ultrasonic sensor","proprioception","robot architectures","multi-robot systems","swarm robotics","human-robot interaction","HRI","robot operating system","ROS","robot simulation","robotics middleware","robot safety","robotics applications","industrial robots","service robots","medical robotics","robot autonomy","robot teleoperation","robotics control algorithms","robot kinematics","inverse kinematics","forward kinematics","robot calibration","robot diagnostics"],
    "Visualization": ["visualization","data visualization","information visualization","scientific visualization","visual analytics","interactive visualization","graph visualization","network visualization","geovisualization","3D visualization","volume rendering","rendering","visual representation","visual encoding","data mapping","color mapping","visual perception","visual design","visual storytelling","dashboard","infographic","charting","plotting","heatmap","scatter plot","bar chart","line chart","tree map","flow visualization","time series visualization","multivariate visualization","spatial visualization","temporal visualization","visual analytics system","user interaction","visual data exploration","visual abstraction","glyph","animation","simulation visualization","dimensionality reduction","PCA","t-SNE","UMAP","visual encoding techniques","visual hierarchy","visual variables","perceptual principles","cognitive load","visual analytics workflow"]
}

def classify_text(text: str):
    """
    Classify text based on keywords.
    
    Args:
        reference: String to classify
        
    Returns:
        String containing the most likely classification
    """
    for topic, conferences in TOPIC_CONFERENCES.items():
        for conf in conferences:
            if re.search(r'\b' + conf + r'\b', text):
                return topic
    
    scores = Counter()
    for topic, keywords in TOPIC_KEYWORDS.items():
        for keyword in keywords:
            if re.search(r'\b' + keyword + r'\b', text, re.IGNORECASE):
                scores[topic] += 1

    if scores:
        return max(scores, key=scores.get)
    else:
        return None


def count_ref_topics(references: List[str]):
    """
    Counts the number of references of each topic in a list of references.
    
    Args:
        references: List containing reference strings
        
    Returns:
        Dictionary containing the counts for each topic
    """
    topic_counts = Counter()
    for ref in references:
        topic = classify_text(ref)
        if topic:
            topic_counts[topic] += 1

    return topic_counts


def classify_paper_topic(
    keywords: str,
    title: str,
    abstract: str,
    reference_counts: Optional[Dict] = {},
    api_key: Optional[str] = None
) -> Dict:
    
    """
    Classify a paper into a main topic based on its metadata.
    
    Args:
        keywords: String containing keywords/index terms for the paper
        title: The paper's title
        abstract: The paper's abstract
        reference_counts: Dictionary containing categories mapped to the # of references of those categories in the paper
        api_key: OpenAI API key
        
    Returns:
        Dictionary containing main and secondary topic classification, as well as reasonings for the decisions
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
                    "text": f"Here is the abstract of a paper titled {title} : {abstract}. The paper has the following keywords: {keywords}. The paper has the following amounts of references: {reference_counts}",
                }
            ],
        },

        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"Here is a list of topics for papers: {str(categories)}."
                    "Which topics from this list does this paper fit into? If only one applies, leave the secondary topic empty. Give your reasoning for these decisions.",
                }
            ],
        },
    ]

    class topics_structure(BaseModel):
        main_topic: str
        main_topic_reasoning: str
        secondary_topic: str
        secondary_topic_reasoning: str

    response1 = completion(model="gpt-4o-mini", messages=messages, response_format=topics_structure)

    topics_dict = json.loads(response1['choices'][0]['message']['content'])

    # Default case for incorrect LLM output
    if topics_dict['main_topic'] not in categories:
        topics_dict['main_topic'] = "Other"
    if topics_dict['secondary_topic'] not in categories:
        topics_dict['secondary_topic'] = ""
        topics_dict['secondary_topic_reasoning'] = ""

    
    # Prompt for a subcategory from each topic
    sub_topics = {}
    for topic in ["main_topic", "secondary_topic"]:
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



