import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Input, List, Avatar, message, Modal, Typography, Tabs, Divider, Checkbox } from 'antd';
import { LikeOutlined, LikeFilled, DislikeOutlined, DislikeFilled, CommentOutlined, UserOutlined, GithubOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { submitMatchFeedback, getMatchFeedback } from '../../services/api';

const { TextArea } = Input;
const { Text } = Typography;
const { TabPane } = Tabs;

const MatchFeedback = ({ matchId, onFeedbackUpdate }) => {
    const { isAuthenticated } = useAuth();
    const [feedback, setFeedback] = useState({
        comment: '',
        liked: false,
        disliked: false,
        created_at: null,
        user: null,
        is_anonymous: false
    });
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState('');
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('feedback');
    const [userFeedback, setUserFeedback] = useState({
        liked: false,
        disliked: false
    });
    const [counts, setCounts] = useState({
        likes: 0,
        dislikes: 0
    });
    const [isAnonymous, setIsAnonymous] = useState(false);

    useEffect(() => {
        fetchFeedback();
    }, [matchId]);

    // Add effect to handle auth state restoration
    useEffect(() => {
        if (isAuthenticated) {
            const storedState = sessionStorage.getItem('authRedirectState');
            if (storedState) {
                try {
                    const state = JSON.parse(storedState);
                    if (state.matchId === matchId) {
                        if (state.showCommentModal) {
                            setShowCommentModal(true);
                            setComment(state.comment || '');
                        }
                        sessionStorage.removeItem('authRedirectState');
                    }
                } catch (e) {
                    console.error('Error parsing stored state:', e);
                    sessionStorage.removeItem('authRedirectState');
                }
            }
        }
    }, [isAuthenticated, matchId]);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const response = await getMatchFeedback(matchId);
            if (response.success && response.data) {
                setFeedback(response.data);
                setUserFeedback({
                    liked: response.data.liked || false,
                    disliked: response.data.disliked || false
                });
                setCounts({
                    likes: response.data.liked ? 1 : 0,
                    dislikes: response.data.disliked ? 1 : 0
                });
            }
        } catch (error) {
            console.error('Error fetching feedback:', error);
            message.error('Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        try {
            const response = await submitMatchFeedback(matchId, {
                liked: true,
                disliked: false
            });
            if (response.success && response.data) {
                setFeedback(response.data);
                setUserFeedback({
                    liked: true,
                    disliked: false
                });
                setCounts(prev => ({
                    likes: prev.likes + 1,
                    dislikes: prev.dislikes
                }));
                onFeedbackUpdate?.(response.data);
            }
        } catch (error) {
            console.error('Error submitting like:', error);
            message.error('Failed to submit feedback');
        }
    };

    const handleDislike = async () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        try {
            const response = await submitMatchFeedback(matchId, {
                liked: false,
                disliked: true
            });
            if (response.success && response.data) {
                setFeedback(response.data);
                setUserFeedback({
                    liked: false,
                    disliked: true
                });
                setCounts(prev => ({
                    likes: prev.likes,
                    dislikes: prev.dislikes + 1
                }));
                onFeedbackUpdate?.(response.data);
            }
        } catch (error) {
            console.error('Error submitting dislike:', error);
            message.error('Failed to submit feedback');
        }
    };

    const handleSubmitComment = async () => {
        if (!comment.trim()) {
            message.warning('Please enter a comment');
            return;
        }

        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        setSubmitting(true);
        try {
            const response = await submitMatchFeedback(matchId, {
                comment,
                liked: userFeedback.liked,
                disliked: userFeedback.disliked,
                is_anonymous: isAnonymous
            });
            if (response.success && response.data) {
                setFeedback(response.data);
                setComment('');
                setShowCommentModal(false);
                setIsAnonymous(false);
                onFeedbackUpdate?.(response.data);
                message.success('Comment submitted successfully');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            message.error('Failed to submit comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGitHubLogin = () => {
        // Store current state for after login
        sessionStorage.setItem('authRedirectState', JSON.stringify({
            path: window.location.pathname,
            matchId: matchId,
            showCommentModal: true,
            comment: comment
        }));
        
        // Redirect to GitHub OAuth
        const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v2';
        window.location.href = `${serverUrl}/auth/github?redirect=${encodeURIComponent(window.location.pathname)}`;
    };

    const handleAddComment = () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
        } else {
            setShowCommentModal(true);
        }
    };

    const renderFeedbackActions = () => (
        <Space>
            <Button
                type={userFeedback.liked ? "primary" : "default"}
                icon={userFeedback.liked ? <LikeFilled /> : <LikeOutlined />}
                onClick={handleLike}
            >
                Like ({counts.likes})
            </Button>
            <Button
                type={userFeedback.disliked ? "primary" : "default"}
                danger={userFeedback.disliked}
                icon={userFeedback.disliked ? <DislikeFilled /> : <DislikeOutlined />}
                onClick={handleDislike}
            >
                Dislike ({counts.dislikes})
            </Button>
            <Button
                type="primary"
                icon={<CommentOutlined />}
                onClick={handleAddComment}
            >
                Add Comment
            </Button>
        </Space>
    );

    const renderCommentsList = () => {
        if (!feedback?.comment) {
            return (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">No comments yet. Be the first to comment!</Text>
                </div>
            );
        }

        return (
            <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={[feedback]}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} src={item.user?.avatar_url} />}
                            title={
                                <Space>
                                    <Text strong>{item.is_anonymous ? 'Anonymous' : (item.user?.username || 'Anonymous')}</Text>
                                    {item.created_at && (
                                        <Text type="secondary">
                                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                        </Text>
                                    )}
                                </Space>
                            }
                            description={
                                <Space direction="vertical" size="small">
                                    <Text>{item.comment}</Text>
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />
        );
    };

    return (
        <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane
                    tab={
                        <span>
                            <CommentOutlined />
                            Feedback
                        </span>
                    }
                    key="feedback"
                >
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {renderFeedbackActions()}
                        <Divider />
                        {renderCommentsList()}
                    </Space>
                </TabPane>
            </Tabs>

            {/* Comment Modal */}
            <Modal
                title="Add Comment"
                open={showCommentModal}
                onOk={handleSubmitComment}
                onCancel={() => {
                    setShowCommentModal(false);
                    setComment('');
                    setIsAnonymous(false);
                }}
                confirmLoading={submitting}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <TextArea
                        rows={4}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Share your thoughts about this match..."
                    />
                    <Checkbox
                        checked={isAnonymous}
                        onChange={e => setIsAnonymous(e.target.checked)}
                    >
                        Post as Anonymous
                    </Checkbox>
                </Space>
            </Modal>

            {/* Login Modal */}
            <Modal
                title="Authentication Required"
                open={showLoginModal}
                onCancel={() => setShowLoginModal(false)}
                footer={null}
                centered
            >
                <Space direction="vertical" style={{ width: '100%', textAlign: 'center', padding: '20px 0' }}>
                    <Text style={{ fontSize: '16px', marginBottom: '20px' }}>
                        Please log in with GitHub to interact with this match
                    </Text>
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
                            margin: '0 auto',
                            padding: '8px 24px',
                            height: 'auto'
                        }}
                    >
                        Sign in with GitHub
                    </Button>
                </Space>
            </Modal>
        </Card>
    );
};

export default MatchFeedback; 