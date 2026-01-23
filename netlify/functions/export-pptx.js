// netlify/functions/export-pptx.js
//
// SIMPLE APPROACH: Capture full page, slice into exact 720px tall chunks
// Each slide = exactly 1280x720 pixels = perfect 16:9 ratio
// No distortion, no squishing
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
    const origin = proto + "://" + host;

    const url = origin + "/admin/reports/" + encodeURIComponent(surveyId) + "?export=1";

    // Browserless function - captures exact 1280x720 chunks
    const browserlessFn = [
      "export default async function ({ page, context }) {",
      "  const url = context.url;",
      "",
      "  // EXACT slide dimensions - 16:9 ratio",
      "  const SLIDE_W = 1280;",
      "  const SLIDE_H = 720;",
      "",
      "  // Set viewport to exact slide width",
      "  await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 2 });",
      "  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });",
      "",
      "  // Wait for report",
      "  try {",
      "    await page.waitForSelector('#report-root', { timeout: 30000 });",
      "  } catch (e) {",
      "    return { data: { ok: false, error: 'Report not found' }, type: 'application/json' };",
      "  }",
      "",
      "  // Inject export styles",
      "  await page.evaluate(() => {",
      "    document.body.classList.add('export-mode');",
      "    const style = document.createElement('style');",
      "    style.textContent = [",
      "      '.no-print { display: none !important; }',",
      "      '.sticky, [class*=\"sticky\"] { position: static !important; }',",
      "      'nav { display: none !important; }',",
      "      '#report-root { max-width: 1280px !important; width: 1280px !important; margin: 0 !important; padding: 40px !important; background: #f8fafc !important; }',",
      "      '.ppt-slides-container { display: none !important; }',",
      "      '[class*=\"overflow-y-auto\"], [class*=\"overflow-auto\"], [class*=\"max-h-\"] { overflow: visible !important; max-height: none !important; }'",
      "    ].join('\\n');",
      "    document.head.appendChild(style);",
      "  });",
      "",
      "  // Wait for fonts",
      "  try {",
      "    await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });",
      "  } catch (e) {}",
      "",
      "  // Scroll to load all content",
      "  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));",
      "  await new Promise(r => setTimeout(r, 1000));",
      "  await page.evaluate(() => window.scrollTo(0, 0));",
      "  await new Promise(r => setTimeout(r, 500));",
      "",
      "  // Get total page height",
      "  const pageHeight = await page.evaluate(() => document.body.scrollHeight);",
      "",
      "  // Calculate number of slides",
      "  const numSlides = Math.ceil(pageHeight / SLIDE_H);",
      "  const results = [];",
      "",
      "  // Capture each 720px chunk",
      "  for (let i = 0; i < numSlides && i < 50; i++) {",
      "    const yPos = i * SLIDE_H;",
      "",
      "    // Capture exactly 1280x720",
      "    const buf = await page.screenshot({",
      "      type: 'jpeg',",
      "      quality: 90,",
      "      clip: { x: 0, y: yPos, width: SLIDE_W, height: SLIDE_H }",
      "    });",
      "",
      "    results.push({ slide: i + 1, jpegB64: buf.toString('base64') });",
      "  }",
      "",
      "  return { data: { ok: true, slideCount: results.length, pageHeight, results }, type: 'application/json' };",
      "}"
    ].join("\n");

    console.log('PPT export starting:', url);

    const capRes = await fetch(base + "/function?token=" + token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: browserlessFn, context: { url } }),
    });

    if (!capRes.ok) {
      const text = await capRes.text();
      console.error('Browserless error:', text);
      return { statusCode: 500, body: "Browserless failed: " + text };
    }

    const capPayload = await capRes.json();
    const capData = capPayload?.data || capPayload;

    console.log('Capture result:', { ok: capData?.ok, slideCount: capData?.slideCount, pageHeight: capData?.pageHeight });

    if (!capData?.ok || !capData.results?.length) {
      return { statusCode: 500, body: "Capture failed: " + (capData?.error || JSON.stringify(capData)) };
    }

    // Build PPTX
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches (16:9)
    pptx.title = "Cancer Support Assessment - " + surveyId;
    pptx.author = "Cancer and Careers";

    for (const r of capData.results) {
      const slide = pptx.addSlide();
      slide.addImage({
        data: "data:image/jpeg;base64," + r.jpegB64,
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5
      });
    }

    const pptBuffer = await pptx.write("nodebuffer");

    // Upload to Supabase
    const supabase = createClient(supabaseUrl, serviceKey);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = "ppt/" + surveyId + "/Report_" + surveyId + "_" + ts + ".pptx";

    const up = await supabase.storage.from(bucket).upload(filePath, pptBuffer, {
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      upsert: true
    });

    if (up.error) {
      return { statusCode: 500, body: "Upload failed: " + up.error.message };
    }

    const signed = await supabase.storage.from(bucket).createSignedUrl(filePath, 3600);
    if (signed.error) {
      return { statusCode: 500, body: "Signed URL failed: " + signed.error.message };
    }

    console.log('PPT export success:', { slides: capData.results.length, file: filePath });

    return {
      statusCode: 302,
      headers: { Location: signed.data.signedUrl, "Cache-Control": "no-store" },
      body: ""
    };

  } catch (err) {
    console.error('PPT export error:', err);
    return { statusCode: 500, body: "Error: " + (err?.message || err) };
  }
};
