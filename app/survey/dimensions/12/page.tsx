"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProgressiveStatusGrid } from "@/lib/hooks/useProgressiveStatusGrid";
import { useAssessmentContext } from "@/lib/assessment-context";
import DimensionSummaryView from "@/components/DimensionSummaryView";
import ELEMENT_TOOLTIPS from "@/data/element-tooltips";

// Fisher-Yates shuffle algorithm

const D12A_ITEMS_BASE = [
  "Return-to-work success metrics",
  "Employee satisfaction tracking",
  "Business impact/ROI assessment",
  "Regular program enhancements",
  "External benchmarking",
  "Innovation pilots",
  "Employee confidence in employer support",
  "Program utilization analytics",
  "Measure screening campaign ROI (e.g. participation rates, inquiries about access, etc.)"
];

export default function Dimension12Page() {
  const router = useRouter();
  const ctx = useAssessmentContext();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<any>({});
  const [errors, setErrors] = useState<string>("");
  const [isMultiCountry, setIsMultiCountry] = useState(false);
  const [viewMode, setViewMode] = useState<'auto' | 'step' | 'summary'>('auto');

  // ===== VALIDATION ADDITIONS =====
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const isStepValid = (): boolean => {
    return validateStep() === null;
  };
  // ===== END VALIDATION ADDITIONS =====

  // Use the progressive status grid hook for d12a items
  const {
    items: D12A_ITEMS,
    currentItemIndex,
    isTransitioning,
    setStatus,
    goToItem,
    answeredCount,
  } = useProgressiveStatusGrid({
    itemsBase: D12A_ITEMS_BASE,
    gridKey: "d12a",
    ans,
    setAns,
    markTouched,
    shuffleSeed: ctx.surveyId || "",
    shuffle: true,
  });
  
  useEffect(() => {
    const saved = ctx.getSectionData('dimension12');
    if (saved) {
      setAns(saved);
      // If main grid has answers, skip intro and go to grid
      const grid = saved['d12a'];
      if (grid && typeof grid === 'object' && Object.keys(grid).length > 0) {
        setStep(1);
        if (Object.keys(grid).length >= Math.ceil(D12A_ITEMS_BASE.length / 2)) {
          setViewMode('summary');
        }
      }
    }

    const firmData = ctx.getSectionData('firmographics');
    if (firmData) {
      setIsMultiCountry(firmData.s9a !== "No other countries - headquarters only");
    }
  }, [ctx.isLoaded]);

  useEffect(() => {
    if (Object.keys(ans).length > 0) {
      ctx.setSectionData('dimension12', ans);
    }
  }, [ans]);

  useEffect(() => {
    if (step !== 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const setField = (key: string, value: any) => {
    setAns((prev: any) => ({ ...prev, [key]: value }));
    markTouched(key);
    setErrors("");
  };

  // setStatus and goToItem are now provided by useProgressiveStatusGrid hook

  

  const STATUS_OPTIONS = [
    "In Place",
    "In Development",
    "Under Review",
    "Open to Exploring",
    "Not Planned",
    "Unsure"
  ];
 
  const hasAnyOffered = Object.values(ans.d12a || {}).some(
    (status) => status === "In Place"
  );

  const showD12aa = isMultiCountry && hasAnyOffered;
  const showD12_1 = Object.values(ans.d12a || {}).some(
    (status) => status === "In Place"
  );
  const showD12_2 = showD12_1;
  
  const getTotalSteps = () => {
    let total = 2;
    if (showD12aa) total++;
    total++;
    if (showD12_1) total++;
    if (showD12_2) total++;
    total++;
    return total;
  };

  const validateStep = () => {
    switch(step) {
      case 1:
        if (answeredCount < D12A_ITEMS.length) 
          return `Please evaluate all ${D12A_ITEMS.length} items (${answeredCount} completed)`;
        return null;
      
      case 2:
        if (showD12aa && !ans.d12aa) {
          return "Please select one option";
        }
        return null;
        
      default:
        return null;
    }
  };

  const next = async () => {
    const error = validateStep();
    if (error) {
      setErrors(error);
      return;
    }

    if (step === 1) {
      if (showD12aa) {
        setStep(2);
      } else {
        setStep(showD12aa ? 3 : 2);
      }
    } else if (step === 2) {
      if (showD12aa) {
        setStep(3);
      } else {
        setStep(showD12_1 ? 4 : 6);
      }
    } else if (step === 3) {
      setStep(showD12_1 ? 4 : 6);
    } else if (step === 4) {
      setStep(showD12_2 ? 5 : 6);
    } else if (step === 5) {
      setStep(6);
    } else if (step === 6) {
      ctx.setSectionComplete('dimension12', true);
      await ctx.saveToSupabase('dimension12');
      router.push("/dashboard");
      return;
    }
    
    setErrors("");
  };

  const back = () => {
    if (step === 6) {
      setStep(showD12_2 ? 5 : (showD12_1 ? 4 : 3));
    } else if (step === 5) {
      setStep(4);
    } else if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      setStep(showD12aa ? 2 : 1);
    } else if (step === 2) {
      setStep(1);
    } else if (step > 0) {
      setStep(step - 1);
    }
    setErrors("");
  };

  const gridComplete12 = ans['d12a'] && typeof ans['d12a'] === 'object' && Object.keys(ans['d12a']).length >= D12A_ITEMS_BASE.length;
  const showSummary12 = viewMode === 'summary';

  if (showSummary12 && viewMode !== 'step') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-8 flex-1">
          <DimensionSummaryView
            dimensionNumber={12}
            dimensionName="Continuous Improvement"
            gridData={ans['d12a'] || {}}
            allAnswers={ans}
            statusOptions={STATUS_OPTIONS}
            onGridChange={(element, status) => {
              setAns((prev: any) => ({
                ...prev,
                d12a: { ...prev.d12a, [element]: status }
              }));
            }}
            onSwitchToStepView={() => { setViewMode('step'); setStep(2); }}
            onSave={async () => {
              ctx.setSectionData('dimension12', ans);
              return ctx.saveToSupabase('dimension12');
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Dimension 12: Continuous Improvement & Outcomes</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / getTotalSteps()) * 100}%` }}
            />
          </div>
        </div>

        {gridComplete12 && (
          <button onClick={() => setViewMode('summary')} className="text-sm text-blue-600 hover:text-blue-800 mb-4">
            View all answers at a glance
          </button>
        )}

        {errors && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors}
          </div>
        )}

        {step === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-700 mb-6">
                Here is the next aspect of <strong>support programs</strong> for{" "}
                <strong>employees managing cancer or other serious health conditions</strong>:
              </p>

              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">CONTINUOUS IMPROVEMENT & OUTCOMES</h2>
                <p className="text-blue-100 text-lg">
                  Measuring program effectiveness and making improvements based on employee feedback and results
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-4">
                <p className="text-gray-700 mb-3">
                  You will see several elements associated with this dimension, each representing a program, policy, or practice. For each element, select the option that best reflects your organization's current status.
                </p>
                <p className="text-gray-600 text-sm">
                  Not every element will be feasible or relevant for every organization — that is completely expected. Answer based on where your organization stands today.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-sm">Response Scale</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    { label: 'In Place', color: '#0D9488', desc: 'This program, policy, or practice is currently active and available to employees.' },
                    { label: 'In Development', color: '#2563EB', desc: 'A formal plan exists and resources have been allocated to implement this within the next 12\u201318 months.' },
                    { label: 'Under Review', color: '#D97706', desc: 'Actively evaluating the feasibility, cost, or design of this program. No implementation timeline yet, but it is on leadership\'s radar.' },
                    { label: 'Open to Exploring', color: '#8B5CF6', desc: 'Had not considered this, but learning about it has sparked interest. Open to reviewing whether this could work for your organization.' },
                    { label: 'Not Planned', color: '#64748B', desc: 'Considered this and determined it is not feasible or appropriate for your organization at this time.' },
                  ].map(opt => (
                    <div key={opt.label} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: opt.color }} />
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                        <p className="text-xs text-gray-600 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-lg"
                >
                  Begin Dimension
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">CONTINUOUS IMPROVEMENT & OUTCOMES</h2>
                  <p className="text-gray-300 text-sm">
                    Measurement and program evolution
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Progress: {Object.keys(ans.d12a || {}).length} of {D12A_ITEMS.length} elements rated
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {Object.keys(ans.d12a || {}).length === D12A_ITEMS.length 
                        ? '✓ All elements completed!' 
                        : `${D12A_ITEMS.length - Object.keys(ans.d12a || {}).length} elements remaining`}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {Math.round((Object.keys(ans.d12a || {}).length / D12A_ITEMS.length) * 100)}%
                  </div>
                </div>
                <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(Object.keys(ans.d12a || {}).length / D12A_ITEMS.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">
                    
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm text-gray-600 mb-1 pointer-events-none">
                      <strong>HINT:</strong> Hover over any bar to see the element name
                    </span>
                    <div className="flex gap-1">
                      {D12A_ITEMS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => goToItem(idx)}
                          className={`h-2 transition-all duration-500 rounded-full ${
                            ans.d12a?.[item]
                              ? "w-8 bg-green-600 hover:bg-green-700 cursor-pointer"
                              : idx === currentItemIndex
                              ? "w-8 bg-blue-600"
                              : "w-2 bg-gray-300 hover:bg-gray-400 cursor-pointer"
                          }`}
                          title={`${item}`}
                          disabled={isTransitioning}
                        />
                      ))}
                    </div>
                    {Object.keys(ans.d12a || {}).length > 0 && (
                      <span className="text-sm text-gray-700 mt-1">
                        ↑ Click any <strong className="text-green-600">green bar</strong> to review or change your answer to that element
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div
                  className={`bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8 rounded-xl border-2 border-blue-100 transition-all duration-700 ease-in-out ${
                    isTransitioning
                      ? 'opacity-0 transform scale-95 blur-sm'
                      : 'opacity-100 transform scale-100 blur-0'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    {D12A_ITEMS[currentItemIndex]}
                  </h3>
                  {ELEMENT_TOOLTIPS[D12A_ITEMS[currentItemIndex]] && (
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4 -mt-2">
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      <p className="text-xs text-blue-700">{ELEMENT_TOOLTIPS[D12A_ITEMS[currentItemIndex]]}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatus(D12A_ITEMS[currentItemIndex], status)}
                        disabled={isTransitioning}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all transform ${
                          isTransitioning
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:scale-[1.02] cursor-pointer'
                        } ${
                          ans.d12a?.[D12A_ITEMS[currentItemIndex]] === status
                            ? "border-blue-500 bg-blue-50 shadow-lg"
                            : "border-gray-200 hover:border-gray-300 bg-white hover:shadow"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all ${
                            ans.d12a?.[D12A_ITEMS[currentItemIndex]] === status
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 bg-white"
                          }`}>
                            {ans.d12a?.[D12A_ITEMS[currentItemIndex]] === status && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                          <span className="text-base">{status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => goToItem(Math.max(0, currentItemIndex - 1))}
                  disabled={currentItemIndex === 0 || isTransitioning}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    currentItemIndex === 0 || isTransitioning
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  ← View previous element
                </button>

                {Object.keys(ans.d12a || {}).length === D12A_ITEMS.length && !isTransitioning && (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={next}
                      disabled={!isStepValid()}
                      className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                        isStepValid()
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      Continue to Next Question →
                    </button>
                      
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {step === 2 && showD12aa && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Geographic Tracking</h3>
            
            <div className={`border-2 rounded-lg p-4 ${
              touched.d12aa && !ans.d12aa
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 bg-white'
            }`}>
              <p className="font-bold text-gray-900 mb-1">
                Are the <span className="text-blue-600 font-bold">Continuous Improvement & Outcomes measurements</span> your 
                organization <span className="text-blue-600 font-bold">currently measures / tracks</span>...?
                <span className="text-red-600 ml-1">*</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
              
              <div className="space-y-2">
                {[
                  "Only measured / tracked in select locations",
                  "Vary across locations", 
                  "Generally consistent across all locations"
                ].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setField("d12aa", opt)}
                    className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
                      ans.d12aa === opt
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Practices</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              What other <span className="text-blue-600 font-bold">measurement or continuous improvement practices</span> does your organization use when considering workplace support programs for <span className="text-blue-600 font-bold">employees managing cancer or other serious health conditions</span>?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
            
            <textarea
              value={ans.d12b || ""}
              onChange={(e) => setField("d12b", e.target.value)}
              className="w-full min-h-[120px] px-4 py-3 border-2 border-gray-300 rounded-lg"
              placeholder="Describe any additional practices..."
            />
            
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={ans.d12b_none || false}
                onChange={(e) => {
                  setField("d12b_none", e.target.checked);
                  if (e.target.checked) setField("d12b", "");
                }}
                className="w-4 h-4 mr-2"
              />
              <span className="text-sm">No other practices</span>
            </label>
          </div>
        )}

        {step === 4 && showD12_1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Individual Experience Review</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              Do you review <span className="text-blue-600 font-bold">individual employee experiences</span> (not just aggregate data) <span className="text-blue-600 font-bold">to identify potential improvements</span> to your programs for <span className="text-blue-600 font-bold">employees managing cancer or other serious health conditions</span>?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
            
            <div className="space-y-2">
              {[
                "Yes, using a systematic case review process",
                "Yes, using ad hoc case reviews",
                "No, we only review aggregate metrics"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => setField("d12_1", opt)}
                  className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
                    ans.d12_1 === opt
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && showD12_2 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Program Changes</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              <span className="text-blue-600 font-bold">Over the past 2 years</span>, have <span className="text-blue-600 font-bold">individual</span> employee experiences led to <span className="text-blue-600 font-bold">specific changes</span> to your programs for <span className="text-blue-600 font-bold">employees managing cancer or other serious health conditions</span>?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
            
            <div className="space-y-2">
              {[
                "Yes, several changes implemented",
                "Yes, a few changes implemented",
                "No"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => setField("d12_2", opt)}
                  className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
                    ans.d12_2 === opt
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Dimension 12 Complete!
            </h2>
            <p className="text-gray-600 mb-2">
              You've successfully completed the Continuous Improvement & Outcomes dimension.
            </p>
            {(() => {
              let done = 1;
              for (let i = 1; i <= 13; i++) {
                if (i !== 12 && ctx.getSectionComplete(`dimension${i}`)) done++;
              }
              return (
                <p className="text-sm text-gray-500 mb-8">
                  {done} of 13 dimensions complete
                </p>
              );
            })()}
            <button
              onClick={async () => {
                ctx.setSectionComplete('dimension12', true);
                await ctx.saveToSupabase('dimension12');
                router.push("/dashboard");
              }}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Save & Return to Dashboard →
            </button>
          </div>
        )}

        {step > 1 && step < 6 && (
          <div className="flex justify-between mt-8">
            <button 
              onClick={back} 
              className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              ← Back
            </button>
            <button 
              onClick={next} 
              disabled={!isStepValid()}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                isStepValid()
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
              }`}
            >
              Continue →
            </button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
