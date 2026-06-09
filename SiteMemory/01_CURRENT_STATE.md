# Current State — 2026-06-09

**Refresh this file at the end of every meaningful work session.** Don't preserve old state — that's what `changelog/CHANGELOG.md` is for. This file is always "right now."

## Catalogue

**19 templates · all rendering clean** (`node preview-test.js` reports 19/19 ✓):

| #  | Slug                       | Display name                  | Aesthetic                                                                  |
|----|---                         |---                            |---                                                                          |
| 1  | Editorial                  | Editorial                     | newspaper / magazine, serif                                                |
| 2  | Agency                     | Agency                        | noir + gold, premium creative studio                                       |
| 3  | Terminal                   | Terminal / Dev Studio         | CRT green monospace, IDE feel                                              |
| 4  | Web3                       | Web3 / Protocol               | dark + cyan, dashboard hero                                                |
| 5  | Local                      | Local Service                 | warm orange / cream                                                        |
| 6  | BFSI                       | BFSI / Banking                | navy + gold, institutional                                                 |
| 7  | Startup                    | Startup / SaaS                | cool blue + white, modern fintech feel                                     |
| 8  | Insurance                  | Insurance Advisor             | calm green                                                                 |
| 9  | NBFC                       | NBFC / Lender                 | cream + dark teal + warm orange                                            |
| 10 | Restaurant                 | Restaurant / Café             | cream + burgundy + Fraunces serif                                          |
| 11 | Portfolio                  | Portfolio / Freelancer        | pure black/white minimalism, big serif                                     |
| 12 | InsurTech                  | InsurTech SaaS                | **light · Stripe-pattern · dark code panel**                               |
| 13 | Insurance Market           | Insurance Market              | bright green + gold, consumer aggregator                                   |
| 14 | mf-distributor             | Mutual Fund Distributor       | sandstone + maroon + brass, Marwari wealth-house                           |
| 15 | broker                     | Stock Broker / Demat          | violet + white, Plus Jakarta display, phone-mockup hero                    |
| 16 | ria                        | SEBI RIA / Investment Adviser | sage + cream + peach, Fraunces serif, warm/casual, portrait card           |
| 17 | clinic                     | Healthcare Clinic / Hospital  | white + soft sky-blue + mint, cartoon doctor SVGs, calm waiting-room feel  |
| 18 | lab                        | Diagnostic Lab / Pathology    | lab-blue + amber + beaker green, test-tube cluster + periodic-table grid + fake sample-report card |
| 19 | dsa                        | Loan DSA                      | deep indigo + electric lime + cream, interactive EMI calc + sticky mobile CTA |

See [[_registry|Templates registry]] for one-line descriptions per template.

## What works

