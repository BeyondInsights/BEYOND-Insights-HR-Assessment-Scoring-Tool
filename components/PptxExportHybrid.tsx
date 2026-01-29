// components/PptxExportHybrid.tsx
// Hybrid PPTX Export: Screenshots + Editable Text Overlays
// Uses html2canvas for screenshots and PptxGenJS for PowerPoint generation

'use client';

import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';

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

// Color constants matching CAC branding
const COLORS = {
  navy: '1E3A5F',
  teal: '0891B2',
  orange: 'F97316',
  white: 'FFFFFF',
  slate: '475569',
  lightGray: 'F1F5F9',
};

// Helper to capture element as image
async function captureElement(elementId: string): Promise<string | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element ${elementId} not found`);
    return null;
  }
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error(`Failed to capture ${elementId}:`, err);
    return null;
  }
}

// Helper to add editable text box
function addEditableText(
  slide: pptxgen.Slide,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  options: Partial<pptxgen.TextPropsOptions> = {}
) {
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontSize: 12,
    fontFace: 'Arial',
    color: COLORS.slate,
    valign: 'middle',
    ...options,
  });
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
  
  const reportProgress = (step: string, percent: number) => {
    onProgress?.(step, percent);
    console.log(`Export: ${step} (${percent}%)`);
  };

  try {
    // ============ SLIDE 1: Title Slide ============
    reportProgress('Creating title slide...', 5);
    const slide1 = pptx.addSlide();
    slide1.background = { color: COLORS.navy };
    
    // CAC Logo placeholder
    slide1.addText('CANCER AND CAREERS', {
      x: 0.5, y: 0.5, w: 3, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: COLORS.white, bold: true,
    });
    
    // Best Companies badge
    slide1.addText('BEST COMPANIES 2026', {
      x: 0.5, y: 1.2, w: 3, h: 0.4,
      fontSize: 11, fontFace: 'Arial', color: COLORS.teal,
    });
    
    // Main title
    slide1.addText('Best Companies for\nWorking with Cancer', {
      x: 0.5, y: 2.5, w: 6, h: 1.2,
      fontSize: 36, fontFace: 'Arial', color: COLORS.white, bold: true,
    });
    
    slide1.addText('Index Assessment Report', {
      x: 0.5, y: 3.8, w: 6, h: 0.5,
      fontSize: 18, fontFace: 'Arial', color: COLORS.lightGray,
    });
    
    // Company name - EDITABLE
    slide1.addText(config.companyName, {
      x: 0.5, y: 4.5, w: 6, h: 0.6,
      fontSize: 24, fontFace: 'Arial', color: COLORS.orange, bold: true,
    });
    
    // Date
    const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    slide1.addText(reportDate, {
      x: 0.5, y: 5.2, w: 3, h: 0.4,
      fontSize: 14, fontFace: 'Arial', color: COLORS.lightGray,
    });
    
    // ============ SLIDE 2: Executive Summary (Screenshot + Overlays) ============
    reportProgress('Capturing executive summary...', 15);
    
    // Try to capture the score composition section
    const scoreCompImage = await captureElement('score-composition-section');
    const slide2 = pptx.addSlide();
    
    // Header
    slide2.addText('EXECUTIVE SUMMARY', {
      x: 0.3, y: 0.2, w: 2.5, h: 0.3,
      fontSize: 10, fontFace: 'Arial', color: COLORS.teal, bold: true,
    });
    slide2.addText('Your Assessment at a Glance', {
      x: 0.3, y: 0.5, w: 5, h: 0.4,
      fontSize: 20, fontFace: 'Arial', color: COLORS.navy, bold: true,
    });
    
    // Score boxes - EDITABLE
    // Composite Score
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y: 1.2, w: 1.5, h: 1.5,
      fill: { color: COLORS.lightGray },
      line: { color: COLORS.teal, width: 2 },
    });
    slide2.addText(config.compositeScore.toString(), {
      x: 0.5, y: 1.4, w: 1.5, h: 0.8,
      fontSize: 36, fontFace: 'Arial', color: COLORS.navy, bold: true, align: 'center',
    });
    slide2.addText('COMPOSITE\nSCORE', {
      x: 0.5, y: 2.2, w: 1.5, h: 0.5,
      fontSize: 9, fontFace: 'Arial', color: COLORS.slate, align: 'center',
    });
    
    // Benchmark
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 2.2, y: 1.2, w: 1.5, h: 1.5,
      fill: { color: COLORS.lightGray },
    });
    slide2.addText(config.benchmarkScore.toString(), {
      x: 2.2, y: 1.4, w: 1.5, h: 0.8,
      fontSize: 36, fontFace: 'Arial', color: COLORS.slate, bold: true, align: 'center',
    });
    slide2.addText('BENCHMARK\nAVG', {
      x: 2.2, y: 2.2, w: 1.5, h: 0.5,
      fontSize: 9, fontFace: 'Arial', color: COLORS.slate, align: 'center',
    });
    
    // Tier badge
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 4.0, y: 1.2, w: 2, h: 1.5,
      fill: { color: COLORS.orange },
    });
    slide2.addText(config.tier, {
      x: 4.0, y: 1.5, w: 2, h: 0.6,
      fontSize: 18, fontFace: 'Arial', color: COLORS.white, bold: true, align: 'center',
    });
    slide2.addText('Performance Tier', {
      x: 4.0, y: 2.1, w: 2, h: 0.4,
      fontSize: 10, fontFace: 'Arial', color: COLORS.white, align: 'center',
    });
    
    // Score difference
    const scoreDiff = config.compositeScore - config.benchmarkScore;
    const diffText = scoreDiff >= 0 ? `+${scoreDiff} points above benchmark` : `${scoreDiff} points below benchmark`;
    slide2.addText(diffText, {
      x: 0.5, y: 2.9, w: 5.5, h: 0.3,
      fontSize: 12, fontFace: 'Arial', color: scoreDiff >= 0 ? '16A34A' : 'DC2626', bold: true,
    });
    
    // Executive Summary text - EDITABLE
    slide2.addText('Executive Summary', {
      x: 0.5, y: 3.4, w: 5, h: 0.3,
      fontSize: 14, fontFace: 'Arial', color: COLORS.navy, bold: true,
    });
    slide2.addText(config.executiveSummary, {
      x: 0.5, y: 3.8, w: 9, h: 1.2,
      fontSize: 11, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
    });
    
    // Stats row
    const stats = [
      { value: config.dimensions.reduce((s, d) => s + d.strengths.length, 0), label: 'elements offered' },
      { value: config.dimensions.reduce((s, d) => s + d.planning.length, 0), label: 'in development' },
      { value: config.dimensions.reduce((s, d) => s + d.gaps.length, 0), label: 'identified gaps' },
      { value: config.dimensions.filter(d => d.tier.name === 'Leading' || d.tier.name === 'Exemplary').length, label: 'at Leading+' },
    ];
    
    stats.forEach((stat, i) => {
      const xPos = 6.5 + (i % 2) * 1.5;
      const yPos = 1.2 + Math.floor(i / 2) * 1.2;
      slide2.addText(stat.value.toString(), {
        x: xPos, y: yPos, w: 1.3, h: 0.5,
        fontSize: 24, fontFace: 'Arial', color: COLORS.navy, bold: true, align: 'center',
      });
      slide2.addText(stat.label, {
        x: xPos, y: yPos + 0.5, w: 1.3, h: 0.4,
        fontSize: 9, fontFace: 'Arial', color: COLORS.slate, align: 'center',
      });
    });

    // ============ SLIDE 3: Dimension Performance (Screenshot) ============
    reportProgress('Capturing dimension table...', 30);
    const dimTableImage = await captureElement('dimension-performance-table');
    const slide3 = pptx.addSlide();
    
    slide3.addText('PERFORMANCE OVERVIEW', {
      x: 0.3, y: 0.2, w: 3, h: 0.3,
      fontSize: 10, fontFace: 'Arial', color: COLORS.teal, bold: true,
    });
    slide3.addText('Dimension Scorecard', {
      x: 0.3, y: 0.5, w: 5, h: 0.4,
      fontSize: 20, fontFace: 'Arial', color: COLORS.navy, bold: true,
    });
    
    if (dimTableImage) {
      slide3.addImage({
        data: dimTableImage,
        x: 0.3, y: 1.0, w: 9.4, h: 4.2,
      });
    } else {
      // Fallback: Create simple table
      const tableData: pptxgen.TableRow[] = [
        [
          { text: '#', options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white } },
          { text: 'Dimension', options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white } },
          { text: 'Weight', options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white } },
          { text: 'Score', options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white } },
          { text: 'Tier', options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white } },
        ],
        ...config.dimensions.map((d, i) => [
          { text: (i + 1).toString() },
          { text: d.name },
          { text: `${d.weight}%` },
          { text: d.score.toString(), options: { bold: true } },
          { text: d.tier.name },
        ]),
      ];
      
      slide3.addTable(tableData, {
        x: 0.3, y: 1.0, w: 9.4,
        fontSize: 10,
        fontFace: 'Arial',
        border: { type: 'solid', color: 'CCCCCC', pt: 0.5 },
        colW: [0.4, 3.5, 0.8, 0.8, 1.2],
      });
    }

    // ============ SLIDE 4: Strategic Matrix (Screenshot) ============
    reportProgress('Capturing strategic matrix...', 45);
    const matrixImage = await captureElement('strategic-priority-matrix');
    const slide4 = pptx.addSlide();
    
    slide4.addText('STRATEGIC VIEW', {
      x: 0.3, y: 0.2, w: 3, h: 0.3,
      fontSize: 10, fontFace: 'Arial', color: COLORS.teal, bold: true,
    });
    slide4.addText('Performance vs. Strategic Importance', {
      x: 0.3, y: 0.5, w: 6, h: 0.4,
      fontSize: 20, fontFace: 'Arial', color: COLORS.navy, bold: true,
    });
    
    if (matrixImage) {
      slide4.addImage({
        data: matrixImage,
        x: 0.3, y: 1.0, w: 9.4, h: 4.2,
      });
    }

    // ============ SLIDES 5-8: Priority Dimension Deep Dives ============
    const priorityDims = [...config.dimensions]
      .sort((a, b) => a.score - b.score)
      .slice(0, 4);
    
    for (let i = 0; i < priorityDims.length; i++) {
      reportProgress(`Creating dimension ${i + 1} slide...`, 50 + i * 10);
      const dim = priorityDims[i];
      const slide = pptx.addSlide();
      
      // Header bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: 10, h: 0.8,
        fill: { color: COLORS.navy },
      });
      
      slide.addText(`DIMENSION ${dim.dim}`, {
        x: 0.3, y: 0.15, w: 2, h: 0.2,
        fontSize: 9, fontFace: 'Arial', color: COLORS.teal,
      });
      slide.addText(dim.name, {
        x: 0.3, y: 0.35, w: 6, h: 0.4,
        fontSize: 18, fontFace: 'Arial', color: COLORS.white, bold: true,
      });
      
      // Score badge
      slide.addText(dim.score.toString(), {
        x: 8.5, y: 0.15, w: 1, h: 0.5,
        fontSize: 28, fontFace: 'Arial', color: COLORS.white, bold: true, align: 'center',
      });
      slide.addText(dim.tier.name.toUpperCase(), {
        x: 8.2, y: 0.55, w: 1.5, h: 0.2,
        fontSize: 9, fontFace: 'Arial', color: COLORS.orange, align: 'center',
      });
      
      // Three columns: Gaps, In Development, Strengths
      const colWidth = 3.0;
      const colStart = 0.4;
      const colY = 1.1;
      
      // Gaps column
      slide.addShape(pptx.ShapeType.rect, {
        x: colStart, y: colY, w: colWidth, h: 0.4,
        fill: { color: 'FEE2E2' },
      });
      slide.addText(`Improvement Opportunities (${dim.gaps.length})`, {
        x: colStart, y: colY, w: colWidth, h: 0.4,
        fontSize: 11, fontFace: 'Arial', color: 'B91C1C', bold: true, valign: 'middle',
        margin: [0, 0, 0, 10],
      });
      
      const gapsList = dim.gaps.slice(0, 6).map(g => `• ${g.name}`).join('\n');
      slide.addText(gapsList || 'No gaps identified', {
        x: colStart, y: colY + 0.5, w: colWidth, h: 2.5,
        fontSize: 10, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
      });
      
      // Planning column
      slide.addShape(pptx.ShapeType.rect, {
        x: colStart + colWidth + 0.2, y: colY, w: colWidth, h: 0.4,
        fill: { color: 'DBEAFE' },
      });
      slide.addText(`In Development (${dim.planning.length})`, {
        x: colStart + colWidth + 0.2, y: colY, w: colWidth, h: 0.4,
        fontSize: 11, fontFace: 'Arial', color: '1D4ED8', bold: true, valign: 'middle',
        margin: [0, 0, 0, 10],
      });
      
      const planningList = dim.planning.slice(0, 6).map(p => `• ${p.name}`).join('\n');
      slide.addText(planningList || 'No initiatives in planning', {
        x: colStart + colWidth + 0.2, y: colY + 0.5, w: colWidth, h: 2.5,
        fontSize: 10, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
      });
      
      // Strengths column
      slide.addShape(pptx.ShapeType.rect, {
        x: colStart + (colWidth + 0.2) * 2, y: colY, w: colWidth, h: 0.4,
        fill: { color: 'D1FAE5' },
      });
      slide.addText(`Strengths (${dim.strengths.length})`, {
        x: colStart + (colWidth + 0.2) * 2, y: colY, w: colWidth, h: 0.4,
        fontSize: 11, fontFace: 'Arial', color: '047857', bold: true, valign: 'middle',
        margin: [0, 0, 0, 10],
      });
      
      const strengthsList = dim.strengths.slice(0, 6).map(s => `• ${s.name}`).join('\n');
      slide.addText(strengthsList || 'Building toward first strengths', {
        x: colStart + (colWidth + 0.2) * 2, y: colY + 0.5, w: colWidth, h: 2.5,
        fontSize: 10, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
      });
      
      // Strategic Insight - EDITABLE
      slide.addText('STRATEGIC INSIGHT', {
        x: 0.4, y: 3.8, w: 2, h: 0.25,
        fontSize: 9, fontFace: 'Arial', color: COLORS.teal, bold: true,
      });
      
      const insight = config.customInsights[dim.dim]?.insight || 
        `${dim.name} at ${dim.score} points represents an opportunity for focused improvement.`;
      slide.addText(insight, {
        x: 0.4, y: 4.1, w: 4.5, h: 1,
        fontSize: 10, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
      });
      
      // CAC Can Help - EDITABLE
      slide.addText('HOW CAC CAN HELP', {
        x: 5.2, y: 3.8, w: 2.5, h: 0.25,
        fontSize: 9, fontFace: 'Arial', color: COLORS.orange, bold: true,
      });
      
      const cacHelp = config.customInsights[dim.dim]?.cacHelp || 
        'Cancer and Careers offers resources and programs to support improvement in this area.';
      slide.addText(cacHelp, {
        x: 5.2, y: 4.1, w: 4.5, h: 1,
        fontSize: 10, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
      });
    }

    // ============ SLIDE 9: Implementation Roadmap ============
    reportProgress('Creating roadmap slide...', 90);
    const roadmapSlide = pptx.addSlide();
    
    roadmapSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.8,
      fill: { color: COLORS.navy },
    });
    roadmapSlide.addText('ACTION PLAN', {
      x: 0.3, y: 0.15, w: 2, h: 0.2,
      fontSize: 9, fontFace: 'Arial', color: COLORS.teal,
    });
    roadmapSlide.addText('Implementation Roadmap', {
      x: 0.3, y: 0.35, w: 6, h: 0.4,
      fontSize: 18, fontFace: 'Arial', color: COLORS.white, bold: true,
    });
    
    // Three phases
    const phases = [
      { num: '01', title: 'QUICK WINS', time: '0-60 days', color: '16A34A' },
      { num: '02', title: 'FOUNDATION', time: '60-180 days', color: COLORS.teal },
      { num: '03', title: 'EXCELLENCE', time: '180+ days', color: COLORS.orange },
    ];
    
    phases.forEach((phase, i) => {
      const xPos = 0.4 + i * 3.2;
      
      // Phase header
      roadmapSlide.addText(phase.num, {
        x: xPos, y: 1.1, w: 0.6, h: 0.5,
        fontSize: 24, fontFace: 'Arial', color: phase.color, bold: true,
      });
      roadmapSlide.addText(phase.title, {
        x: xPos + 0.7, y: 1.1, w: 2, h: 0.3,
        fontSize: 14, fontFace: 'Arial', color: COLORS.navy, bold: true,
      });
      roadmapSlide.addText(phase.time, {
        x: xPos + 0.7, y: 1.4, w: 2, h: 0.25,
        fontSize: 10, fontFace: 'Arial', color: COLORS.slate,
      });
      
      // Phase items placeholder - EDITABLE
      roadmapSlide.addText('• Item 1\n• Item 2\n• Item 3\n• Item 4', {
        x: xPos, y: 1.8, w: 3, h: 2.5,
        fontSize: 10, fontFace: 'Arial', color: COLORS.slate, valign: 'top',
      });
    });

    // ============ SLIDE 10: Closing ============
    reportProgress('Creating closing slide...', 95);
    const closingSlide = pptx.addSlide();
    closingSlide.background = { color: COLORS.navy };
    
    closingSlide.addText('Your Next Strategic\nAdvantage Starts Here', {
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 32, fontFace: 'Arial', color: COLORS.white, bold: true, align: 'center',
    });
    
    closingSlide.addText('cancerandcareers.org', {
      x: 1, y: 4, w: 8, h: 0.4,
      fontSize: 14, fontFace: 'Arial', color: COLORS.teal, align: 'center',
    });

    // ============ Generate and Download ============
    reportProgress('Generating file...', 98);
    
    const filename = `${config.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pptx`;
    
    await pptx.writeFile({ fileName: filename });
    
    reportProgress('Complete!', 100);
    
  } catch (error) {
    console.error('PPTX Export Error:', error);
    throw error;
  }
}

// Export button component
export function PptxExportButton({
  config,
  className = '',
}: {
  config: ExportConfig;
  className?: string;
}) {
  const [exporting, setExporting] = React.useState(false);
  const [progress, setProgress] = React.useState({ step: '', percent: 0 });
  
  const handleExport = async () => {
    setExporting(true);
    try {
      await exportHybridPptx(config, (step, percent) => {
        setProgress({ step, percent });
      });
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
    setExporting(false);
    setProgress({ step: '', percent: 0 });
  };
  
  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {exporting ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{progress.step || 'Exporting...'}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export PowerPoint</span>
        </>
      )}
    </button>
  );
}

// Need to import React for the component
import React from 'react';
