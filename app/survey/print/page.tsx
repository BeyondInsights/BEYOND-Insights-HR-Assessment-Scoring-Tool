/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import {
  BRAND, DIM_COLORS,
  FIRMOGRAPHICS, GENERAL_BENEFITS, CURRENT_SUPPORT,
  DIMENSIONS, CROSS_DIM, EI
} from '../schema';

/* Small custom SVGs */
const Dot = ({ c='#CBD5E1' }: { c?: string }) => (<svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill={c}/></svg>);
const Bar = ({ c=BRAND.orange }: { c?: string }) => (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v3H4zM4 11h16v3H4zM4 16h16v3H4z" fill={c}/></svg>);

type Q = (typeof FIRMOGRAPHICS)['questions'][number];

const Badge = ({ children, tone='req' }: { children: React.ReactNode; tone?: 'req'|'cond' }) => (
  <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
        style={{ color: tone==='req'?'#7F1D1D':'#1E3A8A', backgroundColor: tone==='req'?'#FEE2E2':'#DBEAFE', border:`1px solid ${tone==='req'?'#FCA5A5':'#93C5FD'}` }}>
    {tone==='req' ? 'Required' : 'Conditional'}
  </span>
);

function QItem({ q }: { q: Q }) {
  return (
    <div className="mb-3">
      <div className="text-[15px] font-medium text-slate-900">
        {q.label}
        {q.required && <Badge>Required</Badge>}
        {q.conditional && <Badge tone="cond">{q.conditional}</Badge>}
      </div>
      <div className="text-[13px] text-slate-600 mt-0.5">
        {q.type==='text'   && <>Free text</>}
        {q.type==='single' && <>Select one{q.options?.length ? <>: {q.options.join(' • ')}</> : null}</>}
        {q.type==='multi'  && <>Select all that apply{q.options?.length ? <>: {q.options.join(' • ')}</> : null}</>}
        {q.type==='scale'  && <>Scale: {q.options?.join(' → ')}</>}
        {q.note && <div className="mt-0.5 italic text-slate-500">{q.note}</div>}
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
      <div className="p-4 rounded border bg-white" style={{ borderColor: BRAND.gray[200] }}>{children}</div>
    </section>
  );
}

export default function SurveyPrint() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' });

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="flex items-center gap-3">
          <img src="/best-companies-2026-logo.png" alt="" className="h-20 w-auto" />
          <div className="h-8 w-px bg-slate-200" />
          <img src="/cancer-careers-logo.png" alt="" className="h-14 w-auto" />
        </div>
        <button onClick={() => window.print()} className="px-3 py-1.5 rounded text-white text-sm" style={{ backgroundColor: BRAND.primary }}>
          Print / Save PDF
        </button>
      </div>

      <h1 className="text-2xl font-black text-slate-900">CAC Employer Index — Full Survey (Read-Only)</h1>
      <p className="text-sm text-slate-600">Review all questions and gather information before starting. This page is read-only and can be printed or saved as PDF.</p>

      {/* What you'll need */}
      <div className="mt-4 p-4 rounded border bg-white" style={{ borderColor: BRAND.gray[200] }}>
        <div className="flex items-center gap-2 mb-2"><Bar /><div className="text-sm font-bold text-slate-800">What you’ll want handy</div></div>
        <ul className="text-[13px] text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-y-1">
          <li className="flex items-center gap-2"><Dot/><span>SPDs / benefits plan summaries</span></li>
          <li className="flex items-center gap-2"><Dot/><span>Leave / RTW details (weeks, eligibility, job protection)</span></li>
          <li className="flex items-center gap-2"><Dot/><span>Disability %, advanced therapy coverage, caregiver benefits</span></li>
          <li className="flex items-center gap-2"><Dot/><span>Navigation vendor names & program lists</span></li>
          <li className="flex items-center gap-2"><Dot/><span>Global/market differences (if any)</span></li>
          <li className="flex items-center gap-2"><Dot/><span>Contacts for manager training & culture initiatives</span></li>
        </ul>
      </div>

      {/* Contents */}
      <div className="mt-4 p-4 rounded border bg-white print:hidden" style={{ borderColor: BRAND.gray[200] }}>
        <div className="text-sm font-bold text-slate-800 mb-2">Contents</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[13px]">
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo('firmographics')}>1. Company Profile</button>
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo('general_benefits')}>2. General Benefits</button>
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo('current_support')}>3. Current Support for EMCs</button>
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo('dimensions')}>4. 13 Dimensions of Support</button>
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo('cross_dim')}>5. Cross-Dim Assessment</button>
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo('ei')}>6. Employee Impact</button>
        </div>
      </div>

      {/* Sections */}
      <Section id={FIRMOGRAPHICS.id} title={FIRMOGRAPHICS.title}>
        {FIRMOGRAPHICS.questions.map(q => <QItem key={q.id} q={q} />)}
      </Section>

      <Section id={GENERAL_BENEFITS.id} title={GENERAL_BENEFITS.title}>
        {GENERAL_BENEFITS.questions.map(q => <QItem key={q.id} q={q} />)}
      </Section>

      <Section id={CURRENT_SUPPORT.id} title={CURRENT_SUPPORT.title}>
        {CURRENT_SUPPORT.questions.map(q => <QItem key={q.id} q={q} />)}
      </Section>

      {/* 13 Dimensions — list options ONCE + scale legend (no per-bucket repetition) */}
      <section id="dimensions" className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-2">13 Dimensions of Support</h2>

        {DIMENSIONS.map((d, idx) => {
          const color = DIM_COLORS[idx % DIM_COLORS.length] ?? '#6B7280';
          return (
            <div key={d.number} className="mb-6 p-4 rounded border bg-white" style={{ borderColor: BRAND.gray[200] }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: color }}>
                  {d.number}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{d.title}</h3>
              </div>

              {/* Official wording + description */}
              <div className="text-[13px] text-slate-700 mb-2">{d.intro}</div>
              <div className="text-[13px] text-slate-900 font-medium mb-2">{d.questionText}</div>

              {/* Scale legend (once) */}
              <div className="text-[12px] text-slate-600 mb-3">
                <span className="font-semibold">Scale:&nbsp;</span>{d.scale.join('  •  ')}
              </div>

              {/* Single list of options (no bucket repetition) */}
              <div className="rounded border p-3 mb-3 bg-white" style={{ borderColor: BRAND.gray[200] }}>
                <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[600] }}>
                  Support options to be rated on the scale above
                </div>
                <ul className="text-[13px] text-slate-800 space-y-1">
                  {d.supportOptions.map(p => (
                    <li key={p} className="flex items-center gap-2"><Dot/><span>{p}</span></li>
                  ))}
                </ul>
              </div>

              {/* Follow-ups */}
              {d.followUps.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-slate-800 mb-1">Follow-up questions</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                    {d.followUps.map(f => (
                      <div key={f.id} className="mb-3">
                        <div className="text-[15px] font-medium text-slate-900">{f.label}</div>
                        <div className="text-[13px] text-slate-600 mt-0.5">
                          {f.type==='text'   && <>Free text</>}
                          {f.type==='single' && <>Select one{f.options?.length ? <>: {f.options.join(' • ')}</> : null}</>}
                          {f.type==='multi'  && <>Select all that apply{f.options?.length ? <>: {f.options.join(' • ')}</> : null}</>}
                          {f.type==='scale'  && <>Scale: {f.options?.join(' → ')}</>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Cross-Dim: three buckets side-by-side */}
      <Section id={CROSS_DIM.id} title={CROSS_DIM.title}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded border p-4" style={{ borderColor: BRAND.gray[200] }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.gray[600] }}>Top 3 Dimensions</div>
            <div className="text-[13px] text-slate-600">Select up to three.</div>
          </div>
          <div className="rounded border p-4" style={{ borderColor: BRAND.gray[200] }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.gray[600] }}>Bottom 3 Dimensions</div>
            <div className="text-[13px] text-slate-600">Select up to three.</div>
          </div>
          <div className="rounded border p-4" style={{ borderColor: BRAND.gray[200] }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.gray[600] }}>Implementation Challenges</div>
            <ul className="text-[13px] text-slate-700 space-y-1">
              {(CROSS_DIM.questions.find(q=>q.id==='cd2')?.options || []).map(opt => (
                <li key={opt} className="flex items-center gap-2"><Dot/><span>{opt}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* EI — complete and always present */}
      <Section id={EI.id} title={EI.title}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
          {EI.questions.map(q => <QItem key={q.id} q={q} />)}
        </div>
      </Section>

      {/* Print CSS */}
      <style jsx>{`
        :global(html), :global(body) { font-size: 16px; }
        @media print {
          @page { size: letter; margin: 0.5in; }
          .print\\:hidden, button { display: none !important; }
          nav, header, footer { display: none !important; }
          section, .rounded, .row { break-inside: avoid; }
          h1 { font-size: 18px !important; }
          h2 { font-size: 16px !important; }
          h3 { font-size: 14px !important; }
          main { padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </main>
  );
}
