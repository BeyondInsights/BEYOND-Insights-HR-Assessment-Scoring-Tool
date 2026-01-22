const PptxGenJS = require('pptxgenjs');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// DATA-DRIVEN PPT EXPORT
// Creates professional slides from assessment data
// No screenshots needed - faster and more reliable
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

const DIMENSION_WEIGHTS = { 4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3 };
const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };

function getTier(score) {
  if (score >= 90) return { name: 'Exemplary', color: '7c3aed' };
  if (score >= 75) return { name: 'Leading', color: '059669' };
  if (score >= 60) return { name: 'Progressing', color: '2563eb' };
  if (score >= 40) return { name: 'Emerging', color: 'd97706' };
  return { name: 'Developing', color: 'dc2626' };
}

function statusToPoints(status) {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return POINTS.CURRENTLY_OFFER;
      case 3: return POINTS.PLANNING;
      case 2: return POINTS.ASSESSING;
      case 1: return POINTS.NOT_ABLE;
      default: return null;
    }
  }
  return null;
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
      const pts = statusToPoints(status);
      if (pts !== null) { answered++; earned += pts; }
      else if (status === 5) answered++; // Unsure
    });
    
    if (answered > 0) {
      completedDims++;
      dimensionScores[dim] = Math.round((earned / (answered * 5)) * 100);
    } else {
      dimensionScores[dim] = null;
    }
  }
  
  // Weighted score
  let weightedScore = 0;
  const totalWeight = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
  for (let dim = 1; dim <= 13; dim++) {
    if (dimensionScores[dim] !== null) {
      weightedScore += dimensionScores[dim] * (DIMENSION_WEIGHTS[dim] / totalWeight);
    }
  }
  
  const compositeScore = Math.round(weightedScore * 0.9 + 100 * 0.1); // Simplified
  
  return { dimensionScores, compositeScore, tier: getTier(compositeScore) };
}

