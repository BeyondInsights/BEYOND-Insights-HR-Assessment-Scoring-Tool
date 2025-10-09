// app/certification/apply/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CertificationPayment from "@/components/CertificationPayment";
import { ArrowLeft } from "lucide-react";

export default function CertificationApplyPage() {
  const router = useRouter();
  const [companyData, setCompanyData] = useState({});
  const [assessmentScore, setAssessmentScore] = useState<number>(0);
  const [isEligible, setIsEligible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get data from localStorage
    const loadAssessmentData = () => {
      try {
        // Get company data
        const firmographicsData = localStorage.getItem('firmographics_data');
        if (firmographicsData) {
          const parsed = JSON.parse(firmographicsData);
          setCompanyData({
            name: parsed.companyName || 'Your Organization',
            contactName: parsed.contactName,
            email: localStorage.getItem('auth_email') || '',
            industry: parsed.industry,
            size: parsed.companySize
          });
        }

        // Calculate score from all sections
        let totalScore = 0;
        let sectionCount = 0;

        const sections = [
          'benefits_data',
          'leave_data', 
          'flexibility_data',
          'support_data',
          'culture_data',
          'caregivers_data'
        ];

        sections.forEach(section => {
          const data = localStorage.getItem(section);
          if (data) {
            const parsed = JSON.parse(data);
            // Calculate section score (simplified - adjust based on your scoring logic)
            const sectionScore = Object.values(parsed).filter(v => v === 'yes' || v === true).length * 10;
            totalScore += Math.min(sectionScore, 100);
            sectionCount++;
          }
        });

        const finalScore = sectionCount > 0 ? Math.round(totalScore / sectionCount) : 0;
        setAssessmentScore(85); // Fixed score for demo
        setIsEligible(true); // Always eligible for demo
        
      } catch (error) {
        console.error('Error loading assessment data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessmentData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certification application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Results
            </button>
            <div className="text-center">
              <h1 className="text-lg font-semibold">Certification Application</h1>
              <p className="text-sm text-gray-500">Best Companies for Working with Cancer</p>
            </div>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Assessment Complete</span>
              </div>
              <div className="w-16 h-0.5 bg-green-500 mx-4"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Certification Payment</span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <span className="ml-2 text-sm text-gray-500">Certification Awarded</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <CertificationPayment 
          companyData={companyData}
          score={assessmentScore}
          isEligible={isEligible}
        />
      </div>

      {/* Footer */}
      <div className="mt-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Cancer and Careers. All rights reserved.</p>
            <p className="mt-2">
              Questions? Contact us at{' '}
              <a href="mailto:certification@cancerandcareers.org" className="text-indigo-600 hover:text-indigo-700">
                certification@cancerandcareers.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
