'use strict';

const fs   = require('fs');
const path = require('path');

// Project root — this file lives at src/lib/utils.js so go up two levels.
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// ── JSON extractor ──────────────────────────────────────────────────────────
// Handles markdown fences and leading/trailing prose returned by AI providers.
function extractJSON(text) {
  if (!text) throw new Error('Empty response from AI');
  let t = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  if (!/^[\[{]/.test(t)) {
    const m = t.match(/[{[][\s\S]*[}\]]/);
    if (m) t = m[0];
  }
  return JSON.parse(t);
}

// ── Template file resolver ──────────────────────────────────────────────────
// Sanitises the slug and falls back to template-1 if the file doesn't exist.
function templatePath(templateId) {
  const safe = (templateId || 'template-1').replace(/[^a-z0-9\-]/gi, '');
  const file = path.join(PROJECT_ROOT, 'templates', `website-${safe}.ejs`);
  return fs.existsSync(file)
    ? file
    : path.join(PROJECT_ROOT, 'templates', 'website-template-1.ejs');
}

// ── Template data normaliser ────────────────────────────────────────────────
// Turns the raw form payload into the shape all EJS templates expect.
// Every field gets a safe default so templates never throw ReferenceError.
function buildTemplateData(payload = {}) {
  const data = { ...payload };

  data.businessName = (data.businessName || '').trim();
  data.tagline      = (data.tagline      || '').trim();
  data._description = (data._description || '').trim();

  data.primaryColor = data.primaryColor || '#c0392b';
  data.tone         = data.tone         || 'professional';
  data.foundedYear  = data.foundedYear  || '';
  data.logo         = data.logo         || '';
  data.year         = new Date().getFullYear();

  data.about    = data.about    || data.aboutBody    || '';
  data.products = Array.isArray(data.products)
    ? data.products
    : (data.products || '').split(',').map(s => s.trim()).filter(Boolean);

  data.email   = data.email   || data.primaryEmail || '';
  data.phone   = data.phone   || data.primaryPhone || '';
  data.address = data.address || data.addressBlock || '';
  data.hours   = data.hours   || data.hoursText    || '';

  data.footerIrdaiNo    = data.footerIrdaiNo    || '';
  data.footerCin        = data.footerCin        || '';
  data.footerDisclaimer = data.footerDisclaimer || '';
  if (!Array.isArray(data.footerLinks)) data.footerLinks = [];

  const strKeys = [
    'heroEyebrow','heroDeck','heroPullQuote','aboutHeadline','aboutBody',
    'ctaHeadline','ctaBody','ctaButton','accent','currency',
    'heroEyebrowV','heroHeadlineV','heroSubV','heroCtaPrimaryV','heroCtaSecondaryV',
    'heroQuoteCardTitleV','heroQuoteCardBodyV','heroTagV','heroBadgeV','heroShotV',
    'aboutHeadlineV','aboutBodyV','emergencyLineV','ctaHeadlineV','ctaBodyV','ctaButtonV',
    'advisorNameV','advisorBioV','advisorPhotoV','whyHeadlineV','licenseNumberV','regulatorV',
    'logoV','primaryEmail','primaryPhone','addressBlock','hoursText',
    'bn','tag',
    'heroHeadlineLead','heroHeadlineAccent','heroHeadlineTail','heroSub',
    'heroCtaPrimary','heroCtaSecondary',
    'aboutHeadlineLead','aboutHeadlineTail',
    'servicesLabel','servicesHeadline','servicesMeta',
    'processLabel','processHeadline',
    'regulatorLine','insuranceLine','pmlaLinkLabel','grievanceLinkLabel',
    'heroHeadlineBody','heroHeadlineEmph',
    'ratesPanelTitle','ratesPanelFooter',
    'servicesBody',
    'aboutLabel','aboutHeadlineEmph',
    'ratesLabel','ratesHeadlineLead','ratesHeadlineEmph',
    'depositPanelTitle','lendingPanelTitle','ratesDisclaimer',
    'heroPromptCmd','heroMetaStatus','heroMetaModules','heroMetaBuild',
    'aboutFileName','aboutMeta',
    'servicesHeadlineLead','servicesHeadlineTail',
    'processHeadlineLead','processHeadlineTail',
    'ctaHeadlineLead','ctaHeadlineTail',
    'heroBadge','heroPanelTitle',
    'servicesHeadline1','servicesHeadline2',
    'aboutQuoteLine1','aboutQuoteAccent1','aboutQuoteLine2','aboutQuoteLine3',
    'aboutQuoteAccent2','aboutQuoteTail','aboutCtaText',
    'chainsLabel',
    'testimonialsLabel','testimonialsRating',
    'ctaEyebrow','ctaHeadlineAccent','ctaNote',
    'rbiRegNumber','cin','nbfcCategory',
    'mitcLinkLabel','fairPracticeLinkLabel','sachetLinkLabel',
    'heroRatePanelTitle','heroRatePanelProduct','heroRateValue','heroRateUnit',
    'productsLabel','productsHeadline','productsBody',
    'eligibilityLabel','eligibilityHeadline',
    'chargesLabel','chargesHeadline','chargesBody','chargesNote',
    'grievanceLabel','grievanceHeadline','grievanceBody',
    'groName','groRole','groEmail','groPhone','groAddress','groTimings',
    'heroOpenStatus',
    'chefName','chefRole','chefBio',
    'signaturesLabel','signaturesHeadline',
    'menuLabel','menuHeadline','menuIntro',
    'ctaPhone',
    'heroNameLead','heroNameTail','heroRole',
    'aboutLocationLine',
    'workLabel','workHeadline',
    'codeLanguage','codeSnippet',
    'howLabel','howHeadline',
    'complianceLabel','complianceHeadline','complianceBody',
    'pricingLabel','pricingHeadline',
    'categoriesLabel','categoriesHeadline','categoriesBody',
    'whyLabel'
  ];
  for (const k of strKeys) if (data[k] === undefined) data[k] = '';

  const arrKeys = [
    'services','processSteps','values','testimonials','trustItems','stats','hoursList',
    'faqs','areasServed','logos','features','howItWorks','plans','policies','whyPoints',
    'statBoxes','credentials','claimSteps',
    'tickerItems','aboutTags','aboutStats','numberStats',
    'heroTrustBadges','heroRates','marqueeItems','pillars',
    'heritageStats','certifications','depositRates','lendingRates','contactPerks',
    'heroTypingLines','statusItems','stackItems',
    'heroPortfolioChips','tickerTokens','dataRows','chains',
    'heroRateBenefits','trustBadges','products',
    'eligibilityCriteria','documentsList','rateRows','aboutPillars',
    'ratings','escalationLevels',
    'signatureDishes','menuCategories','reviews','pressItems',
    'skillsItems','workItems','clientList',
    'customerLogos','howSteps','platformStats','complianceBadges','pricingPlans',
    'categories','whyPoints','insurerPartners','marketReviews'
  ];
  for (const k of arrKeys) if (!Array.isArray(data[k])) data[k] = [];

  return data;
}

module.exports = { extractJSON, templatePath, buildTemplateData };
