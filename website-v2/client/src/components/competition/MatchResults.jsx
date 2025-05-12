import React, { useState, useEffect } from 'react';
import { Card, Space, Typography, Button, Rate, Input, List, Divider, Tag, Modal, message, Statistic, Row, Col, Tabs, Avatar, Badge } from 'antd';
import { LikeOutlined, DislikeOutlined, MessageOutlined, RobotOutlined, StarOutlined, LikeFilled, DislikeFilled, CommentOutlined, HistoryOutlined, BarChartOutlined, TrophyOutlined, FileTextOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons';
import { competitionService } from '../../services/competitionService';
import FeedbackHistory from './FeedbackHistory';
import AgentPerformanceChart from './AgentPerformanceChart';
import useWebSocket from '../../hooks/useWebSocket';
import { addFeedback, likeFeedback } from '../../services/competitionService';
import { formatDistanceToNow } from 'date-fns';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const MatchResults = ({ match, onFeedback, onClose, showFeedback = true, allowComments = true, showLikes = true }) => {
  const [feedback, setFeedback] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [userFeedback, setUserFeedback] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('reviews');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'initial':
        setFeedback(message.data.feedback);
        setPerformance(message.data.performance);
        break;
      case 'feedback':
        setFeedback(prev => [message.data, ...prev]);
        break;
      case 'feedback_update':
        setFeedback(prev => 
          prev.map(f => f.id === message.data.id ? message.data : f)
        );
        break;
      case 'performance':
        setPerformance(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const { sendMessage } = useWebSocket(match.id, handleWebSocketMessage);

  const handleLike = async (feedbackId, liked) => {
    try {
      await likeFeedback(feedbackId, match.id, liked);
      // WebSocket will handle the update
    } catch (error) {
      message.error('Failed to update like status');
    }
  };

  const handleFeedback = async (values) => {
    setSubmitting(true);
    try {
      const response = await addFeedback({
        matchId: match.id,
        agentId: values.agentId,
        rating: values.rating,
        comment: values.comment,
        liked: values.liked
      });
      
      setUserFeedback(prev => ({
        ...prev,
        [values.agentId]: response
      }));

      if (onClose) {
        onClose(response);
      }
      
      message.success('Feedback submitted successfully');
    } catch (error) {
      message.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFeedbackList = () => (
    <List
      className="feedback-list"
      itemLayout="horizontal"
      dataSource={feedback}
      renderItem={item => (
        <List.Item
          actions={[
            <Space>
              <Button
                type="text"
                icon={item.liked ? <LikeFilled /> : <LikeOutlined />}
                onClick={() => handleLike(item.id, !item.liked)}
              >
                {item.likes || 0}
              </Button>
              <Button
                type="text"
                icon={item.liked === false ? <DislikeFilled /> : <DislikeOutlined />}
                onClick={() => handleLike(item.id, false)}
              />
            </Space>
          ]}
        >
          <List.Item.Meta
            avatar={<Avatar>{item.user?.username?.[0] || 'A'}</Avatar>}
            title={
              <Space>
                <Text strong>{item.user?.username || 'Anonymous'}</Text>
                <Text type="secondary">{new Date(item.created_at).toLocaleString()}</Text>
              </Space>
            }
            description={
              <Space direction="vertical" size="small">
                <Rate disabled defaultValue={item.rating} />
                <Text>{item.comment}</Text>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );

  const renderPerformanceMetrics = () => {
    if (!performance) return null;

    return (
      <div className="performance-metrics">
        <h3>Performance Metrics</h3>
        <Space direction="vertical" style={{ width: '100%' }}>
          {[performance.agent1, performance.agent2].map((agent, index) => (
            <Card key={index} title={`Agent ${index + 1} Performance`}>
              <p>Total Matches: {agent.total_matches}</p>
              <p>Win Rate: {(agent.win_rate * 100).toFixed(1)}%</p>
              <p>Average Rating: {agent.feedback?.avg_rating?.toFixed(1) || 'N/A'}</p>
              <p>Total Feedback: {agent.feedback?.total_feedback || 0}</p>
              <p>Likes: {agent.feedback?.total_likes || 0}</p>
              <p>Dislikes: {agent.feedback?.total_dislikes || 0}</p>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderAgentStats = (agentId) => {
    const stats = performance?.agentStats?.[agentId] || {};
    if (!stats) return null;

    return (
      <Row gutter={16} style={{ marginTop: '16px' }}>
        <Col span={8}>
          <Statistic
            title="Average Rating"
            value={stats.avg_rating?.toFixed(1) || 0}
            prefix={<StarOutlined />}
            precision={1}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Likes"
            value={stats.total_likes || 0}
            prefix={<LikeFilled style={{ color: '#52c41a' }} />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Dislikes"
            value={stats.total_dislikes || 0}
            prefix={<DislikeFilled style={{ color: '#ff4d4f' }} />}
          />
        </Col>
      </Row>
    );
  };

  const renderAgentReview = (agent, agentId) => {
    const feedback = performance?.feedback?.[agentId]?.feedback || {};
    const likes = feedback.total_likes || 0;
    const dislikes = feedback.total_dislikes || 0;
    const comments = feedback.comments || [];
    const avgRating = feedback.avg_rating || 0;

    return (
      <Card 
        style={{ 
          marginBottom: '16px',
          border: feedback.find(f => f.agentId === agentId && f.liked !== null) ? 
            `2px solid ${feedback.find(f => f.agentId === agentId && f.liked) ? '#52c41a' : '#ff4d4f'}` : undefined
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Avatar src={agent.avatar_url} icon={<RobotOutlined />} />
              <div>
                <Title level={4} style={{ margin: 0 }}>{agent.name}</Title>
                <Text type="secondary">{agent.provider}</Text>
              </div>
            </Space>
            <Space>
              <Button
                type={feedback.find(f => f.agentId === agentId && f.liked === true) ? "primary" : "default"}
                icon={<LikeOutlined />}
                onClick={() => handleLike(feedback.find(f => f.agentId === agentId)?.id, true)}
              >
                {likes}
              </Button>
              <Button
                type={feedback.find(f => f.agentId === agentId && f.liked === false) ? "primary" : "default"}
                danger
                icon={<DislikeOutlined />}
                onClick={() => handleLike(feedback.find(f => f.agentId === agentId)?.id, false)}
              >
                {dislikes}
              </Button>
            </Space>
          </div>

          <div>
            <Title level={5}>Review</Title>
            <Paragraph>{agent.review}</Paragraph>
          </div>

          <div>
            <Title level={5}>Evaluation</Title>
            <List
              size="small"
              dataSource={agent.evaluation}
              renderItem={item => (
                <List.Item>
                  <Space>
                    <Tag color={item.score >= 0.7 ? 'green' : item.score >= 0.4 ? 'orange' : 'red'}>
                      {item.criterion}
                    </Tag>
                    <Text>{item.comment}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </div>

          {renderAgentStats(agent.id)}

          <div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Rate this review:</Text>
                <Rate 
                  value={avgRating} 
                  onChange={(value) => handleFeedback({ agentId, rating: value })}
                  style={{ marginLeft: '8px' }}
                />
              </div>
            </Space>
          </div>

          {allowComments && (
            <div>
              <Title level={5}>Comments</Title>
              {selectedAgent === agent.id ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <TextArea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your comment..."
                    rows={4}
                  />
                  <Space>
                    <Button 
                      type="primary" 
                      onClick={() => handleFeedback({ agentId, rating: rating, comment: comment, liked: feedback.find(f => f.agentId === agentId)?.liked })}
                    >
                      Submit Comment
                    </Button>
                    <Button onClick={() => setSelectedAgent(null)}>
                      Cancel
                    </Button>
                  </Space>
                </Space>
              ) : (
                <Button 
                  icon={<CommentOutlined />} 
                  onClick={() => setSelectedAgent(agent.id)}
                >
                  Add Comment
                </Button>
              )}
              <List
                dataSource={comments}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Space>
                          <span>{item.username || 'Anonymous'}</span>
                          {item.rating && <Rate disabled defaultValue={item.rating} />}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small">
                          <Text>{item.comment}</Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </Space>
      </Card>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge status="success" text="Completed" />;
      case 'pending':
        return <Badge status="processing" text="Pending" />;
      case 'error':
        return <Badge status="error" text="Error" />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  return (
    <div className="match-results">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>Match Results</Title>
            {onClose && <Button onClick={onClose}>Close</Button>}
          </div>

          <Tabs defaultActiveKey="reviews" onChange={setActiveTab}>
            <TabPane
              tab={
                <span>
                  <CommentOutlined />
                  Reviews
                </span>
              }
              key="reviews"
            >
              <div className="match-reviews">
                {match.agents.map((agent, index) => (
                  <React.Fragment key={agent.id}>
                    {renderAgentReview(agent, `agent${index + 1}`)}
                    {index < match.agents.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </div>
            </TabPane>
            <TabPane
              tab={
                <span>
                  <HistoryOutlined />
                  Feedback History
                </span>
              }
              key="history"
            >
              <FeedbackHistory matchId={match.id} />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <BarChartOutlined />
                  Performance
                </span>
              }
              key="performance"
            >
              {renderPerformanceMetrics()}
            </TabPane>
          </Tabs>

          <Modal
            title="Add Feedback"
            open={selectedAgent !== null}
            onOk={() => handleFeedback({ agentId: selectedAgent, rating: rating, comment: comment, liked: feedback.find(f => f.agentId === selectedAgent)?.liked })}
            onCancel={() => {
              setSelectedAgent(null);
              setComment('');
              setRating(0);
            }}
            confirmLoading={submitting}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Rating:</Text>
              <Rate value={rating} onChange={setRating} />
              <Text>Comment:</Text>
              <TextArea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
                placeholder="Enter your feedback..."
              />
            </Space>
          </Modal>
        </Space>
      </Card>
    </div>
  );
};

export default MatchResults; 