const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../../..');
const root = path.resolve(process.env.QA_OUT || path.join(__dirname, '../final/run'));
fs.mkdirSync(root, { recursive: true });
const url = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/';
const chromiumPath = process.env.CHROMIUM_PATH;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = { browser: 'Playwright Chromium; Browser plugin unavailable', url, desktop: {}, mobile: {}, errors: [], httpErrors: [] };

function collect(page, label) {
  page.on('console', msg => { if (msg.type() === 'error') report.errors.push({ label, type: 'console', text: msg.text() }); });
  page.on('pageerror', error => report.errors.push({ label, type: 'pageerror', text: error.message }));
  page.on('response', response => { if (response.status() >= 400) report.httpErrors.push({ label, status: response.status(), url: response.url() }); });
}

async function screenshot(page, name) {
  const file = path.join(root, name);
  await page.screenshot({ path: file, animations: 'disabled' });
  return path.relative(repoRoot, file).split(path.sep).join('/');
}

async function bounds(page, selectors) {
  return page.evaluate(selectors => {
    const out = {};
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (!el) { out[selector] = null; continue; }
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      out[selector] = { visible: s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0,
        x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    }
    const keys = Object.keys(out).filter(k => out[k]?.visible);
    out.overlaps = [];
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
      const a = out[keys[i]], b = out[keys[j]];
      const w = Math.min(a.right, b.right) - Math.max(a.x, b.x);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
      if (w > 1 && h > 1) out.overlaps.push([keys[i], keys[j], Math.round(w * h)]);
    }
    return out;
  }, selectors);
}

async function layout(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#canvas-container canvas');
    const r = canvas?.getBoundingClientRect();
    const rendererCanvas = window.__game?.renderer?.domElement;
    return { inner: [innerWidth, innerHeight], document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      canvas: r ? [r.x, r.y, r.width, r.height] : null, rendererCss: canvas ? [canvas.clientWidth, canvas.clientHeight] : null,
      rendererLogical: rendererCanvas ? [rendererCanvas.width, rendererCanvas.height] : null };
  });
}

async function gameState(page) {
  return page.evaluate(() => {
    const g = window.__game;
    if (!g) return null;
    const p = g.player;
    return { state: g.state, dialogue: g.hud.dialogueBox.style.display,
      pos: [p.position.x, p.position.y, p.position.z], grounded: p.isGrounded,
      charging: p.isChargingJump, chargeTime: p.chargeTime, tongue: p.tongueState,
      tongueVisible: p.tongueMesh?.visible, manualYaw: g.tpCamera.manualYaw,
      cameraYaw: g.tpCamera.yaw, forward: g.input.keys.forward, right: g.input.keys.right };
  });
}

async function bannerInfo(page) {
  return page.evaluate(() => {
    const g = window.__game, found = [];
    g.scene.traverse(o => {
      if (o.name !== 'pato-lemus-banner') return;
      const canvas = o.material?.map?.image;
      const world = new o.position.constructor();
      o.getWorldPosition(world); world.project(g.camera);
      const ndc = [world.x, world.y, world.z];
      let colors = { unique: 0, white: 0, orange: 0, dark: 0 };
      if (canvas?.getContext) {
        const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const seen = new Set();
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], gg = d[i + 1], b = d[i + 2];
          seen.add((r << 16) | (gg << 8) | b);
          if (r > 185 && gg > 185 && b > 185) colors.white++;
          if (r > 150 && gg > 55 && gg < 190 && b < 90) colors.orange++;
          if (r < 45 && gg < 45 && b < 45) colors.dark++;
        }
        colors.unique = seen.size;
      }
      found.push({ name: o.name, textureCanvas: !!canvas?.getContext, size: canvas ? [canvas.width, canvas.height] : null,
        inViewport: Math.abs(world.x) <= 1 && Math.abs(world.y) <= 1 && world.z >= -1 && world.z <= 1, ndc, colors });
    });
    return { meshCount: found.length, visibleCount: found.filter(item => item.inViewport).length, banners: found };
  });
}

async function tap(cdp, page, selector, id = 1) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`No visible hit target: ${selector}`);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id, x, y, radiusX: 3, radiusY: 3, force: 1 }] });
  await sleep(90);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(220);
}