### Core product
- **All 19 templates render clean** end-to-end via `node preview-test.js` with realistic sample data. → [[04_template-system]] · [[_registry|Templates registry]]
- **Schema-driven form** with side-gutter hints (label + arrow + description on left/right of each section), mockup thumbnails per section, ⓘ tap-to-expand on mobile. → [[04_template-system]]
- **Per-section AI button (✨)** with **Gemini → Groq → friendly error** failover chain. → [[02_ai-fallback]] · [[ADR#ADR-005|ADR-005]]
- **Help chatbot** — floating gold bubble bottom-right. Two-layer: client-side intent matcher catches ~9 social categories locally (zero API cost); substantive questions go to Groq via `/api/chat`. → [[03_chatbot]] · [[ADR#ADR-007|ADR-007]]
- **Compliance review banner** appears on regulated templates (BFSI, Insurance, NBFC, Insurance Market, MF Distributor, Stock Broker, SEBI RIA, Healthcare Clinic, Diagnostic Lab, Loan DSA). → [[ADR#ADR-008|ADR-008]]
- **Hover-preview modal** — desktop hover ~1.5s or touch long-press ~600ms. Three device toggles (Desktop / Tablet / Mobile) with live iframe scaling. → [[05_preview-modal]] · [[ADR#ADR-009|ADR-009]] · [[ADR#ADR-020|ADR-020]]

### UX shell
- **`/profile` page** — green-themed profile shell with avatar, plan badge, edit-in-place fields, download history, and a dark/light theme toggle persisted to localStorage. Admin sees an extra "Admin Tools" panel. → [[ADR#ADR-017|ADR-017]]
- **`/plans` page** — three pricing tiers (Free / Pro / Studio) styled in the same green theme with the same dark/light toggle. Admin gets a bypass-to-upgrade flow that avoids the dummy paywall. → [[ADR#ADR-017|ADR-017]]
- **BeyondSite ↔ BeyondSure brand footer** — four-column footer on every main page with parent-company card (logo + tagline + link to https://www.beyondsure.in/), product nav, legal nav, Mumbai corporate-office block, plus a disclaimer band. → [[CHANGELOG#Round H|Round H notes]]
- **Required-field validation** — Business Name, Tagline, Description marked with red asterisks. Trying to preview without them triggers an inline red banner + shake animation + smooth scroll to the first empty field. Banner auto-dismisses on input. → [[ADR#ADR-019|ADR-019]]
- **Preview-modal device bar** lifted above the browser-chrome row so the iframe's own nav is no longer hidden behind the toggle buttons. Stage gets offset by `headerOffset()` of bar + chrome. → [[ADR#ADR-020|ADR-020]] · `public/preview-frame.js`

### Auth & accounts (dummy but strict)
- **Two dummy accounts** wired through `/api/login` — credentials live in env vars (`DUMMY_ADMIN_EMAIL`, `DUMMY_ADMIN_PASSWORD`, etc.), not hardcoded in source.
  - Admin → `role: "ADMIN"` (sees Admin Tools panel, plan-bypass on /plans)
  - Customer → `role: "CUSTOMER"` (standard view)
- **RBAC fully wired** — `requireRole('ADMIN', 'CUSTOMER')` enforced server-side on all protected routes (`/api/upload-image`, `/api/upload-logo`, `/api/draft`, `/api/generate`).
- **Session tokens encode role** — `base64url({ email, role, ts }).hex_signature` — `authenticate()` extracts role correctly.
- **Works with any OIDC provider** — Auth0, Azure AD, Okta, custom SSO. Just set env vars. → [[handoff/HANDOFF#auth0--sso-activation]]
- The previous "any email/password works" backdoor is closed. → [[ADR#ADR-016|ADR-016]]

### Deployer-readiness (shipped Round I)
- **Initial Prisma migration committed** at `prisma/migrations/20260515000000_init/migration.sql` — `npm run db:migrate:deploy` works against any fresh MySQL 8.
- **Seed script** at `prisma/seed.js` — upserts all 19 templates + the bootstrap admin keyed by `AUTH0_BOOTSTRAP_ADMIN_EMAIL`. Runs via `npm run db:seed` (also wired as `prisma db seed`).
- **Razorpay + Stripe scaffolds** committed in `src/lib/payments.js` as ready-to-uncomment blocks with full webhook signature recipes. `PAYMENT_PROVIDER` env var picks the dispatcher target.
- **[[handoff/deployment|Deployment guide]]** — step-by-step deployer guide covering provisioning, migration, env vars, the two manual swaps, container deploy, smoke-test, rollback.
- **HANDOFF block above `/api/login`** expanded to a 5-step Auth0 recipe naming the exact `verifyToken` / `getOrCreateUser` callsites.

### Live UAT deployment (shipped Round V)
- **Render UAT environment** at `https://beyondsite-uat.onrender.com` — Docker-based deploy off `main`, free tier, Singapore region. Tech-team-shareable URL for stakeholder demos. → [[CHANGELOG#Round V]]
- **Prisma + Alpine compatibility fixed** — `prisma/schema.prisma` now declares `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` so the generated engine binary matches Alpine's OpenSSL 3. `Dockerfile` `apk add --no-cache openssl libc6-compat` in both stages so libssl.so.3 is resolvable at runtime. These two together fixed the `Unable to require libquery_engine-linux-musl.so.node` crash that blocked the initial UAT deploys.
- **`/health` endpoint gated on `DATABASE_URL`** — previous behaviour pinged Prisma every health check, returned 503 when env var was unset, and triggered Render's SIGTERM loop. Fix: `if (db && process.env.DATABASE_URL) { ... }`. UAT now reports `{database: "not configured"}` with HTTP 200 when running in in-memory mode.

### Production-grade scaffolding (shipped Round G)
- **Dockerised** — multi-stage `Dockerfile` runs as non-root `nodejs:1001` user, exposes 3000, has `HEALTHCHECK` against `/health`. `docker-compose.yml` boots app + MySQL. → [[ADR#ADR-014|ADR-014]]
- **Prisma schema** with six models — `User`, `Website`, `Draft`, `Download`, `Template`, `Payment` — plus `Role`, `WebsiteStatus`, and `PaymentStatus` enums. Client is generated via `prisma generate`. → [[ADR#ADR-012|ADR-012]] · `prisma/schema.prisma`
- **Auth0 JWT middleware** in `src/lib/auth.js` using `jsonwebtoken` + `jwks-rsa` with key rotation cache. Dev-bypass mode honours `DEV_AUTH_BYPASS=true` so local work doesn't need a real Auth0 tenant. → [[ADR#ADR-013|ADR-013]]
- **Winston structured logging** in `src/lib/logger.js` — JSON output in prod, human-readable in dev. → [[ADR#ADR-015|ADR-015]]
- **Storage abstraction** in `src/lib/storage.js` (local FS now, S3-ready later).
- **Config + utils + payments helpers** in `src/lib/{config,utils,payments}.js`.
- **Jest unit tests** — 376 passing across 33 suites. Covers server routes (login, schema, preview, generate, payments, drafts), template rendering (14 published templates), payments (consume, create, verify, webhook, signature verification), utils, auth middleware (requireRole, authenticate, optionalAuth), storage (local/S3, file filter, multer), database, config, health, and logger. CI passes in GitHub Actions.
- **GitHub Actions CI** — `.github/workflows/ci.yml` runs `npm ci` → `prisma generate` → `npm test` → `npm audit` on push.
- **`/health` endpoint** for orchestrators; **SIGTERM handler** drains active requests before exit.
- **`.env.example`** documents every required env var. **`.dockerignore`** keeps the image lean.

### Generation & payment
- **Generate endpoint** zips rendered HTML as `index.html` plus referenced `/uploads/*` images into `assets/`. Streams as a downloadable ZIP with a slugified business name. **ZIP now has externalized assets** — `style.css` and `script.js` instead of inline code.
- **Razorpay payment wired** — `PAYMENT_PROVIDER=razorpay` (test credentials in `.env`). `/api/pay` creates a real Razorpay order (₹4,999); `/api/payments/verify` validates HMAC signature and marks PAID; `/api/generate` gates on PAID status. Admin bypass (`admin_bypass_*`) skips payment entirely — no DB required. Fallback: set `PAYMENT_PROVIDER=dummy` for local dev without credentials.
- **Payment sub-steps (Round N)** — Step 3 now has 3 internal sub-steps with a mini progress bar: Pay → Confirmation → Download. After payment succeeds, auto-advances to Confirmation (shows receipt), then auto-advances to Download after 1.5s. Download button triggers ZIP, then success screen.
- **Prisma persistence wired (Round M)** — when `DATABASE_URL` is set: login upserts a `User` row; `POST /api/draft` + `GET /api/draft/:templateId` upsert/load `Draft` rows keyed on `{userId, templateId}`; `consumePayment` stamps `usedAt` on the `Payment` row; `/api/generate` creates a `Download` record after each successful ZIP. All paths fall back to in-memory when no DB configured — demo still boots without MySQL.
- **Step-wise registration form** — `/register` now uses a 3-step wizard: Step 1 (Email + Password), Step 2 (Name), Step 3 (Summary + Terms). Same `/api/register` POST on submit.

### Polish
- **Custom yellow-dot cursor** on main app pages (z-index 100000). Native cursor on login.html / profile.html / plans.html.
- **Side-map mockup at bottom-LEFT**, chatbot at bottom-right.
- **Payment section CSS** fully styled — gold gradient top accent, dashed dividers, big gold price, glowing-check success state.
- **Select dropdowns** explicitly themed for the dark UI with custom gold chevron and dark `<option>` popup.
- **Step wizard** — tab-style navigation with scrollable tabs, max-width 640px, AI preservation. Step persistence via localStorage.
- **Template picker** — 6 visible (5, 8, 12, 13, 14, 15) + 13 hidden behind "Show More" (1–4, 7, 9–11, 16, 17, 18, 19).
- **Payment sub-steps** — Step 3 has 3 internal sub-steps (Pay → Confirmation → Download) with mini progress bar.
- **ZIP externalization** — downloaded ZIP has `style.css` and `script.js` instead of inline code.
- **Auth token bridge** — HMAC dummy token allows demo mode even when `AUTH0_DOMAIN` is configured.
- **Razorpay defensive fixes** — SDK guard, error detail propagation, 8s notifications, repaint delay, prefill from login state.

### Mobile-first polish (shipped Rounds Q–V)
- **Regulatory topbar collapses on mobile** for templates with a `.topbar` strip (5, 9, 14, 15, 16) — `.topbar-info` stacks vertically, `.topbar-links` hidden (duplicates nav + footer), font shrunk to `.68rem`. → [[CHANGELOG#Round V]]
- **Web3 (template-4) nav fixed** — mobile picker was hiding the CTA off-screen. Now hides middle nav-links at ≤600px, shrinks logo, adds `white-space:nowrap` so the brand never wraps.
- **SEBI RIA (template-16) CTA wrap fix** — default `heroCtaPrimary` shortened from "Book a free intro call" → "Book a call", `.nav-cta` got `white-space:nowrap`, smaller font + padding on tablet and mobile breakpoints.
- **Loan DSA (template-19) is mobile-first by design** — sticky bottom CTA bar with WhatsApp shortcut, full-width sliders, comparison table morphs into swipeable cards at ≤640px, accordion document checklist, 44px tap targets across the board.

## What's broken / incomplete

- **Template 1 (Editorial) is still on the legacy non-safe-locals pattern.** It works because `buildTemplateData` injects defaults for the legacy fields, but it's not as defensive as templates 2–14. Refactor is on the roadmap.
- **Razorpay running on test credentials** — real charges won't happen until test keys are swapped for live keys. `RAZORPAY_WEBHOOK_SECRET` is blank until a webhook is configured in the Razorpay dashboard. `npm install razorpay` must be run once after pulling this branch.
- **`verifyRazorpaySignature` returns `false` when `RAZORPAY_KEY_SECRET` is unset** — a defensive guard was added (Round O) so it no longer crashes, but signature verification will fail until the env var is configured. This is intentional: payments should not succeed without a valid secret.
- **Auth is dummy** — Auth0 middleware is wired, but production routes still defer to the `DUMMY_USERS` whitelist for the review demo. Flip the env vars + `DEV_AUTH_BYPASS=false` to switch over. HMAC token bridge allows demo mode even when `AUTH0_DOMAIN` is configured.
- **Persistence requires `DATABASE_URL`** — demo mode (no DB) still loses drafts/payments on restart. Wire up `DATABASE_URL` + `npm run db:migrate:deploy` + `npm run db:seed` for durability. Draft list endpoint (`GET /api/drafts`) not yet added.
- **Custom cursor logic is still inline in `index.html`.** Not yet extracted to `public/cursor.js`.
- **No deterministic canned-response fallback below AI.** If both Gemini and Groq fail, the form gets a 503 error rather than a sensible default.
- **No real customer story yet.** All sample data is fictional.
- **Template picker is unfiltered at 19 templates** — 6 visible cards + 13 behind "Show More" works but starts to feel dense. Category chips (Regulated / Creative / Local-services / etc.) is the next picker iteration.
- **No template-family inheritance.** Schemas and AI prompts are still duplicated per template.
- **Thumbnail CSS for template-12/13 still carries old codenames** (`template-heph-prev`, `template-turtlemint-prev`) — visual rename is on the low-priority pile.

## Right now / Open questions

- **UAT live for tech team**: `https://beyondsite-uat.onrender.com` (Render free tier, sleeps after 15 min). Senior is testing the full flow before production deploy.
- Sample brands have been renamed for neutrality and clearer demos: **template-12 uses "Stratus"** (previously "Heph") and **template-13 uses "Coverwise"** (previously "Turtlemint"). Thumbnail CSS class names (`template-heph-prev` / `template-turtlemint-prev`) still carry the old codenames — visual rename is on the low-priority pile.
- Two Prisma migration files exist but no migration has been applied to a real database — the schema is shape-only until we point at MySQL in earnest.

## Verification commands

Always run before commit:

```bash
# Syntax-check the server
node -c server.js

# Render every template with sample data
cd templates && node preview-test.js
# Should print: "19/19 templates rendered cleanly"

# Unit tests
npm test
# Should print: "Tests: 376 passed, 376 total"

# Container smoke test (optional but recommended pre-handoff)
docker compose up --build
# Then hit http://localhost:3000/health → expect {"status":"ok"}

# Mojibake scan — should produce empty output
grep -l "ðŸ\|â€\|Ã—\|Â·\|â‚¹\|�" templates/preview-test.js templates/website-template-*.ejs src/lib/utils.js server.js public/index.html public/style.css
```

If any template fails to render, fix BEFORE shipping. The preview is what the customer sees.

## Related

- [[CHANGELOG]] — every round we shipped, with details (Round O + N are the most recent)
- [[02_CONVENTIONS]] — the rules to follow when fixing or adding things
- [[ROADMAP]] — what comes after the current state
- [[ADR|Decisions]] — the why behind each architectural choice
