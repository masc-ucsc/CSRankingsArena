import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Alert,
    Radio,
    Tabs
} from 'antd';
import {
    PlusOutlined,
    FileTextOutlined,
    RobotOutlined,
    TrophyOutlined,
    WarningOutlined,
    SwapOutlined
} from '@ant-design/icons';
import axios from 'axios';
import MatchResults from '../components/competition/MatchResults';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const CategoryMatchPage = () => {
    const { categorySlug } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState([]);
    const [papers, setPapers] = useState([]);
    const [selectedPapers, setSelectedPapers] = useState({ paper1: null, paper2: null });
    const [matchModalVisible, setMatchModalVisible] = useState(false);
    const [creatingMatch, setCreatingMatch] = useState(false);
    const [matchType, setMatchType] = useState('single');
    const [matchResults, setMatchResults] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [agentConnectionError, setAgentConnectionError] = useState(null);
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        fetchAgents();
        fetchPapers();
        fetchRecentMatches();
    }, [categorySlug]);

    const fetchAgents = async () => {
        try {
            const response = await axios.get('/api/competition/agents');
            setAgents(response.data);
        } catch (error) {
            console.error('Error fetching agents:', error);
            message.error('Failed to load agents');
        }
    };

    const fetchPapers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/papers/category/${categorySlug}`);
            if (response.data && response.data.length > 0) {
                setPapers(response.data);
            } else {
                message.warning('No papers found for this category');
            }
        } catch (error) {
            console.error('Error fetching papers:', error);
            message.error('Failed to load papers');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentMatches = async () => {
        try {
            const response = await axios.get(`/api/competition/matches/recent?category=${categorySlug}`);
            if (response.data && response.data.length > 0) {
                setMatches(response.data);
            }
        } catch (error) {
            console.error('Error fetching recent matches:', error);
            message.warning('Failed to load recent matches');
        }
    };

    const generateDummyResults = (matchData) => {
        const dummyReview = (agentName, paperTitle) => ({
            content: `This is a placeholder review from ${agentName} for "${paperTitle}". The agent was unavailable to generate a real review.`,
            technical_score: 0,
            depth_score: 0,
            feedback_score: 0,
            clarity_score: 0,
            fairness_score: 0,
            overall_score: 0
        });

        const dummyEvaluation = (agentName) => ({
            technical_score: 0,
            depth_score: 0,
            feedback_score: 0,
            clarity_score: 0,
            fairness_score: 0,
            overall_score: 0,
            feedback: `Unable to evaluate ${agentName}'s review due to agent unavailability.`
        });

        return {
            id: Date.now(), // Temporary ID
            status: 'failed',
            created_at: new Date().toISOString(),
            paper1_title: matchData.paper1Id ? papers.find(p => p.id === matchData.paper1Id)?.title : papers.find(p => p.id === matchData.paperId)?.title,
            paper2_title: matchData.paper2Id ? papers.find(p => p.id === matchData.paper2Id)?.title : null,
            agent1_name: agents.find(a => a.id === matchData.agent1Id)?.name,
            agent2_name: agents.find(a => a.id === matchData.agent2Id)?.name,
            judge_name: agents.find(a => a.id === matchData.judgeId)?.name,
            reviews: [
                {
                    agent_id: matchData.agent1Id,
                    agent_name: agents.find(a => a.id === matchData.agent1Id)?.name,
                    ...dummyReview(agents.find(a => a.id === matchData.agent1Id)?.name, papers.find(p => p.id === (matchData.paper1Id || matchData.paperId))?.title),
                    evaluation: dummyEvaluation(agents.find(a => a.id === matchData.agent1Id)?.name)
                },
                {
                    agent_id: matchData.agent2Id,
                    agent_name: agents.find(a => a.id === matchData.agent2Id)?.name,
                    ...dummyReview(agents.find(a => a.id === matchData.agent2Id)?.name, papers.find(p => p.id === (matchData.paper2Id || matchData.paperId))?.title),
                    evaluation: dummyEvaluation(agents.find(a => a.id === matchData.agent2Id)?.name)
                }
            ],
            feedback: []
        };
    };

    const handleCreateMatch = async (values) => {
        setCreatingMatch(true);
        setAgentConnectionError(null);
        try {
            const matchData = {
                agent1Id: values.agent1,
                agent2Id: values.agent2,
                judgeId: values.judge,
                category: categorySlug
            };

            if (matchType === 'single') {
                matchData.paperId = selectedPapers.paper1.id;
            } else {
                matchData.paper1Id = selectedPapers.paper1.id;
                matchData.paper2Id = selectedPapers.paper2.id;
            }

            let agentConnectionFailed = false;
            // Check agent availability
            try {
                await Promise.all([
                    axios.get(`/api/competition/agents/${values.agent1}/status`),
                    axios.get(`/api/competition/agents/${values.agent2}/status`),
                    axios.get(`/api/competition/agents/${values.judge}/status`)
                ]);
            } catch (error) {
                agentConnectionFailed = true;
                setAgentConnectionError('One or more agents are currently unavailable. Displaying placeholder results.');
            }

            let matchDetails;
            if (agentConnectionFailed) {
                // Generate dummy results
                matchDetails = generateDummyResults(matchData);
                message.warning('Agents are unavailable. Displaying placeholder results.');
            } else {
                // Create real match
                const response = await axios.post('/api/competition/matches', matchData);
                matchDetails = await axios.get(`/api/competition/matches/${response.data.id}`);
                matchDetails = matchDetails.data;
                message.success('Match created successfully');
            }
            
            setMatchResults(matchDetails);
            setShowResults(true);
            setMatchModalVisible(false);
            form.resetFields();
            setSelectedPapers({ paper1: null, paper2: null });
            
            // Refresh recent matches
            await fetchRecentMatches();
        } catch (error) {
            console.error('Error creating match:', error);
            message.error('Failed to create match');
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
            <Text type="secondary">
                Authors: {paper.authors.join(', ')}
            </Text>
            <Divider />
            <Text>{paper.abstract}</Text>
        </Card>
    );

    const columns = [
        {
            title: 'Paper',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <Space>
                    <FileTextOutlined />
                    <a onClick={() => showMatchModal(record, 'paper1')}>{text}</a>
                </Space>
            )
        },
        {
            title: 'Authors',
            dataIndex: 'authors',
            key: 'authors',
            render: (authors) => authors.join(', ')
        },
        {
            title: 'Year',
            dataIndex: 'publishedYear',
            key: 'publishedYear',
            render: (year) => <Tag color="green">{year}</Tag>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => showMatchModal(record, 'paper1')}
                >
                    Select Paper
                </Button>
            )
        }
    ];

    const matchColumns = [
        {
            title: 'Papers',
            key: 'papers',
            render: (_, record) => (
                <Space direction="vertical">
                    <div>
                        <FileTextOutlined /> {record.paper1_title}
                    </div>
                    {record.paper2_title && (
                        <div>
                            <FileTextOutlined /> {record.paper2_title}
                        </div>
                    )}
                </Space>
            )
        },
        {
            title: 'Agents',
            key: 'agents',
            render: (_, record) => (
                <Space>
                    <Tag icon={<RobotOutlined />} color="blue">
                        {record.agent1_name}
                    </Tag>
                    <Tag icon={<RobotOutlined />} color="purple">
                        {record.agent2_name}
                    </Tag>
                </Space>
            )
        },
        {
            title: 'Judge',
            dataIndex: 'judge_name',
            key: 'judge_name',
            render: (text) => (
                <Tag icon={<TrophyOutlined />} color="gold">
                    {text}
                </Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusColors = {
                    'pending': 'orange',
                    'in_progress': 'processing',
                    'completed': 'success',
                    'failed': 'error'
                };
                return <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleString()
        }
    ];

    return (
        <div className="category-match-page" style={{ padding: '24px' }}>
            {agentConnectionError && (
                <Alert
                    message="Agent Connection Warning"
                    description={agentConnectionError}
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    style={{ marginBottom: '24px' }}
                />
            )}

            {showResults && matchResults ? (
                <Card style={{ marginBottom: '24px' }}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Title level={4}>Match Results</Title>
                            <Button onClick={() => setShowResults(false)}>Back to Creation</Button>
                        </div>
                        <div style={{ padding: '0 24px' }}>
                            <MatchResults 
                                match={{
                                    id: matchResults.id,
                                    status: matchResults.status,
                                    created_at: matchResults.created_at,
                                    agents: [
                                        {
                                            id: matchResults.agent1Id,
                                            name: matchResults.agent1_name,
                                            review: matchResults.reviews[0].content,
                                            evaluation: [
                                                { criterion: 'Technical Score', score: matchResults.reviews[0].technical_score, comment: 'Technical accuracy assessment' },
                                                { criterion: 'Depth Score', score: matchResults.reviews[0].depth_score, comment: 'Depth of analysis' },
                                                { criterion: 'Feedback Score', score: matchResults.reviews[0].feedback_score, comment: 'Quality of feedback' },
                                                { criterion: 'Clarity Score', score: matchResults.reviews[0].clarity_score, comment: 'Clarity of review' },
                                                { criterion: 'Fairness Score', score: matchResults.reviews[0].fairness_score, comment: 'Fairness in evaluation' }
                                            ]
                                        },
                                        {
                                            id: matchResults.agent2Id,
                                            name: matchResults.agent2_name,
                                            review: matchResults.reviews[1].content,
                                            evaluation: [
                                                { criterion: 'Technical Score', score: matchResults.reviews[1].technical_score, comment: 'Technical accuracy assessment' },
                                                { criterion: 'Depth Score', score: matchResults.reviews[1].depth_score, comment: 'Depth of analysis' },
                                                { criterion: 'Feedback Score', score: matchResults.reviews[1].feedback_score, comment: 'Quality of feedback' },
                                                { criterion: 'Clarity Score', score: matchResults.reviews[1].clarity_score, comment: 'Clarity of review' },
                                                { criterion: 'Fairness Score', score: matchResults.reviews[1].fairness_score, comment: 'Fairness in evaluation' }
                                            ]
                                        }
                                    ]
                                }}
                                onFeedback={async (feedback) => {
                                    try {
                                        await axios.post(`/api/competition/matches/${matchResults.id}/feedback`, feedback);
                                        message.success('Feedback submitted successfully');
                                        const updatedMatch = await axios.get(`/api/competition/matches/${matchResults.id}`);
                                        setMatchResults(updatedMatch.data);
                                    } catch (error) {
                                        console.error('Error submitting feedback:', error);
                                        message.error('Failed to submit feedback');
                                    }
                                }}
                            />
                        </div>
                    </Space>
                </Card>
            ) : (
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card>
                            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                <div>
                                    <Title level={2}>Create {categorySlug.toUpperCase()} Paper Match</Title>
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
                        <Card title="Available Papers">
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
                                        dataSource={papers}
                                        rowKey="id"
                                        loading={loading}
                                        pagination={{ pageSize: 10 }}
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
                                                                <a onClick={() => showMatchModal(record, 'paper2')}>{text}</a>
                                                            </Space>
                                                        );
                                                    }
                                                    if (col.key === 'action') {
                                                        return (
                                                            <Button
                                                                type="primary"
                                                                icon={<PlusOutlined />}
                                                                onClick={() => showMatchModal(record, 'paper2')}
                                                            >
                                                                Select Paper
                                                            </Button>
                                                        );
                                                    }
                                                    return col.render ? col.render(text, record) : text;
                                                }
                                            }))}
                                            dataSource={papers}
                                            rowKey="id"
                                            loading={loading}
                                            pagination={{ pageSize: 10 }}
                                        />
                                    </TabPane>
                                )}
                            </Tabs>
                        </Card>
                    </Col>

                    <Col span={24}>
                        <Card title="Recent Matches">
                            <Table
                                columns={matchColumns}
                                dataSource={matches}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 5 }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Modal
                title="Create New Match"
                open={matchModalVisible}
                onCancel={() => setMatchModalVisible(false)}
                footer={null}
                width={800}
            >
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
                                <Row gutter={24}>
                                    <Col span={8}>
                                        <Form.Item
                                            name="agent1"
                                            label="First Agent"
                                            rules={[{ required: true }]}
                                        >
                                            <Select placeholder="Select first agent">
                                                {agents.map(agent => (
                                                    <Option key={agent.id} value={agent.id}>
                                                        {agent.name} ({agent.provider})
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="agent2"
                                            label="Second Agent"
                                            rules={[{ required: true }]}
                                        >
                                            <Select placeholder="Select second agent">
                                                {agents.map(agent => (
                                                    <Option key={agent.id} value={agent.id}>
                                                        {agent.name} ({agent.provider})
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="judge"
                                            label="Judge Agent"
                                            rules={[{ required: true }]}
                                        >
                                            <Select placeholder="Select judge agent">
                                                {agents.map(agent => (
                                                    <Option key={agent.id} value={agent.id}>
                                                        {agent.name} ({agent.provider})
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item>
                                    <Space>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={creatingMatch}
                                            icon={<PlusOutlined />}
                                        >
                                            Create Match
                                        </Button>
                                        <Button onClick={() => setMatchModalVisible(false)}>
                                            Cancel
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        </Space>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default CategoryMatchPage; 