/**
 * database/seeds/seed.js — Tier 3: Seed Data
 * ─────────────────────────────────────────────
 * Populates the database with realistic IIIT-NR student data for demo/viva.
 * Run: node database/seeds/seed.js  (from the skillora root)
 *
 * Roll Number Schema: YYSSSNNNN (9 digits)
 *   26 = 1st Year (Batch 2026)
 *   25 = 2nd Year (Batch 2025)
 *   24 = 3rd Year (Batch 2024)
 *   23 = 4th Year (Batch 2023)
 *   100 = CSE, 101 = ECE, 102 = DSAI
 */

const path    = require('path');
const bcrypt  = require('bcryptjs');

const { getDb, initSchema, run, transaction } = require(
    path.join(__dirname, '..', 'db.js')
);

// ─── Initialize Schema first ─────────────────────────────────────────────────
initSchema();
const db = getDb();

// ─── Clear existing data ─────────────────────────────────────────────────────
db.exec(`
    DELETE FROM annual_awards;
    DELETE FROM pair_review_log;
    DELETE FROM ratings;
    DELETE FROM sessions;
    DELETE FROM swaps;
    DELETE FROM skills;
    DELETE FROM users;
`);

console.log('[Seed] Cleared existing data...');

// ─── Students ─────────────────────────────────────────────────────────────────
const PASSWORD_HASH = bcrypt.hashSync('Password@123', 10); // Standard demo password

