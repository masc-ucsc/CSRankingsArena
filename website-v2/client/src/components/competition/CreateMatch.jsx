import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Card,
    Form,
    Select,
    Button,
    Table,
    Space,
    message,
    Modal,
    Typography,
    Divider,
    Tag,
    Row,
    Col,
    Statistic,
    Spin,
    Tabs,
    Radio,
    Alert,
    Input,
    DatePicker,
    Badge,
    Avatar,
    Tooltip,
    Progress,
    Rate
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    TrophyOutlined,
    RobotOutlined,
    FileTextOutlined,
    SwapOutlined,
    WarningOutlined,
    FilterOutlined,
    ReloadOutlined,
    EyeOutlined,
    BarChartOutlined
} from '@ant-design/icons';
import axios from 'axios';
import MatchResults from './MatchResults';
import { formatDistanceToNow } from 'date-fns';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;
const { RangePicker } = DatePicker;

const MOCK_PAPERS = [
    {
        id: 'mock1',
        title: 'Attention Is All You Need',
        authors: [
            { id: 'a1', name: 'Ashish Vaswani' },
            { id: 'a2', name: 'Noam Shazeer' },
            { id: 'a3', name: 'Niki Parmar' },
            { id: 'a4', name: 'Jakob Uszkoreit' },
            { id: 'a5', name: 'Llion Jones' },
            { id: 'a6', name: 'Aidan N. Gomez' },
            { id: 'a7', name: 'Łukasz Kaiser' },
            { id: 'a8', name: 'Illia Polosukhin' }
        ],
        abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
        categories: [
            { id: 'c1', name: 'Machine Learning' },
            { id: 'c2', name: 'Natural Language Processing' }
        ],
        subcategories: [
            { id: 's1', name: 'Neural Networks' },
            { id: 's2', name: 'Machine Translation' }
        ],
        published_year: 2017,
        venue: 'NeurIPS'
    },
    {
        id: 'mock2',
        title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
        authors: [
            { id: 'a9', name: 'Jacob Devlin' },
            { id: 'a10', name: 'Ming-Wei Chang' },
            { id: 'a11', name: 'Kenton Lee' },
            { id: 'a12', name: 'Kristina Toutanova' }
        ],
        abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
        categories: [
            { id: 'c2', name: 'Natural Language Processing' }
        ],
        subcategories: [
            { id: 's3', name: 'Language Models' },
            { id: 's4', name: 'Pre-training' }
        ],
        published_year: 2019,
        venue: 'NAACL'
    },
    {
        id: 'mock3',
        title: 'Deep Learning',
        authors: [
            { id: 'a13', name: 'Yann LeCun' },
            { id: 'a14', name: 'Yoshua Bengio' },
            { id: 'a15', name: 'Geoffrey Hinton' }
        ],
        abstract: 'Deep learning allows computational models that are composed of multiple processing layers to learn representations of data with multiple levels of abstraction. These methods have dramatically improved the state-of-the-art in speech recognition, visual object recognition, object detection and many other domains such as drug discovery and genomics.',
        categories: [
            { id: 'c1', name: 'Machine Learning' }
        ],
        subcategories: [
            { id: 's1', name: 'Neural Networks' },
            { id: 's5', name: 'Deep Learning' }
        ],
        published_year: 2015,
        venue: 'Nature'
    },
    {
        id: 'mock4',
        title: 'Generative Adversarial Nets',
        authors: [
            { id: 'a16', name: 'Ian Goodfellow' },
            { id: 'a17', name: 'Jean Pouget-Abadie' },
            { id: 'a18', name: 'Mehdi Mirza' },
            { id: 'a19', name: 'Bing Xu' },
            { id: 'a20', name: 'David Warde-Farley' },
            { id: 'a21', name: 'Sherjil Ozair' },
            { id: 'a22', name: 'Aaron Courville' },
            { id: 'a14', name: 'Yoshua Bengio' }
        ],
        abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G.',
        categories: [
            { id: 'c1', name: 'Machine Learning' },
            { id: 'c3', name: 'Computer Vision' }
        ],
        subcategories: [
            { id: 's6', name: 'Generative Models' },
            { id: 's7', name: 'GANs' }
        ],
        published_year: 2014,
        venue: 'NeurIPS'
    },
    {
        id: 'mock5',
        title: 'ResNet: Deep Residual Learning for Image Recognition',
        authors: [
            { id: 'a23', name: 'Kaiming He' },
            { id: 'a24', name: 'Xiangyu Zhang' },
            { id: 'a25', name: 'Shaoqing Ren' },
            { id: 'a26', name: 'Jian Sun' }
        ],
        abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions.',
        categories: [
            { id: 'c3', name: 'Computer Vision' }
        ],
        subcategories: [
            { id: 's1', name: 'Neural Networks' },
            { id: 's8', name: 'Image Recognition' }
        ],
        published_year: 2016,
        venue: 'CVPR'
    }
];

const MOCK_CATEGORIES = [
    { id: 'c1', name: 'Machine Learning' },
    { id: 'c2', name: 'Natural Language Processing' },
    { id: 'c3', name: 'Computer Vision' }
];

