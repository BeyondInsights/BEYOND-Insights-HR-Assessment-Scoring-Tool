// netlify/functions/export-pdf.js
// Uses jsPDF to generate PDF slides server-side (no Browserless needed)

const { createClient } = require("@supabase/supabase-js");

const DIMENSION_NAMES = {
  1: 'Leave & Flexibility',
  2: 'Insurance & Financial',
  3: 'Manager Preparedness',
  4: 'Navigation',
  5: 'Accommodations',
  6: 'Culture',
  7: 'Career Continuity',
  8: 'Work Continuation',
  9: 'Executive Commitment',
  10: 'Caregiver Support',
  11: 'Prevention & Wellness',
  12: 'Continuous Improvement',
  13: 'Communication'
};

const DIMENSION_WEIGHTS = {
  1: 12, 2: 11, 3: 10, 4: 9, 5: 9, 6: 8, 7: 7, 8: 7, 9: 6, 10: 6, 11: 5, 12: 5, 13: 5
};

function getScoreColor(score) {
  if (score >= 90) return '#5B21B6';
  if (score >= 75) return '#047857';
  if (score >= 60) return '#1D4ED8';
  if (score >= 40) return '#B45309';
  return '#B91C1C';
}

function getTierName(score) {
  if (score >= 90) return 'Exemplary';
  if (score >= 75) return 'Leading';
  if (score >= 60) return 'Progressing';
  if (score >= 40) return 'Emerging';
  return 'Developing';
}

function calculateScores(assessment) {
  const dimensionScores = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (let dim = 1; dim <= 13; dim++) {
    const dimData = assessment[`dimension${dim}_data`];
    const mainGrid = dimData?.[`d${dim}a`];
    
    if (mainGrid && typeof mainGrid === 'object') {
      const entries = Object.entries(mainGrid);
      if (entries.length > 0) {
        let dimTotal = 0;
        entries.forEach(([, status]) => {
          if (status === 'currently_offer' || status === 'yes') dimTotal += 100;
          else if (status === 'planning_12_months') dimTotal += 50;
          else if (status === 'assessing_exploring') dimTotal += 25;
        });
        const score = Math.round(dimTotal / entries.length);
        dimensionScores[dim] = score;
        totalWeightedScore += score * DIMENSION_WEIGHTS[dim];
        totalWeight += DIMENSION_WEIGHTS[dim];
      }
    }
  }

  const weightedDimScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  const compositeScore = Math.round(weightedDimScore * 0.9 + 5 + 5);

  return { compositeScore, weightedDimScore, dimensionScores };
}