const students = [
    // ═══ 4th Year (Admission Year 23, Batch 2023) — Senior Mentors ═══════════
    { email: 'arjun.sharma@iiitnr.edu.in',   full_name: 'Arjun Sharma',    roll_number: '231000001', branch: 'CSE',  academic_year: 'B.Tech 4th Year', batch: '2023', hostel: 'Ramanujan', bio: 'DSA & CP enthusiast. Love competitive programming and teaching fundamentals.' },
    { email: 'priya.patel@iiitnr.edu.in',    full_name: 'Priya Patel',     roll_number: '231000024', branch: 'CSE',  academic_year: 'B.Tech 4th Year', batch: '2023', hostel: 'Bose',      bio: 'Full-stack dev. React + Node is my jam. Always happy to mentor juniors.' },
    { email: 'rohan.gupta@iiitnr.edu.in',    full_name: 'Rohan Gupta',     roll_number: '231000017', branch: 'CSE',  academic_year: 'B.Tech 4th Year', batch: '2023', hostel: 'Ramanujan', bio: 'ML/AI researcher. Working on my thesis on federated learning.' },
    { email: 'siddharth.rao@iiitnr.edu.in',  full_name: 'Siddharth Rao',   roll_number: '231020002', branch: 'DSAI', academic_year: 'B.Tech 4th Year', batch: '2023', hostel: 'Day Scholar', bio: 'Deep learning researcher. Published a workshop paper on GANs.' },
    { email: 'pooja.krishna@iiitnr.edu.in',  full_name: 'Pooja Krishna',   roll_number: '231010003', branch: 'ECE',  academic_year: 'B.Tech 4th Year', batch: '2023', hostel: 'Bose',      bio: 'Signal Processing and VLSI Design. Top student in ECE department.' },

    // ═══ 3rd Year (Admission Year 24, Batch 2024) ═════════════════════════════
    { email: 'sneha.iyer@iiitnr.edu.in',     full_name: 'Sneha Iyer',      roll_number: '241000011', branch: 'CSE',  academic_year: 'B.Tech 3rd Year', batch: '2024', hostel: 'Bose',      bio: 'Robotics + ROS. Member of the Robocon team.' },
    { email: 'aarav.mehta@iiitnr.edu.in',    full_name: 'Aarav Mehta',     roll_number: '241000034', branch: 'CSE',  academic_year: 'B.Tech 3rd Year', batch: '2024', hostel: 'Ramanujan', bio: 'Competitive programmer, Codeforces 1800+. Love sharing CP tricks.' },
    { email: 'divya.nair@iiitnr.edu.in',     full_name: 'Divya Nair',      roll_number: '241000008', branch: 'CSE',  academic_year: 'B.Tech 3rd Year', batch: '2024', hostel: 'Day Scholar', bio: 'Guitar 🎸 and web dev. Will trade music lessons for DSA help!' },
    { email: 'ishaan.thakur@iiitnr.edu.in',  full_name: 'Ishaan Thakur',   roll_number: '241020005', branch: 'DSAI', academic_year: 'B.Tech 3rd Year', batch: '2024', hostel: 'Ramanujan', bio: 'Data Science & ML. Python + Pandas expert. Learning guitar in free time.' },
    { email: 'tanvi.desai@iiitnr.edu.in',    full_name: 'Tanvi Desai',     roll_number: '241010007', branch: 'ECE',  academic_year: 'B.Tech 3rd Year', batch: '2024', hostel: 'Bose',      bio: 'VLSI & Embedded Systems. Arduino + FPGA projects.' },
    { email: 'yash.agarwal@iiitnr.edu.in',   full_name: 'Yash Agarwal',    roll_number: '241000047', branch: 'CSE',  academic_year: 'B.Tech 3rd Year', batch: '2024', hostel: 'Ramanujan', bio: 'Linux enthusiast and system programming nerd. Vim user, obviously.' },

    // ═══ 2nd Year (Admission Year 25, Batch 2025) ═════════════════════════════
    { email: 'karan.joshi@iiitnr.edu.in',    full_name: 'Karan Joshi',     roll_number: '251000019', branch: 'CSE',  academic_year: 'B.Tech 2nd Year', batch: '2025', hostel: 'Ramanujan', bio: 'Just discovered data structures. Looking for a mentor!' },
    { email: 'ananya.singh@iiitnr.edu.in',   full_name: 'Ananya Singh',    roll_number: '251000042', branch: 'CSE',  academic_year: 'B.Tech 2nd Year', batch: '2025', hostel: 'Bose',      bio: 'Passionate about public speaking and Python.' },
    { email: 'meera.pillai@iiitnr.edu.in',   full_name: 'Meera Pillai',    roll_number: '251020012', branch: 'DSAI', academic_year: 'B.Tech 2nd Year', batch: '2025', hostel: 'Bose',      bio: 'Statistics nerd. Want to dive into ML and NLP.' },
    { email: 'kartik.verma@iiitnr.edu.in',   full_name: 'Kartik Verma',    roll_number: '251010021', branch: 'ECE',  academic_year: 'B.Tech 2nd Year', batch: '2025', hostel: 'Ramanujan', bio: 'Digital Electronics. Trying to learn programming too!' },
    { email: 'neha.pandey@iiitnr.edu.in',    full_name: 'Neha Pandey',     roll_number: '251000055', branch: 'CSE',  academic_year: 'B.Tech 2nd Year', batch: '2025', hostel: 'Bose',      bio: 'Loves Python and wants to learn ML.' },

    // ═══ 1st Year (Admission Year 26, Batch 2026) ═════════════════════════════
    { email: 'veer.kumar@iiitnr.edu.in',     full_name: 'Veer Kumar',      roll_number: '261000003', branch: 'CSE',  academic_year: 'B.Tech 1st Year', batch: '2026', hostel: 'Ramanujan', bio: 'Fresh batch! Eager to learn everything.' },
        { email: 'apoorv26102@iiitnr.edu.in',   full_name: 'Apoorv',          roll_number: '261020416', branch: 'DSAI', academic_year: 'B.Tech 1st Year', batch: '2026', hostel: 'Ramanujan', bio: 'Skillora Lead & Creator. Data Science & AI enthusiast.' },
    { email: 'sufal@iiitnr.edu.in',          full_name: 'Sufal Singh Thakur', roll_number: '261020489', branch: 'DSAI', academic_year: 'B.Tech 1st Year', batch: '2026', hostel: 'Bhabha',    bio: 'Skillora Backend Architect. Node.js runtime, Express REST APIs & WebSockets specialist.' },
    { email: 'parth@iiitnr.edu.in',          full_name: 'Parth Sharma',       roll_number: '261020470', branch: 'DSAI', academic_year: 'B.Tech 1st Year', batch: '2026', hostel: 'Ramanujan', bio: 'Skillora Database Architect. SQLite persistence, security & barter algorithms.' },
    { email: 'ayanna@iiitnr.edu.in',         full_name: 'Ayanna Jain',        roll_number: '261020450', branch: 'DSAI', academic_year: 'B.Tech 1st Year', batch: '2026', hostel: 'Shabri',    bio: 'Skillora UI/UX Lead. CSS Design System, Liquid Glass & responsive layout.' },
    { email: 'chesta@iiitnr.edu.in',         full_name: 'Chesta Kamle',       roll_number: '261020460', branch: 'DSAI', academic_year: 'B.Tech 1st Year', batch: '2026', hostel: 'Shabri',    bio: 'Skillora Frontend Engineer. React 18 SPA architecture & state management.' },
    { email: 'avanish@iiitnr.edu.in',        full_name: 'Avanish',            roll_number: '261020522', branch: 'DSAI', academic_year: 'B.Tech 1st Year', batch: '2026', hostel: 'Raman',     bio: 'DSAI enthusiast exploring machine learning & deep learning.' },
    { email: 'sheyash@iiitnr.edu.in',        full_name: 'Sheyash',            roll_number: '261020523', branch: 'CSE',  academic_year: 'B.Tech 1st Year', batch: '2026', hostel: 'Bose',      bio: 'Competitive coding and algorithms enthusiast.' },

    // ═══ Postgraduate & Scholars ═════════════════════════════════════════════
    { email: 'rahul.mishra@iiitnr.edu.in',   full_name: 'Rahul Mishra',    roll_number: '261000001', branch: 'CSE',  academic_year: 'M.Tech 1st Year', batch: '2026', hostel: 'Ramanujan', bio: 'M.Tech in AI. Background in NLP. Love teaching ML fundamentals.' },
    { email: 'shreya.jain@iiitnr.edu.in',    full_name: 'Shreya Jain',     roll_number: '251000003', branch: 'CSE',  academic_year: 'M.Tech 2nd Year', batch: '2025', hostel: 'Bose',      bio: 'Distributed Systems and Cloud computing specialist.' },
    { email: 'dr.ankit.bose@iiitnr.edu.in',  full_name: 'Ankit Bose',      roll_number: '221000001', branch: 'CSE',  academic_year: 'Ph.D.', batch: '2022', hostel: 'Day Scholar', bio: 'Ph.D. in Graph Algorithms. TA for multiple courses. Open to mentoring.' },
];

