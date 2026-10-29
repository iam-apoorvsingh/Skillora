/**
 * pages/SwapRequests/SwapRequestsPage.jsx — Swap Lifecycle Manager
 * ──────────────────────────────────────────────────────────────────
 * Kanban-style board showing swaps grouped by status.
 * A user can accept, decline, schedule, complete, or cancel each swap.
 * If a session's rating is unlocked, the RatingModal is presented.
 */

import { useState, useEffect, useCallback } from 'react';
import { swapService }  from '../../services/services';
import RatingModal      from '../../components/RatingModal/RatingModal';
import { useAuth }      from '../../context/AuthContext';
import '../../styles/globals.css';

const STATUS_COLUMNS = [
  { key: 'PENDING',   label: '🕐 Pending',   color: 'var(--color-warning)' },
  { key: 'ACCEPTED',  label: '✅ Accepted',   color: 'var(--color-success)' },
  { key: 'SCHEDULED', label: '📅 Scheduled',  color: 'var(--color-info)' },
  { key: 'COMPLETED', label: '🏆 Completed',  color: 'var(--color-primary-300)' },
];

// Helper: format ISO datetime string to readable form
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function SwapCard({ swap, currentUserId, onStatusChange, onOpenRating }) {
  const isRequester = swap.requester_id === currentUserId;
  const otherName   = isRequester ? swap.responder_name : swap.requester_name;
  const otherRoll   = isRequester ? swap.responder_roll  : swap.requester_roll;
  const [loading, setLoading] = useState(false);

  const action = async (newStatus) => {
    setLoading(true);
    await onStatusChange(swap.id, newStatus);
    setLoading(false);
  };

  return (
    <div className="glass-card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Other party */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#008C8C,#00BFFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, color: '#fff' }}>
            {otherName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{otherName}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{otherRoll}</div>
          </div>
        </div>
        <span className={`badge badge-${swap.status.toLowerCase()}`}>{swap.status}</span>
      </div>

      {/* Skill exchange */}
      <div style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div><span style={{ color: 'var(--color-success)' }}>You teach: </span><strong>{isRequester ? swap.requester_teaches : swap.responder_teaches}</strong></div>
        <div><span style={{ color: 'var(--color-primary-300)' }}>They teach: </span><strong>{isRequester ? swap.responder_teaches : swap.requester_teaches}</strong></div>
      </div>

      {/* Location & time */}
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
        📍 {swap.location_type || '—'} &nbsp;·&nbsp; 🕐 {formatDate(swap.proposed_time)}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
        {/* Responder can accept/decline PENDING */}
        {swap.status === 'PENDING' && !isRequester && (
          <>
            <button className="btn btn-primary btn-sm" disabled={loading} onClick={() => action('ACCEPTED')}>Accept</button>
            <button className="btn btn-danger btn-sm"  disabled={loading} onClick={() => action('DECLINED')}>Decline</button>
          </>
        )}
        {/* Requester can cancel PENDING */}
        {swap.status === 'PENDING' && isRequester && (
          <button className="btn btn-ghost btn-sm" disabled={loading} onClick={() => action('CANCELLED')}>Cancel Request</button>
        )}
        {/* Either can schedule ACCEPTED */}
        {swap.status === 'ACCEPTED' && (
          <button className="btn btn-primary btn-sm" disabled={loading} onClick={() => action('SCHEDULED')}>📅 Schedule Session</button>
        )}
        {/* Either can mark COMPLETED */}
        {swap.status === 'SCHEDULED' && (
          <button className="btn btn-primary btn-sm" disabled={loading} onClick={() => action('COMPLETED')}>✅ Mark Completed</button>
        )}
        {/* Show Rate button when rating is unlocked */}
        {swap.status === 'COMPLETED' && swap.rating_unlocked === 1 && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onOpenRating({
              sessionId: swap.session_id,
              rateeId:   isRequester ? swap.responder_id : swap.requester_id,
              rateeName: otherName,
            })}
          >⭐ Rate Session</button>
        )}
        {swap.status === 'COMPLETED' && swap.rating_unlocked === 0 && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
            Rating locked (min 20 min session required)
          </span>
        )}
      </div>

      {swap.message && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)' }}>
          "{swap.message}"
        </p>
      )}
    </div>
  );
}

export default function SwapRequestsPage() {
  const { user }                  = useAuth();
  const [swaps,   setSwaps]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [ratingModal, setRatingModal] = useState(null); // { sessionId, rateeId, rateeName }
  const [toast, setTost]          = useState('');

  const loadSwaps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await swapService.getMySwaps();
      setSwaps(res.data.swaps);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSwaps(); }, [loadSwaps]);

  const handleStatusChange = async (swapId, newStatus) => {
    try {
      await swapService.updateStatus(swapId, newStatus);
      setTost(`Swap status updated to ${newStatus}`);
      setTimeout(() => setTost(''), 3000);
      loadSwaps();
    } catch (err) {
      setTost(err.response?.data?.message || 'Failed to update status.');
      setTimeout(() => setTost(''), 4000);
    }
  };

  const grouped = STATUS_COLUMNS.reduce((acc, { key }) => {
    acc[key] = swaps.filter(s => s.status === key);
    return acc;
  }, {});

  return (
    <div className="page-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>My Swap Requests</h1>
        <p>Track all your skill exchange sessions — from request to completion.</p>
      </div>

      {toast && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-primary-300)' }} role="status">
          {toast}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-6)' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        /* Kanban Board */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>
          {STATUS_COLUMNS.map(({ key, label, color }) => (
            <div key={key}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: `2px solid ${color}` }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color }}>{label}</h3>
                <span style={{ background: `${color}22`, color, padding: '2px 8px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                  {grouped[key]?.length || 0}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {grouped[key]?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    No {key.toLowerCase()} swaps
                  </div>
                ) : (
                  grouped[key].map(swap => (
                    <SwapCard
                      key={swap.id}
                      swap={swap}
                      currentUserId={user?.id}
                      onStatusChange={handleStatusChange}
                      onOpenRating={setRatingModal}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <RatingModal
          sessionId={ratingModal.sessionId}
          rateeId={ratingModal.rateeId}
          rateeName={ratingModal.rateeName}
          onClose={() => setRatingModal(null)}
          onSuccess={() => { setTost('Rating submitted! Thank you for your feedback.'); loadSwaps(); }}
        />
      )}
    </div>
  );
}
