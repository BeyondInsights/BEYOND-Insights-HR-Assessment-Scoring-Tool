const { createClient } = require('@supabase/supabase-js');
const PptxGenJS = require('pptxgenjs');

// ============================================
// CONSTANTS (must match report_page)
// ============================================

const DEFAULT_DIMENSION_WEIGHTS = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
};

const DEFAULT_COMPOSITE_WEIGHTS = { weightedDim: 90, maturity: 5, breadth: 5 };

const DEFAULT_BLEND_WEIGHTS = {
  d1: { grid: 85, followUp: 15 },
  d3: { grid: 85, followUp: 15 },
  d12: { grid: 85, followUp: 15 },
  d13: { grid: 85, followUp: 15 },
};

const DIMENSION_NAMES = {
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
  11: 'Prevention & Wellness',
  12: 'Continuous Improvement',
  13: 'Communication & Awareness',
};

const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };
const D10_EXCLUDED_ITEMS = ['Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'];

// ============================================
// SCORING FUNCTIONS
// ============================================

function statusToPoints(status) {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: POINTS.CURRENTLY_OFFER, isUnsure: false, category: 'currently_offer' };
      case 3: return { points: POINTS.PLANNING, isUnsure: false, category: 'planning' };
      case 2: return { points: POINTS.ASSESSING, isUnsure: false, category: 'assessing' };
      case 1: return { points: POINTS.NOT_ABLE, isUnsure: false, category: 'not_able' };
      case 5: return { points: null, isUnsure: true, category: 'unsure' };
      default: return { points: null, isUnsure: false, category: 'unknown' };
    }
  }
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: POINTS.NOT_ABLE, isUnsure: false, category: 'not_able' };
    if (s === 'unsure' || s.includes('unsure') || s.includes('unknown')) return { points: null, isUnsure: true, category: 'unsure' };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: POINTS.CURRENTLY_OFFER, isUnsure: false, category: 'currently_offer' };
    }
    if (s.includes('planning') || s.includes('development')) return { points: POINTS.PLANNING, isUnsure: false, category: 'planning' };
    if (s.includes('assessing') || s.includes('feasibility')) return { points: POINTS.ASSESSING, isUnsure: false, category: 'assessing' };
    if (s.length > 0) return { points: POINTS.NOT_ABLE, isUnsure: false, category: 'not_able' };
  }
  return { points: null, isUnsure: false, category: 'unknown' };
}

function getGeoMultiplier(geoResponse) {
  if (geoResponse === undefined || geoResponse === null) return 1.0;
  if (typeof geoResponse === 'number') {
    switch (geoResponse) { case 1: return 0.75; case 2: return 0.90; case 3: return 1.0; default: return 1.0; }
  }
  const s = String(geoResponse).toLowerCase();
  if (s.includes('consistent') || s.includes('generally consistent')) return 1.0;
  if (s.includes('vary') || s.includes('varies')) return 0.90;
  if (s.includes('select') || s.includes('only available in select')) return 0.75;
  return 1.0;
}

function scoreD1PaidLeave(value) {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('does not apply')) return 0;
  if (v.includes('13 or more') || v.includes('13 weeks or more') || v.includes('13+ weeks')) return 100;
  if ((v.includes('9 to') && v.includes('13')) || v.includes('9-13')) return 70;
  if ((v.includes('5 to') && v.includes('9')) || v.includes('5-9')) return 40;
  if ((v.includes('3 to') && v.includes('5')) || v.includes('3-5')) return 20;
  if ((v.includes('1 to') && v.includes('3')) || v.includes('1-3')) return 10;
  return 0;
}

function scoreD1PartTime(value) {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('no additional')) return 0;
  if (v.includes('medically necessary') || v.includes('healthcare provider')) return 100;
  if (v.includes('26 weeks or more') || v.includes('26+ weeks') || v.includes('26 or more')) return 80;
  if ((v.includes('12 to') || v.includes('13 to')) && v.includes('26')) return 50;
  if ((v.includes('5 to') && v.includes('12')) || (v.includes('5 to') && v.includes('13'))) return 30;
  if (v.includes('case-by-case')) return 40;
  if (v.includes('4 weeks') || v.includes('up to 4')) return 10;
  return 0;
}

