import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import StatisticsCards from './StatisticsCards';
import AgentLeaderboard from './AgentLeaderboard';
import TopicDistributionChart from './TopicDistributionChart';
import RecentMatches from './RecentMatches';
import AgentPerformanceChart from './AgentPerformanceChart';
import { getLeaderboard, getMatches, getPapers } from '../../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agents, setAgents] = useState([]);
  const [matches, setMatches] = useState([]);
  const [paperStats, setPaperStats] = useState({});
  const [statistics, setStatistics] = useState({
    totalPapers: 0,
    totalAgents: 0,
    totalMatches: 0,
    completedMatches: 0,
    pendingMatches: 0,
    topAgent: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data
        const [leaderboardData, matchesData, papersData] = await Promise.all([
          getLeaderboard(),
          getMatches({ limit: 10 }),
          getPapers({ limit: 0 }) // Just get the counts by topic
        ]);
        
        // Parse and process data
        const agents = leaderboardData.leaderboard || [];
        const matches = matchesData.matches || [];
        
        // Calculate paper stats
        const papersByTopic = {};
        if (papersData.papersByTopic) {
          Object.entries(papersData.papersByTopic).forEach(([topic, count]) => {
            papersByTopic[topic] = count;
          });
        }
        
        // Calculate statistics
        const completedMatches = matches.filter(m => m.status === 'completed').length;
        const pendingMatches = matches.filter(m => m.status === 'pending').length;
        
        setAgents(agents);
        setMatches(matches);
        setPaperStats(papersByTopic);
        setStatistics({
          totalPapers: papersData.pagination?.total || 0,
          totalAgents: agents.length,
          totalMatches: matchesData.pagination?.total || 0,
          completedMatches,
          pendingMatches,
          topAgent: agents.length > 0 ? agents[0] : null
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Dashboard</h1>
      
      <StatisticsCards statistics={statistics} />
      
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <AgentLeaderboard agents={agents} limit={5} />
        </Col>
        <Col lg={4}>
          <TopicDistributionChart data={paperStats} />
        </Col>
      </Row>
      
      <RecentMatches matches={matches} limit={5} />
      
      <Row className="g-4">
        <Col>
          <AgentPerformanceChart agents={agents.slice(0, 5)} />
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
