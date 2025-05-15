import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Badge, 
  Button, 
  Tab, 
  Tabs, 
  Alert, 
  Spinner 
} from 'react-bootstrap';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';
import ReviewContent from './ReviewContent';
import FeedbackSection from './FeedbackSection';
import { getMatch, getMatchReviews, getMatchEvaluation } from '../../services/api';

const getStatusBadge = (status) => {
  switch (status) {
    case 'completed':
      return <Badge bg="success">Completed</Badge>;
    case 'pending':
      return <Badge bg="warning" text="dark">Pending</Badge>;
    case 'error':
      return <Badge bg="danger">Error</Badge>;
    default:
      return <Badge bg="secondary">{status}</Badge>;
  }
};

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [match, setMatch] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        
        // Fetch match details
        const matchData = await getMatch(id);
        setMatch(matchData.match);
        
        // If match is completed, fetch reviews and evaluation
        if (matchData.match.status === 'completed') {
          const [reviewsData, evaluationData] = await Promise.all([
            getMatchReviews(id),
            getMatchEvaluation(id)
          ]);
          
          setReviews(reviewsData.reviews);
          setEvaluation(evaluationData.evaluation);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching match data:', err);
        setError(err.message || 'Failed to load match data');
        setLoading(false);
      }
    };
    
    fetchMatchData();
  }, [id]);

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/matches')}>
            Back to Matches
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!match) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          <Alert.Heading>Match Not Found</Alert.Heading>
          <p>The match you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline-primary" onClick={() => navigate('/matches')}>
            Back to Matches
          </Button>
        </Alert>
      </Container>
    );
  }

  // Format evaluation data for charts if available
  const chartData = evaluation 
    ? Object.entries(evaluation.scores).map(([category, scores]) => {
        // Format category name (e.g., technical_correctness -> Technical Correctness)
        const formattedCategory = category
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        return {
          category: formattedCategory,
          [match.agent1.name]: scores[match.agent1.name],
          [match.agent2.name]: scores[match.agent2.name]
        };
      })
    : [];

  const review1 = reviews.find(review => review.agent_id === match.agent1.id);
  const review2 = reviews.find(review => review.agent_id === match.agent2.id);

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Match Details</h1>
        <Button variant="outline-secondary" onClick={() => navigate('/matches')}>
          Back to Matches
        </Button>
      </div>
      
      {/* Match Info Card */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Match Information</h5>
          <div>
            {getStatusBadge(match.status)}
            <span className="ms-2 text-muted">
              Created {format(new Date(match.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={7}>
              <h4 className="mb-3">
                <Link to={`/papers/${match.paper.id}`}>
                  {match.paper.title}
                </Link>
              </h4>
              <p className="text-muted mb-2">{match.paper.authors}</p>
              <Badge bg="info" className="mb-3">{match.paper.main_topic}</Badge>
              <p className="mb-0">{match.paper.abstract}</p>
              {match.paper.pdf_url && (
                <div className="mt-3">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    href={match.paper.pdf_url} 
                    target="_blank"
                  >
                    View PDF
                  </Button>
                </div>
              )}
            </Col>
            <Col md={5}>
              <Card className="border">
                <Card.Header>
                  <h5 className="mb-0">Competing Agents</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="mb-1">
                        <Link to={`/agents/${match.agent1.id}`}>
                          {match.agent1.name}
                        </Link>
                      </h5>
                      <div className="text-muted small">
                        {match.agent1.model} ({match.agent1.provider})
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="fs-5 fw-bold">VS</span>
                    </div>
                    <div className="text-end">
                      <h5 className="mb-1">
                        <Link to={`/agents/${match.agent2.id}`}>
                          {match.agent2.name}
                        </Link>
                      </h5>
                      <div className="text-muted small">
                        {match.agent2.model} ({match.agent2.provider})
                      </div>
                    </div>
                  </div>
                  
                  {match.status === 'completed' && (
                    <div className="pt-3 border-top">
                      <h5 className="mb-2">Result</h5>
                      {match.winner ? (
                        <div className="alert alert-success mb-0">
                          Winner: <strong>
                            <Link to={`/agents/${match.winner.id}`}>
                              {match.winner.name}
                            </Link>
                          </strong>
                        </div>
                      ) : (
                        <div className="alert alert-secondary mb-0">
                          <strong>Draw</strong> - Both reviews were equally good
                        </div>
                      )}
                    </div>
                  )}
                  
                  {match.status === 'pending' && (
                    <div className="pt-3 border-top">
                      <div className="alert alert-warning mb-0">
                        This match is pending evaluation
                      </div>
                    </div>
                  )}
                  
                  {match.status === 'error' && (
                    <div className="pt-3 border-top">
                      <div className="alert alert-danger mb-0">
                        <strong>Error:</strong> {match.error}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Match reviews and evaluation */}
      {match.status === 'completed' && (
        <div className="mb-4">
          <Tabs
            id="match-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="overview" title="Overview">
              <Row>
                <Col lg={8}>
                  {evaluation && (
                    <Card className="mb-4">
                      <Card.Header>
                        <h5 className="mb-0">Evaluation</h5>
                      </Card.Header>
                      <Card.Body>
                        <h6>Judge's Reasoning</h6>
                        <p>{evaluation.reasoning}</p>
                        
                        <h6 className="mt-4">Score Comparison</h6>
                        <div style={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={chartData}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="category" />
                              <YAxis domain={[0, 10]} />
                              <Tooltip />
                              <Legend />
                              <Bar 
                                dataKey={match.agent1.name} 
                                fill="#8884d8" 
                                isAnimationActive={false}
                              />
                              <Bar 
                                dataKey={match.agent2.name} 
                                fill="#82ca9d" 
                                isAnimationActive={false}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card.Body>
                    </Card>
                  )}
                </Col>
                
                <Col lg={4}>
                  <FeedbackSection matchId={match.id} />
                </Col>
              </Row>
            </Tab>
            
            <Tab eventKey="review1" title={`${match.agent1.name} Review`}>
              <ReviewContent 
                review={review1} 
                agent={match.agent1} 
              />
            </Tab>
            
            <Tab eventKey="review2" title={`${match.agent2.name} Review`}>
              <ReviewContent 
                review={review2} 
                agent={match.agent2} 
              />
            </Tab>
            
            <Tab eventKey="comparison" title="Side-by-Side">
              <Row>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">{match.agent1.name}</h5>
                      <div className="text-muted small">
                        {match.agent1.model} ({match.agent1.provider})
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {review1 ? (
                        <div className="p-3">
                          <h6>Summary</h6>
                          <p>{review1.summary}</p>
                          
                          <h6>Rating</h6>
                          <p>
                            <Badge 
                              bg={review1.rating >= 7 ? 'success' : (review1.rating >= 5 ? 'warning' : 'danger')}
                            >
                              {review1.rating}/10
                            </Badge>
                            <span className="ms-2">
                              Confidence: <strong>{review1.confidence}</strong>
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-muted">
                          Review not available
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">{match.agent2.name}</h5>
                      <div className="text-muted small">
                        {match.agent2.model} ({match.agent2.provider})
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {review2 ? (
                        <div className="p-3">
                          <h6>Summary</h6>
                          <p>{review2.summary}</p>
                          
                          <h6>Rating</h6>
                          <p>
                            <Badge 
                              bg={review2.rating >= 7 ? 'success' : (review2.rating >= 5 ? 'warning' : 'danger')}
                            >
                              {review2.rating}/10
                            </Badge>
                            <span className="ms-2">
                              Confidence: <strong>{review2.confidence}</strong>
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-muted">
                          Review not available
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {review1 && review2 && (
                <React.Fragment>
                  <Row className="mt-4">
                    <Col md={6}>
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Strengths</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                          <ul className="list-group list-group-flush">
                            {review1.strengths.map((strength, index) => (
                              <li key={index} className="list-group-item">{strength}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Strengths</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                          <ul className="list-group list-group-flush">
                            {review2.strengths.map((strength, index) => (
                              <li key={index} className="list-group-item">{strength}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row className="mt-4">
                    <Col md={6}>
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Weaknesses</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                          <ul className="list-group list-group-flush">
                            {review1.weaknesses.map((weakness, index) => (
                              <li key={index} className="list-group-item">{weakness}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Weaknesses</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                          <ul className="list-group list-group-flush">
                            {review2.weaknesses.map((weakness, index) => (
                              <li key={index} className="list-group-item">{weakness}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row className="mt-4">
                    <Col md={6}>
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Questions</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                          <ul className="list-group list-group-flush">
                            {review1.questions.map((question, index) => (
                              <li key={index} className="list-group-item">{question}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Questions</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                          <ul className="list-group list-group-flush">
                            {review2.questions.map((question, index) => (
                              <li key={index} className="list-group-item">{question}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </React.Fragment>
              )}
            </Tab>
          </Tabs>
        </div>
      )}
    </Container>
  );
};

export default MatchDetail;