function scoreD3Training(value) {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('less than 10%') || v === 'less than 10' || v.includes('less than 10 percent')) return 0;
  if (v === '100%' || v === '100' || v.includes('100% of') || (v.includes('100') && !v.includes('less than'))) return 100;
  if (v.includes('75') && v.includes('100')) return 80;
  if (v.includes('50') && v.includes('75')) return 50;
  if (v.includes('25') && v.includes('50')) return 30;
  if (v.includes('10') && v.includes('25')) return 10;
  return 0;
}

function scoreD12CaseReview(value) {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('systematic')) return 100;
  if (v.includes('ad hoc')) return 50;
  if (v.includes('aggregate') || v.includes('only review aggregate')) return 20;
  return 0;
}

function scoreD12PolicyChanges(value) {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('significant') || v.includes('major')) return 100;
  if (v.includes('some') || v.includes('minor') || v.includes('adjustments')) return 60;
  if (v.includes('no change') || v.includes('not yet') || v.includes('none')) return 20;
  return 0;
}

function scoreD13Communication(value) {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('monthly')) return 100;
  if (v.includes('quarterly')) return 70;
  if (v.includes('twice')) return 40;
  if (v.includes('annually') || v.includes('world cancer day')) return 20;
  if (v.includes('only when asked')) return 0;
  if (v.includes('do not actively') || v.includes('no regular')) return 0;
  return 0;
}