// Insert students
const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, roll_number, branch, academic_year, batch, hostel, bio, is_verified)
    VALUES (@email, @password_hash, @full_name, @roll_number, @branch, @academic_year, @batch, @hostel, @bio, 1)
`);

const insertMany = db.transaction((users) => {
    for (const u of users) {
        insertUser.run({ ...u, password_hash: PASSWORD_HASH });
    }
});
insertMany(students);
console.log(`[Seed] Inserted ${students.length} students.`);

// ─── Fetch inserted user IDs ──────────────────────────────────────────────────
const getUser = db.prepare('SELECT id FROM users WHERE roll_number = ?');
const uid = {};
for (const s of students) {
    uid[s.roll_number] = getUser.get(s.roll_number).id;
}

// ─── Skills ──────────────────────────────────────────────────────────────────
const insertSkill = db.prepare(`
    INSERT INTO skills (user_id, skill_name, category, proficiency, is_teaching, is_learning)
    VALUES (@user_id, @skill_name, @category, @proficiency, @is_teaching, @is_learning)
`);

const skillsData = [
    // Apoorv (DSAI)
    { roll: '261020416', skill_name: 'Machine Learning',              category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '261020416', skill_name: 'Full-Stack Web Development',   category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    // Sufal Singh Thakur (DSAI) - Backend Lead
    { roll: '261020489', skill_name: 'Node.js & Express REST APIs',    category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '261020489', skill_name: 'Backend Architecture',           category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '261020489', skill_name: 'WebSockets & Real-Time Events',   category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '261020489', skill_name: 'Machine Learning',               category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Parth Sharma (DSAI) - Database Lead
    { roll: '261020470', skill_name: 'Database Design & SQLite',       category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '261020470', skill_name: 'Algorithm Optimization',         category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '261020470', skill_name: 'React.js',                       category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Ayanna Jain (DSAI) - UI/UX Lead
    { roll: '261020450', skill_name: 'UI/UX Design & Figma',           category: 'Creative/Campus Life', proficiency: 'Expert',  is_teaching: 1, is_learning: 0 },
    { roll: '261020450', skill_name: 'Modern CSS & Glassmorphism',     category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '261020450', skill_name: 'Data Structures & Algorithms',  category: 'Academic/Core', proficiency: 'Intermediate',  is_teaching: 0, is_learning: 1 },
    // Chesta Kamle (DSAI) - Frontend Lead
    { roll: '261020460', skill_name: 'React.js & State Management',    category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '261020460', skill_name: 'Vite & Frontend Tooling',        category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '261020460', skill_name: 'Python (Data Science)',          category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Avanish (DSAI)
    { roll: '261020522', skill_name: 'Python (Data Science)',          category: 'Academic/Core', proficiency: 'Intermediate',  is_teaching: 1, is_learning: 0 },
    { roll: '261020522', skill_name: 'Machine Learning',               category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Sheyash (CSE)
    { roll: '261020523', skill_name: 'C++ (Systems)',                  category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '261020523', skill_name: 'Competitive Programming',        category: 'Academic/Core', proficiency: 'Intermediate',  is_teaching: 0, is_learning: 1 },
    // Arjun teaches DSA & CP, wants ROS
    { roll: '231000001', skill_name: 'Data Structures & Algorithms', category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '231000001', skill_name: 'Competitive Programming',       category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '231000001', skill_name: 'ROS (Robot Operating System)',  category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Priya teaches React/Node, wants ML
    { roll: '231000024', skill_name: 'React.js',                      category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '231000024', skill_name: 'Node.js & Express',             category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '231000024', skill_name: 'Machine Learning',              category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Rohan teaches ML, wants Guitar
    { roll: '231000017', skill_name: 'Machine Learning',              category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '231000017', skill_name: 'Python (Data Science)',         category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '231000017', skill_name: 'Guitar',                        category: 'Creative/Campus Life', proficiency: 'Beginner', is_teaching: 0, is_learning: 1 },
    // Sneha teaches ROS, wants DSA
    { roll: '241000011', skill_name: 'ROS (Robot Operating System)',  category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '241000011', skill_name: 'C++ (Systems)',                 category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '241000011', skill_name: 'Data Structures & Algorithms', category: 'Academic/Core', proficiency: 'Intermediate',  is_teaching: 0, is_learning: 1 },
    // Aarav teaches CP, wants VLSI
    { roll: '241000034', skill_name: 'Competitive Programming',       category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '241000034', skill_name: 'Digital Electronics',           category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Divya teaches Guitar, wants DSA
    { roll: '241000008', skill_name: 'Guitar',                        category: 'Creative/Campus Life', proficiency: 'Advanced', is_teaching: 1, is_learning: 0 },
    { roll: '241000008', skill_name: 'Web Development (HTML/CSS)',    category: 'Academic/Core', proficiency: 'Intermediate',  is_teaching: 1, is_learning: 0 },
    { roll: '241000008', skill_name: 'Data Structures & Algorithms', category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Karan wants DSA & CP
    { roll: '251000019', skill_name: 'Data Structures & Algorithms', category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    { roll: '251000019', skill_name: 'Competitive Programming',       category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    { roll: '251000019', skill_name: 'Public Speaking',               category: 'Creative/Campus Life', proficiency: 'Intermediate', is_teaching: 1, is_learning: 0 },
    // Ananya teaches Public Speaking, wants Python
    { roll: '251000042', skill_name: 'Public Speaking',               category: 'Creative/Campus Life', proficiency: 'Advanced', is_teaching: 1, is_learning: 0 },
    { roll: '251000042', skill_name: 'Python (Basics)',               category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Ishaan teaches Python/ML, wants Guitar
    { roll: '241020005', skill_name: 'Python (Data Science)',         category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '241020005', skill_name: 'Machine Learning',              category: 'Academic/Core', proficiency: 'Intermediate',  is_teaching: 1, is_learning: 0 },
    { roll: '241020005', skill_name: 'Guitar',                        category: 'Creative/Campus Life', proficiency: 'Beginner', is_teaching: 0, is_learning: 1 },
    // Meera wants ML/Python
    { roll: '251020012', skill_name: 'Machine Learning',              category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    { roll: '251020012', skill_name: 'Statistics',                    category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    // Tanvi teaches VLSI/Embedded, wants CP
    { roll: '241010007', skill_name: 'VLSI Design',                   category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '241010007', skill_name: 'Embedded Systems (Arduino)',    category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '241010007', skill_name: 'Competitive Programming',       category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Kartik wants VLSI
    { roll: '251010021', skill_name: 'VLSI Design',                   category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    { roll: '251010021', skill_name: 'Digital Electronics',           category: 'Academic/Core', proficiency: 'Intermediate',  is_teaching: 1, is_learning: 0 },
    // Pooja teaches VLSI
    { roll: '231010003', skill_name: 'VLSI Design',                   category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '231010003', skill_name: 'Signal Processing',             category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '231010003', skill_name: 'Machine Learning',              category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
    // Rahul (M.Tech) teaches ML fundamentals
    { roll: '261000001', skill_name: 'Machine Learning',              category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '261000001', skill_name: 'Natural Language Processing',   category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    // Dr. Ankit teaches Graph Algorithms
    { roll: '221000001', skill_name: 'Graph Algorithms',              category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '221000001', skill_name: 'Data Structures & Algorithms', category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    // Yash teaches Linux/Systems
    { roll: '241000047', skill_name: 'Linux & Shell Scripting',       category: 'Academic/Core', proficiency: 'Expert',        is_teaching: 1, is_learning: 0 },
    { roll: '241000047', skill_name: 'Operating Systems',             category: 'Academic/Core', proficiency: 'Advanced',      is_teaching: 1, is_learning: 0 },
    { roll: '241000047', skill_name: 'Machine Learning',              category: 'Academic/Core', proficiency: 'Beginner',      is_teaching: 0, is_learning: 1 },
];

const insertManySkills = db.transaction((skills) => {
    for (const s of skills) {
        insertSkill.run({
            user_id:     uid[s.roll],
            skill_name:  s.skill_name,
            category:    s.category,
            proficiency: s.proficiency,
            is_teaching: s.is_teaching,
            is_learning: s.is_learning,
        });
    }
});
insertManySkills(skillsData);
console.log(`[Seed] Inserted ${skillsData.length} skills.`);

// ─── Swaps & Sessions ─────────────────────────────────────────────────────────
const insertSwap = db.prepare(`
    INSERT INTO swaps (requester_id, responder_id, requester_teaches, responder_teaches, status, proposed_time, location_type, barter_group_id)
    VALUES (@requester_id, @responder_id, @requester_teaches, @responder_teaches, @status, @proposed_time, @location_type, @barter_group_id)