exports.handler = async (event) => {
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing surveyId' }) };
    }

    // Get data from Supabase
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
    
    // Sort dimensions by weight
    const sortedDims = Object.entries(DIMENSION_WEIGHTS)
      .sort(([, a], [, b]) => b - a)
      .map(([dim]) => ({
        dim: parseInt(dim),
        name: DIMENSION_NAMES[parseInt(dim)],
        weight: DIMENSION_WEIGHTS[parseInt(dim)],
        score: dimensionScores[parseInt(dim)] || 0,
        tier: getTier(dimensionScores[parseInt(dim)] || 0)
      }));
    
    const strengths = sortedDims.filter(d => d.score >= 75).slice(0, 5);
    const opportunities = sortedDims.filter(d => d.score < 60).slice(0, 5);
    
    // Create PPT
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = `${companyName} - Cancer Support Assessment`;
    pptx.author = 'Cancer and Careers';
    
    // Brand colors
    const NAVY = '1e293b';
    const TEAL = '0d9488';
    const ORANGE = 'f97316';
    const GRAY = '64748b';
    const LIGHT_GRAY = 'f1f5f9';
    
    // ========== SLIDE 1: Title ==========
    const slide1 = pptx.addSlide();
    slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: NAVY } });
    
    slide1.addText('Best Companies for Working with Cancer', {
      x: 0.75, y: 1.5, w: 11.8, h: 0.6,
      fontSize: 14, fontFace: 'Arial', color: 'ffffff', opacity: 70
    });
    
    slide1.addText('Assessment Report 2026', {
      x: 0.75, y: 2.1, w: 11.8, h: 0.8,
      fontSize: 32, fontFace: 'Arial', color: 'ffffff', bold: true
    });
    
    slide1.addText(companyName, {
      x: 0.75, y: 3.2, w: 11.8, h: 0.7,
      fontSize: 28, fontFace: 'Arial', color: TEAL, bold: true
    });
    
    slide1.addText('Prepared by Cancer and Careers', {
      x: 0.75, y: 6.5, w: 11.8, h: 0.4,
      fontSize: 12, fontFace: 'Arial', color: 'ffffff', opacity: 60
    });
    
    // ========== SLIDE 2: Executive Summary ==========
    const slide2 = pptx.addSlide();
    slide2.addText('Executive Summary', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.6,
      fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
    });
    
    // Score box
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y: 1.1, w: 3, h: 2,
      fill: { color: LIGHT_GRAY }, line: { color: 'e2e8f0', width: 1 }
    });
    slide2.addText(String(compositeScore), {
      x: 0.5, y: 1.3, w: 3, h: 1.2,
      fontSize: 56, fontFace: 'Arial', color: tier.color, bold: true, align: 'center'
    });
    slide2.addText('Composite Score', {
      x: 0.5, y: 2.5, w: 3, h: 0.4,
      fontSize: 12, fontFace: 'Arial', color: GRAY, align: 'center'
    });
    
    // Tier badge
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 3.8, y: 1.1, w: 2.2, h: 0.8,
      fill: { color: tier.color }
    });
    slide2.addText(tier.name, {
      x: 3.8, y: 1.1, w: 2.2, h: 0.8,
      fontSize: 18, fontFace: 'Arial', color: 'ffffff', bold: true, align: 'center', valign: 'middle'
    });
    slide2.addText('Performance Tier', {
      x: 3.8, y: 2.0, w: 2.2, h: 0.4,
      fontSize: 10, fontFace: 'Arial', color: GRAY, align: 'center'
    });
    
    // Key stats
    const statsY = 3.5;
    const stats = [
      { label: 'Dimensions Assessed', value: '13' },
      { label: 'At Leading or Above', value: String(sortedDims.filter(d => d.score >= 75).length) },
      { label: 'Growth Opportunities', value: String(sortedDims.filter(d => d.score < 60).length) }
    ];
    
    stats.forEach((stat, i) => {
      const x = 0.5 + (i * 4);
      slide2.addText(stat.value, {
        x, y: statsY, w: 3.5, h: 0.8,
        fontSize: 36, fontFace: 'Arial', color: NAVY, bold: true
      });
      slide2.addText(stat.label, {
        x, y: statsY + 0.8, w: 3.5, h: 0.4,
        fontSize: 12, fontFace: 'Arial', color: GRAY
      });
    });
    
    // Top strength
    if (sortedDims[0]) {
      slide2.addText('Strongest Dimension:', {
        x: 0.5, y: 5.2, w: 12.3, h: 0.4,
        fontSize: 12, fontFace: 'Arial', color: GRAY
      });
      slide2.addText(`${sortedDims.sort((a,b) => b.score - a.score)[0].name} (${sortedDims.sort((a,b) => b.score - a.score)[0].score})`, {
        x: 0.5, y: 5.6, w: 12.3, h: 0.5,
        fontSize: 16, fontFace: 'Arial', color: '059669', bold: true
      });
    }
    
    // ========== SLIDE 3: Dimension Performance ==========
    const slide3 = pptx.addSlide();
    slide3.addText('Dimension Performance', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.6,
      fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
    });
    
    // Table data
    const tableRows = [
      [
        { text: 'Dimension', options: { bold: true, fill: { color: NAVY }, color: 'ffffff' } },
        { text: 'Weight', options: { bold: true, fill: { color: NAVY }, color: 'ffffff', align: 'center' } },
        { text: 'Score', options: { bold: true, fill: { color: NAVY }, color: 'ffffff', align: 'center' } },
        { text: 'Tier', options: { bold: true, fill: { color: NAVY }, color: 'ffffff', align: 'center' } }
      ],
      ...sortedDims.map((d, i) => [
        { text: `D${d.dim}: ${d.name}`, options: { fill: { color: i % 2 === 0 ? 'ffffff' : LIGHT_GRAY } } },
        { text: `${d.weight}%`, options: { align: 'center', fill: { color: i % 2 === 0 ? 'ffffff' : LIGHT_GRAY } } },
        { text: String(d.score), options: { align: 'center', color: d.tier.color, bold: true, fill: { color: i % 2 === 0 ? 'ffffff' : LIGHT_GRAY } } },
        { text: d.tier.name, options: { align: 'center', color: d.tier.color, fill: { color: i % 2 === 0 ? 'ffffff' : LIGHT_GRAY } } }
      ])
    ];
    
    slide3.addTable(tableRows, {
      x: 0.5, y: 1.0, w: 12.3,
      fontSize: 10,
      fontFace: 'Arial',
      border: { type: 'solid', color: 'e2e8f0', pt: 0.5 },
      colW: [5.5, 1.5, 1.5, 2]
    });
    
    // ========== SLIDE 4: Areas of Excellence ==========
    const slide4 = pptx.addSlide();
    slide4.addText('Areas of Excellence', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.6,
      fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
    });
    slide4.addText('Dimensions at Leading or Exemplary level', {
      x: 0.5, y: 0.85, w: 12.3, h: 0.4,
      fontSize: 14, fontFace: 'Arial', color: GRAY
    });
    
    if (strengths.length > 0) {
      strengths.forEach((d, i) => {
        const y = 1.5 + (i * 1.1);
        slide4.addShape(pptx.ShapeType.roundRect, {
          x: 0.5, y, w: 12.3, h: 0.9,
          fill: { color: 'ecfdf5' }, line: { color: '059669', width: 1 }
        });
        slide4.addText(`D${d.dim}`, {
          x: 0.7, y: y + 0.15, w: 0.6, h: 0.6,
          fontSize: 14, fontFace: 'Arial', color: 'ffffff', bold: true, align: 'center', valign: 'middle',
          fill: { color: d.tier.color }
        });
        slide4.addText(d.name, {
          x: 1.5, y: y + 0.15, w: 8, h: 0.6,
          fontSize: 14, fontFace: 'Arial', color: NAVY, bold: true, valign: 'middle'
        });
        slide4.addText(`Score: ${d.score}`, {
          x: 10.5, y: y + 0.15, w: 2, h: 0.6,
          fontSize: 14, fontFace: 'Arial', color: d.tier.color, bold: true, align: 'right', valign: 'middle'
        });
      });
    } else {
      slide4.addText('No dimensions currently at Leading level or above.', {
        x: 0.5, y: 2.5, w: 12.3, h: 0.5,
        fontSize: 14, fontFace: 'Arial', color: GRAY, italic: true
      });
    }
    
    // ========== SLIDE 5: Growth Opportunities ==========
    const slide5 = pptx.addSlide();
    slide5.addText('Growth Opportunities', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.6,
      fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
    });
    slide5.addText('Dimensions with improvement potential', {
      x: 0.5, y: 0.85, w: 12.3, h: 0.4,
      fontSize: 14, fontFace: 'Arial', color: GRAY
    });
    
    if (opportunities.length > 0) {
      opportunities.forEach((d, i) => {
        const y = 1.5 + (i * 1.1);
        slide5.addShape(pptx.ShapeType.roundRect, {
          x: 0.5, y, w: 12.3, h: 0.9,
          fill: { color: 'fef3c7' }, line: { color: 'd97706', width: 1 }
        });
        slide5.addText(`D${d.dim}`, {
          x: 0.7, y: y + 0.15, w: 0.6, h: 0.6,
          fontSize: 14, fontFace: 'Arial', color: 'ffffff', bold: true, align: 'center', valign: 'middle',
          fill: { color: d.tier.color }
        });
        slide5.addText(d.name, {
          x: 1.5, y: y + 0.15, w: 8, h: 0.6,
          fontSize: 14, fontFace: 'Arial', color: NAVY, bold: true, valign: 'middle'
        });
        slide5.addText(`Score: ${d.score}`, {
          x: 10.5, y: y + 0.15, w: 2, h: 0.6,
          fontSize: 14, fontFace: 'Arial', color: d.tier.color, bold: true, align: 'right', valign: 'middle'
        });
      });
    } else {
      slide5.addText('All dimensions performing well!', {
        x: 0.5, y: 2.5, w: 12.3, h: 0.5,
        fontSize: 14, fontFace: 'Arial', color: '059669', italic: true
      });
    }
    
    // ========== SLIDE 6: Next Steps ==========
    const slide6 = pptx.addSlide();
    slide6.addText('How Cancer and Careers Can Help', {
      x: 0.5, y: 0.3, w: 12.3, h: 0.6,
      fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
    });
    
    const services = [
      { title: 'Manager Training', desc: 'Live sessions, toolkits, and conversation guides' },
      { title: 'Policy Assessment', desc: 'Comprehensive review and gap analysis' },
      { title: 'Navigation Design', desc: 'Single entry point and resource mapping' },
      { title: 'Return-to-Work Programs', desc: 'Phased protocols and success metrics' }
    ];
    
    services.forEach((svc, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + (col * 6.3);
      const y = 1.2 + (row * 2.2);
      
      slide6.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 5.9, h: 1.9,
        fill: { color: LIGHT_GRAY }, line: { color: 'e2e8f0', width: 1 }
      });
      slide6.addText(svc.title, {
        x: x + 0.3, y: y + 0.3, w: 5.3, h: 0.5,
        fontSize: 16, fontFace: 'Arial', color: NAVY, bold: true
      });
      slide6.addText(svc.desc, {
        x: x + 0.3, y: y + 0.9, w: 5.3, h: 0.7,
        fontSize: 12, fontFace: 'Arial', color: GRAY
      });
    });
    
    slide6.addText('Contact: cacbestcompanies@cew.org', {
      x: 0.5, y: 6.2, w: 12.3, h: 0.4,
      fontSize: 14, fontFace: 'Arial', color: TEAL, bold: true, align: 'center'
    });
    slide6.addText('cancerandcareers.org', {
      x: 0.5, y: 6.6, w: 12.3, h: 0.4,
      fontSize: 12, fontFace: 'Arial', color: GRAY, align: 'center'
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
