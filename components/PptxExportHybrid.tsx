// components/PptxExportHybrid.tsx
// Screenshot-based PPTX Export: Captures HTML sections as images with editable text overlays

'use client';

import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';
import React from 'react';

// Types
interface DimensionData {
  dim: number;
  name: string;
  weight: number;
  score: number;
  benchmark: number | null;
  tier: { name: string; color: string };
  strengths: Array<{ name: string }>;
  planning: Array<{ name: string }>;
  gaps: Array<{ name: string }>;
}

interface ExportConfig {
  companyName: string;
  compositeScore: number;
  benchmarkScore: number;
  weightedDimScore: number;
  maturityScore: number;
  breadthScore: number;
  tier: string;
  executiveSummary: string;
  dimensions: DimensionData[];
  customInsights: Record<number, { insight: string; cacHelp: string }>;
}

// CAC brand colors
const COLORS = {
  navy: '1E3A5F',
  teal: '0891B2',
  orange: 'F97316',
  white: 'FFFFFF',
  slate: '475569',
  lightGray: 'F1F5F9',
};

// Capture an element as a base64 PNG image
async function captureElementAsImage(elementId: string): Promise<string | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[PPTX Export] Element not found: ${elementId}`);
    return null;
  }

  try {
    // Scroll element into view first
    element.scrollIntoView({ behavior: 'instant', block: 'start' });
    
    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    console.log(`[PPTX Export] Captured ${elementId}: ${dataUrl.length} bytes`);
    return dataUrl;
  } catch (err) {
    console.error(`[PPTX Export] Failed to capture ${elementId}:`, err);
    return null;
  }
}

// Calculate image dimensions to fit slide while maintaining aspect ratio
function fitImageToSlide(
  imgWidth: number, 
  imgHeight: number, 
  maxWidth: number = 9.5, 
  maxHeight: number = 5.0,
  marginTop: number = 0.8
): { x: number; y: number; w: number; h: number } {
  const aspectRatio = imgWidth / imgHeight;
  let w = maxWidth;
  let h = w / aspectRatio;
  
  if (h > maxHeight) {
    h = maxHeight;
    w = h * aspectRatio;
  }
  
  // Center horizontally
  const x = (10 - w) / 2;
  const y = marginTop;
  
  return { x, y, w, h };
}

export async function exportHybridPptx(
  config: ExportConfig,
  onProgress?: (step: string, percent: number) => void
): Promise<void> {
  const pptx = new pptxgen();
  
  // Set presentation properties
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = `${config.companyName} - Best Companies Report`;
  pptx.author = 'Cancer and Careers';
  pptx.company = 'Cancer and Careers';
  
  const report = (step: string, percent: number) => {
    onProgress?.(step, percent);
    console.log(`[PPTX Export] ${step} (${percent}%)`);
  };

  try {
    // ============ SLIDE 1: Title Slide ============
    report('Creating title slide...', 5);
    const slide1 = pptx.addSlide();
    slide1.background = { color: COLORS.navy };
    
    // CAC Logo area
    slide1.addText('CANCER AND CAREERS', {
      x: 0.5, y: 0.5, w: 4, h: 0.4,
      fontSize: 12, fontFace: 'Arial', color: COLORS.white, bold: true,
    });
    
    slide1.addText('BEST COMPANIES 2026', {
      x: 0.5, y: 1.0, w: 3, h: 0.3,
      fontSize: 10, fontFace: 'Arial', color: COLORS.teal,
    });
    
    // Main title
    slide1.addText('Best Companies for\nWorking with Cancer', {
      x: 0.5, y: 2.2, w: 7, h: 1.4,
      fontSize: 40, fontFace: 'Arial', color: COLORS.white, bold: true,
      lineSpacing: 48,
    });
    
    slide1.addText('Index Assessment Report', {
      x: 0.5, y: 3.7, w: 6, h: 0.5,
      fontSize: 20, fontFace: 'Arial', color: COLORS.lightGray,
    });
    
    // Company name - EDITABLE
    slide1.addText(config.companyName, {
      x: 0.5, y: 4.4, w: 7, h: 0.7,
      fontSize: 28, fontFace: 'Arial', color: COLORS.orange, bold: true,
    });
    
    // Date
    const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    slide1.addText(reportDate, {
      x: 0.5, y: 5.2, w: 3, h: 0.4,
      fontSize: 14, fontFace: 'Arial', color: COLORS.lightGray,
    });

    // ============ SLIDE 2: Executive Summary (Screenshot) ============
    report('Capturing Executive Summary...', 15);
    
    // Try to capture the hero/executive summary section
    const heroImage = await captureElementAsImage('report-hero-section');
    const slide2 = pptx.addSlide();
    
    if (heroImage) {
      // Add screenshot as background
      slide2.addImage({
        data: heroImage,
        x: 0.25, y: 0.25, w: 9.5, h: 5.3,
      });
      
      // Add editable text overlay for executive summary (positioned at bottom)
      slide2.addText('Executive Summary (editable):', {
        x: 0.3, y: 4.0, w: 9.4, h: 0.3,
        fontSize: 10, fontFace: 'Arial', color: COLORS.teal, bold: true,
      });
      slide2.addText(config.executiveSummary, {
        x: 0.3, y: 4.3, w: 9.4, h: 1.0,
        fontSize: 9, fontFace: 'Arial', color: COLORS.slate,
        valign: 'top',
      });
    } else {
      // Fallback: Create programmatic executive summary
      slide2.addText('EXECUTIVE SUMMARY', {
        x: 0.3, y: 0.2, w: 3, h: 0.3,
        fontSize: 10, fontFace: 'Arial', color: COLORS.teal, bold: true,
      });
      slide2.addText('Your Assessment at a Glance', {
        x: 0.3, y: 0.5, w: 6, h: 0.5,
        fontSize: 24, fontFace: 'Arial', color: COLORS.navy, bold: true,
      });
      
      // Score boxes
      slide2.addShape(pptx.ShapeType.roundRect, {
        x: 0.5, y: 1.2, w: 1.8, h: 1.6,
        fill: { color: COLORS.lightGray },
        line: { color: COLORS.teal, width: 2 },
      });
      slide2.addText(config.compositeScore.toString(), {
        x: 0.5, y: 1.35, w: 1.8, h: 0.9,
        fontSize: 44, fontFace: 'Arial', color: COLORS.navy, bold: true, align: 'center',
      });
      slide2.addText('COMPOSITE\nSCORE', {
        x: 0.5, y: 2.25, w: 1.8, h: 0.5,
        fontSize: 9, fontFace: 'Arial', color: COLORS.slate, align: 'center',
      });
      
      // Benchmark
      slide2.addShape(pptx.ShapeType.roundRect, {
        x: 2.5, y: 1.2, w: 1.8, h: 1.6,
        fill: { color: COLORS.lightGray },
      });
      slide2.addText(config.benchmarkScore.toString(), {
        x: 2.5, y: 1.35, w: 1.8, h: 0.9,
        fontSize: 44, fontFace: 'Arial', color: COLORS.slate, bold: true, align: 'center',
      });
      slide2.addText('BENCHMARK\nAVG', {
        x: 2.5, y: 2.25, w: 1.8, h: 0.5,
        fontSize: 9, fontFace: 'Arial', color: COLORS.slate, align: 'center',
      });
      
      // Tier
      slide2.addShape(pptx.ShapeType.roundRect, {
        x: 4.5, y: 1.2, w: 2.2, h: 1.6,
        fill: { color: COLORS.orange },
      });
      slide2.addText(config.tier, {
        x: 4.5, y: 1.5, w: 2.2, h: 0.7,
        fontSize: 22, fontFace: 'Arial', color: COLORS.white, bold: true, align: 'center',
      });
      slide2.addText('Performance Tier', {
        x: 4.5, y: 2.2, w: 2.2, h: 0.4,
        fontSize: 10, fontFace: 'Arial', color: COLORS.white, align: 'center',
      });
      
      // Executive summary text
      slide2.addText('Executive Summary', {
        x: 0.5, y: 3.2, w: 6, h: 0.4,
        fontSize: 14, fontFace: 'Arial', color: COLORS.navy, bold: true,
      });
      slide2.addText(config.executiveSummary, {
        x: 0.5, y: 3.7, w: 9, h: 1.5,
        fontSize: 11, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
      });
    }

    // ============ SLIDE 3: Score Composition (Screenshot) ============
    report('Capturing Score Composition...', 25);
    const scoreCompImage = await captureElementAsImage('score-composition-section');
    const slide3 = pptx.addSlide();
    
    if (scoreCompImage) {
      slide3.addImage({
        data: scoreCompImage,
        x: 0.25, y: 0.25, w: 9.5, h: 5.0,
      });
    } else {
      slide3.addText('Score Composition', {
        x: 0.5, y: 0.5, w: 6, h: 0.5,
        fontSize: 24, fontFace: 'Arial', color: COLORS.navy, bold: true,
      });
      slide3.addText('Screenshot capture failed - section may not be visible', {
        x: 0.5, y: 1.5, w: 9, h: 0.5,
        fontSize: 12, fontFace: 'Arial', color: 'CC0000',
      });
    }

    // ============ SLIDE 4: Dimension Performance Table (Screenshot) ============
    report('Capturing Dimension Table...', 35);
    const dimTableImage = await captureElementAsImage('dimension-performance-table');
    const slide4 = pptx.addSlide();
    
    if (dimTableImage) {
      slide4.addImage({
        data: dimTableImage,
        x: 0.15, y: 0.15, w: 9.7, h: 5.2,
      });
    } else {
      // Fallback: Create a simple table
      slide4.addText('PERFORMANCE OVERVIEW', {
        x: 0.3, y: 0.2, w: 3, h: 0.3,
        fontSize: 10, fontFace: 'Arial', color: COLORS.teal, bold: true,
      });
      slide4.addText('Dimension Scorecard', {
        x: 0.3, y: 0.5, w: 6, h: 0.5,
        fontSize: 24, fontFace: 'Arial', color: COLORS.navy, bold: true,
      });
      
      const tableRows: pptxgen.TableRow[] = [
        [
          { text: '#', options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white, fontSize: 9 } },
          { text: 'Dimension', options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white, fontSize: 9 } },
          { text: 'Wt', options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white, fontSize: 9 } },
          { text: 'Score', options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white, fontSize: 9 } },
          { text: 'Tier', options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white, fontSize: 9 } },
        ],
        ...config.dimensions
          .sort((a, b) => b.weight - a.weight)
          .map((d, i) => [
            { text: (i + 1).toString(), options: { fontSize: 9 } },
            { text: d.name, options: { fontSize: 9 } },
            { text: `${d.weight}%`, options: { fontSize: 9 } },
            { text: d.score.toString(), options: { bold: true, fontSize: 9 } },
            { text: d.tier.name, options: { fontSize: 9 } },
          ]),
      ];
      
      slide4.addTable(tableRows, {
        x: 0.3, y: 1.1, w: 9.4,
        fontSize: 9,
        fontFace: 'Arial',
        border: { type: 'solid', color: 'CCCCCC', pt: 0.5 },
        colW: [0.4, 3.8, 0.6, 0.7, 1.2],
      });
    }

    // ============ SLIDE 5: Strategic Priority Matrix (Screenshot) ============
    report('Capturing Strategic Matrix...', 45);
    const matrixImage = await captureElementAsImage('strategic-priority-matrix');
    const slide5 = pptx.addSlide();
    
    if (matrixImage) {
      slide5.addImage({
        data: matrixImage,
        x: 0.15, y: 0.15, w: 9.7, h: 5.2,
      });
    } else {
      slide5.addText('STRATEGIC VIEW', {
        x: 0.3, y: 0.2, w: 3, h: 0.3,
        fontSize: 10, fontFace: 'Arial', color: COLORS.teal, bold: true,
      });
      slide5.addText('Performance vs. Strategic Importance', {
        x: 0.3, y: 0.5, w: 6, h: 0.5,
        fontSize: 24, fontFace: 'Arial', color: COLORS.navy, bold: true,
      });
      slide5.addText('Screenshot capture failed - chart may not be visible', {
        x: 0.5, y: 1.5, w: 9, h: 0.5,
        fontSize: 12, fontFace: 'Arial', color: 'CC0000',
      });
    }

    // ============ SLIDES 6-9: Priority Dimension Deep Dives (Screenshots) ============
    // Get bottom 4 dimensions (biggest opportunities)
    const priorityDims = [...config.dimensions]
      .sort((a, b) => a.score - b.score)
      .slice(0, 4);
    
    for (let i = 0; i < priorityDims.length; i++) {
      const dim = priorityDims[i];
      report(`Capturing Dimension ${dim.dim} detail...`, 50 + i * 10);
      
      // Try to capture the dimension card from Strategic Recommendations section
      const dimCardImage = await captureElementAsImage(`dimension-card-${dim.dim}`);
      const slide = pptx.addSlide();
      
      // Header bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: 10, h: 0.7,
        fill: { color: COLORS.navy },
      });
      
      slide.addText(`DIMENSION ${dim.dim}`, {
        x: 0.3, y: 0.1, w: 2, h: 0.2,
        fontSize: 9, fontFace: 'Arial', color: COLORS.teal,
      });
      slide.addText(dim.name, {
        x: 0.3, y: 0.3, w: 7, h: 0.35,
        fontSize: 18, fontFace: 'Arial', color: COLORS.white, bold: true,
      });
      
      // Score badge
      slide.addText(dim.score.toString(), {
        x: 8.8, y: 0.1, w: 1, h: 0.4,
        fontSize: 24, fontFace: 'Arial', color: COLORS.white, bold: true, align: 'center',
      });
      slide.addText(dim.tier.name.toUpperCase(), {
        x: 8.5, y: 0.45, w: 1.5, h: 0.2,
        fontSize: 8, fontFace: 'Arial', color: COLORS.orange, align: 'center',
      });
      
      if (dimCardImage) {
        // Add screenshot below header
        slide.addImage({
          data: dimCardImage,
          x: 0.15, y: 0.8, w: 9.7, h: 4.5,
        });
      } else {
        // Fallback: Create three-column layout
        const colW = 3.0;
        const colX = 0.35;
        const colY = 0.9;
        
        // Gaps column
        slide.addShape(pptx.ShapeType.rect, {
          x: colX, y: colY, w: colW, h: 0.35,
          fill: { color: 'FEE2E2' },
        });
        slide.addText(`Improvement Opportunities (${dim.gaps.length})`, {
          x: colX, y: colY, w: colW, h: 0.35,
          fontSize: 10, fontFace: 'Arial', color: 'B91C1C', bold: true, valign: 'middle',
        });
        slide.addText(dim.gaps.slice(0, 8).map(g => `• ${g.name}`).join('\n') || 'No gaps identified', {
          x: colX, y: colY + 0.4, w: colW, h: 2.5,
          fontSize: 9, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
        });
        
        // Planning column
        slide.addShape(pptx.ShapeType.rect, {
          x: colX + colW + 0.15, y: colY, w: colW, h: 0.35,
          fill: { color: 'DBEAFE' },
        });
        slide.addText(`In Development (${dim.planning.length})`, {
          x: colX + colW + 0.15, y: colY, w: colW, h: 0.35,
          fontSize: 10, fontFace: 'Arial', color: '1D4ED8', bold: true, valign: 'middle',
        });
        slide.addText(dim.planning.slice(0, 8).map(p => `• ${p.name}`).join('\n') || 'No initiatives in planning', {
          x: colX + colW + 0.15, y: colY + 0.4, w: colW, h: 2.5,
          fontSize: 9, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
        });
        
        // Strengths column
        slide.addShape(pptx.ShapeType.rect, {
          x: colX + (colW + 0.15) * 2, y: colY, w: colW, h: 0.35,
          fill: { color: 'D1FAE5' },
        });
        slide.addText(`Strengths (${dim.strengths.length})`, {
          x: colX + (colW + 0.15) * 2, y: colY, w: colW, h: 0.35,
          fontSize: 10, fontFace: 'Arial', color: '047857', bold: true, valign: 'middle',
        });
        slide.addText(dim.strengths.slice(0, 8).map(s => `• ${s.name}`).join('\n') || 'Building toward strengths', {
          x: colX + (colW + 0.15) * 2, y: colY + 0.4, w: colW, h: 2.5,
          fontSize: 9, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
        });
      }
      
      // Strategic Insight - EDITABLE (always show this)
      slide.addText('STRATEGIC INSIGHT (editable)', {
        x: 0.35, y: 3.7, w: 4, h: 0.25,
        fontSize: 9, fontFace: 'Arial', color: COLORS.teal, bold: true,
      });
      const insight = config.customInsights[dim.dim]?.insight || 
        `${dim.name} at ${dim.score} points represents an opportunity for focused improvement.`;
      slide.addText(insight, {
        x: 0.35, y: 3.95, w: 4.4, h: 1.2,
        fontSize: 9, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
      });
      
      // CAC Can Help - EDITABLE
      slide.addText('HOW CAC CAN HELP (editable)', {
        x: 5.0, y: 3.7, w: 4, h: 0.25,
        fontSize: 9, fontFace: 'Arial', color: COLORS.orange, bold: true,
      });
      const cacHelp = config.customInsights[dim.dim]?.cacHelp || 
        'Cancer and Careers offers resources and programs to support improvement in this area.';
      slide.addText(cacHelp, {
        x: 5.0, y: 3.95, w: 4.6, h: 1.2,
        fontSize: 9, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
      });
    }

    // ============ SLIDE 10: Closing ============
    report('Creating closing slide...', 95);
    const closingSlide = pptx.addSlide();
    closingSlide.background = { color: COLORS.navy };
    
    closingSlide.addText("LET'S CONNECT", {
      x: 1, y: 1.5, w: 8, h: 0.4,
      fontSize: 12, fontFace: 'Arial', color: COLORS.teal, align: 'center',
    });
    
    closingSlide.addText('Your Next Strategic\nAdvantage Starts Here', {
      x: 1, y: 2.0, w: 8, h: 1.5,
      fontSize: 36, fontFace: 'Arial', color: COLORS.white, bold: true, align: 'center',
      lineSpacing: 44,
    });
    
    closingSlide.addText('cancerandcareers.org', {
      x: 1, y: 4.2, w: 8, h: 0.4,
      fontSize: 16, fontFace: 'Arial', color: COLORS.teal, align: 'center',
    });

    // ============ Generate and Download ============
    report('Generating file...', 98);
    
    const filename = `${config.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pptx`;
    
    await pptx.writeFile({ fileName: filename });
    
    report('Complete!', 100);
    
  } catch (error) {
    console.error('[PPTX Export] Error:', error);
    throw error;
  }
}
