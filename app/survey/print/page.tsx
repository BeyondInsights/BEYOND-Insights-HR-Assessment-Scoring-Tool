import React, { useEffect, useState } from 'react'

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

// Sample schemas for demo
const sampleSchema = {
  question1: {
    type: 'select',
    label: 'What is your organization\'s primary industry?',
    options: ['Technology', 'Healthcare', 'Financial Services', 'Manufacturing', 'Retail', 'Education', 'Other']
  },
  question2: {
    type: 'multiselect',
    label: 'Which benefits does your organization currently offer?',
    options: ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Disability Insurance', 'FSA/HSA', 'EAP', 'Wellness Programs', 'Mental Health Support', 'Paid Time Off', 'Sick Leave', 'Family Leave']
  },
  question3: {
    type: 'textarea',
    label: 'Please describe any additional support programs your organization offers',
    maxLength: 500,
    hasNone: true
  }
}

export default function OptimizedPrintSurvey() {
  const [companyName, setCompanyName] = useState('Sample Organization')
  const [currentDate, setCurrentDate] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
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
    Object.keys(DIMENSION_TITLES).forEach(dim => {
      allExpanded[`dim-${dim}`] = true
    })
    allExpanded['firmographics'] = true
    allExpanded['general'] = true
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

    // Determine if list should be 2-column (6+ options)
    const shouldUseTwoColumns = (field.options?.length || 0) >= 6

    switch (field.type) {
      case 'text':
        return (
          <div className="question-block">
            <div className="question-label">{field.label}</div>
            <div className="response-area short-response"></div>
          </div>
        )

      case 'textarea':
        return (
          <div className="question-block">
            <div className="question-label">{field.label}</div>
            {field.maxLength && (
              <div className="helper-text">(Maximum {field.maxLength} characters)</div>
            )}
            <div className="response-area long-response"></div>
            {field.hasNone && (
              <label className="checkbox-option">
                <input type="checkbox" />
                <span>No additional information</span>
              </label>
            )}
          </div>
        )

      case 'select':
        return (
          <div className="question-block">
            <div className="question-label">{field.label}</div>
            <div className="instruction-text">(Select ONE)</div>
            <div className={shouldUseTwoColumns ? 'options-grid two-column' : 'options-list'}>
              {field.options?.map((opt: string, i: number) => (
                <label key={i} className="radio-option">
                  <input type="radio" name={fieldKey} />
                  <span>{opt}</span>
                </label>
              ))}
              {field.hasOther && (
                <label className="radio-option">
                  <input type="radio" name={fieldKey} />
                  <span>Other: _______________</span>
                </label>
              )}
            </div>
          </div>
        )

      case 'multiselect':
        return (
          <div className="question-block">
            <div className="question-label">{field.label}</div>
            <div className="instruction-text">(Select ALL that apply)</div>
            <div className={shouldUseTwoColumns ? 'options-grid two-column' : 'options-list'}>
              {field.options?.map((opt: string, i: number) => (
                <label key={i} className="checkbox-option">
                  <input type="checkbox" />
                  <span>{opt}</span>
                </label>
              ))}
              {field.hasOther && (
                <label className="checkbox-option">
                  <input type="checkbox" />
                  <span>Other: _______________</span>
                </label>
              )}
            </div>
          </div>
        )

      case 'grid':
        return (
          <div className="question-block grid-question">
            <div className="question-label">{field.label}</div>
            <div className="instruction-text">(Select ONE for each row)</div>
            <div className="table-wrapper">
              <table className="response-grid-table">
                <thead>
                  <tr>
                    <th className="row-header">Item</th>
                    {field.statusOptions?.map((opt: string) => (
                      <th key={opt} className="col-header">{opt}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {field.items?.map((item: string, idx: number) => (
                    <tr key={idx}>
                      <td className="row-label">{item}</td>
                      {field.statusOptions?.map((opt: string) => (
                        <td key={opt} className="response-cell">
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
    <div className="print-survey-container">
      {/* Screen Header */}
      <header className="screen-only header-bar">
        <div className="header-content">
          <h1>Best Companies for Working with Cancer</h1>
          <p>2026 Employer Index Survey</p>
        </div>
      </header>

      {/* Print-only Header */}
      <div className="print-only print-header">
        <h1>Best Companies for Working with Cancer</h1>
        <p className="subtitle">2026 Employer Index Survey</p>
        <p className="meta">{companyName} • {currentDate}</p>
      </div>

      <main className="main-content">
        {/* Action Bar */}
        <div className="screen-only action-bar">
          <div className="action-header">
            <h2>Survey Print Preview</h2>
            <div className="button-group">
              <button onClick={expandAll} className="btn-secondary">Expand All</button>
              <button onClick={collapseAll} className="btn-secondary">Collapse All</button>
            </div>
          </div>
          
          <div className="primary-actions">
            <button onClick={handlePrint} className="btn-primary">
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Full Survey
            </button>
            <button onClick={() => alert('Back to Dashboard')} className="btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Survey Sections */}
        <div className="sections-container">
          {/* Sample Section 1 */}
          <div className="survey-section">
            <button
              onClick={() => toggleSection('firmographics')}
              className="section-header screen-only"
              style={{ backgroundColor: '#9333ea' }}
            >
              <span>Section 1: Company & Contact Information</span>
              <svg className={`chevron ${expandedSections['firmographics'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only" style={{ backgroundColor: '#9333ea' }}>
              <span>Section 1: Company & Contact Information</span>
            </div>
            {(expandedSections['firmographics']) && (
              <div className="section-content">
                {Object.entries(sampleSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Sample Section 2 */}
          <div className="survey-section">
            <button
              onClick={() => toggleSection('general')}
              className="section-header screen-only"
              style={{ backgroundColor: '#4f46e5' }}
            >
              <span>Section 2: General Employee Benefits</span>
              <svg className={`chevron ${expandedSections['general'] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="section-header print-only" style={{ backgroundColor: '#4f46e5' }}>
              <span>Section 2: General Employee Benefits</span>
            </div>
            {(expandedSections['general']) && (
              <div className="section-content">
                {Object.entries(sampleSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Dimension Samples */}
          {[1, 2].map((dimNum) => (
            <div key={dimNum} className="survey-section">
              <button
                onClick={() => toggleSection(`dim-${dimNum}`)}
                className="section-header screen-only"
                style={{ backgroundColor: '#2563eb' }}
              >
                <span>Dimension {dimNum}: {DIMENSION_TITLES[dimNum]}</span>
                <svg className={`chevron ${expandedSections[`dim-${dimNum}`] ? 'expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="section-header print-only" style={{ backgroundColor: '#2563eb' }}>
                <span>Dimension {dimNum}: {DIMENSION_TITLES[dimNum]}</span>
              </div>
              {(expandedSections[`dim-${dimNum}`]) && (
                <div className="section-content">
                  {Object.entries(sampleSchema).map(([key, field]) => (
                    <div key={key}>{renderField(key, field)}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <style jsx>{`
        /* ===== BASE STYLES ===== */
        .print-survey-container {
          min-height: 100vh;
          background: #f9fafb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .screen-only {
          display: block;
        }

        .print-only {
          display: none;
        }

        /* ===== HEADER ===== */
        .header-bar {
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .header-content p {
          color: #6b7280;
          margin: 0;
        }

        /* ===== ACTION BAR ===== */
        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem 3rem;
        }

        .action-bar {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .action-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .action-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
        }

        .primary-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-secondary {
          padding: 0.5rem 1rem;
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        /* ===== SECTIONS ===== */
        .sections-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .survey-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .section-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .screen-only.section-header:hover {
          opacity: 0.95;
        }

        .chevron {
          width: 1.25rem;
          height: 1.25rem;
          transition: transform 0.2s;
        }

        .chevron.expanded {
          transform: rotate(180deg);
        }

        .section-content {
          padding: 1.5rem;
        }

        /* ===== QUESTIONS ===== */
        .question-block {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .question-block:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .question-label {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .instruction-text {
          font-size: 0.813rem;
          color: #6b7280;
          margin-bottom: 0.75rem;
          font-style: italic;
        }

        .helper-text {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
        }

        /* ===== RESPONSE AREAS ===== */
        .response-area {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #f9fafb;
        }

        .short-response {
          height: 2.5rem;
        }

        .long-response {
          min-height: 4rem;
        }

        /* ===== OPTIONS LAYOUT ===== */
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .options-grid {
          display: grid;
          gap: 0.5rem;
        }

        .options-grid.two-column {
          grid-template-columns: repeat(2, 1fr);
        }

        .radio-option,
        .checkbox-option {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.15s;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .radio-option:hover,
        .checkbox-option:hover {
          background: #f3f4f6;
        }

        .radio-option input,
        .checkbox-option input {
          margin-top: 0.125rem;
          flex-shrink: 0;
        }

        .radio-option span,
        .checkbox-option span {
          flex: 1;
        }

        /* ===== GRID TABLES ===== */
        .grid-question {
          overflow-x: auto;
        }

        .table-wrapper {
          overflow-x: auto;
          margin-top: 0.75rem;
        }

        .response-grid-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .response-grid-table thead {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .response-grid-table th {
          color: white;
          font-weight: 600;
          padding: 0.75rem;
          text-align: left;
          border: 1px solid #1e40af;
          font-size: 0.813rem;
        }

        .response-grid-table .col-header {
          text-align: center;
          min-width: 90px;
        }

        .response-grid-table td {
          padding: 0.625rem;
          border: 1px solid #e5e7eb;
        }

        .response-grid-table tbody tr:nth-child(even) {
          background: #f9fafb;
        }

        .response-grid-table .row-label {
          font-weight: 500;
          color: #374151;
        }

        .response-grid-table .response-cell {
          text-align: center;
        }

        /* ===== PRINT STYLES ===== */
        @media print {
          .screen-only {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          .print-survey-container {
            background: white;
          }

          .print-header {
            text-align: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e5e7eb;
          }

          .print-header h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0 0 0.25rem 0;
          }

          .print-header .subtitle {
            font-size: 1rem;
            color: #6b7280;
            margin: 0 0 0.5rem 0;
          }

          .print-header .meta {
            font-size: 0.813rem;
            color: #9ca3af;
            margin: 0;
          }

          .main-content {
            padding: 0;
          }

          .sections-container {
            gap: 1rem;
          }

          .survey-section {
            box-shadow: none;
            border: 1px solid #e5e7eb;
            page-break-inside: avoid;
            margin-bottom: 0.75rem;
          }

          .section-content {
            padding: 1rem;
          }

          .question-block {
            margin-bottom: 1.25rem;
            padding-bottom: 1rem;
          }

          .question-label {
            font-size: 0.875rem;
          }

          .instruction-text {
            font-size: 0.75rem;
          }

          .options-grid.two-column {
            gap: 0.375rem;
          }

          .radio-option,
          .checkbox-option {
            padding: 0.25rem;
            font-size: 0.813rem;
          }

          .response-grid-table {
            font-size: 0.75rem;
          }

          .response-grid-table th,
          .response-grid-table td {
            padding: 0.375rem;
          }

          .response-grid-table .col-header {
            min-width: 70px;
            font-size: 0.7rem;
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

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .options-grid.two-column {
            grid-template-columns: 1fr;
          }

          .action-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .primary-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
