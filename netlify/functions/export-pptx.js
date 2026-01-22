const PptxGenJS = require('pptxgenjs');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// DATA-DRIVEN PPT EXPORT - FIXED SCORING
// ============================================

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
  1: 'Leave', 2: 'Insurance', 3: 'Manager', 4: 'Navigation', 5: 'Accommodations',
  6: 'Culture', 7: 'Career', 8: 'Work Continuation', 9: 'Executive',
  10: 'Caregiver', 11: 'Prevention', 12: 'Improvement', 13: 'Communication'
};

const DIMENSION_WEIGHTS = { 4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3 };
const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };

function getTier(score) {
  if (score >= 90) return { name: 'Exemplary', color: '7c3aed', bg: 'f5f3ff' };
  if (score >= 75) return { name: 'Leading', color: '059669', bg: 'ecfdf5' };
  if (score >= 60) return { name: 'Progressing', color: '2563eb', bg: 'eff6ff' };
  if (score >= 40) return { name: 'Emerging', color: 'd97706', bg: 'fffbeb' };
  return { name: 'Developing', color: 'dc2626', bg: 'fef2f2' };
}

// FIXED: Handle both string and numeric status values
function statusToPoints(status) {
  // Handle numeric values (1-5)
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: POINTS.CURRENTLY_OFFER, isUnsure: false };
      case 3: return { points: POINTS.PLANNING, isUnsure: false };
      case 2: return { points: POINTS.ASSESSING, isUnsure: false };
      case 1: return { points: POINTS.NOT_ABLE, isUnsure: false };
      case 5: return { points: null, isUnsure: true };
      default: return { points: null, isUnsure: false };
    }
  }
  
  // Handle string values
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able') || s.includes('not offered')) {
      return { points: POINTS.NOT_ABLE, isUnsure: false };
    }
    if (s === 'unsure' || s.includes('unsure') || s.includes('unknown')) {
      return { points: null, isUnsure: true };
    }
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || 
        s.includes('use') || s.includes('track') || s.includes('measure') || s.includes('yes')) {
      return { points: POINTS.CURRENTLY_OFFER, isUnsure: false };
    }
    if (s.includes('planning') || s.includes('development')) {
      return { points: POINTS.PLANNING, isUnsure: false };
    }
    if (s.includes('assessing') || s.includes('feasibility')) {
      return { points: POINTS.ASSESSING, isUnsure: false };
    }
    // Default non-empty string to not offered
    if (s.length > 0) {
      return { points: POINTS.NOT_ABLE, isUnsure: false };
    }
  }
  
  return { points: null, isUnsure: false };
}

function calculateScores(assessment) {
  const dimensionScores = {};
  let completedDims = 0;
  
  for (let dim = 1; dim <= 13; dim++) {
    const dimData = assessment[`dimension${dim}_data`];
    const mainGrid = dimData?.[`d${dim}a`];
    
    if (!mainGrid || typeof mainGrid !== 'object') {
      dimensionScores[dim] = null;
      continue;
    }
    
    let earned = 0, answered = 0;
    Object.values(mainGrid).forEach(status => {
      const result = statusToPoints(status);
      if (result.isUnsure) {
        answered++;
      } else if (result.points !== null) {
        answered++;
        earned += result.points;
      }
    });
    
    if (answered > 0) {
      completedDims++;
      const maxPoints = answered * 5;
      dimensionScores[dim] = Math.round((earned / maxPoints) * 100);
    } else {
      dimensionScores[dim] = 0;
    }
  }
  
  // Weighted score
  let weightedScore = 0;
  const totalWeight = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
  for (let dim = 1; dim <= 13; dim++) {
    const score = dimensionScores[dim] || 0;
    weightedScore += score * (DIMENSION_WEIGHTS[dim] / totalWeight);
  }
  
  // Composite = 90% weighted + 5% maturity + 5% breadth (simplified)
  const compositeScore = Math.round(weightedScore * 0.9 + 100 * 0.1);
  
  return { dimensionScores, compositeScore, tier: getTier(compositeScore) };
}

