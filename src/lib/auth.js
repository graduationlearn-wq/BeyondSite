let jwt, jwksClient, logger, prisma;

try {
  jwt = require('jsonwebtoken');
  jwksClient = require('jwks-rsa');
  logger = require('./logger');
  const db = require('./database');
  prisma = db.prisma;
} catch (e) {
  console.warn('Auth modules not available, using dev mode');
}

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

let client;

if (AUTH0_DOMAIN && jwksClient) {
  client = jwksClient({
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true
  });
}

function getKey(header, callback) {
  if (!client) {
    return callback(new Error('Auth0 not configured'));
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

async function verifyToken(token) {
  if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE || !jwt) {
    if (logger) logger.warn('Auth0 not configured, using dev bypass');
    return { sub: 'dev|dev', email: 'dev@example.com', role: 'admin' };
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: AUTH0_AUDIENCE,
      issuer: `https://${AUTH0_DOMAIN}/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

async function getOrCreateUser(decoded) {
  if (!AUTH0_DOMAIN || !prisma) {
    return { id: 'dev-user', role: 'ADMIN', email: 'dev@example.com', name: 'Dev User' };
  }

  const auth0Id = decoded.sub;
  const email = decoded.email || `${auth0Id}@placeholder.com`;

  let user = await prisma.user.findUnique({ where: { auth0Id } });

  if (!user) {
    const role = decoded['https://beyondSure.com/role'] || 'customer';
    user = await prisma.user.create({
      data: {
        auth0Id,
        email,
        name: decoded.name || null,
        role: role.toUpperCase()
      }
    });
    if (logger) logger.info({ userId: user.id, email: user.email }, 'New user created');
  }

  return user;
}

function authenticate() {
  return async (req, res, next) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: 'Authorization required' });
      }

      const decoded = await verifyToken(token);
      const user = await getOrCreateUser(decoded);

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        auth0Id: decoded.sub
      };

      next();
    } catch (err) {
      if (logger) logger.warn({ error: err.message }, 'Authentication failed');
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function optionalAuth() {
  return async (req, res, next) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (token) {
        const decoded = await verifyToken(token);
        const user = await getOrCreateUser(decoded);
        req.user = { id: user.id, email: user.email, role: user.role };
      }
    } catch (err) {
      if (logger) logger.debug('Optional auth failed, continuing anonymously');
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  optionalAuth,
  getOrCreateUser
};