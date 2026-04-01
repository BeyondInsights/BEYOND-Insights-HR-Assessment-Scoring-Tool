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
  { dim: 'Specialized Resources', dimNum: 4, id: 'D4-NEW-3', priority: 'HIGH', element: 'Designated single point of contact assigned to the employee upon disclosure of a serious health condition (e.g., a navigator, HR partner, or case manager who quarterbacks the process)', rationale: '28% of women lacked confidence in disclosure vs just 7% of men. A designated contact reduces anxiety and inconsistency. Note: This concept exists in the current-support section as a descriptive item but does not flow into dimension scoring \u2014 moved here to D4 so it is a scored element with incentive weight.' },
  // D6
  { dim: 'Culture & Psychological Safety', dimNum: 6, id: 'D6-NEW-3', priority: 'MEDIUM', element: 'Employee has explicit control over who in the organization is informed about their condition (written consent required before any information sharing)', rationale: 'Privacy violations cited in verbatims. Employee control over information is foundational to psychological safety.' },
  // D8
  { dim: 'Work Continuation & Resumption', dimNum: 8, id: 'D8-NEW-1', priority: 'HIGH', element: 'Structured post-treatment check-in program (e.g., scheduled check-ins at 30, 60, and 90 days after active treatment completion)', rationale: 'Support ratings drop from 54% during treatment to just 22% after treatment ends \u2014 a 32-point cliff. This is the #1 opportunity to differentiate.' },
  { dim: 'Work Continuation & Resumption', dimNum: 8, id: 'D8-NEW-2', priority: 'HIGH', element: 'Continued workplace accommodations available during recovery phase (beyond active treatment period)', rationale: 'Only 16% of women rated post-treatment support as good vs 40% men. Accommodations that end at treatment end create the cliff.' },
  { dim: 'Work Continuation & Resumption', dimNum: 8, id: 'D8-NEW-3', priority: 'HIGH', element: 'Performance expectations explicitly adjusted during post-treatment recovery period (not just during active treatment)', rationale: '51-point gender gap on pressure to return (96% men vs 45% women felt no pressure). D7 has "Adjusted performance goals during treatment and recovery" but bundling both phases lets companies check one box for both. EMC data shows companies DO adjust during treatment but DON\u2019T during recovery \u2014 lumping them masks the cliff. v7 action: split existing D7 element into two separate items for treatment vs. recovery phases.' },
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

// ============================================
// SECTION 4: CANDIDATES FOR ELIMINATION / CONSOLIDATION
// ============================================

interface EliminationItem {
  element: string
  weight: string
  stability: string
  reason: string
}

interface EliminationGroup {
  dim: string
  dimNum: number
  action: string
  summary: string
  items: EliminationItem[]
  consolidations?: Array<{ into: string; merge: string[] }>
}

const ELIMINATION_GROUP_1: EliminationGroup[] = [
  {
    dim: 'Caregiver & Family Support', dimNum: 10, action: 'Trim from 20 to ~12\u201314 elements',
    summary: 'This dimension has the most elements of any dimension. The bottom 8 elements all have low weight and low stability, contributing minimal differentiation. Several overlap with financial and support elements in other dimensions.',
    items: [
      { element: 'Dependent care account matching/contributions', weight: '3.6%', stability: '26%', reason: 'Very specific financial mechanism with limited differentiation value' },
      { element: 'Emergency caregiver funds', weight: '3.7%', stability: '28%', reason: 'Overlaps with general hardship funds in D2' },
      { element: 'Mental health support specifically for caregivers', weight: '3.9%', stability: '40%', reason: 'Likely captured by general EAP/mental health elements elsewhere' },
      { element: 'Dependent care subsidies', weight: '3.9%', stability: '42%', reason: 'Overlaps with dependent care account matching above' },
      { element: 'Caregiver peer support groups', weight: '4.0%', stability: '42%', reason: 'Overlaps with general peer support element in D6' },
      { element: 'Legal/financial planning assistance for caregivers', weight: '4.1%', stability: '46%', reason: 'Niche; overlaps with D2 financial counseling' },
    ],
    consolidations: [
      { into: 'Comprehensive caregiver financial support', merge: ['Dependent care account matching', 'Emergency caregiver funds', 'Dependent care subsidies', 'Legal/financial planning assistance'] },
    ],
  },
  {
    dim: 'Prevention, Wellness & Legal Compliance', dimNum: 11, action: 'Trim from 13 to ~10 elements',
    summary: 'Three elements have low weight and stability, and are generic wellness items rather than cancer-specific measures.',
    items: [
      { element: 'Lifestyle coaching programs', weight: '4.0%', stability: '16%', reason: 'Lowest stability in the entire survey. Generic wellness, not cancer-specific.' },
      { element: 'Risk factor tracking/reporting', weight: '4.4%', stability: '32%', reason: 'Vague and difficult for companies to interpret consistently' },
      { element: 'Targeted risk-reduction programs', weight: '4.6%', stability: '36%', reason: 'Overlaps with lifestyle coaching; unclear what qualifies' },
    ],
  },
  {
    dim: 'Manager Preparedness & Capability', dimNum: 3, action: 'Consider cutting 1\u20132 elements',
    summary: 'Two elements have low stability and limited grounding in EMC findings.',
    items: [
      { element: 'AI-powered guidance tools', weight: '5.8%', stability: '33%', reason: 'Aspirational/futuristic; very few companies have this. Not supported by EMC findings.' },
      { element: 'Legal compliance training', weight: '5.5%', stability: '24%', reason: 'Overlaps with general manager training. Legal compliance is embedded in broader training programs.' },
    ],
  },
  {
    dim: 'Continuous Improvement & Outcomes', dimNum: 12, action: 'Cut or relocate 1\u20132 elements',
    summary: 'Two elements have placement or clarity issues alongside low statistical performance.',
    items: [
      { element: 'Measure screening campaign ROI', weight: '6.5%', stability: '24%', reason: 'This is a D11 (prevention) metric, not a D12 (continuous improvement) item. Confusing placement.' },
      { element: 'Business impact/ROI assessment', weight: '6.5%', stability: '25%', reason: 'Vague in practice. Difficult for companies to answer meaningfully.' },
    ],
  },
]

