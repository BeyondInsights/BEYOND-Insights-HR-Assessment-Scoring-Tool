// netlify/functions/export-pptx.js
//
// Captures pre-designed PPT slides (ppt-slide-1 through ppt-slide-7)
// Uses mode=ppt which shows the slides at 1280x720 (16:9)
//

const PptxGenJS = require("pptxgenjs");
const { createClient } = require("@supabase/supabase-js");

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  try {
    const surveyId = event.queryStringParameters?.surveyId;
    if (!surveyId) return json(400, { error: "Missing surveyId" });

    const token = process.env.BROWSERLESS_TOKEN;
    const base = process.env.BROWSERLESS_BASE || "https://production-sfo.browserless.io";
    if (!token) return json(500, { error: "Missing BROWSERLESS_TOKEN env var" });

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_EXPORT_BUCKET || "exports";
    if (!supabaseUrl || !serviceKey) {
      return json(500, { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
    }

    const host = event.headers["x-forwarded-host"] || event.headers.host;
    const proto = event.headers["x-forwarded-proto"] || "https";
    const origin = `${proto}://${host}`;

    // CRITICAL: Use mode=ppt (NOT pptreport) to show the pre-designed slides
    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=ppt`;

    // Browserless function to capture each slide individually
    const browserlessFn = [
      "export default async function ({ page, context }) {",
      "  const url = context.url;",
      "",
      "  // Slide dimensions match CSS: 1280x720 (16:9)",
      "  const W = 1280;",
      "  const H = 720;",
      "",
      "  // DPR=2 for crisp text",
      "  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });",
      "  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });",
      "",
      "  // Wait for slides container to exist",
      "  try {",
      "    await page.waitForSelector('.ppt-slides-container', { timeout: 30000 });",
      "  } catch (e) {",
      "    return { data: { ok: false, error: 'Slides container not found' }, type: 'application/json' };",
      "  }",
      "",
      "  // Wait for fonts to load",
      "  try {",
      "    await page.evaluate(async () => {",
      "      if (document.fonts && document.fonts.ready) await document.fonts.ready;",
      "    });",
      "  } catch (e) {}",
      "",
      "  // Extra time for rendering",
      "  await new Promise(r => setTimeout(r, 800));",
      "",
      "  // Find all slide IDs and sort them numerically",
      "  const slideIds = await page.evaluate(() => {",
      "    const slides = document.querySelectorAll('.ppt-slide[id]');",
      "    return Array.from(slides)",
      "      .map(el => el.id)",
      "      .filter(id => id.startsWith('ppt-slide-'))",
      "      .sort((a, b) => {",
      "        const numA = parseInt(a.replace('ppt-slide-', ''), 10);",
      "        const numB = parseInt(b.replace('ppt-slide-', ''), 10);",
      "        return numA - numB;",
      "      });",
      "  });",
      "",
      "  if (!slideIds || slideIds.length === 0) {",
      "    return { data: { ok: false, error: 'No slides found', debug: 'slideIds empty' }, type: 'application/json' };",
      "  }",
      "",
      "  const results = [];",
      "",
      "  for (const slideId of slideIds) {",
      "    // Position this slide at the viewport origin for capture",
      "    await page.evaluate((id, W, H) => {",
      "      // First hide all slides",
      "      document.querySelectorAll('.ppt-slide').forEach(el => {",
      "        el.style.position = 'absolute';",
      "        el.style.left = '-9999px';",
      "        el.style.visibility = 'hidden';",
      "      });",
      "",
      "      // Position target slide at viewport origin",
      "      const slide = document.getElementById(id);",
      "      if (slide) {",
      "        slide.style.position = 'fixed';",
      "        slide.style.left = '0';",
      "        slide.style.top = '0';",
      "        slide.style.width = W + 'px';",
      "        slide.style.height = H + 'px';",
      "        slide.style.zIndex = '999999';",
      "        slide.style.visibility = 'visible';",
      "        slide.style.overflow = 'hidden';",
      "        // Ensure background is set",
      "        if (!slide.style.background || slide.style.background === '') {",
      "          slide.style.background = 'white';",
      "        }",
      "      }",
      "    }, slideId, W, H);",
      "",
      "    // Wait for render",
      "    await new Promise(r => setTimeout(r, 200));",
      "",
      "    // Screenshot the slide element",
      "    const slideEl = await page.$('#' + slideId);",
      "    if (!slideEl) {",
      "      continue;",
      "    }",
      "",
      "    const buf = await slideEl.screenshot({ type: 'jpeg', quality: 92 });",
      "    results.push({",
      "      index: results.length + 1,",
      "      slideId: slideId,",
      "      jpegB64: buf.toString('base64')",
      "    });",
      "  }",
      "",
      "  if (results.length === 0) {",
      "    return { data: { ok: false, error: 'No slides captured' }, type: 'application/json' };",
      "  }",
      "",
      "  return { data: { ok: true, slideCount: results.length, results: results }, type: 'application/json' };",
      "}",
    ].join("\n");

    // Call Browserless
    const capRes = await fetch(`${base}/function?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: browserlessFn, context: { url } }),
    });

    if (!capRes.ok) {
      const text = await capRes.text();
      return json(capRes.status, { error: "Browserless failed", status: capRes.status, details: text });
    }

    const capPayload = await capRes.json();
    const capData = capPayload?.data && typeof capPayload.data === "object" ? capPayload.data : capPayload;

    if (!capData?.ok) {
      return json(500, { error: "Capture failed", details: capData?.error || "Unknown", capPayload });
    }

    if (!Array.isArray(capData.results) || capData.results.length === 0) {
      return json(500, { error: "No slides in results", capPayload });
    }

    // Verify all slides have image data
    const missing = capData.results.filter(r => !r.jpegB64);
    if (missing.length > 0) {
      return json(500, { error: "Some slides missing image data", missingCount: missing.length });
    }

    // Build PPTX
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches (16:9 = 1280:720)

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

    // Write PPTX buffer
    const pptBuffer = await pptx.write("nodebuffer");

    // Upload to Supabase Storage
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
      return json(500, { error: "Upload failed", details: up.error.message });
    }

    // Create signed download URL (1 hour)
    const signed = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60);
    if (signed.error) {
      return json(500, { error: "Signed URL failed", details: signed.error.message });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        ok: true,
        downloadUrl: signed.data.signedUrl,
        filePath,
        slideCount: capData.results.length
      }),
    };
  } catch (err) {
    console.error(err);
    return json(500, { error: "PPT export failed", details: String(err?.message || err) });
  }
};
