const PptxGenJS = require('pptxgenjs');

// ============================================
// SCROLL-BASED PPT EXPORT
// Scroll page and capture viewport for each slide
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
    pptx.author = 'Cancer and Careers';
    
    // 16:9 viewport - 1200 x 675
    const VIEWPORT_W = 1200;
    const VIEWPORT_H = 675;
    
    // First, get page height
    console.log('Getting page height...');
    const heightRes = await fetch(`${browserlessBase}/function?token=${browserlessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
          module.exports = async ({ page }) => {
            await page.goto('${reportUrl}', { waitUntil: 'networkidle2', timeout: 25000 });
            const height = await page.evaluate(() => document.body.scrollHeight);
            return { height };
          };
        `
      })
    });
    
    let pageHeight = 8500; // default
    if (heightRes.ok) {
      const data = await heightRes.json();
      pageHeight = data.height || 8500;
      console.log('Page height:', pageHeight);
    }
    
    const numSlides = Math.min(Math.ceil(pageHeight / VIEWPORT_H), 15);
    console.log(`Creating ${numSlides} slides`);
    
    // Take screenshots by scrolling
    for (let i = 0; i < numSlides; i++) {
      const scrollY = i * VIEWPORT_H;
      console.log(`Slide ${i + 1}: scrollY = ${scrollY}`);
      
      const res = await fetch(`${browserlessBase}/function?token=${browserlessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `
            module.exports = async ({ page }) => {
              await page.setViewport({ width: ${VIEWPORT_W}, height: ${VIEWPORT_H} });
              await page.goto('${reportUrl}', { waitUntil: 'networkidle2', timeout: 20000 });
              await page.evaluate((y) => window.scrollTo(0, y), ${scrollY});
              await new Promise(r => setTimeout(r, 300));
              const screenshot = await page.screenshot({ type: 'png' });
              return { screenshot: screenshot.toString('base64') };
            };
          `
        })
      });
      
      if (!res.ok) {
        console.error(`Slide ${i + 1} failed:`, res.status);
        continue;
      }
      
      const data = await res.json();
      if (data.screenshot) {
        const slide = pptx.addSlide();
        slide.addImage({
          data: `data:image/png;base64,${data.screenshot}`,
          x: 0,
          y: 0,
          w: 13.333,
          h: 7.5
        });
        console.log(`Slide ${i + 1} added`);
      }
      
      // Small delay
      await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`Generated ${pptx.slides.length} slides`);
    
    if (pptx.slides.length === 0) {
      return { statusCode: 500, body: JSON.stringify({ error: 'No slides generated' }) };
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
