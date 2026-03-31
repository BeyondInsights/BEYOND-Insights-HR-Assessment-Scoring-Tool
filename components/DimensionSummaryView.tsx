'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DimensionSummaryViewProps {
  dimensionNumber: number;
  dimensionName: string;
  gridData: Record<string, string>;
  allAnswers: Record<string, any>;
  statusOptions: string[];
  onGridChange: (elementName: string, newStatus: string) => void;
  onSwitchToStepView: () => void;
  onSave: () => Promise<boolean>;
}

// Map status keywords to colors
function getStatusColor(status: string): string {
  const lower = status.toLowerCase();
  if (lower.startsWith('currently')) return '#10B981';
  if (lower.includes('active planning')) return '#3B82F6';
  if (lower.includes('assessing') || lower.includes('researching')) return '#F59E0B';
  if (lower.includes('not able')) return '#94A3B8';
  if (lower.includes('unsure')) return '#8B5CF6';
  return '#94A3B8';
}

function getStatusBgClass(status: string): string {
  const lower = status.toLowerCase();
  if (lower.startsWith('currently')) return 'bg-emerald-50 border-emerald-200';
  if (lower.includes('active planning')) return 'bg-blue-50 border-blue-200';
  if (lower.includes('assessing') || lower.includes('researching')) return 'bg-amber-50 border-amber-200';
  if (lower.includes('not able')) return 'bg-slate-50 border-slate-200';
  if (lower.includes('unsure')) return 'bg-purple-50 border-purple-200';
  return 'bg-slate-50 border-slate-200';
}

// Auto-format a key like "d1b" or "d1_1a" into a readable label
function formatFieldKey(key: string): string {
  return key
    .replace(/^d\d+/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^[a-z]/, (c) => c.toUpperCase())
    .trim() || key;
}

export default function DimensionSummaryView({
  dimensionNumber,
  dimensionName,
  gridData,
  allAnswers,
  statusOptions,
  onGridChange,
  onSwitchToStepView,
  onSave,
}: DimensionSummaryViewProps) {
  const router = useRouter();
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalElements = Object.keys(gridData).length;

  // Group elements by status
  const grouped: Record<string, string[]> = {};
  for (const [element, status] of Object.entries(gridData)) {
    if (!grouped[status]) grouped[status] = [];
    grouped[status].push(element);
  }

  // Order groups by statusOptions order
  const orderedStatuses = statusOptions.filter((s) => grouped[s] && grouped[s].length > 0);

  // Status bar segments
  const segments = orderedStatuses.map((status) => ({
    status,
    count: grouped[status].length,
    color: getStatusColor(status),
  }));

  const handleStatusChange = (element: string, newStatus: string) => {
    onGridChange(element, newStatus);
    setTimeout(() => setEditingElement(null), 300);
  };

  const handleSaveAndReturn = async () => {
    setSaving(true);
    try {
      await onSave();
      router.push('/dashboard');
    } catch {
      setSaving(false);
    }
  };

  // Follow-up entries
  const gridKey = `d${dimensionNumber}a`;
  const followUpEntries = Object.entries(allAnswers).filter(
    ([k]) => k !== gridKey && !k.endsWith('_none')
  );

  return (
    <div>
      {/* Dimension Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold text-slate-800">
            Dimension {dimensionNumber}: {dimensionName}
          </h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            All {totalElements} elements answered
          </span>
        </div>
        <button
          onClick={onSwitchToStepView}
          className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
        >
          Switch to step-by-step view
        </button>
      </div>

      {/* Status Summary Bar */}
      {segments.length > 0 && (
        <div className="mb-8">
          <div className="flex rounded-lg overflow-hidden h-8">
            {segments.map((seg) => {
              const pct = (seg.count / totalElements) * 100;
              const showInline = pct >= 12;
              return (
                <div
                  key={seg.status}
                  className="flex items-center justify-center text-xs font-semibold text-white transition-all"
                  style={{
                    backgroundColor: seg.color,
                    width: `${pct}%`,
                    minWidth: '2px',
                  }}
                  title={`${seg.status}: ${seg.count}`}
                >
                  {showInline ? seg.count : ''}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {segments.map((seg) => (
              <span key={seg.status} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: seg.color }}
                />
                {seg.status} ({seg.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Element Cards Grouped by Status */}
      {orderedStatuses.map((status) => (
        <div key={status} className="mb-6">
          <div className="border-l-4 pl-4 mb-2" style={{ borderColor: getStatusColor(status) }}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              {status} &middot; {grouped[status].length} element{grouped[status].length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-2 mb-6">
            {grouped[status].map((element) =>
              editingElement === element ? (
                <div
                  key={element}
                  className="bg-white border-2 border-blue-300 rounded-lg px-4 py-4 shadow-md"
                >
                  <p className="text-sm font-medium text-slate-800 mb-3">{element}</p>
                  <div className="space-y-2">
                    {statusOptions.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name={`edit-${element}`}
                          checked={gridData[element] === option}
                          onChange={() => handleStatusChange(element, option)}
                          className="accent-blue-600"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => setEditingElement(null)}
                    className="mt-2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div
                  key={element}
                  className={`border rounded-lg px-4 py-3 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all ${getStatusBgClass(status)}`}
                  onClick={() => setEditingElement(element)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{element}</span>
                    <svg
                      className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ))}

      {/* Follow-Up Questions Section */}
      {followUpEntries.length > 0 && (
        <div className="mt-8">
          <div className="border-t border-slate-200 pt-6 mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Follow-Up Details</h3>
          </div>
          <div className="space-y-3">
            {followUpEntries.map(([key, value]) => {
              if (value === null || value === undefined || value === '') return null;
              const displayValue = Array.isArray(value)
                ? value.join(', ')
                : typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : String(value);
              return (
                <div
                  key={key}
                  className="bg-white border border-slate-200 rounded-lg px-4 py-3"
                >
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    {formatFieldKey(key)}
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{displayValue}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Back to Dashboard
        </button>
        <button
          onClick={handleSaveAndReturn}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save & Return to Dashboard'}
        </button>
      </div>
    </div>
  );
}
