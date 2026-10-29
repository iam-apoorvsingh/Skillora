# 🎓 Skillora — Campus Peer Skill-Barter Platform

[![Live Demo](https://img.shields.io/badge/Demo-logiclabs--skillora.vercel.app-00BFFF?style=for-the-badge&logo=vercel&logoColor=white)](https://logiclabs-skillora.vercel.app)
[![API Status](https://img.shields.io/badge/API-Live%20on%20Render-10b981?style=for-the-badge&logo=render&logoColor=white)](https://skillora-backend-gtoy.onrender.com/api/health)

> **Live Deployments:**  
> 🌐 **Frontend (Vercel):** [https://logiclabs-skillora.vercel.app](https://logiclabs-skillora.vercel.app)  
> ⚡ **Backend API (Render):** [https://skillora-backend-gtoy.onrender.com](https://skillora-backend-gtoy.onrender.com)  
>
> **A student-powered reciprocal knowledge network built exclusively for DSPM IIIT Naya Raipur.**  
> Trade skills, build peer mentorship, and earn institute recognition — 100% free with zero currency or credit transactions.

---

## 👥 The 5-Member Engineering Team (B.Tech 1st Year · DSAI · Batch 2026)

| Team Member | Roll Number | Engineering Role & Viva Specialization | Institutional Email |
| :--- | :---: | :--- | :--- |
| **Apoorv** (Lead) | **261020416** | **Full-Stack Integration, WebSockets (Socket.IO) & Network Architecture** | `apoorv26102@iiitnr.edu.in` |
| **Sufal Singh Thakur** | **261020489** | **Backend Architecture · Node.js Runtime & Express REST APIs** | `sufal@iiitnr.edu.in` |
| **Parth Sharma** | **261020470** | **Database Architecture · SQLite Persistence & Relational Schema** | `parth@iiitnr.edu.in` |
| **Ayanna Jain** | **261020450** | **Frontend UI/UX · Liquid Glass Design System & Theming Engine** | `ayanna@iiitnr.edu.in` |
| **Chesta Kamle** | **261020460** | **Frontend Engineering · React 18 Components & Client State** | `chesta@iiitnr.edu.in` |

---

## 🏛️ System Architecture (Decoupled 3-Tier Model)

Skillora is built on an enterprise-grade 3-Tier decoupled architecture:

```
┌────────────────────────────────────────────────────────┐
│               TIER 1: PRESENTATION LAYER                │
│    React 18 · Vite · Vanilla CSS Design System · SPA   │
│           Runs in student's browser (Port 5173)        │
└───────────────────────────┬────────────────────────────┘
                            │  Axios HTTP / JSON + Socket.IO
                            ▼
┌────────────────────────────────────────────────────────┐
│               TIER 2: APPLICATION LAYER                │
│    Node.js · Express.js REST API · MVC Pattern · JWT   │
│            CORS · Helmet · Morgan · Rate Limiter       │
│               Listens on server (Port 5000)            │
└───────────────────────────┬────────────────────────────┘
                            │  better-sqlite3 Prepared Statements
                            ▼
┌────────────────────────────────────────────────────────┐
│               TIER 3: DATA PERSISTENCE LAYER           │
│     SQLite (skillora.db) · WAL Mode · Foreign Keys     │
│        Normalized 3NF Schema · bcrypt Password Hash    │
└────────────────────────────────────────────────────────┘
```

---

## ✨ Key Platform Features

1. **⇄ Reciprocal Skill Barter Matcher**: Algorithmic 2-way matching that pairs students teaching what you want to learn with what you can teach.
2. **🎓 Senior Mentorship Network**: Connects 1st/2nd-year students with 3rd/4th-year seniors for project guidance, research, and coding prep.
3. **📍 Campus Meetup Hubs**: Tag physical sessions at Central Library, SAC, Canteen, Computer Centre, or meet online via Google Meet / Discord.
4. **🛡️ Cheat-Proof Peer Reputation**: Ratings cannot be gamed. Anti-collusion algorithms prevent artificial score inflation from repeated reviews.
5. **🌓 Dynamic Dark / Light Themes**: Pure Vanilla CSS Custom Properties toggle without UI library bloat.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
* **Node.js** (v18.0 or newer)
* **npm** (v9.0 or newer)

### 1. One-Click Automated Start (Windows)
Simply double-click:
* `START_SKILLORA.bat` — Automatically starts both backend & frontend servers.
* `OPEN_WEBSITE.bat` — Opens the application in your browser.
* `SHARE_TO_FRIENDS.bat` — Share with campus peers via local Wi-Fi or ngrok tunnel.

### 2. Manual Terminal Start
```bash
# 1. Install & start Backend
cd server
npm install
npm run dev

# 2. In another terminal, install & start Frontend
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Demo Test Accounts

All accounts share the standard password: **`Password@123`**

| Student Name | Email | Role |
| :--- | :--- | :--- |
| **Arjun Sharma** | `arjun.sharma@iiitnr.edu.in` | 4th Year CSE Mentor |
| **Priya Patel** | `priya.patel@iiitnr.edu.in` | 4th Year CSE |
| **Siddharth Rao** | `siddharth.rao@iiitnr.edu.in` | 4th Year DSAI |
| **Sneha Iyer** | `sneha.iyer@iiitnr.edu.in` | 3rd Year CSE |

---

## 📜 Academic Disclaimer
*Skillora is an independent academic project developed by 5 B.Tech students at Dr. SPM IIIT Naya Raipur for the academic session 2026. It is designed solely for campus peer-to-peer knowledge sharing and is not an official administrative service of DSPM IIIT Naya Raipur.*
