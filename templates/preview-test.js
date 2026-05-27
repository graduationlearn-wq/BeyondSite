// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// preview-test.js
// Renders every template with realistic sample data and writes
// individual preview-N.html files used by the hover-preview modal.
//
// Usage:  cd templates && node preview-test.js
//         Run this after adding or modifying any template.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ejs = require('ejs');
const fs  = require('fs');
const path = require('path');

// â”€â”€ Normalization (mirrors server.js::buildTemplateData) â”€â”€â”€â”€â”€â”€â”€
function buildTemplateData(payload = {}) {
  const data = { ...payload };
  data.businessName = (data.businessName || '').trim();
  data.tagline      = (data.tagline || '').trim();
  data._description = (data._description || '').trim();
  data.primaryColor = data.primaryColor || '#c0392b';
  data.tone         = data.tone || 'professional';
  data.foundedYear  = data.foundedYear || '';
  data.logo         = data.logo || '';
  data.year         = new Date().getFullYear();
  data.about        = data.about || data.aboutBody || '';
  data.products     = Array.isArray(data.products)
    ? data.products
    : (data.products || '').split(',').map(s => s.trim()).filter(Boolean);
  data.email   = data.email   || data.primaryEmail || '';
  data.phone   = data.phone   || data.primaryPhone || '';
  data.address = data.address || data.addressBlock || '';
  data.hours   = data.hours   || data.hoursText    || '';

  const strKeys = [
    'heroEyebrow','heroDeck','heroPullQuote','aboutHeadline','aboutBody',
    'ctaHeadline','ctaBody','ctaButton','accent','currency',
    'heroEyebrowV','heroHeadlineV','heroSubV','heroCtaPrimaryV','heroCtaSecondaryV',
    'heroQuoteCardTitleV','heroQuoteCardBodyV','heroTagV','heroBadgeV','heroShotV',
    'aboutHeadlineV','aboutBodyV','emergencyLineV','ctaHeadlineV','ctaBodyV','ctaButtonV',
    'advisorNameV','advisorBioV','advisorPhotoV','whyHeadlineV','licenseNumberV','regulatorV',
    'logoV','primaryEmail','primaryPhone','addressBlock','hoursText',
    'bn','tag',
    // Round B â€” Agency (template-2)
    'heroHeadlineLead','heroHeadlineAccent','heroHeadlineTail','heroSub',
    'heroCtaPrimary','heroCtaSecondary',
    'aboutHeadlineLead','aboutHeadlineTail',
    'servicesLabel','servicesHeadline','servicesMeta',
    'processLabel','processHeadline',
    // Round B â€” BFSI (template-6)
    'regulatorLine','insuranceLine','pmlaLinkLabel','grievanceLinkLabel',
    'heroHeadlineBody','heroHeadlineEmph',
    'ratesPanelTitle','ratesPanelFooter',
    'servicesBody',
    'aboutLabel','aboutHeadlineEmph',
    'ratesLabel','ratesHeadlineLead','ratesHeadlineEmph',
    'depositPanelTitle','lendingPanelTitle','ratesDisclaimer',
    // Round C â€” Terminal (template-3)
    'heroPromptCmd','heroMetaStatus','heroMetaModules','heroMetaBuild',
    'aboutFileName','aboutMeta',
    'servicesHeadlineLead','servicesHeadlineTail',
    'processHeadlineLead','processHeadlineTail',
    'ctaHeadlineLead','ctaHeadlineTail',
    // Round C â€” Web3 (template-4)
    'heroBadge','heroPanelTitle',
    'servicesHeadline1','servicesHeadline2',
    'aboutQuoteLine1','aboutQuoteAccent1','aboutQuoteLine2','aboutQuoteLine3','aboutQuoteAccent2','aboutQuoteTail','aboutCtaText',
    'chainsLabel',
    'testimonialsLabel','testimonialsRating',
    'ctaEyebrow','ctaHeadlineAccent','ctaNote',
    // Round D â€” NBFC (template-9)
    'rbiRegNumber','cin','nbfcCategory',
    'mitcLinkLabel','fairPracticeLinkLabel','sachetLinkLabel',
    'heroRatePanelTitle','heroRatePanelProduct','heroRateValue','heroRateUnit',
    'productsLabel','productsHeadline','productsBody',
    'eligibilityLabel','eligibilityHeadline',
    'chargesLabel','chargesHeadline','chargesBody','chargesNote',
    'grievanceLabel','grievanceHeadline','grievanceBody',
    'groName','groRole','groEmail','groPhone','groAddress','groTimings',
    // Round E â€” Restaurant (template-10)
    'heroOpenStatus','chefName','chefRole','chefBio',
    'signaturesLabel','signaturesHeadline','menuLabel','menuHeadline','menuIntro','ctaPhone',
    // Round E â€” Portfolio (template-11)
    'heroNameLead','heroNameTail','heroRole','aboutLocationLine','workLabel','workHeadline',
    // Round F â€” InsurTech SaaS (template-12)
    'codeLanguage','codeSnippet','howLabel','howHeadline',
    'complianceLabel','complianceHeadline','complianceBody',
    'pricingLabel','pricingHeadline',
    // Round F â€” Insurance Market (template-13)
    'quoteCardTitle','quoteCardNote',
    'categoriesLabel','categoriesHeadline','categoriesBody',
    'whyLabel','partnersLabel',
    // Round K â€” MF Distributor (template-14)
    'arnNumber','euinNumber','amfiDisclosure','sipStartingAmount',
    'schemesLabel','schemesHeadline','schemesBody',
    'kycLabel','kycHeadline','kycBody','kycNote',
    // Round Q â€” Stock Broker / Demat (template-15)
    'brokerSebiReg','nseBseMemberCode','cdslDpId','mcxMemberCode','brokerCin','amfiArn',
    'heroActiveUsers','heroAumValue',
    'whyChooseLabel','whyChooseHeadline','whyChooseBody',
    'calculatorsLabel','calculatorsHeadline','calculatorsBody',
    'pricingLabel','pricingHeadline','pricingBody',
    'trustLabel','trustHeadline',
    'eduLabel','eduHeadline','eduBody',
    // Round R â€” SEBI RIA / Investment Adviser (template-16)
    'sebiInaReg','regValidity','raRegType','basMemberId','nismCertA','nismCertB',
    'adviserName','adviserBio','adviserYears','adviserPhoto','adviserSign',
    'feesLabel','feesHeadline','feesBody','feeFinePrint',
    'approachLabel','approachHeadline','approachBody',
    'articlesLabel','articlesHeadline','articlesBody',
    'disclosuresLabel','disclosuresHeadline','disclosuresBody'
  ];
  for (const k of strKeys) if (data[k] === undefined) data[k] = '';

  const arrKeys = ['services','processSteps','values','testimonials','trustItems','stats','hoursList',
                   'faqs','areasServed','logos','features','howItWorks','plans','policies','whyPoints',
                   'statBoxes','credentials','claimSteps',
                   // Round B
                   'tickerItems','aboutTags','aboutStats','numberStats',
                   'heroTrustBadges','heroRates','marqueeItems','pillars',
                   'heritageStats','certifications','depositRates','lendingRates','contactPerks',
                   // Round C
                   'heroTypingLines','statusItems','stackItems',
                   'heroPortfolioChips','tickerTokens','dataRows','chains',
                   // Round D â€” NBFC
                   'heroRateBenefits','trustBadges','products',
                   'eligibilityCriteria','documentsList','rateRows','aboutPillars',
                   'ratings','escalationLevels',
                   // Round E â€” Restaurant
                   'signatureDishes','menuCategories','reviews','pressItems',
                   // Round E â€” Portfolio
                   'skillsItems','workItems','clientList',
                   // Round F â€” InsurTech SaaS + Insurance Market
                   'customerLogos','howSteps','platformStats','complianceBadges','pricingPlans',
                   'categories','whyPoints','marketStats','insurerPartners','marketReviews',
                   // Round K â€” MF Distributor (template-14)
                   'schemes','kycSteps','amcPartners','sipBenefits',
                   // Round Q â€” Stock Broker / Demat (template-15)
                   'trustStats','whyChoosePoints','calculators','pricingRows','partnerLogos','riskDocs',
                   // Round R â€” SEBI RIA / Investment Adviser (template-16)
                   'feePlans','articles'];
  for (const k of arrKeys) if (!Array.isArray(data[k])) data[k] = [];
  return data;
}

// â”€â”€ Shared sample data (covers most templates) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const commonSample = {
  businessName: 'Apex Studio',
  tagline: 'Crafting experiences that endure.',
  _description: 'We help companies design clearer products, build trusted brands, and ship experiences that customers actually love.',
  tone: 'professional',
  primaryColor: '#c0392b',
  foundedYear: '2015',
  email: 'hello@apexstudio.co',
  phone: '+1 (555) 123-4567',
  address: '88 Market Street, Suite 400\nSan Francisco, CA 94103',
  hours: 'Monâ€“Fri Â· 9amâ€“6pm PT',
  about: 'We are a small team of designers, engineers, and strategists who believe great products come from deeply understanding the people using them. Since 2015 we have partnered with over 200 brands to ship work we are proud of.',
  products: ['Brand Strategy','Web Design','Digital Marketing','Consulting'],
  testimonials: [
    { quote: 'Apex transformed our brand from the ground up. Work is worth every penny.', name: 'Sarah Chen', role: 'CEO Â· Helix Health' },
    { quote: 'The team is sharp, responsive, and genuinely invested in the outcome.',      name: 'Marcus Lee',  role: 'Founder Â· Northbeam' },
    { quote: 'Best creative partner we have ever worked with. Would hire again in a heartbeat.', name: 'Priya Raman', role: 'VP Marketing Â· Orbit' }
  ],
  services: [
    { icon: 'ðŸŽ¨', name: 'Brand & Identity',  body: 'Logos, systems, and visual languages that scale from a business card to a billboard.', price: 'From $8,000' },
    { icon: 'ðŸ’»', name: 'Web Design',        body: 'Custom marketing sites and product UI that convert visitors into customers.',          price: 'From $12,000' },
    { icon: 'ðŸ“ˆ', name: 'Digital Marketing', body: 'Organic growth, paid acquisition, and lifecycle programs that compound over time.',    price: 'From $5,000/mo' },
    { icon: 'ðŸ§­', name: 'Consulting',        body: 'Strategic sprints for founders who need a second opinion they can actually trust.',    price: 'From $2,500/day' }
  ],
  trustItems: [
    { label: 'BBB Accredited' }, { label: '200+ Clients' }, { label: 'Fully Insured' }, { label: '5-Star Rated' }
  ],
  stats: [
    { value: '200+', label: 'Happy Clients' },
    { value: '15',   label: 'Years Experience' },
    { value: '50+',  label: 'Awards Won' },
    { value: '24/7', label: 'Emergency Support' }
  ],
  faqs: [
    { q: 'How long does a typical project take?', a: 'Brand projects run 6â€“8 weeks. Web design typically 8â€“12 weeks depending on scope.' },
    { q: 'Do you offer ongoing support?',          a: 'Yes â€” most clients stay on a monthly retainer for iterations, analytics, and campaigns.' },
    { q: 'What is your pricing model?',            a: 'Fixed-price per project for defined scope, or hourly for ongoing work. We share ballpark costs on the intro call.' }
  ]
};

// â”€â”€ Per-template variants (override the shared sample) â”€â”€â”€â”€â”€â”€â”€â”€
function localSample() {
  return {
    ...commonSample,
    businessName: 'Riverbend Plumbing',
    tagline: 'Licensed. Insured. Neighborhood-trusted.',
    _description: 'Family-run plumbing and drain service in Denver. 24/7 emergency dispatch, flat-rate pricing, and no surprises on the invoice.',
    primaryColor: '#c4622d',
    heroEyebrow: 'Trusted in Denver since 2010',
    heroHeadline: 'Fast, honest plumbing when you need it most.',
    heroSub: 'Clogged drain at 2am? Leaky water heater? We dispatch within 60 minutes â€” flat-rate pricing, no surprises.',
    heroCtaPrimary: 'Get a Free Quote',
    heroCtaSecondary: 'Call (555) 123-4567',
    heroQuoteCardTitle: 'Licensed Â· Insured Â· Local',
    heroQuoteCardBody: '15 years serving the Denver metro with same-day service and written guarantees on every job.',
    aboutHeadline: 'Three generations of plumbers serving Denver',
    aboutBody: 'Started in 1998 by Hank Riverbend, now run by his sons Cole and Jake. We treat every home like our grandmother lives there â€” boots off at the door, clean-up always, and we will not leave until you are satisfied.',
    emergencyLine: '24/7 Emergency Service â€” call anytime',
    areasServed: [
      { name: 'Downtown Denver' }, { name: 'Highlands' }, { name: 'Cherry Creek' },
      { name: 'Capitol Hill' }, { name: 'Washington Park' }, { name: 'Five Points' }
    ],
    hoursList: [
      { day: 'Monday',    open: '7:00 AM', close: '7:00 PM', closed: 'No' },
      { day: 'Tuesday',   open: '7:00 AM', close: '7:00 PM', closed: 'No' },
      { day: 'Wednesday', open: '7:00 AM', close: '7:00 PM', closed: 'No' },
      { day: 'Thursday',  open: '7:00 AM', close: '7:00 PM', closed: 'No' },
      { day: 'Friday',    open: '7:00 AM', close: '7:00 PM', closed: 'No' },
      { day: 'Saturday',  open: '8:00 AM', close: '4:00 PM', closed: 'No' },
      { day: 'Sunday',    open: '',        close: '',        closed: 'Yes' }
    ],
    services: [
      { icon: 'ðŸš¿', name: 'Drain Cleaning',     body: 'Clogs, backups, and slow drains â€” hydro-jetting available.', price: 'From $99' },
      { icon: 'ðŸ”§', name: 'Water Heater Service', body: 'Repair, replacement, and tankless conversions. Same-day in most cases.', price: 'From $149' },
      { icon: 'ðŸ’§', name: 'Leak Detection',      body: 'Thermal imaging to find leaks without tearing up your walls.',             price: 'From $185' },
      { icon: 'ðŸš½', name: 'Toilet & Fixture',    body: 'Installs, repairs, and upgrades. Low-flow, bidet, comfort-height â€” all handled.', price: 'From $125' }
    ]
  };
}

function startupSample() {
  return {
    ...commonSample,
    businessName: 'Voltline',
    tagline: 'The inbox that runs itself.',
    _description: 'Voltline is an AI inbox that drafts replies, files attachments, and books meetings automatically. Used by over 12,000 founders to reclaim 8 hours a week.',
    primaryColor: '#2560e8',
    heroBadge: 'NEW Â· Series A raised',
    heroHeadline: 'Your inbox, answered. Automatically.',
    heroSub: 'Voltline reads every email, drafts the reply, files attachments, and books meetings â€” so you focus on work that matters, not the inbox.',
    heroCtaPrimary: 'Start free',
    heroCtaSecondary: 'Book a demo',
    logos: [
      { name: 'Stripe' },{ name: 'Linear' },{ name: 'Notion' },{ name: 'Ramp' },{ name: 'Figma' }
    ],
    features: [
      { title: 'Smart reply drafting',  body: 'Trained on your writing style â€” every draft sounds like you wrote it yourself.',   metric: '2.4Ã— faster' },
      { title: 'Meeting scheduler',     body: 'Shares your real-time calendar, holds tentative blocks, and books without back-and-forth.', metric: 'Zero emails' },
      { title: 'Auto-file attachments', body: 'Invoices, contracts, receipts â€” filed in the right Drive folder automatically.',  metric: '100% coverage' },
      { title: 'Priority scoring',      body: 'Ranks every new message by urgency so you only open the ones that matter.',         metric: 'Top 12% only' },
      { title: 'Team inbox',            body: 'Shared queues, assignments, and status â€” built for small teams.',                   metric: '' },
      { title: 'Privacy-first',         body: 'SOC 2 Type II. On-device models for the sensitive stuff.',                          metric: 'SOC 2 certified' }
    ],
    howItWorks: [
      { title: 'Connect your inbox', body: 'Gmail or Outlook, takes 30 seconds. We never store message contents.' },
      { title: 'Voltline learns',    body: 'We analyze how you write and respond â€” tone, sign-off, length, quirks.' },
      { title: 'Drafts appear',      body: 'Every new email comes with a draft reply you just review and send.' },
      { title: 'You reclaim hours',  body: 'Typical user saves 8 hours a week on inbox management.' }
    ],
    currencySymbol: '$',
    plans: [
      { name: 'Starter', tagline: 'For solo operators', monthly: '19', annual: '190', popular: 'No', cta: 'Start free',
        features: [{ text: 'Up to 500 emails/mo' }, { text: 'Smart drafts' }, { text: 'Community support' }] },
      { name: 'Pro', tagline: 'For founders who live in email', monthly: '49', annual: '490', popular: 'Yes', cta: 'Start free',
        features: [{ text: 'Unlimited emails' }, { text: 'Meeting scheduler' }, { text: 'Auto-file attachments' }, { text: 'Priority support' }] },
      { name: 'Team', tagline: 'For small teams', monthly: '149', annual: '1490', popular: 'No', cta: 'Contact sales',
        features: [{ text: 'Everything in Pro' }, { text: 'Shared inboxes' }, { text: 'Team analytics' }, { text: 'Dedicated success manager' }] }
    ],
    testimonials: [
      { quote: 'Voltline saved me 10 hours a week. I cannot imagine email without it.', name: 'Sarah Chen', role: 'Founder Â· Helix', metricLabel: '10 hrs saved/wk' },
      { quote: 'Our support team triages 4Ã— faster now. Game-changer for small teams.',  name: 'Marcus Lee', role: 'Head of CX Â· Northbeam', metricLabel: '+312% throughput' }
    ],
    ctaHeadline: 'Reclaim your inbox today',
    ctaBody: 'Free for 14 days. No credit card. Cancel anytime.',
    ctaButton: 'Start free trial'
  };
}

