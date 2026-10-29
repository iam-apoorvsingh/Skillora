/**
 * controllers/swapController.js — Swap Request Lifecycle Management
 * ─────────────────────────────────────────────────────────────────
 * Manages the full lifecycle: PENDING → ACCEPTED|DECLINED → SCHEDULED → COMPLETED
 *
 * CONFLICT CHECKING:
 *   Before scheduling a session, we verify that NEITHER participant has
 *   an overlapping SCHEDULED session in the same time block. This prevents
 *   double-booking and ensures commitment to sessions.
 *
 * SOCKET.IO INTEGRATION:
 *   Real-time notifications are emitted via req.io (attached by server.js).
 *   Each user joins a room named `user:${userId}` on socket connection.
 */

const { body, param, validationResult } = require('express-validator');
const { getDb }                         = require('../../../database/db');

const VALID_STATUSES   = ['ACCEPTED','DECLINED','SCHEDULED','COMPLETED','CANCELLED'];
const VALID_LOCATIONS  = [
    'Central Library',
    'New Amphi Theatre',
    'Canteen',
    'SAC',
    'SAC (Student Activity Centre)',
    'Computer Centre 1',
    'Computer Centre 2',
    'Computer Centre / Labs',
    'Raman Common Room',
    'Shabri Common Room',
    'Bose Common Room',
    'Bhabha Common Room',
    'Ramanujan Common Room',
    'Ramanujan Hostel Common Room',
    'Bose Hostel Common Room',
    'Online'
];

// ─── CREATE SWAP REQUEST ──────────────────────────────────────────────────────
const createSwapValidation = [
    body('responder_id').isInt().withMessage('Responder ID must be an integer.'),
    body('requester_teaches').trim().notEmpty(),
    body('responder_teaches').trim().notEmpty(),
    body('proposed_time').isISO8601().withMessage('Proposed time must be ISO 8601 format.'),
    body('location_type').isIn(VALID_LOCATIONS).withMessage('Invalid location.'),
    body('message').optional().trim(),
];

function createSwap(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { responder_id, requester_teaches, responder_teaches, proposed_time, location_type, meet_link, message } = req.body;
    const requester_id = req.user.id;

    if (requester_id === parseInt(responder_id)) {
        return res.status(422).json({ success: false, message: 'You cannot send a swap request to yourself.' });
    }

    try {
        const db = getDb();

        // Verify responder exists
        const responder = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(responder_id);
        if (!responder) return res.status(404).json({ success: false, message: 'Responder user not found.' });

        // Check for existing active swap between these two users
        const existingSwap = db.prepare(`
            SELECT id, status FROM swaps
            WHERE status IN ('PENDING','ACCEPTED','SCHEDULED')
              AND ((requester_id = ? AND responder_id = ?) OR (requester_id = ? AND responder_id = ?))
        `).get(requester_id, responder_id, responder_id, requester_id);

        if (existingSwap) {
            return res.status(409).json({
                success: false,
                message: `You already have an active swap with this user (status: ${existingSwap.status}).`,
            });
        }

        const result = db.prepare(`
            INSERT INTO swaps (requester_id, responder_id, requester_teaches, responder_teaches,
                               status, proposed_time, location_type, meet_link, message)
            VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)
        `).run(requester_id, responder_id, requester_teaches, responder_teaches,
               proposed_time, location_type, meet_link || null, message || '');

        const swap = db.prepare('SELECT * FROM swaps WHERE id = ?').get(result.lastInsertRowid);

        // 🔔 Real-time notification to responder
        if (req.io) {
            req.io.to(`user:${responder_id}`).emit('swap:request', {
                swap,
                from: { id: requester_id, full_name: req.user.full_name || 'Someone' },
                message: `New swap request from ${req.user.email} to learn "${responder_teaches}"`,
            });
        }

        res.status(201).json({ success: true, swap });
    } catch (err) { next(err); }
}

