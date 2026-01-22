const PptxGenJS = require('pptxgenjs');

// ============================================
// SIMPLE PPT - ONE FULL PAGE SCREENSHOT
// Debug version to verify API works
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
    
    // Take ONE full-page screenshot - simplest possible call
    console.log('Taking full page screenshot...');
    const res = await fetch(`${browserlessBase}/screenshot?token=${browserlessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: reportUrl,
        options: {
          type: 'png',
          fullPage: true
        },
        gotoOptions: { 
          waitUntil: 'networkidle2', 
          timeout: 25000 
        }
      })
    });
    
    console.log('Screenshot response status:', res.status);
    
    if (!res.ok) {
      const errText = await res.text();
      console.error('Screenshot failed:', errText.substring(0, 500));
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: 'Screenshot failed', 
          status: res.status,
          details: errText.substring(0, 500) 
        }) 
      };
    }
    
    const imgBuffer = Buffer.from(await res.arrayBuffer());
    console.log('Screenshot buffer size:', imgBuffer.length);
    
    if (imgBuffer.length < 1000) {
      console.error('Screenshot too small - likely failed');
      return { statusCode: 500, body: JSON.stringify({ error: 'Screenshot too small', size: imgBuffer.length }) };
    }
    
    // Create simple PPT with one slide
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Cancer Support Assessment Report';
    
    const slide = pptx.addSlide();
    slide.addImage({
      data: `data:image/png;base64,${imgBuffer.toString('base64')}`,
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
      sizing: { type: 'contain', w: 13.333, h: 7.5 }
    });
    
    console.log('Created 1 slide PPT');
    const outB64 = await pptx.write({ outputType: 'base64' });
    
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
    return { statusCode: 500, body: JSON.stringify({ error: err.message, stack: err.stack }) };
  }
};