function insuranceSample() {
  return {
    ...commonSample,
    businessName: 'Ananya Sharma & Associates',
    tagline: 'Honest advice. Policies that actually pay.',
    _description: 'Independent IRDAI-licensed insurance advisory serving families and small businesses in Mumbai since 2010. Specializes in life, health, and motor policies with a 96% claim-settlement track record.',
    primaryColor: '#15513a',
    heroTag: 'Licensed Insurance Professional',
    heroEyebrow: 'Protecting families since 2010',
    heroHeadline: 'Insurance made simple, honest, and actually useful.',
    heroSub: 'Independent IRDAI-licensed advisor. I help families pick the right policy â€” not the one that pays me the biggest commission.',
    heroCtaPrimary: 'Get Free Quote',
    heroCtaSecondary: 'Call Advisor',
    heroQuoteCardTitle: 'Get a personalized quote in 60 seconds',
    heroQuoteCardBody: 'No obligation. No spam. Just honest numbers from someone who does this for a living.',
    trustItems: [
      { label: 'IRDAI Licensed' }, { label: '96% Claim Settlement' }, { label: '15 Years Experience' }, { label: '24/7 Claim Support' }
    ],
    policies: [
      { icon: 'ðŸ›¡', name: 'Term Life',    body: 'High-coverage protection for your family at the lowest premium possible.' },
      { icon: 'ðŸ¥', name: 'Health',       body: 'Cashless hospitalization across 8,000+ network hospitals with no sub-limits.' },
      { icon: 'ðŸš—', name: 'Motor',        body: 'Comprehensive car and bike insurance with zero-depreciation add-on included.' },
      { icon: 'ðŸ ', name: 'Home',         body: 'Protects your home, contents, and valuables against fire, theft, and natural disasters.' }
    ],
    whyHeadline: 'Why clients stay for decades',
    whyPoints: [
      { text: 'Independent advice â€” I work for you, not any one insurance company' },
      { text: 'Claim assistance included â€” I handle the paperwork when you need to claim' },
      { text: 'Annual review at no cost â€” policies change, families change, coverage should too' },
      { text: 'One advisor for life â€” you will never be passed off to a call center' },
      { text: 'Transparent commission disclosure â€” you see exactly what I earn on every policy' }
    ],
    statBoxes: [
      { value: 'â‚¹480Cr', label: 'Claims Settled' },
      { value: '12,000+', label: 'Families Covered' },
      { value: '96%',    label: 'Settlement Rate' },
      { value: '15+',    label: 'Years Experience' }
    ],
    advisorName: 'Ananya Sharma',
    advisorBio: 'Ananya has spent 15 years helping families in Mumbai pick insurance that actually pays out when it matters. IRDAI-licensed since 2010, she specializes in complex family situations â€” blended households, business owners, and NRIs.',
    credentials: [
      { text: 'IRDAI Licensed Â· Since 2010' },
      { text: 'Certified Financial Planner (CFP)' },
      { text: 'MDRT Member Â· 2018, 2019, 2020, 2021, 2022, 2023' },
      { text: 'MA Economics Â· Delhi University' }
    ],
    claimSteps: [
      { title: 'Call me first', body: 'Before filing anything â€” one call and I walk you through what to do next.' },
      { title: 'Document check', body: 'I review every form before submission so nothing gets rejected on technicalities.' },
      { title: 'Submission & follow-up', body: 'I submit the claim and follow up with the insurer directly, daily if needed.' },
      { title: 'Payout confirmation', body: 'I confirm the transfer and only close the case once money is in your account.' }
    ],
    testimonials: [
      { quote: 'Got my hospitalization claim settled in 9 days. Ananya handled everything â€” I did not chase the insurer once.', name: 'Rohit Kapoor', role: 'Health policy Â· claim 2024' },
      { quote: '15 years with Ananya. My kids now use her too. Could not recommend higher.', name: 'Dr. Meera Iyer', role: 'Term + Health policies' }
    ],
    licenseNumber: 'IRDAI/LI/2010/44821',
    regulator: 'IRDAI'
  };
}

function agencySample() {
  return {
    ...commonSample,
    businessName: 'Noir Studio',
    tagline: 'Bold ideas, beautifully crafted.',
    _description: 'Independent creative studio in Brooklyn making brand identity, web design, and film for premium consumer brands. Founded 2015 by two ex-Pentagram designers.',
    primaryColor: '#c9a84c',
    // Hero (3-line headline; middle word gets the gold gradient)
    heroEyebrow: 'Creative Excellence Since 2015',
    heroHeadlineLead: 'Crafting',
    heroHeadlineAccent: 'Bold',
    heroHeadlineTail: 'Stories.',
    heroSub: 'A Brooklyn-based studio building enduring brands and the digital products that bring them to life. Trusted by 200+ companies, from venture-backed startups to legacy houses.',
    heroCtaPrimary: 'Explore Services',
    heroCtaSecondary: 'See Our Work',
    // Ticker
    tickerItems: [
      { text: 'Brand Systems' }, { text: 'Digital Products' }, { text: 'Film & Motion' },
      { text: 'Strategy' }, { text: 'Editorial' }, { text: 'Packaging' }, { text: 'Type Design' }
    ],
    // About
    aboutHeadlineLead: 'Built on trust,',
    aboutHeadlineTail: 'driven by results.',
    aboutBody: 'Noir was founded in 2015 by Mira Chen and Daniel Park, both alumni of Pentagram. We started small â€” a single brand identity for a Brooklyn coffee roaster â€” and grew by referral. Today the studio is fifteen designers, three strategists, and a film team. We work in close partnership: small senior teams, no juniors learning on your dime, no handoffs to anyone you have not met. Every project starts with a week of listening before we draw a line.',
    aboutTags: [
      { text: 'Brand Systems' }, { text: 'Digital Products' }, { text: 'Film' },
      { text: 'Strategy' }, { text: 'Type' }, { text: 'Packaging' }
    ],
    aboutStats: [
      { value: '150', suffix: '+', label: 'Brands Shaped' },
      { value: '98',  suffix: '%',  label: 'Client Retention' },
      { value: '12',  suffix: 'x',  label: 'Awards Won' },
      { value: '24',  suffix: 'hr', label: 'Avg. Response Time' }
    ],
    // Services
    servicesLabel: 'What We Offer',
    servicesHeadline: 'Premium services for premium results.',
    servicesMeta: 'Boutique by design. We take on twelve clients a year and build deep relationships with each.',
    services: [
      { name: 'Brand Identity',     body: 'Logos, typography, color, voice â€” complete systems built to scale from a tweet to a billboard.' },
      { name: 'Web & Product',      body: 'Custom marketing sites and product UI shipped with engineering, not just thrown over the wall.' },
      { name: 'Strategy',           body: 'Naming, positioning, narrative â€” the structural work that makes great visuals possible.' },
      { name: 'Film & Motion',      body: 'Brand films, product launches, and motion design for the moments that matter most.' },
      { name: 'Packaging',          body: 'Premium consumer packaging that earns its place on the shelf â€” and stays there.' },
      { name: 'Editorial',          body: 'Books, reports, and editorial systems for brands that have something worth saying.' }
    ],
    // Process
    processLabel: 'How We Work',
    processHeadline: 'A process built for precision.',
    processSteps: [
      { title: 'Discover',  body: 'We start with a week of listening â€” stakeholder interviews, brand audits, market mapping.' },
      { title: 'Strategy',  body: 'We sharpen the brief, name the audience, decide what the work needs to do â€” before drawing.' },
      { title: 'Execute',   body: 'Senior teams of two-to-four designers ship the work in tight, high-bandwidth sprints.' },
      { title: 'Grow',      body: 'We stay on as a creative partner â€” refining, extending, and scaling the system over years.' }
    ],
    // Numbers band
    numberStats: [
      { value: '500', suffix: '+',  label: 'Projects Shipped' },
      { value: '99',  suffix: '%',  label: 'Client Retention' },
      { value: '24',  suffix: 'hr', label: 'Response SLA' },
      { value: '15',  suffix: '+',  label: 'Years Together' }
    ],
    // Testimonials
    testimonials: [
      { quote: 'Noir built us a brand we still grow into a decade later. Easily the best money we ever spent.', name: 'Sarah Lin',     role: 'CEO Â· Helix Coffee' },
      { quote: 'Their strategy work changed how we talk about ourselves internally. The visuals were the bonus.', name: 'Marcus Webb',  role: 'Founder Â· Northbeam' },
      { quote: 'A genuine creative partnership â€” they care about our outcomes more than their portfolio.',         name: 'Priya Raman',  role: 'VP Brand Â· Orbit Skincare' }
    ],
    // CTA
    ctaHeadline: 'Ready to work with the best?',
    ctaBody: 'We take on twelve clients a year. If you have something worth doing properly, let us talk.',
    ctaButton: 'Start a Conversation'
  };
}

function bfsiSample() {
  return {
    ...commonSample,
    businessName: 'Meridian Capital',
    tagline: 'Banking Â· Investments Â· Loans',
    _description: 'Meridian Capital is a regulated NBFC offering deposits, home and business loans, and wealth advisory across India. RBI-licensed since 2008 with â‚¹2,400 Cr AUM and over 4 lakh customers served.',
    primaryColor: '#c8a957',
    // Compliance bar
    regulatorLine: 'Regulated Entity Â· RBI Registered NBFC Â· CIN: U65923MH2008PLC012345',
    insuranceLine: 'All eligible deposits insured up to â‚¹5L by DICGC',
    pmlaLinkLabel: 'PMLA Policy',
    grievanceLinkLabel: 'Grievance Redressal',
    // Hero
    heroEyebrow: 'Trusted Financial Partner Since 2008',
    heroHeadlineLead: 'Grow Your',
    heroHeadlineBody: 'Wealth with',
    heroHeadlineEmph: 'Confidence.',
    heroSub: 'Deposits, loans, and wealth advisory built for Indian families. RBI-regulated, transparent fees, and a relationship manager you can actually reach by phone.',
    heroCtaPrimary: 'Open Account',
    heroCtaSecondary: 'Explore Services',
    heroTrustBadges: [
      { icon: 'ðŸ›', label: 'RBI Regulated' },
      { icon: 'ðŸ›¡', label: 'DICGC Insured' },
      { icon: 'â­', label: 'CRISIL AA+' },
      { icon: 'ðŸ”’', label: 'ISO 27001' }
    ],
    ratesPanelTitle: 'Live Indicative Rates',
    ratesPanelFooter: '* Rates are indicative as of today. Subject to change without notice. T&C apply.',
    heroRates: [
      { name: 'Fixed Deposit',  detail: '12â€“24 months', rate: '7.85%', tag: 'p.a. compounding' },
      { name: 'Recurring Dep.', detail: '36 months',    rate: '7.50%', tag: 'p.a.' },
      { name: 'Home Loan',      detail: 'Up to 30 yr',  rate: '8.45%', tag: 'Floating Â· RLLR' },
      { name: 'Gold Loan',      detail: 'Up to â‚¹50L',   rate: '9.25%', tag: 'p.a.' }
    ],
    // Marquee
    marqueeItems: [
      { text: 'Fixed Deposits' }, { text: 'Recurring Deposits' }, { text: 'Home Loans' },
      { text: 'Business Loans' }, { text: 'Gold Loans' }, { text: 'Wealth Management' },
      { text: 'Mutual Funds' }, { text: 'Insurance' }, { text: 'NRI Banking' }
    ],
    // Services
    servicesLabel: 'Our Services',
    servicesHeadline: 'Financial solutions for every life stage.',
    servicesBody: 'From your first salary account to retirement planning â€” comprehensive financial services backed by a relationship manager who knows your name.',
    services: [
      { icon: 'ðŸ¦', name: 'Deposits',         body: 'FD, RD, and savings products with competitive rates and DICGC insurance up to â‚¹5L.' },
      { icon: 'ðŸ ', name: 'Home Loans',       body: 'Floating-rate home loans up to â‚¹5 Cr with 30-year tenure and zero pre-payment penalty.' },
      { icon: 'ðŸ’¼', name: 'Business Loans',   body: 'Working-capital and term loans for SMEs from â‚¹10L to â‚¹10 Cr â€” disbursal in 7 days.' },
      { icon: 'ðŸ“ˆ', name: 'Wealth Advisory',  body: 'Goal-based portfolio construction with mutual funds, bonds, and structured products.' },
      { icon: 'ðŸª™', name: 'Gold Loans',       body: 'Same-day disbursal up to â‚¹50L against gold ornaments. Lowest rates in the market.' },
      { icon: 'ðŸ›¡', name: 'Insurance',        body: 'Life, health, and motor insurance from top regulated insurers â€” no captive products.' }
    ],
    // Numbers
    numberStats: [
      { value: '2,400', suffix: 'Cr', label: 'Assets Under Management' },
      { value: '4',     suffix: 'L+', label: 'Customers Served' },
      { value: '17',    suffix: 'yr', label: 'In Operation' },
      { value: '98',    suffix: '%',  label: 'Renewal Rate' }
    ],
    // About
    aboutLabel: 'Our Heritage',
    aboutHeadlineLead: 'Stability you can',
    aboutHeadlineEmph: 'bank on.',
    aboutBody: 'Meridian Capital was founded in 2008 in Mumbai with a simple idea: serve Indian families and small businesses the way private banks once did, with senior people on the phone and decisions taken by humans, not algorithms. Seventeen years and four lakh customers later, that idea has held up. We are RBI-regulated, CRISIL AA+ rated, and have never missed a payout. Most of our customers came by referral from someone we already serve.',
    pillars: [
      { title: 'Regulatory Compliance', body: 'RBI-regulated NBFC since 2008. Audited annually by Big Four firms. Quarterly disclosures filed publicly.' },
      { title: 'Customer First',         body: 'Dedicated RM for every customer above â‚¹10L AUM. No call-tree maze, no off-shore support, no surprises.' },
      { title: 'Transparent Pricing',    body: 'Every fee published on our site. No hidden charges, no foreclosure penalties, no commission-driven sales.' }
    ],
    heritageStats: [
      { value: '17', suffix: 'Yr', label: 'In Operation' },
      { value: 'AA+', suffix: '',  label: 'CRISIL Rating' },
      { value: '24',  suffix: 'hr', label: 'Loan Decision' },
      { value: '4.8', suffix: 'â˜…',  label: 'Customer Rating' }
    ],
    certifications: [
      { label: 'RBI Licensed' }, { label: 'CRISIL AA+' }, { label: 'ISO 27001' },
      { label: 'DICGC Member' }, { label: 'IRDAI Corporate Agent' }, { label: 'AMFI Registered' }
    ],
    // Rates
    ratesLabel: 'Indicative Rates',
    ratesHeadlineLead: 'Competitive rates,',
    ratesHeadlineEmph: 'every single day.',
    depositPanelTitle: 'Deposit Rates',
    lendingPanelTitle: 'Lending Rates',
    depositRates: [
      { name: 'Fixed Deposit Â· 1 yr',   detail: 'Non-callable',  rate: '7.50%', tag: '' },
      { name: 'Fixed Deposit Â· 2 yr',   detail: 'Non-callable',  rate: '7.85%', tag: 'Best Rate' },
      { name: 'Fixed Deposit Â· 3 yr',   detail: 'Cumulative',    rate: '7.65%', tag: '' },
      { name: 'Recurring Deposit',      detail: '36 months',     rate: '7.50%', tag: '' },
      { name: 'Senior Citizen FD',      detail: '+0.50% bonus',  rate: '8.35%', tag: 'Senior+' },
      { name: 'Tax-Saver FD',           detail: '5 yr Â· 80C',    rate: '7.40%', tag: '' }
    ],
    lendingRates: [
      { name: 'Home Loan',         detail: 'Floating Â· RLLR linked', rate: '8.45%', tag: 'Popular' },
      { name: 'Loan Against Prop.', detail: 'Up to â‚¹5 Cr Â· 15 yr',   rate: '9.10%', tag: '' },
      { name: 'Business Loan',     detail: 'Term Â· up to 7 yr',      rate: '11.50%', tag: '' },
      { name: 'Working Capital',   detail: 'Cash credit Â· 1 yr',     rate: '10.75%', tag: '' },
      { name: 'Gold Loan',         detail: 'Up to â‚¹50L Â· 1 yr',      rate: '9.25%', tag: 'Same-day' },
      { name: 'Personal Loan',     detail: 'Up to â‚¹25L Â· 5 yr',      rate: '12.50%', tag: '' }
    ],
    ratesDisclaimer: 'Rates are indicative and may change basis market conditions and individual customer profile. Final rate will be communicated post credit underwriting. Subject to T&C and applicable RBI guidelines.',
    // Testimonials
    testimonials: [
      { quote: 'Got my home loan disbursed in 9 days flat. The RM kept me posted at every stage â€” no chasing, no surprises.', name: 'Rohit Kapoor',  role: 'Home Loan customer Â· 2024' },
      { quote: '15 years and 3 FD renewals later, still my first call when I need anything banking. The relationship matters.', name: 'Mrs. Lakshmi Nair', role: 'Retired Principal Â· FD Customer' },
      { quote: 'Working capital line that actually scales with our seasonal business. Old bank could never figure it out.',     name: 'Anil Gupta',     role: 'MD Â· Gupta Textiles' }
    ],
    // CTA
    ctaHeadline: 'Ready to make your money work harder?',
    ctaBody: 'Open an account in 15 minutes. Talk to a relationship manager today â€” no call-tree, no waiting.',
    ctaButton: 'Open Account',
    // Contact perks
    contactPerks: [
      { icon: 'â—·', text: 'Response within 4 business hours' },
      { icon: 'âœ“', text: 'KYC-compliant onboarding Â· 100% digital' },
      { icon: 'â˜Ž', text: 'Dedicated relationship manager from day one' },
      { icon: 'ðŸ›¡', text: 'No commission-driven product pushing â€” ever' }
    ],
    email: 'relationships@meridian.co.in',
    phone: '+91 22 6789 4500',
    address: 'Meridian Tower, Bandra Kurla Complex\nMumbai, Maharashtra 400051',
    hours: 'Monâ€“Sat Â· 9:30amâ€“6:30pm IST'
  };
}

