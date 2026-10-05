const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3782/chat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: '/home/rizutov/.hermes/cache/scratch/fixed2_1440x900.png' });
  const cmd = await page.evaluate(() => {
    const byText = (t) => [...document.querySelectorAll('button, h1, p, span, input, textarea')].find(el => el.textContent.trim().startsWith(t));
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height), bottom: Math.round(r.bottom), x: Math.round(r.x), w: Math.round(r.width) }; };
    const cards = [...document.querySelectorAll('button')].filter(b => /apuntes|Foto|Calendario|Examen simulado/.test(b.textContent));
    return {
      sphere: rect(byText('C')),
      input: rect(document.querySelector('textarea, input[type="text"]')),
      cards: cards.map(rect),
      viewportH: innerHeight,
      bodyScrollH: document.body.scrollHeight,
    };
  });
  console.log(JSON.stringify(cmd, null, 2));
  await browser.close();
  console.log('done');
})();
