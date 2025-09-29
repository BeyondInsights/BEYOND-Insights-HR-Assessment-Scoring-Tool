'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../.@/components/Header'
import Footer from '../.@/components/Footer'

// Reusable option card
function OptionCard({ selected, children, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border-2 cursor-pointer shadow-sm text-base ${
        selected
          ? 'border-orange-500 bg-orange-50 text-orange-700'
          : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      {children}
    </div>
  )
}

export default function SupportProgramsPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  // State for all survey questions
  const [cb3a, setCb3a] = useState('')
  const [cb3b, setCb3b] = useState<string[]>([])
  const [cb3c, setCb3c] = useState<string[]>([])
  const [cb3d, setCb3d] = useState<string[]>([])
  const [or1, setOr1] = useState('')
  const [or2a, setOr2a] = useState<string[]>([])
  const [or2b, setOr2b] = useState('')
  const [or3, setOr3] = useState<string[]>([])
  const [or5a, setOr5a] = useState<string[]>([])
  const [or6, setOr6] = useState<string[]>([])

  // Other text fields
  const [otherCb3b, setOtherCb3b] = useState('')
  const [otherCb3d, setOtherCb3d] = useState('')
  const [otherOr2a, setOtherOr2a] = useState('')
  const [otherOr3, setOtherOr3] = useState('')
  const [otherOr5a, setOtherOr5a] = useState('')
  const [otherOr6, setOtherOr6] = useState('')

  // Load saved answers; always start at first step
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('current_data') || '{}')
    if (saved) {
      setCb3a(saved.cb3a || '')
      setCb3b(saved.cb3b || [])
      setCb3c(saved.cb3c || [])
      setCb3d(saved.cb3d || [])
      setOr1(saved.or1 || '')
      setOr2a(saved.or2a || [])
      setOr2b(saved.or2b || '')
      setOr3(saved.or3 || [])
      setOr5a(saved.or5a || [])
      setOr6(saved.or6 || [])
      setOtherCb3b(saved.otherCb3b || '')
      setOtherCb3d(saved.otherCb3d || '')
      setOtherOr2a(saved.otherOr2a || '')
      setOtherOr3(saved.otherOr3 || '')
      setOtherOr5a(saved.otherOr5a || '')
      setOtherOr6(saved.otherOr6 || '')
    }
    setStep(0)
  }, [])

  // Persist answers whenever they change (without marking complete)
  useEffect(() => {
    const data = {
      cb3a, cb3b, cb3c, cb3d,
      or1, or2a, or2b, or3,
      or5a, or6,
      otherCb3b, otherCb3d,
      otherOr2a, otherOr3,
      otherOr5a, otherOr6
    }
    localStorage.setItem('current_data', JSON.stringify(data))
  }, [
    cb3a, cb3b, cb3c, cb3d,
    or1, or2a, or2b, or3,
    or5a, or6,
    otherCb3b, otherCb3d,
    otherOr2a, otherOr3,
    otherOr5a, otherOr6
  ])

  // Toggle helper
  const toggle = (arrSetter: (fn: any) => void, opt: string) => {
    arrSetter((prev: string[]) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))
  }

  const handleSave = () => {
    localStorage.setItem(
      'current_data',
      JSON.stringify({
        cb3a, cb3b, cb3c, cb3d,
        or1, or2a, or2b, or3,
        or5a, or6,
        otherCb3b, otherCb3d,
        otherOr2a, otherOr3,
        otherOr5a, otherOr6,
        complete: true
      })
    )
    router.push('/dashboard')
  }

  // Step definitions
  const steps = [
    {
      content: (
        <div className="space-y-4 text-base">
          <p>
            For the rest of the assessment survey, please think about support your organization provides or may provide for employees managing cancer or other serious health conditions requiring time away for treatment or recovery, workplace adjustments, or ongoing support.
          </p>
          <h3 className="text-lg font-semibold text-gray-900">Balancing Employee Support with Organizational Realities</h3>
          <p>
            We understand that all organizations want to support employees managing cancer and other serious health conditions. But we also recognize that every organization faces real constraints:
          </p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Budget limitations and competing priorities</li>
            <li>Business continuity and productivity needs</li>
            <li>Resource and bandwidth constraints</li>
            <li>Balancing fairness across all employee needs</li>
          </ul>
          <p>
            These realities do not diminish your commitment to employeesâ€” theyâ€™re simply part of running an organization. This survey aims to capture what organizations actually provide within these constraints. Your honest responsesâ€”including what you're unable to offerâ€”will create realistic benchmarks that help all employers understand what's feasible and identify opportunities for improvement.
          </p>
          <p>
            Throughout the survey, please indicate only what your organization currently has in place, programs with dedicated resources (not ad hoc arrangements), and benefits beyond standard health insurance coverage. â€œNot currently availableâ€ is a valid and common response. Most organizations are still developing these capabilities, and an accurate picture is more valuable than an aspirational one.
          </p>
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            CB3a. Does your organization offer any benefits, resources, or support for employees managing cancer or other serious health conditions that go beyond what is legally required in your markets?
          </h2>
          <p className="text-sm text-gray-600 mb-2">(Select ONE)</p>
          {[
            'Yes, we offer additional support beyond legal requirements',
            'Currently developing enhanced support offerings',
            'At this time, we primarily focus on meeting legal compliance requirements',
            'Not yet, but actively exploring options',
          ].map((opt) => (
            <OptionCard key={opt} selected={cb3a === opt} onClick={() => setCb3a(opt)}>
              {opt}
            </OptionCard>
          ))}
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            CB3b. You indicated your organization (offers/plans to offer) support beyond legal requirements. Which of the following best describes how these support programs (are/will be) structured for employees managing cancer or other serious health conditions?
          </h2>
          <p className="text-sm text-gray-600 mb-2">(Select ALL that apply)</p>
          {[
            'Individual benefits or policies (e.g., extended leave, flexible work options)',
            'Coordinated support services - single point of contact for multiple resources (e.g., nurse navigation, case management)',
            'Internally developed formal program with a specific name (e.g., "We Care at Work")',
            'Participation in external initiatives, certifications, or pledges (e.g., Working with Cancer pledge, CEO Cancer Gold Standard)',
            'Comprehensive framework that integrates multiple support elements',
            'Ad hoc/case-by-case support as needs arise',
            'Other (specify)',
          ].map((opt) => (
            <OptionCard key={opt} selected={cb3b.includes(opt)} onClick={() => toggle(setCb3b, opt)}>
              {opt}
            </OptionCard>
          ))}
          {cb3b.includes('Other (specify)') && (
            <input
              type="text"
              value={otherCb3b}
              onChange={(e) => setOtherCb3b(e.target.value)}
              className="mt-2 w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              placeholder="Please specify"
            />
          )}
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">CB3c. Which serious health conditions does/will your program address?</h2>
          <p className="text-sm text-gray-600 mb-2">(Select ALL that apply. For multi-country organizations: Select any condition covered in at least one location.)</p>
          {[
            'Autoimmune disorders (e.g., MS, lupus, rheumatoid arthritis)',
            'Cancer (any form)',
            'Chronic conditions (e.g., MS, ALS, Parkinsonâ€™s, Crohnâ€™s, lupus, rheumatoid arthritis)',
            'Heart disease (including heart attack, heart failure)',
            'HIV / AIDS',
            'Kidney disease (including dialysis, kidney failure)',
            'Major surgery recovery (planned or emergency)',
            'Mental health crises (requiring extended leave)',
            'Musculoskeletal conditions (chronic or acute)',
            'Neurological conditions (e.g., epilepsy, brain injury)',
            'Organ transplant (pre and post)',
            'Respiratory conditions (e.g., COPD, cystic fibrosis)',
            'Stroke',
            'Some other condition meeting severity/duration criteria (specify)',
          ].map((opt) => (
            <OptionCard key={opt} selected={cb3c.includes(opt)} onClick={() => toggle(setCb3c, opt)}>
              {opt}
            </OptionCard>
          ))}
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">CB3d. How were/will the workplace support programs for employees managing cancer or other serious health conditions be primarily developed?</h2>
          <p className="text-sm text-gray-600 mb-2">(Select ALL that apply)</p>
          {[
            'Internally by HR team',
            'With assistance from benefits broker',
            'With specialized consultant support',
            'Adopted from parent/acquiring company',
            'Benchmarked from peer companies',
            'Employee/union driven',
            'Some other way (specify)',
          ].map((opt) => (
            <OptionCard key={opt} selected={cb3d.includes(opt)} onClick={() => toggle(setCb3d, opt)}>
              {opt}
            </OptionCard>
          ))}
          {cb3d.includes('Some other way (specify)') && (
            <input
              type="text"
              value={otherCb3d}
              onChange={(e) => setOtherCb3d(e.target.value)}
              className="mt-2 w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              placeholder="Please specify"
            />
          )}
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            OR1. Which best describes your organizationâ€™s current approach to supporting employees managing cancer or other serious health conditions?
          </h2>
          <p className="text-sm text-gray-600 mb-2">(Select ONE)</p>
          {[
            { label: 'No formal approach', desc: 'Handle case-by-case' },
            { label: 'Developing approach', desc: 'Currently building our programs' },
            { label: 'Legal minimum only', desc: 'Meet legal requirements only (FMLA, ADA)' },
            { label: 'Moderate support', desc: 'Some programs beyond legal requirements' },
            { label: 'Enhanced support', desc: 'Meaningful programs beyond legal minimums' },
            { label: 'Comprehensive support', desc: 'Extensive programs well beyond legal requirements' },
          ].map((opt) => (
            <OptionCard
              key={opt.label}
              selected={or1 === `${opt.label}: ${opt.desc}`}
              onClick={() => setOr1(`${opt.label}: ${opt.desc}`)}
            >
              <span className="font-bold">{opt.label}</span>: {opt.desc}
            </OptionCard>
          ))}
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">OR2a. What triggered your organization to develop support beyond basic legal requirements?</h2>
          <p className="text-sm text-gray-600 mb-2">(Select ALL that apply)</p>
          {[
            'Employee(s) diagnosed with cancer or other serious health conditions highlighted gaps',
            'Leadership personal experience with cancer',
            'Keep up with industry standards and peer company practices',
            'Employee survey feedback',
            'Recruitment/retention goals or challenges',
            'Legal case or compliance issue',
            'Union negotiations',
            'ESG/corporate responsibility commitments',
            'Inspired by Working with Cancer Initiative or similar programs',
            'Other (specify)',
          ].map((opt) => (
            <OptionCard key={opt} selected={or2a.includes(opt)} onClick={() => toggle(setOr2a, opt)}>
              {opt}
            </OptionCard>
          ))}
          {or2a.includes('Other (specify)') && (
            <input
              type="text"
              value={otherOr2a}
              onChange={(e) => setOtherOr2a(e.target.value)}
              className="mt-2 w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              placeholder="Please specify"
            />
          )}
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            OR2b. What has been the single most impactful change your organization has made to support employees managing cancer or other serious health conditions? (Please be as specific and detailed as possible)
          </h2>
          <textarea
            value={or2b}
            onChange={(e) => setOr2b(e.target.value)}
            className="w-full h-32 px-3 py-2 border-2 border-gray-300 rounded-md"
            placeholder="Enter your response"
          />
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">OR3. What are the primary barriers preventing more comprehensive support for employees managing cancer or other serious health conditions?</h2>
          <p className="text-sm text-gray-600 mb-2">(Select ALL that apply)</p>
          {[
            'Budget constraints','Lack of executive support','Small number of cases doesnâ€™t justify investment',
            'Concerns about setting precedent','Limited HR and/or Benefits team bandwidth','Lack of expertise/knowledge',
            'Other priorities take precedence','Concerns about fairness across conditions','Uncertainty about ROI',
            'Data privacy concerns (HIPAA, GDPR, other regulations)','Complex/varying legal requirements across markets',
            'Global consistency challenges','Some other reason (specify)',
          ].map((opt) => (
            <OptionCard key={opt} selected={or3.includes(opt)} onClick={() => toggle(setOr3, opt)}>
              {opt}
            </OptionCard>
          ))}
          {or3.includes('Some other reason (specify)') && (
            <input
              type="text"
              value={otherOr3}
              onChange={(e) => setOtherOr3(e.target.value)}
              className="mt-2 w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              placeholder="Please specify"
            />
          )}
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            OR5a. What types of caregiver support does your organization provide to employees who have taken on primary caregiver responsibilities for someone managing cancer or another serious health condition?
          </h2>
          <p className="text-sm text-gray-600 mb-2">(Select ALL that apply)</p>
          {[
            'Flexible work schedules','Remote work options','Paid caregiver leave','Unpaid leave with job protection',
            'Employee assistance program (EAP) counseling','Caregiver support groups','Referrals to eldercare/dependent care resources',
            'Financial assistance or subsidies','Respite care coverage','Modified job duties/reduced workload',
            'Manager training on supporting caregivers','Emergency dependent care when regular arrangements unavailable',
            'Legal/financial planning resources','Some other support (specify)','Not able to provide caregiver support at this time',
          ].map((opt) => (
            <OptionCard key={opt} selected={or5a.includes(opt)} onClick={() => toggle(setOr5a, opt)}>
              {opt}
            </OptionCard>
          ))}
          {or5a.includes('Some other support (specify)') && (
            <input
              type="text"
              value={otherOr5a}
              onChange={(e) => setOtherOr5a(e.target.value)}
              className="mt-2 w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              placeholder="Please specify"
            />
          )}
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            OR6. How does your organization monitor the effectiveness of its workplace support programs while maintaining employee privacy?
          </h2>
          <p className="text-sm text-gray-600 mb-2">(Select ALL that apply)</p>
          {[
            'Aggregate metrics and analytics only','De-identified case tracking','General program utilization data',
            'Voluntary employee feedback/surveys','Some other approach (specify)','No systematic monitoring',
          ].map((opt) => (
            <OptionCard key={opt} selected={or6.includes(opt)} onClick={() => toggle(setOr6, opt)}>
              {opt}
            </OptionCard>
          ))}
          {or6.includes('Some other approach (specify)') && (
            <input
              type="text"
              value={otherOr6}
              onChange={(e) => setOtherOr6(e.target.value)}
              className="mt-2 w-full px-3 py-2 border-2 border-gray-300 rounded-md"
              placeholder="Please specify"
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header showBack />
      <main className="max-w-5xl mx-auto p-6 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Support Programs</h1>
        {steps[step].content}
        <div className="mt-8 flex justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep((prev) => prev - 1)}
              className="px-6 py-2 border rounded-md"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((prev) => prev + 1)}
              className="px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Next &rarr;
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Save & Return to Dashboard
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
