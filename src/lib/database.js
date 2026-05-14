let prisma = null;
let logger;

try {
  logger = require('./logger');
} catch (e) {
  logger = console;
}

try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' }
    ]
  });

  if (prisma.$on) {
    prisma.$on('warn', (e) => logger.warn('Prisma warning:', e));
    prisma.$on('error', (e) => logger.error('Prisma error:', e));
  }
} catch (e) {
  logger.warn('Prisma client not available, database features disabled');
}

async function connectDatabase() {
  if (!prisma) {
    logger.warn('Database not configured');
    return;
  }
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

async function disconnectDatabase() {
  if (!prisma) return;
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

module.exports = {
  get prisma() { return prisma; },
  connectDatabase,
  disconnectDatabase
};