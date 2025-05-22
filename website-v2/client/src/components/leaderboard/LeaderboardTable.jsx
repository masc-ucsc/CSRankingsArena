import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Table, Card, Typography, Spin, Alert, Tag, Space, Collapse, Descriptions, Rate, Tooltip, Button, Input, Modal, message, Select, Radio, Divider, Badge, Popover, List, Avatar, Empty, Row, Col } from 'antd';
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
import LeaderboardFeedback from './LeaderboardFeedback';

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
  const [feedbackLoading, setFeedbackLoading] = useState({});
  const [commentLoading, setCommentLoading] = useState(false);
  const [matchFeedback, setMatchFeedback] = useState({});
  const tableRef = useRef(null);

  // Add scrollToPaper function
  const scrollToPaper = useCallback((paperId) => {
    if (!tableRef.current) return;
    
    const tableElement = tableRef.current;
    const paperRow = tableElement.querySelector(`[data-row-key="${paperId}"]`);
    
    if (paperRow) {
      // Expand the row if it's not already expanded
      if (!expandedRowKeys.includes(paperId)) {
        setExpandedRowKeys(prev => [...prev, paperId]);
      }
      
      // Scroll to the paper row with smooth behavior
      paperRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [expandedRowKeys]);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!category || !subcategory || !year) return;

      setLoading(true);
      setError(null);
      setUsingMockData(false);

      try {
        // First try to get real data
        const response = await api.get('/leaderboard', {
          params: {
            category,
            subcategory,
            year,
            limit: 100
          }
        });

        // Check if we have valid data

        console.log('RESPONSE: leaderboard', response.data);

        if (response.data && Array.isArray(response.data.rankings) && response.data.rankings.length > 0) {
          // Check if any of the papers have real paperIds (not starting with 'mock-')
          const hasRealData = response.data.rankings.some(paper => 
            paper.paperId && !paper.paperId.startsWith('mock-')
          );

          if (hasRealData) {
            setData(response.data.rankings);
            setUsingMockData(false);
          } else {
            // If all papers are mock data, use mock data
            console.log('All papers are mock data, using mock data');
            setData(getMockLeaderboardData());
            setUsingMockData(true);
          }
        } else {
          // If no valid data, use mock data
          console.log('No valid rankings data available, using mock data');
          setData(getMockLeaderboardData());
          setUsingMockData(true);
        }
      } catch (err) {
        // Handle errors by using mock data
        console.warn('Error fetching rankings, using mock data as fallback:', err);
        setData(getMockLeaderboardData());
        setUsingMockData(true);
        setError(null); // Clear any previous errors since we're using mock data
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [category, subcategory, year]);

  // Add fetchMatchDetails function
  const fetchMatchDetails = async (matchId) => {
    try {
      const response = await api.get(`/api/v2/matches/${matchId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching match details:', error);
      throw error;
    }
  };

  // Add loadFeedback function
  const loadFeedback = useCallback(async (matchId) => {
    try {
      setFeedbackLoading(prev => ({ ...prev, [matchId]: true }));
      const response = await api.get(`/api/v2/matches/${matchId}/feedback`);
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        setMatchFeedback(prev => ({
          ...prev,
          [matchId]: response.data.data[0]
        }));
      } else {
        setMatchFeedback(prev => ({
          ...prev,
          [matchId]: { likes: 0, dislikes: 0, comments: [] }
        }));
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      message.error('Failed to load feedback');
    } finally {
      setFeedbackLoading(prev => ({ ...prev, [matchId]: false }));
    }
  }, []);

  // Update handleFeedback function to use submitMatchFeedback pattern
  const handleFeedback = useCallback(async (matchId, type) => {
    try {
      setFeedbackLoading(prev => ({ ...prev, [matchId]: true }));
      
      const response = await api.post(`/api/matches/${matchId}/feedback`, {
        type,
        action: userFeedback[matchId]?.[type === 'like' ? 'liked' : 'disliked'] ? 'remove' : 'add'
      });

      const { success, feedback } = response.data;
      
      if (success) {
        const match = data.flatMap(p => p.matches).find(m => m.matchId === matchId);
        if (match) {
          // Update the match feedback with new counts from server
          match.feedback.likes = feedback.likes;
          match.feedback.dislikes = feedback.dislikes;
          
          // Update local user feedback state
          const currentFeedback = userFeedback[matchId] || { liked: false, disliked: false };
          const newFeedback = { ...currentFeedback };

          if (type === 'like') {
            newFeedback.liked = !currentFeedback.liked;
            newFeedback.disliked = false;
          } else if (type === 'dislike') {
            newFeedback.disliked = !currentFeedback.disliked;
            newFeedback.liked = false;
          }

          setUserFeedback(prev => ({ ...prev, [matchId]: newFeedback }));
          message.success(`Feedback ${type === 'like' ? 'liked' : 'disliked'} successfully!`);
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setFeedbackLoading(prev => ({ ...prev, [matchId]: false }));
    }
  }, [data, userFeedback]);

  // Update handleComment function to reload feedback after comment
  const handleComment = useCallback(async () => {
    if (!comment.trim() || !selectedMatch) return;

    try {
      setCommentLoading(true);

      const response = await api.post(`/api/matches/${selectedMatch.matchId}/comments`, {
        text: comment.trim(),
        tags: selectedTags
      });

      const { success, comment: newComment } = response.data;

      if (success) {
        // Update the match with the new comment from server
        selectedMatch.feedback.comments.unshift(newComment);
        setComment('');
        setFeedbackModalVisible(false);
        message.success('Comment added successfully!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  }, [comment, selectedMatch, selectedTags]);

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
              <a href={record.url} target="_blank" rel="noopener noreferrer">
                {title} <LinkOutlined style={{ fontSize: '12px' }} />
              </a>
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
                <Text>vs </Text>
                <Button 
                  type="link" 
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToPaper(match.opponent.paperId);
                  }}
                >
                  {match.opponent.title}
                </Button>
                <Text type="secondary">Score: {match.score} - {match.opponent.score}</Text>
                <Text type="secondary">{new Date(match.date).toLocaleDateString()}</Text>
              </Space>
            }
          >
            {/* Feedback for this match */}
            <LeaderboardFeedback matchId={match.matchId} />
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
                <Descriptions.Item label="Your Paper" span={1}>
                  <Text strong>{record.title}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Opponent Paper" span={1}>
                  <Text strong>{match.opponent.title}</Text>
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

              {/* Reviews Section */}
              <div style={{ marginTop: 24 }}>
                {console.log('.filter(review => review.paperId === record.paperId) ------} this is not happening')}
                <Title level={4}>Paper Reviews</Title>
                <Row gutter={[24, 24]}>
                  {/* Your Paper Reviews */}
                  <Col span={12}>
                    <Card title={
                      <Space>
                        <Text strong>Reviews for </Text>
                        <Tag color="blue">{record.paperId}</Tag>
                      </Space>
                    } bordered>
                      {match.reviews
                        .filter(review => review.paperId === record.paperId)
                        .map((review, idx) => (
                          <div key={`review-${idx}`} style={{ marginBottom: 24 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Space>
                                <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer.id}`} size="small" />
                                <Text strong>{review.reviewer.name}</Text>
                                <Tag color="blue">{review.reviewer.provider}</Tag>
                              </Space>
                              
                              <Descriptions size="small" bordered>
                                {review.scores.map((score, scoreIdx) => (
                                  <Descriptions.Item key={`${score.aspect}-${scoreIdx}`} label={score.aspect} span={3}>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                      <Space>
                                        <Rate disabled defaultValue={score.score} count={10} />
                                        <Text>{score.score.toFixed(1)}/10</Text>
                                      </Space>
                                      <Card size="small" style={{ marginTop: 8, backgroundColor: '#fafafa' }}>
                                        <Text type="secondary">{score.comment}</Text>
                                      </Card>
                                    </Space>
                                  </Descriptions.Item>
                                ))}
                                <Descriptions.Item label="Overall Score" span={3}>
                                  <Space direction="vertical" style={{ width: '100%' }}>
                                    <Space>
                                      <Rate disabled defaultValue={review.overallScore} count={10} />
                                      <Text strong>{review.overallScore.toFixed(1)}/10</Text>
                                    </Space>
                                    <Card size="small" style={{ marginTop: 8, backgroundColor: '#fafafa' }}>
                                      <Text type="secondary">{review.summary}</Text>
                                    </Card>
                                  </Space>
                                </Descriptions.Item>
                                {review.detailedFeedback && (
                                  <Descriptions.Item label="Detailed Analysis" span={3}>
                                    <List
                                      size="small"
                                      dataSource={review.detailedFeedback}
                                      renderItem={(item, index) => (
                                        <List.Item key={`feedback-${index}`}>
                                          <Card size="small" style={{ width: '100%', backgroundColor: '#fafafa' }}>
                                            <Text type="secondary">{item}</Text>
                                          </Card>
                                        </List.Item>
                                      )}
                                    />
                                  </Descriptions.Item>
                                )}
                              </Descriptions>
                            </Space>
                          </div>
                        ))}
                    </Card>
                  </Col>

                  {/* Opponent Paper Reviews */}
                  <Col span={12}>
                    <Card title={
                      <Space>
                        <Text strong>Reviews for </Text>
                        <Tag color="blue">{match.opponent.paperId}</Tag>
                      </Space>
                    } bordered>
                      {match.reviews
                        .filter(review => review.paperId === match.opponent.paperId)
                        .map((review, idx) => (
                          <div key={`review-${idx}`} style={{ marginBottom: 24 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Space>
                                <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer.id}`} size="small" />
                                <Text strong>{review.reviewer.name}</Text>
                                <Tag color="blue">{review.reviewer.provider}</Tag>
                              </Space>
                              
                              <Descriptions size="small" bordered>
                                {review.scores.map((score, scoreIdx) => (
                                  <Descriptions.Item key={`${score.aspect}-${scoreIdx}`} label={score.aspect} span={3}>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                      <Space>
                                        <Rate disabled defaultValue={score.score} count={10} />
                                        <Text>{score.score.toFixed(1)}/10</Text>
                                      </Space>
                                      <Card size="small" style={{ marginTop: 8, backgroundColor: '#fafafa' }}>
                                        <Text type="secondary">{score.comment}</Text>
                                      </Card>
                                    </Space>
                                  </Descriptions.Item>
                                ))}
                                <Descriptions.Item label="Overall Score" span={3}>
                                  <Space direction="vertical" style={{ width: '100%' }}>
                                    <Space>
                                      <Rate disabled defaultValue={review.overallScore} count={10} />
                                      <Text strong>{review.overallScore.toFixed(1)}/10</Text>
                                    </Space>
                                    <Card size="small" style={{ marginTop: 8, backgroundColor: '#fafafa' }}>
                                      <Text type="secondary">{review.summary}</Text>
                                    </Card>
                                  </Space>
                                </Descriptions.Item>
                                {review.detailedFeedback && (
                                  <Descriptions.Item label="Detailed Analysis" span={3}>
                                    <List
                                      size="small"
                                      dataSource={review.detailedFeedback}
                                      renderItem={(item, index) => (
                                        <List.Item key={`feedback-${index}`}>
                                          <Card size="small" style={{ width: '100%', backgroundColor: '#fafafa' }}>
                                            <Text type="secondary">{item}</Text>
                                          </Card>
                                        </List.Item>
                                      )}
                                    />
                                  </Descriptions.Item>
                                )}
                              </Descriptions>
                            </Space>
                          </div>
                        ))}
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Comparison Section */}
              {match.comparison && (
                <div style={{ marginTop: 24 }}>
                  <Title level={4}>Comparison and Winner</Title>
                  <Card bordered>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Descriptions bordered>
                        <Descriptions.Item label="Winner" span={3}>
                          <Space>
                            <Tag color="gold" style={{ fontSize: '16px', padding: '4px 8px' }}>
                              <TrophyOutlined /> {match.comparison.winner === record.paperId ? 'Your Paper' : 'Opponent Paper'}
                            </Tag>
                            <Text strong style={{ fontSize: '16px' }}>
                              {match.comparison.winner === record.paperId ? record.title : match.opponent.title}
                            </Text>
                            <Tag color="blue">
                              {match.comparison.winner === record.paperId ? record.paperId : match.opponent.paperId}
                            </Tag>
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Reasoning" span={3}>
                          <Text>{match.comparison.reasoning}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Overall Scores" span={3}>
                          <Space>
                            <Text strong>Your Paper:</Text>
                            <Rate disabled defaultValue={match.comparison.overallScores[record.paperId]} count={10} />
                            <Text>{match.comparison.overallScores[record.paperId].toFixed(1)}</Text>
                            <Text strong style={{ marginLeft: 16 }}>Opponent Paper:</Text>
                            <Rate disabled defaultValue={match.comparison.overallScores[match.opponent.paperId]} count={10} />
                            <Text>{match.comparison.overallScores[match.opponent.paperId].toFixed(1)}</Text>
                          </Space>
                        </Descriptions.Item>
                      </Descriptions>

                      <Table
                        size="small"
                        pagination={false}
                        dataSource={match.comparison.metricComparison.map(item => ({
                          ...item,
                          key: item.metric
                        }))}
                        columns={[
                          {
                            title: 'Aspect',
                            dataIndex: 'metric',
                            key: 'metric',
                            width: '30%'
                          },
                          {
                            title: record.title,
                            dataIndex: ['scores', record.paperId],
                            key: 'paper1',
                            width: '25%',
                            render: (score) => (
                              <Space>
                                <Rate disabled defaultValue={score} count={10} />
                                <Text>{score.toFixed(1)}</Text>
                              </Space>
                            )
                          },
                          {
                            title: match.opponent.title,
                            dataIndex: ['scores', match.opponent.paperId],
                            key: 'paper2',
                            width: '25%',
                            render: (score) => (
                              <Space>
                                <Rate disabled defaultValue={score} count={10} />
                                <Text>{score.toFixed(1)}</Text>
                              </Space>
                            )
                          },
                          {
                            title: 'Difference',
                            dataIndex: 'difference',
                            key: 'difference',
                            width: '20%',
                            render: (diff) => (
                              <Text style={{ 
                                color: diff > 0 ? '#52c41a' : diff < 0 ? '#f5222d' : '#666',
                                fontWeight: 'bold'
                              }}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                              </Text>
                            )
                          }
                        ]}
                      />
                    </Space>
                  </Card>
                </div>
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

  // Update the feedback rendering to use matchFeedback state
  const renderFeedback = useCallback((match) => {
    if (!match?.matchId) return null;

    const currentFeedback = userFeedback[match.matchId] || { liked: false, disliked: false };
    const feedback = matchFeedback[match.matchId] || { likes: 0, dislikes: 0, comments: [] };
    const comments = getFilteredAndSortedComments(feedback);
    
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Badge count={feedback.likes} showZero>
              <Button 
                type={currentFeedback.liked ? "primary" : "default"}
                icon={currentFeedback.liked ? <LikeFilled /> : <LikeOutlined />}
                onClick={() => handleFeedback(match.matchId, 'like')}
                loading={feedbackLoading[match.matchId]}
              >
                Like
              </Button>
            </Badge>
            <Badge count={feedback.dislikes} showZero>
              <Button 
                type={currentFeedback.disliked ? "primary" : "default"}
                danger={currentFeedback.disliked}
                icon={currentFeedback.disliked ? <DislikeFilled /> : <DislikeOutlined />}
                onClick={() => handleFeedback(match.matchId, 'dislike')}
                loading={feedbackLoading[match.matchId]}
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
            {comments.slice(0, 3).map((comment, index) => (
              <Tag key={comment.id || `recent-comment-${index}`} color="blue">{comment.text.slice(0, 20)}</Tag>
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
            renderItem={(comment, index) => (
              <List.Item
                key={comment.id || `${comment.user}-${index}`}
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
                <Popover
                  content={
                    <div style={{ maxWidth: 300 }}>
                      <p>This leaderboard is showing sample data because:</p>
                      <ul>
                        <li>No real match data is available for this category/year</li>
                        <li>Or there was an error fetching the real data</li>
                      </ul>
                      <p>The sample data demonstrates how the leaderboard will look with real matches.</p>
                    </div>
                  }
                  title="Sample Data Notice"
                >
                  <Tag icon={<WarningOutlined />} color="warning" style={{ cursor: 'help' }}>
                    Using Sample Data
                  </Tag>
                </Popover>
              )}
            </Space>
            <Text type="secondary">
              {usingMockData 
                ? 'Showing sample rankings to demonstrate the leaderboard format'
                : `Rankings based on actual match performance\nin ${category}/${subcategory} (${year})`
              }
            </Text>
          </div>
          <div ref={tableRef}>
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
          </div>
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
            loading={commentLoading}
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