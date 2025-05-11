import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Alert
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    TrophyOutlined,
    RobotOutlined,
    FileTextOutlined,
    SwapOutlined,
    WarningOutlined
} from '@ant-design/icons';
import axios from 'axios';
import MatchResults from './MatchResults';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

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
    const [matchType, setMatchType] = useState('single'); // 'single' or 'comparison'
    const [matchResults, setMatchResults] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [agentConnectionError, setAgentConnectionError] = useState(null);

    // Mock papers data
    const mockPapers = [
        {
            id: 'mock1',
            title: 'Attention Is All You Need',
            authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
            abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
            category: 'Machine Learning',
            year: 2017,
            venue: 'NeurIPS'
        },
        {
            id: 'mock2',
            title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
            authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
            abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
            category: 'Natural Language Processing',
            year: 2019,
            venue: 'NAACL'
        },
        {
            id: 'mock3',
            title: 'Deep Learning',
            authors: ['Yann LeCun', 'Yoshua Bengio', 'Geoffrey Hinton'],
            abstract: 'Deep learning allows computational models that are composed of multiple processing layers to learn representations of data with multiple levels of abstraction. These methods have dramatically improved the state-of-the-art in speech recognition, visual object recognition, object detection and many other domains such as drug discovery and genomics.',
            category: 'Deep Learning',
            year: 2015,
            venue: 'Nature'
        },
        {
            id: 'mock4',
            title: 'Generative Adversarial Nets',
            authors: ['Ian Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu', 'David Warde-Farley', 'Sherjil Ozair', 'Aaron Courville', 'Yoshua Bengio'],
            abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G.',
            category: 'Machine Learning',
            year: 2014,
            venue: 'NeurIPS'
        },
        {
            id: 'mock5',
            title: 'ResNet: Deep Residual Learning for Image Recognition',
            authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
            abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions.',
            category: 'Computer Vision',
            year: 2016,
            venue: 'CVPR'
        }
    ];

    // Mock agents data
    const mockAgents = [
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

    // Fetch agents and papers on component mount
    useEffect(() => {
        fetchAgents();
        fetchPapers();
        fetchRecentMatches();
    }, []);

    const fetchAgents = async () => {
        try {
            const response = await axios.get('/api/competition/agents');
            setAgents(response.data);
        } catch (error) {
            console.error('Error fetching agents:', error);
            message.warning('Using mock agents data');
            setAgents(mockAgents);
        }
    };

    const fetchPapers = async () => {
        try {
            const response = await axios.get('/api/papers/recent');
            if (response.data && response.data.length > 0) {
                setPapers(response.data);
            } else {
                throw new Error('No papers available');
            }
        } catch (error) {
            console.error('Error fetching papers:', error);
            message.warning('Using mock papers data');
            setPapers(mockPapers);
        }
    };

    const fetchRecentMatches = async () => {
        try {
            const response = await axios.get('/api/competition/matches/recent');
            if (response.data && response.data.length > 0) {
                setMatches(response.data);
            } else {
                // Mock recent matches
                setMatches([
                    {
                        id: 'match1',
                        paper1_title: 'Attention Is All You Need',
                        paper2_title: 'BERT: Pre-training of Deep Bidirectional Transformers',
                        agent1_name: 'GPT-4',
                        agent2_name: 'Claude',
                        judge_name: 'GPT-3.5',
                        status: 'completed',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'match2',
                        paper1_title: 'Deep Learning',
                        agent1_name: 'Claude',
                        agent2_name: 'GPT-3.5',
                        judge_name: 'GPT-4',
                        status: 'in_progress',
                        created_at: new Date(Date.now() - 3600000).toISOString()
                    }
                ]);
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
            message.warning('Using mock matches data');
            // Set mock matches as above
            setMatches([
                {
                    id: 'match1',
                    paper1_title: 'Attention Is All You Need',
                    paper2_title: 'BERT: Pre-training of Deep Bidirectional Transformers',
                    agent1_name: 'GPT-4',
                    agent2_name: 'Claude',
                    judge_name: 'GPT-3.5',
                    status: 'completed',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'match2',
                    paper1_title: 'Deep Learning',
                    agent1_name: 'Claude',
                    agent2_name: 'GPT-3.5',
                    judge_name: 'GPT-4',
                    status: 'in_progress',
                    created_at: new Date(Date.now() - 3600000).toISOString()
                }
            ]);
        }
    };

    const handleCreateMatch = async (values) => {
        setCreatingMatch(true);
        setAgentConnectionError(null);
        try {
            const matchData = {
                agent1Id: values.agent1,
                agent2Id: values.agent2,
                judgeId: values.judge
            };

            if (matchType === 'single') {
                matchData.paperId = selectedPapers.paper1.id;
            } else {
                matchData.paper1Id = selectedPapers.paper1.id;
                matchData.paper2Id = selectedPapers.paper2.id;
            }

            // First check if agents are available
            try {
                console.log(values.agent1, values.agent2, values.judge);
                await Promise.all([
                    axios.get(`/api/competition/agents/${values.agent1}/status`),
                    axios.get(`/api/competition/agents/${values.agent2}/status`),
                    axios.get(`/api/competition/agents/${values.judge}/status`)
                ]);
            } catch (error) {
                setAgentConnectionError('One or more agents are currently unavailable. The match will be created but may take longer to complete.');
            }

            const response = await axios.post('/api/competition/matches', matchData);
            
            // Get the full match data including results
            const matchDetails = await axios.get(`/api/competition/matches/${response.data.id}`);
            
            setMatchResults(matchDetails.data);
            setShowResults(true);
            setMatchModalVisible(false);
            form.resetFields();
            setSelectedPapers({ paper1: null, paper2: null });
            fetchRecentMatches();
            
            if (!agentConnectionError) {
                message.success('Match created successfully');
            } else {
                message.warning(agentConnectionError);
            }
        } catch (error) {
            console.error('Error creating match:', error);
            if (error.response?.status === 503) {
                message.error('One or more agents are currently unavailable. Please try again later.');
            } else {
                message.error('Failed to create match');
            }
        } finally {
            setCreatingMatch(false);
        }
    };

    const showMatchModal = (paper, paperNumber) => {
        setSelectedPapers(prev => ({
            ...prev,
            [paperNumber]: paper
        }));
        
        // If both papers are selected or it's a single paper match, show the modal
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
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category) => <Tag color="blue">{category}</Tag>
        },
        {
            title: 'Year',
            dataIndex: 'year',
            key: 'year',
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
        <div className="create-match-page" style={{ padding: '24px' }}>
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
                        <MatchResults 
                            match={matchResults}
                            onFeedback={async (feedback) => {
                                try {
                                    await axios.post(`/api/competition/matches/${matchResults.id}/feedback`, feedback);
                                    message.success('Feedback submitted successfully');
                                    // Refresh match results to show updated feedback
                                    const updatedMatch = await axios.get(`/api/competition/matches/${matchResults.id}`);
                                    setMatchResults(updatedMatch.data);
                                } catch (error) {
                                    console.error('Error submitting feedback:', error);
                                    message.error('Failed to submit feedback');
                                }
                            }}
                        />
                    </Space>
                </Card>
            ) : (
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

export default CreateMatch; 