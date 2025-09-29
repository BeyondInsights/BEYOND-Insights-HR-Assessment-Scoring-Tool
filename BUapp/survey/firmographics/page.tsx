/* eslint-disable react/no-unescaped-entities */
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import OptionButton from "@/components/OptionButton"
import MultiOptionButton from "@/components/MultiOptionButton"
import { loadFromStorage, saveToStorage } from "@/lib/storage"
import type { AnswerMap } from "@/lib/types"

/* Title + helpers */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl md:text-2xl font-bold text-blue-700 mb-4">{children}</h2>
}
const Q = ({ children }: { children: React.ReactNode }) =>
  <p className="mb-1 text-base md:text-lg font-semibold text-black">{children}</p>
const Instr = ({ children }: { children: React.ReactNode }) =>
  <p className="mb-4 text-sm text-gray-600">{children}</p>

const ROW = {
  short: "auto-rows-[64px]",
  med:   "auto-rows-[100px]",
  long:  "auto-rows-[128px]",
}
const BTN_TEXT = "text-left text-sm md:text-base"

export default function CompanyProfilePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [ans, setAns] = useState<AnswerMap>(() => loadFromStorage<AnswerMap>("company_profile_data", {} as AnswerMap))
  useEffect(() => { saveToStorage("company_profile_data", ans) }, [ans])

  const setField = (k: string, v: AnswerMap[keyof AnswerMap]) => setAns(p => ({ ...p, [k]: v }))
  const setOther = (k: string, v: string) => setAns(p => ({ ...p, [`${k}_other`]: v }))

  const toggleMulti = (k: string, v: string, none?: string) =>
    setAns(p => {
      const cur = Array.isArray(p[k]) ? (p[k] as string[]) : []
      if (none && v === none) return { ...p, [k]: cur.includes(v) ? [] : [v] }
      const withoutNone = none ? cur.filter(x => x !== none) : cur
      return withoutNone.includes(v)
        ? { ...p, [k]: withoutNone.filter(x => x !== v) }
        : { ...p, [k]: [...withoutNone, v] }
    })

  const v = (s: number) => {
    switch (s) {
      case 1:
        if (!ans.birth_year) return "Enter birth year"
        if (!ans.identity) return "Select identity"
        if (ans.identity === "Prefer to self-describe (specify):" && !String(ans.identity_other ?? "").trim()) return "Please specify"
        return null
      case 2:
        if (!ans.department) return "Select department/function"
        if (ans.department === "Other (specify):" && !String(ans.department_other ?? "").trim()) return "Please specify"
        if (!ans.job_function) return "Select primary job function"
        if (ans.job_function === "Some other function (specify):" && !String(ans.job_function_other ?? "").trim()) return "Please specify"
        return null
      case 3:
        if (!ans.level) return "Select level"
        if (!Array.isArray(ans.resp_areas) || ans.resp_areas.length < 1) return "Select responsibilities"
        return null
      case 4: if (!ans.influence) return "Select influence"; return null
      case 5: if (!ans.org_size) return "Select organization size"; return null
      case 6:
        if (!ans.hq_country) return "Select headquarters country"
        if (!ans.other_countries) return "Select number of other countries"
        return null
      case 7:
        if (!ans.industry) return "Select industry"
        if (ans.industry === "Other industry / Services (specify)" && !String(ans.industry_other ?? "").trim()) return "Please specify"
        return null
      case 8:
        if (!ans.benefit_elig) return "Select workforce % eligible"
        if (!Array.isArray(ans.excluded_groups) || ans.excluded_groups.length < 1) return "Select excluded groups"
        if ((ans.excluded_groups as string[]).includes("Some other employee group (specify)") && !String(ans.excluded_groups_other ?? "").trim()) return "Please specify"
        return null
      case 9:
        if (!ans.revenue) return "Select annual revenue"
        if (!ans.remote_policy) return "Select remote/hybrid approach"
        return null
      default: return null
    }
  }

  const next = () => { const e = v(step); if (e) { alert(e); return } setStep(step + 1) }
  const back = () => setStep(s => s - 1)

  const S2   = ["Male","Female","Non-binary","Prefer to self-describe (specify):","Prefer not to say"]
  const S4A  = ["Accounting or Finance","Benefits","Communications / Public Relations","Customer Service / Customer Success","Human Resources / People Operations","Information Technology (IT)","Legal / Compliance","Logistics / Supply Chain","Manufacturing","Marketing","Research and Development","Sales / Business Development","Other (specify):"]
  const S4B  = ["Human Resources","Benefits / Compensation","People & Culture","Talent Management","Some other function (specify):","Other"]
  const S5   = ["C-level executive (CHRO, CPO)","Executive/Senior Vice President","Vice President","Director","Senior Manager","Manager","HR Generalist","Benefits Specialist / Coordinator","HR Specialist / Coordinator","HR Assistant / Administrative","Other"]
  const S6   = ["Employee benefits selection / updates","Leave policies (FMLA, STD, LTD)","Employee health & wellness programs","Workplace accommodations and adjustments","Manager training & development","Employee assistance programs (EAP)","Workers' compensation","Organizational culture initiatives","Wellness initiatives","Flexible work arrangements"]
  const S7   = ["Primary decision maker","Part of decision-making team","Make recommendations that are usually adopted","Provide input but limited influence","No influence"]
  const S8   = ["Fewer than 100","100-249","250-499","500-999","1,000-2,499","2,500-4,999","5,000-9,999","10,000-24,999","25,000-49,999","50,000+"]
  const S9_NA= ["United States","Canada","Mexico"]
  const S9_LAC=["Brazil","Argentina","Chile","Colombia","Other Latin American / Caribbean country (specify)"]
  const S9_EU= ["United Kingdom","Germany","France","Netherlands","Switzerland","Italy","Spain","Sweden","Other European country (specify)"]
  const S9_MEA=["United Arab Emirates","Saudi Arabia","Israel","South Africa","Nigeria","Kenya","Egypt","Other Middle Eastern country (specify)","Other African country (specify)"]
  const S9_APAC=["China","Japan","India","Singapore","Australia","South Korea","Other Asia Pacific country (specify)"]
  const S9A  = ["No other countries - headquarters only","1 to 2 other countries","3 to 4 other countries","5 to 9 other countries","10 to 19 other countries","20 to 49 other countries","50 or more countries"]
  const C2   = ["Agriculture, Forestry, Fishing and Hunting","Construction","Manufacturing","Mining, Quarrying, and Oil and Gas Extraction","Retail Trade","Transportation and Warehousing","Utilities","Wholesale Trade","Accommodation and Food Services","Arts, Entertainment, and Recreation","Educational Services","Finance and Insurance","Healthcare, Pharmaceuticals & Life Sciences","Hospitality & Tourism","Media & Publishing (TV, Radio, Digital, News, Streaming)","Professional & Business Services (Legal, Consulting, Accounting, Marketing)","Real Estate and Rental and Leasing","Scientific & Technical Services (Engineering, R&D, Architecture, Labs)","IT Services & Technology Consulting","Software & Technology Products","Social Media & Digital Platforms","Telecommunications & Internet Services","Government / Public Administration","Non-profit/NGO","Other industry / Services (specify)"]
  const C3   = ["All employees (100%)","Most employees (75-99%)","Many employees (50-74%)","Some employees (25-49%)","Few employees (<25%)","Varies significantly by location"]
  const C3A_NONE = "None - all employees eligible"
  const C3A  = ["Part-time employees","Contract/temporary workers","Employees in certain countries/regions","Employees below certain tenure","Certain job levels/categories", C3A_NONE, "Some other employee group (specify)"]
  const C4   = ["Less than $10 million","$10-49 million","$50-99 million","$100-499 million","$500-999 million","$1 billion or more","Not applicable (non-profit/government)"]
  const C6   = ["Fully flexible - Most roles can be remote/hybrid by employee choice","Selectively flexible - Many roles eligible based on job requirements","Limited flexibility - Some roles eligible but most require on-site presence","Minimal flexibility - Very few roles eligible for remote/hybrid","No flexibility - All employees required on-site","Varies significantly by location/business unit"]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8 flex-1">
        <SectionHeader>Company Profile</SectionHeader>

        {step === 1 && (
          <div className="space-y-10">
            <div>
              <Q>In what year were you born?</Q>
              <Instr>(Enter YYYY)</Instr>
              <input
                type="number"
                value={String(ans.birth_year ?? "")}
                onChange={(e) => setField("birth_year", e.target.value)}
                className="w-40 px-3 py-2 border-2 rounded-lg text-base"
              />
            </div>

            <div>
              <Q>How do you currently identify?</Q>
              <Instr>(Select ONE)</Instr>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch ${ROW.short}`}>
                {S2.map(opt => (
                  <div key={opt} className="space-y-2">
                    <OptionButton
                      field="identity"
                      value={opt}
                      selected={ans.identity === opt}
                      onClick={() => setField("identity", opt)}
                      className={BTN_TEXT}
                    />
                    {ans.identity === "Prefer to self-describe (specify):" && opt === "Prefer to self-describe (specify):" && (
                      <input
                        className="w-full border-2 rounded-lg px-3 py-2 text-sm md:text-base"
                        placeholder="Please specify"
                        value={String(ans.identity_other ?? "")}
                        onChange={(e) => setOther("identity", e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-12">
            <div>
              <Q>Which department or function do you currently work in?</Q>
              <Instr>(Select ONE)</Instr>
              <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.med}`}>
                {S4A.map(opt => (
                  <OptionButton key={opt} field="department" value={opt}
                    selected={ans.department === opt} onClick={() => setField("department", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>
              {ans.department === "Other (specify):" && (
                <input
                  className="mt-3 w-full border-2 rounded-lg px-3 py-2 text-sm md:text-base"
                  placeholder="Please specify"
                  value={String(ans.department_other ?? "")}
                  onChange={(e) => setOther("department", e.target.value)}
                />
              )}
            </div>

            <div>
              <Q>Which best describes your primary job function?</Q>
              <Instr>(Select ONE)</Instr>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch ${ROW.med}`}>
                {S4B.map(opt => (
                  <div key={opt} className="space-y-2">
                    <OptionButton field="job_function" value={opt}
                      selected={ans.job_function === opt} onClick={() => setField("job_function", opt)}
                      className={BTN_TEXT} />
                    {ans.job_function === "Some other function (specify):" && opt === "Some other function (specify):" && (
                      <input
                        className="w-full border-2 rounded-lg px-3 py-2 text-sm md:text-base"
                        placeholder="Please specify"
                        value={String(ans.job_function_other ?? "")}
                        onChange={(e) => setOther("job_function", e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-12">
            <div>
              <Q>What is your current level within the organization?</Q>
              <Instr>(Select ONE)</Instr>
              <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.med}`}>
                {S5.map(opt => (
                  <OptionButton key={opt} field="level" value={opt}
                    selected={ans.level === opt} onClick={() => setField("level", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>
            </div>

            <div>
              <Q>Which areas fall under your responsibility or influence?</Q>
              <Instr>(Select ALL that apply)</Instr>
              <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.med}`}>
                {S6.map(opt => (
                  <MultiOptionButton key={opt} field="resp_areas" value={opt}
                    selected={Array.isArray(ans.resp_areas) && ans.resp_areas.includes(opt)}
                    onClick={() => toggleMulti("resp_areas", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <Q>How much influence do you have on employee benefits decisions?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch ${ROW.short}`}>
              {S7.map(opt => (
                <OptionButton key={opt} field="influence" value={opt}
                  selected={ans.influence === opt} onClick={() => setField("influence", opt)}
                  className={BTN_TEXT} />
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <Q>Approximately how many total employees work at your organization (all locations)?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.short}`}>
              {S8.map(opt => (
                <OptionButton key={opt} field="org_size" value={opt}
                  selected={ans.org_size === opt} onClick={() => setField("org_size", opt)}
                  className={BTN_TEXT} />
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-12">
            <div>
              <Q>In which country is your organization's headquarters located?</Q>
              <Instr>(Select ONE)</Instr>

              <p className="text-blue-700 font-semibold mt-1 mb-1">North America</p>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 items-stretch ${ROW.short}`}>
                {S9_NA.map(opt => (
                  <OptionButton key={opt} field="hq_country" value={opt}
                    selected={ans.hq_country === opt} onClick={() => setField("hq_country", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>

              <p className="text-blue-700 font-semibold mt-4 mb-1">Latin America & Caribbean</p>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 items-stretch ${ROW.short}`}>
                {S9_LAC.map(opt => (
                  <OptionButton key={opt} field="hq_country" value={opt}
                    selected={ans.hq_country === opt} onClick={() => setField("hq_country", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>

              <p className="text-blue-700 font-semibold mt-4 mb-1">Europe</p>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 items-stretch ${ROW.short}`}>
                {S9_EU.map(opt => (
                  <OptionButton key={opt} field="hq_country" value={opt}
                    selected={ans.hq_country === opt} onClick={() => setField("hq_country", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>

              <p className="text-blue-700 font-semibold mt-4 mb-1">Middle East & Africa</p>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 items-stretch ${ROW.short}`}>
                {S9_MEA.map(opt => (
                  <OptionButton key={opt} field="hq_country" value={opt}
                    selected={ans.hq_country === opt} onClick={() => setField("hq_country", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>

              <p className="text-blue-700 font-semibold mt-4 mb-1">Asia Pacific</p>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 items-stretch ${ROW.short}`}>
                {S9_APAC.map(opt => (
                  <OptionButton key={opt} field="hq_country" value={opt}
                    selected={ans.hq_country === opt} onClick={() => setField("hq_country", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>
            </div>

            <div>
              <Q>Besides your headquarters location, in how many other countries does your organization have offices or operations?</Q>
              <Instr>(Select ONE)</Instr>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch ${ROW.short}`}>
                {S9A.map(opt => (
                  <OptionButton key={opt} field="other_countries" value={opt}
                    selected={ans.other_countries === opt} onClick={() => setField("other_countries", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div>
            <Q>Which best describes your organization's industry?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.long}`}>
              {C2.map(opt => (
                <div key={opt} className="space-y-2">
                  <OptionButton field="industry" value={opt}
                    selected={ans.industry === opt} onClick={() => setField("industry", opt)}
                    className={BTN_TEXT} />
                  {ans.industry === "Other industry / Services (specify)" && opt === "Other industry / Services (specify)" && (
                    <input
                      className="w-full border-2 rounded-lg px-3 py-2 text-sm md:text-base"
                      placeholder="Please specify"
                      value={String(ans.industry_other ?? "")}
                      onChange={(e) => setOther("industry", e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-12">
            <div>
              <Q>Approximately what percentage of your workforce is eligible for standard employee benefits (health insurance, paid leave, etc.)?</Q>
              <Instr>(Select ONE)</Instr>
              <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.short}`}>
                {C3.map(opt => (
                  <OptionButton key={opt} field="benefit_elig" value={opt}
                    selected={ans.benefit_elig === opt} onClick={() => setField("benefit_elig", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>
            </div>

            <div>
              <Q>Which employee groups are typically excluded from workplace support benefits?</Q>
              <Instr>(Select ALL that apply)</Instr>
              <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.med}`}>
                {C3A.map(opt => (
                  <div key={opt} className="space-y-2">
                    <MultiOptionButton field="excluded_groups" value={opt}
                      selected={Array.isArray(ans.excluded_groups) && ans.excluded_groups.includes(opt)}
                      onClick={() => toggleMulti("excluded_groups", opt, C3A_NONE)}
                      className={BTN_TEXT} />
                    {Array.isArray(ans.excluded_groups) && ans.excluded_groups.includes("Some other employee group (specify)") && opt === "Some other employee group (specify)" && (
                      <input
                        className="w-full border-2 rounded-lg px-3 py-2 text-sm md:text-base"
                        placeholder="Please specify"
                        value={String(ans.excluded_groups_other ?? "")}
                        onChange={(e) => setOther("excluded_groups", e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="space-y-12">
            <div>
              <Q>What is your organization's approximate annual revenue?</Q>
              <Instr>(Select ONE)</Instr>
              <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.short}`}>
                {C4.map(opt => (
                  <OptionButton key={opt} field="revenue" value={opt}
                    selected={ans.revenue === opt} onClick={() => setField("revenue", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>
            </div>

            <div>
              <Q>Which best describes your organization's approach to remote/hybrid work?</Q>
              <Instr>(Select ONE)</Instr>
              <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch ${ROW.long}`}>
                {C6.map(opt => (
                  <OptionButton key={opt} field="remote_policy" value={opt}
                    selected={ans.remote_policy === opt} onClick={() => setField("remote_policy", opt)}
                    className={BTN_TEXT} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 10 && (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Youâ€™ve completed the <span className="text-blue-700 font-bold">Company Profile</span> section.
            </h2>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold"
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
          {step < 10 && (
            <button onClick={next} className="px-8 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold">
              Next &rarr;
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

