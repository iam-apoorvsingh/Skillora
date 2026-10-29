/**
 * pages/Profile/ProfilePage.jsx — User Profile with Skills & Ratings
 * ────────────────────────────────────────────────────────────────────
 * Shows: user card (avatar, bio, stats), skill management (add/delete),
 * and peer reviews with Bayesian score breakdown.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth }          from '../../context/AuthContext';
import { skillService, ratingService } from '../../services/services';
import SkillCard            from '../../components/SkillCard/SkillCard';
import '../../styles/globals.css';

const PROFICIENCIES = ['Beginner','Intermediate','Advanced','Expert'];
const CATEGORIES    = ['Academic/Core','Creative/Campus Life'];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [skills,    setSkills]    = useState([]);
  const [ratings,   setRatings]   = useState({ stats: null, ratings: [] });
  const [addForm,   setAddForm]   = useState({ skill_name:'', category:'Academic/Core', proficiency:'Intermediate', is_teaching: true, is_learning: false });
  const [showAdd,   setShowAdd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [skRes, rtRes] = await Promise.all([
        skillService.getMySkills(),
        ratingService.getUserRatings(user.id),
      ]);
      setSkills(skRes.data.skills);
      setRatings(rtRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!addForm.is_teaching && !addForm.is_learning) {
      setError('Select at least one: Teaching or Learning.');
      return;
    }
    setLoading(true); setError('');
    try {
      await skillService.addSkill(addForm);
      setSuccess('Skill added!');
      setShowAdd(false);
      setAddForm({ skill_name:'', category:'Academic/Core', proficiency:'Intermediate', is_teaching: true, is_learning: false });
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add skill.');
    } finally { setLoading(false); }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Remove this skill?')) return;
    try {
      await skillService.deleteSkill(id);
      setSkills(s => s.filter(sk => sk.id !== id));
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
  };

  const { stats } = ratings;
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';

  // Badge from stats
  const badgeFor = (hours, sessions) => {
    if (hours >= 30 && sessions >= 20) return { label: 'Distinguished Mentor 🏅', color: 'var(--color-primary-300)' };
    if (hours >= 10 && sessions >= 8)  return { label: 'Rising Tutor 🌟', color: 'var(--color-success)' };
    return null;
  };

  return (
    <div className="page-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      {/* Toast */}
      {success && <div style={{ padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }} role="status">✓ {success}</div>}
      {error   && <div style={{ padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)' }} role="alert">✕ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
        {/* ── Profile Card ── */}
        <div className="glass-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', textAlign: 'center' }}>
          {/* Avatar */}
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#008C8C,#00BFFF)', border: '3px solid var(--color-primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 900, color: '#fff' }}>
            {initials}
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>{user?.full_name}</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>{user?.roll_number}</p>
          </div>

          {/* Info chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center' }}>
            {[user?.branch, user?.academic_year, user?.hostel].filter(Boolean).map(v => (
              <span key={v} style={{ padding: '3px 10px', borderRadius: '999px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{v}</span>
            ))}
          </div>

          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', width: '100%', marginTop: 'var(--space-2)' }}>
              {[
                { label: 'Fair Rating Score', value: `★ ${stats.bayesian_score}` },
                { label: 'Raw Average',       value: `★ ${stats.raw_avg}` },
                { label: 'Peer Reviews',   value: stats.total_reviews },
                { label: 'Skills Listed',  value: skills.length },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-primary-300)' }}>{value}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-criteria */}
          {stats?.sub_criteria && (
            <div style={{ width: '100%' }}>
              {[['Punctuality','⏰',stats.sub_criteria.punctuality],['Clarity','💬',stats.sub_criteria.clarity],['Depth','📖',stats.sub_criteria.depth]].map(([label, icon, val]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-subtle)', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{icon} {label}</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>★ {val}</span>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ marginTop: 'var(--space-2)', width: '100%', color: 'var(--color-error)' }}>
            Log Out
          </button>
        </div>

        {/* ── Skills & Reviews ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {/* Skills section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)' }}>My Skills</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(s => !s)}>
                {showAdd ? '✕ Cancel' : '+ Add Skill'}
              </button>
            </div>

            {/* Add skill form */}
            {showAdd && (
              <form onSubmit={handleAddSkill} className="glass-card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="input-group" style={{ gridColumn: '1/-1' }}>
                    <label>Skill Name</label>
                    <input className="form-input" placeholder="e.g. Machine Learning" value={addForm.skill_name}
                      onChange={e => setAddForm(f => ({ ...f, skill_name: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label>Category</label>
                    <select className="form-select" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Proficiency</label>
                    <select className="form-select" value={addForm.proficiency} onChange={e => setAddForm(f => ({ ...f, proficiency: e.target.value }))}>
                      {PROFICIENCIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={addForm.is_teaching} onChange={e => setAddForm(f => ({ ...f, is_teaching: e.target.checked }))} />
                    I can teach this
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={addForm.is_learning} onChange={e => setAddForm(f => ({ ...f, is_learning: e.target.checked }))} />
                    I want to learn this
                  </label>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ alignSelf: 'flex-start' }}>
                  {loading ? 'Adding…' : 'Add Skill'}
                </button>
              </form>
            )}

            {skills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-tertiary)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📚</div>
                <p>No skills yet. Add your first skill to get started!</p>
              </div>
            ) : (
              <div className="grid-3">
                {skills.map(sk => (
                  <div key={sk.id} style={{ position: 'relative' }}>
                    <SkillCard skill={{ ...sk, is_teaching: sk.is_teaching, is_learning: sk.is_learning }} showUser={false} />
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)', padding: '2px 8px', fontSize: '10px' }}
                      onClick={() => handleDeleteSkill(sk.id)}
                      title="Remove skill"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Peer Reviews */}
          <section>
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Peer Reviews</h2>
            {ratings.ratings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-tertiary)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>⭐</div>
                <p>No reviews yet. Complete sessions to receive peer ratings.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {ratings.ratings.map(r => (
                  <div key={r.id} className="glass-card" style={{ padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.rater_name}</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>{'★'.repeat(Math.round(r.overall_stars))} {r.overall_stars}/5</span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-2)' }}>
                      <span>⏰ {r.punctuality}/5</span>
                      <span>💬 {r.clarity}/5</span>
                      <span>📖 {r.depth}/5</span>
                    </div>
                    {r.feedback_text && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>"{r.feedback_text}"</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
