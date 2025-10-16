"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next / navigation";
import Header from "@/components / Header";
import Footer from "@/components / Footer";

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
 const shuffled = [...array];
 for (let i = shuffled.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
 }
 return shuffled;
}
 const D6A_ITEMS_BASE = [
 "Strong anti-discrimination policies specific to health conditions",
 "Clear process for confidential health disclosures",
 "Manager training on handling sensitive health information",
 "Written anti-retaliation policies for health disclosures",
 "Employee peer support groups (internal employees with shared experience)",
 "Professional-led support groups (external facilitator / counselor)",
 "Stigma-reduction initiatives",
 "Specialized emotional counseling",
 "Optional open health dialogue forums",
 "Inclusive communication guidelines",
 "Confidential HR channel for health benefits, policies and insurance-related questions",
 "Anonymous benefits navigation tool or website (no login required)"
 ];

export default function Dimension6Page() {
 const router = useRouter();
 const [step, setStep] = useState(0);
 const [ans, setAns] = useState<any>({});
 const [errors, setErrors] = useState<string>("");
 const [currentItemIndex, setCurrentItemIndex] = useState(0);
 const [isMultiCountry, setIsMultiCountry] = useState(false);
 const [isTransitioning, setIsTransitioning] = useState(false);
 const [D6A_ITEMS] = useState(() => shuffleArray(D6A_ITEMS_BASE));
 
 useEffect(() => {
 const saved = localStorage.getItem("dimension6_data");
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 setAns(parsed);
 } catch (e) {
 console.error("Error loading saved data:", e);
 }
 }

 const firmographicsData = localStorage.getItem("firmographics_data");
 if (firmographicsData) {
 const parsed = JSON.parse(firmographicsData);
 setIsMultiCountry(parsed.s9a !== "No other countries - headquarters only");
 }
 }, []);

 useEffect(() => {
 if (Object.keys(ans).length > 0) {
 localStorage.setItem("dimension6_data", JSON.stringify(ans));
 }
 }, [ans]);

 // Scroll to top when step changes (but not for progressive card navigation)
 useEffect(() => {
 if (step !== 1) {
 window.scrollTo({ top: 0, behavior: 'smooth' });
 }
 }, [step]);

 const setField = (key: string, value: any) => {
 setAns((prev: any) => ({ ...prev, [key]: value }));
 setErrors("");
 };

 const setStatus = (item: string, status: string) => {
 setAns((prev: any) => ({
 ...prev,
 d6a: { ...(prev.d6a || {}), [item]: status }
 }));
 
 setIsTransitioning(true);
 
 setTimeout(() => {
 const nextUnansweredIndex = D6A_ITEMS.findIndex((itm, idx) => 
 idx > currentItemIndex && !ans.d6a?.[itm]
 );
 
 if (nextUnansweredIndex !== -1) {
 setCurrentItemIndex(nextUnansweredIndex);
 } else if (currentItemIndex < D6A_ITEMS.length - 1) {
 setCurrentItemIndex(currentItemIndex + 1);
 }
 
 setTimeout(() => {
 setIsTransitioning(false);
 }, 250);
 }, 500);
 };

 const goToItem = (index: number) => {
 setIsTransitioning(true);
 setTimeout(() => {
 setCurrentItemIndex(index);
 setTimeout(() => {
 setIsTransitioning(false);
 }, 400);
 }, 500);
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

 const STATUS_OPTIONS = [
 "Not able to offer in foreseeable future",
 "Assessing feasibility",
 "In active planning / development",
 "Currently offer"
 ];

 const hasAnyOffered = Object.values(ans.d6a || {}).some(
 (status) => status === "Currently offer"
 );
 
 const showD6aa = isMultiCountry && hasAnyOffered;
 const showD6_2 = hasAnyOffered;

 const getTotalSteps = () => {
 let total = 4; // intro, D6.a, D6.aa (conditional), D6.b
 if (showD6_2) total++; // D6.2
 total++; // completion
 return total;
 };

 const validateStep = () => {
 switch(step) {
 case 1:
 const answeredCount = Object.keys(ans.d6a || {}).length;
 if (answeredCount < D6A_ITEMS.length) 
 return `Please evaluate all ${D6A_ITEMS.length} items (${answeredCount} completed)`;
 return null;
 
 case 2:
 if (showD6aa && !ans.d6aa) {
 return "Please select one option";
 }
 return null;
 
 case 3:
 return null;
 
 case 4:
 if (showD6_2 && (!ans.d6_2 || ans.d6_2.length === 0)) {
 return "Please select at least one option";
 }
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
 if (showD6aa) {
 setStep(2);
 } else {
 setStep(3);
 }
 } else if (step === 2) {
 setStep(3);
 } else if (step === 3) {
 if (showD6_2) {
 setStep(4);
 } else {
 setStep(5); // Go to completion
 }
 } else if (step === 4) {
 setStep(5); // Go to completion
 } else if (step === 5) {
 localStorage.setItem("dimension6_complete", "true");
 router.push("/dashboard");
 return;
 }
 
 setErrors("");
 };

 const back = () => {
 if (step === 5) {
 setStep(showD6_2 ? 4 : 3);
 } else if (step === 4) {
 setStep(3);
 } else if (step === 3) {
 setStep(showD6aa ? 2 : 1);
 } else if (step === 2) {
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
 <div className="mb-6">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-600">
 Dimension 6: Culture & Psychological Safety
 </span>
 </div>
 <div className="w-full bg-gray-200 rounded-full h-2">
 <div 
 className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
 style={{ width: `${(step / getTotalSteps()) * 100}%` }}
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
 <p className="text-lg text-gray-700 mb-6">
 Here is the next aspect of <strong>support programs</strong> for{" "}
 <strong>employees managing cancer or other serious health conditions</strong>:
 </p>

 <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl mb-8">
 <h2 className="text-3xl font-bold text-white mb-3">CULTURE & PSYCHOLOGICAL SAFETY</h2>
 <p className="text-blue-100 text-lg">
 The environment for employees to feel safe discussing medical conditions, protected from discrimination, and supported without judgment.
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
 <span><strong>Indicate the current status of each option within your organization</strong></span>
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
 Begin Assessment
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Step 1: D6.a Progressive Cards */}
 {step === 1 && (
 <div className="bg-white rounded-xl shadow-sm">
 <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 rounded-t-xl">
 <div className="flex justify-between items-start">
 <div className="flex-1">
 <h2 className="text-2xl font-bold text-white mb-2">CULTURE & PSYCHOLOGICAL SAFETY</h2>
 <p className="text-gray-300 text-sm">
 Environment for employees to feel safe and supported
 </p>
 </div>
 </div>
 </div>

 <div className="p-8">
 <div className="mb-6">
 <div className="flex items-center justify-between">
 <span className="text-lg font-bold text-gray-800">
 Item {currentItemIndex + 1} of {D6A_ITEMS.length}
 </span>
 <div className="flex gap-1">
 {D6A_ITEMS.map((item, idx) => (
 <button
 key={idx}
 onClick={() => goToItem(idx)}
 className={`h-2 transition-all duration-500 rounded-full ${
 ans.d6a?.[item]
 ? "w-8 bg-green-600 hover:bg-green-700 cursor-pointer"
 : idx === currentItemIndex
 ? "w-8 bg-blue-600"
 : "w-2 bg-gray-300 hover:bg-gray-400 cursor-pointer"
 }`}
 title={item}
 disabled={isTransitioning}
 />
 ))}
 </div>
 </div>
 </div>

 <div className="mb-6">
 <div
 className={`bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8 rounded-xl border-2 border-blue-100 transition-all duration-700 ease-in-out ${
 isTransitioning
 ? 'opacity-0 transform scale-95 blur-sm'
 : 'opacity-100 transform scale-100 blur-0'
 }`}
 >
 <h3 className="text-lg font-semibold text-gray-900 mb-2">
 {D6A_ITEMS[currentItemIndex]}
 </h3>
 <p className="text-xs italic text-gray-600 mb-4">
 We recognize that implementation may vary based on country / jurisdiction-specific laws and regulations.
 </p>

 <div className="space-y-2">
 {STATUS_OPTIONS.map((status) => (
 <button
 key={status}
 onClick={() => setStatus(D6A_ITEMS[currentItemIndex], status)}
 disabled={isTransitioning}
 className={`w-full p-4 text-left rounded-lg border-2 transition-all transform ${
 isTransitioning
 ? 'cursor-not-allowed opacity-50'
 : 'hover:scale-[1.02] cursor-pointer'
 } ${
 ans.d6a?.[D6A_ITEMS[currentItemIndex]] === status
 ? "border-blue-500 bg-blue-50 shadow-lg"
 : "border-gray-200 hover:border-gray-300 bg-white hover:shadow"
 }`}
 >
 <div className="flex items-center">
 <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all ${
 ans.d6a?.[D6A_ITEMS[currentItemIndex]] === status
 ? "border-blue-500 bg-blue-500"
 : "border-gray-300 bg-white"
 }`}>
 {ans.d6a?.[D6A_ITEMS[currentItemIndex]] === status && (
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

 <div className="flex justify-between items-center mt-6">
 <button
 onClick={() => goToItem(Math.max(0, currentItemIndex - 1))}
 disabled={currentItemIndex === 0 || isTransitioning}
 className={`px-4 py-2 text-sm font-medium transition-all ${
 currentItemIndex === 0 || isTransitioning
 ? "text-gray-300 cursor-not-allowed"
 : "text-gray-600 hover:text-gray-800"
 }`}
 >
 ← View previous option
 </button>

 {Object.keys(ans.d6a || {}).length === D6A_ITEMS.length && !isTransitioning && (
 <button
 onClick={next}
 className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow animate-pulse"
 >
 Continue →
 </button>
 )}
 </div>
 </div>
 </div>
 )}
 
 {/* Step 2: D6.aa (conditional for multi-country) */}
 {step === 2 && showD6aa && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h3 className="text-xl font-bold text-gray-900 mb-4">Geographic Availability</h3>
 
 <p className="font-bold text-gray-900 mb-4">
 Are the <span className="text-blue-600 font-bold">Culture & Psychological Safety support options</span> your 
 organization <span className="text-blue-600 font-bold">currently offers</span>...?
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
 onClick={() => setField("d6aa", opt)}
 className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 ans.d6aa === opt
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

 {/* Step 3: D6.b open-end */}
 {step === 3 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Supports</h3>
 
 <p className="font-bold text-gray-900 mb-4">
 What other <span className="text-blue-600 font-bold">culture and psychological safety supports</span> does your organization offer that weren't listed?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Please be as specific and detailed as possible)</p>
 
 <textarea
 value={ans.d6b || ""}
 onChange={(e) => setField("d6b", e.target.value)}
 className="w-full min-h-[120px] px-4 py-3 border-2 border-gray-300 rounded-lg"
 placeholder="Describe any additional supports..."
 />
 
 <label className="flex items-center mt-3">
 <input
 type="checkbox"
 checked={ans.d6b_none || false}
 onChange={(e) => {
 setField("d6b_none", e.target.checked);
 if (e.target.checked) setField("d6b", "");
 }}
 className="w-4 h-4 mr-2"
 />
 <span className="text-sm">No other supports</span>
 </label>
 </div>
 )}

 {/* Step 4: D6.2 (conditional if any offered) */}
 {step === 4 && showD6_2 && (
 <div className="bg-white p-6 rounded-lg shadow-sm">
 <h3 className="text-xl font-bold text-gray-900 mb-4">Measuring Psychological Safety</h3>
 
 <p className="font-bold text-gray-900 mb-4">
 How do you <span className="text-blue-600 font-bold">measure psychological safety</span> for <span className="text-blue-600 font-bold">employees managing cancer or other serious health conditions</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ALL that are available in at least one location)</p>
 
 <div className="space-y-2">
 {[
 "Regular pulse surveys",
 "Focus groups",
 "Exit interview data",
 "Manager feedback",
 "One-on-One discussion with employee",
 "Some other way (specify)",
 "Don't formally measure"
 ].map(opt => (
 <div key={opt}>
 <button
 onClick={() => toggleMultiSelect("d6_2", opt)}
 className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 ans.d6_2?.includes(opt)
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 {opt.includes("(specify)") && ans.d6_2?.includes(opt) && (
 <input
 type="text"
 value={ans.d6_2_other || ""}
 onChange={(e) => setField("d6_2_other", e.target.value)}
 placeholder="Please specify..."
 className="mt-2 w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
 />
 )}
 </div>
 ))}
 </div>
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
 Dimension 6 Complete!
 </h2>
 <p className="text-gray-600 mb-8">
 You've successfully completed the Culture & Psychological Safety dimension.
 </p>
 <button
 onClick={() => { 
 localStorage.setItem("dimension6_complete", "true"); 
 router.push("/dashboard"); 
 }}
 className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
 >
 Save & Return to Dashboard →
 </button>
 </div>
 )}

 {/* Universal Navigation */}
 {step > 1 && step < 5 && (
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
