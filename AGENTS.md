# AGENTS.md — BeyondSite Static Website Generator

> **Read this first:** `CLAUDE.md` has the full architecture, conventions, and template rules. This file is the compact quick-reference for agents who need to avoid common mistakes.

## Boot & env

- **`GEMINI_API_KEY` is required** — server refuses to boot without it. `GROQ_API_KEY` is optional (fallback AI + chatbot).
- `cp .env.example .env` then add at minimum `GEMINI_API_KEY`.
- **No DB needed for UI testing** — app falls back to in-memory mode if `DATABASE_URL` is unset. Drafts/payments are lost on restart.
- Demo accounts (hardcoded in `server.js`, all others rejected):
  - `admin@beyondsite.com` / `admin123` → admin role, bypasses validation + subscription gate
  - `customer@beyondsite.com` / `customer123` → standard customer

## Commands

```bash
# Boot (no DB required)
npm install && npx prisma generate && node server.js   # http://localhost:3000

# Pre-commit verification (run before ANY commit)
node -c server.js
cd templates && node preview-test.js   # must print "14/14 templates rendered cleanly"

# Tests — Windows: npm test may fail due to NODE_ENV=test prefix
npx jest --coverage    # works on Windows; 376 tests passing
# Note: verifyRazorpaySignature tests require RAZORPAY_KEY_SECRET to be set.
#       __tests__/payments-extended.test.js sets a test-only fallback ('test_secret') before loading the module.

# Lint
npm run lint && npm run lint:fix

# DB (requires DATABASE_URL in .env)
npm run db:migrate:deploy   # apply committed migrations
npm run db:seed             # upsert 14 templates + bootstrap admin

# Docker
npm run docker:build && npm run docker:up
```

## Architecture in one line

Single-file Express app (`server.js`, ~823 lines) that reads JSON schemas → renders EJS templates → streams ZIP downloads. `src/lib/` contains integration stubs (auth, payments, DB, storage) with `// HANDOFF:` comments for the production tech team.

## The six-artifact rule (most common agent mistake)

**Every new template requires ALL SIX files in lock-step.** Skip any one and something breaks:

1. `templates/schemas/template-N.json`
2. `templates/website-template-N.ejs` (must use safe-locals pattern)
3. `server.js` — `AI_PROMPTS['template-N']` + append fields to `strKeys`/`arrKeys` in `buildTemplateData()`
4. `templates/preview-test.js` — sample function + `sampleFor()` dispatch + same `strKeys`/`arrKeys` additions
5. `public/index.html` — picker card `<label class="template-box">`
6. `public/style.css` — `.template-{slug}` + `.tp-{slug}-*` CSS

**Copy template-12 (InsurTech) or template-13 (Insurance Market) end-to-end as a starting point.**

## Critical conventions

- **Safe-locals EJS:** every template (except legacy template-1) starts with `const L = locals || {}; const esc = ...; const def = ...;` before `<!DOCTYPE html>`. Never use raw `<%= L.fieldName %>`.
- **strKeys/arrKeys sync:** when adding any field, append it to both `server.js` AND `templates/preview-test.js` arrays. Out of sync = EJS `ReferenceError` on empty submissions.
- **AI prompts:** server-side only in `AI_PROMPTS` object. Must work identically on Gemini AND Groq. End with `Return ONLY JSON: { ... }`.
- **No external assets in templates** except Google Fonts. Output ZIP must be self-contained.

## What's stubbed (don't re-implement)

| Stub | File | Status |
|------|------|--------|
| Auth | `src/lib/auth.js` | Auth0 middleware wired, demo uses `DUMMY_USERS` |
| Payments | `src/lib/payments.js` | Razorpay + Stripe scaffolds committed (commented out) |
| DB | `src/lib/database.js` | Prisma client ready, runtime uses in-memory Maps |
| Storage | `src/lib/storage.js` | Local disk default, S3 swappable via env |

## SiteMemory vault — read order for deep context

1. `SiteMemory/01_CURRENT_STATE.md` — what works / what's broken **right now** (always most up-to-date)
2. `SiteMemory/changelog/CHANGELOG.md` — last ~week of changes at top
3. `SiteMemory/02_CONVENTIONS.md` — full coding rules
4. `SiteMemory/architecture/` — per-feature deep dives
5. `SiteMemory/decisions/ADR.md` — why behind architectural choices

**Do not redo work that's already in the changelog.** When you finish a change: append to `CHANGELOG.md` and update `01_CURRENT_STATE.md`.

## Handoff docs

- `SiteMemory/handoff/HANDOFF.md` — consolidated checklist: what's done vs. what the tech team needs to wire
- `SiteMemory/handoff/DEMO.md` — conversational walkthrough script for stakeholder demos
- `SiteMemory/handoff/deployment.md` — step-by-step production deployment guide

## Known issues

- Template 1 (Editorial) uses legacy non-safe-locals pattern — works but less defensive
- Custom cursor is inline `<script>` in `index.html`, not extracted to `public/cursor.js`
- No AI fallback below Groq — both providers failing = 503
- Thumbnail CSS for template-12/13 still carries old codenames (`template-heph-prev`, `template-turtlemint-prev`)

## Recent features (post-initial release)

- **RBAC server-side enforcement**: `requireRole()` wired to all protected routes (`/api/upload-image`, `/api/upload-logo`, `/api/draft`, `/api/generate`)
- **Role-encoding session tokens**: Login returns `base64url({email,role,ts}).hex_signature` — `authenticate()` extracts role correctly
- **Demo credentials in env vars**: `DUMMY_ADMIN_EMAIL`, `DUMMY_ADMIN_PASSWORD`, etc. — no hardcoded creds in source
- **Payment sub-steps**: Step 3 now has 3 internal sub-steps (Pay → Confirmation → Download) with a mini progress bar
- **Auth token bridge**: HMAC dummy token allows demo mode even when `AUTH0_DOMAIN` is configured
- **Razorpay defensive fixes**: SDK guard, error detail propagation, 8s notifications, repaint delay
- **Step wizard**: Tab-style navigation with scrollable tabs, max-width 640px, AI preservation
- **Step persistence**: Current step saved in localStorage to survive navigation
- **Template picker**: "Show More" toggle with animation (5 visible, 9 hidden)
- **ZIP externalization**: Downloaded ZIP has `style.css` and `script.js` instead of inline code
- **Razorpay prefill**: Auto-filled name/email from login state
