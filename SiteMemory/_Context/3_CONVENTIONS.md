# Coding Conventions

Concrete rules of how this codebase is organised. When adding code, match these patterns — they exist because earlier templates broke when they didn't.

## Folder layout

```
StaticWebsiteGenerator/
├── server.js                    — Express app, AI routing, payment, generate
├── package.json
├── .env                         — GEMINI_API_KEY, GROQ_API_KEY
├── public/
│   ├── index.html               — main app shell + picker (custom cursor lives here)
│   ├── login.html               — separate page (no custom cursor — uses native)
│   ├── style.css                — global styles + thumbnail card styles
│   ├── script.js                — page-flow logic
│   ├── form-renderer.js         — schema → form, mockup, hints, AI button
│   └── chatbot.js               — floating help-bot widget
├── templates/
│   ├── schemas/
│   │   ├── _base.json           — shared brand / contact / theme sections
│   │   ├── template-N.json      — per-template schemas (1–11)
│   │   ├── template-heph.json   — InsurTech SaaS / B2B distribution platform
│   │   └── template-turtlemint.json — Insurance Marketplace / POSP + consumer
│   ├── website-template-N.ejs   — per-template renderers (1–11)
│   ├── website-template-heph.ejs
│   ├── website-template-turtlemint.ejs
│   ├── preview-test.js          — local rendering harness with sample data
│   └── preview-N.html           — generated previews (run preview-test.js to refresh)
└── generated/                   — runtime output from /api/generate
```

## The "six wired artifacts" rule

Every new template requires changes in six places. Skipping any one breaks rendering, the picker, the AI button, or the preview test. In order:

1. `templates/schemas/template-N.json` — schema with sections, fields, hints.
2. `templates/website-template-N.ejs` — server-rendered HTML/CSS/JS using safe-locals.
3. `server.js` — `AI_PROMPTS['template-N']` entry for each `aiable` section, plus new field names appended to `strKeys` / `arrKeys` in `buildTemplateData()`.
4. `templates/preview-test.js` — `templateNameSample()` function, registration in `sampleFor()`, addition to `TEMPLATES` and `NAMES`, schema-driven filter array, plus the SAME `strKeys` / `arrKeys` additions as in `server.js`.
5. `public/index.html` — `<label class="template-box">` block with radio input value `template-N` and a thumbnail markup using `.tp-{name}-*` classes.
6. `public/style.css` — corresponding `.template-{name}` and `.tp-{name}-*` rules for the picker thumbnail.

When in doubt, copy a recent template (template-9 NBFC or template-turtlemint) end-to-end as a starting point.

## Schema conventions (JSON)

```jsonc
{
  "id": "template-9",
  "name": "NBFC / Lender",          // human-friendly name shown in UI
  "extends": "_base",                // pulls brand/contact/theme from _base.json
  "complianceReview": {              // optional — only for regulated templates
    "title": "Regulatory content — please have your compliance team review before publishing.",
    "body":  "..."
  },
  "sections": [
    {
      "id": "hero",                  // camelCase, used as anchor + AI_PROMPTS key
      "title": "Hero",               // sentence case, shown as section heading
      "aiable": true,                // optional — adds the ✨ AI button
      "hint": {                      // optional — renders side-gutter hint
        "label": "Short header for the hint",
        "description": "Longer explanation of what goes in this section.",
        "mockupTarget": "header"     // optional — highlights this part in the mockup
      },
      "fields": [
        { "id": "heroEyebrow", "label": "Eyebrow", "type": "text", "max": 80, "aiable": true },
        { "id": "heroSub",     "label": "Sub-headline", "type": "textarea", "rows": 3, "max": 240 },
        {
          "id": "heroBenefits", "type": "repeater", "min": 0, "max": 4, "itemLabel": "Benefit",
          "item": [
            { "id": "icon", "label": "Icon (single emoji)", "type": "text", "max": 4 },
            { "id": "text", "label": "Benefit text", "type": "text", "max": 60 }
          ]
        }
      ]
    }
  ]
}
```

**Field types:** `text`, `textarea`, `select` (uses `options: [...]`), `color`, `image`, `repeater`.

**InsurTech footer pattern** (used by `template-heph` and `template-turtlemint`): these templates include an inline `footer` section in their schema with fields `footerIrdaiNo`, `footerCin`, `footerDisclaimer`, and a `footerLinks` repeater (`label` + `url`). This is distinct from the `_base` contact/theme sections and handles IRDAI regulatory compliance inline. New insurance-related templates should follow this pattern.

