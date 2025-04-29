import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Badge, 
  Button,
  ProgressBar 
} from 'react-bootstrap';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

// Import services
import api from '../services/api';

// Component for the dashboard stats cards
const StatsCard = ({ title, value, subtitle, icon, color, link }) => (
  <Card className="h-100 shadow-sm">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="text-muted mb-1">{title}</h6>
          <h3 className="mb-0">{value}</h3>
          <small className="text-muted">{subtitle}</small>
        </div>
        <div 
          className={`p-3 rounded-circle bg-${color || 'primary'} bg-opacity-10 text-${color || 'primary'}`}
          style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {icon}
        </div>
      </div>
    </Card.Body>
    {link && (
      <Card.Footer className="bg-white border-0">
        <Link to={link} className={`text-${color || 'primary'} text-decoration-none`}>
          <small>View details &rarr;</small>
        </Link>
      </Card.Footer>
    )}
  </Card>
);

const Dashboard = ({ papers = [], matches = [], leaderboard = [] }) => {
  const [papersByTopic, setPapersByTopic] = useState([]);
  const [completedMatches, setCompletedMatches] = useState(0);
  const [pendingMatches, setPendingMatches] = useState(0);
  const [activityData, setActivityData] = useState([]);
  const [agentPerformance, setAgentPerformance] = useState([]);
  
  useEffect(() => {
    // Count papers by topic
    const topicCounts = papers.reduce((acc, paper) => {
      const topic = paper.main_topic || 'Other';
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array for chart
    const topicData = Object.entries(topicCounts).map(([name, value]) => ({
      name,
      value
    }));
    
    setPapersByTopic(topicData);
    
    // Count matches by status
    const completedCount = matches.filter(m => m.status === 'completed').length;
    const pendingCount = matches.filter(m => m.status === 'pending').length;
    
    setCompletedMatches(completedCount);
    setPendingMatches(pendingCount);
    
    // Prepare activity data (mock data for demonstration)
    const mockActivityData = [
      { month: 'Jan', papers: 12, reviews: 24 },
      { month: 'Feb', papers: 19, reviews: 38 },
      { month: 'Mar', papers: 15, reviews: 30 },
      { month: 'Apr', papers: 25, reviews: 50 },
      { month: 'May', papers: 30, reviews: 60 },
      { month: 'Jun', papers: 28, reviews: 56 }
    ];
    
    setActivityData(mockActivityData);
    
    // Prepare agent performance data
    if (leaderboard && leaderboard.length > 0) {
      const agentData = leaderboard.map(agent => ({
        name: agent.name,
        wins: agent.matches_won,
        draws: agent.matches_drawn,
        losses: agent.matches_lost
      }));
      
      setAgentPerformance(agentData);
    }
  }, [papers, matches, leaderboard]);
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>
      
      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={6} lg={3}>
          <StatsCard 
            title="Total Papers" 
            value={papers.length} 
            subtitle="Collected papers" 
            icon={<i className="bi bi-file-earmark-text fs-4"></i>}
            color="primary"
            link="/papers"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatsCard 
            title="Total Matches" 
            value={matches.length} 
            subtitle={`${completedMatches} completed`}
            icon={<i className="bi bi-controller fs-4"></i>}
            color="success"
            link="/matches"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatsCard 
            title="Active Agents" 
            value={leaderboard?.length || 0} 
            subtitle="Competing agents" 
            icon={<i className="bi bi-cpu fs-4"></i>}
            color="info"
            link="/leaderboard"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatsCard 
            title="Tournaments" 
            value="1" 
            subtitle="June Championship" 
            icon={<i className="bi bi-trophy fs-4"></i>}
            color="warning"
            link="/tournaments"
          />
        </Col>
      </Row>
      
      {/* Charts Row */}
      <Row className="g-4 mb-4">
        <Col md={8}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Paper Collection Activity</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <LineChart 
                    data={activityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="papers" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reviews" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Papers by Topic</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={papersByTopic}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {papersByTopic.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Agent Performance and Recent Matches */}
      <Row className="g-4 mb-4">
        <Col lg={7}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Agent Performance</h5>
                <Link to="/leaderboard" className="text-decoration-none">View Leaderboard</Link>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart 
                    data={agentPerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="wins" stackId="a" fill="#28a745" name="Wins" />
                    <Bar dataKey="draws" stackId="a" fill="#ffc107" name="Draws" />
                    <Bar dataKey="losses" stackId="a" fill="#dc3545" name="Losses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Matches</h5>
                <Link to="/matches" className="text-decoration-none">View All</Link>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Match</th>
                    <th>Status</th>
                    <th>Winner</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {matches.slice(0, 5).map((match) => (
                    <tr key={match.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div>
                            <small className="d-block text-muted">{match.agent1} vs {match.agent2}</small>
                            <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                              {match.paper.title}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg={
                          match.status === 'completed' ? 'success' : 
                          match.status === 'pending' ? 'warning' : 
                          match.status === 'error' ? 'danger' : 'secondary'
                        }>
                          {match.status}
                        </Badge>
                      </td>
                      <td>
                        {match.status === 'completed' ? 
                          (match.winner || 'Draw') : 
                          '-'
                        }
                      </td>
                      <td>
                        <Link to={`/matches/${match.id}`} className="btn btn-sm btn-outline-primary">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Tournament and Research Network Previews */}
      <Row className="g-4">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Current Tournament</h5>
                <Link to="/tournaments" className="text-decoration-none">View Details</Link>
              </div>
            </Card.Header>
            <Card.Body className="bg-light bg-gradient text-center p-4">
              <h4>June 2024 Championship</h4>
              <p className="lead mb-4">16 papers competing for research excellence</p>
              <div className="d-grid gap-2 d-md-block">
                <Button variant="primary">View Bracket</Button>
                <Button variant="outline-primary" className="ms-md-2">Watch Live Updates</Button>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted">Status:</span>
                  <Badge bg="success" className="ms-2">Quarterfinals</Badge>
                </div>
                <div>
                  <i className="bi bi-people"></i> 
                  <span className="text-muted ms-2">245 participants</span>
                </div>
              </div>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Research Network</h5>
                <Link to="/network" className="text-decoration-none">Explore</Link>
              </div>
            </Card.Header>
            <Card.Body className="text-center p-4">
              <div className="network-preview mb-3" style={{ 
                height: '150px', 
                background: 'url(/network-preview.png) center/cover',
                borderRadius: '8px'
              }}>
                {/* Network preview placeholder */}
                <div className="d-flex justify-content-center align-items-center h-100">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <i className="bi bi-diagram-3 text-primary fs-1"></i>
                  </div>
                </div>
              </div>
              <p>Explore connections between papers, topics, and research trends</p>
              <Button variant="outline-primary">View Network Map</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;