function terminalSample() {
  return {
    ...commonSample,
    businessName: 'Forge Labs',
    tagline: '> Production-grade software, deployed.',
    _description: 'A small senior engineering studio shipping production-grade systems for early-stage and growth-stage software teams. Founded by ex-Stripe and ex-Cloudflare engineers in 2018.',
    primaryColor: '#00ff41',
    foundedYear: '2018',
    tone: 'professional',
    // Hero
    heroPromptCmd: './launch.sh --mode=production',
    heroSub: 'A senior engineering studio for software teams that have outgrown contractors but aren\'t ready for a 50-person agency. Six engineers, one shared Slack, no junior layer.',
    heroCtaPrimary: 'â–¶ run services.sh',
    heroCtaSecondary: 'cat README.md',
    heroMetaStatus: 'â— ONLINE',
    heroMetaModules: '06 loaded',
    heroMetaBuild: 'v2026.stable',
    heroTypingLines: [
      { text: '> Production-grade software, deployed.' },
      { text: '> Senior engineers. No juniors learning on your dime.' },
      { text: '> From scoping to deploy in weeks, not quarters.' },
      { text: '> Async-first. Documented. Predictable.' }
    ],
    // Status bar
    statusItems: [
      { text: 'TypeScript' }, { text: 'Cloud-native' }, { text: 'Production-grade' },
      { text: 'Open source' }, { text: 'Continuous delivery' }, { text: 'Performance' },
      { text: 'Reliability' }, { text: 'Security' }
    ],
    // About
    aboutFileName: 'about.ts',
    aboutBody: 'Forge Labs was founded in 2018 by two former infrastructure engineers â€” one from Stripe, one from Cloudflare â€” who got tired of watching ambitious software projects get diluted by big agencies and unreliable contractors. The studio has stayed deliberately small: six senior engineers, one designer, one operations lead. No interns, no offshore subcontractors, no handoffs. Every project is run by people you have met, with a single shared Slack channel and weekly demo calls. We have shipped production systems for fintechs, AI labs, and developer-tooling startups across three continents â€” and we are still measured the same way our customers are: by uptime, latency, and revenue impact.',
    aboutHeadlineLead: 'What runs',
    aboutHeadlineTail: 'in our stack.',
    aboutMeta: 'Battle-tested expertise across every module we ship. Each capability is production-grade and deployed for real customers running real load.',
    stackItems: [
      { name: 'TypeScript',          percent: '95' },
      { name: 'Cloud Architecture',  percent: '92' },
      { name: 'Distributed Systems', percent: '88' },
      { name: 'Security Engineering',percent: '90' },
      { name: 'DevOps & SRE',        percent: '87' },
      { name: 'Frontend Performance',percent: '78' }
    ],
    // Services
    servicesHeadlineLead: 'Technical',
    servicesHeadlineTail: 'Capabilities',
    servicesMeta: 'Every service is a production-ready module engineered for real load, audited for security, and shipped on a schedule we will commit to in writing.',
    services: [
      { name: 'Backend Engineering',     body: 'TypeScript and Go services, message queues, and API design â€” built to scale and handed off documented.', status: 'ACTIVE' },
      { name: 'Cloud Architecture',      body: 'AWS, GCP, and Cloudflare blueprints that scale with your customers without scaling your invoice.',      status: 'ACTIVE' },
      { name: 'Infrastructure & DevOps', body: 'CI/CD, observability, and SRE practices baked in from sprint one â€” not bolted on at launch.',           status: 'ACTIVE' },
      { name: 'Performance Engineering', body: 'Profiling, tuning, and reliability work for systems with real traffic and real revenue at stake.',       status: 'ACTIVE' },
      { name: 'Security & Compliance',   body: 'Threat modelling, audits, SOC 2 readiness â€” the unsexy work that ships you to enterprise customers.',     status: 'ACTIVE' },
      { name: 'Senior Advisory',         body: 'Senior eyes on a tricky decision, paid by the day. No retainers, no junior shadows, no upsells.',         status: 'ACTIVE' }
    ],
    // Process
    processHeadlineLead: 'How We',
    processHeadlineTail: 'Execute',
    processSteps: [
      { hash: 'a1f3e9c', phase: 'PHASE 01', title: 'init: Discovery & Scoping',     body: 'A five-day diagnostic â€” code review, stakeholder interviews, traffic analysis, and a written scope you can hand to your CFO.',     branch: 'branch: discovery' },
      { hash: 'b8d2c4f', phase: 'PHASE 02', title: 'feat: Architecture & Plan',     body: 'A bespoke execution blueprint with sequencing, dependencies, and risk callouts. Every decision documented before any code is written.', branch: 'branch: planning' },
      { hash: 'c5a7b1d', phase: 'PHASE 03', title: 'build: Precision Execution',     body: 'Two-week sprints with weekly demos. You see the running system on day three and every Friday after that. No surprises at launch.',     branch: 'branch: production' },
      { hash: 'd9e1f6a', phase: 'PHASE 04', title: 'deploy: Launch & Optimise',      body: 'Post-launch we monitor, iterate, and compound â€” your investment appreciates over time as we tune for the load you actually have.',     branch: 'branch: main â† merged' }
    ],
    // Numbers
    numberStats: [
      { value: '500', suffix: '+',  label: 'projects_shipped' },
      { value: '99',  suffix: '%',  label: 'client_retention' },
      { value: '08',  suffix: 'yr', label: 'years_in_production' },
      { value: '24',  suffix: 'hr', label: 'response_sla' }
    ],
    // Testimonials
    testimonials: [
      { quote: 'Working with Forge was like finding a senior engineer who actually cares about the outcome. Methodical, precise, and exceptional at every level. We will work with them again on the next product.', name: 'Michael Reyes',  role: 'CTO Â· Helix Logistics' },
      { quote: 'Rare to find a team that ships fast AND thinks deeply. They anticipated edge cases before we could even file the issue. The code review feedback alone justified the engagement.',                  name: 'Sarah Lin',     role: 'Founder & CEO Â· Northbeam' },
      { quote: 'The architecture document Forge wrote for us has been used by every engineer we have hired since. Every decision was traceable, every output was clean. This is engineering at its best.',         name: 'James Kowalski', role: 'Head of Platform Â· Orbit' }
    ],
    // CTA
    ctaHeadlineLead: 'Ready to ship',
    ctaHeadlineTail: 'something great?',
    ctaBody: 'Open a connection with Forge Labs. We respond within 24 hours, in writing, with a calendar link and a scoping doc.',
    ctaButton: '$ ./start_project.sh â†’',
    // Contact
    email: 'hello@forgelabs.dev',
    phone: '+1 (415) 555-0142',
    address: '88 Montgomery Street\nSan Francisco, CA 94104',
    hours: 'Monâ€“Fri, 09:00â€“18:00 PT'
  };
}

function web3Sample() {
  return {
    ...commonSample,
    businessName: 'Helix Protocol',
    tagline: 'Trustless infrastructure for the next billion users.',
    _description: 'Helix Protocol is a non-custodial, multi-chain settlement and routing protocol. Built by ex-Coinbase and ex-Polygon engineers, audited by Trail of Bits, used by 340+ teams across DeFi and CeFi.',
    primaryColor: '#00e5ff',
    foundedYear: '2021',
    tone: 'professional',
    // Hero
    heroBadge: 'Mainnet Â· Live',
    heroHeadlineLead: 'Trustless infra for',
    heroHeadlineAccent: 'Web3.',
    heroSub: 'Multi-chain settlement, routing, and custody primitives â€” audited, open-source, and battle-tested across $2.4B+ in on-chain value.',
    heroCtaPrimary: 'Read the Docs',
    heroCtaSecondary: 'Talk to Engineers',
    heroPanelTitle: 'Helix Â· Console',
    heroPortfolioChips: [
      { label: 'Total Value Locked', value: '$2.4B+',  change: 'â†‘ +12.4% MoM' },
      { label: '24h Settlement',     value: '$48.2M',  change: 'â†‘ +3.2%' },
      { label: 'Chains Supported',   value: '12',      change: 'Live across all' }
    ],
    // Ticker
    tickerTokens: [
      { symbol: 'BTC',  price: '$67,420', up: 'up',   change: '2.4%' },
      { symbol: 'ETH',  price: '$3,580',  up: 'up',   change: '1.8%' },
      { symbol: 'SOL',  price: '$184',    up: 'down', change: '0.9%' },
      { symbol: 'BNB',  price: '$412',    up: 'up',   change: '3.1%' },
      { symbol: 'ARB',  price: '$1.24',   up: 'up',   change: '5.2%' },
      { symbol: 'OP',   price: '$2.18',   up: 'up',   change: '1.4%' },
      { symbol: 'AVAX', price: '$38.4',   up: 'up',   change: '2.8%' },
      { symbol: 'MATIC',price: '$0.92',   up: 'down', change: '1.2%' }
    ],
    // Services
    servicesLabel: 'What We Build',
    servicesHeadline1: 'The full stack.',
    servicesHeadline2: 'Nothing missing.',
    services: [
      { name: 'Smart Contract Engineering', body: 'Audited, gas-optimised contracts in Solidity, Vyper, and Move â€” shipped to mainnet with full test coverage.' },
      { name: 'Protocol Architecture',       body: 'Modular system design that survives forks, upgrades, and adversarial conditions â€” without forklift migrations.' },
      { name: 'Wallet & Custody',            body: 'Self-custody and MPC infrastructure with hardware-backed key management for institutional desks.' },
      { name: 'Cross-chain Routing',         body: 'High-throughput bridge and routing infrastructure across 12 chains with sub-second median finality.' },
      { name: 'Compliance & KYT',            body: 'On-chain analytics, address screening, and risk scoring built for regulated counterparties.' },
      { name: 'Developer Tooling',           body: 'TypeScript SDKs, REST and gRPC APIs, and observability dashboards that make integration painless.' }
    ],
    // About manifesto
    aboutLabel: 'Our Foundation',
    aboutQuoteLine1: "We didn't build",
    aboutQuoteAccent1: 'Helix.',
    aboutQuoteLine2: 'to be another platform.',
    aboutQuoteLine3: 'We built it to be the',
    aboutQuoteAccent2: 'last one',
    aboutQuoteTail: 'you need.',
    aboutBody: 'Helix Protocol was founded in 2021 by two infrastructure engineers â€” one from Coinbase Custody, one from Polygon â€” who watched the on-chain ecosystem fragment into incompatible silos and decided to build the connective tissue that should have existed all along.\n\nOur architecture is non-custodial by design, our contracts are audited by Trail of Bits and OpenZeppelin, and our infrastructure is monitored on-chain around the clock. We do not ask you to trust us â€” we make trust unnecessary. Every contract is open-source, every upgrade is timelocked, every parameter is publicly governed.\n\nEvery team that builds on Helix gets direct access to protocol engineers, not a support ticket queue. That is the difference between a vendor and a partner â€” and that is the only kind of company we know how to be.',
    aboutCtaText: 'Start Building â†’',
    dataRows: [
      { key: 'Total value secured on-chain', value: '$2.4B+',   sub: 'since protocol launch in 2021' },
      { key: 'Infrastructure uptime',         value: '99.98%',   sub: 'zero critical incidents to date' },
      { key: 'Active developer teams',        value: '340+',     sub: 'across DeFi, CeFi, and infra' },
      { key: 'Transaction finality',          value: '<400ms',   sub: 'median, all supported chains' },
      { key: 'Countries with active users',   value: '80+',      sub: 'global protocol footprint' }
    ],
    // Chains
    chainsLabel: 'Supported Chains',
    chains: [
      { name: 'Ethereum',  color: '#627eea' },
      { name: 'Bitcoin',   color: '#f7931a' },
      { name: 'Solana',    color: '#9945ff' },
      { name: 'Polygon',   color: '#8247e5' },
      { name: 'Arbitrum',  color: '#12aaff' },
      { name: 'Optimism',  color: '#ff0420' },
      { name: 'Avalanche', color: '#e84142' },
      { name: 'BNB Chain', color: '#f0b90b' },
      { name: 'Base',      color: '#0052ff' },
      { name: 'Cosmos',    color: '#6f7390' }
    ],
    // Testimonials
    testimonialsLabel: 'Client Voices',
    testimonialsRating: 'Rated 4.9 across 200+ developer teams',
    testimonials: [
      { quote: 'The infrastructure is rock solid. We processed over *$40M in settlements without a single failure* in our first quarter on Helix. This is what institutional-grade actually looks like.', name: 'Karan Nair',  role: 'CTO Â· ChainVault' },
      { quote: 'Switched from two other providers to Helix. The difference in *latency and reliability is night and day.* Our market-makers noticed within the first hour of cutover.',                       name: 'Riya Joshi',  role: 'Head of Trading Â· NexFi' },
      { quote: 'Compliance-ready, developer-friendly, and *genuinely fast support from actual engineers.* Rare combination in this space. Building our next three products on their stack.',                  name: 'Alex Lin',    role: 'Founder Â· DeFiCore' }
    ],
    // CTA
    ctaEyebrow: 'Ready to Ship',
    ctaHeadlineLead: 'Go on-chain with',
    ctaHeadlineAccent: 'Helix.',
    ctaBody: 'Join the protocol trusted by 340+ teams across DeFi, CeFi, and Web3 infrastructure. No lengthy onboarding â€” deploy to testnet in days, mainnet in weeks.',
    ctaButton: 'Start Building â†’',
    ctaNote: 'Response within 24 hours Â· NDA available',
    // Contact perks
    contactPerks: [
      { text: 'Response within 24 hours, guaranteed' },
      { text: 'NDA available on request' },
      { text: 'No commitment to start the conversation' },
      { text: 'Direct access to protocol engineers' }
    ],
    email: 'partners@helixprotocol.io',
    phone: '+1 (415) 555-0188',
    address: 'Helix Labs Â· 200 Bush Street\nSan Francisco, CA 94104',
    hours: 'Monâ€“Fri, 09:00â€“18:00 PT Â· Discord 24/7'
  };
}

