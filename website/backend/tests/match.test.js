const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { Match, Paper, Result } = require('../src/models');

// Mock data
const testPaper = {
  source: 'arxiv',
  arxiv_id: '2401.00001',
  title: 'Test Paper 1',
  authors: ['Author 1', 'Author 2'],
  abstract: 'This is a test abstract for paper 1.',
  categories: ['cs.AI'],
  main_topic: 'AI',
  pdf_url: 'http://example.com/1.pdf',
  published_date: new Date('2024-01-01'),
};

const testMatches = [
  {
    id: 'match-1',
    paper_id: null, // Will be set after paper is created
    paper: {
      title: 'Test Paper 1',
      authors: ['Author 1', 'Author 2'],
      abstract: 'This is a test abstract for paper 1.',
      main_topic: 'AI'
    },
    agent1: 'GPT-4 Reviewer',
    agent2: 'Claude Reviewer',
    status: 'completed',
    result: 'win_agent1',
    created_at: new Date('2024-01-10')
  },
  {
    id: 'match-2',
    paper_id: null, // Will be set after paper is created
    paper: {
      title: 'Test Paper 1',
      authors: ['Author 1', 'Author 2'],
      abstract: 'This is a test abstract for paper 1.',
      main_topic: 'AI'
    },
    agent1: 'GPT-4 Reviewer',
    agent2: 'GPT-3.5 Reviewer',
    status: 'pending',
    result: null,
    created_at: new Date('2024-01-11')
  },
  {
    id: 'match-3',
    paper_id: null, // Will be set after paper is created
    paper: {
      title: 'Test Paper 1',
      authors: ['Author 1', 'Author 2'],
      abstract: 'This is a test abstract for paper 1.',
      main_topic: 'AI'
    },
    agent1: 'Claude Reviewer',
    agent2: 'GPT-3.5 Reviewer',
    status: 'completed',
    result: 'win_agent2',
    created_at: new Date('2024-01-12')
  }
];

const testResult = {
  match_id: 'match-1',
  paper_id: null, // Will be set after paper is created
  agent1: 'GPT-4 Reviewer',
  agent2: 'Claude Reviewer',
  review1: {
    summary: 'Review 1 summary',
    strengths: ['Strength 1', 'Strength 2'],
    weaknesses: ['Weakness 1', 'Weakness 2'],
    questions: ['Question 1?', 'Question 2?'],
    rating: 8,
    confidence: 'high'
  },
  review2: {
    summary: 'Review 2 summary',
    strengths: ['Strength A', 'Strength B'],
    weaknesses: ['Weakness A', 'Weakness B'],
    questions: ['Question A?', 'Question B?'],
    rating: 7,
    confidence: 'medium'
  },
  evaluation: {
    winner: 'GPT-4 Reviewer',
    reasoning: 'GPT-4 provided more thorough analysis',
    scores: {
      technical_correctness: { agent1: 8, agent2: 7 },
      depth_of_analysis: { agent1: 9, agent2: 7 },
      constructive_feedback: { agent1: 8, agent2: 8 },
      clarity: { agent1: 8, agent2: 7 },
      fairness: { agent1: 8, agent2: 8 }
    },
    total_scores: { agent1: 41, agent2: 37 }
  },
  result: 'win_agent1',
  completed_at: new Date('2024-01-10T12:00:00')
};

