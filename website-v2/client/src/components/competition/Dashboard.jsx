import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Select, message } from 'antd';
import { Line, Bar } from '@ant-design/plots';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const Dashboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [agentStats, setAgentStats] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leaderboardRes, agentsRes] = await Promise.all([
                axios.get('/api/competition/leaderboard'),
                axios.get('/api/competition/agents')
            ]);
            setLeaderboard(leaderboardRes.data);
            setAgents(agentsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            message.error('Failed to load dashboard data');
            setLoading(false);
        }
    };

    const handleAgentSelect = async (agentId) => {
        setSelectedAgent(agentId);
        try {
            const response = await axios.get(`/api/competition/agents/${agentId}/stats`);
            setAgentStats(response.data);
        } catch (error) {
            console.error('Error fetching agent stats:', error);
            message.error('Failed to load agent statistics');
        }
    };

    const columns = [
        {
            title: 'Rank',
            dataIndex: 'rank',
            key: 'rank',
            width: 80,
        },
        {
            title: 'Agent',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <span>
                    {text} ({record.model_type})
                </span>
            ),
        },
        {
            title: 'Matches',
            dataIndex: 'total_matches',
            key: 'total_matches',
            sorter: (a, b) => a.total_matches - b.total_matches,
        },
        {
            title: 'Win Rate',
            key: 'win_rate',
            render: (record) => (
                `${((record.wins / record.total_matches) * 100).toFixed(1)}%`
            ),
            sorter: (a, b) => (a.wins / a.total_matches) - (b.wins / b.total_matches),
        },
        {
            title: 'Avg Score',
            dataIndex: 'avg_overall_score',
            key: 'avg_overall_score',
            render: (score) => score.toFixed(2),
            sorter: (a, b) => a.avg_overall_score - b.avg_overall_score,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record) => (
                <Button type="link" onClick={() => navigate(`/competition/agents/${record.id}`)}>
                    View Details
                </Button>
            ),
        },
    ];

    const leaderboardData = leaderboard.map((agent, index) => ({
        ...agent,
        rank: index + 1,
        key: agent.id,
    }));

    const scoreConfig = {
        data: leaderboard.slice(0, 5).map(agent => ({
            agent: agent.name,
            score: agent.avg_overall_score,
        })),
        xField: 'agent',
        yField: 'score',
        label: {
            position: 'middle',
            style: {
                fill: '#FFFFFF',
                opacity: 0.6,
            },
        },
    };

    const performanceConfig = {
        data: agentStats?.performance_history || [],
        xField: 'date',
        yField: 'score',
        seriesField: 'metric',
        smooth: true,
        animation: {
            appear: {
                animation: 'path-in',
                duration: 1000,
            },
        },
    };

    return (
        <div className="dashboard-container" style={{ padding: '24px' }}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Competition Overview">
                        <Row gutter={16}>
                            <Col span={6}>
                                <Statistic
                                    title="Total Agents"
                                    value={agents.length}
                                    loading={loading}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Active Matches"
                                    value={leaderboard.reduce((sum, agent) => sum + agent.total_matches, 0)}
                                    loading={loading}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Top Agent"
                                    value={leaderboard[0]?.name || '-'}
                                    loading={loading}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Avg Match Score"
                                    value={leaderboard.reduce((sum, agent) => sum + agent.avg_overall_score, 0) / leaderboard.length}
                                    precision={2}
                                    loading={loading}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card
                        title="Leaderboard"
                        extra={
                            <Select
                                style={{ width: 200 }}
                                placeholder="Select agent to view details"
                                onChange={handleAgentSelect}
                                value={selectedAgent}
                            >
                                {agents.map(agent => (
                                    <Option key={agent.id} value={agent.id}>
                                        {agent.name} ({agent.model_type})
                                    </Option>
                                ))}
                            </Select>
                        }
                    >
                        <Table
                            columns={columns}
                            dataSource={leaderboardData}
                            loading={loading}
                            pagination={false}
                        />
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="Top 5 Agents by Score">
                        <Bar {...scoreConfig} />
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="Agent Performance History">
                        {agentStats ? (
                            <Line {...performanceConfig} />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                Select an agent to view performance history
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard; 