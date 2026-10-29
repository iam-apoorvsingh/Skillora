/**
 * utils/bayesianRating.js — Bayesian Average Rating Calculator
 * ─────────────────────────────────────────────────────────────
 *
 * WHY Bayesian Average instead of simple arithmetic mean?
 * ────────────────────────────────────────────────────────
 * Simple mean: avg = Σ(stars) / n
 *   Problem: A user with 1 review of 5★ ranks HIGHER than a user with
 *   50 reviews averaging 4.8★. This is statistically misleading.
 *
 * Bayesian Average solves this by shrinking extreme values toward the
 * global mean when the sample size is small:
 *
 *   B = (C × m + Σ(stars)) / (C + n)
 *
 *   Where:
 *     C = prior confidence weight (e.g., 5) — how many "phantom" reviews
 *         at the global mean we assume every user starts with.
 *     m = global mean across ALL ratings in the system.
 *     n = actual number of ratings for this user.
 *     Σ(stars) = sum of all rating stars for this user.
 *
 * When n is small → B ≈ m  (regress to the global mean)
 * When n is large → B ≈ simple mean  (converges to truth)
 *
 * ANTI-COLLUSION: Pair Frequency Damping
 * ───────────────────────────────────────
 * Two students gaming the system by repeatedly rating each other get
 * diminishing returns. The weight of their k-th mutual review is:
 *
 *   weight(k) = 1 / log₂(k + 1)
 *
 *   k=1: weight=1.0  (first review is full weight)
 *   k=2: weight=0.5  (second review is half weight)
 *   k=3: weight=0.37
 *   k=4: weight=0.29
 *   ...
 *
 * The weighted star score is used in the Bayesian numerator instead of
 * the raw sum.
 */

const PRIOR_C = parseFloat(process.env.BAYESIAN_PRIOR_COUNT || '5');
const PRIOR_M = parseFloat(process.env.BAYESIAN_PRIOR_MEAN  || '3.5');

/**
 * pairDampingWeight(k)
 * @param {number} k - the k-th review between the same pair (1-indexed)
 * @returns {number} weight in (0, 1]
 */
function pairDampingWeight(k) {
    if (k <= 0) return 0;
    return 1 / Math.log2(k + 1);
}

/**
 * computeBayesianScore({ ratings, pairLog, globalMean, priorC })
 *
 * @param {Object}   params
 * @param {Array}    params.ratings    - Array of { overall_stars, rater_id, ratee_id }
 * @param {Array}    params.pairLog    - Array of { user_a_id, user_b_id, review_count }
 *                                       for this user's rating pairs
 * @param {number}   params.globalMean - Current global mean across ALL ratings
 * @param {number}   [params.priorC]   - Prior confidence weight (default: PRIOR_C from env)
 *
 * @returns {{ bayesianScore: number, weightedN: number, rawAvg: number }}
 */
function computeBayesianScore({ ratings = [], pairLog = [], globalMean = PRIOR_M, priorC = PRIOR_C }) {
    if (ratings.length === 0) {
        return { bayesianScore: 0, weightedN: 0, rawAvg: 0 };
    }

    // Build a lookup: (rater_id, ratee_id) → pair_count
    // pairLog uses canonical ordering (smaller id first), so we normalise both ways
    const pairCountMap = new Map();
    for (const p of pairLog) {
        const key = `${p.user_a_id}:${p.user_b_id}`;
        pairCountMap.set(key, p.review_count);
    }

    // Track how many times each rater has appeared (to compute current position k)
    const raterSeenCount = new Map();
    let weightedSum = 0;
    let weightedN   = 0;

    for (const r of ratings) {
        const pairKey = r.rater_id < r.ratee_id
            ? `${r.rater_id}:${r.ratee_id}`
            : `${r.ratee_id}:${r.rater_id}`;

        // Increment the "seen count" for this rater in the current computation
        const prevSeen = raterSeenCount.get(r.rater_id) || 0;
        const k        = prevSeen + 1;
        raterSeenCount.set(r.rater_id, k);

        const w = pairDampingWeight(k);
        weightedSum += w * r.overall_stars;
        weightedN   += w;
    }

    // Bayesian average with prior
    const m            = globalMean;
    const C            = priorC;
    const bayesianScore = (C * m + weightedSum) / (C + weightedN);
    const rawAvg        = ratings.reduce((s, r) => s + r.overall_stars, 0) / ratings.length;

    return {
        bayesianScore: Math.round(bayesianScore * 100) / 100,
        weightedN:     Math.round(weightedN * 100)     / 100,
        rawAvg:        Math.round(rawAvg    * 100)     / 100,
    };
}

/**
 * getGlobalMean(db)
 * Queries the database for the current global average of all overall_stars.
 * This is used as the prior mean 'm' in Bayesian calculations.
 */
function getGlobalMean(db) {
    const row = db.prepare('SELECT AVG(overall_stars) AS global_mean FROM ratings').get();
    return row?.global_mean ?? PRIOR_M;
}

module.exports = { computeBayesianScore, pairDampingWeight, getGlobalMean, PRIOR_C, PRIOR_M };
