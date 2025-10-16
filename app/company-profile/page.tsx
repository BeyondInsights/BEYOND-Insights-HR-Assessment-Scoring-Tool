import { useEffect, useState } from 'react';

const COLORS = {
  purple: { primary: '#6B2C91', light: '#8B4DB3', bg: '#F5EDFF', border: '#D4B5E8' },
  teal: { primary: '#00A896', light: '#33BDAD', bg: '#E6F9F7', border: '#99E6DD' },
  orange: { primary: '#FF6B35', bg: '#FFF0EC', border: '#FFD4C4' },
  gray: { dark: '#2D3748', medium: '#4A5568', light: '#CBD5E0', bg: '#F7FAFC' }
};

const Icons = {
  Building: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3v11m0 0l-4-4m4 4l4-4M3 17h14"/></svg>,
  Print: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h8v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h12a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h8v4H6z"/></svg>
};

// Comprehensive question mapping from instrument-items-FIXED.ts
const QUESTIONS = {
  "D1.a2": "Enhance short-term disability (higher % of salary)",
  "D1.a3": "Enhance long-term disability (higher % of salary)",
  "D1.a27": "Paid medical leave beyond local / legal requirements",
  "D1.a28": "Intermittent leave beyond local / legal requirements",
  "D1.a29": "Flexible work hours during treatment",
  "D1.a30": "Job protection beyond local / legal requirements",
  "D1.a31": "Leave donation bank (employees can donate PTO to colleagues)",
  "D1.a32": "Disability pay top-up (employer adds to disability insurance)",
  "D1.a36": "Remote work options with full benefits",
  
  "D2.a7": "Coverage for advanced, off-label, or clinical trial treatments",
  "D2.a10": "Health benefits continuation at employee rates during leave",
  "D2.a13": "No annual or lifetime coverage maximums",
  "D2.a14": "Out-of-network coverage for specialized care",
  "D2.a15": "Health savings account (HSA) with employer contribution",
  "D2.a16": "Medical expense reimbursement account",
  "D2.a17": "Travel expense reimbursement for specialized care",
  "D2.a18": "Lodging assistance for treatment away from home",
  "D2.a19": "Transportation support for treatment appointments",
  "D2.a20": "Fertility preservation before cancer treatment",
  "D2.a21": "Mental health services with no session limits",
  "D2.a22": "Prescription drug coverage with minimal cost-sharing",
  "D2.a23": "Durable medical equipment coverage",
  "D2.a24": "Home healthcare coverage",
  "D2.a25": "Palliative care services",
  "D2.a26": "Set out-of-pocket maximums (for in-network single coverage)",
  "D2.a27": "Voluntary supplemental illness insurance (with employer contribution)",
  "D2.a28": "Short-term disability covering 60%+ of salary",
  "D2.a29": "Long-term disability covering 60%+ of salary",
  "D2.a30": "Accelerated life insurance benefits (partial payout for terminal / critical illness)",
  
  "D3.a10": "Clear escalation protocol for manager response",
  "D3.a11": "Senior leader coaching on supporting impacted employees",
  "D3.a12": "Manager evaluations include how well they support impacted employees",
  "D3.a13": "Manager peer support / community building",
  "D3.a14": "Manager training on supporting employees with serious medical conditions",
  
  "D4.a5": "Benefits navigator (internal staff)",
  "D4.a6": "Benefits navigator (external vendor)",
  "D4.a7": "Case manager for complex medical situations",
  "D4.a8": "Employee assistance program (EAP) counselors",
  "D4.a9": "Dedicated HR staff for medical leave administration",
  "D4.a10": "Legal counsel for ADA/disability accommodations",
  "D4.a11": "Healthcare advocate service",
  "D4.a12": "Second opinion medical consultation",
  "D4.a13": "Clinical trial navigation",
  "D4.a14": "Financial counseling for medical expenses",
  "D4.a15": "Caregiver support services",
  "D4.a16": "Peer support programs",
  "D4.a17": "Cancer-specific resources (Cancer and Careers, etc.)",
  "D4.a18": "Disease-specific resources",
  
  "D5.a5": "Ergonomic assessment and equipment",
  "D5.a6": "Modified workspace or private workspace",
  "D5.a7": "Parking accommodations",
  "D5.a8": "Flexible location (work from different office)",
  "D5.a9": "Assistive technology",
  "D5.a10": "Modified duties or responsibilities",
  "D5.a11": "Reduced schedule with benefits maintained",
  "D5.a12": "Modified performance standards during treatment",
  "D5.a13": "Protected time for medical appointments",
  "D5.a14": "Temporary reassignment to less demanding role",
  
  "D6.a11": "Strong anti-discrimination policies specific to health conditions",
  "D6.a12": "Clear process for confidential health disclosures",
  "D6.a13": "Manager training on handling sensitive health information",
  "D6.a14": "Written anti-retaliation policies for health disclosures",
  "D6.a15": "Anonymous benefits navigation tool or website",
  "D6.a17": "Confidential HR channel for health benefits questions",
  
  "D7.a4": "Return-to-work coordinator",
  "D7.a5": "Gradual return-to-work program",
  "D7.a6": "Modified duties during transition",
  "D7.a7": "Check-ins during first 90 days back",
  "D7.a8": "Career development planning post-leave",
  "D7.a9": "Ongoing accommodation support",
  "D7.a10": "Performance evaluation flexibility",
  
  "D8.a4": "Return-to-work support included in manager training",
  "D8.a5": "Career pathing preserved during medical leave",
  "D8.a6": "Promotion eligibility maintained during leave",
  "D8.a7": "Development opportunities available during treatment",
  "D8.a8": "Leadership explicitly addresses career continuity",
  "D8.a9": "Success stories shared (with employee consent)",
  
  "D9.a5": "C-suite or board sponsor for health equity initiatives",
  "D9.a6": "Dedicated budget for workplace support programs",
  "D9.a7": "Health equity metrics in executive scorecards",
  "D9.a8": "Regular leadership communications on support programs",
  "D9.a9": "Executive participation in awareness campaigns",
  
  "D10.a5": "Paid caregiver leave",
  "D10.a6": "Flexible scheduling for caregivers",
  "D10.a7": "Caregiver support groups",
  "D10.a8": "Caregiver counseling services",
  "D10.a9": "Respite care assistance",
  "D10.a10": "Backup care services",
  "D10.a11": "Caregiver training programs",
  
  "D11.a3": "Cancer screening programs",
  "D11.a4": "Preventive care incentives",
  "D11.a5": "Wellness programs addressing cancer risk factors",
  "D11.a6": "Tobacco cessation programs",
  "D11.a7": "Healthy lifestyle programs",
  "D11.a8": "ADA compliance training",
  "D11.a9": "FMLA/leave law compliance",
  "D11.a10": "HIPAA privacy compliance",
  "D11.a11": "Regular compliance audits",
  
  "D12.a3": "Employee experience surveys",
  "D12.a4": "Program utilization tracking",
  "D12.a5": "Return-to-work success rates",
  "D12.a6": "Retention rates for employees on medical leave",
  "D12.a7": "Manager feedback on support programs",
  "D12.a8": "Benchmarking against industry standards",
  "D12.a9": "Regular program review and updates",
  "D12.a10": "Pilot programs for new initiatives",
  "D12.a11": "Cross-functional improvement teams",
  "D12.a12": "External expert consultation",
  "D12.a13": "Best practice research",
  "D12.a14": "Employee advisory groups",
  "D12.a15": "Quality improvement metrics",
  "D12.a16": "Outcome measurement with certifications",
  "D12.a17": "[ASK QD12.3 & QD12.4 IF QD12.A = OFFER FOR]",
  
  "D13.a2": "Manager training on health data privacy",
  "D13.a3": "Cultural competency in health support programs",
  "D13.a4": "Access audit logging for health information",
  "D13.a5": "AI bias auditing for health-related decisions",
  "D13.a8": "Employee consent controls for data sharing",
  "D13.a10": "Anonymous feedback channels for privacy concerns",
  "D13.a11": "Health data stored separately from general HR systems",
  "D13.a13": "Equity tracking - ensuring equal access across employee groups"
};

