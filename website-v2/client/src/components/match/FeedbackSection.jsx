import React, { useState, useEffect, useContext } from 'react';
import { Card, Form, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { HandThumbsUp, HandThumbsDown, ChatSquareText } from 'react-bootstrap-icons';
import { formatDistanceToNow } from 'date-fns';
import { AuthContext } from '../../contexts/AuthContext';
import { getFeedback, addFeedback, likeFeedback } from '../../services/api';

const FeedbackSection = ({ matchId }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        setLoading(true);
        const data = await getFeedback(matchId);
        setFeedbacks(data.feedback || []);
        
        // Check if user has already voted
        if (isAuthenticated && user) {
          const userFeedback = data.feedback.find(f => f.user?.id === user.id && f.vote);
          if (userFeedback) {
            setUserVote(userFeedback.vote);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to load feedback');
        setLoading(false);
      }
    };
    
    fetchFeedbackData();
  }, [matchId, isAuthenticated, user]);

  const handleVote = (vote) => {
    if (!isAuthenticated) {
      setError('You must be logged in to vote');
      return;
    }
    
    // Toggle vote if clicking the same button
    setUserVote(userVote === vote ? null : vote);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('You must be logged in to provide feedback');
      return;
    }
    
    if (!userVote && !comment.trim()) {
      setError('Please provide a vote or comment');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const feedbackData = {
        match_id: matchId,
        vote: userVote,
        comment: comment.trim() || null
      };
      
      const result = await addFeedback(feedbackData);
      
      // Update the feedback list
      setFeedbacks([result.feedback, ...feedbacks.filter(f => f.id !== result.feedback.id)]);
      
      // Clear form if it was a comment submission
      if (comment.trim()) {
        setComment('');
      }
      
      setSuccess('Feedback submitted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      setSubmitting(false);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback');
      setSubmitting(false);
    }
  };

  const handleLike = async (feedbackId) => {
    if (!isAuthenticated) {
      setError('You must be logged in to like feedback');
      return;
    }
    
    try {
      const result = await likeFeedback(feedbackId);
      
      // Update the feedback list
      setFeedbacks(feedbacks.map(f => 
        f.id === feedbackId ? { ...f, likes: result.feedback.likes } : f
      ));
      
    } catch (err) {
      console.error('Error liking feedback:', err);
      setError(err.message || 'Failed to like feedback');
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Community Feedback</h5>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <div className="d-flex justify-content-center gap-3 mb-3">
            <Button 
              variant={userVote === 'agree' ? 'success' : 'outline-success'}
              onClick={() => handleVote('agree')}
              disabled={!isAuthenticated || submitting}
              className="d-flex align-items-center"
            >
              <HandThumbsUp className="me-2" />
              Agree
            </Button>
            <Button 
              variant={userVote === 'disagree' ? 'danger' : 'outline-danger'}
              onClick={() => handleVote('disagree')}
              disabled={!isAuthenticated || submitting}
              className="d-flex align-items-center"
            >
              <HandThumbsDown className="me-2" />
              Disagree
            </Button>
          </div>
          
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Add a comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
            />
          </Form.Group>
          
          <div className="d-grid">
            {isAuthenticated ? (
              <Button 
                type="submit" 
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            ) : (
              <Link to="/login" className="btn btn-outline-primary">
                Log in to provide feedback
              </Link>
            )}
          </div>
        </Form>
        
        <hr className="my-4" />
        
        <h6 className="mb-3">
          Recent Feedback 
          <Badge bg="secondary" className="ms-2">
            {feedbacks.length}
          </Badge>
        </h6>
        
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : feedbacks.length === 0 ? (
          <p className="text-center text-muted mb-0">
            No feedback yet. Be the first to comment!
          </p>
        ) : (
          <ListGroup variant="flush">
            {feedbacks.map(feedback => (
              <ListGroup.Item key={feedback.id} className="px-0">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div className="d-flex align-items-center">
                    <strong>{feedback.user?.username || 'Anonymous'}</strong>
                    {feedback.vote && (
                      <Badge 
                        bg={feedback.vote === 'agree' ? 'success' : 'danger'}
                        className="ms-2"
                      >
                        {feedback.vote === 'agree' ? 'Agrees' : 'Disagrees'}
                      </Badge>
                    )}
                  </div>
                  <small className="text-muted">
                    {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                  </small>
                </div>
                
                {feedback.comment && (
                  <p className="mb-2">{feedback.comment}</p>
                )}
                
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 text-muted"
                  onClick={() => handleLike(feedback.id)}
                  disabled={!isAuthenticated}
                >
                  <HandThumbsUp size={14} className="me-1" />
                  {feedback.likes || 0}
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default FeedbackSection;