'use client'

import { useRouter } from 'next/navigation'

const SCALE_ITEMS = [
  { label: 'In Place', color: '#0D9488', pts: 5, desc: 'This program, policy, or practice is currently active and available to employees.' },
  { label: 'In Development', color: '#2563EB', pts: 3, desc: 'A formal plan exists and resources have been allocated to implement this within the next 12\u201318 months.' },
  { label: 'Under Review', color: '#D97706', pts: 2, desc: 'Actively evaluating the feasibility, cost, or design of this program. No implementation timeline yet, but it is on leadership\u2019s radar.' },
  { label: 'Open to Exploring', color: '#8B5CF6', pts: 1, desc: 'Had not considered this, but learning about it has sparked interest. Open to reviewing whether this could work for your organization.' },
  { label: 'Not Planned', color: '#64748B', pts: 0, desc: 'Considered this and determined it is not feasible or appropriate for your organization at this time.' },
  { label: 'Unsure', color: '#9CA3AF', pts: 0, desc: 'Don\u2019t have enough information to answer this accurately. Flags the item for internal follow-up.' },
]

const NEW_ELEMENTS: Array<{
  dim: string
  dimNum: number
  id: string
  priority: string
  element: string
  rationale: string
  overlap?: string
}> = [
  // D3
  { dim: 'Manager Preparedness & Capability', dimNum: 3, id: 'D3-NEW-1', priority: 'HIGH', element: 'Managers are trained specifically on available company benefits, leave policies, and support resources (operational knowledge training, distinct from empathy/sensitivity training)', rationale: 'Only 42% of managers were knowledgeable about benefits despite 69% showing empathy. 53% "learned as situations arose." Empathy without operational knowledge creates well-intentioned inconsistency.' },
  // D4
  { dim: 'Specialized Resources', dimNum: 4, id: 'D4-NEW-1', priority: 'HIGH', element: 'HR proactively reaches out to the employee after learning of a serious health condition (rather than waiting for the employee to request assistance)', rationale: 'Massive gender gaps in HR support: men rated HR 20\u201330 points higher. Only 38% of women said HR helped with paperwork vs 64% men.' },
  { dim: 'Specialized Resources', dimNum: 4, id: 'D4-NEW-2', priority: 'MEDIUM', element: 'Simplified administrative process for accessing benefits during a serious health condition (e.g., reduced paperwork, single-form access, digital submission options)', rationale: 'Only 48% of women said admin was easy to navigate vs 76% men. HR operational quality is the largest gender equity issue.' },
  // D6
  { dim: 'Culture & Psychological Safety', dimNum: 6, id: 'D6-NEW-3', priority: 'MEDIUM', element: 'Employee has explicit control over who in the organization is informed about their condition (written consent required before any information sharing)', rationale: 'Privacy violations cited in verbatims. Employee control over information is foundational to psychological safety.' },
  // D8
  { dim: 'Work Continuation & Resumption', dimNum: 8, id: 'D8-NEW-1', priority: 'HIGH', element: 'Structured post-treatment check-in program (e.g., scheduled check-ins at 30, 60, and 90 days after active treatment completion)', rationale: 'Support ratings drop from 54% during treatment to just 22% after treatment ends \u2014 a 32-point cliff. This is the #1 opportunity to differentiate.' },
  { dim: 'Work Continuation & Resumption', dimNum: 8, id: 'D8-NEW-2', priority: 'HIGH', element: 'Continued workplace accommodations available during recovery phase (beyond active treatment period)', rationale: 'Only 16% of women rated post-treatment support as good vs 40% men. Accommodations that end at treatment end create the cliff.' },
  { dim: 'Work Continuation & Resumption', dimNum: 8, id: 'D8-NEW-4', priority: 'MEDIUM', element: 'Access to cognitive recovery resources for treatment-related effects (e.g., memory aids, task management support for "chemo brain")', rationale: 'Cognitive effects of treatment are a widely cited barrier to returning to full productivity.' },
  // D12
  { dim: 'Continuous Improvement & Outcomes', dimNum: 12, id: 'D12-NEW-1', priority: 'MEDIUM', element: 'Organization tracks support delivery and outcomes by demographic group (e.g., gender, role level, tenure) to identify and address disparities', rationale: 'Gender disparities of 20\u201351 points across critical dimensions. Pressure to return: 96% men vs 45% women. Companies that don\u2019t measure this can\u2019t fix it.' },
  // D13
  { dim: 'Communication & Awareness', dimNum: 13, id: 'D13-NEW-3', priority: 'MEDIUM', element: 'Employees are proactively informed of their legal rights (FMLA, ADA, state-level protections) related to medical leave and disability accommodations', rationale: '48% learned about support reactively (at or after disclosure). Proactive legal rights education shifts the timeline.' },
]

