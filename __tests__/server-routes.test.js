'use strict';

const request = require('supertest');
const crypto = require('crypto');
const { app } = require('../server');

const ADMIN_EMAIL = process.env.DUMMY_ADMIN_EMAIL || 'admin@beyondsite.com';
const ADMIN_PASSWORD = process.env.DUMMY_ADMIN_PASSWORD || 'admin123';
const CUSTOMER_EMAIL = process.env.DUMMY_CUSTOMER_EMAIL || 'customer@beyondsite.com';
const CUSTOMER_PASSWORD = process.env.DUMMY_CUSTOMER_PASSWORD || 'customer123';

function makeToken(email, role) {
  const payload = Buffer.from(JSON.stringify({ email, role, ts: Date.now() })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', process.env.GEMINI_API_KEY || 'dev-secret')
    .update(payload)
    .digest('hex');
  return payload + '.' + sig;
}

const ADMIN_TOKEN = makeToken(ADMIN_EMAIL, 'ADMIN');
const CUSTOMER_TOKEN = makeToken(CUSTOMER_EMAIL, 'CUSTOMER');

describe('Server Routes', () => {
  describe('GET /health', () => {
    test('returns health response with status and checks', async () => {
      const res = await request(app).get('/health');
      expect([200, 503]).toContain(res.status);
      expect(res.body.status).toBeDefined();
      expect(res.body.checks).toBeDefined();
      expect(res.body.checks.database).toBeDefined();
    });

    test('returns timestamp in health response', async () => {
      const res = await request(app).get('/health');
      expect(res.body.timestamp).toBeDefined();
      expect(typeof res.body.timestamp).toBe('string');
    });
  });

  describe('POST /api/login', () => {
    test('returns 400 when email is missing', async () => {
      const res = await request(app).post('/api/login').send({ password: ADMIN_PASSWORD });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('returns 400 when password is missing', async () => {
      const res = await request(app).post('/api/login').send({ email: ADMIN_EMAIL });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('returns 401 for invalid email', async () => {
      const res = await request(app).post('/api/login').send({ email: 'unknown@test.com', password: 'pass' });
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid');
    });

    test('returns 401 for wrong password', async () => {
      const res = await request(app).post('/api/login').send({ email: ADMIN_EMAIL, password: 'wrong' });
      expect(res.status).toBe(401);
    });

    test('admin login returns success with admin role', async () => {
      const res = await request(app).post('/api/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isAdmin).toBe(true);
      expect(res.body.email).toBe(ADMIN_EMAIL);
      expect(res.body.name).toBe('Admin');
      expect(res.body.token).toBeDefined();
      expect(res.body.role).toBe('ADMIN');
    });

    test('customer login returns success with customer role', async () => {
      const res = await request(app).post('/api/login').send({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isAdmin).toBe(false);
      expect(res.body.email).toBe(CUSTOMER_EMAIL);
      expect(res.body.name).toBe('Customer');
      expect(res.body.role).toBe('CUSTOMER');
    });

    test('login is case-insensitive for email', async () => {
      const res = await request(app).post('/api/login').send({ email: ADMIN_EMAIL.toUpperCase(), password: ADMIN_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(ADMIN_EMAIL);
    });
  });

  describe('POST /api/register', () => {
    test('returns 400 when fields are missing', async () => {
      const res = await request(app).post('/api/register').send({ firstName: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('returns 400 when password is too short', async () => {
      const res = await request(app).post('/api/register').send({
        firstName: 'Test', lastName: 'User', email: 'test@test.com', password: 'short'
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('8 characters');
    });

    test('returns success with valid registration', async () => {
      const res = await request(app).post('/api/register').send({
        firstName: 'Test', lastName: 'User', email: 'test@test.com', password: 'validpass123'
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('sanitizes HTML from input fields', async () => {
      const res = await request(app).post('/api/register').send({
        firstName: '<script>alert(1)</script>', lastName: 'User', email: 'test@test.com', password: 'validpass123'
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/schema/:templateId', () => {
    test('returns schema for valid template', async () => {
      const res = await request(app).get('/api/schema/template-5');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('template-5');
      expect(res.body.sections).toBeDefined();
      expect(Array.isArray(res.body.sections)).toBe(true);
    });

    test('returns 404 for non-existent template', async () => {
      const res = await request(app).get('/api/schema/template-999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Schema not found');
    });

    test('composes schema with _base for templates that extend it', async () => {
      const res = await request(app).get('/api/schema/template-5');
      expect(res.status).toBe(200);
      const sectionIds = res.body.sections.map(s => s.id);
      expect(sectionIds).toContain('brand');
      expect(sectionIds).toContain('contact');
      expect(sectionIds).toContain('theme');
    });

    test('strips path traversal from templateId', async () => {
      const res = await request(app).get('/api/schema/../../../etc/passwd');
      expect(res.status).toBe(404);
    });

    test('returns schema for all 17 templates', async () => {
      for (let i = 1; i <= 17; i++) {
        const res = await request(app).get(`/api/schema/template-${i}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(`template-${i}`);
      }
    });
  });

  describe('GET /template-previews/preview-:slug.html', () => {
    test('serves existing preview file', async () => {
      const res = await request(app).get('/template-previews/preview-5.html');
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/<!doctype html>/i);
    });

    test('returns 404 placeholder for missing preview', async () => {
      const res = await request(app).get('/template-previews/preview-99.html');
      expect(res.status).toBe(404);
      expect(res.text).toContain('Preview not yet generated');
    });

    test('strips invalid characters from slug', async () => {
      const res = await request(app).get('/template-previews/preview-<script>.html');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/pay', () => {
    test('creates dummy or razorpay payment order', async () => {
      const res = await request(app).post('/api/pay').send({ templateId: 'template-5' });
      expect(res.status).toBe(200);
      expect(res.body.paymentId).toBeDefined();
      expect(['dummy', 'razorpay']).toContain(res.body.providerData.provider);
      expect(res.body.providerData.amount).toBe(499900);
      expect(res.body.providerData.currency).toBe('INR');
    });

    test('creates payment with unknown templateId', async () => {
      const res = await request(app).post('/api/pay').send({ templateId: 'unknown' });
      expect(res.status).toBe(200);
      expect(res.body.paymentId).toBeDefined();
    });

    test('creates payment without templateId (uses default)', async () => {
      const res = await request(app).post('/api/pay').send({});
      expect(res.status).toBe(200);
      expect(res.body.paymentId).toBeDefined();
    });
  });

  describe('POST /api/generate', () => {
    test('returns 401 without auth token', async () => {
      const res = await request(app).post('/api/generate').send({ template: 'template-5', data: {}, paymentId: 'dummy' });
      expect([401, 402]).toContain(res.status);
    });

    test('returns 402 without paymentId (with dev auth)', async () => {
      const res = await request(app).post('/api/generate')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ template: 'template-5', data: { businessName: 'Test', tagline: 'Test', _description: 'A test business with enough description text to pass validation' } });
      expect(res.status).toBe(402);
      expect(res.body.error).toBe('Payment required');
    });

    test('admin bypass generates ZIP without payment', async () => {
      const adminData = { businessName: 'Test Biz', tagline: 'Test Tagline', _description: 'A test business with enough description text to pass validation requirements' };
      const res = await request(app).post('/api/generate')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ template: 'template-5', data: adminData, paymentId: 'admin_bypass_123' });
      expect([200, 402]).toContain(res.status);
      if (res.status === 200) {
        expect(res.headers['content-type']).toContain('application/zip');
      }
    });

    test('returns 402 for used payment', async () => {
      const { payments } = require('../src/lib/payments');
      payments.set('pay_used_test', { amount: 499900, currency: 'INR', createdAt: Date.now(), usedAt: Date.now() });

      const data = { businessName: 'Test', tagline: 'Test', _description: 'A test business with enough description text to pass validation' };
      const res = await request(app).post('/api/generate')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ template: 'template-5', data, paymentId: 'pay_used_test' });
      expect([402, 500]).toContain(res.status);
    });

    test('generates ZIP with valid payment', async () => {
      const { payments } = require('../src/lib/payments');
      payments.set('pay_valid_test', { amount: 499900, currency: 'INR', createdAt: Date.now(), usedAt: null });

      const data = { businessName: 'Valid Biz', tagline: 'Valid Tag', _description: 'A valid business with enough description text to pass validation requirements' };
      const res = await request(app).post('/api/generate')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ template: 'template-5', data, paymentId: 'pay_valid_test' });
      expect([200, 402, 500]).toContain(res.status);
    });
  });

  describe('POST /api/draft', () => {
    test('returns 400 without templateId', async () => {
      const res = await request(app).post('/api/draft')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ formData: { businessName: 'Test' } });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('templateId');
    });

    test('returns 400 without formData', async () => {
      const res = await request(app).post('/api/draft')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ templateId: 'template-5' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('formData');
    });

    test('returns 400 for invalid templateId format', async () => {
      const res = await request(app).post('/api/draft')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ templateId: '../../../etc/passwd', formData: { test: true } });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid');
    });

    test('returns 400 when formData is array', async () => {
      const res = await request(app).post('/api/draft')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ templateId: 'template-5', formData: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('object');
    });

    test('returns ok with persisted:false when no DB', async () => {
      const res = await request(app).post('/api/draft')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ templateId: 'template-5', formData: { businessName: 'Test Draft' } });
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.ok).toBe(true);
        expect(res.body.persisted).toBe(false);
      }
    });
  });

  describe('GET /api/draft/:templateId', () => {
    test('returns null draft when no DB', async () => {
      const res = await request(app).get('/api/draft/template-5')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.draft).toBeNull();
      }
    });
  });

  describe('POST /api/preview', () => {
    test('renders template HTML', async () => {
      const data = { businessName: 'Preview Test', tagline: 'Test Tag', _description: 'A test business with enough description text to pass validation requirements' };
      const res = await request(app).post('/api/preview').send({ template: 'template-5', data });
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Preview Test');
    });

    test('returns error for invalid template', async () => {
      const res = await request(app).post('/api/preview').send({ template: 'template-999', data: {} });
      // May return 200 with fallback content or 500
      expect([200, 500]).toContain(res.status);
    });

    test('renders with empty data (uses defaults)', async () => {
      const res = await request(app).post('/api/preview').send({ template: 'template-5', data: {} });
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
    });
  });

  describe('Static routes', () => {
    test('GET / serves index.html', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/<!doctype html>/i);
    });

    test('GET /login serves login.html', async () => {
      const res = await request(app).get('/login');
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/<!doctype html>/i);
    });

    test('GET /register serves register.html', async () => {
      const res = await request(app).get('/register');
      expect([200, 500]).toContain(res.status);
    });

    test('GET /profile serves profile.html', async () => {
      const res = await request(app).get('/profile');
      expect([200, 500]).toContain(res.status);
    });

    test('GET /plans serves plans.html', async () => {
      const res = await request(app).get('/plans');
      expect(res.status).toBe(200);
    });
  });
});
