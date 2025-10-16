"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function GeneralBenefitsPage() {
 console.log("GENERAL BENEFITS PAGE LOADED");
 const router = useRouter();
 const [step, setStep] = useState(1);
 const [ans, setAns] = useState<any>({});
 
 // Debug: Log every time ans changes
 useEffect(() => {
 console.log("GENERAL ans changed:", ans);
 if (Object.keys(ans).length > 0) {
 localStorage.setItem("general-benefits_data", JSON.stringify(ans));
 console.log("SAVED general-benefits to localStorage");
 }
 }, [ans]);
 
 // Debug: Try to load on mount
 useEffect(() => {
 console.log("GENERAL checking for saved data...");
 const saved = localStorage.getItem("general-benefits_data");
 if (saved) {
 console.log("FOUND saved general data:", saved);
 setAns(JSON.parse(saved));
 } else {
 console.log("NO saved general data found");
 }
 }, []);
 const [errors, setErrors] = useState<string>("");

 // Load saved answers on mount
 useEffect(() => {
 const saved = localStorage.getItem("general-benefits_data");
 if (saved) setAns(JSON.parse(saved));
 
 }, []);

 // Save answers when they change
 useEffect(() => {
 localStorage.setItem("general-benefits_data", JSON.stringify(ans));
 }, [ans]);

 // Set field helper
 const setField = (key: string, value: any) => {
 setAns((prev: any) => ({ ...prev, [key]: value }));
 setErrors("");
 };

