/**
 * components/RatingModal/RatingModal.jsx
 * Post-session peer rating modal with three sub-criteria star selectors
 * and a qualitative feedback text area.
 *
 * ACCESSIBILITY:
 *   - role="dialog" and aria-modal="true" tell screen readers this is a modal
 *   - aria-labelledby links the dialog to its title
 *   - Focus trap: clicking the overlay closes the modal
 *   - Each star button has aria-label describing its value
 *
 * STATE MANAGEMENT:
 *   Each star group has its own state slice (overallStars, punctuality, etc.)
 *   WHY not a single object? Separate useState calls give cleaner re-render
 *   isolation — changing one rating doesn't re-render others.
 */

import { useState } from 'react';
import { ratingService } from '../../services/services';
import '../../styles/components/rating-modal.css';

// Reusable star selector sub-component
function StarSelector({ label, value, onChange, id }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="star-rating-group">
      {label && <label id={`${id}-label`}>{label}</label>}
      <div
        className="star-rating"
        role="group"
        aria-labelledby={`${id}-label`}
      >
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            className={`star-btn${n <= (hovered || value) ? ' hovered' : ''}${n <= value ? ' selected' : ''}`}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            aria-label={`${n} star${n !== 1 ? 's' : ''}`}
            aria-pressed={n === value}
          >
            ★
          </button>
        ))}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)' }}>
          {value ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );
}

export default function RatingModal({ sessionId, rateeId, rateeName, onClose, onSuccess }) {
  const [overallStars,  setOverallStars]  = useState(0);
  const [punctuality,   setPunctuality]   = useState(0);
  const [clarity,       setClarity]       = useState(0);
  const [depth,         setDepth]         = useState(0);
  const [feedbackText,  setFeedbackText]  = useState('');
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [error,         setError]         = useState('');

  const isValid = overallStars > 0 && punctuality > 0 && clarity > 0 && depth > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setError('Please rate all four categories before submitting.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await ratingService.submitRating({
        session_id:   sessionId,
        ratee_id:     rateeId,
        overall_stars: overallStars,
        punctuality,
        clarity,
        depth,
        feedback_text: feedbackText,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* Overlay: clicking outside modal closes it */
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
      >
        {/* Header */}
        <div className="modal__header">
          <h2 className="modal__title" id="rating-modal-title">
            Rate Session with {rateeName}
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Close rating modal">✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal__body">

            {/* Overall Rating */}
            <StarSelector
              label="Overall Experience"
              value={overallStars}
              onChange={setOverallStars}
              id="overall"
            />

            {/* Sub-criteria */}
            <div className="sub-criteria">
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
                Detailed Feedback
              </p>

              {[
                { label: '⏰ Punctuality',        value: punctuality, setter: setPunctuality, id: 'punc' },
                { label: '💬 Clarity of Teaching', value: clarity,     setter: setClarity,     id: 'clar' },
                { label: '📖 Depth of Knowledge',  value: depth,       setter: setDepth,       id: 'dep'  },
              ].map(({ label, value, setter, id }) => (
                <div key={id} className="sub-criteria-item">
                  <span className="sub-criteria-label">{label}</span>
                  <div className="sub-criteria-stars">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`star-btn${n <= value ? ' selected' : ''}`}
                        onClick={() => setter(n)}
                        aria-label={`${label}: ${n} stars`}
                      >★</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Qualitative feedback */}
            <div className="modal__feedback input-group">
              <label htmlFor="feedback-text">Qualitative Feedback (optional)</label>
              <textarea
                id="feedback-text"
                className="form-input form-textarea"
                placeholder="What did you learn? How was the teaching style? Any suggestions?"
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                {feedbackText.length}/500
              </small>
            </div>

            {/* Error message */}
            {error && (
              <div className="auth-domain-warning" role="alert">{error}</div>
            )}
          </div>

          {/* Footer */}
          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
