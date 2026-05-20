'use strict';

const { payments, PAYMENT_TTL_MS, consumePayment } = require('../src/lib/payments');

// Reset the payments Map before each test so tests don't bleed into each other.
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
    const expired = Date.now() - PAYMENT_TTL_MS - 1000; // 1 second past TTL
    payments.set('pay_expired', { amount: 499900, currency: 'INR', createdAt: expired, usedAt: null });
    const result = await consumePayment('pay_expired');
    expect(result).toEqual({ ok: false, reason: 'Payment expired' });
  });

  test('accepts a payment that is just within TTL', async () => {
    const justInTime = Date.now() - PAYMENT_TTL_MS + 5000; // 5 seconds before expiry
    payments.set('pay_fresh', { amount: 499900, currency: 'INR', createdAt: justInTime, usedAt: null });
    const result = await consumePayment('pay_fresh');
    expect(result).toEqual({ ok: true });
  });

  test('does not allow consuming the same payment twice', async () => {
    payments.set('pay_once', { amount: 499900, currency: 'INR', createdAt: Date.now(), usedAt: null });
    expect(await consumePayment('pay_once')).toEqual({ ok: true });
    expect(await consumePayment('pay_once')).toEqual({ ok: false, reason: 'Payment already used' });
  });
});
