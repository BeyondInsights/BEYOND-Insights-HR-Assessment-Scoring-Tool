import React from "react";

export default function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress ?? 0)));
  return (
    <div className="w-full h-2 rounded bg-gray-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-2 rounded bg-blue-600 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