function ProfileSection({ title, color, children }) {
  return (
    <div className="border-2 rounded-xl p-6 mb-6" style={{backgroundColor: color.bg, borderColor: color.border}}>
      <h3 className="text-xl font-bold mb-4" style={{color: COLORS.gray.dark}}>{title}</h3>
      {children}
    </div>
  );
}

function QuestionItem({ qid, question, answer }) {
  if (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0)) return null;
  
  const displayAnswer = Array.isArray(answer) ? answer.join(', ') : answer;
  
  return (
    <div className="mb-4 pb-4 border-b" style={{borderColor: COLORS.gray.light}}>
      <div className="flex gap-3">
        <div className="font-mono text-sm font-bold px-2 py-1 rounded" style={{backgroundColor: COLORS.purple.bg, color: COLORS.purple.primary, minWidth: '80px'}}>
          {qid}
        </div>
        <div className="flex-1">
          <div className="text-sm mb-1" style={{color: COLORS.gray.medium}}>{question}</div>
          <div className="font-semibold" style={{color: COLORS.gray.dark}}>{displayAnswer}</div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load all survey data
    const allData = {};
    
    // Get all localStorage keys and load survey data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith('_data')) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const section = key.replace('_data', '');
        allData[section] = data;
      }
    }

    setProfile({
      companyName: allData.firmographics?.companyName || 'Your Organization',
      email: localStorage.getItem('auth_email') || '',
      allData
    });
    setLoading(false);
  }, []);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    let report = `COMPLETE COMPANY PROFILE\n${profile.companyName}\nGenerated: ${new Date().toLocaleString()}\n\n${'='.repeat(100)}\n\n`;
    
    Object.entries(profile.allData).forEach(([section, data]) => {
      report += `\n${section.toUpperCase()}\n${'-'.repeat(100)}\n`;
      Object.entries(data).forEach(([key, value]) => {
        report += `${key}: ${JSON.stringify(value)}\n`;
      });
    });
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.companyName.replace(/\s+/g, '_')}_COMPLETE_PROFILE.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: COLORS.gray.bg}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor: COLORS.purple.primary}}></div>
          <p className="mt-4" style={{color: COLORS.gray.medium}}>Loading complete profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: COLORS.gray.bg}}>
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{color: COLORS.purple.primary}}><Icons.Building /></div>
            <h1 className="text-2xl font-bold" style={{color: COLORS.gray.dark}}>Complete Company Profile - Every Question</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border-2 rounded-lg hover:shadow-md" style={{borderColor: COLORS.gray.light, color: COLORS.gray.dark}}>
              <Icons.Print /> Print
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:shadow-lg" style={{backgroundColor: COLORS.purple.primary}}>
              <Icons.Download /> Download
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-xl shadow-lg p-8 mb-8 text-white" style={{background: `linear-gradient(135deg, ${COLORS.purple.primary} 0%, ${COLORS.purple.light} 100%)`}}>
          <h2 className="text-3xl font-bold mb-2">{profile.companyName}</h2>
          <p className="text-purple-100 text-lg">Best Companies for Working with Cancer - Complete Assessment</p>
          {profile.email && <p className="text-purple-100 text-sm mt-2">Contact: {profile.email}</p>}
          <p className="text-purple-100 text-sm mt-1">Generated: {new Date().toLocaleString()}</p>
        </div>

        {Object.entries(profile.allData).map(([sectionKey, sectionData]) => {
          if (!sectionData || Object.keys(sectionData).length === 0) return null;
          
          return (
            <ProfileSection key={sectionKey} title={sectionKey.toUpperCase().replace(/-/g, ' ')} color={COLORS.purple}>
              <div className="space-y-2">
                {Object.entries(sectionData).map(([questionKey, answer]) => {
                  // Check if we have a mapped question
                  const mappedQuestion = QUESTIONS[questionKey];
                  if (mappedQuestion) {
                    return <QuestionItem key={questionKey} qid={questionKey} question={mappedQuestion} answer={answer} />;
                  }
                  
                  // Show all data regardless
                  if (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0)) return null;
                  
                  const displayAnswer = Array.isArray(answer) ? answer.join(', ') : String(answer);
                  
                  return (
                    <div key={questionKey} className="mb-4 pb-4 border-b" style={{borderColor: COLORS.gray.light}}>
                      <div className="flex gap-3">
                        <div className="font-mono text-sm font-bold px-2 py-1 rounded" style={{backgroundColor: COLORS.teal.bg, color: COLORS.teal.primary, minWidth: '120px'}}>
                          {questionKey}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold" style={{color: COLORS.gray.dark}}>{displayAnswer}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ProfileSection>
          );
        })}

        <div className="mt-8 text-center text-sm" style={{color: COLORS.gray.medium}}>
          <p>Complete Survey Data - Every Question & Answer</p>
          <p className="mt-1">© {new Date().getFullYear()} Cancer and Careers & CEW Foundation</p>
        </div>
      </div>
    </div>
  );
}
