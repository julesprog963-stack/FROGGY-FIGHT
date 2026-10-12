const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto('http://127.0.0.1:5173/');
  await page.click('#btn-start');
  await page.waitForTimeout(600);
  
  const hudElement = await page.$('#hud');
  if (hudElement) {
    await hudElement.screenshot({ path: 'screenshot-hud-pixel.png' });
    console.log('HUD screenshot captured to screenshot-hud-pixel.png');
  }
  await page.screenshot({ path: 'screenshot-game-hud.png' });
  await browser.close();
})();
