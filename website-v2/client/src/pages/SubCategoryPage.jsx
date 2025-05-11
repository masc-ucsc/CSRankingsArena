import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { fetchPapers } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PaperCard from '../components/PaperCard';
import { 
  Card, 
  Typography, 
  Alert, 
  Divider, 
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
  Rate, 
  Input,
  Row,
  Col,
  Statistic,
  Tabs
} from 'antd';
import { 
  PlusOutlined, 
  RobotOutlined, 
  SwapOutlined, 
  FileTextOutlined, 
  CloseOutlined, 
  TrophyOutlined, 
  EyeOutlined,
  LikeOutlined,
  DislikeOutlined,
  StarOutlined,
  HistoryOutlined,
  BarChartOutlined,
  CommentOutlined
} from '@ant-design/icons';
import axios from 'axios';
import MatchResults from '../components/competition/MatchResults';
import FeedbackHistory from '../components/competition/FeedbackHistory';
import AgentPerformanceChart from '../components/competition/AgentPerformanceChart';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const SubcategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const { categories } = useAppContext();
  const [form] = Form.useForm();
  
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [usingMockData, setUsingMockData] = useState(false);
  const [agents, setAgents] = useState([]);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [selectedPapers, setSelectedPapers] = useState({ paper1: null, paper2: null });
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [matchType, setMatchType] = useState('single');
  const [matchResults, setMatchResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [viewMatchModalVisible, setViewMatchModalVisible] = useState(false);
  
  const category = categories.find((cat) => cat.slug === categorySlug);
  const subcategory = category?.subcategories.find((sub) => sub.slug === subcategorySlug);
  
  // Generate an array of years from current year back to 5 years
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  
  useEffect(() => {
    const loadData = async () => {
      if (!category || !subcategory) return;
      
      try {
        setLoading(true);
        const [papersData, agentsData] = await Promise.all([
          fetchPapers(categorySlug, subcategorySlug, selectedYear),
          axios.get('/api/competition/agents')
        ]);
        
        if (papersData.length === 0) {
          // If no papers from API, use mock data
          const mockPapers = getMockPapers(categorySlug, subcategorySlug, selectedYear);
          setPapers(mockPapers);
          setUsingMockData(true);
        } else {
          setPapers(papersData);
          setUsingMockData(false);
        }
        
        setAgents(agentsData.data);
        await fetchRecentMatches();
      } catch (err) {
        setError(err.message);
        console.error('Error loading data:', err);
        // Use mock data on error
        const mockPapers = getMockPapers(categorySlug, subcategorySlug, selectedYear);
        setPapers(mockPapers);
        setUsingMockData(true);
        setAgents(getMockAgents());
        await fetchRecentMatches();
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [categorySlug, subcategorySlug, selectedYear, category, subcategory]);

  const getMockAgents = () => {
    return [
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
  };

  const handleCreateMatch = async (values) => {
    setCreatingMatch(true);
    try {
      const matchData = {
        agent1Id: values.agent1,
        agent2Id: values.agent2,
        judgeId: values.judge,
        category: categorySlug,
        subcategory: subcategorySlug,
        year: selectedYear
      };

      if (matchType === 'single') {
        matchData.paperId = selectedPapers.paper1.id;
      } else {
        matchData.paper1Id = selectedPapers.paper1.id;
        matchData.paper2Id = selectedPapers.paper2.id;
      }

      const response = await axios.post('/api/competition/matches', matchData);
      
      // For mock papers, generate mock results
      if (usingMockData) {
        const mockResults = {
          id: response.data.id,
          status: 'completed',
          created_at: new Date().toISOString(),
          agents: [
            {
              id: values.agent1,
              name: agents.find(a => a.id === values.agent1).name,
              provider: agents.find(a => a.id === values.agent1).provider,
              review: "This paper presents a novel approach with clear methodology and thorough evaluation. The authors demonstrate strong technical depth and provide comprehensive analysis of their results.",
              evaluation: [
                { criterion: "Technical Correctness", score: 0.85, comment: "Strong technical foundation and valid methodology" },
                { criterion: "Clarity", score: 0.75, comment: "Well-structured and clear presentation" },
                { criterion: "Originality", score: 0.90, comment: "Novel approach with significant contributions" }
              ]
            },
            {
              id: values.agent2,
              name: agents.find(a => a.id === values.agent2).name,
              provider: agents.find(a => a.id === values.agent2).provider,
              review: "While the paper addresses an important problem, there are some methodological concerns that need to be addressed. The evaluation could be more comprehensive, but the core ideas are promising.",
              evaluation: [
                { criterion: "Technical Correctness", score: 0.70, comment: "Some methodological concerns need addressing" },
                { criterion: "Clarity", score: 0.80, comment: "Clear writing style and good organization" },
                { criterion: "Originality", score: 0.75, comment: "Interesting approach with room for improvement" }
              ]
            }
          ],
          judgeDecision: "After careful evaluation of both reviews, Agent 1's review is more comprehensive and provides better technical analysis. The evaluation criteria were well-justified and the feedback was constructive.",
          winner: {
            id: values.agent1,
            name: agents.find(a => a.id === values.agent1).name
          },
          paper: {
            id: selectedPapers.paper1.id,
            title: selectedPapers.paper1.title,
            authors: selectedPapers.paper1.authors,
            abstract: selectedPapers.paper1.abstract
          }
        };
        setMatchResults(mockResults);
      } else {
        const matchDetails = await axios.get(`/api/competition/matches/${response.data.id}`);
        setMatchResults(matchDetails.data);
      }
      
      setShowResults(true);
      message.success('Match created successfully');
      form.resetFields();
      setSelectedPapers({ paper1: null, paper2: null });
      setMatchModalVisible(false);
      
      // Refresh recent matches after creating a new match
      await fetchRecentMatches();
    } catch (error) {
      console.error('Error creating match:', error);
      message.error('Failed to create match');
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleFeedback = async (feedback) => {
    try {
      await axios.post(`/api/competition/matches/${matchResults.id}/feedback`, feedback);
      message.success('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback');
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

  const getMockPapers = (categorySlug, subcategorySlug, year) => {
    // Generate more varied mock papers based on category and subcategory
    const mockPapers = [
      {
        id: 'mock1',
        title: `Recent Advances in ${subcategorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} for ${categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
        authors: ['Dr. Jane Smith', 'Prof. John Doe', 'Dr. Maria Garcia'],
        abstract: `This paper presents a comprehensive analysis of recent developments in ${subcategorySlug} within the field of ${categorySlug}. We explore novel methodologies and their applications, demonstrating significant improvements in performance and efficiency. Our research contributes to the growing body of knowledge in this area and provides insights for future developments.`,
        category: categorySlug,
        subcategory: subcategorySlug,
        year: year,
        venue: `${year} International Conference on ${categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
        url: '#',
        pdfUrl: '#'
      },
      {
        id: 'mock2',
        title: `A Survey of ${subcategorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Techniques in ${categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
        authors: ['Prof. Robert Johnson', 'Dr. Sarah Chen', 'Dr. Michael Brown'],
        abstract: `This survey paper examines the current state of ${subcategorySlug} research in ${categorySlug}. We analyze various approaches, compare their effectiveness, and identify key challenges and opportunities. The paper includes a systematic review of recent literature and proposes directions for future research.`,
        category: categorySlug,
        subcategory: subcategorySlug,
        year: year,
        venue: `${year} Journal of ${categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Research`,
        url: '#',
        pdfUrl: '#'
      },
      {
        id: 'mock3',
        title: `Novel Applications of ${subcategorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} in ${categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Systems`,
        authors: ['Dr. Emily Wilson', 'Prof. David Lee', 'Dr. Alex Thompson'],
        abstract: `We present innovative applications of ${subcategorySlug} techniques in ${categorySlug} systems. Our work demonstrates how these methods can be effectively applied to solve complex problems in the field. The paper includes experimental results and practical implementations that showcase the potential of our approach.`,
        category: categorySlug,
        subcategory: subcategorySlug,
        year: year,
        venue: `${year} Workshop on ${subcategorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
        url: '#',
        pdfUrl: '#'
      }
    ];

    return mockPapers;
  };

  const fetchRecentMatches = async () => {
    setLoadingMatches(true);
    try {
      const response = await axios.get('/api/competition/matches', {
        params: {
          category: categorySlug,
          subcategory: subcategorySlug,
          limit: 5
        }
      });
      setRecentMatches(response.data);
    } catch (error) {
      console.error('Error fetching recent matches:', error);
      // For mock data, generate some mock matches
      if (usingMockData) {
        setRecentMatches(generateMockMatches());
      }
    } finally {
      setLoadingMatches(false);
    }
  };

  const generateMockMatches = () => {
    return [
      {
        id: 'mock-match-1',
        status: 'completed',
        created_at: new Date().toISOString(),
        agents: [
          {
            id: 'agent1',
            name: 'GPT-4',
            provider: 'OpenAI',
            review: "This paper presents a novel approach with clear methodology and thorough evaluation. The authors demonstrate strong technical depth and provide comprehensive analysis of their results.",
            evaluation: [
              { criterion: "Technical Correctness", score: 0.85, comment: "Strong technical foundation and valid methodology" },
              { criterion: "Clarity", score: 0.75, comment: "Well-structured and clear presentation" },
              { criterion: "Originality", score: 0.90, comment: "Novel approach with significant contributions" }
            ]
          },
          {
            id: 'agent2',
            name: 'Claude',
            provider: 'Anthropic',
            review: "While the paper addresses an important problem, there are some methodological concerns that need to be addressed. The evaluation could be more comprehensive, but the core ideas are promising.",
            evaluation: [
              { criterion: "Technical Correctness", score: 0.70, comment: "Some methodological concerns need addressing" },
              { criterion: "Clarity", score: 0.80, comment: "Clear writing style and good organization" },
              { criterion: "Originality", score: 0.75, comment: "Interesting approach with room for improvement" }
            ]
          }
        ],
        judgeDecision: "After careful evaluation of both reviews, Agent 1's review is more comprehensive and provides better technical analysis. The evaluation criteria were well-justified and the feedback was constructive.",
        winner: {
          id: 'agent1',
          name: 'GPT-4'
        },
        paper: {
          id: papers[0]?.id || 'mock-paper-1',
          title: papers[0]?.title || 'Mock Paper 1',
          authors: papers[0]?.authors || ['Author 1', 'Author 2'],
          abstract: papers[0]?.abstract || 'Mock abstract for paper 1'
        }
      }
    ];
  };

  const viewMatchDetails = (match) => {
    setSelectedMatch(match);
    setViewMatchModalVisible(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { color: 'success', text: 'Completed' },
      'in_progress': { color: 'processing', text: 'In Progress' },
      'failed': { color: 'error', text: 'Failed' }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Badge status={config.color} text={config.text} />;
  };

  return (
    <div className="subcategory-page">
      <Header />
      <main className="container">
        <nav className="breadcrumb">
          <Link to="/">Home</Link> / 
          <Link to={`/category/${category.slug}`}>{category.name}</Link> / 
          <span>{subcategory.name}</span>
        </nav>
        
        <div className="subcategory-header">
          <h1>{subcategory.name} Papers</h1>
          <p className="subcategory-description">{subcategory.description}</p>
        </div>

        {usingMockData && (
          <Alert
            message="Using Mock Data"
            description="No papers were found from arXiv. Showing mock papers for testing purposes."
            type="warning"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        <Card style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={3}>Create AI Review Match for {selectedYear}</Title>
              <Text type="secondary">
                Select papers and choose AI agents to compete in reviewing them.
                A judge agent will evaluate their reviews and determine the winner.
              </Text>
            </div>

            <div className="match-type-selector">
              <Radio.Group 
                value={matchType} 
                onChange={handleMatchTypeChange}
                buttonStyle="solid"
              >
                <Radio.Button value="single">Single Paper Match</Radio.Button>
                <Radio.Button value="comparison">Paper Comparison Match</Radio.Button>
              </Radio.Group>
            </div>

            <div className="selected-papers">
              {selectedPapers.paper1 && (
                <Card style={{ marginBottom: '16px' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Title level={5}>Selected Paper 1</Title>
                      <Button 
                        type="text" 
                        icon={<CloseOutlined />} 
                        onClick={() => setSelectedPapers(prev => ({ ...prev, paper1: null }))}
                      />
                    </div>
                    <Text strong>{selectedPapers.paper1.title}</Text>
                    <Text type="secondary">Authors: {selectedPapers.paper1.authors.join(', ')}</Text>
                  </Space>
                </Card>
              )}

              {matchType === 'comparison' && selectedPapers.paper2 && (
                <Card style={{ marginBottom: '16px' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Title level={5}>Selected Paper 2</Title>
                      <Button 
                        type="text" 
                        icon={<CloseOutlined />} 
                        onClick={() => setSelectedPapers(prev => ({ ...prev, paper2: null }))}
                      />
                    </div>
                    <Text strong>{selectedPapers.paper2.title}</Text>
                    <Text type="secondary">Authors: {selectedPapers.paper2.authors.join(', ')}</Text>
                  </Space>
                </Card>
              )}
            </div>
          </Space>
        </Card>
        
        <div className="year-filter">
          <div className="filter-label">Filter by Year:</div>
          <div className="year-tabs">
            {years.map((year) => (
              <button
                key={year}
                className={`year-tab ${selectedYear === year ? 'active' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading papers...</div>
        ) : error ? (
          <div className="error">Error: {error}</div>
        ) : papers.length === 0 ? (
          <div className="no-results">No papers found for this subcategory and year.</div>
        ) : (
          <div className="papers-grid">
            {papers.map((paper) => (
              <PaperCard 
                key={paper.id || paper.arxivId} 
                paper={paper}
                showMatchButton={true}
                onSelectForMatch={(paperNumber) => {
                  if (matchType === 'single') {
                    setSelectedPapers({ paper1: paper, paper2: null });
                  } else {
                    if (paperNumber === 'paper1') {
                      setSelectedPapers(prev => ({ ...prev, paper1: paper }));
                    } else {
                      setSelectedPapers(prev => ({ ...prev, paper2: paper }));
                    }
                  }
                }}
                selectedForMatch={
                  paper.id === selectedPapers.paper1?.id || 
                  paper.id === selectedPapers.paper2?.id
                }
              />
            ))}
          </div>
        )}

        <Card 
          title={
            <Space>
              <TrophyOutlined />
              Recent Matches
            </Space>
          }
          style={{ marginBottom: '24px' }}
          loading={loadingMatches}
        >
          <List
            dataSource={recentMatches}
            renderItem={match => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    icon={<EyeOutlined />}
                    onClick={() => viewMatchDetails(match)}
                  >
                    View Details
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Link to={`/papers/${match.paper.id}`}>
                        {match.paper.title}
                      </Link>
                      {getStatusBadge(match.status)}
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

        <Modal
          title="Create Match"
          open={matchModalVisible}
          onCancel={() => setMatchModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            onFinish={handleCreateMatch}
            layout="vertical"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item
                name="agent1"
                label="First Agent"
                rules={[{ required: true, message: 'Please select the first agent' }]}
              >
                <Select placeholder="Select first agent">
                  {agents.map(agent => (
                    <Option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.provider})
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
                      {agent.name} ({agent.provider})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="judge"
                label="Judge Agent"
                rules={[{ required: true, message: 'Please select the judge agent' }]}
              >
                <Select placeholder="Select judge agent">
                  {agents.map(agent => (
                    <Option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.provider})
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
            </Space>
          </Form>
        </Modal>

        <Modal
          title="Match Details"
          open={viewMatchModalVisible}
          onCancel={() => {
            setViewMatchModalVisible(false);
            setSelectedMatch(null);
          }}
          footer={null}
          width={800}
        >
          {selectedMatch && (
            <MatchResults 
              match={selectedMatch}
              onFeedback={handleFeedback}
            />
          )}
        </Modal>

        {showResults && matchResults && (
          <MatchResults 
            match={matchResults}
            onFeedback={handleFeedback}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SubcategoryPage;