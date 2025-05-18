const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const db = require('../../models');

// Get feedback for a specific paper in a match
router.get('/:matchId/:paperId/feedback', async (req, res) => {
  try {
    const { matchId, paperId } = req.params;
    
    const feedback = await db.LeaderboardFeedback.findOne({
      where: {
        matchId,
        paperId
      },
      include: [{
        model: db.Comment,
        include: [{
          model: db.User,
          attributes: ['username']
        }]
      }]
    });

    if (!feedback) {
      return res.json({
        likes: 0,
        dislikes: 0,
        comments: []
      });
    }

    res.json({
      likes: feedback.likes,
      dislikes: feedback.dislikes,
      comments: feedback.Comments.map(comment => ({
        id: comment.id,
        text: comment.text,
        username: comment.User?.username,
        createdAt: comment.createdAt,
        likes: comment.likes
      }))
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Get user's feedback for a specific paper in a match
router.get('/:matchId/:paperId/user-feedback', authenticateToken, async (req, res) => {
  try {
    const { matchId, paperId } = req.params;
    const userId = req.user.id;

    const userFeedback = await db.UserLeaderboardFeedback.findOne({
      where: {
        userId,
        matchId,
        paperId
      }
    });

    res.json({
      liked: userFeedback?.liked || false,
      disliked: userFeedback?.disliked || false
    });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({ error: 'Failed to fetch user feedback' });
  }
});

// Add or remove feedback (like/dislike)
router.post('/:matchId/:paperId/feedback', authenticateToken, async (req, res) => {
  try {
    const { matchId, paperId } = req.params;
    const { type, action } = req.body;
    const userId = req.user.id;

    const [feedback, created] = await db.LeaderboardFeedback.findOrCreate({
      where: { matchId, paperId },
      defaults: { likes: 0, dislikes: 0 }
    });

    const [userFeedback, userFeedbackCreated] = await db.UserLeaderboardFeedback.findOrCreate({
      where: { userId, matchId, paperId },
      defaults: { liked: false, disliked: false }
    });

    // Handle like/dislike toggle
    if (type === 'liked') {
      if (action === 'add') {
        feedback.likes += 1;
        userFeedback.liked = true;
        if (userFeedback.disliked) {
          feedback.dislikes -= 1;
          userFeedback.disliked = false;
        }
      } else {
        feedback.likes -= 1;
        userFeedback.liked = false;
      }
    } else if (type === 'disliked') {
      if (action === 'add') {
        feedback.dislikes += 1;
        userFeedback.disliked = true;
        if (userFeedback.liked) {
          feedback.likes -= 1;
          userFeedback.liked = false;
        }
      } else {
        feedback.dislikes -= 1;
        userFeedback.disliked = false;
      }
    }

    await feedback.save();
    await userFeedback.save();

    res.json({
      feedback: {
        likes: feedback.likes,
        dislikes: feedback.dislikes
      },
      userFeedback: {
        liked: userFeedback.liked,
        disliked: userFeedback.disliked
      }
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// Add a comment
router.post('/:matchId/:paperId/comment', authenticateToken, async (req, res) => {
  try {
    const { matchId, paperId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    const [feedback, created] = await db.LeaderboardFeedback.findOrCreate({
      where: { matchId, paperId },
      defaults: { likes: 0, dislikes: 0 }
    });

    const newComment = await db.Comment.create({
      text: comment,
      userId,
      leaderboardFeedbackId: feedback.id
    });

    const updatedFeedback = await db.LeaderboardFeedback.findOne({
      where: { id: feedback.id },
      include: [{
        model: db.Comment,
        include: [{
          model: db.User,
          attributes: ['username']
        }]
      }]
    });

    res.json({
      likes: updatedFeedback.likes,
      dislikes: updatedFeedback.dislikes,
      comments: updatedFeedback.Comments.map(comment => ({
        id: comment.id,
        text: comment.text,
        username: comment.User?.username,
        createdAt: comment.createdAt,
        likes: comment.likes
      }))
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router; 