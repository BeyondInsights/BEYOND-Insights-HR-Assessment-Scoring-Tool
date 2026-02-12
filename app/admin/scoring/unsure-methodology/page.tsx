'use client';

import React, { useState } from 'react';
import Link from 'next/link';

function IconShield() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>); }
function IconTarget() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>); }
function IconChart() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 6-10"/></svg>); }
function IconGrid() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>); }
function IconAlertTriangle() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>); }

const DIMENSION_NAMES: Record<number, string> = {
  1: 'Medical Leave & Flexibility', 2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability', 4: 'Cancer Support Resources',
  5: 'Workplace Accommodations', 6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement', 8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources', 10: 'Caregiver & Family Support',
  11: 'Prevention & Wellness', 12: 'Continuous Improvement',
  13: 'Communication & Awareness',
};

interface Company {
  name: string; status: string; rankEligible: boolean;
  unsurePct: number; maxDimUnsure: number; composite: number;
  flags: string; dims: number[];
}

const COMPANIES: Company[] = [
  { name: 'Merck', status: 'Scored (Confirmed)', rankEligible: true, unsurePct: 4.6, maxDimUnsure: 33.3, composite: 82.6, flags: '-', dims: [81.8, 84.7, 76.0, 89.1, 90.9, 100.0, 61.4, 76.0, 67.3, 80.4, 100.0, 72.5, 93.3] },
  { name: 'Google (Alphabet)', status: 'Scored (Provisional - verify)', rankEligible: false, unsurePct: 15.1, maxDimUnsure: 44.4, composite: 79.2, flags: 'D7 44%', dims: [89.7, 57.1, 79.1, 84.0, 96.5, 96.8, 63.0, 74.3, 62.5, 72.8, 96.7, 92.5, 64.0] },
  { name: 'Publicis', status: 'Scored (Confirmed)', rankEligible: true, unsurePct: 0.0, maxDimUnsure: 0.0, composite: 79.0, flags: '-', dims: [81.8, 90.6, 64.0, 80.0, 76.4, 91.7, 73.3, 95.0, 76.4, 57.9, 72.3, 67.5, 100.0] },
  { name: 'Pfizer', status: 'Scored (Confirmed)', rankEligible: true, unsurePct: 3.3, maxDimUnsure: 12.5, composite: 77.3, flags: '-', dims: [72.7, 81.8, 60.0, 95.1, 72.7, 91.7, 33.3, 83.3, 67.7, 73.7, 92.3, 80.7, 100.0] },
  { name: 'AbbVie', status: 'Scored (Confirmed)', rankEligible: true, unsurePct: 1.3, maxDimUnsure: 15.4, composite: 76.6, flags: '-', dims: [90.9, 63.5, 74.0, 94.0, 85.5, 81.7, 66.7, 65.0, 38.2, 80.0, 84.3, 72.5, 100.0] },
  { name: 'Haymarket', status: 'Scored (Confirmed)', rankEligible: true, unsurePct: 1.3, maxDimUnsure: 11.1, composite: 73.6, flags: '-', dims: [90.9, 61.2, 84.0, 60.0, 90.9, 85.0, 80.3, 82.9, 63.6, 57.9, 63.1, 50.0, 86.7] },
  { name: 'Memorial Sloan Kettering', status: 'Scored (Confirmed)', rankEligible: true, unsurePct: 7.9, maxDimUnsure: 36.4, composite: 72.6, flags: '-', dims: [68.5, 85.4, 68.0, 100.0, 69.1, 83.3, 30.3, 91.7, 38.8, 63.2, 96.7, 65.0, 84.4] },
  { name: 'Marriott International', status: 'Scored (Provisional - verify)', rankEligible: false, unsurePct: 12.5, maxDimUnsure: 45.5, composite: 71.5, flags: 'D9 45%', dims: [76.4, 61.8, 71.0, 95.1, 100.0, 71.8, 69.2, 81.3, 38.2, 41.3, 84.3, 63.2, 76.2] },
  { name: 'Lloyds Bank (Group)', status: 'Scored (Confirmed)', rankEligible: true, unsurePct: 2.0, maxDimUnsure: 20.0, composite: 71.5, flags: '-', dims: [81.8, 44.2, 88.0, 68.0, 90.9, 83.3, 71.1, 95.0, 52.7, 54.7, 67.7, 45.0, 86.7] },
  { name: 'Best Buy', status: 'Scored (Provisional - resolution required)', rankEligible: false, unsurePct: 21.7, maxDimUnsure: 88.9, composite: 70.2, flags: 'D7 88%', dims: [80.7, 63.2, 53.0, 88.0, 90.9, 91.8, 11.7, 70.9, 37.4, 77.0, 78.3, 93.2, 76.7] },
  { name: 'Maven Search Corporation', status: 'Scored (Confirmed)', rankEligible: true, unsurePct: 3.3, maxDimUnsure: 18.2, composite: 66.3, flags: '-', dims: [89.7, 51.6, 60.0, 72.0, 72.7, 58.3, 82.2, 81.7, 54.5, 68.4, 58.5, 52.5, 60.0] },
  { name: 'Stellantis', status: 'Scored (Provisional - verify)', rankEligible: false, unsurePct: 19.1, maxDimUnsure: 50.0, composite: 65.3, flags: 'D3 50%; D7 44%', dims: [68.5, 66.5, 35.8, 39.0, 90.9, 88.5, 29.7, 57.6, 62.3, 43.7, 89.0, 100.0, 77.3] },
  { name: 'Renault Group', status: 'Scored (Confirmed)', rankEligible: true, unsurePct: 13.8, maxDimUnsure: 40.0, composite: 64.4, flags: '-', dims: [53.4, 38.3, 59.0, 75.1, 82.7, 73.3, 55.9, 51.4, 87.3, 23.5, 73.6, 75.0, 88.9] },
  { name: 'Sanofi', status: 'Scored (Provisional - resolution required)', rankEligible: false, unsurePct: 25.0, maxDimUnsure: 52.9, composite: 63.8, flags: 'D2 52%; D4 50%', dims: [82.1, 53.8, 61.1, 47.8, 79.1, 76.7, 52.5, 79.6, 40.4, 72.8, 76.0, 32.5, 75.1] },
  { name: 'Nestlé', status: 'Scored (Provisional - resolution required)', rankEligible: false, unsurePct: 23.0, maxDimUnsure: 52.9, composite: 61.8, flags: 'D2 52%; D7 44%', dims: [74.8, 37.4, 55.1, 43.1, 64.5, 93.3, 49.7, 73.1, 53.1, 48.8, 79.9, 48.2, 81.8] },
  { name: 'Schneider Electric', status: 'Scored (Provisional - verify)', rankEligible: false, unsurePct: 17.8, maxDimUnsure: 46.2, composite: 57.0, flags: 'D11 46%', dims: [35.2, 41.2, 54.0, 51.2, 77.3, 83.5, 49.2, 54.3, 67.7, 40.2, 35.1, 67.5, 84.4] },
  { name: 'Blood Cancer United', status: 'Scored (Provisional - resolution required)', rankEligible: false, unsurePct: 31.6, maxDimUnsure: 100.0, composite: 55.7, flags: 'D6 41%; D7 100%; D8 58%; D9 90%; D12 75%; D13 66%', dims: [89.1, 75.3, 57.0, 96.0, 90.9, 60.0, 0.0, 48.3, 9.5, 71.6, 59.8, 27.8, 38.6] },
  { name: 'Ford Otosan', status: 'Scored (Provisional - verify)', rankEligible: false, unsurePct: 19.1, maxDimUnsure: 44.4, composite: 53.6, flags: 'D2 41%; D7 44%', dims: [63.6, 43.5, 40.0, 25.1, 76.4, 35.0, 45.3, 58.1, 64.1, 51.1, 79.7, 52.5, 62.2] },
  { name: 'Citi', status: 'Scored (Provisional - resolution required)', rankEligible: false, unsurePct: 36.8, maxDimUnsure: 100.0, composite: 51.5, flags: 'D3 60%; D6 50%; D7 100%; D8 83%; D9 90%', dims: [25.8, 64.2, 28.0, 80.0, 82.7, 59.2, 0.0, 18.2, 0.4, 61.6, 84.3, 80.7, 84.0] },
  { name: 'L’Oréal', status: 'Scored (Provisional - resolution required)', rankEligible: false, unsurePct: 15.8, maxDimUnsure: 83.3, composite: 28.3, flags: 'D3 80%; D6 83%; D8 50%', dims: [36.4, 5.9, 22.0, 10.0, 27.3, 18.4, 51.1, 51.6, 27.3, 26.3, 38.5, 20.0, 33.3] },
  { name: 'Inspire Brands', status: 'Scored (Confirmed)', rankEligible: true, unsurePct: 0.0, maxDimUnsure: 0.0, composite: 24.1, flags: '-', dims: [27.3, 35.3, 10.0, 50.0, 63.6, 16.7, 0.0, 25.0, 9.1, 21.1, 30.8, 25.0, 0.0] },
  { name: 'ICBC-AXA Life', status: 'Scored (Insufficient confirmation)', rankEligible: false, unsurePct: 80.9, maxDimUnsure: 100.0, composite: 23.0, flags: 'D1 72%; D2 100%; D3 100%; D4 90%; D5 72%; D6 66%; D7 100%; D8 75%; D9 100%; D10 89%; D11 61%; D12 75%', dims: [30.8, 0.0, 0.0, 10.6, 31.3, 38.8, 0.0, 28.1, 0.0, 11.0, 44.5, 27.8, 76.7] },
];

