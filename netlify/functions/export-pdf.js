// netlify/functions/export-pdf.js
// Uses Browserless to generate PDF - direct download, NO modal

exports.handler = async (event) => {
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    
    if (!surveyId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing surveyId' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${host}`;

    const token = process.env.BROWSERLESS_TOKEN;
    const base = process.env.BROWSERLESS_BASE || 'https://production-sfo.browserless.io';
    if (!token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing BROWSERLESS_TOKEN' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Generate landscape PDF (slides format)
    const reportUrl = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=pdf`;
    console.log('Generating PDF:', reportUrl);

    const res = await fetch(`${base}/pdf?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: reportUrl,
        viewport: { width: 1280, height: 720 },
        options: {
          printBackground: true,
          width: '1280px',
          height: '720px',
          landscape: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          displayHeaderFooter: false,
          preferCSSPageSize: false,
          scale: 1.0,
        },
        gotoOptions: {
          waitUntil: 'networkidle0',
          timeout: 90000,
        },
        waitForTimeout: 3000,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Browserless PDF failed:', text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Browserless PDF failed: ' + text }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const pdfArrayBuf = await res.arrayBuffer();
    const pdfB64 = Buffer.from(pdfArrayBuf).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Cancer_Support_Report_' + surveyId + '.pdf"',
        'Cache-Control': 'no-store',
      },
      body: pdfB64,
      isBase64Encoded: true,
    };

  } catch (err) {
    console.error('PDF export error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'PDF export failed', details: err?.message || String(err) }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
