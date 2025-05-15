import React from 'react';
import { Card, Button, Space, Typography, Tag, Tooltip, Badge } from 'antd';
import { RobotOutlined, LinkOutlined, UserOutlined, TrophyOutlined, StarOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const PaperCard = ({ paper, onSelectForMatch, showMatchButton, selectedForMatch }) => {
  // Format the authors list from references
  const formatAuthors = (references) => {
    if (!references) return 'Unknown Authors';
    
    // Extract first author from references
    const firstRef = references.split('.')[0];
    const authors = firstRef.split(',').map(a => a.trim());
    
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    
    // If more than 2 authors, show first author + et al.
    return `${authors[0]} et al.`;
  };

  // Format the abstract to be more readable
  const formatAbstract = (abstract) => {
    if (!abstract) return 'No abstract available';
    // Remove any extra whitespace and newlines
    return abstract.replace(/\s+/g, ' ').trim();
  };

  // Get venue from URL
  const getVenue = (url) => {
    if (!url) return 'Unknown Venue';
    if (url.includes('dl.acm.org')) return 'ACM Digital Library';
    if (url.includes('arxiv.org')) return 'arXiv';
    if (url.includes('ieee.org')) return 'IEEE';
    return 'Other';
  };

  // Get color for rank badge
  const getRankColor = (rank) => {
    if (!rank) return 'default';
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'blue';
  };

  // Format win rate as percentage
  const formatWinRate = (rate) => {
    if (!rate) return '0%';
    return `${Math.round(rate * 100)}%`;
  };
  
  return (
    <Card 
      className={`paper-card ${selectedForMatch ? 'selected' : ''}`}
      style={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
        border: selectedForMatch ? '2px solid #1890ff' : '1px solid #f0f0f0',
        backgroundColor: selectedForMatch ? '#e6f7ff' : '#ffffff',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-2px)'
        }
      }}
      bodyStyle={{
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%', flex: 1 }}>
        <Space align="start" style={{ width: '100%' }}>
          <Title level={5} style={{ 
            marginBottom: '12px',
            fontSize: '16px',
            lineHeight: '1.4',
            flex: 1,
            '& a': {
              color: '#262626',
              '&:hover': {
                color: '#1890ff'
              }
            }
          }}>
            <a href={paper.url} target="_blank" rel="noopener noreferrer">
              {paper.title}
            </a>
          </Title>
          {paper.ranking && (
            <Tooltip title={`Rank ${paper.ranking.rank} with ${paper.ranking.score} points`}>
              <Badge 
                count={paper.ranking.rank} 
                style={{ 
                  backgroundColor: getRankColor(paper.ranking.rank),
                  boxShadow: '0 2px 0 rgba(0,0,0,.15)'
                }}
              />
            </Tooltip>
          )}
        </Space>
        
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space align="center">
            <UserOutlined style={{ color: '#8c8c8c', fontSize: '14px' }} />
            <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {formatAuthors(paper.references)}
            </Text>
          </Space>
          
          <Tooltip title={formatAbstract(paper.abstract)}>
            <Paragraph 
              className="paper-abstract"
              style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#595959',
                marginBottom: '12px'
              }}
              ellipsis={{ rows: 3, expandable: true, symbol: 'Read more' }}
            >
              {formatAbstract(paper.abstract)}
            </Paragraph>
          </Tooltip>
        </Space>
        
        <div className="paper-meta" style={{ marginTop: 'auto', paddingTop: '12px' }}>
          <Space wrap size={[4, 8]}>
            <Tag color="blue" style={{ margin: 0 }}>{paper.year}</Tag>
            <Tag color="green" style={{ margin: 0 }}>{paper.category}</Tag>
            <Tag color="purple" style={{ margin: 0 }}>{paper.subcategory}</Tag>
            <Tag color="orange" style={{ margin: 0 }}>{getVenue(paper.url)}</Tag>
            {paper.ranking && (
              <>
                <Tooltip title="Win Rate">
                  <Tag color="cyan" style={{ margin: 0 }}>
                    <TrophyOutlined /> {formatWinRate(paper.ranking.winRate)}
                  </Tag>
                </Tooltip>
                <Tooltip title="Total Matches">
                  <Tag color="magenta" style={{ margin: 0 }}>
                    <StarOutlined /> {paper.ranking.matches}
                  </Tag>
                </Tooltip>
              </>
            )}
          </Space>
        </div>

        {showMatchButton && (
          <div className="paper-actions" style={{ 
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Space size="middle">
              <Button
                type={selectedForMatch ? "primary" : "default"}
                icon={<RobotOutlined />}
                onClick={() => onSelectForMatch(selectedForMatch ? null : 'paper1')}
                style={{ borderRadius: '6px' }}
              >
                {selectedForMatch ? 'Selected' : 'Select for Match'}
              </Button>
              <Button
                type="default"
                icon={<LinkOutlined />}
                onClick={() => window.open(paper.url, '_blank')}
                style={{ borderRadius: '6px' }}
              >
                View Paper
              </Button>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default PaperCard;