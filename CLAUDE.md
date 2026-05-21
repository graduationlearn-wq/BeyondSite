# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ READ THIS FIRST — every new session

Before you touch any code, in this exact order:

1. Open `SiteMemory/01_CURRENT_STATE.md` — the dated "what works / what's broken right now" doc. It is always more up to date than any other file in the repo (including this one). If anything in CLAUDE.md contradicts CURRENT_STATE, CURRENT_STATE wins.
2. Skim the **two latest rounds** at the top of `SiteMemory/changelog/CHANGELOG.md`. That's the last ~week of changes. If the user asks you to "do X", check whether X (or its prerequisites) is already in those rounds before you start building.
3. If the user's task touches a new file area (auth, payments, templates, EJS), open the matching architecture doc in `SiteMemory/architecture/` first.

**Do not redo work that's already in the changelog.** This codebase has been built incrementally across many sessions. The user is frustrated by Claude Code re-implementing things that already exist. Read first, then act.

When you finish a meaningful change: append a new round to `CHANGELOG.md` (never edit past rounds) and update `01_CURRENT_STATE.md` if the "what works" or "what's broken" list changed.

## What this is

BeyondSite — a no-code generator for professional business websites. Pick a template → fill a schema-driven form (with AI fill assist) → preview → pay → download a self-contained ZIP of HTML/CSS/JS. 14 templates covering Indian-regulated SMBs (NBFC, BFSI, Insurance, AMFI MF Distributors) and global verticals. Built as an intern prototype handoff to BeyondSure's tech team.

## Commands

```bash
# Run locally (no DB required — boots in in-memory mode)
cp .env.example .env    # add GEMINI_API_KEY at minimum
npm install
npx prisma generate
node server.js          # http://localhost:3000

# Tests
npm test                # Jest with coverage (376 tests)
npm run test:watch      # Watch mode
npx jest --coverage     # Windows fallback if NODE_ENV=test prefix fails

# Linting
npm run lint
npm run lint:fix

# Pre-commit verification (MANDATORY before any commit)
node -c server.js                      # syntax-check server
cd templates && node preview-test.js   # must print "14/14 templates rendered cleanly"

# Database (requires DATABASE_URL in .env)
npm run db:generate          # prisma generate (no DB needed)
npm run db:migrate:deploy    # apply committed migrations to a real MySQL DB
npm run db:seed              # upsert 14 templates + bootstrap admin

# Docker
npm run docker:build
npm run docker:up    # boots app + MySQL sidecar
```

**Windows note:** `npm test` may fail if the `NODE_ENV=test` prefix breaks cmd.exe — use `npx jest --coverage` instead.

## Architecture

### The schema-driven core

Every template is three coordinated artifacts:

1. **`templates/schemas/template-N.json`** — JSON schema describing sections and fields. Extends `_base.json` (brand/contact/theme) via `"extends": "_base"`. Field types: `text`, `textarea`, `select`, `color`, `image`, `repeater`.

2. **`templates/website-template-N.ejs`** — EJS renderer. Always uses the safe-locals pattern (see Conventions). No external resources except Google Fonts.

3. **`server.js :: AI_PROMPTS['template-N']`** — server-side prompt functions, one per aiable section. Client never sees prompts.

The server merges schemas at `GET /api/schema/:templateId`, renders at `POST /api/preview` and `POST /api/generate`.

### Request flow

```
User fills form → POST /api/ai-section (optional ✨)
                → POST /api/preview → EJS renderFile → iframe
                → POST /api/pay → Razorpay order (or dummy)
                → POST /api/payments/verify → HMAC check → PAID
                → POST /api/generate → consumePayment → zip → download
```

### AI fallback chain

`/api/ai-section` tries Gemini 2.5 Flash first (3 retries on 503), then falls back to Groq Llama-3.3-70b. If both fail, returns 503. Same prompt must work on both providers — never write Gemini-specific tricks. Rate limit: 15 req/hour/IP.

Chatbot (`/api/chat`) has a separate path: `public/chatbot.js` handles ~9 social intent categories locally (zero API cost) via regex; only substantive questions hit Groq with a scope-locked system prompt.

### Integration seams in `src/lib/`

