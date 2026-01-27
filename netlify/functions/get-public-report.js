// netlify/functions/get-public-report.js
// Loads FULL report data for authenticated public access with calculated scores

const { createClient } = require('@supabase/supabase-js');

// Scoring constants - match admin report exactly
const POINTS = { CURRENTLY_OFFER: 100, PLANNING: 50, ASSESSING: 25, NOT_ABLE: 0 };
const WEIGHTS = { 1: 15, 2: 10, 3: 12, 4: 13, 5: 8, 6: 8, 7: 5, 8: 12, 9: 3, 10: 5, 11: 3, 12: 3, 13: 3 };
const DIMENSION_NAMES = {
  1: 'Leave & Flexibility', 2: 'Insurance & Financial Support', 3: 'Manager Preparedness',
  4: 'Navigation & Resources', 5: 'Workplace Accommodations', 6: 'Culture & Stigma Reduction',
  7: 'Career Continuity', 8: 'Work Continuation During Treatment', 9: 'Executive Commitment',
  10: 'Caregiver Support', 11: 'Prevention & Wellness', 12: 'Continuous Improvement', 13: 'Communication'
};

function statusToPoints(status) {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: POINTS.CURRENTLY_OFFER, category: 'currently_offer' };
      case 3: return { points: POINTS.PLANNING, category: 'planning' };
      case 2: return { points: POINTS.ASSESSING, category: 'assessing' };
      case 1: return { points: POINTS.NOT_ABLE, category: 'not_able' };
      case 5: return { points: null, category: 'unsure' };
      default: return { points: null, category: 'unknown' };
    }
  }
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: POINTS.NOT_ABLE, category: 'not_able' };
    if (s.includes('unsure')) return { points: null, category: 'unsure' };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide')) return { points: POINTS.CURRENTLY_OFFER, category: 'currently_offer' };
    if (s.includes('planning') || s.includes('development')) return { points: POINTS.PLANNING, category: 'planning' };
    if (s.includes('assessing') || s.includes('feasibility')) return { points: POINTS.ASSESSING, category: 'assessing' };
    if (s.length > 0) return { points: POINTS.NOT_ABLE, category: 'not_able' };
  }
  return { points: null, category: 'unknown' };
}

