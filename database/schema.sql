-- =============================================================================
-- SKILLORA — IIIT-NR Skill Sharing Platform
-- Database Schema (schema.sql)
-- Tier 3: Data Persistence Layer
--
-- DESIGN PHILOSOPHY:
--   Fully normalised (3NF) relational schema. Each entity has a single
--   responsibility. Foreign-key constraints enforce referential integrity.
--   Composite indexes are placed on columns used in WHERE clauses of the
--   leaderboard and match-engine queries to keep O(log n) lookups.
--
-- Compatible with: SQLite 3.35+ and PostgreSQL 14+
--   (Only syntax difference: AUTOINCREMENT vs SERIAL / GENERATED ALWAYS AS)
-- =============================================================================

PRAGMA journal_mode = WAL;   -- Write-Ahead Logging: allows concurrent reads
PRAGMA foreign_keys = ON;    -- Enforce FK constraints in SQLite

-- ---------------------------------------------------------------------------
-- TABLE 1: users
--   Central identity store. Every other table references this via user_id.
--   Domain constraint: email must match @iiitnr.edu.in (enforced at app layer
--   AND via CHECK constraint for defence-in-depth).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    email            TEXT    NOT NULL UNIQUE
                             CHECK (email LIKE '%@iiitnr.edu.in'),
    password_hash    TEXT    NOT NULL,
    full_name        TEXT    NOT NULL,
    roll_number      TEXT    NOT NULL UNIQUE,         -- e.g. 261020416 (YYSSSNNNN)
    branch           TEXT    NOT NULL
                             CHECK (branch IN ('CSE','DSAI','ECE','IT','Other')),
    academic_year    TEXT    NOT NULL
                             CHECK (academic_year IN (
                                 'B.Tech 1st Year','B.Tech 2nd Year',
                                 'B.Tech 3rd Year','B.Tech 4th Year',
                                 'M.Tech 1st Year','M.Tech 2nd Year','Ph.D.')),
    batch            TEXT    NOT NULL,                -- e.g. 2021, 2022
    hostel           TEXT,                            -- Ramanujan / Bose / Day Scholar / etc.
    bio              TEXT    DEFAULT '',
    profile_image    TEXT    DEFAULT NULL,            -- URL or base64
    is_verified      INTEGER DEFAULT 0,              -- 0=pending, 1=verified
    refresh_token    TEXT    DEFAULT NULL,
    created_at       TEXT    DEFAULT (datetime('now')),
    updated_at       TEXT    DEFAULT (datetime('now'))
);

-- Index: leaderboard queries filter by branch and academic_year frequently
CREATE INDEX IF NOT EXISTS idx_users_branch      ON users(branch);
CREATE INDEX IF NOT EXISTS idx_users_year        ON users(academic_year);
CREATE INDEX IF NOT EXISTS idx_users_batch       ON users(batch);

-- ---------------------------------------------------------------------------
-- TABLE 2: skills
--   A user can have MULTIPLE skills rows — each row is one skill declaration.
--   is_teaching=1 means this user offers to teach it.
--   is_learning=1 means this user wants to learn it.
--   A single skill can have both flags (they teach AND refine it further).
--
--   WHY split teaching/learning into flags rather than two tables?
--   A single skills table with bit-flags keeps the match-engine JOIN simple:
--     SELECT … WHERE s1.skill_name = s2.skill_name
--                AND s1.is_teaching = 1 AND s2.is_learning = 1
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name      TEXT    NOT NULL,
    category        TEXT    NOT NULL
                            CHECK (category IN (
                                'Academic/Core','Creative/Campus Life')),
    proficiency     TEXT    NOT NULL
                            CHECK (proficiency IN (
                                'Beginner','Intermediate','Advanced','Expert')),
    is_teaching     INTEGER NOT NULL DEFAULT 0 CHECK (is_teaching IN (0,1)),
    is_learning     INTEGER NOT NULL DEFAULT 0 CHECK (is_learning IN (0,1)),
    created_at      TEXT    DEFAULT (datetime('now')),
    -- At least one flag must be set
    CHECK (is_teaching = 1 OR is_learning = 1)
);