function nbfcSample() {
  return {
    ...commonSample,
    businessName: 'Meridian Capital',
    tagline: 'Honest lending. Transparent rates. Fast decisions.',
    _description: 'Meridian Capital is an RBI-registered NBFC offering personal, business, gold, home, and vehicle loans across 200+ branches in India. Disbursed over â‚¹12,400 Cr since 2012. CRISIL AA / Stable rated.',
    primaryColor: '#e85d2c',
    foundedYear: '2012',
    tone: 'professional',
    // Compliance
    rbiRegNumber: 'B-13.02345',
    cin: 'U65923MH2012PTC230456',
    nbfcCategory: 'NBFC-ICC (Investment & Credit Co.)',
    mitcLinkLabel: 'Most Important T&Cs',
    fairPracticeLinkLabel: 'Fair Practice Code',
    grievanceLinkLabel: 'Grievance Redressal',
    sachetLinkLabel: 'Report unauthorised entity (Sachet)',
    // Hero
    heroEyebrow: 'RBI Registered NBFC since 2012',
    heroHeadlineLead: 'Loans built',
    heroHeadlineBody: 'around',
    heroHeadlineEmph: 'your life.',
    heroSub: 'Personal, business, gold and home loans designed for real Indian customers â€” sanctioned in hours, disbursed in days, priced transparently. RBI-regulated, CRISIL AA rated.',
    heroCtaPrimary: 'Apply Now',
    heroCtaSecondary: 'Calculate EMI',
    heroRatePanelTitle: 'Starting at',
    heroRatePanelProduct: 'Personal Loan',
    heroRateValue: '10.99%',
    heroRateUnit: 'p.a.* onwards',
    heroRateBenefits: [
      { icon: 'âœ“', text: 'No collateral required' },
      { icon: 'âœ“', text: 'Decision in 30 minutes' },
      { icon: 'âœ“', text: 'Loans up to â‚¹40 Lakhs' },
      { icon: 'âœ“', text: 'Tenure up to 60 months' }
    ],
    // Trust
    trustBadges: [
      { icon: 'ðŸ›', label: 'RBI Regulated' },
      { icon: 'â˜…',  label: 'CRISIL AA / Stable' },
      { icon: 'ðŸ”’', label: 'ISO 27001 Certified' },
      { icon: 'â±',  label: 'Decision in 30 mins' },
      { icon: 'ðŸ“', label: '200+ branches' },
      { icon: 'âš–',  label: 'Fair Practice Code' }
    ],
    // Products
    productsLabel: 'What We Offer',
    productsHeadline: 'Lending solutions for every life stage.',
    productsBody: 'Salary advance, business expansion, gold pledge, home purchase â€” whatever the need, our products are priced honestly and approved on merit, not on commissions.',
    products: [
      { icon: 'ðŸ’¼', name: 'Personal Loan',    body: 'Unsecured loans for life events, medical bills, weddings, or travel. No collateral, fast disbursal.', amountRange: 'â‚¹50K â€“ â‚¹40L', rateFrom: '10.99%', tenure: '12â€“60 months' },
      { icon: 'ðŸ¢', name: 'Business Loan',    body: 'Working capital and term loans for SMEs, traders, and proprietors. Sanctioned on cash-flow merit.', amountRange: 'â‚¹2L â€“ â‚¹2 Cr',   rateFrom: '14.50%', tenure: '12â€“84 months' },
      { icon: 'ðŸª™', name: 'Gold Loan',         body: 'Same-day disbursal against gold ornaments â€” lowest market rates with full insurance coverage.',     amountRange: 'â‚¹25K â€“ â‚¹50L',  rateFrom: '9.25%',  tenure: '3â€“36 months' },
      { icon: 'ðŸ ', name: 'Home Loan',          body: 'Floating-rate home loans with 30-year tenure and zero foreclosure penalty after 12 EMIs.',          amountRange: 'â‚¹5L â€“ â‚¹5 Cr',   rateFrom: '8.45%',  tenure: '5â€“30 years' },
      { icon: 'ðŸš—', name: 'Vehicle Loan',       body: 'New and pre-owned cars, commercial vehicles, and two-wheelers â€” sanctioned at the dealership.',       amountRange: 'â‚¹50K â€“ â‚¹50L',  rateFrom: '9.99%',  tenure: '12â€“84 months' },
      { icon: 'ðŸ§¾', name: 'Loan Against Property', body: 'Mortgage your residential or commercial property for business expansion, education, or large purchases.', amountRange: 'â‚¹10L â€“ â‚¹5 Cr', rateFrom: '10.50%', tenure: '5â€“15 years' }
    ],
    // Eligibility
    eligibilityLabel: 'Eligibility & Documents',
    eligibilityHeadline: 'Simple eligibility. Honest documentation list.',
    eligibilityCriteria: [
      { icon: 'ðŸŽ‚', title: 'Age 21 â€“ 65 years',         body: 'You must be a resident Indian aged between 21 and 65 at loan maturity.' },
      { icon: 'ðŸ’°', title: 'Income â‚¹25,000+ /month',    body: 'Salaried applicants need a minimum monthly take-home of â‚¹25,000. Higher for larger loan amounts.' },
      { icon: 'ðŸ“ˆ', title: 'CIBIL score 700+',          body: 'A CIBIL score of 700 or above improves both approval odds and your interest rate.' },
      { icon: 'ðŸ¢', title: '2+ years employment',       body: 'Total work experience of 2 years, with at least 6 months at the current employer or business.' }
    ],
    documentsList: [
      { category: 'Salaried',      items: 'PAN card, Aadhaar, latest 3 salary slips, 6-month bank statement, latest Form 16, address proof' },
      { category: 'Self-employed', items: 'PAN, Aadhaar, business proof (GST/Udyam/Shop Act), 2-year ITR with computation, 12-month bank statement, partnership deed (if applicable)' }
    ],
    // Process
    processLabel: 'How To Apply',
    processHeadline: 'From apply to disbursal in days.',
    processSteps: [
      { icon: 'ðŸ“', title: 'Apply Online',         body: 'Fill basic details and upload documents from your phone or laptop. Mobile-friendly, secure.',                duration: '5 minutes' },
      { icon: 'ðŸ”', title: 'Soft Credit Check',     body: 'A non-affecting CIBIL pull and quick eligibility verification. No impact on your credit score.',           duration: 'Within 30 mins' },
      { icon: 'ðŸ“‹', title: 'Sanction & Agreement',  body: 'You receive the sanction letter, key fact statement, and a digital loan agreement to e-sign.',              duration: 'Within 24 hours' },
      { icon: 'ðŸ’¸', title: 'Disbursal',             body: 'Funds credited to your bank account once the agreement is e-signed and KYC documents are verified.',         duration: 'Within 48 hours' }
    ],
    // Charges
    chargesLabel: 'Rates & Charges',
    chargesHeadline: 'What it actually costs. No fine print.',
    chargesBody: 'RBI requires NBFCs to publish their interest rate ranges and fees clearly. Here are ours â€” applicable charges depend on credit assessment, product, and tenure.',
    rateRows: [
      { product: 'Personal Loan',         rate: '10.99% â€“ 24% p.a.', processingFee: 'Up to 2% + GST',     prepaymentCharge: 'Nil after 6 EMIs' },
      { product: 'Business Loan',         rate: '14.50% â€“ 22% p.a.', processingFee: 'Up to 2.5% + GST',   prepaymentCharge: '4% in 1st year, then nil' },
      { product: 'Home Loan (Floating)',  rate: '8.45% â€“ 12% p.a.',  processingFee: 'Up to 1% + GST',     prepaymentCharge: 'Nil for floating-rate' },
      { product: 'Loan Against Property', rate: '10.50% â€“ 14% p.a.', processingFee: 'Up to 1.5% + GST',   prepaymentCharge: 'Nil after 12 EMIs' },
      { product: 'Gold Loan',             rate: '9.25% â€“ 18% p.a.',  processingFee: 'â‚¹500 flat',          prepaymentCharge: 'Nil' },
      { product: 'Vehicle Loan',          rate: '9.99% â€“ 16% p.a.',  processingFee: 'Up to 1% + GST',     prepaymentCharge: '2% on outstanding' }
    ],
    chargesNote: '* Final rate is determined by credit assessment, loan amount, tenure, and product type. Other charges (stamp duty, GST, late payment fees, cheque bounce charges) apply as per the sanction letter and Most Important Terms & Conditions. T&C apply.',
    // Numbers
    numberStats: [
      { value: '12,400', suffix: 'Cr+', label: 'Disbursed since 2012' },
      { value: '5',       suffix: 'L+',  label: 'Customers served' },
      { value: '200',     suffix: '+',   label: 'Branches & service points' },
      { value: '15',      suffix: 'Yr',  label: 'In operation' }
    ],
    // About
    aboutLabel: 'Our Story',
    aboutHeadlineLead: 'Lending built on',
    aboutHeadlineEmph: 'trust.',
    aboutBody: 'Founded in 2012 in Mumbai, Meridian Capital is an RBI-registered Non-Banking Financial Company serving Indian families and small businesses across 200+ branches. We are CRISIL AA / Stable rated, ICRA AA- rated, and have disbursed over â‚¹12,400 Cr without a single regulatory adverse action. Our lending philosophy is straightforward: honest pricing published on our site, fast credit decisions taken by humans not algorithms, and a relationship manager you can actually reach by phone â€” from sanction through to closure.',
    aboutPillars: [
      { title: 'Transparent Pricing', body: 'Every fee is published on our site and explained in the sanction letter. No hidden charges, no surprise add-ons, ever.' },
      { title: 'Fair Practice Code',   body: 'Our staff are trained on RBI Fair Practice guidelines. Recovery is professional, dignified, and never coercive.' },
      { title: 'Customer First',        body: 'Dedicated relationship manager from day one â€” no call-tree maze, no off-shore support, no being passed around.' }
    ],
    ratings: [
      { label: 'RBI Registered NBFC' }, { label: 'CRISIL AA / Stable' }, { label: 'ICRA AA-' },
      { label: 'ISO 27001 Certified' }, { label: 'CKYC Compliant' }, { label: 'AMFI Registered' }
    ],
    // Testimonials
    testimonials: [
      { quote: 'I got my home loan disbursed in 9 days flat. The RM kept me posted at every stage â€” no chasing, no surprises, no hidden fees at the end. Refreshingly honest.', name: 'Rohit Kapoor',     role: 'Mumbai',   productUsed: 'Home Loan Â· 2024' },
      { quote: 'Working capital line that actually scales with our seasonal business. Our previous bank could never figure it out â€” Meridian got it from week one.',                  name: 'Anil Gupta',       role: 'Surat',    productUsed: 'Business Loan Â· â‚¹40L' },
      { quote: 'Three gold loan renewals over four years. Same RM each time, same rate transparency, same warmth. That kind of consistency is rare in this industry.',                name: 'Mrs. Lakshmi Iyer', role: 'Chennai', productUsed: 'Gold Loan customer' }
    ],
    // Grievance
    grievanceLabel: 'Customer Care Â· Grievance Redressal',
    grievanceHeadline: 'We hear you. And we resolve fast.',
    grievanceBody: 'As an RBI-regulated NBFC, Meridian Capital maintains a clear three-tier grievance redressal mechanism. Most issues are resolved at the branch level within 7 working days. If unresolved, the matter escalates to our Principal Nodal Officer and then, if still unresolved, to the RBI Ombudsman.',
    groName: 'Ms. Anjali Mehra',
    groRole: 'Principal Nodal Officer',
    groEmail: 'grievance@meridiancapital.in',
    groPhone: '+91 22 6789 4500',
    groAddress: 'Meridian Capital Ltd, 4th Floor, Meridian Tower\nBandra Kurla Complex, Mumbai 400051',
    groTimings: 'Monâ€“Fri Â· 10:00 AM â€“ 6:00 PM IST',
    escalationLevels: [
      { level: 'Level 1 Â· Branch / Customer Care',  body: 'Walk in to your branch or call our customer care for any service or product issue. Most matters resolved at this level.', contact: '1800 200 5000 Â· care@meridiancapital.in', tat: 'Within 7 days' },
      { level: 'Level 2 Â· Principal Nodal Officer',  body: 'If unresolved within 7 days, escalate in writing to our Principal Nodal Officer with the reference number from Level 1.',  contact: 'grievance@meridiancapital.in',           tat: 'Within 14 days' },
      { level: 'Level 3 Â· RBI Ombudsman / Sachet',   body: 'If unresolved within 30 days, file a complaint with the RBI Ombudsman or report on the Sachet portal for unauthorised entities.', contact: 'cms.rbi.org.in Â· sachet.rbi.org.in',     tat: 'As per RBI scheme' }
    ],
    // CTA
    ctaHeadline: 'Get a pre-approved offer in 60 seconds.',
    ctaBody: 'Soft credit check that does not affect your CIBIL score. No commitment to proceed. No spam, ever â€” and a relationship manager who calls within one business hour.',
    ctaButton: 'Check Eligibility',
    ctaNote: 'Soft credit check Â· Will not affect your CIBIL score',
    // Contact perks
    contactPerks: [
      { icon: 'â±', text: 'Decision in 30 minutes, disbursal in 48 hours' },
      { icon: 'âœ“', text: 'Soft credit check â€” will not affect your CIBIL score' },
      { icon: 'â˜Ž', text: 'Dedicated relationship manager from sanction to closure' },
      { icon: 'ðŸ›¡', text: 'No commission-driven product pushing â€” honest fit advice' }
    ],
    email: 'hello@meridiancapital.in',
    phone: '+91 22 6789 4500',
    address: 'Meridian Tower, Bandra Kurla Complex\nMumbai, Maharashtra 400051',
    hours: 'Monâ€“Sat Â· 9:30amâ€“6:30pm IST'
  };
}