const PROPOSED_QUESTIONS: Array<{
  dim: string
  dimNum: number
  id: string
  type: string
  question: string
  options: Array<{ label: string; score: number; note: string }>
  rationale: string
  overlap?: string
}> = [
  {
    dim: 'Work Continuation & Resumption', dimNum: 8, id: 'D8_1', type: 'Follow-Up',
    question: 'How long do workplace accommodations remain available after an employee\u2019s active treatment ends?',
    options: [
      { label: 'As long as medically needed with no fixed cutoff', score: 100, note: 'Best practice' },
      { label: 'Up to 12 months post-treatment', score: 80, note: 'Strong' },
      { label: 'Up to 6 months post-treatment', score: 50, note: 'Moderate' },
      { label: 'Up to 3 months post-treatment', score: 25, note: 'Minimal' },
      { label: 'Accommodations end when active treatment ends', score: 0, note: 'Cliff pattern' },
    ],
    rationale: 'Directly measures the post-treatment cliff. Companies scoring 0 are exhibiting the exact pattern that 70% of EMC respondents flagged as their biggest frustration.',
  },
  {
    dim: 'Culture & Psychological Safety', dimNum: 6, id: 'D6-SQ-1', type: 'Standalone',
    question: 'When an employee discloses a cancer or serious health condition, what is the typical process?',
    options: [
      { label: 'Formal documented protocol: designated contact assigned, confidentiality agreement signed, written summary of support provided within 48 hours', score: 100, note: 'Best practice' },
      { label: 'Standard process exists but is informal: HR is notified, employee receives verbal overview of support options', score: 60, note: 'Adequate' },
      { label: 'Manager handles case-by-case with HR guidance available if requested', score: 30, note: 'Ad hoc' },
      { label: 'No standard process; response depends on the individual manager or HR representative', score: 0, note: 'Unstructured' },
    ],
    rationale: 'Measures the moment 91% of employees are anxious about. Disclosure protocol quality is a leading indicator of all downstream support outcomes.',
  },
  {
    dim: 'Specialized Resources', dimNum: 4, id: 'D4_1 (new)', type: 'Follow-Up',
    question: 'When HR/Benefits learns of an employee\u2019s cancer or serious health condition, what typically happens?',
    options: [
      { label: 'HR proactively contacts the employee within 48 hours with a written summary of all available benefits, a single point of contact, and scheduled follow-up', score: 100, note: 'Best practice' },
      { label: 'HR contacts the employee within a week to discuss available options', score: 70, note: 'Good' },
      { label: 'HR responds when the employee reaches out with questions', score: 30, note: 'Reactive' },
      { label: 'No standard HR response process exists', score: 0, note: 'Unstructured' },
    ],
    rationale: 'Tackles the gender equity gap in HR support. Men rated HR 20\u201330 points higher across every metric. Proactive outreach is the highest-impact differentiator.',
    overlap: 'D4 already has a follow-up (D4_1a/D4_1b) about navigation provider type and services. This new question measures HR response behavior, not navigation resources.',
  },
]

const DIM_COLORS: Record<number, string> = {
  2: '#F59E0B', 3: '#10B981', 4: '#3B82F6', 6: '#6366F1',
  8: '#14B8A6', 12: '#A855F7', 13: '#EAB308',
}

