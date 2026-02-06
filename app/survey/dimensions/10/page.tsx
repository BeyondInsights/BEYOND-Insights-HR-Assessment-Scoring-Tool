"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProgressiveStatusGrid } from "@/lib/hooks/useProgressiveStatusGrid";
import { forceSyncNow } from "@/lib/supabase/auto-data-sync";


const D10A_ITEMS_BASE = [
  "Paid caregiver leave with expanded eligibility (beyond local legal requirements)",
  "Flexible work arrangements for caregivers",
  "Dependent care subsidies",
  "Emergency caregiver funds",
  "Dependent care account matching/contributions",
  "Family navigation support",
  "Caregiver peer support groups",
  "Mental health support specifically for caregivers",
  "Manager training for supervising caregivers",
  "Practical support for managing caregiving and work",
  "Emergency dependent care when regular arrangements unavailable",
  "Respite care funding/reimbursement",
  "Caregiver resource navigator/concierge",
  "Legal/financial planning assistance for caregivers",
  "Modified job duties during peak caregiving periods",
  "Unpaid leave job protection beyond local / legal requirements",
  "Eldercare consultation and referral services",
  "Paid time off for care coordination appointments",
  "Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)", 
  "Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)"
];

export default function Dimension10Page() {
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

  // Use the progressive status grid hook for d10a items
  const {
    items: D10A_ITEMS,
    currentItemIndex,
    isTransitioning,
    setStatus,
    goToItem,
    answeredCount,
  } = useProgressiveStatusGrid({
    itemsBase: D10A_ITEMS_BASE,
    gridKey: "d10a",
    ans,
    setAns,
    markTouched,
    shuffle: true,
  });
  
  useEffect(() => {
    const saved = localStorage.getItem("dimension10_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAns(parsed);
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }

    const firmographicsData = localStorage.getItem("firmographics_data");
    if (firmographicsData) {
      const parsed = JSON.parse(firmographicsData);
      setIsMultiCountry(parsed.s9a !== "No other countries - headquarters only");
    }
  }, []);

  useEffect(() => {
    if (Object.keys(ans).length > 0) {
      localStorage.setItem("dimension10_data", JSON.stringify(ans));
    }
  }, [ans]);

  useEffect(() => {
    if (step !== 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const setField = (key: string, value: any) => {
    setAns((prev: any) => ({ ...prev, [key]: value }));
    markTouched(key); // Mark field as touched
    setErrors("");
  };

  // setStatus and goToItem are now provided by useProgressiveStatusGrid hook

  

  const STATUS_OPTIONS = [
    "Not able to offer in foreseeable future",
    "Assessing feasibility",
    "In active planning / development",
    "Currently offer",
    "Unsure"
  ];

  const hasAnyOffered = Object.values(ans.d10a || {}).some(
    (status) => status === "Currently offer"
  );

  const showD10aa = isMultiCountry && hasAnyOffered;

  const getTotalSteps = () => {
    let total = 3; // intro, D10.a, D10.b
    if (showD10aa) total++; // D10.aa
    total++; // completion
    return total;
  };

  const validateStep = () => {
    switch(step) {
      case 1:
        if (answeredCount < D10A_ITEMS.length) 
          return `Please evaluate all ${D10A_ITEMS.length} items (${answeredCount} completed)`;
        return null;
      
      case 2:
        if (showD10aa && !ans.d10aa) {
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
      if (showD10aa) {
        setStep(2); // Go to D10.aa
      } else {
        setStep(3); // Skip to D10.b
      }
    } else if (step === 2) {
      setStep(3); // Go to D10.b
    } else if (step === 3) {
      setStep(4); // Go to completion
    } else if (step === 4) {
      localStorage.setItem("dimension10_complete", "true");
      await forceSyncNow();  // Force sync before navigation
      router.push("/dashboard");
      return;
    }
    
    setErrors("");
  };

  const back = () => {
    if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      setStep(showD10aa ? 2 : 1);
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Dimension 10: Caregiver & Family Support
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / getTotalSteps()) * 100}%` }}
            />
          </div>
        </div>

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
                Here is the next aspect of programs offered:
              </p>

              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">CAREGIVER & FAMILY SUPPORT</h2>
                <p className="text-blue-100 text-lg">
                  Support for employees who are caregivers for family members managing cancer or other serious health conditions through flexible arrangements and dedicated resources.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">How this assessment works:</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span>You'll see different caregiver support benefits associated with this dimension, one at a time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span><strong>Indicate the current status of each benefit within your organization</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span>After selecting a response, it will automatically advance to the next benefit</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span>Use the navigation dots or arrows to review or change any response</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span>Once all support benefits are evaluated, the Continue button will appear</span>
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

        {/* Step 1: D10.a Progressive Cards */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">CAREGIVER & FAMILY SUPPORT</h2>
                  <p className="text-gray-300 text-sm">
                    Support for employees who are caregivers for family members with serious health conditions
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Progress Counter */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Progress: {Object.keys(ans.d10a || {}).length} of {D10A_ITEMS.length} items rated
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {Object.keys(ans.d10a || {}).length === D10A_ITEMS.length 
                        ? '✓ All items completed!' 
                        : `${D10A_ITEMS.length - Object.keys(ans.d10a || {}).length} items remaining`}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {Math.round((Object.keys(ans.d10a || {}).length / D10A_ITEMS.length) * 100)}%
                  </div>
                </div>
                <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(Object.keys(ans.d10a || {}).length / D10A_ITEMS.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">
                    Element {currentItemIndex + 1} of {D10A_ITEMS.length}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-500 mb-1">
                      Hover over any bar to see the element name
                    </span>
                    <div className="flex gap-1">
                      {D10A_ITEMS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => goToItem(idx)}
                          className={`h-2 transition-all duration-500 rounded-full ${
                            ans.d10a?.[item]
                              ? "w-6 bg-green-600 hover:bg-green-700 cursor-pointer"
                              : idx === currentItemIndex
                              ? "w-6 bg-blue-600"
                              : "w-2 bg-gray-300 hover:bg-gray-400 cursor-pointer"
                          }`}
                          title={`${item}`}
                          disabled={isTransitioning}
                        />
                      ))}
                    </div>
                    {Object.keys(ans.d10a || {}).length === D10A_ITEMS.length && (
                      <span className="text-xs text-green-700 mt-1">
                        ↑ Click any green bar to jump to that element
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
                    {D10A_ITEMS[currentItemIndex]}
                  </h3>
                  <p className="text-xs italic text-gray-600 mb-4">
                    We recognize that implementation may vary based on country/jurisdiction-specific laws and regulations.
                  </p>
                  
                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatus(D10A_ITEMS[currentItemIndex], status)}
                        disabled={isTransitioning}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all transform ${
                          isTransitioning
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:scale-[1.02] cursor-pointer'
                        } ${
                          ans.d10a?.[D10A_ITEMS[currentItemIndex]] === status
                            ? "border-blue-500 bg-blue-50 shadow-lg"
                            : "border-gray-200 hover:border-gray-300 bg-white hover:shadow"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all ${
                            ans.d10a?.[D10A_ITEMS[currentItemIndex]] === status
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 bg-white"
                          }`}>
                            {ans.d10a?.[D10A_ITEMS[currentItemIndex]] === status && (
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

                {Object.keys(ans.d10a || {}).length === D10A_ITEMS.length && !isTransitioning && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-500 mb-1">
                      Hover over any bar to see the element name
                    </span>
                    <button
                      onClick={next}
                      disabled={!isStepValid()}
                      className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                        isStepValid()
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      Finish Section →
                    </button>
                    <span className="text-xs text-gray-500">
                      Done editing? Click to proceed
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: D10.aa (conditional) */}
        {step === 2 && showD10aa && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Geographic Availability</h3>
            
            <div className={`border-2 rounded-lg p-4 ${
              touched.d10aa && !ans.d10aa
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 bg-white'
            }`}>
              <p className="font-bold text-gray-900 mb-1">
                Are the <span className="text-blue-600">Caregiver & Family Support benefits</span> your 
                organization currently offers...?
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
                    onClick={() => setField("d10aa", opt)}
                    className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
                      ans.d10aa === opt
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

        {/* Step 3: D10.b open-end */}
        {step === 3 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Benefits</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              What other <span className="text-blue-600 font-bold">caregiver & family support benefits</span> does your organization offer that weren't listed?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
            
            <textarea
              value={ans.d10b || ""}
              onChange={(e) => setField("d10b", e.target.value)}
              className="w-full min-h-[120px] px-4 py-3 border-2 border-gray-300 rounded-lg"
              placeholder="Describe any additional benefits..."
            />
            
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={ans.d10b_none || false}
                onChange={(e) => {
                  setField("d10b_none", e.target.checked);
                  if (e.target.checked) setField("d10b", "");
                }}
                className="w-4 h-4 mr-2"
              />
              <span className="text-sm">No other benefits</span>
            </label>
          </div>
        )}

        {/* Step 4: Completion */}
        {step === 4 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Dimension 10 Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              You've successfully completed the Caregiver & Family Support dimension.
            </p>
            <button
              onClick={async () => { 
                localStorage.setItem("dimension10_complete", "true");
                await forceSyncNow();  // Force sync before navigation
                router.push("/dashboard"); 
              }}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Save & Return to Dashboard →
            </button>
          </div>
        )}

        {/* Universal Navigation */}
        {step > 1 && step < 4 && (
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
