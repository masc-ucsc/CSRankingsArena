import React from 'react';
import { Card, Badge, ListGroup } from 'react-bootstrap';

const ReviewContent = ({ review, agent }) => {
  if (!review) {
    return (
      <Card>
        <Card.Body className="text-center">
          <p className="mb-0">Review not available</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">{agent.name} Review</h5>
        <div className="text-muted small">
          {agent.model} ({agent.provider})
        </div>
      </Card.Header>
      <Card.Body>
        <div className="mb-4">
          <h6>Summary</h6>
          <p>{review.summary}</p>
        </div>
        
        <div className="mb-4">
          <h6>Strengths</h6>
          <ListGroup variant="flush">
            {review.strengths.map((strength, index) => (
              <ListGroup.Item key={index}>{strength}</ListGroup.Item>
            ))}
          </ListGroup>
        </div>
        
        <div className="mb-4">
          <h6>Weaknesses</h6>
          <ListGroup variant="flush">
            {review.weaknesses.map((weakness, index) => (
              <ListGroup.Item key={index}>{weakness}</ListGroup.Item>
            ))}
          </ListGroup>
        </div>
        
        <div className="mb-4">
          <h6>Questions</h6>
          <ListGroup variant="flush">
            {review.questions.map((question, index) => (
              <ListGroup.Item key={index}>{question}</ListGroup.Item>
            ))}
          </ListGroup>
        </div>
        
        <div className="d-flex">
          <div className="me-4">
            <h6>Rating</h6>
            <Badge 
              bg={review.rating >= 7 ? 'success' : (review.rating >= 5 ? 'warning' : 'danger')}
              className="fs-6 px-3 py-2"
            >
              {review.rating}/10
            </Badge>
          </div>
          <div>
            <h6>Confidence</h6>
            <Badge 
              bg="secondary"
              className="fs-6 px-3 py-2"
            >
              {review.confidence}
            </Badge>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ReviewContent;