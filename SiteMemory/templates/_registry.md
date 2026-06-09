# Template Registry

Master index of all 19 templates. One row per template — quick scan to know what we have. For implementation details, read the schema (`templates/schemas/template-N.json`) and EJS (`templates/website-template-N.ejs`) directly.

| #  | Display Name                  | Aesthetic / Palette                                                       | Sample brand            | Industry / Use case                                                                  | Schema-driven? | Compliance |
|----|---                            |---                                                                         |---                      |---                                                                                    |---             |---         |
| 1  | **Editorial**                 | Newspaper / magazine, serif                                                | Apex Studio             | Generic creative / publishing                                                         | Partial *      | —          |
| 2  | **Agency / Noir**             | Black + gold, premium creative studio                                      | Noir Studio             | Brand / design studios, creative agencies                                             | ✓              | —          |
| 3  | **Terminal / Dev Studio**     | CRT green + monospace, IDE feel                                            | Forge Labs              | Engineering studios, dev consultancies                                                | ✓              | —          |
| 4  | **Web3 / Protocol**           | Dark + cyan, dashboard hero                                                | Helix Protocol          | Web3 protocols, on-chain infrastructure                                               | ✓              | —          |
| 5  | **Local Service**             | Warm orange + cream                                                        | Riverbend Plumbing      | Plumbers, electricians, local trades                                                  | ✓              | —          |
| 6  | **BFSI / Banking**            | Navy + gold, institutional                                                 | Meridian Capital (Bank) | Banks, NBFC-Ds with deposits, large BFSI                                              | ✓              | RBI · DICGC |
| 7  | **Startup / SaaS**            | Cool blue + white, modern fintech feel                                     | Voltline                | B2B SaaS, AI products, startups                                                       | ✓              | —          |
| 8  | **Insurance Advisor**         | Calm green                                                                 | Ananya Sharma & Assoc.  | Independent IRDAI advisors, brokers, agents                                           | ✓              | IRDAI      |
| 9  | **NBFC / Lender**             | Cream + dark teal + warm orange                                            | Meridian Capital (NBFC) | Lending NBFCs (personal/business/home/gold loans)                                     | ✓              | RBI · NBFC-ICC |
| 10 | **Restaurant / Café**         | Cream + burgundy + Fraunces serif                                          | Trattoria Verde         | Restaurants, cafés, bistros                                                           | ✓              | —          |
| 11 | **Portfolio / Freelancer**    | Pure black/white, big serif                                                | Aria Mehta              | Solo designers, writers, photographers, freelancers                                   | ✓              | —          |
| 12 | **InsurTech SaaS**            | Light · Stripe-pattern · dark code panel                                   | Stratus                 | B2B InsurTech APIs, embedded-insurance platforms                                      | ✓              | SOC 2 · IRDAI-aligned |
| 13 | **Insurance Market**          | Bright green + gold, consumer aggregator                                   | Coverwise               | IRDAI-licensed insurance brokers, comparison platforms                                | ✓              | IRDAI      |
| 14 | **Mutual Fund Distributor**   | Sandstone + maroon + brass, Playfair serif                                 | Vrddhi Wealth           | AMFI-registered ARN holders, MF distributors/advisors                                 | ✓              | AMFI · SEBI SCORES |
| 15 | **Stock Broker / Demat**      | Violet + white, Plus Jakarta display, phone-mockup hero                    | Stallion Capital        | SEBI-registered stock brokers offering equities, F&O, MF, IPO, ETFs, MTF, commodities | ✓              | SEBI · NSE · BSE · MCX · CDSL/NSDL · SCORES · SMART ODR |
| 16 | **SEBI RIA**                  | Sage + cream + peach, Fraunces serif, warm/casual, portrait card           | Saaransh Advisory       | SEBI-registered fee-only Investment Advisers                                          | ✓              | SEBI INA · BASL · SCORES · SMART ODR |
| 17 | **Healthcare Clinic / Hospital** | White + soft sky-blue + mint, cartoon doctor SVGs                       | Aarogya Hospital        | NABH-accredited multi-specialty hospitals & clinics                                   | ✓              | NMC · NABH · Clinical Establishment Act · BMW |
| 18 | **Diagnostic Lab / Pathology** | Lab-blue + amber + beaker green, test-tube cluster + periodic-table grid + sample report | Nidaan Diagnostics | NABL/CAP-accredited diagnostic labs                                                  | ✓              | NABL · CAP · ICMR · CEA · BMW · PCPNDT |
| 19 | **Loan DSA**                  | Deep indigo + electric lime + cream, interactive EMI calc + sticky mobile CTA | DhanSetu Loans       | RBI-aligned Direct Sales Agents intermediating loans across banks/NBFCs               | ✓              | RBI Outsourcing · IBA Code of Conduct · DPDP · Sachet · Ombudsman |

\* Template-1 (Editorial) still on legacy non-safe-locals pattern. Refactor on roadmap.

## Sample-brand notes

