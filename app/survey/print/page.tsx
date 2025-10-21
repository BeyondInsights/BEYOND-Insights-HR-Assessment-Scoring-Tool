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
            {field.maxLength && (
              <div className="helper-text">Maximum {field.maxLength} characters</div>
            )}
            <div className="response-box">
              <div className="response-line"></div>
              <div className="response-line"></div>
              {field.type === 'textarea' && (
                <>
                  <div className="response-line"></div>
                  <div className="response-line"></div>
                </>
              )}
            </div>
            {field.hasNone && (
              <label className="checkbox-inline">
                <input type="checkbox" />
                <span>No additional information</span>
              </label>
            )}
          </div>
        )

      case 'select':
        return (
          <div className="question-block">
            <label className="question-label">{field.label}</label>
            <div className="instruction">(Select ONE)</div>
            <div className={shouldUseTwoColumns ? 'options-grid two-col' : 'options-list'}>
              {field.options?.map((opt: string, i: number) => (
                <label key={i} className="option-item">
                  <input type="radio" name={fieldKey} />
                  <span>{opt}</span>
                </label>
              ))}
              {field.hasOther && (
                <label className="option-item">
                  <input type="radio" name={fieldKey} />
                  <span>Other: <span className="write-in">_________________</span></span>
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
                        <label key={i} className="option-item">
                          <input type="checkbox" />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={shouldUseTwoColumns ? 'options-grid two-col' : 'options-list'}>
                {field.options?.map((opt: string, i: number) => (
                  <label key={i} className="option-item">
                    <input type="checkbox" />
                    <span>{opt}</span>
                  </label>
                ))}
                {field.hasOther && (
                  <label className="option-item">
                    <input type="checkbox" />
                    <span>Other: <span className="write-in">_________________</span></span>
                  </label>
                )}
              </div>
            )}
          </div>
        )

      case 'grid':
        return (
          <div className="question-block grid-block">
            <label className="question-label">{field.label}</label>
            <div className="instruction">(Select ONE for each row)</div>
            <div className="table-container">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th className="row-header-cell">{field.programs ? 'Program' : 'Item'}</th>
                    {(field.statusOptions || field.responseOptions)?.map((opt: string) => (
                      <th key={opt} className="col-header-cell">{opt}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(field.programs || field.items)?.map((item: string, idx: number) => (
                    <tr key={idx}>
                      <td className="row-label-cell">{item}</td>
                      {(field.statusOptions || field.responseOptions)?.map((opt: string) => (
                        <td key={opt} className="radio-cell">
                          <input type="radio" name={`grid-${fieldKey}-${idx}`} />
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
      <div className="print-only print-header">
        <div className="print-logo-container">
          <img src="/best-companies-2026-logo.png" alt="Best Companies" className="print-logo" />
        </div>
        <h1 className="print-title">Best Companies for Working with Cancer</h1>
        <p className="print-subtitle">2026 Employer Index Survey</p>
        <p className="print-meta">{companyName} • {currentDate}</p>
      </div>

      <main className="main-container">
        {/* Action Bar - Screen Only */}
        <div className="action-bar screen-only">
          <div className="action-header">
            <div>
              <h1 className="page-title">Survey Print Preview</h1>
              <p className="page-subtitle">Review and download the complete survey questionnaire</p>
            </div>
            <div className="action-buttons-top">
              <button onClick={expandAll} className="btn-outline-sm">Expand All</button>
              <button onClick={collapseAll} className="btn-outline-sm">Collapse All</button>
            </div>
          </div>
          
          <div className="download-info-box">
            <div className="info-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="info-title">How to Download as PDF</div>
              <p className="info-text">
                Click "Download PDF" to open your browser's print dialog. Select "Save as PDF" as the destination 
                to save the complete survey. All sections will be automatically expanded for printing.
              </p>
            </div>
          </div>
          
          <div className="primary-action-buttons">
            <button onClick={handlePrint} className="btn-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>Download Full Survey PDF</span>
            </button>
            
            <button onClick={handlePrint} className="btn-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print to Printer</span>
            </button>
            
            <button onClick={() => window.location.href = '/dashboard'} className="btn-outline">
              <span>← Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Survey Sections */}
        <div className="sections-wrapper">
          {/* Section 1: Firmographics */}
          <div className="survey-section">
            <button
              onClick={() => toggleSection('firmographics')}
              className="section-header screen-only"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.firmographics.from} 0%, ${SECTION_COLORS.firmographics.to} 100%)` }}
            >
              <div className="section-header-content">
                <div className="section-number">1</div>
                <span className="section-title">Company & Contact Information</span>
              </div>
              <svg className={`chevron ${expandedSections['firmographics'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.firmographics.from} 0%, ${SECTION_COLORS.firmographics.to} 100%)` }}>
              <div className="section-header-content">
                <div className="section-number">1</div>
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
                <div className="section-number">2</div>
                <span className="section-title">General Employee Benefits</span>
              </div>
              <svg className={`chevron ${expandedSections['general'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.general.from} 0%, ${SECTION_COLORS.general.to} 100%)` }}>
              <div className="section-header-content">
                <div className="section-number">2</div>
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
                <div className="section-number">3</div>
                <span className="section-title">Current Support for Serious Medical Conditions</span>
              </div>
              <svg className={`chevron ${expandedSections['current'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.current.from} 0%, ${SECTION_COLORS.current.to} 100%)` }}>
              <div className="section-header-content">
                <div className="section-number">3</div>
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
              <div className="divider-number">4</div>
              <h2 className="divider-title">13 Dimensions of Support</h2>
            </div>
          </div>

          {/* 13 Dimensions */}
          {ALL_DIMENSION_SCHEMAS.map((schema, idx) => (
            <div key={idx} className="survey-section dimension-section">
              <button
                onClick={() => toggleSection(`dim-${idx}`)}
                className="section-header screen-only"
                style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.dimensions.from} 0%, ${SECTION_COLORS.dimensions.to} 100%)` }}
              >
                <div className="section-header-content">
                  <div className="section-number">{idx + 1}</div>
                  <span className="section-title">{DIMENSION_TITLES[idx + 1]}</span>
                </div>
                <svg className={`chevron ${expandedSections[`dim-${idx}`] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="section-header print-only" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.dimensions.from} 0%, ${SECTION_COLORS.dimensions.to} 100%)` }}>
                <div className="section-header-content">
                  <div className="section-number">{idx + 1}</div>
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
                <div className="section-number">5</div>
                <span className="section-title">Cross-Dimensional Assessment</span>
              </div>
              <svg className={`chevron ${expandedSections['cross'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.cross.from} 0%, ${SECTION_COLORS.cross.to} 100%)` }}>
              <div className="section-header-content">
                <div className="section-number">5</div>
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
                <div className="section-number">6</div>
                <span className="section-title">Employee Impact & ROI Assessment</span>
              </div>
              <svg className={`chevron ${expandedSections['impact'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.impact.from} 0%, ${SECTION_COLORS.impact.to} 100%)` }}>
              <div className="section-header-content">
                <div className="section-number">6</div>
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
        /* ==================== BASE & LAYOUT ==================== */
        .survey-preview-wrapper {
          min-height: 100vh;
          background: linear-gradient(to bottom, #f9fafb 0%, #ffffff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
        }

        .screen-only { display: block; }
        .print-only { display: none; }

        .main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem 3rem;
        }

        /* ==================== ACTION BAR ==================== */
        .action-bar {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          padding: 2rem;
          margin: 2rem 0;
          border: 1px solid #e5e7eb;
        }

        .action-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 2rem;
        }

        .page-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.025em;
        }

        .page-subtitle {
          color: #6b7280;
          font-size: 0.938rem;
          margin: 0;
        }

        .action-buttons-top {
          display: flex;
          gap: 0.5rem;
        }

        .btn-outline-sm {
          padding: 0.5rem 1rem;
          background: white;
          color: #374151;
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-outline-sm:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .download-info-box {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          display: flex;
          gap: 1rem;
        }

        .info-icon {
          flex-shrink: 0;
          width: 2.5rem;
          height: 2.5rem;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
        }

        .info-title {
          font-weight: 600;
          color: #1e40af;
          font-size: 0.938rem;
          margin-bottom: 0.375rem;
        }

        .info-text {
          color: #1e40af;
          font-size: 0.813rem;
          line-height: 1.5;
          margin: 0;
        }

        .primary-action-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .btn-primary {
          flex: 1;
          min-width: 200px;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.938rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.15);
          transform: translateY(-1px);
        }

        .btn-secondary {
          padding: 0.875rem 1.5rem;
          background: white;
          color: #374151;
          border: 2px solid #d1d5db;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.938rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-outline {
          padding: 0.875rem 1.5rem;
          background: white;
          color: #374151;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          font-weight: 500;
          font-size: 0.938rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-outline:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        /* ==================== SECTIONS ==================== */
        .sections-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .survey-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .section-header {
          width: 100%;
          padding: 1.25rem 1.5rem;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          transition: opacity 0.15s ease;
        }

        .screen-only.section-header:hover {
          opacity: 0.95;
        }

        .section-header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .section-number {
          width: 2rem;
          height: 2rem;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.938rem;
          flex-shrink: 0;
        }

        .section-title {
          font-size: 1.063rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .chevron {
          width: 1.25rem;
          height: 1.25rem;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .chevron.expanded {
          transform: rotate(180deg);
        }

        .section-content {
          padding: 2rem;
          background: #fafafa;
        }

        .section-divider {
          margin: 2rem 0 1rem;
        }

        .divider-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 10px;
          border-left: 4px solid #2563eb;
        }

        .divider-number {
          width: 2.5rem;
          height: 2.5rem;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          color: #2563eb;
          flex-shrink: 0;
        }

        .divider-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
          letter-spacing: -0.025em;
        }

        /* ==================== QUESTIONS ==================== */
        .question-block {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .question-block:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .question-label {
          display: block;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.625rem;
          font-size: 0.938rem;
          line-height: 1.5;
        }

        .instruction {
          font-size: 0.813rem;
          color: #6b7280;
          font-style: italic;
          margin-bottom: 0.875rem;
        }

        .helper-text {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 0.625rem;
        }

        /* ==================== RESPONSE BOXES ==================== */
        .response-box {
          background: white;
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          padding: 1rem;
        }

        .response-line {
          height: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 0.75rem;
        }

        .response-line:last-child {
          margin-bottom: 0;
        }

        /* ==================== OPTIONS ==================== */
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .options-grid {
          display: grid;
          gap: 0.625rem;
        }

        .options-grid.two-col {
          grid-template-columns: repeat(2, 1fr);
        }

        .option-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .option-item:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .option-item input {
          margin-top: 0.125rem;
          flex-shrink: 0;
        }

        .option-item span {
          flex: 1;
          color: #374151;
        }

        .write-in {
          display: inline-block;
          min-width: 150px;
          border-bottom: 1px solid #d1d5db;
        }

        .checkbox-inline {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-top: 0.875rem;
          font-size: 0.875rem;
          color: #6b7280;
          cursor: pointer;
        }

        /* ==================== CATEGORIZED OPTIONS ==================== */
        .categorized-options {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .category-group {
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 1.25rem;
        }

        .category-header {
          font-weight: 700;
          font-size: 0.813rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #2563eb;
          background: #eff6ff;
          padding: 0.5rem 0.875rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        /* ==================== GRID TABLES ==================== */
        .grid-block {
          overflow-x: auto;
        }

        .table-container {
          overflow-x: auto;
          margin-top: 0.875rem;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
        }

        .grid-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          background: white;
        }

        .grid-table thead {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .grid-table th {
          color: white;
          font-weight: 600;
          padding: 0.875rem;
          text-align: left;
          border: none;
          font-size: 0.813rem;
        }

        .row-header-cell {
          text-align: left !important;
          min-width: 200px;
        }

        .col-header-cell {
          text-align: center !important;
          min-width: 120px;
        }

        .grid-table td {
          padding: 0.875rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .grid-table tbody tr:last-child td {
          border-bottom: none;
        }

        .grid-table tbody tr:nth-child(even) {
          background: #fafafa;
        }

        .row-label-cell {
          font-weight: 500;
          color: #374151;
        }

        .radio-cell {
          text-align: center;
        }

        /* ==================== PRINT STYLES ==================== */
        @media print {
          .screen-only { display: none !important; }
          .print-only { display: block !important; }

          .survey-preview-wrapper {
            background: white;
          }

          .print-header {
            text-align: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e5e7eb;
          }

          .print-logo-container {
            margin-bottom: 0.75rem;
          }

          .print-logo {
            height: 3rem;
          }

          .print-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #111827;
            margin: 0 0 0.25rem 0;
          }

          .print-subtitle {
            font-size: 1rem;
            color: #6b7280;
            margin: 0 0 0.5rem 0;
          }

          .print-meta {
            font-size: 0.813rem;
            color: #9ca3af;
            margin: 0;
          }

          .main-container {
            padding: 0;
            max-width: 100%;
          }

          .sections-wrapper {
            gap: 0.75rem;
          }

          .survey-section {
            box-shadow: none;
            border: 1px solid #d1d5db;
            page-break-inside: avoid;
            margin-bottom: 0.5rem;
          }

          .section-content {
            padding: 1.25rem;
            background: white;
          }

          .question-block {
            margin-bottom: 1.25rem;
            padding-bottom: 1.25rem;
          }

          .question-label {
            font-size: 0.875rem;
          }

          .instruction {
            font-size: 0.75rem;
          }

          .options-grid.two-col {
            gap: 0.375rem;
          }

          .option-item {
            padding: 0.5rem;
            font-size: 0.813rem;
          }

          .grid-table {
            font-size: 0.75rem;
          }

          .grid-table th,
          .grid-table td {
            padding: 0.5rem;
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
            gap: 1rem;
          }

          .action-buttons-top {
            width: 100%;
            justify-content: flex-end;
          }

          .primary-action-buttons {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary,
          .btn-outline {
            width: 100%;
          }

          .options-grid.two-col {
            grid-template-columns: 1fr;
          }

          .section-title {
            font-size: 0.938rem;
          }
        }
      `}</style>
    </div>
  )
}