function restaurantSample() {
  return {
    ...commonSample,
    businessName: 'Trattoria Verde',
    tagline: 'Honest food, made with love.',
    _description: 'Trattoria Verde is a family-run modern Italian restaurant in Bandra, Mumbai. Founded 2014 by Chef Marco Russo. Hand-rolled pasta, wood-fired mains, thoughtful wine list. Featured in Vogue Living and TimeOut Best New Restaurant 2024.',
    primaryColor: '#7a2e2e',
    foundedYear: '2014',
    tone: 'friendly',
    heroEyebrow: 'Modern Italian Â· Mumbai Â· Since 2014',
    heroHeadlineLead: 'Crafted with',
    heroHeadlineEmph: 'passion,',
    heroHeadlineTail: 'served with care.',
    heroSub: 'A neighbourhood trattoria run by a small family team. Hand-rolled pasta, wood-fired mains, a thoughtfully short wine list â€” and a kitchen open till the last guest goes home happy.',
    heroCtaPrimary: 'Reserve a Table',
    heroCtaSecondary: 'View Menu',
    heroOpenStatus: 'â— Open now Â· Last seating 10:30 PM',
    aboutLabel: 'Our Story',
    aboutHeadlineLead: 'A kitchen rooted in',
    aboutHeadlineEmph: 'tradition.',
    aboutBody: "Founded in 2014 by Chef Marco Russo and his wife Aria, Trattoria Verde began as a six-table room serving the food they grew up eating in Liguria. A decade on, the team is bigger and the dining room a little louder â€” but the rules haven't changed: pasta is rolled by hand each morning, vegetables come from a single farm forty kilometres from here, and we'd rather close early than serve something we wouldn't eat ourselves. Most of the team has been with us five years or more, and so have most of our regulars.",
    chefName: 'Chef Marco Russo',
    chefRole: 'Executive Chef & Founder',
    chefBio: 'Trained in Genoa, refined across kitchens in Milan and Tokyo, Marco believes good food is built on three things: an honest ingredient, a steady flame, and patience.',
    signaturesLabel: 'Signature Plates',
    signaturesHeadline: "What we're known for.",
    signatureDishes: [
      { name: 'Truffle Tagliatelle',     body: 'Hand-rolled tagliatelle, slow butter sauce, shaved black truffle, aged parmesan.',                price: 'â‚¹780',   tag: "Chef's Pick" },
      { name: 'Wood-Fired Branzino',      body: 'Whole Mediterranean sea bass, salt-baked, finished over olive wood. Lemon, capers, parsley oil.', price: 'â‚¹1,420', tag: '' },
      { name: 'Slow-Braised Lamb Shank',  body: 'Eight-hour braise in red wine and rosemary, soft polenta, gremolata.',                            price: 'â‚¹1,160', tag: '' },
      { name: 'Burrata di Andria',        body: 'Fresh burrata flown weekly, heirloom tomato, aged balsamic, focaccia.',                            price: 'â‚¹620',   tag: 'V' },
      { name: 'TiramisÃ¹ della Nonna',     body: "Marco's grandmother's recipe â€” hand-whipped mascarpone, espresso-soaked ladyfingers, cocoa.",       price: 'â‚¹420',   tag: 'Classic' },
      { name: 'Risotto Mare Nostrum',     body: 'Carnaroli rice, prawn, scallop, calamari, saffron, finished with a touch of Sambuca.',              price: 'â‚¹990',   tag: '' }
    ],
    menuLabel: 'Full Menu',
    menuHeadline: "Today's offerings.",
    menuIntro: 'Vegan and gluten-free options marked. Please tell us about any allergies â€” our kitchen is happy to adapt.',
    menuCategories: [
      { name: 'Antipasti', items: 'Bruschetta | â‚¹320 | Toasted ciabatta, heirloom tomato, basil, olive oil | V\nCarpaccio di Manzo | â‚¹540 | Beef tenderloin, parmesan, rocket, lemon |\nVitello Tonnato | â‚¹620 | Cold veal, tuna-caper sauce, capers |\nInsalata Caprese | â‚¹420 | Buffalo mozzarella, tomato, basil | V' },
      { name: 'Pasta',     items: 'Cacio e Pepe | â‚¹560 | Pecorino, black pepper, hand-rolled spaghetti | V\nSpaghetti Vongole | â‚¹740 | Clams, white wine, garlic, parsley |\nPappardelle al Cinghiale | â‚¹820 | Wild boar ragÃ¹, juniper, red wine |\nGnocchi Pesto Genovese | â‚¹620 | Hand-rolled potato gnocchi, pesto, pine nuts | V' },
      { name: 'Mains',     items: 'Branzino al Forno | â‚¹1,420 | Wood-fired sea bass, lemon, capers |\nLamb Shank Brasato | â‚¹1,160 | Eight-hour red wine braise, polenta |\nPollo alla Milanese | â‚¹880 | Breaded chicken, rocket, cherry tomato, lemon |\nMelanzane Parmigiana | â‚¹680 | Eggplant, tomato, mozzarella, basil | V' },
      { name: 'Dolci',     items: 'TiramisÃ¹ della Nonna | â‚¹420 | Espresso, mascarpone, ladyfingers, cocoa |\nPanna Cotta | â‚¹360 | Vanilla cream, seasonal berries, balsamic |\nAffogato | â‚¹320 | Vanilla gelato, hot espresso, amaretto | V\nCantucci & Vin Santo | â‚¹420 | Tuscan almond biscotti, dessert wine |' }
    ],
    reviews: [
      { quote: 'A meal here is what you go to a restaurant for in the first place â€” soul, smoke, and salt.',                                              source: 'Vir Sanghvi',         role: 'Food Critic, HT Brunch',   stars: '5' },
      { quote: "Marco's tagliatelle alone is worth the trip across the city. The lamb shank is the postscript that closes the deal.",                    source: 'Conde Nast Traveller', role: 'Best New Restaurant 2024', stars: '5' },
      { quote: "My family's anniversary spot for three years running. They remember our table, our wine, our daughter's allergies.",                     source: 'Priya Iyer',           role: 'Bandra Â· regular guest',    stars: '5' }
    ],
    hoursList: [
      { day: 'Monday',    closed: 'Yes', open: '',         close: '' },
      { day: 'Tuesday',   closed: 'No',  open: '12:00 PM', close: '11:00 PM' },
      { day: 'Wednesday', closed: 'No',  open: '12:00 PM', close: '11:00 PM' },
      { day: 'Thursday',  closed: 'No',  open: '12:00 PM', close: '11:00 PM' },
      { day: 'Friday',    closed: 'No',  open: '12:00 PM', close: '12:00 AM' },
      { day: 'Saturday',  closed: 'No',  open: '11:00 AM', close: '12:00 AM' },
      { day: 'Sunday',    closed: 'No',  open: '11:00 AM', close: '10:30 PM' }
    ],
    pressItems: [
      { label: 'Featured in Vogue Living' },
      { label: 'TimeOut Best New Restaurant 2024' },
      { label: 'HT Brunch Â· 4.5â˜…' },
      { label: 'Conde Nast Traveller' },
      { label: "BBC Travel Â· \"Mumbai's soul on a plate\"" }
    ],
    ctaHeadline: 'Hungry? Reserve your table.',
    ctaBody: 'A 24-hour notice helps us prep your favourites. Walk-ins welcome â€” first-come, first-served on weekends.',
    ctaButton: 'Book a Table',
    ctaPhone: '+91 22 6789 4500',
    email: 'reservations@trattoriaverde.in',
    phone: '+91 22 6789 4500',
    address: '14 Hill Road, Bandra West\nMumbai, Maharashtra 400050',
    hours: 'Tueâ€“Sun Â· 12:00 PM â€“ 11:00 PM (Mon closed)'
  };
}

function portfolioSample() {
  return {
    ...commonSample,
    businessName: 'Aria Mehta',
    tagline: 'Brand & editorial designer.',
    _description: 'Aria Mehta is an independent brand and editorial designer based in Mumbai with 10 years of experience. Past work includes Helix Coffee, Northbeam Magazine, Studio Halve, and Orbit Skincare. Available for select projects in 2026.',
    primaryColor: '#0a0a0a',
    foundedYear: '2016',
    tone: 'professional',
    heroEyebrow: 'Available for select projects Â· 2026',
    heroNameLead: 'Aria',
    heroNameTail: 'Mehta',
    heroRole: 'Brand & Editorial Designer',
    heroSub: 'I help small studios and ambitious founders build brands that have a point of view. Most of my work sits at the intersection of editorial typography, considered visual systems, and clear writing.',
    heroCtaPrimary: 'View Work',
    heroCtaSecondary: 'Get in Touch',
    skillsItems: [
      { text:'Brand Identity' }, { text:'Editorial Design' }, { text:'Typography' },
      { text:'Print' }, { text:'Web' }, { text:'Packaging' }, { text:'Art Direction' }, { text:'Strategy' }
    ],
    aboutLabel: 'About',
    aboutHeadlineLead: 'Designing things',
    aboutHeadlineEmph: 'that mean something.',
    aboutBody: "Hi, I'm Aria. I've spent the last decade making things â€” first at a small studio in Bombay, then briefly in-house at a magazine, and for the past six years on my own.\n\nI work in close partnership with founders and editors who care deeply about how their work looks and reads. Most engagements run six to twelve weeks. I take on roughly eight clients a year, with at least one personal or pro-bono project mixed in.\n\nIf you're building something with a strong point of view and you want a collaborator rather than a vendor, I'd love to hear from you.",
    aboutLocationLine: 'Mumbai Â· Available remotely worldwide',
    workLabel: 'Selected Work',
    workHeadline: "A few things I'm proud of.",
    workItems: [
      { year:'2024', client:'Helix Coffee',       title:'Brand identity & packaging',       body:'Logo, typography, packaging system, and editorial photography direction for a third-wave roaster expanding to four cities.', tag:'Branding' },
      { year:'2024', client:'Northbeam Magazine', title:'Quarterly editorial redesign',     body:'Full editorial redesign across grid, typography, and section structure for an architecture quarterly.',                  tag:'Editorial' },
      { year:'2023', client:'Studio Halve',       title:'Website & writing system',         body:'Design and copywriting for a 12-page studio site, including a custom CMS structure for project case studies.',          tag:'Web' },
      { year:'2023', client:'Orbit Skincare',     title:'Packaging redesign Â· 14 SKUs',     body:'A complete packaging refresh across the line, plus the launch campaign visual system.',                                  tag:'Packaging' },
      { year:'2022', client:'Maya Editions',      title:'Custom typeface Â· "Maya Display"', body:"A serif display family in three weights, drawn for a small literary publisher's book covers and interiors.",            tag:'Type' },
      { year:'2022', client:'Helix Coffee',       title:'In-store editorial program',       body:'Quarterly seasonal menus, postcards, and shelf-talkers for thirty-two retail locations.',                              tag:'Editorial' }
    ],
    servicesLabel: 'Services',
    servicesHeadline: 'What I can take on.',
    services: [
      { name:'Brand Identity',     body:'Logo, typography, voice, and a system that scales from a business card to a 200-page lookbook.' },
      { name:'Editorial Design',   body:'Magazines, books, reports, and editorial systems for publishers who care about how the work feels in hand.' },
      { name:'Typography',         body:'Custom typefaces and lettering for brands and publications. From a logo wordmark to a complete display family.' },
      { name:'Web & Digital',      body:'Marketing sites and editorial-led product UI, designed in close collaboration with a small developer network.' },
      { name:'Strategy & Writing', body:'Naming, positioning, and editorial copy for projects where the words matter as much as the visuals.' }
    ],
    clientList: [
      { name:'Helix Coffee' }, { name:'Northbeam Magazine' }, { name:'Studio Halve' },
      { name:'Orbit Skincare' }, { name:'Maya Editions' }, { name:'Atelier Co.' },
      { name:'Forge Architects' }, { name:'Marigold Press' }, { name:'Quiet Records' },
      { name:'Paper Lantern Books' }
    ],
    testimonials: [
      { quote: "Aria doesn't decorate, she reasons. Every choice on our brand had a clear answer behind it. I'd hire again in a heartbeat.",       name:'Sarah Lin',    role:'Founder Â· Helix Coffee' },
      { quote: 'The redesign moved the magazine from "competent" to "essential" in our readers\' minds. A genuinely transformative engagement.',   name:'Marcus Webb',  role:'Editor-in-Chief Â· Northbeam' },
      { quote: 'A real collaborator. Thoughtful, fast, and the writing was as sharp as the visuals â€” rare combination.',                          name:'Priya Raman',  role:'Founder Â· Orbit' }
    ],
    ctaHeadlineLead: 'Have something',
    ctaHeadlineEmph: 'worth making?',
    ctaBody: "I take on around eight projects a year. If you have something you care about, I'd love to hear about it â€” even if you're not sure of the scope yet.",
    ctaButton: 'Start a Conversation',
    email: 'hello@ariamehta.in',
    address: 'Mumbai, India',
    hours: 'Monâ€“Fri Â· 10:00 AM â€“ 7:00 PM IST'
  };
}

function insurtechSample() {
  return {
    ...commonSample,
    businessName: 'Stratus',
    tagline: 'Insurance APIs for the modern stack.',
    _description: 'Stratus is a B2B InsurTech API platform powering insurers, brokers, and embedded-insurance teams. Quote, underwrite, claim â€” one developer-first stack. SOC 2 Type II, IRDAI-aligned. Founded 2020 in Bangalore.',
    primaryColor: '#00a085',
    foundedYear: '2020',
    tone: 'professional',
    heroBadge: 'SOC 2 Type II Â· IRDAI-aligned',
    heroHeadlineLead: 'Insurance APIs for the',
    heroHeadlineAccent: 'modern stack.',
    heroSub: 'Quote, underwrite, and settle claims through one developer-first platform. Used by 80+ insurers and brokers across India to ship products in days, not quarters.',
    heroCtaPrimary: 'Get API Keys',
    heroCtaSecondary: 'Read Docs',
    codeLanguage: 'node.js',
    codeSnippet: `const stratus = new Stratus(process.env.STRATUS_KEY);

const quote = await stratus.quotes.create({
  product: 'health',
  age: 32,
  city: 'mumbai',
  cover: 1000000
});

console.log(quote.premium);
// â†’ 8420 (â‚¹/year, GST inclusive)`,
    customerLogos: [
      { name:'Acko' }, { name:'Digit' }, { name:'Bajaj Allianz' }, { name:'Star Health' },
      { name:'HDFC Ergo' }, { name:'Tata AIG' }, { name:'Care Health' }, { name:'PolicyBazaar' }
    ],
    productsLabel: 'API Suite',
    productsHeadline: 'One stack. Every insurance primitive.',
    productsBody: 'A coherent set of APIs designed by engineers who shipped insurance infrastructure at scale. Pick what you need, ignore the rest.',
    products: [
      { icon:'âš¡', name:'Quotes API',        body:'Sub-100ms quotes across 30+ insurers. Smart caching, fallback handling, and full normalisation across products.', endpoint:'POST /v1/quotes' },
      { icon:'ðŸ›¡', name:'Underwriting API',  body:'Risk scoring with explainable signals. Returns approve / refer / decline plus the precise reasons regulators ask for.', endpoint:'POST /v1/underwrite' },
      { icon:'ðŸ“‹', name:'Claims API',         body:'File, track, and settle claims through one endpoint. Document OCR, auto-fraud scoring, and SLA dashboards built in.',   endpoint:'POST /v1/claims' },
      { icon:'ðŸ”', name:'KYC & AML',           body:'Aadhaar, PAN, video KYC, sanctions screening â€” all bundled with audit trails ready for IRDAI inspections.',         endpoint:'POST /v1/kyc' },
      { icon:'ðŸ“Š', name:'Analytics API',       body:'Customer cohort, claims-ratio, and product-mix dashboards delivered as JSON. Plug straight into your BI stack.',     endpoint:'GET  /v1/analytics' },
      { icon:'ðŸ””', name:'Webhooks',           body:'Reliable, signed, idempotent event delivery. Every quote, policy, and claim triggers events with retries and DLQs.',   endpoint:'POST /v1/webhooks' }
    ],
    howLabel: 'Integration',
    howHeadline: 'Live in days, not quarters.',
    howSteps: [
      { title:'Sign up',        body:'Create a sandbox account. No credit card required, no sales call to start.',                              duration:'5 minutes' },
      { title:'Get API keys',   body:'Generate sandbox + production keys in the dashboard. Rotate, scope, and revoke any time.',                duration:'Instant' },
      { title:'Build & test',   body:'Code against the sandbox with realistic mock data. Full request logs, replay, and time-travel debugging.', duration:'1â€“3 days' },
      { title:'Ship to prod',   body:'Flip the keys, deploy. We monitor with you for the first 30 days through a shared Slack channel.',         duration:'Same day' }
    ],
    platformStats: [
      { value:'99.99', suffix:'%',   label:'Uptime SLA Â· 12 months' },
      { value:'80',    suffix:'+',   label:'Insurers integrated' },
      { value:'2.4',   suffix:'B+',  label:'Annual API calls' },
      { value:'<80',   suffix:'ms',  label:'Median quote latency' }
    ],
    complianceLabel: 'Compliance & Security',
    complianceHeadline: 'Built for regulated workloads.',
    complianceBody: 'Every layer of the platform is built to satisfy regulatory and security audits â€” IRDAI inspections, RBI scrutiny, IT-Act and DPDP compliance, and the security reviews your customers will run on you. We publish a SOC 2 Type II report and an IRDAI compliance addendum to every customer on request.',
    complianceBadges: [
      { label:'SOC 2 Type II' }, { label:'ISO 27001' }, { label:'IRDAI Aligned' }, { label:'DPDP Compliant' },
      { label:'IT-Act Compliant' }, { label:'PCI-DSS Level 1' }, { label:'CKYCR Linked' }, { label:'AES-256 at rest' }
    ],
    pricingLabel: 'Pricing',
    pricingHeadline: 'Transparent, scaling pricing.',
    pricingPlans: [
      { name:'Starter',    price:'Free',          tagline:'For exploring the API',          popular:'No',  cta:'Start building',   features:'1,000 sandbox calls / month\nCommunity support\n3 webhook endpoints\nBasic dashboards' },
      { name:'Growth',     price:'â‚¹49,000 / mo',  tagline:'For shipping products',           popular:'Yes', cta:'Talk to sales',    features:'500K production calls / month\n24-hour priority support\nUnlimited webhooks\nAdvanced analytics\n99.9% SLA' },
      { name:'Enterprise', price:'Custom',        tagline:'For regulated incumbents',        popular:'No',  cta:'Contact sales',    features:'Custom volume & rate limits\nDedicated CSM + Slack channel\nVPC peering & private link\nCustom SLAs up to 99.99%\nOn-prem deployment available' }
    ],
    ctaHeadlineLead: 'Ready to integrate',
    ctaHeadlineAccent: 'in 24 hours?',
    ctaBody: 'Sandbox keys, full docs, and a Slack channel with our engineers â€” that\'s how integrations move from "let me explore" to "shipped" in a week.',
    ctaButton: 'Get API Keys',
    ctaNote: 'Sandbox keys are free Â· No credit card required',
    email: 'partners@stratus.dev',
    phone: '+91 80 4567 8900',
    address: 'Indiranagar, Bangalore 560038',
    hours: 'Monâ€“Fri Â· 09:00â€“18:00 IST'
  };
}