-- Index: match engine does skill_name lookups with teaching/learning filters
CREATE INDEX IF NOT EXISTS idx_skills_name_teach ON skills(skill_name, is_teaching);
CREATE INDEX IF NOT EXISTS idx_skills_name_learn ON skills(skill_name, is_learning);
CREATE INDEX IF NOT EXISTS idx_skills_user        ON skills(user_id);

-- ---------------------------------------------------------------------------
-- TABLE 3: swaps
--   Lifecycle: PENDING → ACCEPTED|DECLINED → SCHEDULED → COMPLETED|CANCELLED
--   requester_id proposes; responder_id accepts/declines.
--   Each swap covers one teaching direction. A full barter creates two swap
--   rows (A teaches B, B teaches A) linked via barter_group_id.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS swaps (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id     INTEGER NOT NULL REFERENCES users(id),
    responder_id     INTEGER NOT NULL REFERENCES users(id),
    requester_teaches TEXT   NOT NULL,    -- Skill A teaches to B
    responder_teaches TEXT   NOT NULL,    -- Skill B teaches to A (for barter)
    status           TEXT    NOT NULL DEFAULT 'PENDING'
                             CHECK (status IN (
                                 'PENDING','ACCEPTED','DECLINED',
                                 'SCHEDULED','COMPLETED','CANCELLED')),
    proposed_time    TEXT,                -- ISO8601 datetime string
    location_type    TEXT    DEFAULT 'Central Library',
    meet_link        TEXT    DEFAULT NULL,  -- Google Meet URL for online sessions
    barter_group_id  INTEGER DEFAULT NULL, -- links two paired swap rows
    message          TEXT    DEFAULT '',
    created_at       TEXT    DEFAULT (datetime('now')),
    updated_at       TEXT    DEFAULT (datetime('now')),
    -- A user cannot swap with themselves
    CHECK (requester_id != responder_id)
);

