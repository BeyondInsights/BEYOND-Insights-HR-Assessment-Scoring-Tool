const PptxGenJS = require('pptxgenjs');

// ============================================
// CLIP-BASED PPT EXPORT
// Takes fullPage screenshot and clips sections
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
    
    // Slide dimensions: 1200px wide, 675px tall (16:9)
    const slideWidth = 1200;
    const slideHeight = 675;
    
    // First, get the full page height by taking a full screenshot
    const fullRes = await fetch(`${browserlessBase}/screenshot?token=${browserlessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: reportUrl,
        options: { type: 'png', fullPage: true },
        gotoOptions: { waitUntil: 'networkidle0', timeout: 60000 },
        viewport: { width: slideWidth, height: slideHeight }
      })
    });
    
    if (!fullRes.ok) {
      const errText = await fullRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'Screenshot failed', details: errText }) };
    }
    
    const fullBuf = Buffer.from(await fullRes.arrayBuffer());
    const pageHeight = fullBuf.readUInt32BE(20); // PNG height from header
    
    console.log(`Page height: ${pageHeight}px, creating slides...`);
    
    // Calculate number of slides needed
    const numSlides = Math.min(Math.ceil(pageHeight / slideHeight), 20);
    
    // Capture each slide section using clip
    for (let i = 0; i < numSlides; i++) {
      const yOffset = i * slideHeight;
      
      // Don't go past the page
      if (yOffset >= pageHeight) break;
      
      console.log(`Slide ${i + 1}: y=${yOffset}`);
      
      const clipRes = await fetch(`${browserlessBase}/screenshot?token=${browserlessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: reportUrl,
          options: {
            type: 'png',
            fullPage: true,
            clip: {
              x: 0,
              y: yOffset,
              width: slideWidth,
              height: Math.min(slideHeight, pageHeight - yOffset)
            }
          },
          gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 },
          viewport: { width: slideWidth, height: slideHeight }
        })
      });
      
      if (clipRes.ok) {
        const imgBuf = await clipRes.arrayBuffer();
        const imgB64 = Buffer.from(imgBuf).toString('base64');
        
        const slide = pptx.addSlide();
        slide.addImage({
          data: `data:image/png;base64,${imgB64}`,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%'
        });
      } else {
        console.error(`Slide ${i + 1} failed:`, await clipRes.text());
      }
    }
    
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