function insuranceMarketSample() {
  return {
    ...commonSample,
    businessName: 'Coverwise',
    tagline: 'Compare. Buy. Claim. All under one roof.',
    _description: 'Coverwise is an IRDAI-licensed insurance broker that helps Indian families compare and buy insurance from 50+ licensed carriers. 12 lakh+ customers served. 97% claim assistance success rate. Founded in 2014 in Mumbai.',
    primaryColor: '#00856f',
    foundedYear: '2014',
    tone: 'friendly',
    heroEyebrow: 'IRDAI-licensed broker Â· serving since 2014',
    heroHeadlineLead: 'Compare insurance,',
    heroHeadlineEmph: 'find your fit.',
    heroSub: 'Quotes from 50+ IRDAI-licensed insurers in 30 seconds. Independent advice from licensed advisors. Real claim assistance when you need it most.',
    heroCtaPrimary: 'Compare Now',
    heroCtaSecondary: 'Talk to Advisor',
    quoteCardTitle: 'Get a free quote in 30 seconds',
    quoteCardNote: 'No obligation Â· No spam Â· IRDAI Lic. CB-XXX/2014',
    categoriesLabel: 'What we cover',
    categoriesHeadline: 'Find the right cover for every life moment.',
    categoriesBody: 'Health, motor, life, home, travel â€” every category, every major insurer in India. Compare apples-to-apples and pick what actually fits.',
    categories: [
      { icon:'â¤ï¸', name:'Health Insurance',  tagline:'Cashless at 8000+ hospitals', body:'Family floater and individual covers from â‚¹3 lakh to â‚¹2 crore. Pre-existing diseases, OPD, mental health â€” all options compared.' },
      { icon:'ðŸš—', name:'Car Insurance',     tagline:'Renew in 60 seconds',         body:'Comprehensive, third-party, and zero-depreciation covers from every major motor insurer. Instant policy delivery.' },
      { icon:'ðŸ', name:'Two-Wheeler',       tagline:'From â‚¹600/year',               body:'Bike and scooter insurance with optional accident cover. Compare premiums across 25+ insurers in one tap.' },
      { icon:'ðŸ›¡', name:'Term Life',          tagline:'High cover, low premium',     body:'Pure protection covers up to â‚¹2 crore at premiums that won\'t hurt. Compare claim-settlement ratios honestly.' },
      { icon:'ðŸ ', name:'Home Insurance',     tagline:'Structure + contents covered', body:'Fire, burglary, natural-disaster cover for your house and what\'s inside. Even renters can buy.' },
      { icon:'âœˆï¸', name:'Travel Insurance',   tagline:'For domestic & international', body:'Medical emergencies, trip cancellation, lost baggage. Schengen and student-travel plans included.' }
    ],
    whyLabel: 'Why us',
    whyHeadline: 'Why thousands trust us.',
    whyPoints: [
      { icon:'âš–', title:'Compare 50+ Insurers',    body:'Every IRDAI-licensed major carrier in India, side-by-side. We don\'t hide options that don\'t pay us.' },
      { icon:'ðŸ’¸', title:'Lowest Premiums',         body:'Direct insurer rates with our broker discount built in â€” usually 15â€“25% cheaper than buying retail.' },
      { icon:'â˜Ž', title:'Real Claim Assistance',    body:'A dedicated case manager handles your paperwork, follow-ups, and escalations until your claim is settled.' },
      { icon:'ðŸ›¡', title:'IRDAI-Licensed Advisors',  body:'Our advisors are licensed by IRDAI and bound by Fair Practice Code. No commission-driven product pushing.' }
    ],
    processLabel: 'How it works',
    processHeadline: 'From quote to claim â€” we handle it all.',
    processSteps: [
      { icon:'ðŸ“', title:'Get free quotes',        body:'Tell us about you in 30 seconds. We pull live quotes from every major insurer.' },
      { icon:'ðŸ”', title:'Compare side-by-side',   body:'Premium, claim ratio, hospital network, exclusions â€” see them all in one clear table.' },
      { icon:'âœ“',  title:'Buy with one tap',        body:'Pay online, get the policy on email and WhatsApp instantly. No paperwork, no agent visits.' },
      { icon:'ðŸ¤', title:'We handle your claim',    body:'When you need to claim, your case manager fills the forms, follows up, and stays with you till payout.' }
    ],
    marketStats: [
      { value:'12',     suffix:'L+',  label:'Customers covered' },
      { value:'50',     suffix:'+',   label:'Insurer partners' },
      { value:'97',     suffix:'%',   label:'Claim assistance success rate' },
      { value:'â‚¹2,400', suffix:'Cr',  label:'Premium serviced annually' }
    ],
    partnersLabel: 'We compare across IRDAI-licensed insurers',
    insurerPartners: [
      { name:'HDFC ERGO' }, { name:'Star Health' }, { name:'ICICI Lombard' }, { name:'Bajaj Allianz' },
      { name:'Tata AIG' }, { name:'Care Health' }, { name:'Niva Bupa' }, { name:'Reliance General' },
      { name:'New India Assurance' }, { name:'Aditya Birla Health' }, { name:'SBI General' }, { name:'Acko' }
    ],
    marketReviews: [
      { quote:'My health insurance claim was settled in 11 days flat. The case manager kept me posted at every step â€” no chasing, no hidden charges. Saved my family during a tough time.',           name:'Rohit Kapoor',  role:'Mumbai',    productUsed:'Health Â· â‚¹8L cashless claim Â· 2024' },
      { quote:'Compared 14 motor policies in 2 minutes. Saved â‚¹4,200 on annual premium vs renewing direct with my old insurer. The whole thing took 5 minutes including the payment.',                name:'Priya Iyer',    role:'Bangalore', productUsed:'Car Â· zero-dep Â· 2024' },
      { quote:'Got a term cover of â‚¹1.5 crore at half the premium I was paying earlier. The advisor explained every clause â€” no jargon, no upselling, no commission spiel.',                          name:'Anil Gupta',    role:'Pune',      productUsed:'Term Life Â· â‚¹1.5 Cr Â· 2024' }
    ],
    ctaHeadline: 'Get the right cover. In 30 seconds.',
    ctaBody: 'Quotes from every major insurer, side-by-side. No commission added, no obligation, no spam â€” just a fair comparison.',
    ctaButton: 'Compare Now',
    ctaNote: 'Free comparison Â· No obligation Â· IRDAI Lic. CB-XXX/2014',
    email: 'help@coverwise.in',
    phone: '1800 200 5000',
    address: 'Lower Parel, Mumbai 400013',
    hours: 'Monâ€“Sat Â· 9:00 AM â€“ 9:00 PM IST'
  };
}

function mfDistributorSample() {
  return {
    ...commonSample,
    businessName: 'Vrddhi Wealth',
    tagline: 'Grow wealth. Build futures.',
    _description: 'Vrddhi Wealth is an AMFI-registered Mutual Fund Distributor (ARN-112358) serving families across Rajasthan since 2012. Goal-based investing, commission-transparent model, and a relationship that lasts through every market cycle.',
    primaryColor: '#6b1e2c',
    foundedYear: '2012',
    tone: 'professional',
    email: 'hello@vrddhiwealth.in',
    phone: '+91 94140 XXXXX',
    address: 'Old Grain Market, Sarafa Bazaar\nJodhpur, Rajasthan 342001',
    hours: 'Monâ€“Sat Â· 10:00 AM â€“ 6:00 PM IST',
    arnNumber: 'ARN-112358',
    euinNumber: 'E-112358',
    amfiDisclosure: 'AMFI registered Mutual Fund Distributor Â· ARN-112358',
    heroEyebrow: 'AMFI Registered ARN-112358 Â· Trusted by families since 2012',
    heroHeadlineLead: 'Build wealth',
    heroHeadlineEmph: 'systematically.',
    heroSub: 'A Jodhpur-based AMFI-registered distributor helping families invest in goal-mapped mutual funds â€” retirement, education, liquidity â€” with transparent advice and zero hidden commissions.',
    heroCtaPrimary: 'Start SIP Today',
    heroCtaSecondary: 'Calculate Returns',
    sipStartingAmount: 'â‚¹500/month',
    sipBenefits: [
      { icon: 'ðŸ“ˆ', text: 'Start with as little as â‚¹500/month' },
      { icon: 'ðŸ”„', text: 'Power of compounding over decades' },
      { icon: 'ðŸ›¡', text: 'SEBI-regulated, AMFI-compliant ARN holder' },
      { icon: 'âœ“',  text: 'Goal-mapped portfolio â€” not one-size-fits-all' }
    ],
    servicesLabel: 'What We Offer',
    servicesHeadline: 'Investment services for every life stage.',
    servicesBody: 'From your first â‚¹500 SIP to structuring a retirement corpus â€” personalised advice, disclosed commissions, and annual reviews that keep your portfolio aligned with your life.',
    services: [
      { icon: 'ðŸ”„', name: 'SIP Investment',      body: 'Systematic plans from â‚¹500/month. Auto-debit, goal-linked, reviewed every 12 months.' },
      { icon: 'ðŸ’°', name: 'Lumpsum Investment',   body: 'One-time deployment of surplus â€” timed with market analysis, not gut feel.' },
      { icon: 'ðŸŽ¯', name: 'Goal-Based Planning',  body: 'Retirement corpus, children\'s education, home down payment â€” each goal gets its own fund bucket.' },
      { icon: 'ðŸ§¾', name: 'ELSS Tax Saving',      body: 'Save up to â‚¹46,800 in tax under Section 80C while building an equity portfolio.' },
      { icon: 'ðŸ“Š', name: 'Portfolio Review',     body: 'Annual health-check â€” performance vs benchmark, scheme switches, and rebalancing.' },
      { icon: 'ðŸ¦', name: 'Debt & Liquid Funds',  body: 'Emergency corpus, stable income post-retirement â€” Liquid and Short Duration categories.' }
    ],
    schemesLabel: 'Fund Categories',
    schemesHeadline: 'One goal, the right category.',
    schemesBody: 'We distribute across all major categories from SEBI-registered AMCs. Every recommendation is mapped to your goal horizon and risk capacity.',
    schemes: [
      { icon: 'ðŸ“ˆ', name: 'Equity Funds',  tagline: 'Long-term wealth creation',    body: 'Invests in stocks across market caps. Best for goals 5+ years away. Higher risk, higher potential reward.',            riskLevel: 'High',            horizon: '5+ years' },
      { icon: 'ðŸ›¡', name: 'Debt Funds',    tagline: 'Stability and steady income',  body: 'Bonds and corporate paper. Lower volatility â€” tax-efficient for 1â€“3 year goals.',                                       riskLevel: 'Low to Moderate', horizon: '1â€“3 years' },
      { icon: 'âš–',  name: 'Hybrid Funds', tagline: 'Balanced growth and stability', body: 'Pre-set mix of equity and debt. Suitable for moderate-risk investors and first-timers.',                                 riskLevel: 'Moderate',        horizon: '3â€“5 years' },
      { icon: 'ðŸŒŠ', name: 'Liquid Funds',  tagline: 'Park your surplus safely',     body: 'Ultra-short duration. Easy redemption, better than savings account for idle funds above â‚¹1L.',                          riskLevel: 'Low',             horizon: '1 day â€“ 3 months' },
      { icon: 'ðŸ§¾', name: 'ELSS',          tagline: 'Tax saving with equity upside', body: 'Section 80C deduction up to â‚¹1.5L. Lowest lock-in (3 years) among 80C instruments.',                                   riskLevel: 'High',            horizon: '3+ years' }
    ],
    amcPartners: [
      { name: 'Mirae Asset MF' }, { name: 'Axis MF' }, { name: 'Kotak MF' },
      { name: 'HDFC MF' }, { name: 'ICICI Prudential MF' }, { name: 'SBI MF' },
      { name: 'Nippon India MF' }, { name: 'UTI MF' }
    ],
    processLabel: 'How It Works',
    processHeadline: 'From first conversation to first SIP â€” in days.',
    processSteps: [
      { icon: 'ðŸ’¬', title: 'Goal conversation', body: '30-minute call to map your income, goals, and risk tolerance. No paperwork.', duration: '30 minutes' },
      { icon: 'ðŸ“‹', title: 'KYC onboarding',    body: 'PAN + Aadhaar eKYC in 2 minutes. Already KYC-verified? We skip straight to selection.', duration: 'Same day' },
      { icon: 'ðŸŽ¯', title: 'Scheme selection',  body: 'Portfolio matched to your goals â€” with full reasoning and disclosed commissions.', duration: 'Within 24 hours' },
      { icon: 'ðŸ”„', title: 'Start & review',    body: 'SIP auto-debit activated. Annual review every December to catch drift.', duration: 'Ongoing' }
    ],
    kycLabel: 'KYC Compliance',
    kycHeadline: 'KYC-verified investors only. Here\'s why â€” and how.',
    kycBody: 'SEBI and AMFI require every mutual fund investor to complete KYC before the first investment. The process is digital, quick, and one-time â€” once KYC-verified, your record is maintained centrally by the CKYC Registry (CERSAI) and shared across all fund houses. You never repeat KYC for a new fund house.',
    kycNote: 'Already KYC-compliant via a bank, broker, or SEBI-registered entity? Your CKYC record transfers automatically.',
    kycSteps: [
      { icon: 'ðŸªª', title: 'PAN verification',      body: 'Your PAN is the primary identifier linked to your income-tax record.' },
      { icon: 'ðŸ“±', title: 'Aadhaar eKYC',          body: 'OTP-based Aadhaar verification on your phone in 2 minutes. No branch visit.' },
      { icon: 'ðŸ“¸', title: 'Video KYC (if needed)', body: 'Short 2-minute video call for certain investment amounts.' },
      { icon: 'âœ“',  title: 'CKYC registration',     body: 'KYC lodged on the Central KYC Registry â€” valid for life across all SEBI-registered entities.' }
    ],
    aboutLabel: 'Our Story',
    aboutHeadlineLead: 'Investing guided by',
    aboutHeadlineEmph: 'honest advice.',
    aboutBody: 'Founded in 2012 in Jodhpur, Vrddhi Wealth holds ARN-112358 and operates on a commission-transparent model â€” every scheme recommendation comes with a clear disclosure of the trail commission we earn. In thirteen years through two bull markets and one pandemic, our clients\' average SIP tenure is 7.4 years. That number, more than any return figure, reflects the trust built by never prioritising our commission over a client\'s goal.',
    aboutPillars: [
      { title: 'Commission Transparency', body: 'We disclose the trail commission on every scheme. You see exactly what we earn â€” no conflicts, no agenda.' },
      { title: 'Goal-First Selection',    body: 'Every scheme is mapped to a specific goal and horizon before recommendation. We do not chase AUM targets.' },
      { title: 'Long-Term Partnership',   body: 'Annual reviews, rebalancing calls, and a phone that is answered. Most clients\' children are now investors too.' }
    ],
    ratings: [
      { label: 'AMFI Registered Â· ARN-112358' },
      { label: 'EUIN: E-112358' },
      { label: 'SEBI Compliant' },
      { label: 'CKYC Registered' },
      { label: 'CFP Certified (FPSB India)' }
    ],
    testimonials: [
      { quote: 'Started a â‚¹5,000 SIP in 2016 for my daughter\'s wedding. Annual reviews kept me from stopping during COVID. The corpus exceeded every FD I could have built.', name: 'Rajesh Agarwal',  role: 'Jodhpur', productUsed: 'Equity SIP Â· 8-year goal' },
      { quote: 'Vrddhi showed me the trail commission on each fund before recommending anything. That transparency is rare. I increased my SIP three times in four years.', name: 'Priya Singhania', role: 'Jaipur',   productUsed: 'Multi-fund portfolio' },
      { quote: 'I came asking for an FD alternative. After one call I understood why a debt fund made more sense for my 18-month goal. The decision was mine â€” I was just better informed.', name: 'Vikram Mehta', role: 'Pune', productUsed: 'Debt Fund Â· 18-month corpus' }
    ],
    grievanceLabel: 'Investor Care Â· Grievance Redressal',
    grievanceHeadline: 'Your complaint gets a real response. Always.',
    grievanceBody: 'As an AMFI-registered distributor, Vrddhi Wealth maintains a four-tier grievance mechanism. Most concerns are resolved at our level within 3 working days. If unresolved, the path escalates to the AMC, then AMFI Investor Services, and finally SEBI SCORES.',
    groName: 'Mr. Sanjay Gupta',
    groRole: 'Principal Grievance Officer',
    groEmail: 'grievance@vrddhiwealth.in',
    groPhone: '+91 94140 XXXXX',
    groAddress: 'Vrddhi Wealth\nOld Grain Market, Sarafa Bazaar\nJodhpur, Rajasthan 342001',
    groTimings: 'Monâ€“Sat Â· 10:00 AM â€“ 6:00 PM IST',
    escalationLevels: [
      { level: 'Level 1 Â· Distributor',            body: 'Contact us directly. Most issues resolved within 3 working days.',                                           contact: '+91 94140 XXXXX Â· grievance@vrddhiwealth.in', tat: 'Within 3 days' },
      { level: 'Level 2 Â· AMC Investor Relations',  body: 'If unresolved in 7 days, contact the AMC whose scheme the complaint relates to.',                           contact: 'AMC Investor Relations â€” refer AMC website',   tat: 'Within 15 days' },
      { level: 'Level 3 Â· AMFI Investor Services',  body: 'For distributor complaints not resolved at AMC level, escalate to AMFI via amfiindia.com.',                contact: 'amfiindia.com/investor-complaint',               tat: 'Within 21 days' },
      { level: 'Level 4 Â· SEBI SCORES',             body: 'If unresolved after 30 days, register on SEBI\'s official investor grievance portal â€” SCORES.',             contact: 'scores.gov.in Â· 1800-266-7575',                  tat: 'As per SEBI norms' }
    ],
    ctaHeadline: 'Start your â‚¹500 SIP today. Your retirement starts now.',
    ctaBody: 'A 30-minute conversation, a goal agreed on, and your first SIP running â€” all within the week. No commitment until you are sure.',
    ctaButton: 'Book a Free Call',
    ctaNote: 'No charges for consultation Â· AMFI Registered Â· ARN-112358'
  };
}