These are the stubs the tech team will swap for production implementations:

| File | Status | To activate |
|------|--------|-------------|
| `auth.js` | Auth0 middleware wired + RBAC enforced, demo uses env-based dummy accounts | Set `AUTH0_DOMAIN` + `AUTH0_AUDIENCE` + `DEV_AUTH_BYPASS=false` |
| `database.js` | Prisma client ready, runtime wired to in-memory Maps | Set `DATABASE_URL` pointing at MySQL |
| `payments.js` | Razorpay scaffold committed + Prisma-backed, test credentials active | Set `PAYMENT_PROVIDER=razorpay` + `RAZORPAY_*` env vars |
| `storage.js` | Local disk default | Set `UPLOAD_STORAGE=s3` + `AWS_*` vars |

### RBAC (Role-Based Access Control)

`requireRole()` is wired server-side on all protected routes:
- `/api/upload-image`, `/api/upload-logo` → `authenticate(), requireRole('ADMIN', 'CUSTOMER')`
- `/api/draft` (POST + GET) → `authenticate(), requireRole('ADMIN', 'CUSTOMER')`
- `/api/generate` → `authenticate(), requireRole('ADMIN', 'CUSTOMER')`

Demo session tokens encode role: `base64url({ email, role, ts }).hex_signature`. The `authenticate()` middleware decodes the payload, verifies the HMAC signature, and sets `req.user.role`. Works with any OIDC provider (Auth0, Azure AD, Okta, custom SSO) — just env var changes.

Every stub has a `// HANDOFF:` comment pointing at the replacement callsite. [[SiteMemory/handoff/deployment]] has the step-by-step recipe.

### Payment flow details

`PAYMENT_PROVIDER=dummy` (default for local dev): `/api/pay` returns a synthetic paymentId with `status: PAID` immediately — no Razorpay call made.

Admin bypass: any `paymentId` starting with `admin_bypass_` skips `consumePayment()` entirely.

Razorpay: `/api/pay` creates an order → frontend opens Razorpay checkout widget → `/api/payments/verify` validates HMAC-SHA256 → marks PAID → `/api/generate` gates on PAID status.

**Payment sub-steps (Round N):** Step 3 ("Pay & Download") has 3 internal sub-steps with a mini progress bar:
1. **Pay** — Payment button, Razorpay checkout
2. **Confirmation** — "Payment received" with receipt details, auto-advances after 1.5s
3. **Download** — Download button → ZIP downloads → success screen

After payment succeeds, auto-advances through Confirmation → Download. Admin bypass skips checkout but still progresses through sub-steps.

## Critical conventions

### The six wired artifacts rule

**Every new template requires ALL SIX in lock-step.** Skip any one and rendering, the picker, the AI button, or preview-test will break:

1. `templates/schemas/template-N.json`
2. `templates/website-template-N.ejs`
3. `server.js` — `AI_PROMPTS['template-N']` entry + field names appended to `strKeys`/`arrKeys` in `buildTemplateData()`
4. `templates/preview-test.js` — sample function, `sampleFor()` dispatch, `TEMPLATES`/`NAMES` arrays, same `strKeys`/`arrKeys` additions
5. `public/index.html` — `<label class="template-box">` picker card
6. `public/style.css` — `.template-{slug}` and `.tp-{slug}-*` thumbnail CSS

When adding a template, copy template-12 (InsurTech) or template-13 (Insurance Market) end-to-end as a starting point.

### Safe-locals EJS pattern

Every template (except legacy template-1) must start with this pattern before `<!DOCTYPE html>`:

```ejs
<%
  const L = locals || {};
  const esc = (s) => (s == null ? '' : String(s));
  const def = (v, d) => (v && String(v).trim() ? v : d);
  // All field reads go through esc() or def() — NEVER raw <%= L.fieldName %>
  // All arrays need a non-empty fallback so sections never collapse visually
%>
```

### strKeys / arrKeys discipline

`buildTemplateData()` in `server.js` and the parallel block in `templates/preview-test.js` both contain:

```javascript
const strKeys = [ /* every optional string field */ ];
const arrKeys = [ /* every repeater field */ ];
```

When adding any new field to any schema, append it to the correct array in **both files**. They must stay in sync or new empty-field submissions cause EJS `ReferenceError`.