const MOCK_SUBCATEGORIES = {
    'c1': [
        { id: 's1', name: 'Neural Networks' },
        { id: 's5', name: 'Deep Learning' },
        { id: 's6', name: 'Generative Models' },
        { id: 's7', name: 'GANs' }
    ],
    'c2': [
        { id: 's2', name: 'Machine Translation' },
        { id: 's3', name: 'Language Models' },
        { id: 's4', name: 'Pre-training' }
    ],
    'c3': [
        { id: 's8', name: 'Image Recognition' }
    ]
};

const MOCK_AGENTS = [
    {
        id: 'agent1',
        name: 'GPT-4',
        provider: 'OpenAI',
        description: 'Advanced language model with strong analytical capabilities',
        status: 'available'
    },
    {
        id: 'agent2',
        name: 'Claude',
        provider: 'Anthropic',
        description: 'Specialized in detailed analysis and explanation',
        status: 'available'
    },
    {
        id: 'agent3',
        name: 'GPT-3.5',
        provider: 'OpenAI',
        description: 'Efficient language model with good understanding',
        status: 'available'
    },
    {
        id: 'agent4',
        name: 'Llama 2',
        provider: 'Meta',
        description: 'Open source language model with strong performance',
        status: 'available'
    },
    {
        id: 'agent5',
        name: 'PaLM 2',
        provider: 'Google',
        description: 'Advanced language model with strong reasoning capabilities',
        status: 'available'
    }
];

const MOCK_MATCH_RESULTS = {
    id: 'mock-match-1',
    status: 'completed',
    created_at: new Date().toISOString(),
    paper: {
        id: 'mock-paper-1',
        title: 'Attention Is All You Need',
        abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
        authors: [
            { id: 'a1', name: 'Ashish Vaswani' },
            { id: 'a2', name: 'Noam Shazeer' }
        ],
        categories: [
            { id: 'c1', name: 'Machine Learning' },
            { id: 'c2', name: 'Natural Language Processing' }
        ],
        subcategories: [
            { id: 's1', name: 'Neural Networks' },
            { id: 's2', name: 'Machine Translation' }
        ],
        published_year: 2017,
        venue: 'NeurIPS'
    },
    agents: [
        {
            id: 'agent1',
            name: 'GPT-4',
            provider: 'OpenAI',
            review: 'This paper introduces a groundbreaking architecture that has revolutionized natural language processing. The attention mechanism allows for better parallelization and captures long-range dependencies effectively. The authors demonstrate superior performance on machine translation tasks while requiring significantly less training time.',
            evaluation: [
                { criterion: 'Technical Depth', score: 0.9, comment: 'Excellent technical explanation of the attention mechanism' },
                { criterion: 'Clarity', score: 0.85, comment: 'Clear presentation of the architecture and results' },
                { criterion: 'Impact', score: 0.95, comment: 'Transformative impact on the field' }
            ]
        },
        {
            id: 'agent2',
            name: 'Claude',
            provider: 'Anthropic',
            review: 'The Transformer architecture represents a significant advancement in sequence modeling. The paper effectively demonstrates how self-attention can replace traditional recurrent and convolutional approaches. The experimental results are compelling, showing both improved performance and computational efficiency.',
            evaluation: [
                { criterion: 'Technical Depth', score: 0.88, comment: 'Strong technical analysis of the architecture' },
                { criterion: 'Clarity', score: 0.82, comment: 'Well-structured presentation of the methodology' },
                { criterion: 'Impact', score: 0.92, comment: 'Major contribution to the field' }
            ]
        }
    ],
    performance: {
        agent1: {
            total_matches: 150,
            win_rate: 0.75,
            feedback: {
                avg_rating: 4.5,
                total_feedback: 120,
                total_likes: 95,
                total_dislikes: 5
            }
        },
        agent2: {
            total_matches: 145,
            win_rate: 0.68,
            feedback: {
                avg_rating: 4.2,
                total_feedback: 115,
                total_likes: 85,
                total_dislikes: 8
            }
        },
        agentStats: {
            agent1: {
                avg_rating: 4.5,
                total_likes: 95,
                total_dislikes: 5
            },
            agent2: {
                avg_rating: 4.2,
                total_likes: 85,
                total_dislikes: 8
            }
        }
    },
    feedback: []
};

// Add mock review templates
const MOCK_REVIEW_TEMPLATES = [
    {
        template: "This paper presents a significant contribution to {field}. The methodology is {quality}, and the results demonstrate {impact}. However, there are some limitations in {limitation}.",
        fields: ["machine learning", "natural language processing", "computer vision"],
        qualities: ["robust", "innovative", "well-designed"],
        impacts: ["promising results", "substantial improvement", "novel insights"],
        limitations: ["the experimental setup", "the theoretical analysis", "the evaluation metrics"]
    },
    {
        template: "The authors propose an interesting approach to {problem}. The technical depth is {depth}, and the practical implications are {implications}. The paper could be improved by {improvement}.",
        problems: ["sequence modeling", "representation learning", "model architecture"],
        depths: ["impressive", "adequate", "comprehensive"],
        implications: ["significant", "moderate", "limited"],
        improvements: ["addressing scalability", "expanding the evaluation", "clarifying assumptions"]
    }
];

