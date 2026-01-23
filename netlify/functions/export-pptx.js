// netlify/functions/export-pptx.js
//
// Captures full report using .ppt-break markers for intelligent slide breaks
// Auto-downloads the result
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

    // Browserless function: capture using .ppt-break markers
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
      "  // Wait for fonts and extra render time",
      "  try {",
      "    await page.evaluate(async () => {",
      "      if (document.fonts && document.fonts.ready) await document.fonts.ready;",
      "    });",
      "  } catch (e) {}",
      "  await new Promise(r => setTimeout(r, 1000));",
      "",
      "  // Inject styles for clean capture",
      "  await page.addStyleTag({",
      "    content: [",
      "      'html, body { margin: 0 !important; padding: 0 !important; background: #f8fafc !important; overflow: hidden !important; }',",
      "      '.no-print { display: none !important; }',",
      "      '.sticky, [class*=\"sticky\"], .fixed, nav { position: static !important; }',",
      "      '.ppt-slides-container, .ppt-slide { display: none !important; }',",
      "      '#report-root { position: absolute !important; left: 50% !important; transform: translateX(-50%) !important; width: 1700px !important; max-width: 1700px !important; padding: 0 !important; margin: 0 !important; }'",
      "    ].join('\\n')",
      "  });",
      "",
      "  // Find all section break positions",
      "  const sections = await page.evaluate(() => {",
      "    const root = document.querySelector('#report-root');",
      "    if (!root) return null;",
      "",
      "    // Get all ppt-break elements",
      "    const breaks = Array.from(root.querySelectorAll('.ppt-break'));",
      "    if (!breaks.length) return null;",
      "",
      "    // Get position and height of each section",
      "    const sectionData = breaks.map((el, i) => {",
      "      const rect = el.getBoundingClientRect();",
      "      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;",
      "      return {",
      "        index: i,",
      "        top: rect.top + scrollTop,",
      "        height: el.offsetHeight",
      "      };",
      "    });",
      "",
      "    return {",
      "      totalHeight: root.scrollHeight,",
      "      sections: sectionData",
      "    };",
      "  });",
      "",
      "  if (!sections || !sections.sections.length) {",
      "    return { data: { ok: false, error: 'No sections found' }, type: 'application/json' };",
      "  }",
      "",
      "  // Create a fixed viewport container",
      "  await page.evaluate((W, H) => {",
      "    const root = document.querySelector('#report-root');",
      "    if (!root) return;",
      "",
      "    // Create viewport wrapper",
      "    const viewport = document.createElement('div');",
      "    viewport.id = '__capture_viewport__';",
      "    viewport.style.cssText = 'position:fixed; left:0; top:0; width:' + W + 'px; height:' + H + 'px; overflow:hidden; background:#f8fafc; z-index:999999;';",
      "",
      "    // Move root into viewport",
      "    document.body.appendChild(viewport);",
      "    viewport.appendChild(root);",
      "",
      "    // Position root for capture",
      "    root.style.position = 'absolute';",
      "    root.style.left = '50%';",
      "    root.style.transform = 'translateX(-50%)';",
      "    root.style.top = '0px';",
      "  }, W, H);",
      "",
      "  const results = [];",
      "  const maxSlides = 35;",
      "",
      "  // Capture each section",
      "  for (let i = 0; i < sections.sections.length && results.length < maxSlides; i++) {",
      "    const section = sections.sections[i];",
      "    const nextSection = sections.sections[i + 1];",
      "    const sectionEnd = nextSection ? nextSection.top : sections.totalHeight;",
      "    const sectionHeight = sectionEnd - section.top;",
      "",
      "    // If section fits in one slide, capture it centered",
      "    if (sectionHeight <= H) {",
      "      // Center the section vertically in the slide",
      "      const offset = section.top - Math.max(0, (H - sectionHeight) / 2);",
      "      await page.evaluate((y) => {",
      "        const root = document.querySelector('#report-root');",
      "        if (root) root.style.top = (-y) + 'px';",
      "      }, Math.max(0, offset));",
      "",
      "      await new Promise(r => setTimeout(r, 150));",
      "      const viewport = await page.$('#__capture_viewport__');",
      "      const buf = await viewport.screenshot({ type: 'jpeg', quality: 90 });",
      "      results.push({ index: results.length + 1, section: i, jpegB64: buf.toString('base64') });",
      "    } else {",
      "      // Section is taller than one slide - capture in chunks",
      "      for (let y = section.top; y < sectionEnd && results.length < maxSlides; y += H - 100) {",
      "        await page.evaluate((yy) => {",
      "          const root = document.querySelector('#report-root');",
      "          if (root) root.style.top = (-yy) + 'px';",
      "        }, y);",
      "",
      "        await new Promise(r => setTimeout(r, 150));",
      "        const viewport = await page.$('#__capture_viewport__');",
      "        const buf = await viewport.screenshot({ type: 'jpeg', quality: 90 });",
      "        results.push({ index: results.length + 1, section: i, y: y, jpegB64: buf.toString('base64') });",
      "      }",
      "    }",
      "  }",
      "",
      "  return { data: { ok: true, slideCount: results.length, sectionCount: sections.sections.length, results }, type: 'application/json' };",
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

    // REDIRECT to download URL
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
