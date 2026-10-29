/**
 * routes/auth.routes.js
 * POST /api/auth/register   — verifyDomain → registerValidation → register
 * POST /api/auth/login      — verifyDomain → loginValidation → login
 * POST /api/auth/refresh    — refreshToken
 * POST /api/auth/logout     — authenticate → logout
 * GET  /api/auth/me         — authenticate → getMe
 */

const express            = require('express');
const router             = express.Router();
const { verifyDomain }   = require('../middleware/verifyDomain');
const { authenticate }   = require('../middleware/authenticate');
const { authLimiter }    = require('../middleware/rateLimiter');
const {
    register, registerValidation,
    login,    loginValidation,
    refreshToken, logout, getMe,
} = require('../controllers/authController');

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

router.post('/register', verifyDomain, registerValidation, register);
router.post('/login',    verifyDomain, loginValidation,    login);
router.post('/refresh',  refreshToken);
router.post('/logout',   authenticate, logout);
router.get ('/me',       authenticate, getMe);

module.exports = router;
