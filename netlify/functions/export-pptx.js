// netlify/functions/export-pptx.js
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

    // Supabase env (support both naming conventions)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_EXPORT_BUCKET || "exports";

    if (!supabaseUrl || !serviceKey) {
      return json(500, { error: "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY" });
    }

    const host = event.headers["x-forwarded-host"] || event.headers.host;
    const proto = event.headers["x-forwarded-proto"] || "https";
    const origin = `${proto}://${host}`;

    // Capture-friendly mode
    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=pptreport`;

    const browserlessFn = [
      "export default async function ({ page, context }) {",
      "  const url = context.url;",

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

      "  try {",
      "    await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });",
      "  } catch (e) {}",

      // Collect breakpoints and FILTER out those too close together (prevents duplicate slides)
      "  const breaks = await page.evaluate(() => {",
      "    const root = document.querySelector('#report-root');",
      "    if (!root) return null;",
      "    const totalHeight = root.scrollHeight;",
      "    const pts = Array.from(root.querySelectorAll('.ppt-break'))",
      "      .map(el => el.offsetTop || 0)",
      "      .filter(v => typeof v === 'number' && v >= 0)",
      "      .sort((a,b) => a-b);",
      "    const list = pts.length ? pts : [0];",
      "    return { totalHeight, pts: Array.from(new Set([0, ...list])).sort((a,b)=>a-b) };",
      "  });",
      "  if (!breaks || !breaks.totalHeight) return { data: { ok:false, error:'Missing/empty report-root' }, type:'application/json' };",

      // Filter: keep only breakpoints at least ~80% of a slide apart
      "  const MIN_GAP = Math.round(H * 0.80);",
      "  const filtered = [];",
      "  for (const p of breaks.pts) {",
      "    if (!filtered.length) { filtered.push(p); continue; }",
      "    if (p - filtered[filtered.length - 1] >= MIN_GAP) filtered.push(p);",
      "  }",
      "  // Always include the end so we can build sections",
      "  const tops = filtered;",
      "  const totalHeight = breaks.totalHeight;",

      // Build merged sections [top, nextTop)
      "  const sections = tops.map((t, i) => ({",
      "    top: t,",
      "    end: (i < tops.length - 1 ? tops[i+1] : totalHeight)",
      "  }));",

      // Create a fixed camera viewport and shift the report using TOP (not transform) to keep it crisp
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

      // Build offsets by section start, then page inside section if section is taller than one slide
      "  const maxSlides = 40;",
      "  const offsets = [];",
      "  for (const s of sections) {",
      "    for (let y = s.top; y < s.end; y += H) {",
      "      offsets.push(y);",
      "      if (offsets.length >= maxSlides) break;",
      "    }",
      "    if (offsets.length >= maxSlides) break;",
      "  }",

      // De-dupe offsets (extra safety)
      "  const deduped = [];",
      "  for (const y of offsets) {",
      "    if (!deduped.length || deduped[deduped.length - 1] !== y) deduped.push(y);",
      "  }",

      "  const viewport = await page.$('#__ppt_capture_viewport__');",
      "  if (!viewport) return { data: { ok:false, error:'Missing viewport' }, type:'application/json' };",

      "  const results = [];",
      "  for (let i = 0; i < deduped.length; i++) {",
      "    const y = deduped[i];",
      "    await page.evaluate((yy) => {",
      "      const root = document.querySelector('#report-root');",
      "      if (root) root.style.top = (-yy) + 'px';",
      "    }, y);",
      "    await new Promise(r => setTimeout(r, 140));",
      "    const buf = await viewport.screenshot({ type: 'jpeg', quality: 92 });",
      "    results.push({ index: i+1, y, jpegB64: buf.toString('base64') });",
      "  }",

      "  return { data: { ok:true, results }, type:'application/json' };",
      "}",
    ].join("\n");

    const capRes = await fetch(`${base}/function?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: browserlessFn, context: { url } }),
    });

    if (!capRes.ok) {
      const text = await capRes.text();
      return json(capRes.status, { error: "Browserless function failed", details: text });
    }

    const capPayload = await capRes.json();
    const capData = capPayload?.data && typeof capPayload.data === "object" ? capPayload.data : capPayload;

    if (!capData?.ok || !Array.isArray(capData.results)) {
      return json(500, { error: "Unexpected Browserless payload", capPayload });
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

    // Write and upload
    const pptBuffer = await pptx.write("nodebuffer");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Upload bucket must exist; if not, you’ll see “bucket not found”
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = `ppt/${surveyId}/Report_${surveyId}_${ts}.pptx`;

    const up = await supabase.storage
      .from(bucket)
      .upload(filePath, pptBuffer, {
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        upsert: true,
      });

    if (up.error) {
      return json(500, { error: "Upload failed", details: up.error.message, bucket });
    }

    const signed = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60);
    if (signed.error) {
      return json(500, { error: "Signed URL failed", details: signed.error.message });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ ok: true, downloadUrl: signed.data.signedUrl, filePath }),
    };
  } catch (err) {
    console.error(err);
    return json(500, { error: "PPT export failed", details: String(err?.message || err) });
  }
};
