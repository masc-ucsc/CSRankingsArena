import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Rate, List, Button, Divider, Statistic, message, Avatar, Space } from 'antd';
import { LikeOutlined, DislikeOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';

const MatchComparison = () => {
    const { matchId } = useParams();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({});
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        fetchMatchData();
    }, [matchId]);

    const fetchMatchData = async () => {
        try {
            const [matchRes, feedbackRes] = await Promise.all([
                axios.get(`/api/competition/matches/${matchId}`),
                axios.get(`/api/competition/matches/${matchId}/feedback`)
            ]);
            setMatch(matchRes.data);
            setFeedback(feedbackRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching match data:', error);
            message.error('Failed to load match data');
            setLoading(false);
        }
    };

    const handleFeedback = async (reviewId, rating, isPositive) => {
        if (submittingFeedback) return;
        setSubmittingFeedback(true);

        try {
            await axios.post(`/api/competition/reviews/${reviewId}/feedback`, {
                rating: isPositive ? 5 : 1,
                comment: isPositive ? 'Helpful review' : 'Unhelpful review'
            });
            message.success('Feedback submitted successfully');
            fetchMatchData(); // Refresh feedback data
        } catch (error) {
            console.error('Error submitting feedback:', error);
            message.error('Failed to submit feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const renderScoreCard = (title, scores) => (
        <Card title={title} size="small">
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Statistic
                        title="Technical"
                        value={scores.technical_score}
                        precision={2}
                    />
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Depth"
                        value={scores.depth_score}
                        precision={2}
                    />
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Feedback"
                        value={scores.feedback_score}
                        precision={2}
                    />
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Clarity"
                        value={scores.clarity_score}
                        precision={2}
                    />
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Fairness"
                        value={scores.fairness_score}
                        precision={2}
                    />
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Overall"
                        value={scores.overall_score}
                        precision={2}
                    />
                </Col>
            </Row>
        </Card>
    );

    const renderFeedbackList = (reviewId) => (
        <List
            className="feedback-list"
            itemLayout="horizontal"
            dataSource={feedback[reviewId] || []}
            renderItem={item => (
                <List.Item>
                    <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={
                            <Space>
                                <span>{item.username || 'Anonymous'}</span>
                                <Rate disabled defaultValue={item.rating} />
                            </Space>
                        }
                        description={
                            <Space direction="vertical" size="small">
                                <div>{item.comment}</div>
                                <div style={{ fontSize: '12px', color: '#999' }}>
                                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                </div>
                            </Space>
                        }
                    />
                </List.Item>
            )}
        />
    );

    if (loading) {
        return <div>Loading match data...</div>;
    }

    if (!match) {
        return <div>Match not found</div>;
    }

    const review1Scores = {
        technical_score: match.review1_technical_score,
        depth_score: match.review1_depth_score,
        feedback_score: match.review1_feedback_score,
        clarity_score: match.review1_clarity_score,
        fairness_score: match.review1_fairness_score,
        overall_score: match.review1_overall_score
    };

    const review2Scores = {
        technical_score: match.review2_technical_score,
        depth_score: match.review2_depth_score,
        feedback_score: match.review2_feedback_score,
        clarity_score: match.review2_clarity_score,
        fairness_score: match.review2_fairness_score,
        overall_score: match.review2_overall_score
    };

    return (
        <div className="match-comparison" style={{ padding: '24px' }}>
            <Card title="Paper Information" style={{ marginBottom: '24px' }}>
                <h2>{match.paper_title}</h2>
                <p>{match.paper_abstract}</p>
            </Card>

            <Row gutter={[24, 24]}>
                <Col span={12}>
                    <Card
                        title={`Review by ${match.agent1_name}`}
                        extra={renderScoreCard('Scores', review1Scores)}
                    >
                        <div className="review-content">
                            <ReactMarkdown>{match.review1_content}</ReactMarkdown>
                        </div>
                        <Divider />
                        <div className="review-feedback">
                            <Space>
                                <Button
                                    type="text"
                                    icon={<LikeOutlined />}
                                    onClick={() => handleFeedback(match.review1_id, 5, true)}
                                    loading={submittingFeedback}
                                >
                                    Helpful
                                </Button>
                                <Button
                                    type="text"
                                    icon={<DislikeOutlined />}
                                    onClick={() => handleFeedback(match.review1_id, 1, false)}
                                    loading={submittingFeedback}
                                >
                                    Unhelpful
                                </Button>
                            </Space>
                            {renderFeedbackList(match.review1_id)}
                        </div>
                    </Card>
                </Col>

                <Col span={12}>
                    <Card
                        title={`Review by ${match.agent2_name}`}
                        extra={renderScoreCard('Scores', review2Scores)}
                    >
                        <div className="review-content">
                            <ReactMarkdown>{match.review2_content}</ReactMarkdown>
                        </div>
                        <Divider />
                        <div className="review-feedback">
                            <Space>
                                <Button
                                    type="text"
                                    icon={<LikeOutlined />}
                                    onClick={() => handleFeedback(match.review2_id, 5, true)}
                                    loading={submittingFeedback}
                                >
                                    Helpful
                                </Button>
                                <Button
                                    type="text"
                                    icon={<DislikeOutlined />}
                                    onClick={() => handleFeedback(match.review2_id, 1, false)}
                                    loading={submittingFeedback}
                                >
                                    Unhelpful
                                </Button>
                            </Space>
                            {renderFeedbackList(match.review2_id)}
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card title="Judge Information" style={{ marginTop: '24px' }}>
                <p>Judge: {match.judge_name}</p>
                <p>Match Status: {match.status}</p>
                <p>Created: {new Date(match.created_at).toLocaleString()}</p>
            </Card>
        </div>
    );
};

export default MatchComparison; 