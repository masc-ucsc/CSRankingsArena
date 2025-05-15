import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Card, Typography, Spin, Alert, Tag, Space, Collapse, Descriptions, Rate, Tooltip, Button, Input, Modal, message, Select, Radio, Divider, Badge, Popover, List, Avatar, Empty } from 'antd';
import { 
  TrophyOutlined, 
  LinkOutlined, 
  WarningOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  MinusCircleOutlined,
  EyeOutlined,
  LikeOutlined,
  DislikeOutlined,
  LikeFilled,
  DislikeFilled,
  MessageOutlined,
  SortAscendingOutlined,
  FilterOutlined,
  StarOutlined,
  StarFilled,
  FlagOutlined,
  RobotOutlined,
  ExperimentOutlined,
  CodeOutlined,
  SafetyOutlined,
  DeploymentUnitOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_CONFIG from '../../config/api';
import { getMockLeaderboardData } from '../../mock/paperData';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Create axios instance with default config
const api = axios.create(API_CONFIG);

// Add a helper function to get icon for capability
const getCapabilityIcon = (capability) => {
  const iconMap = {
    'Advanced reasoning': <RobotOutlined />,
    'Code analysis': <CodeOutlined />,
    'Technical evaluation': <ExperimentOutlined />,
    'Ethical considerations': <SafetyOutlined />,
    'Deployment considerations': <DeploymentUnitOutlined />,
    'Real-time processing': <ThunderboltOutlined />,
    // Add more mappings as needed
  };
  return iconMap[capability] || <ExperimentOutlined />;
};

const LeaderboardTable = ({ category, subcategory, year }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [usingMockData, setUsingMockData] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [comment, setComment] = useState('');
  const [userFeedback, setUserFeedback] = useState({});
  const [commentSort, setCommentSort] = useState('recent');
  const [commentFilter, setCommentFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({});

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!category || !subcategory || !year) return;

      setLoading(true);
      setUsingMockData(false);
      try {
        const response = await api.get('/api/v2/leaderboard', {
          params: {
            category,
            subcategory,
            year,
            limit: 100
          }
        });

        if (response.data.rankings && response.data.rankings.length > 0) {
          setData(response.data.rankings);
        } else {
          console.warn('No real rankings data available, using mock data');
          setData(getMockLeaderboardData());
          setUsingMockData(true);
        }
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        console.warn('Error fetching rankings, using mock data as fallback');
        setData(getMockLeaderboardData());
        setUsingMockData(true);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [category, subcategory, year]);

  // Memoize handlers
  const handleFeedback = useCallback(async (matchId, type) => {
    try {
      const match = selectedMatch || data.flatMap(p => p.matches).find(m => m.matchId === matchId);
      if (!match) return;

      const currentFeedback = userFeedback[matchId] || { liked: false, disliked: false };
      const newFeedback = { ...currentFeedback };

      if (type === 'like') {
        newFeedback.liked = !currentFeedback.liked;
        newFeedback.disliked = false;
        match.feedback.likes += newFeedback.liked ? 1 : -1;
        if (currentFeedback.disliked) match.feedback.dislikes--;
      } else if (type === 'dislike') {
        newFeedback.disliked = !currentFeedback.disliked;
        newFeedback.liked = false;
        match.feedback.dislikes += newFeedback.disliked ? 1 : -1;
        if (currentFeedback.liked) match.feedback.likes--;
      }

      setUserFeedback(prev => ({ ...prev, [matchId]: newFeedback }));
      message.success(`Feedback ${type === 'like' ? 'liked' : 'disliked'} successfully!`);
    } catch (error) {
      message.error('Failed to submit feedback');
    }
  }, [data, selectedMatch, userFeedback]);

  const handleComment = useCallback(async () => {
    if (!comment.trim() || !selectedMatch) return;

    try {
      const newComment = {
        id: Date.now(),
        user: 'Anonymous',
        text: comment.trim(),
        date: new Date().toISOString()
      };

      selectedMatch.feedback.comments.unshift(newComment);
      setComment('');
      setFeedbackModalVisible(false);
      message.success('Comment added successfully!');
    } catch (error) {
      message.error('Failed to add comment');
    }
  }, [comment, selectedMatch]);

  // Memoize the filtered and sorted comments
  const getFilteredAndSortedComments = useCallback((match) => {
    if (!match?.feedback?.comments) return [];

    let comments = [...match.feedback.comments];

    if (selectedTags.length > 0) {
      comments = comments.filter(comment => 
        selectedTags.some(tag => comment.tags?.includes(tag))
      );
    }

    if (commentFilter !== 'all') {
      comments = comments.filter(comment => {
        const sentiment = comment.likes > 2 ? 'positive' : 
                         comment.likes < 0 ? 'negative' : 'neutral';
        return sentiment === commentFilter;
      });
    }

    switch (commentSort) {
      case 'recent':
        comments.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'popular':
        comments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'highlighted':
        comments.sort((a, b) => (b.isHighlighted ? 1 : 0) - (a.isHighlighted ? 1 : 0));
        break;
    }

    return comments;
  }, [commentFilter, commentSort, selectedTags]);

  // Memoize the columns definition
  const columns = useMemo(() => [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {rank <= 3 && <TrophyOutlined style={{ color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32' }} />}
          <span>{rank}</span>
        </div>
      )
    },
    {
      title: 'Paper',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {record.paperId.startsWith('mock-') ? (
              title
            ) : (
              <Link to={`/papers/${record.paperId}`}>
                {title} <LinkOutlined style={{ fontSize: '12px' }} />
              </Link>
            )}
          </div>
          <div style={{ color: '#666', fontSize: '0.9em' }}>
            {record.authors.join(', ')}
          </div>
          <div style={{ marginTop: '4px' }}>
            <Tag color="blue">{record.venue}</Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      sorter: (a, b) => a.score - b.score,
      render: (score) => (
        <div style={{ fontWeight: 'bold', color: score >= 90 ? '#52c41a' : score >= 80 ? '#1890ff' : '#faad14' }}>
          {score}
        </div>
      )
    },
    {
      title: 'Matches',
      dataIndex: 'matches',
      key: 'matches',
      width: 120,
      render: (matches) => {
        if (!matches || !Array.isArray(matches)) return '0';
        return (
          <Space direction="vertical" size="small">
            <Text strong>{matches.length}</Text>
            <Text type="secondary">
              {matches.filter(m => m.result === 'win').length} wins
            </Text>
          </Space>
        );
      }
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 120,
      sorter: (a, b) => a.winRate - b.winRate,
      render: (winRate, record) => {
        const matches = record.matches || [];
        const wins = matches.filter(m => m.result === 'win').length;
        return (
          <div>
            <Text strong>{(winRate * 100).toFixed(1)}%</Text>
            <Text type="secondary"> ({wins} wins)</Text>
          </div>
        );
      }
    },
    {
      title: 'Recent Activity',
      key: 'recentActivity',
      width: 200,
      render: (_, record) => {
        const matches = record.matches || [];
        if (matches.length === 0) return null;

        // Get the most recent match
        const recentMatch = [...matches].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )[0];

        return (
          <Space direction="vertical" size="small">
            <Space>
              <Tag color={
                recentMatch.result === 'win' ? 'success' : 
                recentMatch.result === 'loss' ? 'error' : 
                'default'
              }>
                {recentMatch.result.toUpperCase()}
              </Tag>
              <Text type="secondary">
                vs {recentMatch.opponent.title}
              </Text>
            </Space>
            <Text type="secondary" style={{ fontSize: '0.9em' }}>
              {new Date(recentMatch.date).toLocaleDateString()}
            </Text>
          </Space>
        );
      }
    }
  ], []);

  // Memoize the expanded row render function
  const expandedRowRender = useCallback((record) => {
    if (!record.matches || !Array.isArray(record.matches) || record.matches.length === 0) {
      return (
        <Alert
          message="No Match Data Available"
          description="This paper has no recorded matches yet."
          type="info"
          showIcon
        />
      );
    }

    return (
      <Collapse>
        {record.matches.map((match) => (
          <Panel 
            key={match.matchId}
            header={
              <Space>
                <Tag color={
                  match.result === 'win' ? 'success' : 
                  match.result === 'loss' ? 'error' : 
                  'default'
                }>
                  {match.result === 'win' ? <CheckCircleOutlined /> : 
                   match.result === 'loss' ? <CloseCircleOutlined /> : 
                   <MinusCircleOutlined />}
                  {match.result.toUpperCase()}
                </Tag>
                <Text>vs {match.opponent.title}</Text>
                <Text type="secondary">Score: {match.score} - {match.opponent.score}</Text>
                <Text type="secondary">{new Date(match.date).toLocaleDateString()}</Text>
              </Space>
            }
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Descriptions title="Match Details" bordered size="small">
                <Descriptions.Item label="Match ID" span={3}>
                  {record.paperId.startsWith('mock-') ? (
                    <Text>{match.matchId}</Text>
                  ) : (
                    <Link to={`/matches/${match.matchId}`}>
                      {match.matchId} <EyeOutlined style={{ marginLeft: 8 }} />
                    </Link>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Your Score" span={1}>
                  <Text strong>{match.score}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Opponent Score" span={1}>
                  <Text strong>{match.opponent.score}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Result" span={1}>
                  <Tag color={
                    match.result === 'win' ? 'success' : 
                    match.result === 'loss' ? 'error' : 
                    'default'
                  }>
                    {match.result.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              {match.reviews && Array.isArray(match.reviews) && match.reviews.length > 0 && (
                <Descriptions title="AI Review Analysis" bordered size="small">
                  {match.reviews.map((review, idx) => {
                    if (!review || !review.reviewer) return null;
                    
                    const { reviewer } = review;
                    return (
                      <React.Fragment key={idx}>
                        <Descriptions.Item label="AI Reviewer" span={3}>
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Space>
                              {reviewer.avatar && (
                                <Avatar src={reviewer.avatar} size="small" />
                              )}
                              <Space direction="vertical" size={0}>
                                <Space>
                                  <Text strong>{reviewer.name || 'Unknown AI'}</Text>
                                  {reviewer.provider && (
                                    <Tag color="blue">{reviewer.provider}</Tag>
                                  )}
                                  {reviewer.model && (
                                    <Tag color="purple">{reviewer.model}</Tag>
                                  )}
                                </Space>
                                {reviewer.version && (
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Version: {reviewer.version}
                                  </Text>
                                )}
                              </Space>
                            </Space>
                            
                            {reviewer.expertise && Array.isArray(reviewer.expertise) && reviewer.expertise.length > 0 && (
                              <Space wrap>
                                {reviewer.expertise.map(skill => (
                                  <Tag key={skill} color="cyan">{skill}</Tag>
                                ))}
                              </Space>
                            )}
                            
                            {reviewer.capabilities && Array.isArray(reviewer.capabilities) && reviewer.capabilities.length > 0 && (
                              <Space wrap>
                                {reviewer.capabilities.map(capability => (
                                  <Tag 
                                    key={capability} 
                                    icon={getCapabilityIcon(capability)}
                                    color="geekblue"
                                  >
                                    {capability}
                                  </Tag>
                                ))}
                              </Space>
                            )}
                          </Space>
                        </Descriptions.Item>

                        {reviewer.style && (
                          <Descriptions.Item label="Review Style" span={3}>
                            <Text italic>{reviewer.style}</Text>
                          </Descriptions.Item>
                        )}

                        {review.metrics && (
                          <Descriptions.Item label="Metrics" span={3}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              {Object.entries(review.metrics).map(([key, value]) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Text strong style={{ width: '150px' }}>{key}:</Text>
                                  <Rate 
                                    disabled 
                                    defaultValue={value} 
                                    count={10} 
                                    style={{ marginLeft: 8 }}
                                  />
                                  <Text type="secondary" style={{ marginLeft: 8 }}>
                                    {value}/10
                                  </Text>
                                </div>
                              ))}
                            </Space>
                          </Descriptions.Item>
                        )}

                        {review.analysis && (
                          <Descriptions.Item label="Analysis" span={3}>
                            <Paragraph style={{ whiteSpace: 'pre-line' }}>
                              {review.analysis}
                            </Paragraph>
                          </Descriptions.Item>
                        )}
                      </React.Fragment>
                    );
                  })}
                </Descriptions>
              )}

              {match.comparison && (
                <Descriptions title="Comparison Analysis" bordered size="small">
                  <Descriptions.Item label="Winner" span={3}>
                    <Tag color="gold">
                      <TrophyOutlined /> {match.comparison.winner === record.paperId ? 'Your Paper' : 'Opponent Paper'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Analysis" span={3}>
                    <Paragraph>{match.comparison.analysis}</Paragraph>
                  </Descriptions.Item>
                  {match.comparison.keyPoints && (
                    <Descriptions.Item label="Key Points" span={3}>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {match.comparison.keyPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              )}

              {match.feedback && (
                <Descriptions title="Community Feedback" bordered size="small">
                  <Descriptions.Item span={3}>
                    {renderFeedback(match)}
                  </Descriptions.Item>
                </Descriptions>
              )}
            </Space>
          </Panel>
        ))}
      </Collapse>
    );
  }, []);

  // Memoize the feedback render function
  const renderFeedback = useCallback((match) => {
    if (!match?.feedback) return null;

    const currentFeedback = userFeedback[match.matchId] || { liked: false, disliked: false };
    const comments = getFilteredAndSortedComments(match);
    
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Badge count={comments.length} showZero>
              <Button 
                type={currentFeedback.liked ? "primary" : "default"}
                icon={currentFeedback.liked ? <LikeFilled /> : <LikeOutlined />}
                onClick={() => handleFeedback(match.matchId, 'like')}
              >
                Like
              </Button>
            </Badge>
            <Badge count={comments.length} showZero>
              <Button 
                type={currentFeedback.disliked ? "primary" : "default"}
                danger={currentFeedback.disliked}
                icon={currentFeedback.disliked ? <DislikeFilled /> : <DislikeOutlined />}
                onClick={() => handleFeedback(match.matchId, 'dislike')}
              >
                Dislike
              </Button>
            </Badge>
            <Badge count={comments.length} showZero>
              <Button 
                icon={<MessageOutlined />}
                onClick={() => {
                  setSelectedMatch(match);
                  setFeedbackModalVisible(true);
                }}
              >
                Comments
              </Button>
            </Badge>
          </Space>
          <Space>
            {comments.slice(0, 3).map(comment => (
              <Tag key={comment.id} color="blue">{comment.text.slice(0, 20)}</Tag>
            ))}
          </Space>
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong>Recent Comments</Text>
            <Space>
              <Select
                value={commentSort}
                onChange={setCommentSort}
                style={{ width: 120 }}
                options={[
                  { value: 'recent', label: 'Most Recent' },
                  { value: 'popular', label: 'Most Liked' },
                  { value: 'highlighted', label: 'Highlighted' }
                ]}
                suffixIcon={<SortAscendingOutlined />}
              />
              <Select
                mode="multiple"
                value={selectedTags}
                onChange={setSelectedTags}
                style={{ width: 200 }}
                placeholder="Filter by tags"
                options={match.feedback.tags.map(tag => ({ value: tag, label: tag }))}
                suffixIcon={<FilterOutlined />}
                maxTagCount={2}
              />
            </Space>
          </Space>

          <List
            dataSource={comments.slice(0, 2)}
            renderItem={comment => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    icon={comment.isHighlighted ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                    onClick={() => {/* Toggle highlight */}}
                  />,
                  <Button 
                    type="text" 
                    icon={<FlagOutlined />}
                    onClick={() => {/* Report comment */}}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user}`} />}
                  title={
                    <Space>
                      <Text strong>{comment.user}</Text>
                      <Text type="secondary">{new Date(comment.date).toLocaleDateString()}</Text>
                      {comment.isHighlighted && <Tag color="gold">Highlighted</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Paragraph style={{ marginBottom: 8 }}>{comment.text}</Paragraph>
                      <Space>
                        {comment.tags.map(tag => (
                          <Tag key={tag} color="blue">{tag}</Tag>
                        ))}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />

          {comments.length > 2 && (
            <Button 
              type="link" 
              onClick={() => {
                setSelectedMatch(match);
                setFeedbackModalVisible(true);
              }}
            >
              View all {comments.length} comments
            </Button>
          )}
        </Space>
      </Space>
    );
  }, [userFeedback, getFilteredAndSortedComments]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading leaderboard data...</div>
      </div>
    );
  }

  if (error && !usingMockData) {
    return (
      <Alert
        message="Error Loading Leaderboard"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space align="center">
              <Title level={4}>Paper Rankings</Title>
              {usingMockData && (
                <Tag icon={<WarningOutlined />} color="warning">
                  Using Sample Data
                </Tag>
              )}
            </Space>
            <Text type="secondary">
              {usingMockData 
                ? 'Showing sample rankings (mock data)'
                : `Rankings based on match performance in ${category}/${subcategory} (${year})`
              }
            </Text>
          </div>
          <Table
            columns={columns}
            dataSource={data}
            pagination={false}
            rowKey="paperId"
            scroll={{ x: true }}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: setExpandedRowKeys,
              expandRowByClick: true
            }}
          />
        </Space>
      </Card>

      <Modal
        title={
          <Space>
            <span>Match Feedback</span>
            {selectedMatch && (
              <Tag color={selectedMatch.result === 'win' ? 'success' : 'error'}>
                {selectedMatch.result.toUpperCase()}
              </Tag>
            )}
          </Space>
        }
        open={feedbackModalVisible}
        onCancel={() => {
          setFeedbackModalVisible(false);
          setSelectedMatch(null);
          setComment('');
          setCommentSort('recent');
          setCommentFilter('all');
          setSelectedTags([]);
        }}
        width={800}
        footer={[
          <Space key="filters" style={{ marginRight: 'auto' }}>
            <Select
              value={commentSort}
              onChange={setCommentSort}
              style={{ width: 120 }}
              options={[
                { value: 'recent', label: 'Most Recent' },
                { value: 'popular', label: 'Most Liked' },
                { value: 'highlighted', label: 'Highlighted' }
              ]}
              suffixIcon={<SortAscendingOutlined />}
            />
            <Select
              value={commentFilter}
              onChange={setCommentFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: 'All Comments' },
                { value: 'positive', label: 'Positive' },
                { value: 'neutral', label: 'Neutral' },
                { value: 'negative', label: 'Negative' }
              ]}
              suffixIcon={<FilterOutlined />}
            />
            {selectedMatch?.feedback?.tags && (
              <Select
                mode="multiple"
                value={selectedTags}
                onChange={setSelectedTags}
                style={{ width: 200 }}
                placeholder="Filter by tags"
                options={selectedMatch.feedback.tags.map(tag => ({ value: tag, label: tag }))}
                maxTagCount={2}
              />
            )}
          </Space>,
          <Button 
            key="cancel" 
            onClick={() => {
              setFeedbackModalVisible(false);
              setSelectedMatch(null);
              setComment('');
              setCommentSort('recent');
              setCommentFilter('all');
              setSelectedTags([]);
            }}
          >
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleComment}
            disabled={!comment.trim()}
          >
            Add Comment
          </Button>
        ]}
      >
        {selectedMatch && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title="Match Details" bordered size="small">
              <Descriptions.Item label="Papers" span={3}>
                <Space direction="vertical">
                  <Text strong>{selectedMatch.opponent.title}</Text>
                  <Text type="secondary">Score: {selectedMatch.score} - {selectedMatch.opponent.score}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Date" span={3}>
                {new Date(selectedMatch.date).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Your Feedback:</Text>
              <Space>
                <Badge count={selectedMatch.feedback?.likes || 0} showZero>
                  <Button 
                    type={userFeedback[selectedMatch.matchId]?.liked ? "primary" : "default"}
                    icon={userFeedback[selectedMatch.matchId]?.liked ? <LikeFilled /> : <LikeOutlined />}
                    onClick={() => handleFeedback(selectedMatch.matchId, 'like')}
                  >
                    Like
                  </Button>
                </Badge>
                <Badge count={selectedMatch.feedback?.dislikes || 0} showZero>
                  <Button 
                    type={userFeedback[selectedMatch.matchId]?.disliked ? "primary" : "default"}
                    danger={userFeedback[selectedMatch.matchId]?.disliked}
                    icon={userFeedback[selectedMatch.matchId]?.disliked ? <DislikeFilled /> : <DislikeOutlined />}
                    onClick={() => handleFeedback(selectedMatch.matchId, 'dislike')}
                  >
                    Dislike
                  </Button>
                </Badge>
              </Space>
            </Space>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Add Comment:</Text>
              <Input.TextArea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your thoughts on this match..."
                rows={4}
                style={{ marginTop: 8 }}
              />
              {selectedMatch.feedback?.tags && (
                <Space>
                  <Text type="secondary">Add tags:</Text>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Add tags to your comment"
                    options={selectedMatch.feedback.tags.map(tag => ({ value: tag, label: tag }))}
                  />
                </Space>
              )}
            </Space>

            <Divider>Comments</Divider>

            {selectedMatch.feedback?.comments && Array.isArray(selectedMatch.feedback.comments) ? (
              <List
                dataSource={getFilteredAndSortedComments(selectedMatch)}
                renderItem={comment => {
                  if (!comment) return null;
                  return (
                    <List.Item
                      actions={[
                        <Button 
                          key="highlight"
                          type="text" 
                          icon={comment.isHighlighted ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                          onClick={() => {/* Toggle highlight */}}
                        />,
                        <Button 
                          key="report"
                          type="text" 
                          icon={<FlagOutlined />}
                          onClick={() => {/* Report comment */}}
                        />,
                        <Button 
                          key="like"
                          type="text" 
                          icon={<LikeOutlined />}
                        >
                          {comment.likes || 0}
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user || 'Anonymous'}`} />}
                        title={
                          <Space>
                            <Text strong>{comment.user || 'Anonymous'}</Text>
                            <Text type="secondary">{new Date(comment.date).toLocaleDateString()}</Text>
                            {comment.isHighlighted && <Tag color="gold">Highlighted</Tag>}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Paragraph style={{ marginBottom: 8 }}>{comment.text}</Paragraph>
                            {comment.tags && Array.isArray(comment.tags) && comment.tags.length > 0 && (
                              <Space>
                                {comment.tags.map(tag => (
                                  <Tag key={tag} color="blue">{tag}</Tag>
                                ))}
                              </Space>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
                locale={{ emptyText: 'No comments yet. Be the first to comment!' }}
              />
            ) : (
              <Empty description="No comments yet. Be the first to comment!" />
            )}
          </Space>
        )}
      </Modal>
    </>
  );
};

export default React.memo(LeaderboardTable); 