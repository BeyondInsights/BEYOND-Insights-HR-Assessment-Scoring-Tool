'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EI1_ITEMS = [
  "Employee retention / tenure",
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
  const [resumeComplete, setResumeComplete] = useState(false); // ✅ Track resume sync
  const [ans, setAns] = useState({});

  // ===== RESUME PROGRESS LOGIC ===== ✅
  // CRITICAL: Read from localStorage directly to determine resume point  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem("employee-impact-assessment_data");
    if (!saved) {
      setResumeComplete(true);
      return;
    }

    try {
      const data = JSON.parse(saved);
      
      // Determine which step based on what's completed
      if (!data.ei1 || Object.keys(data.ei1 || {}).length === 0) {
        setStep(1);
      } else if (!data.ei2) {
        setStep(2);
      }
      // Otherwise stays at current step
    } catch (e) {
      console.error('Error parsing saved data:', e);
    }
    
    setResumeComplete(true);
  }, []);
  // ===== END RESUME PROGRESS LOGIC =====

  const [errors, setErrors] = useState("");
  const [assignedQuestion, setAssignedQuestion] = useState('ei4');
  const [shuffledItems] = useState(() => {
    const shuffled = [...EI1_ITEMS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  // ===== VALIDATION ADDITIONS =====
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const isStepValid = (): boolean => {
    return validateStep() === null;
  };
  // ===== END VALIDATION ADDITIONS =====

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem("employee_impact_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAns(parsed);
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }
  }, []);

  // Save data whenever answers change
  useEffect(() => {
    if (Object.keys(ans).length > 0) {
      localStorage.setItem("employee_impact_data", JSON.stringify(ans));
    }
  }, [ans]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleGridChange = (item, value) => {
    setAns((prev) => ({
      ...prev,
      ei1: {
        ...prev.ei1,
        [item]: value
      }
    }));
    markTouched('ei1'); // Mark grid as touched
    setErrors("");
  };

  const handleRadioChange = (field, value) => {
    setAns({ ...ans, [field]: value });
    markTouched(field); // Mark field as touched
    setErrors("");
  };

  const handleTextChange = (field, value) => {
    setAns({ ...ans, [field]: value });
    markTouched(field); // Mark field as touched
    setErrors("");
  };

  const handleCheckboxChange = (field, checked) => {
    if (checked) {
      setAns({ ...ans, [field]: "", [`${field}_none`]: true });
    } else {
      setAns({ ...ans, [`${field}_none`]: false });
    }
    markTouched(field); // Mark field as touched
  };

  const validateStep = () => {
    if (step === 1) {
      const allAnswered = shuffledItems.every(item => ans.ei1?.[item]);
      if (!allAnswered) {
        return "Please rate all items";
      }
    } else if (step === 2) {
      if (!ans.ei2) {
        return "Please select an option";
      }
    } else if (step === 3) {
      const shouldShowEI3 = ans.ei2 === "yes_comprehensive" || ans.ei2 === "yes_basic";
      if (shouldShowEI3 && !ans.ei3) {
        return "Please select an option";
      }
    } else if (step === 4) {
      // CRITICAL FIX: Added validation for step 4
      if (assignedQuestion === 'ei4') {
        if (!ans.ei4_none && !ans.ei4?.trim()) {
          return "Please provide advice or check 'No additional advice'";
        }
      } else if (assignedQuestion === 'ei5') {
        if (!ans.ei5_none && !ans.ei5?.trim()) {
          return "Please provide feedback or check 'None that I can think of'";
        }
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
      const skipToEI4 = ["currently_conducting", "planning", "no_plans"].includes(ans.ei2);
      if (skipToEI4) {
        setStep(4);
      } else {
        setStep(3);
      }
      setErrors("");
      return;
    }

    if (step < 4) {
      setStep(step + 1);
      setErrors("");
    } else {
      // Mark as complete and navigate to dashboard
      localStorage.setItem("employee_impact_complete", "true");  // ✅ CORRECT KEY
      localStorage.setItem("employee_impact_data", JSON.stringify(ans));
      router.push("/dashboard");
    }
  };

  const back = () => {
    if (step === 4 && ["currently_conducting", "planning", "no_plans"].includes(ans.ei2)) {
      setStep(2);
    } else if (step > 1) {
      setStep(step - 1);
    }
    setErrors("");
  };

  const shouldShowEI3 = step === 3 && (ans.ei2 === "yes_comprehensive" || ans.ei2 === "yes_basic");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
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

        {/* Enhanced Error Banner */}
        {errors && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-1">
                  Please complete all required fields
                </h3>
                <p className="text-sm text-red-700">{errors}</p>
              </div>
            </div>
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
            
            <p className="font-bold text-gray-900 mb-2">
              To what extent has your organization seen <span className="text-purple-600">positive outcomes</span> in the following areas as a result of your workplace support programs for <span className="text-purple-600">employees managing cancer or other serious health conditions</span>?
              <span className="text-red-600 ml-1">*</span>
            </p>

            <p className="text-sm text-gray-600 mb-6">(Select ONE for each outcome)</p>

            {/* Validation wrapper for grid */}
            <div className={`border-2 rounded-lg p-4 ${
              touched.ei1 && !shuffledItems.every(item => ans.ei1?.[item])
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-200 bg-white'
            }`}>
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

              {/* Inline error */}
              {touched.ei1 && !shuffledItems.every(item => ans.ei1?.[item]) && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please rate all items
                </p>
              )}
            </div>

            <div className={`mt-4 text-sm font-medium ${
              Object.keys(ans.ei1 || {}).length === shuffledItems.length 
                ? 'text-green-600' 
                : 'text-orange-600'
            }`}>
              Answered: {Object.keys(ans.ei1 || {}).length} of {shuffledItems.length}
            </div>
          </div>
        )}

        {/* Step 2: EI2 - ROI Measurement */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ROI Measurement</h2>
            
            <p className="font-bold text-gray-900 mb-2">
              Has your organization <span className="text-purple-600">measured the ROI</span> of your workplace support programs for <span className="text-purple-600">employees managing cancer or other serious health conditions</span>?
              <span className="text-red-600 ml-1">*</span>
            </p>

            <p className="text-sm text-gray-600 mb-6">(Select ONE)</p>
            
            {/* Validation wrapper */}
            <div className={`border-2 rounded-lg p-4 ${
              touched.ei2 && !ans.ei2
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-200 bg-white'
            }`}>
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

              {/* Inline error */}
              {touched.ei2 && !ans.ei2 && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please select an option
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: EI3 - ROI Amount (conditional) */}
        {shouldShowEI3 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Approximate ROI</h2>
            
            <p className="font-bold text-gray-900 mb-2">
              What was the <span className="text-purple-600">approximate ROI</span> of your workplace support programs?
              <span className="text-red-600 ml-1">*</span>
            </p>

            <p className="text-sm text-gray-600 mb-6">(Select ONE)</p>
            
            {/* Validation wrapper */}
            <div className={`border-2 rounded-lg p-4 ${
              touched.ei3 && !ans.ei3
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-200 bg-white'
            }`}>
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

              {/* Inline error */}
              {touched.ei3 && !ans.ei3 && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please select an option
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: EI4 OR EI5 */}
        {step === 4 && assignedQuestion === 'ei4' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Advice for Other HR Leaders</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              Based on learnings from implementation of your programs and policies, <span className="text-purple-600">what advice would you give to other HR leaders who want to improve support</span> for <span className="text-purple-600">employees managing cancer or other serious health conditions</span>?
              <span className="text-red-600 ml-1">*</span>
            </p>

            <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
            
            <textarea
              value={ans.ei4_none ? "" : (ans.ei4 || "")}
              onChange={(e) => handleTextChange('ei4', e.target.value)}
              onBlur={() => markTouched('ei4')}
              disabled={ans.ei4_none}
              rows={8}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                touched.ei4 && !ans.ei4_none && !ans.ei4?.trim()
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-purple-500'
              } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              placeholder="Share your insights and recommendations..."
            />

            {/* Character count */}
            {!ans.ei4_none && (
              <p className="mt-1 text-xs text-gray-500">
                {ans.ei4?.length || 0} characters
              </p>
            )}

            {/* Inline error */}
            {touched.ei4 && !ans.ei4_none && !ans.ei4?.trim() && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please provide advice or check 'No additional advice'
              </p>
            )}

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
              <span className="text-red-600 ml-1">*</span>
            </p>

            <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
            
            <textarea
              value={ans.ei5_none ? "" : (ans.ei5 || "")}
              onChange={(e) => handleTextChange('ei5', e.target.value)}
              onBlur={() => markTouched('ei5')}
              disabled={ans.ei5_none}
              rows={8}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                touched.ei5 && !ans.ei5_none && !ans.ei5?.trim()
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-purple-500'
              } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              placeholder="Share any additional aspects or considerations..."
            />

            {/* Character count */}
            {!ans.ei5_none && (
              <p className="mt-1 text-xs text-gray-500">
                {ans.ei5?.length || 0} characters
              </p>
            )}

            {/* Inline error */}
            {touched.ei5 && !ans.ei5_none && !ans.ei5?.trim() && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please provide feedback or check 'None that I can think of'
              </p>
            )}

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
              disabled={!isStepValid()}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                isStepValid()
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
              }`}
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
