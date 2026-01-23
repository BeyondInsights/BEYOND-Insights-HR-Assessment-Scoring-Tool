// netlify/functions/export-pptx.js
//
// Scrolls each .ppt-break element into view and captures
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

    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=pptreport`;

    const browserlessFn = [
      "export default async function ({ page, context }) {",
      "  const url = context.url;",
      "  const W = 1920;",
      "  const H = 1080;",
      "",
      "  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });",
      "  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });",
      "",
      "  try {",
      "    await page.waitForSelector('#report-root', { timeout: 30000 });",
      "  } catch (e) {",
      "    return { data: { ok: false, error: 'Report not found' }, type: 'application/json' };",
      "  }",
      "",
      "  // Wait for fonts",
      "  try {",
      "    await page.evaluate(async () => {",
      "      if (document.fonts && document.fonts.ready) await document.fonts.ready;",
      "    });",
      "  } catch (e) {}",
      "  await new Promise(r => setTimeout(r, 1500));",
      "",
      "  // Clean up styles",
      "  await page.addStyleTag({",
      "    content: [",
      "      'html, body { margin:0 !important; padding:0 !important; background:#f8fafc !important; scroll-behavior:auto !important; }',",
      "      '.no-print { display:none !important; }',",
      "      '.sticky, [class*=\"sticky\"], .fixed, nav { position:static !important; }',",
      "      '.ppt-slides-container, .ppt-slide { display:none !important; }',",
      "      '#report-root { width:1700px !important; max-width:1700px !important; margin:0 auto !important; padding:20px !important; }'",
      "    ].join('\\n')",
      "  });",
      "",
      "  // Count ppt-break elements",
      "  const breakCount = await page.evaluate(() => {",
      "    return document.querySelectorAll('#report-root .ppt-break').length;",
      "  });",
      "",
      "  if (!breakCount) {",
      "    return { data: { ok: false, error: 'No ppt-break elements found' }, type: 'application/json' };",
      "  }",
      "",
      "  const results = [];",
      "",
      "  // Capture each section by scrolling that element to top of viewport",
      "  for (let i = 0; i < breakCount && results.length < 35; i++) {",
      "    // Scroll this ppt-break element to top of viewport",
      "    await page.evaluate((index) => {",
      "      const breaks = document.querySelectorAll('#report-root .ppt-break');",
      "      const el = breaks[index];",
      "      if (el) {",
      "        el.scrollIntoView({ behavior: 'instant', block: 'start' });",
      "      }",
      "    }, i);",
      "",
      "    await new Promise(r => setTimeout(r, 300));",
      "",
      "    const buf = await page.screenshot({ type: 'jpeg', quality: 90 });",
      "    results.push({",
      "      index: i + 1,",
      "      jpegB64: buf.toString('base64')",
      "    });",
      "  }",
      "",
      "  return { data: { ok: true, slideCount: results.length, breakCount, results }, type: 'application/json' };",
      "}",
    ].join("\n");

    const capRes = await fetch(`${base}/function?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: browserlessFn, context: { url } }),
    });

    if (!capRes.ok) {
      const text = await capRes.text();
      return { statusCode: 500, body: `Browserless failed: ${text}` };
    }

    const capPayload = await capRes.json();
    const capData = capPayload?.data && typeof capPayload.data === "object" ? capPayload.data : capPayload;

    if (!capData?.ok || !Array.isArray(capData.results) || capData.results.length === 0) {
      return { statusCode: 500, body: `Capture failed: ${JSON.stringify(capData)}` };
    }

    // Build PPTX
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";

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
      return { statusCode: 500, body: `Upload failed: ${up.error.message}` };
    }

    const signed = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60);
    if (signed.error) {
      return { statusCode: 500, body: `Signed URL failed: ${signed.error.message}` };
    }

    return {
      statusCode: 302,
      headers: { Location: signed.data.signedUrl, "Cache-Control": "no-store" },
      body: "",
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: `Error: ${err?.message || err}` };
  }
};
