// netlify/functions/export-pptx.js
const PptxGenJS = require("pptxgenjs");

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(obj),
  };
}

function safeText(v) {
  return String(v ?? "").replace(/\u00A0/g, " ").trim();
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

    // Hybrid deck uses real report page; export=1 enables export styling.
    // mode=pptdeck is optional; we inject CSS regardless.
    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1&mode=pptdeck`;

    const browserlessFn = `
export default async function ({ page, context }) {
  const { url } = context;

  // Appendix capture resolution
  const W = 1920;
  const H = 1080;

  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector("#report-root", { timeout: 60000 });

  // Deterministic export CSS
  await page.addStyleTag({
    content: \`
      html, body { margin:0 !important; padding:0 !important; background:#fff !important; }
      .no-print { display:none !important; }
      .sticky, [class*="sticky"], .fixed { position: static !important; }
      [class*="overflow-y-auto"], [class*="overflow-auto"] { overflow: visible !important; max-height: none !important; }
      .ppt-slides-container, .ppt-slide { display:none !important; }
      /* Keep a stable canvas width for consistent screenshots */
      #report-root { width: 1280px !important; max-width: 1280px !important; margin: 0 auto !important; padding: 18px !important; }
    \`
  });

  // Best-effort wait for fonts
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch(e) {}

  // ---------- SCRAPE USING DATA-EXPORT MARKERS WHEN AVAILABLE ----------
  const model = await page.evaluate(() => {
    const root = document.querySelector("#report-root");
    if (!root) return null;

    const t = (el) => (el && el.textContent ? el.textContent.trim() : "");
    const numFromLocal = (s) => {
      const m = String(s || "").replace(/,/g,"").match(/-?\\d+(\\.\\d+)?/);
      return m ? Number(m[0]) : null;
    };

    const byExport = (key) => root.querySelector(\`[data-export="\${key}"]\`);

    const companyName = t(byExport("company-name")) || t(root.querySelector("h2")) || "Company";
    const compositeScore = numFromLocal(t(byExport("composite-score"))) ?? null;
    const tierName = t(byExport("tier-name")) || "";

    const metricCurrently = numFromLocal(t(byExport("metric-currently-offering"))) ?? null;
    const metricDev = numFromLocal(t(byExport("metric-in-development"))) ?? null;
    const metricGaps = numFromLocal(t(byExport("metric-gaps"))) ?? null;
    const metricLeading = numFromLocal(t(byExport("metric-leading-plus"))) ?? null;

    const execSummary = t(byExport("executive-summary-text")) || "";

    // Dimension table
    let dimRows = [];
    const table = root.querySelector("#dimension-performance-table") || byExport("dimension-performance-table") || root.querySelector("table");
    if (table) {
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      dimRows = rows.map(r => {
        const tds = Array.from(r.querySelectorAll("td"));
        const vals = tds.map(td => t(td));
        const dimNum = numFromLocal(vals[0]) ?? null;
        const name = vals[1] || "";
        const weight = numFromLocal(vals[2]) ?? null;
        const score = vals.map(v => numFromLocal(v)).find(v => v !== null) ?? null;
        const tier = vals.find(v => ["Exemplary","Leading","Progressing","Emerging","Developing"].includes(v)) || "";
        return { dimNum, name, weight, score, tier };
      }).filter(x => x.name);
    }

    // Strengths/growth from dimRows scores
    const scored = dimRows
      .map(d => ({ ...d, scoreN: typeof d.score === "number" ? d.score : null }))
      .filter(d => d.scoreN !== null);

    const strengths = scored.slice().sort((a,b) => (b.scoreN - a.scoreN)).slice(0, 4);
    const growth = scored.slice().sort((a,b) => (a.scoreN - b.scoreN)).slice(0, 4);

    // Appendix start/end anchors
    const appendixStartEl = document.querySelector("#appendix-start");
    const appendixEndEl = document.querySelector("#appendix-end");

    let appendixStart = appendixStartEl ? (appendixStartEl.offsetTop || 0) : 0;
    let appendixEnd = appendixEndEl ? (appendixEndEl.offsetTop || root.scrollHeight) : root.scrollHeight;

    // Heuristic fallback if anchors not present
    if (!appendixStartEl) {
      const recHeader = Array.from(root.querySelectorAll("h2,h3,h4")).find(h => t(h).toLowerCase().includes("strategic recommendations"));
      if (recHeader) appendixStart = recHeader.offsetTop || 0;
    }
    if (!appendixEndEl) {
      const methHeader = Array.from(root.querySelectorAll("h2,h3,h4")).find(h => t(h).toLowerCase().includes("assessment methodology"));
      if (methHeader) appendixEnd = Math.min(root.scrollHeight, (methHeader.offsetTop || root.scrollHeight) + 900);
    }

    appendixStart = Math.max(0, appendixStart);
    appendixEnd = Math.max(appendixStart + 1, appendixEnd);

    return {
      companyName,
      compositeScore,
      tierName,
      metricCurrently,
      metricDev,
      metricGaps,
      metricLeading,
      execSummary,
      dimRows,
      strengths,
      growth,
      appendixStart,
      appendixEnd
    };
  });

  if (!model) {
    return { data: { ok: false, error: "Could not read #report-root" }, type: "application/json" };
  }

  // ---------- MATRIX IMAGE ----------
  let matrixPngB64 = null;
  const matrixEl = await page.$("#export-matrix");
  if (matrixEl) {
    const png = await matrixEl.screenshot({ type: "png" });
    matrixPngB64 = png.toString("base64");
  }

  // ---------- APPENDIX CAPTURE ----------
  await page.evaluate(() => {
    const root = document.querySelector("#report-root");
    if (!root) return;

    const wrapper = document.createElement("div");
    wrapper.id = "__ppt_capture_viewport__";
    wrapper.style.position = "fixed";
    wrapper.style.left = "0";
    wrapper.style.top = "0";
    wrapper.style.width = "1920px";
    wrapper.style.height = "1080px";
    wrapper.style.overflow = "hidden";
    wrapper.style.background = "#ffffff";
    wrapper.style.zIndex = "999999";

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    document.body.appendChild(wrapper);
    wrapper.appendChild(root);

    root.style.position = "absolute";
    root.style.left = "0px";
    root.style.top = "0px";
    root.style.width = "1280px";
    root.style.maxWidth = "1280px";
    root.style.margin = "0";
  });

  const viewport = await page.$("#__ppt_capture_viewport__");

  const startY = Math.max(0, Number(model.appendixStart || 0));
  const endY = Math.max(startY + 1, Number(model.appendixEnd || 0));

  const anchors = await page.evaluate(() => {
    const root = document.querySelector("#report-root");
    if (!root) return [];
    const els = Array.from(root.querySelectorAll(".ppt-break, .pdf-break-before"));
    const pts = els.map(el => el.offsetTop).filter(v => typeof v === "number" && v >= 0);
    return Array.from(new Set([0, ...pts])).sort((a,b) => a-b);
  });

  const step = 1080;
  const maxAppendixSlides = 18;
  const appendixImgs = [];

  const snapToAnchor = (y) => {
    if (!Array.isArray(anchors) || !anchors.length) return y;
    let snapped = 0;
    for (let i = anchors.length - 1; i >= 0; i--) {
      if (anchors[i] <= y) { snapped = anchors[i]; break; }
    }
    return snapped;
  };

  if (viewport) {
    const desired = [];
    for (let y = startY; y < endY && desired.length < maxAppendixSlides; y += step) desired.push(y);

    const snapped = desired.map(y => snapToAnchor(y));
    const offsets = [];
    for (const y of snapped) {
      if (offsets.length === 0 || offsets[offsets.length - 1] !== y) offsets.push(y);
    }

    for (let i = 0; i < offsets.length; i++) {
      const y = offsets[i];

      await page.evaluate((yy) => {
        const root = document.querySelector("#report-root");
        if (root) root.style.top = (-yy) + "px";
      }, y);

      await new Promise(r => setTimeout(r, 160));

      const buf = await viewport.screenshot({ type: "jpeg", quality: 92 });
      appendixImgs.push({ y, jpegB64: buf.toString("base64") });
    }
  }

  return { data: { ok: true, model, matrixPngB64, appendixImgs }, type: "application/json" };
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

    if (!data?.ok || !data.model) {
      return json(500, { error: "Unexpected Browserless payload", payload });
    }

    const m = data.model;

    // ---------- BUILD PPTX ----------
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Cancer and Careers";
    pptx.title = `${safeText(m.companyName)} - Cancer Support Assessment`;

    const inchesW = 13.333;
    const inchesH = 7.5;

    const addTitle = (slide, title, subtitle) => {
      slide.addText(title, { x: 0.7, y: 0.35, w: 12.0, h: 0.6, fontSize: 26, color: "1E293B", bold: true });
      if (subtitle) slide.addText(subtitle, { x: 0.7, y: 0.92, w: 12.0, h: 0.35, fontSize: 12, color: "475569" });
    };

    // Slide 1: Title
    {
      const slide = pptx.addSlide();
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: inchesW, h: inchesH, fill: { color: "1E293B" } });
      slide.addText("Best Companies for Working with Cancer", { x: 0.8, y: 0.9, w: 12, h: 0.6, fontSize: 28, color: "FFFFFF", bold: true });
      slide.addText("Index 2026 | Performance Assessment", { x: 0.8, y: 1.55, w: 12, h: 0.4, fontSize: 14, color: "CBD5E1" });
      slide.addText(safeText(m.companyName), { x: 0.8, y: 2.6, w: 12, h: 0.8, fontSize: 40, color: "FFFFFF", bold: true });

      const score = typeof m.compositeScore === "number" ? m.compositeScore : "";
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 4.0, w: 2.2, h: 1.3, fill: { color: "5B21B6" } });
      slide.addText(String(score), { x: 0.8, y: 4.08, w: 2.2, h: 0.9, fontSize: 44, color: "FFFFFF", bold: true, align: "center" });
      slide.addText("Composite Score", { x: 0.8, y: 5.05, w: 2.2, h: 0.3, fontSize: 11, color: "FFFFFF", align: "center" });

      slide.addShape(pptx.ShapeType.roundRect, { x: 3.2, y: 4.2, w: 2.6, h: 0.7, fill: { color: "374151" } });
      slide.addText(safeText(m.tierName || ""), { x: 3.2, y: 4.28, w: 2.6, h: 0.5, fontSize: 16, color: "FFFFFF", bold: true, align: "center" });
    }

    // Slide 2: Executive Summary metrics
    {
      const slide = pptx.addSlide();
      addTitle(slide, "Executive Summary", "Key metrics and overall performance snapshot");

      const metric = (x, label, val) => {
        slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.4, w: 3.0, h: 1.2, fill: { color: "F1F5F9" }, line: { color: "E2E8F0" } });
        slide.addText(String(val ?? "—"), { x, y: 1.55, w: 3.0, h: 0.6, fontSize: 30, color: "0F172A", bold: true, align: "center" });
        slide.addText(label, { x, y: 2.1, w: 3.0, h: 0.35, fontSize: 10.5, color: "475569", align: "center" });
      };

      metric(0.7, "Elements offered", m.metricCurrently);
      metric(3.9, "In development", m.metricDev);
      metric(7.1, "Identified gaps", m.metricGaps);
      metric(10.3, "Dimensions at Leading+", m.metricLeading);

      const summary = safeText(m.execSummary || "");
      if (summary) {
        slide.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 2.9, w: 12.0, h: 4.3, fill: { color: "FFFFFF" }, line: { color: "E2E8F0" } });
        slide.addText(summary, { x: 1.0, y: 3.15, w: 11.4, h: 4.0, fontSize: 12, color: "334155" });
      } else {
        slide.addText("Detailed narrative and recommendations are included in the appendix.", { x: 0.7, y: 3.1, w: 12, h: 0.5, fontSize: 12, color: "475569" });
      }
    }

    // Slide 3: Dimension Performance (editable table)
    {
      const slide = pptx.addSlide();
      addTitle(slide, "Dimension Performance", "Scores by dimension (weight, performance, tier)");

      const rows = [];
      rows.push(["#", "Dimension", "Wt", "Score", "Tier"]);

      const dimRows = Array.isArray(m.dimRows) ? m.dimRows : [];
      const top13 = dimRows.slice(0, 13).map(d => ([
        d.dimNum ? `D${d.dimNum}` : "",
        safeText(d.name),
        (typeof d.weight === "number" ? `${d.weight}%` : ""),
        (typeof d.score === "number" ? String(d.score) : ""),
        safeText(d.tier)
      ]));

      rows.push(...top13);

      slide.addTable(rows, {
        x: 0.7,
        y: 1.35,
        w: 12.0,
        colW: [0.8, 6.4, 1.0, 1.0, 2.8],
        fontSize: 10,
        border: { type: "solid", pt: 0.5, color: "E2E8F0" },
      });
    }

    // Slide 4: Matrix (image)
    {
      const slide = pptx.addSlide();
      addTitle(slide, "Strategic Priority Matrix", "Performance vs strategic importance");
      if (data.matrixPngB64) {
        slide.addImage({
          data: `data:image/png;base64,${data.matrixPngB64}`,
          x: 0.6,
          y: 1.25,
          w: 12.1,
          h: 6.1
        });
      } else {
        slide.addText("Matrix unavailable in export. See appendix.", { x: 0.7, y: 2.5, w: 12, h: 0.5, fontSize: 14, color: "64748B" });
      }
    }

    // Slide 5: Strengths & Priority Improvements
    {
      const slide = pptx.addSlide();
      addTitle(slide, "Strengths & Priority Improvements", "Top opportunities to maintain and improve");

      const strengths = Array.isArray(m.strengths) ? m.strengths : [];
      const growth = Array.isArray(m.growth) ? m.growth : [];

      slide.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 1.35, w: 6.0, h: 5.9, fill: { color: "ECFDF5" }, line: { color: "A7F3D0" } });
      slide.addText("Areas of Excellence", { x: 1.0, y: 1.55, w: 5.5, h: 0.3, fontSize: 14, color: "047857", bold: true });
      slide.addText(
        strengths.map(s => `• ${safeText(s.name)} (${s.scoreN ?? s.score ?? ""})`).join("\n") || "—",
        { x: 1.0, y: 1.95, w: 5.5, h: 5.0, fontSize: 12, color: "065F46" }
      );

      slide.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 1.35, w: 5.8, h: 5.9, fill: { color: "FFFBEB" }, line: { color: "FDE68A" } });
      slide.addText("Priority Improvements", { x: 7.2, y: 1.55, w: 5.2, h: 0.3, fontSize: 14, color: "B45309", bold: true });
      slide.addText(
        growth.map(g => `• ${safeText(g.name)} (${g.scoreN ?? g.score ?? ""})`).join("\n") || "—",
        { x: 7.2, y: 1.95, w: 5.2, h: 5.0, fontSize: 12, color: "92400E" }
      );
    }

    // Slide 6: Roadmap (generic, appendix has detail)
    {
      const slide = pptx.addSlide();
      addTitle(slide, "Implementation Roadmap", "Phased approach to strengthen capabilities");
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 1.35, w: 12.0, h: 5.9, fill: { color: "F8FAFC" }, line: { color: "E2E8F0" } });
      slide.addText(
        "See the appendix for the detailed phased roadmap aligned to your highest-weight and lowest-performing dimensions.",
        { x: 1.0, y: 1.75, w: 11.4, h: 1.0, fontSize: 14, color: "334155" }
      );
    }

    // Slide 7: Appendix title
    {
      const slide = pptx.addSlide();
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: inchesW, h: inchesH, fill: { color: "0F172A" } });
      slide.addText("Appendix", { x: 0.9, y: 2.7, w: 12, h: 0.7, fontSize: 44, color: "FFFFFF", bold: true });
      slide.addText("Detailed recommendations and supporting pages", { x: 0.9, y: 3.6, w: 12, h: 0.4, fontSize: 16, color: "CBD5E1" });
    }

    // Appendix slides (images)
    const appendixImgs = Array.isArray(data.appendixImgs) ? data.appendixImgs : [];
    for (const img of appendixImgs) {
      const slide = pptx.addSlide();
      slide.addImage({
        data: `data:image/jpeg;base64,${img.jpegB64}`,
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
        "Content-Disposition": \`attachment; filename="Report_\${surveyId}.pptx"\`,
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
