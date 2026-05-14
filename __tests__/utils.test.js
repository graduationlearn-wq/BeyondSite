'use strict';

const path = require('path');
const { extractJSON, templatePath, buildTemplateData } = require('../src/lib/utils');

// ── extractJSON ─────────────────────────────────────────────────────────────

describe('extractJSON', () => {
  test('parses a plain JSON object', () => {
    const result = extractJSON('{"heroHeadline":"Hello World"}');
    expect(result).toEqual({ heroHeadline: 'Hello World' });
  });

  test('parses a JSON array', () => {
    const result = extractJSON('[{"name":"Item 1"},{"name":"Item 2"}]');
    expect(result).toEqual([{ name: 'Item 1' }, { name: 'Item 2' }]);
  });

  test('strips ```json markdown fences', () => {
    const input = '```json\n{"key":"value"}\n```';
    expect(extractJSON(input)).toEqual({ key: 'value' });
  });

  test('strips plain ``` fences', () => {
    const input = '```\n{"key":"value"}\n```';
    expect(extractJSON(input)).toEqual({ key: 'value' });
  });

  test('extracts JSON embedded in prose', () => {
    const input = 'Here is the result: {"heroHeadline":"Great"} — hope that helps!';
    expect(extractJSON(input)).toEqual({ heroHeadline: 'Great' });
  });

  test('throws on empty string', () => {
    expect(() => extractJSON('')).toThrow('Empty response from AI');
  });

  test('throws on null', () => {
    expect(() => extractJSON(null)).toThrow('Empty response from AI');
  });

  test('throws on undefined', () => {
    expect(() => extractJSON(undefined)).toThrow('Empty response from AI');
  });

  test('throws on text with no JSON', () => {
    expect(() => extractJSON('Sorry, I cannot help with that.')).toThrow();
  });

  test('throws on malformed JSON', () => {
    expect(() => extractJSON('{"key": broken}')).toThrow();
  });
});

// ── templatePath ────────────────────────────────────────────────────────────

describe('templatePath', () => {
  const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

  test('returns correct path for a template that exists', () => {
    expect(templatePath('template-1')).toBe(
      path.join(TEMPLATES_DIR, 'website-template-1.ejs')
    );
  });

  test('falls back to template-1 for a slug that does not exist', () => {
    expect(templatePath('template-nonexistent-xyz')).toBe(
      path.join(TEMPLATES_DIR, 'website-template-1.ejs')
    );
  });

  test('falls back to template-1 when called with no argument', () => {
    expect(templatePath()).toBe(
      path.join(TEMPLATES_DIR, 'website-template-1.ejs')
    );
  });

  test('strips path-traversal characters', () => {
    expect(templatePath('../etc/passwd')).toBe(
      path.join(TEMPLATES_DIR, 'website-template-1.ejs')
    );
  });

  test('returns correct path for template-5 (known to exist)', () => {
    expect(templatePath('template-5')).toBe(
      path.join(TEMPLATES_DIR, 'website-template-5.ejs')
    );
  });
});

// ── buildTemplateData ───────────────────────────────────────────────────────

describe('buildTemplateData', () => {
  test('returns defaults for an empty payload', () => {
    const data = buildTemplateData({});
    expect(data.businessName).toBe('');
    expect(data.tagline).toBe('');
    expect(data.primaryColor).toBe('#c0392b');
    expect(data.tone).toBe('professional');
    expect(data.year).toBe(new Date().getFullYear());
  });

  test('trims whitespace from businessName and tagline', () => {
    const data = buildTemplateData({ businessName: '  Acme  ', tagline: '  The best  ' });
    expect(data.businessName).toBe('Acme');
    expect(data.tagline).toBe('The best');
  });

  test('preserves an explicitly set primaryColor', () => {
    const data = buildTemplateData({ primaryColor: '#00dcb4' });
    expect(data.primaryColor).toBe('#00dcb4');
  });

  test('splits comma-separated products string into an array', () => {
    const data = buildTemplateData({ products: 'Health, Motor, Term Life' });
    expect(data.products).toEqual(['Health', 'Motor', 'Term Life']);
  });

  test('keeps an existing array for products unchanged', () => {
    const arr = [{ name: 'Health' }, { name: 'Motor' }];
    const data = buildTemplateData({ products: arr });
    expect(data.products).toEqual(arr);
  });

  test('falls back about to aboutBody when about is missing', () => {
    const data = buildTemplateData({ aboutBody: 'We are a company.' });
    expect(data.about).toBe('We are a company.');
  });

  test('falls back email to primaryEmail', () => {
    const data = buildTemplateData({ primaryEmail: 'hello@example.com' });
    expect(data.email).toBe('hello@example.com');
  });

  test('falls back phone to primaryPhone', () => {
    const data = buildTemplateData({ primaryPhone: '+91 98765 43210' });
    expect(data.phone).toBe('+91 98765 43210');
  });

  test('defaults every string key to empty string when missing', () => {
    const data = buildTemplateData({});
    expect(data.heroEyebrow).toBe('');
    expect(data.ctaHeadline).toBe('');
    expect(data.complianceBody).toBe('');
    expect(data.whyLabel).toBe('');
  });

  test('defaults every array key to empty array when missing', () => {
    const data = buildTemplateData({});
    expect(Array.isArray(data.services)).toBe(true);
    expect(data.services).toHaveLength(0);
    expect(Array.isArray(data.howSteps)).toBe(true);
    expect(Array.isArray(data.categories)).toBe(true);
    expect(Array.isArray(data.footerLinks)).toBe(true);
  });

  test('does not overwrite a string field that is already set', () => {
    const data = buildTemplateData({ heroEyebrow: 'IRDAI Licensed' });
    expect(data.heroEyebrow).toBe('IRDAI Licensed');
  });

  test('does not overwrite an array field that is already set', () => {
    const items = [{ title: 'Step 1' }];
    const data = buildTemplateData({ howSteps: items });
    expect(data.howSteps).toEqual(items);
  });

  test('does not mutate the original payload object', () => {
    const payload = { businessName: 'Original' };
    buildTemplateData(payload);
    expect(payload.primaryColor).toBeUndefined();
  });
});
