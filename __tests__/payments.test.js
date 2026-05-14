'use strict';

const { payments, PAYMENT_TTL_MS, consumePayment } = require('../src/lib/payments');

// Reset the payments Map before each test so tests don't bleed into each other.
beforeEach(() => payments.clear());

describe('consumePayment', () => {
  test('returns error for an unknown paymentId', () => {
    const result = consumePayment('pay_doesnotexist');
    expect(result).toEqual({ ok: false, reason: 'Invalid payment' });
  });

  test('accepts a valid fresh payment and marks it used', () => {
    payments.set('pay_abc123', { amount: 9, currency: 'USD', createdAt: Date.now(), usedAt: null });
    const result = consumePayment('pay_abc123');
    expect(result).toEqual({ ok: true });
  });

  test('marks the payment as used after first consumption', () => {
    payments.set('pay_abc123', { amount: 9, currency: 'USD', createdAt: Date.now(), usedAt: null });
    consumePayment('pay_abc123');
    expect(payments.get('pay_abc123').usedAt).not.toBeNull();
  });

  test('rejects a payment that has already been used', () => {
    payments.set('pay_used', { amount: 9, currency: 'USD', createdAt: Date.now(), usedAt: Date.now() });
    const result = consumePayment('pay_used');
    expect(result).toEqual({ ok: false, reason: 'Payment already used' });
  });

  test('rejects a payment that has expired', () => {
    const expired = Date.now() - PAYMENT_TTL_MS - 1000; // 1 second past TTL
    payments.set('pay_expired', { amount: 9, currency: 'USD', createdAt: expired, usedAt: null });
    const result = consumePayment('pay_expired');
    expect(result).toEqual({ ok: false, reason: 'Payment expired' });
  });

  test('accepts a payment that is just within TTL', () => {
    const justInTime = Date.now() - PAYMENT_TTL_MS + 5000; // 5 seconds before expiry
    payments.set('pay_fresh', { amount: 9, currency: 'USD', createdAt: justInTime, usedAt: null });
    const result = consumePayment('pay_fresh');
    expect(result).toEqual({ ok: true });
  });

  test('does not allow consuming the same payment twice', () => {
    payments.set('pay_once', { amount: 9, currency: 'USD', createdAt: Date.now(), usedAt: null });
    expect(consumePayment('pay_once')).toEqual({ ok: true });
    expect(consumePayment('pay_once')).toEqual({ ok: false, reason: 'Payment already used' });
  });
});
