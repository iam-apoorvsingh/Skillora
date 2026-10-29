/**
 * pages/Leaderboard/LeaderboardPage.jsx — Rankings & Hall of Fame
 * ────────────────────────────────────────────────────────────────
 * Shows:
 *  1. Top-3 podium cards
 *  2. Full CSS-Grid leaderboard table
 *  3. Hall of Fame section (annual awards)
 * Bayesian score displayed alongside raw average so the difference is visible.
 */

import { useState, useEffect, useCallback } from 'react';
import { leaderboardService }               from '../../services/services';
import { useAuth }                          from '../../context/AuthContext';
import '../../styles/pages/leaderboard.css';
import '../../styles/globals.css';

const BRANCHES   = ['All','CSE','DSAI','ECE'];
const YEARS      = ['All','B.Tech 1st Year','B.Tech 2nd Year','B.Tech 3rd Year','B.Tech 4th Year','M.Tech 1st Year','M.Tech 2nd Year','Ph.D.'];

function TierBadge({ tier }) {
  if (!tier) return null;
  const cls = tier === 'Campus Fellow' ? 'campus-fellow'
            : tier === 'Distinguished Mentor' ? 'distinguished-mentor'
            : 'rising-tutor';
  const icon = tier === 'Campus Fellow' ? '👑'
             : tier === 'Distinguished Mentor' ? '🏅'
             : '🌟';
  return (
    <span className={`tier-badge tier-badge--${cls}`} title={tier}>
      {icon} {tier}
    </span>
  );
}

function RankLabel({ rank }) {
  const cls = rank === 1 ? 'lb-rank lb-rank--gold'
            : rank === 2 ? 'lb-rank lb-rank--silver'
            : rank === 3 ? 'lb-rank lb-rank--bronze'
            : 'lb-rank';
  const icon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
  return <div className={cls}>{icon}</div>;
}