// ─── UPDATE SWAP STATUS ───────────────────────────────────────────────────────
function updateSwapStatus(req, res, next) {
    const { id }     = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
        return res.status(422).json({ success: false, message: 'Invalid status transition.' });
    }

    try {
        const db   = getDb();
        const swap = db.prepare('SELECT * FROM swaps WHERE id = ?').get(id);

        if (!swap) return res.status(404).json({ success: false, message: 'Swap not found.' });

        // Authorization: only responder can ACCEPT/DECLINE; requester can CANCEL
        const userId = req.user.id;
        if (['ACCEPTED','DECLINED'].includes(status) && swap.responder_id !== userId) {
            return res.status(403).json({ success: false, message: 'Only the responder can accept or decline.' });
        }
        if (status === 'CANCELLED' && swap.requester_id !== userId) {
            return res.status(403).json({ success: false, message: 'Only the requester can cancel.' });
        }

        // Conflict checking for SCHEDULED status
        if (status === 'SCHEDULED') {
            const overlap = db.prepare(`
                SELECT se.id FROM sessions se
                JOIN swaps sw ON sw.id = se.swap_id
                WHERE se.is_completed = 0
                  AND sw.status = 'SCHEDULED'
                  AND (sw.requester_id IN (?,?) OR sw.responder_id IN (?,?))
                  AND se.scheduled_start < ?
                  AND se.scheduled_end   > ?
            `).get(swap.requester_id, swap.responder_id,
                   swap.requester_id, swap.responder_id,
                   new Date(new Date(swap.proposed_time).getTime() + 75*60000).toISOString(),
                   swap.proposed_time);

            if (overlap) {
                return res.status(409).json({
                    success: false,
                    message: 'Time conflict: one of the participants has an overlapping session.',
                });
            }

            // Create the session record when scheduling
            const start = new Date(swap.proposed_time);
            const end   = new Date(start.getTime() + 75 * 60000);
            db.prepare(`
                INSERT INTO sessions (swap_id, scheduled_start, scheduled_end)
                VALUES (?, ?, ?)
            `).run(swap.id, start.toISOString(), end.toISOString());
        }

        // Mark session completed
        if (status === 'COMPLETED') {
            const session = db.prepare('SELECT * FROM sessions WHERE swap_id = ?').get(swap.id);
            if (session) {
                const now = new Date().toISOString();
                const dur = Math.round((Date.now() - new Date(session.scheduled_start).getTime()) / 60000);
                const minDuration = parseInt(process.env.MIN_SESSION_DURATION_MINUTES || '20');
                db.prepare(`
                    UPDATE sessions SET actual_end = ?, duration_minutes = ?, is_completed = 1, rating_unlocked = ?
                    WHERE swap_id = ?
                `).run(now, dur, dur >= minDuration ? 1 : 0, swap.id);
            }
        }

        db.prepare(`UPDATE swaps SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
        const updatedSwap = db.prepare('SELECT * FROM swaps WHERE id = ?').get(id);

        // 🔔 Notify the other party
        const notifyUserId = userId === swap.requester_id ? swap.responder_id : swap.requester_id;
        if (req.io) {
            req.io.to(`user:${notifyUserId}`).emit('swap:updated', { swap: updatedSwap, newStatus: status });
        }

        res.json({ success: true, swap: updatedSwap });
    } catch (err) { next(err); }
}

// ─── GET MY SWAPS ─────────────────────────────────────────────────────────────
function getMySwaps(req, res, next) {
    try {
        const db     = getDb();
        const userId = req.user.id;
        const { status } = req.query;

        let sql = `
            SELECT sw.*,
                   u_req.full_name AS requester_name, u_req.roll_number AS requester_roll,
                   u_res.full_name AS responder_name, u_res.roll_number AS responder_roll,
                   se.id AS session_id, se.duration_minutes, se.is_completed, se.rating_unlocked
            FROM swaps sw
            JOIN users u_req ON u_req.id = sw.requester_id
            JOIN users u_res ON u_res.id = sw.responder_id
            LEFT JOIN sessions se ON se.swap_id = sw.id
            WHERE (sw.requester_id = ? OR sw.responder_id = ?)
        `;
        const params = [userId, userId];

        if (status) { sql += ' AND sw.status = ?'; params.push(status); }
        sql += ' ORDER BY sw.updated_at DESC';

        const swaps = db.prepare(sql).all(...params);
        res.json({ success: true, swaps });
    } catch (err) { next(err); }
}

// ─── GET SINGLE SWAP ──────────────────────────────────────────────────────────
function getSwap(req, res, next) {
    try {
        const db   = getDb();
        const swap = db.prepare(`
            SELECT sw.*, u_req.full_name AS requester_name, u_res.full_name AS responder_name,
                   se.id AS session_id, se.is_completed, se.rating_unlocked, se.duration_minutes
            FROM swaps sw
            JOIN users u_req ON u_req.id = sw.requester_id
            JOIN users u_res ON u_res.id = sw.responder_id
            LEFT JOIN sessions se ON se.swap_id = sw.id
            WHERE sw.id = ? AND (sw.requester_id = ? OR sw.responder_id = ?)
        `).get(req.params.id, req.user.id, req.user.id);

        if (!swap) return res.status(404).json({ success: false, message: 'Swap not found.' });
        res.json({ success: true, swap });
    } catch (err) { next(err); }
}

module.exports = { createSwap, createSwapValidation, updateSwapStatus, getMySwaps, getSwap };
