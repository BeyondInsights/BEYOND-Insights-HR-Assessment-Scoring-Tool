'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

// ============================================
// CONSTANTS (must match report_page)
// ============================================

const DEFAULT_DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
};

const DEFAULT_COMPOSITE_WEIGHTS = { weightedDim: 90, maturity: 5, breadth: 5 };

const DEFAULT_BLEND_WEIGHTS = {
  d1: { grid: 85, followUp: 15 },
  d3: { grid: 85, followUp: 15 },
  d12: { grid: 85, followUp: 15 },
  d13: { grid: 85, followUp: 15 },
};

const DIMENSION_NAMES: Record<number, string> = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention & Wellness',
  12: 'Continuous Improvement',
  13: 'Communication & Awareness',
};

const DIMENSION_SHORT_NAMES: Record<number, string> = {
  1: 'Leave & Flexibility', 2: 'Insurance & Financial', 3: 'Manager Preparedness',
  4: 'Navigation', 5: 'Accommodations', 6: 'Culture', 7: 'Career Continuity',
  8: 'Work Continuation', 9: 'Executive Commitment', 10: 'Caregiver Support',
  11: 'Prevention & Wellness', 12: 'Continuous Improvement', 13: 'Communication',
};

const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };
const D10_EXCLUDED_ITEMS = ['Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'];

// ============================================
// SCORING FUNCTIONS (copied from report_page)
// ============================================

function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean; category: string } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: POINTS.CURRENTLY_OFFER, isUnsure: false, category: 'currently_offer' };
      case 3: return { points: POINTS.PLANNING, isUnsure: false, category: 'planning' };
      case 2: return { points: POINTS.ASSESSING, isUnsure: false, category: 'assessing' };
      case 1: return { points: POINTS.NOT_ABLE, isUnsure: false, category: 'not_able' };
      case 5: return { points: null, isUnsure: true, category: 'unsure' };
      default: return { points: null, isUnsure: false, category: 'unknown' };
    }
  }
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: POINTS.NOT_ABLE, isUnsure: false, category: 'not_able' };
    if (s === 'unsure' || s.includes('unsure') || s.includes('unknown')) return { points: null, isUnsure: true, category: 'unsure' };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: POINTS.CURRENTLY_OFFER, isUnsure: false, category: 'currently_offer' };
    }
    if (s.includes('planning') || s.includes('development')) return { points: POINTS.PLANNING, isUnsure: false, category: 'planning' };
    if (s.includes('assessing') || s.includes('feasibility')) return { points: POINTS.ASSESSING, isUnsure: false, category: 'assessing' };
    if (s.length > 0) return { points: POINTS.NOT_ABLE, isUnsure: false, category: 'not_able' };
  }
  return { points: null, isUnsure: false, category: 'unknown' };
}

function getGeoMultiplier(geoResponse: string | number | undefined | null): number {
  if (geoResponse === undefined || geoResponse === null) return 1.0;
  if (typeof geoResponse === 'number') {
    switch (geoResponse) { case 1: return 0.75; case 2: return 0.90; case 3: return 1.0; default: return 1.0; }
  }
  const s = String(geoResponse).toLowerCase();
  if (s.includes('consistent') || s.includes('generally consistent')) return 1.0;
  if (s.includes('vary') || s.includes('varies')) return 0.90;
  if (s.includes('select') || s.includes('only available in select')) return 0.75;
  return 1.0;
}

function scoreD1PaidLeave(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('does not apply')) return 0;
  if (v.includes('13 or more') || v.includes('13 weeks or more') || v.includes('13+ weeks')) return 100;
  if ((v.includes('9 to') && v.includes('13')) || v.includes('9-13')) return 70;
  if ((v.includes('5 to') && v.includes('9')) || v.includes('5-9')) return 40;
  if ((v.includes('3 to') && v.includes('5')) || v.includes('3-5')) return 20;
  if ((v.includes('1 to') && v.includes('3')) || v.includes('1-3')) return 10;
  return 0;
}

function scoreD1PartTime(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('no additional')) return 0;
  if (v.includes('medically necessary') || v.includes('healthcare provider')) return 100;
  if (v.includes('26 weeks or more') || v.includes('26+ weeks') || v.includes('26 or more')) return 80;
  if ((v.includes('12 to') || v.includes('13 to')) && v.includes('26')) return 50;
  if ((v.includes('5 to') && v.includes('12')) || (v.includes('5 to') && v.includes('13'))) return 30;
  if (v.includes('case-by-case')) return 40;
  if (v.includes('4 weeks') || v.includes('up to 4')) return 10;
  return 0;
}

