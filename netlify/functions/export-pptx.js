// netlify/functions/export-pptx.js
//
// Captures full report using .ppt-break markers for slide breaks
// Uses getBoundingClientRect for accurate absolute positions
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
      "  // Wait for fonts and rendering",
      "  try {",
      "    await page.evaluate(async () => {",
      "      if (document.fonts && document.fonts.ready) await document.fonts.ready;",
      "    });",
      "  } catch (e) {}",
      "  await new Promise(r => setTimeout(r, 1500));",
      "",
      "  // Clean up styles for capture",
      "  await page.addStyleTag({",
      "    content: [",
      "      'html, body { margin:0 !important; padding:0 !important; background:#f8fafc !important; overflow:visible !important; }',",
      "      '.no-print { display:none !important; }',",
      "      '.sticky, [class*=\"sticky\"], .fixed, nav { position:static !important; }',",
      "      '.ppt-slides-container, .ppt-slide { display:none !important; }',",
      "      '#report-root { width:1700px !important; max-width:1700px !important; margin:0 auto !important; padding:20px !important; }'",
      "    ].join('\\n')",
      "  });",
      "",
      "  // Get section positions using getBoundingClientRect for accurate absolute positions",
      "  const sections = await page.evaluate(() => {",
      "    const root = document.querySelector('#report-root');",
      "    if (!root) return null;",
      "",
      "    // Scroll to top first to get consistent measurements",
      "    window.scrollTo(0, 0);",
      "",
      "    const rootRect = root.getBoundingClientRect();",
      "    const rootTop = rootRect.top + window.scrollY;",
      "",
      "    // Find ALL ppt-break elements and get their absolute position",
      "    const breaks = Array.from(root.querySelectorAll('.ppt-break'));",
      "    const positions = breaks.map(el => {",
      "      const rect = el.getBoundingClientRect();",
      "      // Absolute position relative to document",
      "      return Math.round(rect.top + window.scrollY - rootTop);",
      "    });",
      "",
      "    // Sort and remove duplicates (positions within 20px of each other)",
      "    const sorted = [...new Set(positions)].sort((a, b) => a - b);",
      "    const filtered = sorted.filter((pos, i) => {",
      "      if (i === 0) return true;",
      "      return pos - sorted[i - 1] > 20;",
      "    });",
      "",
      "    return {",
      "      totalHeight: root.scrollHeight,",
      "      sectionTops: filtered",
      "    };",
      "  });",
      "",
      "  if (!sections || !sections.sectionTops.length) {",
      "    return { data: { ok: false, error: 'No sections found' }, type: 'application/json' };",
      "  }",
      "",
      "  // Create viewport wrapper for capture",
      "  await page.evaluate((W, H) => {",
      "    const root = document.querySelector('#report-root');",
      "    if (!root) return;",
      "    const vp = document.createElement('div');",
      "    vp.id = '__vp__';",
      "    vp.style.cssText = 'position:fixed;left:0;top:0;width:'+W+'px;height:'+H+'px;overflow:hidden;background:#f8fafc;z-index:999999;';",
      "    document.body.appendChild(vp);",
      "    vp.appendChild(root);",
      "    root.style.position = 'absolute';",
      "    root.style.left = '50%';",
      "    root.style.transform = 'translateX(-50%)';",
      "    root.style.top = '0px';",
      "  }, W, H);",
      "",
      "  const results = [];",
      "  const sectionTops = sections.sectionTops;",
      "",
      "  // Capture each section",
      "  for (let i = 0; i < sectionTops.length && results.length < 40; i++) {",
      "    const sectionStart = sectionTops[i];",
      "    const sectionEnd = (i < sectionTops.length - 1) ? sectionTops[i + 1] : sections.totalHeight;",
      "    const sectionHeight = sectionEnd - sectionStart;",
      "",
      "    // Capture from section start, paginate if section is taller than viewport",
      "    let y = sectionStart;",
      "    let pageInSection = 0;",
      "",
      "    while (y < sectionEnd - 50 && results.length < 40) {",
      "      await page.evaluate((scrollY) => {",
      "        const root = document.querySelector('#report-root');",
      "        if (root) root.style.top = (-scrollY) + 'px';",
      "      }, y);",
      "",
      "      await new Promise(r => setTimeout(r, 200));",
      "",
      "      const vp = await page.$('#__vp__');",
      "      const buf = await vp.screenshot({ type: 'jpeg', quality: 90 });",
      "      results.push({",
      "        index: results.length + 1,",
      "        section: i,",
      "        page: pageInSection,",
      "        y: y,",
      "        jpegB64: buf.toString('base64')",
      "      });",
      "",
      "      // Move down for next page of this section",
      "      y += H - 80;",
      "      pageInSection++;",
      "",
      "      // Don't continue if remaining content is minimal",
      "      if (sectionEnd - y < 200) break;",
      "    }",
      "  }",
      "",
      "  return { ",
      "    data: { ",
      "      ok: true, ",
      "      slideCount: results.length, ",
      "      sectionCount: sectionTops.length,",
      "      sectionTops: sectionTops,",
      "      results ",
      "    }, ",
      "    type: 'application/json' ",
      "  };",
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
