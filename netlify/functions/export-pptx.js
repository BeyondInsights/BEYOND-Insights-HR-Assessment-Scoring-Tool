const PptxGenJS = require('pptxgenjs');

// ============================================
// SCREENSHOT-BASED PPT EXPORT - SEQUENTIAL
// One screenshot at a time to avoid rate limits
// ============================================

exports.handler = async (event) => {
  console.log('=== PPT Export Started ===');
  
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing surveyId' }) };
    }
    console.log('Survey ID:', surveyId);

    const browserlessToken = process.env.BROWSERLESS_TOKEN;
    const browserlessBase = process.env.BROWSERLESS_BASE || 'https://production-sfo.browserless.io';
    
    if (!browserlessToken) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing BROWSERLESS_TOKEN' }) };
    }

    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${host}`;
    
    const reportUrl = `${origin}/export/reports/${encodeURIComponent(surveyId)}?export=1`;
    console.log('Report URL:', reportUrl);
    
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Cancer Support Assessment Report';
    pptx.author = 'Cancer and Careers';
    
    const SLIDE_WIDTH = 1200;
    
    // Key sections only (6 slides to fit in timeout)
    const sections = [
      { name: 'Executive Summary', y: 0, h: 950 },
      { name: 'Dimension Performance', y: 1540, h: 820 },
      { name: 'Strategic Matrix', y: 2330, h: 750 },
      { name: 'Excellence & Growth', y: 3050, h: 850 },
      { name: 'Implementation Roadmap', y: 6890, h: 620 },
      { name: 'How CAC Can Help', y: 7480, h: 650 },
    ];
    
    // Sequential capture with delay
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      console.log(`[${i + 1}/${sections.length}] Capturing: ${section.name}`);
      
      try {
        const res = await fetch(`${browserlessBase}/screenshot?token=${browserlessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: reportUrl,
            options: {
              type: 'png',
              clip: { x: 0, y: section.y, width: SLIDE_WIDTH, height: section.h }
            },
            gotoOptions: { waitUntil: 'networkidle2', timeout: 20000 },
            viewport: { width: SLIDE_WIDTH, height: 8500 }
          })
        });
        
        if (!res.ok) {
          const errText = await res.text();
          console.error(`Screenshot failed for ${section.name}:`, res.status, errText.substring(0, 200));
          continue;
        }
        
        const buffer = await res.arrayBuffer();
        const imgB64 = Buffer.from(buffer).toString('base64');
        console.log(`[${i + 1}] ${section.name}: ${buffer.byteLength} bytes`);
        
        // Add slide
        const slide = pptx.addSlide();
        const imgAspect = SLIDE_WIDTH / section.h;
        let w = 13.333, h = 13.333 / imgAspect;
        if (h > 7.5) { h = 7.5; w = 7.5 * imgAspect; }
        
        slide.addImage({
          data: `data:image/png;base64,${imgB64}`,
          x: (13.333 - w) / 2,
          y: (7.5 - h) / 2,
          w, h
        });
        
        // Small delay between requests
        if (i < sections.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
        
      } catch (err) {
        console.error(`Error capturing ${section.name}:`, err.message);
      }
    }
    
    console.log(`Generated ${pptx.slides.length} slides`);
    
    if (pptx.slides.length === 0) {
      return { statusCode: 500, body: JSON.stringify({ error: 'No slides generated - all screenshots failed' }) };
    }
    
    const outB64 = await pptx.write({ outputType: 'base64' });
    console.log('PPT complete');
    
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
