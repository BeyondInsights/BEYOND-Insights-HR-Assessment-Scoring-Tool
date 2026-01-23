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
    const surveyId = event.queryStringParameters && event.queryStringParameters.surveyId;
    if (!surveyId) return json(400, { error: "Missing surveyId" });

    const token = process.env.BROWSERLESS_TOKEN;
    const base = process.env.BROWSERLESS_BASE || "https://production-sfo.browserless.io";
    if (!token) return json(500, { error: "Missing BROWSERLESS_TOKEN env var" });

    const host = event.headers["x-forwarded-host"] || event.headers.host;
    const proto = event.headers["x-forwarded-proto"] || "https";
    const origin = proto + "://" + host;

    const reportUrl =
      origin +
      "/admin/reports/" +
      encodeURIComponent(surveyId) +
      "?export=1&mode=pptdeck";

    // Build Browserless Function code without nested template literals
    const browserlessFn = [
      "export default async function ({ page, context }) {",
      "  const url = context.url;",
      "  const W = 1920;",
      "  const H = 1080;",
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
      "      '#report-root { width: 1280px !important; max-width: 1280px !important; margin: 0 auto !important; padding: 18px !important; }'",
      "    ].join('\\n')",
      "  });",

      "  try {",
      "    await page.evaluate(async () => {",
      "      if (document.fonts && document.fonts.ready) await document.fonts.ready;",
      "    });",
      "  } catch (e) {}",

      "  const model = await page.evaluate(() => {",
      "    const root = document.querySelector('#report-root');",
      "    if (!root) return null;",
      "    const t = (el) => (el && el.textContent ? el.textContent.trim() : '');",
      "    const numFrom = (s) => {",
      "      const m = String(s || '').replace(/,/g,'').match(/-?\\\\d+(\\\\.\\\\d+)?/);",
      "      return m ? Number(m[0]) : null;",
      "    };",
      "    const byExport = (key) => root.querySelector('[data-export=\"' + key + '\"]');",
      "    const companyName = t(byExport('company-name')) || t(root.querySelector('h2')) || 'Company';",
      "    const compositeScore = numFrom(t(byExport('composite-score')));",
      "    const tierName = t(byExport('tier-name')) || '';",
      "    const metricCurrently = numFrom(t(byExport('metric-currently-offering')));",
      "    const metricDev = numFrom(t(byExport('metric-in-development')));",
      "    const metricGaps = numFrom(t(byExport('metric-gaps')));",
      "    const metricLeading = numFrom(t(byExport('metric-leading-plus')));",
      "    const execSummary = t(byExport('executive-summary-text')) || '';",

      "    let dimRows = [];",
      "    const table = root.querySelector('#dimension-performance-table') || root.querySelector('table');",
      "    if (table) {",
      "      const rows = Array.from(table.querySelectorAll('tbody tr'));",
      "      dimRows = rows.map(r => {",
      "        const tds = Array.from(r.querySelectorAll('td'));",
      "        const vals = tds.map(td => t(td));",
      "        const dimNum = numFrom(vals[0]);",
      "        const name = vals[1] || '';",
      "        const weight = numFrom(vals[2]);",
      "        const score = vals.map(v => numFrom(v)).find(v => v !== null);",
      "        const tier = vals.find(v => ['Exemplary','Leading','Progressing','Emerging','Developing'].includes(v)) || '';",
      "        return { dimNum, name, weight, score, tier };",
      "      }).filter(x => x.name);",
      "    }",

      "    const scored = dimRows.map(d => ({ ...d, scoreN: (typeof d.score === 'number' ? d.score : null) })).filter(d => d.scoreN !== null);",
      "    const strengths = scored.slice().sort((a,b)=>b.scoreN-a.scoreN).slice(0,4);",
      "    const growth = scored.slice().sort((a,b)=>a.scoreN-b.scoreN).slice(0,4);",

      "    let appendixStart = 0;",
      "    let appendixEnd = root.scrollHeight;",
      "    const sEl = document.querySelector('#appendix-start');",
      "    const eEl = document.querySelector('#appendix-end');",
      "    if (sEl) appendixStart = sEl.offsetTop || 0;",
      "    if (eEl) appendixEnd = eEl.offsetTop || appendixEnd;",
      "    appendixStart = Math.max(0, appendixStart);",
      "    appendixEnd = Math.max(appendixStart + 1, appendixEnd);",

      "    return { companyName, compositeScore, tierName, metricCurrently, metricDev, metricGaps, metricLeading, execSummary, dimRows, strengths, growth, appendixStart, appendixEnd };",
      "  });",

      "  if (!model) return { data: { ok: false, error: 'Could not read #report-root' }, type: 'application/json' };",

      "  let matrixPngB64 = null;",
      "  const matrixEl = await page.$('#export-matrix');",
      "  if (matrixEl) {",
      "    const png = await matrixEl.screenshot({ type: 'png' });",
      "    matrixPngB64 = png.toString('base64');",
      "  }",

      "  await page.evaluate(() => {",
      "    const root = document.querySelector('#report-root');",
      "    if (!root) return;",
      "    const wrapper = document.createElement('div');",
      "    wrapper.id = '__ppt_capture_viewport__';",
      "    wrapper.style.position = 'fixed';",
      "    wrapper.style.left = '0';",
      "    wrapper.style.top = '0';",
      "    wrapper.style.width = '1920px';",
      "    wrapper.style.height = '1080px';",
      "    wrapper.style.overflow = 'hidden';",
      "    wrapper.style.background = '#ffffff';",
      "    wrapper.style.zIndex = '999999';",
      "    document.documentElement.style.overflow = 'hidden';",
      "    document.body.style.overflow = 'hidden';",
      "    document.body.appendChild(wrapper);",
      "    wrapper.appendChild(root);",
      "    root.style.position = 'absolute';",
      "    root.style.left = '0px';",
      "    root.style.top = '0px';",
      "    root.style.width = '1280px';",
      "    root.style.maxWidth = '1280px';",
      "    root.style.margin = '0';",
      "  });",

      "  const viewport = await page.$('#__ppt_capture_viewport__');",
      "  const startY = Math.max(0, Number(model.appendixStart || 0));",
      "  const endY = Math.max(startY + 1, Number(model.appendixEnd || 0));",
      "  const step = 1080;",
      "  const maxAppendixSlides = 18;",
      "  const appendixImgs = [];",
      "  if (viewport) {",
      "    for (let y = startY; y < endY && appendixImgs.length < maxAppendixSlides; y += step) {",
      "      await page.evaluate((yy) => {",
      "        const root = document.querySelector('#report-root');",
      "        if (root) root.style.top = (-yy) + 'px';",
      "      }, y);",
      "      await new Promise(r => setTimeout(r, 160));",
      "      const buf = await viewport.screenshot({ type: 'jpeg', quality: 92 });",
      "      appendixImgs.push({ y, jpegB64: buf.toString('base64') });",
      "    }",
      "  }",

      "  return { data: { ok: true, model, matrixPngB64, appendixImgs }, type: 'application/json' };",
      "}",
    ].join("\n");

    const res = await fetch(base + "/function?token=" + token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: browserlessFn, context: { url: reportUrl } }),
    });

    if (!res.ok) {
      const text = await res.text();
      return json(res.status, { error: "Browserless function failed", status: res.status, details: text });
    }

    const payload = await res.json();
    const data = payload && payload.data && typeof payload.data === "object" ? payload.data : payload;
    if (!data || !data.ok || !data.model) return json(500, { error: "Unexpected Browserless payload", payload });

    const m = data.model;

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";

    const inchesW = 13.333;
    const inchesH = 7.5;

    const addTitle = (slide, title, subtitle) => {
      slide.addText(title, { x: 0.7, y: 0.35, w: 12.0, h: 0.6, fontSize: 26, color: "1E293B", bold: true });
      if (subtitle) slide.addText(subtitle, { x: 0.7, y: 0.92, w: 12.0, h: 0.35, fontSize: 12, color: "475569" });
    };

    // Slide 1
    {
      const slide = pptx.addSlide();
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: inchesW, h: inchesH, fill: { color: "1E293B" } });
      slide.addText("Best Companies for Working with Cancer", { x: 0.8, y: 0.9, w: 12, h: 0.6, fontSize: 28, color: "FFFFFF", bold: true });
      slide.addText("Index 2026 | Performance Assessment", { x: 0.8, y: 1.55, w: 12, h: 0.4, fontSize: 14, color: "CBD5E1" });
      slide.addText(safeText(m.companyName), { x: 0.8, y: 2.6, w: 12, h: 0.8, fontSize: 40, color: "FFFFFF", bold: true });

      const score = typeof m.compositeScore === "number" ? m.compositeScore : "—";
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 4.0, w: 2.2, h: 1.3, fill: { color: "5B21B6" } });
      slide.addText(String(score), { x: 0.8, y: 4.08, w: 2.2, h: 0.9, fontSize: 44, color: "FFFFFF", bold: true, align: "center" });
      slide.addText("Composite Score", { x: 0.8, y: 5.05, w: 2.2, h: 0.3, fontSize: 11, color: "FFFFFF", align: "center" });

      slide.addShape(pptx.ShapeType.roundRect, { x: 3.2, y: 4.2, w: 2.6, h: 0.7, fill: { color: "374151" } });
      slide.addText(safeText(m.tierName || ""), { x: 3.2, y: 4.28, w: 2.6, h: 0.5, fontSize: 16, color: "FFFFFF", bold: true, align: "center" });
    }

    // Slide 2
    {
      const slide = pptx.addSlide();
      addTitle(slide, "Executive Summary", "Key metrics and snapshot");

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
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 2.9, w: 12.0, h: 4.3, fill: { color: "FFFFFF" }, line: { color: "E2E8F0" } });
      slide.addText(summary || "Detailed narrative and recommendations are included in the appendix.", { x: 1.0, y: 3.15, w: 11.4, h: 4.0, fontSize: 12, color: "334155" });
    }

    // Slide 3: Dimension table
    {
      const slide = pptx.addSlide();
      addTitle(slide, "Dimension Performance", "Scores by dimension");

      const rows = [];
      rows.push(["#", "Dimension", "Wt", "Score", "Tier"]);

      const dimRows = Array.isArray(m.dimRows) ? m.dimRows : [];
      dimRows.slice(0, 13).forEach((d) => {
        rows.push([
          d.dimNum ? "D" + d.dimNum : "",
          safeText(d.name),
          (typeof d.weight === "number" ? d.weight + "%" : ""),
          (typeof d.score === "number" ? String(d.score) : ""),
          safeText(d.tier)
        ]);
      });

      slide.addTable(rows, {
        x: 0.7,
        y: 1.35,
        w: 12.0,
        colW: [0.8, 6.4, 1.0, 1.0, 2.8],
        fontSize: 10,
        border: { type: "solid", pt: 0.5, color: "E2E8F0" },
      });
    }

    // Slide 4: Matrix image
    {
      const slide = pptx.addSlide();
      addTitle(slide, "Strategic Priority Matrix", "Performance vs strategic importance");
      if (data.matrixPngB64) {
        slide.addImage({ data: "data:image/png;base64," + data.matrixPngB64, x: 0.6, y: 1.25, w: 12.1, h: 6.1 });
      } else {
        slide.addText("Matrix unavailable in export. See appendix.", { x: 0.7, y: 2.5, w: 12, h: 0.5, fontSize: 14, color: "64748B" });
      }
    }

    // Slide 5: Appendix title
    {
      const slide = pptx.addSlide();
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: inchesW, h: inchesH, fill: { color: "0F172A" } });
      slide.addText("Appendix", { x: 0.9, y: 2.7, w: 12, h: 0.7, fontSize: 44, color: "FFFFFF", bold: true });
      slide.addText("Detailed recommendations and supporting pages", { x: 0.9, y: 3.6, w: 12, h: 0.4, fontSize: 16, color: "CBD5E1" });
    }

    // Appendix images
    const appendixImgs = Array.isArray(data.appendixImgs) ? data.appendixImgs : [];
    appendixImgs.forEach((img) => {
      const slide = pptx.addSlide();
      slide.addImage({ data: "data:image/jpeg;base64," + img.jpegB64, x: 0, y: 0, w: 13.333, h: 7.5 });
    });

    const outB64 = await pptx.write("base64");

    // FIXED: Content-Disposition string must be quoted
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
