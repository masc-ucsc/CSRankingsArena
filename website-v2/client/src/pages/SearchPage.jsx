import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Input, Select, Space, Row, Col, Spin, Alert, Typography, Tag, Button } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { searchPapers } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
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
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const [availableYears] = useState(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i);
  });

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const filters = {
          category: selectedCategory,
          year: selectedYear,
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
  }, [query, selectedCategory, selectedYear, pagination.page]);

  const handleSearch = (value) => {
    setQuery(value);
    setSearchParams({ q: value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setSearchParams(prev => ({ ...prev, category: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
    setSearchParams(prev => ({ ...prev, year: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedYear('');
    setSearchParams({ q: query });
  };

  return (
    <div className="search-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Search Papers</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search papers by title, abstract, or authors..."
              allowClear
              enterButton={<SearchOutlined />}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Select Category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              allowClear
            >
              <Option value="machine-learning">Machine Learning</Option>
              <Option value="computer-vision">Computer Vision</Option>
              <Option value="natural-language-processing">Natural Language Processing</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space.Compact style={{ width: '100%' }}>
              <Select
                style={{ width: 'calc(100% - 40px)' }}
                placeholder="Select Year"
                value={selectedYear}
                onChange={handleYearChange}
                allowClear
              >
                {availableYears.map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={handleResetFilters}
                title="Reset filters"
              />
            </Space.Compact>
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
                    {paper.authors.join(', ')}
                  </Text>
                  <Text className="paper-abstract">{paper.abstract}</Text>
                  <Space wrap>
                    {paper.categories?.map(category => (
                      <Tag key={category} color="blue">{category}</Tag>
                    ))}
                    <Tag color="purple">{paper.publishedYear}</Tag>
                  </Space>
                </Card>
              ))}
            </Space>

            {results.length === 0 && query && (
              <Alert
                message="No results found"
                description="Try adjusting your search terms or filters"
                type="info"
                showIcon
              />
            )}
          </>
        )}
      </Space>
    </div>
  );
};

export default SearchPage;