function stockBrokerSample() {
  return {
    ...commonSample,
    businessName: 'Stallion Capital',
    tagline: 'India\'s simplest investing platform.',
    _description: 'Stallion Capital is a SEBI-registered stock broker (INZ000301838), NSE/BSE/MCX member, and CDSL depository participant offering stocks, F&O, mutual funds, IPOs, ETFs, bonds and commodities on one paperless platform. Founded in 2016 and trusted by over 5 lakh active investors across India.',
    primaryColor: '#5500eb',
    foundedYear: '2016',
    tone: 'professional',
    email: 'hello@stallioncapital.in',
    phone: '+91 80 4000 8000',
    address: 'Indiranagar, 100 Feet Road\nBengaluru, Karnataka 560038',
    hours: 'Monâ€“Fri Â· 9:00 AM â€“ 6:00 PM IST',
    brokerSebiReg: 'INZ000301838',
    nseBseMemberCode: 'NSE-11724 Â· BSE-1234',
    cdslDpId: 'CDSL: IN-DP-417-2019',
    mcxMemberCode: 'MCX-56789',
    brokerCin: 'U65100KA2016PTC092879',
    amfiArn: 'ARN-111686',
    heroEyebrow: 'Trusted by 5 Lakh+ active investors',
    heroHeadlineLead: 'Invest in',
    heroHeadlineEmph: 'everything.',
    heroSub: 'Stocks, F&O, IPOs, Mutual Funds, ETFs, Bonds â€” one app, zero account opening charges. SEBI-registered since 2016, with sub-millisecond order execution and 24x7 investor support.',
    heroCtaPrimary: 'Open Free Demat',
    heroCtaSecondary: 'Explore Stocks',
    heroActiveUsers: '5 Lakh+ active investors',
    heroAumValue: 'â‚¹38,000 Cr+ Assets',
    trustStats: [
      { value: '5L+',     label: 'Active investors' },
      { value: 'â‚¹38KCr',  label: 'Assets under custody' },
      { value: '0',       label: 'Account opening charges' },
      { value: '24/7',    label: 'Customer support' }
    ],
    productsLabel: 'Build your portfolio',
    productsHeadline: 'One account. Every asset class.',
    productsBody: 'Whether you are buying your first share or running a derivatives book â€” every product is in the same login, with one consolidated P&L and a single statement at year-end.',
    products: [
      { icon: 'ðŸ“ˆ', name: 'Stocks',         tagline: 'NSE & BSE listed equities',          body: 'Invest in companies across market caps. Real-time P&L, price alerts, sub-millisecond orders.' },
      { icon: 'ðŸ“Š', name: 'F&O',            tagline: 'Futures & Options terminal',         body: 'Trade Nifty, Bank Nifty, and stock derivatives with charts, option chains, basket orders.' },
      { icon: 'ðŸªª', name: 'Mutual Funds',    tagline: 'Direct plans Â· zero commission',     body: 'Invest via SIP or lumpsum across every AMC. Direct plans only â€” your returns stay yours.' },
      { icon: 'ðŸš€', name: 'IPO',            tagline: 'Apply with one click',                body: 'Track and apply to upcoming and ongoing IPOs. UPI mandate in seconds â€” no cheques, no paperwork.' },
      { icon: 'ðŸ›¡',  name: 'ETFs',           tagline: 'Index, Gold, Silver, International', body: 'Diversified exposure at low cost. Hold ETFs alongside stocks in the same demat account.' },
      { icon: 'ðŸ’¼', name: 'Bonds',           tagline: 'Fixed-income with regular yield',    body: 'Government and corporate bonds with transparent yields. Settle into your demat account.' },
      { icon: 'ðŸ’°', name: 'MTF',             tagline: 'Buy now, pay later',                 body: 'Margin Trading Facility â€” up to 4Ã— leverage on eligible stocks. Pledge holdings for instant margin.' },
      { icon: 'ðŸ›¢',  name: 'Commodities',     tagline: 'Crude, Gold, Silver â€” MCX',          body: 'Trade real-world assets on the MCX with the same terminal you use for equities.' }
    ],
    whyChooseLabel: 'Why investors trust us',
    whyChooseHeadline: 'Built for the modern Indian investor.',
    whyChooseBody: 'A platform engineered for speed, transparency, and the regulatory promises a SEBI-registered broker is obligated to keep.',
    whyChoosePoints: [
      { icon: 'âš¡',  title: 'Lightning-fast orders',  body: 'Sub-millisecond order routing to NSE and BSE. Scalper mode for one-tap trades.' },
      { icon: 'ðŸ”’', title: 'Bank-grade security',    body: '2FA on every login, biometric on mobile. ISO 27001 certified data centres.' },
      { icon: 'ðŸ’¯', title: 'Zero commission on MF',  body: '100% direct plans. We earn nothing â€” you keep the trail commission across the fund\'s life.' },
      { icon: 'ðŸ“Š', title: 'Pro charts, free',       body: 'Advanced candlesticks, 50+ indicators, drawing tools. Same terminal that institutions use.' },
      { icon: 'ðŸ“±', title: 'Mobile-first design',    body: 'iOS, Android, Web â€” same data, same speed, real-time sync across devices.' },
      { icon: 'â˜Ž',  title: '24Ã—7 investor support', body: 'Real humans on chat, email, and phone. Average first-response under 4 minutes.' }
    ],
    processLabel: 'Get started in minutes',
    processHeadline: 'Open your Demat â€” fully digital, paperless.',
    processSteps: [
      { icon: 'ðŸ“', title: 'Sign up',           body: 'Enter your mobile number and email. Get an OTP-verified account in under a minute.', duration: '1 minute' },
      { icon: 'ðŸªª', title: 'Aadhaar eKYC',      body: 'Verify identity with Aadhaar OTP. PAN is auto-pulled from the income-tax database.', duration: '2 minutes' },
      { icon: 'âœ',  title: 'eSign your forms',  body: 'Aadhaar-based eSign on the account opening forms. No printing, no couriers, no branch visit.', duration: '1 minute' },
      { icon: 'ðŸš€', title: 'Start investing',   body: 'Your demat and trading accounts are activated within 24 hours â€” usually much sooner.',          duration: 'Same day' }
    ],
    calculatorsLabel: 'Plan before you invest',
    calculatorsHeadline: 'Calculators for every kind of decision.',
    calculatorsBody: 'From a first â‚¹500 SIP to a leveraged intraday trade â€” figure out the math before the money moves.',
    calculators: [
      { icon: 'ðŸ’¹', name: 'SIP Calculator',        body: 'Estimate corpus from a recurring SIP across years and expected returns.' },
      { icon: 'ðŸ’µ', name: 'Lumpsum Calculator',    body: 'Future value of a one-time investment compounded annually.' },
      { icon: 'ðŸ§¾', name: 'Brokerage Calculator',  body: 'Total charges on a trade â€” brokerage, STT, exchange, GST, SEBI fee.' },
      { icon: 'âš–',  name: 'Margin Calculator',    body: 'Pre-trade margin requirement for equity, F&O, and commodity positions.' },
      { icon: 'ðŸ¦', name: 'FD Calculator',         body: 'Maturity value of a fixed deposit across tenures and interest rates.' },
      { icon: 'ðŸš—', name: 'EMI Calculator',        body: 'Monthly EMI for car, home, or personal loans with full amortisation.' }
    ],
    pricingLabel: 'Brokerage & Charges',
    pricingHeadline: 'Transparent pricing. No surprises.',
    pricingBody: 'Every paisa, listed. SEBI requires brokers to publish their charge schedule â€” we go a step further and show the math on every order.',
    pricingRows: [
      { segment: 'Account opening',          rate: 'â‚¹0',                          note: 'Lifetime free demat account' },
      { segment: 'Equity Delivery',          rate: 'â‚¹0',                          note: 'Zero brokerage on long-term equity' },
      { segment: 'Equity Intraday',          rate: '0.05% or â‚¹20 per order',      note: 'Whichever is lower' },
      { segment: 'F&O â€” Futures',            rate: 'â‚¹20 per order',               note: 'Flat fee on Nifty, Bank Nifty, stock futures' },
      { segment: 'F&O â€” Options',            rate: 'â‚¹20 per order',               note: 'Flat fee regardless of lot size' },
      { segment: 'Currency / Commodity',     rate: 'â‚¹20 per order',               note: 'MCX & NSE currency derivatives' },
      { segment: 'Mutual Funds (Direct)',     rate: 'â‚¹0',                          note: '100% commission-free, no DP charges on MF units' },
      { segment: 'DP charges',               rate: 'â‚¹13.5 + GST per scrip',       note: 'On debit of stocks from demat account' }
    ],
    trustLabel: 'Regulated. Transparent. Secure.',
    trustHeadline: 'A SEBI-registered broker with full exchange memberships.',
    partnerLogos: [
      { name: 'SEBI Registered' }, { name: 'NSE Member' }, { name: 'BSE Member' },
      { name: 'MCX Member' },      { name: 'CDSL DP' },    { name: 'NSDL DP' },
      { name: 'AMFI Registered' }, { name: 'ISO 27001 Certified' }
    ],
    testimonials: [
      { quote: 'Switched from a legacy broker after watching one too many order delays during market hours. Stallion fills orders instantly â€” and the charges are a fraction of what I used to pay.', name: 'Aman Khurana',  role: 'Bengaluru', productUsed: 'Intraday trader Â· 4 years' },
      { quote: 'I started with a â‚¹500 SIP because the app made it that easy. Three years later I run a 12-fund portfolio with goal-mapped buckets. Zero commission on direct plans changed everything.',     name: 'Sneha Iyer',    role: 'Pune',      productUsed: 'SIP investor Â· MF portfolio' },
      { quote: 'The F&O terminal is what kept me. Option chain, payoff diagrams, basket orders â€” everything in one window. And the brokerage is flat â‚¹20 per order regardless of lot size.',                  name: 'Rakesh Bansal', role: 'Delhi NCR', productUsed: 'F&O active trader' }
    ],
    grievanceLabel: 'Investor Care Â· Grievance Redressal',
    grievanceHeadline: 'Every complaint reaches a real person. Within hours.',
    grievanceBody: 'As a SEBI-registered stock broker and depository participant, Stallion Capital operates a 5-tier grievance mechanism. All complaints are acknowledged within 24 hours and resolved within 30 days as mandated by SEBI.',
    groName: 'Ms. Priya Bhandari',
    groRole: 'Principal Compliance Officer',
    groEmail: 'compliance@stallioncapital.in',
    groPhone: '+91 80 4000 8001',
    groAddress: 'Stallion Capital\nIndiranagar, 100 Feet Road\nBengaluru â€” 560038, Karnataka',
    groTimings: 'Monâ€“Fri Â· 9:00 AM â€“ 6:00 PM IST',
    escalationLevels: [
      { level: 'Level 1 Â· Customer Care',       body: 'Raise a ticket via chat, email, or phone. First-response under 4 hours; most cases closed in 24.', contact: 'support@stallioncapital.in Â· 1800-000-0000', tat: 'Within 24 hours' },
      { level: 'Level 2 Â· Compliance Officer',  body: 'Unresolved in 3 days? Escalate to the Principal Compliance Officer with your ticket reference.', contact: 'compliance@stallioncapital.in',               tat: 'Within 7 days' },
      { level: 'Level 3 Â· Exchange (NSE/BSE)',  body: 'Lodge directly with the exchange via the investor complaint portal of NSE, BSE, or MCX.',         contact: 'investorhelpline.nseindia.com',                tat: 'Within 15 days' },
      { level: 'Level 4 Â· SEBI SCORES',         body: 'If unresolved after 30 days, register your complaint on SEBI\'s official investor grievance portal.', contact: 'scores.sebi.gov.in Â· 1800-266-7575',         tat: 'Per SEBI norms' },
      { level: 'Level 5 Â· SMART ODR',           body: 'Online Dispute Resolution for unresolved investor grievances under SEBI\'s SMART ODR mechanism.', contact: 'smartodr.in',                                  tat: 'Per SMART ODR norms' }
    ],
    eduLabel: 'Investor Charter & Downloads',
    eduHeadline: 'Regulatory documents â€” published, downloadable, current.',
    eduBody: 'Every disclosure SEBI requires a broker to publish â€” gathered in one place, plain-language summaries included.',
    riskDocs: [
      { icon: 'ðŸ“œ', title: 'Investor Charter',                  body: 'Your rights and responsibilities as a securities-market investor.' },
      { icon: 'âš ',  title: 'Risk Disclosure Document (RDD)',   body: 'Mandatory pre-investment risk disclosure prescribed by SEBI.' },
      { icon: 'ðŸ“‹', title: 'Rights & Obligations',              body: 'Rights and obligations of broker, sub-broker, depository participant, and client.' },
      { icon: 'ðŸ“„', title: 'MITC (Most Important Terms)',       body: 'Plain-language summary of the most important terms and conditions.' },
      { icon: 'ðŸ§¾', title: 'Policies & Procedures',             body: 'Internal policies on brokerage, margin, settlement, and dispute resolution.' },
      { icon: 'ðŸ†”', title: 'KYC Forms',                         body: 'Account opening, modification, and nomination forms â€” printable PDF.' }
    ],
    ctaHeadline: 'Open your Demat in 5 minutes. Free, for life.',
    ctaBody: 'Aadhaar eKYC, eSign, and instant activation. No account opening charges, no annual maintenance for the first year.',
    ctaButton: 'Open Free Account',
    ctaNote: 'No account opening charges Â· SEBI Registered Â· INZ000301838'
  };
}

