'use strict';

describe('Auth', () => {
  let auth;

  beforeAll(() => {
    jest.resetModules();
    process.env.AUTH0_DOMAIN = '';
    process.env.AUTH0_AUDIENCE = '';
    auth = require('../src/lib/auth');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requireRole', () => {
    test('returns 401 when req.user is not set', () => {
      const { requireRole } = auth;
      const middleware = requireRole('ADMIN');

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 when user role is not in allowed roles', () => {
      const { requireRole } = auth;
      const middleware = requireRole('ADMIN');

      const req = { user: { role: 'CUSTOMER' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    test('calls next when user has allowed role', () => {
      const { requireRole } = auth;
      const middleware = requireRole('ADMIN', 'CUSTOMER');

      const req = { user: { role: 'ADMIN' } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('allows multiple roles', () => {
      const { requireRole } = auth;
      const middleware = requireRole('ADMIN', 'MODERATOR');

      const req = { user: { role: 'MODERATOR' } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('authenticate middleware', () => {
    test('authenticate returns 401 when no token provided AND Auth0 is configured', async () => {
      jest.resetModules();
      // Auth0 IS configured here — so missing token must 401
      process.env.AUTH0_DOMAIN = 'example.auth0.com';
      process.env.AUTH0_AUDIENCE = 'https://api.example.com';
      const { authenticate } = require('../src/lib/auth');
      const middleware = authenticate();

      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authorization required' });
      expect(next).not.toHaveBeenCalled();

      // Reset for downstream tests
      process.env.AUTH0_DOMAIN = '';
      process.env.AUTH0_AUDIENCE = '';
    });

    test('authenticate calls next without token in dev bypass mode', async () => {
      jest.resetModules();
      process.env.AUTH0_DOMAIN = '';
      process.env.AUTH0_AUDIENCE = '';
      const { authenticate } = require('../src/lib/auth');
      const middleware = authenticate();

      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await middleware(req, res, next);

      // No 401 — middleware should short-circuit and attach a stub admin user
      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        id: 'dev-user',
        email: 'dev@example.com',
        role: 'ADMIN',
        auth0Id: 'dev|dev'
      });
    });

    test('authenticate sets req.user on successful dev bypass', async () => {
      jest.resetModules();
      process.env.AUTH0_DOMAIN = '';
      process.env.AUTH0_AUDIENCE = '';
      const { authenticate } = require('../src/lib/auth');
      const middleware = authenticate();

      const req = { headers: { authorization: 'Bearer fake-token' } };
      const res = {};
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        id: 'dev-user',
        email: 'dev@example.com',
        role: 'ADMIN',
        auth0Id: 'dev|dev'
      });
    });

    test('authenticate accepts any token in dev bypass mode', async () => {
      jest.resetModules();
      process.env.AUTH0_DOMAIN = '';
      process.env.AUTH0_AUDIENCE = '';
      const { authenticate } = require('../src/lib/auth');
      const middleware = authenticate();

      const req = { headers: { authorization: 'Bearer any-token' } };
      const res = {};
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });
  });

  describe('optionalAuth', () => {
    test('optionalAuth calls next even without token', async () => {
      jest.resetModules();
      process.env.AUTH0_DOMAIN = '';
      process.env.AUTH0_AUDIENCE = '';
      const { optionalAuth } = require('../src/lib/auth');
      const middleware = optionalAuth();

      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('optionalAuth sets req.user when token is provided', async () => {
      jest.resetModules();
      process.env.AUTH0_DOMAIN = '';
      process.env.AUTH0_AUDIENCE = '';
      const { optionalAuth } = require('../src/lib/auth');
      const middleware = optionalAuth();

      const req = { headers: { authorization: 'Bearer some-token' } };
      const res = {};
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });
  });
});