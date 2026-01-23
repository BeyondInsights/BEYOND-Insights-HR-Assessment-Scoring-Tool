// netlify/functions/export-pptx.js
//
// Captures the FULL HTML report as polished PPT slides
// Uses .ppt-break class markers in HTML for clean, logical breaks
// Each section becomes its own slide (or multiple slides if tall)
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
    const origin = proto + "://" + host;

    const url = origin + "/admin/reports/" + encodeURIComponent(surveyId) + "?export=1";

    // Browserless function - finds slide markers and captures each section
    const browserlessFn = [
      "export default async function ({ page, context }) {",
      "  const url = context.url;",
      "",
      "  // PPT slide dimensions (16:9 widescreen)",
      "  const SLIDE_WIDTH = 1280;",
      "  const SLIDE_HEIGHT = 720;",
      "",
      "  // Use wider viewport for better content rendering",
      "  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });",
      "  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });",
      "",
      "  // Wait for report to load",
      "  try {",
      "    await page.waitForSelector('#report-root', { timeout: 30000 });",
      "  } catch (e) {",
      "    return { data: { ok: false, error: 'Report root not found' }, type: 'application/json' };",
      "  }",
      "",
      "  // Add export-mode class and inject PPT export styles",
      "  await page.evaluate(() => {",
      "    document.body.classList.add('export-mode');",
      "    ",
      "    const style = document.createElement('style');",
      "    style.id = 'ppt-export-styles';",
      "    style.textContent = [",
      "      '.no-print { display: none !important; }',",
      "      '.sticky, [class*=\"sticky\"] { position: static !important; }',",
      "      'nav, header.sticky { display: none !important; }',",
      "      '#report-root { max-width: 1280px !important; width: 1280px !important; margin: 0 auto !important; padding: 20px 40px !important; background: #f8fafc !important; }',",
      "      '.ppt-slides-container { display: none !important; }',",
      "      '[class*=\"overflow-y-auto\"], [class*=\"overflow-auto\"], [class*=\"max-h-\"] { overflow: visible !important; max-height: none !important; }',",
      "      '.bg-white { background: white !important; }'",
      "    ].join('\\n');",
      "    document.head.appendChild(style);",
      "  });",
      "",
      "  // Wait for fonts",
      "  try {",
      "    await page.evaluate(async () => {",
      "      if (document.fonts && document.fonts.ready) await document.fonts.ready;",
      "    });",
      "  } catch (e) {}",
      "",
      "  // Scroll to bottom and back to trigger lazy loading",
      "  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));",
      "  await new Promise(r => setTimeout(r, 800));",
      "  await page.evaluate(() => window.scrollTo(0, 0));",
      "  await new Promise(r => setTimeout(r, 500));",
      "",
      "  // Get all slide marker positions",
      "  const slideMarkers = await page.evaluate(() => {",
      "    const markers = document.querySelectorAll('.ppt-break');",
      "    if (markers.length === 0) return null;",
      "    ",
      "    return Array.from(markers).map((el, idx) => {",
      "      const rect = el.getBoundingClientRect();",
      "      return {",
      "        id: 'slide-' + (idx + 1),",
      "        top: rect.top + window.scrollY,",
      "        height: rect.height,",
      "        bottom: rect.top + window.scrollY + rect.height",
      "      };",
      "    });",
      "  });",
      "",
      "  // Get report root bounds for centering",
      "  const reportBounds = await page.evaluate(() => {",
      "    const el = document.querySelector('#report-root');",
      "    if (!el) return { left: 0, width: 1280, top: 0, bottom: 5000 };",
      "    const rect = el.getBoundingClientRect();",
      "    return { ",
      "      left: rect.left + window.scrollX, ",
      "      width: rect.width,",
      "      top: rect.top + window.scrollY,",
      "      bottom: rect.top + window.scrollY + rect.height",
      "    };",
      "  });",
      "",
      "  const captureX = Math.max(0, reportBounds.left - 20);",
      "  const results = [];",
      "",
      "  if (slideMarkers && slideMarkers.length > 0) {",
      "    // MARKER-BASED CAPTURE",
      "    for (let i = 0; i < slideMarkers.length; i++) {",
      "      const marker = slideMarkers[i];",
      "      ",
      "      const sectionTop = marker.top;",
      "      const sectionBottom = (i < slideMarkers.length - 1) ",
      "        ? slideMarkers[i + 1].top ",
      "        : reportBounds.bottom;",
      "      const sectionHeight = sectionBottom - sectionTop;",
      "      ",
      "      if (sectionHeight <= SLIDE_HEIGHT) {",
      "        const buf = await page.screenshot({",
      "          type: 'jpeg',",
      "          quality: 92,",
      "          captureBeyondViewport: true,",
      "          clip: {",
      "            x: captureX,",
      "            y: sectionTop,",
      "            width: SLIDE_WIDTH,",
      "            height: Math.max(sectionHeight, 100)",
      "          }",
      "        });",
      "",
      "        results.push({",
      "          slideId: marker.id,",
      "          part: 1,",
      "          sectionHeight,",
      "          jpegB64: buf.toString('base64')",
      "        });",
      "      } else {",
      "        let yOffset = 0;",
      "        let partNum = 1;",
      "        ",
      "        while (yOffset < sectionHeight) {",
      "          const captureHeight = Math.min(SLIDE_HEIGHT, sectionHeight - yOffset);",
      "          ",
      "          if (captureHeight < 50) break;",
      "          ",
      "          const buf = await page.screenshot({",
      "            type: 'jpeg',",
      "            quality: 92,",
      "            captureBeyondViewport: true,",
      "            clip: {",
      "              x: captureX,",
      "              y: sectionTop + yOffset,",
      "              width: SLIDE_WIDTH,",
      "              height: captureHeight",
      "            }",
      "          });",
      "",
      "          results.push({",
      "            slideId: marker.id,",
      "            part: partNum,",
      "            sectionHeight: captureHeight,",
      "            jpegB64: buf.toString('base64')",
      "          });",
      "",
      "          yOffset += SLIDE_HEIGHT;",
      "          partNum++;",
      "        }",
      "      }",
      "    }",
      "  } else {",
      "    // FALLBACK: No markers - chunk by height",
      "    const pageHeight = reportBounds.bottom - reportBounds.top;",
      "    const numSlides = Math.ceil(pageHeight / SLIDE_HEIGHT);",
      "    ",
      "    for (let i = 0; i < numSlides && i < 40; i++) {",
      "      const yPos = reportBounds.top + (i * SLIDE_HEIGHT);",
      "      const remainingHeight = reportBounds.bottom - yPos;",
      "      const captureHeight = Math.min(SLIDE_HEIGHT, remainingHeight);",
      "      ",
      "      if (captureHeight < 50) break;",
      "",
      "      const buf = await page.screenshot({",
      "        type: 'jpeg',",
      "        quality: 92,",
      "        captureBeyondViewport: true,",
      "        clip: {",
      "          x: captureX,",
      "          y: yPos,",
      "          width: SLIDE_WIDTH,",
      "          height: captureHeight",
      "        }",
      "      });",
      "",
      "      results.push({",
      "        slideId: 'page',",
      "        part: i + 1,",
      "        jpegB64: buf.toString('base64')",
      "      });",
      "    }",
      "  }",
      "",
      "  return { ",
      "    data: { ",
      "      ok: true, ",
      "      slideCount: results.length,",
      "      markersFound: slideMarkers ? slideMarkers.length : 0,",
      "      results ",
      "    }, ",
      "    type: 'application/json' ",
      "  };",
      "}"
    ].join("\n");

    console.log('Calling Browserless for PPT export:', url);

    const capRes = await fetch(base + "/function?token=" + token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: browserlessFn, context: { url } }),
    });

    if (!capRes.ok) {
      const text = await capRes.text();
      console.error('Browserless error:', text);
      return { statusCode: 500, body: "Browserless failed: " + text };
    }

    const capPayload = await capRes.json();
    const capData = capPayload?.data && typeof capPayload.data === "object" ? capPayload.data : capPayload;

    console.log('Browserless response:', { 
      ok: capData?.ok, 
      slideCount: capData?.slideCount, 
      markersFound: capData?.markersFound 
    });

    if (!capData?.ok) {
      return { statusCode: 500, body: "Capture failed: " + (capData?.error || JSON.stringify(capData)) };
    }

    if (!Array.isArray(capData.results) || capData.results.length === 0) {
      return { statusCode: 500, body: "No slides captured" };
    }

    // Build PPTX - 16:9 widescreen
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches
    pptx.title = "Cancer Support Assessment - " + surveyId;
    pptx.author = "Cancer and Careers";
    pptx.company = "Best Companies for Working with Cancer Index";

    for (const r of capData.results) {
      const slide = pptx.addSlide();
      slide.addImage({
        data: "data:image/jpeg;base64," + r.jpegB64,
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
      });
    }

    const pptBuffer = await pptx.write("nodebuffer");

    // Upload to Supabase
    const supabase = createClient(supabaseUrl, serviceKey);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = "ppt/" + surveyId + "/Report_" + surveyId + "_" + ts + ".pptx";

    const up = await supabase.storage
      .from(bucket)
      .upload(filePath, pptBuffer, {
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        upsert: true,
      });

    if (up.error) {
      console.error('Upload error:', up.error);
      return { statusCode: 500, body: "Upload failed: " + up.error.message };
    }

    // Generate signed URL (1 hour)
    const signed = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60);
    if (signed.error) {
      return { statusCode: 500, body: "Signed URL failed: " + signed.error.message };
    }

    console.log('PPT export success:', { slideCount: capData.results.length, filePath });

    return {
      statusCode: 302,
      headers: { Location: signed.data.signedUrl, "Cache-Control": "no-store" },
      body: "",
    };

  } catch (err) {
    console.error('PPT export error:', err);
    return { statusCode: 500, body: "Error: " + (err?.message || err) };
  }
};
