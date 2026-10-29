/**
 * utils/tokenUtils.js — JWT Token Management
 * ──────────────────────────────────────────────
 * WHY two tokens (access + refresh)?
 *   - Access token: Short-lived (15 min). Sent in Authorization header.
 *     If intercepted, damage window is narrow.
 *   - Refresh token: Long-lived (7 days). Stored in the DB. Used ONLY to
 *     mint new access tokens via the /auth/refresh endpoint.
 *     If compromised, we can invalidate it by clearing it from the DB.
 *
 * WHY NOT store access tokens in the DB?
 *   Access tokens are STATELESS — the server validates them by checking
 *   the JWT signature against the secret. No DB lookup needed per request.
 *   This gives O(1) auth middleware performance at any scale.
 */

const jwt = require('jsonwebtoken');

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'dev_access_secret_change_me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
const ACCESS_EXPIRY  = process.env.JWT_ACCESS_EXPIRES_IN  || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * generateAccessToken(payload)
 * @param {{ id, email, roll_number, branch, academic_year }} payload
 * @returns {string} signed JWT
 */
function generateAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

/**
 * generateRefreshToken(payload)
 * @param {{ id }} payload - minimal payload (just user id)
 * @returns {string} signed JWT
 */
function generateRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

/**
 * verifyAccessToken(token)
 * @param {string} token
 * @returns {{ valid: boolean, decoded?: object, expired?: boolean }}
 */
function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        return { valid: true, decoded };
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return { valid: false, expired: true };
        }
        return { valid: false, expired: false };
    }
}

/**
 * verifyRefreshToken(token)
 * @param {string} token
 * @returns {{ valid: boolean, decoded?: object }}
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, REFRESH_SECRET);
        return { valid: true, decoded };
    } catch (err) {
        return { valid: false };
    }
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
