// netlify/functions/export-pptx.js
//
// Captures the FULL HTML report as PPT slides
// Uses section-based capture to avoid duplicates/overlap
// Each major section becomes its own slide(s)
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

    const url = `${origin}/admin/reports/${encodeURIComponent(surveyId)}?export=1`;

    // Browserless function - captures full page, splits into slides
    const browserlessFn = `
export default async function ({ page, context }) {
  const url = context.url;

  // PPT slide dimensions (16:9 widescreen)
  const SLIDE_WIDTH = 1280;
  const SLIDE_HEIGHT = 720;

  // Use wider viewport for better content rendering
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for report to load
  try {
    await page.waitForSelector('#report-root', { timeout: 30000 });
  } catch (e) {
    return { data: { ok: false, error: 'Report root not found' }, type: 'application/json' };
  }

  // Add export-mode class and inject PPT export styles
  await page.evaluate(() => {
    document.body.classList.add('export-mode');
    
    // Hide non-print elements and fix layout for export
    const style = document.createElement('style');
    style.textContent = \`
      .no-print { display: none !important; }
      .sticky, [class*="sticky"] { position: static !important; }
      nav, header.sticky { display: none !important; }
      
      /* Ensure report root is full width for capture */
      #report-root {
        max-width: 1280px !important;
        margin: 0 auto !important;
        padding: 0 !important;
      }
      
      /* Hide the pre-designed PPT slides - we're capturing the full HTML */
      .ppt-slides-container { display: none !important; }
      
      /* Ensure all content is visible */
      [class*="overflow-y-auto"],
      [class*="overflow-auto"],
      [class*="max-h-"] {
        overflow: visible !important;
        max-height: none !important;
      }
    \`;
    document.head.appendChild(style);
  });

  // Wait for fonts
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch (e) {}

  await new Promise(r => setTimeout(r, 1500));

  // Get all section elements by their data-ppt-section attribute
  // OR fall back to capturing by fixed height chunks
  const sections = await page.evaluate(() => {
    const sectionEls = document.querySelectorAll('[data-ppt-section]');
    if (sectionEls.length > 0) {
      return Array.from(sectionEls).map(el => {
        const rect = el.getBoundingClientRect();
        return {
          id: el.getAttribute('data-ppt-section'),
          top: rect.top + window.scrollY,
          height: rect.height
        };
      });
    }
    return null;
  });

  // Get total page height
  const pageHeight = await page.evaluate(() => {
    return document.documentElement.scrollHeight;
  });

  const results = [];

  if (sections && sections.length > 0) {
    // Section-based capture
    for (const section of sections) {
      // For tall sections, split into multiple slides
      let yOffset = 0;
      while (yOffset < section.height) {
        const captureHeight = Math.min(SLIDE_HEIGHT, section.height - yOffset);
        
        const buf = await page.screenshot({
          type: 'jpeg',
          quality: 92,
          clip: {
            x: 60, // Small margin from left
            y: section.top + yOffset,
            width: SLIDE_WIDTH,
            height: captureHeight
          }
        });

        results.push({
          section: section.id,
          part: Math.floor(yOffset / SLIDE_HEIGHT) + 1,
          jpegB64: buf.toString('base64')
        });

        yOffset += SLIDE_HEIGHT;
      }
    }
  } else {
    // Fixed-height chunk capture - NO SCROLLING, pure clip coordinates
    // This avoids all overlap issues
    const numSlides = Math.ceil(pageHeight / SLIDE_HEIGHT);
    
    // First, scroll to bottom and back to trigger any lazy loading
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 300));
    
    // Get the report container's position for proper centering
    const reportBounds = await page.evaluate(() => {
      const el = document.querySelector('#report-root');
      if (!el) return { left: 0, width: 1280 };
      const rect = el.getBoundingClientRect();
      return { left: rect.left + window.scrollX, width: rect.width };
    });
    
    // Center the capture on the report content
    const captureX = Math.max(0, reportBounds.left);
    
    for (let i = 0; i < numSlides && i < 35; i++) {
      const yPos = i * SLIDE_HEIGHT;
      const remainingHeight = pageHeight - yPos;
      const captureHeight = Math.min(SLIDE_HEIGHT, remainingHeight);
      
      // Skip if remaining content is too small (< 100px)
      if (captureHeight < 100) break;

      // Pure clip-based capture - no scrolling needed
      // Puppeteer handles this with absolute page coordinates
      const buf = await page.screenshot({
        type: 'jpeg',
        quality: 92,
        fullPage: false, // We're using clip
        captureBeyondViewport: true, // Important! Allows capturing outside viewport
        clip: {
          x: captureX,
          y: yPos,
          width: SLIDE_WIDTH,
          height: captureHeight
        }
      });

      results.push({
        slide: i + 1,
        yPos,
        jpegB64: buf.toString('base64')
      });
    }
  }

  return { 
    data: { 
      ok: true, 
      slideCount: results.length,
      pageHeight,
      usedSections: sections ? sections.length : 0,
      results 
    }, 
    type: 'application/json' 
  };
}
`;

    console.log('Calling Browserless for PPT export:', url);

    const capRes = await fetch(`${base}/function?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: browserlessFn, context: { url } }),
    });

    if (!capRes.ok) {
      const text = await capRes.text();
      console.error('Browserless error:', text);
      return { statusCode: 500, body: `Browserless failed: ${text}` };
    }

    const capPayload = await capRes.json();
    const capData = capPayload?.data && typeof capPayload.data === "object" ? capPayload.data : capPayload;

    console.log('Browserless response:', { 
      ok: capData?.ok, 
      slideCount: capData?.slideCount, 
      pageHeight: capData?.pageHeight,
      usedSections: capData?.usedSections 
    });

    if (!capData?.ok) {
      return { statusCode: 500, body: `Capture failed: ${capData?.error || JSON.stringify(capData)}` };
    }

    if (!Array.isArray(capData.results) || capData.results.length === 0) {
      return { statusCode: 500, body: `No slides captured` };
    }

    // Build PPTX - 16:9 widescreen
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches
    pptx.title = `Cancer Support Assessment - ${surveyId}`;
    pptx.author = "Cancer and Careers";
    pptx.company = "Best Companies for Working with Cancer Index";

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

    // Upload to Supabase
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
      console.error('Upload error:', up.error);
      return { statusCode: 500, body: `Upload failed: ${up.error.message}` };
    }

    // Generate signed URL (1 hour)
    const signed = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60);
    if (signed.error) {
      return { statusCode: 500, body: `Signed URL failed: ${signed.error.message}` };
    }

    console.log('PPT export success:', { slideCount: capData.results.length, filePath });

    return {
      statusCode: 302,
      headers: { Location: signed.data.signedUrl, "Cache-Control": "no-store" },
      body: "",
    };

  } catch (err) {
    console.error('PPT export error:', err);
    return { statusCode: 500, body: `Error: ${err?.message || err}` };
  }
};
