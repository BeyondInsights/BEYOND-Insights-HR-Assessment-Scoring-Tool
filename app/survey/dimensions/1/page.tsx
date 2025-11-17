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

// Data for D1.a - ALL 11 ITEMS FROM SURVEY
const D1A_ITEMS_BASE = [
  "Paid medical leave beyond local / legal requirements",
  "Intermittent leave beyond local / legal requirements",
  "Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)",
  "Remote work options for on-site employees",
  "Reduced schedule/part-time with full benefits",
  "Job protection beyond local / legal requirements",
  "Emergency leave within 24 hours",
  "Leave donation bank (employees can donate PTO to colleagues)",
  "Disability pay top-up (employer adds to disability insurance)",
  "PTO accrual during leave",
  "Paid micro-breaks for medical-related side effects",
  "Full salary (100%) continuation during cancer-related short-term disability leave"
];

export default function Dimension1Page() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<any>({});
  const [errors, setErrors] = useState<string>("");
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isMultiCountry, setIsMultiCountry] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [D1A_ITEMS] = useState(() => shuffleArray(D1A_ITEMS_BASE));
  const [resumeComplete, setResumeComplete] = useState(false); // Track resume sync
  
  // ===== VALIDATION ADDITIONS =====
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const isStepValid = (): boolean => {
    return validateStep() === null;
  };
  // ===== END VALIDATION ADDITIONS =====
  
  // Load saved answers on mount
  useEffect(() => {
    const saved = localStorage.getItem("dimension1_data");
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

  // ===== RESUME PROGRESS LOGIC =====
  // After data loads, calculate where to resume
  useEffect(() => {
    if (Object.keys(ans).length === 0) {
      setResumeComplete(true); // No saved data, ready to show
      return;
    }
    
    const gridAnswers = ans.d1a || {};
    const answeredCount = Object.keys(gridAnswers).length;
    
    // If some grid items answered but not all - find first unanswered
    if (answeredCount > 0 && answeredCount < D1A_ITEMS.length && step === 0) {
      setStep(1); // Go to grid
      const firstUnanswered = D1A_ITEMS.findIndex(item => !gridAnswers[item]);
      if (firstUnanswered !== -1) {
        setCurrentItemIndex(firstUnanswered);
      }
    }
    // If grid fully answered and still at intro, skip ahead
    else if (answeredCount === D1A_ITEMS.length && step === 0) {
      const hasAnyOffered = Object.values(gridAnswers).some(
        (status) => status === "Currently offer"
      );
      
      if (isMultiCountry && hasAnyOffered && !ans.d1aa) {
        setStep(2); // Go to D1aa
      } else if (!ans.d1b) {
        setStep(3); // Go to D1.b
      } else {
        setStep(3); // Start at D1.b, next() will navigate from there
      }
    }
    
    setResumeComplete(true); // Resume logic done, safe to show UI
  }, [ans, isMultiCountry]); // Run when ans or isMultiCountry changes
  // ===== END RESUME PROGRESS LOGIC =====

  // Save answers when they change
  useEffect(() => {
    if (Object.keys(ans).length > 0) {
      localStorage.setItem("dimension1_data", JSON.stringify(ans));
    }
  }, [ans]);

  // Scroll to top when step OR grid item changes (MOBILE FIX)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, currentItemIndex]);
  
  const setField = (key: string, value: any) => {
    setAns((prev: any) => ({ ...prev, [key]: value }));
    markTouched(key); // Mark field as touched
    setErrors("");
  };
  
  const toggleMultiSelect = (key: string, value: string) => {
    setAns((prev: any) => {
      const current = prev[key] || [];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((v: string) => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
    markTouched(key); // Mark field as touched
    setErrors("");
  };
  
  const setStatus = (item: string, status: string) => {
    setAns((prev: any) => ({
      ...prev,
      d1a: { ...(prev.d1a || {}), [item]: status }
    }));
    markTouched('d1a'); // Mark d1a as touched
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      const nextUnansweredIndex = D1A_ITEMS.findIndex((itm, idx) => 
        idx > currentItemIndex && !ans.d1a?.[itm]
      );
      
      if (nextUnansweredIndex !== -1) {
        setCurrentItemIndex(nextUnansweredIndex);
      } else if (currentItemIndex < D1A_ITEMS.length - 1) {
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

  // Check which conditional questions should be shown
  const showD1_1 = ans.d1a?.["Paid medical leave beyond local / legal requirements"] === "Currently offer";
  const showD1_2 = ans.d1a?.["Intermittent leave beyond local / legal requirements"] === "Currently offer";
  const showD1_4a = ans.d1a?.["Remote work options for on-site employees"] === "Currently offer";
  const showD1_4b = ans.d1a?.["Reduced schedule/part-time with full benefits"] === "Currently offer";
  const showD1_5 = ans.d1a?.["Job protection beyond local / legal requirements"] === "Currently offer";
  const showD1_6 = ans.d1a?.["Disability pay top-up (employer adds to disability insurance)"] === "Currently offer";

  // D1aa should show if multi-country AND at least one "Currently offer"
  const hasAnyOffered = Object.values(ans.d1a || {}).some(
    (status) => status === "Currently offer"
  );
  const showD1aa = isMultiCountry && hasAnyOffered;

  // Calculate total steps
  const getTotalSteps = () => {
    let total = 3; // intro, D1.a, D1.b
    if (showD1aa) total++; // D1aa
    if (showD1_1) total++;
    if (showD1_2) total++;
    if (showD1_4a) total++;
    if (showD1_4b) total++;
    if (showD1_5) total++;
    if (showD1_6) total++;
    total++; // completion screen
    return total;
  };

  // Validation
  const validateStep = () => {
    switch(step) {
      case 1: // D1.a
        const answeredCount = Object.keys(ans.d1a || {}).length;
        if (answeredCount < D1A_ITEMS.length) 
          return `Please evaluate all ${D1A_ITEMS.length} items (${answeredCount} completed)`;
        return null;
      
      case 2: // Could be D1aa OR D1.b
        if (showD1aa && !ans.d1aa) return "Please select one option";
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
      // After D1.a grid
      if (showD1aa) {
        setStep(2); // Go to D1aa
      } else {
        setStep(3); // Skip to D1.b
      }
    } else if (step === 2) {
      // From D1aa OR D1.b
      if (showD1aa && !ans.d1b && ans.d1aa) {
        setStep(3); // Go to D1.b
      } else {
        // From D1.b, check follow-ups
        if (showD1_1) setStep(4);
        else if (showD1_2) setStep(5);
        else if (showD1_4a) setStep(6);
        else if (showD1_4b) setStep(7);
        else if (showD1_5) setStep(8);
        else if (showD1_6) setStep(9);
        else setStep(10); // Completion
      }
    } else if (step === 3) {
      // From D1.b
      if (showD1_1) setStep(4);
      else if (showD1_2) setStep(5);
      else if (showD1_4a) setStep(6);
      else if (showD1_4b) setStep(7);
      else if (showD1_5) setStep(8);
      else if (showD1_6) setStep(9);
      else setStep(10); // Completion
    } else if (step === 4) {
      if (showD1_2) setStep(5);
      else if (showD1_4a) setStep(6);
      else if (showD1_4b) setStep(7);
      else if (showD1_5) setStep(8);
      else if (showD1_6) setStep(9);
      else setStep(10);
    } else if (step === 5) {
      if (showD1_4a) setStep(6);
      else if (showD1_4b) setStep(7);
      else if (showD1_5) setStep(8);
      else if (showD1_6) setStep(9);
      else setStep(10);
    } else if (step === 6) {
      if (showD1_4b) setStep(7);
      else if (showD1_5) setStep(8);
      else if (showD1_6) setStep(9);
      else setStep(10);
    } else if (step === 7) {
      if (showD1_5) setStep(8);
      else if (showD1_6) setStep(9);
      else setStep(10);
    } else if (step === 8) {
      if (showD1_6) setStep(9);
      else setStep(10);
    } else if (step === 9) {
      setStep(10);
    } else if (step === 10) {
      localStorage.setItem("dimension1_complete", "true");
      router.push("/dashboard");
      return;
    }
    
    setErrors("");
  };

  const back = () => {
    if (step > 3) {
      setStep(3); // From any follow-up, go back to D1.b
    } else if (step === 3) {
      setStep(showD1aa ? 2 : 1); // From D1.b
    } else if (step === 2) {
      setStep(1); // From D1aa to D1.a
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
              Dimension 1: Medical Leave & Flexibility
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
                Here is the first aspect of <strong>support programs</strong> for{" "}
                <strong>employees managing cancer or other serious health conditions</strong>:
              </p>

              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">MEDICAL LEAVE & FLEXIBILITY</h2>
                <p className="text-blue-100 text-lg">
                  Time off policies and schedule adaptations that enable employees to receive treatment
                  without sacrificing job security or income.
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

        {/* Step 1: D1.a Progressive Cards */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">MEDICAL LEAVE & FLEXIBILITY</h2>
                  <p className="text-gray-300 text-sm">
                    Time off policies and schedule adaptations for treatment without sacrificing job security or income
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
                      Progress: {Object.keys(ans.d1a || {}).length} of {D1A_ITEMS.length} items rated
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {Object.keys(ans.d1a || {}).length === D1A_ITEMS.length 
                        ? '✓ All items completed!' 
                        : `${D1A_ITEMS.length - Object.keys(ans.d1a || {}).length} items remaining`}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {Math.round((Object.keys(ans.d1a || {}).length / D1A_ITEMS.length) * 100)}%
                  </div>
                </div>
                <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(Object.keys(ans.d1a || {}).length / D1A_ITEMS.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">
                    {resumeComplete 
                      ? `Item ${currentItemIndex + 1} of ${D1A_ITEMS.length}`
                      : 'Loading position...'
                    }
                  </span>
                  <div className="flex gap-1">
                    {D1A_ITEMS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToItem(idx)}
                        className={`h-2 transition-all duration-500 rounded-full ${
                          ans.d1a?.[item]
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
                    {D1A_ITEMS[currentItemIndex]}
                  </h3>
                  <p className="text-xs italic text-gray-600 mb-4">
                    We recognize that implementation may vary based on country/jurisdiction-specific laws and regulations.
                  </p>
                  
                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatus(D1A_ITEMS[currentItemIndex], status)}
                        disabled={isTransitioning}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all transform ${
                          isTransitioning
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:scale-[1.02] cursor-pointer'
                        } ${
                          ans.d1a?.[D1A_ITEMS[currentItemIndex]] === status
                            ? "border-blue-500 bg-blue-50 shadow-lg"
                            : "border-gray-200 hover:border-gray-300 bg-white hover:shadow"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all ${
                            ans.d1a?.[D1A_ITEMS[currentItemIndex]] === status
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 bg-white"
                          }`}>
                            {ans.d1a?.[D1A_ITEMS[currentItemIndex]] === status && (
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

                {Object.keys(ans.d1a || {}).length === D1A_ITEMS.length && !isTransitioning && (
                  <button
                    onClick={next}
                    disabled={!isStepValid()}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                      isStepValid()
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg cursor-pointer animate-pulse'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    Continue →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: D1aa (conditional - multi-country with offerings) */}
        {step === 2 && showD1aa && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Geographic Availability</h3>
            
            <div className={`border-2 rounded-lg p-4 ${
              touched.d1aa && !ans.d1aa
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 bg-white'
            }`}>
              <p className="font-bold text-gray-900 mb-1">
                Are the <span className="text-blue-600">Medical Leave & Flexibility support options</span> your 
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
                    onClick={() => setField("d1aa", opt)}
                    className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
                      ans.d1aa === opt
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

        {/* Step 3: D1.b open-end (OR Step 2 if no D1aa) */}
        {(step === 3 || (step === 2 && !showD1aa)) && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Benefits</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              What other medical leave or flexibility benefits, if any, does your organization offer that weren't listed?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
            
            <textarea
              value={ans.d1b || ""}
              onChange={(e) => setField("d1b", e.target.value)}
              className="w-full min-h-[120px] px-4 py-3 border-2 border-gray-300 rounded-lg"
              placeholder="Describe any additional benefits..."
            />
            
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={ans.d1b_none || false}
                onChange={(e) => {
                  setField("d1b_none", e.target.checked);
                  if (e.target.checked) setField("d1b", "");
                }}
                className="w-4 h-4 mr-2"
              />
              <span className="text-sm">No other benefits</span>
            </label>
          </div>
        )}

        {/* D1.1 - Paid medical leave grid */}
        {step === 4 && showD1_1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Paid Medical Leave</h3>
            
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Beyond legally required leave</span>, what <strong>additional paid medical leave</strong> do you provide for <strong>employees managing cancer or other serious health conditions</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Select ONE for each market)</p>
            <p className="text-xs text-gray-500 italic mb-6">
              For markets outside USA, provide the most common scenario OR the average if it varies significantly
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 table-fixed">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="text-left p-2 border-b border-r font-medium w-1/4">Market</th>
                    <th className="p-2 border-b border-r text-center text-sm">1 to less than<br/>3 weeks</th>
                    <th className="p-2 border-b border-r text-center text-sm">3 to less than<br/>5 weeks</th>
                    <th className="p-2 border-b border-r text-center text-sm">5 to less than<br/>9 weeks</th>
                    <th className="p-2 border-b border-r text-center text-sm">9 to less than<br/>13 weeks</th>
                    <th className="p-2 border-b border-r text-center text-sm">13 or more<br/>weeks</th>
                    <th className="p-2 border-b text-center text-sm">Does not<br/>apply</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="p-2 border-b border-r text-sm">
                      <strong>Employees based in the USA</strong><br/>
                      <span className="text-sm text-gray-600">(beyond FMLA / state requirements)</span>
                    </td>
                    <td className="p-2 border-b border-r text-center">
                      <input type="radio" name="d1_1_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_usa", "1 to less than 3 weeks")}
                        checked={ans.d1_1_usa === "1 to less than 3 weeks"}/>
                    </td>
                    <td className="p-2 border-b border-r text-center">
                      <input type="radio" name="d1_1_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_usa", "3 to less than 5 weeks")}
                        checked={ans.d1_1_usa === "3 to less than 5 weeks"}/>
                    </td>
                    <td className="p-2 border-b border-r text-center">
                      <input type="radio" name="d1_1_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_usa", "5 to less than 9 weeks")}
                        checked={ans.d1_1_usa === "5 to less than 9 weeks"}/>
                    </td>
                    <td className="p-2 border-b border-r text-center">
                      <input type="radio" name="d1_1_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_usa", "9 to less than 13 weeks")}
                        checked={ans.d1_1_usa === "9 to less than 13 weeks"}/>
                    </td>
                    <td className="p-2 border-b border-r text-center">
                      <input type="radio" name="d1_1_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_usa", "13 or more weeks")}
                        checked={ans.d1_1_usa === "13 or more weeks"}/>
                    </td>
                    <td className="p-2 border-b text-center">
                      <input type="radio" name="d1_1_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_usa", "Does not apply")}
                        checked={ans.d1_1_usa === "Does not apply"}/>
                    </td>
                  </tr>
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="p-2 border-r text-sm">
                      <strong>Employees based <span className="underline">outside</span> the USA</strong><br/>
                      <span className="text-sm text-gray-600">(beyond statutory requirements)</span>
                    </td>
                    <td className="p-2 border-r text-center">
                      <input type="radio" name="d1_1_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_non_usa", "1 to less than 3 weeks")}
                        checked={ans.d1_1_non_usa === "1 to less than 3 weeks"}/>
                    </td>
                    <td className="p-2 border-r text-center">
                      <input type="radio" name="d1_1_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_non_usa", "3 to less than 5 weeks")}
                        checked={ans.d1_1_non_usa === "3 to less than 5 weeks"}/>
                    </td>
                    <td className="p-2 border-r text-center">
                      <input type="radio" name="d1_1_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_non_usa", "5 to less than 9 weeks")}
                        checked={ans.d1_1_non_usa === "5 to less than 9 weeks"}/>
                    </td>
                    <td className="p-2 border-r text-center">
                      <input type="radio" name="d1_1_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_non_usa", "9 to less than 13 weeks")}
                        checked={ans.d1_1_non_usa === "9 to less than 13 weeks"}/>
                    </td>
                    <td className="p-2 border-r text-center">
                      <input type="radio" name="d1_1_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_non_usa", "13 or more weeks")}
                        checked={ans.d1_1_non_usa === "13 or more weeks"}/>
                    </td>
                    <td className="p-2 text-center">
                      <input type="radio" name="d1_1_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_1_non_usa", "Does not apply")}
                        checked={ans.d1_1_non_usa === "Does not apply"}/>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* D1.2 - Intermittent leave grid */}
        {step === 5 && showD1_2 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Intermittent Leave</h3>
            
            <p className="text-gray-700 mb-2">
              Beyond legally required intermittent leave, what <strong>additional intermittent leave</strong> do you provide for <strong>employees managing cancer or other serious health conditions</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-6">(Select ONE for each market)</p>
            
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="text-left p-4 border-r border-b font-medium" style={{ width: '30%' }}>
                      <div className="text-base">Additional Leave Options</div>
                    </th>
                    <th className="p-4 border-r border-b text-center" style={{ width: '35%' }}>
                      <div className="font-semibold text-base">Employees based in the USA</div>
                      <div className="text-sm font-normal text-blue-100 mt-1">(beyond FMLA / state requirements)</div>
                    </th>
                    <th className="p-4 border-b text-center" style={{ width: '35%' }}>
                      <div className="font-semibold text-base">Employees based outside the USA</div>
                      <div className="text-sm font-normal text-blue-100 mt-1">(beyond statutory requirements)</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    "No additional leave",
                    "1 to 4 additional weeks",
                    "5 to 11 additional weeks",
                    "12 to 23 additional weeks",
                    "24 or more additional weeks",
                    "Unlimited based on medical need",
                    "Does not apply"
                  ].map((option, idx) => (
                    <tr key={option} className={`hover:bg-orange-50 transition-colors ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                      <td className="p-4 border-r font-medium text-base">
                        {option}
                      </td>
                      <td className="p-4 border-r text-center">
                        <input
                          type="radio"
                          name="d1_2_usa"
                          className="w-5 h-5 cursor-pointer accent-blue-600"
                          onChange={() => setField("d1_2_usa", option)}
                          checked={ans.d1_2_usa === option}
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="radio"
                          name="d1_2_non_usa"
                          className="w-5 h-5 cursor-pointer accent-blue-600"
                          onChange={() => setField("d1_2_non_usa", option)}
                          checked={ans.d1_2_non_usa === option}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* D1.4a - Remote work */}
        {step === 6 && showD1_4a && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Remote Work Time</h3>
            
            <p className="text-gray-700 mb-6">
              Beyond local/legal requirements and your standard company policy, how much <strong>additional</strong> remote work time do you provide for employees <strong>managing cancer or another serious health condition</strong> in positions that normally require on-site / office presence?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
            
            <div className="space-y-2">
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="d1_4a_type"
                    checked={ans.d1_4a_type === "weeks"}
                    onChange={() => setField("d1_4a_type", "weeks")}
                    className="mr-2"
                  />
                  <span className="font-medium mr-2">If answering in weeks:</span>
                  <span>Up to</span>
                  <input
                    type="number"
                    value={ans.d1_4a_weeks || ""}
                    onChange={(e) => {
                      setField("d1_4a_weeks", e.target.value);
                      setField("d1_4a_type", "weeks");
                      setField("d1_4a", `Up to ${e.target.value} weeks`);
                    }}
                    className="mx-2 w-20 px-2 py-1 border rounded"
                    placeholder="#"
                  />
                  <span>weeks</span>
                </label>
              </div>

              <div className="border-2 border-gray-200 rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="d1_4a_type"
                    checked={ans.d1_4a_type === "months"}
                    onChange={() => setField("d1_4a_type", "months")}
                    className="mr-2"
                  />
                  <span className="font-medium mr-2">If answering in months:</span>
                  <span>Up to</span>
                  <input
                    type="number"
                    value={ans.d1_4a_months || ""}
                    onChange={(e) => {
                      setField("d1_4a_months", e.target.value);
                      setField("d1_4a_type", "months");
                      setField("d1_4a", `Up to ${e.target.value} months`);
                    }}
                    className="mx-2 w-20 px-2 py-1 border rounded"
                    placeholder="#"
                  />
                  <span>months</span>
                </label>
              </div>

              {[
                "As long as requested by healthcare provider",
                "As long as medically necessary",
                "Unlimited with medical certification",
                "Case-by-case basis",
                "No additional remote work beyond legal requirements"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    setField("d1_4a", opt);
                    setField("d1_4a_type", "other");
                  }}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    ans.d1_4a === opt
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

        {/* D1.4b - Reduced schedule */}
        {step === 7 && showD1_4b && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Part-Time/Reduced Schedule with Full Benefits</h3>
            
            <p className="text-gray-700 mb-6">
              Beyond local/legal requirements and your standard company policy, how long can employees <strong>managing cancer or another serious health condition</strong> work part-time/reduced schedule while keeping full benefits?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
            
            <div className="space-y-2">
              {[
                "Up to 4 weeks",
                "5 to less than 13 weeks",
                "13 to less than 26 weeks",
                "26 weeks or more",
                "As long as requested by healthcare provider",
                "As long as medically necessary",
                "Case-by-case basis",
                "No additional time beyond legal requirements"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => setField("d1_4b", opt)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    ans.d1_4b === opt
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

        {/* D1.5 - Job protection grid */}
        {step === 8 && showD1_5 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Job Protection Guarantee</h3>
            
            <p className="text-gray-700 mb-2">
              <span className="underline">Beyond legally required leave</span>, how many weeks do you <strong>guarantee job protection</strong> for <strong>employees managing cancer or other serious health conditions</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Select ONE for each market)</p>
            <p className="text-xs text-gray-500 italic mb-6">
              For markets outside USA, provide the most common scenario OR the average if it varies significantly
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 table-fixed">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="text-left p-2 border-b border-r font-medium w-1/4">Market</th>
                    <th className="p-2 border-b border-r text-center text-sm">1 to less than<br/>4 weeks</th>
                    <th className="p-2 border-b border-r text-center text-sm">4 to less than<br/>12 weeks</th>
                    <th className="p-2 border-b border-r text-center text-sm">12 to less than<br/>26 weeks</th>
                    <th className="p-2 border-b border-r text-center text-sm">26 to less than<br/>52 weeks</th>
                    <th className="p-2 border-b border-r text-center text-sm">52 weeks<br/>or more</th>
                    <th className="p-2 border-b text-center text-sm">Does not<br/>apply</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="p-2 border-b border-r text-sm">
                      <strong>Employees based in the USA</strong><br/>
                      <span className="text-sm text-gray-600">(beyond FMLA / state requirements)</span>
                    </td>
                    <td className="p-2 border-b border-r text-center">
                      <input type="radio" name="d1_5_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_usa", "1 to less than 4 weeks")}
                        checked={ans.d1_5_usa === "1 to less than 4 weeks"}/>
                    </td>
                    <td className="p-2 border-b border-r text-center">
                      <input type="radio" name="d1_5_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_usa", "4 to less than 12 weeks")}
                        checked={ans.d1_5_usa === "4 to less than 12 weeks"}/>
                    </td>
                    <td className="p-2 border-b border-r text-center">
                      <input type="radio" name="d1_5_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_usa", "12 to less than 26 weeks")}
                        checked={ans.d1_5_usa === "12 to less than 26 weeks"}/>
                    </td>
                    <td className="p-2 border-b border-r text-center">
                      <input type="radio" name="d1_5_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_usa", "26 to less than 52 weeks")}
                        checked={ans.d1_5_usa === "26 to less than 52 weeks"}/>
                    </td>
                    <td className="p-2 border-b border-r text-center">
                      <input type="radio" name="d1_5_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_usa", "52 weeks or more")}
                        checked={ans.d1_5_usa === "52 weeks or more"}/>
                    </td>
                    <td className="p-2 border-b text-center">
                      <input type="radio" name="d1_5_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_usa", "Does not apply")}
                        checked={ans.d1_5_usa === "Does not apply"}/>
                    </td>
                  </tr>
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="p-2 border-r text-sm">
                      <strong>Employees based <span className="underline">outside</span> the USA</strong><br/>
                      <span className="text-sm text-gray-600">(beyond statutory requirements)</span>
                    </td>
                    <td className="p-2 border-r text-center">
                      <input type="radio" name="d1_5_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_non_usa", "1 to less than 4 weeks")}
                        checked={ans.d1_5_non_usa === "1 to less than 4 weeks"}/>
                    </td>
                    <td className="p-2 border-r text-center">
                      <input type="radio" name="d1_5_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_non_usa", "4 to less than 12 weeks")}
                        checked={ans.d1_5_non_usa === "4 to less than 12 weeks"}/>
                    </td>
                    <td className="p-2 border-r text-center">
                      <input type="radio" name="d1_5_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_non_usa", "12 to less than 26 weeks")}
                        checked={ans.d1_5_non_usa === "12 to less than 26 weeks"}/>
                    </td>
                    <td className="p-2 border-r text-center">
                      <input type="radio" name="d1_5_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_non_usa", "26 to less than 52 weeks")}
                        checked={ans.d1_5_non_usa === "26 to less than 52 weeks"}/>
                    </td>
                    <td className="p-2 border-r text-center">
                      <input type="radio" name="d1_5_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_non_usa", "52 weeks or more")}
                        checked={ans.d1_5_non_usa === "52 weeks or more"}/>
                    </td>
                    <td className="p-2 text-center">
                      <input type="radio" name="d1_5_non_usa" className="w-4 h-4"
                        onChange={() => setField("d1_5_non_usa", "Does not apply")}
                        checked={ans.d1_5_non_usa === "Does not apply"}/>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

{/* D1.6 - Disability enhancement - MULTI SELECT */}
{step === 9 && showD1_6 && (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-xl font-bold text-gray-900 mb-4">Enhanced Disability Benefits</h3>
    
    <p className="text-gray-700 mb-2">
      For <strong>markets where you provide disability insurance</strong>, do you <strong>enhance disability benefits</strong> for <strong>employees managing cancer or other serious health conditions</strong> beyond standard coverage?
    </p>
    <p className="text-sm text-gray-600 mb-4">(Select ALL that apply)</p>
    
    <div className="space-y-2">
      {[
        "Enhance short-term disability (higher % of salary)",
        "Enhance long-term disability (higher % of salary)",
        "Extend duration of benefits",
        "Reduce/waive waiting periods",
        "No enhancement - same as standard",
        "Not applicable - government disability only"
      ].map(opt => (
        <button
          key={opt}
          onClick={() => toggleMultiSelect("d1_6", opt)}
          className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
            ans.d1_6?.includes(opt)
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

        {/* Step 10: Completion */}
        {step === 10 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Dimension 1 Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              You've successfully completed the Medical Leave & Flexibility dimension.
            </p>
            <button
              onClick={() => { 
                localStorage.setItem("dimension1_complete", "true"); 
                router.push("/dashboard"); 
              }}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Save & Return to Dashboard →
            </button>
          </div>
        )}

        {/* Navigation Buttons (for steps 2-9) */}
        {step > 1 && step < 10 && (
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
