import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { InMemoryMailer } from './adapters/mail/InMemoryMailer.js';
import { StaticMerchandising } from './adapters/merchandising/StaticMerchandising.js';
import { createApp } from './app.js';
import { UpstreamError } from './domain/errors.js';
import { silentLogger } from './lib/logger.js';
import type { ProductRepository } from './ports/ProductRepository.js';
import { CatalogService } from './services/CatalogService.js';
import { EnquiryService } from './services/EnquiryService.js';
import { InMemoryProductRepository } from './test-support/fixtures.js';

function build(repo: ProductRepository = new InMemoryProductRepository(), rateLimit = 100) {
  const mailer = new InMemoryMailer();
  const app = createApp({
    catalog: new CatalogService(repo, new StaticMerchandising(['1', '5', '9', '3', '2'], 2), silentLogger),
    enquiries: new EnquiryService(repo, mailer, { salesInbox: 'sales@shop.test', fromAddress: 'n@shop.test' }, silentLogger),
    logger: silentLogger,
    corsOrigins: ['http://localhost:5173'],
    enquiryRateLimitPerMinute: rateLimit,
  });
  return { app, mailer };
}

describe('HTTP API', () => {
  it('GET /api/featured returns the 5 featured products', async () => {
    const res = await request(build().app).get('/api/featured').expect(200);
    expect(res.body.products.map((p: { id: string }) => p.id)).toEqual(['1', '5', '9', '3', '2']);
    expect(res.body.products[0].imageUrl).toBe('/api/products/1/image');
  });

  it('GET /api/categories lists categories', async () => {
    const res = await request(build().app).get('/api/categories').expect(200);
    expect(res.body.categories.map((c: { slug: string }) => c.slug)).toContain('mens-clothing');
  });

  it('GET /api/categories/:slug returns top rated and more products', async () => {
    const res = await request(build().app).get('/api/categories/mens-clothing').expect(200);
    expect(res.body.topRated.map((p: { id: string }) => p.id)).toEqual([
  '1',
  '3',
  '2',
]);

expect(res.body.more.map((p: { id: string }) => p.id)).toEqual([
  '4',
]);

  });

  it('GET /api/categories/:slug 404s for unknown categories', async () => {
    const res = await request(build().app).get('/api/categories/unknown').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('GET /api/search only returns matching products', async () => {
    const res = await request(build().app).get('/api/search').query({ q: 'bracelet' }).expect(200);
    expect(res.body.results.map((p: { id: string }) => p.id)).toEqual(['5']);
  });

  it('GET /api/products/:id returns a product or 404', async () => {
    const ok = await request(build().app).get('/api/products/9').expect(200);
    expect(ok.body.product.title).toBe('WD 2TB Hard Drive');
    expect(ok.body.product.imageUrl).toBe('/api/products/9/image');
    await request(build().app).get('/api/products/999').expect(404);
  });

  it('GET /api/products/:id/image serves the image through the backend', async () => {
    const res = await request(build().app).get('/api/products/1/image').expect(200);
    expect(res.headers['content-type']).toMatch(/^image\/png/);
    expect(res.headers['cache-control']).toBe('public, max-age=300');
    expect([...res.body]).toEqual([1, 2, 3]);
  });

  it('returns 502 with a friendly message when the product source is down', async () => {
    const failing = new InMemoryProductRepository();
    failing.getByIds = async () => {
      throw new UpstreamError('down');
    };
    const res = await request(build(failing).app).get('/api/featured').expect(502);
    expect(res.body.error.code).toBe('UPSTREAM_UNAVAILABLE');
  });

  describe('POST /api/enquiries', () => {
    const valid = { productId: '5', name: 'Ada', email: 'ada@example.com' };

    it('sends the email and returns 201 with a reference', async () => {
      const { app, mailer } = build();
      const res = await request(app).post('/api/enquiries').send(valid).expect(201);
      expect(res.body.reference).toBeTypeOf('string');
      expect(mailer.sent).toHaveLength(1);
      expect(mailer.sent[0]!.to).toBe('sales@shop.test');
    });

    it('returns 400 with field errors for invalid input', async () => {
      const res = await request(build().app).post('/api/enquiries').send({ productId: '5' }).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Object.keys(res.body.error.fields).sort()).toEqual(['email', 'name']);
    });

    it('returns 400 for malformed JSON and 413 for oversized bodies', async () => {
      const app = build().app;
      await request(app).post('/api/enquiries').set('content-type', 'application/json').send('{bad').expect(400);
      await request(app).post('/api/enquiries').send({ ...valid, message: 'x'.repeat(20_000) }).expect(413);
    });

    it('rate limits repeated submissions', async () => {
      const { app } = build(undefined, 2);
      await request(app).post('/api/enquiries').send(valid).expect(201);
      await request(app).post('/api/enquiries').send(valid).expect(201);
      const res = await request(app).post('/api/enquiries').send(valid).expect(429);
      expect(res.body.error.code).toBe('RATE_LIMITED');
    });

    it('returns 500 without leaking internals when email delivery fails', async () => {
      const { app, mailer } = build();
      mailer.failWith = new Error('SMTP password=hunter2');
      const res = await request(app).post('/api/enquiries').send(valid).expect(500);
      expect(JSON.stringify(res.body)).not.toContain('hunter2');
    });
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request(build().app).get('/health').expect(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
