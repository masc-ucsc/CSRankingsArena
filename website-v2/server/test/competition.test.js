const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const { expect } = Code;
const { describe, it, before, after } = exports.lab = Lab.script();

const server = require('../server');
const jwt = require('jsonwebtoken');

describe('Competition API', () => {
    let serverInstance;
    let authToken;

    before(async () => {
        serverInstance = await server.init();
        authToken = jwt.sign(
            { id: 1, username: 'testuser' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '4h' }
        );
    });

    after(async () => {
        await serverInstance.stop();
    });

    describe('Agents', () => {
        it('should return all agents', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/agents'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.array();
            expect(response.result[0]).to.include(['id', 'name', 'description', 'status']);
        });

        it('should return specific agent by ID', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/agents/1'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object();
            expect(response.result).to.include(['id', 'name', 'description', 'status']);
        });

        it('should return 404 for non-existent agent', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/agents/999999'
            });

            expect(response.statusCode).to.equal(404);
        });

        it('should return agent matches with pagination', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/agents/1/matches?page=1&limit=10&status=completed'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object();
            expect(response.result).to.include(['matches', 'total', 'page', 'limit']);
            expect(response.result.matches).to.be.an.array();
        });
    });

    describe('Matches', () => {
        it('should return match details by ID', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/matches/1'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object();
            expect(response.result).to.include(['id', 'agents', 'status', 'result']);
        });

        it('should return 404 for non-existent match', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/matches/999999'
            });

            expect(response.statusCode).to.equal(404);
        });

        it('should submit match feedback with valid data', async () => {
            const response = await serverInstance.inject({
                method: 'POST',
                url: '/api/v2/matches/1/feedback',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                payload: {
                    rating: 5,
                    comment: 'Great match!'
                }
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object();
            expect(response.result).to.include(['id', 'rating', 'comment']);
        });

        it('should validate feedback data', async () => {
            const response = await serverInstance.inject({
                method: 'POST',
                url: '/api/v2/matches/1/feedback',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                payload: {
                    rating: 6, // Invalid rating
                    comment: 'Great match!'
                }
            });

            expect(response.statusCode).to.equal(400);
        });
    });

    describe('Leaderboard', () => {
        it('should return leaderboard data', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/leaderboard?limit=10&category=ai&timeRange=month'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.array();
            expect(response.result[0]).to.include(['rank', 'agent_id', 'score', 'wins', 'losses']);
        });

        it('should validate time range parameter', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/leaderboard?timeRange=invalid'
            });

            expect(response.statusCode).to.equal(400);
        });

        it('should handle empty leaderboard', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/leaderboard?category=nonexistent'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.array().and.to.be.empty();
        });
    });
}); 