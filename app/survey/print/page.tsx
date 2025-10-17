'use client';

import React from 'react';

/* ========= Brand ========= */
const BRAND = {
  primary: '#6B2C91',
  orange: '#EA580C',
  gray: { 900:'#0F172A', 700:'#334155', 600:'#475569', 500:'#64748B', 400:'#94A3B8', 300:'#CBD5E1', 200:'#E5E7EB', 100:'#F3F4F6'}
};

/* ========= Tiny SVGs (no emojis) ========= */
const Dot = ({ c='#CBD5E1' }: { c?: string }) => (
  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill={c}/></svg>
);

const SectionIcon = ({ c=BRAND.orange }: { c?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 5h16v3H4zM4 10h16v3H4zM4 15h16v3H4z" fill={c}/>
  </svg>
);

/* ========= Survey Spec (edit labels here, UI renders below) ========= */
/* Keep this centralized so the wording stays 1:1 with the live survey. */
type Q = { id: string; label: string; required?: boolean; conditional?: string; type: 'single'|'multi'|'text'|'scale'|'matrix'|'date'|'upload'; options?: string[]; note?: string };
type Section = { id: string; title: string; questions: Q[] };

const Firmographics: Section = {
  id: 'firmographics',
  title: 'Company Profile',
  questions: [
    { id:'company_name', label:'Company Name', required:true, type:'text' },
    { id:'industry', label:'Industry', required:true, type:'single', options:['Manufacturing','Technology','Healthcare','Financial Services','Retail','Other (specify)'] },
    { id:'revenue', label:'Annual Revenue (USD)', type:'single', options:['< $50M','$50M–$250M','$250M–$1B','$1B–$5B','$5B+'] },
    { id:'size', label:'Total Employee Size (global)', required:true, type:'single', options:['1–99','100–499','500–4,999','5,000–24,999','25,000+'] },
    { id:'hq', label:'Headquarters Location (City, Country)', type:'text' },
    { id:'countries', label:'Countries with Employee Presence', type:'text', note:'List primary countries or number of countries' },
    { id:'remote_policy', label:'Remote/Hybrid Work Policy', type:'single', options:['On-site','Hybrid','Remote-eligible','Role-dependent'] },
    // Point of Contact (kept here so print pack contains everything)
    { id:'poc_name', label:'Point of Contact — Name', required:true, type:'text' },
    { id:'poc_email', label:'Point of Contact — Email', required:true, type:'text' },
    { id:'poc_dept', label:'Point of Contact — Department / Function', type:'text' },
    { id:'poc_level', label:'Point of Contact — Level', type:'single', options:['Coordinator / Specialist','Manager','Director','VP / SVP','C-suite'] }
  ]
};

const GeneralBenefits: Section = {
  id: 'general_benefits',
  title: 'General Employee Benefits',
  questions: [
    { id:'nh_access', label:'% of Employees with National / Government Healthcare Access', type:'single', options:['0%','1–24%','25–49%','50–74%','75–99%','100%'] },
    { id:'eligible_std', label:'% of Employees Eligible for Standard Benefits', required:true, type:'single', options:['< 25%','25–49%','50–74%','75–89%','90%+'] },
    { id:'std_benefits', label:'Standard Benefits Package', type:'multi', options:['Medical','Dental','Vision','EAP','Life/AD&D','Retirement','Legal','Other (specify)'] },
    { id:'leave_flex', label:'Leave & Flexibility Programs', type:'multi', options:['Paid medical leave beyond legal minimums','Intermittent leave','Reduced schedule/part-time with benefits','Remote work options for on-site roles','Shift / schedule modifications','Phased return-to-work','Other (specify)'] },
    { id:'wellness_support', label:'Wellness & Support Programs', type:'multi', options:['Mental health counseling','Peer support groups','Health coaching','On-site/virtual fitness','Financial wellness','Other (specify)'] },
    { id:'financial_legal', label:'Financial & Legal Assistance', type:'multi', options:['Financial counseling','Hardship grants','Legal assistance','Cost-estimator tools','Other (specify)'] },
    { id:'navigation_support', label:'Care Navigation & Support', type:'multi', options:['Benefits navigator / care coordinator','Cancer-specific navigation','Second-opinion services','Clinical trial matching','Other (specify)'] },
    { id:'planned', label:'Planned Enhancements (Next 24 Months)', type:'text' }
  ]
};

const CurrentSupport: Section = {
  id: 'current_support',
  title: 'Current Support for Employees Managing Cancer (EMCs)',
  questions: [
    { id:'program_status', label:'Status of Cancer Support Offerings', type:'single', options:['Comprehensive','In development','Early assessment','Not offered'] },
    { id:'approach', label:'Current Approach to Supporting EMCs', type:'text' },
    { id:'exclusions', label:'Employee Groups Excluded from Support', type:'multi', options:['Contractors','Part-time','Hourly','Temporary','Union-excluded','None'] },
    { id:'triggers', label:'Triggers for Developing Programs', type:'multi', options:['Employee request','Leadership directive','Benchmarking gap','Cost trend','Legal/compliance','Other (specify)'] },
    { id:'impactful_change', label:'Most Impactful Change Made', type:'text' },
    { id:'barriers', label:'Barriers to Development', type:'multi', options:['Budget','Bandwidth','Lack of executive sponsor','Vendor uncertainty','Global consistency','Other (specify)'] },
    { id:'caregiver', label:'Caregiver Support Features', type:'multi', options:['Caregiver leave','Flexible scheduling','Backup care','Support groups','Counseling for family','Other (specify)'] },
    { id:'monitoring', label:'How Program Effectiveness is Monitored', type:'multi', options:['Satisfaction surveys','Utilization analytics','RTW metrics','Cost/outcome tracking','Benchmarking','Other (specify)'] }
  ]
};

/* === Dimension scaffolds === */
type DimBlock = { number: number; title: string; supportBuckets: string[]; followUps: Q[] };

const RESPONSE_BUCKETS = ['Currently offer','In active planning / development','Assessing feasibility','Not able to offer in foreseeable future'];
const D13_BUCKETS = ['Currently use','In active planning / development','Assessing feasibility','Not able to utilize in foreseeable future','Unsure'];

const Dimensions: DimBlock[] = [
  {
    number: 1, title: 'Medical Leave & Flexibility', supportBuckets: RESPONSE_BUCKETS,
    followUps: [
      { id:'d1_1', label:'Paid medical leave duration (beyond legal minimums)', type:'text' },
      { id:'d1_4a', label:'Remote work availability details (on-site roles)', type:'text' },
      { id:'d1_4b', label:'Reduced schedule / part-time details', type:'text' },
      { id:'d1_5', label:'Job protection duration (beyond legal)', type:'text' }
    ]
  },
  {
    number: 2, title: 'Insurance & Financial Protection', supportBuckets: RESPONSE_BUCKETS,
    followUps: [
      { id:'d2_1', label:'Additional insurance coverage details', type:'text' },
      { id:'d2_2', label:'How financial protection effectiveness is measured', type:'text' },
      { id:'d2_5', label:'Health insurance premium handling during medical leave', type:'text' },
      { id:'d2_6', label:'Financial counseling provider', type:'text' }
    ]
  },
  { number: 3, title: 'Manager Preparedness & Capability', supportBuckets: RESPONSE_BUCKETS, followUps: [
      { id:'d3_1a', label:'Manager training requirement (mandatory/optional)', type:'single', options:['Mandatory','Recommended','Optional'] },
      { id:'d3_1',  label:'% managers completed training (past 2 years)', type:'single', options:['< 25%','25–49%','50–74%','75–89%','90%+'] }
  ]},
  { number: 4, title: 'Navigation & Expert Resources', supportBuckets: RESPONSE_BUCKETS, followUps: [
      { id:'d4_1', label:'Navigation provider type', type:'single', options:['Internal HR/Benefits','Third-party vendor','Hybrid'] }
  ]},
  { number: 5, title: 'Workplace Accommodations', supportBuckets: RESPONSE_BUCKETS, followUps: [] },
  { number: 6, title: 'Culture & Psychological Safety', supportBuckets: RESPONSE_BUCKETS, followUps: [
      { id:'d6_2', label:'How culture effectiveness is measured', type:'text' }
  ]},
  { number: 7, title: 'Career Continuity & Advancement', supportBuckets: RESPONSE_BUCKETS, followUps: [] },
  { number: 8, title: 'Return-to-Work Excellence', supportBuckets: RESPONSE_BUCKETS, followUps: [] },
  { number: 9, title: 'Executive Commitment & Resources', supportBuckets: RESPONSE_BUCKETS, followUps: [] },
  { number:10, title: 'Caregiver & Family Support', supportBuckets: RESPONSE_BUCKETS, followUps: [
      { id:'d10_1', label:'Caregiver program eligibility details', type:'text' }
  ]},
  { number:11, title: 'Prevention, Wellness & Legal Compliance', supportBuckets: RESPONSE_BUCKETS, followUps: [
      { id:'d11_1', label:'Specific preventive services covered (screenings, vaccines, genetic testing)', type:'text' }
  ]},
  { number:12, title: 'Continuous Improvement & Outcomes', supportBuckets: RESPONSE_BUCKETS, followUps: [
      { id:'d12_1', label:'Data sources used to measure effectiveness', type:'multi', options:['Surveys','Utilization data','Cost/outcomes','Benchmarks','Vendor reports','Other (specify)'] },
      { id:'d12_2', label:'How employee feedback is incorporated', type:'text' }
  ]},
  { number:13, title: 'Communication & Awareness', supportBuckets: D13_BUCKETS, followUps: [
      { id:'d13_1', label:'Frequency of awareness campaigns', type:'single', options:['Monthly','Quarterly','Bi-annually','Annually','Ad-hoc'] }
  ]},
];

const CrossDim: Section = {
  id: 'cross_dim',
  title: 'Cross-Dimensional Assessment',
  questions: [
    { id:'cd1a', label:'Top 3 Dimensions (Best Outcomes)', type:'multi', options:[] },
    { id:'cd1b', label:'Bottom 3 Dimensions (Lowest Priority)', type:'multi', options:[] },
    { id:'cd2',  label:'Implementation Challenges', type:'multi', options:['Budget','Bandwidth','Vendor fit','Global consistency','Leadership support','Change management','Other (specify)'] }
  ]
};

const EI: Section = {
  id: 'ei',
  title: 'Employee Impact (EI) Assessment',
  questions: [
    { id:'ei1',  label:'Impact on Employee Retention', type:'scale', options:['Very negative','Negative','Neutral','Positive','Very positive'] },
    { id:'ei1a', label:'Impact on Absenteeism', type:'scale', options:['Worse','Slightly worse','No change','Slightly better','Much better'] },
    { id:'ei1b', label:'Impact on Job Performance', type:'scale', options:['Worse','Slightly worse','No change','Slightly better','Much better'] },
    { id:'ei1c', label:'Impact on Healthcare Costs', type:'scale', options:['Increases','Slightly increases','No change','Slightly decreases','Decreases'] },
    { id:'ei2',  label:'ROI Analysis Status', type:'single', options:['Completed','In progress','Planned','Not planned'] },
    { id:'ei3',  label:'ROI Analysis Results (if completed)', type:'text' },
    { id:'ei4',  label:'Advice to Other HR Leaders', type:'text' },
    { id:'ei5',  label:'Other Serious Health Conditions Covered', type:'text' }
  ]
};

/* ========= Render Helpers ========= */
const Badge = ({ children, tone='req' }: { children: React.ReactNode; tone?: 'req'|'cond' }) => (
  <span
    className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
    style={{
      color: tone==='req' ? '#7F1D1D' : '#1E3A8A',
      backgroundColor: tone==='req' ? '#FEE2E2' : '#DBEAFE',
      border: `1px solid ${tone==='req' ? '#FCA5A5' : '#93C5FD'}`
    }}
  >
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
      {/* answer format */}
      <div className="text-[13px] text-slate-600 mt-0.5">
        {q.type==='text'    && <>Free text</>}
        {q.type==='single'  && <>Select one{q.options?.length ? <>: {q.options.join(' • ')}</> : null}</>}
        {q.type==='multi'   && <>Select all that apply{q.options?.length ? <>: {q.options.join(' • ')}</> : null}</>}
        {q.type==='scale'   && <>Scale: {q.options?.join(' → ')}</>}
        {q.type==='date'    && <>Date</>}
        {q.type==='upload'  && <>File upload</>}
        {q.type==='matrix'  && <>Matrix</>}
        {q.note && <div className="mt-0.5 italic text-slate-500">{q.note}</div>}
      </div>
    </div>
  );
}

