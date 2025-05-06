const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { Paper } = require('../src/models');

// Mock data
const testPapers = [
  {
    source: 'arxiv',
    arxiv_id: '2401.00001',
    title: 'Test Paper 1',
    authors: ['Author 1', 'Author 2'],
    abstract: 'This is a test abstract for paper 1.',
    categories: ['cs.AI'],
    main_topic: 'AI',
    pdf_url: 'http://example.com/1.pdf',
    published_date: new Date('2024-01-01'),
  },
  {
    source: 'arxiv',
    arxiv_id: '2401.00002',
    title: 'Test Paper 2',
    authors: ['Author 3'],
    abstract: 'This is a test abstract for paper 2.',
    categories: ['cs.PL'],
    main_topic: 'Programming',
    pdf_url: 'http://example.com/2.pdf',
    published_date: new Date('2024-01-02'),
  },
  {
    source: 'arxiv',
    arxiv_id: '2401.00003',
    title: 'Test Paper 3',
    authors: ['Author 4', 'Author 5'],
    abstract: 'This is a test abstract for paper 3.',
    categories: ['cs.AR'],
    main_topic: 'Architecture',
    pdf_url: 'http://example.com/3.pdf',
    published_date: new Date('2024-01-03'),
  }
];

describe('Paper API Routes', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/paper_evaluation_test';
    await mongoose.connect(mongoUri);
    
    // Clear collection
    await Paper.deleteMany({});
    
    // Insert test data
    await Paper.insertMany(testPapers);
  });
  
  afterAll(async () => {
    // Cleanup
    await Paper.deleteMany({});
    await mongoose.connection.close();
  });
  
  describe('GET /api/papers', () => {
    it('should return all papers with default pagination', async () => {
      const res = await request(app).get('/api/papers');
      
      expect(res.status).toBe(200);
      expect(res.body.papers).toHaveLength(3);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.page).toBe(1);
    });
    
    it('should filter papers by topic', async () => {
      const res = await request(app).get('/api/papers?topic=Programming');
      
      expect(res.status).toBe(200);
      expect(res.body.papers).toHaveLength(1);
      expect(res.body.papers[0].main_topic).toBe('Programming');
    });
    
    it('should search in title and abstract', async () => {
      const res = await request(app).get('/api/papers?search=paper 2');
      
      expect(res.status).toBe(200);
      expect(res.body.papers).toHaveLength(1);
      expect(res.body.papers[0].title).toBe('Test Paper 2');
    });
    
    it('should paginate results', async () => {
      const res = await request(app).get('/api/papers?limit=2&page=1');
      
      expect(res.status).toBe(200);
      expect(res.body.papers).toHaveLength(2);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.pages).toBe(2);
    });
    
    it('should sort papers by published date', async () => {
      const res = await request(app).get('/api/papers?sort=-published_date');
      
      expect(res.status).toBe(200);
      expect(res.body.papers[0].title).toBe('Test Paper 3');
      expect(res.body.papers[2].title).toBe('Test Paper 1');
    });
  });
  
  describe('GET /api/papers/:id', () => {
    let paperId;
    
    beforeAll(async () => {
      const paper = await Paper.findOne({ title: 'Test Paper 1' });
      paperId = paper._id.toString();
    });
    
    it('should return a single paper by ID', async () => {
      const res = await request(app).get(`/api/papers/${paperId}`);
      
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Test Paper 1');
      expect(res.body.authors).toEqual(['Author 1', 'Author 2']);
    });
    
    it('should return 404 for non-existent paper', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/papers/${fakeId}`);
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe(true);
    });
  });
  
  describe('GET /api/papers/topic/:topic', () => {
    it('should return papers for a specific topic', async () => {
      const res = await request(app).get('/api/papers/topic/AI');
      
      expect(res.status).toBe(200);
      expect(res.body.papers).toHaveLength(1);
      expect(res.body.papers[0].main_topic).toBe('AI');
    });
    
    it('should return empty array for non-existent topic', async () => {
      const res = await request(app).get('/api/papers/topic/NonExistentTopic');
      
      expect(res.status).toBe(200);
      expect(res.body.papers).toHaveLength(0);
    });
  });
  
  describe('GET /api/papers/stats/topics', () => {
    it('should return topic distribution stats', async () => {
      const res = await request(app).get('/api/papers/stats/topics');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      
      // Check that all topics are represented
      const topics = res.body.map(item => item.topic);
      expect(topics).toContain('AI');
      expect(topics).toContain('Programming');
      expect(topics).toContain('Architecture');
      
      // Check that counts are correct
      const aiItem = res.body.find(item => item.topic === 'AI');
      expect(aiItem.count).toBe(1);
    });
  });
  
  describe('GET /api/papers/stats/recent', () => {
    it('should return recent paper stats by month', async () => {
      const res = await request(app).get('/api/papers/stats/recent');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1); // All test papers are in the same month
      
      // Should be in YYYY-MM format
      expect(res.body[0].date).toMatch(/^\d{4}-\d{2}$/);
      expect(res.body[0].count).toBe(3);
    });
  });
});