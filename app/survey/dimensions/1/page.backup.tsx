"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Dimension1Page() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<any>({});
  const [errors, setErrors] = useState<string>("");
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isMultiCountry, setIsMultiCountry] = useState(false);

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

    // Check if multi-country from screener
    const screenerData = localStorage.getItem("screener_data");
    if (screenerData) {
      const parsed = JSON.parse(screenerData);
      setIsMultiCountry(parsed.s9a !== "No other countries - headquarters only");
    }
  }, []);

  // Save answers when they change
  useEffect(() => {
    if (Object.keys(ans).length > 0) {
      localStorage.setItem("dimension1_data", JSON.stringify(ans));
    }
  }, [ans]);

  // Set field helper
  const setField = (key: string, value: any) => {
    setAns((prev: any) => ({ ...prev, [key]: value }));
    setErrors("");
  };

  // Set status for D1.a grid items
  const setStatus = (item: string, status: string) => {
    setAns((prev: any) => ({
      ...prev,
      d1a: { ...(prev.d1a || {}), [item]: status }
    }));
    
    // Auto-advance to next unanswered item
    const nextUnansweredIndex = D1A_ITEMS.findIndex((itm, idx) => 
      idx > currentItemIndex && !ans.d1a?.[itm]
    );
    
    if (nextUnansweredIndex !== -1) {
      setTimeout(() => setCurrentItemIndex(nextUnansweredIndex), 300);
    } else if (currentItemIndex < D1A_ITEMS.length - 1) {
      setTimeout(() => setCurrentItemIndex(currentItemIndex + 1), 300);
    }
  };

  // Navigate to specific item
  const goToItem = (index: number) => {
    setCurrentItemIndex(index);
  };

  // Data for D1.a
  const D1A_ITEMS = [
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
    "Paid micro-breaks for side effects"
  ];

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

  // Calculate total steps based on conditions
  const getTotalSteps = () => {
    let total = 4; // intro, D1.a, D1.aa (if multi), D1.b
    if (showD1_1) total++;
    if (showD1_2) total++;
    if (showD1_4a) total++;
    if (showD1_4b) total++;
    if (showD1_5) total++;
    if (showD1_6) total++;
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
      
      case 2: // D1.aa (conditional)
        if (isMultiCountry && !ans.d1aa) return "Please select one option";
        return null;
        
      case 3: // D1.b
        // Optional open-end
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

    // Handle navigation based on conditional logic
    if (step === 1) {
      // After D1.a, go to D1.aa if multi-country, otherwise D1.b
      if (isMultiCountry) {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2) {
      // After D1.aa, go to D1.b
      setStep(3);
    } else if (step === 3) {
      // After D1.b, check for conditional questions
      if (showD1_1) setStep(4);
      else if (showD1_2) setStep(5);
      else if (showD1_4a) setStep(6);
      else if (showD1_4b) setStep(7);
      else if (showD1_5) setStep(8);
      else if (showD1_6) setStep(9);
      else {
        localStorage.setItem("dimension1_complete", "true");
        router.push("/dashboard");
        return;
      }
    } else if (step === 4) {
      // After D1.1
      if (showD1_2) setStep(5);
      else if (showD1_4a) setStep(6);
      else if (showD1_4b) setStep(7);
      else if (showD1_5) setStep(8);
      else if (showD1_6) setStep(9);
      else localStorage.setItem("dimension1_complete", "true");
        router.push("/dashboard");
    } else if (step === 5) {
      // After D1.2
      if (showD1_4a) setStep(6);
      else if (showD1_4b) setStep(7);
      else if (showD1_5) setStep(8);
      else if (showD1_6) setStep(9);
      else localStorage.setItem("dimension1_complete", "true");
        router.push("/dashboard");
    } else if (step === 6) {
      // After D1.4a
      if (showD1_4b) setStep(7);
      else if (showD1_5) setStep(8);
      else if (showD1_6) setStep(9);
      else localStorage.setItem("dimension1_complete", "true");
        router.push("/dashboard");
    } else if (step === 7) {
      // After D1.4b
      if (showD1_5) setStep(8);
      else if (showD1_6) setStep(9);
      else localStorage.setItem("dimension1_complete", "true");
        router.push("/dashboard");
    } else if (step === 8) {
      // After D1.5
      if (showD1_6) setStep(9);
      else localStorage.setItem("dimension1_complete", "true");
        router.push("/dashboard");
    } else {
      localStorage.setItem("dimension1_complete", "true");
        router.push("/dashboard");
    }
    
    setErrors("");
  };

  const back = () => {
  if (step > 3) {
    // From any conditional question, go back to D1.b
    setStep(3);
  } else if (step === 3) {
    // From D1.b, go to D1.aa if multi-country, otherwise D1.a
    setStep(isMultiCountry ? 2 : 1);
  } else if (step === 2) {
    // From D1.aa go to D1.a
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
              Dimension 1: Medical Leave & Flexibility
            </span>
            <button 
              onClick={() => { localStorage.setItem("dimension1_complete", "true"); router.push("/dashboard"); }}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              
            </button>
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
                  Begin Assessment →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: D1.a Progressive Cards */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm">
            {/* Header with gradient */}
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
              {/* Progress dots */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">
                    Item {currentItemIndex + 1} of {D1A_ITEMS.length}
                  </span>
                  <div className="flex gap-1">
                    {D1A_ITEMS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToItem(idx)}
                        className={`h-2 transition-all rounded-full ${
                          ans.d1a?.[item] 
                            ? "w-8 bg-blue-600 hover:bg-blue-700 cursor-pointer" 
                            : "w-2 bg-gray-300 hover:bg-gray-400 cursor-pointer"
                        }`}
                        title={item}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Item Card */}
              <div className="mb-6">
                <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8 rounded-xl border-2 border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    {D1A_ITEMS[currentItemIndex]}
                  </h3>

                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatus(D1A_ITEMS[currentItemIndex], status)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all transform hover:scale-[1.02] ${
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

              {/* Previous button only - no summary */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
                  disabled={currentItemIndex === 0}
                  className={`px-4 py-2 text-sm font-medium ${
                    currentItemIndex === 0 
                      ? "text-gray-300 cursor-not-allowed" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  ← View previous option
                </button>
                
                {/* Continue button only shows when ALL items answered */}
                {Object.keys(ans.d1a || {}).length === D1A_ITEMS.length && (
                  <button
                    onClick={next}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                  >
                    Continue →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: D1.aa (conditional for multi-country) */}
        {step === 2 && isMultiCountry && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Geographic Availability</h3>
            
            <p className="font-bold text-gray-900 mb-4">
              Are the <span className="text-blue-600">Medical Leave & Flexibility support options</span> your 
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
        )}

        {/* Step 3: D1.b open-end */}
        {step === 3 && (
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

        {/* D1.1 - Paid medical leave details */}
        {step === 4 && showD1_1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Paid Medical Leave</h3>
            
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Beyond legally required leave</span>, what <strong>additional paid medical leave</strong> do you provide for <strong>employees managing cancer or other serious health conditions</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              (Select ONE for each market)
            </p>
            <p className="text-xs text-gray-500 italic mb-6">
              For markets outside USA, provide the most common scenario OR the average if it varies significantly
            </p>
            
            <div className="space-y-6">
              {/* USA Market */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Employees <strong>based in the USA</strong> (beyond FMLA / state requirements)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "1 to less than 3 weeks",
                    "3 to less than 5 weeks",
                    "5 to less than 9 weeks",
                    "9 to less than 13 weeks",
                    "13 or more weeks",
                    "Does not apply"
                  ].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setField("d1_1_usa", opt)}
                      className={`px-4 py-3 text-left rounded-lg border-2 transition-all ${
                        ans.d1_1_usa === opt
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Non-USA Market */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Employees <strong>based <span className="underline">outside</span> the USA</strong> (beyond statutory requirements)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "1 to less than 3 weeks",
                    "3 to less than 5 weeks",
                    "5 to less than 9 weeks",
                    "9 to less than 13 weeks",
                    "13 or more weeks",
                    "Does not apply"
                  ].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setField("d1_1_non_usa", opt)}
                      className={`px-4 py-3 text-left rounded-lg border-2 transition-all ${
                        ans.d1_1_non_usa === opt
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
          </div>
        )}

        {/* D1.2 - Intermittent leave details */}
        {step === 5 && showD1_2 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Intermittent Leave</h3>
            
            <p className="text-gray-700 mb-2">
              Beyond legally required intermittent leave, what <strong>additional intermittent leave</strong> do you provide for <strong>employees managing cancer or other serious health conditions</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-6">(Select ONE for each market)</p>
            
            <div className="space-y-6">
              {/* USA Market */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Employees <strong>based in the USA</strong> (beyond FMLA / state requirements)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "No additional leave",
                    "1 to 4 additional weeks",
                    "5 to 11 additional weeks",
                    "12 to 23 additional weeks",
                    "24 or more additional weeks",
                    "Unlimited based on medical need",
                    "Does not apply"
                  ].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setField("d1_2_usa", opt)}
                      className={`px-4 py-3 text-left rounded-lg border-2 transition-all ${
                        ans.d1_2_usa === opt
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Non-USA Market */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Employees <strong>based <span className="underline">outside</span> the USA</strong> (beyond statutory requirements)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "No additional leave",
                    "1 to 4 additional weeks",
                    "5 to 11 additional weeks",
                    "12 to 23 additional weeks",
                    "24 or more additional weeks",
                    "Unlimited based on medical need",
                    "Does not apply"
                  ].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setField("d1_2_non_usa", opt)}
                      className={`px-4 py-3 text-left rounded-lg border-2 transition-all ${
                        ans.d1_2_non_usa === opt
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
          </div>
        )}

        {/* D1.4a - Remote work options */}
        {step === 6 && showD1_4a && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Remote Work Time</h3>
            
            <p className="text-gray-700 mb-6">
              Beyond local/legal requirements and your standard company policy, how much <strong>additional</strong> remote work time do you provide for employees <strong>managing cancer or another serious health condition</strong> in positions that normally require on-site / office presence?
            </p>
            <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
            
            <div className="space-y-2">
              {/* Number inputs for weeks/months */}
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

              {/* Other options */}
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

        {/* D1.4b - Reduced schedule with full benefits */}
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

        {/* D1.5 - Job protection */}
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
            
            <div className="space-y-6">
              {/* USA Market */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Employees <strong>based in the USA</strong> (beyond FMLA / state requirements)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "1 to less than 4 weeks",
                    "4 to less than 12 weeks",
                    "12 to less than 26 weeks",
                    "26 to less than 52 weeks",
                    "52 weeks or more",
                    "Does not apply"
                  ].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setField("d1_5_usa", opt)}
                      className={`px-4 py-3 text-left rounded-lg border-2 transition-all ${
                        ans.d1_5_usa === opt
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Non-USA Market */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Employees <strong>based <span className="underline">outside</span> the USA</strong> (beyond statutory requirements)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "1 to less than 4 weeks",
                    "4 to less than 12 weeks",
                    "12 to less than 26 weeks",
                    "26 to less than 52 weeks",
                    "52 weeks or more",
                    "Does not apply"
                  ].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setField("d1_5_non_usa", opt)}
                      className={`px-4 py-3 text-left rounded-lg border-2 transition-all ${
                        ans.d1_5_non_usa === opt
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
          </div>
        )}

        {/* D1.6 - Disability pay enhancement */}
        {step === 9 && showD1_6 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Enhanced Disability Benefits</h3>
            
            <p className="text-gray-700 mb-6">
              For <strong>markets where you provide disability insurance</strong>, do you <strong>enhance disability benefits</strong> for <strong>employees managing cancer or other serious health conditions</strong> beyond standard coverage?
            </p>
            
            <div className="space-y-2">
              {[
                "Yes - higher percentage of salary replacement",
                "Yes - extended benefit duration",
                "Yes - reduced or waived waiting period",
                "Yes - combination of enhancements",
                "No - standard disability benefits only",
                "Not applicable - no disability insurance offered"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => setField("d1_6", opt)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    ans.d1_6 === opt
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

{/* Universal Navigation - shows on all steps except step 1 grid */}
        {step > 1 && (
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









