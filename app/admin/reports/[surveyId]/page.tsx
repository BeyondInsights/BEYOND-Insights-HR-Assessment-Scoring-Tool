'use client';

import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { calculateEnhancedScore } from '@/lib/enhanced-scoring';
import { exportHybridPptx } from '@/components/PptxExportHybrid';

// Create Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// POLISHED DESIGN COMPONENTS (activated with ?design=polished)
// ============================================

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

function PolishedScoreComposition({ compositeScore, weightedDimScore, maturityScore, breadthScore, benchmarks, getScoreColor }: any) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const components = [
    { id: 'weighted', label: 'Weighted Dimensions', score: weightedDimScore, weight: 90, benchmark: benchmarks?.weightedDimScore, description: 'Combined performance across all 13 support dimensions, weighted by strategic importance.' },
    { id: 'maturity', label: 'Program Maturity', score: maturityScore, weight: 5, benchmark: benchmarks?.maturityScore, description: 'Organizational maturity in supporting employees managing cancer.' },
    { id: 'breadth', label: 'Support Breadth', score: breadthScore, weight: 5, benchmark: benchmarks?.breadthScore, description: 'Extent of benefits beyond legal minimums.' },
  ];
  const benchDiff = compositeScore && benchmarks?.compositeScore ? compositeScore - benchmarks.compositeScore : null;
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
      <div className="px-8 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-900">Score Composition</h3><p className="text-sm text-slate-500 mt-0.5">How your composite score is calculated</p></div>
      <div className="p-8">
        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          <div className="text-center px-6 py-4 bg-slate-50 rounded-lg border-2 border-slate-200 min-w-[140px]"><p className="text-4xl font-bold" style={{ color: compositeScore ? getScoreColor(compositeScore) : '#94a3b8' }}>{compositeScore ?? '—'}</p><p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Composite</p></div>
          <span className="text-2xl text-slate-300 font-light">=</span>
          {components.map((comp, idx) => (<div key={comp.id} className="flex items-center gap-4"><div className="text-center px-4 py-3 bg-white rounded-lg border border-slate-200 min-w-[110px]"><p className="text-2xl font-semibold text-slate-700">{comp.score ?? '—'}</p><p className="text-xs text-slate-400 mt-0.5">{comp.label}</p><p className="text-xs text-slate-300">× {comp.weight}%</p></div>{idx < components.length - 1 && <span className="text-xl text-slate-300 font-light">+</span>}</div>))}
        </div>
        {benchmarks?.compositeScore && (<div className="flex items-center justify-center gap-6 py-3 px-4 bg-slate-50 rounded-lg border border-slate-100 mb-8 flex-wrap"><div className="flex items-center gap-2"><span className="text-sm text-slate-500">Your Score:</span><span className="text-sm font-semibold text-slate-800">{compositeScore}</span></div><div className="w-px h-4 bg-slate-300 hidden sm:block"></div><div className="flex items-center gap-2"><span className="text-sm text-slate-500">Peer Benchmark:</span><span className="text-sm font-medium text-slate-600">{benchmarks.compositeScore}</span></div><div className="w-px h-4 bg-slate-300 hidden sm:block"></div><div className="flex items-center gap-1"><span className={`text-sm font-semibold ${benchDiff && benchDiff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{benchDiff !== null ? `${benchDiff >= 0 ? '+' : ''}${benchDiff} pts` : '—'}</span><span className="text-xs text-slate-400">vs benchmark</span></div></div>)}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {components.map((comp) => { const isExpanded = expandedCard === comp.id; const diff = comp.score && comp.benchmark ? comp.score - comp.benchmark : null; return (
            <div key={comp.id} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700">{comp.label}</span><span className="text-xs text-slate-400 font-medium">{comp.weight}%</span></div></div>
              <div className="p-4"><p className="text-xs text-slate-500 mb-4 leading-relaxed">{comp.description}</p><div className="space-y-2"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">Your Score</span><span className="text-lg font-semibold text-slate-800">{comp.score ?? '—'}<span className="text-sm text-slate-400 font-normal"> / 100</span></span></div>{comp.benchmark !== null && comp.benchmark !== undefined && (<div className="flex items-center justify-between pt-2 border-t border-slate-100"><span className="text-xs text-slate-400">vs. Benchmark</span><span className={`text-sm font-medium ${diff && diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{diff !== null ? `${diff >= 0 ? '+' : ''}${diff}` : '—'} <span className="text-slate-400 font-normal">({comp.benchmark})</span></span></div>)}</div>
              <button onClick={() => setExpandedCard(isExpanded ? null : comp.id)} className="w-full mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-600">{isExpanded ? 'Hide' : 'Show'} details {isExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}</button></div>
              {isExpanded && (<div className="px-4 pb-4 bg-slate-50 border-t border-slate-100"><div className="rounded border border-slate-200 bg-white overflow-hidden mt-3"><table className="w-full text-xs"><thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left px-3 py-2 font-medium text-slate-500">Response</th><th className="text-center px-2 py-2 font-medium text-slate-500">Bench</th><th className="text-right px-3 py-2 font-medium text-slate-500">Pts</th></tr></thead><tbody className="divide-y divide-slate-100">{comp.id === 'maturity' && (<><tr className={maturityScore === 100 ? 'bg-emerald-50' : ''}><td className="px-3 py-2">{maturityScore === 100 ? '✓ ' : ''}Comprehensive</td><td className="text-center px-2 py-2 text-slate-400">15%</td><td className="text-right px-3 py-2">100</td></tr><tr className={maturityScore === 80 ? 'bg-emerald-50' : ''}><td className="px-3 py-2">{maturityScore === 80 ? '✓ ' : ''}Enhanced</td><td className="text-center px-2 py-2 text-slate-400">22%</td><td className="text-right px-3 py-2">80</td></tr><tr className={maturityScore === 50 ? 'bg-emerald-50' : ''}><td className="px-3 py-2">{maturityScore === 50 ? '✓ ' : ''}Moderate</td><td className="text-center px-2 py-2 text-slate-400">35%</td><td className="text-right px-3 py-2">50</td></tr><tr className={maturityScore === 20 ? 'bg-amber-50' : ''}><td className="px-3 py-2">{maturityScore === 20 ? '✓ ' : ''}Developing</td><td className="text-center px-2 py-2 text-slate-400">18%</td><td className="text-right px-3 py-2">20</td></tr><tr className={maturityScore === 0 ? 'bg-red-50' : ''}><td className="px-3 py-2">{maturityScore === 0 ? '✓ ' : ''}Minimum/None</td><td className="text-center px-2 py-2 text-slate-400">10%</td><td className="text-right px-3 py-2">0</td></tr></>)}{comp.id === 'breadth' && (<><tr className={breadthScore >= 80 ? 'bg-emerald-50' : ''}><td className="px-3 py-2">{breadthScore >= 80 ? '✓ ' : ''}Beyond legal</td><td className="text-center px-2 py-2 text-slate-400">45%</td><td className="text-right px-3 py-2">100</td></tr><tr className={breadthScore >= 40 && breadthScore < 80 ? 'bg-amber-50' : ''}><td className="px-3 py-2">{breadthScore >= 40 && breadthScore < 80 ? '✓ ' : ''}Developing</td><td className="text-center px-2 py-2 text-slate-400">30%</td><td className="text-right px-3 py-2">50</td></tr><tr className={breadthScore < 40 ? 'bg-red-50' : ''}><td className="px-3 py-2">{breadthScore < 40 ? '✓ ' : ''}Minimum only</td><td className="text-center px-2 py-2 text-slate-400">25%</td><td className="text-right px-3 py-2">0</td></tr></>)}{comp.id === 'weighted' && (<tr><td colSpan={3} className="px-3 py-3 text-slate-500 text-center">From 13 dimensions × strategic weights</td></tr>)}</tbody></table></div></div>)}
            </div>); })}
        </div>
      </div>
    </div>
  );
}

