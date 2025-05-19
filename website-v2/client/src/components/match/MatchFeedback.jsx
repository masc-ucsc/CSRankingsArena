import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Input, List, Avatar, message, Modal, Typography, Tabs, Divider } from 'antd';
import { LikeOutlined, LikeFilled, DislikeOutlined, DislikeFilled, CommentOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const { TextArea } = Input;
const { Text } = Typography;
const { TabPane } = Tabs;

const MatchFeedback = ({ matchId, onFeedbackUpdate }) => {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('comments');
    const [userFeedback, setUserFeedback] = useState({
        liked: false,
        disliked: false
    });
    const [counts, setCounts] = useState({
        likes: 0,
        dislikes: 0
    });

    useEffect(() => {
        fetchFeedback();
    }, [matchId]);

    const fetchFeedback = async () => {
        try {
            const response = await axios.get(`/api/v2/feedback/${matchId}`);
            setFeedback(response.data.feedback);
            
            // Calculate total likes and dislikes
            const totalLikes = response.data.feedback.filter(f => f.liked).length;
            const totalDislikes = response.data.feedback.filter(f => f.disliked).length;
            setCounts({
                likes: totalLikes,
                dislikes: totalDislikes
            });
            
            // Get user's feedback for this match
            const userFeedbackResponse = await axios.get(`/api/v2/feedback/${matchId}/user`);
            if (userFeedbackResponse.data) {
                setUserFeedback({
                    liked: userFeedbackResponse.data.liked,
                    disliked: userFeedbackResponse.data.disliked
                });
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching feedback:', error);
            message.error('Failed to load feedback');
            setLoading(false);
        }
    };

    const handleLike = async () => {
        try {
            const response = await axios.post(`/api/v2/feedback/${matchId}`, {
                liked: !userFeedback.liked,
                disliked: false
            });
            
            // Update user feedback state
            setUserFeedback({
                liked: response.data.liked,
                disliked: response.data.disliked
            });
            
            // Update counts
            setCounts(prev => ({
                likes: response.data.liked ? prev.likes + 1 : prev.likes - 1,
                dislikes: response.data.disliked ? prev.dislikes + 1 : prev.dislikes - 1
            }));
            
            if (onFeedbackUpdate) {
                onFeedbackUpdate();
            }
            
            message.success(response.data.liked ? 'Liked match' : 'Removed like');
        } catch (error) {
            console.error('Error liking match:', error);
            message.error('Failed to update like status');
        }
    };

    const handleDislike = async () => {
        try {
            const response = await axios.post(`/api/v2/feedback/${matchId}`, {
                liked: false,
                disliked: !userFeedback.disliked
            });
            
            // Update user feedback state
            setUserFeedback({
                liked: response.data.liked,
                disliked: response.data.disliked
            });
            
            // Update counts
            setCounts(prev => ({
                likes: response.data.liked ? prev.likes + 1 : prev.likes - 1,
                dislikes: response.data.disliked ? prev.dislikes + 1 : prev.dislikes - 1
            }));
            
            if (onFeedbackUpdate) {
                onFeedbackUpdate();
            }
            
            message.success(response.data.disliked ? 'Disliked match' : 'Removed dislike');
        } catch (error) {
            console.error('Error disliking match:', error);
            message.error('Failed to update dislike status');
        }
    };

    const handleSubmitComment = async () => {
        if (!comment.trim()) {
            message.warning('Please enter a comment');
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post(`/api/v2/feedback/${matchId}`, {
                comment: comment.trim()
            });

            setFeedback(prevFeedback => [response.data, ...prevFeedback]);
            setComment('');
            setShowCommentModal(false);
            
            if (onFeedbackUpdate) {
                onFeedbackUpdate();
            }
            
            message.success('Comment added successfully');
        } catch (error) {
            console.error('Error submitting comment:', error);
            message.error('Failed to submit comment');
        } finally {
            setSubmitting(false);
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
                onClick={() => setShowCommentModal(true)}
            >
                Add Comment
            </Button>
        </Space>
    );

    const renderCommentsList = () => (
        <List
            loading={loading}
            itemLayout="horizontal"
            dataSource={feedback.filter(item => item.comment)}
            renderItem={item => (
                <List.Item>
                    <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} src={item.user?.avatar_url} />}
                        title={
                            <Space>
                                <Text strong>{item.user?.username || 'Anonymous'}</Text>
                                <Text type="secondary">
                                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                </Text>
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

            <Modal
                title="Add Comment"
                open={showCommentModal}
                onOk={handleSubmitComment}
                onCancel={() => {
                    setShowCommentModal(false);
                    setComment('');
                }}
                confirmLoading={submitting}
            >
                <TextArea
                    rows={4}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share your thoughts about this match..."
                />
            </Modal>
        </Card>
    );
};

export default MatchFeedback; 