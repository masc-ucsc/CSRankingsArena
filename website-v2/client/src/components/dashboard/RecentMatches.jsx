import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';

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

const RecentMatches = ({ matches, limit = 5 }) => {
  // Show only recent matches if limit is provided
  const recentMatches = limit ? matches.slice(0, limit) : matches;

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Recent Matches</h5>
        {limit && (
          <Link to="/matches" className="btn btn-sm btn-outline-primary">
            View All Matches
          </Link>
        )}
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0">
          <thead>
            <tr>
              <th>Paper</th>
              <th>Agents</th>
              <th>Status</th>
              <th>When</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentMatches.map((match) => (
              <tr key={match.id}>
                <td>
                  <div className="d-flex flex-column">
                    <Link 
                      to={`/papers/${match.paper_id}`}
                      className="text-truncate"
                      style={{ maxWidth: '250px' }}
                    >
                      {match.paper_title}
                    </Link>
                    <span className="badge bg-info text-white">
                      {match.paper_topic}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="d-flex flex-column">
                    <Link to={`/agents/${match.agent1_id}`}>
                      {match.agent1_name}
                    </Link>
                    <div className="text-muted">vs</div>
                    <Link to={`/agents/${match.agent2_id}`}>
                      {match.agent2_name}
                    </Link>
                  </div>
                </td>
                <td>
                  {getStatusBadge(match.status)}
                  {match.status === 'completed' && match.winner_name && (
                    <div className="mt-1">
                      Winner: <Link to={`/agents/${match.winner_id}`}>{match.winner_name}</Link>
                    </div>
                  )}
                  {match.status === 'completed' && !match.winner_name && (
                    <div className="mt-1">Result: Draw</div>
                  )}
                </td>
                <td>
                  {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
                </td>
                <td>
                  <Link 
                    to={`/matches/${match.id}`}
                    className="btn btn-sm btn-primary"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {recentMatches.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-3">
                  No matches found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default RecentMatches;