async function holdTouch(cdp, page, selector, durationMs, id = 1) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`No visible touch target: ${selector}`);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id, x, y, radiusX: 3, radiusY: 3, force: 1 }] });
  await sleep(durationMs);
  const state = await gameState(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(120);
  return state;
}

async function runDesktop(browser) {
  const videoDir = path.join(root, 'video-tmp');
  fs.mkdirSync(videoDir, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } } });
  const page = await context.newPage(); collect(page, 'desktop');
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__game?.renderer?.domElement);
  await sleep(700);
  report.desktop.identity = { status: response.status(), url: page.url(), title: await page.title(), startText: await page.locator('#btn-start').innerText() };
  report.desktop.layout = await layout(page);
  report.desktop.menu = await screenshot(page, 'desktop-menu.png');
  await page.locator('#btn-start').click();
  await page.waitForFunction(() => window.__game?.state === 'cinematic');
  await sleep(800);
  report.desktop.introBanners = await bannerInfo(page);
  report.desktop.intro = await screenshot(page, 'desktop-intro.png');
  await page.locator('#btn-skip-cinematic').click();
  await page.waitForFunction(() => document.querySelector('#n64-dialogue-box').style.display === 'flex');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__game?.state === 'playing' && document.querySelector('#n64-dialogue-box').style.display !== 'flex');
  await sleep(180);
  report.desktop.runtimeBanners = await bannerInfo(page);
  report.desktop.after = await screenshot(page, 'desktop-after.png');
  console.log(`DESKTOP_SCREENSHOT_READY ${report.desktop.after}`);

  await page.evaluate(() => {
    const p = window.__game.player, original = p.handleTongueActions;
    window.__qaTongueCalls = 0;
    p.handleTongueActions = function(dt, input, ...args) {
      if (input.keys.tonguePressed) window.__qaTongueCalls++;
      return original.call(this, dt, input, ...args);
    };
  });
  const utilityBefore = await page.evaluate(() => window.__qaTongueCalls);
  await page.locator('#btn-crt').click();
  await page.locator('#btn-audio').click();
  await sleep(100);
  const utilityAfter = await page.evaluate(() => window.__qaTongueCalls);
  await page.keyboard.down('e'); await sleep(80); await page.keyboard.up('e'); await sleep(100);
  report.desktop.tongue = { utilityCallsBefore: utilityBefore, utilityCallsAfter: utilityAfter,
    callsAfterE: await page.evaluate(() => window.__qaTongueCalls), stateAfterE: (await gameState(page)).tongue };
  await sleep(600);

  let start = await gameState(page);
  await page.keyboard.down('d'); await sleep(220);
  const movementHeld = await gameState(page);
  await page.keyboard.up('d'); await sleep(100);
  report.desktop.keyboardMovement = { start: start.pos, held: movementHeld.pos, rightWhileHeld: movementHeld.right };

  const yaw0 = await page.evaluate(() => window.__game.tpCamera.manualYaw);
  await page.keyboard.down('q'); await sleep(220); await page.keyboard.up('q');
  const yawQ = await page.evaluate(() => window.__game.tpCamera.manualYaw);
  await page.keyboard.down('r'); await sleep(220); await page.keyboard.up('r');
  const yawR = await page.evaluate(() => window.__game.tpCamera.manualYaw);
  report.desktop.camera = { yaw0, yawAfterQ: yawQ, yawAfterR: yawR };

  await page.keyboard.down('Space'); await sleep(280);
  const charging = await gameState(page);
  report.desktop.chargeVisible = await page.locator('#jump-charge').isVisible();
  report.desktop.chargePercent = await page.locator('#jump-charge').getAttribute('aria-valuenow');
  report.desktop.chargeScreenshot = await screenshot(page, 'desktop-charge.png');
  await page.keyboard.up('Space'); await sleep(300);
  const jumped = await gameState(page);
  report.desktop.jump = { before: charging.pos, after: jumped.pos, charging: charging.charging, chargeTime: charging.chargeTime };
  report.desktop.afterJump = await screenshot(page, 'desktop-after-jump.png');

  await page.keyboard.down('d'); await sleep(120);
  const rightBeforeBlur = await page.evaluate(() => window.__game.input.keys.right);
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await sleep(80);
  const rightAfterBlur = await page.evaluate(() => window.__game.input.keys.right);
  await page.keyboard.up('d');
  report.desktop.blurRelease = { rightBeforeBlur, rightAfterBlur, method: 'window blur event dispatched in page' };
  report.desktop.layoutAfter = await layout(page);
  const video = page.video();
  await page.close(); await context.close();
  const from = await video.path();
  const to = path.join(root, 'desktop-after.webm');
  fs.renameSync(from, to); report.desktop.video = path.relative(repoRoot, to).split(path.sep).join('/');
}