function calculateFollowUpScore(dimNum, assessment) {
  const dimData = assessment[`dimension${dimNum}_data`];
  switch (dimNum) {
    case 1: {
      const d1_1_usa = dimData?.d1_1_usa; const d1_1_non_usa = dimData?.d1_1_non_usa; const d1_4b = dimData?.d1_4b;
      const scores = [];
      if (d1_1_usa) scores.push(scoreD1PaidLeave(d1_1_usa));
      if (d1_1_non_usa) scores.push(scoreD1PaidLeave(d1_1_non_usa));
      if (d1_4b) scores.push(scoreD1PartTime(d1_4b));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 3: { const d31 = dimData?.d31 ?? dimData?.d3_1; return d31 ? scoreD3Training(d31) : null; }
    case 12: {
      const d12_1 = dimData?.d12_1; const d12_2 = dimData?.d12_2;
      const scores = [];
      if (d12_1) scores.push(scoreD12CaseReview(d12_1));
      if (d12_2) scores.push(scoreD12PolicyChanges(d12_2));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 13: { const d13_1 = dimData?.d13_1; return d13_1 ? scoreD13Communication(d13_1) : null; }
    default: return null;
  }
}

function calculateMaturityScore(assessment) {
  const currentSupport = assessment.current_support_data || {};
  const or1 = currentSupport.or1;
  if (or1 === 6 || or1 === '6') return 100; if (or1 === 5 || or1 === '5') return 80;
  if (or1 === 4 || or1 === '4') return 50; if (or1 === 3 || or1 === '3') return 20;
  if (or1 === 2 || or1 === '2') return 0; if (or1 === 1 || or1 === '1') return 0;
  const v = String(or1 || '').toLowerCase();
  if (v.includes('leading-edge') || v.includes('leading edge')) return 100;
  if (v.includes('comprehensive')) return 100; if (v.includes('enhanced') || v.includes('strong')) return 80;
  if (v.includes('moderate')) return 50; if (v.includes('basic')) return 20; if (v.includes('developing')) return 20;
  if (v.includes('legal minimum')) return 0; if (v.includes('no formal')) return 0;
  return 0;
}

function calculateBreadthScore(assessment) {
  const currentSupport = assessment.current_support_data || {};
  const generalBenefits = assessment.general_benefits_data || {};
  const scores = [];
  const cb3a = currentSupport.cb3a ?? generalBenefits.cb3a;
  if (cb3a === 3 || cb3a === '3') { scores.push(100); }
  else if (cb3a === 2 || cb3a === '2') { scores.push(50); }
  else if (cb3a === 1 || cb3a === '1') { scores.push(0); }
  else if (cb3a !== undefined && cb3a !== null) {
    const v = String(cb3a).toLowerCase();
    if (v.includes('yes') && v.includes('additional support')) { scores.push(100); }
    else if (v.includes('developing') || v.includes('currently developing')) { scores.push(50); }
    else { scores.push(0); }
  } else { scores.push(0); }
  const cb3b = currentSupport.cb3b || generalBenefits.cb3b;
  if (cb3b && Array.isArray(cb3b)) { scores.push(Math.min(100, Math.round((cb3b.length / 6) * 100))); } else { scores.push(0); }
  const cb3c = currentSupport.cb3c || generalBenefits.cb3c;
  if (cb3c && Array.isArray(cb3c)) { scores.push(Math.min(100, Math.round((cb3c.length / 13) * 100))); } else { scores.push(0); }
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

function calculateCompanyScores(assessment) {
  const dimensionScores = {};
  const followUpScores = {};
  const blendedScores = {};
  
  let completedDimCount = 0;
  
  for (let dim = 1; dim <= 13; dim++) {
    const dimData = assessment[`dimension${dim}_data`];
    const mainGrid = dimData?.[`d${dim}a`];
    
    blendedScores[dim] = 0;
    
    if (!mainGrid || typeof mainGrid !== 'object') { dimensionScores[dim] = null; continue; }
    
    let earnedPoints = 0; let totalItems = 0; let answeredItems = 0;
    
    Object.entries(mainGrid).forEach(([itemKey, status]) => {
      if (dim === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
      totalItems++;
      const result = statusToPoints(status);
      if (result.isUnsure) { answeredItems++; }
      else if (result.points !== null) { answeredItems++; earnedPoints += result.points; }
    });
    
    if (totalItems > 0) completedDimCount++;
    
    const maxPoints = answeredItems * 5;
    const rawScore = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
    
    const geoResponse = dimData[`d${dim}aa`] || dimData[`D${dim}aa`];
    const geoMultiplier = getGeoMultiplier(geoResponse);
    const adjustedScore = Math.round(rawScore * geoMultiplier);
    
    let blendedScore = adjustedScore;
    if ([1, 3, 12, 13].includes(dim)) {
      const followUp = calculateFollowUpScore(dim, assessment);
      followUpScores[dim] = followUp;
      if (followUp !== null) {
        const key = `d${dim}`;
        const gridPct = DEFAULT_BLEND_WEIGHTS[key]?.grid ?? 85;
        const followUpPct = DEFAULT_BLEND_WEIGHTS[key]?.followUp ?? 15;
        blendedScore = Math.round((adjustedScore * (gridPct / 100)) + (followUp * (followUpPct / 100)));
      }
    }
    
    dimensionScores[dim] = blendedScore;
    blendedScores[dim] = blendedScore;
  }
  
  const isComplete = completedDimCount === 13;
  
  let weightedDimScore = null;
  if (isComplete) {
    const totalWeight = Object.values(DEFAULT_DIMENSION_WEIGHTS).reduce((sum, w) => sum + w, 0);
    let weightedScore = 0;
    if (totalWeight > 0) {
      for (let i = 1; i <= 13; i++) {
        const weight = DEFAULT_DIMENSION_WEIGHTS[i] || 0;
        weightedScore += blendedScores[i] * (weight / totalWeight);
      }
    }
    weightedDimScore = Math.round(weightedScore);
  }
  
  const maturityScore = calculateMaturityScore(assessment);
  const breadthScore = calculateBreadthScore(assessment);
  
  const compositeScore = isComplete && weightedDimScore !== null
    ? Math.round((weightedDimScore * (DEFAULT_COMPOSITE_WEIGHTS.weightedDim / 100)) + (maturityScore * (DEFAULT_COMPOSITE_WEIGHTS.maturity / 100)) + (breadthScore * (DEFAULT_COMPOSITE_WEIGHTS.breadth / 100)))
    : null;
  
  return {
    compositeScore,
    weightedDimScore,
    maturityScore,
    breadthScore,
    dimensionScores,
    tier: getTier(compositeScore || 0)
  };
}

function getTier(score) {
  if (score >= 90) return { name: 'Exemplary', color: '5B21B6' };
  if (score >= 75) return { name: 'Leading', color: '047857' };
  if (score >= 60) return { name: 'Progressing', color: '1D4ED8' };
  if (score >= 40) return { name: 'Emerging', color: 'B45309' };
  return { name: 'Developing', color: 'B91C1C' };
}

function getScoreColor(score) {
  if (score >= 90) return '5B21B6';
  if (score >= 75) return '047857';
  if (score >= 60) return '1D4ED8';
  if (score >= 40) return 'B45309';
  return 'B91C1C';
}

// ============================================
// MAIN HANDLER
// ============================================

exports.handler = async (event) => {
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing surveyId' }) };
    }

    // Initialize Supabase with service role key
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase configuration' }) };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch assessment data
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('survey_id', surveyId)
      .single();
    
    if (assessmentError || !assessment) {
      return { statusCode: 404, body: JSON.stringify({ error: `Assessment not found: ${assessmentError?.message}` }) };
    }
    
    // Calculate scores
    const scores = calculateCompanyScores(assessment);
    const companyName = assessment.firmographics_data?.company_name || assessment.company_name || 'Company';
    const { compositeScore, tier, dimensionScores } = scores;
    
    // Prepare dimension analysis
    const dimensionAnalysis = Object.entries(dimensionScores)
      .filter(([_, score]) => score !== null)
      .map(([dim, score]) => ({
        dim: parseInt(dim),
        name: DIMENSION_NAMES[parseInt(dim)],
        score: score,
        weight: DEFAULT_DIMENSION_WEIGHTS[parseInt(dim)] || 0,
        tier: getTier(score)
      }))
      .sort((a, b) => b.weight - a.weight);
    
    const excellenceAreas = dimensionAnalysis.filter(d => d.score >= 75).slice(0, 3);
    const growthAreas = dimensionAnalysis.filter(d => d.score < 60).sort((a, b) => b.weight - a.weight).slice(0, 3);
    
    // ============================================
    // BUILD PPTX
    // ============================================
    
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = `${companyName} - Cancer Support Assessment`;
    pptx.author = 'Cancer and Careers';
    
    // Colors
    const COLORS = {
      dark: '1E293B',
      medium: '475569',
      light: '94A3B8',
      accent: '7C3AED',
      bgLight: 'F8FAFC',
      white: 'FFFFFF'
    };
    
    // ============================================
    // SLIDE 1: TITLE
    // ============================================
    let slide = pptx.addSlide();
    slide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: COLORS.dark } });
    
    // CAC Logo placeholder
    slide.addText('CANCER AND CAREERS', { x: 0.5, y: 0.4, w: 4, h: 0.4, fontSize: 14, color: COLORS.light, fontFace: 'Arial' });
    
    slide.addText('Best Companies for', { x: 0.5, y: 2, w: 9, h: 0.6, fontSize: 32, color: COLORS.white, fontFace: 'Arial' });
    slide.addText('Working with Cancer Index', { x: 0.5, y: 2.5, w: 9, h: 0.6, fontSize: 32, color: COLORS.accent, bold: true, fontFace: 'Arial' });
    
    slide.addText(companyName, { x: 0.5, y: 3.5, w: 9, h: 0.8, fontSize: 28, color: COLORS.white, bold: true, fontFace: 'Arial' });
    slide.addText('Assessment Report 2026', { x: 0.5, y: 4.3, w: 9, h: 0.5, fontSize: 18, color: COLORS.light, fontFace: 'Arial' });
    
    // Score badge
    slide.addShape('rect', { x: 10, y: 2, w: 2.8, h: 2.2, fill: { color: tier.color }, rounding: 0.1 });
    slide.addText(String(compositeScore || '--'), { x: 10, y: 2.2, w: 2.8, h: 1, fontSize: 48, color: COLORS.white, bold: true, align: 'center', fontFace: 'Arial' });
    slide.addText(tier.name, { x: 10, y: 3.3, w: 2.8, h: 0.5, fontSize: 16, color: COLORS.white, align: 'center', fontFace: 'Arial' });
    
    slide.addText(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), { x: 0.5, y: 7, w: 4, h: 0.3, fontSize: 11, color: COLORS.light, fontFace: 'Arial' });
    
    // ============================================
    // SLIDE 2: EXECUTIVE SUMMARY
    // ============================================
    slide = pptx.addSlide();
    slide.addText('Executive Summary', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: COLORS.dark, bold: true, fontFace: 'Arial' });
    
    // Score breakdown boxes
    const metrics = [
      { label: 'Composite Score', value: compositeScore || '--', color: tier.color },
      { label: 'Dimension Score', value: scores.weightedDimScore || '--', color: COLORS.medium },
      { label: 'Maturity Score', value: scores.maturityScore || '--', color: COLORS.medium },
      { label: 'Breadth Score', value: scores.breadthScore || '--', color: COLORS.medium }
    ];
    
    metrics.forEach((m, i) => {
      const x = 0.5 + (i * 3.1);
      slide.addShape('rect', { x, y: 1.2, w: 2.9, h: 1.5, fill: { color: 'F1F5F9' }, line: { color: 'E2E8F0', pt: 1 }, rounding: 0.05 });
      slide.addText(String(m.value), { x, y: 1.35, w: 2.9, h: 0.8, fontSize: 36, color: m.color, bold: true, align: 'center', fontFace: 'Arial' });
      slide.addText(m.label, { x, y: 2.15, w: 2.9, h: 0.4, fontSize: 11, color: COLORS.medium, align: 'center', fontFace: 'Arial' });
    });
    
    // Tier description
    const tierDescriptions = {
      'Exemplary': 'Your organization demonstrates exceptional commitment to supporting employees with cancer. You are among the leaders in workplace cancer support.',
      'Leading': 'Your organization shows strong performance in workplace cancer support with comprehensive programs across most dimensions.',
      'Progressing': 'Your organization has solid foundations with room for strategic improvements to reach leading status.',
      'Emerging': 'Your organization is building cancer support capabilities with opportunities for significant advancement.',
      'Developing': 'Your organization is in early stages of cancer support development with substantial growth potential.'
    };
    
    slide.addText('Performance Tier: ' + tier.name, { x: 0.5, y: 3.2, w: 12, h: 0.4, fontSize: 16, color: tier.color, bold: true, fontFace: 'Arial' });
    slide.addText(tierDescriptions[tier.name] || '', { x: 0.5, y: 3.7, w: 12, h: 0.8, fontSize: 12, color: COLORS.medium, fontFace: 'Arial' });
    
    // Key highlights
    slide.addText('Key Highlights', { x: 0.5, y: 4.7, w: 4, h: 0.4, fontSize: 14, color: COLORS.dark, bold: true, fontFace: 'Arial' });
    
    const highlights = [
      `${excellenceAreas.length} dimension${excellenceAreas.length !== 1 ? 's' : ''} at Leading or Exemplary level`,
      `${growthAreas.length} priority area${growthAreas.length !== 1 ? 's' : ''} identified for improvement`,
      `Assessment covers all 13 dimensions of workplace cancer support`
    ];
    
    highlights.forEach((h, i) => {
      slide.addText('•  ' + h, { x: 0.5, y: 5.2 + (i * 0.4), w: 12, h: 0.35, fontSize: 12, color: COLORS.medium, fontFace: 'Arial' });
    });
    
    // ============================================
    // SLIDE 3: DIMENSION PERFORMANCE TABLE
    // ============================================
    slide = pptx.addSlide();
    slide.addText('Dimension Performance Overview', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: COLORS.dark, bold: true, fontFace: 'Arial' });
    
    const tableRows = [
      [
        { text: 'Dimension', options: { bold: true, fill: { color: 'E2E8F0' } } },
        { text: 'Weight', options: { bold: true, fill: { color: 'E2E8F0' }, align: 'center' } },
        { text: 'Score', options: { bold: true, fill: { color: 'E2E8F0' }, align: 'center' } },
        { text: 'Tier', options: { bold: true, fill: { color: 'E2E8F0' }, align: 'center' } }
      ]
    ];
    
    dimensionAnalysis.forEach(d => {
      tableRows.push([
        { text: `D${d.dim}: ${d.name}`, options: {} },
        { text: `${d.weight}%`, options: { align: 'center' } },
        { text: String(d.score), options: { align: 'center', color: getScoreColor(d.score) } },
        { text: d.tier.name, options: { align: 'center', color: d.tier.color } }
      ]);
    });
    
    slide.addTable(tableRows, {
      x: 0.5, y: 1, w: 12.3,
      fontFace: 'Arial',
      fontSize: 10,
      color: COLORS.dark,
      border: { pt: 0.5, color: 'E2E8F0' },
      rowH: 0.4
    });
    
    // ============================================
    // SLIDE 4: STRATEGIC PRIORITY MATRIX (Image from Browserless)
    // ============================================
    slide = pptx.addSlide();
    slide.addText('Strategic Priority Matrix', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: COLORS.dark, bold: true, fontFace: 'Arial' });
    
    // Try to get matrix screenshot from Browserless
    let matrixImageAdded = false;
    const token = process.env.BROWSERLESS_TOKEN;
    const base = process.env.BROWSERLESS_BASE || 'https://chrome.browserless.io';
    const exportToken = process.env.EXPORT_SECRET_TOKEN;
    
    if (token) {
      try {
        const host = event.headers['x-forwarded-host'] || event.headers.host;
        const proto = event.headers['x-forwarded-proto'] || 'https';
        const origin = `${proto}://${host}`;
        const matrixUrl = `${origin}/export/reports/${encodeURIComponent(surveyId)}?token=${exportToken}&matrixOnly=1`;
        
        const shotRes = await fetch(`${base}/screenshot?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: matrixUrl,
            options: {
              type: 'png',
              fullPage: false,
              selector: '#export-matrix',
              omitBackground: false
            }
          })
        });
        
        if (shotRes.ok) {
          const pngBuf = Buffer.from(await shotRes.arrayBuffer()).toString('base64');
          slide.addImage({ data: `data:image/png;base64,${pngBuf}`, x: 0.5, y: 1, w: 12.3, h: 5.5 });
          matrixImageAdded = true;
        }
      } catch (e) {
        console.error('Matrix screenshot failed:', e);
      }
    }
    
    if (!matrixImageAdded) {
      // Fallback: text-based matrix representation
      slide.addText('Matrix visualization requires Browserless configuration', { x: 0.5, y: 3, w: 12, h: 0.5, fontSize: 14, color: COLORS.light, align: 'center', fontFace: 'Arial' });
      
      // Add quadrant summary instead
      const highWeightHighScore = dimensionAnalysis.filter(d => d.weight >= 8 && d.score >= 60);
      const highWeightLowScore = dimensionAnalysis.filter(d => d.weight >= 8 && d.score < 60);
      
      slide.addText('Core Strengths (High Weight, High Score):', { x: 0.5, y: 3.8, w: 6, h: 0.4, fontSize: 12, bold: true, color: '047857', fontFace: 'Arial' });
      highWeightHighScore.forEach((d, i) => {
        slide.addText(`D${d.dim}: ${d.name} (${d.score})`, { x: 0.7, y: 4.2 + (i * 0.35), w: 5.5, h: 0.3, fontSize: 10, color: COLORS.medium, fontFace: 'Arial' });
      });
      
      slide.addText('Priority Gaps (High Weight, Low Score):', { x: 6.5, y: 3.8, w: 6, h: 0.4, fontSize: 12, bold: true, color: 'B91C1C', fontFace: 'Arial' });
      highWeightLowScore.forEach((d, i) => {
        slide.addText(`D${d.dim}: ${d.name} (${d.score})`, { x: 6.7, y: 4.2 + (i * 0.35), w: 5.5, h: 0.3, fontSize: 10, color: COLORS.medium, fontFace: 'Arial' });
      });
    }
    
    // ============================================
    // SLIDE 5: AREAS OF EXCELLENCE & GROWTH
    // ============================================
    slide = pptx.addSlide();
    slide.addText('Areas of Excellence & Growth Opportunities', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: COLORS.dark, bold: true, fontFace: 'Arial' });
    
    // Excellence column
    slide.addShape('rect', { x: 0.5, y: 1, w: 5.9, h: 0.5, fill: { color: 'D1FAE5' } });
    slide.addText('Areas of Excellence', { x: 0.5, y: 1, w: 5.9, h: 0.5, fontSize: 14, color: '065F46', bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
    
    excellenceAreas.forEach((d, i) => {
      const y = 1.6 + (i * 1.5);
      slide.addShape('rect', { x: 0.5, y, w: 5.9, h: 1.4, fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', pt: 1 }, rounding: 0.05 });
      slide.addText(`D${d.dim}: ${d.name}`, { x: 0.7, y: y + 0.1, w: 5.5, h: 0.4, fontSize: 12, color: '065F46', bold: true, fontFace: 'Arial' });
      slide.addText(`Score: ${d.score} (${d.tier.name})`, { x: 0.7, y: y + 0.5, w: 5.5, h: 0.3, fontSize: 10, color: COLORS.medium, fontFace: 'Arial' });
      slide.addText(`Weight: ${d.weight}% of total`, { x: 0.7, y: y + 0.85, w: 5.5, h: 0.3, fontSize: 10, color: COLORS.light, fontFace: 'Arial' });
    });
    
    // Growth column
    slide.addShape('rect', { x: 6.9, y: 1, w: 5.9, h: 0.5, fill: { color: 'FEE2E2' } });
    slide.addText('Growth Opportunities', { x: 6.9, y: 1, w: 5.9, h: 0.5, fontSize: 14, color: '991B1B', bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
    
    growthAreas.forEach((d, i) => {
      const y = 1.6 + (i * 1.5);
      slide.addShape('rect', { x: 6.9, y, w: 5.9, h: 1.4, fill: { color: 'FEF2F2' }, line: { color: 'FECACA', pt: 1 }, rounding: 0.05 });
      slide.addText(`D${d.dim}: ${d.name}`, { x: 7.1, y: y + 0.1, w: 5.5, h: 0.4, fontSize: 12, color: '991B1B', bold: true, fontFace: 'Arial' });
      slide.addText(`Score: ${d.score} (${d.tier.name})`, { x: 7.1, y: y + 0.5, w: 5.5, h: 0.3, fontSize: 10, color: COLORS.medium, fontFace: 'Arial' });
      slide.addText(`Potential Impact: ${d.weight}% weight`, { x: 7.1, y: y + 0.85, w: 5.5, h: 0.3, fontSize: 10, color: COLORS.light, fontFace: 'Arial' });
    });
    
    // ============================================
    // SLIDE 6: IMPLEMENTATION ROADMAP
    // ============================================
    slide = pptx.addSlide();
    slide.addText('Implementation Roadmap', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: COLORS.dark, bold: true, fontFace: 'Arial' });
    
    const phases = [
      { title: 'Phase 1: Foundation', period: '0-6 Months', color: '3B82F6', items: ['Address critical gaps in highest-weight dimensions', 'Establish baseline metrics and tracking', 'Quick wins in communication and awareness'] },
      { title: 'Phase 2: Enhancement', period: '6-12 Months', color: '8B5CF6', items: ['Deepen programs in core strength areas', 'Expand manager training coverage', 'Implement navigation improvements'] },
      { title: 'Phase 3: Excellence', period: '12-18 Months', color: '10B981', items: ['Target Exemplary tier in key dimensions', 'Establish continuous improvement processes', 'Build industry leadership position'] }
    ];
    
    phases.forEach((p, i) => {
      const x = 0.5 + (i * 4.2);
      slide.addShape('rect', { x, y: 1, w: 4, h: 0.6, fill: { color: p.color } });
      slide.addText(p.title, { x, y: 1, w: 4, h: 0.6, fontSize: 14, color: COLORS.white, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' });
      
      slide.addShape('rect', { x, y: 1.6, w: 4, h: 4, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', pt: 1 } });
      slide.addText(p.period, { x, y: 1.75, w: 4, h: 0.4, fontSize: 12, color: p.color, bold: true, align: 'center', fontFace: 'Arial' });
      
      p.items.forEach((item, j) => {
        slide.addText('•  ' + item, { x: x + 0.2, y: 2.3 + (j * 0.6), w: 3.6, h: 0.55, fontSize: 10, color: COLORS.medium, fontFace: 'Arial' });
      });
    });
    
    // ============================================
    // SLIDE 7: HOW CAC CAN HELP
    // ============================================
    slide = pptx.addSlide();
    slide.addText('How Cancer and Careers Can Help', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, color: COLORS.dark, bold: true, fontFace: 'Arial' });
    
    slide.addText('Our consulting practice helps organizations understand where they are, identify where they want to be, and build a realistic path to get there.', { x: 0.5, y: 1.1, w: 12, h: 0.8, fontSize: 13, color: COLORS.medium, fontFace: 'Arial' });
    
    // Two columns
    slide.addText('For Your HR & Benefits Team', { x: 0.5, y: 2.1, w: 5.9, h: 0.4, fontSize: 14, color: COLORS.dark, bold: true, fontFace: 'Arial' });
    ['Policy gap analysis', 'Benefits benchmarking', 'Manager training programs'].forEach((item, i) => {
      slide.addText('✓  ' + item, { x: 0.5, y: 2.55 + (i * 0.4), w: 5.9, h: 0.35, fontSize: 11, color: COLORS.medium, fontFace: 'Arial' });
    });
    
    slide.addText('Supportive Resources for Employees', { x: 6.9, y: 2.1, w: 5.9, h: 0.4, fontSize: 14, color: COLORS.dark, bold: true, fontFace: 'Arial' });
    ['Educational materials', 'Navigation support', 'Peer support networks'].forEach((item, i) => {
      slide.addText('✓  ' + item, { x: 6.9, y: 2.55 + (i * 0.4), w: 5.9, h: 0.35, fontSize: 11, color: COLORS.medium, fontFace: 'Arial' });
    });
    
    // Contact box
    slide.addShape('rect', { x: 0.5, y: 4.2, w: 12.3, h: 1.2, fill: { color: 'F5F3FF' }, rounding: 0.05 });
    slide.addText('Ready to take the next step?', { x: 0.7, y: 4.35, w: 12, h: 0.4, fontSize: 16, color: '5B21B6', bold: true, fontFace: 'Arial' });
    slide.addText('Contact us at consulting@cancerandcareers.org to schedule a consultation.', { x: 0.7, y: 4.8, w: 12, h: 0.4, fontSize: 12, color: '7C3AED', fontFace: 'Arial' });
    
    // Footer
    slide.addText('© 2026 Cancer and Careers. All rights reserved.', { x: 0.5, y: 7, w: 12, h: 0.3, fontSize: 9, color: COLORS.light, fontFace: 'Arial' });
    
    // ============================================
    // GENERATE OUTPUT
    // ============================================
    
    const outB64 = await pptx.write({ outputType: 'base64' });
    const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Cancer_Support_Report.pptx`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
      body: outB64,
      isBase64Encoded: true,
    };
    
  } catch (err) {
    console.error('PPT export error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'PPT export failed', details: err.message }) };
  }
};
