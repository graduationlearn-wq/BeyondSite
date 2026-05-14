'use strict';

const PAYMENT_TTL_MS = 30 * 60 * 1000; // 30 minutes

// In-memory store — replaced by real payment webhook store (Stripe/Razorpay) at deployment.
const payments = new Map();

function consumePayment(paymentId) {
  const p = payments.get(paymentId);
  if (!p)       return { ok: false, reason: 'Invalid payment' };
  if (p.usedAt) return { ok: false, reason: 'Payment already used' };
  if (Date.now() - p.createdAt > PAYMENT_TTL_MS) return { ok: false, reason: 'Payment expired' };
  p.usedAt = Date.now();
  return { ok: true };
}

module.exports = { payments, PAYMENT_TTL_MS, consumePayment };
