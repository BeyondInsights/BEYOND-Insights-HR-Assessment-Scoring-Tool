// netlify/functions/export-pdf.js
// Uses Browserless for reliable PDF generation

exports.handler = async (event) => {
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing surveyId' }) };
    }

    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${host}`;

    const token = process.env.BROWSERLESS_TOKEN;
    const base = process.env.BROWSERLESS_BASE || 'https://chrome.browserless.io';
    const exportToken = process.env.EXPORT_SECRET_TOKEN;
    
    if (!token) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing BROWSERLESS_TOKEN environment variable' }) };
    }

    // Use the token-protected export route
    const reportUrl = `${origin}/export/reports/${encodeURIComponent(surveyId)}?token=${exportToken}&export=1`;

    console.log(`Generating PDF for: ${reportUrl}`);

    const res = await fetch(`${base}/pdf?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
  url: reportUrl,
  options: {
    printBackground: true,
    format: 'Letter',
    margin: { 
      top: '0.5in', 
      right: '0.5in', 
      bottom: '0.5in', 
      left: '0.5in' 
    },
    displayHeaderFooter: false,
    preferCSSPageSize: true
  },
  gotoOptions: {
    waitUntil: 'networkidle0',
    timeout: 60000
  },
  waitForSelector: {
    selector: '#export-matrix',
    timeout: 30000
  }
})

    if (!res.ok) {
      const text = await res.text();
      console.error('Browserless PDF failed:', text);
      return { statusCode: 500, body: JSON.stringify({ error: `Browserless PDF failed: ${text}` }) };
    }

    const pdfArrayBuf = await res.arrayBuffer();
    const pdfB64 = Buffer.from(pdfArrayBuf).toString('base64');

    // Get company name for filename (optional enhancement - could fetch from Supabase)
    const filename = `Cancer_Support_Report_${surveyId}.pdf`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
      body: pdfB64,
      isBase64Encoded: true,
    };
    
  } catch (err) {
    console.error('PDF export error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'PDF export failed', details: err.message }) };
  }
};