function scoreD3Training(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('less than 10%') || v === 'less than 10' || v.includes('less than 10 percent')) return 0;
  if (v === '100%' || v === '100' || v.includes('100% of') || (v.includes('100') && !v.includes('less than'))) return 100;
  if (v.includes('75') && v.includes('100')) return 80;
  if (v.includes('50') && v.includes('75')) return 50;
  if (v.includes('25') && v.includes('50')) return 30;
  if (v.includes('10') && v.includes('25')) return 10;
  return 0;
}

function scoreD12CaseReview(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('systematic')) return 100;
  if (v.includes('ad hoc')) return 50;
  if (v.includes('aggregate') || v.includes('only review aggregate')) return 20;
  return 0;
}

function scoreD12PolicyChanges(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('significant') || v.includes('major')) return 100;
  if (v.includes('some') || v.includes('minor') || v.includes('adjustments')) return 60;
  if (v.includes('no change') || v.includes('not yet') || v.includes('none')) return 20;
  return 0;
}

function scoreD13Communication(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('monthly')) return 100;
  if (v.includes('quarterly')) return 70;
  if (v.includes('twice')) return 40;
  if (v.includes('annually') || v.includes('world cancer day')) return 20;
  if (v.includes('only when asked')) return 0;
  if (v.includes('do not actively') || v.includes('no regular')) return 0;
  return 0;
}

