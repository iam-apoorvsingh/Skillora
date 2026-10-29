/**
 * components/SkillCard/SkillCard.jsx
 * Displays a single skill with proficiency dots, teaching/learning flags,
 * user info, and a barter/request CTA button.
 */

import '../../styles/components/skillcard.css';
import '../../styles/globals.css';

// Proficiency level → number of filled dots (1–4)
const PROFICIENCY_MAP = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };

// Category → emoji icon
const CATEGORY_ICON = {
  'Academic/Core':       '📚',
  'Creative/Campus Life': '🎨',
};

/**
 * StarRating — small inline star display component
 * WHY extract? DRY principle. Same stars appear in cards and profiles.
 */
function StarRating({ rating }) {
  const filled = Math.round(rating);
  return (
    <span className="star-display" aria-label={`Rating: ${rating} out of 5`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star${i <= filled ? ' filled' : ''}`} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

export default function SkillCard({ skill, showUser = true, onSwapRequest }) {
  const dotCount = PROFICIENCY_MAP[skill.proficiency] || 1;

  // Avatar initials from full_name
  const initials = skill.full_name
    ? skill.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <article className="skill-card glass-card" aria-label={`Skill card: ${skill.skill_name}`}>

      {/* Category label */}
      <div className="skill-card__category">
        <span aria-hidden="true">{CATEGORY_ICON[skill.category] || '🔧'}</span>
        {skill.category}
      </div>

      {/* Skill name */}
      <h3 className="skill-card__name">{skill.skill_name}</h3>

      {/* Teaching / Learning flags */}
      <div className="skill-card__flags">
        {skill.is_teaching === 1 && (
          <span className="skill-card__flag skill-card__flag--teach" title="This person can teach this skill">
            ✦ Can Teach
          </span>
        )}
        {skill.is_learning === 1 && (
          <span className="skill-card__flag skill-card__flag--learn" title="This person wants to learn this skill">
            ⟳ Wants to Learn
          </span>
        )}
      </div>

      {/* Proficiency indicator */}
      <div className="skill-card__proficiency">
        <div className="skill-card__prof-dots" aria-label={`Proficiency: ${skill.proficiency}`}>
          {[1,2,3,4].map(i => (
            <span key={i} className={`skill-card__prof-dot${i <= dotCount ? ' active' : ''}`} />
          ))}
        </div>
        <span>{skill.proficiency}</span>
      </div>

      {/* User info footer */}
      {showUser && (
        <div className="skill-card__user">
          <div className="skill-card__avatar" aria-hidden="true">{initials}</div>
          <div className="skill-card__user-info">
            <div className="skill-card__user-name">{skill.full_name}</div>
            <div className="skill-card__user-meta">
              {skill.roll_number} · {skill.branch} · {skill.academic_year}
            </div>
          </div>
          {/* Star rating if available */}
          {skill.avg_rating > 0 && (
            <div className="skill-card__rating" title={`Average rating: ${skill.avg_rating}`}>
              ★ {Number(skill.avg_rating).toFixed(1)}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      {onSwapRequest && (
        <div className="skill-card__action">
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={() => onSwapRequest(skill)}
            aria-label={`Request skill swap with ${skill.full_name}`}
          >
            ⇄ Request Swap
          </button>
        </div>
      )}
    </article>
  );
}
