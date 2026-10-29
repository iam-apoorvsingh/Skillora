/**
 * pages/Auth/AuthPage.jsx — Login & Registration Page
 * ──────────────────────────────────────────────────────
 * Split-screen layout with brand panel (left) and auth form (right).
 * Handles both /auth/login and /auth/register via a `mode` prop.
 *
 * DOMAIN VALIDATION:
 *   The email field has an onChange handler that validates the domain
 *   IN REAL-TIME using the same regex as the backend. This gives the user
 *   immediate feedback BEFORE submission — better UX and reduces wasted
 *   API calls.
 *
 *   The frontend validation is a CONVENIENCE, not a security layer.
 *   The backend ALWAYS validates the domain independently.
 */

import { useState, useEffect }  from 'react';
import { useNavigate, NavLink }  from 'react-router-dom';
import { useAuth }               from '../../context/AuthContext';
import SkilloraLogo              from '../../components/Logo/SkilloraLogo';
import '../../styles/pages/auth.css';
import '../../styles/globals.css';

// Mirrors the backend regex exactly
const IIITNR_EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@iiitnr\.edu\.in$/;

const BRANCHES       = ['CSE', 'DSAI', 'ECE', 'IT', 'Other'];
const ACADEMIC_YEARS = [
  'B.Tech 1st Year', 'B.Tech 2nd Year', 'B.Tech 3rd Year', 'B.Tech 4th Year',
  'M.Tech 1st Year', 'M.Tech 2nd Year', 'Ph.D.'
];
const HOSTELS = ['Raman', 'Shabri', 'Bose', 'Bhabha', 'Ramanujan', 'Day Scholar', 'Other'];

