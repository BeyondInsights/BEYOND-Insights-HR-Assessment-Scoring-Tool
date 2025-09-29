import React from "react";

export default function ProgressCircle({ completion }: { completion: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(completion ?? 0)));
  const radius = 22;
  const stroke = 6;
  const c = 2 * Math.PI * radius;
  const offset = c - (pct / 100) * c;

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label={`Progress ${pct}%`}>
      <circle cx="28" cy="28" r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
      <circle
        cx="28" cy="28" r={radius}
        stroke="#2563eb" strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 28 28)"
      />
      <text x="28" y="31" textAnchor="middle" fontSize="12" fill="#111827">{pct}%</text>
    </svg>
  );
}
