/**
 * AGGREGATE SCORING COMPARISON REPORT - ENHANCED VERSION
 * 
 * Visual Enhancements Applied:
 * 1. Wider dimension name column (340px vs 300px)
 * 2. Enhanced alternating row stripes
 * 3. Gradient composite rows
 * 4. Larger performance tier badges
 * 5. Better "Insufficient Data" warning highlighting
 * 6. Hover effects and scale transitions on score cells
 * 7. Collapsible legend panel
 * 8. Column group headers (Averages vs Companies)
 * 9. Mini progress bars in AVG cells
 * 10. Better FP vs Standard badges
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

// ============================================
// DEFAULT DIMENSION WEIGHTS (Total = 100%)
// ============================================
const DEFAULT_WEIGHTS: Record<number, number> = {
  4: 14,   // D4: Navigation
  8: 13,   // D8: Return-to-Work
  3: 12,   // D3: Manager Preparedness
  2: 11,   // D2: Insurance & Financial
  13: 10,  // D13: Communication
  6: 8,    // D6: Culture
  1: 7,    // D1: Medical Leave
  5: 7,    // D5: Accommodations
  7: 4,    // D7: Career Continuity
  9: 4,    // D9: Executive Commitment
  10: 4,   // D10: Caregiver & Family
  11: 3,   // D11: Prevention & Wellness
  12: 3,   // D12: Continuous Improvement
};

const DIMENSION_NAMES: Record<number, string> = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations & Modifications',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness',
};

// ============================================
// DIMENSION ITEMS - All items for each dimension
// ============================================
const DIMENSION_ITEMS: Record<number, string[]> = {
  1: [
    'Paid medical leave beyond local/legal requirements',
    'Intermittent leave beyond local/legal requirements',
    'Flexible work hours during treatment',
    'Remote work options for on-site employees',
    'Reduced schedule/part-time with full benefits',
    'Job protection beyond local/legal requirements',
    'Emergency leave within 24 hours',
    'Leave donation bank',
    'Disability pay top-up',
    'PTO accrual during leave',
    'Paid micro-breaks for side effects'
  ],
  2: [
    'Coverage for clinical trials and experimental treatments',
    'Coverage for advanced therapies (CAR-T, proton, immunotherapy)',
    'Paid time off for clinical trial participation',
    'Set out-of-pocket maximums',
    'Travel/lodging reimbursement for specialized care',
    'Financial counseling services',
    'Voluntary supplemental illness insurance',
    'Real-time cost estimator tools',
    'Insurance advocacy/pre-authorization support',
    '$0 copay for specialty drugs',
    'Hardship grants program',
    'Tax/estate planning assistance',
    'Short-term disability covering 60%+ of salary',
    'Long-term disability covering 60%+ of salary',
    'Employer-paid disability insurance supplements',
    'Guaranteed job protection',
    'Accelerated life insurance benefits'
  ],
  3: [
    'Manager training on supporting employees with serious conditions',
    'Clear escalation protocol for manager response',
    'Dedicated manager resource hub',
    'Empathy/communication skills training',
    'Legal compliance training',
    'Senior leader coaching',
    'Manager evaluations include support metrics',
    'Manager peer support/community building',
    'AI-powered guidance tools',
    'Privacy protection and confidentiality management'
  ],
  4: [
    'Dedicated navigation support for benefits and medical care',
    'Benefits optimization assistance',
    'Insurance advocacy/appeals support',
    'Clinical trial matching service',
    'Care coordination concierge',
    'Online tools, apps, or portals for health/benefits',
    'Survivorship planning assistance',
    'Nutrition coaching',
    'Physical rehabilitation support',
    'Occupational therapy/vocational rehabilitation'
  ],
  5: [
    'Physical workspace modifications',
    'Cognitive/fatigue support tools',
    'Ergonomic equipment funding',
    'Flexible scheduling options',
    'Remote work capability',
    'Rest areas/quiet spaces',
    'Priority parking',
    'Temporary role redesigns',
    'Assistive technology catalog',
    'Transportation reimbursement',
    'Policy accommodations (dress code, headphones, etc.)'
  ],
  6: [
    'Strong anti-discrimination policies for health conditions',
    'Clear process for confidential health disclosures',
    'Manager training on sensitive health information',
    'Written anti-retaliation policies',
    'Employee peer support groups',
    'Professional-led support groups',
    'Stigma-reduction initiatives',
    'Specialized emotional counseling',
    'Optional open health dialogue forums',
    'Inclusive communication guidelines',
    'Confidential HR channel for health questions',
    'Anonymous benefits navigation tool'
  ],
  7: [
    'Continued access to training/development',
    'Structured reintegration programs',
    'Peer mentorship program',
    'Professional coach/mentor',
    'Adjusted performance goals during treatment',
    'Career coaching',
    'Succession planning protections',
    'Project continuity protocols',
    'Optional stay-connected program'
  ],
  8: [
    'Flexible work arrangements during treatment',
    'Phased return-to-work plans',
    'Workload adjustments during treatment',
    'Flexibility for medical setbacks',
    'Buddy/mentor pairing for support',
    'Structured progress reviews',
    'Contingency planning for treatment schedules',
    'Long-term success tracking',
    'Access to occupational therapy/vocational rehab',
    'Online peer support forums',
    'Access to specialized work resumption professionals',
    'Manager training on supporting during treatment/return'
  ],
  9: [
    'Executive accountability metrics',
    'Public success story celebrations',
    'Compensation tied to support outcomes',
    'ESG/CSR reporting inclusion',
    'Year-over-year budget growth',
    'Executive sponsors communicate regularly',
    'Dedicated budget allocation',
    'C-suite executive serves as champion/sponsor',
    'Support programs in investor communications',
    'Cross-functional executive steering committee',
    'Support metrics in annual/sustainability reporting'
  ],
  10: [
    'Paid caregiver leave with expanded eligibility',
    'Flexible work arrangements for caregivers',
    'Dependent care subsidies',
    'Emergency caregiver funds',
    'Dependent care account matching',
    'Family navigation support',
    'Caregiver peer support groups',
    'Mental health support for caregivers',
    'Manager training for supervising caregivers',
    'Practical support for managing caregiving and work',
    'Emergency dependent care',
    'Respite care funding',
    'Caregiver resource navigator/concierge',
    'Legal/financial planning for caregivers',
    'Modified job duties during peak caregiving',
    'Unpaid leave job protection beyond legal',
    'Eldercare consultation and referral',
    'Paid time off for care coordination',
    'Expanded caregiver leave eligibility'
  ],
  11: [
    'At least 70% coverage for recommended screenings',
    'Full/partial coverage for annual health screenings',
    'Targeted risk-reduction programs',
    'Paid time off for preventive care',
    'Legal protections beyond requirements',
    'Workplace safety assessments',
    'Regular health education sessions',
    'Individual health assessments',
    'Genetic screening/counseling',
    'On-site vaccinations',
    'Lifestyle coaching programs',
    'Risk factor tracking/reporting',
    'Policies for immuno-compromised colleagues'
  ],
  12: [
    'Return-to-work success metrics',
    'Employee satisfaction tracking',
    'Business impact/ROI assessment',
    'Regular program enhancements',
    'External benchmarking',
    'Innovation pilots',
    'Employee confidence in employer support',
    'Program utilization analytics'
  ],
  13: [
    'Proactive communication at diagnosis disclosure',
    'Dedicated program website or portal',
    'Regular company-wide awareness campaigns',
    'New hire orientation coverage',
    'Manager toolkit for cascade communications',
    'Employee testimonials/success stories',
    'Multi-channel communication strategy',
    'Family/caregiver communication inclusion',
    'Anonymous information access options'
  ]
};

const TIER_INFO: Record<number, { tier: number; color: string; bg: string }> = {
  4:  { tier: 1, color: '#1A237E', bg: '#E8EAF6' },
  8:  { tier: 1, color: '#1A237E', bg: '#E8EAF6' },
  3:  { tier: 1, color: '#1A237E', bg: '#E8EAF6' },
  2:  { tier: 1, color: '#1A237E', bg: '#E8EAF6' },
  13: { tier: 2, color: '#0D47A1', bg: '#E3F2FD' },
  6:  { tier: 2, color: '#0D47A1', bg: '#E3F2FD' },
  1:  { tier: 2, color: '#0D47A1', bg: '#E3F2FD' },
  5:  { tier: 3, color: '#546E7A', bg: '#ECEFF1' },
  7:  { tier: 3, color: '#546E7A', bg: '#ECEFF1' },
  9:  { tier: 3, color: '#546E7A', bg: '#ECEFF1' },
  10: { tier: 3, color: '#546E7A', bg: '#ECEFF1' },
  11: { tier: 3, color: '#546E7A', bg: '#ECEFF1' },
  12: { tier: 3, color: '#546E7A', bg: '#ECEFF1' },
};

const POINTS = {
  CURRENTLY_OFFER: 5,
  PLANNING: 3,
  ASSESSING: 2,
  NOT_ABLE: 0,
};

const INSUFFICIENT_DATA_THRESHOLD = 0.40;
const PROVISIONAL_FLAG_COUNT = 4;
const DIMENSION_ORDER = [4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12];

// ENHANCED: Wider column widths
const COL1_WIDTH = 340; // Dimension name column - WIDENED from 300
const COL2_WIDTH = 56;  // Weight column
const COL_AVG_WIDTH = 64; // Each AVG column - slightly wider for mini bars

// ============================================
// SCORING FUNCTIONS
// ============================================

function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: POINTS.CURRENTLY_OFFER, isUnsure: false };
      case 3: return { points: POINTS.PLANNING, isUnsure: false };
      case 2: return { points: POINTS.ASSESSING, isUnsure: false };
      case 1: return { points: POINTS.NOT_ABLE, isUnsure: false };
      case 5: return { points: null, isUnsure: true };
      default: return { points: null, isUnsure: false };
    }
  }
  
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: POINTS.NOT_ABLE, isUnsure: false };
    if (s === 'unsure' || s.includes('unsure')) return { points: null, isUnsure: true };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || 
        s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: POINTS.CURRENTLY_OFFER, isUnsure: false };
    }
    if (s.includes('planning') || s.includes('development')) return { points: POINTS.PLANNING, isUnsure: false };
    if (s.includes('assessing') || s.includes('feasibility')) return { points: POINTS.ASSESSING, isUnsure: false };
    if (s.length > 0) return { points: POINTS.NOT_ABLE, isUnsure: false };
  }
  return { points: null, isUnsure: false };
}

function getGeoMultiplier(geoResponse: string | undefined | null): number {
  if (!geoResponse) return 1.0;
  const s = geoResponse.toLowerCase();
  if (s.includes('consistent') || s.includes('generally consistent')) return 1.0;
  if (s.includes('vary') || s.includes('varies')) return 0.90;
  if (s.includes('select') || s.includes('only available in select')) return 0.75;
  return 1.0;
}

interface DimensionScore {
  rawScore: number;
  adjustedScore: number;
  geoMultiplier: number;
  totalItems: number;
  answeredItems: number;
  unsureCount: number;
  unsurePercent: number;
  isInsufficientData: boolean;
}

function calculateDimensionScore(dimNum: number, dimData: Record<string, any> | null): DimensionScore {
  const result: DimensionScore = {
    rawScore: 0,
    adjustedScore: 0,
    geoMultiplier: 1.0,
    totalItems: 0,
    answeredItems: 0,
    unsureCount: 0,
    unsurePercent: 0,
    isInsufficientData: false,
  };
  
  if (!dimData) return result;
  
  const mainGrid = dimData[`d${dimNum}a`];
  if (!mainGrid || typeof mainGrid !== 'object') return result;
  
  let earnedPoints = 0;
  
  Object.values(mainGrid).forEach((status: any) => {
    result.totalItems++;
    const { points, isUnsure } = statusToPoints(status);
    
    if (isUnsure) {
      result.unsureCount++;
      result.answeredItems++;
    } else if (points !== null) {
      result.answeredItems++;
      earnedPoints += points;
    }
  });
  
  result.unsurePercent = result.totalItems > 0 ? result.unsureCount / result.totalItems : 0;
  result.isInsufficientData = result.unsurePercent > INSUFFICIENT_DATA_THRESHOLD;
  
  const maxPoints = result.answeredItems * POINTS.CURRENTLY_OFFER;
  if (maxPoints > 0) {
    result.rawScore = Math.round((earnedPoints / maxPoints) * 100);
  } else {
    result.rawScore = 0;
  }
  
  const geoResponse = dimData[`d${dimNum}aa`] || dimData[`D${dimNum}aa`];
  result.geoMultiplier = getGeoMultiplier(geoResponse);
  result.adjustedScore = Math.round(result.rawScore * result.geoMultiplier);
  
  return result;
}

interface CompanyScores {
  companyName: string;
  surveyId: string;
  dimensions: Record<number, DimensionScore>;
  unweightedScore: number;
  weightedScore: number;
  insufficientDataCount: number;
  isProvisional: boolean;
  isComplete: boolean;
  isFoundingPartner: boolean;
  completedDimCount: number;
}

function calculateCompanyScores(assessment: Record<string, any>, weights: Record<number, number>): CompanyScores {
  const dimensions: Record<number, DimensionScore> = {};
  let completedDimCount = 0;
  
  for (let i = 1; i <= 13; i++) {
    const dimData = assessment[`dimension${i}_data`];
    dimensions[i] = calculateDimensionScore(i, dimData);
    if (dimensions[i].totalItems > 0) {
      completedDimCount++;
    }
  }
  
  const isComplete = completedDimCount === 13;
  const insufficientDataCount = Object.values(dimensions).filter(d => d.isInsufficientData).length;
  const isProvisional = insufficientDataCount >= PROVISIONAL_FLAG_COUNT;
  
  const appId = assessment.app_id || assessment.survey_id || '';
  const isFoundingPartner = appId.startsWith('FP-') || 
    assessment.is_founding_partner === true ||
    assessment.payment_method === 'founding_partner';
  
  let unweightedScore = 0;
  let weightedScore = 0;
  
  if (isComplete) {
    const dimsWithData = Object.values(dimensions).filter(d => d.totalItems > 0);
    unweightedScore = dimsWithData.length > 0
      ? Math.round(dimsWithData.reduce((sum, d) => sum + d.adjustedScore, 0) / dimsWithData.length)
      : 0;
    
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    
    if (totalWeight > 0) {
      for (let i = 1; i <= 13; i++) {
        const dim = dimensions[i];
        const weight = weights[i] || 0;
        weightedScore += dim.adjustedScore * (weight / totalWeight);
      }
    }
    weightedScore = Math.round(weightedScore);
  }
  
  return {
    companyName: assessment.company_name || 'Unknown',
    surveyId: assessment.app_id || assessment.survey_id || 'N/A',
    dimensions,
    unweightedScore,
    weightedScore,
    insufficientDataCount,
    isProvisional,
    isComplete,
    isFoundingPartner,
    completedDimCount,
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#2E7D32';
  if (score >= 60) return '#1565C0';
  if (score >= 40) return '#EF6C00';
  return '#C62828';
}

function getPerformanceTier(score: number, isProvisional: boolean): { name: string; color: string; bg: string; isProvisional: boolean } {
  let tier: { name: string; color: string; bg: string };
  if (score >= 90) {
    tier = { name: 'Exemplary', color: '#1B5E20', bg: '#E8F5E9' };
  } else if (score >= 75) {
    tier = { name: 'Leading', color: '#0D47A1', bg: '#E3F2FD' };
  } else if (score >= 60) {
    tier = { name: 'Progressing', color: '#E65100', bg: '#FFF8E1' };
  } else if (score >= 40) {
    tier = { name: 'Emerging', color: '#BF360C', bg: '#FFF3E0' };
  } else {
    tier = { name: 'Beginning', color: '#37474F', bg: '#ECEFF1' };
  }
  return { ...tier, isProvisional };
}

// ============================================
// ENHANCED: Mini Progress Bar Component
// ============================================
function MiniProgressBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
      <div 
        className="h-full rounded-full transition-all duration-300" 
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ============================================
// DIMENSION ITEMS MODAL
// ============================================
function DimensionModal({ 
  dimNum, 
  onClose 
}: { 
  dimNum: number; 
  onClose: () => void;
}) {
  const items = DIMENSION_ITEMS[dimNum] || [];
  const tierInfo = TIER_INFO[dimNum];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: tierInfo.color }}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 text-white text-lg font-bold">
              {dimNum}
            </span>
            <div>
              <h2 className="text-xl font-bold text-white">{DIMENSION_NAMES[dimNum]}</h2>
              <p className="text-white/80 text-sm">Tier {tierInfo.tier} - {items.length} items assessed</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-gray-500 mb-4">
            These are the items assessed in this dimension:
          </p>
          <ol className="space-y-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <span 
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: tierInfo.color }}
                >
                  {idx + 1}
                </span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ol>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AggregateScoringReport() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState<Record<number, number>>({ ...DEFAULT_WEIGHTS });
  const [showWeightConfig, setShowWeightConfig] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'weighted' | 'unweighted'>('weighted');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedDimension, setSelectedDimension] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'score' | 'index'>('score');
  const [filterComplete, setFilterComplete] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'fp' | 'standard'>('all');
  // ENHANCED: Collapsible legend state
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .order('company_name', { ascending: true });

        if (error) throw error;
        
        const assessmentsWithData = (data || []).filter(a => {
          for (let i = 1; i <= 13; i++) {
            const dimData = a[`dimension${i}_data`];
            if (dimData && typeof dimData === 'object') {
              const gridData = dimData[`d${i}a`];
              if (gridData && Object.keys(gridData).length > 0) {
                return true;
              }
            }
          }
          return false;
        });
        
        setAssessments(assessmentsWithData);
      } catch (err) {
        console.error('Error loading assessments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
  }, []);

  const companyScores = useMemo(() => {
    return assessments.map(a => calculateCompanyScores(a, weights));
  }, [assessments, weights]);

  const sortedCompanies = useMemo(() => {
    let filtered = companyScores;
    if (filterType === 'fp') {
      filtered = companyScores.filter(c => c.isFoundingPartner);
    } else if (filterType === 'standard') {
      filtered = companyScores.filter(c => !c.isFoundingPartner);
    }
    
    if (filterComplete) {
      filtered = filtered.filter(c => c.isComplete);
    }
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.companyName.localeCompare(b.companyName);
      } else if (sortBy === 'weighted') {
        comparison = a.weightedScore - b.weightedScore;
      } else {
        comparison = a.unweightedScore - b.unweightedScore;
      }
      return sortDir === 'desc' ? -comparison : comparison;
    });
  }, [companyScores, sortBy, sortDir, filterType, filterComplete]);

  const calculateIndex = (score: number, avg: number | null): number | null => {
    if (avg === null || avg === 0) return null;
    return Math.round((score / avg) * 100);
  };

  const getIndexColor = (index: number | null): string => {
    if (index === null) return '#9CA3AF';
    if (index >= 115) return '#1B5E20';
    if (index >= 105) return '#2E7D32';
    if (index >= 95) return '#1565C0';
    if (index >= 85) return '#EF6C00';
    return '#C62828';
  };

  const dimensionAverages = useMemo(() => {
    const averages: Record<number, { 
      total: { avg: number; count: number };
      fp: { avg: number; count: number };
      standard: { avg: number; count: number };
    }> = {};
    
    for (let i = 1; i <= 13; i++) {
      const allScores = companyScores.filter(c => c.dimensions[i].totalItems > 0);
      const fpScores = allScores.filter(c => c.isFoundingPartner);
      const stdScores = allScores.filter(c => !c.isFoundingPartner);
      
      averages[i] = {
        total: allScores.length > 0 
          ? { avg: Math.round(allScores.reduce((s, c) => s + c.dimensions[i].adjustedScore, 0) / allScores.length), count: allScores.length }
          : { avg: 0, count: 0 },
        fp: fpScores.length > 0
          ? { avg: Math.round(fpScores.reduce((s, c) => s + c.dimensions[i].adjustedScore, 0) / fpScores.length), count: fpScores.length }
          : { avg: 0, count: 0 },
        standard: stdScores.length > 0
          ? { avg: Math.round(stdScores.reduce((s, c) => s + c.dimensions[i].adjustedScore, 0) / stdScores.length), count: stdScores.length }
          : { avg: 0, count: 0 },
      };
    }
    
    return averages;
  }, [companyScores]);

  const compositeAverages = useMemo(() => {
    const completeCompanies = companyScores.filter(c => c.isComplete);
    const completeFP = completeCompanies.filter(c => c.isFoundingPartner);
    const completeStd = completeCompanies.filter(c => !c.isFoundingPartner);
    
    return {
      unweighted: {
        total: completeCompanies.length > 0 ? Math.round(completeCompanies.reduce((s, c) => s + c.unweightedScore, 0) / completeCompanies.length) : null,
        fp: completeFP.length > 0 ? Math.round(completeFP.reduce((s, c) => s + c.unweightedScore, 0) / completeFP.length) : null,
        standard: completeStd.length > 0 ? Math.round(completeStd.reduce((s, c) => s + c.unweightedScore, 0) / completeStd.length) : null,
      },
      weighted: {
        total: completeCompanies.length > 0 ? Math.round(completeCompanies.reduce((s, c) => s + c.weightedScore, 0) / completeCompanies.length) : null,
        fp: completeFP.length > 0 ? Math.round(completeFP.reduce((s, c) => s + c.weightedScore, 0) / completeFP.length) : null,
        standard: completeStd.length > 0 ? Math.round(completeStd.reduce((s, c) => s + c.weightedScore, 0) / completeStd.length) : null,
      },
      counts: {
        total: completeCompanies.length,
        fp: completeFP.length,
        standard: completeStd.length,
      }
    };
  }, [companyScores]);

  const totalWeight = useMemo(() => Object.values(weights).reduce((sum, w) => sum + w, 0), [weights]);

  const handleWeightChange = useCallback((dim: number, value: number) => {
    const numValue = Math.max(0, Math.min(50, value));
    setWeights(prev => ({ ...prev, [dim]: numValue }));
  }, []);

  const resetWeights = useCallback(() => {
    setWeights({ ...DEFAULT_WEIGHTS });
  }, []);

  const handleSort = (column: 'name' | 'weighted' | 'unweighted') => {
    if (sortBy === column) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir(column === 'name' ? 'asc' : 'desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Dimension Modal */}
      {selectedDimension && (
        <DimensionModal 
          dimNum={selectedDimension} 
          onClose={() => setSelectedDimension(null)} 
        />
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white py-4 px-8 shadow-lg print:hidden">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-lg">📊</span>
                Best Companies Scoring Report
              </h1>
              <p className="text-indigo-200 text-sm mt-1">
                Workplace Support Excellence Index - {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWeightConfig(!showWeightConfig)}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded font-bold text-sm transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Weights
              </button>
              <button
                onClick={resetWeights}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
                title="Reset to default weights"
              >
                Reset
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
              >
                Back
              </button>
            </div>
          </div>
          
          {/* Stats Bar & Controls */}
          <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2">
            {/* Company Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-indigo-200">Total:</span>
                <span className="font-bold text-lg">{companyScores.length}</span>
              </div>
              {/* ENHANCED: Better FP/Standard badges */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-400 text-amber-100 text-xs font-bold">⭐ FP</span>
                <span className="font-bold">{companyScores.filter(c => c.isFoundingPartner).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/30 border border-cyan-400 text-cyan-100 text-xs font-bold">STD</span>
                <span className="font-bold">{companyScores.filter(c => !c.isFoundingPartner).length}</span>
              </div>
              <div className="border-l border-white/20 pl-4 flex items-center gap-2">
                <span className="text-green-200">✓ Complete:</span>
                <span className="font-bold">{companyScores.filter(c => c.isComplete).length}</span>
              </div>
            </div>
            
            {/* View Toggle & Filters */}
            <div className="flex items-center gap-4">
              {/* Score/Index Toggle */}
              <div className="flex bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('score')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'score' ? 'bg-white text-indigo-900' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Scores
                </button>
                <button
                  onClick={() => setViewMode('index')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'index' ? 'bg-white text-indigo-900' : 'text-white hover:bg-white/10'
                  }`}
                  title="Index: 100 = Average. Shows performance relative to benchmark."
                >
                  Index
                </button>
              </div>
              
              {/* Company Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'fp' | 'standard')}
                className="bg-white/10 text-white border-0 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-white/30"
              >
                <option value="all" className="text-gray-900">All Companies</option>
                <option value="fp" className="text-gray-900">Founding Partners</option>
                <option value="standard" className="text-gray-900">Standard Only</option>
              </select>
              
              {/* Complete Filter */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterComplete}
                  onChange={(e) => setFilterComplete(e.target.checked)}
                  className="rounded border-white/30 bg-white/10 text-indigo-400 focus:ring-white/30"
                />
                <span>Complete Only</span>
              </label>
              
              {/* Weight Status */}
              <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                totalWeight === 100 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                Wt: {totalWeight}%
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* View Mode Explanation */}
      {viewMode === 'index' && (
        <div className="bg-blue-50 border-b border-blue-200 px-8 py-2 print:hidden">
          <p className="text-sm text-blue-800">
            <strong>Index View:</strong> 100 = Average benchmark. 
            <span className="text-green-700 ml-2">≥120 = Excellent</span>
            <span className="text-green-600 ml-2">≥110 = Strong</span>
            <span className="text-blue-600 ml-2">≥100 = At/Above Avg</span>
            <span className="text-orange-600 ml-2">≥90 = Below</span>
            <span className="text-red-600 ml-2">&lt;90 = Significant Gap</span>
          </p>
        </div>
      )}

      {/* Weight Configuration Panel */}
      {showWeightConfig && (
        <div className="bg-white border-b border-gray-200 shadow-sm print:hidden">
          <div className="max-w-full mx-auto px-8 py-6">
            <h3 className="font-bold text-gray-900 mb-4">Weight Configuration by Tier</h3>
            
            <div className="grid grid-cols-3 gap-6">
              {/* Tier 1 */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-indigo-900 text-white text-xs flex items-center justify-center">T1</span>
                  Tier 1 - Highest Impact (50%)
                </h4>
                <div className="space-y-3">
                  {[4, 8, 3, 2].map(dim => (
                    <div key={dim} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded bg-indigo-900 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {dim}
                      </span>
                      <span className="flex-1 text-sm text-gray-700">
                        {DIMENSION_NAMES[dim]}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={weights[dim]}
                        onChange={(e) => handleWeightChange(dim, parseInt(e.target.value) || 0)}
                        className="w-14 text-center text-sm border rounded px-1 py-1 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-400 w-4">%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tier 2 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-blue-800 text-white text-xs flex items-center justify-center">T2</span>
                  Tier 2 - Critical Enablers (25%)
                </h4>
                <div className="space-y-3">
                  {[13, 6, 1].map(dim => (
                    <div key={dim} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded bg-blue-800 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {dim}
                      </span>
                      <span className="flex-1 text-sm text-gray-700">
                        {DIMENSION_NAMES[dim]}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={weights[dim]}
                        onChange={(e) => handleWeightChange(dim, parseInt(e.target.value) || 0)}
                        className="w-14 text-center text-sm border rounded px-1 py-1 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-400 w-4">%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tier 3 */}
              <div className="bg-gray-100 rounded-lg p-4">
                <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gray-600 text-white text-xs flex items-center justify-center">T3</span>
                  Tier 3 - Foundation (25%)
                </h4>
                <div className="space-y-2">
                  {[5, 7, 9, 10, 11, 12].map(dim => (
                    <div key={dim} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-gray-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {dim}
                      </span>
                      <span className="flex-1 text-xs text-gray-700 truncate" title={DIMENSION_NAMES[dim]}>
                        {DIMENSION_NAMES[dim]}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={weights[dim]}
                        onChange={(e) => handleWeightChange(dim, parseInt(e.target.value) || 0)}
                        className="w-12 text-center text-xs border rounded px-1 py-0.5 focus:ring-2 focus:ring-gray-500"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        {sortedCompanies.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Assessments with Dimension Data</h3>
            <p className="text-gray-600 mb-4">
              No companies have completed any dimension sections yet.
            </p>
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Weight Error Banner */}
          {totalWeight !== 100 && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">
                Weights must sum to 100% for weighted scores. Current total: {totalWeight}%
              </span>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse" style={{ minWidth: `${COL1_WIDTH + COL2_WIDTH + (3 * COL_AVG_WIDTH) + (sortedCompanies.length * 110)}px` }}>
              <thead>
                {/* ENHANCED: Column Group Headers */}
                <tr className="bg-gray-800 text-white">
                  <th 
                    colSpan={2}
                    className="px-4 py-1.5 text-left text-xs font-medium bg-gray-800 border-r border-gray-600"
                    style={{ position: 'sticky', left: 0, zIndex: 30 }}
                  >
                    DIMENSIONS
                  </th>
                  <th 
                    colSpan={3}
                    className="px-4 py-1.5 text-center text-xs font-medium bg-indigo-700 border-r border-indigo-500"
                    style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 30, width: 3 * COL_AVG_WIDTH }}
                  >
                    AVERAGES
                  </th>
                  <th 
                    colSpan={sortedCompanies.length}
                    className="px-4 py-1.5 text-center text-xs font-medium bg-slate-700"
                  >
                    COMPANIES ({sortedCompanies.length})
                  </th>
                </tr>
                <tr className="bg-indigo-900 text-white">
                  {/* Sticky Column 1: Dimension */}
                  <th 
                    className="px-4 py-3 text-left font-semibold bg-indigo-900 z-30 border-r border-indigo-700"
                    style={{ position: 'sticky', left: 0, minWidth: COL1_WIDTH, width: COL1_WIDTH }}
                  >
                    Dimension
                  </th>
                  {/* Sticky Column 2: Weight */}
                  <th 
                    className="px-2 py-3 text-center font-semibold bg-indigo-900 z-30 border-r border-indigo-700"
                    style={{ position: 'sticky', left: COL1_WIDTH, width: COL2_WIDTH }}
                  >
                    Wt%
                  </th>
                  {/* Sticky Column 3: TOTAL AVG */}
                  <th 
                    className="px-2 py-3 text-center font-semibold bg-indigo-800 z-30 border-r border-indigo-600"
                    style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, width: COL_AVG_WIDTH }}
                    title="Average across all companies"
                  >
                    <span className="inline-block px-2 py-0.5 rounded bg-indigo-600 text-[10px]">ALL</span>
                    <span className="block text-xs mt-0.5">{viewMode === 'index' ? '=100' : 'AVG'}</span>
                  </th>
                  {/* Sticky Column 4: FP AVG */}
                  <th 
                    className="px-2 py-3 text-center font-semibold bg-amber-600 z-30 border-r border-amber-500"
                    style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, width: COL_AVG_WIDTH }}
                    title="Founding Partners average"
                  >
                    <span className="inline-block px-2 py-0.5 rounded bg-amber-500 text-amber-900 text-[10px] font-bold">⭐ FP</span>
                    <span className="block text-xs mt-0.5">{viewMode === 'index' ? 'IDX' : 'AVG'}</span>
                  </th>
                  {/* Sticky Column 5: Standard AVG */}
                  <th 
                    className="px-2 py-3 text-center font-semibold bg-cyan-700 z-30 border-r border-cyan-600"
                    style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), width: COL_AVG_WIDTH }}
                    title="Standard participants average"
                  >
                    <span className="inline-block px-2 py-0.5 rounded bg-cyan-600 text-[10px] font-bold">STD</span>
                    <span className="block text-xs mt-0.5">{viewMode === 'index' ? 'IDX' : 'AVG'}</span>
                  </th>
                  {/* Company Columns - ENHANCED badges */}
                  {sortedCompanies.map(company => (
                    <th 
                      key={company.surveyId} 
                      className={`px-3 py-2 text-center font-medium border-r last:border-r-0 ${
                        company.isFoundingPartner 
                          ? 'bg-amber-600 border-amber-500' 
                          : 'bg-cyan-700 border-cyan-600'
                      }`}
                      style={{ minWidth: 110 }}
                    >
                      <Link 
                        href={`/admin/profile/${company.surveyId}`}
                        className="text-xs hover:underline block truncate text-white"
                        title={company.companyName}
                      >
                        {company.companyName.length > 14 
                          ? company.companyName.substring(0, 14) + '...'
                          : company.companyName
                        }
                      </Link>
                      {/* ENHANCED: Better company type badges */}
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        company.isFoundingPartner 
                          ? 'bg-amber-200 text-amber-900' 
                          : 'bg-cyan-200 text-cyan-900'
                      }`}>
                        {company.isFoundingPartner ? '⭐ FP' : 'STD'}
                      </span>
                      {!company.isComplete && (
                        <span className="text-[9px] text-yellow-300 block">{company.completedDimCount}/13</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Dimension Rows - ENHANCED with better stripes and hover */}
                {DIMENSION_ORDER.map((dimNum, idx) => {
                  const tierInfo = TIER_INFO[dimNum];
                  const dimAvg = dimensionAverages[dimNum];
                  // ENHANCED: More visible alternating stripes
                  const rowBg = idx % 2 === 0 ? '#ffffff' : '#F1F5F9';
                  
                  return (
                    <tr 
                      key={dimNum} 
                      className="hover:bg-blue-50 transition-colors"
                      style={{ backgroundColor: rowBg }}
                    >
                      {/* Sticky Column 1: Dimension Name (Clickable) */}
                      <td 
                        className="px-4 py-3 z-10 border-r border-gray-200 cursor-pointer hover:bg-blue-100 transition-colors" 
                        style={{ position: 'sticky', left: 0, backgroundColor: rowBg, minWidth: COL1_WIDTH, width: COL1_WIDTH }}
                        onClick={() => setSelectedDimension(dimNum)}
                      >
                        <div className="flex items-center gap-3">
                          <span 
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold text-white flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: tierInfo.color }}
                          >
                            {dimNum}
                          </span>
                          <span className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                            {DIMENSION_NAMES[dimNum]}
                          </span>
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </td>
                      {/* Sticky Column 2: Editable Weight */}
                      <td 
                        className="px-1 py-2 text-center z-10 border-r border-gray-200"
                        style={{ position: 'sticky', left: COL1_WIDTH, backgroundColor: rowBg, width: COL2_WIDTH }}
                      >
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={weights[dimNum]}
                          onChange={(e) => handleWeightChange(dimNum, parseInt(e.target.value) || 0)}
                          className="w-12 text-center text-sm font-semibold border border-gray-300 rounded px-1 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400"
                          title="Edit weight"
                        />
                      </td>
                      {/* Sticky Column 3: TOTAL AVG with mini bar */}
                      <td 
                        className="px-2 py-2 text-center z-10 bg-indigo-50 border-r border-gray-200" 
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, width: COL_AVG_WIDTH }}
                      >
                        <span className="font-bold" style={{ color: dimAvg.total.count > 0 ? getScoreColor(dimAvg.total.avg) : '#9CA3AF' }}>
                          {dimAvg.total.count > 0 ? (viewMode === 'index' ? '100' : dimAvg.total.avg) : '—'}
                        </span>
                        {/* ENHANCED: Mini progress bar */}
                        {dimAvg.total.count > 0 && viewMode === 'score' && (
                          <MiniProgressBar value={dimAvg.total.avg} color={getScoreColor(dimAvg.total.avg)} />
                        )}
                      </td>
                      {/* Sticky Column 4: FP AVG */}
                      <td 
                        className="px-2 py-2 text-center z-10 bg-amber-50 border-r border-gray-200" 
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, width: COL_AVG_WIDTH }}
                      >
                        <span 
                          className="font-bold"
                          style={{ 
                            color: viewMode === 'index' 
                              ? getIndexColor(calculateIndex(dimAvg.fp.avg, dimAvg.total.avg))
                              : (dimAvg.fp.count > 0 ? getScoreColor(dimAvg.fp.avg) : '#9CA3AF')
                          }}
                        >
                          {dimAvg.fp.count > 0 
                            ? (viewMode === 'index' ? calculateIndex(dimAvg.fp.avg, dimAvg.total.avg) : dimAvg.fp.avg) 
                            : '—'}
                        </span>
                        {dimAvg.fp.count > 0 && viewMode === 'score' && (
                          <MiniProgressBar value={dimAvg.fp.avg} color={getScoreColor(dimAvg.fp.avg)} />
                        )}
                      </td>
                      {/* Sticky Column 5: Standard AVG */}
                      <td 
                        className="px-2 py-2 text-center z-10 bg-cyan-50 border-r border-gray-200" 
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), width: COL_AVG_WIDTH }}
                      >
                        <span 
                          className="font-bold"
                          style={{ 
                            color: viewMode === 'index'
                              ? getIndexColor(calculateIndex(dimAvg.standard.avg, dimAvg.total.avg))
                              : (dimAvg.standard.count > 0 ? getScoreColor(dimAvg.standard.avg) : '#9CA3AF')
                          }}
                        >
                          {dimAvg.standard.count > 0 
                            ? (viewMode === 'index' ? calculateIndex(dimAvg.standard.avg, dimAvg.total.avg) : dimAvg.standard.avg)
                            : '—'}
                        </span>
                        {dimAvg.standard.count > 0 && viewMode === 'score' && (
                          <MiniProgressBar value={dimAvg.standard.avg} color={getScoreColor(dimAvg.standard.avg)} />
                        )}
                      </td>
                      {/* Company Score Columns - ENHANCED hover effect */}
                      {sortedCompanies.map(company => {
                        const dim = company.dimensions[dimNum];
                        const isInsufficient = dim.isInsufficientData;
                        const score = dim.adjustedScore;
                        const index = calculateIndex(score, dimAvg.total.avg);
                        const displayValue = viewMode === 'index' ? index : score;
                        const displayColor = viewMode === 'index' 
                          ? getIndexColor(index) 
                          : (isInsufficient ? '#D97706' : getScoreColor(score));
                        
                        return (
                          <td 
                            key={company.surveyId} 
                            className={`px-3 py-2.5 text-center border-r border-gray-100 last:border-r-0 transition-all hover:scale-105 hover:shadow-lg hover:z-20 hover:bg-white ${
                              isInsufficient ? 'bg-yellow-50' : (company.isFoundingPartner ? 'bg-amber-50/30' : 'bg-cyan-50/30')
                            }`}
                            style={{ minWidth: 110 }}
                            title={isInsufficient ? `${Math.round(dim.unsurePercent * 100)}% Unsure - Insufficient Data` : undefined}
                          >
                            {dim.totalItems > 0 ? (
                              <span 
                                className={`font-semibold ${isInsufficient ? 'text-xs' : ''}`}
                                style={{ color: displayColor }}
                              >
                                {isInsufficient ? (
                                  <span className="inline-flex items-center gap-0.5">
                                    <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {displayValue ?? '—'}
                                  </span>
                                ) : (
                                  displayValue ?? '—'
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                
                {/* ENHANCED: Insufficient Data Count Row - more prominent */}
                <tr className="bg-gradient-to-r from-yellow-100 to-amber-100 border-t-2 border-yellow-400">
                  <td 
                    className="px-4 py-3 bg-gradient-to-r from-yellow-100 to-amber-100 z-10 border-r border-yellow-300"
                    style={{ position: 'sticky', left: 0, minWidth: COL1_WIDTH, width: COL1_WIDTH }}
                  >
                    <span className="text-sm font-bold text-yellow-900 flex items-center gap-2">
                      <span className="p-1.5 bg-yellow-500 rounded text-white">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Insufficient Data (dims &gt;40% Unsure)
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center text-xs text-yellow-800 bg-gradient-to-r from-yellow-100 to-amber-100 z-10 border-r border-yellow-300 font-bold"
                      style={{ position: 'sticky', left: COL1_WIDTH, width: COL2_WIDTH }}>&gt;40%</td>
                  <td className="px-2 py-3 text-center bg-yellow-200 z-10 border-r border-yellow-300"
                      style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, width: COL_AVG_WIDTH }}></td>
                  <td className="px-2 py-3 text-center bg-yellow-200 z-10 border-r border-yellow-300"
                      style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, width: COL_AVG_WIDTH }}></td>
                  <td className="px-2 py-3 text-center bg-yellow-200 z-10 border-r border-yellow-300"
                      style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), width: COL_AVG_WIDTH }}></td>
                  {sortedCompanies.map(company => (
                    <td key={company.surveyId} className="px-3 py-3 text-center border-r border-yellow-300 last:border-r-0 bg-yellow-50" style={{ minWidth: 110 }}>
                      <span className={`font-bold text-lg ${company.insufficientDataCount >= PROVISIONAL_FLAG_COUNT ? 'text-red-600' : company.insufficientDataCount > 0 ? 'text-yellow-700' : 'text-green-600'}`}>
                        {company.insufficientDataCount}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Separator */}
                <tr className="bg-gray-400">
                  <td colSpan={5 + sortedCompanies.length} className="py-1"></td>
                </tr>

                {/* ENHANCED: Unweighted Score Row with gradient */}
                <tr className="bg-gradient-to-r from-gray-100 to-slate-100">
                  <td 
                    className="px-4 py-4 bg-gradient-to-r from-gray-100 to-slate-100 z-10 border-r border-gray-300"
                    style={{ position: 'sticky', left: 0, minWidth: COL1_WIDTH, width: COL1_WIDTH }}
                  >
                    <button onClick={() => handleSort('unweighted')} className="text-sm font-bold text-gray-800 hover:text-indigo-600 flex items-center gap-2">
                      <span className="p-1.5 bg-gray-500 rounded text-white text-xs">AVG</span>
                      Unweighted Composite
                      {sortBy === 'unweighted' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </td>
                  <td className="px-2 py-4 text-center text-xs text-gray-500 bg-gradient-to-r from-gray-100 to-slate-100 z-10 border-r border-gray-300"
                      style={{ position: 'sticky', left: COL1_WIDTH, width: COL2_WIDTH }}>avg</td>
                  <td className="px-2 py-4 text-center bg-gray-200 z-10 font-bold text-lg border-r border-gray-300"
                      style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, width: COL_AVG_WIDTH }}>
                    {viewMode === 'index' ? '100' : (compositeAverages.unweighted.total ?? '—')}
                  </td>
                  <td className="px-2 py-4 text-center bg-amber-100 z-10 font-bold text-lg border-r border-gray-300"
                      style={{ 
                        position: 'sticky', 
                        left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, 
                        width: COL_AVG_WIDTH,
                        color: viewMode === 'index' ? getIndexColor(calculateIndex(compositeAverages.unweighted.fp ?? 0, compositeAverages.unweighted.total ?? 0)) : undefined
                      }}>
                    {viewMode === 'index' 
                      ? calculateIndex(compositeAverages.unweighted.fp ?? 0, compositeAverages.unweighted.total ?? 0) ?? '—'
                      : compositeAverages.unweighted.fp ?? '—'}
                  </td>
                  <td className="px-2 py-4 text-center bg-cyan-100 z-10 font-bold text-lg border-r border-gray-300"
                      style={{ 
                        position: 'sticky', 
                        left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), 
                        width: COL_AVG_WIDTH,
                        color: viewMode === 'index' ? getIndexColor(calculateIndex(compositeAverages.unweighted.standard ?? 0, compositeAverages.unweighted.total ?? 0)) : undefined
                      }}>
                    {viewMode === 'index'
                      ? calculateIndex(compositeAverages.unweighted.standard ?? 0, compositeAverages.unweighted.total ?? 0) ?? '—'
                      : compositeAverages.unweighted.standard ?? '—'}
                  </td>
                  {sortedCompanies.map(company => {
                    const score = company.unweightedScore;
                    const index = calculateIndex(score, compositeAverages.unweighted.total ?? 0);
                    const displayValue = viewMode === 'index' ? index : score;
                    const displayColor = viewMode === 'index' ? getIndexColor(index) : getScoreColor(score);
                    
                    return (
                      <td key={company.surveyId} 
                          className={`px-3 py-4 text-center border-r border-gray-200 last:border-r-0 ${company.isFoundingPartner ? 'bg-amber-50/50' : 'bg-cyan-50/50'}`} 
                          style={{ minWidth: 110 }}>
                        {company.isComplete ? (
                          <span className="font-bold text-xl" style={{ color: displayColor }}>
                            {displayValue ?? '—'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Incomplete</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* ENHANCED: Weighted Score Row with prominent gradient */}
                <tr className="bg-gradient-to-r from-indigo-100 via-indigo-150 to-purple-100">
                  <td 
                    className="px-4 py-4 bg-gradient-to-r from-indigo-100 to-purple-100 z-10 border-r border-indigo-300"
                    style={{ position: 'sticky', left: 0, minWidth: COL1_WIDTH, width: COL1_WIDTH }}
                  >
                    <button onClick={() => handleSort('weighted')} className="text-sm font-bold text-indigo-900 hover:text-indigo-600 flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-600 rounded text-white text-xs">WGT</span>
                      Weighted Composite
                      {sortBy === 'weighted' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </td>
                  <td className="px-2 py-4 text-center text-xs text-indigo-600 bg-gradient-to-r from-indigo-100 to-purple-100 z-10 border-r border-indigo-300"
                      style={{ position: 'sticky', left: COL1_WIDTH, width: COL2_WIDTH }}>
                    {totalWeight === 100 ? 'wgt' : <span className="text-red-600 font-bold">ERR</span>}
                  </td>
                  <td className="px-2 py-4 text-center bg-indigo-200 z-10 font-black text-xl text-indigo-900 border-r border-indigo-300"
                      style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, width: COL_AVG_WIDTH }}>
                    {totalWeight === 100 ? (viewMode === 'index' ? '100' : (compositeAverages.weighted.total ?? '—')) : '—'}
                  </td>
                  <td className="px-2 py-4 text-center bg-amber-200 z-10 font-black text-xl border-r border-indigo-300"
                      style={{ 
                        position: 'sticky', 
                        left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, 
                        width: COL_AVG_WIDTH,
                        color: viewMode === 'index' && totalWeight === 100 
                          ? getIndexColor(calculateIndex(compositeAverages.weighted.fp ?? 0, compositeAverages.weighted.total ?? 0)) 
                          : undefined
                      }}>
                    {totalWeight === 100 
                      ? (viewMode === 'index' 
                          ? calculateIndex(compositeAverages.weighted.fp ?? 0, compositeAverages.weighted.total ?? 0) ?? '—'
                          : compositeAverages.weighted.fp ?? '—') 
                      : '—'}
                  </td>
                  <td className="px-2 py-4 text-center bg-cyan-200 z-10 font-black text-xl border-r border-indigo-300"
                      style={{ 
                        position: 'sticky', 
                        left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), 
                        width: COL_AVG_WIDTH,
                        color: viewMode === 'index' && totalWeight === 100
                          ? getIndexColor(calculateIndex(compositeAverages.weighted.standard ?? 0, compositeAverages.weighted.total ?? 0))
                          : undefined
                      }}>
                    {totalWeight === 100 
                      ? (viewMode === 'index'
                          ? calculateIndex(compositeAverages.weighted.standard ?? 0, compositeAverages.weighted.total ?? 0) ?? '—'
                          : compositeAverages.weighted.standard ?? '—')
                      : '—'}
                  </td>
                  {sortedCompanies.map(company => {
                    const score = company.weightedScore;
                    const index = calculateIndex(score, compositeAverages.weighted.total ?? 0);
                    const displayValue = viewMode === 'index' ? index : score;
                    const displayColor = viewMode === 'index' ? getIndexColor(index) : undefined;
                    
                    return (
                      <td key={company.surveyId} 
                          className={`px-3 py-4 text-center border-r border-indigo-200 last:border-r-0 ${company.isFoundingPartner ? 'bg-amber-100/50' : 'bg-cyan-100/50'}`} 
                          style={{ minWidth: 110 }}>
                        {!company.isComplete ? (
                          <span className="text-xs text-gray-400 italic">Incomplete</span>
                        ) : totalWeight !== 100 ? (
                          <span className="text-xs text-red-500">Wt≠100%</span>
                        ) : (
                          <span className="font-black text-2xl" style={{ color: displayColor ?? '#312E81' }}>
                            {displayValue ?? '—'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* ENHANCED: Performance Tier Row with larger badges */}
                <tr className="bg-white border-t-2 border-indigo-300">
                  <td 
                    className="px-4 py-4 bg-white z-10 border-r border-gray-200"
                    style={{ position: 'sticky', left: 0, minWidth: COL1_WIDTH, width: COL1_WIDTH }}
                  >
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <span className="p-1.5 bg-purple-500 rounded text-white text-xs">🏆</span>
                      Performance Tier
                    </span>
                  </td>
                  <td className="px-2 py-4 text-center bg-white z-10 border-r border-gray-200"
                      style={{ position: 'sticky', left: COL1_WIDTH, width: COL2_WIDTH }}></td>
                  <td className="px-2 py-4 text-center bg-white z-10 border-r border-gray-200"
                      style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, width: COL_AVG_WIDTH }}></td>
                  <td className="px-2 py-4 text-center bg-white z-10 border-r border-gray-200"
                      style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, width: COL_AVG_WIDTH }}></td>
                  <td className="px-2 py-4 text-center bg-white z-10 border-r border-gray-200"
                      style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), width: COL_AVG_WIDTH }}></td>
                  {sortedCompanies.map(company => {
                    if (!company.isComplete) {
                      return (
                        <td key={company.surveyId} 
                            className={`px-2 py-3 text-center border-r border-gray-100 last:border-r-0 ${company.isFoundingPartner ? 'bg-amber-50/30' : 'bg-cyan-50/30'}`} 
                            style={{ minWidth: 110 }}>
                          <span className="text-xs text-gray-400 italic">Incomplete</span>
                        </td>
                      );
                    }
                    if (totalWeight !== 100) {
                      return (
                        <td key={company.surveyId} 
                            className={`px-2 py-3 text-center border-r border-gray-100 last:border-r-0 ${company.isFoundingPartner ? 'bg-amber-50/30' : 'bg-cyan-50/30'}`}
                            style={{ minWidth: 110 }}>
                          <span className="text-xs text-red-500">—</span>
                        </td>
                      );
                    }
                    const tier = getPerformanceTier(company.weightedScore, company.isProvisional);
                    return (
                      <td key={company.surveyId} 
                          className={`px-2 py-3 text-center border-r border-gray-100 last:border-r-0 ${company.isFoundingPartner ? 'bg-amber-50/30' : 'bg-cyan-50/30'}`}
                          style={{ minWidth: 110 }}>
                        {/* ENHANCED: Larger tier badges */}
                        <span 
                          className="inline-block px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap shadow-sm"
                          style={{ backgroundColor: tier.bg, color: tier.color }}
                        >
                          {tier.name}
                        </span>
                        {tier.isProvisional && (
                          <span className="block text-[10px] text-yellow-600 mt-1 font-semibold">*Provisional</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* ENHANCED: Collapsible Legend */}
        <div className="mt-6 bg-white rounded-xl shadow overflow-hidden print:mt-4">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span>📋</span>
              Scoring Legend
            </h3>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${showLegend ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showLegend && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Point Values</h4>
                  <ul className="space-y-0.5 text-gray-600">
                    <li>Currently Offer = 5 pts</li>
                    <li>Planning = 3 pts</li>
                    <li>Assessing = 2 pts</li>
                    <li>Not Able / Unsure = 0 pts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Geo Multiplier</h4>
                  <ul className="space-y-0.5 text-gray-600">
                    <li>Consistent = 1.00x</li>
                    <li>Varies = 0.90x</li>
                    <li>Select Only = 0.75x</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Performance Tiers</h4>
                  <ul className="space-y-0.5 text-gray-600">
                    <li><span className="text-green-700">Exemplary</span>: 90-100</li>
                    <li><span className="text-blue-700">Leading</span>: 75-89</li>
                    <li><span className="text-orange-600">Progressing</span>: 60-74</li>
                    <li><span className="text-red-700">Emerging</span>: 40-59</li>
                    <li><span className="text-gray-600">Beginning</span>: 0-39</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Index Mode (100=Avg)</h4>
                  <ul className="space-y-0.5 text-gray-600">
                    <li><span className="text-green-800">≥120</span> = Excellent</li>
                    <li><span className="text-green-600">≥110</span> = Strong</li>
                    <li><span className="text-blue-600">≥100</span> = At/Above Avg</li>
                    <li><span className="text-orange-600">≥90</span> = Below Avg</li>
                    <li><span className="text-red-600">&lt;90</span> = Gap</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Data Quality</h4>
                  <ul className="space-y-0.5 text-gray-600">
                    <li className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      = &gt;40% Unsure
                    </li>
                    <li><span className="text-red-600 font-bold">Provisional</span> = 4+ dims</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Company Types</h4>
                  <ul className="space-y-0.5 text-gray-600">
                    <li><span className="bg-indigo-100 px-1 rounded">ALL</span> = All (benchmark)</li>
                    <li><span className="bg-amber-200 px-1 rounded text-amber-900">⭐ FP</span> = Founding Partners</li>
                    <li><span className="bg-cyan-200 px-1 rounded text-cyan-900">STD</span> = Standard</li>
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-gray-400">
                Toggle Scores/Index view in header. Click dimensions to view items. Company count updates live as participants complete assessments.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:mt-4 { margin-top: 1rem !important; }
          table { font-size: 9px !important; }
          th, td { padding: 4px 6px !important; }
        }
      `}</style>
    </div>
  );
}
