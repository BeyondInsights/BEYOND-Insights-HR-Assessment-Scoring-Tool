import { firmographicsSchema } from './firmographics'
import { generalBenefitsSchema } from './general-benefits'
import { currentSupportSchema } from './current-support'
import { d1Schema } from './dimensions/d1-medical-leave'
import { d2Schema } from './dimensions/d2-insurance'
import { d3Schema } from './dimensions/d3-manager'
import { d4Schema } from './dimensions/d4-navigation'
import { d5Schema } from './dimensions/d5-accommodations'
import { d6Schema } from './dimensions/d6-culture'
import { d7Schema } from './dimensions/d7-career'
import { d8Schema } from './dimensions/d8-work-continuation'
import { d9Schema } from './dimensions/d9-executive'
import { d10Schema } from './dimensions/d10-caregiver'
import { d11Schema } from './dimensions/d11-prevention'
import { d12Schema } from './dimensions/d12-continuous'
import { d13Schema } from './dimensions/d13-communication'
import { crossDimensionalSchema } from './cross-dimensional'
import { employeeImpactSchema } from './employee-impact'

// Export all schemas individually
export {
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
}

export const surveySchema = {
  sections: [
    {
      id: 'firmographics',
      title: 'Company & Contact Information',
      schema: firmographicsSchema
    },
    {
      id: 'general-benefits',
      title: 'General Employee Benefits',
      schema: generalBenefitsSchema
    },
    {
      id: 'current-support',
      title: 'Current Support for Serious Medical Conditions',
      schema: currentSupportSchema
    },
    {
      id: 'dimensions',
      title: '13 Dimensions of Support',
      subsections: [
        { id: 'd1', title: 'Medical Leave & Flexibility', schema: d1Schema },
        { id: 'd2', title: 'Insurance & Financial Protection', schema: d2Schema },
        { id: 'd3', title: 'Manager Preparedness & Capability', schema: d3Schema },
        { id: 'd4', title: 'Navigation & Expert Resources', schema: d4Schema },
        { id: 'd5', title: 'Workplace Accommodations', schema: d5Schema },
        { id: 'd6', title: 'Culture & Psychological Safety', schema: d6Schema },
        { id: 'd7', title: 'Career Continuity & Advancement', schema: d7Schema },
        { id: 'd8', title: 'Work Continuation & Resumption', schema: d8Schema },
        { id: 'd9', title: 'Executive Commitment & Resources', schema: d9Schema },
        { id: 'd10', title: 'Caregiver & Family Support', schema: d10Schema },
        { id: 'd11', title: 'Prevention, Wellness & Legal Compliance', schema: d11Schema },
        { id: 'd12', title: 'Continuous Improvement & Outcomes', schema: d12Schema },
        { id: 'd13', title: 'Communication & Awareness', schema: d13Schema }
      ]
    },
    {
      id: 'cross-dimensional',
      title: 'Cross-Dimensional Assessment',
      schema: crossDimensionalSchema
    },
    {
      id: 'employee-impact',
      title: 'Employee Impact & ROI',
      schema: employeeImpactSchema
    }
  ]
}

// Helper function to generate the print view
export function generatePrintSchema() {
  const output = []
  
  surveySchema.sections.forEach(section => {
    output.push({
      title: section.title,
      questions: Object.entries(section.schema || {}).map(([key, field]) => ({
        id: key,
        ...field
      }))
    })
    
    if (section.subsections) {
      section.subsections.forEach(sub => {
        output.push({
          title: `${section.title}: ${sub.title}`,
          questions: Object.entries(sub.schema).map(([key, field]) => ({
            id: key,
            ...field
          }))
        })
      })
    }
  })
  
  return output
}
