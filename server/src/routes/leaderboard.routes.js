/**
 * routes/leaderboard.routes.js
 * GET /api/leaderboard         — authenticate → getLeaderboard
 * GET /api/leaderboard/hof     — authenticate → getHallOfFame
 * GET /api/leaderboard/me      — authenticate → getMyRank
 */

const express   = require('express');
const router    = express.Router();
const { authenticate }     = require('../middleware/authenticate');
const { getLeaderboard, getHallOfFame, getMyRank } = require('../controllers/leaderboardController');

router.use(authenticate);

router.get('/',    getLeaderboard);
router.get('/hof', getHallOfFame);
router.get('/me',  getMyRank);

module.exports = router;
