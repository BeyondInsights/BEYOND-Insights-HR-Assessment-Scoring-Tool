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

// Dimension definitions — the description shown during the intro step
const DIMENSION_DEFINITIONS: Record<number, string> = {
  1: 'Time off policies and schedule adaptations that enable employees to receive treatment without sacrificing job security or income.',
  2: 'Financial protections that prevent economic hardship during treatment, including comprehensive coverage and expense assistance.',
  3: 'Training and resources that equip managers to support employees managing cancer or other serious health conditions.',
  4: 'Specialized programs and partnerships that connect employees to cancer-specific guidance, navigation, and expert resources.',
  5: 'Physical and environmental modifications that help employees continue working comfortably during and after treatment.',
  6: 'Workplace norms, leadership behaviors, and peer dynamics that make employees feel safe disclosing a diagnosis and seeking support.',
  7: 'Protections and opportunities that ensure a cancer diagnosis does not derail an employee\'s professional growth or advancement.',
  8: 'Structured, supportive processes for helping employees maintain productivity during treatment and transition back to full capacity.',
  9: 'Visible leadership commitment, dedicated funding, and organizational infrastructure for cancer support programs.',
  10: 'Support for employees who are caregivers for family members managing cancer or other serious health conditions.',
  11: 'Proactive health programs, legal protections beyond minimums, and workplace safety measures.',
  12: 'Systematic tracking of program effectiveness, employee outcomes, and regular refinement of support offerings.',
  13: 'Proactive, sensitive, and accessible communication about available cancer support programs and resources.',
};

const STATUS_COLORS: Record<string, string> = {
  'in place': '#0D9488',
  'in development': '#2563EB',
  'under review': '#D97706',
  'open to exploring': '#8B5CF6',
  'not planned': '#64748B',
  'unsure': '#9CA3AF',
  // Legacy fallbacks
  'currently': '#0D9488',
  'planning': '#2563EB',
  'assessing': '#D97706',
  'not able': '#64748B',
};

function getStatusColor(status: string): string {
  const lower = status.toLowerCase();
  // New scale
  if (lower === 'in place') return STATUS_COLORS['in place'];
  if (lower === 'in development') return STATUS_COLORS['in development'];
  if (lower === 'under review') return STATUS_COLORS['under review'];
  if (lower === 'open to exploring') return STATUS_COLORS['open to exploring'];
  if (lower === 'not planned') return STATUS_COLORS['not planned'];
  if (lower.includes('unsure')) return STATUS_COLORS['unsure'];
  // Legacy scale
  if (lower.startsWith('currently')) return STATUS_COLORS['currently'];
  if (lower.includes('active planning')) return STATUS_COLORS['planning'];
  if (lower.includes('assessing') || lower.includes('researching')) return STATUS_COLORS['assessing'];
  if (lower.includes('not able')) return STATUS_COLORS['not able'];
  return STATUS_COLORS['not planned'];
}

function shortStatus(status: string): string {
  const lower = status.toLowerCase();
  // New scale — return as-is
  if (lower === 'in place') return 'In Place';
  if (lower === 'in development') return 'In Development';
  if (lower === 'under review') return 'Under Review';
  if (lower === 'open to exploring') return 'Open to Exploring';
  if (lower === 'not planned') return 'Not Planned';
  if (lower.includes('unsure')) return 'Unsure';
  // Legacy scale
  if (lower.startsWith('currently')) return 'In Place';
  if (lower.includes('active planning')) return 'In Development';
  if (lower.includes('assessing') || lower.includes('researching')) return 'Under Review';
  if (lower.includes('not able')) return 'Not Planned';
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
  const definition = DIMENSION_DEFINITIONS[dimensionNumber] || '';

  // Check if there are follow-up questions
  const gridKey = `d${dimensionNumber}a`;
  const followUpKeys = Object.keys(allAnswers).filter(
    k => k !== gridKey && !k.endsWith('_none')
  );
  const hasFollowUps = followUpKeys.some(k => {
    const v = allAnswers[k];
    return v !== null && v !== undefined && v !== '';
  });

  const handleStatusChange = (elementName: string, newStatus: string) => {
    onGridChange(elementName, newStatus);
    setTimeout(() => setEditingElement(null), 200);
  };

  const handleSaveAndReturn = async () => {
    setSaving(true);
    await onSave();
    router.push('/dashboard');
  };

  const handleContinueToFollowUps = () => {
    // Switch to step-by-step view — the dimension page will navigate to the appropriate follow-up step
    onSwitchToStepView();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Dimension Header + Definition */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
          Dimension {dimensionNumber} of 13
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          {dimensionName}
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          {definition}
        </p>
      </div>

      {/* Instructions */}
      <div className="mb-5">
        <p className="text-sm text-slate-700">
          Here are the answers you provided to each element of this dimension.
          You can click on any element to update your answer.
        </p>
      </div>

      {/* Status Summary Bar */}
      {(() => {
        const counts: Record<string, { count: number; color: string; label: string }> = {};
        elements.forEach(([, s]) => {
          const label = shortStatus(s);
          if (!counts[label]) counts[label] = { count: 0, color: getStatusColor(s), label };
          counts[label].count++;
        });
        const groups = Object.values(counts).filter(g => g.count > 0);
        return (
          <div className="mb-5 flex items-center gap-4 text-xs text-slate-600">
            {groups.map(g => (
              <span key={g.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: g.color }} />
                <span>{g.label}: <strong className="text-slate-800">{g.count}</strong></span>
              </span>
            ))}
          </div>
        );
      })()}

      {/* Element Grid — 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {elements.map(([name, status]) => {
          const color = getStatusColor(status);
          const isEditing = editingElement === name;

          return (
            <React.Fragment key={name}>
              <div
                onClick={() => setEditingElement(isEditing ? null : name)}
                className={`flex items-start gap-3 px-4 py-3 bg-white border rounded-lg cursor-pointer transition-colors min-h-[68px] ${
                  isEditing ? 'border-slate-300 bg-slate-50 md:col-span-2' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
                style={isEditing ? { gridColumn: '1 / -1' } : undefined}
              >
                <div
                  className="w-0.5 min-h-[32px] self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-800 leading-snug">{name}</span>
                </div>
                <span
                  className="text-xs font-medium flex-shrink-0 mt-0.5"
                  style={{ color }}
                >
                  {shortStatus(status)}
                </span>
              </div>

              {isEditing && (
                <div
                  className="px-4 pb-3 -mt-2 mb-1 bg-slate-50 border border-t-0 border-slate-300 rounded-b-lg"
                  style={{ gridColumn: '1 / -1' }}
                >
                  <div className="space-y-0.5 pt-2">
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

      {/* Action Buttons */}
      <div className="mt-8 space-y-3">
        {/* Continue to follow-up questions */}
        <button
          onClick={handleContinueToFollowUps}
          className="w-full flex items-center justify-between px-5 py-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
        >
          <div>
            <p className="text-sm font-medium text-slate-800">
              Review follow-up questions
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              e.g., paid leave duration, geographic variations, additional details
            </p>
          </div>
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Save and return to dashboard */}
        <button
          onClick={handleSaveAndReturn}
          disabled={saving}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 text-left"
        >
          <div>
            <p className="text-sm font-medium">
              {saving ? 'Saving...' : 'Save & return to dashboard'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Your element answers above have been saved. Skip follow-up questions for now.
            </p>
          </div>
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      {/* View toggle */}
      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToStepView}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Switch to step-by-step view
        </button>
      </div>
    </div>
  );
}
