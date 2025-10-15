"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function EmployeeImpactPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<any>({});
  const [errors, setErrors] = useState<string>("");
  const [allDimensionsComplete, setAllDimensionsComplete] = useState(false);
  const [showEI4, setShowEI4] = useState(false);

  const EI1_OUTCOMES = [
    "Employee retention/tenure",
    "Employee morale",
    "Job satisfaction scores",
    "Productivity during treatment",
    "Time to return to work",
    "Recruitment success",
    "Team cohesion",
    "Trust in leadership",
    "Willingness to disclose health issues",
    "Overall engagement scores"
  ];

  const EI1_SCALE = [
    "No positive impact",
    "Minimal positive impact",
    "Moderate positive impact",
    "Significant positive impact",
    "Unable to assess"
  ];

  useEffect(() => {
    // Check if all 13 dimensions are complete
    let allComplete = true;
    for (let i = 1; i <= 13; i++) {
      const complete = localStorage.getItem(`dimension${i}_complete`) === 'true';
      if (!complete) {
        allComplete = false;
        break;
      }
    }
    
    if (!allComplete) {
      router.push("/dashboard");
      return;
    }
    
    setAllDimensionsComplete(true);

    // Randomly choose EI4 or EI5 (50/50 split)
    setShowEI4(Math.random() < 0.5);

    const saved = localStorage.getItem("employee_impact_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAns(parsed);
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }
  }, [router]);

  useEffect(() => {
    if (Object.keys(ans).length > 0) {
      localStorage.setItem("employee_impact_data", JSON.stringify(ans));
    }
  }, [ans]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const setField = (key: string, value: any) => {
    setAns((prev: any) => ({ ...prev, [key]: value }));
    setErrors("");
  };

  const setEI1Value = (outcome: string, value: string) => {
    setAns((prev: any) => ({
      ...prev,
      ei1: { ...(prev.ei1 || {}), [outcome]: value }
    }));
    setErrors("");
  };

  const showEI3 = ans.ei2 === "Yes, comprehensive ROI analysis completed" || 
                  ans.ei2 === "Yes, basic ROI analysis completed";

  const validateStep = () => {
    if (step === 1) {
      const answeredCount = Object.keys(ans.ei1 || {}).length;
      if (answeredCount < EI1_OUTCOMES.length) {
        return `Please rate all ${EI1_OUTCOMES.length} outcomes (${answeredCount} completed)`;
      }
    } else if (step === 2) {
      if (!ans.ei2) {
        return "Please select one option";
      }
    } else if (step === 3 && showEI3) {
      if (!ans.ei3) {
        return "Please select the approximate ROI";
      }
    }
    return null;
  };

  const next = () => {
    const error = validateStep();
    if (error) {
      setErrors(error);
      return;
    }

    if (step === 2) {
      // After EI2, go to EI3 if ROI measured, otherwise skip to EI4/EI5
      if (showEI3) {
        setStep(3);
      } else {
        setStep(4);
      }
    } else if (step === 3) {
      setStep(4); // EI4 or EI5
    } else if (step < 5) {
      setStep(step + 1);
      setErrors("");
    } else {
      localStorage.setItem("employee_impact_complete", "true");
      router.push("/dashboard");
    }
  };

  const back = () => {
    if (step === 4 && !showEI3) {
      setStep(2); // Skip EI3 going back
    } else if (step > 1) {
      setStep(step - 1);
      setErrors("");
    }
  };

  if (!allDimensionsComplete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Employee Impact Assessment
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 5) * 100}%` }}
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
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Employee Impact Assessment</h1>
              
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  This final section focuses on understanding the <strong>impact and outcomes</strong> of your workplace support programs for employees managing cancer or other serious health conditions.
                </p>
                <p className="text-gray-700">
                  Your insights will help establish benchmarks for program effectiveness and ROI across the industry.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">What to expect:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Rate positive outcomes in various areas (retention, morale, productivity, etc.)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Share whether you've measured ROI of your programs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Provide advice or insights based on your experience</span>
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

        {/* Step 1: EI1 - Positive Outcomes */}
        {step === 1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Program Outcomes</h2>
            
            <p className="font-bold text-gray-900 mb-2">
              To what extent has your organization seen <span className="text-blue-600">positive outcomes</span> in the following areas as a result of your workplace support programs for <span className="text-blue-600">employees managing cancer or other serious health conditions</span>?
            </p>
            <p className="text-sm text-gray-600 mb-6">(Select ONE for each outcome)</p>
            
            <div className="space-y-6">
              {EI1_OUTCOMES.map(outcome => (
                <div key={outcome} className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{outcome}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {EI1_SCALE.map(scale => (
                      <button
                        key={scale}
                        onClick={() => setEI1Value(outcome, scale)}
                        className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                          ans.ei1?.[outcome] === scale
                            ? "border-blue-500 bg-blue-50 font-semibold"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {scale}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Completed: {Object.keys(ans.ei1 || {}).length} of {EI1_OUTCOMES.length}
            </div>
          </div>
        )}

        {/* Step 2: EI2 - ROI Measurement */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ROI Measurement</h2>
            
            <p className="font-bold text-gray-900 mb-4">
              Have you <span className="text-blue-600">measured the ROI</span> of your workplace support programs for <span className="text-blue-600">employees managing cancer or other serious health conditions</span>?
            </p>
            <p className="text-sm text-gray-600 mb-6">(Select ONE)</p>
            
            <div className="space-y-2">
              {[
                "Yes, comprehensive ROI analysis completed",
                "Yes, basic ROI analysis completed",
                "Currently conducting ROI analysis",
                "Planning to measure ROI",
                "No plans to measure ROI"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => setField("ei2", opt)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    ans.ei2 === opt
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

        {/* Step 3: EI3 - ROI Amount (conditional) */}
        {step === 3 && showEI3 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Approximate ROI</h2>
            
            <p className="font-bold text-gray-900 mb-4">
              What was the <span className="text-blue-600">approximate ROI</span> of your workplace support programs?
            </p>
            <p className="text-sm text-gray-600 mb-6">(Select ONE)</p>
            
            <div className="space-y-2">
              {[
                "Negative ROI (costs exceed benefits by more than 100%)",
                "Break-even (costs and benefits are roughly equal)",
                "1.1 - 2.0x ROI (benefits are 10-100% more than costs)",
                "2.1 - 3.0x ROI (benefits are 2-3 times the costs)",
                "3.1 - 5.0x ROI (benefits are 3-5 times the costs)",
                "Greater than 5.0x ROI (benefits exceed 5 times the costs)"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => setField("ei3", opt)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    ans.ei3 === opt
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

        {/* Step 4: EI4 or EI5 - Open-ended */}
        {step === 4 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {showEI4 ? "Advice for Other HR Leaders" : "Additional Feedback"}
            </h2>
            
            {showEI4 ? (
              <>
                <p className="font-bold text-gray-900 mb-2">
                  Based on learnings from implementation of your programs and policies, what <span className="text-blue-600">advice would you give to other HR leaders</span> who want to improve support for <span className="text-blue-600">employees managing cancer or other serious health conditions</span>?
                </p>
                <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
              </>
            ) : (
              <>
                <p className="font-bold text-gray-900 mb-2">
                  Are there <span className="text-blue-600">any important aspects of supporting employees managing cancer or other serious health conditions</span> that this survey did not address?
                </p>
                <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
              </>
            )}
            
            <textarea
              value={ans[showEI4 ? 'ei4' : 'ei5'] || ""}
              onChange={(e) => setField(showEI4 ? 'ei4' : 'ei5', e.target.value)}
              className="w-full min-h-[150px] px-4 py-3 border-2 border-gray-300 rounded-lg"
              placeholder="Share your thoughts..."
            />
            
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={ans[showEI4 ? 'ei4_none' : 'ei5_none'] || false}
                onChange={(e) => {
                  setField(showEI4 ? 'ei4_none' : 'ei5_none', e.target.checked);
                  if (e.target.checked) setField(showEI4 ? 'ei4' : 'ei5', "");
                }}
                className="w-4 h-4 mr-2"
              />
              <span className="text-sm">{showEI4 ? "No additional advice" : "None that I can think of"}</span>
            </label>
          </div>
        )}

        {/* Step 5: Completion */}
        {step === 5 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Employee Impact Assessment Complete!
            </h2>
            <p className="text-lg font-semibold text-green-600 mb-4">
              🎉 Congratulations! You've completed the entire survey!
            </p>
            <p className="text-gray-600 mb-8">
              Thank you for providing such comprehensive information about your organization's workplace support programs.
            </p>
            <button
              onClick={() => { 
                localStorage.setItem("employee_impact_complete", "true"); 
                router.push("/dashboard"); 
              }}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Save & Return to Dashboard →
            </button>
          </div>
        )}

        {/* Navigation */}
        {step > 0 && step < 5 && (
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
