# Current Status (As of April 27, 2026)

## What is working:

* **11 schema-driven templates render end-to-end clean.** Editorial (1), Agency-Noir (2), Terminal/Dev Studio (3), Web3/Protocol (4), Local Service (5), BFSI/Banking (6), Startup/SaaS (7), Insurance Advisor (8), NBFC/Lender (9), Restaurant/Café (10), Portfolio/Freelancer (11). `node preview-test.js` reports 11/11 ✓ with realistic sample data per template.
* **Schema-driven form** with hint gutters (label + arrow + description on left/right of each section), section mockup thumbnails, and ⓘ tap-to-expand on mobile.
* **Per-section AI button (✨) with Gemini → Groq failover.** Gemini 2.5 Flash is primary with a 3-retry backoff on 503s; Groq Llama-3.3-70b kicks in if Gemini returns any other error. Server logs show provider per call (`[ai-section] template-9/hero ✓ Gemini` or `✓ Groq (fallback)`). Robust `extractJSON()` helper handles markdown fences and stray prose.
* **Help chatbot** — floating gold bubble bottom-right with pulse ring. Session memory only (cleared on refresh). **Two-layer architecture**: client-side intent matcher answers ~9 categories of social messages locally (greetings, thanks, bye, identity, capabilities, how-are-you, pleasantries, compliments, tiny inputs) at zero API cost; substantive questions go to Groq via `/api/chat`. Form-context-aware: passes current `templateId`, active `sectionId`, business name, and description (capped at 240 chars) into every Groq system prompt. Strict scope-lock with friendly redirect for off-topic questions.
* **Compliance review banner** appears above the form when a regulatory template (BFSI/Insurance/NBFC) is selected. Amber warning + reminder that AI-generated regulatory copy is a draft only and must be reviewed by compliance before publishing.
* **Dummy payment system** — `/api/pay` issues a one-time `$9` payment ID with 30-minute TTL stored in an in-memory `Map`. Gates the `/api/generate` download endpoint via `consumePayment()`.
* **Generate endpoint** zips rendered HTML as `index.html` plus any `/uploads/*` images referenced in the form (logo, hero shot, advisor photo) into `assets/`, streams as a downloadable file with a slugified business name.
* **Custom yellow-dot cursor** with hover-text expansion on the main app pages; `cursor: text` carve-out for the chatbot textarea so users can see their typing position; `z-index: 100000` so the cursor follower draws above the chatbot panel and any modal.
* **Site-map mockup at bottom-LEFT** (was overlapping the chatbot at bottom-right; moved). **Chatbot at bottom-right** (z-index 9999).
* **Login page** has a working scoped CSS fix that restores native cursor (custom-cursor element only lives in `index.html`).
* **Hardcoded login** at `admin@example.com` / `password123` via `/api/login`, redirects to `/` on success.
* **Side-by-side preview viewer** at `templates/preview-all.html` with column / viewport / schema-only filter chips.
* **Payment section CSS** fully styled (was previously markup with no CSS rules — invisible card, broken full-width button). Now has gold-gradient top accent, dashed dividers between rows, big gold price, and a glowing-check success state.
* **Select dropdowns** explicitly themed for the dark UI with a custom gold chevron and dark-themed `<option>` styling for the native popup (was rendering white-on-white before today).

## What is broken / incomplete:

* **Template 1 (Editorial) is still on the legacy non-safe-locals pattern.** It works because `buildTemplateData` injects defaults for the legacy fields it reads (`about`, `products`, `tagline`, etc.), but it's not as defensive as templates 2–11. A single field-name change elsewhere could break it.
* **Authentication is hardcoded.** No real signup, no DB, no sessions. Single hardcoded credential pair.
* **Payment gateway is a dummy.** No Stripe or Razorpay integration. Payments tracked in an in-memory `Map` that resets on server restart.
* **No persistent user data.** Form state lives in browser memory; refresh loses progress. No saved drafts.
* **No category filter in the template picker.** Currently a flat grid of 11 cards. Will get crowded at 15+ templates.
* **No template-family / inheritance scaffolding.** Schemas and AI prompts are duplicated per template. Adding 3 restaurant aesthetic variants today would mean 3× duplication of menu schema and prompts.
* **Custom cursor logic is inline in `index.html`.** Any new authenticated page (signup, dashboard, forgot-password) will hit the same "cursor disappears" bug pattern that login.html had until that script is extracted into a reusable `public/cursor.js`.
* **Free-tier Gemini quota** still hits 429/503 during heavy demo sessions. The Groq fallback masks this end-to-end now, but Gemini's free tier is the original cause. Decision is to switch to paid Gemini as the FINAL pre-launch step, not earlier.
* **AI prompt voice may diverge slightly when Groq handles a section.** Prompts were originally tuned for Gemini's output style. JSON shape is forced (Groq json_object mode), so structure is always correct, but phrasing on the rare fallback path can read differently. Worth tightening per-template prompts later if customers complain.
* **No deterministic canned-response fallback below AI.** If both Gemini and Groq fail, the form gets a 503 error rather than a generic-but-sensible default. For a paid product, a third layer of canned fallbacks would prevent users from ever seeing a raw AI failure.
* **Cowork file mount sync occasionally lags** between the user's Windows machine and the sandbox view (workflow issue, not code).

## Immediate Next Steps:

- [ ] Refactor `templates/website-template-1.ejs` (Editorial) to the safe-locals pattern used by templates 2–11.
- [ ] Build the next batch of templates per the agreed roadmap: **Healthcare/Clinic**, **Education/Coaching Institute**, **Fitness/Gym**, **Real Estate Agency** — each ~9–18 hours of solo work. Reach 15 templates total to feel "complete enough".
- [ ] Extract the custom-cursor logic from inline `<script>` in `index.html` into a reusable `public/cursor.js` so future pages opt in via one script tag without re-introducing the cursor-disappears bug.
- [ ] Add a deterministic fourth-layer canned-response fallback in `/api/ai-section` so users never see a raw AI failure when both Gemini and Groq are down.
- [ ] When the catalogue reaches ~15 templates, design and ship a **category filter** in the picker (Food, Health, Finance, Tech, Service, Creative, etc.).
- [ ] Before adding multi-variant templates per topic (e.g. 3 restaurant aesthetics), refactor schemas to support **template families** with shared base sections (`extends: ["_base", "_restaurant"]`) and shared `AI_PROMPTS['_restaurant']`.
- [ ] Replace hardcoded `/api/login` with real authentication (sessions or JWT, real user DB, signup flow).
- [ ] Replace dummy `/api/pay` with a real **Stripe** or **Razorpay** integration including webhook verification.
- [ ] Add per-template usage logging to see which templates customers actually pick (drives later prioritisation of variants and which categories deserve depth).
- [ ] **Final pre-launch step:** Add credit card to Gemini for paid tier. Keep Groq as fallback only.