function PriorityBadge({ priority }: { priority: string }) {
  const bg = priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
             priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
             'bg-slate-50 text-slate-600 border-slate-200'
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${bg}`}>{priority}</span>
}

export default function UpdatesPage() {
  const router = useRouter()

  // Group elements by dimension
  const grouped = NEW_ELEMENTS.reduce<Record<number, typeof NEW_ELEMENTS>>((acc, el) => {
    if (!acc[el.dimNum]) acc[el.dimNum] = []
    acc[el.dimNum].push(el)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-1">Internal Review</p>
            <h1 className="text-3xl font-bold text-gray-900">Updates Made to App</h1>
            <p className="text-sm text-gray-500 mt-1">April 2026</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* ============================================ */}
        {/* SECTION 1: APP CHANGES */}
        {/* ============================================ */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-10">
          <div className="px-6 py-4 bg-gray-900 text-white">
            <h2 className="text-lg font-bold">Recent App Changes</h2>
            <p className="text-sm text-gray-400 mt-0.5">Updates deployed to the live survey application</p>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Scale Change */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">New 6-Option Response Scale</h3>
                  <p className="text-sm text-gray-600 mt-1 mb-3">
                    Replaced the old 5-option scale with a new 6-option scale informed by EMC research. Added &quot;Open to Exploring&quot; to capture companies newly aware of a need, distinct from deliberate &quot;Not Planned.&quot;
                  </p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {SCALE_ITEMS.map(item => (
                      <div key={item.label} className="flex items-start gap-3 px-4 py-2.5 border-b border-gray-50 last:border-b-0">
                        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                            <span className="text-[10px] font-bold text-gray-400">{item.pts} pts</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* localStorage Removal */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Removed localStorage &mdash; Supabase-Only Data</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    All survey data is now stored exclusively in Supabase via a React context provider. This enables true cross-device access &mdash; users can start on one computer and continue on another. Eliminates data loss from browser clearing and ensures all responses are immediately backed up server-side.
                  </p>
                </div>
              </div>
            </div>

            {/* Landing Page */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Redesigned Landing Page</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Replaced the old single login form with a 3-card welcome flow: &quot;I am a new participant,&quot; &quot;I have already started the survey,&quot; and &quot;I completed the survey and want to make updates.&quot; Each card routes to the appropriate login experience. Clearer, faster onboarding.
                  </p>
                </div>
              </div>
            </div>

            {/* Unsure Button */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Review Unsure Responses</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Added a persistent &quot;Unsure&quot; button in the header that shows the count of elements marked as Unsure across all dimensions. Clicking opens a dedicated page where users can review and update all Unsure responses in one place, grouped by dimension.
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension Summary View */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Dimension Summary View on Return</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    When a user returns to a previously completed dimension, they now see a 2-column summary grid of all elements with their current responses. They can click any element to change its response inline. The summary only appears on return &mdash; not when completing a dimension for the first time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* SECTION 2: PROPOSED NEW ELEMENTS */}
        {/* ============================================ */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-10">
          <div className="px-6 py-4 bg-gray-900 text-white">
            <h2 className="text-lg font-bold">Proposed New Elements</h2>
            <p className="text-sm text-gray-400 mt-0.5">9 new grid elements recommended based on the Employee Cancer Experience Report 2025</p>
          </div>

          <div className="divide-y divide-gray-200">
            {Object.entries(grouped)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([dimNum, items]) => (
                <div key={dimNum} className="px-6 py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: DIM_COLORS[Number(dimNum)] || '#64748B' }}
                    >
                      {dimNum}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Dimension {dimNum}: {items[0].dim}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {items.map(el => (
                      <div key={el.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gray-400">{el.id}</span>
                            <PriorityBadge priority={el.priority} />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-2">{el.element}</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{el.rationale}</p>
                        {el.overlap && (
                          <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            <p className="text-xs text-amber-800">{el.overlap}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ============================================ */}
        {/* SECTION 3: PROPOSED NEW QUESTIONS */}
        {/* ============================================ */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-10">
          <div className="px-6 py-4 bg-gray-900 text-white">
            <h2 className="text-lg font-bold">Proposed New Questions</h2>
            <p className="text-sm text-gray-400 mt-0.5">2 follow-up questions and 1 standalone question with scored response options</p>
          </div>

          <div className="divide-y divide-gray-200">
            {PROPOSED_QUESTIONS.map(q => (
              <div key={q.id} className="px-6 py-5">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: DIM_COLORS[q.dimNum] || '#64748B' }}
                  >
                    {q.dimNum}
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-400">{q.id}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">{q.type}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-2 mb-1">
                  D{q.dimNum}: {q.dim}
                </h3>
                <p className="text-sm text-gray-800 font-medium mb-3">&ldquo;{q.question}&rdquo;</p>

                <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-2 font-semibold">Response Option</th>
                        <th className="text-center px-3 py-2 font-semibold w-16">Score</th>
                        <th className="text-left px-3 py-2 font-semibold w-28">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {q.options.map((opt, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 text-gray-800">{opt.label}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-gray-900">{opt.score}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-500">{opt.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">{q.rationale}</p>
                {q.overlap && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <p className="text-xs text-amber-800">{q.overlap}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="text-center text-xs text-gray-400 mt-8 pb-8">
          Based on: The Employee Cancer Experience Report 2025 &mdash; GP EMC N=247 | CAC EMC N=126 | Field: Q4 2025
          <br />BEYOND Insights &times; Cancer and Careers
        </div>
      </div>
    </div>
  )
}
