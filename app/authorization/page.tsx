// app/authorization/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthorizationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactTitle: '',
    contactEmail: '',
    applicationId: ''
  });
  const [errors, setErrors] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.companyName.trim()) {
      setErrors('Please enter your company name');
      return;
    }
    if (!formData.contactName.trim()) {
      setErrors('Please enter contact name');
      return;
    }
    if (!formData.contactTitle.trim()) {
      setErrors('Please enter contact title');
      return;
    }
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) {
      setErrors('Please enter a valid email address');
      return;
    }
    if (!formData.applicationId.trim()) {
      setErrors('Please enter your Application ID from CAC');
      return;
    }

    // Store in localStorage
    localStorage.setItem('auth_company_name', formData.companyName);
    localStorage.setItem('auth_contact_name', formData.contactName);
    localStorage.setItem('auth_contact_title', formData.contactTitle);
    localStorage.setItem('auth_email', formData.contactEmail);
    localStorage.setItem('auth_application_id', formData.applicationId);
    localStorage.setItem('auth_completed', 'true');

    // Check if payment is completed
    const paymentCompleted = localStorage.getItem('payment_completed') === 'true';
    
    if (paymentCompleted) {
      // If already paid, go to dashboard
      router.push('/dashboard');
    } else {
      // If not paid, go to certification/payment page
      router.push('/certification');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Best Companies for Working with Cancer
          </h1>
          <p className="text-lg text-gray-600">
            Employer Certification Application
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Your Assessment
            </h2>
            <p className="text-gray-600">
              Please provide your organization details to begin
            </p>
          </div>

          {errors && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter your company name"
              />
            </div>

            {/* Point of Contact Section */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Point of Contact
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter contact name"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactTitle: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., Director of HR, Benefits Manager"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="email@company.com"
                  />
                </div>
              </div>
            </div>

            {/* Application ID */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Application ID from CAC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.applicationId}
                onChange={(e) => setFormData(prev => ({ ...prev, applicationId: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                placeholder="e.g., CAC-2025-001234"
              />
              <p className="text-xs text-gray-500 mt-2">
                This unique ID was provided by Cancer and Careers in your invitation
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all"
            >
              Continue to Application
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your progress will be saved automatically throughout the assessment. You can complete sections in any order and return at any time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Questions? Contact us at{' '}
          <a href="mailto:support@cancerandcareers.org" className="text-blue-600 hover:underline">
            support@cancerandcareers.org
          </a>
        </p>
      </div>
    </div>
  );
}
