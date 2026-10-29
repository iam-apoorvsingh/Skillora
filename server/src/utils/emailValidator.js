/**
 * utils/emailValidator.js — Institutional Email Enforcement
 * ──────────────────────────────────────────────────────────
 * WHY a dedicated util?
 *   The domain check is a critical domain rule (not just validation). Keeping
 *   it in its own module means it can be imported by middleware, controllers,
 *   and tests independently — single responsibility principle.
 *
 * WHY regex AND string suffix check?
 *   Defense-in-depth: The regex validates the full email structure; the suffix
 *   check is a fast secondary guard. If either fails, the request is rejected.
 */

const ALLOWED_DOMAIN  = process.env.ALLOWED_EMAIL_DOMAIN || 'iiitnr.edu.in';

/**
 * Full RFC5322-ish regex anchored to the IIIT-NR domain.
 * Allows letters, digits, dots, underscores, percent, plus, hyphen in local part.
 */
const IIITNR_EMAIL_REGEX = new RegExp(
    `^[a-zA-Z0-9._%+\\-]+@${ALLOWED_DOMAIN.replace('.', '\\.')}$`
);

/**
 * isInstitutionalEmail(email)
 * @param {string} email - raw email string from request body
 * @returns {{ valid: boolean, reason?: string }}
 */
function isInstitutionalEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, reason: 'Email must be a non-empty string.' };
    }

    const trimmed = email.trim().toLowerCase();

    // Quick domain suffix check (faster than regex for obvious failures)
    if (!trimmed.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return {
            valid:  false,
            reason: `Only @${ALLOWED_DOMAIN} email addresses are permitted on Skillora. ` +
                    `External providers (Gmail, Outlook, etc.) are not allowed.`,
        };
    }

    // Full structural regex check
    if (!IIITNR_EMAIL_REGEX.test(trimmed)) {
        return {
            valid:  false,
            reason: `Email format is invalid. Must match: [local-part]@${ALLOWED_DOMAIN}`,
        };
    }

    return { valid: true };
}

/**
 * parseRollNumber(rollNumber)
 * IIIT-NR Roll Number format: YYSSSNNNN (9 digits)
 *   YY   = 2-digit admission year:
 *          26 = 1st Year (Batch 2026)
 *          25 = 2nd Year (Batch 2025)
 *          24 = 3rd Year (Batch 2024)
 *          23 = 4th Year (Batch 2023)
 *   SSS  = 3-digit subject/branch code:
 *          100 = CSE (Computer Science & Engineering)
 *          101 = ECE (Electronics & Communication Engineering)
 *          102 = DSAI (Data Science & Artificial Intelligence)
 *   NNNN = 4-digit roll number sequence (e.g. 0416)
 * Example: 261020416 -> 1st Year, DSAI, Roll #0416
 * Returns parsed object or null if unrecognised.
 */
function parseRollNumber(rollNumber) {
    if (!rollNumber) return null;
    const clean = String(rollNumber).trim();
    const match = clean.match(/^(\d{2})(100|101|102)(\d{4})$/);
    if (!match) return null;

    const [, yr, code, seq] = match;
    const branchMap = {
        '100': 'CSE',
        '101': 'ECE',
        '102': 'DSAI'
    };

    const academicYearMap = {
        '26': 'B.Tech 1st Year',
        '25': 'B.Tech 2nd Year',
        '24': 'B.Tech 3rd Year',
        '23': 'B.Tech 4th Year'
    };

    return {
        batch:         `20${yr}`,
        academic_year: academicYearMap[yr] || `Batch 20${yr}`,
        branch:        branchMap[code],
        code:          code,
        seq:           parseInt(seq, 10),
        raw:           clean,
    };
}

module.exports = { isInstitutionalEmail, parseRollNumber, ALLOWED_DOMAIN, IIITNR_EMAIL_REGEX };
