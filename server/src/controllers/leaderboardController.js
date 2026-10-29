/**
 * controllers/leaderboardController.js — Rankings & Hall of Fame
 * ──────────────────────────────────────────────────────────────
 * Returns real-time leaderboard rankings computed using the Bayesian algorithm.
 * Also exposes the Hall of Fame (annual_awards table) for past year recipients.
 *
 * LEADERBOARD COMPUTATION STRATEGY:
 *   1. Fetch all users with completed sessions (from leaderboard_view)
 *   2. For each user, fetch their ratings and pair_review_log
 *   3. Compute Bayesian score with pair damping
 *   4. Assign badges: 'Rising Tutor' (10+ hrs), 'Distinguished Mentor' (30+ hrs),
 *      'Campus Fellow' (top 5 percentile by Bayesian score)
 *   5. Return sorted by Bayesian score descending
 */

const { getDb }         = require('../../../database/db');
const { computeBayesianScore, getGlobalMean } = require('../utils/bayesianRating');

// Badge thresholds
const BADGE_THRESHOLDS = {
    'Rising Tutor':         { min_hours: 10, min_sessions: 8 },
    'Distinguished Mentor': { min_hours: 30, min_sessions: 20 },
    'Campus Fellow':        { percentile: 95 },
};

function assignBadge(totalHours, sessionCount, isCampusFellow) {
    if (isCampusFellow)                                         return 'Campus Fellow';
    if (totalHours >= 30 && sessionCount >= 20)                 return 'Distinguished Mentor';
    if (totalHours >= 10 && sessionCount >= 8)                  return 'Rising Tutor';
    return null;
}

// ─── GET LEADERBOARD ──────────────────────────────────────────────────────────
function getLeaderboard(req, res, next) {
    try {
        const db         = getDb();
        const { branch, academic_year, limit = 50 } = req.query;
        const globalMean = getGlobalMean(db);

        // Build leaderboard_view query with optional filters
        let sql    = 'SELECT * FROM leaderboard_view WHERE session_count > 0';
        const params = [];
        if (branch)        { sql += ' AND branch = ?';        params.push(branch); }
        if (academic_year) { sql += ' AND academic_year = ?'; params.push(academic_year); }

        const rows = db.prepare(sql).all(...params);

        // For each user, compute Bayesian score with pair-damping
        const enriched = rows.map(row => {
            const ratings = db.prepare(`
                SELECT r.overall_stars, r.rater_id, r.ratee_id
                FROM ratings r WHERE r.ratee_id = ?
            `).all(row.user_id);

            const pairLog = db.prepare(`
                SELECT * FROM pair_review_log WHERE user_a_id = ? OR user_b_id = ?
            `).all(row.user_id, row.user_id);

            const { bayesianScore, rawAvg } = computeBayesianScore({ ratings, pairLog, globalMean });

            return {
                ...row,
                bayesian_score: bayesianScore,
                raw_avg:        rawAvg,
            };
        });

        // Sort by Bayesian score descending
        enriched.sort((a, b) => b.bayesian_score - a.bayesian_score);

        // Assign percentile ranks and Campus Fellow badges
        const total = enriched.length;
        const result = enriched.slice(0, parseInt(limit)).map((user, idx) => {
            const percentileRank = total > 1 ? ((total - idx - 1) / (total - 1)) * 100 : 100;
            const isCampusFellow = percentileRank >= 95;
            return {
                ...user,
                rank:            idx + 1,
                percentile_rank: Math.round(percentileRank * 10) / 10,
                badge:           assignBadge(user.total_hours, user.session_count, isCampusFellow),
            };
        });

        res.json({
            success: true,
            global_mean: Math.round(globalMean * 100) / 100,
            count:   result.length,
            leaderboard: result,
        });
    } catch (err) { next(err); }
}

// ─── GET HALL OF FAME ─────────────────────────────────────────────────────────
function getHallOfFame(req, res, next) {
    try {
        const db             = getDb();
        const { academic_year } = req.query;

        let sql    = `
            SELECT aa.*, u.full_name, u.roll_number, u.branch, u.academic_year AS student_year, u.email
            FROM annual_awards aa
            JOIN users u ON u.id = aa.user_id
        `;
        const params = [];
        if (academic_year) { sql += ' WHERE aa.academic_year = ?'; params.push(academic_year); }
        sql += ' ORDER BY aa.award_tier ASC, aa.bayesian_score DESC';

        const awards = db.prepare(sql).all(...params);

        // Group by academic year for display
        const grouped = {};
        for (const a of awards) {
            const yr = a.academic_year;
            if (!grouped[yr]) grouped[yr] = { 'Campus Fellow': [], 'Distinguished Mentor': [], 'Rising Tutor': [] };
            grouped[yr][a.award_tier].push(a);
        }

        res.json({ success: true, hall_of_fame: grouped, raw: awards });
    } catch (err) { next(err); }
}

// ─── GET MY RANK ─────────────────────────────────────────────────────────────
function getMyRank(req, res, next) {
    try {
        const db         = getDb();
        const globalMean = getGlobalMean(db);
        const allRows    = db.prepare('SELECT * FROM leaderboard_view WHERE session_count > 0').all();

        const enriched = allRows.map(row => {
            const ratings = db.prepare(
                'SELECT overall_stars, rater_id, ratee_id FROM ratings WHERE ratee_id = ?'
            ).all(row.user_id);
            const pairLog = db.prepare(
                'SELECT * FROM pair_review_log WHERE user_a_id = ? OR user_b_id = ?'
            ).all(row.user_id, row.user_id);
            const { bayesianScore } = computeBayesianScore({ ratings, pairLog, globalMean });
            return { ...row, bayesian_score: bayesianScore };
        });

        enriched.sort((a, b) => b.bayesian_score - a.bayesian_score);
        const myIndex = enriched.findIndex(u => u.user_id === req.user.id);
        const myEntry = myIndex !== -1 ? { ...enriched[myIndex], rank: myIndex + 1 } : null;

        res.json({ success: true, my_rank: myEntry, total_ranked: enriched.length });
    } catch (err) { next(err); }
}

module.exports = { getLeaderboard, getHallOfFame, getMyRank };
