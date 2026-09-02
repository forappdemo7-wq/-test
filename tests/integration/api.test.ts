import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createExpressApp } from '../../server/app';

describe('InstaVibe REST API (Integration Tests)', () => {
  const app = createExpressApp();

  it('GET /api/v1/health should return system status and healthy database connection', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('queue');
  });

  it('GET /api/v1/swagger.json should return the valid OpenAPI 3.0 specification', async () => {
    const res = await request(app).get('/api/v1/swagger.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('InstaVibe');
    expect(res.body.paths).toHaveProperty('/posts');
  });

  it('GET /api/v1/docs should render interactive Swagger UI documentation', async () => {
    const res = await request(app).get('/api/v1/docs');
    expect(res.status).toBe(200);
    expect(res.text).toContain('InstaVibe Backend Architecture API');
    expect(res.text).toContain('swagger-ui');
  });

  it('GET /api/posts (backward-compatible alias) should return post feed list', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/stories should return grouped stories', async () => {
    const res = await request(app).get('/api/stories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/reels should return reels list', async () => {
    const res = await request(app).get('/api/reels');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/v1/gemini/suggest-comments or caption should respond with structured payload', async () => {
    const res = await request(app)
      .post('/api/v1/gemini/suggest-comments')
      .send({
        postCaption: 'Coffee in Tokyo',
        postTopic: 'Travel',
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('suggestions');
    expect(Array.isArray(res.body.suggestions)).toBe(true);
  }, 20000);
});
