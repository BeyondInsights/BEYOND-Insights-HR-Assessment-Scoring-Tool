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

  // Validation
  const validateStep = () => {
    switch(step) {
      case 1: // D1.a
        const answeredCount = Object.keys(ans.d1a || {}).length;
        if (answeredCount < D1A_ITEMS.length) 
          return `Please evaluate all ${D1A_ITEMS.length} items (${answeredCount} completed)`;
        return null;
      
      case 2: // D1.aa (conditional)
        if (!ans.d1aa) return "Please select one option";
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

    if (step < 3) {
      setStep(step + 1);
      setErrors("");
    } else {
      router.push("/dashboard");
    }
  };

  const back = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors("");
    }
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
              onClick={() => router.push("/dashboard")}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Error display */}
        {errors && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors}
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
                <div className="flex items-center space-x-2 text-white">
                  
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Progress dots */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
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

                {/* Quick navigation */}
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
                    disabled={currentItemIndex === 0}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      currentItemIndex === 0 
                        ? "text-gray-300 cursor-not-allowed" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    
                  </button>
                </div>
              </div>

              {/* Summary of completed items */}
              <div className="border-t pt-6">
                <details className="cursor-pointer">
                  <summary className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    View completed responses ({Object.keys(ans.d1a || {}).length})
                  </summary>
                  <div className="mt-4 space-y-2">
                    {Object.entries(ans.d1a || {}).map(([item, status]: [string, any]) => (
                      <div key={item} className="flex justify-between items-start text-sm p-2 rounded hover:bg-gray-50">
                        <span className="text-gray-600 flex-1 mr-4">{item}</span>
                        <span className={`font-medium whitespace-nowrap ${
                          status === "Currently offer" ? "text-green-600" :
                          status === "In active planning / development" ? "text-yellow-600" :
                          status === "Assessing feasibility" ? "text-orange-600" :
                          status === "Not able to offer in foreseeable future" ? "text-red-600" :
                          "text-gray-500"
                        }`}>
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: D1.aa (conditional for multi-country) */}
        {step === 2 && (
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

  {/* Navigation for steps 2 and 3 */}
        {(step === 2 || step === 3) && (
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
              {step === 3 ? "Complete →" : "Continue →"}
            </button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}





