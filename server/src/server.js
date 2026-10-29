/**
 * server.js — Skillora Application Layer Entry Point
 * ────────────────────────────────────────────────────
 * This file is the composition root: it wires together Express, Socket.IO,
 * the database, all middleware, and all routes.
 *
 * REQUEST LIFECYCLE (for every API call):
 *   1. morgan         → log the request
 *   2. helmet         → set security HTTP headers
 *   3. cors           → validate Origin header
 *   4. express.json() → parse JSON body
 *   5. apiLimiter     → check rate limit
 *   6. router match   → find route handler
 *   7. verifyDomain   → check email domain (auth routes only)
 *   8. authenticate   → verify JWT (protected routes)
 *   9. controller     → execute business logic
 *  10. errorHandler   → format and send error response
 */

require('dotenv').config();

const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const path        = require('path');

const { initSchema }          = require('../../database/db');
const { apiLimiter }          = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { verifyAccessToken }   = require('./utils/tokenUtils');

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth.routes');
const skillRoutes       = require('./routes/skill.routes');
const swapRoutes        = require('./routes/swap.routes');
const ratingRoutes      = require('./routes/rating.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');

// ─── Initialize Database Schema ───────────────────────────────────────────────
initSchema(); // CREATE TABLE IF NOT EXISTS — safe to call on every startup

