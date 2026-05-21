'use strict';

describe('Auth Extended', () => {
  let auth;

  beforeEach(() => {
    jest.resetModules();
    process.env.AUTH0_DOMAIN = '';
    process.env.AUTH0_AUDIENCE = '';
    auth = require('../src/lib/auth');
  });

  afterEach(() => {
    process.env.AUTH0_DOMAIN = '';
    process.env.AUTH0_AUDIENCE = '';
    jest.clearAllMocks();
  });

  describe('requireRole', () => {
    test('returns 401 when req.user is not set', () => {
      const { requireRole } = auth;
      const middleware = requireRole('ADMIN');
      const req = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
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
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
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

    test('returns 403 when role is undefined', () => {
      const { requireRole } = auth;
      const middleware = requireRole('ADMIN');
      const req = { user: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('authenticate middleware', () => {
    test('returns 401 when no token provided AND Auth0 is configured', async () => {
      jest.resetModules();
      process.env.AUTH0_DOMAIN = 'example.auth0.com';
      process.env.AUTH0_AUDIENCE = 'https://api.example.com';
      const { authenticate } = require('../src/lib/auth');
      const middleware = authenticate();
      const req = { headers: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authorization required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('calls next without token in dev bypass mode', async () => {
      jest.resetModules();
      process.env.AUTH0_DOMAIN = '';
      process.env.AUTH0_AUDIENCE = '';
      const { authenticate } = require('../src/lib/auth');
      const middleware = authenticate();
      const req = { headers: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await middleware(req, res, next);
      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        id: 'dev-user',
        email: 'dev@example.com',
        role: 'ADMIN',
        auth0Id: 'dev|dev'
      });
    });

    test('sets req.user on successful dev bypass with token', async () => {
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

    test('accepts any token in dev bypass mode', async () => {
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

    test('returns 401 when Auth0 configured but token is invalid', async () => {
      jest.resetModules();
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      process.env.AUTH0_AUDIENCE = 'https://api.test.com';
      const { authenticate } = require('../src/lib/auth');
      const middleware = authenticate();
      const req = { headers: { authorization: 'Bearer invalid-token' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    test('calls next even without token', async () => {
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

    test('sets req.user when token is provided', async () => {
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

    test('does not set req.user when Auth0 configured and no token', async () => {
      jest.resetModules();
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      process.env.AUTH0_AUDIENCE = 'https://api.test.com';
      const { optionalAuth } = require('../src/lib/auth');
      const middleware = optionalAuth();
      const req = { headers: {} };
      const res = {};
      const next = jest.fn();
      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
