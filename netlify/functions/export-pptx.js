const PptxGenJS = require('pptxgenjs');

// ============================================
// PPT EXPORT - WAIT FOR CONTENT TO LOAD
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
    
    // Take full-page screenshot - WAIT for content to load
    console.log('Taking screenshot...');
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
          waitUntil: 'networkidle0', 
          timeout: 30000 
        },
        waitForTimeout: 5000 // Wait 5 seconds for React to load data and render
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
    
    if (imgBuffer.length < 5000) {
      console.error('Screenshot too small - likely failed');
      return { statusCode: 500, body: JSON.stringify({ error: 'Screenshot too small', size: imgBuffer.length }) };
    }
    
    // Get dimensions from PNG header
    const width = imgBuffer.readUInt32BE(16);
    const height = imgBuffer.readUInt32BE(20);
    console.log(`Image: ${width}x${height}`);
    
    // Create PPT
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Cancer Support Assessment Report';
    
    const imgB64 = imgBuffer.toString('base64');
    
    // Calculate how many slides we need (16:9 = 1200x675 per slide)
    const slideHeightPx = 675;
    const numSlides = Math.min(Math.ceil(height / slideHeightPx), 15);
    console.log(`Creating ${numSlides} slides`);
    
    // Image dimensions in inches (slide is 13.333" x 7.5")
    const imgWidthIn = 13.333;
    const imgHeightIn = (height / width) * imgWidthIn;
    
    for (let i = 0; i < numSlides; i++) {
      const slide = pptx.addSlide();
      
      // Offset to show different portion of image
      const yOffsetIn = -(i * 7.5);
      
      slide.addImage({
        data: `data:image/png;base64,${imgB64}`,
        x: 0,
        y: yOffsetIn,
        w: imgWidthIn,
        h: imgHeightIn
      });
    }
    
    console.log(`Generated ${pptx.slides.length} slides`);
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
