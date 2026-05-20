'use strict';

const crypto = require('crypto');

// Declare these before any require() that might trigger dotenv.config() via
// src/lib/config.js, so the test-env value isn't overwritten by .env.
const PAYMENT_TTL_MS = 30 * 60 * 1000;
const PROVIDER = (process.env.PAYMENT_PROVIDER || 'dummy').toLowerCase();

let logger = console;
let db = null;
try { logger = require('./logger'); } catch (_) {}
try { db = require('./database'); } catch (_) {}

// In-memory fallback — used when DATABASE_URL is not configured, and by tests.
// Exported as `payments` so existing test helpers (payments.set / payments.clear)
// keep working unchanged.
const payments = new Map();

/** Returns the Prisma singleton, or null when the DB is not configured. */
function getPrisma() {
  return db ? db.prisma : null;
}

// ─── Dummy provider ──────────────────────────────────────────────────────────

async function createDummyPayment({ userId = null, templateId, amount = 499900, currency = 'INR' } = {}) {
  const paymentId = 'dummy_' + crypto.randomBytes(12).toString('hex');

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.payment.create({
        data: { paymentId, userId: userId || null, templateId, amount, currency, status: 'PAID' }
      });
    } catch (err) {
      logger.error({ error: err.message }, 'DB createDummyPayment failed — falling back to in-memory');
      payments.set(paymentId, { paymentId, userId, templateId, amount, currency, status: 'PAID', createdAt: Date.now(), usedAt: null });
    }
  } else {
    payments.set(paymentId, { paymentId, userId, templateId, amount, currency, status: 'PAID', createdAt: Date.now(), usedAt: null });
  }

  return { paymentId, orderId: paymentId, providerData: { provider: 'dummy', amount, currency } };
}

// ─── Razorpay provider ───────────────────────────────────────────────────────

let _rzp = null;
function getRzp() {
  if (!_rzp) {
    const Razorpay = require('razorpay');
    _rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  }
  return _rzp;
}

async function createRazorpayPayment({ userId = null, templateId, amount = 499900, currency = 'INR' } = {}) {
  const rzp = getRzp();
  const order = await rzp.orders.create({
    amount, currency,
    receipt: `tpl_${templateId}_${Date.now()}`,
    notes: { userId: userId || 'guest', templateId }
  });

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.payment.create({
        data: {
          paymentId:       order.id,
          userId:          userId || null,
          templateId,
          amount,
          currency,
          status:          'CREATED',
          razorpayOrderId: order.id
        }
      });
    } catch (err) {
      logger.error({ error: err.message }, 'DB createRazorpayPayment failed — falling back to in-memory');
      payments.set(order.id, { paymentId: order.id, userId, templateId, amount, currency, status: 'CREATED', createdAt: Date.now(), usedAt: null, razorpayPaymentId: null });
    }
  } else {
    payments.set(order.id, { paymentId: order.id, userId, templateId, amount, currency, status: 'CREATED', createdAt: Date.now(), usedAt: null, razorpayPaymentId: null });
  }

  return {
    paymentId:    order.id,
    orderId:      order.id,
    providerData: { provider: 'razorpay', keyId: process.env.RAZORPAY_KEY_ID, amount, currency }
  };
}

// Called from /api/payments/verify after the Razorpay checkout widget succeeds.
function verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  return expected === razorpay_signature;
}

// Mark a payment PAID after client-side signature verification.
async function markPaymentPaid(orderId, razorpayPaymentId) {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const result = await prisma.payment.updateMany({
        where: { paymentId: orderId },
        data:  { status: 'PAID', razorpayPaymentId: razorpayPaymentId || null }
      });
      return result.count > 0;
    } catch (err) {
      logger.error({ error: err.message, orderId }, 'DB markPaymentPaid failed — falling back to in-memory');
    }
  }
  // In-memory fallback
  const p = payments.get(orderId);
  if (!p) return false;
  p.status = 'PAID';
  p.razorpayPaymentId = razorpayPaymentId || null;
  return true;
}

// ─── Webhook (server-to-server Razorpay events) ──────────────────────────────

function verifyRazorpayWebhook({ headers, rawBody }) {
  const signature = headers['x-razorpay-signature'];
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  if (signature !== expected) throw new Error('Invalid webhook signature');
  const event = JSON.parse(rawBody);
  return {
    ok:                true,
    paymentId:         event.payload.payment.entity.order_id,
    razorpayPaymentId: event.payload.payment.entity.id,
    status:            event.event === 'payment.captured' ? 'PAID' : 'FAILED'
  };
}

// ─── consumePayment — called by /api/generate before zipping ─────────────────
//
// Now async so DB reads/writes can be awaited. The route already lives inside
// an async handler so `await consumePayment(paymentId)` is a drop-in swap.
// When prisma is null the function resolves immediately via the in-memory Map.

async function consumePayment(paymentId) {
  const prisma = getPrisma();

  if (prisma) {
    try {
      // Validate state before attempting the atomic write
      const p = await prisma.payment.findUnique({ where: { paymentId } });
      if (!p)       return { ok: false, reason: 'Invalid payment' };
      if (p.usedAt) return { ok: false, reason: 'Payment already used' };
      if (Date.now() - new Date(p.createdAt).getTime() > PAYMENT_TTL_MS) {
        return { ok: false, reason: 'Payment expired' };
      }
      if (PROVIDER === 'razorpay' && p.status !== 'PAID') {
        return { ok: false, reason: 'Payment not verified' };
      }
      // Atomic write: guard on usedAt: null eliminates the TOCTOU race window.
      // If two concurrent requests pass the checks above, only one will match
      // the where clause — the other gets count 0 and returns "already used".
      const result = await prisma.payment.updateMany({
        where: { paymentId, usedAt: null },
        data:  { usedAt: new Date(), status: 'PAID' }
      });
      if (result.count === 0) return { ok: false, reason: 'Payment already used' };
      return { ok: true };
    } catch (err) {
      logger.error({ error: err.message, paymentId }, 'DB consumePayment failed — falling back to in-memory');
      // Fall through to in-memory path below
    }
  }

  // In-memory fallback (also the path used in tests since DATABASE_URL is unset there)
  const p = payments.get(paymentId);
  if (!p)       return { ok: false, reason: 'Invalid payment' };
  if (p.usedAt) return { ok: false, reason: 'Payment already used' };
  if (Date.now() - p.createdAt > PAYMENT_TTL_MS) return { ok: false, reason: 'Payment expired' };
  if (PROVIDER === 'razorpay' && p.status !== 'PAID') return { ok: false, reason: 'Payment not verified' };
  p.usedAt = Date.now();
  p.status  = 'PAID';
  return { ok: true };
}

// ─── Public dispatcher ────────────────────────────────────────────────────────

async function createPayment(args) {
  if (PROVIDER === 'razorpay') return createRazorpayPayment(args);
  return createDummyPayment(args);
}

function verifyWebhook(opts) {
  if (PROVIDER === 'razorpay') return verifyRazorpayWebhook(opts);
  throw new Error('verifyWebhook is not implemented for the dummy provider');
}

module.exports = {
  payments,       // Map reference — tests use payments.set() / payments.clear()
  PAYMENT_TTL_MS,
  PROVIDER,
  consumePayment,
  createPayment,
  verifyWebhook,
  verifyRazorpaySignature,
  markPaymentPaid
};
