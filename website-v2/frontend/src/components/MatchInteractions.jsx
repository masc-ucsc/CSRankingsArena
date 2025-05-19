import React, { useEffect, useState } from 'react';

const MatchInteractions = ({ matchId }) => {
    const [interactions, setInteractions] = useState([]);
    const [likeCount, setLikeCount] = useState(0);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [commentText, setCommentText] = useState('');

    const handleLike = async () => {
        try {
            const response = await fetch(`/api/v2/matches/${matchId}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'liked',
                    isAnonymous: false
                })
            });

            if (!response.ok) {
                throw new Error('Failed to like match');
            }

            const data = await response.json();
            if (data.success) {
                setInteractions(data.data.items);
                setLikeCount(data.data.counts.likes);
                setDislikeCount(data.data.counts.dislikes);
            }
        } catch (error) {
            console.error('Error liking match:', error);
            // Optionally show error to user
        }
    };

    const handleDislike = async () => {
        try {
            const response = await fetch(`/api/v2/matches/${matchId}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'disliked',
                    isAnonymous: false
                })
            });

            if (!response.ok) {
                throw new Error('Failed to dislike match');
            }

            const data = await response.json();
            if (data.success) {
                setInteractions(data.data.items);
                setLikeCount(data.data.counts.likes);
                setDislikeCount(data.data.counts.dislikes);
            }
        } catch (error) {
            console.error('Error disliking match:', error);
            // Optionally show error to user
        }
    };

    const handleComment = async (text) => {
        try {
            const response = await fetch(`/api/v2/matches/${matchId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    isAnonymous: false
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            const data = await response.json();
            if (data.success) {
                setInteractions(data.data.items);
                setCommentText('');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            // Optionally show error to user
        }
    };

    const fetchInteractions = async () => {
        try {
            const response = await fetch(`/api/v2/matches/${matchId}/feedback`);
            if (!response.ok) {
                throw new Error('Failed to fetch interactions');
            }

            const data = await response.json();
            if (data.success) {
                setInteractions(data.data.items);
                setLikeCount(data.data.counts.likes);
                setDislikeCount(data.data.counts.dislikes);
            }
        } catch (error) {
            console.error('Error fetching interactions:', error);
        }
    };

    useEffect(() => {
        fetchInteractions();
    }, [matchId]);

    return (
        <div>
            {/* Render your component content here */}
        </div>
    );
};

export default MatchInteractions; 