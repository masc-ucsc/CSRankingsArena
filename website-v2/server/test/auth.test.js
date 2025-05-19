const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const { expect } = Code;
const { describe, it, before, after } = exports.lab = Lab.script();

const server = require('../server');
const jwt = require('jsonwebtoken');

describe('Authentication', () => {
    let serverInstance;
    const testUser = {
        id: 1,
        username: 'testuser',
        github_id: '123456'
    };

    before(async () => {
        serverInstance = await server.init();
    });

    after(async () => {
        await serverInstance.stop();
    });

    describe('GitHub OAuth', () => {
        it('should redirect to GitHub login page', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/auth/github'
            });

            expect(response.statusCode).to.equal(302);
            expect(response.headers.location).to.include('github.com/login/oauth/authorize');
        });

        it('should handle GitHub callback with valid code', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/auth/github/callback?code=valid_code'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object();
            expect(response.result.token).to.be.a.string();
        });

        it('should handle GitHub callback with invalid code', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/auth/github/callback?code=invalid_code'
            });

            expect(response.statusCode).to.equal(401);
        });
    });

    describe('JWT Authentication', () => {
        let validToken;

        before(() => {
            validToken = jwt.sign(testUser, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '4h' });
        });

        it('should return user info with valid JWT token', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/auth/me',
                headers: {
                    Authorization: `Bearer ${validToken}`
                }
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object();
            expect(response.result.id).to.equal(testUser.id);
            expect(response.result.username).to.equal(testUser.username);
        });

        it('should reject request with invalid JWT token', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/auth/me',
                headers: {
                    Authorization: 'Bearer invalid_token'
                }
            });

            expect(response.statusCode).to.equal(401);
        });

        it('should reject request without JWT token', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/auth/me'
            });

            expect(response.statusCode).to.equal(401);
        });
    });
}); 