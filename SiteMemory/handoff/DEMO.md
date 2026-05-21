# BeyondSite Demo Script

A conversational walkthrough for showing the product to stakeholders, seniors, or reviewers. Total time: ~5 minutes for customer flow, ~7 minutes with admin demo.

---

## Before You Start

```bash
npm install && npx prisma generate && node server.js
```

Open **http://localhost:3000** in your browser. Have both demo credentials handy:

- **Admin:** `admin@beyondsite.com` / `admin123`
- **Customer:** `customer@beyondsite.com` / `customer123`

---

## Customer Flow (~5 minutes)

### 1. Login Page (30 seconds)

**What to say:**
> "This is the login page. We have two demo accounts — click either chip to auto-fill. All other email/password combos are rejected. There's no open backdoor."

**What to do:**
- Click the **Customer** chip to auto-fill credentials
- Click **Sign In**

**Talking point:**
> "The auth system is scaffolded for Auth0 — the middleware is already wired in `src/lib/auth.js`. Right now we're using a strict 2-user whitelist for the demo. The tech team just flips env vars to activate real Auth0."

---

### 2. Template Picker + Hover Preview (45 seconds)

**What to say:**
> "Here's the template picker. We have 14 templates covering Indian-regulated businesses — NBFCs, BFSI, Insurance, MF Distributors — plus global verticals like Restaurant, Portfolio, and Startup."

**What to do:**
- Hover over any template card for ~1.5 seconds
- Wait for the preview modal to open
- Click the device toggles (Desktop → Tablet → Mobile)

**Talking point:**
> "Hover for about 1.5 seconds and a live preview opens — it's an iframe rendering a pre-generated HTML file. You can toggle between Desktop, Tablet, and Mobile. The modal has a premium entrance animation and auto-closes when you move your cursor away."

> "Only 5 templates are visible initially. Click 'Show More' to reveal the remaining 9."

---

### 3. Form Fill + AI Button (60 seconds)

**What to say:**
> "Pick a template and you land on the form. It's schema-driven — every field comes from a JSON file, not hardcoded HTML. Each section has hints on the side explaining what to write, and a mockup thumbnail showing where it appears in the output."

**What to do:**
- Click any template card
- Point out the side-gutter hints (label + arrow + description)
- Click the **✨ AI** button on any section

**Talking point:**
> "This ✨ button is the AI assistant. It sends a context-aware prompt to Gemini 2.5 Flash, which fills the section with realistic content. If Gemini hits its rate limit, it automatically falls back to Groq — the user never sees an error."

> "The required fields — Business Name, Tagline, Description — have red asterisks. Try clicking Preview without filling them and you'll see a shake animation, red ring, and an inline error banner that tells you exactly what's missing."

**Optional:** Fill in a Business Name, Tagline, and Description (20+ chars) to show the form working.

---

### 4. Preview in iframe (45 seconds)

**What to say:**
> "Once you've filled the required fields, click 'Preview Website'. Your data renders through the EJS template server-side and comes back as HTML — displayed right here in an iframe."

**What to do:**
- Click **Preview Website**
- Toggle between devices to show responsive rendering
- Point out the device bar above the browser chrome

**Talking point:**
> "The preview is live — it's your actual data rendered through the template. The device bar sits above the browser chrome so the website's own navigation isn't hidden. You can switch between Desktop, Tablet, and Mobile to see how it looks on each."

---

### 5. Payment + Download (60 seconds)

**What to say:**
> "Step 3 is Pay & Download. It has three internal sub-steps with a progress bar — Pay, Confirmation, then Download. You can't download without paying, unless you're an admin."

**What to do:**
- Click **Pay** (or go to Step 3 directly if you skipped ahead)
- Show the 3 sub-steps with the mini progress bar
- Click the payment button (Razorpay test mode opens)
- After confirmation, show the Download button
- Click **Download** → ZIP downloads

