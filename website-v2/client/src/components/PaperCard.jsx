import React from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PaperCard = ({ paper, onSelectForMatch, showMatchButton, selectedForMatch }) => {
  // Format the authors list
  const formatAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'Unknown Authors';
    
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    
    // If more than 2 authors, show first author + et al.
    return `${authors[0]} et al.`;
  };
  
  // Format the date
  const formatDate = (date) => {
    if (!date) return 'Unknown Date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <Card 
      className={`paper-card ${selectedForMatch ? 'selected' : ''}`}
      style={{ 
        marginBottom: '16px',
        border: selectedForMatch ? '2px solid #1890ff' : undefined,
        backgroundColor: selectedForMatch ? '#e6f7ff' : undefined
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Title level={5}>{paper.title}</Title>
        
        <Text type="secondary">
          Authors: {paper.authors.join(', ')}
        </Text>
        
        <Text className="paper-abstract">
          {paper.abstract}
        </Text>
        
        <div className="paper-meta">
          <Text type="secondary">Year: {paper.year}</Text>
          <Text type="secondary">Venue: {paper.venue}</Text>
        </div>

        {showMatchButton && (
          <div className="paper-actions">
            <Button
              type={selectedForMatch ? "primary" : "default"}
              icon={<RobotOutlined />}
              onClick={() => onSelectForMatch(selectedForMatch ? null : 'paper1')}
            >
              {selectedForMatch ? 'Selected' : 'Select for Match'}
            </Button>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default PaperCard;