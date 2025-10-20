"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Data for D2.a - ALL 17 ITEMS FROM SURVEY
const D2A_ITEMS_BASE = [
  "Coverage for clinical trials and experimental treatments not covered by standard health insurance",
  "Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance",
  "Paid time off for clinical trial participation",
  "Set out-of-pocket maximums (for in-network single coverage)",
  "Travel/lodging reimbursement for specialized care beyond insurance coverage",
  "Financial counseling services",
  "Voluntary supplemental illness insurance (with employer contribution)",
  "Real-time cost estimator tools",
  "Insurance advocacy/pre-authorization support",
  "$0 copay for specialty drugs",
  "Hardship grants program funded by employer",
  "Tax/estate planning assistance",
  "Short-term disability covering 60%+ of salary",
  "Long-term disability covering 60%+ of salary",
  "Employer-paid disability insurance supplements",
  "Guaranteed job protection",
  "Accelerated life insurance benefits (partial payout for terminal / critical illness)"
];

export default function Dimension2Page() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<any>({});
  const [errors, setErrors] = useState<string>("");
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isMultiCountry, setIsMultiCountry] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [D2A_ITEMS] = useState(() => shuffleArray(D2A_ITEMS_BASE));
  
  // Load saved answers on mount
  useEffect(() => {
    const saved = localStorage.getItem("dimension2_data");
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
      localStorage.setItem("dimension2_data", JSON.stringify(ans));
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

  const setStatus = (item: string, status: string) => {
    setAns((prev: any) => ({
      ...prev,
      d2a: { ...(prev.d2a || {}), [item]: status }
    }));
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      const nextUnansweredIndex = D2A_ITEMS.findIndex((itm, idx) => 
        idx > currentItemIndex && !ans.d2a?.[itm]
      );
      
      if (nextUnansweredIndex !== -1) {
        setCurrentItemIndex(nextUnansweredIndex);
      } else if (currentItemIndex < D2A_ITEMS.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      }
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 250);
    }, 500);
  };

  const goToItem = (index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentItemIndex(index);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    }, 500);
  };

  const STATUS_OPTIONS = [
    "Not able to offer in foreseeable future",
    "Assessing feasibility",
    "In active planning / development",
    "Currently offer",
    "Unsure"
  ];

  // D2aa should show if multi-country AND at least one "Currently offer"
  const hasAnyOffered = Object.values(ans.d2a || {}).some(
    (status) => status === "Currently offer"
  );
  const showD2aa = isMultiCountry && hasAnyOffered;

  // Calculate total steps
  const getTotalSteps = () => {
    let total = 3; // intro, D2.a, D2.b
    if (showD2aa) total++; // D2aa
    total++; // completion screen
    return total;
  };

  // Validation
  const validateStep = () => {
    switch(step) {
      case 1: // D2.a
        const answeredCount = Object.keys(ans.d2a || {}).length;
        if (answeredCount < D2A_ITEMS.length) 
          return `Please evaluate all ${D2A_ITEMS.length} items (${answeredCount} completed)`;
        return null;
      
      case 2: // Could be D2aa OR D2.b
        if (showD2aa && !ans.D2aa) return "Please select one option";
        return null;
        
      default:
        return null;
    }
  };

  // Navigation
  const next = () => {
    const error = validateStep();
    if (error) {
      setErrors(error);
      return;
    }

    if (step === 1) {
      // After D2.a grid
      if (showD2aa) {
        setStep(2); // Go to D2aa
      } else {
        setStep(3); // Skip to D2.b
      }
    } else if (step === 2) {
      // From D2aa OR D2.b
      if (showD2aa && !ans.d2b && ans.D2aa) {
        setStep(3); // Go to D2.b
      } else {
        setStep(4); // Completion
      }
    } else if (step === 3) {
      setStep(4); // Completion
    } else if (step === 4) {
      localStorage.setItem("dimension2_complete", "true");
      router.push("/dashboard");
      return;
    }
    
    setErrors("");
  };

  const back = () => {
    if (step === 3) {
      setStep(showD2aa ? 2 : 1);
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
              Dimension 2: Insurance & Financial Protection
            </span>
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
                <h2 className="text-3xl font-bold text-white mb-3">INSURANCE & FINANCIAL PROTECTION</h2>
                <p className="text-blue-100 text-lg">
                  Financial protections that prevent economic hardship during treatment, including comprehensive coverage and expense assistance.
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
                    <span>Indicate the current status of each option within your organization</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span>After selecting a response, it will automatically advance to the next option</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span>Use the navigation dots or arrows to review or change any response</span>
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

        {/* Step 1: D2.a Progressive Cards */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">INSURANCE & FINANCIAL PROTECTION</h2>
                  <p className="text-gray-300 text-sm">
                    Financial protections that prevent economic hardship during treatment
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">
                    Item {currentItemIndex + 1} of {D2A_ITEMS.length}
                  </span>
                  <div className="flex gap-1">
                    {D2A_ITEMS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToItem(idx)}
                        className={`h-2 transition-all duration-500 rounded-full ${
                          ans.d2a?.[item]
                            ? "w-8 bg-green-600 hover:bg-green-700 cursor-pointer"
                            : idx === currentItemIndex
                            ? "w-8 bg-blue-600"
                            : "w-2 bg-gray-300 hover:bg-gray-400 cursor-pointer"
                        }`}
                        title={item}
                        disabled={isTransitioning}
                      />
                    ))}
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
                    {D2A_ITEMS[currentItemIndex]}
                  </h3>
                  <p className="text-xs italic text-gray-600 mb-4">
                    We recognize that implementation may vary based on country/jurisdiction-specific laws and regulations.
                  </p>
                  
                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatus(D2A_ITEMS[currentItemIndex], status)}
                        disabled={isTransitioning}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all transform ${
                          isTransitioning
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:scale-[1.02] cursor-pointer'
                        } ${
                          ans.d2a?.[D2A_ITEMS[currentItemIndex]] === status
                            ? "border-blue-500 bg-blue-50 shadow-lg"
                            : "border-gray-200 hover:border-gray-300 bg-white hover:shadow"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all ${
                            ans.d2a?.[D2A_ITEMS[currentItemIndex]] === status
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 bg-white"
                          }`}>
                            {ans.d2a?.[D2A_ITEMS[currentItemIndex]] === status && (
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

                {Object.keys(ans.d2a || {}).length === D2A_ITEMS.length && !isTransitioning && (
                  <button
                    onClick={next}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow animate-pulse"
                  >
                    Continue →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: D2aa (conditional - multi-country with offerings) */}
        {step === 2 && showD2aa && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Geographic Availability</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              Are the <span className="text-blue-600">Insurance & Financial Protection support options</span> your 
              organization currently offers...?
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
                  onClick={() => setField("D2aa", opt)}
                  className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
                    ans.D2aa === opt
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

        {/* Step 3: D2.b open-end (OR Step 2 if no D2aa) */}
        {(step === 3 || (step === 2 && !showD2aa)) && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Benefits</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              What other insurance or financial protection benefits, if any, does your organization offer that weren't listed?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
            
            <textarea
              value={ans.d2b || ""}
              onChange={(e) => setField("d2b", e.target.value)}
              className="w-full min-h-[120px] px-4 py-3 border-2 border-gray-300 rounded-lg"
              placeholder="Describe any additional benefits..."
            />
            
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={ans.d2b_none || false}
                onChange={(e) => {
                  setField("d2b_none", e.target.checked);
                  if (e.target.checked) setField("d2b", "");
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
              Dimension 2 Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              You've successfully completed the Insurance & Financial Protection dimension.
            </p>
            <button
              onClick={() => { 
                localStorage.setItem("dimension2_complete", "true"); 
                router.push("/dashboard"); 
              }}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Save & Return to Dashboard →
            </button>
          </div>
        )}

        {/* Navigation Buttons (for steps 2-3) */}
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
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
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
