"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProgressiveStatusGrid } from "@/lib/hooks/useProgressiveStatusGrid";
import { forceSyncNow } from "@/lib/supabase/auto-data-sync";


// Data for D3.a - ALL 10 ITEMS FROM SURVEY
const D3A_ITEMS_BASE = [
  "Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams",
  "Clear escalation protocol for manager response",
  "Dedicated manager resource hub",
  "Empathy/communication skills training",
  "Legal compliance training",
  "Senior leader coaching on supporting impacted employees",
  "Manager evaluations include how well they support impacted employees",
  "Manager peer support / community building",
  "AI-powered guidance tools",
  "Privacy protection and confidentiality management"
];

export default function Dimension3Page() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<any>({});
  const [errors, setErrors] = useState<string>("");
  const [isMultiCountry, setIsMultiCountry] = useState(false);
  
  // ===== VALIDATION ADDITIONS =====
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const isStepValid = (): boolean => {
    return validateStep() === null;
  };
  // ===== END VALIDATION ADDITIONS =====

  // Use the progressive status grid hook for d3a items
  const {
    items: D3A_ITEMS,
    currentItemIndex,
    isTransitioning,
    setStatus,
    goToItem,
    answeredCount,
  } = useProgressiveStatusGrid({
    itemsBase: D3A_ITEMS_BASE,
    gridKey: "d3a",
    ans,
    setAns,
    markTouched,
    shuffle: true,
  });
  
  // Load saved answers on mount
  useEffect(() => {
    const saved = localStorage.getItem("dimension3_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAns(parsed);
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }

    // Check if multi-country from firmographics
    const firmographicsData = localStorage.getItem("firmographics_data");
    if (firmographicsData) {
      const parsed = JSON.parse(firmographicsData);
      setIsMultiCountry(parsed.s9a !== "No other countries - headquarters only");
    }
  }, []);

  // Save answers when they change
  useEffect(() => {
    if (Object.keys(ans).length > 0) {
      localStorage.setItem("dimension3_data", JSON.stringify(ans));
    }
  }, [ans]);

  // Scroll to top when step changes (MOBILE FIX)
  useEffect(() => {
    if (step !== 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);
  
  const setField = (key: string, value: any) => {
    setAns((prev: any) => ({ ...prev, [key]: value }));
    setErrors("");
  };

  // setStatus and goToItem are now provided by useProgressiveStatusGrid hook

  

  const STATUS_OPTIONS = [
    "Not able to provide in foreseeable future",
    "Assessing feasibility",
    "In active planning / development",
    "Currently provide to managers",
    "Unsure"
  ];

  
  // Check if any training is provided (for follow-up questions)
  const hasAnyProvided = Object.values(ans.d3a || {}).some(
    (status) => status === "Currently provide to managers"
  );

  // D3aa should show if multi-country AND at least one "Currently provide to managers"
  const showD3aa = isMultiCountry && hasAnyProvided;
  const showD3_1a = hasAnyProvided;
  const showD3_1 = hasAnyProvided;

  // Calculate total steps
  const getTotalSteps = () => {
    let total = 3; // intro, D3.a, D3.b
    if (showD3aa) total++; // D3aa
    if (showD3_1a) total++; // D3.1a
    if (showD3_1) total++; // D3.1
    total++; // completion screen
    return total;
  };

  // Validation
  const validateStep = () => {
    switch(step) {
      case 1: // D3.a
        if (answeredCount < D3A_ITEMS.length) 
          return `Please evaluate all ${D3A_ITEMS.length} items (${answeredCount} completed)`;
        return null;
      
      case 2: // Could be D3aa OR D3.b
        if (showD3aa && !ans.D3aa) return "Please select one option";
        return null;
        
      default:
        return null;
    }
  };

  // Navigation
  const next = async () => {
    const error = validateStep();
    if (error) {
      setErrors(error);
      return;
    }

    if (step === 1) {
      // After D3.a grid
      if (showD3aa) {
        setStep(2); // Go to D3aa
      } else {
        setStep(3); // Skip to D3.b
      }
    } else if (step === 2) {
      // From D3aa OR D3.b
      if (showD3aa && !ans.d3b && ans.D3aa) {
        setStep(3); // Go to D3.b
      } else {
        // From D3.b, check follow-ups
        if (showD3_1a) {
          setStep(4);
        } else {
          setStep(6); // Completion
        }
      }
    } else if (step === 3) {
      // From D3.b
      if (showD3_1a) {
        setStep(4);
      } else {
        setStep(6); // Completion
      }
    } else if (step === 4) {
      // From D3.1a
      if (showD3_1) {
        setStep(5);
      } else {
        setStep(6); // Completion
      }
    } else if (step === 5) {
      setStep(6); // Completion
    } else if (step === 6) {
      localStorage.setItem("dimension3_complete", "true");
      await forceSyncNow();  // Force sync before navigation
      router.push("/dashboard");
      return;
    }
    
    setErrors("");
  };

  const back = () => {
    if (step === 6) {
      setStep(showD3_1 ? 5 : showD3_1a ? 4 : 3);
    } else if (step === 5) {
      setStep(4);
    } else if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      setStep(showD3aa ? 2 : 1);
    } else if (step === 2) {
      setStep(1);
    } else if (step > 0) {
      setStep(step - 1);
    }
    setErrors("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Dimension 3: Manager Preparedness & Capability</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / getTotalSteps()) * 100}%` }}
            />
          </div>
        </div>

        {/* Error display */}
        {errors && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors}
          </div>
        )}

        {/* Step 0: Introduction */}
        {step === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-700 mb-6">
                Here is the next aspect of <strong>support programs</strong> for{" "}
                <strong>employees managing cancer or other serious health conditions</strong>:
              </p>

              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">MANAGER PREPAREDNESS & CAPABILITY</h2>
                <p className="text-blue-100 text-lg">
                  Training and resources that equip managers to support employees managing cancer or other serious health conditions.
                </p>
                <p className="text-blue-100 text-sm mt-3 italic">
                  Training programs can be in-person, virtual, or hybrid
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">How this assessment works:</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span>You'll see different support options associated with this dimension, one at a time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span><strong>Indicate the current status of each option within your organization</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span>After selecting a response, it will automatically advance to the next option</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span>Click any green bar to review or change your answer to that element</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span>Once all support options are evaluated, the Continue button will appear</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-lg"
                >
                  Begin Assessment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: D3.a Progressive Cards */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">MANAGER PREPAREDNESS & CAPABILITY</h2>
                  <p className="text-gray-300 text-sm">
                    Training and resources that equip managers to support employees
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* VALIDATION: Progress Counter */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Progress: {Object.keys(ans.d3a || {}).length} of {D3A_ITEMS.length} items rated
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {Object.keys(ans.d3a || {}).length === D3A_ITEMS.length 
                        ? '✓ All items completed!' 
                        : `${D3A_ITEMS.length - Object.keys(ans.d3a || {}).length} items remaining`}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {Math.round((Object.keys(ans.d3a || {}).length / D3A_ITEMS.length) * 100)}%
                  </div>
                </div>
                <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(Object.keys(ans.d3a || {}).length / D3A_ITEMS.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">
                    Element {currentItemIndex + 1} of {D3A_ITEMS.length}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm text-gray-600 mb-1 pointer-events-none">
                      <strong>HINT:</strong> Hover over any bar to see the element name
                    </span>
                    <div className="flex gap-1">
                      {D3A_ITEMS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => goToItem(idx)}
                          className={`h-2 transition-all duration-500 rounded-full ${
                            ans.d3a?.[item]
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
                    {Object.keys(ans.d3a || {}).length > 0 && (
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
                    {D3A_ITEMS[currentItemIndex]}
                  </h3>
                  <p className="text-xs italic text-gray-600 mb-4">
                    We recognize that implementation may vary based on country/jurisdiction-specific laws and regulations.
                  </p>
                  
                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatus(D3A_ITEMS[currentItemIndex], status)}
                        disabled={isTransitioning}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all transform ${
                          isTransitioning
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:scale-[1.02] cursor-pointer'
                        } ${
                          ans.d3a?.[D3A_ITEMS[currentItemIndex]] === status
                            ? "border-blue-500 bg-blue-50 shadow-lg"
                            : "border-gray-200 hover:border-gray-300 bg-white hover:shadow"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all ${
                            ans.d3a?.[D3A_ITEMS[currentItemIndex]] === status
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 bg-white"
                          }`}>
                            {ans.d3a?.[D3A_ITEMS[currentItemIndex]] === status && (
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
                  ← View previous option
                </button>

                {/* Show Finish button only when all items rated */}
                {Object.keys(ans.d3a || {}).length === D3A_ITEMS.length && !isTransitioning && (
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
        
        {/* Step 2: D3aa (conditional - multi-country with offerings) */}
        {step === 2 && showD3aa && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Geographic Availability</h3>
            
            {/* VALIDATION: Wrapper with red border */}
            <div className={`border-2 rounded-lg p-4 ${
              touched.D3aa && !ans.D3aa
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-200 bg-white'
            }`}>
              {/* VALIDATION: Required asterisk */}
              <p className="font-bold text-gray-900 mb-4">
                Are the <span className="text-blue-600">Manager Preparedness & Capability support options</span> your 
                organization currently provides to managers...?
                <span className="text-red-600 ml-1">*</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
              
              <div className="space-y-2">
                {[
                  "Only available in select locations",
                  "Vary across locations", 
                  "Generally consistent across all locations"
                ].map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setField("D3aa", opt);
                      markTouched("D3aa"); // VALIDATION: Mark as touched
                    }}
                    className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
                      ans.D3aa === opt
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

        {/* Step 3: D3.b open-end (OR Step 2 if no D3aa) - OPTIONAL */}
        {(step === 3 || (step === 2 && !showD3aa)) && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Initiatives</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              What other manager preparedness initiatives does your organization offer that weren't listed?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
            
            <textarea
              value={ans.d3b || ""}
              onChange={(e) => setField("d3b", e.target.value)}
              className="w-full min-h-[120px] px-4 py-3 border-2 border-gray-300 rounded-lg"
              placeholder="Describe any additional initiatives..."
            />
            
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={ans.d3b_none || false}
                onChange={(e) => {
                  setField("d3b_none", e.target.checked);
                  if (e.target.checked) setField("d3b", "");
                }}
                className="w-4 h-4 mr-2"
              />
              <span className="text-sm">No other initiatives</span>
            </label>
          </div>
        )}

        {/* Step 4: D3.1a (conditional if any training provided) - OPTIONAL */}
        {step === 4 && showD3_1a && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Training Requirements</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              Is <strong>manager training</strong> on supporting <strong>employees managing cancer or other serious health conditions</strong>...?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
            
            <div className="space-y-2">
              {[
                "Mandatory for all managers",
                "Mandatory for new managers only",
                "Voluntary",
                "Varies by training type"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => setField("d3_1a", opt)}
                  className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
                    ans.d3_1a === opt
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

        {/* Step 5: D3.1 (conditional if any training provided) - OPTIONAL */}
        {step === 5 && showD3_1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Training Completion</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              Within the past 2 years, what percentage of <strong>managers completed training</strong> on supporting <strong>employees managing cancer or other serious health conditions</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
            <p className="text-xs text-gray-500 italic mb-4">Your best estimate is fine. If varies, report overall average</p>
            
            <div className="space-y-2">
              {[
                "Less than 10%",
                "10 to less than 25%",
                "25 to less than 50%",
                "50 to less than 75%",
                "75 to less than 100%",
                "100%",
                "Unsure",
                "Do not track this information",
                "Not able to provide this information"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => setField("d3_1", opt)}
                  className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
                    ans.d3_1 === opt
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

        {/* Step 6: Completion */}
        {step === 6 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Dimension 3 Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              You've successfully completed the Manager Preparedness & Capability dimension.
            </p>
            <button
              onClick={async () => { 
                localStorage.setItem("dimension3_complete", "true");
                await forceSyncNow();  // Force sync before navigation
                router.push("/dashboard"); 
              }}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Save & Return to Dashboard →
            </button>
          </div>
        )}

        {/* Navigation Buttons (for steps 2-5) */}
        {step > 1 && step < 6 && (
          <div className="flex justify-between mt-8">
            <button 
              onClick={back} 
              className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              ← Back
            </button>
            {/* VALIDATION: Updated Continue button */}
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
