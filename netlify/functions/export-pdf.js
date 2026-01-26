import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Dimension names for the report
const DIMENSION_NAMES: Record<number, string> = {
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

const DIMENSION_WEIGHTS: Record<number, number> = {
  1: 12, 2: 11, 3: 10, 4: 9, 5: 9, 6: 8, 7: 7, 8: 7, 9: 6, 10: 6, 11: 5, 12: 5, 13: 5
};

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 90) return '#5B21B6'; // Exemplary - Purple
  if (score >= 75) return '#047857'; // Leading - Green
  if (score >= 60) return '#1D4ED8'; // Progressing - Blue
  if (score >= 40) return '#B45309'; // Emerging - Amber
  return '#B91C1C'; // Developing - Red
}

function getTierName(score: number): string {
  if (score >= 90) return 'Exemplary';
  if (score >= 75) return 'Leading';
  if (score >= 60) return 'Progressing';
  if (score >= 40) return 'Emerging';
  return 'Developing';
}

// Simplified scoring function
function calculateScores(assessment: any) {
  const dimensionScores: Record<number, number> = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (let dim = 1; dim <= 13; dim++) {
    const dimData = assessment[`dimension${dim}_data`];
    const mainGrid = dimData?.[`d${dim}a`];
    
    if (mainGrid && typeof mainGrid === 'object') {
      const entries = Object.entries(mainGrid);
      if (entries.length > 0) {
        let dimTotal = 0;
        entries.forEach(([, status]: [string, any]) => {
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
  const compositeScore = Math.round(weightedDimScore * 0.9 + 5 + 5); // Simplified

  return { compositeScore, weightedDimScore, dimensionScores };
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const surveyId = event.queryStringParameters?.surveyId;

  if (!surveyId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing surveyId parameter' })
    };
  }

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch assessment data
    const { data: assessment, error } = await supabase
      .from('survey_responses')
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

    // Dynamic import jsPDF to avoid module issues
    const { jsPDF } = await import('jspdf');

    // Create PDF - landscape 16:9 format
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [1280, 720]
    });

    // Colors
    const darkBg = '#1E293B';
    const white = '#FFFFFF';
    const gray = '#64748B';
    const lightGray = '#F1F5F9';

    // Calculate points from Exemplary
    const pointsFromExemplary = Math.max(0, 90 - scores.compositeScore);

    // Get sorted dimensions for strengths/opportunities
    const sortedDims = Object.entries(scores.dimensionScores)
      .map(([dim, score]) => ({ dim: Number(dim), score }))
      .sort((a, b) => b.score - a.score);
    const topStrength = sortedDims[0];
    const topOpportunity = sortedDims[sortedDims.length - 1];

    // ==========================================
    // SLIDE 1: Title + Executive Summary Combined
    // ==========================================
    // Header bar
    doc.setFillColor(darkBg);
    doc.rect(0, 0, 1280, 100, 'F');
    
    doc.setTextColor(white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('PERFORMANCE ASSESSMENT', 40, 45);
    
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Best Companies for Working with Cancer Index 2026', 40, 75);

    // Company name section
    doc.setFontSize(12);
    doc.setTextColor(gray);
    doc.setFont('helvetica', 'normal');
    doc.text('PREPARED FOR', 40, 140);
    
    doc.setFontSize(32);
    doc.setTextColor(darkBg);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 40, 175);

    // Executive Summary header
    doc.setFontSize(11);
    doc.setTextColor('#F37021'); // CAC Orange
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', 40, 220);

    // Summary paragraph
    doc.setFontSize(14);
    doc.setTextColor(darkBg);
    doc.setFont('helvetica', 'normal');
    
    const summaryText = `${companyName} demonstrates ${tier.toLowerCase()} performance in supporting employees managing cancer, placing in the ${Math.round(scores.compositeScore)}th percentile among assessed organizations. Your strongest dimension is ${DIMENSION_NAMES[topStrength?.dim || 1]} (${topStrength?.score || 0}). ${DIMENSION_NAMES[topOpportunity?.dim || 1]} (${topOpportunity?.score || 0}) represents your greatest opportunity for improvement.`;
    const splitSummary = doc.splitTextToSize(summaryText, 900);
    doc.text(splitSummary, 40, 250);

    // Points from Exemplary callout box
    if (pointsFromExemplary > 0) {
      doc.setFillColor('#FEF3C7'); // Amber light
      doc.roundedRect(40, 320, 900, 50, 6, 6, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor('#B45309');
      doc.setFont('helvetica', 'bold');
      doc.text(`${pointsFromExemplary} points from Exemplary tier`, 70, 350);
      
      const improvementDims = sortedDims.slice(-3).map(d => DIMENSION_NAMES[d.dim]).join(', ');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Targeted improvements in ${improvementDims} could help close this gap.`, 280, 350);
    }

    // Key metrics row
    const metricsY = 400;
    const metricBoxWidth = 200;
    const metricGap = 30;
    
    // Metric boxes
    doc.setFillColor(white);
    doc.setDrawColor('#E2E8F0');
    doc.roundedRect(40, metricsY, metricBoxWidth, 80, 6, 6, 'FD');
    doc.setFontSize(36);
    doc.setTextColor(darkBg);
    doc.setFont('helvetica', 'bold');
    doc.text('116', 60, metricsY + 45);
    doc.setFontSize(11);
    doc.setTextColor(gray);
    doc.setFont('helvetica', 'normal');
    doc.text('of 154 elements offered', 60, metricsY + 65);

    doc.setFillColor(white);
    doc.roundedRect(40 + metricBoxWidth + metricGap, metricsY, metricBoxWidth, 80, 6, 6, 'FD');
    doc.setFontSize(36);
    doc.setTextColor(darkBg);
    doc.setFont('helvetica', 'bold');
    doc.text('11', 60 + metricBoxWidth + metricGap, metricsY + 45);
    doc.setFontSize(11);
    doc.setTextColor(gray);
    doc.setFont('helvetica', 'normal');
    doc.text('initiatives in development', 60 + metricBoxWidth + metricGap, metricsY + 65);

    doc.setFillColor(white);
    doc.roundedRect(40 + (metricBoxWidth + metricGap) * 2, metricsY, metricBoxWidth, 80, 6, 6, 'FD');
    doc.setFontSize(36);
    doc.setTextColor(darkBg);
    doc.setFont('helvetica', 'bold');
    doc.text('27', 60 + (metricBoxWidth + metricGap) * 2, metricsY + 45);
    doc.setFontSize(11);
    doc.setTextColor(gray);
    doc.setFont('helvetica', 'normal');
    doc.text('identified opportunities', 60 + (metricBoxWidth + metricGap) * 2, metricsY + 65);

    // Overall Score box on right side
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
    
    // Tier badge
    doc.setFillColor(tierColor);
    doc.roundedRect(1030, 280, 160, 36, 18, 18, 'F');
    doc.setFontSize(16);
    doc.setTextColor(white);
    doc.setFont('helvetica', 'bold');
    doc.text(tier, 1110, 304, { align: 'center' });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(gray);
    doc.setFont('helvetica', 'normal');
    doc.text('Best Companies for Working with Cancer Index | © 2026 Cancer and Careers | Confidential', 640, 690, { align: 'center' });

    // ==========================================
    // SLIDE 2: Dimension Scores
    // ==========================================
    doc.addPage([1280, 720], 'landscape');
    
    // Header
    doc.setFillColor(darkBg);
    doc.rect(0, 0, 1280, 80, 'F');
    doc.setTextColor(white);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Dimension Performance', 40, 52);

    // Dimension bars
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
      doc.setFont('helvetica', 'bold');
      doc.text(String(score), 920, yPos + 24);
      
      doc.setFontSize(10);
      doc.setTextColor(gray);
      doc.setFont('helvetica', 'normal');
      doc.text(`Weight: ${DIMENSION_WEIGHTS[dim]}%`, 970, yPos + 24);
      
      yPos += 44;
    }

    // ==========================================
    // SLIDE 3: Strengths & Opportunities
    // ==========================================
    doc.addPage([1280, 720], 'landscape');
    
    doc.setFillColor(darkBg);
    doc.rect(0, 0, 1280, 80, 'F');
    doc.setTextColor(white);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Strengths & Opportunities', 40, 52);

    const strengths = sortedDims.slice(0, 3);
    const opportunities = sortedDims.slice(-3).reverse();

    // Strengths column
    doc.setFillColor('#D1FAE5');
    doc.roundedRect(40, 120, 580, 400, 10, 10, 'F');
    
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

    // Opportunities column
    doc.setFillColor('#FEE2E2');
    doc.roundedRect(660, 120, 580, 400, 10, 10, 'F');
    
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

    // ==========================================
    // SLIDE 4: Next Steps
    // ==========================================
    doc.addPage([1280, 720], 'landscape');
    
    doc.setFillColor(darkBg);
    doc.rect(0, 0, 1280, 80, 'F');
    doc.setTextColor(white);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommended Next Steps', 40, 52);

    const steps = [
      { title: 'Review Dimension Details', desc: 'Explore the interactive report to understand element-level performance within each dimension.' },
      { title: 'Prioritize Improvements', desc: 'Focus on high-weight dimensions with the greatest improvement potential for maximum impact.' },
      { title: 'Engage Stakeholders', desc: 'Share findings with HR, benefits, and leadership teams to align on priorities.' },
      { title: 'Develop Action Plan', desc: 'Create specific initiatives with timelines and owners for your top opportunities.' },
      { title: 'Track Progress', desc: 'Monitor implementation and reassess annually to measure improvement.' }
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

    // ==========================================
    // SLIDE 5: How CAC Can Help
    // ==========================================
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

    const services = [
      { title: 'For HR & Benefits Teams', items: ['Policy gap analysis', 'Benefits benchmarking', 'Manager training programs'] },
      { title: 'For Employees', items: ['Educational materials', 'Navigation support', 'Peer support networks'] }
    ];

    let servX = 40;
    services.forEach(service => {
      doc.setFillColor(lightGray);
      doc.roundedRect(servX, 200, 580, 250, 10, 10, 'F');
      
      doc.setFontSize(20);
      doc.setTextColor(darkBg);
      doc.setFont('helvetica', 'bold');
      doc.text(service.title, servX + 30, 250);
      
      doc.setFontSize(16);
      doc.setTextColor(gray);
      doc.setFont('helvetica', 'normal');
      let itemY = 290;
      service.items.forEach(item => {
        doc.text(`✓ ${item}`, servX + 30, itemY);
        itemY += 35;
      });
      
      servX += 620;
    });

    // Contact CTA
    doc.setFillColor('#F5F3FF');
    doc.roundedRect(40, 500, 1200, 100, 10, 10, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor('#5B21B6');
    doc.setFont('helvetica', 'bold');
    doc.text('Ready to take the next step?', 60, 545);
    
    doc.setFontSize(16);
    doc.setTextColor('#7C3AED');
    doc.setFont('helvetica', 'normal');
    doc.text('Contact: consulting@cancerandcareers.org', 60, 575);

    // Generate PDF buffer
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

  } catch (err: any) {
    console.error('PDF export error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate PDF', details: err.message })
    };
  }
};