`);
const insertSession = db.prepare(`
    INSERT INTO sessions (swap_id, scheduled_start, scheduled_end, actual_start, actual_end, duration_minutes, is_completed, rating_unlocked)
    VALUES (@swap_id, @scheduled_start, @scheduled_end, @actual_start, @actual_end, @duration_minutes, @is_completed, @rating_unlocked)
`);

const swapsData = [
    // Arjun (DSA) ↔ Sneha (ROS) — BARTER GROUP 1
    { r: '231000001', p: '241000011', rt: 'Data Structures & Algorithms', pt: 'ROS (Robot Operating System)', status: 'COMPLETED', time: '2026-08-10T10:00:00', loc: 'Central Library', group: 1 },
    { r: '241000011', p: '231000001', rt: 'ROS (Robot Operating System)', pt: 'Data Structures & Algorithms', status: 'COMPLETED', time: '2026-08-15T14:00:00', loc: 'Central Library', group: 1 },
    // Rohan (ML) ↔ Divya (Guitar) — BARTER GROUP 2
    { r: '231000017', p: '241000008', rt: 'Machine Learning',              pt: 'Guitar',                        status: 'COMPLETED', time: '2026-08-12T16:00:00', loc: 'New Amphi Theatre', group: 2 },
    { r: '241000008', p: '231000017', rt: 'Guitar',                        pt: 'Machine Learning',              status: 'COMPLETED', time: '2026-08-20T17:00:00', loc: 'New Amphi Theatre', group: 2 },
    // Priya (React) → Karan mentorship
    { r: '231000024', p: '251000019', rt: 'React.js',                      pt: 'Public Speaking',               status: 'COMPLETED', time: '2026-08-22T11:00:00', loc: 'Canteen', group: null },
    // Ishaan (Python) ↔ Divya (Guitar) — BARTER GROUP 3
    { r: '241020005', p: '241000008', rt: 'Python (Data Science)',          pt: 'Guitar',                        status: 'COMPLETED', time: '2026-09-01T15:00:00', loc: 'New Amphi Theatre', group: 3 },
    { r: '241000008', p: '241020005', rt: 'Guitar',                        pt: 'Python (Data Science)',          status: 'COMPLETED', time: '2026-09-05T15:00:00', loc: 'New Amphi Theatre', group: 3 },
    // Pooja (VLSI) → Kartik mentorship
    { r: '231010003', p: '251010021', rt: 'VLSI Design',                   pt: 'Digital Electronics',           status: 'COMPLETED', time: '2026-09-08T10:00:00', loc: 'Canteen', group: null },
    // Dr. Ankit → Karan (Graph Algorithms mentorship)
    { r: '221000001', p: '251000019', rt: 'Graph Algorithms',              pt: 'Public Speaking',               status: 'COMPLETED', time: '2026-09-10T09:00:00', loc: 'Central Library', group: null },
    // Rahul (ML) → Neha (pending / scheduled)
    { r: '261000001', p: '251000055', rt: 'Machine Learning',              pt: 'Python (Basics)',               status: 'SCHEDULED', time: '2026-09-25T14:00:00', loc: 'Central Library', group: null },
    // Arjun → Veer (Pending)
    { r: '231000001', p: '261000003', rt: 'Competitive Programming',       pt: 'Data Structures & Algorithms', status: 'PENDING', time: '2026-09-28T10:00:00', loc: 'Online', group: null },
    // Aarav (CP) ↔ Tanvi (VLSI) — Pending barter
    { r: '241000034', p: '241010007', rt: 'Competitive Programming',       pt: 'VLSI Design',                  status: 'PENDING', time: '2026-09-30T11:00:00', loc: 'Canteen', group: null },
];

const insertSwapsAndSessions = db.transaction((swaps) => {
    for (const s of swaps) {
        const result = insertSwap.run({
            requester_id:    uid[s.r],
            responder_id:    uid[s.p],
            requester_teaches: s.rt,
            responder_teaches: s.pt,
            status:          s.status,
            proposed_time:   s.time,
            location_type:   s.loc,
            barter_group_id: s.group,
        });

        if (s.status === 'COMPLETED') {
            const start = s.time;
            const end   = new Date(new Date(s.time).getTime() + 75 * 60000).toISOString();
            insertSession.run({
                swap_id:          result.lastInsertRowid,
                scheduled_start:  start,
                scheduled_end:    end,
                actual_start:     start,
                actual_end:       end,
                duration_minutes: 75,
                is_completed:     1,
                rating_unlocked:  1,
            });
        } else if (s.status === 'SCHEDULED') {
            const start = s.time;
            const end   = new Date(new Date(s.time).getTime() + 60 * 60000).toISOString();
            insertSession.run({
                swap_id:          result.lastInsertRowid,
                scheduled_start:  start,
                scheduled_end:    end,
                actual_start:     null,
                actual_end:       null,
                duration_minutes: 60,
                is_completed:     0,
                rating_unlocked:  0,
            });
        }
    }
});
insertSwapsAndSessions(swapsData);
console.log(`[Seed] Inserted ${swapsData.length} swaps + sessions.`);

// ─── Ratings & Pair Reviews ───────────────────────────────────────────────────
const getSession = db.prepare(`
    SELECT s.id FROM sessions s
    JOIN swaps sw ON sw.id = s.swap_id
    WHERE (sw.requester_id = ? AND sw.responder_id = ?)
       OR (sw.requester_id = ? AND sw.responder_id = ?)
    LIMIT 1