/* ========= Page ========= */
export default function SurveyPrint() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="flex items-center gap-3">
          <img src="/best-companies-2026-logo.png" alt="" className="h-14 w-auto" />
          <div className="h-8 w-px bg-slate-200" />
          <img src="/cancer-careers-logo.png" alt="" className="h-10 w-auto" />
        </div>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded text-white text-sm"
          style={{ backgroundColor: BRAND.primary }}
        >
          Print / Save PDF
        </button>
      </div>

      <h1 className="text-2xl font-black text-slate-900">CAC Employer Index — Full Survey (Read-Only)</h1>
      <p className="text-sm text-slate-600">
        Use this view to review all questions and gather information. This page is read-only and can be printed or saved as PDF.
      </p>

      {/* What you'll need */}
      <div className="mt-4 p-4 rounded border bg-white" style={{ borderColor: BRAND.gray[200] }}>
        <div className="flex items-center gap-2 mb-2">
          <SectionIcon />
          <div className="text-sm font-bold text-slate-800">What you’ll want handy</div>
        </div>
        <ul className="text-[13px] text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-y-1">
          <li className="flex items-center gap-2"><Dot/><span>Latest benefits summary plan descriptions (SPDs)</span></li>
          <li className="flex items-center gap-2"><Dot/><span>Leave/RTW policy details (weeks, eligibility, job protection)</span></li>
          <li className="flex items-center gap-2"><Dot/><span>Insurance coverage details (disability %, advanced therapy coverage)</span></li>
          <li className="flex items-center gap-2"><Dot/><span>Navigation vendor names & program lists</span></li>
          <li className="flex items-center gap-2"><Dot/><span>Global/market differences (if any)</span></li>
          <li className="flex items-center gap-2"><Dot/><span>Internal contacts for manager training & culture initiatives</span></li>
        </ul>
      </div>

      {/* Contents */}
      <div className="mt-4 p-4 rounded border bg-white print:hidden" style={{ borderColor: BRAND.gray[200] }}>
        <div className="text-sm font-bold text-slate-800 mb-2">Contents</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[13px]">
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo(Firmographics.id)}>1. Company Profile</button>
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo(GeneralBenefits.id)}>2. General Benefits</button>
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo(CurrentSupport.id)}>3. Current Support for EMCs</button>
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo('dimensions')}>4. 13 Dimensions of Support</button>
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo(CrossDim.id)}>5. Cross-Dimensional Assessment</button>
          <button className="text-left text-indigo-700 hover:underline" onClick={()=>scrollTo(EI.id)}>6. Employee Impact (EI) Assessment</button>
        </div>
      </div>

      {/* Sections */}
      <SurveySection section={Firmographics} />
      <SurveySection section={GeneralBenefits} />
      <SurveySection section={CurrentSupport} />

      {/* Dimensions */}
      <section id="dimensions" className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-2">13 Dimensions of Support</h2>
        <p className="text-[13px] text-slate-600 mb-3">
          For each dimension, mark the status of each support offering (column buckets), then answer follow-ups.
        </p>

        {Dimensions.map((d, idx) => (
          <div key={d.number} className="mb-6 p-4 rounded border bg-white" style={{ borderColor: BRAND.gray[200] }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                   style={{ backgroundColor: DIM_COLORS[idx % DIM_COLORS.length] }}>
                {d.number}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{d.title}</h3>
            </div>

            {/* Buckets matrix (column headers only for print spec) */}
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${d.supportBuckets.length}, minmax(0,1fr))` }}>
              {d.supportBuckets.map((b) => (
                <div key={b} className="rounded border p-3" style={{ borderColor: BRAND.gray[200] }}>
                  <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[600] }}>{b}</div>
                  <div className="text-[12px] text-slate-500">— list programs here when taking the survey —</div>
                </div>
              ))}
            </div>

            {/* Follow-ups */}
            {d.followUps.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-semibold text-slate-800 mb-1">Follow-up questions</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                  {d.followUps.map(q => <QItem key={q.id} q={q} />)}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Cross-Dim – three buckets side by side */}
      <section id={CrossDim.id} className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Cross-Dimensional Assessment</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded border p-4 bg-white" style={{ borderColor: BRAND.gray[200] }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.gray[600] }}>Top 3 Dimensions</div>
            <div className="text-[13px] text-slate-600">Select up to three.</div>
          </div>
          <div className="rounded border p-4 bg-white" style={{ borderColor: BRAND.gray[200] }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.gray[600] }}>Bottom 3 Dimensions</div>
            <div className="text-[13px] text-slate-600">Select up to three.</div>
          </div>
          <div className="rounded border p-4 bg-white" style={{ borderColor: BRAND.gray[200] }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.gray[600] }}>Implementation Challenges</div>
            <ul className="text-[13px] text-slate-700 space-y-1">
              {(CrossDim.questions.find(q=>q.id==='cd2')?.options || []).map(opt => (
                <li key={opt} className="flex items-center gap-2"><Dot/><span>{opt}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* EI */}
      <SurveySection section={EI} />

      {/* Print CSS */}
      <style jsx>{`
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

/* ========= Generic section renderer ========= */
function SurveySection({ section }: { section: Section }) {
  return (
    <section id={section.id} className="mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-2">{section.title}</h2>
      <div className="p-4 rounded border bg-white" style={{ borderColor: BRAND.gray[200] }}>
        {section.questions.map(q => <QItem key={q.id} q={q} />)}
      </div>
    </section>
  );
}
