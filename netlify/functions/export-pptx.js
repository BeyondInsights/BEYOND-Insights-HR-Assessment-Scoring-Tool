const PptxGenJS = require('pptxgenjs');

// ============================================
// PPT EXPORT - MULTIPLE SLIDE SCREENSHOTS
// ============================================

exports.handler = async (event) => {
  console.log('=== PPT Export Started ===');
  
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
    console.log('Report URL:', reportUrl);
    
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Cancer Support Assessment Report';
    
    // Slide dimensions in pixels (16:9 aspect)
    const SLIDE_W = 1200;
    const SLIDE_H = 675;
    const NUM_SLIDES = 13;
    
    // Take screenshots sequentially to avoid rate limits
    for (let i = 0; i < NUM_SLIDES; i++) {
      const yOffset = i * SLIDE_H;
      console.log(`Slide ${i + 1}: capturing y=${yOffset}`);
      
      const res = await fetch(`${browserlessBase}/screenshot?token=${browserlessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: reportUrl,
          options: {
            type: 'jpeg',
            quality: 80,
            clip: {
              x: 0,
              y: yOffset,
              width: SLIDE_W,
              height: SLIDE_H
            }
          },
          gotoOptions: { 
            waitUntil: 'networkidle0', 
            timeout: 30000 
          },
          viewport: {
            width: SLIDE_W,
            height: 9000 // Tall viewport to render full page
          },
          waitForTimeout: i === 0 ? 5000 : 500 // Only wait on first screenshot
        })
      });
      
      if (!res.ok) {
        console.error(`Slide ${i + 1} failed:`, res.status);
        continue;
      }
      
      const imgBuffer = Buffer.from(await res.arrayBuffer());
      console.log(`Slide ${i + 1}: ${imgBuffer.length} bytes`);
      
      if (imgBuffer.length < 1000) {
        console.error(`Slide ${i + 1} too small, skipping`);
        continue;
      }
      
      const slide = pptx.addSlide();
      slide.addImage({
        data: `data:image/jpeg;base64,${imgBuffer.toString('base64')}`,
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5
      });
    }
    
    console.log(`Generated ${pptx.slides.length} slides`);
    
    if (pptx.slides.length === 0) {
      return { statusCode: 500, body: JSON.stringify({ error: 'No slides generated' }) };
    }
    
    const outB64 = await pptx.write({ outputType: 'base64' });
    console.log('PPT size:', outB64.length);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="Report_${surveyId}.pptx"`,
        'Cache-Control': 'no-store',
      },
      body: outB64,
      isBase64Encoded: true,
    };
    
  } catch (err) {
    console.error('PPT export error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
