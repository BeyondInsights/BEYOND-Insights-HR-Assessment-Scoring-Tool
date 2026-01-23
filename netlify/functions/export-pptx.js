// netlify/functions/export-pptx.js
//
// Captures full report as scrolling slides, auto-downloads the result
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

    // Load the report in export mode
    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=pptreport`;

    // Browserless function: scroll-capture the full report
    const browserlessFn = [
      "export default async function ({ page, context }) {",
      "  const url = context.url;",
      "",
      "  // 16:9 slide dimensions",
      "  const W = 1920;",
      "  const H = 1080;",
      "",
      "  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });",
      "  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });",
      "",
      "  // Wait for report to render",
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
      "",
      "  // Extra render time",
      "  await new Promise(r => setTimeout(r, 1000));",
      "",
      "  // Inject styles to clean up for capture",
      "  await page.addStyleTag({",
      "    content: [",
      "      'html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }',",
      "      '.no-print { display: none !important; }',",
      "      '.sticky, [class*=\"sticky\"], .fixed { position: static !important; }',",
      "      '[class*=\"overflow-y-auto\"], [class*=\"overflow-auto\"] { overflow: visible !important; max-height: none !important; }',",
      "      '.ppt-slides-container, .ppt-slide { display: none !important; }',",
      "      '#report-root { max-width: 1700px !important; margin: 0 auto !important; padding: 20px !important; }'",
      "    ].join('\\n')",
      "  });",
      "",
      "  // Get total height of report",
      "  const totalHeight = await page.evaluate(() => {",
      "    const root = document.querySelector('#report-root');",
      "    return root ? root.scrollHeight : 0;",
      "  });",
      "",
      "  if (!totalHeight) {",
      "    return { data: { ok: false, error: 'Report has no height' }, type: 'application/json' };",
      "  }",
      "",
      "  // Calculate number of slides needed",
      "  const slideCount = Math.min(Math.ceil(totalHeight / H), 30);",
      "",
      "  const results = [];",
      "",
      "  for (let i = 0; i < slideCount; i++) {",
      "    const scrollY = i * H;",
      "",
      "    // Scroll to position",
      "    await page.evaluate((y) => {",
      "      window.scrollTo(0, y);",
      "    }, scrollY);",
      "",
      "    // Wait for render",
      "    await new Promise(r => setTimeout(r, 200));",
      "",
      "    // Take screenshot of viewport",
      "    const buf = await page.screenshot({ type: 'jpeg', quality: 90 });",
      "    results.push({",
      "      index: i + 1,",
      "      y: scrollY,",
      "      jpegB64: buf.toString('base64')",
      "    });",
      "  }",
      "",
      "  return { data: { ok: true, slideCount: results.length, totalHeight, results }, type: 'application/json' };",
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
      return { statusCode: 500, body: `Browserless failed: ${text}` };
    }

    const capPayload = await capRes.json();
    const capData = capPayload?.data && typeof capPayload.data === "object" ? capPayload.data : capPayload;

    if (!capData?.ok || !Array.isArray(capData.results) || capData.results.length === 0) {
      return { statusCode: 500, body: `Capture failed: ${JSON.stringify(capData)}` };
    }

    // Build PPTX
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches (16:9)

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
      return { statusCode: 500, body: `Upload failed: ${up.error.message}` };
    }

    // Create signed download URL (1 hour)
    const signed = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60);
    if (signed.error) {
      return { statusCode: 500, body: `Signed URL failed: ${signed.error.message}` };
    }

    // REDIRECT to download URL instead of returning JSON
    return {
      statusCode: 302,
      headers: {
        Location: signed.data.signedUrl,
        "Cache-Control": "no-store",
      },
      body: "",
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: `Error: ${err?.message || err}` };
  }
};