function sebiRiaSample() {
  return {
    ...commonSample,
    businessName: 'Saaransh Advisory',
    tagline: 'Money advice that actually feels like advice.',
    _description: 'Saaransh Advisory is a SEBI-registered Individual Investment Adviser (INA000012345), fee-only, with BASL membership BASL2125. Founded in 2018, we work with around 40 families across India on written financial plans, refreshed annually, with quarterly review calls. We never accept commissions on any product we recommend.',
    primaryColor: '#6b9080',
    foundedYear: '2018',
    tone: 'warm, conversational',
    email: 'hello@saaranshadvisory.in',
    phone: '+91 98 1234 5678',
    address: 'Bandra West\nMumbai, Maharashtra 400050',
    hours: 'Monâ€“Fri Â· 10:00 AM â€“ 6:00 PM IST',
    sebiInaReg: 'INA000012345',
    regValidity: 'Permanent',
    raRegType: 'Individual',
    basMemberId: 'BASL2125',
    nismCertA: 'NISM Series-X-A Â· valid till 2029',
    nismCertB: 'NISM Series-X-B Â· valid till 2029',
    adviserName: 'Aanya Bhargava, CFP',
    adviserYears: '14 years in personal finance',
    adviserSign: 'I\'d rather lose a client than mis-sell to them.',
    heroEyebrow: 'SEBI Registered Investment Adviser Â· Fee-only Â· INA000012345',
    heroHeadlineLead: 'Your money decisions,',
    heroHeadlineEmph: 'finally uncomplicated.',
    heroSub: 'A SEBI-registered fee-only investment adviser. No commissions on what we recommend, no pressure to act â€” just clear thinking, written down, and reviewed with you every quarter.',
    heroCtaPrimary: 'Book a call',
    heroCtaSecondary: 'How we work',
    feesLabel: 'How we charge',
    feesHeadline: 'Fee-only. No commissions. Ever.',
    feesBody: 'We are paid only by you â€” never by AMCs, insurers, or brokers. It means we have no incentive to recommend one fund over another, or to suggest you buy anything you don\'t need.',
    feeFinePrint: 'Per SEBI (Investment Advisers) Regulations 2013, RIA fees do not exceed 2.5% of Assets under Advice per annum, or â‚¹1,25,000 fixed per family per annum. We never accept trail commissions, referral fees, or kickbacks on any product we recommend.',
    feePlans: [
      {
        name: 'Flat Fee Plan',
        price: 'â‚¹60,000 / year',
        priceNote: 'Per family Â· Paid quarterly',
        ideal: 'For investors with assets under â‚¹50 lakh',
        perks: [
          { label: 'Comprehensive financial plan, refreshed annually' },
          { label: 'Quarterly portfolio review calls (60 mins each)' },
          { label: 'Unlimited email questions across the year' },
          { label: 'Tax-saving review every January' },
          { label: 'Goal-mapping for retirement, education, and home' }
        ]
      },
      {
        name: 'AUA-Linked Plan',
        price: '0.75% of AUA / year',
        priceNote: 'Capped at 2.5% per SEBI norms',
        ideal: 'For investors with assets over â‚¹50 lakh',
        perks: [
          { label: 'Everything in the Flat Fee Plan, plus:' },
          { label: 'Monthly portfolio check-in calls (45 mins each)' },
          { label: 'Estate planning review with an empanelled lawyer' },
          { label: 'Dedicated WhatsApp line for urgent decisions' },
          { label: 'Annual in-person review at our Bandra office' }
        ]
      }
    ],
    approachLabel: 'What you can expect',
    approachHeadline: 'Not a salesperson. A second brain for your money.',
    approachBody: 'You\'ve probably been pitched a lot of things. We pitch nothing. We listen, we plan with you on a shared screen, and we put it all in writing. Then we review it together â€” four times a year, forever.',
    aboutPillars: [
      { icon: 'ðŸ¤', title: 'Fiduciary by law',        body: 'As a SEBI-registered RIA, we are legally obligated to act in your interest first â€” not the AMC\'s, not the insurer\'s, not ours.' },
      { icon: 'ðŸª¶', title: 'Fee-only model',          body: 'Our income comes entirely from the fee you pay. No trail commissions, no referral kickbacks, no product targets to hit.' },
      { icon: 'ðŸ“š', title: 'Evidence-based planning', body: 'Asset allocation, low-cost index exposure, goal-mapped buckets. We don\'t chase tips, themes, or someone\'s trading idea.' },
      { icon: 'ðŸ•¯', title: 'Calm, not clever',         body: 'We help you make boring, repeatable decisions that quietly compound â€” not exciting ones that make for great stories at parties.' }
    ],
    servicesLabel: 'What we help with',
    servicesHeadline: 'A full financial life â€” handled together.',
    servicesBody: 'From your first SIP to your estate plan, we work through every money decision with you. We don\'t sell insurance, mutual funds, or any product â€” we just help you make the choice yourself.',
    services: [
      { icon: 'ðŸŒ±', name: 'Financial Planning',      body: 'A written plan that maps your income, goals, and timelines. Reviewed and refreshed every year as life shifts.' },
      { icon: 'ðŸŽ¯', name: 'Goal Planning',           body: 'Retirement, child\'s education, home down-payment, sabbatical fund â€” each goal with its own portfolio bucket and timeline.' },
      { icon: 'ðŸªª', name: 'Investment Advisory',     body: 'Direct mutual funds, ETFs, fixed deposits, bonds. Allocation by asset class, not by product â€” and never by commission.' },
      { icon: 'ðŸ§¾', name: 'Tax Planning',            body: 'Optimise across 80C, 80D, capital-gains, NRE/NRO, and ESOP situations. Built into the plan, not bolted on in March.' },
      { icon: 'ðŸ¡', name: 'Estate Planning Review',  body: 'Will-writing, nominations, and succession structure. We coordinate with an empanelled lawyer for the legal side.' },
      { icon: 'ðŸ›¡', name: 'Insurance Review',         body: 'We review your existing covers and tell you what to keep, lapse, or top up. We earn nothing on any insurance product.' }
    ],
    processLabel: 'How we work together',
    processHeadline: 'From first call to first review â€” without the pitch.',
    processSteps: [
      { icon: 'â˜•', title: 'Discovery call',     body: 'A 30-minute chat over coffee or video. We listen to where you are, what worries you, and what you want money to do for you.', duration: '30 minutes' },
      { icon: 'ðŸ“', title: 'Written plan',       body: 'A 12â€“20 page financial plan, drafted with you on a shared screen across two working sessions. You sign it only if it makes sense.', duration: '2â€“3 weeks' },
      { icon: 'ðŸŒ¿', title: 'Implementation',     body: 'We help you set up SIPs, switch out high-cost funds, complete KYC, and sequence the transitions. No products are sold â€” only direct routes used.', duration: '2 weeks' },
      { icon: 'ðŸƒ', title: 'Quarterly catch-ups', body: 'A 60-minute review every quarter â€” what changed, what to leave alone, and what to revisit. Always with notes you keep.', duration: 'Ongoing' }
    ],
    aboutLabel: 'About the adviser',
    aboutHeadlineLead: 'A small practice',
    aboutHeadlineEmph: 'by design.',
    adviserBio: 'I started Saaransh Advisory in 2018 after a decade in wealth management, watching too many families being sold products they didn\'t need. The model never sat well with me â€” being paid by the same companies whose products I was supposed to assess. So I shut that down, completed NISM-X-A and NISM-X-B, registered with SEBI as an Investment Adviser (INA000012345), and went fee-only. Today I work with 40 families across India. I deliberately keep the practice small so I can know every client\'s plan by name.',
    credentials: [
      { label: 'SEBI RIA Â· INA000012345' },
      { label: 'NISM Series-X-A Â· Level 1' },
      { label: 'NISM Series-X-B Â· Level 2' },
      { label: 'CFP â€” Certified Financial Planner' },
      { label: 'BASL Member Â· BASL2125' },
      { label: '14 years in personal finance' }
    ],
    articlesLabel: 'From the journal',
    articlesHeadline: 'Notes we send to clients â€” and to you.',
    articlesBody: 'Plain-English writing on the questions we get asked most often. No bait-and-switch, no scary headlines â€” just the kind of explanation a friend who happens to be a CFP would write.',
    articles: [
      { category: 'Planning',    title: 'A boring guide to setting your first financial goal',          body: 'The four numbers you actually need before you can map a portfolio. Hint: returns isn\'t one of them.',  readTime: '6 min read' },
      { category: 'Investing',   title: 'Why we mostly recommend index funds (and when we don\'t)',     body: 'On the difference between active alpha and active fees â€” and how we think about a four-fund portfolio.', readTime: '8 min read' },
      { category: 'Tax',         title: 'What changed in this year\'s budget for the salaried investor', body: 'A short rundown on the new vs. old regime, NPS, ESOP taxation, and capital-gains rules to remember.', readTime: '5 min read' },
      { category: 'Retirement',  title: 'How much is "enough" â€” a framework, not a number',             body: 'The two-bucket method for retirement corpus â€” one for the worry, one for the warmth.',                 readTime: '7 min read' }
    ],
    testimonials: [
      { quote: 'For years I felt embarrassed about not understanding my own portfolio. Aanya walked me through it without making me feel small. The plan is two pages I actually read, not forty I never will.', name: 'Meera Bhatnagar',    role: 'Mumbai Â· 41, doctor',          productUsed: 'Comprehensive financial planning' },
      { quote: 'I came to test out the "fee-only" promise, half expecting an upsell. There never was one. We pay them, they help us, and there is nothing else hidden in the wiring. That trust is the whole product.',  name: 'Rohan Krishnamurthy', role: 'Bengaluru Â· 38, founder',     productUsed: 'AUA-linked plan' },
      { quote: 'After my husband passed, I had no idea what we owned or what to do with it. They sat with me for hours â€” twice â€” without charging more. Today my finances are organised, and I sleep better.',         name: 'Sushma Iyer',          role: 'Chennai Â· 62, retired',       productUsed: 'Estate planning + advisory' }
    ],
    grievanceLabel: 'Investor Care Â· Grievance Redressal',
    grievanceHeadline: 'A clear path, in case anything ever goes wrong.',
    grievanceBody: 'As a SEBI-registered Investment Adviser, Saaransh Advisory maintains a 4-tier grievance mechanism. All complaints are acknowledged within 24 hours and resolved within 21 working days as mandated by SEBI.',
    groName: 'Ms. Aanya Bhargava',
    groRole: 'Principal Officer & Compliance Officer',
    groEmail: 'compliance@saaranshadvisory.in',
    groPhone: '+91 98 1234 5679',
    groAddress: 'Saaransh Advisory\nBandra West, Mumbai â€” 400050\nMaharashtra',
    groTimings: 'Monâ€“Fri Â· 10:00 AM â€“ 6:00 PM IST',
    escalationLevels: [
      { level: 'Level 1 Â· Adviser / Principal Officer', body: 'Write to us directly. Most concerns are addressed in one conversation, almost always within 3 working days.', contact: 'compliance@saaranshadvisory.in',      tat: 'Within 7 days' },
      { level: 'Level 2 Â· BASL',                         body: 'BSE Administration & Supervision Ltd supervises SEBI-registered RIAs. Lodge unresolved complaints there.',  contact: 'investorgrievance.basl@bseindia.com',  tat: 'Within 15 days' },
      { level: 'Level 3 Â· SEBI SCORES',                  body: 'SEBI\'s official investor grievance portal. Register if unresolved after 21 days.',                          contact: 'scores.sebi.gov.in Â· 1800-266-7575', tat: 'Per SEBI norms' },
      { level: 'Level 4 Â· SMART ODR',                    body: 'Online Dispute Resolution platform for unresolved investor grievances against SEBI-registered intermediaries.', contact: 'smartodr.in',                          tat: 'Per SMART ODR norms' }
    ],
    disclosuresLabel: 'Required Disclosures',
    disclosuresHeadline: 'Everything SEBI asks an Investment Adviser to publish â€” gathered here.',
    disclosuresBody: 'Plain-language summaries with downloadable PDFs. If anything is unclear, please ask â€” we explain rather than send you to read fine print alone.',
    riskDocs: [
      { icon: 'ðŸ¤', title: 'Conflict of Interest Policy',  body: 'How we identify, disclose, and mitigate any conflicts that arise in advising you.' },
      { icon: 'ðŸ’¼', title: 'Business Model Note',          body: 'A one-pager on how we earn (fees only) and what we will never do (sell products for commission).' },
      { icon: 'ðŸ“œ', title: 'Terms of Advisory Service',    body: 'The standard advisory agreement clients sign â€” fees, scope, termination, and confidentiality.' },
      { icon: 'ðŸ§­', title: 'Risk Profiling Methodology',   body: 'The questionnaire and scoring approach we use to assess your risk capacity and tolerance.' },
      { icon: 'ðŸ“„', title: 'MITC â€” Most Important Terms',  body: 'A short summary of the most important terms in plain English. Always read this first.' },
      { icon: 'ðŸ†”', title: 'KYC & On-boarding Forms',      body: 'PAN, Aadhaar, address-proof, and risk-profile forms. Most of this is now paperless via DigiLocker.' }
    ],
    ctaHeadline: 'Have a 30-minute chat. No pitch. No obligation.',
    ctaBody: 'If your money decisions have been quietly stressing you out, this is the cheapest way to find out whether a written plan would help.',
    ctaButton: 'Book a call',
    ctaNote: 'Fee-only Â· SEBI Registered Â· INA000012345'
  };
}

// â”€â”€ Per-template data picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function sampleFor(templateId) {
  if (templateId === 'template-2')  return agencySample();
  if (templateId === 'template-3')  return terminalSample();
  if (templateId === 'template-4')  return web3Sample();
  if (templateId === 'template-5')  return localSample();
  if (templateId === 'template-6')  return bfsiSample();
  if (templateId === 'template-7')  return startupSample();
  if (templateId === 'template-8')  return insuranceSample();
  if (templateId === 'template-9')  return nbfcSample();
  if (templateId === 'template-10') return restaurantSample();
  if (templateId === 'template-11') return portfolioSample();
  if (templateId === 'template-12') return insurtechSample();
  if (templateId === 'template-13') return insuranceMarketSample();
  if (templateId === 'template-14') return mfDistributorSample();
  if (templateId === 'template-15') return stockBrokerSample();
  if (templateId === 'template-16') return sebiRiaSample();
  return commonSample;
}

// â”€â”€ Render one template safely â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderOne(n) {
  const file = path.join(__dirname, `website-template-${n}.ejs`);
  if (!fs.existsSync(file)) {
    return { ok: false, html: errorPage(n, `Template file not found: ${file}`) };
  }
  const tpl = fs.readFileSync(file, 'utf8');
  const data = buildTemplateData(sampleFor(`template-${n}`));
  try {
    const html = ejs.render(tpl, data, { filename: file });
    return { ok: true, html };
  } catch (err) {
    return { ok: false, html: errorPage(n, err.message) };
  }
}

function errorPage(n, message) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Template ${n} â€” error</title>
<style>
  body{font-family:system-ui,sans-serif;background:#1a1315;color:#f5e1d0;padding:32px;line-height:1.6}
  h1{color:#ff8c7a;font-size:1.1rem;margin-bottom:10px}
  pre{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:14px;font-size:.78rem;white-space:pre-wrap;word-break:break-word;color:#ffbea8}
  p{font-size:.85rem;color:rgba(245,225,208,.7);margin-top:12px}
</style>
</head><body>
  <h1>Template ${n} couldn't render</h1>
  <p>This template hasn't been updated to the new schema pattern yet. It expects specific data keys that aren't in the sample.</p>
  <pre>${String(message).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</pre>
</body></html>`;
}

// â”€â”€ Write individual preview files â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const OUTDIR = __dirname;
const TEMPLATES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const NAMES = {
  1: 'Editorial',   2: 'Agency',     3: 'Terminal',  4: 'Web3',
  5: 'Local',       6: 'BFSI',       7: 'Startup',   8: 'Insurance',
  9: 'NBFC',       10: 'Restaurant', 11: 'Portfolio',
  12: 'InsurTech SaaS', 13: 'Insurance Market', 14: 'MF Distributor',
  15: 'Stock Broker', 16: 'SEBI RIA'
};

const results = TEMPLATES.map(n => {
  const r = renderOne(n);
  const outPath = path.join(OUTDIR, `preview-${n}.html`);
  fs.writeFileSync(outPath, r.html);
  return { n, ok: r.ok, outPath, file: `preview-${n}.html` };
});

// Print summary
console.log('\nRender results:');
results.forEach(r => console.log(`  ${r.ok ? 'âœ“' : 'âœ—'}  template-${r.n}  (${NAMES[r.n]})`));

const okCount = results.filter(r => r.ok).length;
console.log(`\nâœ“ Wrote ${results.length} preview files`);
console.log(`  ${okCount}/${results.length} templates rendered cleanly`);
