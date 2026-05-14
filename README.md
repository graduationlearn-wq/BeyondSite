# BeyondSite — No-Code Website Generator

A no-code platform that lets businesses fill a form, generate AI-written content, preview their website, pay once, and download a production-ready HTML/CSS/JS ZIP — ready to host anywhere.

Built as a prototype by an intern. Backend stubs (Auth0, MySQL, payment gateway) are scaffolded and documented for the deployment team to wire up.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [User Flow](#user-flow)
6. [Templates](#templates)
7. [AI Content Generation](#ai-content-generation)
8. [API Reference](#api-reference)
9. [Database Schema](#database-schema)
10. [Authentication](#authentication)
11. [File Uploads](#file-uploads)
12. [Logging](#logging)
13. [Local Development](#local-development)
14. [Environment Variables](#environment-variables)
15. [Testing](#testing)
16. [CI/CD Pipeline](#cicd-pipeline)
17. [Deployment Team — Pre-Deploy Checklist](#deployment-team--pre-deploy-checklist)
18. [Known Prototype Limitations](#known-prototype-limitations)

---

## What It Does

1. User picks one of 13 industry-specific website templates
2. Fills in business details (name, tagline, description, colors, contact info, logo)
3. Optionally clicks the ✨ AI button to auto-generate section copy using Gemini (Groq as fallback)
4. Previews the full website inside a responsive browser mockup (desktop / tablet / mobile)
5. Pays a one-time fee (currently a stub — Stripe/Razorpay to be wired)
6. Downloads a complete HTML/CSS/JS ZIP file, ready to deploy on any static host

A built-in chatbot (powered by Groq/LLaMA) answers questions about the builder itself.

---

## System Architecture

```
Browser (Vanilla JS + CSS)
        │
        │  HTTP/REST
        ▼
┌─────────────────────────────────────────────────┐
│              Express.js  (Node 20)              │
│                                                 │
│  Routes          Middleware       Utilities     │
│  ──────          ──────────       ─────────     │
│  /api/preview    rate-limit       extractJSON   │
│  /api/generate   multer upload    buildTemplate │
│  /api/ai-section auth (stub)      templatePath  │
│  /api/chat       winston logger   consumePayment│
│  /api/pay        dotenv config                  │
│  /api/login                                     │
│  /api/register                                  │
│  /health                                        │
└──────────┬──────────────┬───────────────────────┘
           │              │
    ┌──────▼──────┐  ┌────▼─────────────────────┐
    │  EJS Engine │  │  AI Providers             │
    │  (13 tpls)  │  │  Gemini 2.5 Flash (pri.)  │
    └─────────────┘  │  Groq / LLaMA 70B (fbk.)  │
                     └──────────────────────────-┘

── Currently stubs (deployment team to connect) ──

    ┌──────────────┐   ┌──────────────┐   ┌──────────┐
    │  MySQL 8.0   │   │    Auth0     │   │ Razorpay │
    │  (Prisma ORM)│   │  (RBAC JWT)  │   │ /Stripe  │
    └──────────────┘   └──────────────┘   └──────────┘

    ┌───────────────────────────────────────────────┐
    │  Docker container  →  Cloud container platform │
    │  Winston JSON logs →  Centralized log platform │
    └───────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js 20 | LTS, `>=18` required |
| Framework | Express 5 | |
| Templating | EJS 5 | Server-side HTML rendering |
| AI — Primary | Google Gemini 2.5 Flash | Via `@google/generative-ai` |
| AI — Fallback | Groq LLaMA 3.3 70B | OpenAI-compatible REST API |
| Chatbot | Groq LLaMA 3.3 70B | Same Groq key, separate endpoint |
| File upload | Multer | Local disk (default) or S3 (env flag) |
| ZIP generation | Archiver | Streams directly to response |
| ORM | Prisma 5 | Schema ready, MySQL connection pending |
| Database | MySQL 8.0 | Managed instance (RDS / Azure / GCP) |
| Auth | Auth0 (JWT/RS256) | RBAC with ADMIN / CUSTOMER roles — stub |
| Payments | Stub (in-memory) | Razorpay or Stripe to be integrated |
| Logging | Winston 3 | JSON structured logs to stdout |
| Rate limiting | express-rate-limit | Per-route limits on AI, pay, generate, chat |
| Testing | Jest 29 | Node environment, 35 unit tests |
| Linting | ESLint 8 | |
| CI | GitHub Actions | Tests + `npm audit` on every PR/push to `main` |
| Containers | Docker + Compose | Dev and prod ready |
| Config | dotenv | `.env` file, never committed |

---

## Project Structure

```
BeyondSite/
├── server.js                  # Express entry point — all routes
├── package.json
├── jest.config.js
├── Dockerfile
├── docker-compose.yml
├── .env.example               # Copy to .env and fill in values
├── .github/
│   └── workflows/ci.yml       # GitHub Actions CI
│
├── public/                    # Static frontend (served by Express)
│   ├── index.html             # Main builder UI
│   ├── login.html             # Login page
│   ├── register.html          # Registration page
│   ├── script.js              # Builder logic, AI calls, preview, download
│   ├── chatbot.js             # Chatbot widget
│   ├── template-preview.js    # Hover/tap template preview modal
│   ├── preview-frame.js       # Responsive device frame (desktop/tablet/mobile)
│   ├── style.css              # All styles
│   └── uploads/images/        # Uploaded logos (gitignored in prod)
│
├── templates/
│   ├── website-template-1.ejs … website-template-13.ejs
│   ├── preview-1.html … preview-13.html   # Static preview thumbnails
│   └── schemas/               # JSON field schemas per template
│
├── src/lib/                   # Backend utilities
│   ├── utils.js               # extractJSON, buildTemplateData, templatePath
│   ├── payments.js            # In-memory payment store + consumePayment
│   ├── auth.js                # Auth0 JWT middleware (dev bypass active)
│   ├── database.js            # Prisma client wrapper
│   ├── storage.js             # Local disk / S3 upload abstraction
│   ├── logger.js              # Winston JSON logger
│   └── config.js              # Centralised env config
│
├── prisma/
│   ├── schema.prisma          # Database models
│   └── schema.sql             # Raw SQL equivalent
│
└── __tests__/
    ├── setup.js
    ├── logger.test.js
    ├── utils.test.js          # 25 tests — extractJSON, buildTemplateData, templatePath
    └── payments.test.js       # 7 tests  — consumePayment edge cases
```

---

## User Flow

```
[Landing Page]
      │
      ▼
[Pick Template]  ←── 13 templates, hover/tap to open full-page preview
      │
      ▼
[Fill Form]      ←── Business name, tagline, description, colors, logo, contact
      │
      ├── [✨ AI Button]  →  POST /api/ai-section
      │                      Gemini → Groq fallback → JSON → fills form
      ▼
[Preview]        ←── POST /api/preview → EJS renders HTML → shown in iframe
      │                Responsive toggle: Desktop / Tablet / Mobile
      ▼
[Pay]            ←── POST /api/pay → returns paymentId (in-memory stub)
      │                TODO: replace with Razorpay / Stripe webhook
      ▼
[Download ZIP]   ←── POST /api/generate (paymentId required)
                      EJS renders index.html → Archiver streams ZIP
                      ZIP contains: index.html + all uploaded images
```

---

## Templates

| ID | Name | Industry |
|---|---|---|
| template-1 | Editorial | Blog / Magazine |
| template-2 | Agency | Creative / Studio |
| template-3 | Terminal / Dev Studio | Tech / Dev Agency |
| template-4 | Web3 / Protocol | Crypto / On-chain |
| template-5 | Local Service | Plumber, Salon, Clinic etc. |
| template-6 | BFSI / Banking | Bank / Financial Institution |
| template-7 | Startup / SaaS | B2C SaaS Product |
| template-8 | Insurance Advisor | IRDAI-licensed advisor |
| template-9 | NBFC / Lender | RBI-registered NBFC |
| template-10 | Restaurant / Café | Food & Beverage |
| template-11 | Portfolio / Freelancer | Individual / Freelancer |
| template-12 | InsurTech SaaS | B2B API Platform (insurance) |
| template-13 | Insurance Market | Aggregator / Marketplace |

Each template has an EJS file, a static preview HTML, a JSON field schema, and a set of AI prompts in `server.js`.

---

## AI Content Generation

`POST /api/ai-section` uses a **two-layer fallback**:

1. **Gemini 2.5 Flash** (primary) — retries up to 3× on 503 with exponential backoff
2. **Groq LLaMA 3.3 70B** (fallback) — kicks in if Gemini fails or is rate-limited

Each template × section has a dedicated prompt in the `AI_PROMPTS` object in `server.js`. Prompts tell the model to return structured JSON; the frontend merges this directly into form fields.

`extractJSON()` in `src/lib/utils.js` handles markdown fences and prose wrapping that models sometimes add around the JSON.

Rate limit: **15 AI calls per IP per hour**.

---

## API Reference

| Method | Path | Rate Limit | Auth | Description |
|---|---|---|---|---|
| `GET` | `/` | — | No | Builder UI |
| `GET` | `/login` | — | No | Login page |
| `GET` | `/register` | — | No | Register page |
| `GET` | `/health` | — | No | Health check (DB ping) |
| `POST` | `/api/login` | — | No | **Stub** — replace with Auth0 |
| `POST` | `/api/register` | — | No | **Stub** — wire to DB |
| `POST` | `/api/preview` | — | No | Render template to HTML |
| `POST` | `/api/ai-section` | 15/hr | No | AI content for one section |
| `POST` | `/api/chat` | 30/10min | No | Chatbot (Groq) |
| `POST` | `/api/pay` | 20/hr | No | **Stub** — replace with real gateway |
| `POST` | `/api/generate` | 10/hr | No | Render + ZIP download |
| `POST` | `/api/upload-image` | — | No | Upload image |
| `POST` | `/api/upload-logo` | — | No | Back-compat alias |
| `GET` | `/api/templates` | — | No | List templates |
| `GET` | `/api/schema/:id` | — | No | Field schema for a template |

---

## Database Schema

Prisma schema at `prisma/schema.prisma`. Target: MySQL 8.0.

```
User ──< Website      one user → many saved websites
User ──< Draft        one user → one autosave per template
User ──< Payment      one user → many payments
User ──< Download     one user → many download records
Payment ──< Download  one payment → one download event
Template              master catalogue of published templates
```

- **User** — `auth0Id` (Auth0 `sub`), `email`, `role` (ADMIN | CUSTOMER)
- **Website** — `templateId` + `data` (JSON form state) + `status` (DRAFT | PUBLISHED | ARCHIVED)
- **Draft** — auto-save slot, unique per `(userId, templateId)`, upserted on change
- **Payment** — `paymentId`, `amount`, `status` (CREATED → PAID → FAILED | REFUNDED)
- **Download** — audit trail: which user downloaded which template after which payment
- **Template** — `templateId`, `displayName`, `isPublished`

> Not connected in the prototype. Schema is complete — run `npm run db:migrate:deploy` against the production instance.

---

## Authentication

**Current (prototype):** Hardcoded admin account + catch-all that lets any email/password through. Auth state lives in `localStorage` only.

**Production:** `src/lib/auth.js` has the full Auth0 JWT middleware ready. Set `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` and it automatically switches to RS256/JWKS verification. The three middleware functions (`authenticate`, `requireRole`, `optionalAuth`) need to be applied to routes in `server.js`.

**RBAC roles:**

| Role | Access |
|---|---|
| `ADMIN` | All routes + payment bypass |
| `CUSTOMER` | Standard builder flow, own data only |

**Auth0 Action (add to login flow):**
```js
api.idToken.setCustomClaim(
  'https://beyondSure.com/role',
  user.app_metadata.role ?? 'customer'
);
```

`getOrCreateUser()` in `src/lib/auth.js` auto-creates a DB record on first login.

---

## File Uploads

Images uploaded via `POST /api/upload-image` (max 3 MB, PNG/JPG/WebP/SVG/GIF).

**Local (default):** Saved to `public/uploads/images/`. Lost on container redeploy — use S3 in production.

**S3:** Set `UPLOAD_STORAGE=s3` and the four `AWS_*` env vars. The abstraction in `src/lib/storage.js` switches backends transparently — no route changes needed.

---

## Logging

Winston 3, JSON to stdout, no local files.

```json
{
  "level": "info",
  "message": "AI section success",
  "timestamp": "2026-05-15T10:30:00.000Z",
  "service": "static-website-generator",
  "templateId": "template-12",
  "sectionId": "hero",
  "provider": "gemini"
}
```

Set `LOG_LEVEL=debug` locally. Use `info` in production. Forward container stdout to Datadog / ELK / CloudWatch.

---

## Local Development

**Prerequisites:** Node.js 20+, npm 9+

```bash
# Clone and install
git clone https://github.com/graduationlearn-wq/BeyondSite.git
cd BeyondSite
npm install

# Environment
cp .env.example .env
# Set GEMINI_API_KEY at minimum

# Start
npm start
# → http://localhost:3000
```

**With Docker (includes MySQL):**
```bash
npm run docker:up      # Start app + MySQL
npm run docker:logs    # Stream logs
npm run docker:down    # Stop
```

The app starts without a DB — `DB_HOST` is optional locally.

---

## Environment Variables

| Variable | Prod required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | `production` / `development` / `test` |
| `PORT` | No | `3000` | HTTP port |
| `GEMINI_API_KEY` | Yes | — | Google AI Studio key |
| `GROQ_API_KEY` | No | — | Groq key (AI fallback + chatbot) |
| `DATABASE_URL` | Yes | — | `mysql://user:pass@host:3306/db` |
| `DB_HOST` | Yes | — | MySQL hostname |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_NAME` | Yes | — | Database name |
| `DB_USER` | Yes | — | DB username |
| `DB_PASSWORD` | Yes | — | DB password |
| `AUTH0_DOMAIN` | Yes | — | e.g. `yourtenant.auth0.com` |
| `AUTH0_CLIENT_ID` | Yes | — | Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | Yes | — | Auth0 client secret |
| `AUTH0_AUDIENCE` | Yes | — | Auth0 API identifier |
| `LOG_LEVEL` | No | `info` | `debug` / `info` / `warn` / `error` |
| `UPLOAD_STORAGE` | No | `local` | `local` or `s3` |
| `AWS_REGION` | If S3 | — | e.g. `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | If S3 | — | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | If S3 | — | IAM secret |
| `AWS_S3_BUCKET` | If S3 | — | S3 bucket name |

---

## Testing

```bash
npm test           # All tests + coverage
npm run test:watch # Watch mode
npx jest           # Direct (avoids Windows NODE_ENV issue with npm test)
```

| File | Tests | What's covered |
|---|---|---|
| `logger.test.js` | 4 | Logger init, child loggers, error logging |
| `utils.test.js` | 25 | `extractJSON` (markdown fences, prose, errors), `templatePath` (sanitisation, path traversal, fallback), `buildTemplateData` (defaults, fallbacks, immutability) |
| `payments.test.js` | 7 | `consumePayment` — invalid, valid, already-used, expired, TTL boundary, double-spend |

Route-level integration tests (require DB + Auth0) to be added by the deployment team.

---

## CI/CD Pipeline

`.github/workflows/ci.yml` — runs on every push to `main` and every PR:

1. Checkout → Node 20 → `npm ci`
2. `npx prisma generate` (dummy DB URL, no real connection needed)
3. `npm test` — all tests must pass
4. `npm audit --audit-level=high` — blocks on high/critical CVEs

**Branch protection to configure (GitHub → Settings → Branches → `main`):**
- Require pull request before merging (1–2 reviewers)
- Require `ci` status check to pass
- Do not allow bypassing rules
- No direct push to `main`

---

## Deployment Team — Pre-Deploy Checklist

The prototype is scaffolded. These stubs need replacing before going live. Each has a `// TODO` comment in the relevant file.

### 1. Auth0 — replace placeholder login

- [ ] Set `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`
- [ ] Add Auth0 Action to inject `"https://beyondSure.com/role"` claim
- [ ] Wire `authenticate()` middleware onto protected routes in `server.js`
- [ ] Replace `/api/login` and `/api/register` stubs with Auth0 Universal Login or SDK
- [ ] Remove the `if (email && password)` catch-all from `/api/login`
- [ ] Remove the `admin_bypass_` payment skip in `/api/generate` once ADMIN role is JWT-enforced

### 2. MySQL — connect the database

- [ ] Provision managed MySQL 8.0 instance
- [ ] Set `DATABASE_URL` and `DB_*` env vars
- [ ] `npm run db:migrate:deploy` — applies Prisma migrations to prod DB
- [ ] `npm run db:generate` — regenerates Prisma client
- [ ] Seed `Template` table with records for `template-1` through `template-13`

### 3. Payment gateway — replace the stub

- [ ] Choose Razorpay (India) or Stripe (international)
- [ ] Replace `POST /api/pay` with real order/intent creation
- [ ] Add webhook endpoint to receive confirmation → write `Payment` DB record
- [ ] Update `consumePayment()` in `src/lib/payments.js` to read from DB
- [ ] Create a `Download` record on every successful `/api/generate`

### 4. File storage — switch to S3

- [ ] Set `UPLOAD_STORAGE=s3` and the four `AWS_*` env vars
- [ ] Create S3 bucket with write-only IAM policy for the app
- [ ] Configure bucket CORS for uploads from the app domain
- [ ] Optionally add CloudFront CDN in front of the bucket

### 5. GitHub branch protection

- [ ] GitHub → Settings → Branches → Add rule for `main`
- [ ] Require PR reviews (min. 1 reviewer)
- [ ] Require `ci` status check to pass
- [ ] Do not allow bypassing

### 6. Centralised logging

- [ ] Forward container stdout to Datadog / ELK / CloudWatch
- [ ] Set `LOG_LEVEL=info` in production
- [ ] Create alert on `"level":"error"` log events

### 7. Container platform

- [ ] `docker build -t beyondsite:v1.0.0 .` → push to registry
- [ ] Inject all env vars as secrets
- [ ] Liveness probe: `GET /health` (200 when DB OK, 503 degraded)
- [ ] Readiness probe: same
- [ ] Suggested limits: 256Mi RAM, 250m CPU per replica
- [ ] Set `NODE_ENV=production`

### 8. Profile page (future)

- [ ] Create `GET /profile` route and `public/profile.html`
- [ ] Wire "My Templates" dropdown to the user's `Download` records from DB
- [ ] Wire "Security" to Auth0 account management

---

## Known Prototype Limitations

Intentional shortcuts — not bugs.

| Area | Current state | Production fix |
|---|---|---|
| Auth | Any email/password logs in; hardcoded admin | Auth0 JWT (`src/lib/auth.js` ready) |
| Payments | In-memory, resets on restart | Razorpay / Stripe + DB |
| Database | Not connected | Set `DATABASE_URL`, run migrations |
| Register | Accepts form but saves nothing | Wire to `getOrCreateUser()` post-Auth0 |
| Profile page | Dropdown shown, page doesn't exist | Build `/profile` route + page |
| Uploads | Local disk (lost on container redeploy) | `UPLOAD_STORAGE=s3` |
| Admin bypass | `admin_bypass_` prefix skips payment | Remove after RBAC is enforced |
| Login state | `localStorage` only | JWT cookie / Auth0 session |
| Debug shortcut | `Ctrl+Shift+L` clears login | Dev convenience — remove or keep |

---

## Troubleshooting

**Server won't start**
`GEMINI_API_KEY` is required even locally. If `DB_HOST` is set but unreachable, the server exits in production — unset it to run without a DB locally.

**AI button returns error**
Check the key in Google AI Studio. If Gemini quota is hit, set `GROQ_API_KEY` for the fallback. Rate limit (15/hr) reached — wait or raise the limit in `server.js`.

**Preview iframe blank**
Open browser console. A 500 from `/api/preview` means an EJS render error — check server logs for `Preview error`.

**ZIP download fails**
"Payment required" — complete the pay step first, or log in as admin. "Payment expired" — tokens last 30 minutes; pay again.

**Tests failing on Windows**
`npm test` uses a `NODE_ENV=test` prefix that fails in `cmd.exe`. Run `npx jest` directly instead.
