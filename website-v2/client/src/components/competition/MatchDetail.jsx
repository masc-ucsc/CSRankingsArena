import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Space, 
  Divider, 
  Tag, 
  Button, 
  Rate, 
  Input, 
  message, 
  Row, 
  Col, 
  Statistic,
  Progress,
  List,
  Avatar,
  Tooltip,
  Modal,
  Result
} from 'antd';
import { 
  LikeOutlined, 
  DislikeOutlined, 
  CommentOutlined, 
  TrophyOutlined,
  UserOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { fetchMatchDetails } from '../../services/v2/api';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const MatchDetail = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: '',
    isAnonymous: false
  });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const loadMatchDetails = async () => {
      try {
        const data = await fetchMatchDetails(matchId);
        setMatch(data);
      } catch (error) {
        console.error('Error loading match details:', error);
        message.error('Failed to load match details');
      } finally {
        setLoading(false);
      }
    };

    loadMatchDetails();
  }, [matchId]);

  const handleFeedbackSubmit = async () => {
    setSubmittingFeedback(true);
    try {
      // TODO: Replace with actual API endpoint
      await axios.post(`/api/v2/matches/${matchId}/feedback`, {
        ...feedback,
        matchId
      });
      message.success('Thank you for your feedback!');
      setShowFeedbackModal(false);
      setFeedback({ rating: 0, comment: '', isAnonymous: false });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const renderMatchHeader = () => (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Match Details</Title>
            <Text type="secondary">Match ID: {match?.id}</Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<CommentOutlined />}
              onClick={() => setShowFeedbackModal(true)}
            >
              Provide Feedback
            </Button>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Category"
                value={match?.category}
                prefix={<Tag color="blue">{match?.category}</Tag>}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Subcategory"
                value={match?.subcategory}
                prefix={<Tag color="green">{match?.subcategory}</Tag>}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Year"
                value={match?.year}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </Card>
  );

  const renderPaperComparison = () => (
    <Card title="Paper Comparison" style={{ marginTop: 16 }}>
      <Row gutter={[16, 16]}>
        {match?.reviews.map((review, index) => (
          <Col span={12} key={review.paperId}>
            <Card>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Title level={4}>
                  Paper {index + 1}
                  {match.comparison.winner === review.paperId && (
                    <Tooltip title="Winner">
                      <TrophyOutlined style={{ color: 'gold', marginLeft: 8 }} />
                    </Tooltip>
                  )}
                </Title>
                <Space direction="vertical" size="small">
                  {review.scores.map((score, i) => (
                    <div key={i}>
                      <Text strong>{score.aspect}</Text>
                      <Progress 
                        percent={score.score * 10} 
                        status={score.score >= 8 ? "success" : score.score >= 5 ? "normal" : "exception"}
                        format={percent => `${(percent / 10).toFixed(1)}/10`}
                      />
                    </div>
                  ))}
                </Space>
                <Divider />
                <Paragraph>
                  <Text strong>Reviewer: </Text>
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <Text>{review.reviewer.name}</Text>
                    <Tag color="blue">{review.reviewer.provider}</Tag>
                  </Space>
                </Paragraph>
                <Paragraph>
                  <Text strong>Analysis: </Text>
                  {review.analysis}
                </Paragraph>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );

  const renderComparisonMetrics = () => (
    <Card title="Comparison Metrics" style={{ marginTop: 16 }}>
      <List
        dataSource={match?.comparison.metricComparison}
        renderItem={metric => (
          <List.Item>
            <Row style={{ width: '100%' }} align="middle">
              <Col span={6}>
                <Text strong>{metric.metric}</Text>
              </Col>
              <Col span={18}>
                <Progress 
                  percent={Math.abs(metric.difference) * 10}
                  status={metric.difference > 0 ? "success" : "exception"}
                  format={percent => `${Math.abs(metric.difference).toFixed(1)} points difference`}
                />
              </Col>
            </Row>
          </List.Item>
        )}
      />
    </Card>
  );

  const renderFeedbackModal = () => (
    <Modal
      title="Provide Feedback"
      open={showFeedbackModal}
      onOk={handleFeedbackSubmit}
      onCancel={() => setShowFeedbackModal(false)}
      confirmLoading={submittingFeedback}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>How would you rate this match?</Text>
          <Rate 
            value={feedback.rating} 
            onChange={value => setFeedback(prev => ({ ...prev, rating: value }))}
          />
        </div>
        <div>
          <Text strong>Your Comments</Text>
          <TextArea
            rows={4}
            value={feedback.comment}
            onChange={e => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Share your thoughts about this match..."
          />
        </div>
        <div>
          <Button
            type={feedback.isAnonymous ? "primary" : "default"}
            onClick={() => setFeedback(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
          >
            {feedback.isAnonymous ? "Anonymous Feedback" : "Public Feedback"}
          </Button>
        </div>
      </Space>
    </Modal>
  );

  if (loading) {
    return <Card loading={true} />;
  }

  if (!match) {
    return (
      <Card>
        <Result
          status="error"
          title="Match Not Found"
          subTitle="The requested match could not be found."
          extra={
            <Button type="primary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {renderMatchHeader()}
      {renderPaperComparison()}
      {renderComparisonMetrics()}
      {renderFeedbackModal()}
    </div>
  );
};

export default MatchDetail; 