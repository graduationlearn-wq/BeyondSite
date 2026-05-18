'use strict';

describe('Database', () => {
  test('database module loads without errors', () => {
    const db = require('../src/lib/database');
    expect(db).toBeDefined();
  });

  test('module exports prisma getter', () => {
    const db = require('../src/lib/database');
    expect(db.prisma).toBeDefined();
  });

  test('module exports connectDatabase function', () => {
    const db = require('../src/lib/database');
    expect(typeof db.connectDatabase).toBe('function');
  });

  test('module exports disconnectDatabase function', () => {
    const db = require('../src/lib/database');
    expect(typeof db.disconnectDatabase).toBe('function');
  });
});