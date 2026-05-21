# Handoff Checklist

Single source of truth for what's done vs. what the tech team needs to wire. Updated after each meaningful session.

> **Status key:** ✅ Done · 🟡 Scaffolded, needs config · 🔴 Not started

---

## Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Docker multi-stage build | ✅ | Non-root user `nodejs:1001`, HEALTHCHECK on `/health` |
| docker-compose (app + MySQL) | ✅ | Local dev only |
| CI/CD pipeline | ✅ | `.github/workflows/ci.yml` — install, prisma generate, test, audit |
| GitHub Actions passing | ✅ | 376 tests, 33 suites, all green |
| Branch protection rules | 🟡 | Enable in GitHub Settings: require PR reviews, require `ci` status check, no direct pushes to `main` |
| Production deployment | 🔴 | No public URL yet. Docker image ready — needs a host (Render/Railway/DO) |
| Domain + TLS | 🔴 | Pick a `.in` or `.com`, most hosts handle TLS automatically |

## Auth

| Item | Status | Notes |
|------|--------|-------|
| Auth0 JWT middleware | ✅ | `src/lib/auth.js` — `jsonwebtoken` + `jwks-rsa` with key rotation cache |
| Dev bypass mode | ✅ | When `AUTH0_DOMAIN` unset, returns placeholder admin user |
| Role-encoding session tokens | ✅ | Login returns `base64url(payload).hex_sig` with `{ email, role, ts }` |
| `authenticate()` decodes role | ✅ | Accepts both Auth0 JWTs and role-encoded dummy tokens |
| `requireRole()` middleware | ✅ | Enforces role checks server-side on all protected routes |
| RBAC wired to routes | ✅ | `/api/upload-image`, `/api/upload-logo`, `/api/draft`, `/api/generate` all gated |
| Demo accounts from env vars | ✅ | `DUMMY_ADMIN_EMAIL`, `DUMMY_ADMIN_PASSWORD`, etc. — no hardcoded creds in source |
| Credential chips removed | ✅ | Login page no longer exposes credentials in HTML source |
| Swap DUMMY_USERS for Auth0 | 🟡 | Follow `// HANDOFF` comment in `server.js` above `/api/login` — 5-step recipe |
| Google OAuth routes | 🔴 | Add `/auth/google` + callback routes (recipe in [[deployment#4-swap-the-dummy-login-for-auth0]]) |
| Custom role claim | 🔴 | Auth0/SSO Login Action to set `https://beyondSure.com/role` claim |
| Remove DUMMY_USERS entirely | 🔴 | After Auth0 handler is live |

### Auth0 / SSO activation

The middleware works with **any OIDC provider** (Auth0, Azure AD, Okta, custom SSO). Just set env vars:

```env
# For Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.beyondsite.com

# For custom SSO (same JWKS-based verification)
OIDC_ISSUER=https://sso.yourcompany.com
OIDC_JWKS_URI=https://sso.yourcompany.com/.well-known/jwks.json
OIDC_AUDIENCE=https://api.beyondsite.com
```

**Role assignment:** Add a Login Action that sets the `https://beyondSure.com/role` claim:
```js
// Auth0 Action — sets role based on email
const adminEmails = ['admin1@company.com', 'admin2@company.com'];
const role = adminEmails.includes(event.user.email) ? 'admin' : 'customer';
api.idToken.setCustomClaim('https://beyondSure.com/role', role);
```

## Payments

| Item | Status | Notes |
|------|--------|-------|
| Razorpay scaffold | ✅ | `src/lib/payments.js` — order creation, signature verification, webhook handler |
| Stripe scaffold | ✅ | Commented block in `payments.js`, ready to uncomment |
| Test credentials active | ✅ | `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in `.env` |
| Payment sub-steps UI | ✅ | Pay → Confirmation → Download with mini progress bar |
| Live keys configured | 🔴 | Swap test keys for production keys |
| Webhook registered | 🔴 | Configure in Razorpay dashboard → `POST /api/payments/webhook` |
| `RAZORPAY_WEBHOOK_SECRET` set | 🔴 | Copy from Razorpay dashboard after webhook creation |
| `npm install razorpay` | 🔴 | Run once after pulling the repo |

## Database

| Item | Status | Notes |
|------|--------|-------|
| Prisma schema | ✅ | 6 models: User, Website, Draft, Download, Template, Payment |
| Initial migration | ✅ | `prisma/migrations/20260515000000_init/migration.sql` |
| Seed script | ✅ | `prisma/seed.js` — upserts 14 templates + bootstrap admin |
| Runtime persistence | ✅ | Round M wired Prisma into payments, drafts, downloads, user upserts |
| In-memory fallback | ✅ | All paths work without `DATABASE_URL` for demo/testing |
| Applied to production DB | 🔴 | Run `npm run db:migrate:deploy` + `npm run db:seed` against production MySQL |
| Draft list endpoint | 🔴 | `GET /api/drafts` not yet added (only per-template load exists) |

## Templates

| Item | Status | Notes |
|------|--------|-------|
| 14 templates rendering | ✅ | `node preview-test.js` → 14/14 clean |
| Schema-driven forms | ✅ | JSON schema → form-renderer.js → EJS render |
| AI prompts per section | ✅ | `AI_PROMPTS` map in `server.js`, works on Gemini + Groq |
| Preview modal | ✅ | Hover 1.5s / long-press 600ms, 3 device toggles |
| Template-1 safe-locals refactor | 🔴 | Only template on legacy non-safe-locals pattern |
| Thumbnail CSS rename | 🔴 | `template-heph-prev` / `template-turtlemint-prev` → `template-stratus-prev` / `template-coverwise-prev` |
| Category filter chips | 🔴 | Needed at 18+ templates (currently 14) |
| Template family inheritance | 🔴 | Schema reuse across variants (e.g. Restaurant Modern / Rustic / Fine Dining) |

## Frontend Polish

| Item | Status | Notes |
|------|--------|-------|
| Step wizard | ✅ | Tab-style navigation, scrollable tabs, max-width 640px |
| Step persistence | ✅ | Current step saved in localStorage |
| ZIP externalization | ✅ | `style.css` + `script.js` as separate files in ZIP |
| Required-field validation | ✅ | Red asterisks, shake animation, inline error banner, smooth scroll |
| Dark/light theme | ✅ | `/profile` and `/plans` pages, persisted to localStorage |
| Custom cursor extraction | 🔴 | Inline `<script>` in `index.html` → move to `public/cursor.js` |
| Template picker "Show More" | ✅ | 5 visible, 9 hidden behind animated toggle |
| Razorpay prefill | ✅ | Auto-filled name/email from login state |

## AI & Chatbot

| Item | Status | Notes |
|------|--------|-------|
| Gemini integration | ✅ | `POST /api/ai-section` — Gemini 2.5 Flash |
| Groq fallback | ✅ | 3-retry backoff on Gemini 503, then Groq Llama-3.3-70b |
| Two-layer chatbot | ✅ | Local intent matcher (~9 categories) + Groq for substantive questions |
| Chatbot scope-lock | ✅ | Strict system prompt — only answers about builder flow |
| 4th-layer AI fallback | 🔴 | Canned defaults when both Gemini + Groq fail (~2hr) |

## Observability

| Item | Status | Notes |
|------|--------|-------|
| Winston logging | ✅ | JSON in prod, colorized in dev, pipes to stdout |
| `/health` endpoint | ✅ | Returns status + DB check |
| SIGTERM handler | ✅ | Drains active requests before exit |
| Log aggregator connection | 🔴 | Connect to Datadog / CloudWatch / Loki / Better Stack |
| Prometheus metrics | 🔴 | Add `prom-client`, expose `/metrics` |

## Storage

| Item | Status | Notes |
|------|--------|-------|
| Local disk uploads | ✅ | Default, works out of the box |
| S3-ready abstraction | ✅ | `src/lib/storage.js` — flip `UPLOAD_STORAGE=s3` + `AWS_*` vars |
| S3 configured | 🔴 | Set env vars, create bucket, test upload flow |

## Testing

| Item | Status | Notes |
|------|--------|-------|
| Jest test suite | ✅ | 376 tests, 33 suites |
| Coverage | ✅ | Server routes, payments, auth, storage, database, logger, templates |
| CI test guard | ✅ | `npm test` runs on every push |
| `verifyRazorpaySignature` CI fix | ✅ | Test-only fallback for `RAZORPAY_KEY_SECRET` in CI env |
| E2E tests | 🔴 | No browser automation yet |

## Documentation

| Item | Status | Notes |
|------|--------|-------|
| README | ✅ | Redesigned as learning document |
| DEPLOYMENT.md | ✅ | Moved to [[deployment]] |
| HANDOFF.md | ✅ | This file |
| DEMO.md | ✅ | Conversational walkthrough script |
| SiteMemory vault | ✅ | Obsidian-friendly docs with cross-links |
| ADR log | ✅ | 20+ decisions documented in [[SiteMemory/decisions/ADR]] |
| Changelog | ✅ | Append-only, Round 0 → Round O |

---

## Sign-off

| Reviewer | Status | Date | Notes |
|----------|--------|------|-------|
| Senior review | 🔴 | | |
| Smoke test on production URL | 🔴 | | |
| Auth0 swap verified | 🔴 | | |
| Razorpay live mode verified | 🔴 | | |
| DB migration applied | 🔴 | | |

---

## Related

- [[../../README]] — project overview and quick start
- [[deployment]] — step-by-step deployment guide
- [[DEMO]] — conversational walkthrough for stakeholders
- [[../01_CURRENT_STATE]] — what works right now
- [[../roadmap/ROADMAP]] — what's next
