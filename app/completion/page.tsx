// app/completion/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Award, Calendar, Mail } from 'lucide-react';

export default function CompletionPage() {
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    contactName: ''
  });

  useEffect(() => {
    const company = localStorage.getItem('auth_company_name') || 'Your Organization';
    const email = localStorage.getItem('auth_email') || '';
    const contactName = localStorage.getItem('auth_contact_name') || '';
    
    setCompanyData({ name: company, email, contactName });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Assessment Complete!
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Thank you for completing the Best Companies for Working with Cancer assessment
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-8 pb-8 border-b border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {companyData.name}
              </h2>
              <p className="text-gray-600">
                Assessment submitted on {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">What Happens Next</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Assessment Review</p>
                  <p className="text-sm text-gray-700">
                    Our team at Cancer and Careers will carefully review your responses and calculate your organization's support score across all dimensions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Personalized Follow-Up</p>
                  <p className="text-sm text-gray-700">
                    A member of our team will reach out to <strong>{companyData.contactName}</strong> at <strong>{companyData.email}</strong> within the next <strong>5-7 business days</strong> to discuss your results, provide insights, and outline next steps.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Award className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Certification Determination</p>
                  <p className="text-sm text-gray-700">
                    Based on your assessment, we'll provide guidance on your organization's readiness for Best Companies for Working with Cancer certification and share recommendations for strengthening your support programs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Confirmation Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Organization:</span>
                <span className="font-semibold text-gray-900">{companyData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contact:</span>
                <span className="font-semibold text-gray-900">{companyData.contactName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold text-gray-900">{companyData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submission Date:</span>
                <span className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Confirmation Email Sent
                </p>
                <p className="text-sm text-blue-800">
                  A confirmation email has been sent to {companyData.email} with details about your submission and next steps. Please check your inbox (and spam folder) for this message.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Thank you for your commitment to supporting employees through cancer and serious health conditions.
          </p>
          <p className="text-sm text-gray-500">
            Questions in the meantime? Contact us at{' '}
            <a href="mailto:support@cancerandcareers.org" className="text-blue-600 hover:underline font-semibold">
              support@cancerandcareers.org
            </a>
          </p>
        </div>

        {/* Cancer and Careers Branding */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Best Companies for Working with Cancer
          </p>
          <p className="text-xs text-gray-400">
            A program of Cancer and Careers / CEW Foundation
          </p>
        </div>
      </div>
    </div>
  );
}
