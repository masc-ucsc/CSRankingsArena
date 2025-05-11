import React from 'react';
import { Card } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AgentPerformanceChart = ({ agents }) => {
  // Format data for chart
  const chartData = agents.map(agent => ({
    name: agent.name,
    wins: agent.matches_won,
    draws: agent.matches_drawn,
    losses: agent.matches_lost
  }));

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">Agent Performance</h5>
      </Card.Header>
      <Card.Body>
        <div style={{ height: 400 }}>
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
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="wins" name="Wins" fill="#82ca9d" />
              <Bar dataKey="draws" name="Draws" fill="#8884d8" />
              <Bar dataKey="losses" name="Losses" fill="#ff8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {chartData.length === 0 && (
          <div className="text-center py-5 text-muted">
            No data available
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default AgentPerformanceChart;