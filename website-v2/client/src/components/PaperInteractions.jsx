import React, { useState, useEffect } from 'react';
import { FaThumbsUp, FaThumbsDown, FaComment } from 'react-icons/fa';
import axios from 'axios';
import './PaperInteractions.css';

const PaperInteractions = ({ paperPath }) => {
    const [interactions, setInteractions] = useState({
        likes: 0,
        dislikes: 0,
        comments: [],
        userInteraction: null
    });
    const [comment, setComment] = useState('');
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInteractions();
    }, [paperPath]);

    const fetchInteractions = async () => {
        try {
            const response = await axios.get(`/api/v2/papers/${paperPath}/interactions`);
            setInteractions(response.data);
        } catch (error) {
            console.error('Error fetching interactions:', error);
        }
    };

    const handleInteraction = async (type) => {
        try {
            setLoading(true);
            const response = await axios.post(`/api/v2/papers/${paperPath}/interactions`, {
                interactionType: type,
                comment: type === 'comment' ? comment : ''
            });
            
            if (response.data.message === 'Interaction removed') {
                setInteractions(prev => ({
                    ...prev,
                    userInteraction: null,
                    [type === 'like' ? 'likes' : 'dislikes']: prev[type === 'like' ? 'likes' : 'dislikes'] - 1
                }));
            } else {
                setInteractions(prev => ({
                    ...prev,
                    userInteraction: { type },
                    [type === 'like' ? 'likes' : 'dislikes']: prev[type === 'like' ? 'likes' : 'dislikes'] + 1
                }));
            }
            
            if (type === 'comment') {
                setShowCommentForm(false);
                setComment('');
                fetchInteractions(); // Refresh to get the new comment
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="paper-interactions">
            <div className="interaction-buttons">
                <button
                    className={`interaction-btn ${interactions.userInteraction?.type === 'like' ? 'active' : ''}`}
                    onClick={() => handleInteraction('like')}
                    disabled={loading}
                >
                    <FaThumbsUp /> {interactions.likes}
                </button>
                <button
                    className={`interaction-btn ${interactions.userInteraction?.type === 'dislike' ? 'active' : ''}`}
                    onClick={() => handleInteraction('dislike')}
                    disabled={loading}
                >
                    <FaThumbsDown /> {interactions.dislikes}
                </button>
                <button
                    className="interaction-btn"
                    onClick={() => setShowCommentForm(!showCommentForm)}
                    disabled={loading}
                >
                    <FaComment /> {interactions.comments.length}
                </button>
            </div>

            {showCommentForm && (
                <div className="comment-form">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write your comment..."
                        rows={3}
                    />
                    <button
                        onClick={() => handleInteraction('comment')}
                        disabled={!comment.trim() || loading}
                    >
                        Submit Comment
                    </button>
                </div>
            )}

            <div className="comments-section">
                {interactions.comments.map((comment) => (
                    <div key={comment.id} className="comment">
                        <p>{comment.comment}</p>
                        <small>{new Date(comment.created_at).toLocaleDateString()}</small>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PaperInteractions; 