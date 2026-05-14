global.beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
});

global.afterAll(async () => {
  // Cleanup after all tests
});