**Naming:** field IDs are camelCase. Labels are sentence case. Placeholders use the literal example, not generic "enter text here".

**Hints** should describe *why* the section exists and *what* good copy looks like — not just what the field is for. Read like advice from a designer.

## EJS template conventions

Every template (except the legacy template-1) starts with this safe-locals block before `<!DOCTYPE html>`:

```ejs
<%
  const L = locals || {};
  const esc = (s) => (s == null ? '' : String(s));
  const def = (v, d) => (v && String(v).trim() ? v : d);
  const bn      = esc(L.businessName) || 'Default Business Name';
  const tagln   = esc(L.tagline)      || 'Default tagline.';
  const accent  = L.primaryColor      || '#defaultcolor';
  const year    = L.year              || new Date().getFullYear();

  // Per-section defaults — every string read is wrapped in def()
  const heroHeadlineV = def(L.heroHeadline, 'A sensible default headline');

  // Every array read uses this exact pattern with safe fallback samples
  const dishesList = (Array.isArray(L.signatureDishes) && L.signatureDishes.length)
    ? L.signatureDishes
    : [
        { name: 'Default Dish', body: '...', price: '₹680', tag: '' },
        // 3–6 more sensible defaults
      ];

  // Helpers
  function initialsOf(name) { ... }
  function parseMenuItems(raw) { ... }   // only when needed
%>
```

**Rules:**
- Every field read goes through `esc()` or `def()`. Never raw `<%= L.fieldName %>`.
- Every array has a non-empty default fallback, so the section never collapses visually.
- Visual style (palette, fonts, layout) is fixed in CSS variables at the top of `<style>`.
- No external resources except Google Fonts. No Unsplash, no third-party CDNs.
- No two templates share the same accent colour. Pick distinct palettes deliberately.
- Mobile breakpoint at 980px (tablet) and 640px (phone) consistently.

## AI prompt conventions

In `server.js`, the `AI_PROMPTS` object maps `templateId → sectionId → fn(ctx)`:

```javascript
'template-9': { // NBFC / Lender
  hero: ({biz, desc, tone}) =>
    `For RBI-registered NBFC / lender "${biz}" (${tone} tone): "${desc}". Return ONLY JSON: { "heroEyebrow":"<trust phrase, max 10 words>", "heroHeadlineLead":"<2-3 word line 1>", "heroHeadlineEmph":"<1-2 word italic emphasis>", "heroSub":"<30-45 word sub>" }`,
  // ... one entry per aiable section
}
```

**Prompt rules:**
- Always end with `Return ONLY JSON: { ... }` and an explicit shape.
- Inside the JSON shape, use angle-bracket placeholders that include word/length constraints: `"<8-12 word headline>"`, `"<20-30 word description>"`.
- For repeaters, specify count: `"with 5-6 items"`, `"with EXACTLY 4 items"`.
- Include domain examples in placeholders: `e.g. RBI Registered NBFC since 2012`.
- Keep prompts tight — long prompts cost tokens and the AI ignores them anyway.
- Same prompt must work on Gemini AND Groq (since either may handle the request via the failover chain). Don't write Gemini-specific tricks.

Sections marked `aiable: true` in the schema should have a corresponding prompt entry. If absent, the section falls through to `AI_PROMPTS.default[sectionId]`, which is generic but works for hero/about/services/process/cta.

## strKeys / arrKeys discipline

In `server.js::buildTemplateData()` and the matching block in `templates/preview-test.js`, two arrays prevent EJS `ReferenceError`:

```javascript
const strKeys = [ /* every optional string field name across all templates */ ];
const arrKeys = [ /* every repeater field name across all templates */ ];

for (const k of strKeys) if (data[k] === undefined) data[k] = '';
for (const k of arrKeys) if (!Array.isArray(data[k])) data[k] = [];
```

**Rule:** when adding a new field to any schema, append the field name to the appropriate array in BOTH files. The two files must stay in sync. Group additions under a comment like `// Round D — NBFC` for traceability.

## Sample data conventions (preview-test.js)

Each template gets a sample function:

```javascript
function nbfcSample() {
  return {
    ...commonSample,                  // pulls in shared defaults
    businessName: 'Meridian Capital',
    tagline: 'Honest lending. Transparent rates. Fast decisions.',
    _description: '...',              // used for AI prompts
    primaryColor: '#e85d2c',
    foundedYear: '2012',
    // Every schema field gets a realistic value
    heroEyebrow: '...',
    products: [ { ... }, ... ],       // realistic content, not Lorem ipsum
    // ...
  };
}
```

Then dispatched in `sampleFor()`:

