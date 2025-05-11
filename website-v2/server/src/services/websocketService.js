const WebSocket = require('ws');
const db = require('../config/db');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of matchId -> Set of clients
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      // Extract matchId from URL query parameters
      const url = new URL(req.url, 'ws://localhost');
      const matchId = url.searchParams.get('matchId');

      if (!matchId) {
        ws.close(1008, 'Match ID required');
        return;
      }

      // Add client to the match's client set
      if (!this.clients.has(matchId)) {
        this.clients.set(matchId, new Set());
      }
      this.clients.get(matchId).add(ws);

      // Send initial feedback data
      this.sendInitialData(ws, matchId);

      ws.on('close', () => {
        // Remove client when connection closes
        const matchClients = this.clients.get(matchId);
        if (matchClients) {
          matchClients.delete(ws);
          if (matchClients.size === 0) {
            this.clients.delete(matchId);
          }
        }
      });
    });
  }

  async sendInitialData(ws, matchId) {
    try {
      // Get initial feedback and performance data
      const [feedback, performance] = await Promise.all([
        this.getMatchFeedback(matchId),
        this.getMatchPerformance(matchId)
      ]);

      ws.send(JSON.stringify({
        type: 'initial',
        data: {
          feedback,
          performance
        }
      }));
    } catch (error) {
      console.error('Error sending initial data:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to load initial data'
      }));
    }
  }

  async getMatchFeedback(matchId) {
    const feedback = await db('feedback')
      .select(
        'feedback.*',
        'users.username',
        'agents.name as agent_name'
      )
      .leftJoin('users', 'feedback.user_id', 'users.id')
      .leftJoin('agents', 'feedback.agent_id', 'agents.id')
      .where('feedback.match_id', matchId)
      .orderBy('feedback.created_at', 'desc');

    return feedback.map(item => ({
      ...item,
      user: item.user_id ? {
        id: item.user_id,
        username: item.username
      } : null,
      agent: item.agent_id ? {
        id: item.agent_id,
        name: item.agent_name
      } : null
    }));
  }

  async getMatchPerformance(matchId) {
    const match = await db('matches')
      .select('agent1_id', 'agent2_id')
      .where('id', matchId)
      .first();

    if (!match) return null;

    const [agent1Stats, agent2Stats] = await Promise.all([
      this.getAgentStats(match.agent1_id),
      this.getAgentStats(match.agent2_id)
    ]);

    return {
      agent1: agent1Stats,
      agent2: agent2Stats
    };
  }

  async getAgentStats(agentId) {
    const stats = await db('agent_performance')
      .where('agent_id', agentId)
      .first();

    const feedbackStats = await db('feedback')
      .where('agent_id', agentId)
      .select(
        db.raw('COUNT(*) as total_feedback'),
        db.raw('AVG(rating) as avg_rating'),
        db.raw('COUNT(CASE WHEN liked = true THEN 1 END) as total_likes'),
        db.raw('COUNT(CASE WHEN liked = false THEN 1 END) as total_dislikes')
      )
      .first();

    return {
      ...stats,
      feedback: feedbackStats
    };
  }

  // Broadcast updates to all clients watching a match
  broadcastMatchUpdate(matchId, type, data) {
    const matchClients = this.clients.get(matchId);
    if (!matchClients) return;

    const message = JSON.stringify({ type, data });
    matchClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Handle new feedback
  async handleNewFeedback(matchId, feedback) {
    // Broadcast to all clients watching this match
    this.broadcastMatchUpdate(matchId, 'feedback', feedback);

    // Update performance stats
    const performance = await this.getMatchPerformance(matchId);
    this.broadcastMatchUpdate(matchId, 'performance', performance);
  }

  // Handle feedback like/dislike
  async handleFeedbackLike(matchId, feedbackId, liked) {
    const feedback = await db('feedback')
      .where('id', feedbackId)
      .increment('likes', liked ? 1 : -1)
      .returning('*')
      .first();

    this.broadcastMatchUpdate(matchId, 'feedback_update', feedback);
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
module.exports = websocketService; 