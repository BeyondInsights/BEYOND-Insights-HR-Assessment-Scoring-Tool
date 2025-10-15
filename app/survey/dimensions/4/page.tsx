"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Dimension4Page() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<any>({});
  const [errors, setErrors] = useState<string>("");
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isMultiCountry, setIsMultiCountry] = useState(false);

  // Load saved answers on mount
  useEffect(() => {
    const saved = localStorage.getItem("dimension4_data");
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
      localStorage.setItem("dimension4_data", JSON.stringify(ans));
    }
  }, [ans]);

  // Scroll to top when step changes (but not for progressive card navigation)
  useEffect(() => {
    if (step !== 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const D4A_ITEMS = [
    "Dedicated navigation support to help employees understand benefits and access medical care",
    "Benefits optimization assistance (maximizing coverage, minimizing costs)",
    "Insurance advocacy/appeals support",
    "Clinical trial matching service",
    "Care coordination concierge",
    "Online tools, apps, or portals for health/benefits support",
    "Survivorship planning assistance",
    "Nutrition coaching",
    "Physical rehabilitation support",
    "Occupational therapy/vocational rehabilitation"
  ];

  const D4_1A_OPTIONS = [
    "Credentialed internal staff dedicated to employee navigation (e.g. nurse, social worker, etc.)",
    "External vendor / service (contracted)",
    "Through health insurance carrier",
    "Through specialized medical provider",
    "Partnership with specialized health organization",
    "Other approach (specify):"
  ];

  const D4_1B_OPTIONS = [
    "Clinical guidance from a licensed medical/healthcare professional",
    "Insurance navigation",
    "Mental health support",
    "Caregiver resources",
    "Financial planning",
    "Return-to-work planning",
    "Treatment decision support / second opinion",
    "Company-sponsored peer support networks",
    "Some other service (specify)"
  ];

  const setField = (key: string, value: any) => {
    setAns((prev: any) => ({ ...prev, [key]: value }));
    setErrors("");
  };

  const setStatus = (item: string, status: string) => {
    setAns((prev: any) => ({
      ...prev,
      d4a: { ...(prev.d4a || {}), [item]: status }
    }));
    
    const nextUnansweredIndex = D4A_ITEMS.findIndex((itm, idx) => 
      idx > currentItemIndex && !ans.d4a?.[itm]
    );
    
    if (nextUnansweredIndex !== -1) {
      setTimeout(() => setCurrentItemIndex(nextUnansweredIndex), 300);
    } else {
      const allAnswered = D4A_ITEMS.every(item => ans.d4a?.[item]);
      if (allAnswered) {
        setTimeout(() => setStep(2), 500);
      }
    }
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
    setErrors("");
  };

  // Conditional logic
  const hasOfferedItems = ans.d4a && Object.values(ans.d4a).some((v: any) => v === "Currently offer");
  const showD4aa = isMultiCountry && hasOfferedItems;
  const showD4_1 = ans.d4a?.["Dedicated navigation support to help employees understand benefits and access medical care"] === "Currently offer";

  const validateStep = () => {
    switch(step) {
      case 1:
        const answeredCount = Object.keys(ans.d4a || {}).length;
        if (answeredCount < D4A_ITEMS.length) 
          return `Please evaluate all ${D4A_ITEMS.length} items (${answeredCount} completed)`;
        return null;
      case 2:
        if (showD4aa && !ans.d4aa) return "Please select one option";
        return null;
      case 4:
        if (showD4_1 && (!ans.d4_1a || ans.d4_1a.length === 0)) 
          return "Please select at least one provider type";
        return null;
      case 5:
        if (showD4_1 && (!ans.d4_1b || ans.d4_1b.length === 0)) 
          return "Please select at least one service";
        return null;
      default:
        return null;
    }
  };

  const next = () => {
    const error = validateStep();
    if (error) {
      setErrors(error);
      return;
    }

    if (step === 1) {
      setStep(showD4aa ? 2 : 3);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(showD4_1 ? 4 : 6);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      setStep(6);
    } else if (step === 6) {
      localStorage.setItem("dimension4_complete", "true");
      router.push("/dashboard");
    }
  };

  const back = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(showD4aa ? 2 : 1);
    } else if (step === 4) {
      setStep(3);
    } else if (step === 5) {
      setStep(4);
    } else if (step === 6) {
      setStep(showD4_1 ? 5 : 3);
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Step 0: Intro */}
        {step === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Dimension 4: Navigation & Expert Resources
            </h1>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p className="text-lg">
                This dimension assesses <strong>professionals providing healthcare coordination and guidance</strong>, including resources that help employees understand benefits and treatment access and access to expert support.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
                <p className="font-semibold text-blue-900 mb-2">What you'll evaluate:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Navigation support and benefits optimization</li>
                  <li>Insurance advocacy and clinical trial matching</li>
                  <li>Care coordination and online health tools</li>
                  <li>Survivorship planning and rehabilitation support</li>
                  <li>Provider types and service availability</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Begin Assessment →
            </button>
          </div>
        )}

        {/* Step 1: D4.a - Progressive Cards */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Navigation & Expert Resources Programs
              </h2>
              <p className="text-gray-600 mb-4">
                Please indicate the status of each support option within your organization.
              </p>
              <div className="text-sm text-gray-500 mb-6">
                Progress: {Object.keys(ans.d4a || {}).length} of {D4A_ITEMS.length} items completed
              </div>
            </div>

            {D4A_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className={`bg-white p-6 rounded-lg shadow-sm transition-all ${
                  idx === currentItemIndex
                    ? "ring-2 ring-blue-500 scale-[1.02]"
                    : idx < currentItemIndex
                    ? "opacity-60"
                    : "opacity-40"
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-4">{item}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {["Not able to offer in foreseeable future", "Assessing feasibility", "In active planning / development", "Currently offer"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatus(item, status)}
                      disabled={idx !== currentItemIndex}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        ans.d4a?.[item] === status
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      } ${idx !== currentItemIndex ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(ans.d4a || {}).length === D4A_ITEMS.length && (
              <button
                onClick={() => setStep(showD4aa ? 2 : 3)}
                className="w-full px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
              >
                Continue →
              </button>
            )}
          </div>
        )}

        {/* Step 2: D4.aa - Geographic Availability (conditional) */}
        {step === 2 && showD4aa && (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Geographic Availability
            </h2>
            <p className="text-gray-600 mb-6">
              Are the <strong>Navigation & Expert Resources</strong> your organization currently offers...?
            </p>
            {errors && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errors}</div>}
            <div className="space-y-3">
              {["Only available in select locations", "Vary across locations", "Generally consistent across all locations"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setField("d4aa", opt)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    ans.d4aa === opt
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

        {/* Step 3: D4.b - Open-ended */}
        {step === 3 && (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Additional Resources
            </h2>
            <p className="text-gray-600 mb-6">
              What other navigation or expert resources does your organization offer in any location that weren't listed? (Please be as specific and detailed as possible)
            </p>
            <textarea
              value={ans.d4b || ""}
              onChange={(e) => setField("d4b", e.target.value)}
              placeholder="Describe any additional navigation or expert resources..."
              className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <label className="flex items-center mt-4 text-gray-600">
              <input
                type="checkbox"
                checked={ans.d4b === "No other resources"}
                onChange={(e) => setField("d4b", e.target.checked ? "No other resources" : "")}
                className="mr-2"
              />
              No other resources
            </label>
          </div>
        )}

        {/* Step 4: D4.1a - Navigation Providers (conditional) */}
        {step === 4 && showD4_1 && (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Navigation Support Providers
            </h2>
            <p className="text-gray-600 mb-6">
              Who provides <strong>navigation support</strong> for employees managing cancer or other serious health conditions at your organization? (Select ALL that apply)
            </p>
            {errors && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errors}</div>}
            <div className="space-y-3">
              {D4_1A_OPTIONS.map((opt) => (
                <div key={opt}>
                  <button
                    onClick={() => toggleMultiSelect("d4_1a", opt)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      ans.d4_1a?.includes(opt)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                  {opt.includes("(specify)") && ans.d4_1a?.includes(opt) && (
                    <input
                      type="text"
                      value={ans.d4_1a_other || ""}
                      onChange={(e) => setField("d4_1a_other", e.target.value)}
                      placeholder="Please specify..."
                      className="mt-2 w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: D4.1b - Navigation Services (conditional) */}
        {step === 5 && showD4_1 && (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Available Navigation Services
            </h2>
            <p className="text-gray-600 mb-6">
              Which of the following <strong>services</strong> are available through your organization's navigation support for employees managing cancer or other serious health conditions? (Select ALL that apply)
            </p>
            {errors && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errors}</div>}
            <div className="space-y-3">
              {D4_1B_OPTIONS.map((opt) => (
                <div key={opt}>
                  <button
                    onClick={() => toggleMultiSelect("d4_1b", opt)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      ans.d4_1b?.includes(opt)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                  {opt.includes("(specify)") && ans.d4_1b?.includes(opt) && (
                    <input
                      type="text"
                      value={ans.d4_1b_other || ""}
                      onChange={(e) => setField("d4_1b_other", e.target.value)}
                      placeholder="Please specify..."
                      className="mt-2 w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  )}
                </div>
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
              Dimension 4 Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              You've successfully completed the Navigation & Expert Resources dimension.
            </p>
            <button
              onClick={() => { 
                localStorage.setItem("dimension4_complete", "true"); 
                router.push("/dashboard"); 
              }}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Save & Return to Dashboard →
            </button>
          </div>
        )}

        {/* Navigation - shows on steps 2-5 */}
        {step >= 2 && step <= 5 && (
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
