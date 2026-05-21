# BeyondSite

[![Tests](https://img.shields.io/badge/tests-376%20passing-brightgreen)]()
[![Templates](https://img.shields.io/badge/templates-14-blue)]()
[![Docker](https://img.shields.io/badge/docker-ready-orange)]()
[![CI](https://img.shields.io/badge/ci-green-brightgreen)]()

> A no-code generator for professional business websites. Pick a template, fill a form with AI help, preview in real-time, pay ₹4,999, and download a self-contained ZIP. The output is plain HTML/CSS/JS — no framework, no build step, host anywhere.

Built by [BeyondSure](https://www.beyondsure.in/) (Shrigoda TechLabs Pvt Ltd) as an intern handoff project.

---

## How It Works

BeyondSite turns a blank form into a polished website in five steps:

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────┐     ┌──────────┐
│ 1. Pick │ ──▶ │ 2. Fill  │ ──▶ │ 3. Preview│ ──▶ │ 4. Pay│ ──▶ │ 5. Download│
│Template │     │  Form    │     │  in iframe│     │      │     │   ZIP     │
└─────────┘     └──────────┘     └─────────┘     └──────┘     └──────────┘
```

### 1. Pick a template

14 production-quality templates covering Indian-regulated SMBs and global verticals. Each has a unique aesthetic, schema, and AI prompt set. Hover any card for ~1.5s to see a live preview with Desktop / Tablet / Mobile toggles.

### 2. Fill the form

A schema-driven form renders from `templates/schemas/template-N.json`. Each section has:
- **Side-gutter hints** — label + arrow + description explaining what to write
- **✨ AI button** — fills the section with Gemini 2.5 Flash (falls back to Groq if Gemini fails)
- **Mockup thumbnails** — visual guide showing where each field appears in the output
- **Required-field validation** — Business Name, Tagline, Description get red asterisks; missing fields shake and ring red with an inline error banner

### 3. Preview in real-time

Click "Preview Website" → your filled data renders through the EJS template server-side → returns as HTML → displayed in an iframe with device toggles (Desktop 16:9 / Tablet 3:4 / Mobile 9:19). The preview modal has a premium entrance animation with blur backdrop and auto-close on cursor leave.

### 4. Pay

Step 3 of the form wizard has 3 internal sub-steps with a mini progress bar:
1. **Pay** — Razorpay checkout (test mode) or admin bypass
2. **Confirmation** — "Payment received" with receipt details
3. **Download** — ZIP download button

Payment is gated: no ZIP without payment (unless admin). The flow auto-advances between sub-steps for smooth UX.

### 5. Download the ZIP

The downloaded ZIP contains:
- `index.html` — the rendered website
- `style.css` — all styles (externalized, not inline)
- `script.js` — all interactivity (externalized, not inline)
- `assets/` — any uploaded images referenced by the site

Open `index.html` in a browser — that's the deliverable. No build step, no dependencies.

---

## Quick Start

```bash
git clone https://github.com/graduationlearn-wq/BeyondSite.git
cd BeyondSite
cp .env.example .env    # add GEMINI_API_KEY (Groq optional)
npm install
npx prisma generate     # DB not required to boot
node server.js
```

Open **http://localhost:3000** → click **Sign In** → pick a demo account:

| Role | Email | Password | What they see |
|------|-------|----------|---------------|
| **Admin** | `admin@beyondsite.com` | `admin123` | Skips validation, bypasses payment, sees admin tools |
| **Customer** | `customer@beyondsite.com` | `customer123` | Full flow with validation and payment gate |

> No database needed for testing. The app falls back to in-memory mode. Drafts and payments are lost on restart.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                      BeyondSite                              │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ Express  │   EJS    │  Gemini  │  Groq    │   Razorpay       │
│ (server) │ (render) │  (AI)    │ (fallback│   (payments)     │
│          │          │          │  + chat) │                  │
├──────────┴──────────┴──────────┴──────────┴──────────────────┤
│                    src/lib/ (integration seams)               │
│  auth.js · database.js · payments.js · logger.js · storage.js│
├──────────────────────────────────────────────────────────────┤
│  Prisma ORM · MySQL (optional) · Winston · Jest · Docker     │
└──────────────────────────────────────────────────────────────┘
```

### Key design decisions

| Decision | Why | See |
|----------|-----|-----|
| Schema-driven templates | Add a template by writing JSON + EJS, not touching server code | [[SiteMemory/architecture/04_template-system]] |
| Gemini → Groq fallback | Free-tier 429s shouldn't break the demo | [[SiteMemory/architecture/02_ai-fallback]] |
| Two-layer chatbot | ~50% of messages are greetings — handled locally, zero API cost | [[SiteMemory/architecture/03_chatbot]] |
| Clean integration seams | `src/lib/` files are swappable — tech team replaces them without touching `server.js` | [[SiteMemory/decisions/ADR]] |
| In-memory fallback | App boots without MySQL for UI testing and demos | [[SiteMemory/01_CURRENT_STATE]] |

### What makes this different from Wix/Squarespace

- **Regulatory accuracy** — templates for NBFCs, BFSI, Insurance, MF Distributors include RBI/IRDAI/AMFI-mandated disclosures, grievance redressal sections, and compliance banners
- **Schema-driven, not drag-and-drop** — every template is a JSON schema + EJS renderer. Adding a new template = 3 files, not a visual editor
- **AI-assisted, not AI-generated** — the ✨ button fills sections with context-aware prompts, but the human reviews and edits before previewing
- **Static output** — the deliverable is plain HTML/CSS/JS. No framework, no build step, no hosting lock-in

---

## Handoff Status

What's built vs. what the tech team needs to wire:

| Area | Status | What's left |
|------|--------|-------------|
| Templates | ✅ 14 rendering clean | Template-1 safe-locals refactor |
| Auth | ✅ Auth0 middleware wired | Swap DUMMY_USERS for real Auth0 handler |
| Payments | ✅ Razorpay scaffold + test keys | Live keys + webhook configuration |
| Database | ✅ Prisma schema + migration + runtime | Apply to production MySQL |
| Container | ✅ Multi-stage Docker + healthcheck | Deploy to host (Render/Railway/DO) |
| CI/CD | ✅ GitHub Actions passing | Branch protection rules |
| Logging | ✅ Winston JSON in prod | Connect to aggregator (Datadog/Loki) |
| Storage | ✅ Local disk + S3-ready | Set `UPLOAD_STORAGE=s3` + AWS creds |

Full checklist: [[HANDOFF]]
Deployment guide: [[SiteMemory/deployment]]

---

## For Reviewers

Want to see it working? Follow the step-by-step demo:

→ [[DEMO]]

---

## For Deployers

Ready to put this on a real URL? The deployment guide covers:

→ [[SiteMemory/deployment]]

---

## Deep Dives

The full architectural brain lives in `SiteMemory/` — written as an Obsidian vault with cross-linked Markdown files.

| Read this | To understand |
|-----------|---------------|
| [[SiteMemory/00_BRIEF]] | What BeyondSite is and isn't |
| [[SiteMemory/01_CURRENT_STATE]] | What works right now / what's broken |
| [[SiteMemory/02_CONVENTIONS]] | The "six wired artifacts" rule for adding templates |
| [[SiteMemory/architecture/01_api-routes]] | Every Express endpoint in one place |
| [[SiteMemory/architecture/02_ai-fallback]] | How the AI button decides between Gemini and Groq |
| [[SiteMemory/architecture/03_chatbot]] | How the chatbot avoids burning credits on greetings |
| [[SiteMemory/architecture/04_template-system]] | How a schema becomes a rendered website |
| [[SiteMemory/architecture/05_preview-modal]] | How the hover-preview modal works |
| [[SiteMemory/decisions/ADR]] | Why we picked X over Y (20 decisions documented) |
| [[SiteMemory/changelog/CHANGELOG]] | What we shipped in each session (Round 0 → Round O) |
| [[SiteMemory/roadmap/ROADMAP]] | What's next (6 pillars, from foundations to scale) |

Code answers *what*. The vault answers *why*.

---

## Built by

An intern at [BeyondSure](https://www.beyondsure.in/) · Shrigoda TechLabs Pvt Ltd · Mumbai, India
