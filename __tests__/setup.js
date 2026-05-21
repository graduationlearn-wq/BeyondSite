// Must be set BEFORE any module loads (especially server.js and auth.js)
// so DUMMY_USERS and session tokens use these values.
process.env.DUMMY_ADMIN_EMAIL = 'admin@beyondsite.com';
process.env.DUMMY_ADMIN_PASSWORD = 'admin123';
process.env.DUMMY_CUSTOMER_EMAIL = 'customer@beyondsite.com';
process.env.DUMMY_CUSTOMER_PASSWORD = 'customer123';

global.beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
});

global.afterAll(async () => {
  // Cleanup after all tests
});