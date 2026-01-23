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

    // IMPORTANT: this uses the real report (not .ppt-slide templates)
    // mode=pptreport triggers a 1280px-wide capture-friendly layout
    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=pptreport`;

const browserlessFn = `
export default async function ({ page, context }) {
  const { url } = context;

  const W = 1280;
  const H = 720;

  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  await page.waitForSelector('#report-root', { timeout: 60000 });

  // Force page to be scrollable (prevents "stuck at top" captures)
  await page.addStyleTag({
    content: \`
      html, body { height: auto !important; overflow: visible !important; }
      * { scroll-behavior: auto !important; }
    \`
  });

  // Best-effort wait for fonts
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch (e) {}

  // Compute total scroll height (use document scroll height)
  const totalHeight = await page.evaluate(() => {
    const se = document.scrollingElement || document.documentElement;
    return Math.max(
      se.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
  });

  const maxSlides = 25;
  const slideCount = Math.min(maxSlides, Math.ceil(totalHeight / H));

  // Helper to scroll reliably (window scroll + fallback to #report-root if needed)
  async function scrollToY(y) {
    // Primary: scrollingElement
    await page.evaluate((yy) => {
      const se = document.scrollingElement || document.documentElement;
      se.scrollTop = yy;
      window.scrollTo(0, yy);
      document.documentElement.scrollTop = yy;
      document.body.scrollTop = yy;
    }, y);

    await new Promise(r => setTimeout(r, 220));

    // Verify scroll moved; if not, try scrolling #report-root (if it is scrollable)
    const moved = await page.evaluate((yy) => {
      const se = document.scrollingElement || document.documentElement;
      const cur = se.scrollTop || window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      return Math.abs(cur - yy) < 4; // close enough
    }, y);

    if (!moved) {
      await page.evaluate((yy) => {
        const el = document.querySelector('#report-root');
        if (!el) return;
        // If report-root is the scroll container, scroll it
        if (el.scrollHeight > el.clientHeight) {
          el.scrollTop = yy;
        }
      }, y);
      await new Promise(r => setTimeout(r, 220));
    }
  }

  // Start at top
  await scrollToY(0);

  const results = [];
  for (let i = 0; i < slideCount; i++) {
    const y = i * H;
    await scrollToY(y);

    // Debug: capture the current scrollTop to ensure we are moving
    const debugScroll = await page.evaluate(() => {
      const se = document.scrollingElement || document.documentElement;
      return se.scrollTop || window.scrollY || 0;
    });

    const buf = await page.screenshot({
      type: 'jpeg',
      quality: 82,
      clip: { x: 0, y: 0, width: W, height: H }
    });

    results.push({ index: i + 1, scrollTop: debugScroll, jpegB64: buf.toString('base64') });
  }

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
