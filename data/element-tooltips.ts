/**
 * Clarification tooltips for dimension grid elements.
 * Key = exact element text from the D#A_ITEMS_BASE arrays.
 * Value = plain-language explanation shown on hover/click.
 */
const ELEMENT_TOOLTIPS: Record<string, string> = {
  // D1
  'Disability pay top-up (employer adds to disability insurance)':
    'Employer supplements your disability insurance payments to cover a larger percentage of lost income during treatment leave.',
  'Leave donation bank (employees can donate PTO to colleagues)':
    'A program where employees can voluntarily contribute unused paid time off to a shared pool that colleagues with serious health conditions can access.',

  // D2
  'Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance':
    'CAR-T, proton therapy, and immunotherapy are specialized cancer treatments that may not be covered by standard plans. This element asks whether your organization provides additional coverage for these.',
  'Accelerated life insurance benefits (partial payout for terminal / critical illness)':
    'Allows employees to receive a portion of their life insurance benefit while living, if diagnosed with a terminal or critical illness.',
  'Voluntary supplemental illness insurance (with employer contribution)':
    'Optional additional insurance coverage for serious illnesses where the employer helps pay the premium cost for enrolled employees.',
  'Employer-paid disability insurance supplements':
    'The employer funds additional disability coverage beyond what the standard plan provides.',

  // D3
  'AI-powered guidance tools':
    'Technology that uses artificial intelligence to provide managers with real-time recommendations for supporting employees with serious health conditions.',

  // D4
  'Survivorship planning assistance':
    'Professional guidance to help employees transition from active treatment to post-treatment life, addressing physical, emotional, and career concerns.',
  'Occupational therapy/vocational rehabilitation':
    'Specialists who help employees rebuild work skills, adapt to physical limitations, and explore job modifications after treatment.',

  // D5
  'Cognitive / fatigue support tools':
    'Software, apps, or resources that help with memory, focus, and energy management during and after treatment — sometimes called "chemo brain" support.',
  'Assistive technology catalog':
    'An inventory of available adaptive equipment or software that helps with work tasks, such as text-to-speech, ergonomic tools, or task management aids.',

  // D6
  'Clear process for confidential health disclosures':
    'A formal, private procedure for employees to share health information with HR while maintaining confidentiality protections.',
  'Stigma-reduction initiatives':
    'Programs designed to reduce fear and negative attitudes around serious health conditions in the workplace, such as awareness campaigns or leadership messaging.',

  // D8
  'Contingency planning for treatment schedules':
    'Advance planning to adjust work commitments if treatment timing or side effects unexpectedly change — ensuring coverage and reduced pressure on the employee.',
  'Access to specialized work resumption professionals':
    'Licensed professionals such as occupational therapists or vocational specialists who help employees safely and successfully return to work.',

  // D9
  'Executive accountability metrics':
    'Specific measurable targets tied to executive performance reviews regarding the effectiveness of serious illness support programs.',
  'Compensation tied to support outcomes':
    'Executive compensation (bonuses, reviews) directly linked to achievements in employee support program effectiveness.',
  'ESG/CSR reporting inclusion':
    'Including serious illness support initiatives in the organization\'s Environmental, Social, and Governance (ESG) or Corporate Social Responsibility (CSR) public reports.',

  // D10
  'Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)':
    'Provides caregiver leave beyond what laws require, recognizing support relationships that include extended family, close friends, and non-traditional family structures.',

  // D11
  'Targeted risk-reduction programs':
    'Focused initiatives to reduce health risks for specific employee groups — for example, enhanced screenings or lifestyle programs for higher-risk populations.',
  'Genetic screening/counseling':
    'Testing to identify inherited genetic risk factors for certain conditions, paired with professional counseling to explain results and options.',

  // D13
  'Manager toolkit for cascade communications':
    'Pre-written templates, talking points, and guidance materials to help managers discuss serious illness support programs with their teams.',
}

export default ELEMENT_TOOLTIPS
