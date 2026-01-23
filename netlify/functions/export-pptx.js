// netlify/functions/export-pptx.js
//
// Captures pre-designed PPT slides (.ppt-slide elements)
// Adds 'export-mode' class to body to make slides visible
// Captures each slide by bounding box for clean screenshots
//

const PptxGenJS = require("pptxgenjs");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) {
      return { statusCode: 400, body: "Missing surveyId" };
    }

    const token = process.env.BROWSERLESS_TOKEN;
    const base = process.env.BROWSERLESS_BASE || "https://production-sfo.browserless.io";
    if (!token) {
      return { statusCode: 500, body: "Missing BROWSERLESS_TOKEN" };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_EXPORT_BUCKET || "exports";
    if (!supabaseUrl || !serviceKey) {
      return { statusCode: 500, body: "Missing Supabase credentials" };
    }

    const host = event.headers["x-forwarded-host"] || event.headers.host;
    const proto = event.headers["x-forwarded-proto"] || "https";
    const origin = `${proto}://${host}`;

    // Just use export=1, the Browserless function will add export-mode class
    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1`;

    // Browserless function to capture each slide
    const browserlessFn = `
export default async function ({ page, context }) {
  const url = context.url;

  // Slide dimensions: 1280x720 (16:9) - matches the CSS
  const W = 1280;
  const H = 720;

  await page.setViewport({ width: W + 100, height: H + 100, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for report to load
  try {
    await page.waitForSelector('#report-root', { timeout: 30000 });
  } catch (e) {
    return { data: { ok: false, error: 'Report root not found' }, type: 'application/json' };
  }

  // Add export-mode class to body - this makes .ppt-slides-container and .ppt-slide visible
  await page.evaluate(() => {
    document.body.classList.add('export-mode');
  });

  // Wait for fonts to load
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch (e) {}

  // Extra rendering time for slides to appear
  await new Promise(r => setTimeout(r, 1500));

  // Count slides
  const slideCount = await page.evaluate(() => {
    return document.querySelectorAll('.ppt-slide').length;
  });

  if (!slideCount) {
    return { data: { ok: false, error: 'No .ppt-slide elements found' }, type: 'application/json' };
  }

  const results = [];

  // Capture each slide by index
  for (let i = 0; i < slideCount; i++) {
    // Get the slide element handle
    const slideEl = await page.evaluateHandle((index) => {
      return document.querySelectorAll('.ppt-slide')[index];
    }, i);

    if (!slideEl) continue;

    // Get bounding box
    const box = await slideEl.boundingBox();
    if (!box) continue;

    // Screenshot just this slide
    const buf = await page.screenshot({
      type: 'jpeg',
      quality: 92,
      clip: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      }
    });

    results.push({
      index: i + 1,
      jpegB64: buf.toString('base64')
    });
  }

  return { 
    data: { 
      ok: true, 
      slideCount: results.length, 
      totalSlides: slideCount,
      results 
    }, 
    type: 'application/json' 
  };
}
`;

    console.log('Calling Browserless for PPT export:', url);

    const capRes = await fetch(`${base}/function?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: browserlessFn, context: { url } }),
    });

    if (!capRes.ok) {
      const text = await capRes.text();
      console.error('Browserless error:', text);
      return { statusCode: 500, body: `Browserless failed: ${text}` };
    }

    const capPayload = await capRes.json();
    const capData = capPayload?.data && typeof capPayload.data === "object" ? capPayload.data : capPayload;

    console.log('Browserless response:', { ok: capData?.ok, slideCount: capData?.slideCount, totalSlides: capData?.totalSlides });

    if (!capData?.ok) {
      return { statusCode: 500, body: `Capture failed: ${capData?.error || JSON.stringify(capData)}` };
    }

    if (!Array.isArray(capData.results) || capData.results.length === 0) {
      return { statusCode: 500, body: `No slides captured. totalSlides: ${capData?.totalSlides}` };
    }

    // Build PPTX - 16:9 widescreen
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches
    pptx.title = `Cancer Support Assessment - ${surveyId}`;
    pptx.author = "Cancer and Careers";
    pptx.company = "Best Companies for Working with Cancer Index";

    for (const r of capData.results) {
      const slide = pptx.addSlide();
      slide.addImage({
        data: `data:image/jpeg;base64,${r.jpegB64}`,
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
      });
    }

    const pptBuffer = await pptx.write("nodebuffer");

    // Upload to Supabase
    const supabase = createClient(supabaseUrl, serviceKey);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = `ppt/${surveyId}/Report_${surveyId}_${ts}.pptx`;

    const up = await supabase.storage
      .from(bucket)
      .upload(filePath, pptBuffer, {
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        upsert: true,
      });

    if (up.error) {
      console.error('Upload error:', up.error);
      return { statusCode: 500, body: `Upload failed: ${up.error.message}` };
    }

    // Generate signed URL (1 hour)
    const signed = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60);
    if (signed.error) {
      return { statusCode: 500, body: `Signed URL failed: ${signed.error.message}` };
    }

    console.log('PPT export success:', { slideCount: capData.results.length, filePath });

    return {
      statusCode: 302,
      headers: { Location: signed.data.signedUrl, "Cache-Control": "no-store" },
      body: "",
    };

  } catch (err) {
    console.error('PPT export error:', err);
    return { statusCode: 500, body: `Error: ${err?.message || err}` };
  }
};