exports.handler = async (event) => {
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing surveyId' }) };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing env vars. URL:', !!supabaseUrl, 'Key:', !!supabaseKey);
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase credentials' }) };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('survey_id', surveyId)
      .single();
    
    if (error || !assessment) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Assessment not found', details: error?.message }) };
    }
    
    const companyName = assessment.firmographics_data?.company_name || assessment.company_name || 'Company';
    const { dimensionScores, compositeScore, tier } = calculateScores(assessment);
    
    console.log('Calculated scores:', { compositeScore, tier: tier.name, dimensionScores });
    
    // Sort dimensions by weight (highest first)
    const sortedDims = Object.entries(DIMENSION_WEIGHTS)
      .sort(([, a], [, b]) => b - a)
      .map(([dim]) => {
        const d = parseInt(dim);
        const score = dimensionScores[d] || 0;
        return {
          dim: d,
          name: DIMENSION_NAMES[d],
          shortName: DIMENSION_SHORT[d],
          weight: DIMENSION_WEIGHTS[d],
          score,
          tier: getTier(score)
        };
      });
    
    // Get strengths (Leading+) and opportunities (<60)
    const strengths = [...sortedDims].sort((a, b) => b.score - a.score).filter(d => d.score >= 75).slice(0, 5);
    const opportunities = [...sortedDims].sort((a, b) => a.score - b.score).filter(d => d.score < 60).slice(0, 5);
    
    // Create PPT
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = `${companyName} - Cancer Support Assessment`;
    pptx.author = 'Cancer and Careers';
    
    // Brand colors
    const NAVY = '1e293b';
    const TEAL = '0d9488';
    const GRAY = '64748b';
    const LIGHT = 'f8fafc';
    
    // ========== SLIDE 1: Title ==========
    const slide1 = pptx.addSlide();
    slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: NAVY } });
    
    slide1.addText('CANCER AND CAREERS', {
      x: 0.75, y: 1.2, w: 11.8, h: 0.4,
      fontSize: 12, fontFace: 'Arial', color: TEAL, bold: true, charSpacing: 4
    });
    
    slide1.addText('Best Companies for\nWorking with Cancer', {
      x: 0.75, y: 1.7, w: 11.8, h: 1.4,
      fontSize: 36, fontFace: 'Arial', color: 'ffffff', bold: true, lineSpacing: 42
    });
    
    slide1.addText(companyName, {
      x: 0.75, y: 3.5, w: 11.8, h: 0.8,
      fontSize: 28, fontFace: 'Arial', color: TEAL
    });
    
    slide1.addText('Assessment Report 2026', {
      x: 0.75, y: 4.4, w: 11.8, h: 0.5,
      fontSize: 16, fontFace: 'Arial', color: '94a3b8'
    });
    
    // ========== SLIDE 2: Executive Summary ==========
    const slide2 = pptx.addSlide();
    slide2.addText('Executive Summary', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.6,
      fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
    });
    
    // Large score display
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y: 1.1, w: 2.5, h: 2.2,
      fill: { color: LIGHT }, line: { color: 'e2e8f0', width: 1 }
    });
    slide2.addText(String(compositeScore), {
      x: 0.5, y: 1.2, w: 2.5, h: 1.4,
      fontSize: 64, fontFace: 'Arial', color: tier.color, bold: true, align: 'center'
    });
    slide2.addText('Composite\nScore', {
      x: 0.5, y: 2.6, w: 2.5, h: 0.6,
      fontSize: 11, fontFace: 'Arial', color: GRAY, align: 'center', lineSpacing: 14
    });
    
    // Tier badge
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 3.3, y: 1.4, w: 2.2, h: 0.7,
      fill: { color: tier.color }
    });
    slide2.addText(tier.name, {
      x: 3.3, y: 1.4, w: 2.2, h: 0.7,
      fontSize: 16, fontFace: 'Arial', color: 'ffffff', bold: true, align: 'center', valign: 'middle'
    });
    slide2.addText('Performance Tier', {
      x: 3.3, y: 2.2, w: 2.2, h: 0.3,
      fontSize: 10, fontFace: 'Arial', color: GRAY, align: 'center'
    });
    
    // Key metrics row
    const metrics = [
      { val: '13', label: 'Dimensions\nAssessed' },
      { val: String(strengths.length), label: 'At Leading\nor Above' },
      { val: String(opportunities.length), label: 'Growth\nOpportunities' }
    ];
    
    metrics.forEach((m, i) => {
      const x = 6 + (i * 2.4);
      slide2.addText(m.val, {
        x, y: 1.3, w: 2, h: 0.9,
        fontSize: 40, fontFace: 'Arial', color: NAVY, bold: true, align: 'center'
      });
      slide2.addText(m.label, {
        x, y: 2.2, w: 2, h: 0.6,
        fontSize: 10, fontFace: 'Arial', color: GRAY, align: 'center', lineSpacing: 12
      });
    });
    
    // Strongest/Weakest
    const strongest = [...sortedDims].sort((a, b) => b.score - a.score)[0];
    const weakest = [...sortedDims].sort((a, b) => a.score - b.score)[0];
    
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y: 3.8, w: 6, h: 1.2,
      fill: { color: 'ecfdf5' }, line: { color: '059669', width: 1 }
    });
    slide2.addText('STRONGEST DIMENSION', {
      x: 0.7, y: 3.95, w: 5.6, h: 0.3,
      fontSize: 9, fontFace: 'Arial', color: '059669', bold: true
    });
    slide2.addText(`${strongest.name} (${strongest.score})`, {
      x: 0.7, y: 4.35, w: 5.6, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: NAVY, bold: true
    });
    
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 6.8, y: 3.8, w: 6, h: 1.2,
      fill: { color: 'fef3c7' }, line: { color: 'd97706', width: 1 }
    });
    slide2.addText('GROWTH OPPORTUNITY', {
      x: 7, y: 3.95, w: 5.6, h: 0.3,
      fontSize: 9, fontFace: 'Arial', color: 'd97706', bold: true
    });
    slide2.addText(`${weakest.name} (${weakest.score})`, {
      x: 7, y: 4.35, w: 5.6, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: NAVY, bold: true
    });
    
    // Points to next tier
    const tiers = [
      { name: 'Emerging', min: 40 },
      { name: 'Progressing', min: 60 },
      { name: 'Leading', min: 75 },
      { name: 'Exemplary', min: 90 }
    ];
    const nextTier = tiers.find(t => t.min > compositeScore);
    if (nextTier) {
      slide2.addText(`${nextTier.min - compositeScore} points to ${nextTier.name} tier`, {
        x: 0.5, y: 5.3, w: 12.3, h: 0.4,
        fontSize: 12, fontFace: 'Arial', color: '7c3aed', italic: true
      });
    }
    
    // ========== SLIDE 3: Dimension Performance ==========
    const slide3 = pptx.addSlide();
    slide3.addText('Dimension Performance', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.5,
      fontSize: 24, fontFace: 'Arial', color: NAVY, bold: true
    });
    
    // Table header
    const headerRow = [
      { text: 'Dimension', options: { bold: true, fill: { color: NAVY }, color: 'ffffff', align: 'left' } },
      { text: 'Wt%', options: { bold: true, fill: { color: NAVY }, color: 'ffffff', align: 'center' } },
      { text: 'Score', options: { bold: true, fill: { color: NAVY }, color: 'ffffff', align: 'center' } },
      { text: 'Tier', options: { bold: true, fill: { color: NAVY }, color: 'ffffff', align: 'center' } }
    ];
    
    const dataRows = sortedDims.map((d, i) => {
      const bg = i % 2 === 0 ? 'ffffff' : 'f8fafc';
      return [
        { text: `D${d.dim}: ${d.name}`, options: { fill: { color: bg }, align: 'left' } },
        { text: `${d.weight}%`, options: { fill: { color: bg }, align: 'center' } },
        { text: String(d.score), options: { fill: { color: bg }, align: 'center', color: d.tier.color, bold: true } },
        { text: d.tier.name, options: { fill: { color: bg }, align: 'center', color: d.tier.color } }
      ];
    });
    
    slide3.addTable([headerRow, ...dataRows], {
      x: 0.5, y: 0.9, w: 12.3,
      fontSize: 10,
      fontFace: 'Arial',
      rowH: 0.4,
      border: { type: 'solid', color: 'e2e8f0', pt: 0.5 },
      colW: [5.8, 1.2, 1.2, 2.3]
    });
    
    // ========== SLIDE 4: Strategic Matrix (simplified) ==========
    const slide4 = pptx.addSlide();
    slide4.addText('Strategic Priority Matrix', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.5,
      fontSize: 24, fontFace: 'Arial', color: NAVY, bold: true
    });
    slide4.addText('Dimensions plotted by performance (x) vs strategic weight (y)', {
      x: 0.5, y: 0.75, w: 12.3, h: 0.3,
      fontSize: 11, fontFace: 'Arial', color: GRAY
    });
    
    // Draw quadrant background
    const qX = 1.5, qY = 1.3, qW = 10, qH = 5;
    
    // Quadrant labels
    slide4.addShape(pptx.ShapeType.rect, { x: qX, y: qY - 0.3, w: qW/2, h: 0.25, fill: { color: 'fee2e2' } });
    slide4.addText('PRIORITY GAPS', { x: qX, y: qY - 0.3, w: qW/2, h: 0.25, fontSize: 8, fontFace: 'Arial', color: '991b1b', bold: true, align: 'center', valign: 'middle' });
    
    slide4.addShape(pptx.ShapeType.rect, { x: qX + qW/2, y: qY - 0.3, w: qW/2, h: 0.25, fill: { color: 'd1fae5' } });
    slide4.addText('CORE STRENGTHS', { x: qX + qW/2, y: qY - 0.3, w: qW/2, h: 0.25, fontSize: 8, fontFace: 'Arial', color: '065f46', bold: true, align: 'center', valign: 'middle' });
    
    // Quadrant boxes
    slide4.addShape(pptx.ShapeType.rect, { x: qX, y: qY, w: qW/2, h: qH/2, fill: { color: 'fefefe' }, line: { color: 'e5e7eb', width: 0.5 } });
    slide4.addShape(pptx.ShapeType.rect, { x: qX + qW/2, y: qY, w: qW/2, h: qH/2, fill: { color: 'fefefe' }, line: { color: 'e5e7eb', width: 0.5 } });
    slide4.addShape(pptx.ShapeType.rect, { x: qX, y: qY + qH/2, w: qW/2, h: qH/2, fill: { color: 'fefefe' }, line: { color: 'e5e7eb', width: 0.5 } });
    slide4.addShape(pptx.ShapeType.rect, { x: qX + qW/2, y: qY + qH/2, w: qW/2, h: qH/2, fill: { color: 'fefefe' }, line: { color: 'e5e7eb', width: 0.5 } });
    
    // Bottom labels
    slide4.addShape(pptx.ShapeType.rect, { x: qX, y: qY + qH, w: qW/2, h: 0.25, fill: { color: 'f3f4f6' } });
    slide4.addText('MONITOR', { x: qX, y: qY + qH, w: qW/2, h: 0.25, fontSize: 8, fontFace: 'Arial', color: '4b5563', bold: true, align: 'center', valign: 'middle' });
    
    slide4.addShape(pptx.ShapeType.rect, { x: qX + qW/2, y: qY + qH, w: qW/2, h: 0.25, fill: { color: 'dbeafe' } });
    slide4.addText('LEVERAGE', { x: qX + qW/2, y: qY + qH, w: qW/2, h: 0.25, fontSize: 8, fontFace: 'Arial', color: '1e40af', bold: true, align: 'center', valign: 'middle' });
    
    // Plot dimension circles
    sortedDims.forEach(d => {
      const xPos = qX + (d.score / 100) * qW;
      const yPos = qY + qH - (d.weight / 15) * qH; // 15% max weight
      
      slide4.addShape(pptx.ShapeType.ellipse, {
        x: xPos - 0.25, y: yPos - 0.25, w: 0.5, h: 0.5,
        fill: { color: d.tier.color }
      });
      slide4.addText(`D${d.dim}`, {
        x: xPos - 0.25, y: yPos - 0.25, w: 0.5, h: 0.5,
        fontSize: 8, fontFace: 'Arial', color: 'ffffff', bold: true, align: 'center', valign: 'middle'
      });
    });
    
    // Axis labels
    slide4.addText('PERFORMANCE SCORE →', { x: qX, y: qY + qH + 0.35, w: qW, h: 0.3, fontSize: 9, fontFace: 'Arial', color: GRAY, align: 'center' });
    slide4.addText('↑ STRATEGIC\nIMPORTANCE', { x: 0.3, y: qY + qH/2 - 0.4, w: 1, h: 0.8, fontSize: 8, fontFace: 'Arial', color: GRAY, align: 'center', lineSpacing: 10 });
    
    // ========== SLIDE 5: Areas of Excellence ==========
    const slide5 = pptx.addSlide();
    slide5.addText('Areas of Excellence', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.5,
      fontSize: 24, fontFace: 'Arial', color: NAVY, bold: true
    });
    slide5.addText(`${strengths.length} dimensions at Leading or Exemplary level`, {
      x: 0.5, y: 0.75, w: 12.3, h: 0.3,
      fontSize: 11, fontFace: 'Arial', color: GRAY
    });
    
    if (strengths.length > 0) {
      strengths.forEach((d, i) => {
        const y = 1.2 + (i * 1.0);
        slide5.addShape(pptx.ShapeType.roundRect, {
          x: 0.5, y, w: 12.3, h: 0.85,
          fill: { color: 'ecfdf5' }, line: { color: '10b981', width: 1 }
        });
        slide5.addShape(pptx.ShapeType.roundRect, {
          x: 0.7, y: y + 0.15, w: 0.55, h: 0.55,
          fill: { color: d.tier.color }
        });
        slide5.addText(`D${d.dim}`, {
          x: 0.7, y: y + 0.15, w: 0.55, h: 0.55,
          fontSize: 11, fontFace: 'Arial', color: 'ffffff', bold: true, align: 'center', valign: 'middle'
        });
        slide5.addText(d.name, {
          x: 1.4, y: y + 0.15, w: 8, h: 0.55,
          fontSize: 13, fontFace: 'Arial', color: NAVY, bold: true, valign: 'middle'
        });
        slide5.addText(String(d.score), {
          x: 10.5, y: y + 0.15, w: 2, h: 0.55,
          fontSize: 20, fontFace: 'Arial', color: d.tier.color, bold: true, align: 'right', valign: 'middle'
        });
      });
    } else {
      slide5.addText('No dimensions currently at Leading level or above.\nFocus on the growth opportunities to build toward this goal.', {
        x: 0.5, y: 2.5, w: 12.3, h: 1,
        fontSize: 14, fontFace: 'Arial', color: GRAY, italic: true, lineSpacing: 20
      });
    }
    
    // ========== SLIDE 6: Growth Opportunities ==========
    const slide6 = pptx.addSlide();
    slide6.addText('Growth Opportunities', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.5,
      fontSize: 24, fontFace: 'Arial', color: NAVY, bold: true
    });
    slide6.addText('Dimensions with highest improvement potential', {
      x: 0.5, y: 0.75, w: 12.3, h: 0.3,
      fontSize: 11, fontFace: 'Arial', color: GRAY
    });
    
    if (opportunities.length > 0) {
      opportunities.forEach((d, i) => {
        const y = 1.2 + (i * 1.0);
        slide6.addShape(pptx.ShapeType.roundRect, {
          x: 0.5, y, w: 12.3, h: 0.85,
          fill: { color: 'fef3c7' }, line: { color: 'f59e0b', width: 1 }
        });
        slide6.addShape(pptx.ShapeType.roundRect, {
          x: 0.7, y: y + 0.15, w: 0.55, h: 0.55,
          fill: { color: d.tier.color }
        });
        slide6.addText(`D${d.dim}`, {
          x: 0.7, y: y + 0.15, w: 0.55, h: 0.55,
          fontSize: 11, fontFace: 'Arial', color: 'ffffff', bold: true, align: 'center', valign: 'middle'
        });
        slide6.addText(d.name, {
          x: 1.4, y: y + 0.15, w: 8, h: 0.55,
          fontSize: 13, fontFace: 'Arial', color: NAVY, bold: true, valign: 'middle'
        });
        slide6.addText(String(d.score), {
          x: 10.5, y: y + 0.15, w: 2, h: 0.55,
          fontSize: 20, fontFace: 'Arial', color: d.tier.color, bold: true, align: 'right', valign: 'middle'
        });
      });
    } else {
      slide6.addText('All dimensions performing well!', {
        x: 0.5, y: 2.5, w: 12.3, h: 0.5,
        fontSize: 14, fontFace: 'Arial', color: '059669', italic: true
      });
    }
    
    // ========== SLIDE 7: How CAC Can Help ==========
    const slide7 = pptx.addSlide();
    slide7.addText('How Cancer and Careers Can Help', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.5,
      fontSize: 24, fontFace: 'Arial', color: NAVY, bold: true
    });
    
    const services = [
      { title: 'Manager Training', desc: 'Live sessions with case studies, manager toolkit, conversation guides' },
      { title: 'Policy Assessment', desc: 'Comprehensive review, gap analysis, business case development' },
      { title: 'Navigation Design', desc: 'Resource audit, single entry point design, communication strategy' },
      { title: 'Return-to-Work Programs', desc: 'Phased protocols, check-in cadence, career continuity planning' }
    ];
    
    services.forEach((svc, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + (col * 6.4);
      const y = 1.0 + (row * 2.0);
      
      slide7.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 6, h: 1.7,
        fill: { color: LIGHT }, line: { color: 'e2e8f0', width: 1 }
      });
      slide7.addText(svc.title, {
        x: x + 0.3, y: y + 0.25, w: 5.4, h: 0.4,
        fontSize: 14, fontFace: 'Arial', color: NAVY, bold: true
      });
      slide7.addText(svc.desc, {
        x: x + 0.3, y: y + 0.75, w: 5.4, h: 0.7,
        fontSize: 11, fontFace: 'Arial', color: GRAY, lineSpacing: 14
      });
    });
    
    // Contact
    slide7.addShape(pptx.ShapeType.roundRect, {
      x: 3.5, y: 5.4, w: 6.3, h: 1.3,
      fill: { color: NAVY }
    });
    slide7.addText('Ready to take the next step?', {
      x: 3.5, y: 5.55, w: 6.3, h: 0.4,
      fontSize: 14, fontFace: 'Arial', color: 'ffffff', bold: true, align: 'center'
    });
    slide7.addText('cacbestcompanies@cew.org  ·  cancerandcareers.org', {
      x: 3.5, y: 6.0, w: 6.3, h: 0.4,
      fontSize: 12, fontFace: 'Arial', color: TEAL, align: 'center'
    });
    
    // Generate PPT
    const outB64 = await pptx.write({ outputType: 'base64' });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pptx"`,
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