describe('Match API Routes', () => {
  let paper;
  
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/paper_evaluation_test';
    await mongoose.connect(mongoUri);
    
    // Clear collections
    await Paper.deleteMany({});
    await Match.deleteMany({});
    await Result.deleteMany({});
    
    // Insert test paper
    paper = await Paper.create(testPaper);
    
    // Update match paper_ids
    const matchesWithPaperId = testMatches.map(match => ({
      ...match,
      paper_id: paper._id
    }));
    
    // Insert test matches
    await Match.insertMany(matchesWithPaperId);
    
    // Insert test result
    await Result.create({
      ...testResult,
      paper_id: paper._id
    });
  });
  
  afterAll(async () => {
    // Cleanup
    await Paper.deleteMany({});
    await Match.deleteMany({});
    await Result.deleteMany({});
    await mongoose.connection.close();
  });
  
  describe('GET /api/matches', () => {
    it('should return all matches with default pagination', async () => {
      const res = await request(app).get('/api/matches');
      
      expect(res.status).toBe(200);
      expect(res.body.matches).toHaveLength(3);
      expect(res.body.pagination.total).toBe(3);
    });
    
    it('should filter matches by status', async () => {
      const res = await request(app).get('/api/matches?status=pending');
      
      expect(res.status).toBe(200);
      expect(res.body.matches).toHaveLength(1);
      expect(res.body.matches[0].status).toBe('pending');
    });
    
    it('should filter matches by agent', async () => {
      const res = await request(app).get('/api/matches?agent=Claude%20Reviewer');
      
      expect(res.status).toBe(200);
      expect(res.body.matches).toHaveLength(2);
    });
    
    it('should enrich completed matches with results data', async () => {
      const res = await request(app).get('/api/matches');
      
      const completedMatch = res.body.matches.find(m => m.id === 'match-1');
      expect(completedMatch.review1).toBeDefined();
      expect(completedMatch.review2).toBeDefined();
      expect(completedMatch.evaluation).toBeDefined();
      expect(completedMatch.winner).toBe('GPT-4 Reviewer');
    });
  });
  
  describe('GET /api/matches/:id', () => {
    it('should return a single match by ID', async () => {
      const res = await request(app).get('/api/matches/match-1');
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('match-1');
      expect(res.body.agent1).toBe('GPT-4 Reviewer');
      expect(res.body.agent2).toBe('Claude Reviewer');
    });
    
    it('should return 404 for non-existent match', async () => {
      const res = await request(app).get('/api/matches/non-existent-id');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe(true);
    });
    
    it('should include review and evaluation data for completed matches', async () => {
      const res = await request(app).get('/api/matches/match-1');
      
      expect(res.body.review1).toBeDefined();
      expect(res.body.review1.summary).toBe('Review 1 summary');
      expect(res.body.review2).toBeDefined();
      expect(res.body.evaluation).toBeDefined();
      expect(res.body.evaluation.winner).toBe('GPT-4 Reviewer');
    });
  });
  
  describe('GET /api/matches/agent/:name', () => {
    it('should return matches for a specific agent', async () => {
      const res = await request(app).get('/api/matches/agent/GPT-4%20Reviewer');
      
      expect(res.status).toBe(200);
      expect(res.body.matches).toHaveLength(2);
      
      // Either agent1 or agent2 should be the requested agent
      expect(res.body.matches.every(m => 
        m.agent1 === 'GPT-4 Reviewer' || m.agent2 === 'GPT-4 Reviewer'
      )).toBe(true);
    });
    
    it('should support status filtering', async () => {
      const res = await request(app).get('/api/matches/agent/GPT-4%20Reviewer?status=completed');
      
      expect(res.status).toBe(200);
      expect(res.body.matches).toHaveLength(1);
      expect(res.body.matches[0].status).toBe('completed');
    });
  });
  
  describe('GET /api/matches/paper/:paperId', () => {
    it('should return matches for a specific paper', async () => {
      const paperId = paper._id.toString();
      const res = await request(app).get(`/api/matches/paper/${paperId}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      
      // All matches should be for the same paper
      expect(res.body.every(m => m.paper_id === paperId)).toBe(true);
    });
  });
  
  describe('GET /api/matches/stats/status', () => {
    it('should return match count by status', async () => {
      const res = await request(app).get('/api/matches/stats/status');
      
      expect(res.status).toBe(200);
      
      const completedStatus = res.body.find(item => item.status === 'completed');
      expect(completedStatus.count).toBe(2);
      
      const pendingStatus = res.body.find(item => item.status === 'pending');
      expect(pendingStatus.count).toBe(1);
    });
  });
  
  describe('GET /api/matches/stats/agents', () => {
    it('should return match count by agent', async () => {
      const res = await request(app).get('/api/matches/stats/agents');
      
      expect(res.status).toBe(200);
      
      const gpt4 = res.body.find(item => item.agent === 'GPT-4 Reviewer');
      expect(gpt4.matches).toBe(2);
      
      const claude = res.body.find(item => item.agent === 'Claude Reviewer');
      expect(claude.matches).toBe(2);
      
      const gpt35 = res.body.find(item => item.agent === 'GPT-3.5 Reviewer');
      expect(gpt35.matches).toBe(2);
      
      // Should be sorted by match count
      expect(res.body[0].matches >= res.body[1].matches).toBe(true);
    });
  });
});