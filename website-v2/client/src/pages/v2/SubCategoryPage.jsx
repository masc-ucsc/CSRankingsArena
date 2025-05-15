import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { 
  fetchPapers, 
  fetchVenues, 
  fetchAgents, 
  createMatch, 
  fetchRecentMatches,
  submitMatchFeedback 
} from '../../services/v2/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PaperCard from '../../components/PaperCard';
import MatchResults from '../../components/competition/MatchResults';
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
  Input,
  DatePicker,
  Spin,
  Result
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
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

const SubCategoryPageV2 = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const { categories } = useAppContext();
  const [form] = Form.useForm();
  
  // Loading states
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  
  // Data states
  const [papers, setPapers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [agents, setAgents] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchText, setSearchText] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedMatchStatus, setSelectedMatchStatus] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  
  // Match creation states
  const [selectedPapers, setSelectedPapers] = useState({ paper1: null, paper2: null });
  const [matchType, setMatchType] = useState('single');
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState({
    agent1: null,
    agent2: null,
    judge: null
  });
  
  // Match results states
  const [matchResults, setMatchResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [viewMatchModalVisible, setViewMatchModalVisible] = useState(false);

  // Find category and subcategory
  const category = categories?.find((cat) => cat.slug === categorySlug);
  const subcategory = category?.subcategories?.find((sub) => sub.slug === subcategorySlug);

  // Check if category and subcategory exist
  const categoryNotFound = !loadingCategories && !category;
  const subcategoryNotFound = !loadingCategories && category && !subcategory;

  useEffect(() => {
    if (categories) {
      setLoadingCategories(false);
    }
  }, [categories]);

  useEffect(() => {
    const loadData = async () => {
      if (categoryNotFound || subcategoryNotFound || !category || !subcategory) return;
      
      try {
        setLoading(true);
        const [papersData, venuesData, agentsData] = await Promise.all([
          fetchPapers(categorySlug, subcategorySlug, selectedYear),
          fetchVenues(categorySlug, subcategorySlug, selectedYear),
          fetchAgents()
        ]);
        
        setPapers(papersData);
        setVenues(venuesData);
        setAgents(agentsData.agents || []);
        
        await fetchRecentMatches();
      } catch (err) {
        setError(err.message);
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [categorySlug, subcategorySlug, selectedYear, category, subcategory, categoryNotFound, subcategoryNotFound]);

  const fetchRecentMatches = async () => {
    setLoadingMatches(true);
    try {
      const matches = await fetchRecentMatches(categorySlug, subcategorySlug);
      setRecentMatches(matches);
    } catch (error) {
      console.error('Error fetching recent matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedPapers.paper1 || !selectedAgents.agent1 || !selectedAgents.agent2 || !selectedAgents.judge) {
      message.error('Please select all required papers and agents');
      return;
    }

    setCreatingMatch(true);
    try {
      const matchData = {
        agent1Id: selectedAgents.agent1,
        agent2Id: selectedAgents.agent2,
        judgeId: selectedAgents.judge,
        category: categorySlug,
        subcategory: subcategorySlug,
        year: selectedYear,
        matchType
      };

      if (matchType === 'single') {
        matchData.paperId = selectedPapers.paper1.id;
      } else {
        matchData.paper1Id = selectedPapers.paper1.id;
        matchData.paper2Id = selectedPapers.paper2.id;
      }

      const match = await createMatch(matchData);
      setMatchResults(match);
      setShowResults(true);
      message.success('Match created successfully');
      
      // Reset form and close modal
      form.resetFields();
      setSelectedPapers({ paper1: null, paper2: null });
      setSelectedAgents({ agent1: null, agent2: null, judge: null });
      setMatchModalVisible(false);
      
      // Refresh recent matches
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
      const updatedMatch = await submitMatchFeedback(matchResults.id, feedback);
      message.success('Feedback submitted successfully');
      setMatchResults(updatedMatch);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback');
    }
  };

  const handlePaperSelection = (paper, paperNumber) => {
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

  const handleAgentSelection = (agentId, agentType) => {
    setSelectedAgents(prev => ({
      ...prev,
      [agentType]: agentId
    }));
  };

  const filteredPapers = papers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchText.toLowerCase()) ||
                        paper.abstract.toLowerCase().includes(searchText.toLowerCase());
    const matchesYear = !selectedYear || paper.year === selectedYear;
    const matchesVenue = !selectedVenue || paper.venue === selectedVenue;
    return matchesSearch && matchesYear && matchesVenue;
  });

  const filteredMatches = recentMatches.filter(match => {
    const matchesStatus = !selectedMatchStatus || match.status === selectedMatchStatus;
    const matchesAgent = !selectedAgent || 
      match.agents.some(agent => agent.id === selectedAgent);
    return matchesStatus && matchesAgent;
  });

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedYear(new Date().getFullYear());
    setSelectedVenue('');
    setSelectedMatchStatus('');
    setSelectedAgent('');
  };

  const renderPaperList = () => (
    <div className="papers-grid">
      {filteredPapers.map((paper) => (
        <PaperCard 
          key={paper.id} 
          paper={paper}
          showMatchButton={true}
          onSelectForMatch={(paperNumber) => handlePaperSelection(paper, paperNumber)}
          selectedForMatch={
            paper.id === selectedPapers.paper1?.id || 
            paper.id === selectedPapers.paper2?.id
          }
        />
      ))}
    </div>
  );

  const renderMatchCreationModal = () => (
    <Modal
      title="Create Match"
      open={matchModalVisible}
      onCancel={() => setMatchModalVisible(false)}
      footer={null}
      width={800}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Selected Papers</Title>
          {selectedPapers.paper1 && (
            <Card style={{ marginBottom: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={5}>Paper 1</Title>
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
                  <Title level={5}>Paper 2</Title>
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

          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <Button
              type="primary"
              onClick={handleCreateMatch}
              loading={creatingMatch}
              disabled={!selectedPapers.paper1 || !selectedAgents.agent1 || !selectedAgents.agent2 || !selectedAgents.judge}
            >
              Create Match
            </Button>
          </div>
        </Form>
      </Space>
    </Modal>
  );

  const renderRecentMatches = () => (
    <Card 
      title={
        <Space>
          <TrophyOutlined />
          Recent Matches
          <Button 
            type="link" 
            icon={<ReloadOutlined />} 
            onClick={fetchRecentMatches}
            loading={loadingMatches}
          >
            Refresh
          </Button>
        </Space>
      }
      style={{ marginTop: '24px' }}
      loading={loadingMatches}
    >
      <List
        dataSource={filteredMatches}
        renderItem={match => (
          <List.Item
            actions={[
              <Link to={`/matches/${match.id}`}>
                <Button type="primary" icon={<EyeOutlined />}>
                  View Details
                </Button>
              </Link>
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>Match #{match.id.split('-').pop()}</Text>
                  <Badge 
                    status={match.status === 'completed' ? 'success' : 'processing'} 
                    text={match.status === 'completed' ? 'Completed' : 'In Progress'} 
                  />
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Space>
                    <Tag color="blue">{match.category}</Tag>
                    <Tag color="green">{match.subcategory}</Tag>
                    <Tag color="purple">{match.year}</Tag>
                  </Space>
                  <Space>
                    <Text strong>Paper 1:</Text>
                    <Link to={`/papers/${match.paperIds[0]}`}>
                      {match.reviews[0].paperId}
                    </Link>
                    <Text type="secondary">vs</Text>
                    <Text strong>Paper 2:</Text>
                    <Link to={`/papers/${match.paperIds[1]}`}>
                      {match.reviews[1].paperId}
                    </Link>
                  </Space>
                  {match.status === 'completed' && match.comparison.winner && (
                    <Space>
                      <Text type="secondary">Winner:</Text>
                      <Tag color="gold">
                        <TrophyOutlined /> Paper {match.comparison.winner === match.paperIds[0] ? '1' : '2'}
                      </Tag>
                    </Space>
                  )}
                  <Space>
                    <Text type="secondary">Reviewers:</Text>
                    <Tag color="blue">{match.reviews[0].reviewer.name}</Tag>
                    <Text type="secondary">vs</Text>
                    <Tag color="green">{match.reviews[1].reviewer.name}</Tag>
                  </Space>
                  <Text type="secondary">
                    Created {new Date(match.createdAt).toLocaleDateString()}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
        locale={{
          emptyText: 'No matches found for this subcategory'
        }}
      />
    </Card>
  );

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

        <Card style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4}>Filters</Title>
              <Button 
                type="link" 
                onClick={handleResetFilters}
                icon={<FilterOutlined />}
              >
                Reset Filters
              </Button>
            </div>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="Search papers..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select Year"
                  value={selectedYear}
                  onChange={setSelectedYear}
                  allowClear
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select Venue"
                  value={selectedVenue}
                  onChange={setSelectedVenue}
                  allowClear
                >
                  {venues.map(venue => (
                    <Option key={venue} value={venue}>{venue}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Match Status"
                  value={selectedMatchStatus}
                  onChange={setSelectedMatchStatus}
                  allowClear
                >
                  <Option value="completed">Completed</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="pending">Pending</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Filter by Agent"
                  value={selectedAgent}
                  onChange={setSelectedAgent}
                  allowClear
                >
                  {agents.map(agent => (
                    <Option key={agent.id} value={agent.id}>
                      <Space>
                        <RobotOutlined />
                        <span>{agent.name}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Space>
        </Card>

        <Card style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={3}>Create AI Review Match</Title>
              <Text type="secondary">
                Select papers and choose AI agents to compete in reviewing them.
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

        <Card style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {loading ? (
              <div>Loading papers...</div>
            ) : error ? (
              <div>Error: {error}</div>
            ) : papers.length === 0 ? (
              <div>No papers found for this subcategory and year.</div>
            ) : (
              renderPaperList()
            )}
          </Space>
        </Card>

        {renderRecentMatches()}

        {renderMatchCreationModal()}

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

export default SubCategoryPageV2; 