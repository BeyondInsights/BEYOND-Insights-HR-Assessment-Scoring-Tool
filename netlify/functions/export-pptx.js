// netlify/functions/export-pptx.js
const PptxGenJS = require('pptxgenjs');

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
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

    // Derive origin dynamically so this works on deploy previews too
    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${host}`;

    // IMPORTANT: Use your export-friendly route (NOT /admin/*)
    // This must be accessible without sessionStorage auth.
    const url = `${origin}/export/reports/${encodeURIComponent(surveyId)}?export=1`;

    // Your export page should render these fixed-size slide sections
    const selectors = [
      '#ppt-slide-1',
      '#ppt-slide-2',
      '#ppt-slide-3',
      '#ppt-slide-4',
      '#ppt-slide-5',
      '#ppt-slide-6',
      '#ppt-slide-7',
    ];

    // Browserless Function (runs inside their Puppeteer environment)
    // NOTE: page.waitForTimeout is not available -> use setTimeout sleep
    const browserlessFn = `
export default async function ({ page, context }) {
  const { url, selectors } = context;

  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Ensure the first slide exists
  await page.waitForSelector(selectors[0], { timeout: 60000 });

  const results = [];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (!el) {
      results.push({ selector: sel, error: 'not_found' });
      continue;
    }

    await el.evaluate(e => e.scrollIntoView({ block: 'start', inline: 'nearest' }));
    await new Promise(r => setTimeout(r, 150)); // replacement for waitForTimeout

    const buf = await el.screenshot({ type: 'jpeg', quality: 75 });
    results.push({ selector: sel, jpegB64: buf.toString('base64') });
  }

  // Some Browserless clusters wrap return values; some don't.
  // Returning {data, type} is acceptable, but the caller must handle both shapes.
  return { data: { ok: true, results }, type: 'application/json' };
}
`;

    const res = await fetch(`${base}/function?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: browserlessFn,
        context: { url, selectors },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return json(res.status, { error: 'Browserless function failed', status: res.status, details: text });
    }

    const payload = await res.json();

    // Browserless may return either:
    // 1) { ok:true, results:[...] }
    // 2) { data:{ ok:true, results:[...] }, type:'application/json' }
    const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;

    if (!data?.ok || !Array.isArray(data.results)) {
      return json(500, { error: 'Unexpected Browserless payload', payload });
    }

    const results = data.results;
    const missing = results.filter((r) => r.error || !r.jpegB64);
    if (missing.length) {
      return json(500, { error: 'One or more slide captures failed', missing });
    }

    // Build PPTX (one image per slide). This is highly reliable.
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in

    for (const r of results) {
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
    const fileName = `Report_${surveyId}.pptx`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${fileName}"`,
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
