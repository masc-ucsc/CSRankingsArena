import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Input, Space, Row, Col, Spin, Alert, Typography, Tag, Select, Tabs, Table, Collapse, Timeline, Divider } from 'antd';
import { SearchOutlined, TrophyOutlined, CloseCircleOutlined, DownOutlined, TrophyFilled, FireFilled } from '@ant-design/icons';
import { searchPapers } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });

  // Search state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'all');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const filters = {
          type: searchType,
          page: pagination.page,
          limit: pagination.limit,
          year: selectedYear
        };
        
        console.log('Performing search with filters:', filters);
        const response = await searchPapers(query, filters);
        console.log('Search response:', response);
        
        if (response && response.papers) {
          setResults(response.papers);
          setPagination(response.pagination);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to perform search. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, searchType, selectedYear, pagination.page, pagination.limit]);

  const handleSearch = (value) => {
    setQuery(value);
    setSearchParams({ q: value, type: searchType, year: selectedYear });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTypeChange = (value) => {
    setSearchType(value);
    setSearchParams({ q: query, type: value, year: selectedYear });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
    setSearchParams({ q: query, type: searchType, year: value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTableChange = (pagination) => {
    setPagination(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize
    }));
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical">
          <a href={record.url} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
          <Space>
            <Tag color="blue">{record.category}</Tag>
            <Tag color="green">{record.subcategory}</Tag>
            <Tag color="purple">{record.year}</Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Authors',
      dataIndex: 'authors',
      key: 'authors',
      render: (authors) => authors?.join(', ') || 'No authors listed',
    },
    {
      title: 'Leaderboard Stats',
      key: 'leaderboard',
      render: (_, record) => {
        if (!record.leaderboard) {
          return <Text type="secondary">No leaderboard data available</Text>;
        }
        return (
          <Card size="small" style={{ width: 300 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <Text strong>Rank #{record.leaderboard.rank}</Text>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <FireFilled style={{ color: '#ff4d4f' }} />
                    <Text strong>{record.leaderboard.score?.toFixed(2) || '0.00'}</Text>
                  </Space>
                </Col>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row align="middle" justify="space-between">
                <Col>
                  <Text type="secondary">Matches</Text>
                  <div><Text strong>{record.leaderboard.matches || 0}</Text></div>
                </Col>
                <Col>
                  <Text type="secondary">Wins</Text>
                  <div><Text strong>{record.leaderboard.wins || 0}</Text></div>
                </Col>
                <Col>
                  <Text type="secondary">Win Rate</Text>
                  <div>
                    <Text strong style={{ color: record.leaderboard.winRate >= 0.5 ? '#52c41a' : '#ff4d4f' }}>
                      {((record.leaderboard.winRate || 0) * 100).toFixed(1)}%
                    </Text>
                  </div>
                </Col>
              </Row>
            </Space>
          </Card>
        );
      },
    }
  ];

  return (
    <div className="search-page">
      <Header />
      <div className="container" style={{ padding: '24px' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={2}>Search Papers</Title>
            
            <Space>
              <Search
                placeholder="Search papers..."
                allowClear
                enterButton="Search"
                size="large"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 400 }}
              />
              
              <Select
                value={searchType}
                onChange={handleTypeChange}
                style={{ width: 120 }}
              >
                <Option value="all">All</Option>
                <Option value="title">Title</Option>
                <Option value="author">Author</Option>
                <Option value="abstract">Abstract</Option>
              </Select>

              <Select
                value={selectedYear}
                onChange={handleYearChange}
                style={{ width: 120 }}
                placeholder="Filter by year"
                allowClear
              >
                <Option value="">All Years</Option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <Option key={year} value={year.toString()}>{year}</Option>
                ))}
              </Select>
            </Space>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Searching papers...</div>
              </div>
            ) : error ? (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
              />
            ) : (
              <Table
                columns={columns}
                dataSource={results}
                rowKey="id"
                pagination={{
                  current: pagination.page,
                  pageSize: pagination.limit,
                  total: pagination.total,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} papers`
                }}
                onChange={handleTableChange}
                expandable={{
                  expandedRowRender: (record) => {
                    if (!record.leaderboard?.matchDetails) {
                      return <Text type="secondary">No match details available</Text>;
                    }
                    return (
                      <Table
                        columns={[
                          {
                            title: 'Opponent',
                            dataIndex: ['opponent', 'title'],
                            key: 'opponent',
                          },
                          {
                            title: 'Result',
                            dataIndex: 'result',
                            key: 'result',
                            render: (result) => (
                              <Tag color={
                                result === 'win' ? 'green' :
                                result === 'loss' ? 'red' : 'orange'
                              }>
                                {result.toUpperCase()}
                              </Tag>
                            ),
                          },
                          {
                            title: 'Score',
                            dataIndex: 'score',
                            key: 'score',
                            render: (score) => score?.toFixed(2) || '0.00',
                          },
                          {
                            title: 'Date',
                            dataIndex: 'date',
                            key: 'date',
                            render: (date) => new Date(date).toLocaleDateString(),
                          },
                        ]}
                        dataSource={record.leaderboard.matchDetails}
                        pagination={false}
                        size="small"
                      />
                    );
                  },
                }}
              />
            )}
          </Space>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;