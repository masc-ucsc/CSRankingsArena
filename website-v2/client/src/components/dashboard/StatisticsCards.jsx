import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { 
  FileEarmarkText, 
  Award, 
  People, 
  CheckCircle, 
  HourglassSplit 
} from 'react-bootstrap-icons';

const StatCard = ({ title, value, icon, color, subtext }) => (
  <Card className="mb-4 h-100">
    <Card.Body className="d-flex align-items-center">
      <div
        className={`flex-shrink-0 rounded-circle p-3 me-3 bg-${color} bg-opacity-10`}
      >
        {icon}
      </div>
      <div>
        <h3 className="mb-0">{value}</h3>
        <div className="text-muted">{title}</div>
        {subtext && <small className="text-muted">{subtext}</small>}
      </div>
    </Card.Body>
  </Card>
);

const StatisticsCards = ({ statistics }) => {
  const {
    totalPapers = 0,
    totalAgents = 0,
    totalMatches = 0,
    completedMatches = 0,
    pendingMatches = 0,
    topAgent = null
  } = statistics || {};

  return (
    <Row className="g-4 mb-4">
      <Col lg={4} md={6}>
        <StatCard
          title="Total Papers"
          value={totalPapers.toLocaleString()}
          icon={<FileEarmarkText size={24} className="text-primary" />}
          color="primary"
        />
      </Col>
      <Col lg={4} md={6}>
        <StatCard
          title="Total Matches"
          value={totalMatches.toLocaleString()}
          icon={<Award size={24} className="text-success" />}
          color="success"
          subtext={`${completedMatches} completed, ${pendingMatches} pending`}
        />
      </Col>
      <Col lg={4} md={6}>
        <StatCard
          title="AI Agents"
          value={totalAgents.toLocaleString()}
          icon={<People size={24} className="text-info" />}
          color="info"
          subtext={topAgent ? `Leader: ${topAgent.name}` : ''}
        />
      </Col>
    </Row>
  );
};

export default StatisticsCards;