async function runMobile(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage(); collect(page, 'mobile');
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__game?.renderer?.domElement); await sleep(500);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  report.mobile.identity = { status: response.status(), url: page.url(), title: await page.title() };
  await screenshot(page, 'mobile-menu.png');
  await tap(cdp, page, '#btn-start');
  await page.waitForFunction(() => window.__game?.state === 'cinematic'); await sleep(450);
  report.mobile.introBanners = await bannerInfo(page);
  report.mobile.intro = await screenshot(page, 'mobile-intro.png');
  await tap(cdp, page, '#btn-skip-cinematic');
  await page.waitForFunction(() => document.querySelector('#n64-dialogue-box').style.display === 'flex');
  await tap(cdp, page, '#n64-dialogue-box');
  await page.waitForFunction(() => window.__game?.state === 'playing' && document.querySelector('#n64-dialogue-box').style.display !== 'flex');
  await sleep(200);
  report.mobile.layoutPortrait = await layout(page);
  report.mobile.overlaysPortrait = await bounds(page, ['#hud > div:first-child', '#hud-altitude', '#utility-buttons', '#touch-controls', '#jump-charge', '#n64-dialogue-box', '#controls-hint']);
  report.mobile.touchControlsVisible = await page.locator('#touch-controls').isVisible();
  report.mobile.runtimeBanners = await bannerInfo(page);
  report.mobile.afterPortrait = await screenshot(page, 'mobile-portrait-after.png');

  const pos0 = await gameState(page);
  const lateralHeld = await holdTouch(cdp, page, '[data-touch-action="right"]', 220);
  const pos1 = await gameState(page);
  report.mobile.lateralTouch = { before: pos0.pos, during: lateralHeld.pos, afterRelease: pos1.pos, held: lateralHeld.right };
  const jumpBox = await page.locator('[data-touch-action="jump"]').boundingBox();
  if (!jumpBox) throw new Error('No visible touch jump control');
  const jumpX = jumpBox.x + jumpBox.width / 2, jumpY = jumpBox.y + jumpBox.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 2, x: jumpX, y: jumpY, radiusX: 3, radiusY: 3, force: 1 }] });
  await sleep(280);
  const chargeState = await gameState(page);
  report.mobile.chargeVisible = await page.locator('#jump-charge').isVisible();
  report.mobile.chargePercent = await page.locator('#jump-charge').getAttribute('aria-valuenow');
  report.mobile.chargeScreenshot = await screenshot(page, 'mobile-charge.png');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(280);
  const jumpState = await gameState(page);
  report.mobile.jump = { duringCharge: chargeState.pos, afterRelease: jumpState.pos, charging: chargeState.charging, chargeTime: chargeState.chargeTime };

  await page.setViewportSize({ width: 844, height: 390 }); await sleep(350);
  report.mobile.layoutLandscape = await layout(page);
  report.mobile.overlaysLandscape = await bounds(page, ['#hud > div:first-child', '#hud-altitude', '#utility-buttons', '#touch-controls', '#jump-charge', '#n64-dialogue-box', '#controls-hint']);
  report.mobile.touchControlsLandscapeVisible = await page.locator('#touch-controls').isVisible();
  report.mobile.afterLandscape = await screenshot(page, 'mobile-landscape-after.png');
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(chromiumPath ? { executablePath: chromiumPath } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    await runDesktop(browser);
    await runMobile(browser);
    report.pass = report.errors.length === 0 && report.httpErrors.length === 0;
    fs.writeFileSync(path.join(root, 'qa-report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(`QA_REPORT ${path.join(root, 'qa-report.json')}`);
    console.log(JSON.stringify({ pass: report.pass, errors: report.errors.length, desktop: report.desktop, mobile: report.mobile }, null, 2));
  } catch (error) {
    report.fatal = error.stack || String(error);
    fs.writeFileSync(path.join(root, 'qa-report.json'), JSON.stringify(report, null, 2) + '\n');
    console.error(error.stack || error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