Templates 12 and 13 originally shipped under codenames "Heph" and "Turtlemint". Both have been renamed in sample data and copy to neutral, demo-safe names — **Stratus** and **Coverwise** — to avoid surfacing real third-party brand names in the picker preview. The thumbnail CSS classes (`template-heph-prev` / `template-turtlemint-prev`) still carry the old codenames and are slated for a low-priority rename. → [[ADR#ADR-018|ADR-018]]

## Compliance flag templates

Ten templates carry the `complianceReview` block at the top of their schema. The form-renderer surfaces an amber warning banner above the form when these are selected, reminding users that AI-generated regulatory copy must be reviewed before publishing:

- **Template 6** (BFSI / Banking) — RBI registration, DICGC deposit insurance disclosures
- **Template 8** (Insurance Advisor) — IRDAI licence, claim-process descriptions
- **Template 9** (NBFC / Lender) — RBI registration, NBFC category, Fair Practice Code, Grievance Redressal escalation
- **Template 13** (Insurance Market) — IRDAI broker licence, partner insurer disclosures
- **Template 14** (Mutual Fund Distributor) — AMFI ARN + EUIN, mandatory MF risk disclaimer, past-performance disclaimer, KYC/CKYC section, SEBI SCORES 4-tier grievance escalation
- **Template 15** (Stock Broker / Demat) — SEBI registration, NSE/BSE/MCX member codes, CDSL/NSDL DP ID, CIN, full brokerage schedule, ATTENTION INVESTORS block, 5-tier escalation (Customer Care → Compliance Officer → Exchange → SCORES → SMART ODR), Investor Charter + RDD + MITC downloads
- **Template 16** (SEBI RIA) — SEBI INA registration, BASL membership, NISM Series-X-A + X-B, type of registration, fee-only positioning, SEBI fee cap (2.5% AUA or ₹1.25L/yr/family), conflict-of-interest + business-model + advisory-terms disclosures, 4-tier escalation (Adviser → BASL → SCORES → SMART ODR)
- **Template 17** (Healthcare Clinic / Hospital) — NMC registration, NABH accreditation, Clinical Establishment Act state reg, BMW authorisation, drug licence, mandatory medical-advice and emergency disclaimers, Drugs & Magic Remedies Act notice, 4-tier patient grievance (Officer → Med Sup → State Medical Council → DGHS)
- **Template 18** (Diagnostic Lab / Pathology) — NABL (ISO 15189), CAP cert, ICMR registration, CEA, BMW, PCPNDT registration, reference-range disclaimer, **explicit PCPNDT illegality notice**, DPDP Act 2023 confidentiality, 4-tier escalation (Quality Officer → Med Director → NABL → State Council / DHO)
- **Template 19** (Loan DSA) — DSA empanelment with named lender banks, IBA Code of Conduct (2007), RBI Outsourcing Master Direction, CIN + GSTIN, mandatory "₹0 customer fees / lender pays commission" disclosure repeated in 3 places, "lender has final say" + "no guaranteed approvals" disclaimers, 4-tier escalation (Customer Care → Compliance Officer → Lender Bank → RBI Sachet / Banking Ombudsman)

## Aesthetic differentiation matrix

No two templates share an accent colour. Quick scan:

| Aesthetic axis            | Templates                                                    |
|---                         |---                                                            |
| Dark + neon (1 of)         | Terminal (green), Web3 (cyan)                                 |
| Dark + warm (1 of)         | Agency Noir (gold), BFSI (gold)                              |
| Light + warm               | Local Service (orange), Restaurant (burgundy), NBFC (orange)  |
| Light + cool               | Startup (blue), Insurance (green), Insurance Market (green)   |
| Light + dark code panel    | InsurTech (Stripe-pattern, dark hero panel)                   |
| Light + violet (fintech)   | Stock Broker (purple Groww-style with phone mockup)           |
| Warm casual (advisory)     | SEBI RIA (sage+cream+peach Fraunces, portrait card)            |
| Clean medical              | Healthcare Clinic (white+sky-blue+mint, cartoon doctors)       |
| Lab-bench scientific       | Diagnostic Lab (lab-blue+amber+green+test tubes+periodic grid) |
| Fintech bold (mobile-first) | Loan DSA (deep indigo+electric lime+EMI calc+sticky CTA)      |
| Pure mono                  | Editorial (newspaper), Portfolio (B&W)                        |

## Catalogue gaps

Currently missing templates that would round out the catalogue (per ROADMAP):

- **Education / Coaching Institute** — courses, faculty, batch timings, results
- **Real Estate Agency / RERA Agent** — listings grid, RERA registration disclosure, neighbourhoods, agent profile
- **Fitness / Gym / Yoga** — class schedule, trainer profiles, membership tiers
- **CA Firm / Tax Consultant** — ICAI / GST practitioner disclosures, services, audit calendar
- **Pharmacy / Online Pharmacy** — Drug licence, State Pharmacy Council, Rx-required tag

After 19 total, refactor schemas to support **template families** (`extends: ["_base", "_finance"]`) before adding aesthetic variants per topic. The Indian-regulated-SMB moat is now well-defended (Templates 6, 8, 9, 13, 14, 15, 16, 17, 18, 19 — ten regulated verticals shipped).

## How to add to this registry

When a new template ships:
1. Add a row to the table above with display name, aesthetic, sample brand, use case, and compliance flag.
2. Update the "Aesthetic differentiation matrix" if it adds a new axis or if its colour collides with an existing one (which shouldn't happen — see [[02_CONVENTIONS]]).
3. Remove the entry from "Catalogue gaps" if applicable.
4. Update the count in [[01_CURRENT_STATE]] and [[00_BRIEF]].
5. Append a new round to [[CHANGELOG]] documenting what shipped.

## Related

- [[02_CONVENTIONS]] — the six-wired-artifacts rule that governs adding templates
- [[04_template-system]] — the schema → EJS pipeline templates flow through
- [[ROADMAP#Pillar 4 — Catalogue expansion (when there's customer demand)|ROADMAP Pillar 4]] — the next batch of templates planned
- [[ADR#ADR-008 — Compliance review banner on regulated templates not on every template|ADR-008]] — origin of the `complianceReview` flag pattern
- [[ADR#ADR-011 — Indian regulatory differentiation as the moat|ADR-011]] — why we lean into regulatory templates
