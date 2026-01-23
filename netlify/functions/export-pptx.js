const PptxGenJS = require('pptxgenjs');

// ============================================================
// PPTX Export (Browserless)
//
// Captures the purpose-built 1280x720 DOM slide sections that exist on:
//   /export/reports/:surveyId?export=1
//
// The export page includes elements:
//   #ppt-slide-1 ... #ppt-slide-7
//
// We capture these in ONE Browserless session (via /function) and then
// assemble a PPTX (image-per-slide) which is fast and avoids huge payloads.
// ============================================================

const SLIDE_SELECTORS = [
  '#ppt-slide-1',
  '#ppt-slide-2',
  '#ppt-slide-3',
  '#ppt-slide-4',
  '#ppt-slide-5',
  '#ppt-slide-6',
  '#ppt-slide-7',
];

function json(statusCode, obj, headers = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  console.log('=== PPT Export Started ===');

  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) {
      return json(400, { error: 'Missing surveyId' });
    }

    const browserlessToken = process.env.BROWSERLESS_TOKEN;
    const browserlessBase = process.env.BROWSERLESS_BASE || 'https://production-sfo.browserless.io';

    if (!browserlessToken) {
      return json(500, { error: 'Missing BROWSERLESS_TOKEN' });
    }

    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${host}`;

    // Dedicated export route (no admin session required)
    const reportUrl = `${origin}/export/reports/${encodeURIComponent(surveyId)}?export=1`;
    console.log('Report URL:', reportUrl);
    // Run a single Browserless function to capture ALL slides

const browserlessFn = `
export default async function ({ page, context }) {
  const { url, selectors } = context;
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for first slide to render
  await page.waitForSelector(selectors[0], { timeout: 60000 });

  const results = [];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (!el) {
      results.push({ selector: sel, error: 'not_found' });
      continue;
    }
    await el.evaluate(e => e.scrollIntoView({ block: 'start', inline: 'nearest' }));

    // Puppeteer v24+ removed page.waitForTimeout
    await new Promise(r => setTimeout(r, 150));

    const buf = await el.screenshot({ type: 'jpeg', quality: 72 });
    results.push({ selector: sel, jpegB64: buf.toString('base64') });
  }

  return { data: { ok: true, results }, type: 'application/json' };
}
`;

    console.log('Requesting Browserless /function capture...');
    const res = await fetch(`${browserlessBase}/function?token=${browserlessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: browserlessFn,
        context: {
          url: reportUrl,
          selectors: SLIDE_SELECTORS,
        },
      }),
    });

    console.log('Browserless function status:', res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error('Browserless /function failed:', errText.slice(0, 1000));
      return json(500, {
        error: 'Browserless function failed',
        status: res.status,
        details: errText.slice(0, 1000),
      });
    }

    const payload = await res.json();
    if (!payload?.ok || !Array.isArray(payload.results)) {
      console.error('Unexpected Browserless payload:', payload);
      return json(500, { error: 'Unexpected Browserless payload' });
    }

    const missing = payload.results.filter(r => r.error || !r.jpegB64);
    if (missing.length) {
      console.error('Some slide captures failed:', missing);
      return json(500, { error: 'One or more slide captures failed', missing });
    }

    console.log('Captured slides:', payload.results.length);

    // Assemble PPTX
    const pptx = new PptxGenJS();
    // Use a layout constant that is stable across PptxGenJS versions
    pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
    pptx.title = 'Cancer Support Assessment Report';

    for (const r of payload.results) {
      const slide = pptx.addSlide();
      slide.addImage({
        data: `data:image/jpeg;base64,${r.jpegB64}`,
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
      });
    }

    console.log('Building PPTX...');

    let outB64;
    try {
      // Preferred API
      outB64 = await pptx.write('base64');
    } catch (e) {
      // Fallback for some environments
      outB64 = await pptx.write({ outputType: 'base64' });
    }

    // Netlify functions have a practical response size limit (~6MB). Base64 inflates by ~33%.
    // If you hit this, you should upload to storage and return a signed URL.
    if (outB64 && outB64.length > 7_000_000) {
      console.warn('PPTX base64 is large:', outB64.length);
      return json(413, {
        error: 'PPTX is too large to return directly from a Netlify Function.',
        details: {
          base64Length: outB64.length,
          recommendation: 'Reduce image quality/slide count OR upload the PPTX to Supabase Storage and return a signed URL.',
        },
      });
    }

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
    return json(500, { error: err.message || String(err), stack: err.stack });
  }
};