CREATE INDEX IF NOT EXISTS idx_swaps_requester ON swaps(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_swaps_responder ON swaps(responder_id, status);
CREATE INDEX IF NOT EXISTS idx_swaps_status    ON swaps(status);

-- ---------------------------------------------------------------------------
-- TABLE 4: sessions
--   A session is created when a swap reaches SCHEDULED status.
--   Tracks actual start/end times to enforce the minimum duration gate
--   before ratings are unlocked. A session must be >= 20 minutes to unlock.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    swap_id           INTEGER NOT NULL UNIQUE REFERENCES swaps(id),
    scheduled_start   TEXT    NOT NULL,
    scheduled_end     TEXT    NOT NULL,
    actual_start      TEXT    DEFAULT NULL,
    actual_end        TEXT    DEFAULT NULL,
    duration_minutes  INTEGER DEFAULT 0,   -- computed on session end
    is_completed      INTEGER DEFAULT 0,   -- 1 once both confirm completion
    rating_unlocked   INTEGER DEFAULT 0,   -- 1 when duration >= 20 min
    created_at        TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_swap      ON sessions(swap_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions(is_completed, rating_unlocked);

-- ---------------------------------------------------------------------------
-- TABLE 5: ratings
--   Post-session peer review. Double entry: both participants rate each other.
--   Three sub-criteria map to specific teaching dimensions:
--     punctuality   → time management & reliability
--     clarity       → communication quality
--     depth         → subject-matter expertise
--
--   ANTI-FRAUD DESIGN:
--     The overall_stars stored here is the RAW rating. The application layer
--     applies pair_review_count from the pair_review_log table to dampen
--     repeated reviews. The Bayesian average is computed at query time, not
--     stored, to stay accurate as global priors shift.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      INTEGER NOT NULL REFERENCES sessions(id),
    rater_id        INTEGER NOT NULL REFERENCES users(id),
    ratee_id        INTEGER NOT NULL REFERENCES users(id),
    overall_stars   REAL    NOT NULL CHECK (overall_stars >= 1 AND overall_stars <= 5),
    punctuality     INTEGER NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
    clarity         INTEGER NOT NULL CHECK (clarity BETWEEN 1 AND 5),
    depth           INTEGER NOT NULL CHECK (depth BETWEEN 1 AND 5),
    feedback_text   TEXT    DEFAULT '',
    created_at      TEXT    DEFAULT (datetime('now')),
    -- One rating per direction per session (rater→ratee is unique per session)
    UNIQUE (session_id, rater_id, ratee_id),
    CHECK (rater_id != ratee_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_ratee  ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater  ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_session ON ratings(session_id);

-- ---------------------------------------------------------------------------
-- TABLE 6: pair_review_log
--   Anti-Collusion / Anti-Gaming Mechanism.
--   WHY: Without this, two friends (roll A & roll B) can inflate each other's
--   scores by repeatedly completing trivial 20-min sessions. This table tracks
--   how many times the SAME pair has reviewed each other. The application
--   applies a logarithmic damping weight: w = 1 / log2(count + 1)
--   So 1st review: weight=1.0, 2nd: 0.5, 3rd: 0.37, 4th: 0.29 …
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pair_review_log (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_a_id    INTEGER NOT NULL REFERENCES users(id),
    user_b_id    INTEGER NOT NULL REFERENCES users(id),
    review_count INTEGER NOT NULL DEFAULT 0,
    last_review  TEXT    DEFAULT (datetime('now')),
    -- Canonical ordering: always user_a_id < user_b_id to avoid duplicate rows
    UNIQUE (user_a_id, user_b_id),
    CHECK (user_a_id < user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_pair_review ON pair_review_log(user_a_id, user_b_id);

-- ---------------------------------------------------------------------------
-- TABLE 7: annual_awards
--   Stores end-of-year computed results. Populated by a scheduled job (or
--   manual admin trigger) at academic year close.
--   award_tier: 'Rising Tutor' (10+ hrs), 'Distinguished Mentor' (30+ hrs),
--               'Campus Fellow' (top 5 percentile).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS annual_awards (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(id),
    academic_year    TEXT    NOT NULL,         -- e.g. '2024-25'
    award_tier       TEXT    NOT NULL
                             CHECK (award_tier IN (
                                 'Rising Tutor','Distinguished Mentor','Campus Fellow')),
    total_hours      REAL    NOT NULL DEFAULT 0,
    session_count    INTEGER NOT NULL DEFAULT 0,
    bayesian_score   REAL    NOT NULL DEFAULT 0,
    percentile_rank  REAL    DEFAULT NULL,     -- 0-100, set for Campus Fellow
    citation         TEXT    DEFAULT '',       -- official citation text
    is_official      INTEGER DEFAULT 0,        -- 1 = endorsed by Dean's office
    created_at       TEXT    DEFAULT (datetime('now')),
    UNIQUE (user_id, academic_year, award_tier)
);

CREATE INDEX IF NOT EXISTS idx_awards_year  ON annual_awards(academic_year);
CREATE INDEX IF NOT EXISTS idx_awards_user  ON annual_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_awards_tier  ON annual_awards(award_tier);

-- ---------------------------------------------------------------------------
-- VIEW: leaderboard_view
--   Pre-joins the most expensive leaderboard computation so the controller
--   can SELECT * FROM leaderboard_view WHERE academic_year = ? efficiently.
--   The Bayesian score is approximated here (exact score computed in JS/Python
--   to apply the pair-damping weights which require row-level iteration).
-- ---------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS leaderboard_view AS
SELECT
    u.id                                      AS user_id,
    u.full_name,
    u.roll_number,
    u.branch,
    u.academic_year,
    u.batch,
    COUNT(DISTINCT s.id)                      AS session_count,
    COALESCE(SUM(se.duration_minutes) / 60.0, 0) AS total_hours,
    COALESCE(AVG(r.overall_stars), 0)         AS raw_avg_rating,
    COUNT(DISTINCT r.id)                      AS rating_count
FROM users u
LEFT JOIN swaps sw   ON (sw.requester_id = u.id OR sw.responder_id = u.id)
                     AND sw.status = 'COMPLETED'
LEFT JOIN sessions se ON se.swap_id = sw.id AND se.is_completed = 1
LEFT JOIN ratings r   ON r.ratee_id = u.id
LEFT JOIN sessions s  ON s.swap_id = sw.id AND s.is_completed = 1
GROUP BY u.id, u.full_name, u.roll_number, u.branch, u.academic_year, u.batch;
