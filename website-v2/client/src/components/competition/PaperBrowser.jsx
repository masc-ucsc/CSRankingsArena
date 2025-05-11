import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Select, Button, Space, Tag, Modal, message, Divider } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { Search } = Input;

const PaperBrowser = () => {
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [agents, setAgents] = useState([]);
    const [selectedAgents, setSelectedAgents] = useState({
        agent1: null,
        agent2: null,
        judge: null
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchInitialData();
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
        try {
            const [papersRes, categoriesRes, agentsRes] = await Promise.all([
                axios.get('/api/papers'),
                axios.get('/api/categories'),
                axios.get('/api/competition/agents')
            ]);
            setPapers(papersRes.data);
            setCategories(categoriesRes.data);
            setAgents(agentsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            message.error('Failed to load data');
            setLoading(false);
        }
    };

    const fetchSubcategories = async (categoryId) => {
        try {
            const response = await axios.get(`/api/categories/${categoryId}/subcategories`);
            setSubcategories(response.data);
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            message.error('Failed to load subcategories');
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
    };

    const handleSubcategoryChange = (value) => {
        setSelectedSubcategory(value);
    };

    const handleCreateMatch = async () => {
        if (!selectedAgents.agent1 || !selectedAgents.agent2 || !selectedAgents.judge) {
            message.error('Please select all required agents');
            return;
        }

        try {
            const response = await axios.post('/api/competition/matches', {
                paperId: selectedPaper.id,
                agent1Id: selectedAgents.agent1,
                agent2Id: selectedAgents.agent2,
                judgeId: selectedAgents.judge
            });
            message.success('Match created successfully');
            setShowMatchModal(false);
            navigate(`/competition/matches/${response.data.id}`);
        } catch (error) {
            console.error('Error creating match:', error);
            message.error('Failed to create match');
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <a onClick={() => {
                    setSelectedPaper(record);
                    setShowMatchModal(true);
                }}>
                    {text}
                </a>
            ),
        },
        {
            title: 'Authors',
            dataIndex: 'authors',
            key: 'authors',
            render: (authors) => (
                <Space>
                    {authors.map(author => (
                        <Tag key={author.id}>{author.name}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Categories',
            dataIndex: 'categories',
            key: 'categories',
            render: (categories) => (
                <Space>
                    {categories.map(category => (
                        <Tag key={category.id} color={category.color}>
                            {category.name}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Published',
            dataIndex: 'published_year',
            key: 'published_year',
            sorter: (a, b) => a.published_year - b.published_year,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                            setSelectedPaper(record);
                            setShowMatchModal(true);
                        }}
                    >
                        Create Match
                    </Button>
                    <Button
                        size="small"
                        onClick={() => window.open(record.url, '_blank')}
                    >
                        View Paper
                    </Button>
                </Space>
            ),
        },
    ];

    const filteredPapers = papers.filter(paper => {
        const matchesSearch = paper.title.toLowerCase().includes(searchText.toLowerCase()) ||
                            paper.abstract.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = !selectedCategory || paper.categories.some(c => c.id === selectedCategory);
        const matchesSubcategory = !selectedSubcategory || paper.subcategories.some(s => s.id === selectedSubcategory);
        return matchesSearch && matchesCategory && matchesSubcategory;
    });

    return (
        <div className="paper-browser" style={{ padding: '24px' }}>
            <Card>
                <Space style={{ marginBottom: '16px' }} size="large">
                    <Search
                        placeholder="Search papers..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                    />
                    <Select
                        placeholder="Select category"
                        style={{ width: 200 }}
                        onChange={handleCategoryChange}
                        value={selectedCategory}
                        allowClear
                    >
                        {categories.map(category => (
                            <Option key={category.id} value={category.id}>
                                {category.name}
                            </Option>
                        ))}
                    </Select>
                    <Select
                        placeholder="Select subcategory"
                        style={{ width: 200 }}
                        onChange={handleSubcategoryChange}
                        value={selectedSubcategory}
                        disabled={!selectedCategory}
                        allowClear
                    >
                        {subcategories.map(subcategory => (
                            <Option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                            </Option>
                        ))}
                    </Select>
                </Space>

                <Table
                    columns={columns}
                    dataSource={filteredPapers}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} papers`
                    }}
                />
            </Card>

            <Modal
                title="Create New Match"
                open={showMatchModal}
                onOk={handleCreateMatch}
                onCancel={() => setShowMatchModal(false)}
                width={600}
            >
                {selectedPaper && (
                    <div>
                        <h3>{selectedPaper.title}</h3>
                        <p>{selectedPaper.abstract}</p>
                        <Divider />
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Select
                                placeholder="Select first agent"
                                style={{ width: '100%' }}
                                onChange={(value) => setSelectedAgents(prev => ({ ...prev, agent1: value }))}
                                value={selectedAgents.agent1}
                            >
                                {agents.map(agent => (
                                    <Option key={agent.id} value={agent.id}>
                                        {agent.name} ({agent.model_type})
                                    </Option>
                                ))}
                            </Select>
                            <Select
                                placeholder="Select second agent"
                                style={{ width: '100%' }}
                                onChange={(value) => setSelectedAgents(prev => ({ ...prev, agent2: value }))}
                                value={selectedAgents.agent2}
                            >
                                {agents.map(agent => (
                                    <Option key={agent.id} value={agent.id}>
                                        {agent.name} ({agent.model_type})
                                    </Option>
                                ))}
                            </Select>
                            <Select
                                placeholder="Select judge agent"
                                style={{ width: '100%' }}
                                onChange={(value) => setSelectedAgents(prev => ({ ...prev, judge: value }))}
                                value={selectedAgents.judge}
                            >
                                {agents.map(agent => (
                                    <Option key={agent.id} value={agent.id}>
                                        {agent.name} ({agent.model_type})
                                    </Option>
                                ))}
                            </Select>
                        </Space>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PaperBrowser; 