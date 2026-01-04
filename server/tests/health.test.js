const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('GET /api/health', () => {
    afterAll(async () => {
        // Close DB pool to allow Jest to exit
        if (db.pool) {
            await db.pool.end();
        }
    });

    it('should return 200 and status ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('db', 'connected');
    });
});
