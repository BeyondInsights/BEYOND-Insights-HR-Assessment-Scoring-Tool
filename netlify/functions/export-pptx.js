// netlify/functions/export-pptx.js
//
// SMART SECTION-BASED EXPORT:
// - Finds .ppt-break sections
// - Captures each at natural height
// - Pads short sections with white to fill 720px (no stretching)
// - Splits tall sections into multiple 720px slides
// - Result: clean breaks at logical points, no distortion
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

    // Browserless function
    const browserlessFn = [
      "export default async function ({ page, context }) {",
      "  const url = context.url;",
      "",
      "  const SLIDE_W = 1280;",
      "  const SLIDE_H = 720;",
      "",
      "  await page.setViewport({ width: SLIDE_W, height: 900, deviceScaleFactor: 2 });",
      "  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });",
      "",
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
      "      'html, body { margin: 0 !important; padding: 0 !important; background: #f8fafc !important; }',",
      "      '.no-print { display: none !important; }',",
      "      '.sticky, [class*=\"sticky\"] { position: static !important; }',",
      "      'nav { display: none !important; }',",
      "      '#report-root { max-width: 1200px !important; width: 1200px !important; margin: 0 auto !important; padding: 40px !important; background: #f8fafc !important; }',",
      "      '.ppt-slides-container { display: none !important; }',",
      "      '[class*=\"overflow-y-auto\"], [class*=\"overflow-auto\"], [class*=\"max-h-\"] { overflow: visible !important; max-height: none !important; }'",
      "    ].join('\\n');",
      "    document.head.appendChild(style);",
      "  });",
      "",
      "  // Wait for fonts",
      "  try { await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; }); } catch(e) {}",
      "",
      "  // Scroll to load all content",
      "  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));",
      "  await new Promise(r => setTimeout(r, 1000));",
      "  await page.evaluate(() => window.scrollTo(0, 0));",
      "  await new Promise(r => setTimeout(r, 500));",
      "",
      "  // Find all .ppt-break sections",
      "  const sections = await page.evaluate(() => {",
      "    const breaks = document.querySelectorAll('.ppt-break');",
      "    if (!breaks.length) return null;",
      "    ",
      "    const results = [];",
      "    const bodyHeight = document.body.scrollHeight;",
      "    ",
      "    for (let i = 0; i < breaks.length; i++) {",
      "      const el = breaks[i];",
      "      const rect = el.getBoundingClientRect();",
      "      const top = rect.top + window.scrollY;",
      "      ",
      "      // Section ends at next break or end of body",
      "      let bottom;",
      "      if (i < breaks.length - 1) {",
      "        const nextRect = breaks[i + 1].getBoundingClientRect();",
      "        bottom = nextRect.top + window.scrollY;",
      "      } else {",
      "        bottom = bodyHeight;",
      "      }",
      "      ",
      "      results.push({ index: i, top: Math.round(top), bottom: Math.round(bottom), height: Math.round(bottom - top) });",
      "    }",
      "    return results;",
      "  });",
      "",
      "  const results = [];",
      "",
      "  if (sections && sections.length > 0) {",
      "    // SECTION-BASED CAPTURE",
      "    for (const sec of sections) {",
      "      if (sec.height <= SLIDE_H) {",
      "        // Section fits in one slide - capture at natural height",
      "        // We'll pad it in the PPT generation step",
      "        const buf = await page.screenshot({",
      "          type: 'jpeg',",
      "          quality: 92,",
      "          clip: { x: 0, y: sec.top, width: SLIDE_W, height: sec.height }",
      "        });",
      "        results.push({",
      "          type: 'section',",
      "          index: sec.index,",
      "          naturalHeight: sec.height,",
      "          jpegB64: buf.toString('base64')",
      "        });",
      "      } else {",
      "        // Section too tall - split into SLIDE_H chunks",
      "        let offset = 0;",
      "        let part = 1;",
      "        while (offset < sec.height) {",
      "          const remaining = sec.height - offset;",
      "          const captureH = Math.min(SLIDE_H, remaining);",
      "          ",
      "          const buf = await page.screenshot({",
      "            type: 'jpeg',",
      "            quality: 92,",
      "            clip: { x: 0, y: sec.top + offset, width: SLIDE_W, height: captureH }",
      "          });",
      "          results.push({",
      "            type: 'section-part',",
      "            index: sec.index,",
      "            part: part,",
      "            naturalHeight: captureH,",
      "            jpegB64: buf.toString('base64')",
      "          });",
      "          offset += SLIDE_H;",
      "          part++;",
      "        }",
      "      }",
      "    }",
      "  } else {",
      "    // FALLBACK: No .ppt-break markers, use fixed chunks",
      "    const pageHeight = await page.evaluate(() => document.body.scrollHeight);",
      "    const numSlides = Math.ceil(pageHeight / SLIDE_H);",
      "    ",
      "    for (let i = 0; i < numSlides && i < 50; i++) {",
      "      const buf = await page.screenshot({",
      "        type: 'jpeg',",
      "        quality: 92,",
      "        clip: { x: 0, y: i * SLIDE_H, width: SLIDE_W, height: SLIDE_H }",
      "      });",
      "      results.push({",
      "        type: 'chunk',",
      "        index: i,",
      "        naturalHeight: SLIDE_H,",
      "        jpegB64: buf.toString('base64')",
      "      });",
      "    }",
      "  }",
      "",
      "  return {",
      "    data: {",
      "      ok: true,",
      "      slideCount: results.length,",
      "      usedSections: sections ? sections.length : 0,",
      "      results",
      "    },",
      "    type: 'application/json'",
      "  };",
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

    console.log('Capture result:', { ok: capData?.ok, slideCount: capData?.slideCount, usedSections: capData?.usedSections });

    if (!capData?.ok || !capData.results?.length) {
      return { statusCode: 500, body: "Capture failed: " + (capData?.error || JSON.stringify(capData)) };
    }

    // Build PPTX with proper sizing
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches (16:9)
    pptx.title = "Cancer Support Assessment - " + surveyId;
    pptx.author = "Cancer and Careers";
    pptx.company = "Best Companies for Working with Cancer Index";

    // Slide dimensions in inches
    const SLIDE_W_IN = 13.333;
    const SLIDE_H_IN = 7.5;
    const PX_TO_IN = SLIDE_W_IN / 1280; // Convert pixels to inches

    for (const r of capData.results) {
      const slide = pptx.addSlide();
      
      // Set slide background to match report
      slide.background = { color: 'F8FAFC' };
      
      // Calculate image height in inches (maintaining aspect ratio)
      const imgHeightIn = r.naturalHeight * PX_TO_IN;
      
      // If image is shorter than slide, it will be placed at top with white space below
      // If image is exactly slide height, it fills the slide
      slide.addImage({
        data: "data:image/jpeg;base64," + r.jpegB64,
        x: 0,
        y: 0,
        w: SLIDE_W_IN,
        h: imgHeightIn  // Natural height, not forced to fill
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
