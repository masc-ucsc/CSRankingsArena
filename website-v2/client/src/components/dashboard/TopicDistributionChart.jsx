// src/components/dashboard/TopicDistributionChart.js
import React from 'react';
import { Card } from 'react-bootstrap';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="custom-tooltip bg-white p-2 border shadow-sm">
        <p className="mb-0"><strong>{item.name}</strong></p>
        <p className="mb-0">{item.value} papers</p>
        <p className="mb-0 text-muted">{(item.payload.percent * 100).toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

const TopicDistributionChart = ({ data }) => {
  // Format data for chart
  const chartData = Object.entries(data || {}).map(([name, count]) => ({
    name,
    value: count
  }));

  // Calculate total for percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach(item => {
    item.percent = item.value / total;
  });

  return (
    <Card className="mb-4 h-100">
      <Card.Header>
        <h5 className="mb-0">Papers by Topic</h5>
      </Card.Header>
      <Card.Body>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
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

export default TopicDistributionChart;