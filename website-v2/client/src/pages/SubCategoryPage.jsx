import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { fetchPapers } from '../services/v2/api';
import { fetchVenues, fetchAgents, createMatch, fetchRecentMatches } from '../services/v2/api';
import { fetchLeaderboard } from '../services/competitionService';
import API_CONFIG from '../config/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PaperCard from '../components/PaperCard';
import MatchResults from '../components/competition/MatchResults';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import { 
  Card, 
  Typography, 
  Alert, 
  Button, 
  Modal, 
  Form, 
  Select, 
  Space, 
  Radio, 
  message, 
  List, 
  Tag, 
  Badge, 
  Row,
  Col,
  Tabs,
  Input,
  DatePicker,
  Spin,
  Result,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  RobotOutlined, 
  TrophyOutlined, 
  FileTextOutlined, 
  CloseOutlined, 
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { getMockLeaderboardData } from '../mock/paperData';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;
const { RangePicker } = DatePicker;

// Mock data for testing
const MOCK_AGENTS = [
  {
    id: 'agent1',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Advanced language model with strong analytical capabilities'
  },
  {
    id: 'agent2',
    name: 'Claude',
    provider: 'Anthropic',
    description: 'Specialized in detailed analysis and explanation'
  },
  {
    id: 'agent3',
    name: 'GPT-3.5',
    provider: 'OpenAI',
    description: 'Efficient language model with good understanding'
  }
];

// Create axios instance with default config
const api = axios.create(API_CONFIG);

const SubcategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const { categories } = useAppContext();
  const [form] = Form.useForm();
  
  // Loading state for categories
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Paper state
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(undefined);
  const [usingMockData, setUsingMockData] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Filter states
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedMatchStatus, setSelectedMatchStatus] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [venues, setVenues] = useState([]);
  
  // Keep minimal state for recent matches display
  const [recentMatches, setRecentMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [agents, setAgents] = useState(MOCK_AGENTS);
  
  // Tab and leaderboard state
  const [activeTab, setActiveTab] = useState('papers');
  const [leaderboardYear, setLeaderboardYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [usingMockLeaderboard, setUsingMockLeaderboard] = useState(false);

  // Find category and subcategory with null checks
  const category = categories?.find((cat) => cat.slug === categorySlug);
  const subcategory = category?.subcategories?.find((sub) => sub.slug === subcategorySlug);

  // Check if category and subcategory exist
  const categoryNotFound = !loadingCategories && !category;
  const subcategoryNotFound = !loadingCategories && category && !subcategory;

  // Define filteredPapers before useEffect hooks
  const filteredPapers = papers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchText.toLowerCase()) ||
                        paper.abstract.toLowerCase().includes(searchText.toLowerCase());
    const matchesYear = !selectedYear || paper.year === selectedYear;
    console.log('Filtering paper:', { 
      paper: paper.title, 
      matchesSearch, 
      matchesYear, 
      searchText, 
      selectedYear,
      paperYear: paper.year,
      paperId: paper.id
    });
    return matchesSearch && matchesYear;
  });

  // Add logging for tab changes
  useEffect(() => {
    console.log('Active tab changed:', activeTab);
  }, [activeTab]);

  // Add logging for component mount and state changes
  useEffect(() => {
    console.log('Component mounted/updated with state:', {
      activeTab,
      papers,
      filteredPapers,
      loading,
      error,
      selectedYear,
      searchText
    });
  }, [activeTab, papers, filteredPapers, loading, error, selectedYear, searchText]);

  useEffect(() => {
    // Set loading state for categories
    if (categories) {
      setLoadingCategories(false);
    }
  }, [categories]);

  useEffect(() => {
    const loadData = async () => {
      if (categoryNotFound || subcategoryNotFound) {
        console.log('Category or subcategory not found:', { categoryNotFound, subcategoryNotFound });
        return;
      }
      
      if (!category || !subcategory) {
        console.log('Category or subcategory is undefined:', { category, subcategory });
        return;
      }
      
      // Add validation for selectedYear
      if (!selectedYear || selectedYear > new Date().getFullYear()) {
        console.log('Invalid year selected:', selectedYear);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Loading papers for:', { categorySlug, subcategorySlug, selectedYear });
        
        // Fetch papers from the v2 API
        const papersData = await fetchPapers(categorySlug, subcategorySlug, selectedYear);
        console.log('Raw papers data from API:', papersData);
        
        if (!papersData || !Array.isArray(papersData)) {
          console.error('Invalid papers data received:', papersData);
          throw new Error('Invalid papers data received from API');
        }
        
        // Transform papers data to ensure all required fields are present
        const transformedPapers = papersData.map(paper => {
          if (!paper) {
            console.error('Invalid paper object in array:', paper);
            return null;
          }
          
          const transformed = {
            ...paper,
            id: paper.id || `paper-${Math.random().toString(36).substr(2, 9)}`,
            references: paper.references || paper.authors?.join(', ') || 'Unknown Authors',
            url: paper.url || '#',
            year: paper.year || paper.published_year || new Date().getFullYear(),
            category: paper.category || categorySlug,
            subcategory: paper.subcategory || subcategorySlug
          };
          console.log('Transformed paper:', transformed);
          return transformed;
        });
        
        console.log('Final transformed papers:', transformedPapers);
        setPapers(transformedPapers);
        
        // Set agents from the API response if available, otherwise use mock agents
        // const agentsData = await fetchAgents();
        // if (agentsData && agentsData.agents) {
        //   setAgents(agentsData.agents);
        // } else {
        //   setAgents(MOCK_AGENTS);
        // }
        
        setUsingMockData(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
        message.error('Failed to load papers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [categorySlug, subcategorySlug, selectedYear, category, subcategory, categoryNotFound, subcategoryNotFound]);

  const getMockPapers = (categorySlug, subcategorySlug, year) => {
    // Define mock papers for each subcategory and year
    const mockPapersBySubcategory = {
      // AI subcategories
      'vision': {
        2024: [
          {
            id: 'vision-2024-1',
            title: 'Deep Learning Approaches for Real-time Object Detection',
            authors: ['Dr. Sarah Chen', 'Prof. Michael Zhang', 'Dr. Lisa Wang'],
            abstract: 'This paper presents a novel deep learning architecture for real-time object detection in complex scenes. We introduce a multi-scale feature fusion network that achieves state-of-the-art performance while maintaining real-time processing speeds.',
            categories: ['cs.CV', 'cs.AI'],
            subcategories: ['vision'],
            year: 2024,
            venue: '2024 International Conference on Computer Vision',
            url: 'https://arxiv.org/abs/2401.00001',
            pdfUrl: 'https://arxiv.org/pdf/2401.00001.pdf'
          },
          {
            id: 'vision-2024-2',
            title: 'Self-supervised Learning for Medical Image Analysis',
            authors: ['Dr. Jennifer Liu', 'Prof. Richard Brown', 'Dr. Emma Wilson'],
            abstract: 'We propose a self-supervised learning framework for medical image analysis that reduces the need for labeled data. Our method achieves state-of-the-art results on various medical imaging tasks.',
            categories: ['cs.CV', 'cs.AI'],
            subcategories: ['vision'],
            year: 2024,
            venue: '2024 Medical Image Computing and Computer Assisted Intervention',
            url: 'https://arxiv.org/abs/2403.00002',
            pdfUrl: 'https://arxiv.org/pdf/2403.00002.pdf'
          }
        ],
        2023: [
          {
            id: 'vision-2023-1',
            title: 'Vision Transformers for Video Understanding',
            authors: ['Dr. Alex Thompson', 'Prof. Maria Garcia', 'Dr. James Wilson'],
            abstract: 'This work introduces a novel vision transformer architecture specifically designed for video understanding tasks. We demonstrate significant improvements in action recognition and temporal modeling.',
            categories: ['cs.CV', 'cs.AI'],
            subcategories: ['vision'],
            year: 2023,
            venue: '2023 International Conference on Computer Vision',
            url: 'https://arxiv.org/abs/2301.00001',
            pdfUrl: 'https://arxiv.org/pdf/2301.00001.pdf'
          }
        ]
      },
      'ml': {
        2024: [
          {
            id: 'ml-2024-1',
            title: 'Federated Learning with Differential Privacy Guarantees',
            authors: ['Dr. James Wilson', 'Prof. Emily Brown', 'Dr. Robert Lee'],
            abstract: 'We propose a new framework for federated learning that incorporates differential privacy while maintaining model performance. Our approach achieves better privacy-utility trade-offs compared to existing methods.',
            categories: ['cs.LG', 'cs.AI'],
            subcategories: ['ml'],
            year: 2024,
            venue: '2024 International Conference on Machine Learning',
            url: 'https://arxiv.org/abs/2402.00001',
            pdfUrl: 'https://arxiv.org/pdf/2402.00001.pdf'
          }
        ],
        2023: [
          {
            id: 'ml-2023-1',
            title: 'Reinforcement Learning for Autonomous Systems',
            authors: ['Dr. Christopher Lee', 'Prof. Sarah Johnson', 'Dr. Michael Brown'],
            abstract: 'This work presents a new reinforcement learning algorithm for autonomous systems. Our approach improves sample efficiency and safety in real-world applications.',
            categories: ['cs.LG', 'cs.AI'],
            subcategories: ['ml'],
            year: 2023,
            venue: '2023 International Conference on Learning Representations',
            url: 'https://arxiv.org/abs/2303.00003',
            pdfUrl: 'https://arxiv.org/pdf/2303.00003.pdf'
          }
        ]
      },
      'nlp': {
        2024: [
          {
            id: 'nlp-2024-1',
            title: 'Transformer-based Models for Low-resource Language Translation',
            authors: ['Dr. Maria Garcia', 'Prof. David Kim', 'Dr. Anna Patel'],
            abstract: 'This work introduces a novel transformer architecture specifically designed for low-resource language translation. We demonstrate significant improvements in translation quality for languages with limited training data.',
            categories: ['cs.CL', 'cs.AI'],
            subcategories: ['nlp'],
            year: 2024,
            venue: '2024 Conference on Empirical Methods in Natural Language Processing',
            url: 'https://arxiv.org/abs/2403.00001',
            pdfUrl: 'https://arxiv.org/pdf/2403.00001.pdf'
          }
        ],
        2023: [
          {
            id: 'nlp-2023-1',
            title: 'Multilingual Language Models for Code Generation',
            authors: ['Dr. Alex Thompson', 'Prof. Lisa Chen', 'Dr. Ryan Park'],
            abstract: 'We introduce a new multilingual language model specifically designed for code generation. Our model shows improved performance across multiple programming languages.',
            categories: ['cs.CL', 'cs.AI'],
            subcategories: ['nlp'],
            year: 2023,
            venue: '2023 International Conference on Software Engineering',
            url: 'https://arxiv.org/abs/2304.00001',
            pdfUrl: 'https://arxiv.org/pdf/2304.00001.pdf'
          }
        ]
      },
      'ai': {
        2024: [
          {
            id: 'ai-2024-1',
            title: 'Towards General Artificial Intelligence: A Survey',
            authors: ['Dr. Robert Chen', 'Prof. Sarah Lee', 'Dr. David Kim'],
            abstract: 'This comprehensive survey examines recent advances in artificial general intelligence, discussing key challenges, approaches, and future directions in the field.',
            categories: ['cs.AI'],
            subcategories: ['ai'],
            year: 2024,
            venue: '2024 International Conference on Artificial Intelligence',
            url: 'https://arxiv.org/abs/2401.00003',
            pdfUrl: 'https://arxiv.org/pdf/2401.00003.pdf'
          }
        ],
        2023: [
          {
            id: 'ai-2023-1',
            title: 'Ethical Considerations in AI Development',
            authors: ['Dr. Emily Brown', 'Prof. Michael Zhang', 'Dr. Lisa Wang'],
            abstract: 'This paper discusses critical ethical considerations in AI development, proposing a framework for responsible AI research and deployment.',
            categories: ['cs.AI'],
            subcategories: ['ai'],
            year: 2023,
            venue: '2023 Conference on AI Ethics and Society',
            url: 'https://arxiv.org/abs/2302.00003',
            pdfUrl: 'https://arxiv.org/pdf/2302.00003.pdf'
          }
        ]
      },
      'robotics': {
        2024: [
          {
            id: 'robotics-2024-1',
            title: 'Learning-based Control for Robotic Manipulation',
            authors: ['Dr. Thomas Anderson', 'Prof. Rachel White', 'Dr. Kevin Park'],
            abstract: 'We present a novel learning-based control framework for robotic manipulation tasks, demonstrating improved performance in complex environments.',
            categories: ['cs.RO', 'cs.AI'],
            subcategories: ['robotics'],
            year: 2024,
            venue: '2024 International Conference on Robotics and Automation',
            url: 'https://arxiv.org/abs/2402.00003',
            pdfUrl: 'https://arxiv.org/pdf/2402.00003.pdf'
          }
        ],
        2023: [
          {
            id: 'robotics-2023-1',
            title: 'Multi-robot Coordination in Dynamic Environments',
            authors: ['Dr. William Chen', 'Prof. Sophia Martinez', 'Dr. Daniel Lee'],
            abstract: 'This work introduces a new approach to multi-robot coordination, enabling efficient collaboration in dynamic and uncertain environments.',
            categories: ['cs.RO', 'cs.AI'],
            subcategories: ['robotics'],
            year: 2023,
            venue: '2023 International Conference on Intelligent Robots and Systems',
            url: 'https://arxiv.org/abs/2303.00003',
            pdfUrl: 'https://arxiv.org/pdf/2303.00003.pdf'
          }
        ]
      },
      // Architecture subcategories
      'processors': {
        2024: [
          {
            id: 'processors-2024-1',
            title: 'Energy-efficient RISC-V Processor Design for Edge Computing',
            authors: ['Dr. Thomas Anderson', 'Prof. Rachel White', 'Dr. Kevin Park'],
            abstract: 'We present a new RISC-V processor design optimized for edge computing applications. Our architecture achieves significant energy savings while maintaining competitive performance.',
            categories: ['cs.AR'],
            subcategories: ['processors'],
            year: 2024,
            venue: '2024 International Symposium on Computer Architecture',
            url: 'https://arxiv.org/abs/2401.00002',
            pdfUrl: 'https://arxiv.org/pdf/2401.00002.pdf'
          }
        ],
        2023: [
          {
            id: 'processors-2023-1',
            title: 'Quantum-inspired Classical Processor Design',
            authors: ['Dr. Elizabeth Wang', 'Prof. John Smith', 'Dr. Maria Garcia'],
            abstract: 'This paper presents a novel processor architecture inspired by quantum computing principles. Our design shows promising results for certain classes of algorithms.',
            categories: ['cs.AR'],
            subcategories: ['processors'],
            year: 2023,
            venue: '2023 International Symposium on Microarchitecture',
            url: 'https://arxiv.org/abs/2303.00004',
            pdfUrl: 'https://arxiv.org/pdf/2303.00004.pdf'
          }
        ]
      },
      'memory': {
        2024: [
          {
            id: 'memory-2024-1',
            title: 'Novel Memory Hierarchy for High-performance Computing',
            authors: ['Dr. William Chen', 'Prof. Sophia Martinez', 'Dr. Daniel Lee'],
            abstract: 'This paper introduces a new memory hierarchy design that improves performance for high-performance computing workloads. Our approach reduces memory latency while maintaining energy efficiency.',
            categories: ['cs.AR'],
            subcategories: ['memory'],
            year: 2024,
            venue: '2024 International Symposium on High-Performance Computer Architecture',
            url: 'https://arxiv.org/abs/2402.00002',
            pdfUrl: 'https://arxiv.org/pdf/2402.00002.pdf'
          }
        ],
        2023: [
          {
            id: 'memory-2023-1',
            title: 'Emerging Memory Technologies for Next-generation Computing',
            authors: ['Dr. Robert Kim', 'Prof. Sarah Lee', 'Dr. David Chen'],
            abstract: 'We explore the potential of emerging memory technologies for next-generation computing systems. Our analysis provides insights into the challenges and opportunities.',
            categories: ['cs.AR'],
            subcategories: ['memory'],
            year: 2023,
            venue: '2023 International Symposium on Memory Systems',
            url: 'https://arxiv.org/abs/2304.00002',
            pdfUrl: 'https://arxiv.org/pdf/2304.00002.pdf'
          }
        ]
      },
      'architecture': {
        2024: [
          {
            id: 'architecture-2024-1',
            title: 'Domain-Specific Architecture for Deep Learning Workloads',
            authors: ['Dr. Jennifer Liu', 'Prof. Richard Brown', 'Dr. Emma Wilson'],
            abstract: 'This paper presents a novel domain-specific architecture optimized for deep learning workloads, achieving significant performance improvements over general-purpose processors.',
            categories: ['cs.AR'],
            subcategories: ['architecture'],
            year: 2024,
            venue: '2024 International Symposium on Computer Architecture',
            url: 'https://arxiv.org/abs/2401.00004',
            pdfUrl: 'https://arxiv.org/pdf/2401.00004.pdf'
          }
        ],
        2023: [
          {
            id: 'architecture-2023-1',
            title: 'Reconfigurable Computing Architectures for Edge AI',
            authors: ['Dr. Christopher Lee', 'Prof. Sarah Johnson', 'Dr. Michael Brown'],
            abstract: 'We introduce a new reconfigurable computing architecture specifically designed for edge AI applications, demonstrating improved efficiency and flexibility.',
            categories: ['cs.AR'],
            subcategories: ['architecture'],
            year: 2023,
            venue: '2023 International Symposium on Field-Programmable Gate Arrays',
            url: 'https://arxiv.org/abs/2302.00004',
            pdfUrl: 'https://arxiv.org/pdf/2302.00004.pdf'
          }
        ]
      },
      'networks': {
        2024: [
          {
            id: 'networks-2024-1',
            title: 'Next-Generation Network-on-Chip Architectures',
            authors: ['Dr. Alex Thompson', 'Prof. Lisa Chen', 'Dr. Ryan Park'],
            abstract: 'This work presents a novel network-on-chip architecture that improves scalability and performance for many-core processors.',
            categories: ['cs.AR'],
            subcategories: ['networks'],
            year: 2024,
            venue: '2024 International Symposium on Networks-on-Chip',
            url: 'https://arxiv.org/abs/2402.00004',
            pdfUrl: 'https://arxiv.org/pdf/2402.00004.pdf'
          }
        ],
        2023: [
          {
            id: 'networks-2023-1',
            title: 'Energy-Efficient Interconnect Design for Data Centers',
            authors: ['Dr. Maria Garcia', 'Prof. David Kim', 'Dr. Anna Patel'],
            abstract: 'We propose a new interconnect design for data centers that significantly reduces energy consumption while maintaining high bandwidth and low latency.',
            categories: ['cs.AR'],
            subcategories: ['networks'],
            year: 2023,
            venue: '2023 International Symposium on Computer Architecture',
            url: 'https://arxiv.org/abs/2303.00004',
            pdfUrl: 'https://arxiv.org/pdf/2303.00004.pdf'
          }
        ]
      },
      'security': {
        2024: [
          {
            id: 'security-2024-1',
            title: 'Hardware Security Primitives for Trusted Computing',
            authors: ['Dr. James Wilson', 'Prof. Emily Brown', 'Dr. Robert Lee'],
            abstract: 'This paper introduces novel hardware security primitives that enhance the security of computing systems while maintaining performance.',
            categories: ['cs.AR', 'cs.CR'],
            subcategories: ['security'],
            year: 2024,
            venue: '2024 International Symposium on Computer Architecture',
            url: 'https://arxiv.org/abs/2401.00005',
            pdfUrl: 'https://arxiv.org/pdf/2401.00005.pdf'
          }
        ],
        2023: [
          {
            id: 'security-2023-1',
            title: 'Architectural Support for Secure Memory Operations',
            authors: ['Dr. Thomas Anderson', 'Prof. Rachel White', 'Dr. Kevin Park'],
            abstract: 'We present a new architectural approach to secure memory operations, providing protection against various hardware attacks.',
            categories: ['cs.AR', 'cs.CR'],
            subcategories: ['security'],
            year: 2023,
            venue: '2023 International Symposium on Microarchitecture',
            url: 'https://arxiv.org/abs/2302.00005',
            pdfUrl: 'https://arxiv.org/pdf/2302.00005.pdf'
          }
        ]
      }
    };

    // Get papers for the specific subcategory and year, or return empty array if not found
    const subcategoryPapers = mockPapersBySubcategory[subcategorySlug];
    if (!subcategoryPapers) {
      return [{
        id: 'default-1',
        title: `Recent Advances in ${subcategorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
        authors: ['Dr. Jane Smith', 'Prof. John Doe', 'Dr. Maria Garcia'],
        abstract: `This paper presents a comprehensive analysis of recent developments in ${subcategorySlug} within the field of ${categorySlug}. We explore novel methodologies and their applications, demonstrating significant improvements in performance and efficiency.`,
        categories: [categorySlug === 'ai' ? 'cs.AI' : 'cs.AR'],
        subcategories: [subcategorySlug],
        year: year,
        venue: `${year} International Conference on ${categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
        url: '#',
        pdfUrl: '#'
      }];
    }

    return subcategoryPapers[year] || [];
  };

  const fetchRecentMatches = async () => {
    setLoadingMatches(true);
    try {
      const response = await api.get('/matches', {
        params: {
          category: categorySlug,
          subcategory: subcategorySlug,
          limit: 5
        }
      });
      setRecentMatches(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching recent matches:', error);
      if (usingMockData) {
        setRecentMatches([]); // Add mock matches if needed
      }
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleResetFilters = () => {
    setSearchText('');
  };

  const fetchLeaderboardData = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await api.get('/leaderboard', {
        params: {
          category: categorySlug,
          subcategory: subcategorySlug,
          year: selectedYear
        }
      });
      
      if (response.data && response.data.rankings) {
        setLeaderboardData(response.data.rankings);
        setUsingMockLeaderboard(false);
      } else {
        throw new Error('Invalid leaderboard data format');
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      // Use mock data as fallback
      const mockData = getMockLeaderboardData();
      setLeaderboardData(mockData);
      setUsingMockLeaderboard(true);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const renderPaperList = () => {
    console.log('renderPaperList called with state:', {
      papers,
      filteredPapers,
      loading,
      error,
      selectedYear,
      searchText,
      categorySlug,
      subcategorySlug,
      leaderboardData
    });
    
    if (!filteredPapers || filteredPapers.length === 0) {
      console.log('No papers to render. Papers array:', papers);
      return (
        <Alert
          message="No Papers Found"
          description={`No papers found for ${subcategory?.name || subcategorySlug} in ${selectedYear}.`}
          type="info"
          showIcon
        />
      );
    }

    // Create a map of paper rankings for quick lookup
    const paperRankings = new Map(
      leaderboardData.map(paper => [paper.paperId, paper])
    );

    return (
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
        width: '100%',
        padding: '16px 0'
      }}>
        {filteredPapers.map((paper, index) => {
          console.log(`Rendering paper ${index}:`, paper);
          const ranking = paperRankings.get(paper.id);
          return (
            <PaperCard 
              key={paper.id} 
              paper={{
                ...paper,
                ranking: ranking ? {
                  rank: ranking.rank,
                  score: ranking.score,
                  matches: ranking.matches?.length || 0,
                  wins: ranking.wins || 0,
                  winRate: ranking.winRate || 0
                } : null
              }}
              showMatchButton={false}
              onSelectForMatch={null}
              selectedForMatch={false}
              style={{ height: '100%' }}
            />
          );
        })}
      </div>
    );
  };

  const renderRecentMatches = () => (
    <Card 
      title={
        <Space>
          <TrophyOutlined />
          Recent Matches
        </Space>
      }
      style={{ marginTop: '24px' }}
      loading={loadingMatches}
    >
      <List
        dataSource={recentMatches}
        renderItem={match => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  <Link to={`/papers/${match.paper.id}`}>
                    {match.paper.title}
                  </Link>
                  <Badge 
                    status={match.status === 'completed' ? 'success' : 'processing'} 
                    text={match.status === 'completed' ? 'Completed' : 'In Progress'} 
                  />
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary">
                    {match.paper.authors.join(', ')}
                  </Text>
                  <Space>
                    <Tag color="blue">{match.agents[0].name}</Tag>
                    <Text type="secondary">vs</Text>
                    <Tag color="green">{match.agents[1].name}</Tag>
                    {match.status === 'completed' && match.winner && (
                      <>
                        <Text type="secondary">Winner:</Text>
                        <Tag color="gold">
                          <TrophyOutlined /> {match.winner.name}
                        </Tag>
                      </>
                    )}
                  </Space>
                  <Text type="secondary">
                    Created {new Date(match.created_at).toLocaleDateString()}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  // Update the fetchLeaderboardYears function to handle missing endpoint gracefully
  const fetchLeaderboardYears = async () => {
    try {
      // For now, just use the current year and previous 4 years
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
      setAvailableYears(years);
      
      // If the current selected year is invalid, set to the most recent valid year
      if (!years.includes(leaderboardYear) || leaderboardYear > currentYear) {
        setLeaderboardYear(currentYear);
      }
    } catch (err) {
      console.error('Error fetching years:', err);
      // Use current year and previous 4 years as fallback
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
      setAvailableYears(years);
      if (!years.includes(leaderboardYear) || leaderboardYear > currentYear) {
        setLeaderboardYear(currentYear);
      }
    }
  };

  // Add effect to set leaderboard year when availableYears changes
  useEffect(() => {
    if (availableYears.length > 0 && (!leaderboardYear || !availableYears.includes(leaderboardYear))) {
      setLeaderboardYear(availableYears[0]);
    }
  }, [availableYears, leaderboardYear]);

  // Add effect to fetch leaderboard years when category/subcategory changes
  useEffect(() => {
    if (category && subcategory) {
      fetchLeaderboardYears();
    }
  }, [category, subcategory]);

  // Add effect to fetch leaderboard data when year changes
  useEffect(() => {
    if (selectedYear && categorySlug && subcategorySlug) {
      fetchLeaderboardData();
    }
  }, [selectedYear, categorySlug, subcategorySlug]);

  // Show loading state while categories are loading
  if (loadingCategories) {
    return (
      <div className="subcategory-page" style={{ padding: '24px' }}>
        <Header />
        <main className="container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading category information...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error if category is not found
  if (categoryNotFound) {
    return (
      <div className="subcategory-page" style={{ padding: '24px' }}>
        <Header />
        <main className="container">
          <Result
            status="404"
            title="Category Not Found"
            subTitle={`The category "${categorySlug}" could not be found.`}
            extra={
              <Button type="primary" onClick={() => window.history.back()}>
                Go Back
              </Button>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Show error if subcategory is not found
  if (subcategoryNotFound) {
    return (
      <div className="subcategory-page" style={{ padding: '24px' }}>
        <Header />
        <main className="container">
          <Result
            status="404"
            title="Subcategory Not Found"
            subTitle={`The subcategory "${subcategorySlug}" could not be found in category "${category.name}".`}
            extra={
              <Button type="primary" onClick={() => window.history.back()}>
                Go Back
              </Button>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="subcategory-page" style={{ padding: '24px' }}>
      <Header />
      <main className="container" style={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        <nav className="breadcrumb">
          <Link to="/">Home</Link> / 
          <Link to={`/category/${category.slug}`}>{category.name}</Link> / 
          <span>{subcategory.name}</span>
        </nav>
        
        <div className="subcategory-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#262626'
            }}>{subcategory.name} Papers</h1>
            <p className="subcategory-description" style={{ 
              fontSize: '16px',
              color: '#595959',
              lineHeight: '1.6',
              maxWidth: '800px'
            }}>{subcategory.description}</p>
          </div>
        </div>

        {usingMockData && (
          <Alert
            message="Using Mock Data"
            description="Showing mock papers for testing purposes. Click on a paper to view it on arXiv."
            type="info"
            showIcon
            style={{ 
              marginBottom: '24px',
              borderRadius: '8px'
            }}
          />
        )}

        <Card style={{ marginBottom: '24px' }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={(key) => {
              console.log('Tab changed from', activeTab, 'to', key);
              setActiveTab(key);
            }}
          >
            <TabPane 
              tab={
                <Space>
                  <FileTextOutlined />
                  Papers
                </Space>
              } 
              key="papers"
            >
              {console.log('Rendering papers tab with state:', {
                loading,
                error,
                papers,
                filteredPapers,
                selectedYear,
                searchText
              })}
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <Title level={4} style={{ margin: 0 }}>Search Papers</Title>
                  <Button 
                    type="link" 
                    onClick={handleResetFilters}
                    icon={<FilterOutlined />}
                  >
                    Reset Search
                  </Button>
                </div>
                
                <Row gutter={[16, 16]} style={{ width: '100%' }}>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Input
                      placeholder="Search papers by title or abstract..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      prefix={<SearchOutlined />}
                      allowClear
                      style={{ width: '100%', borderRadius: '6px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Select Year"
                      value={selectedYear}
                      onChange={setSelectedYear}
                      allowClear
                      dropdownStyle={{ borderRadius: '6px' }}
                    >
                      {availableYears.map(year => (
                        <Option key={year} value={year}>{year}</Option>
                      ))}
                    </Select>
                  </Col>
                </Row>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px' }}>Loading papers...</div>
                  </div>
                ) : error ? (
                  <Alert
                    message="Error Loading Papers"
                    description={error}
                    type="error"
                    showIcon
                  />
                ) : (
                  renderPaperList()
                )}
              </Space>
            </TabPane>

            <TabPane 
              tab={
                <Space>
                  <TrophyOutlined />
                  Leaderboard
                </Space>
              } 
              key="leaderboard"
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={4}>Paper Rankings</Title>
                  <Select
                    value={leaderboardYear}
                    onChange={(year) => {
                      const currentYear = new Date().getFullYear();
                      if (year > currentYear) {
                        message.warning('Cannot select future years');
                        return;
                      }
                      setLeaderboardYear(year);
                    }}
                    style={{ width: 120 }}
                  >
                    {availableYears.map(year => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                </div>
                <LeaderboardTable 
                  category={categorySlug} 
                  subcategory={subcategorySlug} 
                  year={leaderboardYear}
                />
              </Space>
            </TabPane>

            <TabPane 
              tab={
                <Space>
                  <RobotOutlined />
                  Recent Matches
                </Space>
              } 
              key="matches"
            >
              {renderRecentMatches()}
            </TabPane>
          </Tabs>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SubcategoryPage;