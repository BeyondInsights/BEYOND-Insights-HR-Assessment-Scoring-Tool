// netlify/functions/export-pptx.js
const PptxGenJS = require('pptxgenjs');

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) return json(400, { error: 'Missing surveyId' });

    const token = process.env.BROWSERLESS_TOKEN;
    const base = process.env.BROWSERLESS_BASE || 'https://production-sfo.browserless.io';
    if (!token) return json(500, { error: 'Missing BROWSERLESS_TOKEN env var' });

    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${host}`;

    // IMPORTANT: render the real report in capture-friendly mode
    // Your report page must support mode=pptreport (CSS/layout tweaks)
    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=pptreport`;

    const browserlessFn = `
export default async function ({ page, context }) {
  const { url } = context;

  const W = 1280;
  const H = 720;

  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  await page.waitForSelector('#report-root', { timeout: 60000 });

  // Force deterministic capture: NO scrolling. We translate the report vertically.
  await page.addStyleTag({
    content: \`
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        overflow: hidden !important; /* prevent scroll dependency */
      }

      /* Lock report canvas width to viewport */
      #report-root {
        width: 1280px !important;
        max-width: 1280px !important;
        margin: 0 !important;
        padding: 20px !important;
        transform: translateY(0px);
        will-change: transform;
      }

      /* Hide any UI chrome */
      .no-print { display: none !important; }
      .sticky, [class*="sticky"], .fixed { position: static !important; }

      /* Ensure no clipped content from scroll boxes */
      [class*="overflow-y-auto"], [class*="overflow-auto"] {
        overflow: visible !important;
        max-height: none !important;
      }

      /* If PPT template slides exist anywhere, hide them */
      .ppt-slides-container, .ppt-slide { display: none !important; }
    \`
  });

  // Best-effort wait for fonts
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch (e) {}

  // Measure how tall the report is
  const totalHeight = await page.evaluate(() => {
    const el = document.querySelector('#report-root');
    return el ? el.scrollHeight : document.body.scrollHeight;
  });

  const maxSlides = 25; // adjust if needed
  const slideCount = Math.min(maxSlides, Math.ceil(totalHeight / H));

  const results = [];
  for (let i = 0; i < slideCount; i++) {
    const y = i * H;

    // Move report UP by y pixels (no scrolling)
    await page.evaluate((yy) => {
      const el = document.querySelector('#report-root');
      if (el) el.style.transform = \`translateY(-\${yy}px)\`;
    }, y);

    await new Promise(r => setTimeout(r, 120));

    const buf = await page.screenshot({
      type: 'jpeg',
      quality: 82,
      clip: { x: 0, y: 0, width: W, height: H }
    });

    results.push({ index: i + 1, jpegB64: buf.toString('base64') });
  }

  // Reset transform
  await page.evaluate(() => {
    const el = document.querySelector('#report-root');
    if (el) el.style.transform = 'translateY(0px)';
  });

  return { data: { ok: true, results }, type: 'application/json' };
}
`;

    const res = await fetch(`${base}/function?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: browserlessFn, context: { url } }),
    });

    if (!res.ok) {
      const text = await res.text();
      return json(res.status, { error: 'Browserless function failed', status: res.status, details: text });
    }

    const payload = await res.json();
    const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;

    if (!data?.ok || !Array.isArray(data.results)) {
      return json(500, { error: 'Unexpected Browserless payload', payload });
    }

    if (!data.results.length) {
      return json(500, { error: 'No slides captured' });
    }

    const missing = data.results.filter(r => !r.jpegB64);
    if (missing.length) {
      return json(500, { error: 'One or more slide captures failed', missingCount: missing.length });
    }

    // Build PPTX
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 inches

    for (const r of data.results) {
      const slide = pptx.addSlide();
      slide.addImage({
        data: `data:image/jpeg;base64,${r.jpegB64}`,
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
      });
    }

    const outB64 = await pptx.write('base64');

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
    console.error(err);
    return json(500, { error: 'PPT export failed', details: String(err?.message || err) });
  }
};
