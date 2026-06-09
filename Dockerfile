FROM node:20-alpine AS builder

WORKDIR /app

# OpenSSL 3 + libc6-compat — required for Prisma engine on Alpine
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma/ ./prisma/

RUN npm ci

RUN npx prisma generate

RUN npm prune --omit=dev

FROM node:20-alpine

WORKDIR /app

# OpenSSL 3 + libc6-compat — required at runtime so Prisma can load libssl.so.3
RUN apk add --no-cache openssl libc6-compat

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]