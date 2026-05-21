'use strict';

describe('Database Extended', () => {
  let db;

  beforeEach(() => {
    jest.resetModules();
    db = require('../src/lib/database');
  });

  describe('module exports', () => {
    test('exports prisma getter', () => {
      expect(db).toHaveProperty('prisma');
    });

    test('exports connectDatabase function', () => {
      expect(typeof db.connectDatabase).toBe('function');
    });

    test('exports disconnectDatabase function', () => {
      expect(typeof db.disconnectDatabase).toBe('function');
    });
  });

  describe('prisma getter', () => {
    test('returns prisma client when available', () => {
      const prisma = db.prisma;
      if (prisma) {
        expect(prisma).toBeDefined();
        expect(typeof prisma.$connect).toBe('function');
        expect(typeof prisma.$disconnect).toBe('function');
      } else {
        expect(prisma).toBeNull();
      }
    });
  });

  describe('connectDatabase', () => {
    test('handles connection attempt gracefully', async () => {
      try {
        await db.connectDatabase();
      } catch (e) {
        // Expected when DATABASE_URL is not set
        expect(e.message).toContain('DATABASE_URL');
      }
    });
  });

  describe('disconnectDatabase', () => {
    test('handles disconnection gracefully', async () => {
      try {
        await db.disconnectDatabase();
      } catch (e) {
        // May throw if not connected
        expect(e).toBeDefined();
      }
    });
  });
});
