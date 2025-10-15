"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EI1_ITEMS = [
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

const EI1_OPTIONS = [
  { value: "no_impact", label: "No positive impact" },
  { value: "minimal", label: "Minimal positive impact" },
  { value: "moderate", label: "Moderate positive impact" },
  { value: "significant", label: "Significant positive impact" },
  { value: "unable", label: "Unable to assess" }
];

export default function EmployeeImpactPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<any>({});
  const [errors, setErrors] = useState<string>("");
  const [allDimensionsComplete, setAllDimensionsComplete] = useState(false);
  const [assignedQuestion, setAssignedQuestion] = useState<'ei4' | 'ei5'>('ei4');
  const [shuffledItems] = useState(() => {
    const shuffled = [...EI1_ITEMS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

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

    const saved = localStorage.getItem("employee-impact-assessment_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAns(parsed);
        
        // Check if they already have an assignment
        if (parsed.assignedQuestion) {
          setAssignedQuestion(parsed.assignedQuestion);
        } else {
          // Randomly assign them to EI4 or EI5 (50/50 split)
          const assigned = Math.random() < 0.5 ? 'ei4' : 'ei5';
          setAssignedQuestion(assigned);
          setAns((prev: any) => ({ ...prev, assignedQuestion: assigned }));
        }
      } catch (e) {
        console.error("Error loading saved data:", e);
        // New respondent - randomly assign
        const assigned = Math.random() < 0.5 ? 'ei4' : 'ei5';
        setAssignedQuestion(assigned);
        setAns({ assignedQuestion: assigned });
      }
    } else {
      // New respondent - randomly assign
      const assigned = Math.random() < 0.5 ? 'ei4' : 'ei5';
      setAssignedQuestion(assigned);
      setAns({ assignedQuestion: assigned });
    }
  }, [router]);

  useEffect(() => {
    if (Object.keys(ans).length > 0) {
      localStorage.setItem("employee-impact-assessment_data", JSON.stringify(ans));
    }
  }, [ans]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleGridChange = (item: string, value: string) => {
    setAns((prev: any) => ({
      ...prev,
      ei1: {
        ...prev.ei1,
        [item]: value
      }
    }));
    setErrors("");
  };

  const handleRadioChange = (field: string, value: string) => {
    setAns({ ...ans, [field]: value });
    setErrors("");
  };

  const handleTextChange = (field: string, value: string) => {
    setAns({ ...ans, [field]: value });
    setErrors("");
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    if (checked) {
      setAns({ ...ans, [field]: "", [`${field}_none`]: true });
    } else {
      setAns({ ...ans, [`${field}_none`]: false });
    }
  };

  const validateStep = () => {
    if (step === 1) {
      // Check all EI1 items are answered
      const allAnswered = shuffledItems.every(item => ans.ei1?.[item]);
      if (!allAnswered) {
        return "Please rate all items";
      }
    } else if (step === 2) {
      if (!ans.ei2) {
        return "Please select an option";
      }
    } else if (step === 3) {
      // Only validate EI3 if they should see it
      const shouldShowEI3 = ans.ei2 === "yes_comprehensive" || ans.ei2 === "yes_basic";
      if (shouldShowEI3 && !ans.ei3) {
        return "Please select an option";
      }
    }
    // No validation needed for step 4 (EI4/EI5) - text is optional
    return null;
  };

  const next = () => {
    const error = validateStep();
    if (error) {
      setErrors(error);
      return;
    }

    // Handle skip logic for EI2
    if (step === 2) {
      const skipToEI4 = ["currently_conducting", "planning", "no_plans"].includes(ans.ei2);
      if (skipToEI4) {
        setStep(4); // Skip EI3, go directly to EI4/EI5
      } else {
        setStep(3); // Go to EI3
      }
      setErrors("");
      return;
    }

    if (step < 4) {
      setStep(step + 1);
      setErrors("");
    } else {
      // Step 4 is the final step (EI4 or EI5)
      localStorage.setItem("employee-impact-assessment_complete", "true");
      router.push("/dashboard");
    }
  };

  const back = () => {
    if (step === 4 && ["currently_conducting", "planning", "no_plans"].includes(ans.ei2)) {
      // If we're at EI4/EI5 and we skipped EI3, go back to EI2
      setStep(2);
    } else if (step > 1) {
      setStep(step - 1);
    }
    setErrors("");
  };

  if (!allDimensionsComplete) {
    return null;
  }

  // Determine if we should show EI3
  const shouldShowEI3 = step === 3 && (ans.ei2 === "yes_comprehensive" || ans.ei2 === "yes_basic");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Employee-Impact Assessment
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
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
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Employee-Impact Assessment</h1>
              
              <div className="bg-purple-50 border-l-4 border-purple-600 p-6 mb-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  This section focuses on understanding the real-world impact and return on investment of your support programs for employees managing serious health conditions.
                </p>
                <p className="text-gray-700">
                  We'll explore measurable outcomes, ROI analysis, and gather insights from your experience implementing these programs.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">You'll be asked about:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>Positive outcomes across 10 key organizational metrics</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>Whether you've measured return on investment (ROI)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>The approximate ROI of your programs (if measured)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>Your insights and recommendations based on implementation experience</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-lg"
                >
                  Begin Assessment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: EI1 - Outcomes Grid */}
        {step === 1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Program Outcomes</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              To what extent has your organization seen <span className="text-purple-600">positive outcomes</span> in the following areas as a result of your workplace support programs for <span className="text-purple-600">employees managing cancer or other serious health conditions</span>?
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
               <thead>
  <tr className="bg-blue-600">
    <th className="border border-gray-300 p-3 text-left font-semibold text-white min-w-[200px]">
      Outcome Area
    </th>
    {EI1_OPTIONS.map(opt => (
      <th key={opt.value} className="border border-gray-300 p-3 text-center font-semibold text-white min-w-[120px]">
        {opt.label}
      </th>
    ))}
  </tr>
</thead>
                <tbody>
                  {shuffledItems.map((item, idx) => (
                    <tr key={item} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-3 font-medium text-gray-900">
                        {item}
                      </td>
                      {EI1_OPTIONS.map(opt => (
                        <td key={opt.value} className="border border-gray-300 p-3 text-center">
                          <button
                            onClick={() => handleGridChange(item, opt.value)}
                            className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
                              ans.ei1?.[item] === opt.value
                                ? 'border-purple-500 bg-purple-500'
                                : 'border-gray-300 hover:border-purple-300'
                            }`}
                          >
                            {ans.ei1?.[item] === opt.value && (
                              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Answered: {Object.keys(ans.ei1 || {}).length} of {shuffledItems.length}
            </div>
          </div>
        )}

        {/* Step 2: EI2 - ROI Measurement */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">ROI Measurement</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              Have you <span className="text-purple-600">measured the ROI</span> of your workplace support programs for <span className="text-purple-600">employees managing cancer or other serious health conditions</span>?
            </p>
            
            <div className="space-y-3">
              {[
                { value: "yes_comprehensive", label: "Yes, comprehensive ROI analysis completed" },
                { value: "yes_basic", label: "Yes, basic ROI analysis completed" },
                { value: "currently_conducting", label: "Currently conducting ROI analysis" },
                { value: "planning", label: "Planning to measure ROI" },
                { value: "no_plans", label: "No plans to measure ROI" }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRadioChange('ei2', option.value)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    ans.ei2 === option.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      ans.ei2 === option.value
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300"
                    }`}>
                      {ans.ei2 === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: EI3 - ROI Amount (conditional) */}
        {shouldShowEI3 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Approximate ROI</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              What was the <span className="text-purple-600">approximate ROI</span> of your workplace support programs?
            </p>
            
            <div className="space-y-3">
              {[
                { value: "negative", rating: "Negative ROI", description: "costs exceed benefits by more than 100%" },
                { value: "breakeven", rating: "Break-even", description: "costs and benefits are roughly equal" },
                { value: "1_1_2_0", rating: "1.1 - 2.0x ROI", description: "benefits are 10-100% more than costs" },
                { value: "2_1_3_0", rating: "2.1 - 3.0x ROI", description: "benefits are 2-3 times the costs" },
                { value: "3_1_5_0", rating: "3.1 - 5.0x ROI", description: "benefits are 3-5 times the costs" },
                { value: "greater_5", rating: "Greater than 5.0x ROI", description: "benefits exceed 5 times the costs" }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRadioChange('ei3', option.value)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    ans.ei3 === option.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      ans.ei3 === option.value
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300"
                    }`}>
                      {ans.ei3 === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span>
                      <span className="font-bold text-gray-900">{option.rating}</span>
                      <span className="text-gray-700"> ({option.description})</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: EI4 OR EI5 (50/50 split) */}
        {step === 4 && assignedQuestion === 'ei4' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Advice for Other HR Leaders</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              Based on learnings from implementation of your programs and policies, <span className="text-purple-600">what advice would you give to other HR leaders who want to improve support</span> for <span className="text-purple-600">employees managing cancer or other serious health conditions</span>?
            </p>

            <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
            
            <textarea
              value={ans.ei4_none ? "" : (ans.ei4 || "")}
              onChange={(e) => handleTextChange('ei4', e.target.value)}
              disabled={ans.ei4_none}
              rows={8}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Share your insights and recommendations..."
            />

            <div className="mt-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ans.ei4_none || false}
                  onChange={(e) => handleCheckboxChange('ei4', e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-700">No additional advice</span>
              </label>
            </div>

            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-bold text-green-900 mb-2">Ready to Complete</h3>
                  <p className="text-green-800">
                    Click "Complete Assessment" below to save your responses and return to the dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && assignedQuestion === 'ei5' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Aspects</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              Are there <span className="text-purple-600">any important aspects of supporting employees managing cancer or other serious health conditions</span> that this survey did not address?
            </p>

            <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
            
            <textarea
              value={ans.ei5_none ? "" : (ans.ei5 || "")}
              onChange={(e) => handleTextChange('ei5', e.target.value)}
              disabled={ans.ei5_none}
              rows={8}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Share any additional aspects or considerations..."
            />

            <div className="mt-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ans.ei5_none || false}
                  onChange={(e) => handleCheckboxChange('ei5', e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-700">None that I can think of</span>
              </label>
            </div>

            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-bold text-green-900 mb-2">Ready to Complete</h3>
                  <p className="text-green-800">
                    Click "Complete Assessment" below to save your responses and return to the dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step > 0 && (
          <div className="flex justify-between mt-8">
            <button 
              onClick={back} 
              className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              ← Back
            </button>
            <button 
              onClick={next} 
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              {step === 4 ? 'Complete Assessment →' : 'Continue →'}
            </button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