```javascript
function sampleFor(templateId) {
  if (templateId === 'template-9') return nbfcSample();
  // ...
  return commonSample;
}
```

**Sample-data rules:**
- Use realistic content — real-sounding business names, real prices, real city names. NOT Lorem ipsum.
- Indian context is preferred for BFSI/Insurance/NBFC (RBI numbers, ₹ prices, Mumbai/Bangalore addresses); other templates can be global.
- Sample data IS the demo. If a customer's manager looks at the preview, the sample should look like a real business website.

## Picker thumbnail conventions

Each template's picker card lives in `public/index.html`:

```html
<label class="template-box">
  <input type="radio" name="template" value="template-9" hidden>
  <div class="template-content">
    <div class="template-preview template-nbfc">
      <!-- abstract markup, not real content. tp-nbfc-* classes -->
      <div class="tp-nbfc-topbar"></div>
      <div class="tp-nbfc-hero">...</div>
      <div class="tp-nbfc-products">...</div>
    </div>
    <div class="template-label">
      <h4>NBFC</h4>
      <p>RBI-regulated Lender</p>
    </div>
    <span class="checkmark">✓</span>
  </div>
</label>
```

Matching CSS in `public/style.css`:

```css
.template-nbfc { background: #fbf7f0; padding: 0; display: flex; flex-direction: column; }
.tp-nbfc-topbar { ... }
.tp-nbfc-hero { ... }
.tp-nbfc-products { ... }
```

**Rules:**
- Thumbnail uses **abstract markup** (coloured rectangles, monogram letters) — not screenshots, not real text.
- Class prefix is `template-{slug}` for the parent, `tp-{slug}-*` for children.
- Thumbnail must visually capture the template's identity (e.g. NBFC's compliance topbar, Restaurant's centred italic title, Portfolio's three big editorial rows).

## Naming conventions

| Thing                    | Convention                           | Example                          |
|---                       |---                                   |---                               |
| Template ID              | `template-N` (sequential) or `template-{slug}` for branded | `template-10`, `template-heph` |
| Schema file              | `template-N.json` / `template-{slug}.json`  | `template-10.json`, `template-heph.json` |
| EJS file                 | `website-template-N.ejs` / `website-template-{slug}.ejs` | `website-template-heph.ejs` |
| Sample function          | `{topic}Sample()`                     | `restaurantSample()`             |
| Picker thumbnail class   | `.template-{slug}` + `.tp-{slug}-*`  | `.template-nbfc` `.tp-nbfc-rate` |
| Field IDs                | camelCase                            | `heroHeadlineLead`               |
| CSS classes              | kebab-case                           | `compliance-banner`              |
| Server constants         | UPPER_SNAKE_CASE                     | `APP_NAME`, `PAYMENT_TTL_MS`     |
| Section IDs              | camelCase, semantic                  | `hero`, `services`, `grievance`  |
| Repeater inner field IDs | camelCase, short                     | `name`, `body`, `price`, `tag`   |

## Workflow conventions

Before any commit:

```bash
node -c server.js                      # syntax-check the server
cd templates && node preview-test.js   # render all templates with sample data
```

The preview-test must report **13/13 templates rendered cleanly**. If any template fails, fix it before continuing.

For new templates, run a content sanity grep:

```bash
grep -c -E 'YourBrandName|key1|key2' preview-N.html
```

If the count is zero, your sample data isn't surfacing through the template — usually means a missing default in the EJS or a typo in the field name.

## What NOT to do

- **Don't fetch external assets in templates.** No Unsplash, no Pinterest images, no third-party CDNs except Google Fonts. The output is meant to be a self-contained ZIP.
- **Don't add the same accent colour to two templates.** Each template's identity should be visually obvious from the picker thumbnail.
- **Don't use bare `<%= L.fieldName %>` in EJS.** Always go through `esc()` or `def()`. The whole point of the safe-locals pattern is that templates never throw.
- **Don't skip the strKeys / arrKeys updates.** The first time a customer fills in a new field with empty data, you'll get a render error from undefined.
- **Don't write Gemini-specific prompt tricks.** The same prompt must work on Groq Llama-3.3-70b. Stick to plain JSON-shape instructions.
- **Don't burn paid Gemini credits during development.** Free tier or Groq for testing; paid Gemini only after launch.
- **Don't add new pages without the custom-cursor element + script** (or alternatively scope `cursor: auto` for that page in CSS) — otherwise users get an invisible cursor like login.html had until it was patched.
- **Don't commit `node_modules/`, `generated/`, or `preview-*.html`.** Those are runtime outputs.
