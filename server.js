const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const ejsLib = require('ejs');
const archiver = require('archiver');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Uploads (generalized) ───────────────────────────────
const uploadDir = path.join(__dirname, 'public', 'uploads', 'images');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`);
  }
});
const imageUpload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB; per-field limits enforced client-side
  fileFilter: (_, file, cb) => {
    const ok = ['image/png','image/jpeg','image/svg+xml','image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Only PNG, JPG, SVG, or WebP allowed'), ok);
  }
});

// ── Rate limits ─────────────────────────────────────────
const aiLimiter  = rateLimit({ windowMs: 60*60*1000, max: 15, message: { error: 'Too many AI requests.' } });
const genLimiter = rateLimit({ windowMs: 60*60*1000, max: 10, message: { error: 'Too many downloads.' } });
const payLimiter = rateLimit({ windowMs: 60*60*1000, max: 20, message: { error: 'Too many payment attempts.' } });

// ── Login (still hardcoded — auth milestone later) ──────
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@example.com' && password === 'password123') return res.json({ success: true, redirect: '/' });
  res.status(401).json({ error: 'Invalid email or password.' });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── Schema endpoint (base + template merge) ─────────────
function readSchema(id) {
  const file = path.join(__dirname, 'templates', 'schemas', `${id}.json`);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; }
}

// Merge base sections with template sections.
// If the template defines `"extends": "_base"`, pull _base.json.
// Section order: brand (base) → all template sections → contact + theme (base trailing).
function composeSchema(template) {
  if (!template) return null;
  if (!template.extends) return template;
  const base = readSchema(template.extends);
  if (!base) return template;
  const baseById = Object.fromEntries((base.sections || []).map(s => [s.id, s]));
  const tplIds  = new Set((template.sections || []).map(s => s.id));
  // If template redefines a base section, template wins.
  const leading  = ['brand'].filter(id => baseById[id] && !tplIds.has(id)).map(id => baseById[id]);
  const trailing = ['contact','theme'].filter(id => baseById[id] && !tplIds.has(id)).map(id => baseById[id]);
  return { ...template, sections: [...leading, ...(template.sections || []), ...trailing] };
}

app.get('/api/schema/:templateId', (req, res) => {
  const id = req.params.templateId.replace(/[^a-z0-9\-]/gi, '');
  const tpl = readSchema(id);
  if (!tpl) return res.status(404).json({ error: 'Schema not found' });
  res.json(composeSchema(tpl));
});

// ── Generalized image upload ────────────────────────────
app.post('/api/upload-image', imageUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/images/${req.file.filename}`, filename: req.file.filename, size: req.file.size });
});

