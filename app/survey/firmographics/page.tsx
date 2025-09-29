/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OptionButton from "@/components/OptionButton";
import MultiOptionButton from "@/components/MultiOptionButton";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import type { AnswerMap } from "@/lib/types";

/* ---------- Shared UI helpers ---------- */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl md:text-2xl font-bold text-blue-700 mb-4">{children}</h2>;
}

const Q = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1 text-base md:text-lg font-bold text-black">{children}</p>
);

const Instr = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 text-sm text-gray-600">{children}</p>
);

function ErrorToast({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 animate-pulse">
      <span className="font-semibold">Please correct:</span>
      <span>{message}</span>
    </div>
  );
}

/* Tile styling */
const ROW = {
  short: "auto-rows-[64px]",
  med: "auto-rows-[88px]",
  long: "auto-rows-[112px]",
};

/* Custom Option Button for normal weight text */
function PlainOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md
        ${selected 
          ? 'bg-blue-50 border-blue-500 shadow-lg transform scale-105' 
          : 'bg-white border-gray-300 hover:border-gray-400'}`}
    >
      <span className="text-sm md:text-base font-normal">{label}</span>
    </button>
  );
}

/* ---------- Main Component ---------- */
export default function CompanyProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [ans, setAns] = useState<AnswerMap>(() =>
    loadFromStorage<AnswerMap>("company_profile_data", {} as AnswerMap)
  );
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    saveToStorage("company_profile_data", ans);
  }, [ans]);

  const setField = (k: string, v: AnswerMap[keyof AnswerMap]) =>
    setAns((p) => ({ ...p, [k]: v }));

  const toggleMulti = (k: string, v: string, none?: string) =>
    setAns((p) => {
      const cur = Array.isArray(p[k]) ? (p[k] as string[]) : [];
      if (none && v === none) return { ...p, [k]: cur.includes(v) ? [] : [v] };
      const withoutNone = none ? cur.filter((x) => x !== none) : cur;
      return withoutNone.includes(v)
        ? { ...p, [k]: withoutNone.filter((x) => x !== v) }
        : { ...p, [k]: [...withoutNone, v] };
    });

  /* ----- Response Lists ----- */
  const S2 = ["Male", "Female", "Non-binary", "Prefer to self-describe", "Prefer not to say"];
  
  const S4A = [
    "Accounting or Finance", "Benefits", "Communications / Public Relations",
    "Customer Service / Customer Success", "Human Resources / People Operations",
    "Information Technology (IT)", "Legal / Compliance", "Logistics / Supply Chain",
    "Manufacturing", "Marketing", "Research and Development",
    "Sales / Business Development", "Other (specify)"
  ];
  
  const S4B = [
    "Human Resources", "Benefits / Compensation", "People & Culture",
    "Talent Management", "Some other function (specify)"
  ];
  
  const S5 = [
    "C-level executive (CHRO, CPO)", "Executive/Senior Vice President",
    "Vice President", "Director", "Senior Manager", "Manager",
    "HR Generalist", "Benefits Specialist / Coordinator",
    "HR Specialist / Coordinator", "HR Assistant / Administrative",
    "Some other level (specify)"
  ];
  
  const S6 = [
    "Employee benefits selection / updates", "Leave policies (FMLA, STD, LTD)",
    "Employee health & wellness programs", "Workplace accommodations and adjustments",
    "Manager training & development", "Employee assistance programs (EAP)",
    "Workers' compensation", "Organizational culture initiatives",
    "Wellness initiatives", "Flexible work arrangements", "None of these"
  ];
  
  const S7 = [
    "Primary decision maker", "Part of decision-making team",
    "Make recommendations that are usually adopted",
    "Provide input but limited influence", "No influence"
  ];
  
  const S8 = [
    "Fewer than 100", "100-249", "250-499", "500-999", "1,000-2,499",
    "2,500-4,999", "5,000-9,999", "10,000-24,999", "25,000-49,999", "50,000+"
  ];

  // Full country list (abbreviated for space - you'd include all)
  const COUNTRIES = [
    "United States", "Canada", "Mexico", "United Kingdom", "Germany", "France", 
    "Spain", "Italy", "Netherlands", "Belgium", "Switzerland", "Austria",
    "Sweden", "Norway", "Denmark", "Finland", "Poland", "Czech Republic",
    "Australia", "New Zealand", "Japan", "China", "India", "Singapore",
    "South Korea", "Brazil", "Argentina", "Chile", "Colombia", "South Africa"
    // Add all countries...
  ];

  const S9A = ["0", "1-5", "6-10", "11-25", "26-50", "50+"];

  const C2 = [
    "Agriculture", "Automotive", "Biotechnology", "Construction", "Consulting",
    "Consumer Goods", "Education", "Energy", "Entertainment", "Financial Services",
    "Food & Beverage", "Government", "Healthcare", "Hospitality", "Insurance",
    "Legal", "Manufacturing", "Media", "Non-profit", "Pharmaceuticals",
    "Professional Services", "Real Estate", "Retail", "Technology",
    "Telecommunications", "Transportation", "Utilities", "Other (specify)"
  ];

  const C3A = [
    "Full-time employees only", "Part-time employees (30+ hours)",
    "Contract/temporary workers", "Seasonal workers", "Interns",
    "Some other employee group (specify)", "None - all employees eligible"
  ];

  const C4 = [
    "Less than $10 million", "$10-50 million", "$50-100 million",
    "$100-500 million", "$500 million - $1 billion", "$1-5 billion",
    "$5-10 billion", "$10+ billion", "Non-profit/Not applicable"
  ];

  const C6 = [
    "Fully in-office", "Mostly in-office (1-2 days remote allowed)",
    "Hybrid (3 days in-office required)", "Hybrid (1-2 days in-office required)",
    "Fully remote", "Employee choice", "Varies by role"
  ];

  /* ----- Validation ----- */
  const validate = (s: number) => {
    setErrMsg(""); // Clear previous errors
    
    switch (s) {
      case 1:
        if (!ans.s1) return "Enter birth year";
        const year = parseInt(ans.s1 as string);
        if (isNaN(year) || year < 1920 || year > 2010) return "Enter valid birth year";
        if (!ans.s2) return "Select identity";
        if (ans.s2 === "Prefer to self-describe" && !String(ans.s2_other ?? "").trim())
          return "Please specify how you identify";
        return null;
        
      case 2:
        if (!ans.s4a) return "Select department/function";
        if (ans.s4a === "Other (specify)" && !String(ans.s4a_other ?? "").trim())
          return "Please specify department";
        if (!ans.s4b) return "Select primary job function";
        if (ans.s4b === "Some other function (specify)" && !String(ans.s4b_other ?? "").trim())
          return "Please specify function";
        return null;
        
      case 3:
        if (!ans.s5) return "Select level";
        if (ans.s5 === "Some other level (specify)" && !String(ans.s5_other ?? "").trim())
          return "Please specify level";
        // Allow "None of these" as valid selection
        if (Array.isArray(ans.s6) && ans.s6.includes("None of these")) return null;
        if (!Array.isArray(ans.s6) || ans.s6.length < 1) return "Select responsibilities";
        return null;
        
      case 4:
        if (!ans.s7) return "Select influence level";
        return null;
        
      case 5:
        if (!ans.s8) return "Select organization size";
        return null;
        
      case 6:
        if (!ans.s9) return "Select headquarters country";
        if (!ans.s9a) return "Select number of other countries";
        return null;
        
      case 7:
        if (!ans.c2) return "Select industry";
        if (ans.c2 === "Other (specify)" && !String(ans.c2_other ?? "").trim())
          return "Please specify industry";
        return null;
        
      case 8:
        if (!ans.c3) return "Enter percentage eligible";
        const pct = parseInt(ans.c3 as string);
        if (isNaN(pct) || pct < 0 || pct > 100) return "Enter valid percentage (0-100)";
        // Allow "None - all employees eligible" as valid
        if (Array.isArray(ans.c3a) && ans.c3a.includes("None - all employees eligible")) return null;
        if (!Array.isArray(ans.c3a) || ans.c3a.length < 1) return "Select excluded groups";
        if (Array.isArray(ans.c3a) && 
            ans.c3a.includes("Some other employee group (specify)") && 
            !String(ans.c3a_other ?? "").trim())
          return "Please specify employee group";
        return null;
        
      case 9:
        if (!ans.c4) return "Select annual revenue";
        if (!ans.c6) return "Select remote work approach";
        return null;
        
      default:
        return null;
    }
  };

  const next = () => {
    const e = validate(step);
    if (e) {
      setErrMsg(e);
      return;
    }
    setErrMsg("");
    setStep(step + 1);
  };

  const back = () => {
    setErrMsg("");
    setStep(s => s - 1);
  };

  // Progress indicator
  const progress = Math.round((step / 10) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-1">
        <div 
          className="bg-blue-600 h-1 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-10">
        <SectionHeader>Company Profile</SectionHeader>

        {/* Step 1: Birth Year & Gender */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <Q>In what year were you born?</Q>
            <Instr>(Enter 4-digit year)</Instr>
            <input
              type="text"
              value={ans.s1 || ""}
              onChange={(e) => setField("s1", e.target.value)}
              className="w-32 px-4 py-2 border-2 border-gray-300 rounded-lg mb-6 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="YYYY"
              maxLength={4}
            />

            <Q>How do you currently identify?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${ROW.short}`}>
              {S2.map((opt) => (
                <div key={opt}>
                  <PlainOption
                    label={opt}
                    selected={ans.s2 === opt}
                    onClick={() => setField("s2", opt)}
                  />
                  {ans.s2 === "Prefer to self-describe" && opt === "Prefer to self-describe" && (
                    <input
                      type="text"
                      value={ans.s2_other || ""}
                      onChange={(e) => setField("s2_other", e.target.value)}
                      className="mt-2 w-full px-4 py-2 border-2 border-blue-500 rounded-lg focus:outline-none"
                      placeholder="Please specify..."
                    />
                  )}
                </div>
              ))}
            </div>
            {errMsg && <ErrorToast message={errMsg} />}
          </div>
        )}

        {/* Step 2: Department & Function */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <Q>Which <span className="text-blue-700">department or function</span> do you currently work in?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${ROW.med} mb-6`}>
              {S4A.map((opt) => (
                <div key={opt}>
                  <PlainOption
                    label={opt}
                    selected={ans.s4a === opt}
                    onClick={() => setField("s4a", opt)}
                  />
                  {ans.s4a === "Other (specify)" && opt === "Other (specify)" && (
                    <input
                      type="text"
                      value={ans.s4a_other || ""}
                      onChange={(e) => setField("s4a_other", e.target.value)}
                      className="mt-2 w-full px-4 py-2 border-2 border-blue-500 rounded-lg focus:outline-none"
                      placeholder="Please specify..."
                    />
                  )}
                </div>
              ))}
            </div>

            <Q>Which best describes your <span className="text-blue-700">primary job function</span>?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${ROW.short}`}>
              {S4B.map((opt) => (
                <div key={opt}>
                  <PlainOption
                    label={opt}
                    selected={ans.s4b === opt}
                    onClick={() => setField("s4b", opt)}
                  />
                  {ans.s4b === "Some other function (specify)" && opt === "Some other function (specify)" && (
                    <input
                      type="text"
                      value={ans.s4b_other || ""}
                      onChange={(e) => setField("s4b_other", e.target.value)}
                      className="mt-2 w-full px-4 py-2 border-2 border-blue-500 rounded-lg focus:outline-none"
                      placeholder="Please specify..."
                    />
                  )}
                </div>
              ))}
            </div>
            {errMsg && <ErrorToast message={errMsg} />}
          </div>
        )}

        {/* Step 3: Level & Responsibilities */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <Q>What is your <span className="text-blue-700">current level</span> within the organization?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${ROW.med} mb-6`}>
              {S5.map((opt) => (
                <div key={opt}>
                  <PlainOption
                    label={opt}
                    selected={ans.s5 === opt}
                    onClick={() => setField("s5", opt)}
                  />
                  {ans.s5 === "Some other level (specify)" && opt === "Some other level (specify)" && (
                    <input
                      type="text"
                      value={ans.s5_other || ""}
                      onChange={(e) => setField("s5_other", e.target.value)}
                      className="mt-2 w-full px-4 py-2 border-2 border-blue-500 rounded-lg focus:outline-none"
                      placeholder="Please specify..."
                    />
                  )}
                </div>
              ))}
            </div>

            <Q>Which areas fall under your <span className="text-blue-700">responsibility or influence</span>?</Q>
            <Instr>(Select ALL that apply)</Instr>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${ROW.med}`}>
              {S6.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleMulti("s6", opt, "None of these")}
                  className={`px-4 py-3 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md
                    ${Array.isArray(ans.s6) && ans.s6.includes(opt)
                      ? 'bg-blue-50 border-blue-500 shadow-lg transform scale-105' 
                      : 'bg-white border-gray-300 hover:border-gray-400'}`}
                >
                  <span className={`text-sm md:text-base ${opt === "None of these" ? 'font-normal italic text-gray-600' : 'font-normal'}`}>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
            {errMsg && <ErrorToast message={errMsg} />}
          </div>
        )}

        {/* Step 4: Influence */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <Q>How much influence do you have on <span className="text-blue-700">employee benefits decisions</span>?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-1 gap-3 ${ROW.short}`}>
              {S7.map((opt) => (
                <PlainOption
                  key={opt}
                  label={opt}
                  selected={ans.s7 === opt}
                  onClick={() => setField("s7", opt)}
                />
              ))}
            </div>
            {errMsg && <ErrorToast message={errMsg} />}
          </div>
        )}

        {/* Step 5: Organization Size */}
        {step === 5 && (
          <div className="animate-fadeIn">
            <Q>Approximately how many <span className="text-blue-700">total employees</span> work at your organization (all locations)?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${ROW.short}`}>
              {S8.map((opt) => (
                <PlainOption
                  key={opt}
                  label={opt}
                  selected={ans.s8 === opt}
                  onClick={() => setField("s8", opt)}
                />
              ))}
            </div>
            {errMsg && <ErrorToast message={errMsg} />}
          </div>
        )}

        {/* Step 6: HQ Location */}
        {step === 6 && (
          <div className="animate-fadeIn">
            <Q>In which country is your organization's <span className="text-blue-700">headquarters</span> located?</Q>
            <Instr>(Select ONE)</Instr>
            <select
              value={ans.s9 || ""}
              onChange={(e) => setField("s9", e.target.value)}
              className="w-full max-w-md px-4 py-2 border-2 border-gray-300 rounded-lg mb-6 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="">Select country...</option>
              {COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <Q>Approximately how many <span className="text-blue-700">other countries</span> does your organization have offices in?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-3 gap-3 ${ROW.short}`}>
              {S9A.map((opt) => (
                <PlainOption
                  key={opt}
                  label={opt}
                  selected={ans.s9a === opt}
                  onClick={() => setField("s9a", opt)}
                />
              ))}
            </div>
            {errMsg && <ErrorToast message={errMsg} />}
          </div>
        )}

        {/* Step 7: Industry */}
        {step === 7 && (
          <div className="animate-fadeIn">
            <Q>Which best describes your organization's <span className="text-blue-700">industry</span>?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${ROW.short}`}>
              {C2.map((opt) => (
                <div key={opt}>
                  <PlainOption
                    label={opt}
                    selected={ans.c2 === opt}
                    onClick={() => setField("c2", opt)}
                  />
                  {ans.c2 === "Other (specify)" && opt === "Other (specify)" && (
                    <input
                      type="text"
                      value={ans.c2_other || ""}
                      onChange={(e) => setField("c2_other", e.target.value)}
                      className="mt-2 w-full px-4 py-2 border-2 border-blue-500 rounded-lg focus:outline-none"
                      placeholder="Please specify..."
                    />
                  )}
                </div>
              ))}
            </div>
            {errMsg && <ErrorToast message={errMsg} />}
          </div>
        )}

        {/* Step 8: Benefits Eligibility */}
        {step === 8 && (
          <div className="animate-fadeIn">
            <Q>Approximately what percentage of your workforce is <span className="text-blue-700">eligible for standard employee benefits</span>?</Q>
            <Instr>(Enter percentage)</Instr>
            <div className="flex items-center gap-2 mb-6">
              <input
                type="number"
                value={ans.c3 || ""}
                onChange={(e) => setField("c3", e.target.value)}
                className="w-24 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="0"
                min="0"
                max="100"
              />
              <span className="text-lg font-semibold">%</span>
            </div>

            <Q>Which employee groups are <span className="text-blue-700">typically excluded</span> from benefits?</Q>
            <Instr>(Select ALL that apply)</Instr>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${ROW.med}`}>
              {C3A.map((opt) => (
                <div key={opt}>
                  <button
                    onClick={() => toggleMulti("c3a", opt, "None - all employees eligible")}
                    className={`px-4 py-3 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md w-full
                      ${Array.isArray(ans.c3a) && ans.c3a.includes(opt)
                        ? 'bg-blue-50 border-blue-500 shadow-lg transform scale-105' 
                        : 'bg-white border-gray-300 hover:border-gray-400'}`}
                  >
                    <span className={`text-sm md:text-base ${opt.includes("None") ? 'font-normal italic text-gray-600' : 'font-normal'}`}>
                      {opt}
                    </span>
                  </button>
                  {Array.isArray(ans.c3a) && 
                   ans.c3a.includes("Some other employee group (specify)") && 
                   opt === "Some other employee group (specify)" && (
                    <input
                      type="text"
                      value={ans.c3a_other || ""}
                      onChange={(e) => setField("c3a_other", e.target.value)}
                      className="mt-2 w-full px-4 py-2 border-2 border-blue-500 rounded-lg focus:outline-none"
                      placeholder="Please specify..."
                    />
                  )}
                </div>
              ))}
            </div>
            {errMsg && <ErrorToast message={errMsg} />}
          </div>
        )}

        {/* Step 9: Revenue & Remote Work */}
        {step === 9 && (
          <div className="animate-fadeIn">
            <Q>What is your organization's approximate <span className="text-blue-700">annual revenue</span>?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${ROW.short} mb-6`}>
              {C4.map((opt) => (
                <PlainOption
                  key={opt}
                  label={opt}
                  selected={ans.c4 === opt}
                  onClick={() => setField("c4", opt)}
                />
              ))}
            </div>

            <Q>Which best describes your organization's approach to <span className="text-blue-700">remote/hybrid work</span>?</Q>
            <Instr>(Select ONE)</Instr>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${ROW.med}`}>
              {C6.map((opt) => (
                <PlainOption
                  key={opt}
                  label={opt}
                  selected={ans.c6 === opt}
                  onClick={() => setField("c6", opt)}
                />
              ))}
            </div>
            {errMsg && <ErrorToast message={errMsg} />}
          </div>
        )}

        {/* Step 10: Completion */}
        {step === 10 && (
          <div className="text-center py-10 animate-fadeIn">
            <div className="mb-8">
              <svg className="w-24 h-24 mx-auto text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              You've completed the <span className="text-blue-700 font-bold">Company Profile</span> section!
            </h2>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Save & Continue →
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          {step > 1 ? (
            <button 
              onClick={back} 
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}
          {step < 10 && (
            <button 
              onClick={next} 
              className="px-8 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Next →
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

<style jsx>{`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`}</style>