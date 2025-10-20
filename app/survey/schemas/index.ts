import { firmographicsSchema } from './firmographics'
import { generalBenefitsSchema } from './general-benefits'
import { currentSupportSchema } from './current-support'
import { d1Schema } from './dimensions/d1-medical-leave'
import { d2Schema } from './dimensions/d2-insurance'
// ... import all dimension schemas
import { crossDimensionalSchema } from './cross-dimensional'
import { employeeImpactSchema } from './employee-impact'

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
        // ... all 13 dimensions
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