`);

const insertRating = db.prepare(`
    INSERT INTO ratings (session_id, rater_id, ratee_id, overall_stars, punctuality, clarity, depth, feedback_text)
    VALUES (@session_id, @rater_id, @ratee_id, @overall_stars, @punctuality, @clarity, @depth, @feedback_text)
`);

const insertPairLog = db.prepare(`
    INSERT INTO pair_review_log (user_a_id, user_b_id, review_count)
    VALUES (@a, @b, @cnt)
    ON CONFLICT(user_a_id, user_b_id) DO UPDATE SET review_count = review_count + @cnt
`);

const ratingsData = [
    // Arjun ↔ Sneha
    { r: '231000001', p: '241000011', rater: '241000011', ratee: '231000001', stars: 5, punc: 5, clar: 5, dep: 5, fb: 'Arjun explained recursion beautifully. Concepts stuck immediately.' },
    { r: '231000001', p: '241000011', rater: '231000001', ratee: '241000011', stars: 5, punc: 4, clar: 5, dep: 5, fb: 'Sneha knows ROS deeply. Very hands-on approach with the TurtleBot sim.' },
    { r: '241000011', p: '231000001', rater: '231000001', ratee: '241000011', stars: 4, punc: 4, clar: 4, dep: 5, fb: 'Great second session. Advanced ROS topics like tf frames.' },
    { r: '241000011', p: '231000001', rater: '241000011', ratee: '231000001', stars: 5, punc: 5, clar: 5, dep: 5, fb: 'Arjun is an amazing teacher. Made DP click for me in session 2!' },
    // Rohan ↔ Divya
    { r: '231000017', p: '241000008', rater: '241000008', ratee: '231000017', stars: 5, punc: 5, clar: 5, dep: 5, fb: 'Best ML intro ever. Rohan connects theory to real projects.' },
    { r: '231000017', p: '241000008', rater: '231000017', ratee: '241000008', stars: 4, punc: 3, clar: 5, dep: 4, fb: 'Divya is talented! Learned chord transitions. Could be more punctual.' },
    { r: '241000008', p: '231000017', rater: '231000017', ratee: '241000008', stars: 5, punc: 4, clar: 5, dep: 5, fb: 'Guitar lesson 2 — fingerpicking patterns. Excellent teaching.' },
    { r: '241000008', p: '231000017', rater: '241000008', ratee: '231000017', stars: 5, punc: 5, clar: 5, dep: 5, fb: 'Second ML session even better. Neural networks made simple.' },
    // Priya → Karan
    { r: '231000024', p: '251000019', rater: '251000019', ratee: '231000024', stars: 5, punc: 5, clar: 5, dep: 5, fb: 'Priya taught React hooks with real project examples. Loved it.' },
    { r: '231000024', p: '251000019', rater: '231000024', ratee: '251000019', stars: 4, punc: 4, clar: 4, dep: 3, fb: 'Karan presented well. Still building depth in public speaking topics.' },
    // Ishaan ↔ Divya
    { r: '241020005', p: '241000008', rater: '241000008', ratee: '241020005', stars: 4, punc: 5, clar: 4, dep: 4, fb: 'Python & Pandas was well-explained. Good pace.' },
    { r: '241020005', p: '241000008', rater: '241020005', ratee: '241000008', stars: 5, punc: 5, clar: 5, dep: 5, fb: 'Divya teaches guitar with a lot of patience. Highly recommend!' },
    { r: '241000008', p: '241020005', rater: '241020005', ratee: '241000008', stars: 5, punc: 5, clar: 5, dep: 5, fb: 'She simplified strumming patterns really well.' },
    { r: '241000008', p: '241020005', rater: '241000008', ratee: '241020005', stars: 4, punc: 4, clar: 4, dep: 5, fb: 'Matplotlib and visualization session was very detailed.' },
    // Pooja → Kartik
    { r: '231010003', p: '251010021', rater: '251010021', ratee: '231010003', stars: 5, punc: 5, clar: 5, dep: 5, fb: 'Pooja is brilliant. CMOS logic made crystal clear.' },
    { r: '231010003', p: '251010021', rater: '231010003', ratee: '251010021', stars: 3, punc: 3, clar: 3, dep: 4, fb: 'Kartik needs to prepare topics better before sessions.' },
    // Dr. Ankit → Karan
    { r: '221000001', p: '251000019', rater: '251000019', ratee: '221000001', stars: 5, punc: 5, clar: 5, dep: 5, fb: 'Dr. Ankit is phenomenal. Dijkstra and Floyd-Warshall — crystal clear proofs.' },
    { r: '221000001', p: '251000019', rater: '221000001', ratee: '251000019', stars: 4, punc: 4, clar: 4, dep: 4, fb: 'Karan improved significantly. Good questions during the session.' },
];

const insertAllRatings = db.transaction((ratings) => {
    for (const rt of ratings) {
        const session = getSession.get(uid[rt.r], uid[rt.p], uid[rt.p], uid[rt.r]);
        if (!session) {
            console.warn(`[Seed] No session found for ${rt.r}→${rt.p}, skipping rating.`);
            continue;
        }
        insertRating.run({
            session_id:    session.id,
            rater_id:      uid[rt.rater],
            ratee_id:      uid[rt.ratee],
            overall_stars: rt.stars,
            punctuality:   rt.punc,
            clarity:       rt.clar,
            depth:         rt.dep,
            feedback_text: rt.fb,
        });
        const a = Math.min(uid[rt.rater], uid[rt.ratee]);
        const b = Math.max(uid[rt.rater], uid[rt.ratee]);
        insertPairLog.run({ a, b, cnt: 1 });
    }
});
insertAllRatings(ratingsData);
console.log(`[Seed] Inserted ${ratingsData.length} ratings.`);

// ─── Annual Awards ────────────────────────────────────────────────────────────
const insertAward = db.prepare(`
    INSERT INTO annual_awards (user_id, academic_year, award_tier, total_hours, session_count, bayesian_score, percentile_rank, citation, is_official)
    VALUES (@user_id, @academic_year, @award_tier, @total_hours, @session_count, @bayesian_score, @percentile_rank, @citation, @is_official)