const ELIMINATION_GROUP_2: EliminationItem[] = [
  { element: 'Phased return-to-work plans (D8)', weight: '4.5%', stability: '20%', reason: 'Low weight statistically, but EMC shows this is the #3 adjustment employees wished for (42%). Low weight likely because it\u2019s near-table-stakes among good companies. Keep \u2014 weight should increase with adoption.' },
  { element: 'Hardship grants (D2)', weight: '4.0%', stability: '40%', reason: 'Low weight but financial burden is the #1 EMC gap at 37%. Low weight because very few companies offer it. Keep.' },
  { element: 'New hire orientation coverage (D13)', weight: '4.7%', stability: '17%', reason: 'Low weight/stability, but EMC shows only 4% learned about support at onboarding. A leading indicator the field hasn\u2019t adopted yet. Keep \u2014 will gain weight as adoption increases.' },
  { element: 'Dedicated budget allocation (D9)', weight: '4.8%', stability: '26%', reason: 'Low weight but conceptually important \u2014 budget commitment is a real differentiator for program sustainability. Keep.' },
  { element: 'Contingency planning for treatment schedules (D8)', weight: '4.4%', stability: '21%', reason: 'EMC shows 58% continued working during treatment. Schedule flexibility is critical for that population. Keep.' },
]

