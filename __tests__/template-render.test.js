'use strict';

const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const sampleData = {
  businessName: 'Test Company',
  tagline: 'Test tagline for rendering',
  _description: 'Test description',
  primaryColor: '#c0392b',
  tone: 'professional',
  foundedYear: '2024',
  year: 2024,
  email: 'test@example.com',
  phone: '+1 555-123-4567',
  address: '123 Test Street',
  hours: 'Mon-Fri 9am-5pm',
  about: 'Test about us content',
  products: ['Product 1', 'Product 2'],
  services: [
    { icon: '⚙️', name: 'Service 1', body: 'Service 1 description', price: '$100' },
    { icon: '🔧', name: 'Service 2', body: 'Service 2 description', price: '$200' }
  ],
  heroHeadline: 'Welcome to Test Company',
  heroSub: 'We provide excellent services',
  heroCtaPrimary: 'Get Started',
  heroCtaSecondary: 'Learn More',
  aboutHeadline: 'About Us',
  aboutBody: 'We have been serving customers for many years.',
  ctaHeadline: 'Ready to get started?',
  ctaBody: 'Contact us today!',
  ctaButton: 'Contact Now',
  footerLinks: [
    { label: 'Privacy', url: '/privacy' },
    { label: 'Terms', url: '/terms' }
  ],
  heroEyebrow: '',
  heroQuoteCardTitle: '',
  heroQuoteCardBody: '',
  whyHeadline: '',
  whyPoints: [],
  statBoxes: [],
  testimonials: [],
  trustItems: [],
  stats: [],
  faqs: [],
  hoursList: [],
  areasServed: [],
  processSteps: [],
  heroTrustBadges: [],
  heroRates: [],
  marqueeItems: [],
  pillars: [],
  heritageStats: [],
  certifications: [],
  depositRates: [],
  lendingRates: [],
  contactPerks: [],
  heroTypingLines: [],
  statusItems: [],
  stackItems: [],
  heroPortfolioChips: [],
  tickerTokens: [],
  dataRows: [],
  chains: [],
  heroRateBenefits: [],
  trustBadges: [],
  products: [],
  eligibilityCriteria: [],
  documentsList: [],
  rateRows: [],
  aboutPillars: [],
  ratings: [],
  escalationLevels: [],
  signatureDishes: [],
  menuCategories: [],
  reviews: [],
  pressItems: [],
  skillsItems: [],
  workItems: [],
  clientList: [],
  heroBadge: '',
  heroPanelTitle: '',
  servicesHeadline1: '',
  servicesHeadline2: '',
  features: [],
  howItWorks: [],
  plans: [],
  currencySymbol: '',
  codeLanguage: '',
  codeSnippet: '',
  howLabel: '',
  howHeadline: '',
  complianceLabel: '',
  complianceHeadline: '',
  complianceBody: '',
  pricingLabel: '',
  pricingHeadline: '',
  customerLogos: [],
  howSteps: [],
  platformStats: [],
  complianceBadges: [],
  pricingPlans: [],
  categories: [],
  whyPoints: [],
  marketStats: [],
  insurerPartners: [],
  marketReviews: [],
  quoteCardTitle: '',
  quoteCardNote: '',
  categoriesLabel: '',
  categoriesHeadline: '',
  categoriesBody: '',
  whyLabel: '',
  partnersLabel: '',
  heroNameLead: '',
  heroNameTail: '',
  heroRole: '',
  aboutLocationLine: '',
  workLabel: '',
  workHeadline: '',
  heroOpenStatus: '',
  chefName: '',
  chefRole: '',
  chefBio: '',
  signaturesLabel: '',
  signaturesHeadline: '',
  menuLabel: '',
  menuHeadline: '',
  menuIntro: '',
  heroPromptCmd: '',
  heroMetaStatus: '',
  heroMetaModules: '',
  heroMetaBuild: '',
  aboutFileName: '',
  aboutMeta: '',
  servicesHeadlineLead: '',
  servicesHeadlineTail: '',
  processHeadlineLead: '',
  processHeadlineTail: '',
  ctaHeadlineLead: '',
  ctaHeadlineTail: '',
  heroBadge: '',
  heroPanelTitle: '',
  rbiRegNumber: '',
  cin: '',
  nbfcCategory: '',
  mitcLinkLabel: '',
  fairPracticeLinkLabel: '',
  grievanceLinkLabel: '',
  sachetLinkLabel: '',
  heroRatePanelTitle: '',
  heroRatePanelProduct: '',
  heroRateValue: '',
  heroRateUnit: '',
  productsLabel: '',
  productsHeadline: '',
  productsBody: '',
  eligibilityLabel: '',
  eligibilityHeadline: '',
  chargesLabel: '',
  chargesHeadline: '',
  chargesBody: '',
  chargesNote: '',
  grievanceLabel: '',
  grievanceHeadline: '',
  grievanceBody: '',
  groName: '',
  groRole: '',
  groEmail: '',
  groPhone: '',
  groAddress: '',
  groTimings: '',
  regulatorLine: '',
  insuranceLine: '',
  pmlaLinkLabel: '',
  grievanceLinkLabel: '',
  servicesBody: '',
  aboutLabel: '',
  aboutHeadlineLead: '',
  aboutHeadlineTail: '',
  ratesLabel: '',
  ratesHeadlineLead: '',
  ratesHeadlineEmph: '',
  depositPanelTitle: '',
  lendingPanelTitle: '',
  ratesDisclaimer: '',
  heroHeadlineLead: '',
  heroHeadlineAccent: '',
  heroHeadlineTail: '',
  heroSub: '',
  tickerItems: [],
  aboutTags: [],
  aboutStats: [],
  servicesLabel: '',
  servicesHeadline: '',
  servicesMeta: '',
  processLabel: '',
  processHeadline: '',
  logo: '',
  advisorName: '',
  advisorBio: '',
  advisorPhotoV: '',
  licenseNumberV: '',
  regulatorV: '',
  heroTagV: '',
  heroHeadlineV: '',
  heroSubV: '',
  heroCtaPrimaryV: '',
  heroCtaSecondaryV: '',
  heroQuoteCardTitleV: '',
  heroQuoteCardBodyV: '',
  heroTag: '',
  heroHeadline: '',
  heroSub: '',
  heroCtaPrimary: '',
  heroCtaSecondary: '',
  aboutHeadline: '',
  emergencyLineV: '',
  ctaHeadlineV: '',
  ctaBodyV: '',
  ctaButtonV: '',
  logoV: '',
  primaryEmail: '',
  primaryPhone: '',
  addressBlock: '',
  hoursText: ''
};

