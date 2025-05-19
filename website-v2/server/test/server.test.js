const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const { expect } = Code;
const { describe, it, before, after } = exports.lab = Lab.script();

const server = require('../server');

describe('Server', () => {
    let serverInstance;

    before(async () => {
        serverInstance = await server.init();
    });

    after(async () => {
        await serverInstance.stop();
    });

    describe('Health Check', () => {
        it('should return 200 OK for health check endpoint', async () => {
            const response = await serverInstance.inject({
                method: 'GET',
                url: '/api/v2/health'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object();
            expect(response.result.status).to.equal('ok');
            expect(response.result.timestamp).to.be.a.string();
        });
    });
}); 