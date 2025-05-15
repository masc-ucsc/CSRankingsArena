import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Space, Tag, Select, DatePicker, Statistic, Row, Col, Timeline } from 'antd';
import { LikeOutlined, DislikeOutlined, StarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { competitionService } from '../../services/competitionService';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const FeedbackHistory = ({ matchId, agentId }) => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: null,
    rating: null,
    sentiment: null
  });

  useEffect(() => {
    loadFeedback();
  }, [matchId, agentId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getMatchFeedback(matchId);
      // Filter by agent if agentId is provided
      const filteredData = agentId 
        ? data.filter(f => f.agent_id === agentId)
        : data;
      setFeedback(filteredData);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const getFilteredFeedback = () => {
    return feedback.filter(item => {
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        const feedbackDate = dayjs(item.created_at);
        if (!feedbackDate.isBetween(start, end, 'day', '[]')) {
          return false;
        }
      }
      if (filters.rating && item.rating !== filters.rating) {
        return false;
      }
      if (filters.sentiment) {
        if (filters.sentiment === 'positive' && !item.liked) return false;
        if (filters.sentiment === 'negative' && item.liked) return false;
      }
      return true;
    });
  };

  const renderFeedbackStats = () => {
    const filteredData = getFilteredFeedback();
    const stats = {
      total: filteredData.length,
      avgRating: filteredData.reduce((acc, curr) => acc + (curr.rating || 0), 0) / filteredData.length || 0,
      likes: filteredData.filter(f => f.liked).length,
      dislikes: filteredData.filter(f => !f.liked).length
    };

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="Total Feedback"
            value={stats.total}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Average Rating"
            value={stats.avgRating.toFixed(1)}
            prefix={<StarOutlined />}
            precision={1}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Likes"
            value={stats.likes}
            prefix={<LikeOutlined style={{ color: '#52c41a' }} />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Dislikes"
            value={stats.dislikes}
            prefix={<DislikeOutlined style={{ color: '#ff4d4f' }} />}
          />
        </Col>
      </Row>
    );
  };

  const renderFeedbackItem = (item) => (
    <List.Item>
      <Card style={{ width: '100%' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Text strong>{item.user_name || 'Anonymous'}</Text>
              <Text type="secondary">{dayjs(item.created_at).format('MMM D, YYYY h:mm A')}</Text>
            </Space>
            <Space>
              {item.rating && (
                <Tag icon={<StarOutlined />} color="gold">
                  {item.rating} Stars
                </Tag>
              )}
              {item.liked !== null && (
                <Tag color={item.liked ? 'success' : 'error'}>
                  {item.liked ? 'Liked' : 'Disliked'}
                </Tag>
              )}
            </Space>
          </div>
          {item.comment && (
            <Paragraph style={{ marginTop: 8 }}>{item.comment}</Paragraph>
          )}
        </Space>
      </Card>
    </List.Item>
  );

  return (
    <div className="feedback-history">
      <Title level={4}>Feedback History</Title>
      
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <RangePicker
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              allowClear
            />
            <Select
              placeholder="Filter by rating"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleFilterChange('rating', value)}
            >
              {[1, 2, 3, 4, 5].map(rating => (
                <Select.Option key={rating} value={rating}>
                  {rating} Stars
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Filter by sentiment"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleFilterChange('sentiment', value)}
            >
              <Select.Option value="positive">Positive</Select.Option>
              <Select.Option value="negative">Negative</Select.Option>
            </Select>
          </Space>
          
          {renderFeedbackStats()}
        </Space>
      </Card>

      <Timeline>
        {getFilteredFeedback().map((item, index) => (
          <Timeline.Item
            key={item.id}
            color={item.liked ? 'green' : 'red'}
            dot={item.rating ? <StarOutlined style={{ color: '#faad14' }} /> : undefined}
          >
            {renderFeedbackItem(item)}
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
};

export default FeedbackHistory; 