export default function AuthPage({ mode = 'login' }) {
  const { login, register, isAuthenticated } = useAuth();
  const navigate                             = useNavigate();
  const isRegister                           = mode === 'register';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/discover', { replace: true });
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', roll_number: '',
    branch: 'CSE', academic_year: 'B.Tech 1st Year', batch: '', hostel: 'Day Scholar', bio: '',
  });
  const [error,       setError]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [domainStatus, setDomainStatus] = useState('idle'); // 'idle' | 'valid' | 'invalid'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };

      // Auto-detect batch, academic year & branch from 9-digit roll number (e.g. 261020416)
      if (name === 'roll_number') {
        const match = value.trim().match(/^(\d{2})(100|101|102)(\d{4})$/);
        if (match) {
          const [, yr, code] = match;
          const branchMap = { '100': 'CSE', '101': 'ECE', '102': 'DSAI' };
          const yearMap = {
            '26': { year: 'B.Tech 1st Year', batch: '2026' },
            '25': { year: 'B.Tech 2nd Year', batch: '2025' },
            '24': { year: 'B.Tech 3rd Year', batch: '2024' },
            '23': { year: 'B.Tech 4th Year', batch: '2023' },
          };
          if (yearMap[yr]) {
            next.batch = yearMap[yr].batch;
            next.academic_year = yearMap[yr].year;
          } else {
            next.batch = `20${yr}`;
          }
          if (branchMap[code]) next.branch = branchMap[code];
        }
      }

      return next;
    });

    // Real-time domain validation for email field
    if (name === 'email') {
      if (!value) { setDomainStatus('idle'); return; }
      setDomainStatus(IIITNR_EMAIL_REGEX.test(value.trim()) ? 'valid' : 'invalid');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister && domainStatus !== 'valid') {
      setError('Please use your @iiitnr.edu.in email address.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/discover');
    } catch (err) {
      const msg = err.response?.data?.message
               || err.response?.data?.errors?.[0]?.msg
               || 'An error occurred. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left Brand Panel ── */}
      <div className="auth-brand" aria-hidden="true">
        <div className="auth-brand__logo">
          <SkilloraLogo width={66} />
          <span className="auth-brand__logo-text">Skillora</span>
        </div>
        <h2 className="auth-brand__tagline">Grow Together,<br />Learn from Each Other</h2>
        <p className="auth-brand__sub">The peer skill-sharing platform built for IIIT Naya Raipur students.</p>
        <div className="auth-brand__features">
          {[
            { icon: '⇄', text: 'Barter skills — no credits needed' },
            { icon: '📍', text: 'Campus meetup locations built-in' },
            { icon: '🏆', text: 'Earn badges & institute recognition' },
            { icon: '🔒', text: 'Exclusive to @iiitnr.edu.in accounts' },
          ].map(({ icon, text }) => (
            <div key={text} className="auth-brand__feature">
              <span className="auth-brand__feature-icon">{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <main className="auth-form-panel">
        <div className="auth-form-box">
          <h1>{isRegister ? 'Create Your Account' : 'Welcome Back'}</h1>
          <p className="auth-sub">
            {isRegister
              ? 'Join Skillora and start sharing skills with fellow IIIT-NR students.'
              : 'Log in to your Skillora account to continue.'}
          </p>

          {/* Domain warning banner */}
          {domainStatus === 'invalid' && (
            <div className="auth-domain-warning" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
              <span>⚠</span>
              <span>Only <strong>@iiitnr.edu.in</strong> email addresses are accepted. External domains are not permitted.</span>
            </div>
          )}
          {domainStatus === 'valid' && (
            <div className="auth-domain-warning auth-domain-ok" role="status" style={{ marginBottom: 'var(--space-4)' }}>
              <span>✓</span>
              <span>IIIT-NR email verified</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="auth-domain-warning" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
              <span>✕</span> {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Registration-only fields */}
            {isRegister && (
              <div className="input-group">
                <label htmlFor="full_name">Full Name</label>
                <input id="full_name" name="full_name" type="text" className="form-input"
                  placeholder="Arjun Sharma" value={formData.full_name}
                  onChange={handleChange} required />
              </div>
            )}

            {/* Email */}
            <div className="input-group">
              <label htmlFor="email">Institutional Email</label>
              <input
                id="email" name="email" type="email" className={`form-input${domainStatus === 'invalid' ? ' error' : ''}`}
                placeholder="yourid@iiitnr.edu.in"
                value={formData.email} onChange={handleChange} required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="form-input"
                placeholder={isRegister ? 'Min 8 chars, 1 uppercase, 1 number' : '••••••••'}
                value={formData.password} onChange={handleChange} required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>

            {/* Registration fields continued */}
            {isRegister && (
              <>
                <div className="auth-form__row">
                  <div className="input-group">
                    <label htmlFor="roll_number">Roll Number</label>
                    <input id="roll_number" name="roll_number" type="text" className="form-input"
                      placeholder="261020416" value={formData.roll_number} onChange={handleChange} required />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '3px', display: 'block' }}>
                      Format: 9 digits (e.g. 261020416 · 100: CSE, 101: ECE, 102: DSAI)
                    </span>
                  </div>
                  <div className="input-group">
                    <label htmlFor="batch">Batch Year</label>
                    <input id="batch" name="batch" type="text" className="form-input"
                      placeholder="2021" value={formData.batch} onChange={handleChange} required />
                  </div>
                </div>

                <div className="auth-form__row">
                  <div className="input-group">
                    <label htmlFor="branch">Branch</label>
                    <select id="branch" name="branch" className="form-select" value={formData.branch} onChange={handleChange}>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="hostel">Hostel / Residence</label>
                    <select id="hostel" name="hostel" className="form-select" value={formData.hostel} onChange={handleChange}>
                      {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="academic_year">Academic Year</label>
                  <select id="academic_year" name="academic_year" className="form-select" value={formData.academic_year} onChange={handleChange}>
                    {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={isLoading || (isRegister && domainStatus !== 'valid')}
            >
              {isLoading
                ? (isRegister ? 'Creating Account…' : 'Logging In…')
                : (isRegister ? 'Create Account' : 'Log In')}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister
              ? <>Already have an account? <NavLink to="/auth/login">Log In</NavLink></>
              : <>Don't have an account? <NavLink to="/auth/register">Sign Up Free</NavLink></>}
          </p>
        </div>
      </main>
    </div>
  );
}