`src/lib/utils.js` also maintains strKeys/arrKeys for server-side data building — keep all three files in sync.

### AI prompt rules

- Always end prompts with `Return ONLY JSON: { ... }` and an explicit shape
- Use angle-bracket placeholders with constraints: `"<8-12 word headline>"`
- For repeaters, specify count: `"with EXACTLY 4 items"`
- Keep prompts tight — must work identically on Gemini AND Groq
- Prompts live server-side only (`AI_PROMPTS` in `server.js`) — client sends only `{ templateId, sectionId, businessName, description, tone }`

## What's NOT in this stack (deliberate)

No React/Vue/Svelte, no CSS framework (Tailwind/Bootstrap), no TypeScript, no bundler. Vanilla JS served raw via `<script>` tags. Each template has hand-rolled CSS to preserve visual identity.

## Known issues / open stubs

- **Template 1 (Editorial)** — still on the legacy non-safe-locals pattern. Works but not as defensive as templates 2–14.
- **Custom cursor** — still inline `<script>` in `index.html`, not extracted to `public/cursor.js`. Don't add new pages without either including it or scoping `cursor: auto`.
- **No AI fallback below Groq** — if both providers fail, the form gets a 503. No canned defaults yet.
- **Thumbnail CSS class names** for template-12/13 still carry old codenames (`template-heph-prev`, `template-turtlemint-prev`) — sample brands are now Stratus and Coverwise.
- **Auth and DB are stubs** — all runtime state is in-memory. Drafts and payments are lost on server restart.
- **Razorpay running on test credentials** — real charges won't happen until test keys are swapped for live keys.

## Template catalogue (14 templates)

| # | Slug | Display name | Compliance |
|---|------|-------------|-----------|
| 1 | Editorial | Editorial / Magazine | — |
| 2 | Agency | Agency / Noir | — |
| 3 | Terminal | Terminal / Dev Studio | — |
| 4 | Web3 | Web3 / Protocol | — |
| 5 | Local | Local Service | — |
| 6 | BFSI | BFSI / Banking | RBI · DICGC |
| 7 | Startup | Startup / SaaS | — |
| 8 | Insurance | Insurance Advisor | IRDAI |
| 9 | NBFC | NBFC / Lender | RBI · NBFC-ICC |
| 10 | Restaurant | Restaurant / Cafe | — |
| 11 | Portfolio | Portfolio / Freelancer | — |
| 12 | InsurTech | InsurTech SaaS | SOC 2 · IRDAI-aligned |
| 13 | Insurance Market | Insurance Market | IRDAI |
| 14 | mf-distributor | Mutual Fund Distributor | AMFI · SEBI SCORES |

Templates 6, 8, 9, 13, 14 carry the `complianceReview` block — the form renderer shows an amber warning banner when these are selected.

## SiteMemory vault

`SiteMemory/` is the architectural brain. Read in this order for deep context:
- [[SiteMemory/01_CURRENT_STATE]] — what works / what's broken right now
- [[SiteMemory/02_CONVENTIONS]] — full coding rules
- [[SiteMemory/architecture/]] — per-feature deep dives (AI fallback, chatbot, template system, preview modal, API routes)
- [[SiteMemory/decisions/ADR]] — the why behind every architectural choice
- [[SiteMemory/changelog/CHANGELOG]] — append-only history (never edit past rounds)

## Handoff docs

- [[SiteMemory/handoff/HANDOFF]] — consolidated checklist: what's done vs. what the tech team needs to wire
- [[SiteMemory/handoff/DEMO]] — conversational walkthrough script for stakeholder demos
- [[SiteMemory/handoff/deployment]] — step-by-step production deployment guide

## Environment variables

`GEMINI_API_KEY` is required even locally — server won't boot without it. `DATABASE_URL` is optional for UI testing (app falls back to in-memory). See `.env.example` for the full annotated list.

## Demo accounts

Hardcoded in `server.js` via `DUMMY_USERS`. All other credentials are rejected.

- **Admin:** `admin@beyondsite.com` / `admin123` — bypasses form validation and subscription gate
- **Customer:** `customer@beyondsite.com` / `customer123` — standard experience
