import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, 
  Card, 
  Badge, 
  OverlayTrigger, 
  Tooltip 
} from 'react-bootstrap';

const AgentLeaderboard = ({ agents, limit = 5 }) => {
  // Show only top agents if limit is provided
  const topAgents = limit ? agents.slice(0, limit) : agents;

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Agent Leaderboard</h5>
        {limit && (
          <Link to="/leaderboard" className="btn btn-sm btn-outline-primary">
            View Full Leaderboard
          </Link>
        )}
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Agent</th>
              <th>Points</th>
              <th>W/D/L</th>
              <th>Win %</th>
            </tr>
          </thead>
          <tbody>
            {topAgents.map((agent, index) => (
              <tr key={agent.id}>
                <td>{index + 1}</td>
                <td>
                  <Link to={`/agents/${agent.id}`}>
                    {agent.name}
                    {index === 0 && (
                      <Badge bg="warning" text="dark" className="ms-2">
                        Leader
                      </Badge>
                    )}
                  </Link>
                  <div className="small text-muted">
                    {agent.model} ({agent.provider})
                  </div>
                </td>
                <td>
                  <strong>{agent.points}</strong>
                </td>
                <td>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        {agent.matches_won} wins, {agent.matches_drawn} draws, {agent.matches_lost} losses
                      </Tooltip>
                    }
                  >
                    <span>
                      <span className="text-success">{agent.matches_won}</span>/
                      <span className="text-secondary">{agent.matches_drawn}</span>/
                      <span className="text-danger">{agent.matches_lost}</span>
                    </span>
                  </OverlayTrigger>
                </td>
                <td>
                  <span className={`badge ${agent.win_percentage >= 50 ? 'bg-success' : 'bg-secondary'}`}>
                    {agent.win_percentage.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
            {topAgents.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-3">
                  No agents found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default AgentLeaderboard;