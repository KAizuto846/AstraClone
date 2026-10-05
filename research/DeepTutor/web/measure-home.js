/* Mide el layout del home de Astra Clone en desktop y móvil. */
const { chromium } = require("playwright");

async function measure(page, label) {
  await page.waitForTimeout(2500);
  const data = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("button")].filter((b) =>
      /PDF|Foto|Calendario|Examen/i.test(b.textContent || "")
    );
    const cardsRects = cards.map((c) => {
      const r = c.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        text: (c.textContent || "").replace(/\s+/g, " ").slice(0, 45),
      };
    });
    const h1 = document.querySelector("h1");
    const h1r = h1 ? h1.getBoundingClientRect() : null;
    const sphere = document.querySelector('div[style*="linear-gradient"]');
    const sr = sphere ? sphere.getBoundingClientRect() : null;
    const p = document.querySelector("p.mt-2, p");
    const pr = p ? p.getBoundingClientRect() : null;
    return {
      viewport: { w: innerWidth, h: innerHeight },
      scrollY,
      bodyScrollH: document.body.scrollHeight,
      cardsRects,
      h1: h1r
        ? {
            x: Math.round(h1r.x),
            y: Math.round(h1r.y),
            w: Math.round(h1r.width),
            h: Math.round(h1r.height),
          }
        : null,
      sphere: sr
        ? { x: Math.round(sr.x), y: Math.round(sr.y), w: Math.round(sr.width), h: Math.round(sr.height) }
        : null,
      p: pr
        ? { x: Math.round(pr.x), y: Math.round(pr.y), w: Math.round(pr.width) }
        : null,
    };
  });
  console.log(`\n=== ${label} (${data.viewport.w}x${data.viewport.h}) ===`);
  console.log(JSON.stringify(data, null, 1));
  await page.screenshot({ path: `/tmp/home-${label}.png` });
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto("http://localhost:3782/chat", { waitUntil: "networkidle" });
  await measure(page, "desktop");

  const page2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page2.goto("http://localhost:3782/chat", { waitUntil: "networkidle" });
  await measure(page2, "mobile");

  await browser.close();
})();
