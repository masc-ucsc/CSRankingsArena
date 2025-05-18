import React, { useState, useEffect } from 'react';
import { 
  Space, 
  Button, 
  Badge, 
  Modal, 
  Input, 
  List, 
  Avatar, 
  Rate, 
  message,
  Select,
  Tag
} from 'antd';
import { 
  LikeOutlined, 
  LikeFilled, 
  DislikeOutlined, 
  DislikeFilled,
  MessageOutlined,
  UserOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

const LeaderboardFeedback = ({ matchId }) => {
  const [feedback, setFeedback] = useState({
    likes: 0,
    dislikes: 0,
    comments: []
  });
  const [userFeedback, setUserFeedback] = useState({
    liked: false,
    disliked: false
  });
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentSort, setCommentSort] = useState('recent');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line
  }, [matchId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v2/matches/${matchId}/feedback`);
      if (response.data && response.data.data && response.data.data.length > 0) {
        setFeedback(response.data.data[0]);
      } else {
        setFeedback({ likes: 0, dislikes: 0, comments: [] });
      }
      // Optionally, fetch user feedback if you have a separate endpoint
    } catch (error) {
      console.error('Error loading feedback:', error);
      message.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (type) => {
    try {
      const action = userFeedback[type] ? 'remove' : 'add';
      const response = await axios.post(`/api/v2/matches/${matchId}/feedback`, {
        type,
        action
      });
      if (response.data && response.data.data && response.data.data.feedback) {
        setFeedback(prev => ({
          ...prev,
          likes: response.data.data.feedback.likes,
          dislikes: response.data.data.feedback.dislikes
        }));
        setUserFeedback(response.data.data.userFeedback);
      }
      message.success(userFeedback[type] ? 'Feedback removed' : 'Feedback added');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback');
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) {
      message.warning('Please enter a comment');
      return;
    }

    try {
      const response = await axios.post(`/api/v2/matches/${matchId}/comments`, {
        text: comment.trim()
      });
      if (response.data && response.data.data) {
        setFeedback(prev => ({
          ...prev,
          comments: response.data.data.comments
        }));
      }
      setComment('');
      setShowCommentModal(false);
      message.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('Failed to add comment');
    }
  };

  const getSortedComments = () => {
    const comments = [...(feedback.comments || [])];
    switch (commentSort) {
      case 'recent':
        return comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'popular':
        return comments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      default:
        return comments;
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Badge count={feedback.likes} showZero>
          <Button 
            type={userFeedback.liked ? "primary" : "default"}
            icon={userFeedback.liked ? <LikeFilled /> : <LikeOutlined />}
            onClick={() => handleFeedback('liked')}
            loading={loading}
          >
            Like
          </Button>
        </Badge>
        <Badge count={feedback.dislikes} showZero>
          <Button 
            type={userFeedback.disliked ? "primary" : "default"}
            danger={userFeedback.disliked}
            icon={userFeedback.disliked ? <DislikeFilled /> : <DislikeOutlined />}
            onClick={() => handleFeedback('disliked')}
            loading={loading}
          >
            Dislike
          </Button>
        </Badge>
        <Badge count={(feedback.comments || []).length} showZero>
          <Button 
            icon={<MessageOutlined />}
            onClick={() => setShowCommentModal(true)}
            loading={loading}
          >
            Comments
          </Button>
        </Badge>
      </Space>

      <Modal
        title="Comments"
        open={showCommentModal}
        onCancel={() => {
          setShowCommentModal(false);
          setComment('');
        }}
        footer={[
          <Space key="filters" style={{ marginRight: 'auto' }}>
            <Select
              value={commentSort}
              onChange={setCommentSort}
              style={{ width: 120 }}
              options={[
                { value: 'recent', label: 'Most Recent' },
                { value: 'popular', label: 'Most Liked' }
              ]}
              suffixIcon={<SortAscendingOutlined />}
            />
          </Space>,
          <Button key="cancel" onClick={() => {
            setShowCommentModal(false);
            setComment('');
          }}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleComment}>
            Add Comment
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add your comment..."
            rows={4}
            style={{ marginBottom: 16 }}
          />
          
          <List
            itemLayout="horizontal"
            dataSource={getSortedComments()}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <Space>
                      <span>{item.username || 'Anonymous'}</span>
                      <Tag color="blue">{new Date(item.createdAt).toLocaleDateString()}</Tag>
                    </Space>
                  }
                  description={item.text}
                />
              </List.Item>
            )}
          />
        </Space>
      </Modal>
    </Space>
  );
};

export default LeaderboardFeedback; 