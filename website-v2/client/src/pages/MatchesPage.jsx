import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import RecentMatches from '../components/dashboard/RecentMatches';
import { getMatches, getPapers } from '../services/api';

const MatchesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get params from URL or defaults
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [agentId, setAgentId] = useState(searchParams.get('agent') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [topics, setTopics] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    // Fetch topics for filter
    const fetchTopics = async () => {
      try {
        const { papersByTopic } = await getPapers({ limit: 0 });
        setTopics(Object.keys(papersByTopic || {}));
      } catch (err) {
        console.error('Error fetching topics:', err);
      }
    };
    
    fetchTopics();
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        
        // Build query params
        const params = { page, limit: 10 };
        if (status) params.status = status;
        if (topic) params.topic = topic;
        if (agentId) params.agent = agentId;
        
        const data = await getMatches(params);
        
        setMatches(data.matches || []);
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError(err.message || 'Failed to load matches');
        setLoading(false);
      }
    };
    
    fetchMatches();
    
    // Update URL params
    const params = {};
    if (status) params.status = status;
    if (topic) params.topic = topic;
    if (agentId) params.agent = agentId;
    if (page > 1) params.page = page.toString();
    
    setSearchParams(params);
    
  }, [status, topic, agentId, page, setSearchParams]);

  const handleFilter = (e) => {
    e.preventDefault();
    // Reset to page 1 when filtering
    setPage(1);
  };

  const handleReset = () => {
    setStatus('');
    setTopic('');
    setAgentId('');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Matches</h1>
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Filter Matches</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleFilter}>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="error">Error</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Topic</Form.Label>
                  <Form.Select 
                    value={topic} 
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option value="">All Topics</option>
                    {topics.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Agent ID</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="Filter by Agent ID" 
                    value={agentId} 
                    onChange={(e) => setAgentId(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex gap-2 mt-3">
              <Button type="submit" variant="primary">Apply Filters</Button>
              <Button type="button" variant="outline-secondary" onClick={handleReset}>Reset</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      ) : (
        <>
          <RecentMatches matches={matches} />
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <ul className="pagination">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </button>
                </li>
                
                {[...Array(pagination.totalPages).keys()].map(i => {
                  const pageNum = i + 1;
                  // Show limited page numbers with ellipsis
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <li 
                        key={pageNum} 
                        className={`page-item ${pageNum === page ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  } else if (
                    (pageNum === 2 && page > 3) ||
                    (pageNum === pagination.totalPages - 1 && page < pagination.totalPages - 2)
                  ) {
                    return (
                      <li key={pageNum} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                  return null;
                })}
                
                <li className={`page-item ${page >= pagination.totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default MatchesPage;