`);

const awardsData = [
    { roll: '231000001', tier: 'Campus Fellow',        hours: 48.5, sessions: 38, score: 4.92, pct: 98.5, citation: 'Exceptional contribution to peer learning in DSA and Competitive Programming. Recognized at Institute Day 2026.', official: 1 },
    { roll: '231010003', tier: 'Distinguished Mentor', hours: 36.2, sessions: 29, score: 4.87, pct: null, citation: 'Outstanding VLSI mentorship across ECE department.', official: 1 },
    { roll: '231000017', tier: 'Distinguished Mentor', hours: 32.5, sessions: 26, score: 4.91, pct: null, citation: 'Top ML mentor for batch 2024 and 2025.', official: 1 },
    { roll: '221000001', tier: 'Campus Fellow',        hours: 62.0, sessions: 50, score: 4.97, pct: 99.8, citation: 'Most dedicated senior mentor. Dean of Student Affairs Commendation 2026.', official: 1 },
    { roll: '241000011', tier: 'Rising Tutor',         hours: 14.5, sessions: 12, score: 4.78, pct: null, citation: 'Rising talent in Robotics mentorship.', official: 0 },
    { roll: '231000024', tier: 'Rising Tutor',         hours: 12.0, sessions: 10, score: 4.80, pct: null, citation: 'Effective full-stack dev mentor for juniors.', official: 0 },
];

const insertAllAwards = db.transaction((awards) => {
    for (const a of awards) {
        insertAward.run({
            user_id:        uid[a.roll],
            academic_year:  '2025-26',
            award_tier:     a.tier,
            total_hours:    a.hours,
            session_count:  a.sessions,
            bayesian_score: a.score,
            percentile_rank: a.pct,
            citation:       a.citation,
            is_official:    a.official,
        });
    }
});
insertAllAwards(awardsData);
console.log(`[Seed] Inserted ${awardsData.length} annual awards.`);

console.log('\n✅ [Seed] Database seeded successfully with synchronized year cohorts! Ready for demo.\n');
process.exit(0);