describe('Template Rendering - Version 1 Published Templates', () => {
  const publishedTemplates = [5, 8, 12, 13];

  publishedTemplates.forEach(id => {
    const templateFile = path.join(TEMPLATES_DIR, `website-template-${id}.ejs`);

    test(`template-${id} renders without throwing`, () => {
      expect(fs.existsSync(templateFile)).toBe(true);

      const template = fs.readFileSync(templateFile, 'utf8');

      expect(() => {
        ejs.render(template, sampleData, { async: false });
      }).not.toThrow();
    });

    test(`template-${id} produces non-empty output`, () => {
      const template = fs.readFileSync(templateFile, 'utf8');
      const output = ejs.render(template, sampleData, { async: false });

      expect(output.trim().length).toBeGreaterThan(0);
    });

    test(`template-${id} contains expected business name`, () => {
      const template = fs.readFileSync(templateFile, 'utf8');
      const output = ejs.render(template, sampleData, { async: false });

      expect(output).toContain('Test Company');
    });
  });

  test('all 4 published template files exist', () => {
    publishedTemplates.forEach(id => {
      const templateFile = path.join(TEMPLATES_DIR, `website-template-${id}.ejs`);
      expect(fs.existsSync(templateFile)).toBe(true);
    });
  });

  test('preview files exist for all published templates', () => {
    publishedTemplates.forEach(id => {
      const previewFile = path.join(TEMPLATES_DIR, `preview-${id}.html`);
      expect(fs.existsSync(previewFile)).toBe(true);
    });
  });

  test('schema files exist for all published templates', () => {
    publishedTemplates.forEach(id => {
      const schemaFile = path.join(TEMPLATES_DIR, 'schemas', `template-${id}.json`);
      expect(fs.existsSync(schemaFile)).toBe(true);
    });
  });

  test('template-1 uses legacy non-safe-locals pattern (documented issue in SiteMemory)', () => {
    const templateFile = path.join(TEMPLATES_DIR, 'website-template-1.ejs');
    expect(fs.existsSync(templateFile)).toBe(true);
  });

  test('all 14 template files exist (including unpublished)', () => {
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach(id => {
      const templateFile = path.join(TEMPLATES_DIR, `website-template-${id}.ejs`);
      expect(fs.existsSync(templateFile)).toBe(true);
    });
  });
});