function getTierInfo(score) {
  if (score >= 90) return { name: 'Exemplary', color: '#5B21B6' };
  if (score >= 75) return { name: 'Leading', color: '#047857' };
  if (score >= 60) return { name: 'Progressing', color: '#1D4ED8' };
  if (score >= 40) return { name: 'Emerging', color: '#B45309' };
  return { name: 'Developing', color: '#B91C1C' };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers: { 'Content-Type': 'application/json' } };
  }

  try {
    const { assessmentId, surveyId } = JSON.parse(event.body || '{}');
    if (!assessmentId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing assessmentId' }), headers: { 'Content-Type': 'application/json' } };
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Load assessment with all related data
    const { data: company, error: companyError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (companyError || !company) {
      console.error('Company not found:', companyError);
      return { statusCode: 404, body: JSON.stringify({ error: 'Assessment not found' }), headers: { 'Content-Type': 'application/json' } };
    }

    const actualSurveyId = surveyId || company.survey_id;

    // Load benchmarks
    const { data: benchmarks } = await supabase
      .from('benchmarks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Load element details for this survey
    const { data: elementDetails, error: elemError } = await supabase
      .from('element_details')
      .select('*')
      .eq('survey_id', actualSurveyId);

    console.log('Loaded element details:', elementDetails?.length || 0, 'for survey:', actualSurveyId);

    // Initialize dimension data structures
    const dimensionScores = {};
    const dimensionElements = {};
    
    for (let dim = 1; dim <= 13; dim++) {
      dimensionScores[dim] = 0;
      dimensionElements[dim] = { 
        name: DIMENSION_NAMES[dim],
        weight: WEIGHTS[dim],
        strengths: [], 
        planning: [], 
        assessing: [], 
        gaps: [], 
        unsure: [],
        total: 0, 
        earnedPoints: 0,
        maxPoints: 0 
      };
    }

    // Process element details to calculate scores
    if (elementDetails && elementDetails.length > 0) {
      elementDetails.forEach(el => {
        const dim = el.dimension_number || el.dim;
        if (!dim || dim < 1 || dim > 13) return;
        
        const result = statusToPoints(el.status);
        const maxPts = el.max_points || el.points || 100;
        const earnedPts = result.category === 'currently_offer' ? maxPts : 
                         result.category === 'planning' ? Math.round(maxPts * 0.5) :
                         result.category === 'assessing' ? Math.round(maxPts * 0.25) : 0;
        
        dimensionElements[dim].total++;
        dimensionElements[dim].maxPoints += maxPts;
        dimensionElements[dim].earnedPoints += earnedPts;
        
        const elData = {
          name: el.element_name || el.name || el.question || 'Unknown Element',
          earnedPoints: earnedPts,
          maxPoints: maxPts,
          status: el.status,
          statusText: result.category === 'currently_offer' ? 'Currently Offering' :
                      result.category === 'planning' ? 'In Planning' :
                      result.category === 'assessing' ? 'Assessing Feasibility' :
                      result.category === 'not_able' ? 'Not Currently Offered' : 'Unknown',
          category: result.category
        };
        
        if (result.category === 'currently_offer') {
          dimensionElements[dim].strengths.push(elData);
        } else if (result.category === 'planning') {
          dimensionElements[dim].planning.push(elData);
        } else if (result.category === 'assessing') {
          dimensionElements[dim].assessing.push(elData);
        } else if (result.category === 'not_able') {
          dimensionElements[dim].gaps.push(elData);
        } else {
          dimensionElements[dim].unsure.push(elData);
        }
      });
      
      // Calculate dimension scores as percentage
      for (let dim = 1; dim <= 13; dim++) {
        const el = dimensionElements[dim];
        if (el.maxPoints > 0) {
          dimensionScores[dim] = Math.round((el.earnedPoints / el.maxPoints) * 100);
        }
        dimensionElements[dim].score = dimensionScores[dim];
        dimensionElements[dim].tier = getTierInfo(dimensionScores[dim]);
      }
    }

    // Use stored composite_score if available, otherwise calculate weighted average
    let compositeScore = company.composite_score;
    if (!compositeScore || compositeScore === 0) {
      let weightedSum = 0;
      let totalWeight = 0;
      for (let dim = 1; dim <= 13; dim++) {
        weightedSum += dimensionScores[dim] * WEIGHTS[dim];
        totalWeight += WEIGHTS[dim];
      }
      compositeScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    }

    const tier = getTierInfo(compositeScore);

    // Calculate summary stats
    let totalElements = 0, strengthCount = 0, planningCount = 0, assessingCount = 0, gapCount = 0;
    for (let dim = 1; dim <= 13; dim++) {
      const el = dimensionElements[dim];
      totalElements += el.total;
      strengthCount += el.strengths.length;
      planningCount += el.planning.length;
      assessingCount += el.assessing.length;
      gapCount += el.gaps.length;
    }

    // Count dimensions by tier
    const tierCounts = { exemplary: 0, leading: 0, progressing: 0, emerging: 0, developing: 0 };
    for (let dim = 1; dim <= 13; dim++) {
      const score = dimensionScores[dim];
      if (score >= 90) tierCounts.exemplary++;
      else if (score >= 75) tierCounts.leading++;
      else if (score >= 60) tierCounts.progressing++;
      else if (score >= 40) tierCounts.emerging++;
      else tierCounts.developing++;
    }

    // Get report customizations if available
    let reportCustomizations = null;
    try {
      if (company.report_customizations) {
        reportCustomizations = typeof company.report_customizations === 'string' 
          ? JSON.parse(company.report_customizations) 
          : company.report_customizations;
      }
    } catch (e) { /* ignore parse errors */ }

    // Load all assessments for benchmarking (with sensitive fields stripped)
    const { data: allAssessmentsRaw } = await supabase
      .from('assessments')
      .select(`
        id, company_name, survey_id, is_founding_partner,
        firmographics_data, general_benefits_data, current_support_data,
        cross_dimensional_data, employee_impact_data,
        dimension1_data, dimension2_data, dimension3_data, dimension4_data,
        dimension5_data, dimension6_data, dimension7_data, dimension8_data,
        dimension9_data, dimension10_data, dimension11_data, dimension12_data, dimension13_data,
        dimension1_complete, dimension2_complete, dimension3_complete, dimension4_complete,
        dimension5_complete, dimension6_complete, dimension7_complete, dimension8_complete,
        dimension9_complete, dimension10_complete, dimension11_complete, dimension12_complete, dimension13_complete
      `);
    
    // Strip company-identifying info from benchmark data for privacy
    const allAssessments = (allAssessmentsRaw || []).map(a => ({
      ...a,
      company_name: undefined,  // Remove for privacy
      email: undefined,
      user_id: undefined,
    }));

    const companyName = company.firmographics_data?.company_name || company.company_name || 'Unknown Company';
    const contactName = company.firmographics_data?.primary_contact_name || '';
    const contactEmail = company.firmographics_data?.primary_contact_email || '';

    // Return BOTH the pre-calculated scores AND the raw assessment data
    // The raw data allows the client to calculate scores consistently with admin page
    return {
      statusCode: 200,
      body: JSON.stringify({
        // Raw assessment data for client-side scoring
        assessment: {
          ...company,
          public_password: undefined,  // NEVER return password
          public_token: undefined,     // Don't expose token
        },
        allAssessments,  // For benchmarking (anonymized)
        
        // Pre-calculated data (legacy support)
        company: {
          id: company.id,
          survey_id: actualSurveyId,
          company_name: companyName,
          contact_name: contactName,
          contact_email: contactEmail,
          created_at: company.created_at,
          firmographics_data: company.firmographics_data
        },
        compositeScore,
        tier,
        dimensionScores,
        dimensionElements,
        benchmarks: benchmarks || {},
        weights: WEIGHTS,
        dimensionNames: DIMENSION_NAMES,
        summary: {
          totalElements,
          strengthCount,
          planningCount,
          assessingCount,
          gapCount,
          tierCounts
        },
        reportCustomizations
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };

  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', details: err.message }), headers: { 'Content-Type': 'application/json' } };
  }
};
