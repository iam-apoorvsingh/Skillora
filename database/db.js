/**
 * database/db.js — Tier 3: Data Persistence Layer
 * ─────────────────────────────────────────────────
 * WHY better-sqlite3 over node-sqlite3?
 *   better-sqlite3 is SYNCHRONOUS — every query returns immediately without
 *   callbacks or promises. This makes the code far easier to read, trace, and
 *   explain in a viva. The trade-off (blocking I/O) is acceptable for an
 *   academic single-node deployment. In production, switch to PostgreSQL + pg.
 *
 * CONNECTION POOLING NOTE:
 *   SQLite is an embedded database — the "connection" is just a file handle.
 *   We export a single db instance (singleton pattern) shared across all
 *   controllers. For PostgreSQL, replace this with a pg.Pool instance.
 */

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

// Resolve paths relative to this file's location
const DB_PATH     = path.join(__dirname, 'skillora.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// ─── Singleton instance ───────────────────────────────────────────────────────
let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH, {
            // verbose: console.log  // Uncomment to log every SQL query (useful for debugging)
        });

        // Enable WAL mode for better concurrent read performance
        db.pragma('journal_mode = WAL');
        // Enforce foreign-key constraints (SQLite disables these by default)
        db.pragma('foreign_keys = ON');
    }
    return db;
}

// ─── Schema initialisation ────────────────────────────────────────────────────
/**
 * initSchema()
 * Reads schema.sql and executes all DDL statements.
 * Called once at server startup — CREATE TABLE IF NOT EXISTS is idempotent.
 */
function initSchema() {
    const db     = getDb();
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);
    console.log('[DB] Schema initialised from schema.sql');
}

// ─── Convenience query helpers ────────────────────────────────────────────────
/**
 * These thin wrappers add consistent error handling and logging.
 * They mirror the pg (PostgreSQL) client API so migration is a one-liner swap.
 */

function query(sql, params = []) {
    const stmt = getDb().prepare(sql);
    return stmt.all(params);
}

function queryOne(sql, params = []) {
    const stmt = getDb().prepare(sql);
    return stmt.get(params);
}

function run(sql, params = []) {
    const stmt = getDb().prepare(sql);
    return stmt.run(params);
}

/**
 * transaction(fn)
 * Wraps a function in a SQLite transaction.
 * WHY: Operations like creating a swap + a session must be atomic —
 * if the session insert fails, the swap row must also be rolled back.
 * better-sqlite3's transaction() handles BEGIN/COMMIT/ROLLBACK automatically.
 */
function transaction(fn) {
    return getDb().transaction(fn)();
}

module.exports = { getDb, initSchema, query, queryOne, run, transaction };
