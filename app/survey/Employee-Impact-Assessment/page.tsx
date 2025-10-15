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

  const handleRadioChange = (field: string, value: string) => {
    setAns({ ...ans, [field]: value });
    setErrors("");
  };

  const handleTextChange = (field: string, value: string) => {
    setAns({ ...ans, [field]: value });
    setErrors("");
  };

  const validateStep = () => {
    if (step === 1) {
      if (!ans.ei1) {
        return "Please select an option";
      }
    } else if (step === 2) {
      if (!ans.ei2) {
        return "Please select an option";
      }
    } else if (step === 3) {
      if (!ans.ei3) {
        return "Please select an option";
      }
    } else if (step === 4) {
      if (!ans.ei4) {
        return "Please select an option";
      }
    } else if (step === 5) {
      if (!ans.ei5) {
        return "Please select an option";
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

    if (step < 6) {
      setStep(step + 1);
      setErrors("");
    } else {
      localStorage.setItem("employee_impact_complete", "true");
      router.push("/dashboard");
    }
  };

  const back = () => {
    if (step > 1) {
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
              Employee-Impact Assessment
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 6) * 100}%` }}
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
                  This section focuses on understanding the real-world impact of your support programs on employees managing serious health conditions.
                </p>
                <p className="text-gray-700">
                  We'll explore employee satisfaction, program utilization, and the effectiveness of your current support landscape from the employee perspective.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">You'll be asked about:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>Employee awareness of available support programs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>Utilization rates and barriers to accessing support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>Employee satisfaction with current support offerings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>Perceived impact on employee outcomes and wellbeing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>Opportunities for improvement based on employee feedback</span>
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

        {/* Step 1: EI1 - Employee Awareness */}
        {step === 1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Employee Awareness</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              How would you rate employee awareness of the support programs available to those managing serious health conditions?
            </p>
            
            <div className="space-y-3">
              {[
                { value: "very_high", label: "Very High - Most employees are well aware of available programs" },
                { value: "high", label: "High - Many employees know about available programs" },
                { value: "moderate", label: "Moderate - Some employees are aware, but many are not" },
                { value: "low", label: "Low - Few employees know about available programs" },
                { value: "very_low", label: "Very Low - Very few employees are aware of support programs" },
                { value: "unknown", label: "Unknown - We haven't measured employee awareness" }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRadioChange('ei1', option.value)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    ans.ei1 === option.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      ans.ei1 === option.value
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300"
                    }`}>
                      {ans.ei1 === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span>{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: EI2 - Program Utilization */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Program Utilization</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              What percentage of eligible employees utilize available support programs when managing serious health conditions?
            </p>
            
            <div className="space-y-3">
              {[
                { value: "76_100", label: "76-100% - Very high utilization" },
                { value: "51_75", label: "51-75% - High utilization" },
                { value: "26_50", label: "26-50% - Moderate utilization" },
                { value: "10_25", label: "10-25% - Low utilization" },
                { value: "0_9", label: "0-9% - Very low utilization" },
                { value: "unknown", label: "Unknown - We don't track utilization rates" }
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
                    <span>{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: EI3 - Employee Satisfaction */}
        {step === 3 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Employee Satisfaction</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              Based on available feedback, how satisfied are employees with the support they receive when managing serious health conditions?
            </p>
            
            <div className="space-y-3">
              {[
                { value: "very_satisfied", label: "Very Satisfied - Strong positive feedback" },
                { value: "satisfied", label: "Satisfied - Generally positive feedback" },
                { value: "neutral", label: "Neutral - Mixed or neutral feedback" },
                { value: "dissatisfied", label: "Dissatisfied - Generally negative feedback" },
                { value: "very_dissatisfied", label: "Very Dissatisfied - Significant concerns expressed" },
                { value: "unknown", label: "Unknown - We haven't collected this feedback" }
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
                    <span>{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: EI4 - Barriers to Access */}
        {step === 4 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Barriers to Access</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              What do you believe is the biggest barrier preventing employees from accessing available support programs?
            </p>
            
            <div className="space-y-3">
              {[
                { value: "lack_awareness", label: "Lack of awareness about available programs" },
                { value: "stigma", label: "Fear of stigma or discrimination" },
                { value: "process_complexity", label: "Complex or confusing processes" },
                { value: "manager_support", label: "Lack of manager understanding or support" },
                { value: "privacy_concerns", label: "Privacy concerns" },
                { value: "inadequate_programs", label: "Programs don't meet employee needs" },
                { value: "work_demands", label: "Too busy with work demands" },
                { value: "no_barriers", label: "No significant barriers - programs are accessible" },
                { value: "unknown", label: "Unknown - We haven't identified barriers" }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRadioChange('ei4', option.value)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    ans.ei4 === option.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      ans.ei4 === option.value
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300"
                    }`}>
                      {ans.ei4 === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span>{option.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional context or other barriers (optional):
              </label>
              <textarea
                value={ans.ei4_details || ""}
                onChange={(e) => handleTextChange('ei4_details', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="Provide any additional details..."
              />
            </div>
          </div>
        )}

        {/* Step 5: EI5 - Perceived Impact */}
        {step === 5 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Perceived Impact</h2>
            
            <p className="font-bold text-gray-900 mb-6">
              How effective do you believe your current support programs are in improving outcomes for employees managing serious health conditions?
            </p>
            
            <div className="space-y-3">
              {[
                { value: "very_effective", label: "Very Effective - Significantly improves employee outcomes" },
                { value: "effective", label: "Effective - Positively impacts employee outcomes" },
                { value: "somewhat_effective", label: "Somewhat Effective - Has some positive impact" },
                { value: "minimally_effective", label: "Minimally Effective - Limited impact on outcomes" },
                { value: "not_effective", label: "Not Effective - Little to no impact on outcomes" },
                { value: "unknown", label: "Unknown - We haven't measured effectiveness" }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRadioChange('ei5', option.value)}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    ans.ei5 === option.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      ans.ei5 === option.value
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300"
                    }`}>
                      {ans.ei5 === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span>{option.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What metrics or feedback inform your assessment? (optional):
              </label>
              <textarea
                value={ans.ei5_details || ""}
                onChange={(e) => handleTextChange('ei5_details', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="E.g., employee surveys, retention data, return-to-work success rates..."
              />
            </div>
          </div>
        )}

        {/* Step 6: Completion */}
        {step === 6 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Employee-Impact Assessment Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              You've successfully completed the employee-impact assessment.
            </p>
            <button
              onClick={() => { 
                localStorage.setItem("employee_impact_complete", "true"); 
                router.push("/dashboard"); 
              }}
              className="px-10 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Save & Return to Dashboard →
            </button>
          </div>
        )}

        {/* Navigation */}
        {step > 0 && step < 6 && (
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
              Continue →
            </button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
