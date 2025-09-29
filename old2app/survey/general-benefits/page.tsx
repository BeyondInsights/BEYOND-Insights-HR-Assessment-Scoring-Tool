/* eslint-disable react/no-unescaped-entities */
"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import MultiOptionButton from "@/components/MultiOptionButton"
import { loadFromStorage, saveToStorage } from "@/lib/storage"
import type { AnswerMap } from "@/lib/types"

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl md:text-2xl font-bold text-blue-700 mb-4">{children}</h2>
}
const Q = ({ children }: { children: React.ReactNode }) =>
  <p className="mb-1 text-base md:text-lg font-semibold text-black">{children}</p>
const Instr = ({ children }: { children: React.ReactNode }) =>
  <p className="mb-4 text-sm text-gray-600">{children}</p>

const ROW = {
  med:   "auto-rows-[100px]",
  long:  "auto-rows-[128px]",
}
const BTN_TEXT = "text-left text-sm md:text-base"

export default function GeneralBenefitsPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [ans, setAns] = useState<AnswerMap>(() => loadFromStorage<AnswerMap>("general_benefits_data", {} as AnswerMap))
  useEffect(() => { saveToStorage("general_benefits_data", ans) }, [ans])

  const setField = (k: string, v: AnswerMap[keyof AnswerMap]) => setAns(p => ({ ...p, [k]: v }))
  const toggleMulti = (k: string, v: string) =>
    setAns(p => {
      const cur = Array.isArray(p[k]) ? (p[k] as string[]) : []
      const NONE = "None of these"
      if (v === NONE) return { ...p, [k]: cur.includes(NONE) ? [] : [NONE] }
      const withoutNone = cur.filter(x => x !== NONE)
      return withoutNone.includes(v)
        ? { ...p, [k]: withoutNone.filter(x => x !== v) }
        : { ...p, [k]: [...withoutNone, v] }
    })

  const v = (s: number) => {
    switch (s) {
      case 2: if (!Array.isArray(ans.cb1_standard) || ans.cb1_standard.length < 1) return "Select at least one."; return null
      case 3: if (!Array.isArray(ans.cb1_leave)    || ans.cb1_leave.length    < 1) return "Select at least one."; return null
      case 4: if (!Array.isArray(ans.cb1_wellness) || ans.cb1_wellness.length < 1) return "Select at least one."; return null
      case 5: if (!Array.isArray(ans.cb1_financial)|| ans.cb1_financial.length< 1) return "Select at least one."; return null
      case 6: if (!Array.isArray(ans.cb1_special)  || ans.cb1_special.length  < 1) return "Select at least one."; return null
      case 7: {
        const v = String(ans.cb1a ?? "").trim()
        if (v === "" || isNaN(Number(v)) || Number(v) < 0 || Number(v) > 100) return "Enter a % between 0 and 100."
        return null
      }
      case 8: if (!Array.isArray(ans.cb2b) || ans.cb2b.length < 1) return "Select at least one."; return null
      default: return null
    }
  }

  const next = () => { const e = v(step); if (e) { alert(e); return } setStep(step + 1) }
  const back = () => setStep(s => s - 1)

  const CB1_STANDARD = [
    "Health insurance (Employer-provided or supplemental to national coverage)",
    "Dental insurance (Employer-provided or supplemental to national coverage)",
    "Vision insurance (Employer-provided or supplemental to national coverage)",
    "Life insurance",
    "Short-term disability (or temporary incapacity benefits)",
    "Long-term disability (or income protection)",
    "Paid time off (PTO/vacation)",
    "Sick days (separate from PTO and legally mandated sick leave)",
    "None of these",
  ]
  const CB1_LEAVE = [
    "Paid family/medical leave beyond legal requirements",
    "Flexible work schedules",
    "Remote work options",
    "Job sharing programs",
    "Phased retirement",
    "Sabbatical programs",
    "Dedicated caregiver leave (separate from family leave)",
    "None of these",
  ]
  const CB1_WELLNESS = [
    "Employee assistance program (EAP)",
    "Physical wellness programs (fitness, nutrition, ergonomics)",
    "Mental wellness programs (stress management, mindfulness, resilience)",
    "On-site health services",
    "Mental health resources (therapy, counseling)",
    "Caregiving support resources",
    "Tailored support programs for employees managing cancer or other serious health conditions",
    "None of these",
  ]
  const CB1_FINANCIAL = [
    "Financial counseling/planning",
    "Student loan assistance",
    "Identity theft protection",
    "Legal assistance/services (will preparation, family law, medical directives)",
    "None of these",
  ]
  const CB1_SPECIAL = [
    "Care coordination for complex conditions",
    "Second opinion services or facilitation",
    "Specialized treatment center networks",
    "Travel support for specialized care",
    "Clinical guidance and navigation",
    "Medication access and affordability programs",
    "None of these",
  ]
  const CB2B = [
    ...new Set([
      ...CB1_STANDARD.slice(0, -1),
      ...CB1_LEAVE.slice(0, -1),
      ...CB1_WELLNESS.slice(0, -1),
      ...CB1_FINANCIAL.slice(0, -1),
      ...CB1_SPECIAL.slice(0, -1),
    ]),
    "None of these",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8 flex-1">
        <SectionHeader>General Employee Benefits</SectionHeader>

        {step === 1 && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-base text-gray-800 space-y-4">
    <h3 className="text-blue-700 font-bold">GUIDELINES FOR MULTI-COUNTRY ORGANIZATIONS:</h3>

    <p>We recognize the complexity of reporting on programs that vary across countries. To keep this survey manageable while capturing meaningful differences, we've structured questions in two ways:</p>

    <p className="font-bold">Why we distinguish between US and other markets for select questions:</p>
    <p>Healthcare and leave policies function fundamentally differently across countries. In the US, employers typically provide primary healthcare coverage and paid leave, while other countries often have robust national healthcare and statutory leave requirements. To fairly evaluate your organization's commitment to going above and beyond, we need to understand what you provide relative to these different baselines. This approach ensures companies are recognized for their true investment in employee support, regardless of their geographic footprint.</p>

    <p className="font-bold">Most questions ask for your global approach</p>
    <p>These cover universal areas like manager training, navigation services, or communication methods that can be standardized across markets.</p>

    <p className="font-bold">Select questions distinguish between US and other markets</p>
    <p>These appear only where healthcare systems or legal requirements create meaningful differences that affect how your programs are evaluated:</p>
    <ul className="list-disc ml-6">
      <li>Medical leave policies (FMLA vs. statutory sick leave)</li>
      <li>Disability insurance (employer-provided vs. government)</li>
      <li>Health insurance continuation during leave</li>
      <li>Job protection beyond legal requirements</li>
    </ul>

    <p className="font-bold">For these questions, please report:</p>
    <ul className="list-disc ml-6">
      <li>US operations: All US-based employees</li>
      <li>Other markets: Your most common approach outside the US</li>
    </ul>

    <p className="font-bold">How to respond when programs vary:</p>
    <ul className="list-disc ml-6">
      <li>Report on benefits available to 80%+ of employees in each category</li>
      <li>If you have a global standard policy, report that standard</li>
      <li>For "beyond legal requirements" questions, calculate based on what you provide above the minimum in each market</li>
    </ul>
  </div>
)}

        {step === 2 && (
          <div>
            <Q>Which of the following standard benefits does your organization currently provide?</Q>
            <Instr>(Select ALL that apply)</Instr>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.med}`}>
              {CB1_STANDARD.map(opt => (
                <MultiOptionButton key={opt} field="cb1_standard" value={opt}
                  selected={Array.isArray(ans.cb1_standard) && ans.cb1_standard.includes(opt)}
                  onClick={() => toggleMulti("cb1_standard", opt)}
                  className={BTN_TEXT} />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <Q>Which of the following leave and flexibility programs are provided?</Q>
            <Instr>(Select ALL that apply)</Instr>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.med}`}>
              {CB1_LEAVE.map(opt => (
                <MultiOptionButton key={opt} field="cb1_leave" value={opt}
                  selected={Array.isArray(ans.cb1_leave) && ans.cb1_leave.includes(opt)}
                  onClick={() => toggleMulti("cb1_leave", opt)}
                  className={BTN_TEXT} />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <Q>Which of the following wellness and support programs are provided?</Q>
            <Instr>(Select ALL that apply)</Instr>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.med}`}>
              {CB1_WELLNESS.map(opt => (
                <MultiOptionButton key={opt} field="cb1_wellness" value={opt}
                  selected={Array.isArray(ans.cb1_wellness) && ans.cb1_wellness.includes(opt)}
                  onClick={() => toggleMulti("cb1_wellness", opt)}
                  className={BTN_TEXT} />
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <Q>Which of the following financial and legal assistance programs are provided?</Q>
            <Instr>(Select ALL that apply)</Instr>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.med}`}>
              {CB1_FINANCIAL.map(opt => (
                <MultiOptionButton key={opt} field="cb1_financial" value={opt}
                  selected={Array.isArray(ans.cb1_financial) && ans.cb1_financial.includes(opt)}
                  onClick={() => toggleMulti("cb1_financial", opt)}
                  className={BTN_TEXT} />
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <Q>Which of the following specialized medical support programs are provided?</Q>
            <Instr>(Select ALL that apply)</Instr>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.long}`}>
              {CB1_SPECIAL.map(opt => (
                <MultiOptionButton key={opt} field="cb1_special" value={opt}
                  selected={Array.isArray(ans.cb1_special) && ans.cb1_special.includes(opt)}
                  onClick={() => toggleMulti("cb1_special", opt)}
                  className={BTN_TEXT} />
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div>
            <Q>What percentage of your employees have access to healthcare through national or government systems (rather than employer-provided insurance)?</Q>
            <Instr>(Enter whole number)</Instr>
            <input
              type="number"
              value={String(ans.cb1a ?? "")}
              onChange={(e) => setField("cb1a", e.target.value)}
              className="w-32 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="%"
            />
          </div>
        )}

        {step === 8 && (
          <div>
            <Q>Over the next 2 years, which, if any, of the following programs does your organization plan to roll out?</Q>
            <Instr>(Select ALL that apply)</Instr>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.long}`}>
              {CB2B.map(opt => (
                <MultiOptionButton key={opt} field="cb2b" value={opt}
                  selected={Array.isArray(ans.cb2b) && ans.cb2b.includes(opt)}
                  onClick={() => toggleMulti("cb2b", opt)}
                  className={BTN_TEXT} />
              ))}
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              You’ve completed the <span className="text-blue-700 font-bold">General Employee Benefits</span> section.
            </h2>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold"
            >
              Save & Continue &rarr;
            </button>
          </div>
        )}

        <div className="flex justify-between mt-10">
          {step > 1 ? (
            <button onClick={back} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Back</button>
          ) : (
            <button onClick={() => router.push("/dashboard")} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Back to Dashboard</button>
          )}
          {step < 9 && (
            <button onClick={next} className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold">
              Next &rarr;
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}



