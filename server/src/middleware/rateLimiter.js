/**
 * middleware/rateLimiter.js — Anti-Spam Rate Limiting (Campus Demo & Testing Mode)
 * ─────────────────────────────────────────────────────────────────────────────
 * Limits relaxed so multiple students/testers sharing a single campus Wi-Fi
 * IP address do not get false-positive rate limit blocks during demonstrations.
 */

const rateLimit = require('express-rate-limit');

// 1-minute window instead of 15 minutes
const WINDOW_MS    = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '3000', 10);

// ─── Auth Limiter (500 attempts / min) ────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs:         WINDOW_MS,
    max:              500,
    standardHeaders:  true,
    legacyHeaders:    false,
    message: {
        success: false,
        error:   'TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts. Please wait a moment and try again.',
    },
});

// ─── General API Limiter (3,000 requests / min) ──────────────────────────────
const apiLimiter = rateLimit({
    windowMs:         WINDOW_MS,
    max:              MAX_REQUESTS,
    standardHeaders:  true,
    legacyHeaders:    false,
    message: {
        success: false,
        error:   'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please wait a few seconds.',
    },
});

// ─── Swap Request Limiter (500 swap requests / min) ──────────────────────────
const swapLimiter = rateLimit({
    windowMs:         WINDOW_MS,
    max:              500,
    standardHeaders:  true,
    legacyHeaders:    false,
    message: {
        success: false,
        error:   'SWAP_RATE_LIMIT',
        message: 'Swap request limit reached. Please wait a moment.',
    },
});

module.exports = { authLimiter, apiLimiter, swapLimiter };
