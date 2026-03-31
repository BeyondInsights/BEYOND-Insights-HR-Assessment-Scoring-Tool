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

const STATUS_COLORS: Record<string, string> = {
  'currently': '#0D9488',    // teal-600
  'planning': '#2563EB',     // blue-600
  'assessing': '#D97706',    // amber-600
  'not able': '#64748B',     // slate-500
  'unsure': '#7C3AED',       // violet-600
};

function getStatusColor(status: string): string {
  const lower = status.toLowerCase();
  if (lower.startsWith('currently')) return STATUS_COLORS['currently'];
  if (lower.includes('active planning')) return STATUS_COLORS['planning'];
  if (lower.includes('assessing') || lower.includes('researching')) return STATUS_COLORS['assessing'];
  if (lower.includes('not able')) return STATUS_COLORS['not able'];
  if (lower.includes('unsure')) return STATUS_COLORS['unsure'];
  return STATUS_COLORS['not able'];
}

function shortStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower.startsWith('currently')) return 'Currently Offer';
  if (lower.includes('active planning')) return 'In Planning';
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
    setTimeout(() => setEditingElement(null), 200);
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
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
          Dimension {dimensionNumber} of 13
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {dimensionName}
        </h1>
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-slate-500">
            {totalCount} elements reviewed — select any to update your response
          </p>
          <button
            onClick={onSwitchToStepView}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Step-by-step view
          </button>
        </div>
      </div>

      {/* Element List */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        {elements.map(([name, status], idx) => {
          const color = getStatusColor(status);
          const isEditing = editingElement === name;
          const isLast = idx === elements.length - 1;

          return (
            <React.Fragment key={name}>
              {/* Row */}
              <div
                onClick={() => setEditingElement(isEditing ? null : name)}
                className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                  isEditing ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                } ${!isLast && !isEditing ? 'border-b border-slate-100' : ''}`}
              >
                {/* Status indicator — thin vertical bar */}
                <div
                  className="w-0.5 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />

                {/* Element name */}
                <span className="flex-1 text-sm text-slate-800 leading-snug">{name}</span>

                {/* Status text */}
                <span
                  className="text-xs font-medium flex-shrink-0"
                  style={{ color }}
                >
                  {shortStatus(status)}
                </span>

                {/* Chevron */}
                <svg
                  className={`w-3.5 h-3.5 text-slate-300 transition-transform flex-shrink-0 ${isEditing ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Inline edit */}
              {isEditing && (
                <div className="px-5 pb-4 pt-1 bg-slate-50 border-b border-slate-100">
                  <div className="space-y-0.5">
                    {statusOptions.map(option => {
                      const optionColor = getStatusColor(option);
                      const selected = status === option;
                      return (
                        <label
                          key={option}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            selected ? 'bg-white shadow-sm' : 'hover:bg-white/70'
                          }`}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: selected ? optionColor : '#CBD5E1' }}
                          >
                            {selected && (
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: optionColor }}
                              />
                            )}
                          </div>
                          <span className={`text-sm ${selected ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                            {option}
                          </span>
                          <input
                            type="radio"
                            name={`status-${name}`}
                            checked={selected}
                            onChange={() => handleStatusChange(name, option)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Follow-Up Details */}
      {followUps.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Follow-Up Details
          </h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white divide-y divide-slate-100">
            {followUps.map(([key, value]) => {
              const displayValue = Array.isArray(value)
                ? value.join(', ')
                : typeof value === 'object'
                  ? JSON.stringify(value)
                  : String(value);

              const label = key
                .replace(/^d\d+_?/, '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
                .trim() || key;

              return (
                <div key={key} className="px-5 py-3.5">
                  <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                  <div className="text-sm text-slate-800">{displayValue}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Back to Dashboard
        </button>
        <button
          onClick={handleSaveAndReturn}
          disabled={saving}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & Return to Dashboard'}
        </button>
      </div>
    </div>
  );
}