export default function LeaderboardPage() {
  const { user }                            = useAuth();
  const [leaderboard, setLeaderboard]       = useState([]);
  const [hof,         setHof]               = useState({});
  const [myRank,      setMyRank]            = useState(null);
  const [activeTab,   setActiveTab]         = useState('rankings');
  const [filters,     setFilters]           = useState({ branch: 'All', academic_year: 'All' });
  const [loading,     setLoading]           = useState(false);
  const [globalMean,  setGlobalMean]        = useState(0);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.branch        !== 'All') params.branch        = filters.branch;
      if (filters.academic_year !== 'All') params.academic_year = filters.academic_year;
      const [lbRes, myRes] = await Promise.all([
        leaderboardService.getLeaderboard(params),
        leaderboardService.getMyRank(),
      ]);
      setLeaderboard(lbRes.data.leaderboard);
      setGlobalMean(lbRes.data.global_mean);
      setMyRank(myRes.data.my_rank);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  const loadHof = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaderboardService.getHallOfFame();
      setHof(res.data.hall_of_fame);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'rankings') loadLeaderboard();
    if (activeTab === 'hof')      loadHof();
  }, [activeTab, loadLeaderboard, loadHof]);

  const top3 = leaderboard.slice(0, 3);
  const rest  = leaderboard.slice(3);

  return (
    <div className="page-content leaderboard-page">
      {/* Header */}
      <div className="leaderboard-header">
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>Campus Leaderboard</h1>
          <p>Rankings based on verified, cheat-proof peer mentorship ratings.</p>
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'right' }}>
          Global mean: <strong style={{ color: 'var(--color-primary-300)' }}>★ {globalMean}</strong>
          {myRank && (
            <div>Your rank: <strong style={{ color: 'var(--color-warning)' }}>#{myRank.rank}</strong> of {myRank.total_ranked}</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
        {[['rankings','🏆 Live Rankings'],['hof','🌟 Hall of Fame']].map(([tab, label]) => (
          <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab(tab)}>{label}</button>
        ))}
      </div>

      {/* ── Live Rankings ── */}
      {activeTab === 'rankings' && (
        <>
          {/* Filters */}
          <div className="leaderboard-filters" style={{ marginBottom: 'var(--space-6)' }}>
            <select className="form-select" value={filters.branch} onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))}>
              {BRANCHES.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
            </select>
            <select className="form-select" value={filters.academic_year} onChange={e => setFilters(f => ({ ...f, academic_year: e.target.value }))}>
              {YEARS.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={loadLeaderboard}>Refresh</button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: '52px', borderRadius: 'var(--radius-md)' }} />)}
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-text-tertiary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🏆</div>
              <h3>No ranked students yet</h3>
              <p>Complete mentorship sessions to appear on the leaderboard.</p>
            </div>
          ) : (
            <>
              {/* Podium (top 3) */}
              {top3.length > 0 && (
                <div className="podium" style={{ marginBottom: 'var(--space-8)' }}>
                  {top3.map((u, i) => (
                    <div key={u.user_id} className="podium-card glass-card">
                      <div className="podium-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                      <div className="podium-avatar" style={{ borderColor: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : '#b45309' }}>
                        {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="podium-name">{u.full_name}</div>
                      <div className="podium-score">★ {u.bayesian_score} Fair Score · {u.raw_avg} Raw</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{u.total_hours.toFixed(1)}h · {u.session_count} sessions</div>
                      {u.badge && <TierBadge tier={u.badge} />}
                    </div>
                  ))}
                </div>
              )}

              {/* Full Table */}
              <div className="lb-table">
                <div className="lb-table__header">
                  <div>#</div>
                  <div>Student</div>
                  <div>Branch</div>
                  <div>Year</div>
                  <div>Sessions</div>
                  <div>Hours</div>
                  <div>Score</div>
                  <div>Badge</div>
                </div>
                {rest.map(u => (
                  <div key={u.user_id} className={`lb-row${u.user_id === user?.id ? ' lb-row--mine' : ''}`}>
                    <RankLabel rank={u.rank} />
                    <div className="lb-user">
                      <div className="lb-user__avatar">{u.full_name?.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
                      <div>
                        <div className="lb-user__name">{u.full_name} {u.user_id === user?.id && <span style={{ color: 'var(--color-primary-300)', fontSize: 'var(--text-xs)' }}>(you)</span>}</div>
                        <div className="lb-user__roll">{u.roll_number}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{u.branch}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{u.academic_year}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{u.session_count}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{Number(u.total_hours).toFixed(1)}h</div>
                    <div>
                      <div className="lb-score">★ {u.bayesian_score}</div>
                      <div className="lb-score__raw">raw: {u.raw_avg}</div>
                    </div>
                    <TierBadge tier={u.badge} />
                  </div>
                ))}
              </div>

              {/* Explanation box */}
              <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                <strong style={{ color: 'var(--color-primary-300)' }}>How the Fair Score Works:</strong> Skillora weights reviews mathematically so a student with just 1 five-star review cannot outrank a mentor with 50 verified sessions. Mutual reviews between the same two students are also discounted over time to prevent cheating.
              </div>
            </>
          )}
        </>
      )}

      {/* ── Hall of Fame ── */}
      {activeTab === 'hof' && (
        <div className="hof-section">
          <div className="hof-section__header">
            <span style={{ fontSize: '2rem' }}>🏛️</span>
            <h2 className="hof-section__title">Hall of Fame</h2>
          </div>
          <p style={{ marginBottom: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
            Annual recognition for the most impactful peer mentors. These students were officially commended by the Dean of Student Affairs and cited at Institute Day.
          </p>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : Object.keys(hof).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-tertiary)' }}>No Hall of Fame records yet.</div>
          ) : (
            Object.entries(hof).sort(([a],[b]) => b.localeCompare(a)).map(([year, tiers]) => (
              <div key={year} className="hof-year-group">
                <div className="hof-year-label">Academic Year {year}</div>
                {Object.entries(tiers).filter(([, arr]) => arr.length > 0).map(([tier, awardees]) => (
                  <div key={tier} className="hof-tier-group">
                    <div className="hof-tier-label"><TierBadge tier={tier} /></div>
                    <div className="hof-cards">
                      {awardees.map(a => (
                        <div key={a.id} className="hof-card glass-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 'var(--text-sm)', flexShrink: 0 }}>
                              {a.full_name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                            </div>
                            <div>
                              <div className="hof-card__name">{a.full_name}</div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{a.roll_number} · {a.branch}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                            <span>⭐ {a.bayesian_score} Fair Score</span>
                            <span>⏱ {a.total_hours}h</span>
                            <span>✅ {a.session_count} sessions</span>
                          </div>
                          {a.citation && <p className="hof-card__citation">"{a.citation}"</p>}
                          {a.is_official === 1 && (
                            <div className="hof-card__official">🏛 Officially endorsed by Dean's office</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
