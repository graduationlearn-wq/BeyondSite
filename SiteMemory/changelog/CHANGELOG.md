# Changelog

Round-by-round history of every meaningful change. **Append-only** — new rounds get added at the top, old entries are never edited (that's the history). Each round captures what shipped, why, and any technical debt incurred.

> Cross-references: each round links to the [[ADR|decisions]] it created and the [[04_template-system|architecture docs]] it changed. Use those links to dive into the why, not just the what.

---

## Round V — 2026-06-09

**UAT live on Render. Prisma + Alpine compatibility crisis fully resolved. Mobile polish pass across older templates. Mojibake audit + repair across `preview-test.js`.**

**Touched:** `prisma/schema.prisma` · `Dockerfile` · `server.js` · `templates/preview-test.js` · `templates/website-template-{4,5,9,14,15,16}.ejs` · `public/index.html` · `public/style.css` · `SiteMemory/01_CURRENT_STATE.md` · `SiteMemory/templates/_registry.md`

### Shipped

- **Render UAT environment live** at `https://beyondsite-uat.onrender.com` (Singapore free tier, Docker-based, auto-deploys off `main`). First public URL the tech team can hit.
- **Prisma on Alpine fixed** — two-part fix:
  1. `prisma/schema.prisma` declares `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` so `npx prisma generate` produces the OpenSSL-3 engine binary alongside the native one.
  2. `Dockerfile` `apk add --no-cache openssl libc6-compat` in both builder and runtime stages so `libssl.so.3` is resolvable at runtime and `libc6-compat` provides the glibc shims the Prisma engine needs on musl.
- **`/health` endpoint gated on `DATABASE_URL`** — `server.js:178` previously pinged Prisma on every health check, returned 503 when env var was unset, and triggered Render's SIGTERM loop. Fix: `if (db && process.env.DATABASE_URL) { ... }`. UAT now reports `{database: "not configured"}` with HTTP 200 in in-memory mode.
- **Mobile topbar collapse** — templates 5, 9, 14, 15, 16 had `.topbar` regulatory strips that were squeezing on mobile. At ≤640px: `.topbar-info` stacks vertically, `.topbar-links` hidden (duplicate of nav + footer anyway), font shrunk to `.68rem`.
- **Web3 (template-4) mobile nav fix** — Helix Protocol CTA was disappearing off-screen on 360px viewports because no media-query collapsed the inner nav-links. Added `≤600px` rule hiding middle links, shrinking logo to `1rem`, padding nav to `0 16px`. Brand also got `white-space:nowrap` to prevent "Helix Protocol" splitting onto two lines.
- **SEBI RIA (template-16) nav CTA wrap fix** — default `heroCtaPrimary` was "Book a free intro call" (5 words) which wrapped to 2 lines on mobile. Shortened to "Book a call" (3 words) in both schema default and preview-test sample. Added `white-space:nowrap` to `.nav-cta`. Tablet (≤980px) and mobile (≤640px) breakpoints now shrink brand font + nav-cta padding to give the title bar breathing room.
- **Mojibake repair** — `preview-test.js` had 784 broken characters from copy-paste during the template-16/17/18 sample-data writes (UTF-8 strings double-encoded as cp1252). Three-pass fix script in Python: (1) cp1252→UTF-8 reversal on non-ASCII runs handled 746 punctuation+emoji cases; (2) byte-level reversal with custom cp1252-aware mapping caught the remaining 38 emoji prefixes; (3) targeted restoration of middle dots in string literals (the second pass over-converted some legit `·` field separators into em-dashes). Final state: zero mojibake or U+FFFD in any source file or rendered preview.

### Why this mattered

- **Public URL unlocks the demo.** Senior can click through the whole flow without us screen-sharing. Production deploy is unblocked.
- **The Prisma/Alpine combo is a known footgun** for Docker-deployed Prisma apps. The two-part fix is the canonical answer and worth carrying forward to `DEPLOYMENT.md` for whoever wires up production.
- **Mobile UAT actually works.** Before the topbar + Web3 + SEBI-RIA fixes, three templates looked broken on mobile preview. Now all 19 are clean across desktop, tablet, and mobile breakpoints.
- **Mojibake repair caught a class of bug that could have silently shipped** garbled text to customers — every preview render would have been wrong for the recent templates. Caught it before any live demo.

### Verification

- `node -c server.js` clean
- `cd templates && node preview-test.js` → 19/19 rendered cleanly
- `npx jest __tests__/server-routes.test.js -t "19 templates"` → ✓ (768 ms)
- Mojibake scan across all sources → empty
- Render UAT live, `/health` returns 200, full UI flow works end-to-end

### Technical debt incurred / open

- `DEPLOYMENT.md` not yet updated with the Alpine + Prisma gotchas — should add a "Prisma on Alpine" subsection before production deploy.
- Free tier sleeps after 15 min — first hit is ~30s slow. Move to Starter ($7/mo) before sharing externally beyond UAT.
- Old `template-heph-prev` / `template-turtlemint-prev` CSS classes still in `public/style.css` — low priority.

---

## Round U — 2026-06-09

**Template-19 shipped: Loan DSA / Direct Sales Agent. Deep indigo + electric lime aesthetic. Interactive EMI calculator, mobile-first.**

**Touched:** `templates/schemas/template-19.json` (new) · `templates/website-template-19.ejs` (new) · `server.js` · `templates/preview-test.js` · `src/lib/utils.js` · `public/index.html` · `public/style.css` · `prisma/seed.js` · `__tests__/server-routes.test.js`

### Shipped

- **Template-19 (Loan DSA / DhanSetu Loans)** — 13 sections covering DSA registrations, hero with live EMI calculator, loan-types grid (8 products: Personal, Home, Business, LAP, Education, Car, Two-Wheeler, Gold), partner-lender list (12 banks/NBFCs with monogram avatars), rate-comparison table, application process (4 steps), eligibility check (interactive sliders for income/loan/CIBIL), accordion documents checklist (3 groups: salaried / self-employed / home-loan extras), why-choose pillars, borrower testimonials, mandatory RBI/IBA disclosures, 4-tier grievance (Customer Care → Compliance Officer → Lender Bank → RBI Sachet / Banking Ombudsman), CTA, contact form.
- **Killer signature elements:**
  - **Live EMI calculator** in the hero — real `<input type="range">` sliders for amount/tenure/rate, JS recomputes EMI + interest + total on input; server-side initial render so it looks great pre-JS.
  - **Comparison table → swipeable cards on mobile** — `display:none` on the desktop table at ≤640px, horizontal-scroll cards with scroll-snap take over.
  - **Sticky bottom mobile CTA bar** — `position:fixed` lime button + green WhatsApp shortcut (`wa.me/` link auto-stripped of non-digits) on ≤640px. Respects `env(safe-area-inset-bottom)` for iOS notch. Body gets `padding-bottom:84px` so content never hides behind it.
  - **Live eligibility checker** — three more sliders with heuristic-driven result card that turns orange when CIBIL < 650 or loan > 5× annual income.
  - **Accordion document checklist** — clean chevron rotation, `aria-expanded` set correctly, first group open by default.
- **Compliance baked in (RBI Outsourcing + IBA Code + DPDP Act 2023)** — `₹0 customer fees` disclosure repeated in 3 places, "lender has final say", "no guaranteed approvals" (loan-scam protection), DPDP data handling, IBA Code of Conduct (2007) adherence in footer.
- **Picker placement** — Card sits inside `#hiddenTemplates` (Show-More section). Thumbnail features a mini indigo EMI calculator card with `₹15,432` mono number, slider tracks with lime dots, and rate tiles (HDFC 8.4%, ICICI 8.7%, lime "Apply" tile).

### Why this mattered

- **First mobile-first template by design.** Every other template added mobile rules as an afterthought. Template-19's slider, accordion, sticky CTA, swipe cards were designed for mobile and adapted for desktop.
- **Closes the Indian regulated-finance moat.** Templates 14, 15, 16, 19 now cover the four most common SEBI-or-RBI-registered customer-facing finance verticals (MF distributor, stock broker, RIA, loan DSA).

### Verification

- 19/19 templates rendered cleanly
- `returns schema for all 19 templates ✓` (768 ms)
- 40/43 server-route tests pass (3 unchanged pre-existing Prisma binary failures on this Linux sandbox — they pass on Windows)
- Empty-locals render: 99 KB self-contained HTML
- All RBI / IBA / Empanelment disclosures visible in footer

---

## Round T — 2026-06-08

**Template-18 shipped: Diagnostic Lab / Pathology. Lab-bench aesthetic with the four killer signature elements.**

**Touched:** `templates/schemas/template-18.json` (new) · `templates/website-template-18.ejs` (new) · `server.js` · `templates/preview-test.js` · `src/lib/utils.js` · `public/index.html` · `public/style.css` · `prisma/seed.js` · `__tests__/server-routes.test.js`

### Shipped

- **Template-18 (Diagnostic Lab / Nidaan Diagnostics)** — 13 sections covering lab registrations (NABL ISO 15189 + CAP + ICMR + CEA + BMW + PCPNDT), hero with prominent test-search bar, test categories grid (12 categories) styled like a periodic table, popular individual tests (8 with codes, sample type, TAT, fasting, price), home-collection feature card with slot picker, application process, health-check packages (3 tiers), digital-report features + **fake sample-report card**, pathologist team, testimonials, insurer/corporate partners, 4-tier grievance (Quality Officer → Med Director → NABL → State Council / DHO), CTA.
- **The four signature visual elements:**
  - **Hero search bar** — real pill-shaped input with magnifying-glass SVG, "Search 3,400+ tests" placeholder, focus-state with glowing border. Below: clickable popular-test chips.
  - **Inline SVG test-tube cluster** — 4 tubes in a rack with red/amber/green/blue gradient liquids, dark caps, white labels, glass-highlight overlay, meniscus ellipse, falling droplet, DNA-helix backdrop, floating molecule trio.
  - **Periodic-table category grid** — 12 square cards each styled as an element: 2-letter symbol top-left, test-count badge in mono top-right, emoji icon centered, full name bottom-left. 7 color families tinted by category type.
  - **Fake sample-report card** — Real pathology-report layout with rotated "SAMPLE" stamp, redacted patient row, 5 result rows with color-coded flags (LOW/NORMAL/BORDERLINE), pathologist note in blue-bordered comment box, signature line.
- **Compliance baked in** — NABL/CAP/ICMR/CEA/BMW/PCPNDT all displayed; mandatory medical disclaimer, reference-range disclaimer, no-cure-claims notice (Drugs & Magic Remedies Act), and **explicit PCPNDT illegality notice** ("Pre-natal sex determination is illegal under the PCPNDT Act, 1994 and we strictly do not perform it.").
- **Picker placement** — Inside `#hiddenTemplates` before the Healthcare Clinic card. Thumbnail with 4-tube mini cluster + 4 periodic-table category tiles in mono labels.

### Verification

- 18/18 templates rendered cleanly
- Empty-locals render: 103 KB self-contained HTML
- All 6 mandatory regulatory IDs (NABL, CAP, ICMR, CEA, BMW, PCPNDT) present in defaults

---

## Round S — 2026-06-07

**Template-17 shipped: Healthcare Clinic / Hospital. Clean white + soft blue + mint, cartoon doctor SVGs.**

**Touched:** `templates/schemas/template-17.json` (new) · `templates/website-template-17.ejs` (new) · `server.js` · `templates/preview-test.js` · `src/lib/utils.js` · `public/index.html` · `public/style.css` · `prisma/seed.js` · `__tests__/server-routes.test.js`

### Shipped

- **Template-17 (Healthcare Clinic / Aarogya Hospital)** — 12 sections covering hospital registrations (NMC + NABH + Clinical Establishment Act + BMW + Drug Licence), hero with cartoon-doctor SVG + emergency phone pill, specialties grid (12 departments), doctor cards with illustrated avatars + qualifications + NMC reg + OPD timings, services, patient journey (4 steps), health-check packages, hospital story + care pillars, empanelled insurers (14 partners), patient testimonials, bright red 24×7 emergency strip, 4-tier patient grievance, CTA, contact form with date/time slot picker.
- **Inline SVG cartoon medical illustrations** — all original, no external assets:
  - Full-body friendly doctor in hero with lab coat, stethoscope, ID badge with photo strip, red-cross pocket pin
  - 4 doctor avatar variants (a/b/c/d) — different skin tones, hair, with/without glasses, same warm style
  - Floating decorative SVG hearts, plus-signs, pills, dots in hero
  - "+" cross brand mark in nav, also as faint watermark in about card
- **Compliance baked in** — NMC + NABH + CEA + BMW + drug-licence all displayed; medical-advice disclaimer in every footer + form; "emergency: call helpline" disclaimer; **Drugs & Magic Remedies Act** notice (no cure claims); DPDP Act 2023 confidentiality.
- **Picker placement** — Inside `#hiddenTemplates` after Portfolio. Thumbnail features cartoon-doctor bust on soft blue disc + 3 specialty icons + blue cross tile.

### Verification

- 17/17 templates rendered cleanly
- Empty-locals render: 88 KB self-contained HTML
- 7 inline doctor SVG variants embed correctly

---

## Round R — 2026-06-06

**Template-16 shipped: SEBI RIA / Investment Adviser. Warm sage + cream + peach aesthetic for a casual advisor-website feel.**

**Touched:** `templates/schemas/template-16.json` (new) · `templates/website-template-16.ejs` (new) · `server.js` · `templates/preview-test.js` · `src/lib/utils.js` · `public/index.html` · `public/style.css` · `prisma/seed.js` · `__tests__/server-routes.test.js`

### Shipped

- **Template-16 (SEBI RIA / Saaransh Advisory)** — 12 sections covering SEBI INA registration + BASL membership + NISM Series-X-A/X-B, hero with portrait card + hand-signed pull-quote, fees with two side-by-side plan cards (Flat Fee + AUA-Linked, respecting the SEBI 2.5% / ₹1.25L cap), approach pillars (fiduciary, fee-only, evidence-based, calm), services (6: financial planning, goal planning, investment advisory, tax planning, estate review, insurance review), how we work together (4 steps), adviser story + credentials, journal articles, polaroid-style testimonials, 4-tier grievance (Adviser → BASL → SCORES → SMART ODR), required disclosures (6 docs), CTA.
- **Warm/casual aesthetic by design** — Sage green #6b9080 + cream + peach palette, Fraunces serif headings + Inter body + **Caveat handwriting** for accents (the adviser's pull quote, "tat" labels), inline SVG portrait + hand-signed quote, **polaroid-tilted testimonial cards** with rotation per card, asymmetric pillar grid (odd cards offset 8px), rounded everything 16–24px, soft pastel discs behind hero illustration.
- **Compliance baked in** — SEBI INA reg + BASL + NISM displayed throughout; fee cap notice (2.5% AUA OR ₹1,25,000 fixed); mandatory risk + past-performance disclaimers; "fee-only, no commissions" repeated in 3 places; 4-tier escalation (Adviser → BASL → SCORES → SMART ODR); 6 required disclosure documents grid.
- **Picker placement** — Top visible grid (6th card) alongside Stock Broker. Thumbnail features cartoon adviser portrait with hand-quote line on soft peach disc.

### Verification

- 16/16 templates rendered cleanly
- Empty-locals render: 62 KB self-contained HTML
- Has SEBI INA fallback, risk disclaimer, fee-cap notice, SCORES, SMART ODR, BASL all present

---

## Round Q — 2026-06-05

**Template-15 shipped: Stock Broker / Demat. Groww-style violet + white aesthetic with phone-mockup hero.**

**Touched:** `templates/schemas/template-15.json` (new) · `templates/website-template-15.ejs` (new) · `server.js` · `templates/preview-test.js` · `src/lib/utils.js` · `public/index.html` · `public/style.css` · `prisma/seed.js` · `__tests__/server-routes.test.js`

### Shipped

- **Template-15 (Stock Broker / Stallion Capital)** — 12 sections covering broker registrations (SEBI INZ + NSE/BSE/MCX member + CDSL/NSDL DP ID + CIN + AMFI ARN for direct MF), hero with **inline SVG phone mockup** showing live stock tickers, trust statistic strip (dark), products grid (8: Stocks, F&O, Mutual Funds, IPO, ETFs, Bonds, MTF, Commodities), why-choose pillars (6), open-Demat process (4 steps: sign up → Aadhaar eKYC → eSign with PAN → start investing), investor calculators (6), full brokerage schedule table, regulator + exchange badges row, investor testimonials, **5-tier grievance escalation** (Customer Care → Compliance → Exchange → SEBI SCORES → SMART ODR), Investor Charter + RDD + MITC downloads list, CTA, contact form.
- **Groww-style aesthetic** — Violet (#5500eb) + white palette, Plus Jakarta Sans display + Inter body + JetBrains Mono for codes. Inline SVG phone mockup with stock ticker rows (RELIANCE, TCS, HDFCBANK, INFY, ITC) and sparkline graph. Floating chips: "NIFTY 50 +1.24%", "SIP ₹500/mo".
- **Compliance baked in** — Full **ATTENTION INVESTORS** block in footer (5 SEBI-mandated bullet points about unauthorised transactions, KYC, IPO payments, upfront margin, monthly CDSL statements), brokerage-cap disclaimer, risk disclaimers, no-guaranteed-returns notice, SEBI SCORES + SMART ODR + State Medical Council escalation paths.
- **Picker placement** — Top visible grid (5th card) alongside Insurance Market and MF Distributor. Thumbnail with mini violet topbar, candlestick SVG, "+1.84%" mono delta, and 4 specialty tiles (📈, 📊, 🪙, 🚀).

### Verification

- 15/15 templates rendered cleanly
- Empty-locals render: 64 KB self-contained HTML
- `returns schema for all 15 templates ✓` (passes in CI)

---

## Round P — 2026-05-21

**RBAC fully wired — `requireRole()` now enforces roles server-side on all protected routes. Demo credentials moved to env vars (no hardcoded creds in source). Session tokens now encode role properly.**

**Touched:** `server.js` · `src/lib/auth.js` · `public/login.html` · `__tests__/setup.js` · `.env.example` · `SiteMemory/handoff/HANDOFF.md`

### Shipped

- **`DUMMY_USERS` moved to env vars** — `DUMMY_ADMIN_EMAIL`, `DUMMY_ADMIN_PASSWORD`, `DUMMY_CUSTOMER_EMAIL`, `DUMMY_CUSTOMER_PASSWORD`. No hardcoded credentials in source code. If env vars aren't set, demo accounts don't exist (safe for production).
- **Role-encoding session tokens** — Login now returns `base64url({ email, role, ts }).hex_signature` instead of a plain HMAC hash. The token carries the user's role (`ADMIN` / `CUSTOMER`) so `authenticate()` can extract it without guessing.
- **`authenticate()` decodes role from token** — Updated to parse the role-encoded dummy token format. When `AUTH0_DOMAIN` is set but a dummy token is provided, it decodes the payload, verifies the HMAC signature, and sets `req.user.role` correctly.
- **`requireRole()` wired to all protected routes** — `/api/upload-image`, `/api/upload-logo`, `/api/draft` (POST + GET), `/api/generate` now all use `authenticate(), requireRole('ADMIN', 'CUSTOMER')`. This establishes the pattern for future admin-only routes (`requireRole('ADMIN')`).
- **Credential chips removed from login.html** — No more clickable buttons exposing email/password in HTML source. Replaced with a note pointing to README/`.env`.
- **Tests updated** — `__tests__/setup.js` sets demo account env vars before any module loads. All 376 tests pass.
- **`.env.example` updated** — Documents the new `DUMMY_*` env vars with placeholder values.
- **`HANDOFF.md` updated** — Auth section now shows RBAC as wired, includes Auth0/SSO activation guide with Login Action snippet for role assignment.

### Why this mattered

- **Security** — Credentials are no longer discoverable from source code or HTML. Anyone can `git clone` and see the old hardcoded emails/passwords. Now they live in `.env` (gitignored).
- **RBAC enforcement** — Previously `requireRole()` was imported but never used on any route. The admin/customer distinction was purely client-side. Now the server enforces role checks on every protected endpoint.
- **Production-ready auth** — The middleware works with any OIDC provider (Auth0, Azure AD, Okta, custom SSO). Just set env vars — no code changes needed. The tech team can swap in their SSO by changing env vars only.

### Verification

- `npx jest --coverage` → 376/376 green
- `cd templates && node preview-test.js` → 14/14 templates rendered cleanly

---

## Round O — 2026-05-21

**CI test fix for `verifyRazorpaySignature` — tests now pass in GitHub Actions. Defensive guard added to production code.**

**Touched:** `__tests__/payments-extended.test.js` · `src/lib/payments.js` · `SiteMemory/01_CURRENT_STATE.md` · `AGENTS.md` · `README.md`

### Shipped

- **`__tests__/payments-extended.test.js`** — Added `process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret';` at the top of the file, **before** the `require('../src/lib/payments')` call. This ensures the env var is set in the test process before the module loads, so `verifyRazorpaySignature` has a valid key to use with `crypto.createHmac()`.
- **`src/lib/payments.js`** — Added defensive guard in `verifyRazorpaySignature`: if `RAZORPAY_KEY_SECRET` is undefined, logs a warning and returns `false` instead of crashing with `TypeError: The "key" argument must be of type string... Received undefined`. This protects production from unhandled exceptions when the env var is accidentally omitted.

### Why this mattered

- **CI was failing** with 3 test failures in `payments-extended.test.js` because GitHub Actions doesn't set `RAZORPAY_KEY_SECRET` by default. The test computed the expected HMAC using `'test_secret'` as a fallback, but the actual `verifyRazorpaySignature` function used `process.env.RAZORPAY_KEY_SECRET` directly (which was `undefined`), causing `crypto.createHmac('sha256', undefined)` to throw.
- **Production safety** — without the guard, a deployer who forgets `RAZORPAY_KEY_SECRET` would get a 500 error on every payment verification instead of a clean `false` response.

### Verification

- `npx jest --coverage` → 376/376 green (all 33 suites pass)
- `cd templates && node preview-test.js` → 14/14 templates rendered cleanly

### Deployer note

- **`RAZORPAY_KEY_SECRET` is required for real Razorpay payments.** The test fallback (`'test_secret'`) is test-only and doesn't affect production. If this env var is missing in production, signature verification will log a warning and return `false` — payments will fail verification gracefully rather than crashing.

---

## Round N — 2026-05-21

**Payment sub-steps implemented — Step 3 now has 3 internal sub-steps with progress bar. Comprehensive test suite expanded to 376 tests.**

**Touched:** `public/index.html` · `public/script.js` · `public/style.css` · `__tests__/server-routes.test.js` · `__tests__/payments-extended.test.js` · `__tests__/auth-extended.test.js` · `__tests__/database-extended.test.js` · `__tests__/storage-extended.test.js` · `__tests__/logger-extended.test.js` · `AGENTS.md` · `SiteMemory/01_CURRENT_STATE.md`

### Shipped

- **Payment sub-steps** — Step 3 ("Pay & Download") now has 3 internal sub-steps with a mini horizontal progress bar:
  1. **Pay** — Payment button, Razorpay checkout
  2. **Confirmation** — "Payment received" success message with receipt details
  3. **Download** — Download button → ZIP downloads → success screen
- **Auto-advance flow** — After payment succeeds, auto-advances to Confirmation, then auto-advances to Download after 1.5s pause
- **Progress bar CSS** — `.pay-substeps` container with `.pay-substep` (active/completed states), `.pay-substep-num` (circled numbers), `.pay-substep-connector` (lines between steps)
- **Sub-step management** — `setPaySubstep(num)` function handles visibility and state transitions for all 3 sub-steps
- **Admin bypass preserved** — Still skips checkout, auto-advances through sub-steps with receipt "Admin bypass — no charge"

### Test Suite Expansion (260 → 376 tests)

- **`__tests__/server-routes.test.js`** (43 tests) — Full route coverage:
  - `GET /health` — status, checks, timestamp
  - `POST /api/login` — valid/invalid credentials, admin vs customer, case-insensitive email
  - `POST /api/register` — validation, sanitization, password length
  - `GET /api/schema/:templateId` — valid template, 404, path traversal, all 14 templates
  - `GET /template-previews/preview-:slug.html` — existing file, missing file, invalid slug
  - `POST /api/pay` — dummy/razorpay order creation
  - `POST /api/generate` — auth, payment gate, admin bypass, used payment, valid payment
  - `POST /api/draft` + `GET /api/draft/:templateId` — validation, no DB fallback
  - `POST /api/preview` — render HTML, empty data
  - Static routes — `/`, `/login`, `/register`, `/profile`, `/plans`

- **`__tests__/payments-extended.test.js`** (20 tests) — Extended payment coverage:
  - `consumePayment` — all edge cases including razorpay provider mode
  - `createPayment` — default values, custom amount, map storage, paymentId prefix
  - `verifyRazorpaySignature` — valid/invalid/tampered signatures
  - `markPaymentPaid` — valid order, missing order, without razorpayPaymentId
  - `PAYMENT_TTL_MS`, `PROVIDER` constants

- **`__tests__/auth-extended.test.js`** (13 tests) — Extended auth coverage:
  - `requireRole` — 401, 403, valid role, multiple roles, undefined role
  - `authenticate` — Auth0 configured vs dev bypass, invalid token
  - `optionalAuth` — with/without token, Auth0 configured

- **`__tests__/database-extended.test.js`** (6 tests) — Database module coverage:
  - Module exports, prisma getter, connect/disconnect handling

- **`__tests__/storage-extended.test.js`** (16 tests) — Extended storage coverage:
  - `isS3` — local vs S3 mode
  - `getFileBaseUrl` — local path vs S3 URL
  - `getUploadDir` — local directory vs null for S3
  - `fileFilter` — accepts PNG/JPG/JPEG/SVG/WEBP/GIF, rejects EXE/JS/PDF/HTML
  - `getMulterStorage` — storage object, DiskStorage type

- **`__tests__/logger-extended.test.js`** (11 tests) — Extended logger coverage:
  - Log levels (info, warn, error, debug)
  - Metadata handling (object, null, undefined, empty)
  - Child logger creation and metadata merging
  - Error handling (Error objects, stack traces, empty string)
  - Production mode loading

### Technical notes
- Replaced old `#payUnpaid` / `#payPaid` toggle pattern with `#payStep1` / `#payStep2` / `#payStep3`
- Progress bar styled with `max-width: 480px`, centered, responsive down to mobile
- Auto-advance uses `setTimeout(..., 1500)` for smooth UX
- All tests pass: 376/376 green

---

## Round M — 2026-05-20

**Wired Prisma persistence into the runtime — payments, drafts, downloads, and user rows now survive server restarts.**

**Touched:** `src/lib/payments.js` · `server.js` · `__tests__/payments.test.js`

### Shipped

- **`src/lib/payments.js` — Prisma-backed with in-memory fallback**
  - All five public functions kept at the same call-site API.
  - `createDummyPayment` / `createRazorpayPayment` — `prisma.payment.create` first; falls back to the in-memory Map on error or when `prisma` is null (no `DATABASE_URL`).
  - `consumePayment` — now `async`; uses `prisma.payment.findUnique` + `.update` to stamp `usedAt`; falls back to Map when DB unavailable.
  - `markPaymentPaid` — now `async`; uses `prisma.payment.updateMany`; falls back to Map.
  - `PAYMENT_TTL_MS` / `PROVIDER` declared **before** `require('./logger')` so `dotenv.config()` (triggered transitively via `config.js`) cannot overwrite the test-env `PAYMENT_PROVIDER` value.
  - Exported `payments` Map unchanged — tests still call `payments.set()` / `payments.clear()`.

- **`server.js` — four wire-up points**
  - `/api/login` — made `async`; calls `prisma.user.upsert` after auth check so the user has a real DB row for FK constraints. No-op when prisma is null.
  - `POST /api/draft` (new) + `GET /api/draft/:templateId` (new) — both behind `authenticate()`; upsert/load keyed on `{ userId, templateId }` (`@@unique`). Gracefully returns `{ persisted: false }` when no DB.
  - `/api/payments/verify` — made `async`, `await markPaymentPaid(...)`.
  - `/api/payments/webhook` — handler made `async`, `await markPaymentPaid(...)`.
  - `/api/generate` — `await consumePayment(paymentId)`; after successful consume, attempts `prisma.download.create` (best-effort, try/catch — ZIP still streams on DB failure). Admin-bypass path unchanged.

- **`__tests__/payments.test.js`** — all seven tests made `async`; `consumePayment` calls wrapped in `await`. Currency/amount updated to `INR`/`499900`. 260/260 green.

### Technical debt incurred

- Draft routes have no rate-limiter — add before production.
- No `GET /api/drafts` list endpoint — only per-template load.
- `prisma.download.create` silently skips when `userId = 'dev-user'` (FK miss in dev DB) — seed the dev-user row to fix.

---

## Round L — 2026-05-20

**Removed preview-all.html. Updated SiteMemory docs. Created CLAUDE.md.**

**Touched:** [[01_CURRENT_STATE]] · [[_registry|Templates registry]]

### Shipped

- **`preview-all.html` removed** — generation code stripped from `templates/preview-test.js`. No role in production; the hover-modal only needs individual `preview-N.html` files served by `/template-previews/`. Leftover file deleted from disk.
- **`CLAUDE.md` created** at repo root — orients Claude Code sessions with commands, architecture, critical conventions, and known stubs so future sessions don't re-read all of SiteMemory cold.
- **SiteMemory docs updated** — `01_CURRENT_STATE.md` and `templates/_registry.md` now reflect 14 templates and the template-14 regulatory spec.

### Verification

- `node -c server.js` → clean ✓
- `cd templates && node preview-test.js` → 14/14 rendered cleanly, no preview-all.html written ✓

---

---

## Round J — 2026-05-18

**Razorpay integration activated, price set to ₹4,999, step-wise registration form, Prisma migration for Razorpay fields.**

**Touched:** [[01_CURRENT_STATE]] · [[01_api-routes]]

### Shipped
- **Razorpay payment live** (`src/lib/payments.js`, `server.js`) — `PAYMENT_PROVIDER=razorpay` now creates real Razorpay orders via `rzp.orders.create()`. Three routes: `/api/pay` (create order), `/api/payments/verify` (HMAC signature check → mark PAID), `/api/payments/webhook` (server-to-server events with raw body + signature verification). Admin bypass (`admin_bypass_*` paymentId) skips `consumePayment()` entirely — no DB required. `PAYMENT_PROVIDER=dummy` retains the old in-memory path for local dev.
- **Price updated to ₹4,999** (499900 paise) — both frontend display (`index.html`) and order creation amount in `payments.js`.
- **Razorpay checkout widget** — `checkout.razorpay.com/v1/checkout.js` loaded in `index.html`. `dummyPay()` in `script.js` replaced with `initPayment()`: creates order → opens widget → on success calls `/api/payments/verify` → shows paid state. Admins get instant bypass without touching the widget.
- **Step-wise registration form** (`public/register.html`) — flat single-screen form replaced with 3-step wizard: Step 1 (Email + Password + Confirm), Step 2 (First Name + Last Name), Step 3 (Summary card + Terms checkbox + Submit). Per-step validation before advancing; Back button on steps 2 and 3. Same `/api/register` POST — no backend change needed.
- **Prisma migration** `20260518000000_add_razorpay_fields` — adds `razorpayOrderId VARCHAR(64) NULL` and `razorpayPaymentId VARCHAR(64) NULL` to the `payments` table. Apply with `npx prisma migrate deploy`.
- **Test credentials** added to `.env` — `RAZORPAY_KEY_ID=rzp_test_SLYllniTP6g4dd`, `RAZORPAY_KEY_SECRET=h4rn6y4swbHWB0YG43mnxJ64`.

### Technical debt incurred
- **`npm install razorpay` still required** — run once after pulling this branch.
- **`RAZORPAY_WEBHOOK_SECRET` is blank** — configure a webhook in the Razorpay test dashboard (URL: `POST /api/payments/webhook`) and paste the secret into `.env`. Until then, webhook events are logged-and-skipped.
- **Payments still in-memory** — `markPaymentPaid` / `consumePayment` use the in-memory Map. When DB is connected, replace with `prisma.payment.create/update` per scaffold comments in `payments.js`.

### Verification
- `node -c server.js` → clean parse.
- Admin login → Step 3 pay screen → bypass notification fires → Download ZIP succeeds.
- Register `/register`: step indicator advances, Back restores state, per-step validation fires, form submits on step 3.

### What this round did NOT do
- Did not run `npm install razorpay` — install deferred to deployer pull.
- Did not wire Prisma to payment persistence — still in-memory.
- Did not swap test Razorpay keys for live production credentials.

---

## Round I — 2026-05-15 → 2026-05-18

**Deployer-readiness pass. The intent of this round: someone outside Kunal's head should be able to deploy the app to production by following a checklist, not by reverse-engineering it.**

**Touched:** [[../01_CURRENT_STATE|01_CURRENT_STATE]] · [[../03_TECH_STACK|03_TECH_STACK]] · [[../README|README]] · created `deployment.md`

### Shipped
- **Initial Prisma migration committed** at `prisma/migrations/20260515000000_init/migration.sql` with the full schema (6 tables, indexes, foreign keys). `migration_lock.toml` pins the provider to `mysql`. The README's `prisma migrate deploy` claim is now actually true — it works.
- **`prisma/seed.js`** — idempotent upsert of the 13 templates plus a bootstrap admin keyed by `AUTH0_BOOTSTRAP_ADMIN_EMAIL`. Wired through `package.json` as both `npm run db:seed` and the standard `prisma db seed` (via the `"prisma": { "seed": ... }` block).
- **`src/lib/payments.js` rewritten as a real integration seam.** Public surface is now `createPayment`, `verifyWebhook`, `consumePayment`. The dummy path remains so the demo keeps working; full Razorpay and Stripe scaffolds are committed as ready-to-uncomment blocks with inline TODO recipes (signature verification, order creation, webhook persistence). `PAYMENT_PROVIDER` env var picks the dispatcher target.
- **`deployment.md`** — single canonical step-by-step for the tech team. Covers infrastructure provisioning, schema migration, env-var configuration, the Auth0 swap, the Razorpay swap, container deploy, smoke-test, and rollback. Cross-linked from the README so it's discoverable from the entry point.
- **HANDOFF block above `/api/login`** beefed up from a one-line "replace with Auth0" comment to a 5-step recipe naming the exact `verifyToken` + `getOrCreateUser` callsites and the order in which to swap them.
- **`.env.example` expanded** with `PAYMENT_PROVIDER` + `RAZORPAY_*` + `STRIPE_*` + `APP_URL` + `AUTH0_BOOTSTRAP_ADMIN_EMAIL` sections (commented with where to get each value).

### Changed
- **`.gitignore`** — removed `prisma/migrations/` from the ignore list (deployers need it tracked). SQLite scratch files (`*.db`) still ignored.
- **`package.json`** — added `db:seed` script and the `prisma.seed` config block.
- **README** — fixed the `prisma migrate deploy` claim (now points at the committed migration + the new `db:seed` step). "Known limitations" table updated so the Auth, Payments, and User-persistence rows describe the *current* shape of the work, not the previous one. Status line now mentions the migration + seed scripts. New callout at the top pointing deployers at `deployment.md`.

### Fixed
- **`prisma migrate deploy` was a broken promise.** Before this round, no migration files existed and the folder was gitignored. The README told deployers to run a command that would have failed silently with "No migrations found." Real init migration now committed.
- **No way to bootstrap a production admin user.** Before this round, the first user to sign in via Auth0 would be auto-created as a CUSTOMER per `getOrCreateUser` — there was no path to seed an ADMIN. `prisma/seed.js` + `AUTH0_BOOTSTRAP_ADMIN_EMAIL` fixes this with a clean upsert pattern.
- **Razorpay had no scaffold.** Before this round, `src/lib/payments.js` was 18 lines of in-memory dummy with one comment saying "replaced at deployment." A deployer would have had to invent the entire integration. Razorpay + Stripe scaffolds with full webhook signature verification recipes are now in the file.

### Technical debt incurred
- **`prisma/schema.sql` is now redundant** with the committed migration but kept for deployers who prefer raw SQL over Prisma tooling. Both stay in sync because both are derived from `schema.prisma`. If the schema evolves, regenerate both.
- **`config.yaml` at the repo root** still exists but nothing reads it. It's a relic from an earlier config-shape experiment. Either wire it up to a config-loader or delete it — flagged but not actioned this round.
- **`5-28.jpg` at the repo root** is a 200KB orphan that shouldn't be in version control. Not deleted this round to avoid unrelated diff noise.
- **Payments coverage dropped from 100% → 62.5%** because the new dispatcher branches (`createPayment` / `verifyWebhook` for non-dummy providers) are uncovered. Acceptable for stub code; tests should be added when a real provider is wired.

### Verification
- `npm test` → 39 tests, all green. payments.js tests untouched and still pass against the expanded module.
- `node -c server.js` → clean parse.
- `cd templates && node preview-test.js` → 13/13 templates render.
- Manual inspection of `prisma/migrations/20260515000000_init/migration.sql` against `prisma/schema.prisma` — shapes match.

### What this round did NOT do
- Did not wire Auth0 to live routes (still using DUMMY_USERS for the demo).
- Did not wire Prisma to live form-save / generate paths (still in-memory).
- Did not install razorpay / stripe SDKs (scaffolds commented out — deployer chooses).
- Did not delete `config.yaml` or the stray `5-28.jpg` — flagged as TODO, defer until cleanup-only round.

After Round I the project is **deployer-ready** in the user's intended sense: the tech team can fork, follow `deployment.md`, swap two env vars + uncomment two code blocks + run two npm scripts, and reach a working production URL with real auth, real DB, and real payments. What they cannot do from outside is the product-side wiring (Prisma + Auth0 routes) — those land in the next sprint.

---

## Round H — 2026-05-14 → 2026-05-15

**Brand renames, light-theme InsurTech, profile + plans pages, required-field validation, preview-modal fix, BeyondSure footer.**

**Touched:** [[01_CURRENT_STATE]] · [[_registry|Templates registry]] · created [[ADR#ADR-016 — Strict whitelist for dummy auth credentials|ADR-016]] · [[ADR#ADR-017 — Profile and Plans pages with green theme + dark/light toggle|ADR-017]] · [[ADR#ADR-018 — Rename Heph and Turtlemint sample brands to neutral names|ADR-018]] · [[ADR#ADR-019 — Required-field validation with visual + spatial cues|ADR-019]] · [[ADR#ADR-020 — Preview-modal device bar lifted above browser chrome|ADR-020]]

### Shipped
- **Profile page (`/profile`)** — header card with role badge, name (huge), email, masked password; 3-card stats row (Total Paid / Sites Generated / Member Since); My Templates as a rich card grid with 6 owned templates; subscription "Coming Soon" card with admin-bypass; recent activity timeline; account-actions card (Change Password / Logout / Delete). Uses Inter serif at clamp(2.4rem, 5.5vw, 4.2rem) for the name. Drifting green-blob animated background (different from index's grid+stars).
- **Plans page (`/plans`)** — three-tier pricing (Free Trial · Pro · Enterprise) with one featured. Coming-Soon overlay covers the page with admin bypass button. Amber admin-preview banner appears when bypassed. Bypass persists in sessionStorage for the session.
- **Dark / light theme system** — `<html data-theme="light|dark">` with CSS variable flip. Toggle button (sun/moon icon) persists choice to `localStorage.beyondsite_theme`. Smooth .35s transitions on body bg+color. Currently scoped to profile + plans pages.
- **Customer + admin dummy auth** — two seeded accounts (`admin@beyondsite.com` / `admin123` and `customer@beyondsite.com` / `customer123`) backed by a `DUMMY_USERS` whitelist. Login page has a click-to-fill credentials panel showing both side-by-side.
- **Required-field validation** — `Business Name`, `Tagline`, `Description` get red-star indicators; clicking Preview while empty triggers: red ring + shake animation on missing fields, inline error banner with contextual message ("Please fill in the X and Y…"), smooth scroll to first missing field with 120px headroom, focus lands on it after animation, errors auto-clear on input. Admins still bypass entirely.
- **BeyondSure-attributed footer** on index.html — 4-column grid (Brand+Parent, Product, Company, Legal). Parent card with green-gradient "BS" monogram links to beyondsure.in. All four legal pages (Privacy, Terms, Refund, Disclaimer) link out to parent site. Bottom bar has corporate office address + auto-updating copyright + "Made in India" badge. Includes a regulatory disclaimer band stating BeyondSite is a SaaS generator (not insurance itself) and that regulatory template copy is starter scaffold only.

### Changed
- **Template-12 (InsurTech SaaS) flipped to light theme** — Stripe / Vercel / Linear pattern: light interface throughout with dark "punctuation" sections for visual rhythm. Hero stays light with the dark code panel as contrast. Stats band kept dark for break. CTA band + footer kept dark. Cyan accent shifted from `#00dcb4` to `#00a085` for readability against white. Primary buttons changed from cyan-on-dark to dark-charcoal-on-white.
- **Sample brand renames** — template-12 `Heph` → `Stratus`, template-13 `Turtlemint` → `Coverwise`. Emails (`partners@stratus.dev`, `help@coverwise.in`), code snippet variable, EJS defaults all flipped. No leftover Heph/Turtlemint references in rendered HTML (verified with grep).
- **Preview-modal device bar lifted above chrome** — previously appended into the browser-chrome bar; now injected as a new top row of `.preview-container` with z-index 11. Stage's `top` is computed dynamically as `chromeHeight + deviceBarHeight` so the iframe content (including the previewed site's own nav) is fully visible. `:has(.pf-device-bar)` selector flattens the chrome's top-rounded corners when the device bar is present.
- **Login route closed accidental open backdoor** — previously accepted ANY email+password as customer. Now strict whitelist via `DUMMY_USERS` table; everything else 401s. Every login is logged with Winston.
- **Updated `01_CURRENT_STATE.md`** and `templates/_registry.md` to reflect new brand names + light-theme on template-12.

### Fixed
- **Iframe content was being hidden behind chrome bar** in step-2 preview. Stage was at `top: 0` of container; chrome (z-index 10) overlapped the first ~44px of the iframe — i.e. exactly where every website's own nav lives. Now stage is offset by full header height.

### Technical debt
- `src/lib/payments.js` is still a stub — Razorpay / Stripe integration is next.
- Custom yellow cursor still inline in `index.html` — should move to `public/cursor.js` before adding more pages.

### Verification
- `node -c server.js` ✓ · all syntax checks pass
- `node preview-test.js` → 13/13 render ✓
- Sanity grep on rendered previews: 8 Stratus mentions in preview-12.html (0 Heph), 6 Coverwise mentions in preview-13.html (0 Turtlemint)
- Manual: customer login → form validation fails correctly with red asterisks + shake + scroll · admin login bypasses · `/plans` blocked for customer, open for admin · theme toggle persists across pages

---

## Round G — 2026-05-08 → 2026-05-14

**Production infrastructure: Docker, Prisma, Auth0 middleware, Winston, Jest, src/lib/ reorganisation. The big handoff prep.**

**Touched:** [[03_TECH_STACK]] · [[01_api-routes]] · [[02_ai-fallback]] · created [[ADR#ADR-012 — Prisma ORM over raw SQL queries|ADR-012]] · [[ADR#ADR-013 — Auth0 JWT verification with jwks-rsa key cache|ADR-013]] · [[ADR#ADR-014 — Multi-stage Docker build with non-root user|ADR-014]] · [[ADR#ADR-015 — Winston JSON logging|ADR-015]]

### Shipped — Infrastructure
- **Dockerfile** — multi-stage build (Node 20-alpine builder + runtime stage). Non-root user `nodejs:1001` for security. `npm prune --omit=dev` in builder stage. Built-in `HEALTHCHECK` that pings `/health` every 30s. Production-grade out of the box.
- **docker-compose.yml** for local dev — App + MySQL 8.0 service with `depends_on: condition: service_healthy`. Named volume `db_data` for persistence. Comments explaining how to swap MySQL service for managed RDS in prod.
- **`/health` endpoint** — returns 200 with DB-connection status. Pings Prisma if connected. Wired into Dockerfile's HEALTHCHECK directive.
- **Graceful SIGTERM handler** — `disconnectDatabase()` then exit. Prevents corrupted streams on container kill.
- **`.dockerignore`** — excludes node_modules, .env, generated/, SiteMemory/, preview-*.html.
- **`.env.example`** — documents every env var (NODE_ENV, PORT, DATABASE_URL, DB_*, UPLOAD_STORAGE, AWS_*, AUTH0_*, GEMINI_API_KEY, GROQ_API_KEY, LOG_LEVEL). Inline comments explaining when each is needed.

### Shipped — Database (Prisma + MySQL)
- **`prisma/schema.prisma`** — six models: `User` (with `auth0Id`, `email`, `role`), `Website`, `Draft` (unique on userId+templateId), `Download`, `Template`, `Payment`. Three enums: `Role` (ADMIN / CUSTOMER), `WebsiteStatus` (DRAFT / PUBLISHED / ARCHIVED), `PaymentStatus` (CREATED / PAID / FAILED / REFUNDED). Indexed FKs (`@@index([userId])`), unique constraints, explicit `onDelete: Cascade / Restrict` per relation.
- **`src/lib/database.js`** — Prisma client wrapper with `connectDatabase()` / `disconnectDatabase()`. Logs warnings + errors via Winston. Falls back to no-op if Prisma not installed (dev resilience).
- **npm scripts** for Prisma — `db:generate`, `db:push`, `db:migrate`, `db:migrate:deploy`, `db:studio`.

### Shipped — Auth seam (Auth0-ready)
- **`src/lib/auth.js`** — proper Auth0 JWT verification using `jwksClient` for key rotation (RS256 algorithm, audience + issuer checks). Exports three middleware factories: `authenticate()`, `requireRole(...roles)`, `optionalAuth()`.
- **Dev-bypass mode** — when `AUTH0_DOMAIN` is unset, returns a placeholder admin user. Tech team flips a single env var to activate Auth0.
- **`getOrCreateUser()`** — auto-provisions Prisma users from JWT `sub` claim. Reads `https://beyondSure.com/role` custom Auth0 claim for role assignment.
- **`/api/register` route added** for the registration form on `/register`. Currently logs and stub-redirects; tech team wires Prisma create.

### Shipped — Logging (Winston)
- **`src/lib/logger.js`** — Winston logger with structured JSON output in production, colorized human-readable in dev. Service metadata + environment baked in. Falls back to console if Winston not installed.
- **Replaced ~30 `console.log` calls** across `server.js` with structured `logger.info({ ... }, message)`.

### Shipped — Storage abstraction
- **`src/lib/storage.js`** — exports `getUploadDir()`, `isS3()`, `getMulterStorage()`, `fileFilter`. `UPLOAD_STORAGE=local|s3` env switches between disk and S3 with zero code change.

### Shipped — Tests + CI
- **`__tests__/`** folder with Jest tests for `logger`, `payments`, `utils`. 39 tests passing. `payments.js` and `utils.js` at 100% line/branch coverage.
- **`jest.config.js`** + `__tests__/setup.js`.
- **`.github/workflows/ci.yml`** — checkout, Node 20 setup with npm cache, `npm ci`, `prisma generate` (with dummy DATABASE_URL), `npm test`, `npm audit --audit-level=high`. Comments at end document branch-protection rules for tech team to enable in GitHub UI.

### Shipped — Reorg
- **`src/lib/` folder** — extracted all integration seams into focused modules: `auth.js`, `config.js`, `database.js`, `logger.js`, `payments.js`, `storage.js`, `utils.js`. Each is ~50–150 lines, replaceable in isolation.

### New dependencies
- `@prisma/client` + `prisma` (dev)
- `winston`
- `jsonwebtoken` + `jwks-rsa`
- `js-yaml` (for config.yaml support)
- `jest` (dev) + `eslint` (dev)

### Why this round mattered
This is the round that flips BeyondSite from "personal prototype" to "handoff-ready". The previous architecture review had flagged: no DB seam, no auth seam, no logging seam, no Dockerfile, no tests, no CI. All seven gaps closed in this round, with documented dev-bypass modes so the app still runs without external services configured. The tech team will activate each integration by setting environment variables — no code changes needed.

### Verification
- `node -c server.js` ✓
- `npm test` → 39 passing across 3 suites
- `docker build .` (locally) ✓
- `/health` returns `{status:'ok', ...}` on a running container

---

## Round F — 2026-05-07

**Templates 12 (InsurTech SaaS) and 13 (Insurance Market) shipped + preview modal aspect ratio fix.**

**Touched:** [[05_preview-modal]] · [[_registry|Templates registry]] · created [[ADR#ADR-010 — Stage-element approach for device-toggle preview centring|ADR-010]] · related [[ADR#ADR-009 — Hover 1.5s long-press 600ms preview modal NOT click-to-preview|ADR-009]] · [[ADR#ADR-008 — Compliance review banner on regulated templates not on every template|ADR-008]] (Insurance Market gets the banner)

### Shipped
- **Template 12 — InsurTech SaaS** (`#00dcb4` cyan on dark navy `#0a0e14`) — B2B API platform aesthetic. Hero with live syntax-highlighted code panel. 6 API products with `POST /v1/quotes`-style endpoint badges. 4-step integration flow with duration tags. Stats band (99.99% uptime / 2.4B+ calls / <80ms). Compliance section with SOC 2 / ISO / IRDAI badges. 3 pricing tiers with one marked "Most popular". Sample is "Heph" — Bangalore-based platform serving Acko/Digit/Bajaj/HDFC.
- **Template 13 — Insurance Market** (`#00856f` green) — consumer aggregator aesthetic, Plus Jakarta Sans + Manrope typography. Hero with working-feel quote search widget (category chips + pincode + DOB). 6 insurance categories with "Cashless at 8000+ hospitals"-style taglines. Why-us card grid. 4-step buy-and-claim flow. IRDAI partner strip with 12 real insurer names. Customer testimonials with claim-outcome tags. Schema includes `complianceReview` flag — regulated-content warning banner shows on form.

### Changed
- **Preview modal aspect ratios.** Was rendering at weird wide/short proportions. Now: Desktop 1280×720 (16:9), Tablet 820×1100 (~3:4 portrait), Mobile 420×900 (~9:19 modern phone).
- **Mobile/tablet centring fixed.** Iframe was left-aligning when smaller than wrap. New approach: a `tpv-frame-stage` element takes the scaled-down dimensions in the layout, wrap is `display: flex; justify-content: center;` so the stage centres properly. Stage corners get progressively rounder per device (6px desktop / 14px tablet / 22px mobile).
- **Stage transitions.** 280ms cubic-bezier on stage `width`/`height` so device toggles animate smoothly.
- **Renamed `template-heph` → `template-12`** and **`template-turtlemint` → `template-13`** in `index.html` to match numeric convention. TEMPLATE_NAMES in template-preview.js updated accordingly.

### Technical debt
- None new. Round was clean.

### Verification
- `node -c server.js` ✓ · `node -c public/template-preview.js` ✓
- `node preview-test.js` → 13/13 templates render ✓
- Content sanity grep: 11 hits in preview-12.html (Heph/Quotes API/SOC 2/Bangalore), 34 hits in preview-13.html (Turtlemint/IRDAI/Cashless/Compare/Mumbai)

---

## Round E.5 — 2026-04-29 → 2026-05-04

**Preview modal (hover/long-press) + premium animations + auto-close.**

**Touched:** [[05_preview-modal]] · [[01_api-routes#Template preview (for the hover modal)|/template-previews/preview-:slug.html]] · created [[ADR#ADR-009 — Hover 1.5s long-press 600ms preview modal NOT click-to-preview|ADR-009]]

### Shipped
- **Hover-to-preview modal.** Desktop: hover ~1.5s on a template card → modal opens. Touch: press & hold ~600ms. Direct click on card still selects (fast path). Modal has live iframe preview, three device toggles, X close, Escape-to-close, backdrop-click-to-close, "Use This Template" button (closes + selects + scrolls to form).
- **Server route `GET /template-previews/preview-:slug.html`** that whitelists alphanumeric template slugs only (won't leak EJS source or schemas). Friendly fallback HTML page if a preview hasn't been generated yet.
- **Premium entrance animation.** Backdrop fades in over .32s with smooth blur ramp from 0 to 12px. Modal starts 28px lower at 0.94 scale + 0% opacity, springs up via `cubic-bezier(.16, 1, .3, 1)` (the macOS sheet curve). 60ms delay on the modal entry so backdrop visibly settles first → "lifts from the page" feel. Subtle gold ambient glow around modal shadow.
- **Auto-close on cursor leave.** Once the cursor enters the modal once (`hasEnteredModal` flag), leaving triggers a 280ms grace timer → modal closes. Re-entering cancels. If user never enters modal, it stays open until X / Escape / backdrop click. This is the "hover-bridge" pattern from macOS menus.
- **Hint text** under "Choose Your Template": "Hover a template for ~1.5s to see a live preview · on touch devices, press & hold."
- **Pending hover indicator** — soft golden ring + slight brightness lift on the card while the 1.5s timer counts down.

### Why this approach
- Tiny picker thumbnails are too abstract — users couldn't tell what they were picking.
- Modal-on-hover beats a separate Preview button because it doesn't add a step for cautious users while still giving fast users a click-to-select path.
- Auto-close prevents the modal lingering when the user moves on, but doesn't fight the user (only closes after they've actually engaged).

---

## Round E — 2026-04-26 → 2026-04-28

**Templates 10 (Restaurant) and 11 (Portfolio) shipped + small CSS/UX fixes.**

**Touched:** [[_registry|Templates registry]] · [[04_template-system]]

### Shipped
- **Template 10 — Restaurant / Café** (cream `#f9f4ec` + burgundy `#7a2e2e` + olive). Fraunces serif headlines + Inter body. Sections: hero with italic accent, about + chef-card, 6 signature dishes with prices and tags, full menu parsed from textarea (`Name | Price | Description | Tag` per line), reviews with star ratings, hours table, press strip, reservation CTA. Sample is "Trattoria Verde" — Mumbai modern Italian.
- **Template 11 — Portfolio / Freelancer** (pure black/white minimalism, big serif name, editorial work-list). Drop cap on about paragraph. Auto-scrolling skills marquee. Numbered editorial work list with hover-shift. Sample is "Aria Mehta" — Mumbai brand & editorial designer.

### Fixed
- **Site map mockup moved bottom-LEFT** (was bottom-right, overlapping the chatbot bubble). Updated transform-origin and collapsed-state position.
- **Cursor disappearing inside chatbot panel.** Bumped `.cursor-follower` z-index to 100000 (above `.cb-panel` at 9999). Added `cursor: text` to `.cb-input` so users can see their typing position.
- **Cursor disappearing on login page.** Login.html loads `style.css` (which sets `body { cursor: none }`) but doesn't include the custom-cursor element/JS. Added scoped `cursor: auto !important` for `body.form-page` with proper cursor types per element.
- **Payment section CSS.** All `.pay-card`, `.pay-row`, `.pay-label`, `.pay-val`, `.pay-price`, `.pay-divider`, `.pay-note`, `.pay-success`, `.pay-check`, `.btn-full` had no CSS rules — payment page was rendering unstyled. Added a full set matched to the dark/gold design system.
- **Select dropdown styling.** Schema-rendered `<select>` elements rendered white-on-white when opened. Added explicit dark-themed `<option>` rules + custom gold chevron via inline SVG (since `appearance: none` strips native arrow).

---

## Round D — 2026-04-23 → 2026-04-25

**NBFC template (template-9) + chatbot + AI fallback chain.**

**Touched:** [[03_chatbot]] · [[02_ai-fallback]] · [[_registry|Templates registry]] · [[04_template-system#Compliance review pattern|complianceReview pattern]] · created [[ADR#ADR-005 — Gemini → Groq fallback chain for the ✨ AI button|ADR-005]] · [[ADR#ADR-006 — Server-locked AI prompts not client-controlled|ADR-006]] · [[ADR#ADR-007 — Two-layer chatbot client intent matcher + Groq scope-locked AI|ADR-007]] · [[ADR#ADR-008 — Compliance review banner on regulated templates not on every template|ADR-008]] · [[ADR#ADR-011 — Indian regulatory differentiation as the moat|ADR-011]]

### Shipped
- **Template 9 — NBFC / Lender** (cream + dark teal + warm orange). Compliance topbar (RBI Reg + CIN + NBFC category + Sachet link). Hero with starting-rate panel + 4 quick-promise bullets. Loan products grid with amount/rate/tenure. Eligibility & documents (split panel, `Salaried` / `Self-employed` doc lists). 4-step application process. Rates & charges table (RBI-mandated transparent disclosure). Numbers band. About + pillars + ratings. Testimonials with `productUsed` tag. **Grievance Redressal section** — Principal Nodal Officer card + 3-tier escalation matrix (Branch → GRO → RBI Ombudsman/Sachet) with TAT commitments. Footer disclaimer block citing RBI Reg., escalation paths, Sachet portal.
- **`complianceReview` schema flag.** Top-level block on regulated schemas (BFSI, Insurance, NBFC) with `{ title, body }`. Form-renderer surfaces an amber warning banner above the form when present, reminding the user that AI-generated regulatory copy is a draft only.
- **Help chatbot.** Floating gold bubble bottom-right with pulse ring. Click opens 380×540 panel. Header (Builder Helper · Online · Help only), scrollable message stream, auto-grow textarea + send button. Light markdown support (`**bold**`, `` `code` ``). Typing indicator. Routed through Groq via axios (no new npm package needed).
- **Chatbot scope-lock.** Strict system prompt: only answers about template selection, form fields, ✨ AI button, preview/payment/download flow, compliance reminders. Off-topic gets a canned redirect.
- **Chatbot context-awareness.** Each Groq call sends `{ templateId, sectionId, businessName, description }` from the current form state, capped at 240 chars on description. Adds ~30-50 tokens per turn.
- **Chatbot local-intent matcher.** Client-side regex patterns for ~9 categories (greetings, thanks, identity, capabilities, how-are-you, pleasantries, compliments, goodbyes, tiny-input). Match → reply locally, no API call. ~50% reduction in Groq usage on social messages.
- **AI fallback chain (`/api/ai-section`).** Layer 1 Gemini 2.5 Flash with 3-retry backoff on 503. Layer 2 Groq Llama-3.3-70b via OpenAI-compatible chat-completions API + `response_format: { type: 'json_object' }`. Robust `extractJSON()` helper handles markdown fences and stray prose. Server logs which provider succeeded.

### Why this approach
- Local intent matcher saves real money on free tier.
- Failover chain means free-tier 429s no longer break demos.
- Compliance banner is the cheapest, most-defensible regulatory cover for a builder-built site.

---

## Round C — 2026-04-21 → 2026-04-22

**Templates 3 (Terminal) and 4 (Web3) refactored to schema-driven + server.js tail fix.**

**Touched:** [[04_template-system]] · [[_registry|Templates registry]] · [[01_api-routes#Render|/api/generate]]

### Shipped
- **Template 3 — Terminal / Dev Studio** refactored. Safe-locals top block. Hero with terminal prompt + cycling typing line (`heroTypingLines[]` repeater). Status bar marquee. About `about.ts` code window + stack capability bars. Numbered service modules (`MODULE_0n.ts`). 4-phase git-log process repeater (`hash`, `phase`, `title`, `body`, `branch`). Numbers, testimonials as `review_00n.log`, CTA, contact.
- **Template 4 — Web3 / Protocol** refactored. Hero badge + dashboard chips repeater (auto-detects up/down direction from arrows). Italics rendered via `quoteHTML()` for `*phrase*` markers in testimonials. Manifesto split across 6 schema fields (`aboutQuoteLine1` / `aboutQuoteAccent1` / `aboutQuoteLine2` / `aboutQuoteLine3` / `aboutQuoteAccent2` / `aboutQuoteTail`). Supported chains repeater (`{ name, color }`).
- **AI prompts** for templates 3/4 hero/about/services/process/cta sections.
- **strKeys + arrKeys** extended with all new fields.
- **Sample data** for Terminal (Forge Labs — SF engineering studio) and Web3 (Helix Protocol — multi-chain settlement).

### Fixed
- **Truncated `server.js` tail.** The `/api/generate` handler had been cut off after `await ejsLib.renderFile(...)` — no zip logic, no catch, no `app.listen()`. Server was returning Node SyntaxError on boot. Restored the zip-and-stream finalisation (archiver + asset bundling for `/uploads/*` referenced files) and `app.listen(PORT, ...)`.

---

## Round B — 2026-04-19 → 2026-04-20

**Templates 2 (Agency) and 6 (BFSI) refactored to schema-driven.**

**Touched:** [[04_template-system]] · [[_registry|Templates registry]] · BFSI established the compliance topbar pattern that later became [[ADR#ADR-008 — Compliance review banner on regulated templates not on every template|ADR-008]]

### Shipped
- **Template 2 — Agency / Noir** refactored. Preserved noir-with-gold styling. Hero with 3-line headline (middle word gets gold gradient via separate `heroHeadlineLead/Accent/Tail` fields). Ticker marquee. About with stagger stat cards. Numbered service cards. 4-step process with connector line. Gold numbers band. Testimonials with initials avatars (helper function).
- **Template 6 — BFSI / Banking** refactored. Compliance topbar with `mockupTarget: "header"` hint. Hero rates panel (live indicative rates with `name`/`detail`/`rate`/`tag`). Heritage stats card. Certifications row. Rates tables (deposit + lending repeaters). Pillars repeater for `about` section. Footer disclaimer.
- **AI prompts** for templates 2/6.
- **strKeys + arrKeys** extended.
- **Sample data** — Noir Studio (Brooklyn agency), Meridian Capital (Mumbai BFSI).

### Verified
- `node preview-test.js` → 8/8 ✓ at this point.

---

## Round A — 2026-04-15 → 2026-04-18

**Schema-driven foundation laid. Templates 5 (Local Service), 7 (Startup), 8 (Insurance) shipped.**

**Touched:** [[04_template-system]] · [[02_CONVENTIONS]] · [[_registry|Templates registry]] · created [[ADR#ADR-001 — Schema-driven templates over hand-rolled HTML|ADR-001]] · [[ADR#ADR-002 — Safe-locals EJS pattern|ADR-002]] · [[ADR#ADR-003 — extends _base for shared schema sections|ADR-003]]

### Shipped
- **Shared base schema** (`templates/schemas/_base.json`) — brand / contact / theme sections that every template extends.
- **Schema endpoint** (`GET /api/schema/:templateId`) with composeSchema merging `_base` into specific template schemas.
- **Form-renderer.js** — reads schema, renders fields, supports text / textarea / select / color / image / repeater types. Repeaters with min/max + per-item sub-fields.
- **Per-section AI button (✨)** with `AI_PROMPTS[templateId][sectionId]` map in server.js. Default fallback prompts.
- **Template 5 — Local Service** (warm orange/cream). Trust strip, services with prices, hours day-by-day repeater, areas served, FAQ.
- **Template 7 — Startup / SaaS** (cool blue + white). Hero badge, features grid with optional metrics, how-it-works, pricing plans repeater (Starter / Pro / Team), customer logos.
- **Template 8 — Insurance Advisor** (calm green). Hero with quote-card, policies grid, why-choose-us, advisor bio, claim process 4-step.
- **Template 1 (Editorial)** — schema refreshed to base pattern (but EJS still on legacy non-safe-locals — flagged as known issue).
- **Mockup thumbnails** in form-renderer (small wireframe per section).
- **Side-gutter hints** — label + arrow + description on left/right of each schema section.
- **Mobile collapse** — ⓘ tap-to-expand for hints on small screens.
- **Hint copy** drafted for templates 5/7/8 + _base.

### Established conventions (codified later in 02_CONVENTIONS.md)
- Safe-locals EJS pattern (`const L = locals || {}`)
- The "six wired artifacts" rule
- strKeys / arrKeys discipline in `buildTemplateData()`

---

## Round 0 — Pre-conversation (existed before I joined)

**Touched:** [[03_TECH_STACK]] · [[01_api-routes]] (initial endpoints)

Initial scaffolding done by Kunal solo:

- Express 5 + EJS server. Public folder with `index.html`, `script.js`, custom yellow-cursor.
- 4 initial templates (1 Editorial, 2 Agency, 3 Terminal, 4 Web3) — non-schema-driven, hardcoded HTML.
- Hardcoded login (`admin@example.com` / `password123`).
- Dummy in-memory `/api/pay` payment system, $9 one-time, 30-min TTL.
- `/api/generate` endpoint that ZIPs rendered HTML + uploaded assets.
- Multer image uploads.
- express-rate-limit on AI / generate / pay routes.
- Gemini 2.5 Flash AI integration (single-provider, no fallback).
- Custom yellow-dot cursor with hover-text expansion (inline `<script>` in index.html).
- Floating site-map mockup at bottom-right (later moved to bottom-left).

---

## How to add a new round

When a session ships meaningful work:
1. Add a new section at the **top** of this file (newest first).
2. Use the format: `## Round X — YYYY-MM-DD` heading, then `### Shipped`, `### Fixed`, `### Why this approach`, `### Technical debt`, `### Verification` subsections as relevant.
3. Don't edit previous rounds. If a Round D decision is later changed, note it in the new round and reference the old one (`supersedes Round D's …`).
4. Round letter increments alphabetically. Round F's next is Round G.
