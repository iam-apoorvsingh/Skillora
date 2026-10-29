/**
 * controllers/authController.js — Authentication & User Onboarding
 * ─────────────────────────────────────────────────────────────────
 * Handles: POST /auth/register, POST /auth/login, POST /auth/refresh,
 *          POST /auth/logout, GET /auth/me
 *
 * SECURITY PRACTICES DEMONSTRATED:
 *   1. bcryptjs with cost factor 10 for password hashing
 *      WHY 10? OWASP recommends ≥10 rounds. Higher = slower brute force.
 *   2. JWT access (15 min) + refresh (7 days) token pair
 *   3. Refresh token stored in DB — can be invalidated on logout
 *   4. express-validator for input sanitization before DB interaction
 *   5. Domain verification via middleware (not in controller — SRP)
 */

const bcrypt = require('bcryptjs');
const { validationResult, body } = require('express-validator');
const { getDb }          = require('../../../database/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { parseRollNumber } = require('../utils/emailValidator');

// ─── REGISTER ─────────────────────────────────────────────────────────────────
/**
 * Validation rules for registration (used as route-level middleware array).
 */
const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
        .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
    body('roll_number')
        .trim()
        .matches(/^(\d{2})(100|101|102)(\d{4})$/)
        .withMessage('Invalid roll number format. Must be 9 digits (e.g. 261020416: 26=Year, 100=CSE/101=ECE/102=DSAI, 0416=Roll).'),
    body('branch').isIn(['CSE','DSAI','ECE','IT','Other']).withMessage('Invalid branch.'),
    body('academic_year').isIn([
        'B.Tech 1st Year','B.Tech 2nd Year','B.Tech 3rd Year','B.Tech 4th Year',
        'M.Tech 1st Year','M.Tech 2nd Year','Ph.D.'
    ]).withMessage('Invalid academic year.'),
    body('batch').trim().notEmpty().withMessage('Batch year is required.'),
];

async function register(req, res, next) {
    // 1. Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            error:   'VALIDATION_ERROR',
            errors:  errors.array(),
        });
    }

    const { email, password, full_name, roll_number, branch, academic_year, batch, hostel, bio } = req.body;
    const db = getDb();

    try {
        // 2. Check for duplicate email or roll number
        const existing = db.prepare(
            'SELECT id FROM users WHERE email = ? OR roll_number = ?'
        ).get(email.toLowerCase(), roll_number.toUpperCase());

        if (existing) {
            return res.status(409).json({
                success: false,
                error:   'USER_EXISTS',
                message: 'An account with this email or roll number already exists.',
            });
        }

        // 3. Hash password (cost factor 10)
        const password_hash = await bcrypt.hash(password, 10);

        // 4. Generate tokens
        const userPayload = { email: email.toLowerCase(), roll_number: roll_number.toUpperCase(), branch, academic_year };
        const tempId      = Date.now(); // Temporary ID for token; will be replaced below

        // 5. Insert user
        const result = db.prepare(`
            INSERT INTO users (email, password_hash, full_name, roll_number, branch, academic_year, batch, hostel, bio, is_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(
            email.toLowerCase(), password_hash, full_name.trim(),
            roll_number.toUpperCase(), branch, academic_year, batch,
            hostel || null, bio || ''
        );

        const userId = result.lastInsertRowid;

        // 6. Generate tokens with real user id
        const accessToken  = generateAccessToken({ id: userId, ...userPayload });
        const refreshToken = generateRefreshToken({ id: userId });

        // 7. Store refresh token in DB
        db.prepare('UPDATE users SET refresh_token = ? WHERE id = ?').run(refreshToken, userId);

        return res.status(201).json({
            success:      true,
            message:      'Account created successfully. Welcome to Skillora!',
            access_token: accessToken,
            user: {
                id: userId, email: email.toLowerCase(), full_name, roll_number: roll_number.toUpperCase(),
                branch, academic_year, batch,
            },
        });
    } catch (err) {
        next(err);
    }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
];

async function login(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = getDb();

    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

        if (!user) {
            // WHY same message for wrong email and wrong password?
            // Prevents user enumeration attacks (attacker can't tell if email exists)
            return res.status(401).json({
                success: false,
                error:   'INVALID_CREDENTIALS',
                message: 'Invalid email or password.',
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error:   'INVALID_CREDENTIALS',
                message: 'Invalid email or password.',
            });
        }

        const payload      = { id: user.id, email: user.email, roll_number: user.roll_number, branch: user.branch, academic_year: user.academic_year };
        const accessToken  = generateAccessToken(payload);
        const refreshToken = generateRefreshToken({ id: user.id });

        db.prepare('UPDATE users SET refresh_token = ? WHERE id = ?').run(refreshToken, user.id);

        const { password_hash, refresh_token, ...safeUser } = user;

        return res.status(200).json({
            success:      true,
            access_token: accessToken,
            user:         safeUser,
        });
    } catch (err) {
        next(err);
    }
}

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
function refreshToken(req, res, next) {
    const { refresh_token } = req.body;
    if (!refresh_token) {
        return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    const { valid, decoded } = verifyRefreshToken(refresh_token);
    if (!valid) {
        return res.status(401).json({ success: false, error: 'INVALID_REFRESH_TOKEN' });
    }

    const db   = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND refresh_token = ?').get(decoded.id, refresh_token);

    if (!user) {
        return res.status(401).json({ success: false, error: 'REFRESH_TOKEN_REVOKED' });
    }

    const payload     = { id: user.id, email: user.email, roll_number: user.roll_number, branch: user.branch, academic_year: user.academic_year };
    const accessToken = generateAccessToken(payload);

    return res.status(200).json({ success: true, access_token: accessToken });
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
function logout(req, res, next) {
    const db = getDb();
    // Invalidate refresh token by clearing it in the DB
    db.prepare('UPDATE users SET refresh_token = NULL WHERE id = ?').run(req.user.id);
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
}

// ─── GET ME ───────────────────────────────────────────────────────────────────
function getMe(req, res) {
    const db   = getDb();
    const user = db.prepare(
        'SELECT id, email, full_name, roll_number, branch, academic_year, batch, hostel, bio, is_verified, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, user });
}

module.exports = { register, registerValidation, login, loginValidation, refreshToken, logout, getMe };
