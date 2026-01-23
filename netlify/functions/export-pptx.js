// netlify/functions/export-pptx.js
const PptxGenJS = require("pptxgenjs");

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

    const host = event.headers["x-forwarded-host"] || event.headers.host;
    const proto = event.headers["x-forwarded-proto"] || "https";
    const origin = `${proto}://${host}`;

    // Report capture mode
    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=pptreport`;

    // Browserless function code built without nested template literals
    const browserlessFn = [
      "export default async function ({ page, context }) {",
      "  const url = context.url;",

      // 1920x1080 camera; DPR=2 yields 3840x2160 images in the PPT (sharp)
      "  const W = 1920;",
      "  const H = 1080;",
      "  const REPORT_W = 1700;",
      "  const LEFT = Math.round((W - REPORT_W) / 2);",

      "  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });",
      "  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });",
      "  await page.waitForSelector('#report-root', { timeout: 60000 });",

      "  await page.addStyleTag({",
      "    content: [",
      "      'html, body { margin:0 !important; padding:0 !important; background:#fff !important; }',",
      "      '.no-print { display:none !important; }',",
      "      '.sticky, [class*=\"sticky\"], .fixed { position: static !important; }',",
      "      '[class*=\"overflow-y-auto\"], [class*=\"overflow-auto\"] { overflow: visible !important; max-height: none !important; }',",
      "      '.ppt-slides-container, .ppt-slide { display:none !important; }',",
      "      '#report-root { width: ' + REPORT_W + 'px !important; max-width: ' + REPORT_W + 'px !important; margin: 0 !important; padding: 12px !important; }'",
      "    ].join('\\n')",
      "  });",

      // Wait for fonts best-effort
      "  try {",
      "    await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });",
      "  } catch (e) {}",

      // Gather section breaks and their heights
      "  const sections = await page.evaluate(() => {",
      "    const root = document.querySelector('#report-root');",
      "    if (!root) return null;",
      "    const nodes = Array.from(root.querySelectorAll('.ppt-break'));",
      "    const fallback = Array.from(root.querySelectorAll('.pdf-break-before'));",
      "    const list = (nodes.length ? nodes : fallback);",
      "    const sec = list.map(el => ({ top: el.offsetTop || 0, h: el.offsetHeight || 0 }))",
      "      .filter(x => x.top >= 0)",
      "      .sort((a,b) => a.top - b.top);",
      "    // Ensure we always start at top",
      "    if (!sec.length || sec[0].top !== 0) sec.unshift({ top: 0, h: root.scrollHeight });",
      "    // Compute end bounds by next top (more reliable than offsetHeight)",
      "    const totalHeight = root.scrollHeight;",
      "    const sec2 = sec.map((s, i) => {",
      "      const nextTop = (i < sec.length - 1) ? sec[i+1].top : totalHeight;",
      "      return { top: s.top, end: Math.max(s.top + 1, nextTop) };",
      "    });",
      "    return { totalHeight, sec: sec2 };",
      "  });",
      "  if (!sections) return { data: { ok:false, error:'Missing report-root' }, type:'application/json' };",

      // Create fixed camera viewport and move report by top (NOT transform)
      "  await page.evaluate((LEFT, W, H, REPORT_W) => {",
      "    const root = document.querySelector('#report-root');",
      "    if (!root) return;",
      "    const wrapper = document.createElement('div');",
      "    wrapper.id = '__ppt_capture_viewport__';",
      "    wrapper.style.position = 'fixed';",
      "    wrapper.style.left = '0';",
      "    wrapper.style.top = '0';",
      "    wrapper.style.width = W + 'px';",
      "    wrapper.style.height = H + 'px';",
      "    wrapper.style.overflow = 'hidden';",
      "    wrapper.style.background = '#ffffff';",
      "    wrapper.style.zIndex = '999999';",
      "    document.documentElement.style.overflow = 'hidden';",
      "    document.body.style.overflow = 'hidden';",
      "    document.body.appendChild(wrapper);",
      "    wrapper.appendChild(root);",
      "    root.style.position = 'absolute';",
      "    root.style.left = LEFT + 'px';",
      "    root.style.top = '0px';",
      "    root.style.width = REPORT_W + 'px';",
      "    root.style.maxWidth = REPORT_W + 'px';",
      "    root.style.margin = '0';",
      "  }, LEFT, W, H, REPORT_W);",

      // Build offsets by section, then page INSIDE the section if it is taller than one slide
      "  const maxSlides = 40;",
      "  const offsets = [];",
      "  for (const s of sections.sec) {",
      "    for (let y = s.top; y < s.end; y += H) {",
      "      offsets.push(y);",
      "      if (offsets.length >= maxSlides) break;",
      "    }",
      "    if (offsets.length >= maxSlides) break;",
      "  }",

      "  const viewport = await page.$('#__ppt_capture_viewport__');",
      "  if (!viewport) return { data: { ok:false, error:'Missing viewport' }, type:'application/json' };",

      "  const results = [];",
      "  for (let i = 0; i < offsets.length; i++) {",
      "    const y = offsets[i];",
      "    await page.evaluate((yy) => {",
      "      const root = document.querySelector('#report-root');",
      "      if (root) root.style.top = (-yy) + 'px';",
      "    }, y);",
      "    await new Promise(r => setTimeout(r, 140));",
      "    const buf = await viewport.screenshot({ type: 'jpeg', quality: 92 });",
      "    results.push({ index: i+1, y, jpegB64: buf.toString('base64') });",
      "  }",

      "  return { data: { ok:true, totalHeight: sections.totalHeight, offsets, results }, type:'application/json' };",
      "}",
    ].join("\n");

    const res = await fetch(`${base}/function?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: browserlessFn, context: { url } }),
    });

    if (!res.ok) {
      const text = await res.text();
      return json(res.status, { error: "Browserless function failed", status: res.status, details: text });
    }

    const payload = await res.json();
    const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;

    if (!data?.ok || !Array.isArray(data.results)) {
      return json(500, { error: "Unexpected Browserless payload", payload });
    }

    // Build PPTX
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";

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

    const outB64 = await pptx.write("base64");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Report_${surveyId}.pptx"`,
        "Cache-Control": "no-store",
      },
      body: outB64,
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error(err);
    return json(500, { error: "PPT export failed", details: String(err?.message || err) });
  }
};
