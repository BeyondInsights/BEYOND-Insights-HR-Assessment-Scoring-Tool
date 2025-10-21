'use client'

import React, { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  firmographicsSchema,
  generalBenefitsSchema,
  currentSupportSchema,
  d1Schema,
  d2Schema,
  d3Schema,
  d4Schema,
  d5Schema,
  d6Schema,
  d7Schema,
  d8Schema,
  d9Schema,
  d10Schema,
  d11Schema,
  d12Schema,
  d13Schema,
  crossDimensionalSchema,
  employeeImpactSchema
} from '../schemas'

const DIMENSION_TITLES = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness'
}

const SECTION_COLORS = {
  firmographics: { from: '#9333ea', to: '#7e22ce', text: 'purple' },
  general: { from: '#4f46e5', to: '#4338ca', text: 'indigo' },
  current: { from: '#ec4899', to: '#db2777', text: 'pink' },
  dimensions: { from: '#2563eb', to: '#1d4ed8', text: 'blue' },
  cross: { from: '#059669', to: '#047857', text: 'green' },
  impact: { from: '#ea580c', to: '#c2410c', text: 'orange' }
}

const ALL_DIMENSION_SCHEMAS = [
  d1Schema, d2Schema, d3Schema, d4Schema, d5Schema, d6Schema,
  d7Schema, d8Schema, d9Schema, d10Schema, d11Schema, d12Schema, d13Schema
]

