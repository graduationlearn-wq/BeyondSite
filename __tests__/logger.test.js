const logger = require('../src/lib/logger');

describe('Logger', () => {
  test('should log info message', () => {
    expect(() => logger.info('test message')).not.toThrow();
  });

  test('should log with metadata', () => {
    expect(() => logger.info({ userId: '123' }, 'test')).not.toThrow();
  });

  test('should create child logger', () => {
    const child = logger.child({ component: 'test' });
    expect(() => child.info('child log')).not.toThrow();
  });

  test('should log errors', () => {
    expect(() => logger.error(new Error('test error'))).not.toThrow();
  });
});