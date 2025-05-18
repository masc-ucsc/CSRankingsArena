import React, { useState, useEffect } from 'react';
import { Button, Space, Input, List, Avatar, Typography, message, Modal } from 'antd';
import { LikeOutlined, DislikeOutlined, CommentOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;
const { TextArea } = Input;

const MatchInteractions = ({ matchId }) => {
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
            const response = await axios.get(`/api/v2/matches/${matchId}/interactions`);
            setInteractions(response.data.interactions);
            setLikeCount(response.data.counts.likes);
            setDislikeCount(response.data.counts.dislikes);

            // Update user's interactions
            const userInteractions = response.data.interactions.reduce((acc, interaction) => {
                if (interaction.type === 'like' || interaction.type === 'dislike') {
                    acc[interaction.type] = true;
                }
                return acc;
            }, { like: false, dislike: false });
            setUserInteractions(userInteractions);
        } catch (error) {
            console.error('Error fetching interactions:', error);
            message.error('Failed to load interactions');
        }
    };

    useEffect(() => {
        fetchInteractions();
    }, [matchId]);

    const handleInteraction = async (type) => {
        try {
            setLoading(true);
            await axios.post(`/api/v2/matches/${matchId}/interactions`, {
                type,
                isAnonymous
            });
            await fetchInteractions();
            message.success(`${type === 'like' ? 'Liked' : 'Disliked'} successfully`);
        } catch (error) {
            console.error(`Error ${type}ing:`, error);
            message.error(`Failed to ${type}`);
        } finally {
            setLoading(false);
        }
    };

    const handleComment = async () => {
        if (!newComment.trim()) {
            message.warning('Please enter a comment');
            return;
        }

        try {
            setLoading(true);
            await axios.post(`/api/v2/matches/${matchId}/interactions`, {
                type: 'comment',
                content: newComment,
                isAnonymous
            });
            setCommentModalVisible(false);
            setNewComment('');
            await fetchInteractions();
            message.success('Comment added successfully');
        } catch (error) {
            console.error('Error adding comment:', error);
            message.error('Failed to add comment');
        } finally {
            setLoading(false);
        }
    };

    const renderCommentItem = (comment) => (
        <List.Item>
            <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={comment.is_anonymous ? 'Anonymous User' : 'User'}
                description={
                    <Space direction="vertical">
                        <Text>{comment.content}</Text>
                        <Text type="secondary">
                            {new Date(comment.created_at).toLocaleString()}
                        </Text>
                    </Space>
                }
            />
        </List.Item>
    );

    return (
        <div style={{ marginTop: '20px' }}>
            <Space size="middle" style={{ marginBottom: '20px' }}>
                <Button
                    type={userInteractions.like ? 'primary' : 'default'}
                    icon={<LikeOutlined />}
                    onClick={() => handleInteraction('like')}
                    loading={loading}
                >
                    Like ({likeCount})
                </Button>
                <Button
                    type={userInteractions.dislike ? 'primary' : 'default'}
                    icon={<DislikeOutlined />}
                    onClick={() => handleInteraction('dislike')}
                    loading={loading}
                >
                    Dislike ({dislikeCount})
                </Button>
                <Button
                    icon={<CommentOutlined />}
                    onClick={() => setCommentModalVisible(true)}
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
                        placeholder="Write your comment here..."
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