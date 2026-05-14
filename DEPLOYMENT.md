# Static Website Generator - Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Container Platform                     │
│                   (Kubernetes / ECS)                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐         ┌─────────────────────┐  │
│  │   Node.js App   │────────▶│   MySQL (Managed)   │  │
│  │   (Express)     │         │   (AWS RDS / Azure) │  │
│  └─────────────────┘         └─────────────────────┘  │
│          │                                                 │
│          ▼                                                 │
│  ┌─────────────────┐                                     │
│  │   Auth0         │                                     │
│  │   (Auth/N)      │                                     │
│  └─────────────────┘                                     │
│          │                                                 │
│          ▼                                                 │
│  ┌─────────────────┐                                     │
│  │   Winston       │─────────▶ Centralized Logging      │
│  │   (JSON Logs)   │         (Datadog/ELK/CloudWatch)   │
│  └─────────────────┘                                     │
└─────────────────────────────────────────────────────────┘
```

## Requirements Met

| Requirement | Implementation |
|-------------|----------------|
| **Container Platform** | Docker + Docker Compose (dev) / K8s (prod) |
| **Database** | MySQL 8.0 via Prisma ORM |
| **Authentication** | Auth0 with RBAC (Admin, Customer) |
| **Logging** | Winston JSON structured logs |
| **Code Review** | ESLint + Jest unit tests |
| **Security** | npm audit + .npmrc enforcement |

## Quick Start (Local Development)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Update .env with your values (Auth0, DB, API keys)

# 3. Install dependencies
npm install

# 4. Generate Prisma client
npm run db:generate

# 5. Start with Docker
npm run docker:up

# 6. Run tests
npm test
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | production/development/test | Yes |
| `DB_HOST` | MySQL hostname | Yes (prod) |
| `DB_PORT` | MySQL port (default: 3306) | No |
| `DB_NAME` | Database name | Yes (prod) |
| `DB_USER` | Database user | Yes (prod) |
| `DB_PASSWORD` | Database password | Yes (prod) |
| `AUTH0_DOMAIN` | Auth0 tenant domain | Yes (prod) |
| `AUTH0_CLIENT_ID` | Auth0 client ID | Yes (prod) |
| `AUTH0_CLIENT_SECRET` | Auth0 client secret | Yes (prod) |
| `AUTH0_AUDIENCE` | Auth0 API audience | Yes (prod) |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `GROQ_API_KEY` | Groq API key for fallback | No |
| `LOG_LEVEL` | Winston log level (info/warn/error) | No |

## Database Schema (Prisma)

```prisma
User {
  id        String   @id @default(cuid())
  auth0Id   String   @unique    // Auth0 sub
  email     String   @unique
  role      Role     @default(CUSTOMER)  // ADMIN | CUSTOMER
  name      String?
  createdAt DateTime @default(now())
  websites  Website[]
  payments  Payment[]
}

Website {
  id         String         @id @default(cuid())
  userId     String
  name       String
  templateId String
  data       Json           // Website configuration
  status     WebsiteStatus  // DRAFT | PUBLISHED | ARCHIVED
}

Payment {
  id        String         @id @default(cuid())
  userId    String?
  paymentId String         @unique
  amount    Int
  status    PaymentStatus  // PENDING | COMPLETED | FAILED | EXPIRED
}
```

## Running in Production

### Option A: Kubernetes (Recommended)

```yaml
# deployment.yaml (example)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: static-website-generator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: static-website-generator
  template:
    spec:
      containers:
      - name: app
        image: your-registry/static-website-generator:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        # ... other env vars from secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Option B: ECS / Cloud Services

Push to container registry:
```bash
docker build -t static-website-generator .
docker tag static-website-generator:latest your-registry/static-website-generator:v1.0.0
docker push your-registry/static-website-generator:v1.0.0
```

## Authentication (Auth0 Setup)

1. Create Auth0 tenant
2. Create Regular Web Application
3. Configure callback URLs: `http://localhost:3000/callback`
4. Add custom claims for RBAC:
   ```json
   {
     "https://beyondSure.com/role": "customer"
   }
   ```
5. Update `.env` with Auth0 credentials

## Logging Format (JSON)

Structured JSON logs are sent to stdout in production:

```json
{
  "level": "info",
  "message": "Server started",
  "timestamp": "2026-05-14T12:00:00.000Z",
  "service": "static-website-generator",
  "environment": "production",
  "port": 3000
}
```

Configure centralized logging to ingest these JSON logs (Datadog, ELK, CloudWatch).

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/` | No | Frontend |
| POST | `/api/preview` | Optional | Preview website |
| POST | `/api/generate` | Optional | Generate & download |
| POST | `/api/ai-section` | No | AI content generation |
| POST | `/api/chat` | No | Chatbot |
| POST | `/api/upload-image` | No | Image upload |
| POST | `/api/login` | No | Dev login (bypass) |

## CI/CD Pipeline (Recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:${{ github.sha }} .
      - run: docker push registry/app:${{ github.sha }}
```

## Troubleshooting

### Database Connection Failed
- Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Ensure security group allows MySQL port (3306)
- Check managed DB is publicly accessible or in same VPC

### Auth0 Not Working
- Verify `AUTH0_DOMAIN` matches your tenant
- Check `AUTH0_AUDIENCE` matches API Identifier in Auth0
- Ensure callback URLs are configured

### Logs Not Visible
- Set `LOG_LEVEL=debug` for verbose logging
- Check container stdout is being captured
- Verify centralized logging endpoint is correct

## Support

For issues or questions, contact the development team.