// Toggle multi-select with exclusivity
 const toggleMulti = (key: string, value: string, exclusiveValue?: string) => {
 setAns((prev: any) => {
 const current = Array.isArray(prev[key]) ? prev[key] : [];
 
 // If clicking the exclusive option
 if (exclusiveValue && value === exclusiveValue) {
 return { ...prev, [key]: current.includes(value) ? [] : [value] };
 }
 
 // If exclusive is already selected, remove it first
 const withoutExclusive = exclusiveValue 
 ? current.filter((x: string) => x !== exclusiveValue)
 : current;
 
 // Toggle the clicked option
 if (withoutExclusive.includes(value)) {
 return { ...prev, [key]: withoutExclusive.filter((x: string) => x !== value) };
 } else {
 return { ...prev, [key]: [...withoutExclusive, value] };
 }
 });
 setErrors("");
 };
 // Validation
 const validateStep = () => {
 switch (step) {
 case 1: // Guidelines - no validation
 return null;
 
 case 2: // Standard Benefits
 if (!Array.isArray(ans.cb1_standard) || ans.cb1_standard.length === 0) {
 return "Please select at least one option";
 }
 return null;

 case 3: // Leave & Flexibility
 if (!Array.isArray(ans.cb1_leave) || ans.cb1_leave.length === 0) {
 return "Please select at least one option";
 }
 return null;

 case 4: // Wellness & Support
 if (!Array.isArray(ans.cb1_wellness) || ans.cb1_wellness.length === 0) {
 return "Please select at least one option";
 }
 return null;

 case 5: // Financial & Legal
 if (!Array.isArray(ans.cb1_financial) || ans.cb1_financial.length === 0) {
 return "Please select at least one option";
 }
 return null;

 case 6: // Care Navigation
 if (!Array.isArray(ans.cb1_navigation) || ans.cb1_navigation.length === 0) {
 return "Please select at least one option";
 }
 return null;

 case 7: // CB1a - percentage (optional)
 if (ans.cb1a && (parseInt(ans.cb1a) < 0 || parseInt(ans.cb1a) > 100)) {
 return "Please enter a valid percentage (0-100)";
 }
 return null;

 case 8: // CB2b - future plans (optional)
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
 
 if (step < 9) {
 setStep(step + 1);
 setErrors("");
 }
 };

 const back = () => {
 if (step > 1) {
 setStep(step - 1);
 setErrors("");
 }
 };

 // CB1 Arrays from the FINAL HR document
 const CB1_STANDARD = [
 "Health insurance (Employer-provided or supplemental to national coverage)",
 "Dental insurance (Employer-provided or supplemental to national coverage)",
 "Vision insurance (Employer-provided or supplemental to national coverage)",
 "Life insurance",
 "Short-term disability (or temporary incapacity benefits)",
 "Long-term disability (or income protection)",
 "Paid time off (PTO / vacation)",
 "Sick days (separate from PTO and legally mandated sick leave)",
 "None of these"
 ];

 const CB1_LEAVE = [
 "Paid family / medical leave beyond legal requirements",
 "Flexible work schedules",
 "Remote work options",
 "Job sharing programs",
 "Phased retirement",
 "Sabbatical programs",
 "Dedicated caregiver leave (separate from family leave)",
 "None of these"
 ];

 const CB1_WELLNESS = [
 "Employee assistance program (EAP)",
 "Physical wellness programs (fitness, nutrition, ergonomics)",
 "Mental wellness programs (stress management, mindfulness, resilience)",
 "On-site health services",
 "Mental health resources (therapy, counseling)",
 "Caregiving support resources",
 "Tailored support programs for employees managing cancer or other serious health conditions",
 "None of these"
 ];

 const CB1_FINANCIAL = [
 "Financial counseling / planning",
 "Student loan assistance",
 "Identity theft protection",
 "Legal assistance / services (will preparation, family law, medical directives)",
 "None of these"
 ];

 const CB1_NAVIGATION = [
 "Care coordination for complex conditions",
 "Second opinion services or facilitation",
 "Specialized treatment center networks",
 "Travel support for specialized care",
 "Clinical guidance and navigation",
 "Medication access and affordability programs",
 "None of these"
 ];

 // For CB2b - collect all non-selected options
 const getAllUnselectedOptions = () => {
 const all = [
 ...CB1_STANDARD.filter(x => x !== "None of these"),
 ...CB1_LEAVE.filter(x => x !== "None of these"),
 ...CB1_WELLNESS.filter(x => x !== "None of these"),
 ...CB1_FINANCIAL.filter(x => x !== "None of these"),
 ...CB1_NAVIGATION.filter(x => x !== "None of these")
 ];
 
 const selected = [
 ...(ans.cb1_standard || []),
 ...(ans.cb1_leave || []),
 ...(ans.cb1_wellness || []),
 ...(ans.cb1_financial || []),
 ...(ans.cb1_navigation || [])
 ];
 
 return all.filter(opt => !selected.includes(opt));
 };

 return (
 <div className="min-h-screen bg-gray-50 flex flex-col">
 <Header />
 
 <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
 {/* Progress indicator */}
 <div className="mb-6">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-600">Step {step} of 9</span>
 <button 
 onClick={() => { 
 localStorage.setItem("general_benefits_complete", "true");
 router.push("/dashboard");
}}
 className="text-sm text-orange-600 hover:text-orange-700 font-medium"
 >
 ? Back to Dashboard
 </button>
 </div>
 <div className="w-full bg-gray-200 rounded-full h-2">
 <div 
 className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
 style={{ width: `${(step / 9) * 100}%` }}
 />
 </div>
 </div>

 {/* Error display */}
 {errors && (
 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
 {errors}
 </div>
 )}

 {/* Step 1: Guidelines */}
 {step === 1 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">
 Current Benefits Landscape
 </h2>
 
 <div className="bg-blue-50 border-l-4 border-blue-600 p-6 space-y-4">
 <h3 className="text-lg font-bold text-blue-900">
 GUIDELINES FOR MULTI-COUNTRY ORGANIZATIONS
 </h3>
 
 <p>
 We recognize the complexity of reporting on programs that vary across countries. 
 To keep this survey manageable while capturing meaningful differences, we've 
 structured questions in two ways:
 </p>
 
 <div className="space-y-3">
 <div>
 <p className="font-bold text-blue-900 mb-2">
 Why we distinguish between US and other markets for select questions:
 </p>
 <p>
 Healthcare and leave policies function fundamentally differently across countries. 
 In the US, employers typically provide primary healthcare coverage and paid leave, 
 while other countries often have robust national healthcare and statutory leave 
 requirements. To fairly evaluate your organization's commitment to going above and 
 beyond, we need to understand what you provide relative to these different baselines.
 </p>
 </div>

 <div>
 <p className="font-bold text-blue-900 mb-2">Most questions ask for your global approach</p>
 <p>
 These cover universal areas like manager training, navigation services, or communication 
 methods that can be standardized across markets.
 </p>
 </div>

 <div>
 <p className="font-bold text-blue-900 mb-2">Select questions distinguish between US and other markets</p>
 <p className="mb-2">
 These appear only where healthcare systems or legal requirements create meaningful 
 differences that affect how your programs are evaluated:
 </p>
 <ul className="list-disc list-inside pl-4 space-y-1">
 <li>Medical leave policies (FMLA vs. statutory sick leave)</li>
 <li>Disability insurance (employer-provided vs. government)</li>
 <li>Health insurance continuation during leave</li>
 <li>Job protection beyond legal requirements</li>
 </ul>
 </div>

 <div>
 <p className="font-bold text-blue-900 mb-2">For these questions, please report:</p>
 <ul className="list-disc list-inside pl-4 space-y-1">
 <li><strong>US operations:</strong> All US-based employees</li>
 <li><strong>Other markets:</strong> Your most common approach outside the US</li>
 </ul>
 </div>

 <div>
 <p className="font-bold text-blue-900 mb-2">How to respond when programs vary:</p>
 <ul className="list-disc list-inside pl-4 space-y-1">
 <li>Report on benefits available to 80%+ of employees in each category</li>
 <li>If you have a global standard policy, report that standard</li>
 <li>For "beyond legal requirements" questions, calculate based on what you provide above the minimum in each market</li>
 </ul>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Step 2: Standard Benefits */}
 {step === 2 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">
 Current Benefits Landscape
 </h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which of the following <span className="text-blue-600">standard benefits</span> does 
 your organization currently provide?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-[80px] auto-rows-fr">
 {CB1_STANDARD.map(opt => {
 const isSelected = Array.isArray(ans.cb1_standard) && ans.cb1_standard.includes(opt);
 const isNone = opt === "None of these";
 const hasNone = Array.isArray(ans.cb1_standard) && ans.cb1_standard.includes("None of these");
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("cb1_standard", opt, "None of these")}
 disabled={!isNone && hasNone && !isSelected}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 isNone ? "font-normal" : ""
 } ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : !isNone && hasNone
 ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* Step 3: Leave & Flexibility */}
 {step === 3 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">
 Current Benefits Landscape
 </h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which of the following <span className="text-blue-600">leave & flexibility programs</span> does 
 your organization currently provide?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-[80px] auto-rows-fr">
 {CB1_LEAVE.map(opt => {
 const isSelected = Array.isArray(ans.cb1_leave) && ans.cb1_leave.includes(opt);
 const isNone = opt === "None of these";
 const hasNone = Array.isArray(ans.cb1_leave) && ans.cb1_leave.includes("None of these");
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("cb1_leave", opt, "None of these")}
 disabled={!isNone && hasNone && !isSelected}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 isNone ? "font-normal" : ""
 } ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : !isNone && hasNone
 ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* Step 4: Wellness & Support */}
 {step === 4 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">
 Current Benefits Landscape
 </h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which of the following <span className="text-blue-600">wellness & support programs</span> does 
 your organization currently provide?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-[80px] auto-rows-fr">
 {CB1_WELLNESS.map(opt => {
 const isSelected = Array.isArray(ans.cb1_wellness) && ans.cb1_wellness.includes(opt);
 const isNone = opt === "None of these";
 const hasNone = Array.isArray(ans.cb1_wellness) && ans.cb1_wellness.includes("None of these");
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("cb1_wellness", opt, "None of these")}
 disabled={!isNone && hasNone && !isSelected}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 isNone ? "font-normal" : ""
 } ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : !isNone && hasNone
 ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* Step 5: Financial & Legal */}
 {step === 5 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">
 Current Benefits Landscape
 </h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which of the following <span className="text-blue-600">financial & legal assistance</span> programs does 
 your organization currently provide?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-[80px] auto-rows-fr">
 {CB1_FINANCIAL.map(opt => {
 const isSelected = Array.isArray(ans.cb1_financial) && ans.cb1_financial.includes(opt);
 const isNone = opt === "None of these";
 const hasNone = Array.isArray(ans.cb1_financial) && ans.cb1_financial.includes("None of these");
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("cb1_financial", opt, "None of these")}
 disabled={!isNone && hasNone && !isSelected}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 isNone ? "font-normal" : ""
 } ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : !isNone && hasNone
 ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* Step 6: Care Navigation */}
 {step === 6 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">
 Current Benefits Landscape
 </h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which of the following <span className="text-blue-600">care navigation & support services</span> does 
 your organization currently provide?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-[80px] auto-rows-fr">
 {CB1_NAVIGATION.map(opt => {
 const isSelected = Array.isArray(ans.cb1_navigation) && ans.cb1_navigation.includes(opt);
 const isNone = opt === "None of these";
 const hasNone = Array.isArray(ans.cb1_navigation) && ans.cb1_navigation.includes("None of these");
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("cb1_navigation", opt, "None of these")}
 disabled={!isNone && hasNone && !isSelected}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 isNone ? "font-normal" : ""
 } ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : !isNone && hasNone
 ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* Step 7: CB1a - Government Healthcare */}
 {step === 7 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">
 Current Benefits Landscape
 </h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 What percentage of your employees have access to{" "}
 <span className="text-blue-600">healthcare through national or government Systems</span>{" "}
 (rather than employer-provided insurance)?
 </p>
 <p className="text-sm text-gray-600 mb-2">(Enter whole number below)</p>
 <p className="text-sm text-gray-600 italic mb-4">
 For multi-country organizations, provide your best estimate across all locations
 </p>
 
 <div className="flex items-center gap-3">
 <input
 type="number"
 min="0"
 max="100"
 value={ans.cb1a || ""}
 onChange={(e) => setField("cb1a", e.target.value)}
 className="w-24 px-4 py-2 border-2 border-gray-300 rounded-lg text-center"
 placeholder="0"
 />
 <span className="text-base">% access to healthcare through national or government Systems</span>
 </div>
 </div>
 </div>
 )}

 {/* Step 8: CB2b - Future Plans */}
 {step === 8 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">
 Current Benefits Landscape
 </h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 <span className="text-blue-600">Over the next 2 years</span>, which, if any of the following 
 programs does your organization <span className="text-blue-600">plan to roll out</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-[80px] auto-rows-fr">
 {getAllUnselectedOptions().length > 0 ? (
 <>
 {getAllUnselectedOptions().map(opt => {
 const isSelected = Array.isArray(ans.cb2b) && ans.cb2b.includes(opt);
 const isNone = opt === "None of these";
 const hasNone = Array.isArray(ans.cb2b) && ans.cb2b.includes("None of these");
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("cb2b", opt, "None of these")}
 disabled={!isNone && hasNone && !isSelected}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : !isNone && hasNone
 ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 <button
 onClick={() => toggleMulti("cb2b", "None of these", "None of these")}
 className={`px-4 py-3 text-left text-sm md:text-base font-normal rounded-lg border-2 transition-all ${
 Array.isArray(ans.cb2b) && ans.cb2b.includes("None of these")
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 None of these
 </button>
 </>
 ) : (
 <p className="col-span-2 text-gray-600">
 All available benefits have already been selected in previous questions.
 </p>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Step 9: Completion */}
 {step === 9 && (
 <div className="bg-white p-8 rounded-lg shadow-sm text-center">
 <div className="mb-6">
 <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 </div>
 <h2 className="text-2xl font-bold text-gray-900 mb-3">
 General Employee Benefits Complete!
 </h2>
 <p className="text-gray-600 mb-8">
 You've successfully completed the General Employee Benefits section.
 </p>
 <button
 onClick={() => { 
 localStorage.setItem("general_benefits_complete", "true");
 router.push("/dashboard");
}}
 className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
 >
 Save & Continue to Dashboard ?
 </button>
 </div>
 )}

 {/* Navigation */}
 {step < 9 && (
 <div className="flex justify-between mt-8">
 {step > 1 ? (
 <button 
 onClick={back} 
 className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
 >
 ? Back
 </button>
 ) : (
 <span />
 )}
 <button 
 onClick={next} 
 className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
 >
 Next ?
 </button>
 </div>
 )}
 </main>
 
 <Footer />
 </div>
 );
}



