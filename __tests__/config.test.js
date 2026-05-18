'use strict';

describe('Config', () => {
  test('config module loads without errors', () => {
    const cfg = require('../src/lib/config');
    expect(cfg).toBeDefined();
  });

  test('config has server property', () => {
    const cfg = require('../src/lib/config');
    expect(cfg.config.server).toBeDefined();
  });

  test('config has database property', () => {
    const cfg = require('../src/lib/config');
    expect(cfg.config.database).toBeDefined();
  });

  test('config has auth0 property', () => {
    const cfg = require('../src/lib/config');
    expect(cfg.config.auth0).toBeDefined();
  });

  test('config has ai property', () => {
    const cfg = require('../src/lib/config');
    expect(cfg.config.ai).toBeDefined();
  });

  test('config has logging property', () => {
    const cfg = require('../src/lib/config');
    expect(cfg.config.logging).toBeDefined();
  });
});