const BENCHMARKS = [
  { name: '22 Index Adjusted', composite: 62.2, dims: [67.8, 54.8, 54.5, 66.0, 77.4, 71.8, 44.4, 65.6, 46.3, 54.5, 72.0, 59.6, 74.1] },
  { name: 'All 43 Adjusted', composite: 57.9, dims: [61.7, 52.4, 56.4, 57.9, 68.5, 68.3, 45.8, 59.7, 45.6, 49.2, 63.2, 57.6, 66.8] },
];

const DISCOUNT_TABLE = [
  { r: 0.10, label: '10% (1 of 10)', oneMinusR: 0.90, squared: 0.81, perItem: 2.50, total: 2.50, pctMax: 5.0 },
  { r: 0.20, label: '20% (2 of 10)', oneMinusR: 0.80, squared: 0.64, perItem: 1.98, total: 3.95, pctMax: 7.9 },
  { r: 0.33, label: '33% (3 of 10)', oneMinusR: 0.67, squared: 0.45, perItem: 1.39, total: 4.16, pctMax: 8.3 },
  { r: 0.50, label: '50% (5 of 10)', oneMinusR: 0.50, squared: 0.25, perItem: 0.77, total: 3.86, pctMax: 7.7 },
  { r: 0.80, label: '80% (8 of 10)', oneMinusR: 0.20, squared: 0.04, perItem: 0.12, total: 0.99, pctMax: 2.0 },
  { r: 1.00, label: '100% (10 of 10)', oneMinusR: 0.00, squared: 0.00, perItem: 0.00, total: 0.00, pctMax: 0.0 },
];
function getScoreColor(score: number): string {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#0284C7';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

function getStatusStyle(status: string): { bg: string; text: string; border: string } {
  if (status.includes('Confirmed')) return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' };
  if (status.includes('verify')) return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
  if (status.includes('resolution')) return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' };
  return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' };
}

function getUnsureBarColor(pct: number): string {
  if (pct <= 10) return '#059669';
  if (pct <= 25) return '#D97706';
  if (pct <= 50) return '#EA580C';
  return '#DC2626';
}

export default function UnsureMethodologyPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'impact' | 'alternatives'>('overview');

  const confirmedCount = COMPANIES.filter(c => c.status.includes('Confirmed')).length;
  const verifyCount = COMPANIES.filter(c => c.status.includes('verify')).length;
  const resolutionCount = COMPANIES.filter(c => c.status.includes('resolution')).length;
  const excludedCount = COMPANIES.filter(c => c.status.includes('Insufficient')).length;

  const tabs = [
    { key: 'overview' as const, label: 'Executive Overview', icon: <IconTarget /> },
    { key: 'technical' as const, label: 'Technical Methodology', icon: <IconChart /> },
    { key: 'impact' as const, label: 'Company Impact', icon: <IconGrid /> },
    { key: 'alternatives' as const, label: 'Alternatives Explored', icon: <IconAlertTriangle /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-white rounded-lg px-3 py-2"><img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-9" /></div>
              <div className="border-l border-slate-700 pl-6">
                <h1 className="text-lg font-semibold text-white">Unsure Response Handling</h1>
                <p className="text-sm text-slate-400">Best Companies for Working with Cancer Index &mdash; 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/scoring" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Scoring</Link>
              <Link href="/admin" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.key ? 'border-violet-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}>
                <span className={activeTab === tab.key ? 'text-violet-600' : 'text-slate-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`mx-auto py-8 ${activeTab === 'impact' ? 'max-w-[1600px] px-4' : 'max-w-[1400px] px-8'}`}>

        {/* ===== TAB 1: EXECUTIVE OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Executive Overview</h2>
              <p className="text-slate-600 text-sm">How the Index handles &ldquo;Unsure&rdquo; survey responses fairly and transparently</p>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { v: confirmedCount.toString(), l: 'Confirmed', d: 'Score is final, rank-eligible', color: 'from-emerald-700 to-emerald-800' },
                { v: verifyCount.toString(), l: 'Provisional \u2014 Verify', d: 'Specific dimensions to confirm', color: 'from-amber-600 to-amber-700' },
                { v: resolutionCount.toString(), l: 'Provisional \u2014 Resolve', d: 'Action items before ranking', color: 'from-orange-600 to-orange-700' },
                { v: excludedCount.toString(), l: 'Excluded from Ranking', d: 'Insufficient confirmed data', color: 'from-red-600 to-red-700' },
              ].map((card, i) => (
                <div key={i} className={`bg-gradient-to-br ${card.color} rounded-xl p-5 text-white shadow-sm`}>
                  <div className="text-3xl font-bold mb-1">{card.v}</div>
                  <div className="text-sm font-semibold opacity-95">{card.l}</div>
                  <div className="text-xs opacity-75 mt-1">{card.d}</div>
                </div>
              ))}
            </div>

            {/* The Challenge */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><IconShield /></span>
                <h3 className="font-bold text-slate-900 text-lg">The Challenge</h3>
              </div>
              <p className="text-slate-700 leading-relaxed mb-4">The Index survey asks HR leaders about 152 workplace support programs across 13 dimensions. For each program, respondents indicate whether their organization currently offers it, is planning or assessing it, does not offer it, or is unsure. &ldquo;Unsure&rdquo; is an honest and valuable response &mdash; it tells us the respondent does not have visibility into that particular program.</p>
              <p className="text-slate-700 leading-relaxed">The question: how should we treat these responses when calculating a company&apos;s score?</p>
            </section>

            {/* Why Simple Approaches Fail */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><IconAlertTriangle /></span>
                <h3 className="font-bold text-slate-900 text-lg">Why Simple Approaches Fail</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-56">If We&hellip;</th>
                      <th className="px-6 py-3 text-left font-semibold">The Problem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Score &ldquo;Unsure&rdquo; as zero</td><td className="px-6 py-4 text-slate-700">We punish honesty. A respondent who admits uncertainty is treated the same as one who confirms the program does not exist.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Ignore &ldquo;Unsure&rdquo; entirely</td><td className="px-6 py-4 text-slate-700">We reward ignorance. A company confirming 2 of 10 programs and saying &ldquo;Unsure&rdquo; on the rest could score 100%.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Give &ldquo;Unsure&rdquo; full credit</td><td className="px-6 py-4 text-slate-700">We fabricate data. Assuming unknown programs exist at the same rate as known ones inflates scores and compresses differences.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Our Approach - 5 steps */}
            <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg overflow-hidden text-white p-8">
              <h3 className="font-bold text-xl mb-5">Our Approach</h3>
              <p className="text-slate-200 leading-relaxed mb-6">We give each &ldquo;Unsure&rdquo; response a small amount of partial credit, calibrated to what other companies actually scored on that type of program, and how many unknowns the company has in that area.</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { step: '1', text: 'Start with the population average for that dimension \u2014 our best estimate of a typical program.' },
                  { step: '2', text: 'Use that average as a starting point for partial credit. Higher adoption areas get slightly more credit.' },
                  { step: '3', text: 'Discount that credit based on how many \u201cUnsure\u201d responses in that dimension.' },
                  { step: '4', text: 'The discount accelerates as unknowns accumulate \u2014 the more you don\u2019t know, the less we assume.' },
                  { step: '5', text: 'Cap total credit from \u201cUnsure\u201d at 10% of the dimension maximum. A structural guardrail.' },
                ].map((s) => (
                  <div key={s.step} className="bg-white/10 rounded-lg p-4 border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-violet-500 text-white text-sm font-bold flex items-center justify-center mb-3">{s.step}</div>
                    <p className="text-sm text-slate-200 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* What This Means In Practice */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">What This Means in Practice</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-72">Scenario</th>
                      <th className="px-6 py-3 text-left font-semibold">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Zero &ldquo;Unsure&rdquo; responses</td><td className="px-6 py-4 text-slate-700">Score reflects confirmed answers only. No adjustment needed.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">1&ndash;2 unknowns in a dimension</td><td className="px-6 py-4 text-slate-700">Receives nearly full benefit of the doubt. Minimal impact. A few gaps are normal.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Half a dimension unknown</td><td className="px-6 py-4 text-slate-700">Credit significantly reduced. Some partial credit, but score reflects substantial gaps.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Most of a dimension unknown</td><td className="px-6 py-4 text-slate-700">Credit approaches zero. Score reflects only what was confirmed.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">100% &ldquo;Unsure&rdquo; in a dimension</td><td className="px-6 py-4 text-slate-700">Receives zero credit. Identical to confirming nothing is offered.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Key Principles */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Key Principles</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-56">Principle</th>
                      <th className="px-6 py-3 text-left font-semibold">How We Honor It</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Everyone gets a score</td><td className="px-6 py-4 text-slate-700">No company is excluded from scoring. Only ICBC-AXA Life is excluded from ranking due to 81% unsure rate.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Honesty is not punished</td><td className="px-6 py-4 text-slate-700">Saying &ldquo;Unsure&rdquo; is always better than saying &ldquo;Not Offered&rdquo; if the company genuinely does not know.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Ignorance is not rewarded</td><td className="px-6 py-4 text-slate-700">Credit drops sharply as unsures accumulate. Companies cannot benefit from leaving large portions unresolved.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Every number is traceable</td><td className="px-6 py-4 text-slate-700">Population averages, discount rates, and cap are all derived from or directly observable in the dataset.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">Company and benchmark treated identically</td><td className="px-6 py-4 text-slate-700">Same methodology applied to individual scores and benchmarks. Always apples-to-apples.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ===== TAB 2: TECHNICAL METHODOLOGY ===== */}
        {activeTab === 'technical' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Technical Methodology</h2>
              <p className="text-slate-600 text-sm">Discounted Expected-Value Substitution with (1&minus;r)&sup2; decay and 10% structural cap</p>
            </div>

            {/* Formula */}
            <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg overflow-hidden text-white p-8">
              <h3 className="font-bold text-xl mb-6">The Formula</h3>
              <div className="space-y-5">
                <div className="bg-white/10 rounded-lg p-5 border border-white/10">
                  <p className="text-sm text-slate-300 mb-2 font-medium">Per-unsure credit:</p>
                  <p className="text-xl font-mono font-bold">v<sub>d</sub> = &mu;<sub>d</sub> &times; (1 &minus; r<sub>d</sub>)&sup2;</p>
                </div>
                <div className="bg-white/10 rounded-lg p-5 border border-white/10">
                  <p className="text-sm text-slate-300 mb-2 font-medium">Total unsure contribution:</p>
                  <p className="text-xl font-mono font-bold">V<sub>d</sub> = min( U<sub>d</sub> &times; v<sub>d</sub> , 0.10 &times; MaxPts<sub>d</sub> )</p>
                </div>
                <div className="bg-white/10 rounded-lg p-5 border border-white/10">
                  <p className="text-sm text-slate-300 mb-2 font-medium">Dimension score:</p>
                  <p className="text-xl font-mono font-bold">Score<sub>d</sub> = (ConfirmedPts + V<sub>d</sub>) / MaxPts<sub>d</sub> &times; 100</p>
                </div>
              </div>
            </section>

            {/* Variable Definitions */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Variable Definitions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-40">Variable</th>
                      <th className="px-6 py-3 text-left font-semibold">Definition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-bold text-slate-900">&mu;<sub>d</sub></td><td className="px-6 py-3 text-slate-700">Per-dimension population mean score (out of 5), from confirmed responses across all 43 companies (22 Index + 21 HR panel). Each dimension has its own mean.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-bold text-slate-900">r<sub>d</sub></td><td className="px-6 py-3 text-slate-700">Company&apos;s unsure rate in dimension d. (Unsure elements) / (total elements). Ranges 0 to 1.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-bold text-slate-900">U<sub>d</sub></td><td className="px-6 py-3 text-slate-700">Number of unsure elements in dimension d for this company.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-bold text-slate-900">v<sub>d</sub></td><td className="px-6 py-3 text-slate-700">Substituted credit per unsure element. Starts at population mean, declines quadratically as r<sub>d</sub> increases.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-bold text-slate-900">V<sub>d</sub></td><td className="px-6 py-3 text-slate-700">Total unsure contribution for dimension d, subject to the 10% cap.</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-bold text-slate-900">MaxPts<sub>d</sub></td><td className="px-6 py-3 text-slate-700">Maximum possible points in dimension d (number of elements &times; 5).</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-bold text-slate-900">ConfirmedPts</td><td className="px-6 py-3 text-slate-700">Points from confirmed responses (Currently Offer = 5, Planning = 3, Assessing = 2, Not Offered = 0).</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Why squared */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center"><IconChart /></span>
                <h3 className="font-bold text-slate-900 text-lg">Why (1 &minus; r)&sup2; Instead of (1 &minus; r)</h3>
              </div>
              <p className="text-slate-700 leading-relaxed mb-5">An earlier iteration used a linear discount: v<sub>d</sub> = &mu;<sub>d</sub> &times; (1 &minus; r<sub>d</sub>). This produced a &ldquo;hump problem&rdquo; where the total unsure contribution peaked at r = 50%, meaning a company with half its elements unsure could receive more unsure credit than one with only a few unsures. The squared term fixes this: the total contribution peaks at approximately r = 33% at only 8.9% of the dimension maximum, naturally falling below the 10% cap.</p>
            </section>

            {/* Discount Schedule */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Discount Schedule</h3>
                <p className="text-slate-500 text-sm mt-1">Using &mu;<sub>d</sub> = 3.09 (global average) for illustration. Actual values are per-dimension.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-semibold">Unsure Rate</th>
                      <th className="px-5 py-3 text-center font-semibold">(1&minus;r)</th>
                      <th className="px-5 py-3 text-center font-semibold">(1&minus;r)&sup2;</th>
                      <th className="px-5 py-3 text-center font-semibold">Per-Item Credit</th>
                      <th className="px-5 py-3 text-center font-semibold">Total Contrib</th>
                      <th className="px-5 py-3 text-center font-semibold">% of Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DISCOUNT_TABLE.map((row) => (
                      <tr key={row.label} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{row.label}</td>
                        <td className="px-5 py-3 text-center font-mono text-slate-700">{row.oneMinusR.toFixed(2)}</td>
                        <td className="px-5 py-3 text-center font-mono font-bold text-slate-900">{row.squared.toFixed(2)}</td>
                        <td className="px-5 py-3 text-center font-mono text-slate-700">{row.perItem.toFixed(2)}</td>
                        <td className="px-5 py-3 text-center font-mono text-slate-700">{row.total.toFixed(2)}</td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-violet-500" style={{ width: `${row.pctMax * 10}%` }} />
                            </div>
                            <span className="font-mono font-bold text-slate-800 w-12 text-right">{row.pctMax.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Worked Example */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><IconShield /></span>
                <h3 className="font-bold text-slate-900 text-lg">Worked Example: Company X, Dimension 3</h3>
              </div>
              <p className="text-slate-600 mb-5">10 elements. Company confirms 7, says &ldquo;Unsure&rdquo; on 3.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-56">Step</th>
                      <th className="px-6 py-3 text-left font-semibold">Calculation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="px-6 py-3 font-semibold text-slate-800">Confirmed points</td><td className="px-6 py-3 text-slate-700 font-mono">4 Offer (20) + 2 Planning (6) + 1 Not Offered (0) = 26 pts</td></tr>
                    <tr><td className="px-6 py-3 font-semibold text-slate-800">Maximum points</td><td className="px-6 py-3 text-slate-700 font-mono">10 &times; 5 = 50 pts</td></tr>
                    <tr><td className="px-6 py-3 font-semibold text-slate-800">Unsure rate (r<sub>d</sub>)</td><td className="px-6 py-3 text-slate-700 font-mono">3 / 10 = 0.30</td></tr>
                    <tr><td className="px-6 py-3 font-semibold text-slate-800">Population mean (&mu;<sub>d</sub>)</td><td className="px-6 py-3 text-slate-700 font-mono">3.12 (D3 average across 43 companies)</td></tr>
                    <tr><td className="px-6 py-3 font-semibold text-slate-800">Per-unsure credit (v<sub>d</sub>)</td><td className="px-6 py-3 text-slate-700 font-mono">3.12 &times; (1 &minus; 0.30)&sup2; = 3.12 &times; 0.49 = 1.53 pts</td></tr>
                    <tr><td className="px-6 py-3 font-semibold text-slate-800">Total unsure contribution</td><td className="px-6 py-3 text-slate-700 font-mono">3 &times; 1.53 = 4.59 pts</td></tr>
                    <tr><td className="px-6 py-3 font-semibold text-slate-800">10% cap check</td><td className="px-6 py-3 text-slate-700 font-mono">10% &times; 50 = 5.0 pts. 4.59 &lt; 5.0 &rarr; no cap</td></tr>
                    <tr className="bg-emerald-50"><td className="px-6 py-3 font-bold text-emerald-800">Final dimension score</td><td className="px-6 py-3 font-bold text-emerald-800 font-mono">(26 + 4.59) / 50 &times; 100 = 61.2%</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600"><strong className="text-slate-800">Compare:</strong> Unsure = 0 in denominator: 26/50 = 52.0%. Pure exclusion: 26/35 = 74.3%. Discounted substitution: 61.2%.</p>
              </div>
            </section>

            {/* Pipeline */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Integration with Full Scoring Pipeline</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-center font-semibold w-20">Stage</th>
                      <th className="px-5 py-3 text-left font-semibold w-56">Step</th>
                      <th className="px-5 py-3 text-left font-semibold">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-violet-50"><td className="px-5 py-3 text-center font-bold text-violet-800">1</td><td className="px-5 py-3 font-bold text-violet-800">Element scoring + unsure handling</td><td className="px-5 py-3 text-slate-700">Score confirmed elements (5/3/2/0). Apply (1&minus;r)&sup2; substitution for unsures with 10% cap.</td></tr>
                    <tr><td className="px-5 py-3 text-center font-bold text-slate-700">2</td><td className="px-5 py-3 font-semibold text-slate-800">Geographic multiplier</td><td className="px-5 py-3 text-slate-700">Applied based on multi-country response (&times;1.0, &times;0.90, or &times;0.75).</td></tr>
                    <tr><td className="px-5 py-3 text-center font-bold text-slate-700">3</td><td className="px-5 py-3 font-semibold text-slate-800">Follow-up blending</td><td className="px-5 py-3 text-slate-700">D1, D3, D12, D13: blend 85% grid + 15% follow-up score.</td></tr>
                    <tr><td className="px-5 py-3 text-center font-bold text-slate-700">4</td><td className="px-5 py-3 font-semibold text-slate-800">Element weighting</td><td className="px-5 py-3 text-slate-700">Within-dimension element weights (ridge + bootstrap + adaptive shrinkage).</td></tr>
                    <tr><td className="px-5 py-3 text-center font-bold text-slate-700">5</td><td className="px-5 py-3 font-semibold text-slate-800">Dimension weighting</td><td className="px-5 py-3 text-slate-700">Apply dimension weights to produce weighted dimension score.</td></tr>
                    <tr><td className="px-5 py-3 text-center font-bold text-slate-700">6</td><td className="px-5 py-3 font-semibold text-slate-800">Composite</td><td className="px-5 py-3 text-slate-700">90% Weighted Dimensions + 5% Maturity + 5% Breadth.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Status Criteria */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Score Status and Rank Eligibility</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-semibold w-64">Status</th>
                      <th className="px-5 py-3 text-left font-semibold">Criteria</th>
                      <th className="px-5 py-3 text-left font-semibold w-48">Rank Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50"><td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Scored (Confirmed)</span></td><td className="px-5 py-3 text-slate-700">Overall unsure &le; 25% AND max dimension &le; 40%</td><td className="px-5 py-3 text-emerald-700 font-semibold">Eligible</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Provisional &mdash; Verify</span></td><td className="px-5 py-3 text-slate-700">Overall unsure &le; 25% AND max dim 40&ndash;50%</td><td className="px-5 py-3 text-amber-700 font-semibold">Pending verification</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">Provisional &mdash; Resolution</span></td><td className="px-5 py-3 text-slate-700">Overall &le; 25% AND max dim &gt; 50% OR overall &gt; 25%</td><td className="px-5 py-3 text-orange-700 font-semibold">Pending resolution</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">Excluded from Ranking</span></td><td className="px-5 py-3 text-slate-700">Overall &gt; 50% OR max dimension = 100%</td><td className="px-5 py-3 text-red-700 font-semibold">Excluded</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ===== TAB 3: COMPANY IMPACT ===== */}
        {activeTab === 'impact' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Company Impact</h2>
              <p className="text-slate-600 text-sm">All 22 Index participants with unsure-adjusted composite and dimension scores</p>
            </div>

            {/* Company Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ tableLayout: 'auto' }}>
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="sticky left-0 z-20 bg-slate-800 px-4 py-3 text-left font-bold text-sm border-r border-slate-700 min-w-[180px]">Company</th>
                      <th className="px-3 py-3 text-center font-bold text-sm min-w-[70px]">Status</th>
                      <th className="px-3 py-3 text-center font-bold text-sm min-w-[90px]">Unsure %</th>
                      <th className="px-3 py-3 text-center font-bold text-sm min-w-[70px]">Max Dim</th>
                      <th className="px-3 py-3 text-center font-bold text-sm bg-slate-700 border-x border-slate-600 min-w-[80px]">Composite</th>
                      {Array.from({ length: 13 }, (_, i) => (
                        <th key={i} className={`px-2 py-3 text-center font-semibold text-xs min-w-[55px] ${i % 2 === 0 ? 'bg-slate-700' : 'bg-slate-800'}`}>
                          D{i + 1}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-left font-bold text-sm min-w-[120px]">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {BENCHMARKS.map((b) => (
                      <tr key={b.name} className="bg-slate-100 border-b-2 border-slate-300">
                        <td className="sticky left-0 z-10 bg-slate-100 px-4 py-2.5 font-bold text-slate-700 text-sm border-r border-slate-200">{b.name}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-slate-500">&mdash;</td>
                        <td className="px-3 py-2.5 text-center text-xs text-slate-500">&mdash;</td>
                        <td className="px-3 py-2.5 text-center text-xs text-slate-500">&mdash;</td>
                        <td className="px-3 py-2.5 text-center font-bold text-sm border-x border-slate-200" style={{ color: getScoreColor(b.composite) }}>{b.composite}</td>
                        {b.dims.map((d, i) => (
                          <td key={i} className="px-2 py-2.5 text-center text-sm font-medium" style={{ color: getScoreColor(d) }}>{d.toFixed(0)}</td>
                        ))}
                        <td className="px-3 py-2.5 text-xs text-slate-400">&mdash;</td>
                      </tr>
                    ))}
                    {COMPANIES.map((c, idx) => {
                      const style = getStatusStyle(c.status);
                      return (
                        <tr key={c.name} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-violet-50/30`}>
                          <td className={`sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} px-4 py-2.5 font-semibold text-slate-800 text-sm border-r border-slate-100`}>{c.name}</td>
                          <td className="px-2 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text} border ${style.border}`}>
                              {c.status.includes('Confirmed') ? 'Confirmed' : c.status.includes('verify') ? 'Verify' : c.status.includes('resolution') ? 'Resolve' : 'Excluded'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-12 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(c.unsurePct, 100)}%`, backgroundColor: getUnsureBarColor(c.unsurePct) }} />
                              </div>
                              <span className="text-sm font-medium text-slate-700 w-10 text-right">{c.unsurePct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center text-sm font-medium" style={{ color: c.maxDimUnsure > 50 ? '#DC2626' : c.maxDimUnsure > 25 ? '#D97706' : '#059669' }}>{c.maxDimUnsure.toFixed(0)}%</td>
                          <td className="px-3 py-2.5 text-center font-bold text-sm border-x border-slate-100" style={{ color: getScoreColor(c.composite) }}>{c.composite}</td>
                          {c.dims.map((d, i) => (
                            <td key={i} className="px-2 py-2.5 text-center text-sm" style={{ color: getScoreColor(d) }}>{d.toFixed(0)}</td>
                          ))}
                          <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[200px]">{c.flags === '-' ? '' : c.flags}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dimension Flag Thresholds */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Dimension-Level Flag Thresholds</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-semibold">Dimension Unsure Rate</th>
                      <th className="px-5 py-3 text-center font-semibold">Flag Level</th>
                      <th className="px-5 py-3 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="px-5 py-3 text-slate-700">&le; 25%</td><td className="px-5 py-3 text-center text-emerald-700 font-semibold">No flag</td><td className="px-5 py-3 text-slate-700">Dimension scored normally.</td></tr>
                    <tr><td className="px-5 py-3 text-slate-700">&gt; 25&ndash;40%</td><td className="px-5 py-3 text-center text-amber-700 font-semibold">&#9888; NOTE</td><td className="px-5 py-3 text-slate-700">Noted in company report. No immediate action required.</td></tr>
                    <tr><td className="px-5 py-3 text-slate-700">&gt; 40&ndash;50%</td><td className="px-5 py-3 text-center text-orange-700 font-semibold">&#9888;&#9888; ELEVATED</td><td className="px-5 py-3 text-slate-700">Company contacted for verification of this dimension.</td></tr>
                    <tr><td className="px-5 py-3 text-slate-700">&gt; 50%</td><td className="px-5 py-3 text-center text-red-700 font-semibold">&#9940; HIGH</td><td className="px-5 py-3 text-slate-700">Company contacted. Resolution required for badge eligibility.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ===== TAB 4: ALTERNATIVES EXPLORED ===== */}
        {activeTab === 'alternatives' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Alternatives Explored and Rejected</h2>
              <p className="text-slate-600 text-sm">Nine approaches were tested during development and stress-tested against the full dataset of 43 organizations</p>
            </div>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-72">Approach Tested</th>
                      <th className="px-6 py-3 text-left font-semibold">Why We Moved On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { approach: 'Unsure = 0, in denominator', reason: 'Treats \u201cI don\u2019t know\u201d identically to \u201cwe don\u2019t offer this.\u201d Penalizes honest uncertainty and discourages use of the Unsure option.' },
                      { approach: 'Positive point value (e.g., 1pt)', reason: 'Creates a perverse incentive: saying \u201cUnsure\u201d scores better than confirming \u201cNot Offered\u201d (0pts).' },
                      { approach: 'Negative point value (e.g., \u22121pt)', reason: 'Even one unsure penalizes the company worse than confirming absence. Contradicts the benefit-of-the-doubt principle.' },
                      { approach: 'Pure mean substitution', reason: 'Replaces each unsure with the population average regardless of unsure concentration. Fabricates data and compresses variance.' },
                      { approach: 'Statistical imputation (multiple)', reason: 'Unstable at n = 43. Difficult to explain at executive and advisory committee venues. Hard to defend model assumptions.' },
                      { approach: 'Exclude from denominator, no penalty', reason: 'Too generous. A company confirming 1 of 10 elements at \u201cCurrently Offer\u201d would score 100%. Not credible.' },
                      { approach: 'Flat per-unsure penalty (2.5pp or 3.5pp)', reason: 'The base penalty could not be cleanly derived from the data. Under peer review, \u201cWhy 3.5?\u201d has no satisfying answer.' },
                      { approach: 'Sliding penalty (3.5 + r \u00d7 5.0 pp)', reason: 'Improved on flat penalty but still relied on arbitrary constants. Produced implausible scores at certain unsure concentrations.' },
                      { approach: 'Linear discount: \u03bc\u1d48 \u00d7 (1\u2212r)', reason: 'Produced a \u201chump\u201d at r = 50% where total unsure credit peaked. Companies with 50% unsure received more credit than companies with 25% unsure.' },
                    ].map((item, i) => (
                      <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-red-50/30`}>
                        <td className="px-6 py-4 font-semibold text-slate-800">{item.approach}</td>
                        <td className="px-6 py-4 text-slate-700">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Why our approach won */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><IconShield /></span>
                <h3 className="font-bold text-slate-900 text-lg">Why the Final Approach Was Selected</h3>
              </div>
              <p className="text-slate-700 leading-relaxed mb-4">The final approach was selected because every number in the calculation traces directly to the data. The population averages come from confirmed responses across all participants. The discount rate is simply the proportion of unknowns. There are no arbitrary constants to defend.</p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <p className="font-bold text-emerald-800 mb-1">Data-grounded</p>
                  <p className="text-sm text-emerald-700">Population averages and discount rates come directly from the dataset. No arbitrary constants.</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <p className="font-bold text-emerald-800 mb-1">Explainable</p>
                  <p className="text-sm text-emerald-700">Every step can be explained in plain language to non-technical audiences and advisory committees.</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <p className="font-bold text-emerald-800 mb-1">Scales naturally</p>
                  <p className="text-sm text-emerald-700">As participation grows in future years, population averages become more robust without structural changes.</p>
                </div>
              </div>
            </section>

            {/* Disclosure Language */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><IconAlertTriangle /></span>
                <h3 className="font-bold text-slate-900 text-lg">Disclosure Language</h3>
              </div>
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 mb-5">
                <p className="text-sm text-slate-800 font-medium"><strong>Approved language:</strong> &ldquo;Unsure items receive discounted partial credit using a squared discount function calibrated to the dimension population mean, capped at 10% of the dimension maximum. Provisional scores require verification before final ranking.&rdquo;</p>
              </div>
              <div className="bg-red-50 rounded-lg p-5 border border-red-200">
                <p className="text-sm text-red-800 font-medium"><strong>Do NOT use:</strong> &ldquo;Incentive compatible,&rdquo; &ldquo;no advantage to selecting Unsure,&rdquo; or similar claims. The methodology gives modest partial credit for unsure responses, which means there is a small advantage to saying Unsure over confirming Not Offered. This is a deliberate design choice to encourage honesty, not a claim of incentive neutrality.</p>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  );
}
