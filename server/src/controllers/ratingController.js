/**
 * controllers/ratingController.js — Post-Session Peer Review System
 * ──────────────────────────────────────────────────────────────────
 * Enforces:
 *   1. Rating is only allowed if session.rating_unlocked = 1
 *      (set when session duration >= MIN_SESSION_DURATION_MINUTES)
 *   2. A user cannot rate the same session twice (UNIQUE constraint)
 *   3. A user cannot rate themselves
 *   4. After inserting a rating, pair_review_log is updated for anti-collusion
 */

const { body, validationResult } = require('express-validator');
const { getDb }                  = require('../../../database/db');
const { computeBayesianScore, getGlobalMean } = require('../utils/bayesianRating');

const ratingValidation = [
    body('session_id').isInt(),
    body('ratee_id').isInt(),
    body('overall_stars').isFloat({ min: 1, max: 5 }),
    body('punctuality').isInt({ min: 1, max: 5 }),
    body('clarity').isInt({ min: 1, max: 5 }),
    body('depth').isInt({ min: 1, max: 5 }),
    body('feedback_text').optional().trim(),
];

// ─── SUBMIT RATING ────────────────────────────────────────────────────────────
function submitRating(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { session_id, ratee_id, overall_stars, punctuality, clarity, depth, feedback_text } = req.body;
    const rater_id = req.user.id;

    if (rater_id === parseInt(ratee_id)) {
        return res.status(422).json({ success: false, message: 'You cannot rate yourself.' });
    }

    try {
        const db = getDb();

        // 1. Verify session exists and rating is unlocked
        const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(session_id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
        if (!session.rating_unlocked) {
            return res.status(403).json({
                success: false,
                error:   'RATING_LOCKED',
                message: `Rating is not yet unlocked. The session must be at least ${process.env.MIN_SESSION_DURATION_MINUTES || 20} minutes long.`,
            });
        }

        // 2. Verify rater participated in the session
        const swap = db.prepare('SELECT * FROM swaps WHERE id = ?').get(session.swap_id);
        if (swap.requester_id !== rater_id && swap.responder_id !== rater_id) {
            return res.status(403).json({ success: false, message: 'You did not participate in this session.' });
        }

        // 3. Insert rating (DB UNIQUE constraint prevents double rating)
        db.prepare(`
            INSERT INTO ratings (session_id, rater_id, ratee_id, overall_stars, punctuality, clarity, depth, feedback_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(session_id, rater_id, ratee_id, overall_stars, punctuality, clarity, depth, feedback_text || '');

        // 4. Update pair_review_log for anti-collusion tracking
        const a = Math.min(rater_id, ratee_id);
        const b = Math.max(rater_id, ratee_id);
        db.prepare(`
            INSERT INTO pair_review_log (user_a_id, user_b_id, review_count)
            VALUES (?, ?, 1)
            ON CONFLICT(user_a_id, user_b_id) DO UPDATE SET
                review_count = review_count + 1,
                last_review  = datetime('now')
        `).run(a, b);

        // 5. Notify the rated user
        if (req.io) {
            req.io.to(`user:${ratee_id}`).emit('session:rated', {
                message: 'You received a new peer review!',
                rater_id,
            });
        }

        res.status(201).json({ success: true, message: 'Rating submitted successfully.' });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ success: false, message: 'You have already rated this session.' });
        }
        next(err);
    }
}

// ─── GET RATINGS FOR A USER (with Bayesian score) ────────────────────────────
function getUserRatings(req, res, next) {
    try {
        const db     = getDb();
        const userId = parseInt(req.params.userId);

        const ratings = db.prepare(`
            SELECT r.*, u.full_name AS rater_name, u.roll_number AS rater_roll
            FROM ratings r
            JOIN users u ON u.id = r.rater_id
            WHERE r.ratee_id = ?
            ORDER BY r.created_at DESC
        `).all(userId);

        const pairLog = db.prepare(`
            SELECT * FROM pair_review_log
            WHERE user_a_id = ? OR user_b_id = ?
        `).all(userId, userId);

        const globalMean = getGlobalMean(db);
        const { bayesianScore, weightedN, rawAvg } = computeBayesianScore({
            ratings, pairLog, globalMean,
        });

        // Sub-criteria averages
        const subCriteria = ratings.length > 0 ? {
            punctuality: (ratings.reduce((s,r) => s + r.punctuality, 0) / ratings.length).toFixed(2),
            clarity:     (ratings.reduce((s,r) => s + r.clarity,     0) / ratings.length).toFixed(2),
            depth:       (ratings.reduce((s,r) => s + r.depth,       0) / ratings.length).toFixed(2),
        } : { punctuality: 0, clarity: 0, depth: 0 };

        res.json({
            success: true,
            stats: {
                bayesian_score: bayesianScore,
                raw_avg:        rawAvg,
                weighted_n:     weightedN,
                total_reviews:  ratings.length,
                global_mean:    Math.round(globalMean * 100) / 100,
                sub_criteria:   subCriteria,
            },
            ratings,
        });
    } catch (err) { next(err); }
}

module.exports = { submitRating, ratingValidation, getUserRatings };
