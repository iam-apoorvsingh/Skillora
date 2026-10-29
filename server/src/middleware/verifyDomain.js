/**
 * middleware/verifyDomain.js — IIIT-NR Domain Enforcement Middleware
 * ───────────────────────────────────────────────────────────────────
 * This is the FIRST line of defence against non-institutional access.
 *
 * WHY middleware and not just controller validation?
 *   Middleware runs BEFORE the controller. If the domain check is in the
 *   controller, the request has already been parsed, rate-limit tokens
 *   consumed, and DB connections potentially touched. Failing fast at the
 *   middleware level is more efficient and the intent is more visible in
 *   the route definition (routes show which middleware chain applies).
 *
 * HTTP Status Codes:
 *   422 Unprocessable Entity — the request was well-formed but semantically
 *       invalid (domain constraint violated). This is more precise than 400.
 *   403 Forbidden — used if a non-institutional JWT somehow reaches a
 *       protected endpoint (shouldn't happen but defence-in-depth).
 */

const { isInstitutionalEmail } = require('../utils/emailValidator');

/**
 * verifyDomain
 * Express middleware that validates the email domain in req.body.email.
 * Attach to any route that accepts an email input (register, login).
 */
function verifyDomain(req, res, next) {
    const { email } = req.body;

    const { valid, reason } = isInstitutionalEmail(email);

    if (!valid) {
        return res.status(422).json({
            success: false,
            error:   'DOMAIN_VIOLATION',
            message: reason,
            hint:    'Skillora is exclusively for IIIT-NR students. Use your institutional email.',
        });
    }

    next();
}

module.exports = { verifyDomain };
