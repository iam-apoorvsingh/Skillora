/**
 * utils/matchEngine.js — Skill Barter Matching Engine
 * ─────────────────────────────────────────────────────
 *
 * WHY a separate match engine?
 *   The barter-matching query is the most complex and performance-sensitive
 *   query in the system. Isolating it makes it easy to explain, test, and
 *   optimise independently of the route/controller layer.
 *
 * MATCHING ALGORITHM:
 *   A "barter match" exists between Student A and Student B if:
 *     1. A has at least one skill where is_teaching=1 that matches one of
 *        B's skills where is_learning=1 (A can teach B).
 *     2. B has at least one skill where is_teaching=1 that matches one of
 *        A's skills where is_learning=1 (B can teach A).
 *
 *   This is a self-join on the skills table:
 *     FROM skills s1 JOIN skills s2 ON s1.skill_name = s2.skill_name
 *     WHERE s1.user_id = :currentUser AND s1.is_teaching = 1
 *       AND s2.is_learning = 1 AND s2.user_id != :currentUser
 *   (and the reciprocal for what the other user teaches back)
 *
 * "ONE-WAY MENTORSHIP" (non-barter):
 *   A senior user can offer a skill to a junior without needing a reciprocal
 *   skill. These appear separately as "Mentorship Opportunities."
 */

const { queryOne } = require('../../../database/db');

/**
 * findBarterMatches(db, userId)
 * Returns all users who have a COMPLETE skill barter with the given user.
 *
 * @param   {object} db      - better-sqlite3 instance
 * @param   {number} userId  - the logged-in user's ID
 * @returns {Array}  matches - array of match objects
 */
function findBarterMatches(db, userId) {
    /*
     * SQL Strategy (Two-join approach):
     *   Step 1: Find skills that currentUser teaches (s_teach)
     *           that ANOTHER user (s_learn) wants to learn.
     *   Step 2: Of those other users, find which ones ALSO teach
     *           something that currentUser wants to learn.
     *   Step 3: Group by other user and aggregate the matched skill pairs.
     *
     * The composite index idx_skills_name_teach and idx_skills_name_learn
     * makes the self-join O(log n) instead of O(n²).
     */
    const sql = `
        SELECT
            u.id               AS match_user_id,
            u.full_name        AS match_user_name,
            u.roll_number      AS match_roll_number,
            u.branch           AS match_branch,
            u.academic_year    AS match_year,
            u.bio              AS match_bio,
            u.hostel           AS match_hostel,
            -- Skills that currentUser can TEACH to match_user
            GROUP_CONCAT(DISTINCT s_teach.skill_name)   AS i_teach_them,
            -- Skills that match_user can TEACH to currentUser
            GROUP_CONCAT(DISTINCT s_other_teach.skill_name) AS they_teach_me,
            -- Aggregate proficiency of the match (for ranking)
            COUNT(DISTINCT s_teach.id) + COUNT(DISTINCT s_other_teach.id) AS match_strength
        FROM users u

        -- JOIN 1: Find skills I (currentUser) teach that this user wants
        JOIN skills s_teach ON s_teach.user_id = :userId
                            AND s_teach.is_teaching = 1
        JOIN skills s_learn ON s_learn.user_id = u.id
                            AND s_learn.is_learning = 1
                            AND s_learn.skill_name = s_teach.skill_name

        -- JOIN 2 (reciprocal): Find skills this user teaches that I want
        JOIN skills s_other_teach ON s_other_teach.user_id = u.id
                                  AND s_other_teach.is_teaching = 1
        JOIN skills s_my_learn    ON s_my_learn.user_id = :userId
                                  AND s_my_learn.is_learning = 1
                                  AND s_my_learn.skill_name = s_other_teach.skill_name

        WHERE u.id != :userId

        -- Exclude users who already have an active/pending swap with me
        AND NOT EXISTS (
            SELECT 1 FROM swaps sw
            WHERE sw.status IN ('PENDING','ACCEPTED','SCHEDULED')
              AND ((sw.requester_id = :userId AND sw.responder_id = u.id)
                OR (sw.requester_id = u.id   AND sw.responder_id = :userId))
        )

        GROUP BY u.id, u.full_name, u.roll_number, u.branch, u.academic_year, u.bio, u.hostel
        ORDER BY match_strength DESC, u.academic_year DESC
    `;

    const stmt = db.prepare(sql);
    return stmt.all({ userId });
}

/**
 * findMentorshipOpportunities(db, userId)
 * Returns senior students/M.Tech/Ph.D. who offer skills the currentUser wants,
 * WITHOUT requiring reciprocal barter.
 */
function findMentorshipOpportunities(db, userId) {
    const sql = `
        SELECT
            u.id            AS mentor_id,
            u.full_name     AS mentor_name,
            u.roll_number   AS mentor_roll,
            u.academic_year AS mentor_year,
            u.branch        AS mentor_branch,
            u.bio           AS mentor_bio,
            GROUP_CONCAT(DISTINCT s_teach.skill_name) AS mentor_teaches,
            COALESCE(
                (SELECT AVG(r.overall_stars) FROM ratings r WHERE r.ratee_id = u.id),
                0
            ) AS avg_rating,
            COALESCE(
                (SELECT COUNT(*) FROM sessions se
                 JOIN swaps sw ON sw.id = se.swap_id
                 WHERE (sw.requester_id = u.id OR sw.responder_id = u.id)
                   AND se.is_completed = 1), 0
            ) AS session_count
        FROM users u
        JOIN skills s_teach  ON s_teach.user_id = u.id AND s_teach.is_teaching = 1
        JOIN skills s_want   ON s_want.user_id = :userId
                            AND s_want.is_learning = 1
                            AND s_want.skill_name = s_teach.skill_name
        WHERE u.id != :userId
          AND u.academic_year IN (
              'B.Tech 3rd Year','B.Tech 4th Year',
              'M.Tech 1st Year','M.Tech 2nd Year','Ph.D.'
          )
        GROUP BY u.id, u.full_name, u.roll_number, u.academic_year, u.branch, u.bio
        ORDER BY avg_rating DESC, session_count DESC
    `;

    const stmt = db.prepare(sql);
    return stmt.all({ userId });
}

module.exports = { findBarterMatches, findMentorshipOpportunities };
