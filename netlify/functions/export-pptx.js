const PptxGenJS = require('pptxgenjs');

// ============================================
// PPT EXPORT - COMPRESSED VERSION
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
    
    // Take screenshot with JPEG compression
    console.log('Taking screenshot...');
    const res = await fetch(`${browserlessBase}/screenshot?token=${browserlessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: reportUrl,
        options: {
          type: 'jpeg',
          quality: 70,
          fullPage: true
        },
        gotoOptions: { 
          waitUntil: 'networkidle0', 
          timeout: 30000 
        },
        waitForTimeout: 5000
      })
    });
    
    console.log('Screenshot response status:', res.status);
    
    if (!res.ok) {
      const errText = await res.text();
      console.error('Screenshot failed:', errText.substring(0, 500));
      return { statusCode: 500, body: JSON.stringify({ error: 'Screenshot failed', details: errText.substring(0, 500) }) };
    }
    
    const imgBuffer = Buffer.from(await res.arrayBuffer());
    console.log('Screenshot size:', imgBuffer.length, 'bytes');
    
    // Create PPT with single slide showing full report
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Cancer Support Assessment Report';
    
    // Just one slide with the full image (scaled to fit)
    const slide = pptx.addSlide();
    slide.addImage({
      data: `data:image/jpeg;base64,${imgBuffer.toString('base64')}`,
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
      sizing: { type: 'contain', w: 13.333, h: 7.5 }
    });
    
    console.log('Generated 1 slide PPT');
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