// Back-compat alias — old client builds still use this route / field name.
app.post('/api/upload-logo', imageUpload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/images/${req.file.filename}`, filename: req.file.filename, size: req.file.size });
});

// ── Guards ──────────────────────────────────────────────
function validDescription(desc) {
  if (!desc || typeof desc !== 'string') return 'Description required';
  const t = desc.trim();
  if (t.length < 20) return 'Description too short (min 20 chars)';
  if (t.length > 1000) return 'Description too long (max 1000 chars)';
  return null;
}

// ── Per-template, per-section AI prompts ────────────────
// Shape: prompts[templateId][sectionId] → prompt builder. Falls back to `default`.
function bld(biz, desc, tone) { return { biz: biz || 'this business', desc, tone: tone || 'professional' }; }

const AI_PROMPTS = {
  default: {
    hero:    ({biz,desc,tone}) => `For business "${biz}" (${tone} tone): "${desc}". Return ONLY JSON: { "heroEyebrow": "<3-4 word label>", "heroDeck": "<30-45 word intro>", "heroPullQuote": "<punchy 15-word quote, no attribution>" }`,
    services:({biz,desc})       => `For business "${biz}": "${desc}". Return ONLY JSON: { "services": [{"name":"<short>","body":"<20-30 word description>"}] } with 4-6 items.`,
    process: ({biz,desc,tone})  => `For business "${biz}" (${tone}): "${desc}". Return ONLY JSON: { "processSteps": [{"title":"<3 word step>","body":"<20-25 word body>"}] } with exactly 4 items.`,
    about:   ({biz,desc,tone})  => `For business "${biz}" (${tone}): "${desc}". Return ONLY JSON: { "aboutHeadline": "<6-10 word headline>", "aboutBody": "<80-120 word story>", "values": [{"text":"<12-18 word value>"}] } with 4-5 values.`,
    cta:     ({biz,desc})       => `For business "${biz}": "${desc}". Return ONLY JSON: { "ctaHeadline": "<8-12 word headline>", "ctaBody": "<15-20 word support line>", "ctaButton": "<2-3 word button>" }`
  },
  'template-5': { // Local Service
    hero:    ({biz,desc,tone}) => `For local service business "${biz}" (${tone} tone): "${desc}". Return ONLY JSON: { "heroEyebrow":"<trust phrase max 6 words, e.g. Trusted locally since 2015>", "heroHeadline":"<8-12 word outcome-focused headline>", "heroSub":"<25-35 word sub that names the service + area>", "heroCtaPrimary":"<2-4 word primary button>", "heroCtaSecondary":"<2-4 word secondary button>", "heroQuoteCardTitle":"<4-6 word card title e.g. Licensed. Insured. Local.>", "heroQuoteCardBody":"<25-35 word reassurance quote>" }`,
    services:({biz,desc})       => `For local service business "${biz}": "${desc}". Return ONLY JSON: { "services":[{"icon":"<1 emoji>","name":"<short service>","body":"<20-30 word description>","price":"<e.g. From $99 or empty string>"}] } with 4-6 items.`,
    about:   ({biz,desc,tone})  => `For local service business "${biz}" (${tone}): "${desc}". Return ONLY JSON: { "aboutHeadline":"<6-10 word headline>", "aboutBody":"<90-130 word story emphasizing local roots, craftsmanship, trust>", "emergencyLine":"<short emergency availability line or empty string>" }`,
    faq:     ({biz,desc})       => `For local service business "${biz}": "${desc}". Return ONLY JSON: { "faqs":[{"q":"<common customer question>","a":"<40-60 word answer>"}] } with 4-5 items.`,
    cta:     ({biz,desc})       => `For local service business "${biz}": "${desc}". Return ONLY JSON: { "ctaHeadline":"<8-12 word headline nudging to call/quote>", "ctaBody":"<15-20 word line>", "ctaButton":"<2-3 word button e.g. Get Free Quote>" }`
  },
  'template-7': { // Startup / SaaS
    hero:    ({biz,desc,tone}) => `For SaaS product "${biz}" (${tone} tone): "${desc}". Return ONLY JSON: { "heroBadge":"<short badge e.g. NEW · Series A>", "heroHeadline":"<outcome-driven 8-12 word headline>", "heroSub":"<25-35 word sub explaining who it's for + key benefit>", "heroCtaPrimary":"<2-3 word primary e.g. Start free>", "heroCtaSecondary":"<2-3 word secondary e.g. Book a demo>" }`,
    features:({biz,desc})       => `For SaaS product "${biz}": "${desc}". Return ONLY JSON: { "features":[{"title":"<short feature name>","body":"<20-30 word benefit description>","metric":"<optional short metric e.g. 2.4x faster or empty string>"}] } with 4-6 items.`,
    howItWorks:({biz,desc,tone})=> `For SaaS product "${biz}" (${tone}): "${desc}". Return ONLY JSON: { "howItWorks":[{"title":"<3-5 word step>","body":"<20-25 word step body>"}] } with exactly 4 items starting from signup through outcome.`,
    cta:     ({biz,desc})       => `For SaaS product "${biz}": "${desc}". Return ONLY JSON: { "ctaHeadline":"<8-12 word headline with clear action>", "ctaBody":"<15-20 word supporting line>", "ctaButton":"<2-3 word button e.g. Start free trial>" }`
  },
  'template-8': { // Insurance Advisor
    hero:    ({biz,desc,tone}) => `For insurance advisor "${biz}" (${tone} tone): "${desc}". Return ONLY JSON: { "heroEyebrow":"<trust phrase max 6 words>", "heroHeadline":"<8-12 word headline about protecting families / assets>", "heroSub":"<25-35 word sub about personalized policies>", "heroCtaPrimary":"<2-4 word primary e.g. Get Free Quote>", "heroCtaSecondary":"<2-4 word secondary e.g. Call Advisor>", "heroQuoteCardTitle":"<4-6 word card title>", "heroQuoteCardBody":"<20-30 word reassurance line>" }`,
    policies:({biz,desc})       => `For insurance advisor "${biz}": "${desc}". Return ONLY JSON: { "policies":[{"icon":"<1 emoji from 🛡 🏠 🚗 ❤️ ✈️ 💼>","name":"<policy name>","body":"<20-30 word description>"}] } with 4-6 items.`,
    whyChoose:({biz,desc,tone}) => `For insurance advisor "${biz}" (${tone}): "${desc}". Return ONLY JSON: { "whyHeadline":"<6-10 word section headline>", "whyPoints":[{"text":"<12-20 word differentiator>"}] } with 5-6 points focusing on credentials, claim support, personalization, local presence.`,
    advisor: ({biz,desc,tone})  => `For insurance advisor named/brand "${biz}" (${tone}): "${desc}". Return ONLY JSON: { "advisorBio":"<100-140 word third-person bio emphasizing experience, certifications, families served>" }`,
    claimProcess:({biz,desc})   => `For insurance advisor "${biz}": "${desc}". Return ONLY JSON: { "claimSteps":[{"title":"<3 word step>","body":"<20-25 word body>"}] } with exactly 4 items from intimation to payout.`
  }
};

function pickPrompt(templateId, sectionId, ctx) {
  const byTpl = AI_PROMPTS[templateId] || {};
  const fn = byTpl[sectionId] || (AI_PROMPTS.default[sectionId]);
  if (!fn) return null;
  return fn(ctx);
}

// ── Per-section AI ──────────────────────────────────────
app.post('/api/ai-section', aiLimiter, async (req, res) => {
  try {
    const { templateId, sectionId, businessName, description, tone = 'professional' } = req.body;
    const descErr = validDescription(description);
    if (descErr) return res.status(400).json({ error: descErr });
    if (!sectionId) return res.status(400).json({ error: 'sectionId required' });

    const prompt = pickPrompt(templateId || 'default', sectionId, bld(businessName, description, tone));
    if (!prompt) return res.status(400).json({ error: `No AI prompt for section "${sectionId}"` });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    let retries = 3;
    while (retries > 0) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        return res.json(JSON.parse(text));
      } catch (err) {
        if (err.status === 503 && retries > 1) { retries--; await new Promise(r => setTimeout(r, 2000)); }
        else throw err;
      }
    }
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── DUMMY PAYMENTS ──────────────────────────────────────
// Stored in memory — replace with Stripe/Razorpay webhook store later.
const payments = new Map(); // paymentId -> { amount, usedAt, createdAt }
const PAYMENT_TTL_MS = 30 * 60 * 1000;

app.post('/api/pay', payLimiter, (req, res) => {
  const { amount = 9, currency = 'USD' } = req.body || {};
  const paymentId = 'pay_' + crypto.randomBytes(8).toString('hex');
  payments.set(paymentId, { amount, currency, createdAt: Date.now(), usedAt: null });
  console.log(`💰 (dummy) payment ${paymentId} for ${currency} ${amount}`);
  res.json({ paymentId, amount, currency, status: 'succeeded' });
});

function consumePayment(paymentId) {
  const p = payments.get(paymentId);
  if (!p) return { ok: false, reason: 'Invalid payment' };
  if (p.usedAt)  return { ok: false, reason: 'Payment already used' };
  if (Date.now() - p.createdAt > PAYMENT_TTL_MS) return { ok: false, reason: 'Payment expired' };
  p.usedAt = Date.now();
  return { ok: true };
}

// ── Render helpers ──────────────────────────────────────
function templatePath(templateId) {
  const safe = (templateId || 'template-1').replace(/[^a-z0-9\-]/gi, '');
  const file = path.join(__dirname, 'templates', `website-${safe}.ejs`);
  return fs.existsSync(file) ? file : path.join(__dirname, 'templates', 'website-template-1.ejs');
}

// Normalize form payload into the shape EJS templates expect. Safe defaults everywhere
// so templates can render even when fields are empty.
function buildTemplateData(payload = {}) {
  const data = { ...payload };
  // Top-form meta
  data.businessName = (data.businessName || '').trim();
  data.tagline      = (data.tagline || '').trim();
  data._description = (data._description || '').trim();
  // Brand/theme defaults
  data.primaryColor = data.primaryColor || '#c0392b';
  data.tone         = data.tone || 'professional';
  data.foundedYear  = data.foundedYear || '';
  data.logo         = data.logo || '';
  // Year (used in all template footers)
  data.year = new Date().getFullYear();
  // Legacy fields used by templates 2/3/4/6 which still read these directly
  data.about    = data.about    || data.aboutBody    || '';
  data.products = Array.isArray(data.products)
    ? data.products
    : (data.products || '').split(',').map(s => s.trim()).filter(Boolean);
  // Contact defaults
  data.email   = data.email   || data.primaryEmail || '';
  data.phone   = data.phone   || data.primaryPhone || '';
  data.address = data.address || data.addressBlock || '';
  data.hours   = data.hours   || data.hoursText    || '';
  // Repeater defaults (never undefined inside EJS)
  // Optional string content fields — default to '' so EJS never throws ReferenceError
  const strKeys = [
    'heroEyebrow','heroDeck','heroPullQuote','aboutHeadline','aboutBody',
    'ctaHeadline','ctaBody','ctaButton','accent','currency',
    // V-suffix fields used by templates 5/7/8
    'heroEyebrowV','heroHeadlineV','heroSubV','heroCtaPrimaryV','heroCtaSecondaryV',
    'heroQuoteCardTitleV','heroQuoteCardBodyV','heroTagV','heroBadgeV','heroShotV',
    'aboutHeadlineV','aboutBodyV','emergencyLineV','ctaHeadlineV','ctaBodyV','ctaButtonV',
    'advisorNameV','advisorBioV','advisorPhotoV','whyHeadlineV','licenseNumberV','regulatorV',
    'logoV','primaryEmail','primaryPhone','addressBlock','hoursText',
    'bn','tag','accent'
  ];
  for (const k of strKeys) if (data[k] === undefined) data[k] = '';

  const arrKeys = ['services','processSteps','values','testimonials','trustItems','stats','hoursList',
                   'faqs','areasServed','logos','features','howItWorks','plans','policies','whyPoints',
                   'statBoxes','credentials','claimSteps'];
  for (const k of arrKeys) if (!Array.isArray(data[k])) data[k] = [];
  return data;
}

// Preview (no payment, renders HTML only)
app.post('/api/preview', async (req, res) => {
  try {
    const { template, data = {} } = req.body || {};
    const tplFile = templatePath(template);
    const html = await ejsLib.renderFile(tplFile, buildTemplateData(data), { async: true });
    res.type('html').send(html);
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Download (payment-gated, zips the rendered index.html + any uploaded assets)
app.post('/api/generate', genLimiter, async (req, res) => {
  try {
    const { template, data = {}, paymentId } = req.body || {};
    if (!paymentId) return res.status(402).json({ error: 'Payment required' });
    const gate = consumePayment(paymentId);
    if (!gate.ok) return res.status(402).json({ error: gate.reason });

    const tplFile = templatePath(template);
    const normalized = buildTemplateData(data);
    const html = await ejsLib.renderFile(tplFile, normalized, { async: true });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${(normalized.businessName || 'website').replace(/[^a-z0-9\-]/gi,'_')}.zip"`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', e => { console.error(e); try { res.end(); } catch {} });
    archive.pipe(res);
    archive.append(html, { name: 'index.html' });

    // Bundle any referenced uploads under /uploads/ so the ZIP is self-contained.
    const seen = new Set();
    const walk = v => {
      if (!v) return;
      if (typeof v === 'string' && v.startsWith('/uploads/')) {
        if (seen.has(v)) return;
        seen.add(v);
        const abs = path.join(__dirname, 'public', v);
        if (fs.existsSync(abs)) archive.file(abs, { name: v.replace(/^\//, '') });
      } else if (Array.isArray(v)) v.forEach(walk);
      else if (typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(normalized);

    archive.finalize();
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));