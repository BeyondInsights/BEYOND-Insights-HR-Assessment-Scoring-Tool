const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

exports.handler = async (event) => {
  const { surveyId } = event.queryStringParameters || {};
  
  if (!surveyId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing surveyId' }) };
  }

  let browser = null;
  
  try {
    const origin = process.env.URL || 'https://effervescent-concha-95d2df.netlify.app';
    const exportEmail = process.env.EXPORT_ADMIN_EMAIL || 'john.bekier@beyondinsights.com';
    
    // Fix for Netlify environment
    const executablePath = await chromium.executablePath();
    
    if (!executablePath) {
      throw new Error('Could not find Chromium executable');
    }

    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800 },
      executablePath,
      headless: chromium.headless
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
    console.log('Navigating to:', url);
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    await page.waitForSelector('#report-root', { timeout: 30000 });
    
    await page.addStyleTag({
      content: `.no-print, .ppt-slides-container { display: none !important; }`
    });
    
    await new Promise(r => setTimeout(r, 2000));

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
    });

    await browser.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Report_${surveyId}.pdf"`,
      },
      body: pdf.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('PDF export error:', error);
    if (browser) await browser.close();
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