**Talking point:**
> "The payment flow has a mini progress bar: Pay → Confirmation → Download. After payment succeeds, it auto-advances through the sub-steps. The downloaded ZIP has externalized assets — `style.css` and `script.js` as separate files, not inline code. Open `index.html` in a browser and that's the deliverable — plain HTML, no build step, host anywhere."

> "We're using Razorpay in test mode. The scaffold for live payments is already in `src/lib/payments.js` — the tech team just swaps test keys for live keys and configures a webhook."

---

### 6. Profile Page (30 seconds)

**What to say:**
> "The profile page shows your account details, total paid, sites generated, and a recent activity timeline. The 'View Plans' button is hidden for customers."

**What to do:**
- Click **Profile** in the nav (or go to `/profile`)
- Point out the stats cards and sample templates

**Talking point:**
> "This page has a dark/light theme toggle in the top-right. The choice persists across pages and refreshes."

---

## Admin Flow (optional, ~2 minutes)

**What to say:**
> "Now let me show you the admin experience. Same flow, but with bypass privileges."

**What to do:**
- Log out, log in as **Admin** (`admin@beyondsite.com` / `admin123`)
- Go to the form — point out that validation is bypassed
- Click **Preview Website** with empty fields → sample defaults appear
- Go to `/plans` → click "Preview Plans (Admin)" → overlay dismisses

**Talking point:**
> "Admins skip form validation entirely — sample defaults fill in automatically. They also bypass the payment wall and can preview the plans page. The admin badge is visible on the profile page."

---

## Key Talking Points (use throughout)

### Schema-Driven Architecture
> "Every template is three files: a JSON schema, an EJS renderer, and an AI prompt set. Adding a new template doesn't require touching server code. It's a convention — we call it the 'six wired artifacts' rule."

### AI Fallback Chain
> "The AI button uses Gemini 2.5 Flash as primary. If Gemini hits a rate limit or 503 error, it retries 3 times with backoff, then falls back to Groq Llama-3.3-70b. The user never sees a raw AI failure."

### Two-Layer Chatbot
> "The floating gold bubble is a help chatbot. It has two layers: first, it checks if your message is a greeting, thanks, or social message — those are handled locally with zero API cost. Only substantive questions about the builder go to Groq. This cuts API usage by about 50%."

### Clean Integration Seams
> "All the production-bound code lives in `src/lib/` — auth, payments, database, storage, logging. Each file is a swappable seam. The tech team replaces them by setting environment variables, not rewriting server code."

### Production-Ready Scaffolding
> "Docker multi-stage build, non-root user, health check endpoint, structured logging, CI pipeline, 376 unit tests — all of this is already in place. The app is deployer-ready. The tech team just needs to configure Auth0, swap Razorpay keys, point at a MySQL database, and deploy."

---

## Common Questions

**"Can I use this without AI?"**
> "Yes. The form works without the ✨ button — you fill it manually. AI is an assist, not a requirement."

**"What happens if both Gemini and Groq fail?"**
> "The user gets a 503 error. We have a roadmap item to add canned defaults as a 4th-layer fallback — about 2 hours of work."

**"Is the output really just HTML?"**
> "Yes. The ZIP contains `index.html`, `style.css`, `script.js`, and any uploaded assets. No framework, no build step, no dependencies. Host it on any static hosting — Netlify, Vercel, GitHub Pages, even a shared hosting plan."

**"How much does it cost to run?"**
> "Gemini free tier covers testing. Groq free tier covers the fallback. Razorpay test mode is free. The only production cost is the host (Render free tier works), MySQL (managed or self-hosted), and Razorpay transaction fees once live."

**"Can I add more templates?"**
> "Yes. Follow the 'six wired artifacts' rule: schema, EJS, AI prompts, preview test, picker card, and CSS. Copy template-12 or template-13 as a starting point. Convention is enforced by the preview test — if a template doesn't render clean, it doesn't ship."

---

## Related

- [[../../README]] — project overview and quick start
- [[HANDOFF]] — consolidated handoff checklist
- [[deployment]] — step-by-step deployment guide
- [[../01_CURRENT_STATE]] — what works right now