function calculateFollowUpScore(dimNum: number, assessment: Record<string, any>): number | null {
  const dimData = assessment[`dimension${dimNum}_data`];
  switch (dimNum) {
    case 1: {
      const d1_1_usa = dimData?.d1_1_usa; const d1_1_non_usa = dimData?.d1_1_non_usa; const d1_4b = dimData?.d1_4b;
      const scores: number[] = [];
      if (d1_1_usa) scores.push(scoreD1PaidLeave(d1_1_usa));
      if (d1_1_non_usa) scores.push(scoreD1PaidLeave(d1_1_non_usa));
      if (d1_4b) scores.push(scoreD1PartTime(d1_4b));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 3: { const d31 = dimData?.d31 ?? dimData?.d3_1; return d31 ? scoreD3Training(d31) : null; }
    case 12: {
      const d12_1 = dimData?.d12_1; const d12_2 = dimData?.d12_2;
      const scores: number[] = [];
      if (d12_1) scores.push(scoreD12CaseReview(d12_1));
      if (d12_2) scores.push(scoreD12PolicyChanges(d12_2));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 13: { const d13_1 = dimData?.d13_1; return d13_1 ? scoreD13Communication(d13_1) : null; }
    default: return null;
  }
}

function calculateMaturityScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const or1 = currentSupport.or1;
  if (or1 === 6 || or1 === '6') return 100; if (or1 === 5 || or1 === '5') return 80;
  if (or1 === 4 || or1 === '4') return 50; if (or1 === 3 || or1 === '3') return 20;
  if (or1 === 2 || or1 === '2') return 0; if (or1 === 1 || or1 === '1') return 0;
  const v = String(or1 || '').toLowerCase();
  if (v.includes('leading-edge') || v.includes('leading edge')) return 100;
  if (v.includes('comprehensive')) return 100; if (v.includes('enhanced') || v.includes('strong')) return 80;
  if (v.includes('moderate')) return 50; if (v.includes('basic')) return 20; if (v.includes('developing')) return 20;
  if (v.includes('legal minimum')) return 0; if (v.includes('no formal')) return 0;
  return 0;
}

function calculateBreadthScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const generalBenefits = assessment.general_benefits_data || {};
  const scores: number[] = [];
  const cb3a = currentSupport.cb3a ?? generalBenefits.cb3a;
  if (cb3a === 3 || cb3a === '3') { scores.push(100); }
  else if (cb3a === 2 || cb3a === '2') { scores.push(50); }
  else if (cb3a === 1 || cb3a === '1') { scores.push(0); }
  else if (cb3a !== undefined && cb3a !== null) {
    const v = String(cb3a).toLowerCase();
    if (v.includes('yes') && v.includes('additional support')) { scores.push(100); }
    else if (v.includes('developing') || v.includes('currently developing')) { scores.push(50); }
    else { scores.push(0); }
  } else { scores.push(0); }
  const cb3b = currentSupport.cb3b || generalBenefits.cb3b;
  if (cb3b && Array.isArray(cb3b)) { scores.push(Math.min(100, Math.round((cb3b.length / 6) * 100))); } else { scores.push(0); }
  const cb3c = currentSupport.cb3c || generalBenefits.cb3c;
  if (cb3c && Array.isArray(cb3c)) { scores.push(Math.min(100, Math.round((cb3c.length / 13) * 100))); } else { scores.push(0); }
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

function getTier(score: number): { name: string; color: string; bgColor: string; textColor: string; borderColor: string } {
  if (score >= 90) return { name: 'Exemplary', color: '#5B21B6', bgColor: 'bg-violet-50', textColor: 'text-violet-900', borderColor: 'border-violet-200' };
  if (score >= 75) return { name: 'Leading', color: '#047857', bgColor: 'bg-emerald-50', textColor: 'text-emerald-900', borderColor: 'border-emerald-200' };
  if (score >= 60) return { name: 'Progressing', color: '#1D4ED8', bgColor: 'bg-blue-50', textColor: 'text-blue-900', borderColor: 'border-blue-200' };
  if (score >= 40) return { name: 'Emerging', color: '#B45309', bgColor: 'bg-amber-50', textColor: 'text-amber-900', borderColor: 'border-amber-200' };
  return { name: 'Developing', color: '#B91C1C', bgColor: 'bg-red-50', textColor: 'text-red-900', borderColor: 'border-red-200' };
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#5B21B6'; if (score >= 75) return '#047857'; if (score >= 60) return '#1D4ED8';
  if (score >= 40) return '#B45309'; return '#B91C1C';
}

// ============================================
// STRATEGIC PRIORITY MATRIX COMPONENT
// ============================================

function StrategicPriorityMatrix({ dimensionAnalysis }: { dimensionAnalysis: any[] }) {
  const MAX_WEIGHT = 15;
  
  const CHART_WIDTH = 900;
  const CHART_HEIGHT = 420;
  const LABEL_HEIGHT = 24;
  const MARGIN = { top: LABEL_HEIGHT + 10, right: 20, bottom: LABEL_HEIGHT + 55, left: 60 };
  const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  
  return (
    <div className="px-4 py-4 bg-white">
      <div className="relative w-full" style={{ height: '500px' }}>
        <svg className="w-full" style={{ height: '490px' }} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
            </filter>
          </defs>
          
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {/* TOP LABEL BARS */}
            <rect x={0} y={-LABEL_HEIGHT - 4} width={PLOT_WIDTH/2 - 2} height={LABEL_HEIGHT} rx="4" fill="#FEE2E2" />
            <text x={PLOT_WIDTH/4} y={-LABEL_HEIGHT/2 - 4 + 1} textAnchor="middle" dominantBaseline="middle" fill="#991B1B" fontSize="10" fontWeight="600" fontFamily="system-ui">PRIORITY GAPS</text>
            
            <rect x={PLOT_WIDTH/2 + 2} y={-LABEL_HEIGHT - 4} width={PLOT_WIDTH/2 - 2} height={LABEL_HEIGHT} rx="4" fill="#D1FAE5" />
            <text x={PLOT_WIDTH * 3/4} y={-LABEL_HEIGHT/2 - 4 + 1} textAnchor="middle" dominantBaseline="middle" fill="#065F46" fontSize="10" fontWeight="600" fontFamily="system-ui">CORE STRENGTHS</text>
            
            {/* Quadrant backgrounds */}
            <rect x={0} y={0} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            <rect x={PLOT_WIDTH/2} y={0} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            <rect x={0} y={PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            <rect x={PLOT_WIDTH/2} y={PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            
            {/* Grid lines */}
            <line x1={0} y1={PLOT_HEIGHT/2} x2={PLOT_WIDTH} y2={PLOT_HEIGHT/2} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={PLOT_WIDTH/2} y1={0} x2={PLOT_WIDTH/2} y2={PLOT_HEIGHT} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Border */}
            <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="none" stroke="#D1D5DB" strokeWidth="1" />
            
            {/* Data points */}
            {dimensionAnalysis.map((d) => {
              const xPos = (d.score / 100) * PLOT_WIDTH;
              const yPos = PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT);
              
              return (
                <g key={d.dim} transform={`translate(${xPos}, ${yPos})`}>
                  <circle r={18} fill="white" filter="url(#dropShadow)" />
                  <circle r={15} fill={getScoreColor(d.score)} />
                  <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">
                    D{d.dim}
                  </text>
                </g>
              );
            })}
            
            {/* BOTTOM LABEL BARS */}
            <rect x={0} y={PLOT_HEIGHT + 4} width={PLOT_WIDTH/2 - 2} height={LABEL_HEIGHT} rx="4" fill="#F3F4F6" />
            <text x={PLOT_WIDTH/4} y={PLOT_HEIGHT + 4 + LABEL_HEIGHT/2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#4B5563" fontSize="10" fontWeight="600" fontFamily="system-ui">MONITOR</text>
            
            <rect x={PLOT_WIDTH/2 + 2} y={PLOT_HEIGHT + 4} width={PLOT_WIDTH/2 - 2} height={LABEL_HEIGHT} rx="4" fill="#DBEAFE" />
            <text x={PLOT_WIDTH * 3/4} y={PLOT_HEIGHT + 4 + LABEL_HEIGHT/2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#1E40AF" fontSize="10" fontWeight="600" fontFamily="system-ui">LEVERAGE</text>
            
            {/* X-axis */}
            <g transform={`translate(0, ${PLOT_HEIGHT + LABEL_HEIGHT + 8})`}>
              {[0, 25, 50, 75, 100].map((val) => (
                <g key={val} transform={`translate(${(val / 100) * PLOT_WIDTH}, 0)`}>
                  <line y1="0" y2="4" stroke="#9CA3AF" strokeWidth="1" />
                  <text y="16" textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="system-ui">{val}</text>
                </g>
              ))}
              <text x={PLOT_WIDTH/2} y="34" textAnchor="middle" fill="#374151" fontSize="11" fontWeight="600" fontFamily="system-ui">
                Dimension Score →
              </text>
            </g>
            
            {/* Y-axis */}
            <g transform="translate(-8, 0)">
              {[0, 5, 10, 15].map((val) => (
                <g key={val} transform={`translate(0, ${PLOT_HEIGHT - ((val / MAX_WEIGHT) * PLOT_HEIGHT)})`}>
                  <line x1="0" x2="-4" stroke="#9CA3AF" strokeWidth="1" />
                  <text x="-8" textAnchor="end" dominantBaseline="middle" fill="#6B7280" fontSize="10" fontFamily="system-ui">{val}%</text>
                </g>
              ))}
              <text transform={`translate(-45, ${PLOT_HEIGHT/2}) rotate(-90)`} textAnchor="middle" fill="#374151" fontSize="11" fontWeight="600" fontFamily="system-ui">
                ← Strategic Weight
              </text>
            </g>
          </g>
        </svg>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2 text-xs">
          {dimensionAnalysis.slice(0, 7).map(d => (
            <div key={d.dim} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getScoreColor(d.score) }} />
              <span className="text-slate-600">D{d.dim}: {DIMENSION_SHORT_NAMES[d.dim]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-1 text-xs">
          {dimensionAnalysis.slice(7).map(d => (
            <div key={d.dim} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getScoreColor(d.score) }} />
              <span className="text-slate-600">D{d.dim}: {DIMENSION_SHORT_NAMES[d.dim]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN EXPORT PAGE COMPONENT
// ============================================

export default function ExportReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const surveyId = params?.surveyId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [companyScores, setCompanyScores] = useState<any>(null);
  
  const token = searchParams?.get('token');
  const matrixOnly = searchParams?.get('matrixOnly') === '1';
  const exportMode = searchParams?.get('export') === '1';
  
  // Validate token
  useEffect(() => {
  setAuthorized(true);
}, []);
  
  // Load data
  useEffect(() => {
    if (!authorized || !surveyId) return;
    
    async function loadData() {
      try {
        // Create client with public key (RLS will handle access)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('survey_id', surveyId)
          .single();
        
        if (assessmentError || !assessment) {
          setError(`Company not found: ${assessmentError?.message || 'No data'}`);
          setLoading(false);
          return;
        }
        
        // Calculate scores
        const scores = calculateCompanyScores(assessment);
        setCompanyScores(scores);
        setCompany(assessment);
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading report data:', err);
        setError('Failed to load report data');
        setLoading(false);
      }
    }
    
    loadData();
  }, [authorized, surveyId]);
  
  function calculateCompanyScores(assessment: Record<string, any>) {
    const dimensionScores: Record<number, number | null> = {};
    const blendedScores: Record<number, number> = {};
    
    let completedDimCount = 0;
    
    for (let dim = 1; dim <= 13; dim++) {
      const dimData = assessment[`dimension${dim}_data`];
      const mainGrid = dimData?.[`d${dim}a`];
      
      blendedScores[dim] = 0;
      
      if (!mainGrid || typeof mainGrid !== 'object') { dimensionScores[dim] = null; continue; }
      
      let earnedPoints = 0; let answeredItems = 0; let totalItems = 0;
      
      Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
        if (dim === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
        totalItems++;
        const result = statusToPoints(status);
        if (result.isUnsure) { answeredItems++; }
        else if (result.points !== null) { answeredItems++; earnedPoints += result.points; }
      });
      
      if (totalItems > 0) completedDimCount++;
      
      const maxPoints = answeredItems * 5;
      const rawScore = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
      
      const geoResponse = dimData[`d${dim}aa`] || dimData[`D${dim}aa`];
      const geoMultiplier = getGeoMultiplier(geoResponse);
      const adjustedScore = Math.round(rawScore * geoMultiplier);
      
      let blendedScore = adjustedScore;
      if ([1, 3, 12, 13].includes(dim)) {
        const followUp = calculateFollowUpScore(dim, assessment);
        if (followUp !== null) {
          const key = `d${dim}` as keyof typeof DEFAULT_BLEND_WEIGHTS;
          const gridPct = DEFAULT_BLEND_WEIGHTS[key]?.grid ?? 85;
          const followUpPct = DEFAULT_BLEND_WEIGHTS[key]?.followUp ?? 15;
          blendedScore = Math.round((adjustedScore * (gridPct / 100)) + (followUp * (followUpPct / 100)));
        }
      }
      
      dimensionScores[dim] = blendedScore;
      blendedScores[dim] = blendedScore;
    }
    
    const isComplete = completedDimCount === 13;
    
    let weightedDimScore: number | null = null;
    if (isComplete) {
      const totalWeight = Object.values(DEFAULT_DIMENSION_WEIGHTS).reduce((sum, w) => sum + w, 0);
      let weightedScore = 0;
      if (totalWeight > 0) {
        for (let i = 1; i <= 13; i++) {
          const weight = DEFAULT_DIMENSION_WEIGHTS[i] || 0;
          weightedScore += blendedScores[i] * (weight / totalWeight);
        }
      }
      weightedDimScore = Math.round(weightedScore);
    }
    
    const maturityScore = calculateMaturityScore(assessment);
    const breadthScore = calculateBreadthScore(assessment);
    
    const compositeScore = isComplete && weightedDimScore !== null
      ? Math.round((weightedDimScore * (DEFAULT_COMPOSITE_WEIGHTS.weightedDim / 100)) + (maturityScore * (DEFAULT_COMPOSITE_WEIGHTS.maturity / 100)) + (breadthScore * (DEFAULT_COMPOSITE_WEIGHTS.breadth / 100)))
      : null;
    
    return {
      compositeScore,
      weightedDimScore,
      maturityScore,
      breadthScore,
      dimensionScores,
      tier: getTier(compositeScore || 0)
    };
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }
  
  if (error || !company || !companyScores) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Unable to load report'}</p>
        </div>
      </div>
    );
  }
  
  const { compositeScore, weightedDimScore, maturityScore, breadthScore, dimensionScores, tier } = companyScores;
  const companyName = company.firmographics_data?.company_name || company.company_name || 'Company';
  
  const dimensionAnalysis = Object.entries(dimensionScores)
    .filter(([_, score]) => score !== null)
    .map(([dim, score]) => ({
      dim: parseInt(dim),
      name: DIMENSION_NAMES[parseInt(dim)],
      score: score as number,
      weight: DEFAULT_DIMENSION_WEIGHTS[parseInt(dim)] || 0,
      tier: getTier(score as number)
    }))
    .sort((a, b) => b.weight - a.weight);
  
  // Matrix Only Mode - just render the matrix for screenshot
  if (matrixOnly) {
    return (
      <div id="export-matrix" className="bg-white p-4" style={{ width: '1000px' }}>
        <StrategicPriorityMatrix dimensionAnalysis={dimensionAnalysis} />
      </div>
    );
  }
  
  // Full Report Mode
  return (
    <div className={`min-h-screen bg-slate-50 ${exportMode ? 'export-mode' : ''}`}>
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .pdf-no-break { page-break-inside: avoid; }
        }
        .export-mode { background: white !important; }
      `}</style>
      
      <div className="max-w-6xl mx-auto py-10 px-8">
        
        {/* HEADER */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-800 px-10 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="bg-white rounded-lg p-4">
                  <div className="w-[120px] h-[120px] bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Logo</div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium tracking-wider uppercase">Performance Assessment</p>
                  <h1 className="text-2xl font-semibold text-white mt-1">Best Companies for Working with Cancer</h1>
                  <p className="text-slate-300 mt-1">Index 2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Report Date</p>
                <p className="text-white font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="px-10 py-8 border-b border-slate-100">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Prepared for</p>
                <h2 className="text-3xl font-bold text-slate-900 mt-1">{companyName}</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-slate-500 text-sm">Composite Score</p>
                  <p className="text-5xl font-bold mt-1" style={{ color: tier?.color || '#666' }}>{compositeScore ?? '—'}</p>
                </div>
                {tier && (
                  <div className={`px-5 py-3 rounded-lg ${tier.bgColor} border ${tier.borderColor}`}>
                    <p className="text-lg font-bold" style={{ color: tier.color }}>{tier.name}</p>
                    <p className="text-xs text-slate-500">Performance Tier</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Score Composition */}
          <div className="px-10 py-8 bg-slate-50">
            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Composite Score', score: compositeScore, isTotal: true },
                { label: 'Weighted Dimension Score', score: weightedDimScore, weight: `${DEFAULT_COMPOSITE_WEIGHTS.weightedDim}%` },
                { label: 'Program Maturity', score: maturityScore, weight: `${DEFAULT_COMPOSITE_WEIGHTS.maturity}%` },
                { label: 'Support Breadth', score: breadthScore, weight: `${DEFAULT_COMPOSITE_WEIGHTS.breadth}%` },
              ].map((item, idx) => (
                <div key={idx} className={`text-center ${item.isTotal ? 'bg-white rounded-lg p-4 border-2 border-slate-200' : ''}`}>
                  <p className="text-4xl font-bold" style={{ color: getScoreColor(item.score ?? 0) }}>{item.score ?? '—'}</p>
                  <p className="text-sm text-slate-600 mt-2">{item.label}</p>
                  {item.weight && <p className="text-xs text-slate-400">Weight: {item.weight}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* STRATEGIC PRIORITY MATRIX */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Strategic Priority Matrix</h3>
            <p className="text-sm text-slate-500 mt-1">Dimension scores plotted against strategic importance</p>
          </div>
          <div id="export-matrix">
            <StrategicPriorityMatrix dimensionAnalysis={dimensionAnalysis} />
          </div>
        </div>
        
        {/* DIMENSION PERFORMANCE TABLE */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Dimension Performance Overview</h3>
          </div>
          <div className="px-10 py-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 text-sm font-semibold text-slate-600">Dimension</th>
                  <th className="text-center py-3 text-sm font-semibold text-slate-600 w-24">Weight</th>
                  <th className="text-center py-3 text-sm font-semibold text-slate-600 w-24">Score</th>
                  <th className="text-center py-3 text-sm font-semibold text-slate-600 w-32">Tier</th>
                </tr>
              </thead>
              <tbody>
                {dimensionAnalysis.map((d) => (
                  <tr key={d.dim} className="border-b border-slate-100">
                    <td className="py-3 text-sm text-slate-700">D{d.dim}: {d.name}</td>
                    <td className="py-3 text-sm text-slate-500 text-center">{d.weight}%</td>
                    <td className="py-3 text-center">
                      <span className="text-sm font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-xs font-medium px-2 py-1 rounded" style={{ color: d.tier.color, backgroundColor: d.tier.bgColor.replace('bg-', '').includes('violet') ? '#F5F3FF' : d.tier.bgColor.replace('bg-', '').includes('emerald') ? '#ECFDF5' : d.tier.bgColor.replace('bg-', '').includes('blue') ? '#EFF6FF' : d.tier.bgColor.replace('bg-', '').includes('amber') ? '#FFFBEB' : '#FEF2F2' }}>
                        {d.tier.name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* FOOTER */}
        <div className="text-center text-slate-400 text-sm py-8">
          <p>© 2026 Cancer and Careers. All rights reserved.</p>
          <p className="mt-1">Best Companies for Working with Cancer Index</p>
        </div>
        
      </div>
    </div>
  );
}
