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

    // Load the report page in ppt export mode
    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=ppt`;

    const browserlessFn = `
export default async function ({ page, context }) {
  const { url } = context;

  // PowerPoint widescreen dimensions (16:9)
  const W = 1280;
  const H = 720;

  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for the report to load
  await page.waitForSelector('#report-root', { timeout: 60000 });

  // Wait for fonts
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch (e) {}

  // Add styles for PPT capture mode
  await page.addStyleTag({
    content: \`
      /* Reset everything for clean capture */
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        overflow: hidden !important;
        width: ${W}px !important;
        height: ${H}px !important;
      }
      
      /* Hide main report entirely - ppt-slides-container is a SIBLING of report-root */
      #report-root {
        display: none !important;
      }
      
      /* Show and position the PPT container */
      .ppt-slides-container {
        display: block !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: ${W}px !important;
        height: ${H}px !important;
        overflow: hidden !important;
        z-index: 99999 !important;
        background: white !important;
      }
      
      /* Base slide styling - hide all by default */
      .ppt-slide {
        display: none !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: ${W}px !important;
        height: ${H}px !important;
        box-sizing: border-box !important;
        background: white !important;
        overflow: hidden !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      }
      
      /* Active slide - show only the one being captured */
      .ppt-slide.active-capture {
        display: block !important;
      }
      
      /* Remove any text decorations in slides */
      .ppt-slide * {
        text-decoration: none !important;
      }
      
      /* Ensure no unwanted UI */
      .no-print, nav, header, footer, .sticky, [class*="sticky"] {
        display: none !important;
      }
    \`
  });

  // Small delay for styles to apply
  await new Promise(r => setTimeout(r, 300));

  // Find all PPT slides
  const slideCount = await page.evaluate(() => {
    const slides = document.querySelectorAll('.ppt-slide');
    return slides.length;
  });

  if (slideCount === 0) {
    // Fallback: capture the main report as continuous scroll
    return await captureScrollReport(page, W, H);
  }

  const results = [];

  // Capture each slide individually
  for (let i = 1; i <= slideCount; i++) {
    // Show only the current slide
    await page.evaluate((slideIndex) => {
      // Hide all slides
      document.querySelectorAll('.ppt-slide').forEach(s => {
        s.classList.remove('active-capture');
      });
      
      // Show target slide
      const slide = document.querySelector('#ppt-slide-' + slideIndex) || 
                    document.querySelectorAll('.ppt-slide')[slideIndex - 1];
      if (slide) {
        slide.classList.add('active-capture');
      }
    }, i);

    // Wait for render
    await new Promise(r => setTimeout(r, 200));

    // Capture the slide
    const buf = await page.screenshot({
      type: 'jpeg',
      quality: 92,
      clip: { x: 0, y: 0, width: W, height: H }
    });

    results.push({ index: i, jpegB64: buf.toString('base64') });
  }

  return { data: { ok: true, results, method: 'individual-slides' }, type: 'application/json' };
}

// Fallback: continuous scroll capture for pages without defined slides
async function captureScrollReport(page, W, H) {
  await page.addStyleTag({
    content: \`
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; overflow: hidden !important; }
      #report-root { width: \${W}px !important; max-width: \${W}px !important; margin: 0 !important; padding: 20px !important; }
      .no-print { display: none !important; }
      .ppt-slides-container { display: none !important; }
    \`
  });

  const totalHeight = await page.evaluate(() => {
    const el = document.querySelector('#report-root');
    return el ? el.scrollHeight : document.body.scrollHeight;
  });

  const maxSlides = 20;
  const slideCount = Math.min(maxSlides, Math.ceil(totalHeight / H));
  const results = [];

  for (let i = 0; i < slideCount; i++) {
    const y = i * H;
    
    await page.evaluate((yy) => {
      const el = document.querySelector('#report-root');
      if (el) el.style.transform = \`translateY(-\${yy}px)\`;
    }, y);

    await new Promise(r => setTimeout(r, 150));

    const buf = await page.screenshot({
      type: 'jpeg',
      quality: 85,
      clip: { x: 0, y: 0, width: W, height: H }
    });

    results.push({ index: i + 1, jpegB64: buf.toString('base64') });
  }

  return { data: { ok: true, results, method: 'scroll-capture' }, type: 'application/json' };
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
    pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 inches (16:9)
    pptx.title = `Assessment Report - ${surveyId}`;
    pptx.author = 'Cancer and Careers';
    pptx.company = 'Best Companies for Working with Cancer Index';

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
