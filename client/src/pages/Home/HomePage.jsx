/**
 * pages/Home/HomePage.jsx — Landing Page (Midnight Glow Theme)
 * ─────────────────────────────────────────────────────────────
 * Features:
 *  - Midnight Glow Palette (#001F3F, #008C8C, #00BFFF)
 *  - Smooth ambient lighting with seamless bottom gradient fade (no cut)
 *  - Tactile fine-grain / stipple texture overlay
 *  - Floating glassmorphism stat bubbles with dedicated positioning
 *  - Stat counter animation (JS useEffect + requestAnimationFrame)
 *  - Shifting Midnight Glow gradient title text
 *  - Responsive features grid + how-it-works steps + CTA banner
 */

import { NavLink }  from 'react-router-dom';
import { useAuth }  from '../../context/AuthContext';
import '../../styles/pages/home.css';

/* ── Static data ─────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: '⇄', iconClass: 'feature-card__icon--cyan',
    title: 'Skill Barter Engine',
    desc: 'Automatically matches students with complementary skills. No credits, no money — pure knowledge exchange.',
  },
  {
    icon: '🎓', iconClass: 'feature-card__icon--teal',
    title: 'Senior Mentorship',
    desc: 'M.Tech and Ph.D. scholars mentor juniors in exchange for peer reputation and Hall of Fame recognition.',
  },
  {
    icon: '📍', iconClass: 'feature-card__icon--green',
    title: 'Campus Location Tagger',
    desc: 'Tag sessions at Central Library, New Amphi Theatre, Canteen, or hostel common room. Or meet online.',
  },
  {
    icon: '🛡️', iconClass: 'feature-card__icon--amber',
    title: 'Fair & Cheat-Proof Ratings',
    desc: 'Ratings cannot be gamed. One lucky 5-star review won\'t jump anyone to #1, and repeated fake reviews between friends are automatically discounted.',
  },
];

const HOW_STEPS = [
  { n: '1', title: 'List Your Skills',        desc: 'Add what you can teach and what you want to learn — Academic or Creative.' },
  { n: '2', title: 'Find Your Match',          desc: 'Skillora\'s engine finds students with complementary skill pairs automatically.' },
  { n: '3', title: 'Schedule a Session',       desc: 'Agree on a campus location or online link, confirm the time, and book it.' },
  { n: '4', title: 'Rate & Earn Recognition',  desc: 'Rate each other after the session. Accumulate hours and earn badges & institute awards.' },
];

/* ── Genuine Claim Bubble Component ─────────────────────────────────────── */
function ClaimBubble({ emoji, title, label, className = '' }) {
  return (
    <div className={`hero__stat-card ${className}`}>
      <span className="hero__stat-emoji" aria-hidden="true">{emoji}</span>
      <div className="hero__stat-num">{title}</div>
      <div className="hero__stat-label">{label}</div>
    </div>
  );
}

/* ── Page Component ──────────────────────────────────────────────────────── */
export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="page-layout">

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="hero" aria-labelledby="hero-title">

        {/* ── Clean Background Atmosphere ── */}
        <div className="hero__backdrop" aria-hidden="true">
          <div className="hero__texture-layer" />
        </div>

        {/* Smooth gradient fade to prevent any cut line into the next section */}
        <div className="hero__fade-bottom" aria-hidden="true" />

        {/* 4 Genuine Claim Bubbles framing the central hero description */}
        <div className="hero__bubbles" aria-label="Key Platform Highlights">
          <ClaimBubble
            emoji="✨"
            title="100% Free"
            label="Zero Fees · No Credits"
            className="hero__stat-card--free"
          />
          <ClaimBubble
            emoji="⇄"
            title="Skill Barter"
            label="Pure Knowledge Swap"
            className="hero__stat-card--barter"
          />
          <ClaimBubble
            emoji="🎓"
            title="Campus Only"
            label="Verified IIIT-NR Peers"
            className="hero__stat-card--campus"
          />
          <ClaimBubble
            emoji="👥"
            title="1-on-1"
            label="Library, Amphi or Canteen"
            className="hero__stat-card--mentorship"
          />
        </div>

        {/* Central content */}
        <div className="hero__content">
          <div className="hero__badge" role="note">
            🎓 By Students, For Students · IIIT Naya Raipur
          </div>

          <h1 className="hero__title" id="hero-title">
            Trade Skills.<br />
            <span className="hero__title-gradient">Build Knowledge.</span><br />
            Grow Together.
          </h1>

          <p className="hero__subtitle">
            Skillora connects IIIT-NR students through reciprocal learning —
            no money, no credits. Just students helping students master what matters.
          </p>

          <div className="hero__cta">
            {isAuthenticated ? (
              <>
                <NavLink to="/discover"    className="btn btn-primary  btn-lg">Discover Skills →</NavLink>
                <NavLink to="/leaderboard" className="btn btn-secondary btn-lg">Leaderboard</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/auth/register" className="btn btn-primary  btn-lg">Join Skillora Free →</NavLink>
                <NavLink to="/auth/login"    className="btn btn-secondary btn-lg">Log In</NavLink>
              </>
            )}
          </div>
        </div>

      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════ */}
      <section className="features" aria-labelledby="features-heading">
        <div className="features__heading">
          <h2 id="features-heading">Why <span>Skillora?</span></h2>
          <p>Built exclusively for IIIT-NR — every feature designed around campus life and real academic goals.</p>
        </div>
        <div className="features__grid">
          {FEATURES.map(({ icon, iconClass, title, desc }) => (
            <div key={title} className="feature-card glass-card">
              <div className={`feature-card__icon ${iconClass}`} aria-hidden="true">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section className="how-it-works" aria-labelledby="how-heading">
        <div className="how-it-works__inner">
          <div className="features__heading">
            <h2 id="how-heading">How It <span>Works</span></h2>
            <p>From skill listing to institute recognition — four simple steps.</p>
          </div>
          <div className="steps">
            {HOW_STEPS.map(({ n, title, desc }) => (
              <div key={n} className="step">
                <div className="step__circle" aria-hidden="true">{n}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BOTTOM CTA ════════════════════════════════════════════════════ */}
      {!isAuthenticated && (
        <section className="cta-banner">
          <h2>Ready to Start Learning?</h2>
          <p>
            Join your fellow IIIT-NR students already exchanging knowledge on Skillora.
          </p>
          <NavLink to="/auth/register" className="btn btn-primary btn-lg">
            Create Your Free Account →
          </NavLink>
        </section>
      )}

    </div>
  );
}
