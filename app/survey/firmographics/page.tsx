"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function FirmographicsPage() {
 console.log("FIRMOGRAPHICS PAGE LOADED");
 const router = useRouter();
 const [step, setStep] = useState(1);
 const [ans, setAns] = useState<any>({});
 const [errors, setErrors] = useState<string>("");

 // Load saved answers on mount
 useEffect(() => {
 const saved = localStorage.getItem("firmographics_data");
 if (saved) {
 try {
 const data = JSON.parse(saved);
 setAns(data);
 console.log("Loaded firmographics:", data);
 } catch (e) {
 console.error("Error loading firmographics:", e);
 }
 }
 }, []);

 // Save answers when they change
 useEffect(() => {
 if (Object.keys(ans).length > 0) {
 localStorage.setItem("firmographics_data", JSON.stringify(ans));
 console.log("Firmographics auto-saved:", ans);
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
 case 1: // Birth year & Gender
 if (!ans.s1) return "Please enter your birth year";
 const year = parseInt(ans.s1);
 if (isNaN(year) || year < 1900 || year > 2010) 
 return "Please enter a valid birth year";
 if (!ans.s2) return "Please select how you identify";
 if (ans.s2 === "Prefer to self-describe (specify)" && !ans.s2_other?.trim())
 return "Please specify how you identify";
 return null;

 case 2: // Department & Job Function
 if (!ans.s4a) return "Please select your department / function";
 if (ans.s4a === "Other (specify):" && !ans.s4a_other?.trim())
 return "Please specify your department";
 if (!ans.s4b) return "Please select your primary job function";
 if (ans.s4b === "Some other function (specify):" && !ans.s4b_other?.trim())
 return "Please specify your job function";
 return null;

 case 3: // Level & Responsibilities
 if (!ans.s5) return "Please select your current level";
 if (ans.s5 === "Some other level (specify):" && !ans.s5_other?.trim())
 return "Please specify your level";
 if (!Array.isArray(ans.s6) || ans.s6.length === 0)
 return "Please select your areas of responsibility";
 return null;

 case 4: // Influence on benefits
 if (!ans.s7) return "Please select your level of influence";
 return null;

 case 5: // Organization size
 if (!ans.s8) return "Please select your organization size";
 return null;

 case 6: // HQ Country & Other countries
 if (!ans.s9) return "Please select your headquarters country";
 if (ans.s9 === "Other" && !ans.s9_other?.trim())
 return "Please specify your country";
 if (!ans.s9a) return "Please select number of other countries";
 return null;

 case 7: // Industry
 if (!ans.c2) return "Please select your industry";
 if (ans.c2 === "Other industry / Services (specify)" && !ans.c2_other?.trim())
 return "Please specify your industry";
 return null;

 case 8: // Benefits eligibility
 if (!ans.c3) return "Please select workforce eligibility percentage";
 
 // SKIP C3a (excluded groups) if C3 = "All employees (100%)"
 if (ans.c3 !== "All employees (100%)") {
 if (!Array.isArray(ans.c4) || ans.c4.length === 0)
 return "Please select which groups are excluded (or select 'None')";
 if (ans.c4.includes("Some other employee group (specify)") && !ans.c4_other?.trim())
 return "Please specify other excluded groups";
 }
 return null;

 case 9: // Revenue & Remote policy 
 if (!ans.c5) return "Please select annual revenue";
 if (!ans.c6) return "Please select remote / hybrid work approach";
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
 
 if (step < 10) {
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

 // Data arrays for questions
 const S2_GENDER = [
 "Male",
 "Female", 
 "Non-binary",
 "Prefer to self-describe (specify)",
 "Prefer not to say"
 ];

 const S4A_DEPARTMENT = [
 "Accounting or Finance",
 "Benefits",
 "Communications / Public Relations",
 "Customer Service / Customer Success",
 "Human Resources / People Operations",
 "Information Technology (IT)",
 "Legal / Compliance",
 "Logistics / Supply Chain",
 "Manufacturing",
 "Marketing",
 "Research and Development",
 "Sales / Business Development",
 "Other (specify):"
 ];

 const S4B_FUNCTION = [
 "Human Resources",
 "Benefits / Compensation",
 "People & Culture",
 "Talent Management",
 "Some other function (specify):"
 ];

 const S5_LEVEL = [
 "C-level executive (CHRO, CPO)",
 "Executive / Senior Vice President",
 "Vice President",
 "Director",
 "Senior Manager",
 "Manager",
 "HR Generalist",
 "Benefits Specialist / Coordinator",
 "HR Specialist / Coordinator",
 "HR Assistant / Administrative",
 "Some other level (specify):"
 ];

 const S6_RESPONSIBILITIES = [
 "Employee benefits selection / updates",
 "Leave policies (FMLA, STD, LTD)",
 "Employee health & wellness programs",
 "Workplace accommodations and adjustments",
 "Manager training & development",
 "Employee assistance programs (EAP)",
 "Workers' compensation",
 "Organizational culture initiatives",
 "Wellness initiatives",
 "Flexible work arrangements",
 "None of these"
 ];

 const S7_INFLUENCE = [
 "Primary decision maker",
 "Part of decision-making team",
 "Make recommendations that are usually adopted",
 "Provide input but limited influence",
 "No influence"
 ];

 const S8_SIZE = [
 "Fewer than 100",
 "100-249",
 "250-499",
 "500-999",
 "1,000-2,499",
 "2,500-4,999",
 "5,000-9,999",
 "10,000-24,999",
 "25,000-49,999",
 "50,000+"
 ];

 const S9A_OTHER_COUNTRIES = [
 "No other countries - headquarters only",
 "1 to 2 other countries",
 "3 to 4 other countries",
 "5 to 9 other countries",
 "10 to 19 other countries",
 "20 to 49 other countries",
 "50 or more countries"
 ];

 const C3_ELIGIBILITY = [
 "All employees (100%)",
 "Most employees (75-99%)",
 "Many employees (50-74%)",
 "Some employees (25-49%)",
 "Few employees (<25%)",
 "Varies significantly by location"
];
 
 const C4_EXCLUDED = [
 "Part-time employees",
 "Contract / temporary workers",
 "Employees in certain countries / regions",
 "Employees below certain tenure",
 "Certain job levels / categories",
 "Some other group (specify):", // ← FIXED to match button text
 "None - all eligible for standard benefits"
];

 const C5_REVENUE = [
 "Less than $10 million",
 "$10 million - $49.9 million",
 "$50 million - $99.9 million",
 "$100 million - $249.9 million",
 "$250 million - $499.9 million",
 "$500 million - $999.9 million",
 "$1 billion - $4.9 billion",
 "$5 billion - $9.9 billion",
 "$10 billion or more",
 "Prefer not to disclose"
 ];

 const C6_REMOTE = [
 "Fully flexible - Most roles can be remote / hybrid by employee choice",
 "Selectively flexible - Many roles eligible based on job requirements",
 "Limited flexibility - Some roles eligible but most require on-site presence",
 "Minimal flexibility - Very few roles eligible for remote / hybrid",
 "No flexibility - All employees required on-site",
 "Varies significantly by location / business unit"
 ];

 const INDUSTRIES = {
 "Traditional Industries": [
 "Agriculture, Forestry, Fishing and Hunting",
 "Construction",
 "Manufacturing",
 "Mining, Quarrying, and Oil and Gas Extraction",
 "Retail Trade",
 "Transportation and Warehousing",
 "Utilities",
 "Wholesale Trade"
 ],
 "Service Industries": [
 "Accommodation and Food Services",
 "Arts, Entertainment, and Recreation",
 "Educational Services",
 "Finance and Insurance",
 "Healthcare, Pharmaceuticals & Life Sciences",
 "Hospitality & Tourism",
 "Media & Publishing",
 "Professional & Business Services",
 "Real Estate and Rental and Leasing",
 "Scientific & Technical Services"
 ],
 "Technology & Information": [
 "IT Services & Technology Consulting",
 "Software & Technology Products",
 "Social Media & Digital Platforms",
 "Telecommunications & Internet Services"
 ],
 "Other Sectors": [
 "Government / Public Administration",
 "Non-profit / NGO",
 "Other industry / Services (specify)"
 ]
 };

 return (
 <div className="min-h-screen bg-gray-50 flex flex-col">
 <Header />
 
 <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
 {/* Progress indicator */}
 <div className="mb-6">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-600">Step {step} of 10</span>
 <button 
 onClick={() => { localStorage.setItem("firmographics_complete", "true"); router.push("/dashboard"); }}
 className="text-sm text-orange-600 hover:text-orange-700 font-medium"
 >
 ← Back to Dashboard
 </button>
 </div>
 <div className="w-full bg-gray-200 rounded-full h-2">
 <div 
 className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
 style={{ width: `${(step / 10) * 100}%` }}
 />
 </div>
 </div>

 {/* Error display */}
 {errors && (
 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
 {errors}
 </div>
 )}

 {/* Step 1: Birth Year & Gender */}
 {step === 1 && (
 <div className="space-y-10 bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 In what year were you <span className="text-blue-600">born</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Enter year)</p>
 <input
 type="number"
 value={ans.s1 || ""}
 onChange={(e) => setField("s1", e.target.value)}
 className="w-32 px-4 py-2 border-2 border-gray-300 rounded-lg"
 placeholder="YYYY"
 min="1900"
 max="2010"
 />
 </div>

 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 How do you currently <span className="text-blue-600">identify</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
 {S2_GENDER.map(opt => (
 <button
 key={opt}
 onClick={() => setField("s2", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 opt.includes("(specify)") || opt === "Prefer not to say" ? "font-normal" : ""
 } ${
 ans.s2 === opt
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 ))}
 </div>
 {ans.s2 === "Prefer to self-describe (specify)" && (
 <input
 type="text"
 value={ans.s2_other || ""}
 onChange={(e) => setField("s2_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify..."
 />
 )}
 </div>
 </div>
 )}

 {/* Step 2: Department & Function */}
 {step === 2 && (
 <div className="space-y-10 bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 In which <span className="text-blue-600">department / function</span> do you work?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {S4A_DEPARTMENT.map(opt => (
 <button
 key={opt}
 onClick={() => setField("s4a", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 opt.includes("(specify)") ? "font-normal" : ""
 } ${
 ans.s4a === opt
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 ))}
 </div>
 {ans.s4a === "Other (specify):" && (
 <input
 type="text"
 value={ans.s4a_other || ""}
 onChange={(e) => setField("s4a_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify your department..."
 />
 )}
 </div>

 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 What is your <span className="text-blue-600">primary job function</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
 {S4B_FUNCTION.map(opt => (
 <button
 key={opt}
 onClick={() => setField("s4b", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 opt.includes("(specify)") ? "font-normal" : ""
 } ${
 ans.s4b === opt
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 ))}
 </div>
 {ans.s4b === "Some other function (specify):" && (
 <input
 type="text"
 value={ans.s4b_other || ""}
 onChange={(e) => setField("s4b_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify your function..."
 />
 )}
 </div>
 </div>
 )}

 {/* Step 3: Level & Responsibilities */}
 {step === 3 && (
 <div className="space-y-10 bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 What is your <span className="text-blue-600">current level</span> within the organization?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {S5_LEVEL.map(opt => (
 <button
 key={opt}
 onClick={() => setField("s5", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 opt.includes("(specify)") ? "font-normal" : ""
 } ${
 ans.s5 === opt
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 ))}
 </div>
 {ans.s5 === "Some other level (specify):" && (
 <input
 type="text"
 value={ans.s5_other || ""}
 onChange={(e) => setField("s5_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify your level..."
 />
 )}
 </div>

 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which areas fall under your <span className="text-blue-600">responsibility or influence</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {S6_RESPONSIBILITIES.map(opt => {
 const isSelected = Array.isArray(ans.s6) && ans.s6.includes(opt);
 const isNone = opt === "None of these";
 const hasNone = Array.isArray(ans.s6) && ans.s6.includes("None of these");
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("s6", opt, "None of these")}
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

 {/* Step 4: Influence */}
 {step === 4 && (
 <div className="space-y-10 bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 How much <span className="text-blue-600">influence</span> do you have on decisions 
 regarding <span className="text-blue-600">workplace support</span> for employees 
 managing cancer or other serious health conditions?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 <div className="space-y-2 max-w-2xl">
 {S7_INFLUENCE.map(opt => (
 <button
 key={opt}
 onClick={() => setField("s7", opt)}
 className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 ans.s7 === opt
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

 {/* Step 5: Organization Size */}
 {step === 5 && (
 <div className="space-y-10 bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Approximately how many <span className="text-blue-600">total employees</span> work at 
 your organization (all locations)?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
 {S8_SIZE.map(opt => (
 <button
 key={opt}
 onClick={() => setField("s8", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 ans.s8 === opt
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

 {/* Step 6: HQ Country */}
 {step === 6 && (
 <div className="space-y-10 bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 In which <span className="text-blue-600">country</span> is your organization's{" "}
 <span className="text-blue-600">headquarters</span> located?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <select
 value={ans.s9 || ""}
 onChange={(e) => setField("s9", e.target.value)}
 className="w-full max-w-md px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm md:text-base"
 >
 <option value="">Select a country...</option>
 <option value="Argentina">Argentina</option>
 <option value="Australia">Australia</option>
 <option value="Brazil">Brazil</option>
 <option value="Canada">Canada</option>
 <option value="Chile">Chile</option>
 <option value="China">China</option>
 <option value="Colombia">Colombia</option>
 <option value="Egypt">Egypt</option>
 <option value="France">France</option>
 <option value="Germany">Germany</option>
 <option value="India">India</option>
 <option value="Israel">Israel</option>
 <option value="Italy">Italy</option>
 <option value="Japan">Japan</option>
 <option value="Kenya">Kenya</option>
 <option value="Mexico">Mexico</option>
 <option value="Netherlands">Netherlands</option>
 <option value="Nigeria">Nigeria</option>
 <option value="Saudi Arabia">Saudi Arabia</option>
 <option value="Singapore">Singapore</option>
 <option value="South Africa">South Africa</option>
 <option value="South Korea">South Korea</option>
 <option value="Spain">Spain</option>
 <option value="Sweden">Sweden</option>
 <option value="Switzerland">Switzerland</option>
 <option value="United Arab Emirates">United Arab Emirates</option>
 <option value="United Kingdom">United Kingdom</option>
 <option value="United States">United States</option>
 <option value="Other">Other (specify)</option>
 </select>
 
 {ans.s9 === "Other" && (
 <input
 type="text"
 value={ans.s9_other || ""}
 onChange={(e) => setField("s9_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify country..."
 />
 )}
 </div>

 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Besides your headquarters location, in how many <span className="text-blue-600">other countries</span>{" "}
 does your organization have <span className="text-blue-600">offices or operations</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE) - Your best estimate is fine</p>
 <div className="space-y-2 max-w-2xl">
 {S9A_OTHER_COUNTRIES.map(opt => (
 <button
 key={opt}
 onClick={() => setField("s9a", opt)}
 className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 ans.s9a === opt
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

 {/* Step 7: Industry */}
 {step === 7 && (
 <div className="space-y-10 bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which best describes your organization's <span className="text-blue-600">industry</span>?
 </p>
 <p className="text-sm text-gray-600 mb-6">(Select ONE)</p>

 <div className="space-y-6">
 {Object.entries(INDUSTRIES).map(([category, industries]) => (
 <div key={category}>
 <h3 className="text-sm font-semibold text-blue-600 mb-3">
 {category.toUpperCase()}
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {industries.map(ind => (
 <button
 key={ind}
 onClick={() => setField("c2", ind)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 ind.includes("(specify)") ? "font-normal" : ""
 } ${
 ans.c2 === ind
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {ind}
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>

 {ans.c2 === "Other industry / Services (specify)" && (
 <input
 type="text"
 value={ans.c2_other || ""}
 onChange={(e) => setField("c2_other", e.target.value)}
 className="mt-4 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify your industry..."
 />
 )}
 </div>
 </div>
 )}

 {/* Step 8: Benefits Eligibility */}
 {step === 8 && (
 <div className="space-y-10 bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
 
 {/* C3: Percentage eligible */}
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Approximately what percentage of your workforce is{" "}
 <span className="text-blue-600">eligible for standard employee benefits</span>{" "}
 (health insurance, paid leave, etc.)?
 </p>
 <p className="text-sm text-gray-600 mb-4">Your best estimate is fine</p>
 
 <div className="space-y-2 max-w-2xl">
 {C3_ELIGIBILITY.map(opt => (
 <button
 key={opt}
 onClick={() => {
 setField("c3", opt);
 if (opt === "All employees (100%)") {
 setField("c4", []);
 setField("c4_other", "");
 }
 }}
 className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 ans.c3 === opt
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 ))}
 </div>
 </div>

 {/* C4: Excluded groups - ONLY show if NOT 100% */}
 {ans.c3 && ans.c3 !== "All employees (100%)" && (
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which employee groups are typically{" "}
 <span className="text-blue-600">EXCLUDED</span> from workplace support benefits?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {C4_EXCLUDED.map(opt => {
 const isSelected = Array.isArray(ans.c4) && ans.c4.includes(opt);
 const isNone = opt === "None - all eligible for standard benefits";
 const isOther = opt === "Other (specify):";
 const hasNone = Array.isArray(ans.c4) && ans.c4.includes("None - all eligible for standard benefits");
 
 return (
 <button
 key={opt}
 onClick={() => toggleMulti("c4", opt, "None - all eligible for standard benefits")}
 disabled={!isNone && hasNone && !isSelected}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 isNone || isOther ? "font-normal" : ""
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

 {Array.isArray(ans.c4) && ans.c4.includes("Some other group (specify):") && (
 <input
 type="text"
 value={ans.c4_other || ""}
 onChange={(e) => setField("c4_other", e.target.value)}
 className="mt-3 w-full max-w-md px-4 py-2 border-2 border-blue-500 rounded-lg"
 placeholder="Please specify other employee groups..."
 />
 )}
 </div>
 )}

 {ans.c3 === "All employees (100%)" && (
 <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
 <p className="text-sm text-green-800">
 ✓ All employees eligible - skipping excluded groups question
 </p>
 </div>
 )}
 </div>
 )}
 {/* Step 9: Revenue & Remote Policy */}
 {step === 9 && (
 <div className="space-y-10 bg-white p-6 rounded-lg shadow-sm">
 <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
 
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 What is your organization's approximate{" "}
 <span className="text-blue-600">annual revenue</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {C5_REVENUE.map(opt => (
 <button
 key={opt}
 onClick={() => setField("c5", opt)}
 className={`px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 opt === "Prefer not to disclose" ? "font-normal" : ""
 } ${
 ans.c5 === opt
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 {opt}
 </button>
 ))}
 </div>
 </div>

 {/* C6: Remote / Hybrid - UPDATED OPTIONS */}
 <div>
 <p className="text-base font-bold text-gray-900 mb-1">
 Which best describes your organization's approach to{" "}
 <span className="text-blue-600">remote / hybrid work</span>?
 </p>
 <p className="text-sm text-gray-600 mb-4">(Select ONE)</p>
 <div className="space-y-2 max-w-3xl">
 {C6_REMOTE.map(opt => {
 const parts = opt.split(' - ');
 const boldPart = parts[0];
 const normalPart = parts[1];
 
 return (
 <button
 key={opt}
 onClick={() => setField("c6", opt)}
 className={`w-full px-4 py-3 text-left text-sm md:text-base rounded-lg border-2 transition-all ${
 ans.c6 === opt
 ? "border-blue-500 bg-blue-50"
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 <span className="font-bold">{boldPart}</span>
 {normalPart && <span className="font-normal"> - {normalPart}</span>}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* Step 10: Completion */}
 {step === 10 && (
 <div className="bg-white p-8 rounded-lg shadow-sm text-center">
 <div className="mb-6">
 <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 </div>
 <h2 className="text-2xl font-bold text-gray-900 mb-3">
 Company Profile Complete!
 </h2>
 <p className="text-gray-600 mb-8">
 You've successfully completed the Company Profile section.
 </p>
 <button
 onClick={() => { localStorage.setItem("firmographics_complete", "true"); router.push("/dashboard"); }}
 className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
 >
 Save & Continue to Dashboard →
 </button>
 </div>
 )}

 {/* Navigation */}
 {step < 10 && (
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
 Next →
 </button>
 </div>
 )}
 </main>
 
 <Footer />
 </div>
 );
}