exports.handler = async (event) => {
  const surveyId = event.queryStringParameters?.surveyId;

  if (!surveyId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing surveyId parameter' })
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Supabase credentials' })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('survey_id', surveyId)
      .single();

    if (error || !assessment) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Assessment not found' })
      };
    }

    const companyName = assessment.firmographics_data?.company_name || assessment.company_name || 'Company';
    const scores = calculateScores(assessment);
    const tier = getTierName(scores.compositeScore);
    const tierColor = getScoreColor(scores.compositeScore);

    // Dynamic import jsPDF
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [1280, 720]
    });

    const darkBg = '#1E293B';
    const white = '#FFFFFF';
    const gray = '#64748B';
    const lightGray = '#F1F5F9';

    const pointsFromExemplary = Math.max(0, 90 - scores.compositeScore);

    const sortedDims = Object.entries(scores.dimensionScores)
      .map(([dim, score]) => ({ dim: Number(dim), score }))
      .sort((a, b) => b.score - a.score);
    const topStrength = sortedDims[0];
    const topOpportunity = sortedDims[sortedDims.length - 1];

    // SLIDE 1: Title + Executive Summary
    doc.setFillColor(darkBg);
    doc.rect(0, 0, 1280, 100, 'F');
    
    doc.setTextColor(white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('PERFORMANCE ASSESSMENT', 40, 45);
    
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Best Companies for Working with Cancer Index 2026', 40, 75);

    doc.setFontSize(12);
    doc.setTextColor(gray);
    doc.setFont('helvetica', 'normal');
    doc.text('PREPARED FOR', 40, 140);
    
    doc.setFontSize(32);
    doc.setTextColor(darkBg);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 40, 175);

    doc.setFontSize(11);
    doc.setTextColor('#F37021');
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', 40, 220);

    doc.setFontSize(14);
    doc.setTextColor(darkBg);
    doc.setFont('helvetica', 'normal');
    
    const summaryText = `${companyName} demonstrates ${tier.toLowerCase()} performance in supporting employees managing cancer. Your strongest dimension is ${DIMENSION_NAMES[topStrength?.dim || 1]} (${topStrength?.score || 0}). ${DIMENSION_NAMES[topOpportunity?.dim || 1]} (${topOpportunity?.score || 0}) represents your greatest opportunity.`;
    const splitSummary = doc.splitTextToSize(summaryText, 900);
    doc.text(splitSummary, 40, 250);

    if (pointsFromExemplary > 0) {
      doc.setFillColor('#FEF3C7');
      doc.roundedRect(40, 310, 900, 45, 6, 6, 'F');
      doc.setFontSize(13);
      doc.setTextColor('#B45309');
      doc.setFont('helvetica', 'bold');
      doc.text(`${pointsFromExemplary} points from Exemplary tier`, 60, 340);
    }

    // Score box
    doc.setFillColor(lightGray);
    doc.roundedRect(980, 130, 260, 200, 10, 10, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(gray);
    doc.setFont('helvetica', 'normal');
    doc.text('Overall Score', 1110, 170, { align: 'center' });
    
    doc.setFontSize(72);
    doc.setTextColor(tierColor);
    doc.setFont('helvetica', 'bold');
    doc.text(String(scores.compositeScore), 1110, 250, { align: 'center' });
    
    doc.setFillColor(tierColor);
    doc.roundedRect(1030, 280, 160, 36, 18, 18, 'F');
    doc.setFontSize(16);
    doc.setTextColor(white);
    doc.text(tier, 1110, 304, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(gray);
    doc.text('Best Companies for Working with Cancer Index | Confidential', 640, 690, { align: 'center' });

    // SLIDE 2: Dimension Scores
    doc.addPage([1280, 720], 'landscape');
    
    doc.setFillColor(darkBg);
    doc.rect(0, 0, 1280, 80, 'F');
    doc.setTextColor(white);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Dimension Performance', 40, 52);

    let yPos = 120;
    const barWidth = 600;
    const barHeight = 36;
    
    for (let dim = 1; dim <= 13; dim++) {
      const score = scores.dimensionScores[dim] || 0;
      const color = getScoreColor(score);
      
      doc.setFontSize(12);
      doc.setTextColor(darkBg);
      doc.setFont('helvetica', 'bold');
      doc.text(`${dim}. ${DIMENSION_NAMES[dim]}`, 40, yPos + 24);
      
      doc.setFillColor('#E2E8F0');
      doc.roundedRect(300, yPos, barWidth, barHeight, 4, 4, 'F');
      
      if (score > 0) {
        doc.setFillColor(color);
        doc.roundedRect(300, yPos, (score / 100) * barWidth, barHeight, 4, 4, 'F');
      }
      
      doc.setFontSize(14);
      doc.setTextColor(darkBg);
      doc.text(String(score), 920, yPos + 24);
      
      doc.setFontSize(10);
      doc.setTextColor(gray);
      doc.setFont('helvetica', 'normal');
      doc.text(`Weight: ${DIMENSION_WEIGHTS[dim]}%`, 970, yPos + 24);
      
      yPos += 44;
    }

    // SLIDE 3: Strengths & Opportunities
    doc.addPage([1280, 720], 'landscape');
    
    doc.setFillColor(darkBg);
    doc.rect(0, 0, 1280, 80, 'F');
    doc.setTextColor(white);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Strengths & Opportunities', 40, 52);

    const strengths = sortedDims.slice(0, 3);
    const opportunities = sortedDims.slice(-3).reverse();

    doc.setFillColor('#D1FAE5');
    doc.roundedRect(40, 120, 580, 350, 10, 10, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor('#047857');
    doc.setFont('helvetica', 'bold');
    doc.text('Top Strengths', 60, 160);
    
    let sYPos = 200;
    strengths.forEach((s, i) => {
      doc.setFontSize(16);
      doc.setTextColor(darkBg);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${DIMENSION_NAMES[s.dim]}`, 60, sYPos);
      doc.setFontSize(24);
      doc.setTextColor('#047857');
      doc.text(String(s.score), 540, sYPos, { align: 'right' });
      sYPos += 60;
    });

    doc.setFillColor('#FEE2E2');
    doc.roundedRect(660, 120, 580, 350, 10, 10, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor('#B91C1C');
    doc.setFont('helvetica', 'bold');
    doc.text('Key Opportunities', 680, 160);
    
    let oYPos = 200;
    opportunities.forEach((o, i) => {
      doc.setFontSize(16);
      doc.setTextColor(darkBg);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${DIMENSION_NAMES[o.dim]}`, 680, oYPos);
      doc.setFontSize(24);
      doc.setTextColor('#B91C1C');
      doc.text(String(o.score), 1160, oYPos, { align: 'right' });
      oYPos += 60;
    });

    // SLIDE 4: Next Steps
    doc.addPage([1280, 720], 'landscape');
    
    doc.setFillColor(darkBg);
    doc.rect(0, 0, 1280, 80, 'F');
    doc.setTextColor(white);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommended Next Steps', 40, 52);

    const steps = [
      { title: 'Review Dimension Details', desc: 'Explore the interactive report for element-level performance.' },
      { title: 'Prioritize Improvements', desc: 'Focus on high-weight dimensions with improvement potential.' },
      { title: 'Engage Stakeholders', desc: 'Share findings with HR, benefits, and leadership teams.' },
      { title: 'Develop Action Plan', desc: 'Create specific initiatives with timelines and owners.' },
      { title: 'Track Progress', desc: 'Monitor implementation and reassess annually.' }
    ];

    let stepY = 140;
    steps.forEach((step, i) => {
      doc.setFillColor(tierColor);
      doc.circle(70, stepY + 20, 20, 'F');
      doc.setFontSize(16);
      doc.setTextColor(white);
      doc.setFont('helvetica', 'bold');
      doc.text(String(i + 1), 70, stepY + 26, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setTextColor(darkBg);
      doc.text(step.title, 110, stepY + 20);
      
      doc.setFontSize(14);
      doc.setTextColor(gray);
      doc.setFont('helvetica', 'normal');
      doc.text(step.desc, 110, stepY + 45);
      
      stepY += 90;
    });

    // SLIDE 5: How CAC Can Help
    doc.addPage([1280, 720], 'landscape');
    
    doc.setFillColor(darkBg);
    doc.rect(0, 0, 1280, 80, 'F');
    doc.setTextColor(white);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('How Cancer and Careers Can Help', 40, 52);

    doc.setFontSize(16);
    doc.setTextColor(gray);
    doc.setFont('helvetica', 'normal');
    doc.text('Our consulting practice helps organizations understand where they are, identify where they want to be,', 40, 130);
    doc.text('and build a realistic path to get there.', 40, 155);

    doc.setFillColor('#F5F3FF');
    doc.roundedRect(40, 500, 1200, 100, 10, 10, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor('#5B21B6');
    doc.setFont('helvetica', 'bold');
    doc.text('Ready to take the next step?', 60, 545);
    
    doc.setFontSize(16);
    doc.setTextColor('#7C3AED');
    doc.setFont('helvetica', 'normal');
    doc.text('Contact: cacbestcompanies@cew.org', 60, 575);

    const pdfBuffer = doc.output('arraybuffer');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Index_Report.pdf"`,
        'Cache-Control': 'no-cache'
      },
      body: Buffer.from(pdfBuffer).toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error('PDF export error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate PDF', details: err.message })
    };
  }
};
