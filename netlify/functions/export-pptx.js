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

    /**
     * IMPORTANT:
     * Use a capture-friendly mode that:
     * - hides action bar / sticky elements
     * - sets a clean white background
     * - ensures #report-root exists and has full height
     * - hides any .ppt-slide templates
     *
     * If you already implemented mode=pptreport, keep this as-is.
     */
    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=pptreport`;

    const browserlessFn = `
export default async function ({ page, context }) {
  const { url } = context;

  // Slide "camera" size
  const W = 1280;
  const H = 720;

  // Higher deviceScaleFactor increases sharpness without changing layout
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector("#report-root", { timeout: 60000 });

  // Make rendering deterministic + prevent any hidden PPT templates from sneaking in
  await page.addStyleTag({
    content: \`
      html, body { margin:0 !important; padding:0 !important; background:#fff !important; }
      .no-print { display:none !important; }
      .sticky, [class*="sticky"], .fixed { position: static !important; }
      [class*="overflow-y-auto"], [class*="overflow-auto"] { overflow: visible !important; max-height: none !important; }
      .ppt-slides-container, .ppt-slide { display:none !important; }
    \`
  });

  // Best-effort wait for fonts
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch(e) {}

  // Measure report height BEFORE we re-parent it into our capture viewport
  const metrics = await page.evaluate(() => {
    const root = document.querySelector("#report-root");
    if (!root) return { totalHeight: 0, breakOffsets: [] };

    const totalHeight = root.scrollHeight;

    // Use existing markers to create cleaner breaks.
    // If none exist, breakOffsets will be empty and we will fall back to 720px paging.
    const breakEls = Array.from(root.querySelectorAll(".pdf-break-before"));
    const breakOffsets = breakEls
      .map(el => el.offsetTop)
      .filter(v => typeof v === "number" && v >= 0)
      .sort((a,b) => a-b);

    return { totalHeight, breakOffsets };
  });

  const totalHeight = metrics.totalHeight || 0;
  const breakOffsets = Array.isArray(metrics.breakOffsets) ? metrics.breakOffsets : [];

  if (!totalHeight || totalHeight < 50) {
    // Nothing meaningful to capture
    return { data: { ok: false, error: "Report height too small", totalHeight }, type: "application/json" };
  }

  // Create a fixed capture viewport and move report-root into it
  await page.evaluate(() => {
    const root = document.querySelector("#report-root");
    if (!root) return;

    const wrapper = document.createElement("div");
    wrapper.id = "__ppt_capture_viewport__";
    wrapper.style.position = "fixed";
    wrapper.style.left = "0";
    wrapper.style.top = "0";
    wrapper.style.width = "1280px";
    wrapper.style.height = "720px";
    wrapper.style.overflow = "hidden";
    wrapper.style.background = "#ffffff";
    wrapper.style.zIndex = "999999";

    // Prevent scroll dependence
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    // Put wrapper at end of body and move root inside
    document.body.appendChild(wrapper);
    wrapper.appendChild(root);

    // Absolutely position root so we can move it by changing top (NOT transform)
    root.style.position = "absolute";
    root.style.left = "0px";
    root.style.top = "0px";
    root.style.width = "1280px";
    root.style.maxWidth = "1280px";
    root.style.margin = "0";
  });

  // Build slide offsets using breakpoints when available, otherwise 720 paging.
  const maxSlides = 30;

  // Segment logic:
  // starts = [0, ...breakOffsets]
  // within each segment, add H paging
  const starts = [0, ...breakOffsets.filter(v => v > 0 && v < totalHeight)];
  const uniqueStarts = Array.from(new Set(starts)).sort((a,b) => a-b);

  const offsets = [];
  for (let si = 0; si < uniqueStarts.length; si++) {
    const segStart = uniqueStarts[si];
    const segEnd = (si < uniqueStarts.length - 1) ? uniqueStarts[si + 1] : totalHeight;

    for (let y = segStart; y < segEnd; y += H) {
      offsets.push(y);
      if (offsets.length >= maxSlides) break;
    }
    if (offsets.length >= maxSlides) break;
  }

  // Fallback if no offsets computed
  if (!offsets.length) {
    for (let y = 0; y < totalHeight && offsets.length < maxSlides; y += H) offsets.push(y);
  }

  // Capture each slice
  const results = [];
  for (let i = 0; i < offsets.length; i++) {
    const y = offsets[i];

    // Move report by setting top (crisp text; avoids transform blur)
    await page.evaluate((yy) => {
      const root = document.querySelector("#report-root");
      if (root) root.style.top = (-yy) + "px";
    }, y);

    await new Promise(r => setTimeout(r, 140));

    const viewport = await page.$("#__ppt_capture_viewport__");
    if (!viewport) {
      results.push({ index: i+1, error: "missing_viewport" });
      continue;
    }

    const buf = await viewport.screenshot({
      type: "jpeg",
      quality: 92
    });

    results.push({ index: i+1, y, jpegB64: buf.toString("base64") });
  }

  return { data: { ok: true, totalHeight, offsets, results }, type: "application/json" };
}
`;

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

    const failed = data.results.filter(r => r.error || !r.jpegB64);
    if (failed.length) {
      return json(500, { error: "One or more slide captures failed", failed });
    }

    // Build PPTX
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5

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
