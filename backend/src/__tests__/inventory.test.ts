import request from 'supertest';
import app from '../app';

describe('StockSense Business Logic & Verification', () => {
  it('Healthcheck endpoint should return 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
