/**
 * src/components/Footer/Footer.jsx — Campus Project Footer
 * ─────────────────────────────────────────────────────────
 * Features:
 *  - Skillora brand & student mission
 *  - 5-Member Team project credits (Apoorv as Lead + 4 customizable teammate slots)
 *  - Quick platform navigation links
 *  - Campus meetup locations (Library, SAC, Computer Centre, Online)
 *  - Contact information (apoorv26102@iiitnr.edu.in & DSPM IIIT-NR location)
 *  - Honest disclaimer stating this is an independent student project
 *  - Dual theme support (Liquid Glass & Midnight Glow)
 */

import { NavLink } from 'react-router-dom';
import SkilloraLogo from '../Logo/SkilloraLogo';
import '../../styles/components/footer.css';

const TEAM_MEMBERS = [
  {
    name: 'Apoorv',
    role: 'Team Lead · Full-Stack Integration, WebSockets & Network Architecture',
    email: 'apoorv26102@iiitnr.edu.in',
    initials: 'AP',
    isLead: true,
  },
  {
    name: 'Ayanna Jain',
    role: 'Frontend UI/UX · CSS Design System & Theming Engine',
    initials: 'AJ',
  },
  {
    name: 'Chesta Kamle',
    role: 'Frontend Engineering · React 18, Vite SPA & Client State',
    initials: 'CK',
  },
  {
    name: 'Sufal Singh Thakur',
    role: 'Backend Architecture · Node.js Runtime & Express REST APIs',
    initials: 'ST',
  },
  {
    name: 'Parth Sharma',
    role: 'Database Architecture · SQLite Persistence, Security & Barter Algorithms',
    initials: 'PS',
  },
];

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__container">
        
        {/* ══ 1. TEAM CREDITS SHOWCASE (5-Member Project) ═════════════════ */}
        <div className="footer__team-section glass-card">
          <div className="footer__team-header">
            <div className="footer__team-badge">
              <span>👥</span>
              <span>B.Tech 1st Year (DSAI) · DSPM IIIT Naya Raipur</span>
            </div>
            <h3 className="footer__team-title">
              Crafted by the <span>Skillora Team</span> (5 Students)
            </h3>
            <p className="footer__team-desc">
              Developed as an academic collaborative project to make peer knowledge exchange free, transparent, and accessible across the campus.
            </p>
          </div>

          <div className="footer__team-grid">
            {TEAM_MEMBERS.map((member, idx) => (
              <div
                key={idx}
                className={`footer__member-card ${member.isLead ? 'footer__member-card--lead' : ''}`}
              >
                <div className="footer__member-avatar" aria-hidden="true">
                  {member.initials}
                </div>
                <div className="footer__member-info">
                  <div className="footer__member-name">
                    {member.name}
                    {member.isLead && <span className="footer__lead-tag">Lead</span>}
                  </div>
                  <div className="footer__member-role">{member.role}</div>
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="footer__member-email"
                      title="Send email to team leader"
                    >
                      ✉️ {member.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ 2. THREE-COLUMN DIRECTORY ═══════════════════════════════════ */}
        <div className="footer__directory">
          
          {/* Brand & Purpose */}
          <div className="footer__col footer__col--brand">
            <div className="footer__brand-title">
              <SkilloraLogo width={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
              <span>Skillora</span>
            </div>
            <p className="footer__col-text">
              A student-powered reciprocal learning network where students teach skills they know and learn skills they need — completely free.
            </p>
            <div className="footer__pill-tags">
              <span className="footer__pill">✨ 100% Free</span>
              <span className="footer__pill">⇄ Pure Skill Barter</span>
              <span className="footer__pill">🎓 Campus Peers</span>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div className="footer__col">
            <h4 className="footer__col-heading">Platform</h4>
            <ul className="footer__links">
              <li><NavLink to="/discover">Discover Skills</NavLink></li>
              <li><NavLink to="/discover">Skill Barter Matcher</NavLink></li>
              <li><NavLink to="/leaderboard">Leaderboard & Podium</NavLink></li>
              <li><NavLink to="/swaps">Session Requests</NavLink></li>
              <li><NavLink to="/auth/register">Join Skillora Free</NavLink></li>
            </ul>
          </div>

          {/* Campus Meetup Spots */}
          <div className="footer__col">
            <h4 className="footer__col-heading">Campus Meetup Hubs</h4>
            <ul className="footer__links footer__links--spots">
              <li><span>📚</span> Central Library</li>
              <li><span>🎭</span> New Amphi Theatre & SAC</li>
              <li><span>☕</span> Canteen</li>
              <li><span>🏢</span> Raman, Shabri, Bose, Bhabha & Ramanujan Common Rooms</li>
              <li><span>🌐</span> Online via Google Meet / Discord</li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="footer__col">
            <h4 className="footer__col-heading">Contact & Inquiries</h4>
            <div className="footer__contact-info">
              <p>
                <strong>Team Lead:</strong> Apoorv<br />
                <a
                  href="mailto:apoorv26102@iiitnr.edu.in?subject=Skillora%20Project%20Query"
                  className="footer__contact-link"
                >
                  ✉️ apoorv26102@iiitnr.edu.in
                </a>
              </p>
              <p className="footer__location">
                <strong>Campus:</strong><br />
                Dr. SPM IIIT Naya Raipur<br />
                Plot No. 7, Sector 24, Atal Nagar<br />
                Chhattisgarh — 493661
              </p>
            </div>
          </div>

        </div>

        {/* ══ 3. HONEST DISCLAIMER & COPYRIGHT ═════════════════════════════ */}
        <div className="footer__bottom">
          <div className="footer__disclaimer">
            <span className="footer__disclaimer-icon" aria-hidden="true">ℹ️</span>
            <span>
              <strong>Academic Project Disclaimer:</strong> Skillora is an independent student academic project developed by a team of 5 B.Tech students. It is designed solely for campus peer-to-peer knowledge sharing and is <em>not an official administrative service</em> of DSPM IIIT Naya Raipur.
            </span>
          </div>
          <div className="footer__copyright">
            © {new Date().getFullYear()} Skillora Team · Built with 💙 by Apoorv, Parth, Ayanna, Chesta &amp; Sufal (IIIT-NR)
          </div>
        </div>

      </div>
    </footer>
  );
}
