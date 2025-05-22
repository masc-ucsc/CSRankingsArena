import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Input, Space, Row, Col, Spin, Alert, Typography, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchPapers } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const { Title, Text } = Typography;
const { Search } = Input;

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

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const filters = {
          type: 'title',
          page: pagination.page,
          limit: pagination.limit
        };
        
        const response = await searchPapers(query, filters);
        setResults(response.papers);
        setPagination(response.pagination);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to perform search. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, pagination.page]);

  const handleSearch = (value) => {
    setQuery(value);
    setSearchParams({ q: value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="search-page">
      <Header />
      <main className="container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Title level={2}>Search Papers</Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16} style={{ margin: '0 auto' }}>
              <Search
                placeholder="Search by title..."
                allowClear
                enterButton={<SearchOutlined />}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

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
            <>
              <div style={{ marginBottom: '16px' }}>
                <Text>
                  Found {pagination.total} results
                  {query && ` for "${query}"`}
                </Text>
              </div>

              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {results.map(paper => (
                  <Card key={paper.id} className="paper-card">
                    <Title level={4}>
                      <a href={paper.url} target="_blank" rel="noopener noreferrer">
                        {paper.title}
                      </a>
                    </Title>
                    <Text type="secondary" className="paper-authors">
                      {Array.isArray(paper.authors) ? paper.authors.join(', ') : 'No authors listed'}
                    </Text>
                    <Text className="paper-abstract">{paper.abstract}</Text>
                    <Space wrap>
                      {paper.categories?.map(category => (
                        <Tag key={category} color="blue">{category}</Tag>
                      ))}
                      <Tag color="purple">{paper.year}</Tag>
                    </Space>
                  </Card>
                ))}
              </Space>

              {results.length === 0 && query && (
                <Alert
                  message="No results found"
                  description="Try adjusting your search terms"
                  type="info"
                  showIcon
                />
              )}
            </>
          )}
        </Space>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;