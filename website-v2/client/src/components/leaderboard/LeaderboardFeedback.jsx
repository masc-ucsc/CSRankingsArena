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
  Tag,
  Divider
} from 'antd';
import { 
  LikeOutlined, 
  LikeFilled, 
  DislikeOutlined, 
  DislikeFilled,
  MessageOutlined,
  UserOutlined,
  SortAscendingOutlined,
  GithubOutlined
} from '@ant-design/icons';
// import { useAuth } from '../../contexts/AuthContext';
import { submitMatchFeedback, getMatchFeedback } from '../../services/api';
import API_CONFIG from '../../config/api';

const { TextArea } = Input;
const { Option } = Select;

const LeaderboardFeedback = ({ matchId }) => {
  // const { isAuthenticated, user } = useAuth();
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
  // const [showLoginModal, setShowLoginModal] = useState(false);
  const [commentSort, setCommentSort] = useState('recent');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [matchId]);

  const fetchFeedback = async () => {
    try {
      let response = await getMatchFeedback(matchId);
      
      console.log('GET feedback', response.data);
      console.log('GET feedback success', response.success);
      if (response.success && response.data) {
        response = response.data;
        const items = response.data.items || [];

        console.log('GET feedback items', items);
        
        // Count likes and dislikes
        const likes = items.filter(item => item.type === 'like').length;
        const dislikes = items.filter(item => item.type === 'dislike').length;
        
        console.log('likes', likes);
        console.log('dislikes', dislikes);

        // Get comments
        const comments = items
          .filter(item => item.type === 'comment')
          .map(comment => ({
            ...comment,
            text: comment.content,
            user: {
              username: comment.isAnonymous ? 'Anonymous' : 'User',
              avatar_url: null
            }
          }));

        console.log('GET feedback comments', comments);

        setFeedback({
          likes,
          dislikes,
          comments
        });

        // Comment out user feedback state for now
        /*
        const userInteraction = response.data.items?.find(
          item => item.type === 'like' || item.type === 'dislike'
        );
        if (userInteraction) {
          setUserFeedback({
            liked: userInteraction.type === 'like',
            disliked: userInteraction.type === 'dislike'
          });
        }
        */
      } else {
        setFeedback({
          likes: 0,
          dislikes: 0,
          comments: []
        });
        setUserFeedback({
          liked: false,
          disliked: false
        });
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setFeedback({
        likes: 0,
        dislikes: 0,
        comments: []
      });
      setUserFeedback({
        liked: false,
        disliked: false
      });
    }
  };

  /*
  const handleGitHubLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    const state = {
      path: currentPath,
      matchId: matchId,
      showCommentModal: showCommentModal,
      comment: comment
    };
    
    sessionStorage.setItem('authRedirectState', JSON.stringify(state));
    
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v2';
    window.location.href = `${serverUrl}/auth/github?redirect=${encodeURIComponent(currentPath)}`;
  };

  useEffect(() => {
    const storedState = sessionStorage.getItem('authRedirectState');
    if (storedState && isAuthenticated) {
      const state = JSON.parse(storedState);
      if (state.matchId === matchId) {
        if (state.showCommentModal) {
          setShowCommentModal(true);
          setComment(state.comment || '');
        }
        sessionStorage.removeItem('authRedirectState');
      }
    }
  }, [isAuthenticated, matchId]);
  */

  const handleFeedback = async (type) => {
    try {
      setLoading(true);
      const response = await submitMatchFeedback(matchId, {
        type: type
      });

      if (response.success && response.data) {
        const items = response.data.items || [];
        
        // Count likes and dislikes
        const likes = items.filter(item => item.type === 'like').length;
        const dislikes = items.filter(item => item.type === 'dislike').length;
        
        // Get comments
        const comments = items
          .filter(item => item.type === 'comment')
          .map(comment => ({
            ...comment,
            text: comment.content,
            user: {
              username: comment.isAnonymous ? 'Anonymous' : 'User',
              avatar_url: null
            }
          }));

        setFeedback({
          likes,
          dislikes,
          comments
        });

        setUserFeedback({
          liked: type === 'like',
          disliked: type === 'dislike'
        });

        message.success(`${type === 'like' ? 'Liked' : 'Disliked'} successfully`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    // Comment out authentication check
    /*
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    */

    if (!comment.trim()) {
      message.warning('Please enter a comment');
      return;
    }

    try {
      setLoading(true);
      const response = await submitMatchFeedback(matchId, {
        type: 'comment',
        text: comment.trim()
      });
      
      if (response.success && response.data) {
        const items = response.data.items || [];
        
        // Get comments
        const comments = items
          .filter(item => item.type === 'comment')
          .map(comment => ({
            ...comment,
            text: comment.content,
            user: {
              username: comment.isAnonymous ? 'Anonymous' : 'User',
              avatar_url: null
            }
          }));

        setFeedback(prev => ({
          ...prev,
          comments
        }));
        setComment('');
        setShowCommentModal(false);
        message.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      /*
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setShowLoginModal(true);
      } else {
      */
        message.error('Failed to add comment');
      // }
    } finally {
      setLoading(false);
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
            onClick={() => handleFeedback('like')}
            loading={loading}
          >
            {feedback.likes}
          </Button>
        </Badge>
        <Badge count={feedback.dislikes} showZero>
          <Button 
            type={userFeedback.disliked ? "primary" : "default"}
            danger={userFeedback.disliked}
            icon={userFeedback.disliked ? <DislikeFilled /> : <DislikeOutlined />}
            onClick={() => handleFeedback('dislike')}
            loading={loading}
          >
            {feedback.dislikes}
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

      {/* Comment out Login Modal
      <Modal
        title="Login Required"
        open={showLoginModal}
        onCancel={() => setShowLoginModal(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
          <p>Please log in to provide feedback</p>
          <Button
            type="primary"
            icon={<GithubOutlined />}
            onClick={handleGitHubLogin}
            size="large"
            style={{ 
              backgroundColor: '#24292e',
              borderColor: '#24292e',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            Sign in with GitHub
          </Button>
        </Space>
      </Modal>
      */}

      {/* Comment Modal */}
      <Modal
        title="Comments"
        open={showCommentModal}
        onCancel={() => setShowCommentModal(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Comment out authentication check
          {isAuthenticated ? (
          */}
            <Space direction="vertical" style={{ width: '100%' }}>
              <TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment..."
                rows={4}
              />
              <Button 
                type="primary" 
                onClick={handleComment}
                loading={loading}
                disabled={!comment.trim()}
              >
                Add Comment
              </Button>
            </Space>
          {/* Comment out GitHub login button
          ) : (
            <Button
              type="primary"
              icon={<GithubOutlined />}
              onClick={handleGitHubLogin}
              size="large"
              style={{ 
                backgroundColor: '#24292e',
                borderColor: '#24292e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto'
              }}
            >
              Sign in with GitHub to comment
            </Button>
          )}
          */}

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Select
              value={commentSort}
              onChange={setCommentSort}
              style={{ width: 120 }}
            >
              <Option value="recent">Most Recent</Option>
              <Option value="popular">Most Popular</Option>
            </Select>
          </Space>

          <List
            dataSource={getSortedComments()}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={item.user?.avatar_url} icon={<UserOutlined />} />}
                  title={
                    <Space>
                      <span>{item.user?.username || 'Anonymous'}</span>
                      <Tag color="blue">GitHub User</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <div>{item.text}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </Space>
                  }
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