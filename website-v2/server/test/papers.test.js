const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const { expect } = Code;
const { describe, it, before, after } = exports.lab = Lab.script();

const server = require('../server');
const jwt = require('jsonwebtoken');

describe('Papers API', () => {
    let serverInstance;
    let authToken;

    before(async () => {
        serverInstance = await server.init();
        // Create a test token for authenticated requests
        authToken = jwt.sign(
            { id: 1, username: 'testuser' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '4h' }
        );
    });

    after(async () => {
        await serverInstance.stop();
    });

    describe('GET /api/v2/papers', () => {
        it('should return papers for valid category and year', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/papers?category=ai&year=2023'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.array();
            expect(response.result[0]).to.include(['id', 'title', 'authors', 'venue', 'year']);
        });

        it('should return 400 for invalid year format', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/papers?category=ai&year=invalid'
            });

            expect(response.statusCode).to.equal(400);
        });

        it('should return 404 for non-existent category', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/papers?category=nonexistent&year=2023'
            });

            expect(response.statusCode).to.equal(404);
        });
    });

    describe('GET /api/v2/papers/search', () => {
        it('should return search results for valid query', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/papers/search?q=machine%20learning&category=ai&year=2023&page=1&limit=20'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object();
            expect(response.result).to.include(['papers', 'total', 'page', 'limit']);
            expect(response.result.papers).to.be.an.array();
        });

        it('should handle empty search results', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/papers/search?q=nonexistentterm&category=ai&year=2023'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result.papers).to.be.an.array().and.to.be.empty();
        });

        it('should validate pagination parameters', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/papers/search?q=machine%20learning&page=0&limit=0'
            });

            expect(response.statusCode).to.equal(400);
        });
    });

    describe('Mock Data Endpoints', () => {
        it('should return mock YAML data in development mode', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/mock/papers/ai/machine-learning/2023/papers.yaml'
            });

            if (process.env.USE_MOCK_DATA) {
                expect(response.statusCode).to.equal(200);
                expect(response.result).to.be.a.string();
                expect(response.result).to.include('title:');
            } else {
                expect(response.statusCode).to.equal(403);
            }
        });

        it('should return 404 for non-existent mock file', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/mock/papers/nonexistent/path/file.yaml'
            });

            expect(response.statusCode).to.equal(404);
        });
    });
}); 