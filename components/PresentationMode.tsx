// PresentationMode.tsx - Standalone presentation component
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PresentationModeProps {
  isActive: boolean;
  onExit: () => void;
  company: any;
  compositeScore: number;
  dimensionAnalysis: any[];
  elementBenchmarks: Record<number, any>;
  patterns: any[];
  rankings: any[];
  strengthDimensions: any[];
  gapOpportunities: any[];
  inProgressItems: any[];
  quickWinItems: any[];
  foundationItems: any[];
  excellenceItems: any[];
  tierCounts: Record<string, number>;
  percentileRank: number | null;
  totalCompanies: number;
  customInsights: Record<number, any>;
  customObservations: Record<string, string>;
  customExecutiveSummary: string;
  customRecommendations: Record<number, string>;
  isSingleCountryCompany: boolean;
  getTier: (score: number) => { name: string; color: string };
  getScoreColor: (score: number) => string;
}

export default function PresentationMode(props: PresentationModeProps) {
  const {
    isActive, onExit, company, compositeScore, dimensionAnalysis, elementBenchmarks,
    patterns, rankings, strengthDimensions, gapOpportunities, inProgressItems,
    quickWinItems, foundationItems, excellenceItems, tierCounts, percentileRank,
    totalCompanies, customInsights, customObservations, customExecutiveSummary,
    customRecommendations, isSingleCountryCompany, getTier, getScoreColor
  } = props;

  const [currentSlide, setCurrentSlide] = useState(0);
  
  const companyName = company?.firmographics_data?.company_name || company?.company_name || 'Company';
  const tier = getTier(compositeScore || 0);
  
  // Sort for recommendations
  const dimsSorted = [...dimensionAnalysis].sort((a, b) => {
    const ord: Record<string, number> = { 'Developing': 0, 'Emerging': 1, 'Progressing': 2, 'Leading': 3, 'Exemplary': 4 };
    return (ord[a.tier.name] - ord[b.tier.name]) || (a.score - b.score);
  });
  const top4 = dimsSorted.slice(0, 4);
  
  // Slide definitions
  const slides: { id: string; title: string; type: string; dimNum?: number; recoIdx?: number }[] = [
    { id: 'title', title: 'Title', type: 'title' },
    { id: 'how-developed', title: 'How Index Was Developed', type: 'how-developed' },
    { id: 'how-to-use', title: 'How To Use This Report', type: 'how-to-use' },
    { id: 'exec-summary', title: 'Executive Summary', type: 'exec-summary' },
    { id: 'score-overview', title: 'Score Overview', type: 'score-overview' },
    { id: 'dim-table', title: 'Dimension Performance', type: 'dim-table' },
    ...[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => ({ id: `dim-${n}`, title: `D${n}: ${dimensionAnalysis.find(d => d.dim === n)?.name || ''}`, type: 'dim-detail', dimNum: n })),
    { id: 'matrix', title: 'Strategic Priority Matrix', type: 'matrix' },
    { id: 'cross-dim', title: 'Cross-Dimensional Insights', type: 'cross-dim' },
    { id: 'impact-ranked', title: 'Impact-Ranked Priorities', type: 'impact-ranked' },
    { id: 'excellence', title: 'Areas of Excellence', type: 'excellence' },
    { id: 'growth', title: 'Areas for Growth', type: 'growth' },
    { id: 'in-progress', title: 'Initiatives in Progress', type: 'in-progress' },
    { id: 'reco-intro', title: 'Strategic Recommendations', type: 'reco-intro' },
    ...top4.map((d, i) => ({ id: `reco-${i}`, title: `Priority ${i+1}: ${d.name}`, type: 'reco-card', dimNum: d.dim, recoIdx: i })),
    { id: 'roadmap', title: 'Implementation Roadmap', type: 'roadmap' },
    { id: 'pledge', title: 'Working with Cancer Pledge', type: 'pledge' },
    { id: 'cac-help', title: 'How CAC Can Help', type: 'cac-help' },
    { id: 'methodology', title: 'Methodology', type: 'methodology' },
    { id: 'thank-you', title: 'Thank You', type: 'thank-you' },
  ];
  
  const total = slides.length;
  const slide = slides[currentSlide];
  const go = (i: number) => setCurrentSlide(Math.max(0, Math.min(i, total - 1)));
  
  // Keyboard nav
  useEffect(() => {
    if (!isActive) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(currentSlide + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(currentSlide - 1); }
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(total - 1);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isActive, currentSlide, total]);
  
  if (!isActive) return null;
  
  // Status helpers for dimension details
  const getStatus = (el: any) => {
    if (el.isStrength) return { label: 'Offering', bg: '#10B981', light: '#D1FAE5', text: '#065F46' };
    if (el.isPlanning) return { label: 'Planning', bg: '#3B82F6', light: '#DBEAFE', text: '#1E40AF' };
    if (el.isAssessing) return { label: 'Assessing', bg: '#F59E0B', light: '#FEF3C7', text: '#92400E' };
    return { label: 'Not Planned', bg: '#9CA3AF', light: '#F3F4F6', text: '#374151' };
  };
  
  const getObs = (el: any, bench: any) => {
    const tot = bench?.total || 1;
    const pct = Math.round(((bench?.currently || 0) / tot) * 100);
    const st = getStatus(el);
    if (st.label === 'Offering') return pct < 30 ? `Differentiator: Only ${pct}% offer` : pct < 50 ? `Ahead of ${100-pct}% of benchmark` : pct < 70 ? `Solid: ${pct}% also offer` : `Table stakes: ${pct}% offer`;
    if (st.label === 'Planning') return `Among those planning; ${pct}% currently offer`;
    if (st.label === 'Assessing') return `Still assessing; ${pct}% offer`;
    return pct > 50 ? `Gap: ${pct}% offer this` : `Emerging: ${pct}% offer`;
  };

  // ============ SLIDE RENDERER ============
  const renderSlide = () => {
    const s = slide;
    
    // TITLE
    if (s.type === 'title') {
      return (
        <div>
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-12 py-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="bg-white rounded-xl p-4 shadow-lg"><Image src="/best-companies-2026-logo.png" alt="Logo" width={120} height={120} /></div>
                <div>
                  <p className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Performance Assessment</p>
                  <h1 className="text-3xl font-bold text-white mt-2">Best Companies for Working with Cancer</h1>
                  <p className="text-slate-300 mt-1 text-lg">Index 2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Report Date</p>
                <p className="text-white font-semibold text-lg">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
          <div className="px-12 py-10 bg-gradient-to-b from-slate-50 to-white text-center">
            <p className="text-slate-500 text-lg font-medium uppercase tracking-wider">Presented To</p>
            <h2 className="text-4xl font-bold text-slate-900 mt-2">{companyName}</h2>
            <div className="flex justify-center gap-6 mt-8">
              <div className="bg-white rounded-2xl px-8 py-6 border border-slate-200 shadow-sm"><p className="text-5xl font-bold text-violet-600">40%</p><p className="text-sm text-slate-500 mt-2">of adults will be<br/>diagnosed with cancer</p></div>
              <div className="bg-white rounded-2xl px-8 py-6 border border-slate-200 shadow-sm"><p className="text-5xl font-bold text-violet-600">42%</p><p className="text-sm text-slate-500 mt-2">of diagnoses during<br/>working years (20-64)</p></div>
            </div>
            <p className="text-slate-600 mt-8 text-lg max-w-3xl mx-auto">When employees face a cancer diagnosis, an organization's response defines its culture.</p>
          </div>
        </div>
      );
    }
    
    // HOW DEVELOPED
    if (s.type === 'how-developed') {
      return (
        <div className="p-8">
          <div className="px-6 py-4 bg-slate-800 rounded-t-xl"><p className="text-slate-400 text-xs uppercase tracking-widest">Built on Real-World Research</p><h2 className="font-bold text-white text-2xl">How This Index Was Developed</h2></div>
          <div className="p-6 bg-white rounded-b-xl border border-slate-200">
            <p className="text-slate-700 mb-6">The 13 dimensions weren't developed in a silo. They were shaped through <strong>qualitative and quantitative research</strong> with the people who live this every day.</p>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-violet-50 rounded-xl p-5 border border-violet-200 text-center"><div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center mx-auto mb-3"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div><p className="font-bold text-violet-800">HR Leaders</p><p className="text-sm text-slate-600 mt-1">Shaped dimensions and elements</p></div>
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 text-center"><div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center mx-auto mb-3"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></div><p className="font-bold text-amber-800">Employees with Cancer</p><p className="text-sm text-slate-600 mt-1">Revealed what support matters</p></div>
              <div className="bg-sky-50 rounded-xl p-5 border border-sky-200 text-center"><div className="w-12 h-12 rounded-full bg-sky-600 flex items-center justify-center mx-auto mb-3"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div><p className="font-bold text-sky-800">General Workforce</p><p className="text-sm text-slate-600 mt-1">Showed how support shapes trust</p></div>
              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200 text-center"><div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div><p className="font-bold text-emerald-800">Cancer and Careers</p><p className="text-sm text-slate-600 mt-1">25+ years of expertise</p></div>
            </div>
          </div>
        </div>
      );
    }
    
    // HOW TO USE
    if (s.type === 'how-to-use') {
      return (
        <div className="p-8">
          <div className="px-6 py-4 bg-indigo-700 rounded-t-xl"><h2 className="font-bold text-white text-2xl">How To Use This Report</h2><p className="text-indigo-200 mt-1">Your guide to understanding and acting on your results</p></div>
          <div className="p-6 bg-white rounded-b-xl border border-slate-200">
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200"><div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-3 text-indigo-600 font-bold text-lg">1</div><h3 className="font-bold text-slate-800 text-lg">Review Your Score</h3><p className="text-sm text-slate-600 mt-2">Start with your composite score and tier placement to understand where you stand.</p></div>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200"><div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-3 text-indigo-600 font-bold text-lg">2</div><h3 className="font-bold text-slate-800 text-lg">Explore Dimensions</h3><p className="text-sm text-slate-600 mt-2">Dive into each of the 13 dimensions to understand your strengths and opportunities.</p></div>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200"><div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-3 text-indigo-600 font-bold text-lg">3</div><h3 className="font-bold text-slate-800 text-lg">Take Action</h3><p className="text-sm text-slate-600 mt-2">Use the strategic recommendations and roadmap to prioritize your next steps.</p></div>
            </div>
            <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100">
              <h4 className="font-bold text-indigo-800 mb-3">Understanding Your Tier</h4>
              <div className="grid grid-cols-5 gap-3">
                {[{n:'Developing',c:'#EF4444',r:'0-39'},{n:'Emerging',c:'#F97316',r:'40-54'},{n:'Progressing',c:'#EAB308',r:'55-69'},{n:'Leading',c:'#22C55E',r:'70-84'},{n:'Exemplary',c:'#8B5CF6',r:'85-100'}].map(t=>(
                  <div key={t.n} className="text-center p-3 bg-white rounded-lg border" style={{borderColor:t.c}}><div className="w-4 h-4 rounded-full mx-auto mb-2" style={{backgroundColor:t.c}}></div><p className="font-bold text-sm" style={{color:t.c}}>{t.n}</p><p className="text-xs text-slate-500">{t.r}</p></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // EXEC SUMMARY
    if (s.type === 'exec-summary') {
      return (
        <div className="p-8">
          <div className="px-6 py-4 bg-slate-800 rounded-t-xl flex items-center justify-between">
            <div><p className="text-slate-400 text-xs uppercase tracking-widest">Prepared For</p><h2 className="font-bold text-white text-2xl">{companyName}</h2></div>
            <div className="text-right"><p className="text-slate-400 text-sm">Overall Score</p><p className="text-4xl font-black text-white">{compositeScore}</p></div>
          </div>
          <div className="p-6 bg-white rounded-b-xl border border-slate-200">
            <div className="flex gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4"><div className="w-4 h-4 rounded-full" style={{backgroundColor:tier.color}}></div><span className="font-bold text-lg" style={{color:tier.color}}>{tier.name} Tier</span></div>
                <p className="text-slate-700 leading-relaxed">{customExecutiveSummary || `Your organization demonstrates ${tier.name.toLowerCase()} performance in supporting employees through cancer and serious health challenges across 13 key dimensions.`}</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200"><p className="text-emerald-800 font-bold text-sm mb-1">Key Strengths</p><p className="text-sm text-emerald-700">{strengthDimensions.slice(0,2).map(d=>d.name).join(', ')||'Building foundation'}</p></div>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200"><p className="text-amber-800 font-bold text-sm mb-1">Priority Opportunities</p><p className="text-sm text-amber-700">{gapOpportunities.slice(0,2).map(d=>d.name).join(', ')||'Continuous improvement'}</p></div>
                </div>
              </div>
              <div className="w-40 flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-full"><circle cx="60" cy="60" r="54" fill="none" stroke="#E2E8F0" strokeWidth="12"/><circle cx="60" cy="60" r="54" fill="none" stroke={tier.color} strokeWidth="12" strokeDasharray={`${(compositeScore||0)*3.39} 339`} strokeLinecap="round" transform="rotate(-90 60 60)"/><text x="60" y="55" textAnchor="middle" className="text-3xl font-black" fill="#1E293B">{compositeScore}</text><text x="60" y="75" textAnchor="middle" className="text-xs" fill="#64748B">of 100</text></svg>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // SCORE OVERVIEW
    if (s.type === 'score-overview') {
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Score Overview</h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border-2 text-center" style={{borderColor:tier.color}}><p className="text-5xl font-black" style={{color:tier.color}}>{compositeScore}</p><p className="text-slate-500 mt-1 text-sm">Composite Score</p><p className="text-xs mt-2 px-2 py-1 rounded-full inline-block" style={{backgroundColor:tier.color+'20',color:tier.color}}>{tier.name}</p></div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center"><p className="text-5xl font-black text-slate-700">{percentileRank||'--'}</p><p className="text-slate-500 mt-1 text-sm">Percentile Rank</p><p className="text-xs text-slate-400 mt-2">of {totalCompanies} companies</p></div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center"><p className="text-5xl font-black text-emerald-600">{strengthDimensions.length}</p><p className="text-slate-500 mt-1 text-sm">Strong Dimensions</p><p className="text-xs text-slate-400 mt-2">Leading or Exemplary</p></div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-center"><p className="text-5xl font-black text-amber-600">{gapOpportunities.length}</p><p className="text-slate-500 mt-1 text-sm">Opportunities</p><p className="text-xs text-slate-400 mt-2">Room to improve</p></div>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Tier Distribution</h3>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(tierCounts).map(([name,count])=>{const colors:Record<string,string>={'Developing':'#EF4444','Emerging':'#F97316','Progressing':'#EAB308','Leading':'#22C55E','Exemplary':'#8B5CF6'};return(<div key={name} className="text-center p-4 bg-white rounded-lg border border-slate-200"><p className="text-3xl font-bold" style={{color:colors[name]}}>{count}</p><p className="text-sm text-slate-600 mt-1">{name}</p></div>);})}
            </div>
          </div>
        </div>
      );
    }
    
    // DIMENSION TABLE
    if (s.type === 'dim-table') {
      return (
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Dimension Performance</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left font-bold text-slate-600">Dimension</th><th className="px-4 py-3 text-center font-bold text-slate-600 w-20">Weight</th><th className="px-4 py-3 text-center font-bold text-slate-600 w-20">Score</th><th className="px-4 py-3 text-center font-bold text-slate-600 w-24">vs Bench</th><th className="px-4 py-3 text-center font-bold text-slate-600 w-28">Tier</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {dimensionAnalysis.map((d,i)=>{const diff=d.benchmark!==null?d.score-d.benchmark:null;return(
                  <tr key={d.dim} className={i%2===1?'bg-slate-50/50':''}>
                    <td className="px-4 py-2.5"><span className="font-bold text-slate-400 mr-2">D{d.dim}</span><span className="font-medium text-slate-800">{d.name}</span></td>
                    <td className="px-4 py-2.5 text-center text-slate-600">{d.weight}%</td>
                    <td className="px-4 py-2.5 text-center font-bold" style={{color:getScoreColor(d.score)}}>{d.score}</td>
                    <td className="px-4 py-2.5 text-center">{diff!==null?<span className={diff>=0?'text-emerald-600 font-semibold':'text-red-500 font-semibold'}>{diff>=0?'+':''}{diff}</span>:'—'}</td>
                    <td className="px-4 py-2.5 text-center"><span className="px-2 py-1 rounded text-xs font-bold" style={{backgroundColor:d.tier.color+'20',color:d.tier.color}}>{d.tier.name}</span></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    // DIMENSION DETAIL (13 slides)
    if (s.type === 'dim-detail' && s.dimNum) {
      const d = dimensionAnalysis.find(dim => dim.dim === s.dimNum);
      if (!d) return <div className="p-8 text-center">Dimension not found</div>;
      const elemBench = elementBenchmarks[s.dimNum] || {};
      const diff = d.benchmark !== null ? d.score - d.benchmark : null;
      
      return (
        <div className="flex flex-col h-full max-h-[calc(100vh-160px)]">
          <div className="px-8 py-5 flex-shrink-0" style={{background:`linear-gradient(135deg, ${d.tier.color} 0%, ${d.tier.color}dd 100%)`}}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-white text-3xl font-bold">{d.dim}</span>
                <div><h3 className="text-2xl font-bold text-white">{d.name}</h3><div className="flex items-center gap-3 mt-1"><span className="px-3 py-1 bg-white/20 rounded text-sm font-medium text-white/90">Weight: {d.weight}%</span><span className="px-3 py-1 bg-white/30 rounded text-sm font-semibold text-white">{d.tier.name}</span></div></div>
              </div>
              <div className="text-right flex items-end gap-6">
                <div><p className="text-6xl font-black text-white">{d.score}</p><p className="text-white/70 text-sm">Your Score</p></div>
                {diff !== null && <div className="text-right"><p className={`text-4xl font-bold ${diff >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>{diff >= 0 ? '+' : ''}{diff}</p><p className="text-white/70 text-sm">vs {d.benchmark} benchmark</p></div>}
              </div>
            </div>
          </div>
          <div className="px-8 py-3 bg-slate-100 border-b border-slate-200 grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wide flex-shrink-0">
            <div className="col-span-3">Element</div><div className="col-span-1 text-center">Status</div>
            <div className="col-span-5 text-center"><div>Benchmark Distribution</div><div className="flex items-center justify-center gap-3 mt-1 font-normal normal-case"><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{backgroundColor:'#10B981'}}></span>Offering</span><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{backgroundColor:'#3B82F6'}}></span>Planning</span><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{backgroundColor:'#F59E0B'}}></span>Assessing</span><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{backgroundColor:'#CBD5E1'}}></span>Not Planned</span></div></div>
            <div className="col-span-3 pl-4">Observation</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {d.elements?.filter((el: any) => !isSingleCountryCompany || !el.name?.toLowerCase()?.includes('global')).map((el: any, i: number) => {
              const st = getStatus(el);
              const bench = elemBench[el.name] || { currently: 0, planning: 0, assessing: 0, total: 1 };
              const tot = bench.total || 1;
              const pC = Math.round((bench.currently / tot) * 100);
              const pP = Math.round((bench.planning / tot) * 100);
              const pA = Math.round((bench.assessing / tot) * 100);
              const pN = Math.max(0, 100 - pC - pP - pA);
              return (
                <div key={i} className={`px-8 py-4 grid grid-cols-12 gap-4 items-center border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <div className="col-span-3"><p className="text-sm text-slate-800 font-medium">{el.name}</p></div>
                  <div className="col-span-1 flex justify-center"><span className="px-2.5 py-1.5 rounded text-xs font-bold" style={{backgroundColor:st.light,color:st.text}}>{st.label}</span></div>
                  <div className="col-span-5"><div className="h-8 rounded-lg overflow-hidden flex bg-slate-200 border border-slate-300">{pC>0&&<div className="flex items-center justify-center text-xs font-bold text-white" style={{width:`${pC}%`,backgroundColor:'#10B981',minWidth:'28px'}}>{pC}%</div>}{pP>0&&<div className="flex items-center justify-center text-xs font-bold text-white" style={{width:`${pP}%`,backgroundColor:'#3B82F6',minWidth:'28px'}}>{pP}%</div>}{pA>0&&<div className="flex items-center justify-center text-xs font-bold text-white" style={{width:`${pA}%`,backgroundColor:'#F59E0B',minWidth:'28px'}}>{pA}%</div>}{pN>0&&<div className="flex items-center justify-center text-xs font-bold text-slate-600" style={{width:`${pN}%`,backgroundColor:'#CBD5E1',minWidth:'28px'}}>{pN}%</div>}</div></div>
                  <div className="col-span-3 pl-4"><p className="text-xs text-slate-700 font-medium">{customObservations[`dim${d.dim}_${el.name}`] || getObs(el, bench)}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // MATRIX
    if (s.type === 'matrix') {
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Strategic Priority Matrix</h2>
          <p className="text-slate-500 mb-6">Dimensions plotted by score (x-axis) and strategic weight (y-axis)</p>
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 relative">
            <div className="relative h-80 border-l-2 border-b-2 border-slate-300 ml-8 mb-8">
              <div className="absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-slate-500 whitespace-nowrap">Strategic Weight →</div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-500">Performance Score →</div>
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-amber-100/40"></div>
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-100/40"></div>
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-slate-100/60"></div>
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-sky-100/40"></div>
              {dimensionAnalysis.map(d=>{const x=(d.score/100)*100;const y=100-((Math.min(d.weight,20)/20)*100);return(<div key={d.dim} className="absolute w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-pointer" style={{left:`${x}%`,top:`${y}%`,backgroundColor:d.tier.color}} title={`${d.name}: Score ${d.score}, Weight ${d.weight}%`}>D{d.dim}</div>);})}
            </div>
            <div className="grid grid-cols-4 gap-3 text-xs mt-4">
              <div className="p-2 bg-amber-100 rounded text-center"><span className="font-bold text-amber-800">Top Left:</span> High priority gaps</div>
              <div className="p-2 bg-emerald-100 rounded text-center"><span className="font-bold text-emerald-800">Top Right:</span> Maintain strengths</div>
              <div className="p-2 bg-slate-200 rounded text-center"><span className="font-bold text-slate-700">Bottom Left:</span> Monitor</div>
              <div className="p-2 bg-sky-100 rounded text-center"><span className="font-bold text-sky-800">Bottom Right:</span> Leverage wins</div>
            </div>
          </div>
        </div>
      );
    }
    
    // CROSS-DIM
    if (s.type === 'cross-dim') {
      return (
        <div className="p-8">
          <div className="px-6 py-4 bg-indigo-700 rounded-t-xl"><h2 className="font-bold text-white text-2xl">Cross-Dimensional Insights</h2><p className="text-indigo-200 mt-1">Patterns that emerge across multiple dimensions</p></div>
          <div className="p-6 bg-white rounded-b-xl border border-slate-200">
            {patterns.length > 0 ? (
              <div className="space-y-4">{patterns.slice(0,4).map((p,i)=>(<div key={i} className="p-5 bg-slate-50 rounded-xl border border-slate-200"><div className="flex items-start gap-4"><div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 font-bold text-indigo-600">{i+1}</div><div><h4 className="font-bold text-slate-800">{p.pattern}</h4><p className="text-sm text-slate-600 mt-1">{p.implication}</p><p className="text-sm text-indigo-600 mt-2 font-medium">→ {p.recommendation}</p></div></div></div>))}</div>
            ) : (<p className="text-slate-500 text-center py-8">Cross-dimensional analysis in progress</p>)}
          </div>
        </div>
      );
    }
    
    // IMPACT RANKED
    if (s.type === 'impact-ranked') {
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Impact-Ranked Priorities</h2>
          <p className="text-slate-500 mb-6">Dimensions ranked by potential impact on your overall score</p>
          <div className="space-y-3">
            {rankings.slice(0,8).map((r,i)=>{const d=dimensionAnalysis.find(dim=>dim.dim===r.dim);if(!d)return null;return(
              <div key={r.dim} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{backgroundColor:d.tier.color}}>{i+1}</div>
                <div className="flex-1"><p className="font-bold text-slate-800">{d.name}</p><p className="text-sm text-slate-500">Weight: {d.weight}% • Current: {d.score}</p></div>
                <div className="text-right"><p className="text-2xl font-bold" style={{color:d.tier.color}}>{d.score}</p><p className="text-xs text-slate-400">{d.tier.name}</p></div>
              </div>
            );})}
          </div>
        </div>
      );
    }
    
    // EXCELLENCE
    if (s.type === 'excellence') {
      return (
        <div className="p-8">
          <div className="px-6 py-4 bg-emerald-600 rounded-t-xl"><h2 className="font-bold text-white text-2xl">Areas of Excellence</h2><p className="text-emerald-100 mt-1">Dimensions where you lead or excel</p></div>
          <div className="p-6 bg-white rounded-b-xl border border-slate-200">
            {strengthDimensions.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">{strengthDimensions.map(d=>(<div key={d.dim} className="p-5 bg-emerald-50 rounded-xl border border-emerald-200"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">D{d.dim}</span><span className="font-bold text-slate-800">{d.name}</span></div><span className="text-2xl font-black text-emerald-600">{d.score}</span></div><p className="text-sm text-slate-600">{d.strengths?.length||0} elements currently offered</p></div>))}</div>
            ) : (<p className="text-slate-500 text-center py-8">Keep building - excellence is within reach!</p>)}
          </div>
        </div>
      );
    }
    
    // GROWTH
    if (s.type === 'growth') {
      return (
        <div className="p-8">
          <div className="px-6 py-4 bg-amber-500 rounded-t-xl"><h2 className="font-bold text-white text-2xl">Areas for Growth</h2><p className="text-amber-100 mt-1">Dimensions with the most opportunity for improvement</p></div>
          <div className="p-6 bg-white rounded-b-xl border border-slate-200">
            {gapOpportunities.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">{gapOpportunities.slice(0,6).map(d=>(<div key={d.dim} className="p-5 bg-amber-50 rounded-xl border border-amber-200"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{backgroundColor:d.tier.color}}>D{d.dim}</span><span className="font-bold text-slate-800">{d.name}</span></div><span className="text-2xl font-black" style={{color:d.tier.color}}>{d.score}</span></div><p className="text-sm text-slate-600">{d.gaps?.length||0} gaps identified • Weight: {d.weight}%</p></div>))}</div>
            ) : (<p className="text-slate-500 text-center py-8">Great news - no major gaps identified!</p>)}
          </div>
        </div>
      );
    }
    
    // IN PROGRESS
    if (s.type === 'in-progress') {
      return (
        <div className="p-8">
          <div className="px-6 py-4 bg-blue-600 rounded-t-xl"><h2 className="font-bold text-white text-2xl">Initiatives in Progress</h2><p className="text-blue-100 mt-1">Elements you're currently planning or assessing</p></div>
          <div className="p-6 bg-white rounded-b-xl border border-slate-200">
            {inProgressItems.length > 0 ? (
              <div className="space-y-3">{inProgressItems.slice(0,8).map((item,i)=>(<div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200"><span className={`px-3 py-1 rounded text-xs font-bold ${item.type==='Planning'?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'}`}>{item.type}</span><div className="flex-1"><p className="font-medium text-slate-800">{item.name}</p><p className="text-sm text-slate-500">D{item.dimNum}: {item.dimName}</p></div></div>))}</div>
            ) : (<p className="text-slate-500 text-center py-8">No initiatives currently in progress</p>)}
          </div>
        </div>
      );
    }
    
    // RECO INTRO
    if (s.type === 'reco-intro') {
      return (
        <div className="p-8">
          <div className="px-8 py-6 bg-gradient-to-r from-violet-700 to-indigo-700 rounded-t-xl"><h2 className="font-bold text-white text-3xl">Strategic Recommendations</h2><p className="text-violet-200 mt-2 text-lg">Prioritized actions based on your assessment results</p></div>
          <div className="p-8 bg-white rounded-b-xl border border-slate-200">
            <p className="text-lg text-slate-700 mb-8">The following pages provide detailed recommendations for your <strong>{top4.length} priority dimensions</strong> — those with the greatest opportunity for meaningful improvement.</p>
            <div className="grid grid-cols-4 gap-4">
              {top4.map((d,i)=>(<div key={d.dim} className="p-5 rounded-xl border-2 text-center" style={{borderColor:d.tier.color,backgroundColor:d.tier.color+'10'}}><div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg" style={{backgroundColor:d.tier.color}}>P{i+1}</div><p className="font-bold text-slate-800">{d.name}</p><p className="text-sm text-slate-500 mt-1">Score: {d.score}</p></div>))}
            </div>
          </div>
        </div>
      );
    }
    
    // RECO CARD
    if (s.type === 'reco-card' && s.dimNum !== undefined) {
      const d = dimensionAnalysis.find(dim => dim.dim === s.dimNum);
      if (!d) return <div className="p-8">Recommendation not found</div>;
      const diff = d.benchmark !== null ? d.score - d.benchmark : null;
      const recoIdx = s.recoIdx ?? 0;
      return (
        <div className="p-6">
          <div className="px-6 py-4 rounded-t-xl flex items-center justify-between" style={{background:`linear-gradient(135deg, ${d.tier.color} 0%, ${d.tier.color}dd 100%)`}}>
            <div className="flex items-center gap-4"><span className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">P{recoIdx+1}</span><div><p className="text-white/80 text-sm">Priority Recommendation</p><h3 className="text-2xl font-bold text-white">{d.name}</h3></div></div>
            <div className="text-right"><p className="text-5xl font-black text-white">{d.score}</p><p className="text-white/70 text-sm">{d.tier.name} Tier</p></div>
          </div>
          <div className="p-6 bg-white rounded-b-xl border border-slate-200">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200"><h4 className="font-bold text-emerald-800 mb-3">Current Strengths ({d.strengths?.length||0})</h4><ul className="space-y-2">{d.strengths?.slice(0,4).map((item: any,i: number)=>(<li key={i} className="text-sm text-emerald-700">• {item.name||item}</li>))||<li className="text-sm text-emerald-600 italic">Building strengths</li>}</ul></div>
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200"><h4 className="font-bold text-amber-800 mb-3">Opportunities ({d.gaps?.length||0})</h4><ul className="space-y-2">{d.gaps?.slice(0,4).map((item: any,i: number)=>(<li key={i} className="text-sm text-amber-700">• {item.name||item}</li>))||<li className="text-sm text-amber-600 italic">No critical gaps</li>}</ul></div>
            </div>
            <div className="bg-violet-50 rounded-xl p-5 border border-violet-200"><h4 className="font-bold text-violet-800 mb-3">Recommended Actions</h4><p className="text-sm text-violet-700">{customRecommendations[d.dim] || customInsights[d.dim]?.cacHelp || `Focus on implementing the identified gaps in ${d.name}. Start with elements in planning stage, then move to those being assessed.`}</p></div>
          </div>
        </div>
      );
    }
    
    // ROADMAP
    if (s.type === 'roadmap') {
      return (
        <div className="p-8">
          <div className="px-6 py-4 bg-slate-800 rounded-t-xl"><h2 className="font-bold text-white text-2xl">Implementation Roadmap</h2><p className="text-slate-400 mt-1">Your phased approach to strengthening workplace cancer support</p></div>
          <div className="p-6 bg-white rounded-b-xl border border-slate-200">
            <div className="grid grid-cols-3 gap-6">
              <div className="border-2 border-emerald-200 rounded-xl overflow-hidden"><div className="bg-emerald-600 px-4 py-3 text-white font-bold">Phase 1: Quick Wins (0-3 mo)</div><div className="p-4 space-y-2">{quickWinItems.slice(0,4).map((item,i)=>(<div key={i} className="text-sm p-2 bg-emerald-50 rounded border border-emerald-100"><span className="font-medium text-emerald-800">{item.name}</span><span className="text-emerald-600 text-xs ml-2">D{item.dimNum}</span></div>))}{quickWinItems.length===0&&<p className="text-sm text-slate-500">Items in progress</p>}</div></div>
              <div className="border-2 border-blue-200 rounded-xl overflow-hidden"><div className="bg-blue-600 px-4 py-3 text-white font-bold">Phase 2: Foundation (3-6 mo)</div><div className="p-4 space-y-2">{foundationItems.slice(0,4).map((item,i)=>(<div key={i} className="text-sm p-2 bg-blue-50 rounded border border-blue-100"><span className="font-medium text-blue-800">{item.name}</span><span className="text-blue-600 text-xs ml-2">D{item.dimNum}</span></div>))}{foundationItems.length===0&&<p className="text-sm text-slate-500">Foundation building</p>}</div></div>
              <div className="border-2 border-violet-200 rounded-xl overflow-hidden"><div className="bg-violet-600 px-4 py-3 text-white font-bold">Phase 3: Excellence (6-12 mo)</div><div className="p-4 space-y-2">{excellenceItems.slice(0,4).map((item,i)=>(<div key={i} className="text-sm p-2 bg-violet-50 rounded border border-violet-100"><span className="font-medium text-violet-800">{item.name}</span><span className="text-violet-600 text-xs ml-2">D{item.dimNum}</span></div>))}{excellenceItems.length===0&&<p className="text-sm text-slate-500">Excellence goals</p>}</div></div>
            </div>
          </div>
        </div>
      );
    }
    
    // PLEDGE
    if (s.type === 'pledge') {
      return (
        <div className="p-8">
          <div className="px-8 py-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-xl"><p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-1">Global Initiative</p><h2 className="font-bold text-white text-3xl">The Working with Cancer Pledge</h2></div>
          <div className="p-8 bg-white rounded-b-xl border border-slate-200">
            <p className="text-lg text-slate-700 mb-6">Cancer and Careers and Publicis Groupe launched the Working with Cancer pledge to build a more supportive work environment for employees with cancer.</p>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-violet-50 rounded-xl border border-violet-200"><p className="text-4xl font-black text-violet-600">2,000+</p><p className="text-sm text-slate-600 mt-2">Companies signed</p></div>
              <div className="text-center p-6 bg-violet-50 rounded-xl border border-violet-200"><p className="text-4xl font-black text-violet-600">20M+</p><p className="text-sm text-slate-600 mt-2">Employees covered</p></div>
              <div className="text-center p-6 bg-violet-50 rounded-xl border border-violet-200"><p className="text-4xl font-black text-violet-600">50+</p><p className="text-sm text-slate-600 mt-2">Countries</p></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center"><p className="text-slate-600 mb-4">Learn more and sign the pledge</p><p className="text-xl font-bold text-violet-600">workingwithcancerpledge.com</p></div>
          </div>
        </div>
      );
    }
    
    // CAC HELP
    if (s.type === 'cac-help') {
      return (
        <div className="p-8">
          <div className="px-8 py-6 bg-gradient-to-r from-[#F37021] to-[#FF8C42] rounded-t-xl"><h2 className="font-bold text-white text-3xl">How Cancer and Careers Can Help</h2><p className="text-white/80 mt-2">Resources and support for your organization</p></div>
          <div className="p-8 bg-white rounded-b-xl border border-slate-200">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-orange-50 rounded-xl border border-orange-200"><h4 className="font-bold text-orange-800 text-lg mb-3">For HR & Leadership</h4><ul className="space-y-2 text-sm text-orange-700"><li>• Manager training programs</li><li>• Policy consultation</li><li>• Best practices workshops</li><li>• Benchmarking resources</li></ul></div>
              <div className="p-6 bg-orange-50 rounded-xl border border-orange-200"><h4 className="font-bold text-orange-800 text-lg mb-3">For Employees</h4><ul className="space-y-2 text-sm text-orange-700"><li>• Career coaching</li><li>• Support groups</li><li>• Educational webinars</li><li>• Resource library</li></ul></div>
            </div>
            <div className="mt-8 p-6 bg-slate-800 rounded-xl text-center"><p className="text-white mb-2">Ready to take the next step?</p><p className="text-2xl font-bold text-[#F37021]">cancerandcareers.org</p><p className="text-slate-400 mt-2">index@cancerandcareers.org</p></div>
          </div>
        </div>
      );
    }
    
    // METHODOLOGY
    if (s.type === 'methodology') {
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Assessment Methodology</h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-center"><p className="text-3xl font-bold text-slate-700">13</p><p className="text-sm text-slate-500 mt-1">Dimensions</p></div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-center"><p className="text-3xl font-bold text-slate-700">100+</p><p className="text-sm text-slate-500 mt-1">Elements</p></div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-center"><p className="text-3xl font-bold text-slate-700">5</p><p className="text-sm text-slate-500 mt-1">Tier Levels</p></div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-center"><p className="text-3xl font-bold text-slate-700">100</p><p className="text-sm text-slate-500 mt-1">Max Score</p></div>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Scoring Approach</h3>
            <p className="text-sm text-slate-600 mb-4">Each dimension is weighted based on strategic importance. Element scores reflect current offering status, with partial credit for planning and assessing stages. Benchmarks derived from all participating organizations.</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-white rounded border border-slate-200"><span className="font-bold text-emerald-600">Currently Offering:</span> Full points</div>
              <div className="p-3 bg-white rounded border border-slate-200"><span className="font-bold text-blue-600">Planning:</span> Partial credit</div>
              <div className="p-3 bg-white rounded border border-slate-200"><span className="font-bold text-amber-600">Assessing:</span> Minimal credit</div>
            </div>
          </div>
        </div>
      );
    }
    
    // THANK YOU
    if (s.type === 'thank-you') {
      return (
        <div className="p-12 text-center bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 min-h-[500px] flex flex-col items-center justify-center rounded-xl">
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8"><Image src="/cancer-careers-logo.png" alt="Cancer and Careers" width={180} height={60} /></div>
          <h2 className="text-5xl font-bold text-white mb-4">Thank You</h2>
          <p className="text-2xl text-white/90 mb-8">{companyName}</p>
          <p className="text-lg text-white/80 max-w-2xl">Your commitment to supporting employees through cancer and serious health challenges makes a real difference.</p>
          <div className="mt-10 flex items-center gap-8">
            <div className="text-center"><p className="text-white/60 text-sm">Questions?</p><p className="text-white font-semibold">index@cancerandcareers.org</p></div>
            <div className="w-px h-12 bg-white/30"></div>
            <div className="text-center"><p className="text-white/60 text-sm">Learn More</p><p className="text-white font-semibold">cancerandcareers.org</p></div>
          </div>
        </div>
      );
    }
    
    return <div className="p-8 text-center text-slate-500">Unknown slide type: {s.type}</div>;
  };

  // ============ RENDER ============
  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      <style jsx global>{`
        .pres-slide { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
      
      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center p-6 pb-24 overflow-auto">
        <div className="pres-slide bg-white rounded-2xl shadow-2xl max-w-[1400px] w-full max-h-[calc(100vh-140px)] overflow-auto" key={currentSlide}>
          {renderSlide()}
        </div>
      </div>
      
      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/98 via-slate-900/95 to-transparent pt-8 pb-5 px-8">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <button onClick={() => go(currentSlide - 1)} disabled={currentSlide === 0} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex-1 flex flex-col items-center gap-2">
            <p className="text-white/90 text-sm font-medium">{slide.title}</p>
            <div className="w-full max-w-xs h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300" style={{ width: `${((currentSlide + 1) / total) * 100}%` }} />
            </div>
          </div>
          
          <p className="text-white/60 text-sm min-w-[60px] text-center">{currentSlide + 1} / {total}</p>
          
          <button onClick={() => go(currentSlide + 1)} disabled={currentSlide === total - 1} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          
          <button onClick={onExit} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-red-500/40 transition-all ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
