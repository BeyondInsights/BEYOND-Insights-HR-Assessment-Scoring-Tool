const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const PptxGenJS = require('pptxgenjs');

exports.handler = async (event) => {
  const { surveyId } = event.queryStringParameters || {};
  
  if (!surveyId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing surveyId' }) };
  }

  let browser = null;
  
  try {
    const origin = process.env.URL || 'https://effervescent-concha-95d2df.netlify.app';
    const exportEmail = process.env.EXPORT_ADMIN_EMAIL || 'john.bekier@beyondinsights.com';
    
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    await page.evaluateOnNewDocument((email) => {
      try {
        sessionStorage.setItem('adminAuth', JSON.stringify({
          email,
          timestamp: Date.now()
        }));
      } catch (e) {}
    }, exportEmail);

    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    await page.waitForSelector('#report-root', { timeout: 30000 });
    
    // Show PPT slides for capture
    await page.addStyleTag({
      content: `
        .ppt-slides-container { position: relative !important; left: 0 !important; }
        .ppt-slide { position: relative !important; left: 0 !important; margin-bottom: 20px !important; }
      `
    });
    await page.waitForTimeout(1000);

    const slideHandles = await page.$$('.ppt-slide');
    console.log(`Found ${slideHandles.length} slides`);

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Cancer Support Assessment Report';

    for (const slideHandle of slideHandles) {
      await slideHandle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      
      const screenshot = await slideHandle.screenshot({ type: 'png', encoding: 'base64' });
      
      const slide = pptx.addSlide();
      slide.addImage({
        data: `data:image/png;base64,${screenshot}`,
        x: 0, y: 0, w: '100%', h: '100%'
      });
    }

    await browser.close();

    const pptxBuffer = await pptx.write({ outputType: 'nodebuffer' });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="Report_${surveyId}.pptx"`,
      },
      body: pptxBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('PPTX export error:', error);
    if (browser) await browser.close();
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
