const PptxGenJS = require('pptxgenjs');

// ============================================
// SCREENSHOT-BASED PPT EXPORT - FULL REPORT
// With better error handling and logging
// ============================================

exports.handler = async (event) => {
  console.log('=== PPT Export Started ===');
  
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) {
      console.error('Missing surveyId');
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing surveyId' }) };
    }
    console.log('Survey ID:', surveyId);

    const browserlessToken = process.env.BROWSERLESS_TOKEN;
    const browserlessBase = process.env.BROWSERLESS_BASE || 'https://production-sfo.browserless.io';
    
    if (!browserlessToken) {
      console.error('Missing BROWSERLESS_TOKEN');
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing BROWSERLESS_TOKEN' }) };
    }
    console.log('Browserless configured:', browserlessBase);

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
    
    // ALL sections of the report
    const sections = [
      { name: 'Executive Summary', y: 0, h: 950 },
      { name: 'Key Findings & Score', y: 920, h: 650 },
      { name: 'Dimension Performance', y: 1540, h: 820 },
      { name: 'Strategic Matrix', y: 2330, h: 750 },
      { name: 'Excellence & Growth', y: 3050, h: 850 },
      { name: 'Initiatives In Progress', y: 3870, h: 450 },
      { name: 'Strategic Recs 1', y: 4290, h: 680 },
      { name: 'Strategic Recs 2', y: 4940, h: 680 },
      { name: 'Strategic Recs 3', y: 5590, h: 680 },
      { name: 'Strategic Recs 4', y: 6240, h: 680 },
      { name: 'Implementation Roadmap', y: 6890, h: 620 },
      { name: 'How CAC Can Help', y: 7480, h: 650 },
      { name: 'Methodology', y: 8100, h: 350 },
    ];
    
    // First test: Can we reach the page at all?
    console.log('Testing page accessibility...');
    const testRes = await fetch(`${browserlessBase}/content?token=${browserlessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: reportUrl,
        gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 }
      })
    });
    
    if (!testRes.ok) {
      const errText = await testRes.text();
      console.error('Page test failed:', errText);
      return { statusCode: 500, body: JSON.stringify({ error: 'Cannot access report page', details: errText }) };
    }
    
    const pageContent = await testRes.text();
    console.log('Page loaded, content length:', pageContent.length);
    
    if (pageContent.includes('error') && pageContent.length < 1000) {
      console.error('Page returned error:', pageContent.substring(0, 500));
      return { statusCode: 500, body: JSON.stringify({ error: 'Report page error', details: pageContent.substring(0, 500) }) };
    }
    
    // Capture function
    const captureSection = async (section, index) => {
      console.log(`[${index + 1}/${sections.length}] Capturing: ${section.name}`);
      
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
            gotoOptions: { waitUntil: 'networkidle0', timeout: 25000 },
            viewport: { width: SLIDE_WIDTH, height: 800 }
          })
        });
        
        if (!res.ok) {
          const errText = await res.text();
          console.error(`Screenshot failed for ${section.name}:`, errText);
          return null;
        }
        
        const buffer = await res.arrayBuffer();
        console.log(`[${index + 1}] ${section.name}: ${buffer.byteLength} bytes`);
        
        return {
          name: section.name,
          h: section.h,
          imgB64: Buffer.from(buffer).toString('base64')
        };
      } catch (err) {
        console.error(`Error capturing ${section.name}:`, err.message);
        return null;
      }
    };
    
    // Run ALL screenshots in parallel
    console.log('Capturing all 13 sections in parallel...');
    const results = await Promise.all(sections.map((s, i) => captureSection(s, i)));
    
    const successCount = results.filter(r => r !== null).length;
    console.log(`Screenshots complete: ${successCount}/${sections.length} succeeded`);
    
    if (successCount === 0) {
      console.error('All screenshots failed!');
      return { statusCode: 500, body: JSON.stringify({ error: 'All screenshots failed - check report page rendering' }) };
    }
    
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
    
    console.log(`Generated ${pptx.slides.length} slides, creating file...`);
    const outB64 = await pptx.write({ outputType: 'base64' });
    console.log('PPT file created, size:', outB64.length);
    
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
    return { statusCode: 500, body: JSON.stringify({ error: 'PPT export failed', details: err.message, stack: err.stack }) };
  }
};
