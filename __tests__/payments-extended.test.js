'use strict';

// Must be set BEFORE requiring payments.js so verifyRazorpaySignature has a valid key.
// In CI, RAZORPAY_KEY_SECRET is not configured by default, so we provide a test-only fallback.
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret';

const crypto = require('crypto');
const { payments, PAYMENT_TTL_MS, consumePayment, createPayment, verifyRazorpaySignature, markPaymentPaid } = require('../src/lib/payments');

beforeEach(() => payments.clear());

describe('consumePayment', () => {
  test('returns error for an unknown paymentId', async () => {
    const result = await consumePayment('pay_doesnotexist');
    expect(result).toEqual({ ok: false, reason: 'Invalid payment' });
  });

  test('accepts a valid fresh payment and marks it used', async () => {
    payments.set('pay_abc123', { amount: 499900, currency: 'INR', createdAt: Date.now(), usedAt: null });
    const result = await consumePayment('pay_abc123');
    expect(result).toEqual({ ok: true });
  });

  test('marks the payment as used after first consumption', async () => {
    payments.set('pay_abc123', { amount: 499900, currency: 'INR', createdAt: Date.now(), usedAt: null });
    await consumePayment('pay_abc123');
    expect(payments.get('pay_abc123').usedAt).not.toBeNull();
  });

  test('rejects a payment that has already been used', async () => {
    payments.set('pay_used', { amount: 499900, currency: 'INR', createdAt: Date.now(), usedAt: Date.now() });
    const result = await consumePayment('pay_used');
    expect(result).toEqual({ ok: false, reason: 'Payment already used' });
  });

  test('rejects a payment that has expired', async () => {
    const expired = Date.now() - PAYMENT_TTL_MS - 1000;
    payments.set('pay_expired', { amount: 499900, currency: 'INR', createdAt: expired, usedAt: null });
    const result = await consumePayment('pay_expired');
    expect(result).toEqual({ ok: false, reason: 'Payment expired' });
  });

  test('accepts a payment that is just within TTL', async () => {
    const justInTime = Date.now() - PAYMENT_TTL_MS + 5000;
    payments.set('pay_fresh', { amount: 499900, currency: 'INR', createdAt: justInTime, usedAt: null });
    const result = await consumePayment('pay_fresh');
    expect(result).toEqual({ ok: true });
  });

  test('does not allow consuming the same payment twice', async () => {
    payments.set('pay_once', { amount: 499900, currency: 'INR', createdAt: Date.now(), usedAt: null });
    expect(await consumePayment('pay_once')).toEqual({ ok: true });
    expect(await consumePayment('pay_once')).toEqual({ ok: false, reason: 'Payment already used' });
  });

  test('rejects payment not verified when provider is razorpay', async () => {
    const originalProvider = process.env.PAYMENT_PROVIDER;
    process.env.PAYMENT_PROVIDER = 'razorpay';
    jest.resetModules();

    const { payments: freshPayments, consumePayment: freshConsume } = require('../src/lib/payments');
    freshPayments.set('pay_unverified', { amount: 499900, currency: 'INR', createdAt: Date.now(), usedAt: null, status: 'CREATED' });
    const result = await freshConsume('pay_unverified');
    expect(result.ok).toBe(false);

    process.env.PAYMENT_PROVIDER = originalProvider;
  });
});

describe('createPayment', () => {
  test('creates dummy payment with default values', async () => {
    const result = await createPayment({ templateId: 'template-5' });
    expect(result.paymentId).toBeDefined();
    expect(result.providerData.provider).toBe('dummy');
    expect(result.providerData.amount).toBe(499900);
    expect(result.providerData.currency).toBe('INR');
  });

  test('creates dummy payment with custom amount', async () => {
    const result = await createPayment({ templateId: 'template-8', amount: 999900, currency: 'USD' });
    expect(result.providerData.amount).toBe(999900);
    expect(result.providerData.currency).toBe('USD');
  });

  test('stores payment in map', async () => {
    const result = await createPayment({ templateId: 'template-5' });
    const stored = payments.get(result.paymentId);
    expect(stored).toBeDefined();
    expect(stored.status).toBe('PAID');
    expect(stored.templateId).toBe('template-5');
  });

  test('paymentId starts with dummy_ prefix', async () => {
    const result = await createPayment({ templateId: 'template-5' });
    expect(result.paymentId.startsWith('dummy_')).toBe(true);
  });
});

describe('verifyRazorpaySignature', () => {
  test('returns true for valid signature', () => {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
    const orderId = 'order_123';
    const paymentId = 'pay_456';
    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

    const result = verifyRazorpaySignature({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: expected
    });
    expect(result).toBe(true);
  });

  test('returns false for invalid signature', () => {
    const result = verifyRazorpaySignature({
      razorpay_order_id: 'order_123',
      razorpay_payment_id: 'pay_456',
      razorpay_signature: 'invalid_signature'
    });
    expect(result).toBe(false);
  });

  test('returns false for tampered order ID', () => {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
    const orderId = 'order_123';
    const paymentId = 'pay_456';
    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

    const result = verifyRazorpaySignature({
      razorpay_order_id: 'order_tampered',
      razorpay_payment_id: paymentId,
      razorpay_signature: expected
    });
    expect(result).toBe(false);
  });
});

describe('markPaymentPaid', () => {
  test('marks existing payment as PAID', async () => {
    payments.set('order_123', { paymentId: 'order_123', status: 'CREATED', createdAt: Date.now(), usedAt: null });
    const result = await markPaymentPaid('order_123', 'pay_456');
    expect(result).toBe(true);
    expect(payments.get('order_123').status).toBe('PAID');
    expect(payments.get('order_123').razorpayPaymentId).toBe('pay_456');
  });

  test('returns false for non-existent order', async () => {
    const result = await markPaymentPaid('order_nonexistent', 'pay_456');
    expect(result).toBe(false);
  });

  test('marks payment without razorpayPaymentId', async () => {
    payments.set('order_789', { paymentId: 'order_789', status: 'CREATED', createdAt: Date.now(), usedAt: null });
    const result = await markPaymentPaid('order_789');
    expect(result).toBe(true);
    expect(payments.get('order_789').status).toBe('PAID');
  });
});

describe('PAYMENT_TTL_MS', () => {
  test('TTL is 30 minutes', () => {
    expect(PAYMENT_TTL_MS).toBe(30 * 60 * 1000);
  });
});

describe('PROVIDER', () => {
  test('provider value is one of expected values', () => {
    const { PROVIDER } = require('../src/lib/payments');
    expect(['dummy', 'razorpay', 'stripe']).toContain(PROVIDER);
  });
});
