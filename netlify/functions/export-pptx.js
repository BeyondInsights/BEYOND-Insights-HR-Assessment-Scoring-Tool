const PptxGenJS = require('pptxgenjs');

// ============================================
// SCREENSHOT-BASED PPT EXPORT
// Parallel screenshots for speed
// ============================================

exports.handler = async (event) => {
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing surveyId' }) };
    }

    const browserlessToken = process.env.BROWSERLESS_TOKEN;
    const browserlessBase = process.env.BROWSERLESS_BASE || 'https://production-sfo.browserless.io';
    
    if (!browserlessToken) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing BROWSERLESS_TOKEN' }) };
    }

    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${host}`;
    
    const reportUrl = `${origin}/export/reports/${encodeURIComponent(surveyId)}?export=1`;
    
    console.log('Generating PPT from:', reportUrl);
    
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Cancer Support Assessment Report';
    pptx.author = 'Cancer and Careers';
    
    const SLIDE_WIDTH = 1200;
    
    // Key sections - 6 slides covering the essential content
    const sections = [
      { name: 'Executive Summary', y: 0, h: 1000 },
      { name: 'Dimension Performance', y: 1550, h: 800 },
      { name: 'Strategic Matrix', y: 2300, h: 800 },
      { name: 'Excellence & Growth', y: 3050, h: 900 },
      { name: 'Implementation Roadmap', y: 6900, h: 700 },
      { name: 'How CAC Can Help', y: 7550, h: 700 },
    ];
    
    // Helper function to capture a section
    const captureSection = async (section) => {
      try {
        const res = await fetch(`${browserlessBase}/screenshot?token=${browserlessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: reportUrl,
            options: {
              type: 'png',
              fullPage: true,
              clip: { x: 0, y: section.y, width: SLIDE_WIDTH, height: section.h }
            },
            gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 },
            viewport: { width: SLIDE_WIDTH, height: 800 }
          })
        });
        
        if (!res.ok) {
          console.error(`Failed: ${section.name}`);
          return null;
        }
        
        return {
          name: section.name,
          h: section.h,
          imgB64: Buffer.from(await res.arrayBuffer()).toString('base64')
        };
      } catch (err) {
        console.error(`Error capturing ${section.name}:`, err.message);
        return null;
      }
    };
    
    // Run all screenshots in parallel
    console.log('Capturing all sections in parallel...');
    const results = await Promise.all(sections.map(captureSection));
    
    // Add slides in order
    for (const result of results) {
      if (!result) continue;
      
      const slide = pptx.addSlide();
      
      // Fit to slide (13.333" x 7.5")
      const imgAspect = SLIDE_WIDTH / result.h;
      let w = 13.333, h = 13.333 / imgAspect;
      if (h > 7.5) { h = 7.5; w = 7.5 * imgAspect; }
      
      slide.addImage({
        data: `data:image/png;base64,${result.imgB64}`,
        x: (13.333 - w) / 2,
        y: (7.5 - h) / 2,
        w, h
      });
    }
    
    console.log('Generating PPT...');
    const outB64 = await pptx.write({ outputType: 'base64' });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="Cancer_Support_Report_${surveyId}.pptx"`,
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