// Add mock agent responses generator
const generateMockReview = (paper, agent) => {
    const template = MOCK_REVIEW_TEMPLATES[Math.floor(Math.random() * MOCK_REVIEW_TEMPLATES.length)];
    const field = template.fields[Math.floor(Math.random() * template.fields.length)];
    const quality = template.qualities[Math.floor(Math.random() * template.qualities.length)];
    const impact = template.impacts[Math.floor(Math.random() * template.impacts.length)];
    const limitation = template.limitations[Math.floor(Math.random() * template.limitations.length)];
    
    return {
        review: template.template
            .replace("{field}", field)
            .replace("{quality}", quality)
            .replace("{impact}", impact)
            .replace("{limitation}", limitation),
        evaluation: [
            { criterion: "Technical Depth", score: 0.7 + Math.random() * 0.3, comment: "Good technical analysis" },
            { criterion: "Clarity", score: 0.7 + Math.random() * 0.3, comment: "Clear presentation" },
            { criterion: "Impact", score: 0.7 + Math.random() * 0.3, comment: "Significant contribution" }
        ]
    };
};

const CreateMatch = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState([]);
    const [papers, setPapers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [selectedPapers, setSelectedPapers] = useState({ paper1: null, paper2: null });
    const [matchModalVisible, setMatchModalVisible] = useState(false);
    const [creatingMatch, setCreatingMatch] = useState(false);
    const [matchType, setMatchType] = useState('single');
    const [matchResults, setMatchResults] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [agentConnectionError, setAgentConnectionError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [selectedYear, setSelectedYear] = useState(null);
    const [years, setYears] = useState([]);
    const [showAgentSelection, setShowAgentSelection] = useState(false);
    const [selectedAgents, setSelectedAgents] = useState({
        agent1: null,
        agent2: null,
        judge: null
    });

    useEffect(() => {
        fetchInitialData();
        fetchRecentMatches();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchSubcategories(selectedCategory);
        } else {
            setSubcategories([]);
            setSelectedSubcategory(null);
        }
    }, [selectedCategory]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // First try to fetch agents separately to debug
            try {
                const agentsRes = await axios.get('/api/competition/agents');
                console.log('Agents API response:', agentsRes.data);
                if (agentsRes.data && Array.isArray(agentsRes.data) && agentsRes.data.length > 0) {
                    setAgents(agentsRes.data);
                } else {
                    console.warn('No agents in API response, using mock agents');
                    setAgents(MOCK_AGENTS);
                }
            } catch (agentError) {
                console.error('Error fetching agents:', agentError);
                console.warn('Using mock agents due to API error');
                setAgents(MOCK_AGENTS);
            }

            // Then fetch other data
            try {
                const [categoriesRes, papersRes] = await Promise.all([
                    axios.get('/api/categories'),
                    axios.get('/api/papers')
                ]);
                
                // Use mock categories if API fails
                if (categoriesRes.data && categoriesRes.data.length > 0) {
                    setCategories(categoriesRes.data);
                } else {
                    console.warn('Using mock categories data');
                    setCategories(MOCK_CATEGORIES);
                }
                
                // Use mock papers if API fails or returns empty
                if (papersRes.data && papersRes.data.length > 0) {
                    console.log('Using API papers data:', papersRes.data);
                    setPapers(papersRes.data);
                    const uniqueYears = [...new Set(papersRes.data.map(paper => paper.published_year))].sort((a, b) => b - a);
                    setYears(uniqueYears);
                } else {
                    console.warn('Using mock papers data');
                    console.log('Mock papers:', MOCK_PAPERS);
                    setPapers(MOCK_PAPERS);
                    const uniqueYears = [...new Set(MOCK_PAPERS.map(paper => paper.published_year))].sort((a, b) => b - a);
                    setYears(uniqueYears);
                }
            } catch (error) {
                console.error('Error fetching other data:', error);
                // Set mock data for categories and papers
                setCategories(MOCK_CATEGORIES);
                console.log('Setting mock papers due to API error:', MOCK_PAPERS);
                setPapers(MOCK_PAPERS);
                const uniqueYears = [...new Set(MOCK_PAPERS.map(paper => paper.published_year))].sort((a, b) => b - a);
                setYears(uniqueYears);
            }
        } catch (error) {
            console.error('Error in fetchInitialData:', error);
            // Ensure mock data is set in case of any error
            setAgents(MOCK_AGENTS);
            setCategories(MOCK_CATEGORIES);
            console.log('Setting mock papers due to general error:', MOCK_PAPERS);
            setPapers(MOCK_PAPERS);
            const uniqueYears = [...new Set(MOCK_PAPERS.map(paper => paper.published_year))].sort((a, b) => b - a);
            setYears(uniqueYears);
        } finally {
            setLoading(false);
        }
    };

    // Add useEffect to monitor agents state
    useEffect(() => {
        console.log('Agents state updated:', agents);
    }, [agents]);

    const fetchSubcategories = async (categoryId) => {
        try {
            const response = await axios.get(`/api/categories/${categoryId}/subcategories`);
            if (response.data && response.data.length > 0) {
                setSubcategories(response.data);
            } else {
                // Use mock subcategories if API fails
                console.warn('Using mock subcategories data');
                setSubcategories(MOCK_SUBCATEGORIES[categoryId] || []);
            }
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            // Use mock subcategories on error
            setSubcategories(MOCK_SUBCATEGORIES[categoryId] || []);
        }
    };

    const fetchRecentMatches = async () => {
        try {
            const response = await axios.get('/api/competition/matches/recent');
            setMatches(response.data);
        } catch (error) {
            console.error('Error fetching recent matches:', error);
            message.error('Failed to load recent matches');
        }
    };

    const handlePaperSelection = (paper, paperNumber) => {
        setSelectedPapers(prev => ({
            ...prev,
            [paperNumber]: paper
        }));
    };

    const handleAgentSelection = (agentId, agentType) => {
        setSelectedAgents(prev => ({
            ...prev,
            [agentType]: agentId
        }));
    };

    const canCreateMatch = () => {
        if (matchType === 'single') {
            return selectedPapers.paper1 && 
                   selectedAgents.agent1 && 
                   selectedAgents.agent2 && 
                   selectedAgents.judge;
        }
        return selectedPapers.paper1 && 
               selectedPapers.paper2 && 
               selectedAgents.agent1 && 
               selectedAgents.agent2 && 
               selectedAgents.judge;
    };

    const handleCreateMatch = async () => {
        setCreatingMatch(true);
        setAgentConnectionError(null);

        try {
            const matchData = {
                agent1Id: selectedAgents.agent1,
                agent2Id: selectedAgents.agent2,
                judgeId: selectedAgents.judge
            };

            if (selectedCategory) {
                matchData.category = selectedCategory;
            }
            if (selectedSubcategory) {
                matchData.subcategory = selectedSubcategory;
            }
            if (selectedYear) {
                matchData.year = selectedYear;
            }

            if (matchType === 'single') {
                matchData.paperId = selectedPapers.paper1.id;
            } else {
                matchData.paper1Id = selectedPapers.paper1.id;
                matchData.paper2Id = selectedPapers.paper2.id;
            }

            // Create match in database
            const response = await axios.post('/api/competition/matches', matchData);
            
            // Generate mock responses if real agents are not available
            const mockResponses = {
                id: response.data.id,
                status: 'completed',
                created_at: new Date().toISOString(),
                paper: selectedPapers.paper1,
                paper2: matchType === 'comparison' ? selectedPapers.paper2 : null,
                agents: [
                    {
                        id: selectedAgents.agent1,
                        name: agents.find(a => a.id === selectedAgents.agent1)?.name || 'Unknown Agent',
                        provider: agents.find(a => a.id === selectedAgents.agent1)?.provider || 'Unknown',
                        ...generateMockReview(selectedPapers.paper1, selectedAgents.agent1)
                    },
                    {
                        id: selectedAgents.agent2,
                        name: agents.find(a => a.id === selectedAgents.agent2)?.name || 'Unknown Agent',
                        provider: agents.find(a => a.id === selectedAgents.agent2)?.provider || 'Unknown',
                        ...generateMockReview(selectedPapers.paper1, selectedAgents.agent2)
                    }
                ],
                judge: {
                    id: selectedAgents.judge,
                    name: agents.find(a => a.id === selectedAgents.judge)?.name || 'Unknown Judge',
                    provider: agents.find(a => a.id === selectedAgents.judge)?.provider || 'Unknown',
                    decision: {
                        winner: selectedAgents.agent1, // Randomly select a winner
                        reasoning: "Both agents provided thorough reviews, but Agent 1's analysis was more comprehensive."
                    }
                },
                feedback: [],
                performance: {
                    agent1: {
                        total_matches: 1,
                        win_rate: 1.0,
                        feedback: {
                            avg_rating: 0,
                            total_feedback: 0,
                            total_likes: 0,
                            total_dislikes: 0
                        }
                    },
                    agent2: {
                        total_matches: 1,
                        win_rate: 0.0,
                        feedback: {
                            avg_rating: 0,
                            total_feedback: 0,
                            total_likes: 0,
                            total_dislikes: 0
                        }
                    }
                }
            };

            // Try to get real match details, fall back to mock if needed
            try {
                const matchDetails = await axios.get(`/api/competition/matches/${response.data.id}`);
                setMatchResults(matchDetails.data);
            } catch (error) {
                console.warn('Using mock match results due to API error:', error);
                setMatchResults(mockResponses);
            }

            message.success('Match created successfully');
            setShowResults(true);
            setShowAgentSelection(false);
            setSelectedPapers({ paper1: null, paper2: null });
            setSelectedAgents({ agent1: null, agent2: null, judge: null });
            fetchRecentMatches();
            
        } catch (error) {
            console.error('Error creating match:', error);
            message.error('Failed to create match. Please try again.');
            setAgentConnectionError('Failed to connect to agents. Using mock responses.');
        } finally {
            setCreatingMatch(false);
        }
    };

    const showMatchModal = (paper, paperNumber) => {
        setSelectedPapers(prev => ({
            ...prev,
            [paperNumber]: paper
        }));
        
        if (matchType === 'single' || (selectedPapers.paper1 && selectedPapers.paper2)) {
            setMatchModalVisible(true);
        }
    };

    const handleMatchTypeChange = (e) => {
        setMatchType(e.target.value);
        setSelectedPapers({ paper1: null, paper2: null });
    };

    const renderPaperCard = (paper) => (
        <Card style={{ marginBottom: '16px' }}>
            <Title level={4}>{paper.title}</Title>
            <Divider />
            <Text>{paper.abstract}</Text>
            <div style={{ marginTop: '16px' }}>
                <Space>
                    {paper.categories?.map(category => (
                        <Tag key={category.id} color="blue">{category.name}</Tag>
                    ))}
                    {paper.subcategories?.map(subcategory => (
                        <Tag key={subcategory.id} color="green">{subcategory.name}</Tag>
                    ))}
                    <Tag color="purple">{paper.published_year}</Tag>
                </Space>
            </div>
        </Card>
    );

    const filteredPapers = papers.filter(paper => {
        const matchesSearch = paper.title.toLowerCase().includes(searchText.toLowerCase()) ||
                            paper.abstract.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = !selectedCategory || paper.categories?.some(c => c.id === selectedCategory);
        const matchesSubcategory = !selectedSubcategory || paper.subcategories?.some(s => s.id === selectedSubcategory);
        const matchesYear = !selectedYear || paper.published_year === selectedYear;
        return matchesSearch && matchesCategory && matchesSubcategory && matchesYear;
    });

    const handleFeedback = async (feedback) => {
        try {
            // Update local state immediately for better UX
            const updatedMatch = { ...matchResults };
            const agentId = feedback.agentId;
            const agentFeedback = updatedMatch.performance[agentId].feedback;

            if (feedback.type === 'like') {
                agentFeedback.total_likes = (agentFeedback.total_likes || 0) + 1;
            } else if (feedback.type === 'dislike') {
                agentFeedback.total_dislikes = (agentFeedback.total_dislikes || 0) + 1;
            }

            if (feedback.rating) {
                agentFeedback.total_feedback = (agentFeedback.total_feedback || 0) + 1;
                agentFeedback.avg_rating = (
                    (agentFeedback.avg_rating * (agentFeedback.total_feedback - 1) + feedback.rating) /
                    agentFeedback.total_feedback
                );
            }

            if (feedback.comment) {
                updatedMatch.feedback = [
                    ...updatedMatch.feedback,
                    {
                        id: Date.now().toString(),
                        agentId: feedback.agentId,
                        comment: feedback.comment,
                        created_at: new Date().toISOString()
                    }
                ];
            }

            setMatchResults(updatedMatch);

            // Try to update on server
            try {
                await axios.post(`/api/competition/matches/${matchResults.id}/feedback`, feedback);
                message.success('Feedback submitted successfully');
            } catch (error) {
                console.warn('Failed to save feedback to server:', error);
                message.warning('Feedback saved locally but failed to sync with server');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            message.error('Failed to submit feedback');
        }
    };

    const renderAgentSelection = () => {
        console.log('Rendering agent selection with agents:', agents);
        return (
            <Card title="Select Agents" style={{ marginTop: '16px' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {!agents || agents.length === 0 ? (
                        <Alert
                            message="No Agents Available"
                            description={
                                <Space direction="vertical">
                                    <Text>There are currently no agents available for selection.</Text>
                                    <Text>Using mock agents for demonstration.</Text>
                                    <Button 
                                        type="primary" 
                                        onClick={() => setAgents(MOCK_AGENTS)}
                                        style={{ marginTop: '8px' }}
                                    >
                                        Load Mock Agents
                                    </Button>
                                </Space>
                            }
                            type="warning"
                            showIcon
                        />
                    ) : (
                        <Form layout="vertical">
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <Form.Item
                                        label="First Agent"
                                        required
                                        validateStatus={selectedAgents.agent1 ? '' : 'warning'}
                                        help={selectedAgents.agent1 ? '' : 'Please select an agent'}
                                    >
                                        <Select
                                            placeholder="Select first agent"
                                            value={selectedAgents.agent1}
                                            onChange={(value) => handleAgentSelection(value, 'agent1')}
                                            style={{ width: '100%' }}
                                        >
                                            {agents.map(agent => (
                                                <Option key={agent.id} value={agent.id}>
                                                    <Space>
                                                        <RobotOutlined />
                                                        <div>
                                                            <div>{agent.name}</div>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                {agent.provider}
                                                            </Text>
                                                        </div>
                                                    </Space>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        label="Second Agent"
                                        required
                                        validateStatus={selectedAgents.agent2 ? '' : 'warning'}
                                        help={selectedAgents.agent2 ? '' : 'Please select an agent'}
                                    >
                                        <Select
                                            placeholder="Select second agent"
                                            value={selectedAgents.agent2}
                                            onChange={(value) => handleAgentSelection(value, 'agent2')}
                                            style={{ width: '100%' }}
                                        >
                                            {agents.map(agent => (
                                                <Option key={agent.id} value={agent.id}>
                                                    <Space>
                                                        <RobotOutlined />
                                                        <div>
                                                            <div>{agent.name}</div>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                {agent.provider}
                                                            </Text>
                                                        </div>
                                                    </Space>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        label="Judge Agent"
                                        required
                                        validateStatus={selectedAgents.judge ? '' : 'warning'}
                                        help={selectedAgents.judge ? '' : 'Please select a judge'}
                                    >
                                        <Select
                                            placeholder="Select judge agent"
                                            value={selectedAgents.judge}
                                            onChange={(value) => handleAgentSelection(value, 'judge')}
                                            style={{ width: '100%' }}
                                        >
                                            {agents.map(agent => (
                                                <Option key={agent.id} value={agent.id}>
                                                    <Space>
                                                        <TrophyOutlined />
                                                        <div>
                                                            <div>{agent.name}</div>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                {agent.provider}
                                                            </Text>
                                                        </div>
                                                    </Space>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    )}

                    <div style={{ textAlign: 'right' }}>
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleCreateMatch}
                            loading={creatingMatch}
                            disabled={!canCreateMatch() || !agents || agents.length === 0}
                        >
                            Create Match
                        </Button>
                    </div>
                </Space>
            </Card>
        );
    };

    const columns = [
        {
            title: 'Paper',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <Space>
                    <FileTextOutlined />
                    <a onClick={() => handlePaperSelection(record, 'paper1')}>{text}</a>
                </Space>
            )
        },
        {
            title: 'Authors',
            dataIndex: 'authors',
            key: 'authors',
            render: (authors) => (
                <Space wrap>
                    {authors?.map(author => (
                        <Tag key={author.id}>{author.name}</Tag>
                    ))}
                </Space>
            )
        },
        {
            title: 'Categories',
            dataIndex: 'categories',
            key: 'categories',
            render: (categories) => (
                <Space wrap>
                    {categories?.map(category => (
                        <Tag key={category.id} color="blue">{category.name}</Tag>
                    ))}
                </Space>
            )
        },
        {
            title: 'Year',
            dataIndex: 'published_year',
            key: 'published_year',
            render: (year) => <Tag color="purple">{year}</Tag>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handlePaperSelection(record, 'paper1')}
                >
                    Select Paper
                </Button>
            )
        }
    ];

    const handleResetFilters = () => {
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setSelectedYear(null);
        setSearchText('');
    };

    return (
        <div className="create-match-page" style={{ padding: '24px' }}>
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Title level={2}>Create New Match</Title>
                                <Text type="secondary">
                                    Select papers and choose agents to compete in reviewing them.
                                    A judge agent will evaluate their reviews and determine the winner.
                                </Text>
                            </div>

                            <Radio.Group 
                                value={matchType} 
                                onChange={handleMatchTypeChange}
                                buttonStyle="solid"
                            >
                                <Radio.Button value="single">Single Paper Match</Radio.Button>
                                <Radio.Button value="comparison">Paper Comparison Match</Radio.Button>
                            </Radio.Group>
                        </Space>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="Recent Matches" extra={
                        <Button 
                            type="primary" 
                            icon={<ReloadOutlined />} 
                            onClick={fetchRecentMatches}
                        >
                            Refresh
                        </Button>
                    }>
                        <Table
                            columns={[
                                {
                                    title: 'Paper',
                                    dataIndex: 'paper',
                                    key: 'paper',
                                    render: (paper, record) => (
                                        <Space direction="vertical" size="small">
                                            <Space>
                                                <FileTextOutlined />
                                                <span>{paper?.title || 'N/A'}</span>
                                            </Space>
                                            {record.paper2 && (
                                                <Space>
                                                    <FileTextOutlined />
                                                    <span>{record.paper2?.title || 'N/A'}</span>
                                                </Space>
                                            )}
                                            {paper?.venue && (
                                                <Tag color="blue">
                                                    {paper.venue} ({paper.year || 'N/A'})
                                                </Tag>
                                            )}
                                        </Space>
                                    )
                                },
                                {
                                    title: 'Agents',
                                    key: 'agents',
                                    render: (_, record) => (
                                        <Space direction="vertical" size="small">
                                            <Space>
                                                <Avatar 
                                                    src={record.agent1?.avatar_url} 
                                                    icon={<RobotOutlined />}
                                                />
                                                <Space direction="vertical" size={0}>
                                                    <Link to={`/agents/${record.agent1?.id || ''}`}>
                                                        {record.agent1?.name || 'Unknown Agent'}
                                                    </Link>
                                                    <Space size="small">
                                                        <Rate 
                                                            disabled 
                                                            defaultValue={record.agent1?.avg_rating || 0} 
                                                            allowHalf 
                                                            style={{ fontSize: 12 }}
                                                        />
                                                        <span style={{ fontSize: 12 }}>
                                                            ({record.agent1?.review_count || 0} reviews)
                                                        </span>
                                                    </Space>
                                                </Space>
                                            </Space>
                                            <div style={{ textAlign: 'center', color: '#999' }}>vs</div>
                                            <Space>
                                                <Avatar 
                                                    src={record.agent2?.avatar_url} 
                                                    icon={<RobotOutlined />}
                                                />
                                                <Space direction="vertical" size={0}>
                                                    <Link to={`/agents/${record.agent2?.id || ''}`}>
                                                        {record.agent2?.name || 'Unknown Agent'}
                                                    </Link>
                                                    <Space size="small">
                                                        <Rate 
                                                            disabled 
                                                            defaultValue={record.agent2?.avg_rating || 0} 
                                                            allowHalf 
                                                            style={{ fontSize: 12 }}
                                                        />
                                                        <span style={{ fontSize: 12 }}>
                                                            ({record.agent2?.review_count || 0} reviews)
                                                        </span>
                                                    </Space>
                                                </Space>
                                            </Space>
                                            <Divider style={{ margin: '4px 0' }} />
                                            <Space>
                                                <Avatar 
                                                    src={record.judge?.avatar_url} 
                                                    icon={<TrophyOutlined />}
                                                />
                                                <Link to={`/agents/${record.judge?.id || ''}`}>
                                                    Judge: {record.judge?.name || 'Unknown Judge'}
                                                </Link>
                                            </Space>
                                        </Space>
                                    )
                                },
                                {
                                    title: 'Status',
                                    dataIndex: 'status',
                                    key: 'status',
                                    render: (status, record) => (
                                        <Space direction="vertical" size="small">
                                            <Badge 
                                                status={
                                                    status === 'completed' ? 'success' : 
                                                    status === 'pending' ? 'processing' : 
                                                    'error'
                                                } 
                                                text={
                                                    status === 'completed' ? 'Completed' : 
                                                    status === 'pending' ? 'In Progress' : 
                                                    'Error'
                                                }
                                            />
                                            {status === 'completed' && record.winner && (
                                                <Tooltip title="Winner">
                                                    <Space>
                                                        <Avatar 
                                                            src={record.winner?.avatar_url} 
                                                            size="small"
                                                        />
                                                        <Link to={`/agents/${record.winner?.id || ''}`}>
                                                            {record.winner?.name || 'Unknown Winner'}
                                                        </Link>
                                                    </Space>
                                                </Tooltip>
                                            )}
                                        </Space>
                                    )
                                },
                                {
                                    title: 'Created',
                                    dataIndex: 'created_at',
                                    key: 'created_at',
                                    render: (date) => {
                                        if (!date) return 'N/A';
                                        
                                        try {
                                            const dateObj = new Date(date);
                                            if (isNaN(dateObj.getTime())) {
                                                return 'Invalid Date';
                                            }
                                            return (
                                                <Tooltip title={dateObj.toLocaleString()}>
                                                    {formatDistanceToNow(dateObj, { addSuffix: true })}
                                                </Tooltip>
                                            );
                                        } catch (error) {
                                            console.error('Error formatting date:', error);
                                            return 'Invalid Date';
                                        }
                                    }
                                },
                                {
                                    title: 'Action',
                                    key: 'action',
                                    render: (_, record) => (
                                        <Space>
                                            <Button
                                                type="primary"
                                                icon={<EyeOutlined />}
                                                onClick={() => {
                                                    setMatchResults(record);
                                                    setShowResults(true);
                                                }}
                                            >
                                                View Details
                                            </Button>
                                            {record.status === 'completed' && (
                                                <Button
                                                    type="default"
                                                    icon={<BarChartOutlined />}
                                                    onClick={() => navigate(`/competition/matches/${record.id}/comparison`)}
                                                >
                                                    Compare Reviews
                                                </Button>
                                            )}
                                        </Space>
                                    )
                                }
                            ]}
                            dataSource={matches}
                            rowKey="id"
                            pagination={{ 
                                pageSize: 5,
                                showSizeChanger: true,
                                showTotal: (total) => `Total ${total} matches`
                            }}
                            loading={loading}
                        />
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="Available Papers">
                        <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: '16px' }}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12} md={6}>
                                    <Select
                                        placeholder="Select Category"
                                        style={{ width: '100%' }}
                                        value={selectedCategory}
                                        onChange={setSelectedCategory}
                                        allowClear
                                    >
                                        {categories.map(category => (
                                            <Option key={category.id} value={category.id}>
                                                {category.name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Select
                                        placeholder="Select Subcategory"
                                        style={{ width: '100%' }}
                                        value={selectedSubcategory}
                                        onChange={setSelectedSubcategory}
                                        disabled={!selectedCategory}
                                        allowClear
                                    >
                                        {subcategories.map(subcategory => (
                                            <Option key={subcategory.id} value={subcategory.id}>
                                                {subcategory.name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Select
                                        placeholder="Select Year"
                                        style={{ width: '100%' }}
                                        value={selectedYear}
                                        onChange={setSelectedYear}
                                        allowClear
                                    >
                                        {years.map(year => (
                                            <Option key={year} value={year}>
                                                {year}
                                            </Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Space.Compact style={{ width: '100%' }}>
                                        <Search
                                            placeholder="Search papers..."
                                            allowClear
                                            enterButton={<SearchOutlined />}
                                            value={searchText}
                                            onChange={e => setSearchText(e.target.value)}
                                            style={{ width: 'calc(100% - 40px)' }}
                                        />
                                        <Button
                                            icon={<FilterOutlined />}
                                            onClick={handleResetFilters}
                                            title="Reset all filters"
                                        />
                                    </Space.Compact>
                                </Col>
                            </Row>
                        </Space>

                        <Tabs defaultActiveKey="paper1">
                            <TabPane 
                                tab={
                                    <Space>
                                        <FileTextOutlined />
                                        First Paper
                                        {selectedPapers.paper1 && <Tag color="green">Selected</Tag>}
                                    </Space>
                                } 
                                key="paper1"
                            >
                                {selectedPapers.paper1 && renderPaperCard(selectedPapers.paper1)}
                                <Table
                                    columns={columns}
                                    dataSource={filteredPapers}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={{
                                        pageSize: 10,
                                        showSizeChanger: true,
                                        showTotal: (total) => `Total ${total} papers`
                                    }}
                                />
                            </TabPane>
                            {matchType === 'comparison' && (
                                <TabPane 
                                    tab={
                                        <Space>
                                            <FileTextOutlined />
                                            Second Paper
                                            {selectedPapers.paper2 && <Tag color="green">Selected</Tag>}
                                        </Space>
                                    } 
                                    key="paper2"
                                >
                                    {selectedPapers.paper2 && renderPaperCard(selectedPapers.paper2)}
                                    <Table
                                        columns={columns.map(col => ({
                                            ...col,
                                            render: (text, record) => {
                                                if (col.key === 'title') {
                                                    return (
                                                        <Space>
                                                            <FileTextOutlined />
                                                            <a onClick={() => handlePaperSelection(record, 'paper2')}>{text}</a>
                                                        </Space>
                                                    );
                                                }
                                                if (col.key === 'action') {
                                                    return (
                                                        <Button
                                                            type="primary"
                                                            icon={<PlusOutlined />}
                                                            onClick={() => handlePaperSelection(record, 'paper2')}
                                                        >
                                                            Select Paper
                                                        </Button>
                                                    );
                                                }
                                                return col.render ? col.render(text, record) : text;
                                            }
                                        }))}
                                        dataSource={filteredPapers}
                                        rowKey="id"
                                        loading={loading}
                                        pagination={{
                                            pageSize: 10,
                                            showSizeChanger: true,
                                            showTotal: (total) => `Total ${total} papers`
                                        }}
                                    />
                                </TabPane>
                            )}
                        </Tabs>

                        {selectedPapers.paper1 && (matchType === 'single' || selectedPapers.paper2) && (
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={() => setShowAgentSelection(true)}
                                >
                                    Continue to Agent Selection
                                </Button>
                            </div>
                        )}
                    </Card>
                </Col>

                {showAgentSelection && renderAgentSelection()}
            </Row>

            <Modal
                title="Create Match"
                open={matchModalVisible}
                onCancel={() => {
                    setMatchModalVisible(false);
                    setSelectedPapers({ paper1: null, paper2: null });
                }}
                footer={null}
                width={800}
            >
                {agentConnectionError && (
                    <Alert
                        message="Agent Connection Warning"
                        description={agentConnectionError}
                        type="warning"
                        showIcon
                        style={{ marginBottom: '16px' }}
                    />
                )}

                {selectedPapers.paper1 && (
                    <>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Title level={4}>Selected Papers</Title>
                                {renderPaperCard(selectedPapers.paper1)}
                                {matchType === 'comparison' && selectedPapers.paper2 && (
                                    <>
                                        <Divider>
                                            <SwapOutlined /> Comparison
                                        </Divider>
                                        {renderPaperCard(selectedPapers.paper2)}
                                    </>
                                )}
                            </div>

                            <Form
                                form={form}
                                onFinish={handleCreateMatch}
                                layout="vertical"
                            >
                                <Form.Item
                                    name="agent1"
                                    label="First Agent"
                                    rules={[{ required: true, message: 'Please select the first agent' }]}
                                >
                                    <Select placeholder="Select first agent">
                                        {agents.map(agent => (
                                            <Option key={agent.id} value={agent.id}>
                                                <Space>
                                                    <RobotOutlined />
                                                    {agent.name}
                                                </Space>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="agent2"
                                    label="Second Agent"
                                    rules={[{ required: true, message: 'Please select the second agent' }]}
                                >
                                    <Select placeholder="Select second agent">
                                        {agents.map(agent => (
                                            <Option key={agent.id} value={agent.id}>
                                                <Space>
                                                    <RobotOutlined />
                                                    {agent.name}
                                                </Space>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="judge"
                                    label="Judge Agent"
                                    rules={[{ required: true, message: 'Please select a judge agent' }]}
                                >
                                    <Select placeholder="Select judge agent">
                                        {agents.map(agent => (
                                            <Option key={agent.id} value={agent.id}>
                                                <Space>
                                                    <TrophyOutlined />
                                                    {agent.name}
                                                </Space>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={creatingMatch}
                                        icon={<PlusOutlined />}
                                        disabled={!selectedPapers.paper1 || (matchType === 'comparison' && !selectedPapers.paper2)}
                                    >
                                        Create Match
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Space>
                    </>
                )}
            </Modal>

            {showResults && matchResults && (
                <MatchResults 
                    match={matchResults}
                    onFeedback={handleFeedback}
                    onClose={() => setShowResults(false)}
                    showFeedback={true}
                    allowComments={true}
                    showLikes={true}
                />
            )}
        </div>
    );
};

export default CreateMatch; 