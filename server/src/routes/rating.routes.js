/**
 * routes/rating.routes.js
 * POST /api/ratings           — authenticate → ratingValidation → submitRating
 * GET  /api/ratings/user/:id  — authenticate → getUserRatings (with Bayesian score)
 */

const express   = require('express');
const router    = express.Router();
const { authenticate }  = require('../middleware/authenticate');
const { submitRating, ratingValidation, getUserRatings } = require('../controllers/ratingController');

router.use(authenticate);

router.post('/',             ratingValidation, submitRating);
router.get ('/user/:userId', getUserRatings);

module.exports = router;