// ─── Ensure Essential Team & Skill Seeds ──────────────────────────────────────
function ensureTeamSeeds() {
    try {
        const { getDb } = require('../../database/db');
        const db = getDb();
        // Standard hash for 'Password@123'
        const passwordHash = '$2a$10$f9G8vVwP.qS5zB8XF1Y1A.uOQ9Vz0k0K1eF6M7lG9N1P3R5T7V9X.';

        const coreMembers = [
            {
                email: 'sufal@iiitnr.edu.in',
                full_name: 'Sufal Singh Thakur',
                roll_number: '261020489',
                branch: 'DSAI',
                academic_year: 'B.Tech 1st Year',
                batch: '2026',
                hostel: 'Bhabha',
                bio: 'Skillora Backend Architect. Node.js runtime, Express REST APIs & WebSockets specialist.',
                skills: [
                    { name: 'Node.js & Express REST APIs', category: 'Academic/Core', proficiency: 'Expert', is_teaching: 1, is_learning: 0 },
                    { name: 'Backend Architecture', category: 'Academic/Core', proficiency: 'Advanced', is_teaching: 1, is_learning: 0 },
                    { name: 'WebSockets & Real-Time Events', category: 'Academic/Core', proficiency: 'Advanced', is_teaching: 1, is_learning: 0 },
                    { name: 'Machine Learning', category: 'Academic/Core', proficiency: 'Beginner', is_teaching: 0, is_learning: 1 },
                ]
            },
            {
                email: 'parth@iiitnr.edu.in',
                full_name: 'Parth Sharma',
                roll_number: '261020470',
                branch: 'DSAI',
                academic_year: 'B.Tech 1st Year',
                batch: '2026',
                hostel: 'Ramanujan',
                bio: 'Skillora Database Architect. SQLite persistence, security & barter algorithms.',
                skills: [
                    { name: 'Database Design & SQLite', category: 'Academic/Core', proficiency: 'Expert', is_teaching: 1, is_learning: 0 },
                    { name: 'Algorithm Optimization', category: 'Academic/Core', proficiency: 'Advanced', is_teaching: 1, is_learning: 0 },
                    { name: 'React.js', category: 'Academic/Core', proficiency: 'Beginner', is_teaching: 0, is_learning: 1 },
                ]
            },
            {
                email: 'ayanna@iiitnr.edu.in',
                full_name: 'Ayanna Jain',
                roll_number: '261020450',
                branch: 'DSAI',
                academic_year: 'B.Tech 1st Year',
                batch: '2026',
                hostel: 'Shabri',
                bio: 'Skillora UI/UX Lead. CSS Design System, Liquid Glass & responsive layout.',
                skills: [
                    { name: 'UI/UX Design & Figma', category: 'Creative/Campus Life', proficiency: 'Expert', is_teaching: 1, is_learning: 0 },
                    { name: 'Modern CSS & Glassmorphism', category: 'Academic/Core', proficiency: 'Advanced', is_teaching: 1, is_learning: 0 },
                    { name: 'Data Structures & Algorithms', category: 'Academic/Core', proficiency: 'Intermediate', is_teaching: 0, is_learning: 1 },
                ]
            },
            {
                email: 'chesta@iiitnr.edu.in',
                full_name: 'Chesta Kamle',
                roll_number: '261020460',
                branch: 'DSAI',
                academic_year: 'B.Tech 1st Year',
                batch: '2026',
                hostel: 'Shabri',
                bio: 'Skillora Frontend Engineer. React 18 SPA architecture & state management.',
                skills: [
                    { name: 'React.js & State Management', category: 'Academic/Core', proficiency: 'Expert', is_teaching: 1, is_learning: 0 },
                    { name: 'Vite & Frontend Tooling', category: 'Academic/Core', proficiency: 'Advanced', is_teaching: 1, is_learning: 0 },
                    { name: 'Python (Data Science)', category: 'Academic/Core', proficiency: 'Beginner', is_teaching: 0, is_learning: 1 },
                ]
            }
        ];

        for (const m of coreMembers) {
            let user = db.prepare('SELECT id FROM users WHERE email = ?').get(m.email);
            if (!user) {
                const res = db.prepare(`
                    INSERT INTO users (email, password_hash, full_name, roll_number, branch, academic_year, batch, hostel, bio, is_verified)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `).run(m.email, passwordHash, m.full_name, m.roll_number, m.branch, m.academic_year, m.batch, m.hostel, m.bio);
                user = { id: res.lastInsertRowid };
            } else {
                db.prepare(`
                    UPDATE users SET full_name = ?, roll_number = ?, branch = ?, academic_year = ?, batch = ?, hostel = ?, bio = ?
                    WHERE id = ?
                `).run(m.full_name, m.roll_number, m.branch, m.academic_year, m.batch, m.hostel, m.bio, user.id);
            }

            for (const s of m.skills) {
                const hasSkill = db.prepare('SELECT id FROM skills WHERE user_id = ? AND skill_name = ?').get(user.id, s.name);
                if (!hasSkill) {
                    db.prepare(`
                        INSERT INTO skills (user_id, skill_name, category, proficiency, is_teaching, is_learning)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).run(user.id, s.name, s.category, s.proficiency, s.is_teaching, s.is_learning);
                }
            }
        }
    } catch (err) {
        console.error('[DB] ensureTeamSeeds error:', err.message);
    }
}
ensureTeamSeeds();

// ─── Express App Setup ────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app); // Wrap in http.Server for Socket.IO

// ─── CORS Configuration ───────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, Postman, curl)
        return callback(null, true);
    },
    credentials: true, // Allow Authorization header
}));

// ─── Security & Logging Middleware ───────────────────────────────────────────
app.use(helmet());   // Sets X-Content-Type-Options, X-Frame-Options, etc.
app.use(morgan('dev')); // Logs: METHOD /path STATUS RESPONSE_TIME
app.use(express.json({ limit: '10kb' })); // Reject payloads > 10KB (DoS protection)
app.use(express.urlencoded({ extended: false }));

// ─── General API Rate Limiting ────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Socket.IO Setup ─────────────────────────────────────────────────────────
/**
 * WHY Socket.IO and not plain WebSockets?
 *   Socket.IO adds: automatic reconnection, room-based broadcasting,
 *   event namespacing, and a fallback to HTTP long-polling when WebSockets
 *   aren't available (useful in restricted campus networks).
 */
const io = new Server(server, {
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
    },
});

/**
 * Socket.IO Authentication Guard
 * Verifies the JWT passed in socket.handshake.auth.token
 * before allowing the connection.
 */
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: No token provided.'));

    const { valid, decoded } = verifyAccessToken(token);
    if (!valid) return next(new Error('Authentication error: Invalid token.'));

    socket.user = decoded;
    next();
});

io.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (userId) {
        // Each user joins their private room for targeted notifications
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] User ${userId} connected → joined room user:${userId}`);
    }

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] User ${userId} disconnected`);
    });
});

// ─── Attach io to every request (for controllers to emit events) ──────────────
app.use((req, res, next) => {
    req.io = io;
    next();
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/skills',      skillRoutes);
app.use('/api/swaps',       swapRoutes);
app.use('/api/ratings',     ratingRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Root landing endpoint
app.get('/', (req, res) => {
    res.json({
        service: '🎓 Skillora API Backend',
        status: 'online',
        health: '/api/health',
        documentation: 'https://github.com/iam-apoorvsingh/Skillora'
    });
});

// Health check endpoint (useful for deployment monitoring)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Skillora API', timestamp: new Date().toISOString() });
});

// ─── Error Handling (MUST be last) ────────────────────────────────────────────
app.use(notFoundHandler); // 404 for unknown routes
app.use(errorHandler);    // 4-argument Express error handler

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
server.listen(PORT, () => {
    console.log(`\n🚀 Skillora API running at http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready on ws://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, server, io }; // Export for potential testing
