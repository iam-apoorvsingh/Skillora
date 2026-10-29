import React from 'react';

/**
 * SkilloraLogo — Official Geometric Intersecting Circles Logo
 * Represents reciprocal skill exchange: Blue (Knowledge) + Teal (Skill Growth) + White Center (Student Synergy)
 */
export default function SkilloraLogo({ width = 40, height, className = '', style = {} }) {
  // Natural aspect ratio is 44:28
  const calculatedHeight = height || Math.round((width * 28) / 44);

  return (
    <svg
      width={width}
      height={calculatedHeight}
      viewBox="0 0 44 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Left Circle: Electric Blue */}
      <circle cx="14" cy="14" r="14" fill="#2962FF" />
      {/* Right Circle: Mint Teal */}
      <circle cx="30" cy="14" r="14" fill="#00C49F" />
      {/* Center Intersection Circle: Pure White */}
      <circle cx="22" cy="14" r="6" fill="#FFFFFF" />
    </svg>
  );
}