const ELIMINATION_GROUP_3: EliminationGroup[] = [
  {
    dim: 'Insurance & Financial Protection', dimNum: 2, action: 'Consolidate from 17 to ~11\u201312 elements',
    summary: 'The bottom 9 elements are underperforming. Rather than cutting individual items, consolidating preserves conceptual coverage while reducing survey length.',
    items: [],
    consolidations: [
      { into: 'Comprehensive disability income protection', merge: ['STD covering 60%+', 'LTD covering 60%+', 'Employer-paid disability supplements'] },
      { into: 'Clinical trial support', merge: ['Clinical trial coverage', 'Paid time off for clinical trial participation'] },
      { into: 'Out-of-pocket cost protection', merge: ['Voluntary supplemental insurance', 'Set out-of-pocket maximums'] },
    ],
  },
  {
    dim: 'Executive Commitment & Resources', dimNum: 9, action: 'Consolidate 2\u20133 overlapping elements',
    summary: 'D9 has 12 elements with 5 below 65% of equal weight. Several overlap conceptually.',
    items: [
      { element: 'ESG/CSR reporting inclusion + Support metrics in annual report/sustainability reporting', weight: 'Various', stability: 'Various', reason: 'Nearly the same thing \u2014 both measure whether support programs appear in external reporting. Consolidate into one.' },
    ],
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
                    The original design used browser localStorage to allow offline continuation, but this created unnecessary complications. All survey data is now saved directly to the database on every change. If internet access is lost, users simply pick up where they left off once connectivity is restored.
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

            {/* Items to Review + Download */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Items to Review &mdash; Download for Team Collaboration</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Renamed the &quot;Unsure&quot; header button to &quot;Items to Review&quot; and added a download option. Users can export a list of all Unsure elements to share with colleagues who can help determine the correct responses before updating.
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension Completion Progress */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Dimension Completion Progress</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    When completing a dimension, users now see how many of the 13 dimensions are done (e.g., &quot;7 of 13 dimensions complete&quot;). The dashboard also includes a note that dimensions can be completed in any order.
                  </p>
                </div>
              </div>
            </div>

            {/* Element Tooltips */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Element Clarification Tooltips</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Added plain-language explanations for 22 technical or ambiguous elements across the 13 dimensions. These appear automatically as blue info boxes when a user encounters an element that contains financial jargon, medical terminology, or concepts that may be unfamiliar (e.g., &quot;Accelerated life insurance benefits,&quot; &quot;CAR-T therapy,&quot; &quot;ESG/CSR reporting&quot;).
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
            <p className="text-sm text-gray-400 mt-0.5">11 new grid elements recommended based on the Employee Cancer Experience Report 2025</p>
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

        {/* ============================================ */}
        {/* SECTION 4: CANDIDATES FOR ELIMINATION      */}
        {/* ============================================ */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-10">
          <div className="px-6 py-4 bg-gray-900 text-white">
            <h2 className="text-lg font-bold">Candidates for Elimination or Consolidation</h2>
            <p className="text-sm text-gray-400 mt-0.5">Based on element weighting analysis and EMC research cross-reference</p>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-b border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              These candidates were identified by cross-referencing element weight and stability scores with findings from the EMC employee survey. Elements with low weight and low stability that also lacked support in the EMC data are candidates for removal. Some elements had similarly low scores but were kept because the EMC research indicated they address real employee needs (see Group 2 below).
            </p>
          </div>

          {/* GROUP 1: Strong deletion candidates */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border bg-red-50 text-red-700 border-red-200">Group 1</span>
              <h3 className="text-sm font-bold text-gray-900">Candidates for Removal or Consolidation</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">Low weight, low stability, and limited EMC support. These add survey length without adding meaningful measurement value.</p>

            <div className="space-y-6">
              {ELIMINATION_GROUP_1.map(group => (
                <div key={group.dimNum} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: DIM_COLORS[group.dimNum] || '#64748B' }}>{group.dimNum}</div>
                    <div>
                      <span className="text-sm font-bold text-gray-900">D{group.dimNum}: {group.dim}</span>
                      <span className="text-xs text-gray-500 ml-2">{group.action}</span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-600 mb-3">{group.summary}</p>
                    {group.items.length > 0 && (
                      <table className="w-full text-sm mb-3">
                        <thead>
                          <tr className="text-xs text-gray-500 uppercase tracking-wide">
                            <th className="text-left px-3 py-1.5 font-semibold">Element</th>
                            <th className="text-center px-2 py-1.5 font-semibold w-16">Weight</th>
                            <th className="text-center px-2 py-1.5 font-semibold w-16">Stability</th>
                            <th className="text-left px-3 py-1.5 font-semibold">Rationale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.items.map((item, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-gray-800 font-medium">{item.element}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{item.weight}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{item.stability}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{item.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {group.consolidations && group.consolidations.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2.5">
                        <p className="text-xs font-semibold text-blue-800 mb-1.5">Suggested consolidations:</p>
                        {group.consolidations.map((c, i) => (
                          <div key={i} className="text-xs text-blue-700 mb-1 last:mb-0">
                            <span className="font-medium">{c.into}</span> &larr; merge {c.merge.join(', ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GROUP 2: Low weight but EMC says keep */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">Group 2</span>
              <h3 className="text-sm font-bold text-gray-900">Low Weight but EMC Evidence Says Keep</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">These underperform statistically but address real employee needs identified in the EMC research. Recommend keeping.</p>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-2 font-semibold">Element</th>
                    <th className="text-center px-2 py-2 font-semibold w-16">Weight</th>
                    <th className="text-center px-2 py-2 font-semibold w-16">Stability</th>
                    <th className="text-left px-3 py-2 font-semibold">Why Keep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ELIMINATION_GROUP_2.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 text-gray-800 font-medium">{item.element}</td>
                      <td className="px-2 py-2.5 text-center text-gray-600">{item.weight}</td>
                      <td className="px-2 py-2.5 text-center text-gray-600">{item.stability}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GROUP 3: Borderline — consolidate */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">Group 3</span>
              <h3 className="text-sm font-bold text-gray-900">Borderline — Consolidate Rather Than Delete</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">These could go either way. Consolidating into fewer composite items preserves conceptual coverage while reducing survey length.</p>

            <div className="space-y-4">
              {ELIMINATION_GROUP_3.map(group => (
                <div key={group.dimNum} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: DIM_COLORS[group.dimNum] || '#64748B' }}>{group.dimNum}</div>
                    <div>
                      <span className="text-sm font-bold text-gray-900">D{group.dimNum}: {group.dim}</span>
                      <span className="text-xs text-gray-500 ml-2">{group.action}</span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-600 mb-3">{group.summary}</p>
                    {group.items.length > 0 && (
                      <table className="w-full text-sm mb-3">
                        <thead>
                          <tr className="text-xs text-gray-500 uppercase tracking-wide">
                            <th className="text-left px-3 py-1.5 font-semibold">Element</th>
                            <th className="text-center px-2 py-1.5 font-semibold w-16">Weight</th>
                            <th className="text-center px-2 py-1.5 font-semibold w-16">Stability</th>
                            <th className="text-left px-3 py-1.5 font-semibold">Rationale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.items.map((item, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-gray-800 font-medium">{item.element}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{item.weight}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{item.stability}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{item.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {group.consolidations && group.consolidations.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2.5">
                        <p className="text-xs font-semibold text-blue-800 mb-1.5">Suggested consolidations:</p>
                        {group.consolidations.map((c, i) => (
                          <div key={i} className="text-xs text-blue-700 mb-1 last:mb-0">
                            <span className="font-medium">{c.into}</span> &larr; merge {c.merge.join(', ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
