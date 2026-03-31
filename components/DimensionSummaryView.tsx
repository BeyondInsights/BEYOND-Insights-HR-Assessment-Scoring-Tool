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

// Status → badge color
function getStatusStyle(status: string): { bg: string; text: string; dot: string } {
  const lower = status.toLowerCase();
  if (lower.startsWith('currently'))
    return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' };
  if (lower.includes('active planning'))
    return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' };
  if (lower.includes('assessing') || lower.includes('researching'))
    return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' };
  if (lower.includes('not able'))
    return { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' };
  if (lower.includes('unsure'))
    return { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' };
  return { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' };
}

// Shorten status label for badge display
function shortStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower.startsWith('currently')) return 'Currently Offer';
  if (lower.includes('active planning')) return 'Planning';
  if (lower.includes('assessing') || lower.includes('researching')) return 'Assessing';
  if (lower.includes('not able')) return 'Not Offered';
  if (lower.includes('unsure')) return 'Unsure';
  return status;
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

  const elements = Object.entries(gridData);
  const totalCount = elements.length;

  const handleStatusChange = (elementName: string, newStatus: string) => {
    onGridChange(elementName, newStatus);
    setTimeout(() => setEditingElement(null), 250);
  };

  const handleSaveAndReturn = async () => {
    setSaving(true);
    await onSave();
    router.push('/dashboard');
  };

  // Follow-up questions
  const gridKey = `d${dimensionNumber}a`;
  const followUps = Object.entries(allAnswers).filter(
    ([k]) => k !== gridKey && !k.endsWith('_none') && allAnswers[k] !== null && allAnswers[k] !== undefined && allAnswers[k] !== ''
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-800">
            Dimension {dimensionNumber}: {dimensionName}
          </h1>
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            All {totalCount} elements answered
          </span>
        </div>
        <button
          onClick={onSwitchToStepView}
          className="text-sm text-blue-600 hover:text-blue-800 mt-1"
        >
          Switch to step-by-step view
        </button>
      </div>

      {/* Instruction */}
      <p className="text-sm text-slate-500 mb-4">
        Select any element below to update your response.
      </p>

      {/* Element List */}
      <div className="space-y-2">
        {elements.map(([name, status]) => {
          const style = getStatusStyle(status);
          const isEditing = editingElement === name;

          return (
            <div key={name}>
              {/* Row */}
              <div
                onClick={() => setEditingElement(isEditing ? null : name)}
                className={`flex items-center gap-3 px-4 py-3 bg-white border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:shadow-sm ${
                  isEditing ? 'border-blue-400 shadow-sm' : 'border-slate-200'
                }`}
              >
                {/* Element name */}
                <span className="flex-1 text-sm text-slate-700">{name}</span>

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full whitespace-nowrap ${style.bg} ${style.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {shortStatus(status)}
                </span>

                {/* Edit indicator */}
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isEditing ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Inline edit panel */}
              {isEditing && (
                <div className="ml-4 mr-4 mt-1 mb-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="space-y-1.5">
                    {statusOptions.map(option => (
                      <label
                        key={option}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                          status === option ? 'bg-white border border-blue-300 shadow-sm' : 'hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`status-${name}`}
                          checked={status === option}
                          onChange={() => handleStatusChange(name, option)}
                          className="accent-blue-600"
                        />
                        <span className="text-sm text-slate-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Follow-Up Details */}
      {followUps.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Follow-Up Details</h2>
          <div className="space-y-3">
            {followUps.map(([key, value]) => {
              const displayValue = Array.isArray(value)
                ? value.join(', ')
                : typeof value === 'object'
                  ? JSON.stringify(value)
                  : String(value);

              // Format key to readable label
              const label = key
                .replace(/^d\d+_?/, '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
                .trim() || key;

              return (
                <div key={key} className="px-4 py-3 bg-white border border-slate-200 rounded-lg">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</div>
                  <div className="text-sm text-slate-700">{displayValue}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
        >
          Back to Dashboard
        </button>
        <button
          onClick={handleSaveAndReturn}
          disabled={saving}
          className="px-6 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & Return to Dashboard'}
        </button>
      </div>
    </div>
  );
}
