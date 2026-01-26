// netlify/functions/export-pdf.js
// Uses Browserless - supports portrait and landscape orientations

exports.handler = async (event) => {
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    const orientation = event.queryStringParameters?.orientation || 'portrait';
    const isLandscape = orientation === 'landscape';
    
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

    if (isLandscape) {
      // LANDSCAPE: Render PPT slides as PDF pages
      const reportUrl = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=landscapepdf`;
      console.log('Generating LANDSCAPE PDF (PPT slides):', reportUrl);

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
        console.error('Browserless landscape PDF failed:', text);
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
          'Content-Disposition': 'attachment; filename="Cancer_Support_Report_' + surveyId + '_landscape.pdf"',
          'Cache-Control': 'no-store',
        },
        body: pdfB64,
        isBase64Encoded: true,
      };

    } else {
      // PORTRAIT: Standard PDF export
      const reportUrl = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=pdf`;
      console.log('Generating PORTRAIT PDF:', reportUrl);

      const res = await fetch(`${base}/pdf?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: reportUrl,
          viewport: { width: 1100, height: 800 },
          options: {
            printBackground: true,
            format: 'Letter',
            landscape: false,
            margin: {
              top: '0.5in',
              right: '0.5in',
              bottom: '0.5in',
              left: '0.5in',
            },
            displayHeaderFooter: false,
            preferCSSPageSize: false,
            scale: 0.95,
          },
          gotoOptions: {
            waitUntil: 'networkidle0',
            timeout: 90000,
          },
          waitForTimeout: 2000,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Browserless portrait PDF failed:', text);
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
    }

  } catch (err) {
    console.error('PDF export error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'PDF export failed', details: err?.message || String(err) }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
