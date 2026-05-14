const { NODE_ENV = 'development', LOG_LEVEL = 'info' } = process.env;

let logger;

try {
  const winston = require('winston');

  logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: 'static-website-generator',
      environment: NODE_ENV
    },
    transports: [
      new winston.transports.Console({
        format: NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
      })
    ]
  });
} catch (e) {
  logger = {
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    child: () => logger
  };
  console.warn('Winston not available, using console logger');
}

module.exports = logger;