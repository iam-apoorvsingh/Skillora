/**
 * pages/Discover/DiscoverPage.jsx — Skill Marketplace & Barter Match Finder
 * ───────────────────────────────────────────────────────────────────────────
 * Two tabs:
 *   1. "Browse Skills"  — filter by category, type (teaching/learning), branch, search
 *   2. "Barter Matches" — shows users with whom a full barter can be arranged
 */

import { useState, useEffect, useCallback } from 'react';
import { skillService, swapService }        from '../../services/services';
import SkillCard                            from '../../components/SkillCard/SkillCard';
import '../../styles/globals.css';

const CATEGORIES = ['All', 'Academic/Core', 'Creative/Campus Life'];
const TYPES      = ['All', 'teaching', 'learning'];
const BRANCHES   = ['All', 'CSE', 'DSAI', 'ECE', 'IT'];

function MatchCard({ match, onRequestSwap }) {
  const initials = match.match_user_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="glass-card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #008C8C, #00BFFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--text-base)', color: '#fff', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-base)' }}>{match.match_user_name}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            {match.match_roll_number} · {match.match_branch} · {match.match_year}
          </div>
        </div>
        <div style={{ padding: '2px 8px', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)', fontSize: 'var(--text-xs)', fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)', flexShrink: 0 }}>
          🔄 Barter Match
        </div>
      </div>

      {/* Skill exchange arrows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span style={{ color: 'var(--color-success)' }}>✦ You teach:</span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{match.i_teach_them}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span style={{ color: 'var(--color-primary-300)' }}>⟳ They teach:</span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{match.they_teach_me}</span>
        </div>
      </div>

      {match.match_bio && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-3)' }}>
          "{match.match_bio}"
        </p>
      )}

      <button className="btn btn-primary btn-sm" onClick={() => onRequestSwap(match)} style={{ alignSelf: 'flex-start' }}>
        ⇄ Propose Barter
      </button>
    </div>
  );
}

// ─── Swap Request Modal (lightweight inline form) ─────────────────────────────
function SwapRequestModal({ target, type, onClose, onSuccess }) {
  // Pre-fill skill name directly from the clicked card
  const initialResponderTeaches = type === 'barter' 
    ? (target?.they_teach || '') 
    : (target?.skill_name || target?.primary_skill || '');

  const initialRequesterTeaches = type === 'barter' 
    ? (target?.you_teach || '') 
    : '';

  const [form, setForm] = useState({
    requester_teaches: initialRequesterTeaches,
    responder_teaches: initialResponderTeaches,
    proposed_time:     '',
    location_type:     'Central Library',
    meet_link:         '',
    message:           '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const LOCATIONS = [
    'Central Library',
    'New Amphi Theatre',
    'Canteen',
    'SAC (Student Activity Centre)',
    'Computer Centre / Labs',
    'Raman Common Room',
    'Shabri Common Room',
    'Bose Common Room',
    'Bhabha Common Room',
    'Ramanujan Common Room',
    'Online'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await swapService.createSwap({
        responder_id:     type === 'barter' ? target.match_user_id : target.user_id || target.mentor_id,
        requester_teaches: form.requester_teaches,
        responder_teaches: form.responder_teaches,
        proposed_time:    form.proposed_time,
        location_type:    form.location_type,
        meet_link:        form.meet_link || undefined,
        message:          form.message,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="swap-modal-title">
        <div className="modal__header">
          <h2 className="modal__title" id="swap-modal-title">
            Propose Skill Swap {target?.full_name ? `with ${target.full_name}` : ''}
          </h2>
          {target?.skill_name && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', marginTop: '2px' }}>
              🎯 Requested Skill: <strong>{target.skill_name}</strong>
            </p>
          )}
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {error && <div className="auth-domain-warning" role="alert">✕ {error}</div>}
            <div className="input-group">
              <label>You will teach</label>
              <input className="form-input" value={form.requester_teaches}
                onChange={e => setForm(f => ({ ...f, requester_teaches: e.target.value }))}
                placeholder="e.g. Data Structures & Algorithms" required />
            </div>
            <div className="input-group">
              <label>They will teach you</label>
              <input className="form-input" value={form.responder_teaches}
                onChange={e => setForm(f => ({ ...f, responder_teaches: e.target.value }))}
                placeholder="e.g. ROS (Robot Operating System)" required />
            </div>
            <div className="input-group">
              <label>Proposed Time</label>
              <input className="form-input" type="datetime-local" value={form.proposed_time}
                onChange={e => setForm(f => ({ ...f, proposed_time: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label>Location</label>
              <select className="form-select" value={form.location_type}
                onChange={e => setForm(f => ({ ...f, location_type: e.target.value }))}>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {form.location_type === 'Online' && (
              <div className="input-group">
                <label>Google Meet Link (optional)</label>
                <input className="form-input" value={form.meet_link}
                  onChange={e => setForm(f => ({ ...f, meet_link: e.target.value }))}
                  placeholder="https://meet.google.com/..." />
              </div>
            )}
            <div className="input-group">
              <label>Message (optional)</label>
              <textarea className="form-input form-textarea" value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Introduce yourself and explain what you hope to learn..." rows={2} />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send Swap Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [activeTab,  setActiveTab]  = useState('browse');
  const [skills,     setSkills]     = useState([]);
  const [matches,    setMatches]    = useState({ barter_matches: [], mentorship_opportunities: [] });
  const [loading,    setLoading]    = useState(false);
  const [filters,    setFilters]    = useState({ category: 'All', type: 'All', branch: 'All', search: '' });
  const [swapTarget, setSwapTarget] = useState(null);
  const [swapType,   setSwapType]   = useState('barter');
  const [success,    setSuccess]    = useState('');

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category !== 'All') params.category = filters.category;
      if (filters.type      !== 'All') params.type     = filters.type;
      if (filters.branch    !== 'All') params.branch   = filters.branch;
      if (filters.search)               params.search  = filters.search;
      const res = await skillService.discover(params);
      setSkills(res.data.skills);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await skillService.getMatches();
      setMatches(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'browse')  loadSkills();
    if (activeTab === 'matches') loadMatches();
  }, [activeTab, loadSkills, loadMatches]);

  const handleFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  return (
    <div className="page-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      {/* Page header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>Discover Skills</h1>
        <p>Find skills to learn, or see who you can barter with directly.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
        {[['browse','🔍 Browse All Skills'], ['matches','🔄 Barter Matches'], ['mentors','🎓 Find a Mentor']].map(([tab, label]) => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab)}
          >{label}</button>
        ))}
      </div>

      {success && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }} role="status">
          ✓ {success}
        </div>
      )}

      {/* ── Browse Tab ── */}
      {activeTab === 'browse' && (
        <>
          {/* Filters bar */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-6)', alignItems: 'center' }}>
            <input
              className="form-input"
              style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}
              placeholder="🔍 Search by student name, roll number, or skill…"
              value={filters.search}
              onChange={e => handleFilter('search', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') loadSkills(); }}
              aria-label="Search skills or students"
            />
            {[['category', CATEGORIES], ['type', TYPES], ['branch', BRANCHES]].map(([key, opts]) => (
              <select key={key} className="form-select" style={{ minWidth: '130px' }}
                value={filters[key]} onChange={e => handleFilter(key, e.target.value)}
                aria-label={`Filter by ${key}`}>
                {opts.map(o => <option key={o} value={o}>{key === 'type' && o !== 'All' ? (o === 'teaching' ? 'Teaching' : 'Learning') : o}</option>)}
              </select>
            ))}
            <button className="btn btn-primary btn-sm" onClick={loadSkills}>Apply</button>
          </div>

          {loading ? (
            <div className="grid-3">{[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '260px', borderRadius: 'var(--radius-lg)' }} />
            ))}</div>
          ) : skills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-text-tertiary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔍</div>
              <h3>No skills found</h3>
              <p>Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="grid-3">
              {skills.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onSwapRequest={s => { setSwapTarget(s); setSwapType('skill'); }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Barter Matches Tab ── */}
      {activeTab === 'matches' && (
        <>
          <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'rgba(0,191,255,0.08)', border: '1px solid rgba(0,191,255,0.25)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-primary-300)' }}>
            💡 These students have skills you want AND want skills you have — a perfect barter opportunity!
          </div>
          {loading ? (
            <div className="grid-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }} />)}</div>
          ) : matches.barter_matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-text-tertiary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔄</div>
              <h3>No barter matches yet</h3>
              <p>Add more skills to your profile to discover complementary matches.</p>
            </div>
          ) : (
            <div className="grid-2">
              {matches.barter_matches.map(m => (
                <MatchCard key={m.match_user_id} match={m} onRequestSwap={t => { setSwapTarget(t); setSwapType('barter'); }} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Mentors Tab ── */}
      {activeTab === 'mentors' && (
        <>
          {loading ? (
            <div className="grid-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />)}</div>
          ) : matches.mentorship_opportunities?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-text-tertiary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎓</div>
              <h3>No mentors found for your skill wishlist</h3>
              <p>Add skills you want to learn in your profile to see matching mentors.</p>
            </div>
          ) : (
            <div className="grid-2">
              {matches.mentorship_opportunities?.map(m => (
                <div key={m.mentor_id} className="glass-card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div className="flex items-center gap-4">
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 'var(--text-sm)', flexShrink: 0 }}>
                      {m.mentor_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{m.mentor_name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{m.mentor_roll} · {m.mentor_year}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    Teaches: <strong style={{ color: 'var(--color-primary-300)' }}>{m.mentor_teaches}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                    <span>⭐ {Number(m.avg_rating).toFixed(1)} avg rating</span>
                    <span>✅ {m.session_count} sessions</span>
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}
                    onClick={() => { setSwapTarget(m); setSwapType('mentor'); }}>
                    Request Mentorship
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Swap Request Modal */}
      {swapTarget && (
        <SwapRequestModal
          target={swapTarget}
          type={swapType}
          onClose={() => setSwapTarget(null)}
          onSuccess={() => { setSuccess('Swap request sent successfully!'); setTimeout(() => setSuccess(''), 4000); }}
        />
      )}
    </div>
  );
}
