/**
 * routes/skill.routes.js
 * GET  /api/skills/mine       — authenticate → getMySkills
 * GET  /api/skills/discover   — authenticate → discoverSkills (with query filters)
 * GET  /api/skills/matches    — authenticate → getBarterMatches
 * GET  /api/skills/user/:id   — authenticate → getUserSkills
 * POST /api/skills            — authenticate → skillValidation → addSkill
 * DELETE /api/skills/:id      — authenticate → deleteSkill
 */

const express   = require('express');
const router    = express.Router();
const { authenticate }  = require('../middleware/authenticate');
const {
    getMySkills, getUserSkills, addSkill, deleteSkill,
    discoverSkills, getBarterMatches, skillValidation,
} = require('../controllers/skillController');

// All skill routes require authentication
router.use(authenticate);

router.get   ('/mine',        getMySkills);
router.get   ('/discover',    discoverSkills);
router.get   ('/matches',     getBarterMatches);
router.get   ('/user/:userId',getUserSkills);
router.post  ('/',            skillValidation, addSkill);
router.delete('/:id',         deleteSkill);

module.exports = router;
