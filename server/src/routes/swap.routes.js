/**
 * routes/swap.routes.js
 * GET  /api/swaps         — authenticate → getMySwaps
 * GET  /api/swaps/:id     — authenticate → getSwap
 * POST /api/swaps         — authenticate → swapLimiter → createSwapValidation → createSwap
 * PATCH /api/swaps/:id    — authenticate → updateSwapStatus
 */

const express   = require('express');
const router    = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { swapLimiter }  = require('../middleware/rateLimiter');
const {
    createSwap, createSwapValidation,
    updateSwapStatus, getMySwaps, getSwap,
} = require('../controllers/swapController');

router.use(authenticate);

router.get   ('/',    getMySwaps);
router.get   ('/:id', getSwap);
router.post  ('/',    swapLimiter, createSwapValidation, createSwap);
router.patch ('/:id', updateSwapStatus);

module.exports = router;
