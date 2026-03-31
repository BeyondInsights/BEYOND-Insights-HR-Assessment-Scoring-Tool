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
  'currently': '#0D9488',
  'planning': '#2563EB',
  'assessing': '#D97706',
  'not able': '#64748B',
  'unsure': '#7C3AED',
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
    <div className="max-w-3xl mx-auto">
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
      <div className="mb-6">
        <p className="text-sm text-slate-700">
          Here are the answers you provided to each element of this dimension.
          You can click on any element to update your answer.
        </p>
      </div>

      {/* Element List */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        {elements.map(([name, status], idx) => {
          const color = getStatusColor(status);
          const isEditing = editingElement === name;
          const isLast = idx === elements.length - 1;

          return (
            <React.Fragment key={name}>
              <div
                onClick={() => setEditingElement(isEditing ? null : name)}
                className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                  isEditing ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                } ${!isLast && !isEditing ? 'border-b border-slate-100' : ''}`}
              >
                <div
                  className="w-0.5 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-sm text-slate-800 leading-snug">{name}</span>
                <span
                  className="text-xs font-medium flex-shrink-0"
                  style={{ color }}
                >
                  {shortStatus(status)}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-300 transition-transform flex-shrink-0 ${isEditing ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

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

      {/* Action Buttons */}
      <div className="mt-8 space-y-3">
        {/* Continue to follow-up questions */}
        <button
          onClick={handleContinueToFollowUps}
          className="w-full flex items-center justify-between px-5 py-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
        >
          <div>
            <p className="text-sm font-medium text-slate-800">
              Continue to review other dimension questions
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and update your answers to follow-up questions for this dimension
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
