"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Info, X } from "lucide-react";

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const DIMENSIONS_BASE = [
  "Medical Leave & Flexibility",
  "Insurance & Financial Protection",
  "Manager Preparedness & Capability",
  "Navigation & Expert Resources",
  "Workplace Accommodations & Modifications",
  "Culture & Psychological Safety",
  "Career Continuity & Advancement",
  "Work Continuation & Resumption",
  "Executive Commitment & Resources",
  "Caregiver & Family Support",
  "Prevention, Wellness & Legal Compliance",
  "Continuous Improvement & Outcomes",
  "Communication & Awareness"
];

const DIMENSION_DEFINITIONS: Record<string, string> = {
  "Medical Leave & Flexibility": "Policies and practices that allow employees to take necessary time off for treatment, recovery, and medical appointments while maintaining job security and benefits. Includes flexible work arrangements, extended leave options, and accommodations for ongoing medical needs.",
  
  "Insurance & Financial Protection": "Health insurance coverage, disability benefits, life insurance, and other financial protections that help employees manage the costs associated with serious illness. Includes supplemental insurance options and financial assistance programs.",
  
  "Manager Preparedness & Capability": "Training, resources, and support for managers to effectively lead and support team members facing serious health conditions. Includes communication skills, understanding of available resources, and ability to balance empathy with business needs.",
  
  "Navigation & Expert Resources": "Access to care coordinators, patient advocates, benefits specialists, and expert resources that help employees navigate the healthcare system, understand their benefits, and connect with appropriate support services.",
  
  "Workplace Accommodations & Modifications": "Physical and operational adjustments to the work environment that enable employees to continue working during and after treatment. Includes ergonomic modifications, schedule adjustments, job restructuring, and accessibility improvements.",
  
  "Culture & Psychological Safety": "An organizational environment where employees feel comfortable disclosing health conditions, requesting accommodations, and accessing support without fear of stigma, discrimination, or negative career impact.",
  
  "Career Continuity & Advancement": "Policies and practices that protect career progression and development opportunities for employees managing serious health conditions. Ensures that taking medical leave or requesting accommodations doesn't derail career growth.",
  
  "Work Continuation & Resumption": "Structured programs and processes that support employees' successful transition back to work after medical leave. Includes phased return options, accommodation planning, and ongoing check-ins to ensure sustainable re-integration.",
  
  "Executive Commitment & Resources": "Visible leadership support, dedicated budget, and organizational resources allocated to supporting employees with serious health conditions. Demonstrates that employee health and wellbeing is a strategic priority.",
  
  "Caregiver & Family Support": "Programs and benefits that recognize and support employees who are caring for family members with serious health conditions. Includes caregiver leave, flexible scheduling, support groups, and respite resources.",
  
  "Prevention, Wellness & Legal Compliance": "Proactive health and wellness programs, preventive care benefits, and compliance with legal requirements (ADA, FMLA, etc.). Focuses on early detection, health promotion, and ensuring the organization meets all legal obligations.",
  
  "Continuous Improvement & Outcomes": "Systems for measuring program effectiveness, gathering employee feedback, tracking outcomes, and using data to continuously improve support for employees with serious health conditions. Includes regular program evaluation and evidence-based refinements.",
  
  "Communication & Awareness": "Strategic and ongoing communication about available programs, benefits, and resources to ensure employees know what support is available and how to access it. Includes multiple channels, clear messaging, and regular updates."
};

