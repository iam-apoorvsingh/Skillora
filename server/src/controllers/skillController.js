/**
 * controllers/skillController.js — Skill CRUD & Barter Matching
 * ──────────────────────────────────────────────────────────────
 * Routes: GET/POST/DELETE /skills, GET /skills/discover, GET /skills/matches
 */

const { body, validationResult } = require('express-validator');
const { getDb }                  = require('../../../database/db');
const { findBarterMatches, findMentorshipOpportunities } = require('../utils/matchEngine');

const VALID_CATEGORIES   = ['Academic/Core','Creative/Campus Life'];
const VALID_PROFICIENCIES = ['Beginner','Intermediate','Advanced','Expert'];

// Validation rules
const skillValidation = [
    body('skill_name').trim().notEmpty().withMessage('Skill name is required.'),
    body('category').isIn(VALID_CATEGORIES).withMessage('Invalid category.'),
    body('proficiency').isIn(VALID_PROFICIENCIES).withMessage('Invalid proficiency level.'),
    body('is_teaching').isBoolean().withMessage('is_teaching must be boolean.'),
    body('is_learning').isBoolean().withMessage('is_learning must be boolean.'),
];

// ─── GET /skills/mine — get current user's skills ────────────────────────────
function getMySkills(req, res, next) {
    try {
        const db     = getDb();
        const skills = db.prepare('SELECT * FROM skills WHERE user_id = ? ORDER BY is_teaching DESC, skill_name ASC').all(req.user.id);
        res.json({ success: true, skills });
    } catch (err) { next(err); }
}

// ─── GET /skills/user/:userId ─────────────────────────────────────────────────
function getUserSkills(req, res, next) {
    try {
        const db     = getDb();
        const skills = db.prepare('SELECT * FROM skills WHERE user_id = ? ORDER BY is_teaching DESC').all(req.params.userId);
        res.json({ success: true, skills });
    } catch (err) { next(err); }
}

// ─── POST /skills — add a skill ───────────────────────────────────────────────
function addSkill(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { skill_name, category, proficiency, is_teaching, is_learning } = req.body;

    if (!is_teaching && !is_learning) {
        return res.status(422).json({
            success: false,
            message: 'At least one of is_teaching or is_learning must be true.',
        });
    }

    try {
        const db = getDb();

        // Check for duplicate (same user, same skill, same direction)
        const existing = db.prepare(
            'SELECT id FROM skills WHERE user_id=? AND skill_name=? AND is_teaching=? AND is_learning=?'
        ).get(req.user.id, skill_name, is_teaching ? 1 : 0, is_learning ? 1 : 0);

        if (existing) {
            return res.status(409).json({ success: false, message: 'You have already added this skill with the same flags.' });
        }

        const result = db.prepare(`
            INSERT INTO skills (user_id, skill_name, category, proficiency, is_teaching, is_learning)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(req.user.id, skill_name, category, proficiency, is_teaching ? 1 : 0, is_learning ? 1 : 0);

        const newSkill = db.prepare('SELECT * FROM skills WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, skill: newSkill });
    } catch (err) { next(err); }
}

// ─── DELETE /skills/:id ───────────────────────────────────────────────────────
function deleteSkill(req, res, next) {
    try {
        const db    = getDb();
        const skill = db.prepare('SELECT * FROM skills WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found or you do not own it.' });
        }

        db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Skill removed.' });
    } catch (err) { next(err); }
}

// ─── GET /skills/discover — browse all skills across the campus ───────────────
function discoverSkills(req, res, next) {
    try {
        const db       = getDb();
        const { category, type, search, branch } = req.query;

        // Dynamic query builder
        let sql    = `
            SELECT s.*, u.full_name, u.roll_number, u.academic_year, u.branch, u.hostel,
                   COALESCE((SELECT AVG(r.overall_stars) FROM ratings r WHERE r.ratee_id = u.id), 0) AS avg_rating
            FROM skills s
            JOIN users u ON u.id = s.user_id
            WHERE u.id != ?
        `;
        const params = [req.user.id];

        if (category && VALID_CATEGORIES.includes(category)) {
            sql += ' AND s.category = ?';
            params.push(category);
        }
        if (type === 'teaching') { sql += ' AND s.is_teaching = 1'; }
        if (type === 'learning') { sql += ' AND s.is_learning = 1'; }
        if (branch && ['CSE','DSAI','ECE','IT'].includes(branch)) {
            sql += ' AND u.branch = ?';
            params.push(branch);
        }
        if (search) {
            sql += ' AND (s.skill_name LIKE ? OR u.full_name LIKE ? OR u.roll_number LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        sql += ' ORDER BY avg_rating DESC, s.skill_name ASC';

        const skills = db.prepare(sql).all(...params);
        res.json({ success: true, count: skills.length, skills });
    } catch (err) { next(err); }
}

// ─── GET /skills/matches — barter match engine ───────────────────────────────
function getBarterMatches(req, res, next) {
    try {
        const db      = getDb();
        const matches  = findBarterMatches(db, req.user.id);
        const mentors  = findMentorshipOpportunities(db, req.user.id);
        res.json({ success: true, barter_matches: matches, mentorship_opportunities: mentors });
    } catch (err) { next(err); }
}

module.exports = {
    getMySkills, getUserSkills, addSkill, deleteSkill,
    discoverSkills, getBarterMatches, skillValidation,
};
