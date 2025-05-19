import React, { useState, useEffect } from 'react';
import { Button, Space, Input, List, Avatar, Typography, message, Modal } from 'antd';
import { LikeOutlined, LikeFilled, DislikeOutlined, DislikeFilled, CommentOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext'; // Import auth context

const { Text } = Typography;
const { TextArea } = Input;

const MatchInteractions = ({ matchId }) => {
    const { isAuthenticated, user } = useAuth(); // Get auth state
    const [interactions, setInteractions] = useState([]);
    const [likeCount, setLikeCount] = useState(0);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [userInteractions, setUserInteractions] = useState({
        like: false,
        dislike: false
    });
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchInteractions = async () => {
        try {
            const response = await axios.get(`/api/v2/matches/${matchId}/feedback`);
            if (response.data.success) {
                setInteractions(response.data.data.items);
                setLikeCount(response.data.data.counts.likes);
                setDislikeCount(response.data.data.counts.dislikes);

                // Update user's interactions based on the most recent like/dislike
                const userInteractions = response.data.data.items.reduce((acc, interaction) => {
                    if (interaction.type === 'like' || interaction.type === 'dislike') {
                        acc[interaction.type] = true;
                        // If it's a dislike, unset like and vice versa
                        if (interaction.type === 'like') {
                            acc.dislike = false;
                        } else {
                            acc.like = false;
                        }
                    }
                    return acc;
                }, { like: false, dislike: false });
                setUserInteractions(userInteractions);
            }
        } catch (error) {
            console.error('Error fetching interactions:', error);
            message.error('Failed to load interactions');
        }
    };

    useEffect(() => {
        fetchInteractions();
    }, [matchId]);

    const handleInteraction = async (type) => {
        if (!isAuthenticated) {
            message.warning('Please log in to like or dislike');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`/api/v2/matches/${matchId}/feedback`, {
                type: type === 'like' ? 'liked' : 'disliked',
                isAnonymous
            });

            if (response.data.success) {
                // Update counts from response
                setLikeCount(response.data.data.counts.likes);
                setDislikeCount(response.data.data.counts.dislikes);
                
                // Update interactions list
                setInteractions(response.data.data.items);

                // Update user interactions state
                setUserInteractions(prev => ({
                    like: type === 'like',
                    dislike: type === 'dislike'
                }));

                message.success(`${type === 'like' ? 'Liked' : 'Disliked'} successfully`);
            }
        } catch (error) {
            console.error(`Error ${type}ing:`, error);
            if (error.response?.status === 401) {
                message.error('Please log in to like or dislike');
            } else {
                message.error(`Failed to ${type}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleComment = async () => {
        if (!isAuthenticated) {
            message.warning('Please log in to comment');
            return;
        }

        if (!newComment.trim()) {
            message.warning('Please enter a comment');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`/api/v2/matches/${matchId}/feedback`, {
                type: 'comment',
                content: newComment.trim(),
                isAnonymous
            });

            if (response.data.success) {
                setInteractions(response.data.data.items);
                setNewComment('');
                setCommentModalVisible(false);
                message.success('Comment added successfully');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            if (error.response?.status === 401) {
                message.error('Please log in to comment');
            } else {
                message.error('Failed to add comment');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderCommentItem = (item) => (
        <List.Item>
            <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                    <Space>
                        <Text strong>{item.isAnonymous ? 'Anonymous' : 'User'}</Text>
                        <Text type="secondary">{new Date(item.createdAt).toLocaleString()}</Text>
                    </Space>
                }
                description={item.content}
            />
        </List.Item>
    );

    return (
        <div style={{ marginTop: '20px' }}>
            <Space size="middle" style={{ marginBottom: '20px' }}>
                <Button
                    type={userInteractions.like ? 'primary' : 'default'}
                    icon={userInteractions.like ? <LikeFilled /> : <LikeOutlined />}
                    onClick={() => handleInteraction('like')}
                    loading={loading}
                    disabled={!isAuthenticated}
                >
                    Like ({likeCount})
                </Button>
                <Button
                    type={userInteractions.dislike ? 'primary' : 'default'}
                    danger={userInteractions.dislike}
                    icon={userInteractions.dislike ? <DislikeFilled /> : <DislikeOutlined />}
                    onClick={() => handleInteraction('dislike')}
                    loading={loading}
                    disabled={!isAuthenticated}
                >
                    Dislike ({dislikeCount})
                </Button>
                <Button
                    icon={<CommentOutlined />}
                    onClick={() => setCommentModalVisible(true)}
                    disabled={!isAuthenticated}
                >
                    Comment
                </Button>
            </Space>

            <List
                dataSource={interactions.filter(i => i.type === 'comment')}
                renderItem={renderCommentItem}
                locale={{ emptyText: 'No comments yet' }}
            />

            <Modal
                title="Add Comment"
                open={commentModalVisible}
                onOk={handleComment}
                onCancel={() => setCommentModalVisible(false)}
                confirmLoading={loading}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <TextArea
                        rows={4}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Enter your comment..."
                    />
                    <Button
                        type={isAnonymous ? 'primary' : 'default'}
                        onClick={() => setIsAnonymous(!isAnonymous)}
                    >
                        {isAnonymous ? 'Anonymous' : 'Public'}
                    </Button>
                </Space>
            </Modal>
        </div>
    );
};

export default MatchInteractions; 