export default function CrossDimensionalPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [resumeComplete, setResumeComplete] = useState(false); // ✅ Track resume sync
  const [ans, setAns] = useState<any>({});
  const [errors, setErrors] = useState<string>("");
  const [allDimensionsComplete, setAllDimensionsComplete] = useState(false);
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<string>("");
  
  const [shuffledDimensions] = useState(() => shuffleArray(DIMENSIONS_BASE));

  // ===== VALIDATION ADDITIONS =====
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const isStepValid = (): boolean => {
    return validateStep() === null;
  };
  // ===== END VALIDATION ADDITIONS =====

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

    const saved = localStorage.getItem("cross_dimensional_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAns(parsed);
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }
  }, [router]);

  // ===== RESUME PROGRESS LOGIC ===== ✅
  // CRITICAL: Read from localStorage directly to determine resume point
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem("cross_dimensional_data");
    if (!saved) {
      setResumeComplete(true);
      return;
    }

    try {
      const data = JSON.parse(saved);
      
      // Determine which step based on what's completed
      if (!data.cd1a || (Array.isArray(data.cd1a) && data.cd1a.length < 3)) {
        setStep(1);
      } else if (!data.cd1b || (Array.isArray(data.cd1b) && data.cd1b.length < 3)) {
        setStep(2);
      } else if (!data.cd2 || (Array.isArray(data.cd2) && data.cd2.length === 0)) {
        setStep(3);
      }
      // Otherwise stays at current step
    } catch (e) {
      console.error('Error parsing saved data:', e);
    }
    
    setResumeComplete(true);
  }, []);
  // ===== END RESUME PROGRESS LOGIC =====


  useEffect(() => {
    if (Object.keys(ans).length > 0) {
      localStorage.setItem("cross_dimensional_data", JSON.stringify(ans));
    }
  }, [ans]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const toggleDimension = (dimension: string, field: string) => {
    setAns((prev: any) => {
      const current = prev[field] || [];
      if (current.includes(dimension)) {
        return { ...prev, [field]: current.filter((d: string) => d !== dimension) };
      } else {
        if (current.length >= 3) {
          setErrors("You can only select 3 dimensions");
          return prev;
        }
        return { ...prev, [field]: [...current, dimension] };
      }
    });
    markTouched(field); // Mark field as touched
    setErrors("");
  };

  const toggleChallenge = (challenge: string) => {
    setAns((prev: any) => {
      const current = prev.cd2 || [];
      if (current.includes(challenge)) {
        return { ...prev, cd2: current.filter((c: string) => c !== challenge) };
      } else {
        if (current.length >= 3) {
          setErrors("You can select up to 3 challenges only");
          return prev;
        }
        return { ...prev, cd2: [...current, challenge] };
      }
    });
    markTouched('cd2'); // Mark field as touched
    setErrors("");
  };

  const openDefinition = (dimension: string) => {
    setSelectedDimension(dimension);
    setShowDefinitionModal(true);
  };

  const CD2_CHALLENGES = [
    "Budget / resource constraints",
    "Lack of executive support",
    "Complex / varying legal requirements across markets",
    "Manager capability / training gaps",
    "Employee privacy concerns",
    "Difficulty measuring program effectiveness",
    "Low employee awareness of available programs",
    "Administrative complexity",
    "Inconsistent application across the organization",
    "Cultural stigma around medical conditions",
    "Integration with existing HR systems",
    "Competing organizational priorities",
    "Limited expertise in workplace support programs",
    "Global consistency challenges",
    "Other (please specify)"
  ];

  const validateStep = () => {
    if (step === 1) {
      if (!ans.cd1a || ans.cd1a.length !== 3) {
        return "Please select exactly 3 dimensions";
      }
    } else if (step === 2) {
      if (!ans.cd1b || ans.cd1b.length !== 3) {
        return "Please select exactly 3 dimensions";
      }
    } else if (step === 3) {
      if (!ans.cd2 || ans.cd2.length === 0) {
        return "Please select at least 1 challenge (up to 3)";
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

    if (step < 4) {
      setStep(step + 1);
      setErrors("");
    } else {
      localStorage.setItem("cross_dimensional_complete", "true");
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

  const cd1bOptions = shuffledDimensions.filter(d => !ans.cd1a?.includes(d));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Cross-Dimensional Assessment
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

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

        {/* Definition Modal */}
        {showDefinitionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
                <h3 className="text-2xl font-bold text-gray-900 pr-8">{selectedDimension}</h3>
                <button
                  onClick={() => setShowDefinitionModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {DIMENSION_DEFINITIONS[selectedDimension]}
                </p>
                <button
                  onClick={() => setShowDefinitionModal(false)}
                  className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 0: Introduction */}
        {step === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Cross-Dimensional Assessment</h1>
              
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  Now that you've completed all 13 dimensions, we'd like to understand your organization's strategic priorities and challenges.
                </p>
                <p className="text-gray-700">
                  This section will help identify which areas would provide the most value if enhanced, which are lower priority, and what challenges you face in supporting employees.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">What to expect:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Identify the 3 dimensions that would provide the best outcomes if enhanced</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Identify the 3 dimensions that are lowest priority for your organization</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Share the biggest challenges you face in supporting employees</span>
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

        {/* Step 1: CD1a - Best Outcomes */}
        {step === 1 && (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Priority Dimensions for Enhancement</h2>
              
              <p className="font-bold text-gray-900 mb-2">
                Which THREE dimensions would <span className="text-blue-600">provide the best outcomes</span> if you were to enhance them from their current state?
                <span className="text-red-600 ml-1">*</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">(Select exactly 3)</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  Click the <Info className="w-4 h-4 inline" /> icon next to any dimension to view its full definition
                </p>
              </div>
              
              {/* Validation wrapper with red border if touched but incomplete */}
              <div className={`border-2 rounded-lg p-4 ${
                touched.cd1a && (!ans.cd1a || ans.cd1a.length !== 3)
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="space-y-2">
                  {shuffledDimensions.map(dim => (
                    <div key={dim} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleDimension(dim, 'cd1a')}
                        className={`flex-1 px-4 py-3 text-left rounded-lg border-2 transition-all ${
                          ans.cd1a?.includes(dim)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
                            ans.cd1a?.includes(dim)
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}>
                            {ans.cd1a?.includes(dim) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span>{dim}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => openDefinition(dim)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                        title="View definition"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Inline error message */}
                {touched.cd1a && (!ans.cd1a || ans.cd1a.length !== 3) && (
                  <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Please select exactly 3 dimensions
                  </p>
                )}
              </div>

              <div className="mt-4 text-sm font-medium text-gray-700">
                Selected: <span className={ans.cd1a?.length === 3 ? "text-green-600" : "text-orange-600"}>{ans.cd1a?.length || 0} of 3</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: CD1b - Lowest Priority */}
        {step === 2 && (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Lowest Priority Dimensions</h2>
              
              <p className="font-bold text-gray-900 mb-2">
                Which THREE areas are the <span className="text-blue-600">lowest priority</span> for your organization?
                <span className="text-red-600 ml-1">*</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">(Select exactly 3)</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  Click the <Info className="w-4 h-4 inline" /> icon next to any dimension to view its full definition
                </p>
              </div>
              
              {/* Validation wrapper with red border if touched but incomplete */}
              <div className={`border-2 rounded-lg p-4 ${
                touched.cd1b && (!ans.cd1b || ans.cd1b.length !== 3)
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="space-y-2">
                  {cd1bOptions.map(dim => (
                    <div key={dim} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleDimension(dim, 'cd1b')}
                        className={`flex-1 px-4 py-3 text-left rounded-lg border-2 transition-all ${
                          ans.cd1b?.includes(dim)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
                            ans.cd1b?.includes(dim)
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}>
                            {ans.cd1b?.includes(dim) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span>{dim}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => openDefinition(dim)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                        title="View definition"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Inline error message */}
                {touched.cd1b && (!ans.cd1b || ans.cd1b.length !== 3) && (
                  <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Please select exactly 3 dimensions
                  </p>
                )}
              </div>

              <div className="mt-4 text-sm font-medium text-gray-700">
                Selected: <span className={ans.cd1b?.length === 3 ? "text-green-600" : "text-orange-600"}>{ans.cd1b?.length || 0} of 3</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: CD2 - Challenges */}
        {step === 3 && (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Organizational Challenges</h2>
              
              <p className="font-bold text-gray-900 mb-2">
                What are the <span className="text-blue-600">biggest challenges</span> your organization faces in <span className="text-blue-600">supporting employees managing cancer or other serious health conditions</span>?
                <span className="text-red-600 ml-1">*</span>
              </p>
              <p className="text-sm text-gray-600 mb-6">(Select up to 3)</p>
              
              {/* Validation wrapper with red border if touched but incomplete */}
              <div className={`border-2 rounded-lg p-4 ${
                touched.cd2 && (!ans.cd2 || ans.cd2.length === 0)
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="space-y-2">
                  {CD2_CHALLENGES.map(challenge => (
                    <button
                      key={challenge}
                      onClick={() => toggleChallenge(challenge)}
                      className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                        ans.cd2?.includes(challenge)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                          ans.cd2?.includes(challenge)
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}>
                          {ans.cd2?.includes(challenge) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span>{challenge}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Inline error message */}
                {touched.cd2 && (!ans.cd2 || ans.cd2.length === 0) && (
                  <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Please select at least 1 challenge
                  </p>
                )}
              </div>

              <div className="space-y-2 mt-6">
                <label className="block text-sm font-medium text-gray-700">Other (specify):</label>
                <input
                  type="text"
                  value={ans.cd2_other || ""}
                  onChange={(e) => setAns({ ...ans, cd2_other: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Describe any other challenge..."
                />
              </div>

              <div className="mt-4 text-sm font-medium text-gray-700">
                Selected: <span className={ans.cd2?.length >= 1 ? "text-green-600" : "text-orange-600"}>{ans.cd2?.length || 0} of 3</span>
              </div>
            </div>
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
              Cross-Dimensional Assessment Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              You've successfully completed the cross-dimensional assessment.
            </p>
            <button
              onClick={() => { 
                localStorage.setItem("cross_dimensional_complete", "true"); 
                router.push("/dashboard"); 
              }}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Save & Return to Dashboard →
            </button>
          </div>
        )}

        {/* Navigation */}
        {step > 0 && step < 4 && (
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
