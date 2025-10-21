"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CurrentSupportPage() {
 const router = useRouter();
 const [step, setStep] = useState(1);
 const [ans, setAns] = useState<any>({});
 const [errors, setErrors] = useState<string>("");

 // Load saved answers on mount
 useEffect(() => {
 const saved = localStorage.getItem("current_support_data");
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
 localStorage.setItem("current_support_data", JSON.stringify(ans));
 }
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

 // Validation for current step
 const validateStep = () => {
 switch (step) {
 case 1: // Display - no validation
 return null;

 case 2: // CB3a
 if (!ans.cb3a) return "Please select one option";
 return null;

 case 3: // CB3b
 if (!Array.isArray(ans.cb3b) || ans.cb3b.length === 0) 
 return "Please select at least one option";
 if (ans.cb3b.includes("Other (specify):") && !ans.cb3b_other?.trim())
 return "Please specify other";
 return null;

 case 4: // CB3c
 if (!Array.isArray(ans.cb3c) || ans.cb3c.length === 0)
 return "Please select at least one condition";
 if (ans.cb3c.includes("Some other condition meeting severity / duration criteria (specify)") && !ans.cb3c_other?.trim())
 return "Please specify other condition";
 return null;

 case 5: // CB3d
 if (!Array.isArray(ans.cb3d) || ans.cb3d.length === 0)
 return "Please select at least one option";
 if (ans.cb3d.includes("Some other way (specify):") && !ans.cb3d_other?.trim())
 return "Please specify how";
 return null;

 case 6: // Display 2 - no validation
 return null;

 case 7: // OR1
 if (!ans.or1) return "Please select your organization's current approach";
 return null;

 case 8: // OR2a (conditional)
 if (!Array.isArray(ans.or2a) || ans.or2a.length === 0)
 return "Please select at least one trigger";
 if (ans.or2a.includes("Other (specify)") && !ans.or2a_other?.trim())
 return "Please specify other trigger";
 return null;

 case 9: // OR2b
 if (!ans.or2b?.trim()) return "Please describe the most impactful change";
 return null;

 case 10: // OR3 (conditional)
 if (!Array.isArray(ans.or3) || ans.or3.length === 0)
 return "Please select at least one barrier";
 if (ans.or3.includes("Some other reason (specify)") && !ans.or3_other?.trim())
 return "Please specify other barriers";
 return null;

 case 11: // OR5a
 if (!Array.isArray(ans.or5a) || ans.or5a.length === 0)
 return "Please select at least one type of support";
 if (ans.or5a.includes("Some other support (specify):") && !ans.or5a_other?.trim())
 return "Please specify other support";
 return null;

 case 12: // OR6
 if (!Array.isArray(ans.or6) || ans.or6.length === 0)
 return "Please select at least one monitoring method";
 if (ans.or6.includes("Some other approach (specify)") && !ans.or6_other?.trim())
 return "Please specify other approach";
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

 // Skip logic
 if (step === 2) {
 if (ans.cb3a === "At this time, we primarily focus on meeting legal compliance requirements") {
 setStep(6); // Skip to Display 2
 return;
 }
 }

 // FIXED: Skip logic now matches Word doc exactly
 if (step === 7) {
const skipToOR3 = [
 "No formal approach: Handle situations as they arise",
 "Developing approach: Currently building programs and policies",
 "Basic support -- legal minimums plus some informal flexibility"
];
 
 if (skipToOR3.includes(ans.or1)) {
 setStep(10); // Skip to OR3
 } else {
 setStep(8); // Go to OR2a
 }
 return;
 }

 if (step === 9) {
 setStep(11); // After OR2b, skip to OR5a
 return;
 }

 if (step === 10) {
 setStep(11); // After OR3, go to OR5a
 return;
 }

 if (step < 13) {
 setStep(step + 1);
 setErrors("");
 }
 };

 const back = () => {
 if (step === 6 && ans.cb3a === "At this time, we primarily focus on meeting legal compliance requirements") {
 setStep(2); // Go back to CB3a
 } else if (step === 10) {
 setStep(7); // Go back to OR1
 } else if (step === 11) {
 // Check where we came from
 const skipToOR3 = [
 "No formal approach: Handle case-by-case",
 "Developing approach: Currently building our programs",
 "Legal minimum only: Meet legal requirements only (FMLA, ADA)"
 ];
 if (skipToOR3.includes(ans.or1)) {
 setStep(10); // Go back to OR3
 } else {
 setStep(9); // Go back to OR2b
 }
 } else if (step > 1) {
 setStep(step - 1);
 setErrors("");
 }
 };

 // Data arrays
 const CB3B_OPTIONS = [
 "Individual benefits or policies (e.g., extended leave, flexible work options)",
 "Coordinated support services - single point of contact for multiple resources (e.g., nurse navigation, case management)",
 "Internally developed formal program with a specific name (e.g., \"We Care at Work\")",
 "Participation in external initiatives, certifications, or pledges (e.g., Working with Cancer pledge, CEO Cancer Gold Standard)",
 "Comprehensive framework that integrates multiple support elements",
 "Ad hoc / case-by-case support as needs arise",
 "Other (specify):"
 ];

 const CB3C_CONDITIONS = [
 "Autoimmune disorders (e.g., MS, lupus, rheumatoid arthritis)",
 "Cancer (any form)",
 "Chronic conditions (e.g., MS, ALS, Parkinson's, Crohn's, lupus, rheumatoid arthritis)",
 "Heart disease (including heart attack, heart failure)",
 "HIV / AIDS",
 "Kidney disease (including dialysis, kidney failure)",
 "Major surgery recovery (planned or emergency)",
 "Mental health crises (requiring extended leave)",
 "Musculoskeletal conditions (chronic or acute)",
 "Neurological conditions (e.g., epilepsy, brain injury)",
 "Organ transplant (pre and post)",
 "Respiratory conditions (e.g., COPD, cystic fibrosis)",
 "Stroke",
 "Some other condition meeting severity / duration criteria (specify)"
 ];

 const CB3D_OPTIONS = [
 "Internally by HR team",
 "With assistance from benefits broker",
 "With specialized consultant support",
 "Adopted from parent / acquiring company",
 "Benchmarked from peer companies",
 "Employee / union driven",
 "Some other way (specify):"
 ];

 // FIXED: Updated OR1 options to match Word doc exactly
const OR1_OPTIONS = [
 "No formal approach: Handle situations as they arise",
 "Developing approach: Currently building programs and policies",
 "Basic support -- legal minimums plus some informal flexibility",
 "Moderate support: Some programs beyond legal requirements",
 "Strong support: Meaningful programs beyond legal minimums",
 "Leading-edge support: Extensive, innovative programs"
];

 // FIXED: Updated OR2A triggers to match Word doc
 const OR2A_TRIGGERS = [
 "Employee(s) diagnosed with cancer or other serious health conditions highlighted gaps",
 "Leadership personal experience with cancer",
 "Keep up with industry standards and peer company practices",
 "Employee survey feedback",
 "Recruitment / retention goals or challenges",
 "Legal case or compliance issue",
 "Union negotiations",
 "ESG / corporate responsibility commitments",
 "Inspired by Working with Cancer Initiative or similar programs",
 "Other (specify)"
 ];

 // FIXED: Updated OR3 barriers to match Word doc
 const OR3_BARRIERS = [
 "Budget constraints",
 "Leadership buy-in",
 "Small employee population",
 "Fear of setting precedent",
 "Limited HR and / or Benefits team bandwidth",
 "Lack of expertise / knowledge",
 "Other priorities take precedence",
 "Equity concerns across conditions",
 "Unclear ROI / business case",
 "Privacy / legal concerns",
 "Complex / varying legal requirements across markets",
 "Global consistency challenges",
 "Some other reason (specify)"
 ];

 // FIXED: Added 5 missing items + reordered to match Word doc
 const OR5A_SUPPORT = [
 "Flexible work schedules",
 "Flexible work arrangements",
 "Caregiver leave \(paid\)",
 "Caregiver leave \(unpaid\)",
 "Employee assistance program (EAP) counseling",
 "Caregiver support groups",
 "Referrals to eldercare / dependent care resources",
 "Financial assistance or subsidies",
 "Respite care coverage",
 "Modified job duties / reduced workload",
 "Manager training on supporting caregivers",
 "Backup care services",
 "Legal / financial planning resources",
 "Some other support (specify):",
 "Not able to provide caregiver support at this time"
 ];

 const OR6_MONITORING = [
 "Aggregate metrics and analytics only",
 "De-identified case tracking",
 "General program utilization data",
 "Voluntary employee feedback / surveys",
 "Some other approach (specify)",
 "No systematic monitoring"
 ];

 return (
 <div className="min-h-screen bg-gray-50 flex flex-col">
 <Header />
 
 <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
 {/* Progress indicator */}
 <div className="mb-6">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-600">Step {step} of 13</span>
 <button 
 onClick={() => { 
 localStorage.setItem("current_support_complete", "true");
 router.push("/dashboard");
 }}
 className="text-sm text-orange-600 hover:text-orange-700 font-medium"
 >
 ← Back to Dashboard
 </button>
 </div>
 <div className="w-full bg-gray-200 rounded-full h-2">
 <div 
 className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
 style={{ width: `${(step / 13) * 100}%` }}
 />
 </div>
 </div>

 {/* Error display */}
 {errors && (
 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
 {errors}
 </div>
 )}

 {/* Step 1: Display about serious health conditions */}
 {step === 1 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div className="bg-blue-50 border-l-4 border-blue-600 p-6 space-y-4">
 <p className="text-lg font-bold text-blue-900">
 For the rest of the survey, please think about support your organization provides or may provide for
 employees managing cancer or other serious health conditions requiring time away for treatment or
 recovery, workplace adjustments, or ongoing support.
 </p>
 
 <div className="space-y-3">
 <p className="text-base font-bold text-gray-900">Balancing Employee Support with Organizational Realities</p>
 
 <p>We understand that <strong>all organizations</strong> want to support <strong>employees managing cancer and other serious health conditions</strong>.</p>
 
 <p>But, we also recognize that every organization <strong className="underline">faces real constraints</strong>:</p>
 
 <ul className="list-disc pl-6 space-y-1">
 <li>Budget limitations and competing priorities</li>
 <li>Business continuity and productivity needs</li>
 <li>Resource and bandwidth constraints</li>
 <li>Balancing fairness across all employee needs</li>
 </ul>
 
 <p>These realities <strong className="underline">do not diminish</strong> your commitment to employees - they're simply part of running an organization.</p>
 
 <p>This survey aims to capture what organizations <strong>actually</strong> provide within these constraints. Your honest responses - including what you're unable to offer - will create realistic benchmarks that help all employers understand what's feasible and identify opportunities for improvement.</p>
 
 <div className="bg-gray-50 p-4 rounded-lg">
 <p className="font-semibold mb-2 underline">Throughout the survey, please indicate only:</p>
 <ul className="space-y-1">
 <li>What your organization CURRENTLY has in place</li>
 <li>Programs with dedicated resources (not ad hoc arrangements)</li>
 <li>Benefits beyond standard health insurance coverage</li>
 </ul>
 </div>
 
 <p className="italic">"Not currently available" is a valid and common response. Most organizations are still developing these capabilities, and an accurate picture is more valuable than an aspirational one.</p>
 </div>
 </div>
 </div>
 )}

 {/* Step 2: CB3a */}
 {step === 2 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Does your organization offer any <span className="text-blue-600">benefits, resources, or support for employees managing cancer or other serious health conditions</span> that <span className="underline">go beyond what is legally required</span> in your markets?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="space-y-2">
 {[
 "Yes, we offer additional support beyond legal requirements",
 "Currently developing enhanced support offerings",
 "At this time, we primarily focus on meeting legal compliance requirements",
 "Not yet, but actively exploring options"
 ].map(opt => (
 <button
 key={opt}
 onClick={() => setField("cb3a", opt)}
 className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 ans.cb3a === opt
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

 {/* Step 3: CB3b */}
 {step === 3 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 {ans.cb3a === "Yes, we offer additional support beyond legal requirements" ? "You indicated your organization offers support" : "You indicated your organization plans to offer support"} beyond legal requirements.
 Which of the following best describes how these support programs {ans.cb3a === "Yes, we offer additional support beyond legal requirements" ? "are" : "will be"} structured
 for <span className="text-blue-600">employees managing cancer or other serious health conditions</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ALL that apply)</p>
 
 <div className="grid grid-cols-1 gap-2 auto-rows-fr">
 {CB3B_OPTIONS.map(opt => {
 const isSelected = Array.isArray(ans.cb3b) && ans.cb3b.includes(opt);
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("cb3b", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 opt.includes("(specify)") ? "font-normal" : ""
 } ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 
 {Array.isArray(ans.cb3b) && ans.cb3b.includes("Other (specify):") && (
 <input
 type="text"
 value={ans.cb3b_other || ""}
 onChange={(e) => setField("cb3b_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify..."
 />
 )}
 </div>
 </div>
 )}

 {/* Step 4: CB3c */}
 {step === 4 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which <span className="text-blue-600">serious health conditions</span> {ans.cb3a === "Yes, we offer additional support beyond legal requirements" ? "does" : "will"} your program address?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ALL that apply)</p>
 
 {ans.s9a !== "No other countries - headquarters only" && (
 <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 text-sm">
 <strong>For multi-country organizations:</strong> Select any condition that is covered in at least one of your locations. Your program doesn't need to address all conditions in every location.
 </div>
 )}
 
 <div className="grid grid-cols-1 gap-2">
 {CB3C_CONDITIONS.map(opt => {
 const isSelected = Array.isArray(ans.cb3c) && ans.cb3c.includes(opt);
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("cb3c", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 opt.includes("(specify)") ? "font-normal" : ""
 } ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 
 {Array.isArray(ans.cb3c) && ans.cb3c.includes("Some other condition meeting severity / duration criteria (specify)") && (
 <input
 type="text"
 value={ans.cb3c_other || ""}
 onChange={(e) => setField("cb3c_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify condition..."
 />
 )}
 </div>
 </div>
 )}

 {/* Step 5: CB3d */}
 {step === 5 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 And, how {ans.cb3a === "Yes, we offer additional support beyond legal requirements" ? "were" : "will"} the workplace support programs for <span className="text-blue-600">employees managing cancer or other serious health conditions</span> (be) primarily <span className="underline">developed</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ALL that apply)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-fr">
 {CB3D_OPTIONS.map(opt => {
 const isSelected = Array.isArray(ans.cb3d) && ans.cb3d.includes(opt);
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("cb3d", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 opt.includes("(specify)") ? "font-normal" : ""
 } ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 
 {Array.isArray(ans.cb3d) && ans.cb3d.includes("Some other way (specify):") && (
 <input
 type="text"
 value={ans.cb3d_other || ""}
 onChange={(e) => setField("cb3d_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify..."
 />
 )}
 </div>
 </div>
 )}

 {/* Step 6: Display 2 */}
 {step === 6 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div className="bg-amber-50 border-l-4 border-amber-600 p-6">
 <p className="text-base font-bold text-amber-900 mb-2">
 For the remainder of this survey please keep in mind that we will only ask for aggregate program information and general workforce statistics.
 </p>
 <p className="text-amber-800">
 We will NOT ask for information about individual employees, specific cases, or any personally identifiable health information.
 </p>
 </div>
 </div>
 )}

 {/* Step 7: OR1 - FIXED QUESTION TEXT */}
 {step === 7 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which best describes your organization's current approach to supporting <span className="text-blue-600">employees managing cancer or other serious health conditions</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="space-y-2">
 {OR1_OPTIONS.map(opt => (
 <button
 key={opt}
 onClick={() => setField("or1", opt)}
 className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 ans.or1 === opt
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

 {/* Step 8: OR2a (conditional) */}
 {step === 8 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 What <span className="text-blue-600">triggered</span> your organization to develop support beyond basic legal requirements?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-fr">
 {OR2A_TRIGGERS.map(opt => {
 const isSelected = Array.isArray(ans.or2a) && ans.or2a.includes(opt);
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("or2a", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 opt.includes("(specify)") ? "font-normal" : ""
 } ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 
 {Array.isArray(ans.or2a) && ans.or2a.includes("Other (specify)") && (
 <input
 type="text"
 value={ans.or2a_other || ""}
 onChange={(e) => setField("or2a_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify..."
 />
 )}
 </div>
 </div>
 )}

 {/* Step 9: OR2b (conditional) */}
 {step === 9 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 What has been the <span className="text-blue-600">single most impactful change</span> your organization has made to support employees managing cancer or other serious health conditions?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
 
 <textarea
 value={ans.or2b || ""}
 onChange={(e) => setField("or2b", e.target.value)}
 className="w-full min-h-[140px] px-4 py-3 border-2 border-gray-300 rounded-lg"
 placeholder="Please describe the most impactful change..."
 />
 </div>
 </div>
 )}

 {/* Step 10: OR3 (conditional) */}
 {step === 10 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 What are the <span className="text-blue-600">primary barriers</span> preventing more comprehensive support for employees managing cancer or other serious health conditions?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-fr">
 {OR3_BARRIERS.map(opt => {
 const isSelected = Array.isArray(ans.or3) && ans.or3.includes(opt);
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("or3", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 opt.includes("(specify)") ? "font-normal" : ""
 } ${
 isSelected
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 
 {Array.isArray(ans.or3) && ans.or3.includes("Some other reason (specify)") && (
 <input
 type="text"
 value={ans.or3_other || ""}
 onChange={(e) => setField("or3_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify..."
 />
 )}
 </div>
 </div>
 )}

 {/* Step 11: OR5a - FIXED: Added 5 missing items + updated question text */}
 {step === 11 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 What types of <span className="text-blue-600">caregiver support</span> does your organization provide to employees who have taken on primary caregiver responsibilities for someone <span className="text-blue-600">managing cancer or another serious health condition</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 <p className="text-sm text-gray-500 italic mb-4">Select if offered in at least one location</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-fr">
 {OR5A_SUPPORT.map(opt => {
 const isSelected = Array.isArray(ans.or5a) && ans.or5a.includes(opt);
 const isNone = opt === "Not able to provide caregiver support at this time";
 const hasNone = Array.isArray(ans.or5a) && ans.or5a.includes("Not able to provide caregiver support at this time");
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("or5a", opt, "Not able to provide caregiver support at this time")}
 disabled={!isNone && hasNone && !isSelected}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 isNone || opt.includes("(specify)") ? "font-normal" : ""
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
 
 {Array.isArray(ans.or5a) && ans.or5a.includes("Some other support (specify):") && (
 <input
 type="text"
 value={ans.or5a_other || ""}
 onChange={(e) => setField("or5a_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify..."
 />
 )}
 </div>
 </div>
 )}

 {/* Step 12: OR6 */}
 {step === 12 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Support</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 How does your organization <span className="text-blue-600">monitor effectiveness</span> of workplace support programs while maintaining employee privacy?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-fr">
 {OR6_MONITORING.map(opt => {
 const isSelected = Array.isArray(ans.or6) && ans.or6.includes(opt);
 const isNone = opt === "No systematic monitoring";
 const hasNone = Array.isArray(ans.or6) && ans.or6.includes("No systematic monitoring");
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("or6", opt, "No systematic monitoring")}
 disabled={!isNone && hasNone && !isSelected}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 isNone || opt.includes("(specify)") ? "font-normal" : ""
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
 
 {Array.isArray(ans.or6) && ans.or6.includes("Some other approach (specify)") && (
 <input
 type="text"
 value={ans.or6_other || ""}
 onChange={(e) => setField("or6_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify..."
 />
 )}
 </div>
 </div>
 )}

 {/* Step 13: Completion */}
 {step === 13 && (
 <div className="bg-white p-8 rounded-lg shadow-sm text-center">
 <div className="mb-6">
 <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 </div>
 <h2 className="text-2xl font-bold text-gray-900 mb-3">
 Current Support Section Complete!
 </h2>
 <p className="text-gray-600 mb-8">
 You've successfully completed the Current Support section.
 </p>
 <button
 onClick={() => { 
 localStorage.setItem("current_support_complete", "true"); 
 router.push("/dashboard"); 
 }}
 className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
 >
 Save & Continue to Dashboard →
 </button>
 </div>
 )}

 {/* Navigation */}
 {step < 13 && (
 <div className="flex justify-between mt-8">
 {step > 1 ? (
 <button 
 onClick={back} 
 className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
 >
 ← Back
 </button>
 ) : (
 <span />
 )}
 <button 
 onClick={next} 
 className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
 >
 {step === 1 || step === 6 ? "Continue →" : "Next →"}
 </button>
 </div>
 )}
 </main>
 
 <Footer />
 </div>
 );
}
