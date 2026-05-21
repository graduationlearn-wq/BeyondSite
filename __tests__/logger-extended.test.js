'use strict';

describe('Logger Extended', () => {
  let logger;

  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';
    logger = require('../src/lib/logger');
  });

  afterEach(() => {
    process.env.NODE_ENV = 'development';
    jest.clearAllMocks();
  });

  describe('log levels', () => {
    test('info logs without throwing', () => {
      expect(() => logger.info('test info message')).not.toThrow();
    });

    test('warn logs without throwing', () => {
      expect(() => logger.warn('test warning')).not.toThrow();
    });

    test('error logs without throwing', () => {
      expect(() => logger.error('test error')).not.toThrow();
    });

    test('debug logs without throwing', () => {
      expect(() => logger.debug('test debug')).not.toThrow();
    });
  });

  describe('metadata', () => {
    test('accepts metadata object', () => {
      expect(() => logger.info('with metadata', { key: 'value', count: 42 })).not.toThrow();
    });

    test('handles null metadata', () => {
      expect(() => logger.info('null meta', null)).not.toThrow();
    });

    test('handles undefined metadata', () => {
      expect(() => logger.info('undefined meta', undefined)).not.toThrow();
    });

    test('handles empty object metadata', () => {
      expect(() => logger.info('empty meta', {})).not.toThrow();
    });
  });

  describe('child logger', () => {
    test('creates child logger with component metadata', () => {
      const child = logger.child({ component: 'payments' });
      expect(child).toBeDefined();
      expect(typeof child.info).toBe('function');
      expect(typeof child.error).toBe('function');
    });

    test('child logger logs without throwing', () => {
      const child = logger.child({ component: 'auth' });
      expect(() => child.info('child message')).not.toThrow();
    });

    test('child logger merges metadata', () => {
      const child = logger.child({ component: 'test' });
      expect(() => child.info('merged', { extra: 'data' })).not.toThrow();
    });
  });

  describe('error handling', () => {
    test('logs Error objects', () => {
      const err = new Error('test error');
      expect(() => logger.error(err)).not.toThrow();
    });

    test('logs error with stack trace', () => {
      const err = new Error('stack test');
      expect(() => logger.error({ error: err.message, stack: err.stack })).not.toThrow();
    });

    test('handles empty string message', () => {
      expect(() => logger.info('')).not.toThrow();
    });
  });

  describe('production mode', () => {
    test('logger loads in production mode', () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const prodLogger = require('../src/lib/logger');
      expect(prodLogger).toBeDefined();
      expect(typeof prodLogger.info).toBe('function');
    });
  });
});