export default function PrintSurveyPage() {
  const [companyName, setCompanyName] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const name = localStorage.getItem('login_company_name') || 
                 localStorage.getItem('companyName') || 
                 'Your Organization'
    setCompanyName(name)
    
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
  }, [])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {}
    ALL_DIMENSION_SCHEMAS.forEach((_, idx) => {
      allExpanded[`dim-${idx}`] = true
    })
    allExpanded['firmographics'] = true
    allExpanded['general'] = true
    allExpanded['current'] = true
    allExpanded['cross'] = true
    allExpanded['impact'] = true
    setExpandedSections(allExpanded)
  }

  const collapseAll = () => {
    setExpandedSections({})
  }

  const handlePrint = () => {
    expandAll()
    setTimeout(() => window.print(), 100)
  }

  const renderField = (fieldKey: string, field: any) => {
    if (!field) return null

    const shouldUseTwoColumns = (field.options?.length || 0) >= 6

    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <div className="question-block">
            <label className="question-label">{field.label}</label>
            {field.required && <span className="required-marker">*</span>}
            {field.maxLength && (
              <div className="helper-text">Maximum {field.maxLength} characters</div>
            )}
            <div className="input-container">
              {field.type === 'textarea' ? (
                <textarea className="form-textarea" rows={4} placeholder="Enter your response..." />
              ) : (
                <input type="text" className="form-input" placeholder="Enter your response..." />
              )}
            </div>
            {field.hasNone && (
              <label className="checkbox-option">
                <input type="checkbox" className="form-checkbox" />
                <span>No additional information</span>
              </label>
            )}
          </div>
        )

      case 'select':
        return (
          <div className="question-block">
            <label className="question-label">{field.label}</label>
            {field.required && <span className="required-marker">*</span>}
            <div className="instruction">(Select ONE)</div>
            <div className={shouldUseTwoColumns ? 'options-grid two-col' : 'options-list'}>
              {field.options?.map((opt: string, i: number) => (
                <label key={i} className="option-card">
                  <input type="radio" name={fieldKey} className="form-radio" />
                  <span className="option-text">{opt}</span>
                </label>
              ))}
              {field.hasOther && (
                <label className="option-card">
                  <input type="radio" name={fieldKey} className="form-radio" />
                  <span className="option-text">Other (please specify)</span>
                </label>
              )}
            </div>
          </div>
        )

      case 'multiselect':
        return (
          <div className="question-block">
            <label className="question-label">{field.label}</label>
            <div className="instruction">(Select ALL that apply)</div>
            {field.categories ? (
              <div className="categorized-options">
                {Object.entries(field.categories).map(([category, items]: [string, any]) => (
                  <div key={category} className="category-group">
                    <div className="category-header">{category}</div>
                    <div className="options-grid two-col">
                      {items.map((item: string, i: number) => (
                        <label key={i} className="option-card">
                          <input type="checkbox" className="form-checkbox" />
                          <span className="option-text">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={shouldUseTwoColumns ? 'options-grid two-col' : 'options-list'}>
                {field.options?.map((opt: string, i: number) => (
                  <label key={i} className="option-card">
                    <input type="checkbox" className="form-checkbox" />
                    <span className="option-text">{opt}</span>
                  </label>
                ))}
                {field.hasOther && (
                  <label className="option-card">
                    <input type="checkbox" className="form-checkbox" />
                    <span className="option-text">Other (please specify)</span>
                  </label>
                )}
              </div>
            )}
          </div>
        )

      case 'grid':
        return (
          <div className="question-block grid-question">
            <label className="question-label">{field.label}</label>
            <div className="instruction">(Select ONE for each row)</div>
            <div className="professional-table-container">
              <table className="professional-table">
                <thead>
                  <tr>
                    <th className="header-first">{field.programs ? 'Program' : 'Item'}</th>
                    {(field.statusOptions || field.responseOptions)?.map((opt: string) => (
                      <th key={opt} className="header-option">{opt}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(field.programs || field.items)?.map((item: string, idx: number) => (
                    <tr key={idx}>
                      <td className="row-label">{item}</td>
                      {(field.statusOptions || field.responseOptions)?.map((opt: string) => (
                        <td key={opt} className="radio-cell">
                          <input type="radio" name={`grid-${fieldKey}-${idx}`} className="form-radio" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="survey-preview-wrapper">
      <div className="screen-only">
        <Header />
      </div>

      {/* Print Header */}
      <div className="print-header print-only">
        <img src="/best-companies-2026-logo.png" alt="Best Companies" className="print-logo" />
        <h1 className="print-title">Best Companies for Working with Cancer</h1>
        <p className="print-subtitle">2026 Employer Index Survey</p>
        <p className="print-meta">{companyName} • {currentDate}</p>
      </div>

      <main className="main-container">
        {/* Professional Action Bar */}
        <div className="action-bar screen-only">
          <div className="action-bar-inner">
            <div className="action-header">
              <div className="action-title-group">
                <h1 className="page-title">Survey Print Preview</h1>
                <p className="page-subtitle">Complete 2026 employer assessment questionnaire</p>
              </div>
              <div className="action-buttons">
                <button onClick={expandAll} className="btn btn-secondary">
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Expand All
                </button>
                <button onClick={collapseAll} className="btn btn-secondary">
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Collapse All
                </button>
                <button onClick={handlePrint} className="btn btn-primary">
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
            
            <div className="info-panel">
              <div className="info-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="info-content">
                <h3 className="info-title">Download Instructions</h3>
                <p className="info-text">Click "Download PDF" to open the print dialog. Select "Save as PDF" as the destination to save the complete survey with all sections expanded.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Survey Sections */}
        <div className="sections-container">
          {/* Section 1: Firmographics */}
          <div className="survey-section">
            <button
              onClick={() => toggleSection('firmographics')}
              className="section-header screen-only"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.firmographics.from} 0%, ${SECTION_COLORS.firmographics.to} 100%)` }}
            >
              <div className="section-header-content">
                <div className="section-badge">1</div>
                <span className="section-title">Company & Contact Information</span>
              </div>
              <svg className={`section-chevron ${expandedSections['firmographics'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only gradient-purple">
              <div className="section-header-content">
                <div className="section-badge">1</div>
                <span className="section-title">Company & Contact Information</span>
              </div>
            </div>
            {(expandedSections['firmographics']) && (
              <div className="section-content">
                {Object.entries(firmographicsSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: General Benefits */}
          <div className="survey-section">
            <button
              onClick={() => toggleSection('general')}
              className="section-header screen-only"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.general.from} 0%, ${SECTION_COLORS.general.to} 100%)` }}
            >
              <div className="section-header-content">
                <div className="section-badge">2</div>
                <span className="section-title">General Employee Benefits</span>
              </div>
              <svg className={`section-chevron ${expandedSections['general'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only gradient-indigo">
              <div className="section-header-content">
                <div className="section-badge">2</div>
                <span className="section-title">General Employee Benefits</span>
              </div>
            </div>
            {(expandedSections['general']) && (
              <div className="section-content">
                {Object.entries(generalBenefitsSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Current Support */}
          <div className="survey-section">
            <button
              onClick={() => toggleSection('current')}
              className="section-header screen-only"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.current.from} 0%, ${SECTION_COLORS.current.to} 100%)` }}
            >
              <div className="section-header-content">
                <div className="section-badge">3</div>
                <span className="section-title">Current Support for Serious Medical Conditions</span>
              </div>
              <svg className={`section-chevron ${expandedSections['current'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only gradient-pink">
              <div className="section-header-content">
                <div className="section-badge">3</div>
                <span className="section-title">Current Support for Serious Medical Conditions</span>
              </div>
            </div>
            {(expandedSections['current']) && (
              <div className="section-content">
                {Object.entries(currentSupportSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4 Header */}
          <div className="section-divider">
            <div className="divider-content">
              <div className="divider-badge">4</div>
              <h2 className="divider-title">13 Dimensions of Support</h2>
            </div>
          </div>

          {/* 13 Dimensions */}
          {ALL_DIMENSION_SCHEMAS.map((schema, idx) => (
            <div key={idx} className="survey-section">
              <button
                onClick={() => toggleSection(`dim-${idx}`)}
                className="section-header screen-only"
                style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.dimensions.from} 0%, ${SECTION_COLORS.dimensions.to} 100%)` }}
              >
                <div className="section-header-content">
                  <div className="section-badge">{idx + 1}</div>
                  <span className="section-title">{DIMENSION_TITLES[idx + 1]}</span>
                </div>
                <svg className={`section-chevron ${expandedSections[`dim-${idx}`] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="section-header print-only gradient-blue">
                <div className="section-header-content">
                  <div className="section-badge">{idx + 1}</div>
                  <span className="section-title">{DIMENSION_TITLES[idx + 1]}</span>
                </div>
              </div>
              {(expandedSections[`dim-${idx}`]) && (
                <div className="section-content">
                  {Object.entries(schema).map(([key, field]) => (
                    <div key={key}>{renderField(key, field)}</div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Section 5: Cross-Dimensional */}
          <div className="survey-section">
            <button
              onClick={() => toggleSection('cross')}
              className="section-header screen-only"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.cross.from} 0%, ${SECTION_COLORS.cross.to} 100%)` }}
            >
              <div className="section-header-content">
                <div className="section-badge">5</div>
                <span className="section-title">Cross-Dimensional Assessment</span>
              </div>
              <svg className={`section-chevron ${expandedSections['cross'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only gradient-green">
              <div className="section-header-content">
                <div className="section-badge">5</div>
                <span className="section-title">Cross-Dimensional Assessment</span>
              </div>
            </div>
            {(expandedSections['cross']) && (
              <div className="section-content">
                {Object.entries(crossDimensionalSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Employee Impact */}
          <div className="survey-section">
            <button
              onClick={() => toggleSection('impact')}
              className="section-header screen-only"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.impact.from} 0%, ${SECTION_COLORS.impact.to} 100%)` }}
            >
              <div className="section-header-content">
                <div className="section-badge">6</div>
                <span className="section-title">Employee Impact & ROI Assessment</span>
              </div>
              <svg className={`section-chevron ${expandedSections['impact'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only gradient-orange">
              <div className="section-header-content">
                <div className="section-badge">6</div>
                <span className="section-title">Employee Impact & ROI Assessment</span>
              </div>
            </div>
            {(expandedSections['impact']) && (
              <div className="section-content">
                {Object.entries(employeeImpactSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="screen-only">
        <Footer />
      </div>

      <style jsx>{`
        /* ==================== BASE STYLES ==================== */
        .survey-preview-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .screen-only { display: block; }
        .print-only { display: none; }

        .main-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* ==================== ACTION BAR ==================== */
        .action-bar {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          margin-bottom: 3rem;
          overflow: hidden;
        }

        .action-bar-inner {
          padding: 2.5rem;
        }

        .action-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #1a202c;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.03em;
        }

        .page-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          margin: 0;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn {
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.938rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .btn .icon {
          width: 20px;
          height: 20px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: white;
          color: #475569;
          border: 2px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .info-panel {
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border-left: 4px solid #667eea;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
        }

        .info-icon {
          flex-shrink: 0;
        }

        .info-icon svg {
          width: 24px;
          height: 24px;
          color: #667eea;
        }

        .info-title {
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
          font-size: 0.938rem;
        }

        .info-text {
          color: #64748b;
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        /* ==================== SECTIONS ==================== */
        .sections-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .survey-section {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .survey-section:hover {
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
        }

        .section-header {
          width: 100%;
          padding: 1.75rem 2rem;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          transition: all 0.2s ease;
        }

        .section-header:hover {
          filter: brightness(1.05);
        }

        .section-header-content {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .section-badge {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .section-chevron {
          width: 24px;
          height: 24px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .section-chevron.expanded {
          transform: rotate(180deg);
        }

        .section-content {
          padding: 2.5rem;
          background: #fafbfc;
        }

        /* ==================== SECTION DIVIDER ==================== */
        .section-divider {
          margin: 2rem 0;
        }

        .divider-content {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
        }

        .divider-badge {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
          color: white;
        }

        .divider-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          letter-spacing: -0.02em;
        }

        /* ==================== QUESTIONS ==================== */
        .question-block {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 1.5rem;
          border: 1px solid #e5e7eb;
        }

        .question-block:last-child {
          margin-bottom: 0;
        }

        .question-label {
          display: block;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
          font-size: 0.938rem;
          line-height: 1.5;
        }

        .required-marker {
          color: #ef4444;
          margin-left: 0.25rem;
        }

        .instruction {
          font-size: 0.813rem;
          color: #64748b;
          font-style: italic;
          margin-bottom: 1rem;
        }

        .helper-text {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 0.5rem;
        }

        /* ==================== FORM ELEMENTS ==================== */
        .input-container {
          margin-top: 0.75rem;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.938rem;
          transition: all 0.2s ease;
          background: #f8fafc;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        /* ==================== OPTIONS ==================== */
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .options-grid {
          display: grid;
          gap: 0.75rem;
        }

        .options-grid.two-col {
          grid-template-columns: repeat(2, 1fr);
        }

        .option-card {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem 1.25rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .option-card:hover {
          background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%);
          border-color: #667eea;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .form-radio, .form-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .option-text {
          font-size: 0.875rem;
          color: #334155;
          line-height: 1.5;
        }

        .checkbox-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #64748b;
          cursor: pointer;
        }

        /* ==================== CATEGORIES ==================== */
        .categorized-options {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .category-group {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .category-header {
          font-weight: 700;
          font-size: 0.813rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #667eea;
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          padding: 0.625rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          border-left: 4px solid #667eea;
        }

        /* ==================== TABLES ==================== */
        .professional-table-container {
          overflow-x: auto;
          margin-top: 1rem;
          border-radius: 14px;
          border: 2px solid #e5e7eb;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .professional-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .professional-table thead {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        }

        .professional-table th {
          padding: 1.25rem 1rem;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          text-align: left;
          position: relative;
        }

        .header-first {
          min-width: 250px;
          font-weight: 700;
        }

        .header-option {
          text-align: center !important;
          min-width: 140px;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }

        .professional-table tbody tr {
          transition: background 0.2s ease;
        }

        .professional-table tbody tr:nth-child(even) {
          background: #fafbfc;
        }

        .professional-table tbody tr:hover {
          background: linear-gradient(135deg, #667eea05 0%, #764ba205 100%);
        }

        .professional-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .professional-table tbody tr:last-child td {
          border-bottom: none;
        }

        .row-label {
          font-weight: 500;
          color: #1e293b;
          background: #f8fafc;
          font-size: 0.875rem;
        }

        .radio-cell {
          text-align: center;
        }

        /* ==================== GRADIENT UTILITIES ==================== */
        .gradient-purple { background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%); }
        .gradient-indigo { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); }
        .gradient-pink { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
        .gradient-blue { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
        .gradient-green { background: linear-gradient(135deg, #059669 0%, #047857 100%); }
        .gradient-orange { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); }

        /* ==================== PRINT STYLES ==================== */
        .print-header {
          text-align: center;
          padding: 2rem 0 3rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .print-logo {
          height: 60px;
          margin-bottom: 1rem;
        }

        .print-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1a202c;
          margin: 0 0 0.5rem 0;
        }

        .print-subtitle {
          font-size: 1.25rem;
          color: #64748b;
          margin: 0 0 0.5rem 0;
        }

        .print-meta {
          font-size: 0.938rem;
          color: #94a3b8;
          margin: 0;
        }

        @media print {
          .screen-only { display: none !important; }
          .print-only { display: block !important; }

          .survey-preview-wrapper {
            background: white !important;
          }

          .main-container {
            max-width: 100%;
            padding: 0;
          }

          .sections-container {
            gap: 0.5rem;
          }

          .survey-section {
            box-shadow: none;
            border: 1px solid #d1d5db;
            page-break-inside: avoid;
            margin-bottom: 0.5rem;
          }

          .section-content {
            display: block !important;
            padding: 1.5rem;
            background: white;
          }

          .question-block {
            page-break-inside: avoid;
            padding: 1.25rem;
            margin-bottom: 1rem;
          }

          .professional-table-container {
            page-break-inside: avoid;
          }

          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          @page {
            size: letter;
            margin: 0.5in;
          }
        }

        /* ==================== RESPONSIVE ==================== */
        @media (max-width: 768px) {
          .action-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }

          .action-buttons {
            width: 100%;
            flex-direction: column;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }

          .options-grid.two-col {
            grid-template-columns: 1fr;
          }

          .professional-table {
            font-size: 0.75rem;
          }

          .header-option {
            min-width: 100px;
          }
        }
      `}</style>
    </div>
  )
}
