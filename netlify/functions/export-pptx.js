// netlify/functions/export-pptx.js
// Direct PPT download - NO intermediate page

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

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
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
      "  const MIN_SECTION_HEIGHT = 100;",
      "",
      "  if (sections && sections.length > 0) {",
      "    for (const sec of sections) {",
      "      if (sec.height < MIN_SECTION_HEIGHT) continue;",
      "      ",
      "      if (sec.height <= SLIDE_H) {",
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
      "        let offset = 0;",
      "        let part = 1;",
      "        while (offset < sec.height) {",
      "          const remaining = sec.height - offset;",
      "          if (remaining < MIN_SECTION_HEIGHT) break;",
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

    // Build PPTX
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.title = "Cancer Support Assessment - " + surveyId;
    pptx.author = "Cancer and Careers";
    pptx.company = "Best Companies for Working with Cancer Index";

    const SLIDE_W_IN = 13.333;
    const PX_TO_IN = SLIDE_W_IN / 1280;

    for (const r of capData.results) {
      const slide = pptx.addSlide();
      slide.background = { color: 'F8FAFC' };
      const imgHeightIn = r.naturalHeight * PX_TO_IN;
      slide.addImage({
        data: "data:image/jpeg;base64," + r.jpegB64,
        x: 0,
        y: 0,
        w: SLIDE_W_IN,
        h: imgHeightIn
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

    // DIRECT REDIRECT - NO HTML PAGE
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
