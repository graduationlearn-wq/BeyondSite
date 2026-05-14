const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const logger = require('./logger');

let config;

function loadConfig() {
  if (config) return config;

  const configPath = path.join(process.cwd(), 'config.yaml');
  const envPath = path.join(process.cwd(), '.env');

  let envVars = {};
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });
  }

  if (fs.existsSync(configPath)) {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    let rawConfig = yaml.load(fileContents);

    config = processConfig(rawConfig, envVars);
  } else {
    config = {
      server: { port: parseInt(process.env.PORT || '3000', 10) },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        name: process.env.DB_NAME || 'website_generator',
        user: process.env.DB_USER || 'app_user',
        password: process.env.DB_PASSWORD || ''
      },
      auth0: {
        domain: process.env.AUTH0_DOMAIN || '',
        clientId: process.env.AUTH0_CLIENT_ID || '',
        clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
        audience: process.env.AUTH0_AUDIENCE || ''
      },
      ai: {
        gemini: { apiKey: process.env.GEMINI_API_KEY || '' },
        groq: { apiKey: process.env.GROQ_API_KEY || '' }
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info'
      }
    };
  }

  logger.info({ config: { ...config, database: { ...config.database, password: '***' } } }, 'Configuration loaded');
  return config;
}

function processConfig(obj, envVars) {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = processConfig(value, envVars);
    } else if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const parts = value.slice(2, -1).split(':');
      const envKey = parts[0];
      const defaultValue = parts[1] || '';
      result[key] = envVars[envKey] || process.env[envKey] || defaultValue;
    } else {
      result[key] = value;
    }
  }

  return result;
}

module.exports = {
  get config() { return loadConfig(); },
  loadConfig
};