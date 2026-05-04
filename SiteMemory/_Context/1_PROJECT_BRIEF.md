# Project Overview

**WebSite Builder** is a no-code generator that lets users create professional business websites across 11 industries. The flow is: pick a template → fill a schema-driven form (with optional ✨ AI suggestions per section) → preview the rendered site → pay a one-time $9 fee → download a self-contained ZIP of static HTML/CSS/JS the user can host anywhere.

The catalogue currently spans **Editorial, Agency-Noir, Terminal/Dev Studio, Web3/Protocol, Local Service, BFSI/Banking, Startup/SaaS, Insurance Advisor, NBFC/Lender, Restaurant/Café, Portfolio/Freelancer, InsurTech SaaS (Heph style), and Insurance Marketplace (Turtlemint style)** — 13 templates total. Four of those (BFSI, Insurance, NBFC, and both new InsurTech templates) include India-specific regulatory disclosures — RBI registration numbers, IRDAI licences, Fair Practice Code, full Grievance Redressal escalation matrix, RBI Sachet portal links — which is the catalogue's commercial differentiator vs. generic site builders like Wix or Squarespace.

The two newest templates use slug-based IDs (`template-heph`, `template-turtlemint`) rather than the sequential `template-N` pattern. `template-heph` targets B2B InsurTech / distribution API platforms (dark navy, enterprise tone); `template-turtlemint` targets consumer + advisor insurance marketplaces (light mode, three action cards, advisor acquisition section).

A scope-locked help chatbot guides users through the form. Project is being built solo by an intern at a company that requested a "business-scalable" tool. Currently in active development on free-tier APIs; paid tier is reserved as the final pre-launch step.

## Tech Stack & Rules

* **Language/Framework:** Node.js + Express 5; EJS server-rendered templates; vanilla JavaScript frontend (no React, no build step, no bundler).
* **Key Libraries:**
  * `@google/generative-ai` — Gemini 2.5 Flash (primary AI)
  * `axios` — Groq API for fallback AI (`llama-3.3-70b-versatile`) and chatbot
  * `ejs` — template rendering
  * `archiver` — ZIP generation for downloads
  * `multer` — image uploads
  * `express-rate-limit` — per-route limiting (separate limits for AI, downloads, payments, chat)
  * `dotenv` — config (`GEMINI_API_KEY`, `GROQ_API_KEY`)
* **Strict Rules:**
  * Every new template requires **six wired artifacts**: schema JSON, EJS file, `AI_PROMPTS` entry in `server.js`, sample-data function in `preview-test.js`, picker card in `public/index.html`, thumbnail CSS in `public/style.css`. Skipping any one breaks rendering or the picker.
  * All EJS templates use the **safe-locals pattern**: top of file declares `const L = locals || {}; const esc = (s) => ...; const def = (v, d) => ...;` and reads every field through these helpers so the template never throws on undefined data.
  * Every new **string field** added to a schema must be appended to `strKeys` in `server.js::buildTemplateData()` AND mirrored in `templates/preview-test.js`. Same rule for **repeater/array fields** → `arrKeys`. This is what prevents `ReferenceError` during render.
  * Schemas extend `_base` for shared brand / contact / theme sections (`"extends": "_base"`). Section IDs marked `aiable: true` get the ✨ AI button.
  * **AI prompts must return JSON only.** Each per-template prompt in `AI_PROMPTS` ends with `Return ONLY JSON: { ... }`. Server-side `extractJSON()` helper strips markdown fences and finds the first balanced `{...}` block to handle stray prose.
  * Regulatory templates (BFSI, Insurance, NBFC) carry a `complianceReview` block at the top of their schema. Form-renderer surfaces an amber warning banner above the form when present, reminding the user that AI-generated regulatory copy is a draft only.
  * **No external resource fetches in templates** — no Unsplash, no third-party CDNs except Google Fonts. Visual richness comes from CSS, gradients, custom SVGs, and decorative typography (monogram letters where photo placeholders would otherwise go).
  * Template colour palettes must be **visually distinct** across the catalogue — no two templates share the same primary accent. Cream+burgundy (Restaurant), navy+gold (BFSI), cream+teal+orange (NBFC), pure black/white (Portfolio), CRT green (Terminal), cyan dark (Web3), etc.
  * **Chatbot uses two layers**: a client-side local-intent matcher (greetings, thanks, identity, capabilities, goodbyes, compliments, etc.) handles social messages without API spend; only substantive questions hit Groq. Server-side system prompt is strict scope-lock to the builder.
  * **Free-tier APIs only during testing.** Paid Gemini subscription is the FINAL pre-launch step. Don't burn paid credits on demo iterations.
  * Before any commit: `node preview-test.js` from `templates/` must render all templates clean (currently 11/11 ✓).
