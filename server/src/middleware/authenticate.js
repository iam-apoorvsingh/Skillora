/**
 * middleware/authenticate.js — JWT Authentication Middleware
 * ──────────────────────────────────────────────────────────
 * Protects any route that requires a logged-in user.
 *
 * TOKEN EXTRACTION ORDER:
 *   1. Authorization: Bearer <token>  (preferred — standard HTTP auth header)
 *   2. x-access-token header          (legacy fallback)
 *
 * WHY not cookies for JWT?
 *   For an API consumed by a React SPA (not server-rendered HTML), the
 *   Authorization header is the conventional approach. It also avoids
 *   CSRF vulnerabilities that come with cookie-based sessions.
 *   If this were a Next.js SSR app, HttpOnly cookies would be preferred.
 */

const { verifyAccessToken } = require('../utils/tokenUtils');

/**
 * authenticate
 * Reads JWT from the Authorization header, verifies it, and attaches
 * the decoded payload to req.user for downstream controllers.
 */
function authenticate(req, res, next) {
    // Extract token from "Bearer <token>" or x-access-token header
    const authHeader = req.headers['authorization'];
    const token =
        (authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : req.headers['x-access-token']) || null;

    if (!token) {
        return res.status(401).json({
            success: false,
            error:   'NO_TOKEN',
            message: 'Access token is missing. Please log in.',
        });
    }

    const { valid, decoded, expired } = verifyAccessToken(token);

    if (!valid) {
        return res.status(401).json({
            success: false,
            error:   expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
            message: expired
                ? 'Your session has expired. Please refresh your token.'
                : 'Invalid access token. Please log in again.',
        });
    }

    // Attach decoded payload — available as req.user in all controllers
    req.user = decoded; // { id, email, roll_number, branch, academic_year, iat, exp }
    next();
}

module.exports = { authenticate };
