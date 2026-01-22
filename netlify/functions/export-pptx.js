const { createClient } = require('@supabase/supabase-js');
const PptxGenJS = require('pptxgenjs');

// ============================================
// CONSTANTS
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

const DIMENSION_SHORT = {
  1: 'Leave', 2: 'Insurance', 3: 'Managers', 4: 'Navigation', 5: 'Accommodations',
  6: 'Culture', 7: 'Career', 8: 'Work Continuation', 9: 'Executive', 10: 'Caregiver',
  11: 'Wellness', 12: 'Improvement', 13: 'Communication',
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
  if (score >= 90) return { name: 'Exemplary', color: '5B21B6', bg: 'F5F3FF' };
  if (score >= 75) return { name: 'Leading', color: '047857', bg: 'ECFDF5' };
  if (score >= 60) return { name: 'Progressing', color: '1D4ED8', bg: 'EFF6FF' };
  if (score >= 40) return { name: 'Emerging', color: 'B45309', bg: 'FFFBEB' };
  return { name: 'Developing', color: 'B91C1C', bg: 'FEF2F2' };
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

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase configuration' }) };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('survey_id', surveyId)
      .single();
    
    if (assessmentError || !assessment) {
      return { statusCode: 404, body: JSON.stringify({ error: `Assessment not found: ${assessmentError?.message}` }) };
    }
    
    const scores = calculateCompanyScores(assessment);
    const companyName = assessment.firmographics_data?.company_name || assessment.company_name || 'Company';
    const { compositeScore, tier, dimensionScores, weightedDimScore, maturityScore, breadthScore } = scores;
    
    const dimensionAnalysis = Object.entries(dimensionScores)
      .filter(([_, score]) => score !== null)
      .map(([dim, score]) => ({
        dim: parseInt(dim),
        name: DIMENSION_NAMES[parseInt(dim)],
        short: DIMENSION_SHORT[parseInt(dim)],
        score: score,
        weight: DEFAULT_DIMENSION_WEIGHTS[parseInt(dim)] || 0,
        tier: getTier(score)
      }))
      .sort((a, b) => b.weight - a.weight);
    
    const excellenceAreas = dimensionAnalysis.filter(d => d.score >= 75).slice(0, 3);
    const growthAreas = dimensionAnalysis.filter(d => d.score < 60).sort((a, b) => b.weight - a.weight).slice(0, 3);
    
    // ============================================
    // TRY TO GET MATRIX SCREENSHOT FROM BROWSERLESS
    // ============================================
    let matrixImageB64 = null;
    const browserlessToken = process.env.BROWSERLESS_TOKEN;
    const browserlessBase = process.env.BROWSERLESS_BASE || 'https://production-sfo.browserless.io';
    const exportToken = process.env.EXPORT_SECRET_TOKEN;
    
    if (browserlessToken && exportToken) {
      try {
        const host = event.headers['x-forwarded-host'] || event.headers.host;
        const proto = event.headers['x-forwarded-proto'] || 'https';
        const origin = `${proto}://${host}`;
        const matrixUrl = `${origin}/export/reports/${encodeURIComponent(surveyId)}?token=${exportToken}&matrixOnly=1`;
        
        console.log('Attempting matrix screenshot:', matrixUrl);
        
        const shotRes = await fetch(`${browserlessBase}/screenshot?token=${browserlessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: matrixUrl,
            options: {
              type: 'png',
              fullPage: false,
              omitBackground: false
            },
            gotoOptions: {
              waitUntil: 'networkidle0',
              timeout: 20000
            },
            viewport: {
              width: 1200,
              height: 800
            }
          })
        });
        
        if (shotRes.ok) {
          const pngBuf = await shotRes.arrayBuffer();
          matrixImageB64 = Buffer.from(pngBuf).toString('base64');
          console.log('Matrix screenshot captured successfully');
        } else {
          console.log('Matrix screenshot failed:', await shotRes.text());
        }
      } catch (e) {
        console.error('Matrix screenshot error:', e.message);
      }
    }
    
    // ============================================
    // BUILD PPTX
    // ============================================
    
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = `${companyName} - Cancer Support Assessment`;
    pptx.author = 'Cancer and Careers';
    
    // ============================================
    // SLIDE 1: TITLE
    // ============================================
    let slide = pptx.addSlide();
    slide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '1E293B' } });
    
    slide.addText('CANCER AND CAREERS', { x: 0.6, y: 0.5, w: 5, h: 0.4, fontSize: 12, color: '94A3B8', fontFace: 'Arial', bold: true });
    
    slide.addText('Best Companies for', { x: 0.6, y: 2.3, w: 8, h: 0.7, fontSize: 36, color: 'FFFFFF', fontFace: 'Arial' });
    slide.addText('Working with Cancer Index', { x: 0.6, y: 2.9, w: 8, h: 0.7, fontSize: 36, color: '7C3AED', fontFace: 'Arial', bold: true });
    
    slide.addText(companyName, { x: 0.6, y: 4.2, w: 8, h: 0.6, fontSize: 28, color: 'FFFFFF', fontFace: 'Arial', bold: true });
    slide.addText('Assessment Report 2026', { x: 0.6, y: 4.8, w: 8, h: 0.5, fontSize: 18, color: '94A3B8', fontFace: 'Arial' });
    
    // Score badge on right
    slide.addShape('roundRect', { x: 10.5, y: 2.2, w: 2.2, h: 2.5, fill: { color: tier.color }, rounding: 0.1 });
    slide.addText(String(compositeScore || '--'), { x: 10.5, y: 2.5, w: 2.2, h: 1.2, fontSize: 54, color: 'FFFFFF', fontFace: 'Arial', bold: true, align: 'center' });
    slide.addText(tier.name, { x: 10.5, y: 3.8, w: 2.2, h: 0.5, fontSize: 14, color: 'FFFFFF', fontFace: 'Arial', align: 'center' });
    
    slide.addText(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), { x: 0.6, y: 6.8, w: 4, h: 0.3, fontSize: 10, color: '64748B', fontFace: 'Arial' });
    
    // ============================================
    // SLIDE 2: EXECUTIVE SUMMARY
    // ============================================
    slide = pptx.addSlide();
    slide.addText('Executive Summary', { x: 0.6, y: 0.4, w: 10, h: 0.6, fontSize: 28, color: '1E293B', fontFace: 'Arial', bold: true });
    
    // Score cards row
    const cardData = [
      { label: 'Composite', value: compositeScore, color: tier.color },
      { label: 'Dimension', value: weightedDimScore, color: '475569' },
      { label: 'Maturity', value: maturityScore, color: '475569' },
      { label: 'Breadth', value: breadthScore, color: '475569' }
    ];
    
    cardData.forEach((card, i) => {
      const x = 0.6 + (i * 3.1);
      slide.addShape('roundRect', { x, y: 1.2, w: 2.9, h: 1.4, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', pt: 1 }, rounding: 0.05 });
      slide.addText(String(card.value || '--'), { x, y: 1.3, w: 2.9, h: 0.8, fontSize: 40, color: card.color, fontFace: 'Arial', bold: true, align: 'center' });
      slide.addText(card.label, { x, y: 2.1, w: 2.9, h: 0.4, fontSize: 11, color: '64748B', fontFace: 'Arial', align: 'center' });
    });
    
    // Tier badge
    slide.addShape('roundRect', { x: 0.6, y: 2.9, w: 12.1, h: 0.9, fill: { color: tier.bg }, rounding: 0.05 });
    slide.addText(`${tier.name} Tier`, { x: 0.8, y: 3.05, w: 3, h: 0.6, fontSize: 18, color: tier.color, fontFace: 'Arial', bold: true });
    
    const tierDesc = {
      'Exemplary': 'Your organization demonstrates exceptional commitment to cancer support.',
      'Leading': 'Strong performance with comprehensive programs across most dimensions.',
      'Progressing': 'Solid foundations with room for strategic improvements.',
      'Emerging': 'Building cancer support capabilities with growth potential.',
      'Developing': 'Early stages with substantial advancement opportunities.'
    };
    slide.addText(tierDesc[tier.name] || '', { x: 4, y: 3.05, w: 8.5, h: 0.6, fontSize: 12, color: '475569', fontFace: 'Arial', valign: 'middle' });
    
    // Key stats
    slide.addText('Key Findings', { x: 0.6, y: 4.1, w: 5, h: 0.4, fontSize: 14, color: '1E293B', fontFace: 'Arial', bold: true });
    
    const leadingCount = dimensionAnalysis.filter(d => d.score >= 75).length;
    const gapCount = dimensionAnalysis.filter(d => d.score < 60).length;
    
    const findings = [
      `${leadingCount} of 13 dimensions at Leading or Exemplary level`,
      `${gapCount} dimensions identified as growth opportunities`,
      `Strongest area: ${dimensionAnalysis[0]?.name || 'N/A'} (${dimensionAnalysis[0]?.score || '--'})`,
    ];
    
    findings.forEach((f, i) => {
      slide.addText('•', { x: 0.6, y: 4.5 + (i * 0.45), w: 0.3, h: 0.4, fontSize: 12, color: tier.color, fontFace: 'Arial' });
      slide.addText(f, { x: 0.9, y: 4.5 + (i * 0.45), w: 11, h: 0.4, fontSize: 12, color: '475569', fontFace: 'Arial' });
    });
    
    // ============================================
    // SLIDE 3: STRATEGIC PRIORITY MATRIX
    // ============================================
    slide = pptx.addSlide();
    slide.addText('Strategic Priority Matrix', { x: 0.6, y: 0.4, w: 10, h: 0.5, fontSize: 28, color: '1E293B', fontFace: 'Arial', bold: true });
    slide.addText('Dimension scores plotted against strategic importance', { x: 0.6, y: 0.9, w: 10, h: 0.3, fontSize: 12, color: '64748B', fontFace: 'Arial' });
    
    if (matrixImageB64) {
      // Use the screenshot
      slide.addImage({ data: `data:image/png;base64,${matrixImageB64}`, x: 0.3, y: 1.3, w: 12.7, h: 5.8 });
    } else {
      // Build a visual matrix using shapes
      const PLOT_X = 1.5;
      const PLOT_Y = 1.8;
      const PLOT_W = 10;
      const PLOT_H = 4.5;
      
      // Quadrant backgrounds
      slide.addShape('rect', { x: PLOT_X, y: PLOT_Y, w: PLOT_W/2, h: PLOT_H/2, fill: { color: 'FEF2F2' } }); // top-left: priority gaps
      slide.addShape('rect', { x: PLOT_X + PLOT_W/2, y: PLOT_Y, w: PLOT_W/2, h: PLOT_H/2, fill: { color: 'ECFDF5' } }); // top-right: strengths
      slide.addShape('rect', { x: PLOT_X, y: PLOT_Y + PLOT_H/2, w: PLOT_W/2, h: PLOT_H/2, fill: { color: 'F8FAFC' } }); // bottom-left: monitor
      slide.addShape('rect', { x: PLOT_X + PLOT_W/2, y: PLOT_Y + PLOT_H/2, w: PLOT_W/2, h: PLOT_H/2, fill: { color: 'EFF6FF' } }); // bottom-right: leverage
      
      // Quadrant labels
      slide.addText('PRIORITY GAPS', { x: PLOT_X + 0.2, y: PLOT_Y + 0.1, w: PLOT_W/2 - 0.4, h: 0.3, fontSize: 9, color: 'B91C1C', fontFace: 'Arial', bold: true });
      slide.addText('CORE STRENGTHS', { x: PLOT_X + PLOT_W/2 + 0.2, y: PLOT_Y + 0.1, w: PLOT_W/2 - 0.4, h: 0.3, fontSize: 9, color: '047857', fontFace: 'Arial', bold: true });
      slide.addText('MONITOR', { x: PLOT_X + 0.2, y: PLOT_Y + PLOT_H/2 + 0.1, w: PLOT_W/2 - 0.4, h: 0.3, fontSize: 9, color: '64748B', fontFace: 'Arial', bold: true });
      slide.addText('LEVERAGE', { x: PLOT_X + PLOT_W/2 + 0.2, y: PLOT_Y + PLOT_H/2 + 0.1, w: PLOT_W/2 - 0.4, h: 0.3, fontSize: 9, color: '1D4ED8', fontFace: 'Arial', bold: true });
      
      // Border
      slide.addShape('rect', { x: PLOT_X, y: PLOT_Y, w: PLOT_W, h: PLOT_H, fill: { type: 'none' }, line: { color: 'CBD5E1', pt: 1 } });
      
      // Center lines
      slide.addShape('line', { x: PLOT_X + PLOT_W/2, y: PLOT_Y, w: 0, h: PLOT_H, line: { color: 'CBD5E1', pt: 1, dashType: 'dash' } });
      slide.addShape('line', { x: PLOT_X, y: PLOT_Y + PLOT_H/2, w: PLOT_W, h: 0, line: { color: 'CBD5E1', pt: 1, dashType: 'dash' } });
      
      // Plot dimension dots
      const MAX_WEIGHT = 15;
      dimensionAnalysis.forEach((d) => {
        const xPos = PLOT_X + (d.score / 100) * PLOT_W;
        const yPos = PLOT_Y + PLOT_H - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_H);
        
        // Circle
        slide.addShape('ellipse', { x: xPos - 0.22, y: yPos - 0.22, w: 0.44, h: 0.44, fill: { color: getScoreColor(d.score) } });
        slide.addText(`D${d.dim}`, { x: xPos - 0.22, y: yPos - 0.12, w: 0.44, h: 0.24, fontSize: 8, color: 'FFFFFF', fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
      });
      
      // Axis labels
      slide.addText('Dimension Score →', { x: PLOT_X + PLOT_W/2 - 1, y: PLOT_Y + PLOT_H + 0.1, w: 2, h: 0.3, fontSize: 10, color: '475569', fontFace: 'Arial', align: 'center' });
      slide.addText('← Strategic Weight', { x: 0.3, y: PLOT_Y + PLOT_H/2 - 0.15, w: 1.1, h: 0.3, fontSize: 10, color: '475569', fontFace: 'Arial', align: 'center', rotate: 270 });
      
      // Legend
      let legendX = 1.5;
      dimensionAnalysis.slice(0, 7).forEach((d, i) => {
        slide.addShape('ellipse', { x: legendX, y: 6.6, w: 0.18, h: 0.18, fill: { color: getScoreColor(d.score) } });
        slide.addText(`D${d.dim}: ${d.short}`, { x: legendX + 0.22, y: 6.55, w: 1.5, h: 0.28, fontSize: 8, color: '64748B', fontFace: 'Arial' });
        legendX += 1.6;
      });
      legendX = 1.5;
      dimensionAnalysis.slice(7).forEach((d, i) => {
        slide.addShape('ellipse', { x: legendX, y: 6.95, w: 0.18, h: 0.18, fill: { color: getScoreColor(d.score) } });
        slide.addText(`D${d.dim}: ${d.short}`, { x: legendX + 0.22, y: 6.9, w: 1.5, h: 0.28, fontSize: 8, color: '64748B', fontFace: 'Arial' });
        legendX += 1.6;
      });
    }
    
    // ============================================
    // SLIDE 4: DIMENSION PERFORMANCE
    // ============================================
    slide = pptx.addSlide();
    slide.addText('Dimension Performance', { x: 0.6, y: 0.4, w: 10, h: 0.5, fontSize: 28, color: '1E293B', fontFace: 'Arial', bold: true });
    
    const tableRows = [
      [
        { text: 'Dimension', options: { bold: true, fill: { color: '1E293B' }, color: 'FFFFFF', align: 'left' } },
        { text: 'Weight', options: { bold: true, fill: { color: '1E293B' }, color: 'FFFFFF', align: 'center' } },
        { text: 'Score', options: { bold: true, fill: { color: '1E293B' }, color: 'FFFFFF', align: 'center' } },
        { text: 'Tier', options: { bold: true, fill: { color: '1E293B' }, color: 'FFFFFF', align: 'center' } }
      ]
    ];
    
    dimensionAnalysis.forEach((d, i) => {
      const rowBg = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
      tableRows.push([
        { text: `D${d.dim}: ${d.name}`, options: { fill: { color: rowBg }, align: 'left' } },
        { text: `${d.weight}%`, options: { fill: { color: rowBg }, align: 'center' } },
        { text: String(d.score), options: { fill: { color: rowBg }, align: 'center', color: getScoreColor(d.score), bold: true } },
        { text: d.tier.name, options: { fill: { color: rowBg }, align: 'center', color: d.tier.color } }
      ]);
    });
    
    slide.addTable(tableRows, {
      x: 0.6, y: 1.1, w: 12.1,
      fontFace: 'Arial',
      fontSize: 10,
      color: '1E293B',
      border: { pt: 0.5, color: 'E2E8F0' },
      rowH: 0.38
    });
    
    // ============================================
    // SLIDE 5: EXCELLENCE & GROWTH
    // ============================================
    slide = pptx.addSlide();
    slide.addText('Areas of Excellence & Growth', { x: 0.6, y: 0.4, w: 12, h: 0.5, fontSize: 28, color: '1E293B', fontFace: 'Arial', bold: true });
    
    // Excellence column
    slide.addShape('roundRect', { x: 0.6, y: 1.1, w: 5.8, h: 0.5, fill: { color: 'D1FAE5' }, rounding: 0.05 });
    slide.addText('Areas of Excellence', { x: 0.6, y: 1.1, w: 5.8, h: 0.5, fontSize: 14, color: '047857', fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
    
    excellenceAreas.forEach((d, i) => {
      const y = 1.75 + (i * 1.5);
      slide.addShape('roundRect', { x: 0.6, y, w: 5.8, h: 1.35, fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', pt: 1 }, rounding: 0.05 });
      slide.addText(`D${d.dim}: ${d.name}`, { x: 0.8, y: y + 0.15, w: 5.4, h: 0.4, fontSize: 12, color: '047857', fontFace: 'Arial', bold: true });
      slide.addText(`Score: ${d.score}`, { x: 0.8, y: y + 0.55, w: 2.5, h: 0.3, fontSize: 11, color: '475569', fontFace: 'Arial' });
      slide.addText(d.tier.name, { x: 3.3, y: y + 0.55, w: 1.5, h: 0.3, fontSize: 11, color: d.tier.color, fontFace: 'Arial', bold: true });
      slide.addText(`Weight: ${d.weight}%`, { x: 0.8, y: y + 0.9, w: 5.4, h: 0.3, fontSize: 10, color: '94A3B8', fontFace: 'Arial' });
    });
    
    // Growth column
    slide.addShape('roundRect', { x: 6.9, y: 1.1, w: 5.8, h: 0.5, fill: { color: 'FEE2E2' }, rounding: 0.05 });
    slide.addText('Growth Opportunities', { x: 6.9, y: 1.1, w: 5.8, h: 0.5, fontSize: 14, color: 'B91C1C', fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
    
    growthAreas.forEach((d, i) => {
      const y = 1.75 + (i * 1.5);
      slide.addShape('roundRect', { x: 6.9, y, w: 5.8, h: 1.35, fill: { color: 'FEF2F2' }, line: { color: 'FECACA', pt: 1 }, rounding: 0.05 });
      slide.addText(`D${d.dim}: ${d.name}`, { x: 7.1, y: y + 0.15, w: 5.4, h: 0.4, fontSize: 12, color: 'B91C1C', fontFace: 'Arial', bold: true });
      slide.addText(`Score: ${d.score}`, { x: 7.1, y: y + 0.55, w: 2.5, h: 0.3, fontSize: 11, color: '475569', fontFace: 'Arial' });
      slide.addText(d.tier.name, { x: 9.6, y: y + 0.55, w: 1.5, h: 0.3, fontSize: 11, color: d.tier.color, fontFace: 'Arial', bold: true });
      slide.addText(`Potential Impact: ${d.weight}% weight`, { x: 7.1, y: y + 0.9, w: 5.4, h: 0.3, fontSize: 10, color: '94A3B8', fontFace: 'Arial' });
    });
    
    // ============================================
    // SLIDE 6: ROADMAP
    // ============================================
    slide = pptx.addSlide();
    slide.addText('Implementation Roadmap', { x: 0.6, y: 0.4, w: 10, h: 0.5, fontSize: 28, color: '1E293B', fontFace: 'Arial', bold: true });
    
    const phases = [
      { title: 'Phase 1: Foundation', period: '0-6 Months', color: '3B82F6', items: ['Address critical gaps', 'Establish baseline metrics', 'Quick wins in awareness'] },
      { title: 'Phase 2: Enhancement', period: '6-12 Months', color: '8B5CF6', items: ['Deepen core programs', 'Expand training coverage', 'Navigation improvements'] },
      { title: 'Phase 3: Excellence', period: '12-18 Months', color: '10B981', items: ['Target Exemplary tier', 'Continuous improvement', 'Industry leadership'] }
    ];
    
    phases.forEach((p, i) => {
      const x = 0.6 + (i * 4.2);
      
      // Header
      slide.addShape('roundRect', { x, y: 1.1, w: 4, h: 0.6, fill: { color: p.color }, rounding: 0.05 });
      slide.addText(p.title, { x, y: 1.1, w: 4, h: 0.6, fontSize: 14, color: 'FFFFFF', fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
      
      // Body
      slide.addShape('roundRect', { x, y: 1.7, w: 4, h: 4.5, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', pt: 1 }, rounding: 0.05 });
      slide.addText(p.period, { x, y: 1.9, w: 4, h: 0.4, fontSize: 12, color: p.color, fontFace: 'Arial', bold: true, align: 'center' });
      
      p.items.forEach((item, j) => {
        slide.addText('•', { x: x + 0.2, y: 2.5 + (j * 0.7), w: 0.3, h: 0.5, fontSize: 12, color: p.color, fontFace: 'Arial' });
        slide.addText(item, { x: x + 0.5, y: 2.5 + (j * 0.7), w: 3.3, h: 0.6, fontSize: 11, color: '475569', fontFace: 'Arial' });
      });
    });
    
    // ============================================
    // SLIDE 7: CONTACT
    // ============================================
    slide = pptx.addSlide();
    slide.addText('How Cancer and Careers Can Help', { x: 0.6, y: 0.4, w: 12, h: 0.5, fontSize: 28, color: '1E293B', fontFace: 'Arial', bold: true });
    
    slide.addText('Our consulting practice helps organizations understand where they are, identify where they want to be, and build a realistic path to get there.', { x: 0.6, y: 1.1, w: 12, h: 0.6, fontSize: 13, color: '475569', fontFace: 'Arial' });
    
    // Two service boxes
    slide.addShape('roundRect', { x: 0.6, y: 2, w: 5.8, h: 2.8, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', pt: 1 }, rounding: 0.05 });
    slide.addText('For HR & Benefits Teams', { x: 0.8, y: 2.2, w: 5.4, h: 0.4, fontSize: 14, color: '1E293B', fontFace: 'Arial', bold: true });
    ['Policy gap analysis', 'Benefits benchmarking', 'Manager training programs', 'Communication strategy'].forEach((item, i) => {
      slide.addText('✓', { x: 0.9, y: 2.7 + (i * 0.45), w: 0.3, h: 0.4, fontSize: 12, color: '047857', fontFace: 'Arial' });
      slide.addText(item, { x: 1.25, y: 2.7 + (i * 0.45), w: 5, h: 0.4, fontSize: 11, color: '475569', fontFace: 'Arial' });
    });
    
    slide.addShape('roundRect', { x: 6.9, y: 2, w: 5.8, h: 2.8, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', pt: 1 }, rounding: 0.05 });
    slide.addText('For Employees', { x: 7.1, y: 2.2, w: 5.4, h: 0.4, fontSize: 14, color: '1E293B', fontFace: 'Arial', bold: true });
    ['Educational materials', 'Navigation support', 'Peer support networks', 'Resource directories'].forEach((item, i) => {
      slide.addText('✓', { x: 7.2, y: 2.7 + (i * 0.45), w: 0.3, h: 0.4, fontSize: 12, color: '047857', fontFace: 'Arial' });
      slide.addText(item, { x: 7.55, y: 2.7 + (i * 0.45), w: 5, h: 0.4, fontSize: 11, color: '475569', fontFace: 'Arial' });
    });
    
    // Contact box
    slide.addShape('roundRect', { x: 0.6, y: 5.2, w: 12.1, h: 1.3, fill: { color: 'F5F3FF' }, rounding: 0.05 });
    slide.addText('Ready to take the next step?', { x: 0.8, y: 5.4, w: 11.7, h: 0.5, fontSize: 18, color: '5B21B6', fontFace: 'Arial', bold: true });
    slide.addText('Contact us at consulting@cancerandcareers.org to schedule a consultation.', { x: 0.8, y: 5.9, w: 11.7, h: 0.4, fontSize: 13, color: '7C3AED', fontFace: 'Arial' });
    
    // Footer
    slide.addText('© 2026 Cancer and Careers. All rights reserved.', { x: 0.6, y: 6.9, w: 12, h: 0.3, fontSize: 9, color: '94A3B8', fontFace: 'Arial' });
    
    // ============================================
    // OUTPUT
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