function PolishedDimensionTable({ dimensionAnalysis, getScoreColor }: any) {
  const sorted = [...dimensionAnalysis].sort((a: any, b: any) => b.weight - a.weight);
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
      <div className="px-8 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-900">Dimension Performance</h3><p className="text-sm text-slate-500 mt-0.5">Sorted by strategic weight (most important first)</p></div>
      <div className="px-8 py-4">
        <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-200"><div className="w-6 text-center text-xs font-medium text-slate-400 uppercase">#</div><div className="flex-1 text-xs font-medium text-slate-400 uppercase">Dimension</div><div className="w-10 text-center text-xs font-medium text-slate-400 uppercase">Wt</div><div className="w-48 text-center text-xs font-medium text-slate-400 uppercase">Score</div><div className="w-12 text-right text-xs font-medium text-slate-400 uppercase">Score</div><div className="w-20 text-center text-xs font-medium text-slate-400 uppercase">vs Avg</div><div className="w-24 text-center text-xs font-medium text-slate-400 uppercase">Tier</div></div>
        <div className="divide-y divide-slate-100">{sorted.map((d: any, idx: number) => { const diff = d.benchmark !== null ? d.score - d.benchmark : null; return (
          <div key={d.dim} className={`flex items-center gap-3 py-3 ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
            <div className="w-6 flex justify-center"><span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: d.tier.color }}>{d.dim}</span></div>
            <div className="flex-1"><span className="text-sm text-slate-700">{d.name}</span></div>
            <div className="w-10 text-center"><span className="text-xs text-slate-400">{d.weight}%</span></div>
            <div className="w-48"><div className="relative h-3 bg-slate-100 rounded-full overflow-visible"><div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.min(d.score, 100)}%`, backgroundColor: d.tier.color }} />{d.benchmark !== null && (<div className="absolute -top-1" style={{ left: `${Math.min(d.benchmark, 100)}%`, transform: 'translateX(-50%)' }}><div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-slate-500" /></div>)}</div></div>
            <div className="w-12 text-right"><span className="text-sm font-semibold" style={{ color: d.tier.color }}>{d.score}</span></div>
            <div className="w-20 text-center">{d.benchmark !== null ? (<span className="text-xs"><span className="text-slate-400">{d.benchmark}</span><span className={`ml-1 font-medium ${diff !== null && diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>({diff !== null && diff >= 0 ? '+' : ''}{diff})</span></span>) : <span className="text-xs text-slate-300">—</span>}</div>
            <div className="w-24 flex justify-center"><span className={`text-xs font-medium px-2.5 py-1 rounded ${d.tier.bgColor} border ${d.tier.borderColor}`} style={{ color: d.tier.color }}>{d.tier.name}</span></div>
          </div>); })}</div>
        <div className="flex items-center justify-end gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400"><span>Scores out of 100</span><span className="flex items-center gap-1"><span className="inline-block w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500"></span>Benchmark</span></div>
      </div>
    </div>
  );
}

function PolishedMatrix({ dimensionAnalysis, getScoreColor }: any) {
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [hoveredDim, setHoveredDim] = useState<number | null>(null);
  const MAX_WEIGHT = 15; const PADDING = 50; const CHART_WIDTH = 900; const CHART_HEIGHT = 480;
  const PLOT_WIDTH = CHART_WIDTH - (PADDING * 2); const PLOT_HEIGHT = CHART_HEIGHT - (PADDING * 2);
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
      <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4"><div><h3 className="font-semibold text-slate-900">Strategic Priority Matrix</h3><p className="text-sm text-slate-500 mt-0.5">Performance vs. strategic weight</p></div><label className="flex items-center gap-2 cursor-pointer select-none"><span className="text-sm text-slate-500">Show benchmarks</span><button onClick={() => setShowBenchmarks(!showBenchmarks)} className={`relative w-10 h-5 rounded-full transition-colors ${showBenchmarks ? 'bg-slate-700' : 'bg-slate-200'}`}><span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showBenchmarks ? 'translate-x-5' : ''}`} /></button></label></div>
      <div className="p-6"><div className="relative w-full" style={{ maxWidth: '950px', margin: '0 auto' }}>
        <svg className="w-full" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 60}`} preserveAspectRatio="xMidYMid meet">
          <defs><filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15"/></filter></defs>
          <g transform="translate(0, 10)">
            <rect x={PADDING} y={PADDING} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FFFBEB" opacity="0.4" />
            <rect x={PADDING + PLOT_WIDTH/2} y={PADDING} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#ECFDF5" opacity="0.4" />
            <rect x={PADDING} y={PADDING + PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#F8FAFC" />
            <rect x={PADDING + PLOT_WIDTH/2} y={PADDING + PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#EFF6FF" opacity="0.4" />
            <line x1={PADDING} y1={PADDING + PLOT_HEIGHT/2} x2={PADDING + PLOT_WIDTH} y2={PADDING + PLOT_HEIGHT/2} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />
            <line x1={PADDING + PLOT_WIDTH/2} y1={PADDING} x2={PADDING + PLOT_WIDTH/2} y2={PADDING + PLOT_HEIGHT} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />
            <rect x={PADDING} y={PADDING} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="none" stroke="#CBD5E1" strokeWidth="1" />
            <text x={PADDING + PLOT_WIDTH/4} y={PADDING + 20} textAnchor="middle" fill="#92400E" fontSize="11" fontWeight="500" opacity="0.6">PRIORITY OPPORTUNITIES</text>
            <text x={PADDING + PLOT_WIDTH*3/4} y={PADDING + 20} textAnchor="middle" fill="#065F46" fontSize="11" fontWeight="500" opacity="0.6">COMPETITIVE ADVANTAGES</text>
            <text x={PADDING + PLOT_WIDTH/4} y={PADDING + PLOT_HEIGHT - 10} textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="500" opacity="0.6">MONITOR</text>
            <text x={PADDING + PLOT_WIDTH*3/4} y={PADDING + PLOT_HEIGHT - 10} textAnchor="middle" fill="#1E40AF" fontSize="11" fontWeight="500" opacity="0.6">MAINTAIN & LEVERAGE</text>
            {showBenchmarks && dimensionAnalysis.map((d: any) => { if (d.benchmark === null) return null; const xPos = PADDING + (d.benchmark / 100) * PLOT_WIDTH; const yPos = PADDING + PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT); return (<g key={`bench-${d.dim}`} transform={`translate(${xPos}, ${yPos})`}><circle r="10" fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3,2" /></g>); })}
            {dimensionAnalysis.map((d: any) => { const xPos = PADDING + (d.score / 100) * PLOT_WIDTH; const yPos = PADDING + PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT); const isHovered = hoveredDim === d.dim; return (<g key={d.dim} transform={`translate(${xPos}, ${yPos})`} onMouseEnter={() => setHoveredDim(d.dim)} onMouseLeave={() => setHoveredDim(null)} style={{ cursor: 'pointer' }}><circle r={isHovered ? 22 : 18} fill="white" filter="url(#dropShadow)" /><circle r={isHovered ? 18 : 15} fill={getScoreColor(d.score)} /><text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="600">D{d.dim}</text>{isHovered && (<g transform="translate(25, -10)"><rect x="0" y="-12" width="150" height="55" rx="4" fill="white" stroke="#E2E8F0" /><text x="8" y="2" fontSize="11" fontWeight="600" fill="#1E293B">{d.name}</text><text x="8" y="18" fontSize="10" fill="#64748B">Score: {d.score}</text>{d.benchmark !== null && <text x="8" y="34" fontSize="10" fill="#94A3B8">Benchmark: {d.benchmark}</text>}</g>)}</g>); })}
            <g transform={`translate(0, ${PADDING + PLOT_HEIGHT})`}>{[0, 25, 50, 75, 100].map((val) => (<g key={val} transform={`translate(${PADDING + (val / 100) * PLOT_WIDTH}, 0)`}><line y1="0" y2="5" stroke="#94A3B8" strokeWidth="1" /><text y="18" textAnchor="middle" fill="#64748B" fontSize="11">{val}</text></g>))}<text x={PADDING + PLOT_WIDTH/2} y="40" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="500">Performance Score →</text></g>
            <g transform={`translate(${PADDING}, 0)`}>{[0, 5, 10, 15].map((val) => (<g key={val} transform={`translate(0, ${PADDING + PLOT_HEIGHT - (val / MAX_WEIGHT) * PLOT_HEIGHT})`}><line x1="-5" x2="0" stroke="#94A3B8" strokeWidth="1" /><text x="-10" textAnchor="end" dominantBaseline="middle" fill="#64748B" fontSize="11">{val}%</text></g>))}</g>
            <text transform={`translate(15, ${PADDING + PLOT_HEIGHT/2}) rotate(-90)`} textAnchor="middle" fill="#475569" fontSize="12" fontWeight="500">Strategic Weight ↑</text>
          </g>
        </svg>
      </div>{showBenchmarks && (<div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-600"></span>Your score</span><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-slate-400 border-dashed"></span>Benchmark</span></div>)}</div>
    </div>
  );
}

function PolishedKeyTakeaways({ dimensionAnalysis, inProgressItems }: any) {
  const topStrength = dimensionAnalysis[0] || null;
  const biggestGap = [...dimensionAnalysis].sort((a: any, b: any) => a.score - b.score)[0] || null;
  const fastestWin = inProgressItems[0] || null;
  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Key Takeaways</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div><p className="text-xs text-slate-400 mb-1">Top Strength</p><p className="text-white font-medium">{topStrength?.name || '—'}</p>{topStrength && <p className="text-emerald-400 text-sm">Score: {topStrength.score}</p>}</div>
        <div><p className="text-xs text-slate-400 mb-1">Biggest Gap</p><p className="text-white font-medium">{biggestGap?.name || '—'}</p>{biggestGap && <p className="text-amber-400 text-sm">Score: {biggestGap.score}</p>}</div>
        <div><p className="text-xs text-slate-400 mb-1">Fastest Win</p><p className="text-white font-medium">{fastestWin?.name || '—'}</p>{fastestWin && <p className="text-sky-400 text-sm">{fastestWin.type} in {fastestWin.dimName}</p>}</div>
      </div>
    </div>
  );
}

function PolishedDimensionDrilldown({ dimension, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e: any) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: dimension.tier.color }}>{dimension.dim}</span><div><h3 className="font-semibold text-slate-900">{dimension.name}</h3><div className="flex items-center gap-3 mt-1"><span className="text-sm text-slate-500">Score: <span className="font-semibold" style={{ color: dimension.tier.color }}>{dimension.score}</span></span><span className={`text-xs font-medium px-2 py-0.5 rounded ${dimension.tier.bgColor}`} style={{ color: dimension.tier.color }}>{dimension.tier.name}</span></div></div></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2"><span className="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold bg-emerald-100 text-emerald-700">{dimension.strengths?.length || 0}</span><span className="text-xs text-slate-500">Offering</span></div>
            <div className="flex items-center gap-2"><span className="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold bg-blue-100 text-blue-700">{dimension.planning?.length || 0}</span><span className="text-xs text-slate-500">Planning</span></div>
            <div className="flex items-center gap-2"><span className="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold bg-violet-100 text-violet-700">{dimension.assessing?.length || 0}</span><span className="text-xs text-slate-500">Assessing</span></div>
            <div className="flex items-center gap-2"><span className="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold bg-slate-100 text-slate-700">{dimension.gaps?.length || 0}</span><span className="text-xs text-slate-500">Gaps</span></div>
          </div>
          <table className="w-full"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase">Element</th><th className="text-center py-2 px-3 text-xs font-medium text-slate-400 uppercase w-36">Status</th><th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase w-20">Pts</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{dimension.elements?.map((el: any, idx: number) => { let statusLabel = 'Unknown'; let statusClass = 'text-slate-400 bg-slate-50'; if (el.isStrength) { statusLabel = 'Offering'; statusClass = 'text-emerald-700 bg-emerald-50'; } else if (el.isPlanning) { statusLabel = 'Planning'; statusClass = 'text-blue-700 bg-blue-50'; } else if (el.isAssessing) { statusLabel = 'Assessing'; statusClass = 'text-violet-700 bg-violet-50'; } else if (el.isGap) { statusLabel = 'Gap'; statusClass = 'text-slate-500 bg-slate-50'; } else if (el.isUnsure) { statusLabel = 'Unsure'; statusClass = 'text-slate-400 bg-slate-50'; } return (<tr key={idx} className={idx % 2 === 0 ? '' : 'bg-slate-50/50'}><td className="py-2.5 px-3 text-sm text-slate-700">{el.name}</td><td className="py-2.5 px-3 text-center"><span className={`text-xs font-medium px-2 py-1 rounded ${statusClass}`}>{statusLabel}</span></td><td className="py-2.5 px-3 text-right text-sm font-medium text-slate-600">{el.points ?? '—'}</td></tr>); })}</tbody></table>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONSTANTS
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
// STRATEGIC INSIGHTS FOR EACH DIMENSION
// ============================================

const DIMENSION_STRATEGIC_INSIGHTS: Record<number, { insight: string; cacHelp: string }> = {
  1: {
    insight: "Leave policies form the foundation of cancer support. Without adequate time away from work, employees cannot focus on treatment and recovery. Gaps here create impossible choices between health and livelihood.",
    cacHelp: "Cancer and Careers can benchmark your leave policies against industry leaders, identify cost-effective enhancements, and help communicate existing benefits more effectively to increase utilization."
  },
  2: {
    insight: "Financial toxicity is a leading cause of treatment non-adherence. Comprehensive insurance and financial protection directly impacts whether employees can afford to get well and return to full productivity.",
    cacHelp: "Our team can conduct a benefits gap analysis, evaluate supplemental coverage options, and design financial wellness programs specifically for employees facing serious illness."
  },
  3: {
    insight: "Managers are the front line of support - they determine whether policies translate to lived experience. Without proper training, even excellent policies fail at the point of delivery.",
    cacHelp: "Cancer and Careers offers manager training programs with real-world scenarios, conversation guides, and ongoing coaching to build confidence in supporting team members through health challenges."
  },
  4: {
    insight: "Navigation is the multiplier - it determines whether employees can actually access the benefits you've invested in. Without clear pathways, benefits go unused and employees struggle alone.",
    cacHelp: "We specialize in designing single-entry-point navigation systems, resource mapping, and communication strategies that maximize utilization of existing benefits investments."
  },
  5: {
    insight: "Accommodations enable continued productivity during treatment. Flexibility in where, when, and how work gets done can mean the difference between retention and costly turnover.",
    cacHelp: "Cancer and Careers can audit your accommodation practices, benchmark against best practices, and train HR teams on effective, compliant accommodation conversations."
  },
  6: {
    insight: "Culture determines whether employees feel safe disclosing health challenges. Without psychological safety, employees hide struggles until crisis point, missing early intervention opportunities.",
    cacHelp: "Our culture assessment tools identify barriers to disclosure, and our programs help build environments where employees feel supported in bringing their whole selves to work."
  },
  7: {
    insight: "Career continuity fears cause talented employees to hide diagnoses or leave prematurely. Protecting professional trajectory during treatment builds loyalty and preserves institutional knowledge.",
    cacHelp: "Cancer and Careers can help design career protection policies, re-onboarding programs, and communication strategies that reassure employees their futures are secure."
  },
  8: {
    insight: "Return-to-work is where support programs prove their value. A structured, supportive transition back to work protects the investment in treatment and ensures sustainable recovery.",
    cacHelp: "We offer return-to-work protocol design, including phased re-entry templates, check-in cadences, and success metrics that reduce relapse and improve retention."
  },
  9: {
    insight: "Executive commitment signals organizational priority. Without visible leadership engagement, cancer support remains an HR initiative rather than a business imperative.",
    cacHelp: "Cancer and Careers can help craft executive messaging, integrate cancer support into ESG reporting, and build the business case for board-level engagement."
  },
  10: {
    insight: "Caregivers face dual burden - supporting loved ones while maintaining work performance. Without specific support, you lose productive employees who never received a diagnosis themselves.",
    cacHelp: "Our caregiver support program design includes assessment of unique needs, policy recommendations, and peer support structures for employees in caregiving roles."
  },
  11: {
    insight: "Prevention and early detection reduce long-term costs and improve outcomes. Investing in wellness creates healthier employees and catches issues before they become crises.",
    cacHelp: "Cancer and Careers can evaluate your prevention offerings, recommend evidence-based additions, and help communicate screening and wellness benefits effectively."
  },
  12: {
    insight: "Continuous improvement transforms support from static policy to living practice. Organizations that learn from each case build increasingly effective support systems over time.",
    cacHelp: "We can help establish feedback mechanisms, case review processes, and benchmarking practices that drive ongoing enhancement of your support programs."
  },
  13: {
    insight: "Communication determines whether employees know help exists. Even comprehensive programs fail if employees don't know about them or feel uncomfortable seeking them out.",
    cacHelp: "Cancer and Careers specializes in communication strategy, including messaging frameworks, channel optimization, and campaigns that drive awareness and utilization."
  }
};

// ============================================
// SCORING FUNCTIONS
// ============================================

function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean; category: string } {
  // Handle numeric values (including string numbers)
  const numStatus = typeof status === 'string' ? parseInt(status, 10) : status;
  if (!isNaN(numStatus) && typeof numStatus === 'number') {
    switch (numStatus) {
      case 4: return { points: POINTS.CURRENTLY_OFFER, isUnsure: false, category: 'currently_offer' };
      case 3: return { points: POINTS.PLANNING, isUnsure: false, category: 'planning' };
      case 2: return { points: POINTS.ASSESSING, isUnsure: false, category: 'assessing' };
      case 1: return { points: POINTS.NOT_ABLE, isUnsure: false, category: 'not_able' };
      case 5: return { points: null, isUnsure: true, category: 'unsure' };
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

function getStatusText(status: string | number): string {
  if (typeof status === 'number') {
    switch (status) { case 4: return 'Currently offer'; case 3: return 'Planning'; case 2: return 'Assessing'; case 1: return 'Gap'; case 5: return 'To clarify'; default: return 'Unknown'; }
  }
  return String(status);
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
  if (v.includes('aggregate') || v.includes('no,')) return 0;
  return 0;
}

function scoreD12PolicyChanges(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('several')) return 100;
  if (v.includes('few')) return 60;
  if (v === 'no' || v.startsWith('no,') || v.startsWith('no ') || v === 'no changes') return 0;
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
      // Try multiple field name variations
      const d1_1_usa = dimData?.d1_1_usa ?? dimData?.d11_usa ?? dimData?.d1_1 ?? dimData?.d11;
      const d1_1_non_usa = dimData?.d1_1_non_usa ?? dimData?.d11_non_usa;
      const d1_4b = dimData?.d1_4b ?? dimData?.d14b;
      const scores: number[] = [];
      if (d1_1_usa) scores.push(scoreD1PaidLeave(d1_1_usa));
      if (d1_1_non_usa) scores.push(scoreD1PaidLeave(d1_1_non_usa));
      if (d1_4b) scores.push(scoreD1PartTime(d1_4b));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 3: { const d31 = dimData?.d31 ?? dimData?.d3_1 ?? dimData?.d3; return d31 ? scoreD3Training(d31) : null; }
    case 12: {
      const d12_1 = dimData?.d12_1 ?? dimData?.d121;
      const d12_2 = dimData?.d12_2 ?? dimData?.d122;
      const scores: number[] = [];
      if (d12_1) scores.push(scoreD12CaseReview(d12_1));
      if (d12_2) scores.push(scoreD12PolicyChanges(d12_2));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 13: { const d13_1 = dimData?.d13_1 ?? dimData?.d131; return d13_1 ? scoreD13Communication(d13_1) : null; }
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

// ============================================
// UI HELPERS - MUTED PROFESSIONAL PALETTE
// ============================================

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
// DYNAMIC TAILORED ANALYSIS FUNCTIONS
// ============================================

// Generate tier-adaptive insights based on actual performance
// Get top evidence items for a dimension (best strength, biggest gap, in-flight item)
function getTopEvidence(
  dimNum: number,
  strengths: any[],
  gaps: any[],
  planning: any[],
  elementBenchmarks: Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>>
): { 
  topStrength: { name: string; benchPct: number } | null;
  biggestGap: { name: string; benchPct: number } | null;
  inFlight: { name: string; benchPct: number } | null;
} {
  const benchmarks = elementBenchmarks[dimNum] || {};
  
  // Find top strength - prefer one where fewer peers offer it (more differentiating)
  let topStrength = null;
  if (strengths.length > 0) {
    const strengthsWithBench = strengths.map(s => {
      const bench = benchmarks[s.name] || { currently: 0, total: 1 };
      const pct = Math.round((bench.currently / (bench.total || 1)) * 100);
      return { name: s.name, benchPct: pct };
    }).sort((a, b) => a.benchPct - b.benchPct); // Sort by lowest peer % first (most differentiating)
    topStrength = strengthsWithBench[0];
  }
  
  // Find biggest gap - prefer one where most peers offer it (most impactful to address)
  let biggestGap = null;
  if (gaps.length > 0) {
    const gapsWithBench = gaps.map(g => {
      const bench = benchmarks[g.name] || { currently: 0, total: 1 };
      const pct = Math.round((bench.currently / (bench.total || 1)) * 100);
      return { name: g.name, benchPct: pct };
    }).sort((a, b) => b.benchPct - a.benchPct); // Sort by highest peer % first (biggest gap)
    biggestGap = gapsWithBench[0];
  }
  
  // Find in-flight item - prefer one where most peers already offer (fast path to catch up)
  let inFlight = null;
  if (planning.length > 0) {
    const planningWithBench = planning.map(p => {
      const bench = benchmarks[p.name] || { currently: 0, total: 1 };
      const pct = Math.round((bench.currently / (bench.total || 1)) * 100);
      return { name: p.name, benchPct: pct };
    }).sort((a, b) => b.benchPct - a.benchPct); // Sort by highest peer % (most valuable to complete)
    inFlight = planningWithBench[0];
  }
  
  return { topStrength, biggestGap, inFlight };
}

// Get 2-step roadmap for a dimension
function getTwoStepRoadmap(
  dimNum: number,
  gaps: any[],
  planning: any[],
  assessing: any[],
  elementBenchmarks: Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>>
): { quickWin: { name: string; reason: string } | null; strategicLift: { name: string; reason: string } | null } {
  const benchmarks = elementBenchmarks[dimNum] || {};
  
  // Quick win: Pick from planning (already committed) or highest-prevalence gap (easy to justify)
  let quickWin = null;
  if (planning.length > 0) {
    // Best quick win is something already in planning
    const bench = benchmarks[planning[0].name] || { currently: 0, total: 1 };
    const pct = Math.round((bench.currently / (bench.total || 1)) * 100);
    quickWin = { 
      name: planning[0].name, 
      reason: `Already in development; ${pct}% of peers offer this` 
    };
  } else if (gaps.length > 0) {
    // Find gap with highest peer adoption (easiest to justify)
    const gapsWithBench = gaps.map(g => {
      const bench = benchmarks[g.name] || { currently: 0, total: 1 };
      return { ...g, pct: Math.round((bench.currently / (bench.total || 1)) * 100) };
    }).sort((a, b) => b.pct - a.pct);
    if (gapsWithBench[0].pct > 30) {
      quickWin = { 
        name: gapsWithBench[0].name, 
        reason: `${gapsWithBench[0].pct}% of peers already offer this` 
      };
    }
  }
  
  // Strategic lift: Pick the gap with highest peer adoption that isn't the quick win
  let strategicLift = null;
  const allNonOffered = [...gaps, ...assessing].filter(g => g.name !== quickWin?.name);
  if (allNonOffered.length > 0) {
    const withBench = allNonOffered.map(g => {
      const bench = benchmarks[g.name] || { currently: 0, total: 1 };
      return { ...g, pct: Math.round((bench.currently / (bench.total || 1)) * 100) };
    }).sort((a, b) => b.pct - a.pct);
    strategicLift = { 
      name: withBench[0].name, 
      reason: `${withBench[0].pct}% of peers offer this—adding this would meaningfully expand your support coverage` 
    };
  }
  
  return { quickWin, strategicLift };
}

function getDynamicInsight(dimNum: number, score: number, tierName: string, benchmark: number | null, gaps: any[], strengths: any[], planning: any[]): { insight: string; cacHelp: string } {
  const benchDiff = benchmark !== null ? score - benchmark : 0;
  const isAboveBenchmark = benchDiff > 0;
  const gapCount = gaps.length;
  const strengthCount = strengths.length;
  const planningCount = planning.length;
  
  // Dimension-specific context with tailored CAC offerings
  const dimContext: Record<number, { 
    focus: string; 
    risk: string; 
    opportunity: string; 
    quickWin: string;
    cacPrograms: { exemplary: string; leading: string; progressing: string; emerging: string; developing: string };
  }> = {
    1: { 
      focus: 'leave policies and flexibility', 
      risk: 'employees choosing between health and job', 
      opportunity: 'industry-leading time-off benefits', 
      quickWin: 'phased return-to-work options',
      cacPrograms: {
        exemplary: 'Document your leave policies as a best-practice case study. We can facilitate peer learning sessions where you share your approach with other Index participants.',
        leading: 'Our Leave Policy Enhancement workshop can identify the specific gaps preventing Exemplary status, with templates for policy language and implementation guides.',
        progressing: 'CAC\'s Leave Policy Benchmarking service compares your policies against industry leaders, identifying specific enhancements like extended leave duration or job protection guarantees.',
        emerging: 'Our Medical Leave Foundation program provides turnkey policy templates, legal compliance guidance, and manager training for leave administration.',
        developing: 'Urgent: CAC\'s Leave Policy Accelerator builds comprehensive, compliant leave policies in 60 days, including FMLA+ enhancements and accommodation frameworks.'
      }
    },
    2: { 
      focus: 'insurance and financial protection', 
      risk: 'financial toxicity derailing treatment', 
      opportunity: 'comprehensive coverage removing barriers', 
      quickWin: 'employee assistance fund or gap insurance',
      cacPrograms: {
        exemplary: 'Showcase your financial protection programs through CAC\'s Best Practices Library. We can connect you with benefits consultants seeking model programs to replicate.',
        leading: 'Our Benefits Gap Analysis identifies specific coverage enhancements—like cancer-specific riders or out-of-pocket maximums—that would achieve Exemplary status.',
        progressing: 'CAC\'s Financial Protection Assessment evaluates your insurance, disability, and supplemental coverage against cancer-specific needs, with vendor recommendations.',
        emerging: 'Our Financial Wellness for Serious Illness program designs hardship funds, premium assistance, and navigation support to reduce financial barriers to care.',
        developing: 'Critical: CAC\'s Emergency Benefits Review can identify immediate coverage gaps and design interim financial support while longer-term solutions are developed.'
      }
    },
    3: { 
      focus: 'manager preparedness', 
      risk: 'policy-to-practice gaps at the front line', 
      opportunity: 'confident, trained managers', 
      quickWin: 'conversation guide and scenario training',
      cacPrograms: {
        exemplary: 'Your manager training could become a CAC-certified program. We can help scale your approach across business units and document for external recognition.',
        leading: 'Our Advanced Manager Certification adds specialized modules on complex scenarios—recurrence, terminal diagnosis, grief—to achieve comprehensive preparedness.',
        progressing: 'CAC\'s Manager Essentials Training provides 4-hour workshops with role-play scenarios, conversation scripts, and ongoing coaching support.',
        emerging: 'Our Manager Quick-Start Kit includes conversation guides, FAQ documents, and 90-minute awareness training to build baseline confidence.',
        developing: 'Urgent: CAC\'s Manager Emergency Toolkit provides immediate resources—scripts, escalation paths, HR support protocols—while comprehensive training is developed.'
      }
    },
    4: { 
      focus: 'navigation and expert resources', 
      risk: 'underutilized benefits investments', 
      opportunity: 'single-entry-point access', 
      quickWin: 'centralized resource hub or concierge',
      cacPrograms: {
        exemplary: 'Partner with CAC to offer your navigation model as a benchmark for other organizations. We can facilitate knowledge-sharing with Index participants.',
        leading: 'Our Navigation Enhancement service adds specialized resources—clinical trial matching, second opinion coordination—to achieve comprehensive support.',
        progressing: 'CAC\'s Resource Hub Design creates a centralized portal mapping all your benefits, vendors, and support resources with clear access pathways.',
        emerging: 'Our Navigation Foundation program implements a single point of contact model with trained navigators who connect employees to appropriate resources.',
        developing: 'Critical: CAC\'s Navigation Quick-Start creates an immediate resource guide and trained HR liaison while comprehensive navigation is built.'
      }
    },
    5: { 
      focus: 'workplace accommodations', 
      risk: 'preventable turnover during treatment', 
      opportunity: 'flexibility that retains talent', 
      quickWin: 'remote work and schedule flexibility policies',
      cacPrograms: {
        exemplary: 'Document your accommodation practices for CAC\'s Accommodation Best Practices guide. We can facilitate sessions sharing your interactive process approach.',
        leading: 'Our Accommodation Excellence program addresses edge cases—cognitive impacts, fatigue management, role modifications—for comprehensive flexibility.',
        progressing: 'CAC\'s Accommodation Framework Training teaches HR and managers the interactive process, with templates for common cancer-related accommodations.',
        emerging: 'Our Flexibility Foundation program designs remote work, schedule modification, and workload adjustment policies specific to treatment needs.',
        developing: 'Urgent: CAC\'s Accommodation Emergency Protocol creates immediate flexibility options while comprehensive policies are developed.'
      }
    },
    6: { 
      focus: 'culture and psychological safety', 
      risk: 'hidden struggles until crisis point', 
      opportunity: 'early disclosure and intervention', 
      quickWin: 'leadership storytelling and visible commitment',
      cacPrograms: {
        exemplary: 'Your culture of openness is a model for others. CAC can help document and share your approach through speaking opportunities and case studies.',
        leading: 'Our Culture Enhancement workshop addresses subtle barriers to disclosure, including peer support networks and ally training programs.',
        progressing: 'CAC\'s Psychological Safety Assessment identifies disclosure barriers through confidential surveys and focus groups, with targeted interventions.',
        emerging: 'Our Culture Foundation program implements leadership visibility, storytelling campaigns, and anti-stigma training to build trust.',
        developing: 'Critical: CAC\'s Culture Quick-Start includes executive messaging, basic awareness training, and visible support commitments as foundation.'
      }
    },
    7: { 
      focus: 'career continuity', 
      risk: 'losing talent to fear of career damage', 
      opportunity: 'loyalty through protected trajectories', 
      quickWin: 'explicit promotion protection policy',
      cacPrograms: {
        exemplary: 'Your career protection model could inform CAC\'s policy recommendations. We can facilitate peer learning on maintaining career momentum during treatment.',
        leading: 'Our Career Assurance program adds re-entry coaching, skill maintenance support, and explicit promotion pathway protection.',
        progressing: 'CAC\'s Career Continuity Framework designs policies protecting performance reviews, promotion eligibility, and professional development during treatment.',
        emerging: 'Our Career Protection Foundation creates explicit policies ensuring medical leave doesn\'t impact career trajectory, with manager guidance.',
        developing: 'Urgent: CAC\'s Career Safety Net establishes immediate protections against career penalty while comprehensive policies are developed.'
      }
    },
    8: { 
      focus: 'return-to-work support', 
      risk: 'failed transitions after treatment', 
      opportunity: 'sustainable recovery and full productivity', 
      quickWin: 'structured 90-day re-entry protocol',
      cacPrograms: {
        exemplary: 'Your RTW program is a model. CAC can help document your protocols for our Best Practices Library and facilitate peer learning sessions.',
        leading: 'Our RTW Excellence program adds specialized components—cognitive rehabilitation, stamina building, peer mentoring—for comprehensive re-entry.',
        progressing: 'CAC\'s Return-to-Work Protocol Design creates phased re-entry templates, check-in schedules, and adjustment frameworks for sustainable transitions.',
        emerging: 'Our RTW Foundation program implements basic phased return, temporary accommodations, and manager check-in protocols.',
        developing: 'Urgent: CAC\'s RTW Quick-Start provides immediate guidance for current cases while comprehensive protocols are developed.'
      }
    },
    9: { 
      focus: 'executive commitment', 
      risk: 'cancer support seen as HR-only', 
      opportunity: 'business-integrated health strategy', 
      quickWin: 'executive sponsor and visible commitment',
      cacPrograms: {
        exemplary: 'Connect your executives with CAC\'s Leadership Council for peer networking and industry visibility as champions of workplace cancer support.',
        leading: 'Our Executive Engagement program develops board-level metrics, ESG integration, and external recognition strategies.',
        progressing: 'CAC\'s Executive Briefing provides business case development, peer benchmarking data, and talking points for leadership engagement.',
        emerging: 'Our Leadership Foundation program identifies an executive sponsor, develops initial messaging, and creates visibility opportunities.',
        developing: 'Critical: CAC\'s Executive Quick-Brief provides immediate business case and ROI data to secure leadership attention and resources.'
      }
    },
    10: { 
      focus: 'caregiver support', 
      risk: 'losing productive employees who are caregivers', 
      opportunity: 'holistic family support', 
      quickWin: 'caregiver leave and flexible scheduling',
      cacPrograms: {
        exemplary: 'Your caregiver support is a differentiator. CAC can document your approach for our Caregiver Support Guide and connect you with recognition opportunities.',
        leading: 'Our Caregiver Excellence program adds specialized resources—backup care, support groups, navigation—for comprehensive family support.',
        progressing: 'CAC\'s Caregiver Support Framework designs leave policies, flexibility options, and resource connections specific to caregiving needs.',
        emerging: 'Our Caregiver Foundation program creates basic leave provisions, flexible scheduling, and EAP integration for caregiver support.',
        developing: 'Urgent: CAC\'s Caregiver Quick-Start provides immediate flexibility guidelines while comprehensive support programs are developed.'
      }
    },
    11: { 
      focus: 'prevention and wellness', 
      risk: 'late detection and higher costs', 
      opportunity: 'proactive health culture', 
      quickWin: 'on-site screening events and incentives',
      cacPrograms: {
        exemplary: 'Your prevention programs model early detection best practices. CAC can facilitate peer learning on driving screening participation.',
        leading: 'Our Prevention Excellence program adds genetic risk assessment, personalized screening protocols, and survivorship wellness.',
        progressing: 'CAC\'s Prevention Framework designs comprehensive screening campaigns, incentive structures, and awareness programming.',
        emerging: 'Our Wellness Foundation program implements basic cancer awareness, screening promotion, and risk reduction education.',
        developing: 'Critical: CAC\'s Prevention Quick-Start launches immediate screening awareness campaigns while comprehensive programs are built.'
      }
    },
    12: { 
      focus: 'continuous improvement', 
      risk: 'static policies that don\'t evolve', 
      opportunity: 'learning organization', 
      quickWin: 'annual program review and employee feedback',
      cacPrograms: {
        exemplary: 'Your continuous improvement practices could inform CAC\'s assessment methodology. We welcome partnership on evolving best practice standards.',
        leading: 'Our CI Excellence program adds case review protocols, outcome tracking, and systematic policy refinement processes.',
        progressing: 'CAC\'s Continuous Improvement Framework designs feedback mechanisms, annual review cycles, and benchmarking practices.',
        emerging: 'Our CI Foundation program implements basic feedback collection, annual policy review, and metric tracking.',
        developing: 'Critical: CAC\'s CI Quick-Start establishes immediate feedback channels while systematic improvement processes are developed.'
      }
    },
    13: { 
      focus: 'communication and awareness', 
      risk: 'excellent programs nobody knows about', 
      opportunity: 'high utilization rates', 
      quickWin: 'benefits awareness campaign at open enrollment',
      cacPrograms: {
        exemplary: 'Your communication approach drives strong utilization. CAC can document your strategies for our Communications Best Practices guide.',
        leading: 'Our Communication Excellence program adds targeted outreach, utilization tracking, and personalized benefit recommendations.',
        progressing: 'CAC\'s Communication Framework designs multi-channel awareness campaigns, manager talking points, and benefit navigation guides.',
        emerging: 'Our Communication Foundation program creates basic benefit summaries, intranet content, and open enrollment messaging.',
        developing: 'Urgent: CAC\'s Communication Quick-Start launches immediate awareness campaigns for critical benefits while comprehensive strategy develops.'
      }
    },
  };
  
  const ctx = dimContext[dimNum] || { 
    focus: 'this area', 
    risk: 'gaps in support', 
    opportunity: 'improved outcomes', 
    quickWin: 'targeted improvements',
    cacPrograms: { exemplary: '', leading: '', progressing: '', emerging: '', developing: '' }
  };
  
  let insight = '';
  let cacHelp = '';
  
  // Get the appropriate CAC program based on tier
  const tierKey = tierName.toLowerCase() as 'exemplary' | 'leading' | 'progressing' | 'emerging' | 'developing';
  const cacProgram = ctx.cacPrograms[tierKey] || ctx.cacPrograms.progressing;
  
  // Tier-based insight generation with specific data
  if (tierName === 'Exemplary') {
    insight = `Your ${ctx.focus} represents best-in-class performance at ${score} points. ${strengthCount > 0 ? `With ${strengthCount} elements fully implemented, you've` : 'You\'ve'} established a foundation others aspire to. ${isAboveBenchmark && benchmark !== null ? `At ${benchDiff} points above the peer average of ${benchmark}, this demonstrates exceptional commitment to employee support.` : ''} Focus on maintaining this standard and codifying your practices for organizational knowledge transfer.`;
    cacHelp = cacProgram;
  } else if (tierName === 'Leading') {
    insight = `Strong foundation in ${ctx.focus} at ${score} points positions you well. ${isAboveBenchmark && benchmark !== null ? `Scoring ${benchDiff} points above the ${benchmark} benchmark demonstrates genuine commitment.` : benchmark !== null ? `Reaching the ${benchmark} benchmark is within reach.` : ''} ${gapCount > 0 ? `Addressing ${gapCount} remaining gap${gapCount > 1 ? 's' : ''} would move you toward Exemplary status—consider starting with ${ctx.quickWin}.` : 'Minor refinements separate you from Exemplary tier.'}`;
    cacHelp = cacProgram;
  } else if (tierName === 'Progressing') {
    insight = `Solid progress in ${ctx.focus} at ${score} points, with clear room to grow. ${gapCount > 0 ? `${gapCount} improvement opportunit${gapCount > 1 ? 'ies' : 'y'} represent${gapCount === 1 ? 's' : ''} your path forward.` : ''} ${!isAboveBenchmark && benchmark !== null ? `Closing the ${Math.abs(benchDiff)}-point gap to the ${benchmark} peer benchmark should be a near-term priority.` : ''} Quick win to consider: ${ctx.quickWin}.`;
    cacHelp = cacProgram;
  } else if (tierName === 'Emerging') {
    insight = `${ctx.focus.charAt(0).toUpperCase() + ctx.focus.slice(1)} at ${score} points needs attention to avoid ${ctx.risk}. ${gapCount > 0 ? `With ${gapCount} gaps identified, focused investment here could significantly improve employee experience and reduce organizational risk.` : ''} ${!isAboveBenchmark && benchmark !== null ? `The ${Math.abs(benchDiff)}-point gap to the ${benchmark} peer average indicates this is an area where additional focus would benefit employees.` : ''} Recommended quick win: ${ctx.quickWin}.`;
    cacHelp = cacProgram;
  } else {
    insight = `Critical gap in ${ctx.focus} at ${score} points creates risk of ${ctx.risk}. ${gapCount > 0 ? `${gapCount} missing elements represent significant exposure.` : ''} ${!isAboveBenchmark && benchmark !== null ? `The ${Math.abs(benchDiff)}-point gap below the ${benchmark} peer average signals this as a priority area.` : ''} Employees facing health challenges may feel unsupported here, leading to disengagement, extended leave, or departure. Immediate action: implement ${ctx.quickWin}.`;
    cacHelp = cacProgram;
  }
  
  return { insight, cacHelp };
}

// Generate benchmark comparison narrative
function getBenchmarkNarrative(score: number, benchmark: number | null, dimName: string): string {
  if (benchmark === null) return '';
  const diff = score - benchmark;
  if (diff > 25) return `Exceptional performance at ${diff} points above the peer average—this represents a genuine organizational strength and commitment to employee wellbeing.`;
  if (diff > 15) return `Well above the ${benchmark} peer average by ${diff} points, indicating mature, established practices that employees likely recognize and value.`;
  if (diff > 5) return `Above benchmark by ${diff} points (peer avg: ${benchmark}), demonstrating strong commitment with opportunities to strengthen further.`;
  if (diff > 0) return `Slightly above the ${benchmark} peer average—a good foundation to build on for differentiation.`;
  if (diff === 0) return `Matching the peer average of ${benchmark}—an opportunity to differentiate through targeted improvements.`;
  if (diff > -10) return `${Math.abs(diff)} points below the ${benchmark} peer benchmark—targeted improvements can close this gap within 6-12 months.`;
  if (diff > -20) return `Notable gap of ${Math.abs(diff)} points below the ${benchmark} peer average warrants focused strategic attention.`;
  return `Currently ${Math.abs(diff)} points below the peer average (${benchmark})—this is a priority area where focused improvements will meaningfully strengthen your employee support.`;
}

// Identify meaningful cross-dimension patterns
function getCrossDimensionPatterns(dimAnalysis: any[]): { pattern: string; implication: string; recommendation: string }[] {
  const patterns: { pattern: string; implication: string; recommendation: string }[] = [];
  
  const findDim = (num: number) => dimAnalysis.find(d => d.dim === num);
  const culture = findDim(6);
  const manager = findDim(3);
  const navigation = findDim(4);
  const communication = findDim(13);
  const leave = findDim(1);
  const returnToWork = findDim(8);
  const insurance = findDim(2);
  const executive = findDim(9);
  const continuous = findDim(12);
  const accommodations = findDim(5);
  const career = findDim(7);
  
  // Pattern: Strong culture but weak manager training
  if (culture && manager && culture.score >= 70 && manager.score < 55) {
    patterns.push({
      pattern: `Strong Culture (${culture.score}) paired with lower Manager Preparedness (${manager.score})`,
      implication: 'Employees likely feel safe disclosing health challenges, but managers may lack confidence and tools to respond effectively. This creates risk of inconsistent support experiences.',
      recommendation: 'Prioritize manager training with conversation guides and scenario practice. Your positive culture means managers want to help—give them the skills to do so effectively.'
    });
  }
  
  // Pattern: Good benefits but poor navigation  
  if (insurance && navigation && insurance.score >= 65 && navigation.score < 50) {
    patterns.push({
      pattern: `Strong Insurance Benefits (${insurance.score}) with weaker Navigation (${navigation.score})`,
      implication: 'You\'ve invested in comprehensive benefits, but employees may struggle to find and access them when needed. Benefits utilization is likely below potential, reducing ROI.',
      recommendation: 'Implement a navigation solution—single entry point, benefits concierge, or resource hub. This maximizes return on your existing benefits investment.'
    });
  }
  
  // Pattern: Low communication with strong programs
  if (communication && communication.score < 50) {
    const strongDims = dimAnalysis.filter(d => d.score >= 70 && d.dim !== 13);
    if (strongDims.length >= 2) {
      patterns.push({
        pattern: `${strongDims.length} dimensions at Leading+ level but Communication at only ${communication.score}`,
        implication: `You have strong programs in ${strongDims.slice(0, 2).map(d => d.name).join(' and ')}, but low awareness may be limiting utilization. Employees may not know these resources exist when they need them.`,
        recommendation: 'Launch targeted awareness campaigns highlighting your strongest offerings. This is a quick win—you already have the programs, just need visibility.'
      });
    }
  }
  
  // Pattern: Strong leave but weak return-to-work
  if (leave && returnToWork && leave.score >= 65 && returnToWork.score < 50) {
    patterns.push({
      pattern: `Good Leave Policies (${leave.score}) but weaker Return-to-Work Support (${returnToWork.score})`,
      implication: 'Employees get the time they need for treatment, but may struggle with the transition back. This risks losing the investment made during leave through failed re-entry.',
      recommendation: 'Implement structured return-to-work protocols: phased re-entry schedules, regular check-ins, and temporary accommodation plans. Protect your leave investment.'
    });
  }
  
  // Pattern: Accommodations strong but career weak
  if (accommodations && career && accommodations.score >= 65 && career.score < 50) {
    patterns.push({
      pattern: `Good Accommodations (${accommodations.score}) but lower Career Continuity (${career.score})`,
      implication: 'Employees can adjust their work during treatment, but may fear long-term career impact. This can lead to hidden diagnoses or premature departures despite good day-to-day support.',
      recommendation: 'Add explicit career protection policies—promotion eligibility during medical leave, transparent communication about performance expectations, and success stories of career progression post-diagnosis.'
    });
  }
  
  // Pattern: Low executive commitment with other gaps
  if (executive && executive.score < 45) {
    const avgOtherScore = dimAnalysis.filter(d => d.dim !== 9).reduce((sum, d) => sum + d.score, 0) / 12;
    if (avgOtherScore < 65) {
      patterns.push({
        pattern: `Low Executive Commitment (${executive.score}) correlating with program gaps`,
        implication: 'Without visible leadership engagement, cancer support operates as an isolated HR initiative rather than organizational priority. This limits resources and cross-functional coordination.',
        recommendation: 'Build the executive business case connecting cancer support to retention metrics, productivity data, and employer brand. Identify an executive sponsor to champion the program.'
      });
    }
  }
  
  // Pattern: Consistently strong performance
  const avgScore = dimAnalysis.reduce((sum, d) => sum + d.score, 0) / dimAnalysis.length;
  const lowestDim = [...dimAnalysis].sort((a, b) => a.score - b.score)[0];
  if (avgScore >= 72 && lowestDim.score >= 50) {
    patterns.push({
      pattern: `Consistently strong performance across dimensions (${Math.round(avgScore)} average)`,
      implication: 'Your comprehensive, balanced approach to cancer support is a genuine organizational differentiator. This positions you well for employer brand recognition and talent attraction.',
      recommendation: `Leverage this strong foundation to build thought leadership in workplace cancer support. Focus refinement on ${lowestDim.name} (${lowestDim.score}) to achieve full excellence across all dimensions.`
    });
  }
  
  // Pattern: High gaps with low continuous improvement
  if (continuous && continuous.score < 45) {
    const totalGaps = dimAnalysis.reduce((sum, d) => sum + d.gaps.length, 0);
    if (totalGaps > 25) {
      patterns.push({
        pattern: `${totalGaps} total gaps with limited Continuous Improvement infrastructure (${continuous.score})`,
        implication: 'Significant improvement opportunities exist, but without systematic review processes, progress may be slow and lessons from individual cases are lost.',
        recommendation: 'Establish quarterly program reviews, employee feedback mechanisms, and case documentation practices. This creates the infrastructure to drive and sustain improvements.'
      });
    }
  }
  
  return patterns.slice(0, 3); // Return top 3 most relevant
}

// Calculate impact-ranked improvement priorities
function getImpactRankings(dimAnalysis: any[], compositeScore: number): { dimName: string; dimNum: number; currentScore: number; tier: string; potentialGain: number; effort: string; recommendation: string; recommendations: string[]; topGap: string }[] {
  // Realistic improvement potential varies by current score
  const getRealisticImprovement = (score: number) => {
    if (score < 40) return 25;  // Low scores: lots of quick wins available
    if (score < 60) return 20;  // Mid scores: moderate improvement potential
    if (score < 80) return 15;  // Higher scores: harder to move
    return 10;                   // High performers: marginal gains
  };
  
  return dimAnalysis
    .map(d => {
      // Calculate potential composite score impact
      const improvementPotential = Math.min(100 - d.score, getRealisticImprovement(d.score));
      const weightedImpact = (improvementPotential * d.weight) / 100 * 0.9; // 90% dimension weight factor
      const potentialGain = Math.round(weightedImpact * 10) / 10;
      
      // Determine effort based on gap count, current score, and planning items
      let effort = 'Medium';
      let effortScore = 2;
      if (d.gaps.length > 6 || d.score < 35) { effort = 'High'; effortScore = 1; }
      else if (d.gaps.length <= 2 && d.score >= 55) { effort = 'Low'; effortScore = 3; }
      else if (d.planning.length >= 2) { effort = 'Low'; effortScore = 3; } // Already have momentum
      
      // Generate up to 3 specific recommendations based on their data
      const recommendations: string[] = [];
      
      // First recommendation: Planning items (highest priority - already in progress)
      if (d.planning.length > 0) {
        recommendations.push(`Accelerate ${d.planning.length} in-progress initiative${d.planning.length > 1 ? 's' : ''} for quickest impact`);
      }
      
      // Second recommendation: Top gaps to address
      if (d.gaps.length > 0 && d.gaps[0]?.name) {
        recommendations.push(`Implement: ${d.gaps[0].name}`);
        if (d.gaps.length > 1 && d.gaps[1]?.name && recommendations.length < 3) {
          recommendations.push(`Add: ${d.gaps[1].name}`);
        }
      }
      
      // Third recommendation: Assessing items to move forward
      if (d.assessing.length > 0 && recommendations.length < 3) {
        recommendations.push(`Move ${d.assessing.length} item${d.assessing.length > 1 ? 's' : ''} from assessment to planning`);
      }
      
      // Fallback if no other recommendations
      if (recommendations.length === 0) {
        recommendations.push('Optimize and document existing programs');
      }
      
      const topGap = d.gaps[0]?.name || d.needsAttention[0]?.name || 'No specific gaps identified';
      
      return {
        dimName: d.name,
        dimNum: d.dim,
        currentScore: d.score,
        tier: d.tier.name,
        potentialGain,
        effort,
        effortScore,
        recommendation: recommendations[0], // Keep for backward compatibility
        recommendations: recommendations.slice(0, 3), // Up to 3
        topGap
      };
    })
    .sort((a, b) => {
      // Prioritize: high impact + low effort = best ROI
      const aROI = a.potentialGain * a.effortScore;
      const bROI = b.potentialGain * b.effortScore;
      return bROI - aROI;
    })
    .map(({ effortScore, ...rest }) => rest) // Remove effortScore from output
    .slice(0, 5);
}

// ============================================
// ICONS - MINIMAL
// ============================================

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
);

const TrendUpIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
);

// ============================================
// STRATEGIC PRIORITY MATRIX - CLEAN WITH LABEL BARS
// ============================================

function StrategicPriorityMatrix({ dimensionAnalysis, getScoreColor }: { dimensionAnalysis: any[]; getScoreColor: (score: number) => string }) {
  const [hoveredDim, setHoveredDim] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const MAX_WEIGHT = 15;
  
  const CHART_WIDTH = 900;
  const CHART_HEIGHT = 420;
  const LABEL_HEIGHT = 24;
  const MARGIN = { top: LABEL_HEIGHT + 10, right: 20, bottom: LABEL_HEIGHT + 55, left: 60 };
  const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  
  const hoveredData = hoveredDim !== null ? dimensionAnalysis.find(d => d.dim === hoveredDim) : null;
  
  // Calculate bubble positions as percentages for HTML overlay
  const getBubblePosition = (d: any) => {
    const xPercent = (MARGIN.left + (d.score / 100) * PLOT_WIDTH) / CHART_WIDTH * 100;
    const yPercent = (MARGIN.top + (PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT))) / CHART_HEIGHT * 100;
    return { xPercent, yPercent };
  };
  
  // Calculate tooltip position based on bubble location
  const getTooltipStyle = () => {
    if (!hoveredData) return { top: '8px', right: '8px', opacity: 0 };
    
    const { xPercent, yPercent } = getBubblePosition(hoveredData);
    const tooltipWidth = 224;
    const tooltipHeight = 160;
    
    const isRightEdge = xPercent > 65;
    const isLeftEdge = xPercent < 25;
    const isTopEdge = yPercent < 35;
    const isBottomEdge = yPercent > 65;
    
    let top: string;
    let left: string;
    
    if (isRightEdge) {
      left = `calc(${xPercent}% - ${tooltipWidth + 50}px)`;
    } else {
      left = `calc(${xPercent}% + 30px)`;
    }
    
    if (isTopEdge) {
      top = `calc(${yPercent}% + 30px)`;
    } else if (isBottomEdge) {
      top = `calc(${yPercent}% - ${tooltipHeight + 30}px)`;
    } else {
      top = `calc(${yPercent}% - ${tooltipHeight/2}px)`;
    }
    
    return { top, left, right: 'auto', opacity: 1 };
  };
  
  return (
    <div className="px-4 py-4">
      <div ref={containerRef} className="relative w-full" style={{ height: '580px' }}>
        {/* SVG Chart - visual only, no interactivity */}
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
                PERFORMANCE SCORE →
              </text>
            </g>
            
            {/* Y-axis */}
            <g>
              {[0, 5, 10, 15].map((val) => {
                const yPos = PLOT_HEIGHT - ((val / MAX_WEIGHT) * PLOT_HEIGHT);
                return (
                  <g key={val}>
                    <line x1="-4" y1={yPos} x2="0" y2={yPos} stroke="#9CA3AF" strokeWidth="1" />
                    <text x="-8" y={yPos + 3} textAnchor="end" fill="#6B7280" fontSize="10" fontFamily="system-ui">{val}%</text>
                  </g>
                );
              })}
            </g>
            
            {/* Y-axis label */}
            <text transform="rotate(-90)" x={-PLOT_HEIGHT/2} y="-45" textAnchor="middle" fill="#374151" fontSize="11" fontWeight="600" fontFamily="system-ui">
              ↑ STRATEGIC IMPORTANCE
            </text>
            
            {/* Data points - visual only */}
            {dimensionAnalysis.map((d) => {
              const xPos = (d.score / 100) * PLOT_WIDTH;
              const yPos = PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT);
              const isHovered = hoveredDim === d.dim;
              
              return (
                <g key={d.dim} transform={`translate(${xPos}, ${yPos})`}>
                  <circle r={isHovered ? 22 : 18} fill="white" filter="url(#dropShadow)" style={{ transition: 'all 0.15s ease' }} />
                  <circle r={isHovered ? 18 : 15} fill={getScoreColor(d.score)} style={{ transition: 'all 0.15s ease' }} />
                  <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">
                    D{d.dim}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        
        {/* HTML Overlay for hover detection - positioned over SVG */}
        <div className="absolute inset-0" style={{ height: '490px' }}>
          {dimensionAnalysis.map((d) => {
            const { xPercent, yPercent } = getBubblePosition(d);
            return (
              <div
                key={d.dim}
                className="absolute rounded-full cursor-pointer"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  width: '44px',
                  height: '44px',
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseEnter={() => setHoveredDim(d.dim)}
                onMouseLeave={() => setHoveredDim(null)}
              />
            );
          })}
        </div>
        
        {/* Tooltip */}
        {hoveredData && (
          <div 
            className="absolute bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-56 z-30 pointer-events-none transition-opacity duration-150"
            style={getTooltipStyle()}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md" style={{ backgroundColor: getScoreColor(hoveredData.score) }}>
                D{hoveredData.dim}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm leading-tight">{hoveredData.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-slate-500 text-xs font-medium">Score</p>
                <p className="font-bold text-lg" style={{ color: getScoreColor(hoveredData.score) }}>{hoveredData.score}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-slate-500 text-xs font-medium">Weight</p>
                <p className="font-bold text-lg text-slate-700">{hoveredData.weight}%</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${hoveredData.tier.bgColor}`} style={{ color: hoveredData.tier.color }}>{hoveredData.tier.name}</span>
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-3 pt-4 border-t border-slate-200 px-2">
          <div className="flex justify-center gap-x-3 gap-y-1">
            {/* First row: dimensions 1-7 */}
            {[...dimensionAnalysis].filter(d => d.dim <= 7).sort((a, b) => a.dim - b.dim).map(d => (
              <div 
                key={d.dim} 
                className={`flex items-center gap-1 px-1.5 py-1 rounded transition-all cursor-pointer ${hoveredDim === d.dim ? 'bg-slate-200 ring-1 ring-slate-400' : 'hover:bg-slate-100'}`}
                onMouseEnter={() => setHoveredDim(d.dim)}
                onMouseLeave={() => setHoveredDim(null)}
              >
                <span className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: getScoreColor(d.score) }}>
                  {d.dim}
                </span>
                <span className="text-[11px] text-slate-700 font-medium whitespace-nowrap">{DIMENSION_SHORT_NAMES[d.dim]}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-x-3 gap-y-1 mt-1">
            {/* Second row: dimensions 8-13 */}
            {[...dimensionAnalysis].filter(d => d.dim > 7).sort((a, b) => a.dim - b.dim).map(d => (
              <div 
                key={d.dim} 
                className={`flex items-center gap-1 px-1.5 py-1 rounded transition-all cursor-pointer ${hoveredDim === d.dim ? 'bg-slate-200 ring-1 ring-slate-400' : 'hover:bg-slate-100'}`}
                onMouseEnter={() => setHoveredDim(d.dim)}
                onMouseLeave={() => setHoveredDim(null)}
              >
                <span className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: getScoreColor(d.score) }}>
                  {d.dim}
                </span>
                <span className="text-[11px] text-slate-700 font-medium whitespace-nowrap">{DIMENSION_SHORT_NAMES[d.dim]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DIMENSION DRILL DOWN COMPONENT
// ============================================

interface DrillDownProps {
  dimensionAnalysis: any[];
  selectedDim: number | null;
  setSelectedDim: (dim: number | null) => void;
  elementBenchmarks: Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>>;
  getScoreColor: (score: number) => string;
  benchmarkCompanyCount: number;
  customObservations?: Record<string, string>;
  setCustomObservations?: (obs: Record<string, string>) => void;
  isEditing?: boolean;
  showExtras?: boolean;
  isSingleCountryCompany?: boolean;
}

// Collapsible Score Component Card for Score Composition section
function ScoreComponentCard({ 
  title, 
  score, 
  weight, 
  benchmarkScore, 
  color, 
  summary, 
  details,
  getScoreColor 
}: { 
  title: string;
  score: number;
  weight: number;
  benchmarkScore?: number;
  color: 'slate' | 'amber' | 'violet';
  summary: string;
  details?: ReactNode;
  getScoreColor: (score: number) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  
  const colorStyles = {
    slate: { border: 'border-slate-200', header: 'bg-slate-100', headerText: 'text-slate-800', badge: 'text-slate-500' },
    amber: { border: 'border-amber-200', header: 'bg-amber-100', headerText: 'text-amber-800', badge: 'text-amber-600' },
    violet: { border: 'border-violet-200', header: 'bg-violet-100', headerText: 'text-violet-800', badge: 'text-violet-600' },
  };
  
  const styles = colorStyles[color];
  const diff = benchmarkScore !== undefined ? score - benchmarkScore : null;
  
  return (
    <div className={`rounded-xl border ${styles.border} overflow-hidden`}>
      <div className={`${styles.header} px-4 py-3 border-b ${styles.border}`}>
        <div className="flex items-center justify-between">
          <h4 className={`font-bold ${styles.headerText} text-sm`}>{title}</h4>
          <span className={`text-xs ${styles.badge} font-medium`}>{weight}% weight</span>
        </div>
      </div>
      <div className="p-4 bg-white">
        {/* Summary line */}
        <p className="text-xs text-slate-600 leading-relaxed mb-3">{summary}</p>
        
        {/* Score and benchmark */}
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Your Score</span>
            <span className="text-lg font-bold" style={{ color: getScoreColor(score) }}>
              {score}<span className="text-sm text-slate-400 font-normal"> / 100</span>
            </span>
          </div>
          {diff !== null && (
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
              <span className="text-xs text-slate-500">vs. Peer Benchmark</span>
              <span className={`text-sm font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {diff >= 0 ? '+' : ''}{diff} pts <span className="font-normal text-slate-400">({benchmarkScore} avg)</span>
              </span>
            </div>
          )}
        </div>
        
        {/* Expandable details */}
        {details && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 w-full text-xs text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 py-1"
            >
              {expanded ? 'Hide' : 'Show'} scoring details
              <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                {details}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DimensionDrillDown({ dimensionAnalysis, selectedDim, setSelectedDim, elementBenchmarks, getScoreColor, benchmarkCompanyCount, customObservations = {}, setCustomObservations, isEditing = false, showExtras = false, isSingleCountryCompany = false }: DrillDownProps) {
  const sortedDims = [...dimensionAnalysis].sort((a, b) => a.dim - b.dim);
  const selectedData = selectedDim ? sortedDims.find(d => d.dim === selectedDim) : null;
  const elemBench = selectedDim ? elementBenchmarks[selectedDim] || {} : {};

  const STATUS = {
    currently: { bg: '#10B981', light: '#ECFDF5', text: '#065F46', label: 'Offering' },
    planning: { bg: '#3B82F6', light: '#EFF6FF', text: '#1E40AF', label: 'Planning' },
    assessing: { bg: '#F59E0B', light: '#FFFBEB', text: '#92400E', label: 'Assessing' },
    notAble: { bg: '#EF4444', light: '#FEF2F2', text: '#991B1B', label: 'Not Able' }
  };

  const getStatusInfo = (elem: any) => {
    if (elem.isStrength) return { key: 'currently', ...STATUS.currently };
    if (elem.isPlanning) return { key: 'planning', ...STATUS.planning };
    if (elem.isAssessing) return { key: 'assessing', ...STATUS.assessing };
    return { key: 'notAble', ...STATUS.notAble };
  };

  const getDefaultObservation = (elem: any, bench: any) => {
    const total = bench.total || 1;
    const pctCurrently = Math.round((bench.currently / total) * 100);
    const pctPlanning = Math.round((bench.planning / total) * 100);
    const pctAssessing = Math.round((bench.assessing / total) * 100);
    const statusInfo = getStatusInfo(elem);
    
    // Varied phrasing based on status - avoids repetitive "X% further along"
    if (statusInfo.key === 'currently') {
      // Rotate between phrasings for strengths
      if (pctCurrently < 30) return `Differentiator: Only ${pctCurrently}% of peers offer this`;
      if (pctCurrently < 50) return `You're ahead of ${100 - pctCurrently}% of benchmark companies here`;
      if (pctCurrently < 70) return `Solid: ${pctCurrently}% of peers also offer this`;
      return `Table stakes: ${pctCurrently}% of peers offer this`;
    }
    if (statusInfo.key === 'planning') {
      // In planning cohort
      if (pctCurrently > 50) return `${pctCurrently}% already offer; completing this brings you in line with peer practices`;
      return `You're among the ${pctPlanning}% in planning; ${pctCurrently}% already offer`;
    }
    if (statusInfo.key === 'assessing') {
      // Assessing feasibility
      const aheadPct = pctCurrently + pctPlanning;
      if (aheadPct > 60) return `Decision point: ${aheadPct}% are further along (${pctCurrently}% offer, ${pctPlanning}% planning)`;
      return `Common inflection point: ${pctAssessing}% also assessing; ${pctCurrently}% already offer`;
    }
    // Gap / Not able
    const exploringPct = pctCurrently + pctPlanning + pctAssessing;
    if (pctCurrently > 50) return `Competitive gap: ${pctCurrently}% of peers offer this`;
    if (exploringPct > 60) return `${exploringPct}% are at least exploring this (${pctCurrently}% offer)`;
    return `Emerging area: ${pctCurrently}% currently offer`;
  };

  return (
    <div className="ppt-break mb-8 pdf-no-break">
      {/* Section Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Dimension Deep Dive</h3>
        <p className="text-slate-500 mt-1">Click any dimension to explore element-level details and benchmark comparisons</p>
      </div>
      
      {/* Dimension Rows - Split into two containers for PPT */}
      {/* Dimensions 1-7 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        {sortedDims.filter(d => d.dim <= 7).map((d, idx, arr) => {
          const isSelected = selectedDim === d.dim;
          const diff = d.benchmark !== null ? d.score - d.benchmark : null;
          const isLast = idx === arr.length - 1;
          
          return (
            <div key={d.dim}>
              <button
                onClick={() => setSelectedDim(isSelected ? null : d.dim)}
                className={`w-full text-left transition-all duration-200 ${
                  isSelected 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white hover:bg-slate-50'
                } ${!isLast && !isSelected ? 'border-b border-slate-100' : ''}`}
              >
                <div className="flex items-center px-6 py-4">
                  {/* Dimension Number Badge */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: isSelected ? '#6366F1' : d.tier.color }}
                  >
                    {d.dim}
                  </div>
                  
                  {/* Full Dimension Name */}
                  <div className="ml-4 flex-1 min-w-0">
                    <p className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {d.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      Weight: {d.weight}%
                    </p>
                  </div>
                  
                  {/* Score Bar */}
                  <div className="w-48 mx-6 hidden md:block">
                    <div className={`h-2 rounded-full overflow-hidden ${isSelected ? 'bg-slate-600' : 'bg-slate-100'}`}>
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${d.score}%`, 
                          backgroundColor: isSelected ? '#A5B4FC' : d.tier.color 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="text-right w-16 shrink-0">
                    <p className={`text-2xl font-bold ${isSelected ? 'text-white' : ''}`} style={{ color: isSelected ? undefined : getScoreColor(d.score) }}>
                      {d.score}
                    </p>
                  </div>
                  
                  {/* Benchmark Diff */}
                  <div className="w-16 text-center shrink-0">
                    {diff !== null && (
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${
                        isSelected 
                          ? (diff > 0 ? 'text-emerald-300' : diff < 0 ? 'text-red-300' : 'text-slate-400')
                          : (diff > 0 ? 'text-emerald-600 bg-emerald-50' : diff < 0 ? 'text-red-500 bg-red-50' : 'text-slate-500 bg-slate-50')
                      }`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </div>
                  
                  {/* Tier Badge */}
                  <div className="w-24 text-center shrink-0">
                    <span 
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : ''
                      }`}
                      style={isSelected ? {} : { backgroundColor: `${d.tier.color}15`, color: d.tier.color }}
                    >
                      {d.tier.name}
                    </span>
                  </div>
                  
                  {/* Expand Icon */}
                  <div className={`w-8 shrink-0 flex justify-center transition-transform duration-200 ${isSelected ? 'rotate-180' : ''}`}>
                    <svg className={`w-5 h-5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>
              
              {/* Expanded Element Details - Inline */}
              {isSelected && selectedData && (
                <div className="bg-slate-50 border-t border-slate-200">
                  <div className="px-6 py-5">
                    {/* Quick Stats */}
                    <div className="flex items-center gap-6 mb-5 text-sm">
                      <span className="text-slate-600">
                        <strong className="text-emerald-600">{selectedData.strengths.length}</strong> currently offering
                      </span>
                      <span className="text-slate-600">
                        <strong className="text-blue-600">{selectedData.planningItems?.length || 0}</strong> in planning
                      </span>
                      <span className="text-slate-600">
                        <strong className="text-amber-600">{selectedData.assessingItems?.length || 0}</strong> assessing
                      </span>
                      <span className="text-slate-600">
                        <strong className="text-red-500">{selectedData.needsAttention.length}</strong> gaps
                      </span>
                    </div>
                    
                    {/* Element Table */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          {/* Two-row header for clarity */}
                          <tr className="bg-slate-100 border-b border-slate-200">
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider align-bottom">Element</th>
                            <th rowSpan={2} className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-28 align-bottom bg-slate-200 border-l-2 border-r-2 border-slate-300">Your Status</th>
                            <th colSpan={4} className="px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-300 bg-slate-50">Benchmark Distribution</th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider align-bottom">Insight</th>
                          </tr>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider w-24 border-l border-slate-200" style={{ color: STATUS.currently.bg }}>Offering</th>
                            <th className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider w-24" style={{ color: STATUS.planning.bg }}>Planning</th>
                            <th className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider w-24" style={{ color: STATUS.assessing.bg }}>Assessing</th>
                            <th className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider w-24" style={{ color: STATUS.notAble.bg }}>Not Able</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedData.elements.map((elem: any, idx: number) => {
                            const bench = elemBench[elem.name] || { currently: 0, planning: 0, assessing: 0, notAble: 0, total: 1 };
                            const total = bench.total || 1;
                            const statusInfo = getStatusInfo(elem);
                            const obsKey = `${selectedDim}-${idx}`;
                            const defaultObs = getDefaultObservation(elem, bench);
                            
                            return (
                              <tr key={idx} className={idx < selectedData.elements.length - 1 ? 'border-b border-slate-100' : ''}>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-slate-700">{elem.name}</span>
                                </td>
                                <td className="px-4 py-3 text-center bg-slate-50 border-l-2 border-r-2 border-slate-200">
                                  <span 
                                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                                    style={{ backgroundColor: statusInfo.light, color: statusInfo.text }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusInfo.bg }} />
                                    {statusInfo.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center border-l border-slate-100">
                                  <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                    statusInfo.key === 'currently' ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-slate-50'
                                  }`} style={{ color: STATUS.currently.bg }}>
                                    {Math.round((bench.currently / total) * 100)}%
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                    statusInfo.key === 'planning' ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-50'
                                  }`} style={{ color: STATUS.planning.bg }}>
                                    {Math.round((bench.planning / total) * 100)}%
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                    statusInfo.key === 'assessing' ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-slate-50'
                                  }`} style={{ color: STATUS.assessing.bg }}>
                                    {Math.round((bench.assessing / total) * 100)}%
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                    statusInfo.key === 'notAble' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-slate-50'
                                  }`} style={{ color: STATUS.notAble.bg }}>
                                    {Math.round((bench.notAble / total) * 100)}%
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={customObservations[obsKey] ?? defaultObs}
                                      onChange={(e) => setCustomObservations?.({ ...customObservations, [obsKey]: e.target.value })}
                                      className="w-full text-xs text-slate-600 bg-amber-50 border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                    />
                                  ) : (
                                    <span className="text-xs text-slate-500">{customObservations[obsKey] || defaultObs}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Geographic Multiplier & Follow-up Sections */}
                    {(
                    <div className="mt-6 space-y-4">
                      {/* Geographic Multiplier - only show for multi-country companies */}
                      {!isSingleCountryCompany && (
                      <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wide">Geographic Multiplier</h4>
                        <div className="space-y-1">
                          {(() => {
                            const geoText = d.geoResponse ? String(d.geoResponse).toLowerCase() : '';
                            const isConsistent = geoText.includes('consistent');
                            const isVaries = geoText.includes('var');
                            const isSelect = geoText.includes('select');
                            
                            const options = [
                              { label: 'Consistent across all locations', multiplier: 'x1.00', selected: isConsistent, color: 'text-emerald-600', benchPct: 55 },
                              { label: 'Varies by location', multiplier: 'x0.90', selected: isVaries, color: 'text-amber-600', benchPct: 25 },
                              { label: 'Only available in select locations', multiplier: 'x0.75', selected: isSelect, color: 'text-red-500', benchPct: 20 },
                            ];
                            
                            return options.map((opt, i) => (
                              <div key={i} className={`flex justify-between items-center px-2 py-1.5 rounded text-xs ${opt.selected ? 'bg-purple-100 border-2 border-purple-400' : 'bg-slate-50'}`}>
                                <div className="flex items-center gap-2">
                                  {opt.selected && <span className="text-purple-600">✓</span>}
                                  <span className={opt.selected ? 'font-semibold text-purple-900' : 'text-slate-600'}>{opt.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-400 w-10 text-center">{opt.benchPct}%</span>
                                  <span className={`font-semibold w-12 text-right ${opt.color}`}>{opt.multiplier}</span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                      )}
                      
                      {/* Follow-up Questions (only for D1, D3, D12, D13) */}
                      {d.dim === 1 && (
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                          <h4 className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">D1: Medical Leave Follow-ups</h4>
                          
                          {/* USA Question */}
                          <p className="text-xs text-slate-600 mb-2">D1_1 (USA): "How many weeks of 100% paid medical leave do you offer employees based in the USA?"</p>
                          <div className="flex justify-end text-[10px] text-slate-500 font-medium mb-1 pr-2">
                            <span className="w-16 text-center">Benchmark</span>
                            <span className="w-14 text-right">Points</span>
                          </div>
                          <div className="space-y-0.5 mb-4">
                            {(() => {
                              const usaScore = d.followUpRaw?.d1_1_usa_score;
                              return [
                                { label: '13 or more weeks', points: 100, benchPct: 28 },
                                { label: '9 to less than 13 weeks', points: 70, benchPct: 22 },
                                { label: '5 to less than 9 weeks', points: 40, benchPct: 18 },
                                { label: '3 to less than 5 weeks', points: 20, benchPct: 15 },
                                { label: '1 to less than 3 weeks', points: 10, benchPct: 10 },
                                { label: 'Does not apply / None', points: 0, benchPct: 7 },
                              ].map((opt, i) => {
                                const isSelected = usaScore === opt.points;
                                return (
                                  <div key={i} className={`flex justify-between items-center px-2 py-1.5 rounded text-xs ${isSelected ? 'bg-blue-100 border-2 border-blue-400' : 'bg-slate-50'}`}>
                                    <div className="flex items-center gap-2">
                                      {isSelected && <span className="text-blue-600">✓</span>}
                                      <span className={isSelected ? 'font-semibold text-blue-900' : 'text-slate-700'}>{opt.label}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-slate-500 w-16 text-center">{opt.benchPct}%</span>
                                      <span className={`font-semibold w-14 text-right ${opt.points >= 70 ? 'text-emerald-600' : opt.points >= 40 ? 'text-blue-600' : opt.points >= 20 ? 'text-amber-600' : 'text-red-500'}`}>{opt.points} pts</span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          
                          {/* Non-USA Question */}
                          <p className="text-xs text-slate-600 mb-2">D1_1 (Outside USA): "How many weeks of 100% paid medical leave do you offer employees based outside the USA?"</p>
                          <div className="flex justify-end text-[10px] text-slate-500 font-medium mb-1 pr-2">
                            <span className="w-16 text-center">Benchmark</span>
                            <span className="w-14 text-right">Points</span>
                          </div>
                          <div className="space-y-0.5">
                            {(() => {
                              const nonUsaScore = d.followUpRaw?.d1_1_non_usa_score;
                              return [
                                { label: '13 or more weeks', points: 100, benchPct: 35 },
                                { label: '9 to less than 13 weeks', points: 70, benchPct: 25 },
                                { label: '5 to less than 9 weeks', points: 40, benchPct: 15 },
                                { label: '3 to less than 5 weeks', points: 20, benchPct: 12 },
                                { label: '1 to less than 3 weeks', points: 10, benchPct: 8 },
                                { label: 'Does not apply / None', points: 0, benchPct: 5 },
                              ].map((opt, i) => {
                                const isSelected = nonUsaScore === opt.points;
                                return (
                                  <div key={i} className={`flex justify-between items-center px-2 py-1.5 rounded text-xs ${isSelected ? 'bg-blue-100 border-2 border-blue-400' : 'bg-slate-50'}`}>
                                    <div className="flex items-center gap-2">
                                      {isSelected && <span className="text-blue-600">✓</span>}
                                      <span className={isSelected ? 'font-semibold text-blue-900' : 'text-slate-700'}>{opt.label}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-slate-500 w-16 text-center">{opt.benchPct}%</span>
                                      <span className={`font-semibold w-14 text-right ${opt.points >= 70 ? 'text-emerald-600' : opt.points >= 40 ? 'text-blue-600' : opt.points >= 20 ? 'text-amber-600' : 'text-red-500'}`}>{opt.points} pts</span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          <p className="text-[10px] text-slate-400 italic mt-3">Note: If both USA and non-USA values provided, scores are averaged.</p>
                        </div>
                      )}
                      
                      {d.dim === 3 && (
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                          <h4 className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">D3: Manager Training Follow-up (D3_1)</h4>
                          <p className="text-xs text-slate-600 mb-2">"What percentage of managers have received training on supporting employees with serious health conditions?"</p>
                          <div className="flex justify-end text-[10px] text-slate-500 font-medium mb-1 pr-2">
                            <span className="w-16 text-center">Benchmark</span>
                            <span className="w-14 text-right">Points</span>
                          </div>
                          <div className="space-y-0.5">
                            {(() => {
                              const d3Score = d.followUpRaw?.d3_1_score;
                              return [
                                { label: '100% of managers', points: 100, benchPct: 12 },
                                { label: '75% to less than 100%', points: 80, benchPct: 18 },
                                { label: '50% to less than 75%', points: 50, benchPct: 25 },
                                { label: '25% to less than 50%', points: 30, benchPct: 20 },
                                { label: '10% to less than 25%', points: 10, benchPct: 15 },
                                { label: 'Less than 10%', points: 0, benchPct: 10 },
                              ].map((opt, i) => {
                                const isSelected = d3Score === opt.points;
                                return (
                                  <div key={i} className={`flex justify-between items-center px-2 py-1.5 rounded text-xs ${isSelected ? 'bg-blue-100 border-2 border-blue-400' : 'bg-slate-50'}`}>
                                    <div className="flex items-center gap-2">
                                      {isSelected && <span className="text-blue-600">✓</span>}
                                      <span className={isSelected ? 'font-semibold text-blue-900' : 'text-slate-700'}>{opt.label}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-slate-500 w-16 text-center">{opt.benchPct}%</span>
                                      <span className={`font-semibold w-14 text-right ${opt.points >= 80 ? 'text-emerald-600' : opt.points >= 50 ? 'text-blue-600' : opt.points >= 30 ? 'text-amber-600' : 'text-red-500'}`}>{opt.points} pts</span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                    
                    {/* Benchmark note */}
                    <p className="text-xs text-slate-400 mt-3 text-right">
                      Benchmark based on all participating companies
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Dimensions 8-13 */}
      <div className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        {sortedDims.filter(d => d.dim >= 8).map((d, idx, arr) => {
          const isSelected = selectedDim === d.dim;
          const diff = d.benchmark !== null ? d.score - d.benchmark : null;
          const isLast = idx === arr.length - 1;
          
          return (
            <div key={d.dim}>
              <button
                onClick={() => setSelectedDim(isSelected ? null : d.dim)}
                className={`w-full text-left transition-all duration-200 ${
                  isSelected 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white hover:bg-slate-50'
                } ${!isLast && !isSelected ? 'border-b border-slate-100' : ''}`}
              >
                <div className="flex items-center px-6 py-4">
                  {/* Dimension Number Badge */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: isSelected ? '#6366F1' : d.tier.color }}
                  >
                    {d.dim}
                  </div>
                  
                  {/* Full Dimension Name */}
                  <div className="ml-4 flex-1 min-w-0">
                    <p className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {d.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      Weight: {d.weight}%
                    </p>
                  </div>
                  
                  {/* Score Bar */}
                  <div className="w-48 mx-6 hidden md:block">
                    <div className={`h-2 rounded-full overflow-hidden ${isSelected ? 'bg-slate-600' : 'bg-slate-100'}`}>
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${d.score}%`, 
                          backgroundColor: isSelected ? '#A5B4FC' : d.tier.color 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Score Display */}
                  <div className="text-right shrink-0 w-20">
                    <p className={`text-2xl font-bold ${isSelected ? 'text-white' : ''}`} style={{ color: isSelected ? undefined : d.tier.color }}>
                      {d.score}
                    </p>
                    {diff !== null && (
                      <p className={`text-xs mt-0.5 ${
                        isSelected 
                          ? (diff >= 0 ? 'text-emerald-300' : 'text-amber-300')
                          : (diff >= 0 ? 'text-emerald-600' : 'text-amber-600')
                      }`}>
                        {diff >= 0 ? '+' : ''}{diff} vs avg
                      </p>
                    )}
                  </div>
                  
                  {/* Expand Arrow */}
                  <div className={`ml-4 transition-transform ${isSelected ? 'rotate-180' : ''}`}>
                    <svg className={`w-5 h-5 ${isSelected ? 'text-slate-400' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>
              
              {/* Expanded Detail Panel */}
              {isSelected && selectedData && (
                <div className="bg-slate-50 border-t border-slate-200 p-6">
                  {/* Custom Insight */}
                  <div className="bg-white rounded-lg p-4 mb-6 border border-slate-200">
                    {isEditing ? (
                      <textarea
                        value={customObservations[`dim${d.dim}_insight`] ?? selectedData.insight}
                        onChange={(e) => setCustomObservations?.({ ...customObservations, [`dim${d.dim}_insight`]: e.target.value })}
                        className="w-full text-slate-700 text-sm leading-relaxed bg-amber-50 border border-amber-300 rounded p-2 min-h-[60px] focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    ) : (
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {customObservations[`dim${d.dim}_insight`] || selectedData.insight}
                      </p>
                    )}
                  </div>
                  
                  {/* Element Details Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Element</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Status</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: STATUS.currently.bg }}>Offering</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: STATUS.planning.bg }}>Planning</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: STATUS.assessing.bg }}>Assessing</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: STATUS.notAble.bg }}>Not Offering</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Observation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedData.elements.map((el: any, elIdx: number) => {
                          const bench = elemBench[el.name] || { currently: 0, planning: 0, assessing: 0, notAble: 0, total: 0 };
                          const total = bench.total || 1;
                          // Map category to STATUS key - currently_offer -> currently, not_able -> notAble
                          const categoryToStatusKey: Record<string, string> = {
                            'currently_offer': 'currently',
                            'planning': 'planning', 
                            'assessing': 'assessing',
                            'not_able': 'notAble',
                            'unknown': 'notAble'
                          };
                          const statusKey = categoryToStatusKey[el.category] || 'notAble';
                          const statusInfo = { key: statusKey, ...STATUS[statusKey as keyof typeof STATUS] };
                          const obsKey = `dim${d.dim}_${el.name}`;
                          const defaultObs = getDefaultObservation(el, bench);
                          
                          return (
                            <tr key={elIdx} className={`border-b border-slate-100 ${elIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium text-slate-700">{el.name}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span 
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                                  style={{ 
                                    backgroundColor: statusInfo.light,
                                    color: statusInfo.text
                                  }}
                                >
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center border-l border-slate-100">
                                <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                  statusInfo.key === 'currently' ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-slate-50'
                                }`} style={{ color: STATUS.currently.bg }}>
                                  {Math.round((bench.currently / total) * 100)}%
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                  statusInfo.key === 'planning' ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-50'
                                }`} style={{ color: STATUS.planning.bg }}>
                                  {Math.round((bench.planning / total) * 100)}%
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                  statusInfo.key === 'assessing' ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-slate-50'
                                }`} style={{ color: STATUS.assessing.bg }}>
                                  {Math.round((bench.assessing / total) * 100)}%
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                  statusInfo.key === 'notAble' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-slate-50'
                                }`} style={{ color: STATUS.notAble.bg }}>
                                  {Math.round((bench.notAble / total) * 100)}%
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={customObservations[obsKey] ?? defaultObs}
                                    onChange={(e) => setCustomObservations?.({ ...customObservations, [obsKey]: e.target.value })}
                                    className="w-full text-xs text-slate-600 bg-amber-50 border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                  />
                                ) : (
                                  <span className="text-xs text-slate-500">{customObservations[obsKey] || defaultObs}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Geographic Multiplier & Follow-up Sections */}
                  {(
                  <div className="mt-6 space-y-4">
                    {/* Geographic Multiplier - only show for multi-country companies */}
                    {!isSingleCountryCompany && (
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <h4 className="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wide">Geographic Multiplier</h4>
                      <div className="flex justify-end text-[10px] text-slate-500 font-medium mb-1 pr-2">
                        <span className="w-16 text-center">Benchmark</span>
                        <span className="w-14 text-right">Multiplier</span>
                      </div>
                      <div className="space-y-0.5">
                        {(() => {
                          const geoText = d.geoResponse ? String(d.geoResponse).toLowerCase() : '';
                          const isConsistent = geoText.includes('consistent');
                          const isVaries = geoText.includes('var');
                          const isSelect = geoText.includes('select');
                          
                          const options = [
                            { label: 'Consistent across all locations', multiplier: 'x1.00', selected: isConsistent, color: 'text-emerald-600', benchPct: 55 },
                            { label: 'Varies by location', multiplier: 'x0.90', selected: isVaries, color: 'text-amber-600', benchPct: 25 },
                            { label: 'Only available in select locations', multiplier: 'x0.75', selected: isSelect, color: 'text-red-500', benchPct: 20 },
                          ];
                          
                          return options.map((opt, i) => (
                            <div key={i} className={`flex justify-between items-center px-2 py-1.5 rounded text-xs ${opt.selected ? 'bg-purple-100 border-2 border-purple-400' : 'bg-slate-50'}`}>
                              <div className="flex items-center gap-2">
                                {opt.selected && <span className="text-purple-600">✓</span>}
                                <span className={opt.selected ? 'font-semibold text-purple-900' : 'text-slate-700'}>{opt.label}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-slate-500 w-16 text-center">{opt.benchPct}%</span>
                                <span className={`font-semibold w-14 text-right ${opt.color}`}>{opt.multiplier}</span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                    )}
                    
                    {/* D12 Follow-ups */}
                    {d.dim === 12 && (
                      <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="text-xs font-semibold text-teal-700 mb-3 uppercase tracking-wide">D12: Continuous Improvement Follow-ups</h4>
                        
                        <p className="text-xs text-slate-600 mb-2">D12_1: "Do you review individual employee experiences to assess accommodation effectiveness?"</p>
                        <div className="flex justify-end text-[10px] text-slate-500 font-medium mb-1 pr-2">
                          <span className="w-16 text-center">Benchmark</span>
                          <span className="w-14 text-right">Points</span>
                        </div>
                        <div className="space-y-0.5 mb-4">
                          {(() => {
                            const d12_1_score = d.followUpRaw?.d12_1_score;
                            return [
                              { label: 'Yes, using a systematic case review process', points: 100, benchPct: 22 },
                              { label: 'Yes, using ad hoc case reviews', points: 50, benchPct: 45 },
                              { label: 'No, we only review aggregate metrics', points: 0, benchPct: 33 },
                            ].map((opt, i) => {
                              const isSelected = d12_1_score === opt.points;
                              return (
                                <div key={i} className={`flex justify-between items-center px-2 py-1.5 rounded text-xs ${isSelected ? 'bg-teal-100 border-2 border-teal-400' : 'bg-slate-50'}`}>
                                  <div className="flex items-center gap-2">
                                    {isSelected && <span className="text-teal-600">✓</span>}
                                    <span className={isSelected ? 'font-semibold text-teal-900' : 'text-slate-700'}>{opt.label}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-slate-500 w-16 text-center">{opt.benchPct}%</span>
                                    <span className={`font-semibold w-14 text-right ${opt.points >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>{opt.points} pts</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                        
                        <p className="text-xs text-slate-600 mb-2">D12_2: "Over the past 2 years, have individual employee experiences led to specific changes to your programs?"</p>
                        <div className="flex justify-end text-[10px] text-slate-500 font-medium mb-1 pr-2">
                          <span className="w-16 text-center">Benchmark</span>
                          <span className="w-14 text-right">Points</span>
                        </div>
                        <div className="space-y-0.5">
                          {(() => {
                            const d12_2_score = d.followUpRaw?.d12_2_score;
                            return [
                              { label: 'Yes, several changes implemented', points: 100, benchPct: 18 },
                              { label: 'Yes, a few changes implemented', points: 60, benchPct: 52 },
                              { label: 'No', points: 0, benchPct: 30 },
                            ].map((opt, i) => {
                              const isSelected = d12_2_score === opt.points;
                              return (
                                <div key={i} className={`flex justify-between items-center px-2 py-1.5 rounded text-xs ${isSelected ? 'bg-teal-100 border-2 border-teal-400' : 'bg-slate-50'}`}>
                                  <div className="flex items-center gap-2">
                                    {isSelected && <span className="text-teal-600">✓</span>}
                                    <span className={isSelected ? 'font-semibold text-teal-900' : 'text-slate-700'}>{opt.label}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-slate-500 w-16 text-center">{opt.benchPct}%</span>
                                    <span className={`font-semibold w-14 text-right ${opt.points >= 60 ? 'text-emerald-600' : 'text-red-500'}`}>{opt.points} pts</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                        <p className="text-[10px] text-slate-400 italic mt-3">Note: D12 Follow-up = Average of D12_1 and D12_2 (if both present)</p>
                      </div>
                    )}
                    
                    {/* D13 Follow-up */}
                    {d.dim === 13 && (
                      <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wide">D13: Communication Follow-up (D13_1)</h4>
                        <p className="text-xs text-slate-600 mb-2">"How frequently do you communicate about health support programs to employees?"</p>
                        <div className="flex justify-end text-[10px] text-slate-500 font-medium mb-1 pr-2">
                          <span className="w-16 text-center">Benchmark</span>
                          <span className="w-14 text-right">Points</span>
                        </div>
                        <div className="space-y-0.5">
                          {(() => {
                            const d13Score = d.followUpRaw?.d13_1_score;
                            return [
                              { label: 'Monthly', points: 100, benchPct: 8 },
                              { label: 'Quarterly', points: 70, benchPct: 25 },
                              { label: 'Twice per year', points: 40, benchPct: 30 },
                              { label: 'Annually / World Cancer Day', points: 20, benchPct: 22 },
                              { label: 'Only when asked', points: 0, benchPct: 10 },
                              { label: 'Do not actively communicate', points: 0, benchPct: 5 },
                            ].map((opt, i) => {
                              const isSelected = d13Score === opt.points;
                              return (
                                <div key={i} className={`flex justify-between items-center px-2 py-1.5 rounded text-xs ${isSelected ? 'bg-orange-100 border-2 border-orange-400' : 'bg-slate-50'}`}>
                                  <div className="flex items-center gap-2">
                                    {isSelected && <span className="text-orange-600">✓</span>}
                                    <span className={isSelected ? 'font-semibold text-orange-900' : 'text-slate-700'}>{opt.label}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-slate-500 w-16 text-center">{opt.benchPct}%</span>
                                    <span className={`font-semibold w-14 text-right ${opt.points >= 70 ? 'text-emerald-600' : opt.points >= 40 ? 'text-blue-600' : opt.points >= 20 ? 'text-amber-600' : 'text-red-500'}`}>{opt.points} pts</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                  
                  {/* Benchmark note */}
                  <p className="text-xs text-slate-400 mt-3 text-right">
                    Benchmark based on all participating companies
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ExportReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const exportMode = searchParams?.get('export') === '1';
  const mode = (searchParams?.get('mode') || '').toLowerCase();
  const orientation = searchParams?.get('orientation') || 'portrait';
  const isLandscape = orientation === 'landscape';
  const isPdf = exportMode && mode === 'pdf';
  const isPpt = exportMode && (mode === 'ppt' || mode === 'pptslides');
  const isPptReport = exportMode && mode === 'pptreport';
  const isLandscapePdf = exportMode && mode === 'landscapepdf';
  
  // Polished design toggle: ?design=polished
  const usePolishedDesign = searchParams?.get('design') === 'polished';

  const surveyId = Array.isArray(params.surveyId) ? params.surveyId[0] : params.surveyId;
  const printRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [companyScores, setCompanyScores] = useState<any>(null);
  const [elementDetails, setElementDetails] = useState<any>(null);
  const [percentileRank, setPercentileRank] = useState<number | null>(null);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);
  
  // Edit Mode State
  const [editMode, setEditMode] = useState(false);
  const [customInsights, setCustomInsights] = useState<Record<number, { insight: string; cacHelp: string }>>({});
  const [customExecutiveSummary, setCustomExecutiveSummary] = useState<string>('');
  const [customPatterns, setCustomPatterns] = useState<{ pattern: string; implication: string; recommendation: string }[]>([]);
  const [customRecommendations, setCustomRecommendations] = useState<Record<number, string>>({}); // dimNum -> custom recommendation
  const [customCrossRecommendations, setCustomCrossRecommendations] = useState<Record<number, string>>({}); // pattern index -> custom recommendation
  const [customRoadmap, setCustomRoadmap] = useState<{
    phase1?: { items: string[]; useCustom: boolean };
    phase2?: { items: string[]; useCustom: boolean };
    phase3?: { items: string[]; useCustom: boolean };
  }>({});
  const [customCacHelp, setCustomCacHelp] = useState<{
    item1?: { title: string; bullets: string[] };
    item2?: { title: string; bullets: string[] };
    item3?: { title: string; bullets: string[] };
    item4?: { title: string; bullets: string[] };
  }>({});
  const [customRoadmapTimeframes, setCustomRoadmapTimeframes] = useState<{
    phase1?: string;
    phase2?: string;
    phase3?: string;
  }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [showInteractiveLinkModal, setShowInteractiveLinkModal] = useState(false);
  const [selectedDrillDownDim, setSelectedDrillDownDim] = useState<number | null>(null);
  const [elementBenchmarks, setElementBenchmarks] = useState<Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>>>({});
  const [customObservations, setCustomObservations] = useState<Record<string, string>>({});
  const [interactiveLink, setInteractiveLink] = useState<{ url: string; password: string } | null>(null);
  const [showBenchmarkRings, setShowBenchmarkRings] = useState(false);
  const [activeScoreOverlay, setActiveScoreOverlay] = useState<'weightedDim' | 'maturity' | 'breadth' | null>(null);
  const [hoveredMatrixDim, setHoveredMatrixDim] = useState<number | null>(null);
  const [dimensionDetailModal, setDimensionDetailModal] = useState<number | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);
  const [exportProgress, setExportProgress] = useState({ step: '', percent: 0 });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [infoModal, setInfoModal] = useState<'crossDimensional' | 'impactRanked' | 'excellence' | 'growth' | 'strategicRecos' | null>(null);
  
  // Info modal content
  const infoContent = {
    crossDimensional: {
      title: 'Cross-Dimensional Insights',
      what: 'Identifies meaningful patterns that emerge when comparing different dimensions together. These insights reveal systemic organizational issues or opportunities that wouldn\'t be visible looking at dimensions individually.',
      how: 'The system checks for specific pattern combinations—for example, if Culture scores high but Manager Preparedness scores low, it surfaces the insight that "employees feel safe disclosing but managers lack tools to respond." Each pattern has specific score thresholds that trigger it.',
      when: 'Use these insights to understand the "why" behind your scores and identify root causes. They\'re especially valuable for leadership discussions and strategic planning.',
      questions: ['Why aren\'t employees using our benefits?', 'What systemic issues should leadership understand?', 'Are there hidden connections between our programs?', 'What organizational dynamics affect our cancer support?']
    },
    impactRanked: {
      title: 'Impact-Ranked Improvement Priorities',
      what: 'Ranks all 13 dimensions by which ones will give you the biggest "bang for your buck" if you improve them. This considers both the potential score improvement AND the dimension\'s weight in your composite score.',
      how: 'Calculates ROI as: (potential score gain × dimension weight) × effort multiplier. Potential improvement varies based on your starting score—lower-scoring dimensions have more room for quick gains, while higher-scoring dimensions see more incremental improvements. Effort is assessed based on number of gaps and current progress (Low, Medium, or High).',
      when: 'Use this for tactical, short-term prioritization—deciding where to focus resources this quarter or this year.',
      questions: ['Where should we focus resources this quarter?', 'What will move our composite score the most?', 'Which improvements offer the best ROI?', 'What\'s the most efficient path to improvement?']
    },
    excellence: {
      title: 'Areas of Excellence',
      what: 'Highlights your top-performing dimensions—those where you\'re already doing well and can leverage as competitive advantages.',
      how: 'Simply identifies dimensions with the highest scores, representing your strongest current capabilities in cancer support.',
      when: 'Use these to identify best practices to share across the organization, build employer brand messaging, and understand what\'s working well.',
      questions: ['What are we doing right?', 'Which programs can we highlight for recruiting?', 'What best practices can we share?', 'Where are we leading vs. peers?']
    },
    growth: {
      title: 'Areas for Growth',
      what: 'Identifies your lower-performing dimensions that represent the greatest opportunities for improvement.',
      how: 'Shows dimensions with the lowest scores, indicating where your cancer support programs need the most attention.',
      when: 'Use these to prioritize improvement initiatives and understand where you have the most room to grow.',
      questions: ['Where do we have the most room to improve?', 'What gaps should we address first?', 'Which areas need immediate attention?', 'Where are we falling behind peers?']
    },
    strategicRecos: {
      title: 'Strategic Recommendations',
      what: 'Provides comprehensive analysis and detailed action plans for your 4 lowest-scoring dimensions. This is your long-term roadmap for addressing your biggest weaknesses.',
      how: 'Sorts all 13 dimensions by score (lowest first) and provides deep-dive analysis including gaps, in-progress items, strengths, evidence, insights, and step-by-step roadmaps.',
      when: 'Use this for long-term strategic planning, building detailed improvement roadmaps, and comprehensive program development.',
      questions: ['What\'s our 12-month improvement plan?', 'What specific actions should we take?', 'How do we build comprehensive cancer support?', 'What resources does CAC offer to help?']
    }
  };
  
  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };
  
  // Helper to update custom insight for a dimension
  const updateCustomInsight = (dimNum: number, field: 'insight' | 'cacHelp', value: string) => {
    setCustomInsights(prev => ({
      ...prev,
      [dimNum]: {
        ...prev[dimNum],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  // Helper to update custom recommendation for a dimension
  const updateCustomRecommendation = (dimNum: number, value: string) => {
    setCustomRecommendations(prev => ({
      ...prev,
      [dimNum]: value
    }));
    setHasUnsavedChanges(true);
  };
  
  // Helper to update custom cross-dimension recommendation
  const updateCustomCrossRecommendation = (patternIdx: number, value: string) => {
    setCustomCrossRecommendations(prev => ({
      ...prev,
      [patternIdx]: value
    }));
    setHasUnsavedChanges(true);
  };
  
  // Helper to update custom roadmap phase
  const updateCustomRoadmap = (phase: 'phase1' | 'phase2' | 'phase3', items: string[], useCustom: boolean) => {
    setCustomRoadmap(prev => ({
      ...prev,
      [phase]: { items, useCustom }
    }));
    setHasUnsavedChanges(true);
  };
  
  // Get effective insight (custom or generated)
  const getEffectiveInsight = (dimNum: number, generatedInsight: { insight: string; cacHelp: string }) => {
    const custom = customInsights[dimNum];
    return {
      insight: custom?.insight || generatedInsight.insight,
      cacHelp: custom?.cacHelp || generatedInsight.cacHelp
    };
  };
  
  // Save edits to database
  const saveEdits = async () => {
    if (!company?.id) return;
    setSavingEdits(true);
    try {
      const { error } = await supabase
        .from('assessments')
        .update({
          report_customizations: JSON.stringify({
            customInsights,
            customExecutiveSummary,
            customPatterns,
            customRecommendations,
            customCrossRecommendations,
            customRoadmap,
            customCacHelp,
            customRoadmapTimeframes,
            lastEditedAt: new Date().toISOString()
          })
        })
        .eq('id', company.id);
      
      if (error) throw error;
      setHasUnsavedChanges(false);
      showToast('Customizations saved successfully!', 'success');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save customizations', 'error');
    } finally {
      setSavingEdits(false);
    }
  };
  
  // Reset edits to generated defaults
  const resetEdits = () => {
    if (confirm('Reset all customizations to auto-generated content?')) {
      setCustomInsights({});
      setCustomExecutiveSummary('');
      setCustomPatterns([]);
      setCustomRecommendations({});
      setCustomCrossRecommendations({});
      setCustomRoadmap({});
      setHasUnsavedChanges(true);
    }
  };
  
  // Handler wrappers for button clicks
  const handleSaveCustomizations = async () => {
    await saveEdits();
  };
  
  const handleResetCustomizations = () => {
    resetEdits();
  };
  
  // Load saved customizations when company loads
  useEffect(() => {
    if (company?.report_customizations) {
      try {
        const saved = typeof company.report_customizations === 'string' 
          ? JSON.parse(company.report_customizations)
          : company.report_customizations;
        if (saved.customInsights) setCustomInsights(saved.customInsights);
        if (saved.customExecutiveSummary) setCustomExecutiveSummary(saved.customExecutiveSummary);
        if (saved.customPatterns) setCustomPatterns(saved.customPatterns);
        if (saved.customRecommendations) setCustomRecommendations(saved.customRecommendations);
        if (saved.customCrossRecommendations) setCustomCrossRecommendations(saved.customCrossRecommendations);
        if (saved.customRoadmap) setCustomRoadmap(saved.customRoadmap);
        if (saved.customCacHelp) setCustomCacHelp(saved.customCacHelp);
        if (saved.customRoadmapTimeframes) setCustomRoadmapTimeframes(saved.customRoadmapTimeframes);
      } catch (e) {
        console.error('Error loading customizations:', e);
      }
    }
  }, [company]);

  useEffect(() => {
    // CRITICAL: Reset ALL state when surveyId changes
    setLoading(true);
    setError(null);
    setCompany(null);
    setBenchmarks(null);
    setCompanyScores(null);
    setElementDetails(null);
    setPercentileRank(null);
    setTotalCompanies(0);
    
    async function loadData() {
      try {
        // Normalize survey ID for flexible matching
        const normalizedId = surveyId.replace(/-/g, '').toUpperCase();
        const fpFormat = surveyId.startsWith('FP-') ? surveyId : 
                        surveyId.toUpperCase().startsWith('FPHR') ? 
                        `FP-HR-${surveyId.replace(/^FPHR/i, '')}` : surveyId;
        
        // Try multiple formats: exact, normalized, FP format, and app_id
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .or(`survey_id.eq.${surveyId},survey_id.eq.${normalizedId},survey_id.eq.${fpFormat},app_id.eq.${surveyId},app_id.eq.${normalizedId}`)
          .limit(1)
          .maybeSingle();
        
        if (assessmentError || !assessment) {
          setError(`Company not found: ${assessmentError?.message || 'No data'}`);
          setLoading(false);
          return;
        }
        
        const { data: allAssessments } = await supabase.from('assessments').select('*');
        
        const { scores, elements } = calculateCompanyScores(assessment);
        setCompanyScores(scores);
        setElementDetails(elements);
        setCompany(assessment);
        
        if (allAssessments) {
          const benchmarkScores = calculateBenchmarks(allAssessments);
          setBenchmarks(benchmarkScores);
          
          // Calculate element-level benchmarks for drill-down
          const elemBenchmarks = calculateElementBenchmarks(allAssessments);
          setElementBenchmarks(elemBenchmarks);
          
          const completeAssessments = allAssessments.filter(a => {
            let completedDims = 0;
            for (let dim = 1; dim <= 13; dim++) {
              const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
              if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) completedDims++;
            }
            return completedDims === 13;
          });
          
          const allComposites = completeAssessments.map(a => {
            try { return calculateCompanyScores(a).scores.compositeScore; } catch { return null; }
          }).filter(s => s !== null) as number[];
          
          if (allComposites.length > 0 && scores.compositeScore) {
            const belowCount = allComposites.filter(s => s < scores.compositeScore).length;
            setPercentileRank(Math.round((belowCount / allComposites.length) * 100));
            setTotalCompanies(allComposites.length);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading report data:', err);
        setError('Failed to load report data');
        setLoading(false);
      }
    }
    
    if (surveyId) loadData();
    else { setError('No survey ID provided'); setLoading(false); }
  }, [surveyId]);

  function calculateCompanyScores(assessment: Record<string, any>) {
    const dimensionScores: Record<number, number | null> = {};
    const followUpScores: Record<number, number | null> = {};
    const geoMultipliers: Record<number, number> = {};
    const geoResponses: Record<number, string | null> = {};
    const elementsByDim: Record<number, any[]> = {};
    const blendedScores: Record<number, number> = {};
    const followUpRawResponses: Record<number, any> = {};
    
    // Check if company is single-country (S9a = "No other countries" or "headquarters only")
    const firmographics = assessment.firmographics_data || {};
    const s9a = firmographics.s9a || '';
    const s9aLower = typeof s9a === 'string' ? s9a.toLowerCase() : '';
    const isSingleCountryCompany = s9aLower.includes('no other countries') || s9aLower.includes('headquarters only') || s9aLower === '';
    
    let completedDimCount = 0;
    
    for (let dim = 1; dim <= 13; dim++) {
      const dimData = assessment[`dimension${dim}_data`];
      const mainGrid = dimData?.[`d${dim}a`];
      
      elementsByDim[dim] = [];
      blendedScores[dim] = 0;
      
      if (!mainGrid || typeof mainGrid !== 'object') { dimensionScores[dim] = null; continue; }
      
      let earnedPoints = 0; let totalItems = 0; let answeredItems = 0;
      
      Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
        if (dim === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
        totalItems++;
        const result = statusToPoints(status);
        if (result.isUnsure) { answeredItems++; }
        else if (result.points !== null) { answeredItems++; earnedPoints += result.points; }
        
        // Track if this item is NOT currently offered (anything less than full points)
        const isNotOffered = result.category !== 'currently_offer';
        
        elementsByDim[dim].push({
          name: itemKey, status: getStatusText(status), category: result.category,
          points: result.points ?? 0, maxPoints: 5, isStrength: result.points === 5,
          isPlanning: result.category === 'planning', isAssessing: result.category === 'assessing',
          isGap: result.category === 'not_able' || result.category === 'unknown', 
          isUnsure: result.isUnsure,
          isNotOffered: isNotOffered
        });
      });
      
      if (totalItems > 0) completedDimCount++;
      
      const maxPoints = answeredItems * 5;
      const rawScore = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
      
      // For single-country companies, always use 1.0 multiplier regardless of individual dimension responses
      let geoMultiplier = 1.0;
      let geoResponse = null;
      if (isSingleCountryCompany) {
        geoMultiplier = 1.0;
        geoResponse = 'single_country';
      } else {
        const dimGeoResponse = dimData[`d${dim}aa`] || dimData[`D${dim}aa`];
        geoMultiplier = getGeoMultiplier(dimGeoResponse);
        geoResponse = dimGeoResponse ? String(dimGeoResponse) : null;
      }
      geoMultipliers[dim] = geoMultiplier;
      geoResponses[dim] = geoResponse;
      const adjustedScore = Math.round(rawScore * geoMultiplier);
      
      let blendedScore = adjustedScore;
      if ([1, 3, 12, 13].includes(dim)) {
        const followUp = calculateFollowUpScore(dim, assessment);
        followUpScores[dim] = followUp;
        
        // Store raw responses for display highlighting
        if (dim === 1) {
          // Try multiple field name variations
          const usaVal = dimData?.d1_1_usa ?? dimData?.d11_usa ?? dimData?.d1_1 ?? dimData?.d11;
          const nonUsaVal = dimData?.d1_1_non_usa ?? dimData?.d11_non_usa;
          followUpRawResponses[1] = {
            d1_1_usa: usaVal,
            d1_1_non_usa: nonUsaVal,
            d1_1_usa_score: usaVal ? scoreD1PaidLeave(usaVal) : null,
            d1_1_non_usa_score: nonUsaVal ? scoreD1PaidLeave(nonUsaVal) : null
          };
        } else if (dim === 3) {
          const d3Val = dimData?.d31 ?? dimData?.d3_1 ?? dimData?.d3;
          followUpRawResponses[3] = { 
            d3_1: d3Val,
            d3_1_score: d3Val ? scoreD3Training(d3Val) : null
          };
        } else if (dim === 12) {
          followUpRawResponses[12] = { 
            d12_1: dimData?.d12_1, 
            d12_2: dimData?.d12_2,
            d12_1_score: dimData?.d12_1 ? scoreD12CaseReview(dimData.d12_1) : null,
            d12_2_score: dimData?.d12_2 ? scoreD12PolicyChanges(dimData.d12_2) : null
          };
        } else if (dim === 13) {
          followUpRawResponses[13] = { 
            d13_1: dimData?.d13_1,
            d13_1_score: dimData?.d13_1 ? scoreD13Communication(dimData.d13_1) : null
          };
        }
        
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
    
    // Use canonical enhanced-scoring library for composite score to ensure consistency
    // across all pages (scoring page, profile page, report page)
    const enhancedResult = calculateEnhancedScore(assessment);
    const compositeScore = enhancedResult.isComplete ? enhancedResult.compositeScore : null;
    const maturityScore = enhancedResult.maturityScore;
    const breadthScore = enhancedResult.breadthScore;
    
    return { scores: { compositeScore, weightedDimScore, maturityScore, breadthScore, dimensionScores, followUpScores, followUpRawResponses, geoMultipliers, geoResponses, isSingleCountryCompany, tier: compositeScore !== null ? getTier(compositeScore) : null }, elements: elementsByDim };
  }

  function calculateBenchmarks(assessments: any[]) {
    const complete = assessments.filter(a => {
      let completedDims = 0;
      for (let dim = 1; dim <= 13; dim++) {
        const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
        if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) completedDims++;
      }
      return completedDims === 13;
    });
    if (complete.length === 0) return null;
    const allScores = complete.map(a => { try { return calculateCompanyScores(a).scores; } catch { return null; } }).filter(s => s !== null);
    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter(v => v !== null && v !== undefined && !isNaN(v as number)) as number[];
      return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
    };
    const dimensionBenchmarks: Record<number, number | null> = {};
    for (let dim = 1; dim <= 13; dim++) { dimensionBenchmarks[dim] = avg(allScores.map(s => s?.dimensionScores?.[dim])); }
    return { compositeScore: avg(allScores.map(s => s?.compositeScore)), weightedDimScore: avg(allScores.map(s => s?.weightedDimScore)), maturityScore: avg(allScores.map(s => s?.maturityScore)), breadthScore: avg(allScores.map(s => s?.breadthScore)), dimensionScores: dimensionBenchmarks, companyCount: complete.length };
  }

  // Calculate element-level benchmark distributions for drill-down
  function calculateElementBenchmarks(assessments: any[]) {
    const complete = assessments.filter(a => {
      let completedDims = 0;
      for (let dim = 1; dim <= 13; dim++) {
        const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
        if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) completedDims++;
      }
      return completedDims === 13;
    });
    
    if (complete.length === 0) return {};
    
    const elementStats: Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>> = {};
    
    for (let dim = 1; dim <= 13; dim++) {
      elementStats[dim] = {};
      
      complete.forEach(assessment => {
        const dimData = assessment[`dimension${dim}_data`];
        const mainGrid = dimData?.[`d${dim}a`];
        
        if (mainGrid && typeof mainGrid === 'object') {
          Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
            if (dim === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
            
            if (!elementStats[dim][itemKey]) {
              elementStats[dim][itemKey] = { currently: 0, planning: 0, assessing: 0, notAble: 0, total: 0 };
            }
            
            const result = statusToPoints(status);
            elementStats[dim][itemKey].total++;
            
            if (result.category === 'currently_offer') elementStats[dim][itemKey].currently++;
            else if (result.category === 'planning') elementStats[dim][itemKey].planning++;
            else if (result.category === 'assessing') elementStats[dim][itemKey].assessing++;
            else elementStats[dim][itemKey].notAble++;
          });
        }
      });
    }
    
    return elementStats;
  }

  // ============================================
  // EXPORT HELPERS
  // ============================================
  async function waitForFonts() {
    if ((document as any).fonts?.ready) {
      await (document as any).fonts.ready;
    }
  }

  async function waitForImages(root: HTMLElement) {
    const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }));
  }


  // ============================================
  // SERVER EXPORT BUTTONS (Netlify Functions)
  // ============================================
  function handleServerExportPPT() {
    const url = `/.netlify/functions/export-pptx?surveyId=${encodeURIComponent(String(surveyId || ''))}`;
    window.open(url, '_blank');
  }

  // ============================================
  // HYBRID PPTX EXPORT (Screenshots + Editable Text)
  // ============================================
  async function handlePptxExport() {
    setExportingPptx(true);
    setExportProgress({ step: 'Preparing...', percent: 0 });
    
    try {
      // Build the export config from current report data
      const exportConfig = {
        companyName: company?.firmographics_data?.company_name || company?.company_name || 'Company',
        compositeScore: compositeScore || 0,
        benchmarkScore: benchmarks?.compositeScore || 65,
        weightedDimScore: weightedDimScore || 0,
        maturityScore: maturityScore || 0,
        breadthScore: breadthScore || 0,
        tier: getTier(compositeScore || 0).name,
        executiveSummary: customExecutiveSummary || `${company?.firmographics_data?.company_name || 'This organization'} demonstrates ${getTier(compositeScore || 0).name.toLowerCase()} performance in supporting employees managing cancer, with a composite score of ${compositeScore || 0}. The strongest dimension is ${dimensionAnalysis[0]?.name || 'N/A'} (${dimensionAnalysis[0]?.score || 0}), while ${dimensionAnalysis[dimensionAnalysis.length - 1]?.name || 'N/A'} (${dimensionAnalysis[dimensionAnalysis.length - 1]?.score || 0}) represents the greatest opportunity for growth.`,
        dimensions: dimensionAnalysis.map(d => ({
          dim: d.dim,
          name: d.name,
          weight: d.weight,
          score: d.score,
          benchmark: d.benchmark,
          tier: d.tier,
          strengths: d.strengths || [],
          planning: d.planning || [],
          gaps: d.gaps || [],
        })),
        customInsights: customInsights,
      };
      
      await exportHybridPptx(exportConfig, (step, percent) => {
        setExportProgress({ step, percent });
      });
      
      showToast('PowerPoint exported successfully!', 'success');
    } catch (err) {
      console.error('PPTX export error:', err);
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setExportingPptx(false);
      setExportProgress({ step: '', percent: 0 });
    }
  }

  // Generate interactive report link with password
  async function generateInteractiveLink() {
    if (!company?.id) return;
    setGeneratingLink(true);
    
    try {
      // Use Netlify function to generate/retrieve link (bypasses RLS)
      const response = await fetch('/.netlify/functions/generate-interactive-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: company.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate link');
      }
      
      const { token, password, isExisting } = await response.json();
      
      const baseUrl = window.location.origin;
      setInteractiveLink({
        url: `${baseUrl}/report/${token}`,
        password: password
      });
      setShowInteractiveLinkModal(true);
      
      // Update local company state
      company.public_token = token;
      company.public_password = password;
      
      if (isExisting) {
        console.log('Using existing interactive link');
      } else {
        console.log('Generated new interactive link');
      }
      
    } catch (err) {
      console.error('Error generating link:', err);
      showToast('Failed to generate interactive link', 'error');
    } finally {
      setGeneratingLink(false);
    }
  }

  function handleBack() {
    if (typeof window !== 'undefined') window.history.back();
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
          <p className="mt-4 text-slate-600">Generating report...</p>
        </div>
      </div>
    );
  }

  if (error || !company || !companyScores) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center max-w-md">
          <p className="text-red-600 text-lg mb-2">{error || 'Unable to generate report'}</p>
          <p className="text-slate-500 text-sm">Survey ID: {surveyId || 'not provided'}</p>
        </div>
      </div>
    );
  }

  const { compositeScore, weightedDimScore, maturityScore, breadthScore, dimensionScores, followUpScores, followUpRawResponses, geoMultipliers, geoResponses, isSingleCountryCompany, tier } = companyScores;
  const companyName = company.firmographics_data?.company_name || company.company_name || 'Unknown Company';
  const contactName = company.firmographics_data?.primary_contact_name || '';
  const contactEmail = company.firmographics_data?.primary_contact_email || '';
  
  const dimensionAnalysis = Object.entries(dimensionScores)
    .map(([dim, score]) => {
      const dimNum = parseInt(dim);
      const elements = elementDetails?.[dimNum] || [];
      return {
        dim: dimNum,
        name: DIMENSION_NAMES[dimNum],
        score: score ?? 0,
        weight: DEFAULT_DIMENSION_WEIGHTS[dimNum] || 0,
        weightPct: Math.round((DEFAULT_DIMENSION_WEIGHTS[dimNum] || 0) / Object.values(DEFAULT_DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0) * 100),
        tier: getTier(score ?? 0),
        benchmark: benchmarks?.dimensionScores?.[dimNum] ?? null,
        followUpScore: followUpScores?.[dimNum] ?? null,
        followUpRaw: followUpRawResponses?.[dimNum] ?? null,
        geoMultiplier: geoMultipliers?.[dimNum] ?? 1.0,
        geoResponse: geoResponses?.[dimNum] ?? null,
        hasFollowUp: [1, 3, 12, 13].includes(dimNum),
        elements,
        strengths: elements.filter((e: any) => e.isStrength),
        planning: elements.filter((e: any) => e.isPlanning),
        assessing: elements.filter((e: any) => e.isAssessing),
        gaps: elements.filter((e: any) => e.isGap),
        unsure: elements.filter((e: any) => e.isUnsure),
        // All items that aren't currently offered (strengths)
        needsAttention: elements.filter((e: any) => !e.isStrength && !e.isPlanning),
      };
    })
    .sort((a, b) => b.score - a.score);
  
  const allElements = Object.values(elementDetails || {}).flat() as any[];
  const totalElements = allElements.length;
  const currentlyOffering = allElements.filter(e => e.isStrength).length;
  const planningItems = allElements.filter(e => e.isPlanning).length;
  const assessingItems = allElements.filter(e => e.isAssessing).length;
  const gapItems = allElements.filter(e => e.isGap).length;
  
  const tierCounts = {
    exemplary: dimensionAnalysis.filter(d => d.tier.name === 'Exemplary').length,
    leading: dimensionAnalysis.filter(d => d.tier.name === 'Leading').length,
    progressing: dimensionAnalysis.filter(d => d.tier.name === 'Progressing').length,
    emerging: dimensionAnalysis.filter(d => d.tier.name === 'Emerging').length,
    developing: dimensionAnalysis.filter(d => d.tier.name === 'Developing').length,
  };
  
  const topDimension = dimensionAnalysis[0];
  const bottomDimension = dimensionAnalysis[dimensionAnalysis.length - 1];
  const strengthDimensions = dimensionAnalysis.filter(d => d.tier.name === 'Exemplary' || d.tier.name === 'Leading');
  const allDimensionsByScore = [...dimensionAnalysis].sort((a, b) => a.score - b.score);
  
  // Initiatives in progress - sorted: Planning first, then Assessing
  const quickWinOpportunities = dimensionAnalysis
    .flatMap(d => [
      ...d.planning.map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, type: 'Planning', sortOrder: 1 })),
      ...d.assessing.map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, type: 'Assessing', sortOrder: 2 }))
    ])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 8);
  
  // Roadmap items
  const quickWinItems = dimensionAnalysis
    .flatMap(d => [...d.assessing, ...d.planning].map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, weight: d.weight })))
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 5);
  
  const foundationItems = allDimensionsByScore
    .filter(d => d.weight >= 10)
    .flatMap(d => d.gaps.slice(0, 2).map((g: any) => ({ ...g, dimNum: d.dim, dimName: d.name, weight: d.weight })))
    .slice(0, 5);
  
  // Excellence items: remaining gaps in lower-weight dimensions (things to address in 12+ months)
  const excellenceItems = [...dimensionAnalysis]
    .sort((a, b) => a.weight - b.weight) // Lower weight first
    .flatMap(d => d.gaps.slice(0, 2).map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, weight: d.weight })))
    .slice(0, 5);

  // Stretch items for Phase 3 Excellence roadmap: remaining gaps after quick wins and foundation
  const stretchItems = [...dimensionAnalysis]
    .sort((a, b) => a.weight - b.weight)
    .flatMap(d => d.gaps.map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, weight: d.weight })))
    .filter(item => !quickWinItems.some(q => q.name === item.name) && !foundationItems.some(f => f.name === item.name))
    .slice(0, 5);

  // Order from lowest to highest so .find() returns the immediate next tier up
  const tierThresholds = [{ name: 'Emerging', min: 40 }, { name: 'Progressing', min: 60 }, { name: 'Leading', min: 75 }, { name: 'Exemplary', min: 90 }];
  const nextTierUp = tierThresholds.find(t => t.min > (compositeScore || 0));
  const pointsToNextTier = nextTierUp ? nextTierUp.min - (compositeScore || 0) : null;

  // For polished design inProgressItems
  const inProgressItems = quickWinOpportunities;
  
  // Gap opportunities - dimensions below Leading tier
  const gapOpportunities = dimensionAnalysis.filter((d: any) => d.tier.name !== 'Exemplary' && d.tier.name !== 'Leading');
  // ============================================
  // POLISHED DESIGN RENDER v2
  // Full feature parity with original, polished styling
  // ============================================
  const patterns = getCrossDimensionPatterns(dimensionAnalysis);
  const rankings = getImpactRankings(dimensionAnalysis, compositeScore || 0);
  
  return (
      <div className="min-h-screen bg-slate-100">
        <style jsx global>{`
          @media print { 
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
            .no-print { display: none !important; }
            .pdf-break-before { page-break-before: always; }
            .pdf-no-break { page-break-inside: avoid; }
          }
          .polished-report { font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
          .polished-report h1, .polished-report h2, .polished-report h3, .polished-report h4 { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; 
            letter-spacing: -0.01em; 
          }
        `}</style>
        
        {/* ============ ACTION BAR ============ */}
        <div className="no-print bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-10 py-4 flex items-center justify-between">
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <div className="flex items-center gap-4">
              {/* Edit Mode Toggle */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border transition-colors ${
                  editMode 
                    ? 'bg-amber-100 border-amber-300 text-amber-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title={editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {editMode ? 'Editing' : 'Edit'}
              </button>
              
              {/* Save/Reset buttons - only show in edit mode */}
              {editMode && (
                <>
                  <button
                    onClick={handleSaveCustomizations}
                    disabled={savingEdits}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingEdits ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                    {savingEdits ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleResetCustomizations}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold"
                  >
                    Reset All
                  </button>
                </>
              )}
              
              <button 
                onClick={generateInteractiveLink}
                disabled={generatingLink}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm text-sm disabled:opacity-50"
              >
                {generatingLink ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                )}
                {generatingLink ? 'Generating...' : 'Share Link'}
              </button>
              <button 
                onClick={handlePptxExport}
                disabled={exportingPptx}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm text-sm"
              >
                {exportingPptx ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {exportProgress.step || 'Exporting...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    Export PowerPoint
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Edit Mode Banner */}
        {editMode && (
          <div className="no-print bg-amber-50 border-b border-amber-200 px-10 py-3">
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-amber-800">
                <strong>Edit Mode:</strong> Edit strategic insights and recommended actions. Changes are saved to the database and will appear in exported reports.
              </p>
            </div>
          </div>
        )}
        
        <div className="polished-report max-w-7xl mx-auto py-10 px-10">
        
          {/* ============ HEADER ============ */}
          <div id="report-hero-section" className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
            {/* Dark header band */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-12 py-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-10">
                  <div className="bg-white rounded-xl p-5 shadow-lg">
                    <Image src="/best-companies-2026-logo.png" alt="Best Companies 2026" width={140} height={140} className="object-contain" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Performance Assessment</p>
                    <h1 className="text-3xl font-bold text-white mt-2">Best Companies for Working with Cancer</h1>
                    <p className="text-slate-300 mt-1 text-lg">Index 2026</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm font-medium">Report Date</p>
                  <p className="text-white font-semibold text-lg">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
            
            {/* Company info + score */}
            <div className="px-12 py-10 border-b border-slate-100">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Prepared for</p>
                  <h2 className="text-4xl font-bold text-slate-900 mt-2" data-export="company-name">{companyName}</h2>
                  {(contactName || contactEmail) && (
                    <div className="mt-3 text-base text-slate-500">
                      {contactName && <span className="font-medium text-slate-600">{contactName}</span>}
                      {contactName && contactEmail && <span className="mx-3 text-slate-300">|</span>}
                      {contactEmail && <span>{contactEmail}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-slate-500 text-sm font-medium">Composite Score</p>
                    <p className="text-6xl font-bold mt-1" style={{ color: tier?.color || '#666' }} data-export="composite-score">{compositeScore ?? '—'}</p>
                  </div>
                  {tier && (
                    <div className={`px-6 py-4 rounded-xl ${tier.bgColor} border-2 ${tier.borderColor}`}>
                      <p className="text-2xl font-bold" style={{ color: tier.color }} data-export="tier-name">{tier.name}</p>
                      <p className="text-sm text-slate-500 font-medium">Performance Tier</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Executive Summary */}
            <div className="px-12 py-10 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Executive Summary</h3>
              <p className="text-slate-700 leading-relaxed text-lg" data-export="executive-summary-text">
                {companyName} demonstrates <strong className="font-semibold" style={{ color: tier?.color }}>{tier?.name?.toLowerCase()}</strong> performance 
                in supporting employees managing cancer, achieving a composite score of <strong>{compositeScore}</strong>
                {percentileRank !== null && totalCompanies > 1 && (
                  <span>, which places the organization in the <strong style={{ color: '#5B21B6' }}>{percentileRank}th percentile</strong> among assessed companies</span>
                )}.
                {topDimension && bottomDimension && (
                  <span> The strongest dimension is <strong style={{ color: '#047857' }}>{topDimension.name}</strong> ({topDimension.score}), 
                  while <strong style={{ color: '#B45309' }}>{bottomDimension.name}</strong> ({bottomDimension.score}) presents the greatest opportunity for advancement.</span>
                )}
              </p>
              
              {/* Tier Progress */}
              {(() => {
                const topGrowthDims = allDimensionsByScore.slice(0, 3).map(d => d.name);
                const dimList = topGrowthDims.length === 3 
                  ? `${topGrowthDims[0]}, ${topGrowthDims[1]}, or ${topGrowthDims[2]}`
                  : topGrowthDims.length === 2
                  ? `${topGrowthDims[0]} or ${topGrowthDims[1]}`
                  : topGrowthDims[0];
                
                return (
                  <div className="mt-6 p-5 bg-violet-50 border border-violet-200 rounded-xl flex items-start gap-4">
                    <TrendUpIcon className="w-6 h-6 text-violet-600 flex-shrink-0 mt-0.5" />
                    <div>
                      {nextTierUp && pointsToNextTier ? (
                        <>
                          <p className="text-base font-bold text-violet-800">
                            {pointsToNextTier} points from {nextTierUp.name} tier
                            {nextTierUp.name !== 'Exemplary' && (
                              <span className="text-violet-600 font-normal ml-2">· {90 - (compositeScore || 0)} points from Exemplary</span>
                            )}
                          </p>
                          <p className="text-sm text-violet-600 mt-1">Targeted improvements in {dimList} could elevate overall standing.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-bold text-violet-800">Exemplary tier achieved</p>
                          <p className="text-sm text-violet-600 mt-1">Continue strengthening {dimList} to maintain leadership position.</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
              
              {/* Key Metrics */}
              <div className="mt-8 grid grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-4xl font-bold text-slate-800" data-export="metric-currently-offering">{currentlyOffering}</p>
                  <p className="text-sm text-slate-500 mt-2 font-medium">of {totalElements} elements offered</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-4xl font-bold text-slate-800" data-export="metric-in-development">{planningItems + assessingItems}</p>
                  <p className="text-sm text-slate-500 mt-2 font-medium">initiatives in development</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-4xl font-bold text-slate-800" data-export="metric-gaps">{gapItems}</p>
                  <p className="text-sm text-slate-500 mt-2 font-medium">identified gaps</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-4xl font-bold text-slate-800" data-export="metric-leading-plus">{tierCounts.exemplary + tierCounts.leading}<span className="text-xl font-normal text-slate-400 ml-1">/13</span></p>
                  <p className="text-sm text-slate-500 mt-2 font-medium">dimensions at Leading+</p>
                </div>
              </div>
            </div>
            
            {/* Key Findings Strip */}
            <div className="bg-slate-900 px-12 py-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">Key Findings</h3>
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white/10 rounded-xl p-5 backdrop-blur">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Top Strength</p>
                  <p className="text-white font-bold text-lg">{topDimension?.name || 'N/A'}</p>
                  <p className="text-emerald-400 text-sm mt-1 font-semibold">Score: {topDimension?.score}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-5 backdrop-blur">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Primary Opportunity</p>
                  <p className="text-white font-bold text-lg">{bottomDimension?.name || 'N/A'}</p>
                  <p className="text-amber-400 text-sm mt-1 font-semibold">Score: {bottomDimension?.score}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-5 backdrop-blur">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">In Progress</p>
                  <p className="text-white font-bold text-lg">{planningItems + assessingItems} items</p>
                  <p className="text-sky-400 text-sm mt-1 font-semibold">{planningItems} planning, {assessingItems} assessing</p>
                </div>
                <div className="bg-white/10 rounded-xl p-5 backdrop-blur">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Tier Distribution</p>
                  <p className="text-white font-bold text-lg">{tierCounts.exemplary + tierCounts.leading} / 13 Leading+</p>
                  <p className="text-violet-400 text-sm mt-1 font-semibold">{tierCounts.exemplary} Exemplary, {tierCounts.leading} Leading</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* ============ SCORE COMPOSITION ============ */}
          <div id="score-composition-section" className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
            <div className="px-12 py-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xl">Score Composition</h3>
              <p className="text-slate-500 mt-1 text-base">Click any component to see detailed breakdown</p>
            </div>
            <div className="px-12 py-10">
              {/* Visual Formula - Clickable boxes with more spacing */}
              <div className="flex items-center justify-center gap-8 flex-wrap">
                {/* Composite Score - Static */}
                <div className="text-center px-10 py-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-2 border-slate-700 shadow-xl min-w-[180px]">
                  <p className="text-5xl font-bold text-white">{compositeScore ?? '—'}</p>
                  <p className="text-sm text-slate-300 font-semibold uppercase tracking-wider mt-3">Composite Score</p>
                </div>
                
                <span className="text-5xl text-slate-400 font-light">=</span>
                
                {/* Weighted Dims - Clickable */}
                <div 
                  onClick={() => setActiveScoreOverlay('weightedDim')}
                  className="text-center px-8 py-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-300 min-w-[160px] cursor-pointer hover:shadow-lg hover:border-slate-400 hover:scale-105 transition-all group"
                >
                  <p className="text-4xl font-bold text-slate-800">{weightedDimScore ?? '—'}</p>
                  <p className="text-base text-slate-600 mt-2 font-semibold">Weighted Dims</p>
                  <p className="text-sm text-slate-500 font-bold">× 90%</p>
                  <p className="text-xs text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click for details →</p>
                </div>
                
                <span className="text-4xl text-slate-400 font-light">+</span>
                
                {/* Maturity - Clickable */}
                <div 
                  onClick={() => setActiveScoreOverlay('maturity')}
                  className="text-center px-8 py-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border-2 border-amber-300 min-w-[160px] cursor-pointer hover:shadow-lg hover:border-amber-400 hover:scale-105 transition-all group"
                >
                  <p className="text-4xl font-bold text-amber-700">{maturityScore ?? '—'}</p>
                  <p className="text-base text-amber-700 mt-2 font-semibold">Maturity</p>
                  <p className="text-sm text-amber-600 font-bold">× 5%</p>
                  <p className="text-xs text-amber-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click for details →</p>
                </div>
                
                <span className="text-4xl text-slate-400 font-light">+</span>
                
                {/* Breadth - Clickable */}
                <div 
                  onClick={() => setActiveScoreOverlay('breadth')}
                  className="text-center px-8 py-5 bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl border-2 border-violet-300 min-w-[160px] cursor-pointer hover:shadow-lg hover:border-violet-400 hover:scale-105 transition-all group"
                >
                  <p className="text-4xl font-bold text-violet-700">{breadthScore ?? '—'}</p>
                  <p className="text-base text-violet-700 mt-2 font-semibold">Breadth</p>
                  <p className="text-sm text-violet-600 font-bold">× 5%</p>
                  <p className="text-xs text-violet-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click for details →</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* ============ SCORE OVERLAY MODALS ============ */}
          {activeScoreOverlay && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActiveScoreOverlay(null)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Weighted Dimension Score Overlay */}
                {activeScoreOverlay === 'weightedDim' && (
                  <>
                    <div className="px-8 py-6 bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-white">Weighted Dimension Score</h3>
                          <p className="text-slate-300 mt-1">Contributes 90% of your composite score</p>
                        </div>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-white">{weightedDimScore ?? '—'}</p>
                          <p className="text-sm text-slate-300">Your Score</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-8 py-6">
                      <p className="text-slate-600 mb-6">Combined performance across all 13 support dimensions, weighted by their strategic importance to cancer support programs.</p>
                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <p className="text-sm font-semibold text-slate-700 mb-3">How It's Calculated</p>
                        <p className="text-sm text-slate-600">Each dimension score is multiplied by its weight, then summed and normalized to 100. Higher-weighted dimensions (like Manager Training at 14%) have more influence than lower-weighted ones.</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">Top 5 Dimensions by Weight:</p>
                        {[...dimensionAnalysis].sort((a, b) => b.weight - a.weight).slice(0, 5).map((d) => (
                          <div key={d.dim} className="flex items-center justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-700">{d.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-slate-400">{d.weight}% weight</span>
                              <span className="text-sm font-bold" style={{ color: d.tier.color }}>{d.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-8 py-4 bg-slate-50 rounded-b-2xl flex justify-end">
                      <button onClick={() => setActiveScoreOverlay(null)} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors">
                        Close
                      </button>
                    </div>
                  </>
                )}
                
                {/* Maturity Score Overlay */}
                {activeScoreOverlay === 'maturity' && (
                  <>
                    <div className="px-8 py-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-t-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-white">Program Maturity</h3>
                          <p className="text-amber-100 mt-1">Contributes 5% of your composite score</p>
                        </div>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-white">{maturityScore ?? '—'}</p>
                          <p className="text-sm text-amber-100">Your Score</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-8 py-6">
                      <p className="text-slate-600 mb-6">How developed your organization's approach is to supporting employees managing cancer or other serious health conditions.</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-3 py-2 text-sm font-semibold text-slate-500 border-b-2 border-slate-200">
                          <span>Response</span>
                          <div className="flex items-center gap-6">
                            <span className="w-20 text-center">Benchmark</span>
                            <span className="w-16 text-right">Points</span>
                          </div>
                        </div>
                        {[
                          { label: 'Comprehensive support', points: 100, selected: maturityScore === 100, benchPct: 15 },
                          { label: 'Enhanced support', points: 80, selected: maturityScore === 80, benchPct: 22 },
                          { label: 'Moderate support', points: 50, selected: maturityScore === 50, benchPct: 35 },
                          { label: 'Developing approach', points: 20, selected: maturityScore === 20, benchPct: 18 },
                          { label: 'Legal minimum / None', points: 0, selected: maturityScore === 0, benchPct: 10 },
                        ].map((opt, i) => (
                          <div key={i} className={`flex justify-between items-center px-4 py-3 rounded-xl ${opt.selected ? 'bg-amber-100 border-2 border-amber-400 shadow-sm' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                              {opt.selected && <span className="text-amber-600 text-lg">✓</span>}
                              <span className={opt.selected ? 'font-semibold text-amber-900' : 'text-slate-600'}>{opt.label}</span>
                            </div>
                            <div className="flex items-center gap-6">
                              <span className="text-slate-400 w-20 text-center">{opt.benchPct}%</span>
                              <span className={`w-16 text-right font-semibold ${opt.selected ? 'text-amber-700' : 'text-slate-500'}`}>{opt.points} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-8 py-4 bg-amber-50 rounded-b-2xl flex justify-end">
                      <button onClick={() => setActiveScoreOverlay(null)} className="px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors">
                        Close
                      </button>
                    </div>
                  </>
                )}
                
                {/* Breadth Score Overlay */}
                {activeScoreOverlay === 'breadth' && (() => {
                  const currentSupport = company?.current_support_data || {};
                  const generalBenefits = company?.general_benefits_data || {};
                  const cb3a = currentSupport.cb3a ?? generalBenefits.cb3a;
                  let cb3aScore = 0;
                  if (cb3a === 3 || cb3a === '3' || String(cb3a).toLowerCase().includes('yes')) cb3aScore = 100;
                  else if (cb3a === 2 || cb3a === '2' || String(cb3a).toLowerCase().includes('developing')) cb3aScore = 50;
                  const cb3b = currentSupport.cb3b || generalBenefits.cb3b;
                  const cb3bArray = (cb3b && Array.isArray(cb3b)) ? cb3b.map((v: string) => v.toLowerCase()) : [];
                  const cb3bCount = Math.min(cb3bArray.length, 6);
                  const cb3bScore = Math.min(100, Math.round((cb3bCount / 6) * 100));
                  const cb3c = currentSupport.cb3c || generalBenefits.cb3c;
                  const cb3cArray = (cb3c && Array.isArray(cb3c)) ? cb3c : [];
                  
                  // Debug: log what's in the array
                  console.log('CB3C Raw Data:', cb3c);
                  console.log('CB3C Array:', cb3cArray);
                  
                  // These match the ACTUAL survey options (13 conditions, excluding "Other specify")
                  const healthConditions = [
                    'Autoimmune disorders',
                    'Cancer',
                    'Chronic conditions',
                    'Heart disease',
                    'HIV / AIDS',
                    'Kidney disease',
                    'Major surgery recovery',
                    'Mental health crises',
                    'Musculoskeletal conditions',
                    'Neurological conditions',
                    'Organ transplant',
                    'Respiratory conditions',
                    'Stroke'
                  ];
                  
                  // Helper function to check if a condition is selected
                  // Must handle BOTH old survey format and new survey format
                  const isConditionSelected = (condition: string) => {
                    const condLower = condition.toLowerCase();
                    return cb3cArray.some((v: string) => {
                      const stored = String(v).toLowerCase();
                      
                      // Mappings that handle both OLD and NEW survey formats
                      if (condLower === 'autoimmune disorders' && stored.includes('autoimmune')) return true;
                      if (condLower === 'cancer' && stored.includes('cancer')) return true;
                      if (condLower === 'chronic conditions' && stored.includes('chronic condition')) return true;
                      if (condLower === 'heart disease' && (stored.includes('heart disease') || stored.includes('cardiovascular'))) return true;
                      if (condLower === 'hiv / aids' && (stored.includes('hiv') || stored.includes('aids'))) return true;
                      if (condLower === 'kidney disease' && (stored.includes('kidney') || stored.includes('renal'))) return true;
                      if (condLower === 'major surgery recovery' && stored.includes('major surgery')) return true;
                      if (condLower === 'mental health crises' && (stored.includes('mental health') || stored.includes('substance abuse'))) return true;
                      if (condLower === 'musculoskeletal conditions' && stored.includes('musculoskeletal')) return true;
                      if (condLower === 'neurological conditions' && (stored.includes('neurological') || stored.includes('parkinson') || stored.includes('multiple sclerosis') || stored.includes('(ms)'))) return true;
                      if (condLower === 'organ transplant' && stored.includes('transplant')) return true;
                      if (condLower === 'respiratory conditions' && (stored.includes('respiratory') || stored.includes('copd'))) return true;
                      if (condLower === 'stroke' && stored.includes('stroke')) return true;
                      
                      return false;
                    });
                  };
                  
                  // Count using the same function used for display (13 conditions max)
                  const cb3cCount = healthConditions.filter(c => isConditionSelected(c)).length;
                  const cb3cScore = Math.min(100, Math.round((cb3cCount / 13) * 100));
                  
                  const programElements = [
                    { label: 'Individual benefits or policies', key: 'individual' },
                    { label: 'Coordinated support services', key: 'coordinated' },
                    { label: 'Internally developed formal program', key: 'internal' },
                    { label: 'External initiatives/certifications', key: 'external' },
                    { label: 'Comprehensive framework', key: 'comprehensive' },
                    { label: 'Ad hoc/case-by-case support', key: 'adhoc' },
                  ];
                  
                  return (
                    <>
                      <div className="px-8 py-6 bg-gradient-to-r from-violet-500 to-violet-600 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-white">Support Breadth</h3>
                            <p className="text-violet-100 mt-1">Contributes 5% of your composite score</p>
                          </div>
                          <div className="text-center">
                            <p className="text-4xl font-bold text-white">{breadthScore ?? '—'}</p>
                            <p className="text-sm text-violet-100">Your Score</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-8 py-6 space-y-6">
                        <p className="text-slate-600">How expansive your benefits and support are—including whether you go beyond legal requirements, how structured your programs are, and how many health conditions are addressed.</p>
                        
                        {/* CB3a - Beyond Legal */}
                        <div className="border border-violet-200 rounded-xl overflow-hidden">
                          <div className="bg-violet-50 px-4 py-3 font-semibold text-violet-800 border-b border-violet-200">
                            Do you provide support beyond legal requirements?
                          </div>
                          <div className="p-3 space-y-2">
                            {[
                              { label: 'Yes, beyond legal requirements', points: 100, selected: cb3aScore === 100 },
                              { label: 'Currently developing', points: 50, selected: cb3aScore === 50 },
                              { label: 'Legal minimum only', points: 0, selected: cb3aScore === 0 },
                            ].map((opt, i) => (
                              <div key={i} className={`flex justify-between items-center px-3 py-2 rounded-lg ${opt.selected ? 'bg-violet-100 border-2 border-violet-400' : 'bg-slate-50'}`}>
                                <div className="flex items-center gap-2">
                                  {opt.selected && <span className="text-violet-600">✓</span>}
                                  <span className={opt.selected ? 'font-semibold text-violet-900' : 'text-slate-600'}>{opt.label}</span>
                                </div>
                                <span className={`font-semibold ${opt.selected ? 'text-violet-700' : 'text-slate-500'}`}>{opt.points} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* CB3b - Program Elements */}
                        <div className="border border-violet-200 rounded-xl overflow-hidden">
                          <div className="bg-violet-50 px-4 py-3 font-semibold text-violet-800 border-b border-violet-200 flex justify-between">
                            <span>Program structure elements</span>
                            <span className="text-violet-600">{cb3bCount} of 6 = {cb3bScore} pts</span>
                          </div>
                          <div className="p-3 grid grid-cols-2 gap-2">
                            {programElements.map((el, i) => {
                              const isSelected = cb3bArray.some((v: string) => v.includes(el.key) || el.label.toLowerCase().includes(v.substring(0, 10)));
                              return (
                                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isSelected ? 'bg-violet-100 border border-violet-300' : 'bg-slate-50'}`}>
                                  <span className={isSelected ? 'text-violet-600 font-bold' : 'text-slate-400'}>{isSelected ? '✓' : '○'}</span>
                                  <span className={isSelected ? 'text-violet-900' : 'text-slate-600'}>{el.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* CB3c - Health Conditions */}
                        <div className="border border-violet-200 rounded-xl overflow-hidden">
                          <div className="bg-violet-50 px-4 py-3 font-semibold text-violet-800 border-b border-violet-200 flex justify-between">
                            <span>Health conditions addressed</span>
                            <span className="text-violet-600">{cb3cCount} of 13 = {cb3cScore} pts</span>
                          </div>
                          <div className="p-3 grid grid-cols-3 gap-2">
                            {healthConditions.map((condition, i) => {
                              const isSelected = isConditionSelected(condition);
                              return (
                                <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${isSelected ? 'bg-violet-100 border border-violet-300' : 'bg-slate-50'}`}>
                                  <span className={isSelected ? 'text-violet-600 font-bold' : 'text-slate-400'}>{isSelected ? '✓' : '○'}</span>
                                  <span className={isSelected ? 'text-violet-900' : 'text-slate-600'}>{condition}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="px-8 py-4 bg-violet-50 rounded-b-2xl flex justify-end">
                        <button onClick={() => setActiveScoreOverlay(null)} className="px-6 py-2 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-colors">
                          Close
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          
          {/* ============ DIMENSION PERFORMANCE TABLE ============ */}
          <div id="dimension-performance-table" className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break max-w-[1200px] mx-auto">
            <div className="px-12 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xl">Dimension Performance</h3>
                <p className="text-slate-500 mt-1 text-sm">All 13 dimensions sorted by strategic weight</p>
              </div>
              <span className="bg-cyan-100 text-cyan-700 px-3 py-1.5 rounded-lg font-semibold text-sm">👆 Click any dimension for element-level details</span>
            </div>
            <div className="px-12 py-4">
              {/* Table Header */}
              <div className="flex items-center gap-3 py-2 border-b-2 border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="w-8"></div>
                <div className="flex-1">Dimension</div>
                <div className="w-16 text-center">Weight</div>
                <div className="w-64 text-center">Performance</div>
                <div className="w-16 text-center">Score</div>
                <div className="w-24 text-center">Benchmark</div>
                <div className="w-24 text-center">Tier</div>
              </div>
              <div className="divide-y divide-slate-100">
                {[...dimensionAnalysis].sort((a, b) => b.weight - a.weight).map((d, idx) => {
                  const diff = d.benchmark !== null ? d.score - d.benchmark : null;
                  return (
                    <div 
                      key={d.dim} 
                      onClick={() => setDimensionDetailModal(d.dim)}
                      className={`flex items-center gap-3 py-3 cursor-pointer hover:bg-cyan-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/50'} -mx-4 px-4`}
                    >
                      <div className="w-8 flex justify-center">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: d.tier.color }}>
                          {d.dim}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-800 font-semibold hover:text-cyan-700">{d.name}</span>
                      </div>
                      <div className="w-16 text-center">
                        <span className="text-sm text-slate-600 font-medium">{d.weight}%</span>
                      </div>
                      <div className="w-64">
                        <div className="relative h-2.5 bg-slate-100 rounded-full overflow-visible">
                          <div 
                            className="absolute left-0 top-0 h-full rounded-full transition-all" 
                            style={{ width: `${Math.min(d.score, 100)}%`, backgroundColor: d.tier.color }} 
                          />
                          {d.benchmark !== null && (
                            <div 
                              className="absolute -top-4" 
                              style={{ left: `${Math.min(d.benchmark, 100)}%`, transform: 'translateX(-50%)' }}
                            >
                              <svg className="w-3 h-4" viewBox="0 0 12 16" fill="none"><path d="M6 16L0 8H12L6 16Z" fill="#475569"/></svg>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-16 text-center">
                        <span className="text-lg font-bold" style={{ color: d.tier.color }}>{d.score}</span>
                      </div>
                      <div className="w-24 text-center">
                        {d.benchmark !== null ? (
                          <div>
                            <span className="text-sm text-slate-500 font-medium">{d.benchmark}</span>
                            <span className={`ml-1 text-xs font-bold ${diff !== null && diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              ({diff !== null && diff >= 0 ? '+' : ''}{diff})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-300">—</span>
                        )}
                      </div>
                      <div className="w-24 flex justify-center">
                        <span 
                          className={`text-xs font-bold px-3 py-1 rounded-lg ${d.tier.bgColor} border ${d.tier.borderColor}`} 
                          style={{ color: d.tier.color }}
                        >
                          {d.tier.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* ============ STRATEGIC PRIORITY MATRIX ============ */}
          <div id="strategic-priority-matrix" className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-break-before pdf-no-break max-w-[1200px] mx-auto">
            <div className="px-12 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h3 className="font-bold text-slate-900 text-xl">Strategic Priority Matrix</h3>
                <p className="text-slate-500 mt-1">Dimensions plotted by performance vs. strategic weight. <span className="text-cyan-600 font-medium">Hover for details, click to explore.</span></p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowBenchmarkRings(!showBenchmarkRings)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                    showBenchmarkRings 
                      ? 'bg-violet-100 border-violet-400 text-violet-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {showBenchmarkRings ? '● Benchmarks On' : '○ Show Benchmarks'}
                </button>
              </div>
            </div>
            <div ref={matrixRef} id="export-matrix" className="px-4 py-6 bg-gradient-to-b from-white to-slate-50/50">
              {/* Enhanced Matrix with hover tooltips, better benchmark circles, wider layout */}
              {(() => {
                const MAX_WEIGHT = 15;
                const CHART_WIDTH = 1000;
                const CHART_HEIGHT = 450;
                const LABEL_HEIGHT = 26;
                const MARGIN = { top: LABEL_HEIGHT + 12, right: 30, bottom: LABEL_HEIGHT + 60, left: 70 };
                const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
                const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
                
                const getBenchmarkScore = (dimNum: number) => {
                  if (!benchmarks?.dimensionScores) return null;
                  return benchmarks.dimensionScores[`d${dimNum}`] || benchmarks.dimensionScores[dimNum] || null;
                };
                
                // Calculate offsets for overlapping dots
                const calculateOffsets = () => {
                  const positions = dimensionAnalysis.map((d) => ({
                    dim: d.dim,
                    xPos: (d.score / 100) * PLOT_WIDTH,
                    yPos: PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT),
                    offsetX: 0,
                    offsetY: 0
                  }));
                  
                  const OVERLAP_THRESHOLD = 25;
                  for (let i = 0; i < positions.length; i++) {
                    for (let j = i + 1; j < positions.length; j++) {
                      const dx = Math.abs(positions[i].xPos - positions[j].xPos);
                      const dy = Math.abs(positions[i].yPos - positions[j].yPos);
                      if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
                        // Subtle offset - just enough to see both dots
                        positions[i].offsetX = -8;
                        positions[i].offsetY = -6;
                        positions[j].offsetX = 8;
                        positions[j].offsetY = 6;
                      }
                    }
                  }
                  return positions;
                };
                
                const offsetPositions = calculateOffsets();
                
                const getBubblePosition = (d: any) => {
                  const offset = offsetPositions.find(p => p.dim === d.dim);
                  const offsetX = offset?.offsetX || 0;
                  const offsetY = offset?.offsetY || 0;
                  const xPercent = (MARGIN.left + (d.score / 100) * PLOT_WIDTH + offsetX) / CHART_WIDTH * 100;
                  const yPercent = (MARGIN.top + (PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT)) + offsetY) / CHART_HEIGHT * 100;
                  return { xPercent, yPercent };
                };
                
                const hoveredData = hoveredMatrixDim !== null ? dimensionAnalysis.find(d => d.dim === hoveredMatrixDim) : null;
                
                const getTooltipStyle = () => {
                  if (!hoveredData) return { top: '8px', right: '8px', opacity: 0, pointerEvents: 'none' as const };
                  const { xPercent, yPercent } = getBubblePosition(hoveredData);
                  const isRightEdge = xPercent > 65;
                  const isTopEdge = yPercent < 35;
                  const isBottomEdge = yPercent > 65;
                  let top: string, left: string;
                  if (isRightEdge) { left = `calc(${xPercent}% - 280px)`; } else { left = `calc(${xPercent}% + 35px)`; }
                  if (isTopEdge) { top = `calc(${yPercent}% + 35px)`; } else if (isBottomEdge) { top = `calc(${yPercent}% - 190px)`; } else { top = `calc(${yPercent}% - 80px)`; }
                  return { top, left, right: 'auto', opacity: 1, pointerEvents: 'none' as const };
                };
                
                return (
                  <div className="relative w-full" style={{ height: '700px' }}>
                    {/* SVG Chart */}
                    <svg className="w-full" style={{ height: '510px' }} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <filter id="dropShadowPolished" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.2"/>
                        </filter>
                        <linearGradient id="chartBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f8fafc" />
                          <stop offset="100%" stopColor="#f1f5f9" />
                        </linearGradient>
                      </defs>
                      
                      <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
                        {/* Background with subtle gradient */}
                        <rect x={-2} y={-2} width={PLOT_WIDTH + 4} height={PLOT_HEIGHT + 4} fill="url(#chartBgGradient)" rx="8" />
                        
                        {/* Quadrant labels - Top */}
                        <rect x={0} y={-LABEL_HEIGHT - 6} width={PLOT_WIDTH/2 - 4} height={LABEL_HEIGHT} rx="6" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />
                        <text x={PLOT_WIDTH/4} y={-LABEL_HEIGHT/2 - 6 + 1} textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="system-ui">PRIORITY GAPS</text>
                        
                        <rect x={PLOT_WIDTH/2 + 4} y={-LABEL_HEIGHT - 6} width={PLOT_WIDTH/2 - 4} height={LABEL_HEIGHT} rx="6" fill="#059669" stroke="#047857" strokeWidth="1" />
                        <text x={PLOT_WIDTH * 3/4} y={-LABEL_HEIGHT/2 - 6 + 1} textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="system-ui">CORE STRENGTHS</text>
                        
                        {/* Quadrant backgrounds - muted, professional */}
                        <rect x={0} y={0} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FCA5A5" fillOpacity="0.15" />
                        <rect x={PLOT_WIDTH/2} y={0} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#6EE7B7" fillOpacity="0.15" />
                        <rect x={0} y={PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#E5E7EB" fillOpacity="0.3" />
                        <rect x={PLOT_WIDTH/2} y={PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#93C5FD" fillOpacity="0.15" />
                        
                        {/* Grid lines */}
                        <line x1={0} y1={PLOT_HEIGHT/2} x2={PLOT_WIDTH} y2={PLOT_HEIGHT/2} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="6 4" />
                        <line x1={PLOT_WIDTH/2} y1={0} x2={PLOT_WIDTH/2} y2={PLOT_HEIGHT} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="6 4" />
                        
                        {/* Border */}
                        <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="none" stroke="#64748B" strokeWidth="2" rx="4" />
                        
                        {/* Bottom labels */}
                        <rect x={0} y={PLOT_HEIGHT + 6} width={PLOT_WIDTH/2 - 4} height={LABEL_HEIGHT} rx="6" fill="#6B7280" stroke="#4B5563" strokeWidth="1" />
                        <text x={PLOT_WIDTH/4} y={PLOT_HEIGHT + 6 + LABEL_HEIGHT/2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="system-ui">MONITOR</text>
                        
                        <rect x={PLOT_WIDTH/2 + 4} y={PLOT_HEIGHT + 6} width={PLOT_WIDTH/2 - 4} height={LABEL_HEIGHT} rx="6" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />
                        <text x={PLOT_WIDTH * 3/4} y={PLOT_HEIGHT + 6 + LABEL_HEIGHT/2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="system-ui">LEVERAGE</text>
                        
                        {/* X-axis */}
                        <g transform={`translate(0, ${PLOT_HEIGHT + LABEL_HEIGHT + 12})`}>
                          {[0, 25, 50, 75, 100].map((val) => (
                            <g key={val} transform={`translate(${(val / 100) * PLOT_WIDTH}, 0)`}>
                              <line y1="0" y2="6" stroke="#64748B" strokeWidth="1.5" />
                              <text y="20" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="500" fontFamily="system-ui">{val}</text>
                            </g>
                          ))}
                          <text x={PLOT_WIDTH/2} y="40" textAnchor="middle" fill="#1E293B" fontSize="13" fontWeight="700" fontFamily="system-ui">PERFORMANCE SCORE →</text>
                        </g>
                        
                        {/* Y-axis */}
                        <g>
                          {[0, 5, 10, 15].map((val) => {
                            const yPos = PLOT_HEIGHT - ((val / MAX_WEIGHT) * PLOT_HEIGHT);
                            return (
                              <g key={val}>
                                <line x1="-6" y1={yPos} x2="0" y2={yPos} stroke="#64748B" strokeWidth="1.5" />
                                <text x="-12" y={yPos + 4} textAnchor="end" fill="#475569" fontSize="12" fontWeight="500" fontFamily="system-ui">{val}%</text>
                              </g>
                            );
                          })}
                        </g>
                        <text transform="rotate(-90)" x={-PLOT_HEIGHT/2} y="-50" textAnchor="middle" fill="#1E293B" fontSize="13" fontWeight="700" fontFamily="system-ui">↑ STRATEGIC IMPORTANCE</text>
                        
                        {/* Benchmark rings with grey fill and clear labels */}
                        {showBenchmarkRings && dimensionAnalysis.map((d) => {
                          const benchScore = getBenchmarkScore(d.dim);
                          if (!benchScore) return null;
                          const xPos = (benchScore / 100) * PLOT_WIDTH;
                          const yPos = PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT);
                          return (
                            <g key={`bench-${d.dim}`}>
                              {/* Grey filled circle with dashed border */}
                              <circle cx={xPos} cy={yPos} r={20} fill="#E2E8F0" fillOpacity="0.8" stroke="#8B5CF6" strokeWidth="2.5" strokeDasharray="5 3" />
                              {/* Dimension label */}
                              <text x={xPos} y={yPos + 1} textAnchor="middle" dominantBaseline="middle" fill="#6D28D9" fontSize="10" fontWeight="800" fontFamily="system-ui">D{d.dim}</text>
                            </g>
                          );
                        })}
                        
                        {/* Data points - Company scores */}
                        {offsetPositions.map((pos) => {
                          const d = dimensionAnalysis.find(dim => dim.dim === pos.dim)!;
                          const xPos = pos.xPos + pos.offsetX;
                          const yPos = pos.yPos + pos.offsetY;
                          const isHovered = hoveredMatrixDim === d.dim;
                          const hasOffset = pos.offsetX !== 0 || pos.offsetY !== 0;
                          return (
                            <g key={d.dim} transform={`translate(${xPos}, ${yPos})`} style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
                              {/* Connection line to actual position if offset */}
                              {hasOffset && (
                                <line x1={0} y1={0} x2={-pos.offsetX} y2={-pos.offsetY} stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" />
                              )}
                              <circle r={isHovered ? 24 : 20} fill="white" filter="url(#dropShadowPolished)" style={{ transition: 'all 0.2s ease' }} />
                              <circle r={isHovered ? 20 : 16} fill={getScoreColor(d.score)} style={{ transition: 'all 0.2s ease' }} />
                              <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize={isHovered ? 12 : 11} fontWeight="800" fontFamily="system-ui">D{d.dim}</text>
                            </g>
                          );
                        })}
                      </g>
                    </svg>
                    
                    {/* HTML Overlay for hover detection */}
                    <div className="absolute inset-0" style={{ height: '510px' }}>
                      {dimensionAnalysis.map((d) => {
                        const { xPercent, yPercent } = getBubblePosition(d);
                        return (
                          <div
                            key={d.dim}
                            className="absolute rounded-full cursor-pointer"
                            style={{ left: `${xPercent}%`, top: `${yPercent}%`, width: '55px', height: '55px', transform: 'translate(-50%, -50%)' }}
                            onMouseEnter={() => setHoveredMatrixDim(d.dim)}
                            onMouseLeave={() => setHoveredMatrixDim(null)}
                            onClick={() => setDimensionDetailModal(d.dim)}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Hover Tooltip */}
                    {hoveredData && (
                      <div className="absolute bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-64 z-30 transition-opacity duration-150" style={getTooltipStyle()}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg" style={{ backgroundColor: getScoreColor(hoveredData.score) }}>D{hoveredData.dim}</span>
                          <div className="flex-1"><p className="font-bold text-slate-800 text-sm leading-tight">{hoveredData.name}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"><p className="text-slate-500 text-xs font-medium">Score</p><p className="font-bold text-xl" style={{ color: getScoreColor(hoveredData.score) }}>{hoveredData.score}</p></div>
                          <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"><p className="text-slate-500 text-xs font-medium">Weight</p><p className="font-bold text-xl text-slate-700">{hoveredData.weight}%</p></div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${hoveredData.tier.bgColor} border ${hoveredData.tier.borderColor}`} style={{ color: hoveredData.tier.color }}>{hoveredData.tier.name}</span>
                          <span className="text-xs text-cyan-600 font-medium">Click for details →</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Legend - ALL 13 dimensions in 4 columns plus benchmark indicator */}
                    <div className="pt-4 border-t-2 border-slate-200 px-4" style={{ marginTop: '6px' }}>
                      <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                        {Array.from({ length: 13 }, (_, i) => i + 1).map(dimNum => {
                          const d = dimensionAnalysis.find(dim => dim.dim === dimNum);
                          if (!d) return (
                            <div key={dimNum} className="flex items-start gap-2 px-2 py-1.5 rounded text-slate-400">
                              <span className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-xs font-bold">{dimNum}</span>
                              <span className="text-sm">Unknown Dimension</span>
                            </div>
                          );
                          return (
                            <div 
                              key={d.dim} 
                              className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer transition-all ${hoveredMatrixDim === d.dim ? 'bg-slate-200 ring-2 ring-cyan-400 shadow-sm' : 'hover:bg-slate-100'}`}
                              onMouseEnter={() => setHoveredMatrixDim(d.dim)}
                              onMouseLeave={() => setHoveredMatrixDim(null)}
                              onClick={() => setDimensionDetailModal(d.dim)}
                            >
                              <span className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm" style={{ backgroundColor: getScoreColor(d.score) }}>{d.dim}</span>
                              <span className="text-sm text-slate-700 font-medium leading-snug">{d.name}</span>
                            </div>
                          );
                        })}
                      </div>
                      {showBenchmarkRings && (
                        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-center gap-8 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-500 shadow-sm"></span>
                            <span className="text-slate-700 font-medium">Your Company</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-200 border-2 border-dashed border-violet-500 flex items-center justify-center text-violet-700 text-[8px] font-bold">D</span>
                            <span className="text-slate-700 font-medium">Peer Benchmark</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* ============ DIMENSION DETAIL MODAL ============ */}
          {dimensionDetailModal && (() => {
            const d = dimensionAnalysis.find(dim => dim.dim === dimensionDetailModal);
            if (!d) return null;
            const elemBench = elementBenchmarks[dimensionDetailModal] || {};
            const diff = d.benchmark !== null ? d.score - d.benchmark : null;
            
            const STATUS = {
              currently: { bg: '#10B981', light: '#D1FAE5', text: '#065F46', label: 'Offering' },
              planning: { bg: '#3B82F6', light: '#DBEAFE', text: '#1E40AF', label: 'Planning' },
              assessing: { bg: '#F59E0B', light: '#FEF3C7', text: '#92400E', label: 'Assessing' },
              notAble: { bg: '#EF4444', light: '#FEE2E2', text: '#991B1B', label: 'Not Offering' }
            };
            
            const getStatusInfo = (elem: any) => {
              if (elem.isStrength) return { key: 'currently', ...STATUS.currently };
              if (elem.isPlanning) return { key: 'planning', ...STATUS.planning };
              if (elem.isAssessing) return { key: 'assessing', ...STATUS.assessing };
              return { key: 'notAble', ...STATUS.notAble };
            };
            
            const getDefaultObservation = (elem: any, bench: any) => {
              const total = bench?.total || 1;
              const pctCurrently = Math.round(((bench?.currently || 0) / total) * 100);
              const pctPlanning = Math.round(((bench?.planning || 0) / total) * 100);
              const pctAssessing = Math.round(((bench?.assessing || 0) / total) * 100);
              const statusInfo = getStatusInfo(elem);
              if (statusInfo.key === 'currently') {
                if (pctCurrently < 30) return `Differentiator: Only ${pctCurrently}% of peers offer`;
                if (pctCurrently < 50) return `Ahead of ${100 - pctCurrently}% of benchmark`;
                if (pctCurrently < 70) return `Solid: ${pctCurrently}% of peers also offer`;
                return `Table stakes: ${pctCurrently}% offer`;
              }
              if (statusInfo.key === 'planning') {
                if (pctCurrently > 50) return `${pctCurrently}% already offer`;
                return `Among ${pctPlanning}% planning; ${pctCurrently}% offer`;
              }
              if (statusInfo.key === 'assessing') {
                return `${pctAssessing}% also assessing; ${pctCurrently}% offer`;
              }
              if (pctCurrently > 50) return `Gap: ${pctCurrently}% of peers offer`;
              return `Emerging: ${pctCurrently}% offer`;
            };
            
            // Count by status
            const statusCounts = { currently: 0, planning: 0, assessing: 0, notAble: 0 };
            d.elements?.forEach((elem: any) => {
              const s = getStatusInfo(elem);
              statusCounts[s.key as keyof typeof statusCounts]++;
            });
            
            return (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDimensionDetailModal(null)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="px-6 py-4 flex-shrink-0 relative" style={{ background: `linear-gradient(135deg, ${d.tier.color} 0%, ${d.tier.color}dd 100%)` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">{d.dim}</span>
                        <div>
                          <h3 className="text-xl font-bold text-white">{d.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium text-white/90">Weight: {d.weight}%</span>
                            <span className="px-2 py-0.5 bg-white/30 rounded text-xs font-semibold text-white">{d.tier.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-end gap-4">
                        <div>
                          <p className="text-5xl font-black text-white">{d.score}</p>
                          <p className="text-white/70 text-sm">Your Score</p>
                        </div>
                        {diff !== null && d.benchmark !== null && (
                          <div className="text-right">
                            <p className={`text-3xl font-bold ${diff >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>{diff >= 0 ? '+' : ''}{diff}</p>
                            <p className="text-white/70 text-sm">vs {d.benchmark} benchmark</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Table Header Row */}
                  <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 grid grid-cols-12 gap-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <div className="col-span-3">Element</div>
                    <div className="col-span-1 text-center">Your Status</div>
                    <div className="col-span-5 text-center">
                      <div>Peer Distribution</div>
                      <div className="flex items-center justify-center gap-3 mt-1 font-normal normal-case tracking-normal">
                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#10B981' }}></span><span className="text-slate-500">Offering</span></div>
                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#3B82F6' }}></span><span className="text-slate-500">Planning</span></div>
                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#F59E0B' }}></span><span className="text-slate-500">Assessing</span></div>
                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#CBD5E1' }}></span><span className="text-slate-500">Not Offering</span></div>
                      </div>
                    </div>
                    <div className="col-span-3 pl-4">Observation</div>
                  </div>
                  
                  {/* Table Body */}
                  <div className="flex-1 overflow-y-auto">
                    {d.elements?.filter((el: any) => !isSingleCountryCompany || !el.name?.toLowerCase()?.includes('global')).map((elem: any, i: number) => {
                      const statusInfo = getStatusInfo(elem);
                      const bench = elemBench[elem.name] || { currently: 0, planning: 0, assessing: 0, total: 1 };
                      const total = bench.total || 1;
                      const pctCurrently = Math.round((bench.currently / total) * 100);
                      const pctPlanning = Math.round((bench.planning / total) * 100);
                      const pctAssessing = Math.round((bench.assessing / total) * 100);
                      const pctNotOffering = Math.max(0, 100 - pctCurrently - pctPlanning - pctAssessing);
                      const observation = getDefaultObservation(elem, bench);
                      
                      return (
                        <div key={i} className={`px-6 py-4 grid grid-cols-12 gap-3 items-center border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                          {/* Element Name */}
                          <div className="col-span-3">
                            <p className="text-sm text-slate-800 font-medium leading-snug">{elem.name}</p>
                          </div>
                          
                          {/* Your Status */}
                          <div className="col-span-1 flex justify-center">
                            <span className="px-2.5 py-1.5 rounded text-xs font-bold whitespace-nowrap" style={{ backgroundColor: statusInfo.light, color: statusInfo.text }}>
                              {statusInfo.label}
                            </span>
                          </div>
                          
                          {/* Peer Distribution - Wide Stacked Bar */}
                          <div className="col-span-5">
                            <div className="h-8 rounded-lg overflow-hidden flex bg-slate-200 border border-slate-300">
                              {/* Offering */}
                              <div 
                                className="flex items-center justify-center text-xs font-bold text-white"
                                style={{ width: `${pctCurrently}%`, backgroundColor: '#10B981', minWidth: pctCurrently > 0 ? '28px' : '0' }}
                              >
                                {pctCurrently}%
                              </div>
                              {/* Planning */}
                              <div 
                                className="flex items-center justify-center text-xs font-bold text-white"
                                style={{ width: `${pctPlanning}%`, backgroundColor: '#3B82F6', minWidth: pctPlanning > 0 ? '28px' : '0' }}
                              >
                                {pctPlanning > 0 ? `${pctPlanning}%` : ''}
                              </div>
                              {/* Assessing */}
                              <div 
                                className="flex items-center justify-center text-xs font-bold text-white"
                                style={{ width: `${pctAssessing}%`, backgroundColor: '#F59E0B', minWidth: pctAssessing > 0 ? '28px' : '0' }}
                              >
                                {pctAssessing > 0 ? `${pctAssessing}%` : ''}
                              </div>
                              {/* Not Offering */}
                              <div 
                                className="flex items-center justify-center text-xs font-bold text-slate-600"
                                style={{ width: `${pctNotOffering}%`, backgroundColor: '#CBD5E1', minWidth: pctNotOffering > 0 ? '28px' : '0' }}
                              >
                                {pctNotOffering}%
                              </div>
                            </div>
                          </div>
                          
                          {/* Observation - Editable */}
                          <div className="col-span-3 pl-4">
                            {editMode ? (
                              <input
                                type="text"
                                value={customObservations[`dim${d.dim}_${elem.name}`] ?? observation}
                                onChange={(e) => {
                                  setCustomObservations(prev => ({
                                    ...prev,
                                    [`dim${d.dim}_${elem.name}`]: e.target.value
                                  }));
                                  setHasUnsavedChanges(true);
                                }}
                                className="w-full text-xs text-slate-700 bg-amber-50 border border-amber-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                placeholder="Custom observation..."
                              />
                            ) : (
                              <p className="text-xs text-slate-700 font-medium leading-snug">{customObservations[`dim${d.dim}_${elem.name}`] || observation}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Geographic Multiplier Section (if applicable) */}
                    {d.hasGeographicMultiplier && (
                      <div className="m-4 bg-indigo-50 rounded-lg border border-indigo-200 p-4">
                        <h4 className="font-bold text-indigo-800 text-sm mb-3">Geographic Multiplier</h4>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          {[
                            { label: 'Consistent across all', benchmark: '55%', multiplier: 'x1.00', selected: d.geographicScope === 'consistent' },
                            { label: 'Varies by location', benchmark: '25%', multiplier: 'x0.90', selected: d.geographicScope === 'varies' },
                            { label: 'Select locations only', benchmark: '20%', multiplier: 'x0.75', selected: d.geographicScope === 'select' },
                          ].map((opt, i) => (
                            <div key={i} className={`flex items-center justify-between px-3 py-2 rounded border ${opt.selected ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-slate-200'}`}>
                              <div className="flex items-center gap-2">
                                {opt.selected && <span className="text-indigo-600">✓</span>}
                                <span className={opt.selected ? 'font-semibold text-indigo-900 text-xs' : 'text-slate-600 text-xs'}>{opt.label}</span>
                              </div>
                              <span className={`font-bold text-sm ${opt.selected ? 'text-indigo-700' : 'text-slate-400'}`}>{opt.multiplier}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer - Navigation */}
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
                    <div className="flex items-center justify-center">
                      {/* Navigation */}
                      <div className="flex items-center gap-4">
                        <button onClick={() => setDimensionDetailModal(Math.max(1, dimensionDetailModal - 1))} disabled={dimensionDetailModal <= 1} className="px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 text-sm font-medium">
                          ← Prev
                        </button>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: 13 }, (_, i) => i + 1).map(num => (
                            <button
                              key={num}
                              onClick={() => setDimensionDetailModal(num)}
                              className={`w-7 h-7 rounded text-xs font-bold ${num === dimensionDetailModal ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setDimensionDetailModal(Math.min(13, dimensionDetailModal + 1))} disabled={dimensionDetailModal >= 13} className="px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 text-sm font-medium">
                          Next →
                        </button>
                        <button onClick={() => setDimensionDetailModal(null)} className="ml-4 px-5 py-2 bg-slate-800 text-white rounded font-semibold text-sm hover:bg-slate-700">
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* ============ INFO MODAL ============ */}
          {infoModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setInfoModal(null)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-6 bg-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-white text-xl">{infoContent[infoModal].title}</h3>
                  <button onClick={() => setInfoModal(null)} className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="px-8 py-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </span>
                      What It Shows
                    </h4>
                    <p className="text-slate-600 leading-relaxed">{infoContent[infoModal].what}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </span>
                      How It Works
                    </h4>
                    <p className="text-slate-600 leading-relaxed">{infoContent[infoModal].how}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </span>
                      When to Use
                    </h4>
                    <p className="text-slate-600 leading-relaxed">{infoContent[infoModal].when}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      </span>
                      Questions This Helps Answer
                    </h4>
                    <ul className="space-y-2">
                      {infoContent[infoModal].questions.map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-600">
                          <span className="text-violet-500 mt-1">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-200">
                  <button onClick={() => setInfoModal(null)} className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors">
                    Got It
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* ============ CROSS-DIMENSION INSIGHTS ============ */}
          {patterns.length > 0 && (
            <div className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break max-w-[1200px] mx-auto">
              <div className="px-12 py-6 bg-indigo-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-xl">Cross-Dimensional Insights</h3>
                    <p className="text-indigo-200 mt-1 text-base">Patterns identified across your assessment that reveal strategic opportunities</p>
                  </div>
                  <button 
                    onClick={() => setInfoModal('crossDimensional')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Learn More
                  </button>
                </div>
              </div>
              <div className="px-12 py-8 space-y-6">
                {patterns.map((p, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                      <p className="font-bold text-slate-800 text-lg">{p.pattern}</p>
                    </div>
                    <div className="px-6 py-5 grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">What This Means</p>
                        <p className="text-base text-slate-600 leading-relaxed">{p.implication}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
                          Recommended Action
                          {editMode && <span className="ml-2 text-amber-600 font-normal normal-case">(editable)</span>}
                        </p>
                        {editMode ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={customCrossRecommendations[idx] ?? p.recommendation}
                              onChange={(e) => updateCustomCrossRecommendation(idx, e.target.value)}
                              className="w-full text-base text-slate-600 leading-relaxed bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                              placeholder="Enter custom recommendation..."
                            />
                            {customCrossRecommendations[idx] && (
                              <button 
                                onClick={() => updateCustomCrossRecommendation(idx, '')}
                                className="text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1 self-start"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset to default
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-base text-slate-600 leading-relaxed">{customCrossRecommendations[idx] || p.recommendation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* ============ IMPACT-RANKED PRIORITIES ============ */}
          {(() => {
            return (
              <div className="ppt-break bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8 pdf-no-break max-w-[1200px] mx-auto">
                <div className="px-10 py-6 bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDQwIEwgNDAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
                  <div className="relative flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-2xl tracking-tight">Impact-Ranked Improvement Priorities</h3>
                      <p className="text-cyan-100 mt-1 text-base">Top opportunities ranked by potential score impact relative to implementation effort</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setInfoModal('impactRanked')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors backdrop-blur"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Learn More
                      </button>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                        <svg className="w-5 h-5 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        <span className="text-white font-semibold">Top 5 Priorities</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="space-y-4">
                    {rankings.slice(0, 5).map((r, idx) => (
                      <div key={r.dimNum} className={`relative rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${
                        idx === 0 ? 'border-cyan-300 bg-gradient-to-r from-cyan-50 to-white' : 
                        idx === 1 ? 'border-cyan-200 bg-gradient-to-r from-cyan-50/50 to-white' : 
                        'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                        
                        <div className="flex items-stretch">
                          {/* Priority Number */}
                          <div className={`flex items-center justify-center w-20 text-3xl font-black ${
                            idx === 0 ? 'bg-gradient-to-b from-cyan-500 to-cyan-600 text-white' : 
                            idx === 1 ? 'bg-gradient-to-b from-cyan-400 to-cyan-500 text-white' : 
                            'bg-slate-100 text-slate-400'
                          }`}>
                            {idx + 1}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between gap-6">
                              {/* Dimension Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-bold text-slate-800 text-lg">{r.dimName}</h4>
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                    r.effort === 'Low' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                    r.effort === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                    'bg-red-100 text-red-700 border border-red-200'
                                  }`}>
                                    {r.effort === 'Low' ? '⚡' : r.effort === 'Medium' ? '⏱' : '🔧'} {r.effort} Effort
                                  </span>
                                </div>
                                
                                {/* Recommendations */}
                                {editMode ? (
                                  <div className="flex flex-col gap-2">
                                    <input
                                      type="text"
                                      value={customRecommendations[r.dimNum] ?? r.recommendations?.join(' • ') ?? 'Focus on closing gaps and accelerating in-progress initiatives.'}
                                      onChange={(e) => updateCustomRecommendation(r.dimNum, e.target.value)}
                                      className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                      placeholder="Enter custom recommendations..."
                                    />
                                    {customRecommendations[r.dimNum] && (
                                      <button 
                                        onClick={() => updateCustomRecommendation(r.dimNum, '')}
                                        className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 self-start"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        Reset
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm text-slate-600 space-y-1">
                                    {(customRecommendations[r.dimNum] ? customRecommendations[r.dimNum].split(' • ') : r.recommendations || ['Focus on closing gaps and accelerating initiatives']).map((rec: string, i: number) => (
                                      <p key={i} className="flex items-start gap-2">
                                        <span className="text-cyan-500 mt-0.5">→</span>
                                        <span>{rec}</span>
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* Metrics */}
                              <div className="flex items-center gap-4 flex-shrink-0">
                                {/* Current Score */}
                                <div className="text-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Current</p>
                                  <p className="text-2xl font-bold" style={{ color: getScoreColor(r.currentScore) }}>{r.currentScore}</p>
                                  <p className="text-xs text-slate-400">{r.tier}</p>
                                </div>
                                
                                {/* Arrow */}
                                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                
                                {/* Potential Gain */}
                                <div className="text-center px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                                  <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Impact</p>
                                  <p className="text-2xl font-bold text-emerald-600">+{r.potentialGain}</p>
                                  <p className="text-xs text-emerald-500">points</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-6 text-center italic">Impact calculated based on dimension weight and improvement potential. Effort assessed based on current gaps and in-progress initiatives.</p>
                </div>
              </div>
            );
          })()}
          
          {/* ============ AREAS OF EXCELLENCE ============ */}
          <div className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break max-w-[1200px] mx-auto">
            <div className="px-12 py-5 bg-emerald-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xl">Areas of Excellence</h3>
                  <p className="text-emerald-200 mt-1 text-sm">{strengthDimensions.length} dimensions at Leading or above</p>
                </div>
                <button 
                  onClick={() => setInfoModal('excellence')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Learn More
                </button>
              </div>
            </div>
            <div className="px-12 py-6">
              {strengthDimensions.length > 0 ? (
                <div className="grid grid-cols-2 gap-5">
                  {strengthDimensions.slice(0, 6).map((d) => (
                    <div key={d.dim} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDimensionDetailModal(d.dim)}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-slate-800 text-base">{d.name}</p>
                        <span className="text-xl font-bold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {d.strengths.slice(0, 3).map((e: any, i: number) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{e.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">Focus on building foundational capabilities to reach Leading tier.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* ============ GROWTH OPPORTUNITIES ============ */}
          <div className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break max-w-[1200px] mx-auto">
            <div className="px-12 py-5 bg-amber-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xl">Areas for Growth</h3>
                  <p className="text-amber-200 mt-1 text-sm">Dimensions with improvement potential</p>
                </div>
                <button 
                  onClick={() => setInfoModal('growth')}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Learn More
                </button>
              </div>
            </div>
            <div className="px-12 py-6">
              <div className="grid grid-cols-2 gap-5">
                {allDimensionsByScore.slice(0, 6).map((d) => (
                  <div key={d.dim} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDimensionDetailModal(d.dim)}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-slate-800 text-base">{d.name}</p>
                      <span className="text-xl font-bold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                    </div>
                    {d.needsAttention.length > 0 ? (
                      <ul className="space-y-1.5">
                        {d.needsAttention.slice(0, 3).map((e: any, i: number) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.isGap ? 'bg-red-400' : e.isUnsure ? 'bg-slate-400' : 'bg-amber-400'}`}></span>
                            <span>{e.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Focus on completing planned initiatives</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* ============ INITIATIVES IN PROGRESS ============ */}
          {quickWinOpportunities.length > 0 && (
            <div className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break max-w-[1200px] mx-auto">
              <div className="px-12 py-6 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-xl">Initiatives In Progress</h3>
                    <p className="text-blue-200 mt-1">{quickWinOpportunities.length} programs currently in planning or under consideration</p>
                  </div>
                  <div className="bg-white/20 rounded-lg px-5 py-2.5">
                    <p className="text-white font-semibold">Fastest path to improvement</p>
                  </div>
                </div>
              </div>
              <div className="px-12 py-8">
                <div className="grid grid-cols-2 gap-5">
                  {quickWinOpportunities.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-5 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'Planning' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                        {item.type === 'Planning' ? (
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        ) : (
                          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm font-bold px-3 py-1 rounded-lg ${item.type === 'Planning' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{item.type}</span>
                          <span className="text-sm text-slate-500 font-medium">D{item.dimNum}</span>
                        </div>
                        <p className="text-base text-slate-800 font-semibold leading-snug">{item.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{item.dimName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* ============ STRATEGIC RECOMMENDATIONS - TRANSITION ============ */}
          <div className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-break-before max-w-[1200px] mx-auto" id="appendix-start" data-export="appendix-start">
            <div className="px-12 py-10 bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-3xl">Strategic Recommendations</h3>
                  <p className="text-slate-400 mt-2 text-lg">Detailed analysis and action plans for priority dimensions</p>
                </div>
                <button 
                  onClick={() => setInfoModal('strategicRecos')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Learn More
                </button>
              </div>
            </div>
            <div className="px-12 py-10">
              <p className="text-slate-600 leading-relaxed text-lg mb-8">
                The following pages provide comprehensive analysis for <strong className="text-slate-800">{allDimensionsByScore.slice(0, 4).length} priority dimensions</strong>—those 
                with the greatest opportunity for improvement. Each dimension page includes detailed breakdowns with:
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-5 bg-red-50 rounded-xl border border-red-200">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-red-800 text-lg">Improvement Opportunities</p>
                    <p className="text-base text-red-700 mt-1">Specific gaps where you're not currently offering, with peer benchmarks</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-blue-800 text-lg">In Development</p>
                    <p className="text-base text-blue-700 mt-1">Initiatives in planning that can be accelerated for faster impact</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 text-lg">Current Strengths</p>
                    <p className="text-base text-emerald-700 mt-1">Elements you're already offering that form your foundation</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-violet-50 rounded-xl border border-violet-200">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-violet-800 text-lg">Tailored Insights & CAC Support</p>
                    <p className="text-base text-violet-700 mt-1">Key evidence, strategic insight, recommended roadmap, and CAC programs</p>
                  </div>
                </div>
              </div>
              </div>
              <p className="text-base text-slate-500 mt-8 italic px-12 pb-6">
                Priority dimensions: {allDimensionsByScore.slice(0, 4).map(d => d.name).join(' • ')}
              </p>
            </div>
          </div>
          
          {/* ============ STRATEGIC RECOMMENDATIONS - DIMENSION CARDS ============ */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 max-w-[1200px] mx-auto">
            <div className="divide-y-4 divide-slate-100">
              {allDimensionsByScore.slice(0, 4).map((d, idx) => {
                const dynamicInsight = getDynamicInsight(d.dim, d.score, d.tier.name, d.benchmark, d.gaps, d.strengths, d.planning);
                const benchmarkNarrative = getBenchmarkNarrative(d.score, d.benchmark, d.name);
                const evidence = getTopEvidence(d.dim, d.strengths, d.gaps, d.planning, elementBenchmarks);
                const roadmap = getTwoStepRoadmap(d.dim, d.gaps, d.planning, d.assessing || [], elementBenchmarks);
                const tierColor = getScoreColor(d.score);
                
                return (
                  <div key={d.dim} id={`dimension-card-${d.dim}`} className={`ppt-break border-l-4 pdf-no-break`} style={{ borderLeftColor: tierColor }}>
                    {/* Dimension Header */}
                    <div className="px-10 py-4 bg-slate-700 border-b border-slate-600">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md" style={{ backgroundColor: tierColor }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-white">{d.name}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`text-sm font-medium px-3 py-1 rounded ${d.tier.bgColor}`} style={{ color: d.tier.color }}>{d.tier.name}</span>
                            <span className="text-sm text-slate-300">Score: <strong className="text-white">{d.score}</strong></span>
                            <span className="text-sm text-slate-300">Weight: <strong className="text-white">{d.weight}%</strong></span>
                            {d.benchmark !== null && (
                              <span className="text-sm text-slate-300">Benchmark: <strong className="text-white">{d.benchmark}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Benchmark Narrative */}
                    {benchmarkNarrative && (
                      <div className="px-10 py-3 bg-slate-100 border-b border-slate-200">
                        <p className="text-base text-slate-600">{benchmarkNarrative}</p>
                      </div>
                    )}
                    
                    <div className="px-10 py-6">
                      {/* Current State - 3 columns */}
                      <div className="grid grid-cols-3 gap-6 mb-6">
                        {/* Improvement Opportunities */}
                        <div className="border border-red-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                            <h5 className="font-bold text-red-800 text-base">Improvement Opportunities ({d.needsAttention?.length || 0})</h5>
                          </div>
                          <div className="p-4 bg-white max-h-64 overflow-y-auto">
                            {d.needsAttention?.length > 0 ? (
                              <ul className="space-y-2">
                                {d.needsAttention.map((item: any, i: number) => (
                                  <li key={i} className="text-base text-slate-600 flex items-start gap-2">
                                    <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                      item.isGap ? 'bg-red-500' : item.isAssessing ? 'bg-amber-400' : 'bg-slate-400'
                                    }`}></span>
                                    <span>{item.name}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-base text-slate-400 italic">No gaps identified</p>}
                          </div>
                        </div>
                        
                        {/* In Development */}
                        <div className="border border-blue-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                            <h5 className="font-bold text-blue-800 text-base">In Development ({d.planning?.length || 0})</h5>
                          </div>
                          <div className="p-4 bg-white max-h-64 overflow-y-auto">
                            {d.planning?.length > 0 ? (
                              <ul className="space-y-2">
                                {d.planning.map((item: any, i: number) => (
                                  <li key={i} className="text-base text-slate-600 flex items-start gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                                    <span>{item.name}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-base text-slate-400 italic">No initiatives in planning</p>}
                          </div>
                        </div>
                        
                        {/* Strengths */}
                        <div className="border border-emerald-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200">
                            <h5 className="font-bold text-emerald-800 text-base">Strengths ({d.strengths?.length || 0})</h5>
                          </div>
                          <div className="p-4 bg-white max-h-64 overflow-y-auto">
                            {d.strengths?.length > 0 ? (
                              <ul className="space-y-2">
                                {d.strengths.map((s: any, i: number) => (
                                  <li key={i} className="text-base text-slate-600 flex items-start gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></span>
                                    <span>{s.name}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-base text-slate-400 italic">Building toward first strengths</p>}
                          </div>
                        </div>
                      </div>
                      
                      {/* Strategic Insight & CAC Help - 2 columns */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Left Column: Evidence + Insight */}
                        <div className="space-y-4">
                          {(evidence.topStrength || evidence.biggestGap || evidence.inFlight) && (
                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                              <h5 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Key Evidence</h5>
                              <div className="space-y-2">
                                {evidence.topStrength && (
                                  <div className="flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-emerald-600 text-sm">✓</span>
                                    </span>
                                    <p className="text-base text-slate-700">
                                      <span className="font-medium">Strength:</span> <span className="font-semibold text-emerald-700">{evidence.topStrength.name}</span>
                                      <span className="text-slate-500"> ({evidence.topStrength.benchPct}% of peers)</span>
                                    </p>
                                  </div>
                                )}
                                {evidence.biggestGap && (
                                  <div className="flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-red-600 text-sm">✗</span>
                                    </span>
                                    <p className="text-base text-slate-700">
                                      <span className="font-medium">Gap:</span> <span className="font-semibold text-red-700">{evidence.biggestGap.name}</span>
                                      <span className="text-slate-500"> ({evidence.biggestGap.benchPct}% of peers)</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className={`border rounded-xl p-4 ${editMode ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                            <h5 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                              Strategic Insight
                              {editMode && <span className="text-sm font-normal text-amber-600">(click to edit)</span>}
                            </h5>
                            {editMode ? (
                              <textarea
                                value={customInsights[d.dim]?.insight ?? dynamicInsight.insight}
                                onChange={(e) => updateCustomInsight(d.dim, 'insight', e.target.value)}
                                className="w-full text-base text-slate-600 leading-relaxed bg-white border border-amber-200 rounded-lg p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                                placeholder="Enter custom strategic insight..."
                              />
                            ) : (
                              <p className="text-base text-slate-600 leading-relaxed">{customInsights[d.dim]?.insight || dynamicInsight.insight}</p>
                            )}
                            {editMode && customInsights[d.dim]?.insight && (
                              <button 
                                onClick={() => updateCustomInsight(d.dim, 'insight', '')}
                                className="mt-2 text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset to default
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Right Column: Roadmap + CAC Help */}
                        <div className="space-y-4">
                          {(roadmap.quickWin || roadmap.strategicLift) && (
                            <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50">
                              <h5 className="font-bold text-indigo-800 mb-3 text-sm uppercase tracking-wide">Recommended Roadmap</h5>
                              <div className="space-y-3">
                                {roadmap.quickWin && (
                                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded">QUICK WIN</span>
                                      <span className="text-sm text-slate-500">0-60 days</span>
                                    </div>
                                    <p className="text-base font-medium text-slate-800">{roadmap.quickWin.name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{roadmap.quickWin.reason}</p>
                                  </div>
                                )}
                                {roadmap.strategicLift && (
                                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded">STRATEGIC</span>
                                      <span className="text-sm text-slate-500">60-180 days</span>
                                    </div>
                                    <p className="text-base font-medium text-slate-800">{roadmap.strategicLift.name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{roadmap.strategicLift.reason}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className={`border rounded-xl p-4 ${editMode ? 'border-amber-300 bg-amber-50' : 'border-violet-200 bg-violet-50'}`}>
                            <h5 className="font-bold text-violet-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                              How Cancer and Careers Can Help
                              {editMode && <span className="text-sm font-normal text-amber-600">(click to edit)</span>}
                            </h5>
                            {editMode ? (
                              <textarea
                                value={customInsights[d.dim]?.cacHelp ?? dynamicInsight.cacHelp}
                                onChange={(e) => updateCustomInsight(d.dim, 'cacHelp', e.target.value)}
                                className="w-full text-base text-slate-600 leading-relaxed bg-white border border-amber-200 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                                placeholder="Enter custom CAC help text..."
                              />
                            ) : (
                              <p className="text-base text-slate-600 leading-relaxed">{customInsights[d.dim]?.cacHelp || dynamicInsight.cacHelp}</p>
                            )}
                            {editMode && customInsights[d.dim]?.cacHelp && (
                              <button 
                                onClick={() => updateCustomInsight(d.dim, 'cacHelp', '')}
                                className="mt-2 text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset to default
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* ============ IMPLEMENTATION ROADMAP ============ */}
          <div className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-break-before pdf-no-break max-w-[1200px] mx-auto">
            <div className="px-12 py-6 bg-gradient-to-r from-slate-800 to-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xl">Implementation Roadmap</h3>
                  <p className="text-slate-400 mt-1">Your phased approach to strengthen workplace cancer support</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-8 h-1 bg-cyan-400 rounded"></div>
                  <div className="w-8 h-1 bg-blue-400 rounded"></div>
                  <div className="w-8 h-1 bg-violet-400 rounded"></div>
                </div>
              </div>
            </div>
            <div className="px-12 py-8">
              {/* Timeline connector */}
              <div className="relative">
                <div className="absolute top-8 left-[16.67%] right-[16.67%] h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 hidden lg:block"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-8">
                {/* Phase 1 */}
                <div className="relative flex">
                  <div className="border-2 border-cyan-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white flex flex-col w-full" style={{ minHeight: '340px' }}>
                    <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 px-5 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg">Quick Wins</h4>
                          {editMode ? (
                            <input type="text" value={customRoadmapTimeframes.phase1 || '0-3 months'} onChange={(e) => { setCustomRoadmapTimeframes(prev => ({ ...prev, phase1: e.target.value })); setHasUnsavedChanges(true); }} className="text-sm bg-cyan-400/50 text-white border border-cyan-300 rounded px-2 py-0.5 w-28 focus:outline-none mt-1" />
                          ) : (
                            <p className="text-cyan-100 text-sm">{customRoadmapTimeframes.phase1 || '0-3 months'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded">ACCELERATE</span>
                        <span className="text-xs text-slate-400">Items in progress</span>
                      </div>
                      {editMode && <p className="text-xs text-amber-600 mb-3">(editable)</p>}
                      {editMode ? (
                        <textarea value={customRoadmap.phase1?.useCustom ? customRoadmap.phase1.items.join('\n') : quickWinItems.map(item => item.name).join('\n')} onChange={(e) => updateCustomRoadmap('phase1', e.target.value.split('\n').filter(s => s.trim()), true)} className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y" placeholder="Enter items, one per line..." />
                      ) : (
                        <ul className="space-y-3">
                          {(customRoadmap.phase1?.useCustom ? customRoadmap.phase1.items.map((name: string) => ({ name, dimNum: null })) : quickWinItems).slice(0, 5).map((item: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-cyan-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              </span>
                              <div>
                                <p className="text-sm text-slate-700">{item.name}</p>
                                {item.dimNum && <p className="text-xs text-slate-400 mt-0.5">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Phase 2 */}
                <div className="relative flex">
                  <div className="border-2 border-blue-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white flex flex-col w-full" style={{ minHeight: '340px' }}>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg">Foundation Building</h4>
                          {editMode ? (
                            <input type="text" value={customRoadmapTimeframes.phase2 || '3-12 months'} onChange={(e) => { setCustomRoadmapTimeframes(prev => ({ ...prev, phase2: e.target.value })); setHasUnsavedChanges(true); }} className="text-sm bg-blue-400/50 text-white border border-blue-300 rounded px-2 py-0.5 w-28 focus:outline-none mt-1" />
                          ) : (
                            <p className="text-blue-100 text-sm">{customRoadmapTimeframes.phase2 || '3-12 months'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">BUILD</span>
                        <span className="text-xs text-slate-400">High-weight gaps</span>
                      </div>
                      {editMode && <p className="text-xs text-amber-600 mb-3">(editable)</p>}
                      {editMode ? (
                        <textarea value={customRoadmap.phase2?.useCustom ? customRoadmap.phase2.items.join('\n') : foundationItems.map(item => item.name).join('\n')} onChange={(e) => updateCustomRoadmap('phase2', e.target.value.split('\n').filter(s => s.trim()), true)} className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y" placeholder="Enter items, one per line..." />
                      ) : (
                        <ul className="space-y-3">
                          {(customRoadmap.phase2?.useCustom ? customRoadmap.phase2.items.map((name: string) => ({ name, dimNum: null })) : foundationItems).slice(0, 5).map((item: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                              </span>
                              <div>
                                <p className="text-sm text-slate-700">{item.name}</p>
                                {item.dimNum && <p className="text-xs text-slate-400 mt-0.5">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Phase 3 */}
                <div className="relative flex">
                  <div className="border-2 border-violet-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white flex flex-col w-full" style={{ minHeight: '340px' }}>
                    <div className="bg-gradient-to-br from-violet-500 to-violet-600 px-5 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg">Excellence</h4>
                          {editMode ? (
                            <input type="text" value={customRoadmapTimeframes.phase3 || '12-18 months'} onChange={(e) => { setCustomRoadmapTimeframes(prev => ({ ...prev, phase3: e.target.value })); setHasUnsavedChanges(true); }} className="text-sm bg-violet-400/50 text-white border border-violet-300 rounded px-2 py-0.5 w-28 focus:outline-none mt-1" />
                          ) : (
                            <p className="text-violet-100 text-sm">{customRoadmapTimeframes.phase3 || '12-18 months'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded">OPTIMIZE</span>
                        <span className="text-xs text-slate-400">Comprehensive coverage</span>
                      </div>
                      {editMode && <p className="text-xs text-amber-600 mb-3">(editable)</p>}
                      {editMode ? (
                        <textarea value={customRoadmap.phase3?.useCustom ? customRoadmap.phase3.items.join('\n') : stretchItems.map(item => item.name).join('\n')} onChange={(e) => updateCustomRoadmap('phase3', e.target.value.split('\n').filter(s => s.trim()), true)} className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y" placeholder="Enter items, one per line..." />
                      ) : (
                        stretchItems.length > 0 ? (
                          <ul className="space-y-3">
                            {(customRoadmap.phase3?.useCustom ? customRoadmap.phase3.items.map((name: string) => ({ name, dimNum: null })) : stretchItems).slice(0, 5).map((item: any, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-3 h-3 text-violet-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </span>
                                <div>
                                  <p className="text-sm text-slate-700">{item.name}</p>
                                  {item.dimNum && <p className="text-xs text-slate-400 mt-0.5">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</p>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Continue expanding strengths and monitoring program effectiveness</p>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* ============ HOW CAC CAN HELP ============ */}
          <div className="ppt-break bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break max-w-[1200px] mx-auto">
            <div className="px-12 py-8 bg-gradient-to-br from-[#F37021] via-[#FF8C42] to-[#FFB366] relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative flex items-center gap-8">
                <div className="bg-white rounded-2xl p-5 shadow-xl flex-shrink-0">
                  <Image src="/cancer-careers-logo.png" alt="Cancer and Careers" width={140} height={50} className="object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-2xl">How Cancer and Careers Can Help</h3>
                  <p className="text-white/90 mt-2 text-lg">Tailored support to enhance your employee experience</p>
                </div>
              </div>
            </div>
            <div className="px-12 py-8">
              {/* Intro paragraph */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 mb-8 relative">
                <div className="absolute top-0 left-6 w-1 h-full bg-gradient-to-b from-[#F37021] to-transparent rounded-full"></div>
                <div className="pl-4">
                  <p className="text-slate-700 text-base leading-relaxed">
                    Every organization enters this work from a different place. Cancer and Careers' consulting practice 
                    helps organizations understand where they are, identify where they want to be, and build a realistic 
                    path to get there—shaped by <strong className="text-[#F37021]">two decades of frontline experience</strong> with employees navigating cancer 
                    and the HR teams supporting them.
                  </p>
                </div>
              </div>
              
              {editMode && <p className="text-sm text-amber-600 mb-4">(editable below)</p>}
              
              {/* 4 Service Cards with bullets - enhanced design */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {[
                  { key: 'item1', num: 1, defaultTitle: 'Manager Preparedness & Training', defaultBullets: ['Live training sessions with case studies', 'Manager toolkit and conversation guides', 'Train the trainer programs'], color: 'violet' },
                  { key: 'item2', num: 2, defaultTitle: 'Navigation & Resource Architecture', defaultBullets: ['Resource audit and gap analysis', 'Single entry point design', 'Communication strategy'], color: 'emerald' },
                  { key: 'item3', num: 3, defaultTitle: 'Return to Work Excellence', defaultBullets: ['Phased return protocols', 'Check-in cadence design', 'Career continuity planning'], color: 'amber' },
                  { key: 'item4', num: 4, defaultTitle: 'Policy & Program Assessment', defaultBullets: ['Comprehensive policy review', 'Implementation audit', 'Business case development'], color: 'blue' },
                ].map(item => {
                  const custom = customCacHelp[item.key as keyof typeof customCacHelp];
                  const title = custom?.title || item.defaultTitle;
                  const bullets = custom?.bullets || item.defaultBullets;
                  const colorClasses = {
                    violet: { bg: 'bg-violet-500', border: 'border-violet-300', icon: 'bg-violet-100 text-violet-600', light: 'bg-violet-50' },
                    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-300', icon: 'bg-emerald-100 text-emerald-600', light: 'bg-emerald-50' },
                    amber: { bg: 'bg-amber-500', border: 'border-amber-300', icon: 'bg-amber-100 text-amber-600', light: 'bg-amber-50' },
                    blue: { bg: 'bg-blue-500', border: 'border-blue-300', icon: 'bg-blue-100 text-blue-600', light: 'bg-blue-50' },
                  }[item.color];
                  
                  return (
                    <div key={item.key} className={`rounded-2xl border ${colorClasses?.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                      <div className={`${colorClasses?.light} px-5 py-4 border-b ${colorClasses?.border}`}>
                        {editMode ? (
                          <input type="text" value={title} onChange={(e) => { setCustomCacHelp(prev => ({ ...prev, [item.key]: { title: e.target.value, bullets: bullets } })); setHasUnsavedChanges(true); }} className="w-full font-bold text-slate-800 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                        ) : (
                          <h4 className="font-bold text-slate-800">{title}</h4>
                        )}
                      </div>
                      <div className="p-5 bg-white">
                        {editMode ? (
                          <textarea value={bullets.join('\n')} onChange={(e) => { setCustomCacHelp(prev => ({ ...prev, [item.key]: { title: title, bullets: e.target.value.split('\n') } })); setHasUnsavedChanges(true); }} className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 min-h-[90px] focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="One bullet per line..." />
                        ) : (
                          <ul className="text-sm text-slate-600 space-y-2">
                            {bullets.map((b: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-[#F37021] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* CTA Footer - enhanced */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#F37021]/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xl">Ready to take the next step?</p>
                    <p className="text-slate-400 mt-2">Contact Cancer and Careers to discuss how we can support your organization.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <a href="https://cancerandcareers.org" target="_blank" rel="noopener noreferrer" className="font-bold text-[#F37021] text-lg hover:underline">cancerandcareers.org</a>
                      <p className="text-slate-400 mt-1">cacbestcompanies@cew.org</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#F37021] flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* ============ METHODOLOGY & FOOTER ============ */}
          <div className="ppt-break bg-slate-50 rounded-xl border border-slate-200 overflow-hidden pdf-no-break max-w-7xl mx-auto" id="appendix-end" data-export="appendix-end">
            <div className="px-12 py-6 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 text-base">Assessment Methodology</h3>
            </div>
            <div className="px-12 py-6">
              <div className="grid grid-cols-4 gap-6 text-base text-slate-600">
                <div>
                  <p className="font-bold text-slate-700 mb-2">Scoring Framework</p>
                  <p className="leading-relaxed">Organizations are assessed across 13 dimensions of workplace cancer support. The composite score combines dimension performance (90%), program maturity (5%), and support breadth (5%).</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-2">Dimension Weights</p>
                  <p className="leading-relaxed">Each dimension carries a specific weight reflecting its relative importance. Weights were derived from extensive research with HR leaders, employees managing cancer, and general employee populations.</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-2">Benchmarking</p>
                  <p className="leading-relaxed">Benchmark scores represent average performance across all organizations in the Index. Percentile rankings indicate relative positioning within the cohort.</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-3">Performance Tiers</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5B21B6' }}></span>
                      <span style={{ color: '#5B21B6' }} className="font-semibold">Exemplary</span>
                      <span className="text-slate-400">90+ points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#047857' }}></span>
                      <span style={{ color: '#047857' }} className="font-semibold">Leading</span>
                      <span className="text-slate-400">75-89 points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1D4ED8' }}></span>
                      <span style={{ color: '#1D4ED8' }} className="font-semibold">Progressing</span>
                      <span className="text-slate-400">60-74 points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#B45309' }}></span>
                      <span style={{ color: '#B45309' }} className="font-semibold">Emerging</span>
                      <span className="text-slate-400">40-59 points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#B91C1C' }}></span>
                      <span style={{ color: '#B91C1C' }} className="font-semibold">Developing</span>
                      <span className="text-slate-400">&lt;40 points</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-4 border-t border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                {/* Left - CAC Logo */}
                <div className="flex items-center gap-3">
                  <Image 
                    src="/cancer-careers-logo.png" 
                    alt="Cancer and Careers" 
                    width={100} 
                    height={35}
                    className="object-contain"
                  />
                </div>
                {/* Center - Confidential */}
                <div className="text-center">
                  <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Confidential</p>
                  <p className="text-xs text-slate-400 mt-0.5">Survey ID: {surveyId}</p>
                </div>
                {/* Right - BEYOND Insights */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">Powered by:</span>
                  <Image 
                    src="/BI_LOGO_FINAL.png" 
                    alt="BEYOND Insights" 
                    width={100} 
                    height={32}
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-sm text-slate-400 text-center">© 2026 Cancer and Careers. All rights reserved. | Best Companies for Working with Cancer Index</p>
              </div>
            </div>
          </div>
          
        {showInteractiveLinkModal && interactiveLink && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowInteractiveLinkModal(false)}>
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Interactive Report Link</h2>
                      <p className="text-blue-100 text-sm">Share this link with the organization</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Report URL</label>
                    <div className="flex items-center gap-2">
                      <input type="text" readOnly value={interactiveLink.url} className="flex-1 text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono" />
                      <button onClick={() => { navigator.clipboard.writeText(interactiveLink.url); showToast('Link copied to clipboard', 'success'); }} className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium">Copy</button>
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 mb-4 border border-amber-200">
                    <label className="block text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password (Required to Access)
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="text" readOnly value={interactiveLink.password} className="flex-1 text-lg bg-white border border-amber-300 rounded-lg px-3 py-2 font-mono font-bold tracking-wider text-amber-800" />
                      <button onClick={() => { navigator.clipboard.writeText(interactiveLink.password); showToast('Password copied to clipboard', 'success'); }} className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">Copy</button>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Interactive Features:</p>
                        <ul className="mt-1 space-y-1 text-blue-700">
                          <li>• Click any dimension to see element-level details</li>
                          <li>• View strengths, gaps, and in-progress items</li>
                          <li>• Compare performance against benchmark</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                    <button onClick={() => { navigator.clipboard.writeText(`Interactive Report Link:\n${interactiveLink.url}\n\nPassword: ${interactiveLink.password}`); showToast('Link and password copied', 'success'); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Both
                    </button>
                    <button onClick={() => setShowInteractiveLinkModal(false)} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium">Done</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {toast.show && (
          <div className="fixed bottom-6 right-6 z-[100]">
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-white border-green-200' : 'bg-white border-red-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              <div>
                <p className={`font-semibold text-sm ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{toast.type === 'success' ? 'Success' : 'Error'}</p>
                <p className="text-sm text-slate-600">{toast.message}</p>
              </div>
              <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-2 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )}

      </div>
    );
}
