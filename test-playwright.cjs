const { chromium } = require('playwright');

async function runTest() {
  console.log('🚀 Iniciando test Playwright para Froggy-Fight...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.click('#btn-start');
  await page.waitForTimeout(600);

  // Test 1: Hongo inicial
  const startMushroom = await page.evaluate(() => {
    const p = window.__game.player;
    return { y: p.position.y, isGrounded: p.isGrounded };
  });
  console.log(`🍄 Test 1 (Hongo inicio): Y=${startMushroom.y}, isGrounded=${startMushroom.isGrounded}`);
  if (Math.abs(startMushroom.y - 1.5) > 0.1 || !startMushroom.isGrounded) {
    throw new Error(`Fallo en hongo de inicio: Y=${startMushroom.y}`);
  }

  // Test 2: Escalón 1 (SteppingLPlatform en {-4.5, 3.8, 10.5})
  console.log('🪵 Test 2: Probando aterrizaje en Escalón 1...');
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(-4.5, 4.4, 10.5); // soltar a la rana justo encima del escalón
    p.velocity.set(0, -2, 0);
  });
  await page.waitForTimeout(400);

  const step1 = await page.evaluate(() => {
    const p = window.__game.player;
    return { x: p.position.x, y: p.position.y, z: p.position.z, isGrounded: p.isGrounded };
  });
  console.log(`🪵 Escalón 1: Y=${step1.y.toFixed(2)}, isGrounded=${step1.isGrounded}`);
  if (Math.abs(step1.y - 3.975) > 0.1 || !step1.isGrounded) {
    throw new Error(`Fallo en Escalón 1: Y=${step1.y}`);
  }
  await page.screenshot({ path: 'screenshot-step1-landed.png' });
  console.log('📸 Captura guardada: screenshot-step1-landed.png');

  // Test 3: Escalón 2 (SteppingLPlatform en {-8.2, 6.5, 8.8})
  console.log('🪵 Test 3: Probando aterrizaje en Escalón 2...');
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(-8.2, 7.2, 8.8);
    p.velocity.set(0, -2, 0);
  });
  await page.waitForTimeout(400);

  const step2 = await page.evaluate(() => {
    const p = window.__game.player;
    return { y: p.position.y, isGrounded: p.isGrounded };
  });
  console.log(`🪵 Escalón 2: Y=${step2.y.toFixed(2)}, isGrounded=${step2.isGrounded}`);
  if (Math.abs(step2.y - 6.675) > 0.1 || !step2.isGrounded) {
    throw new Error(`Fallo en Escalón 2: Y=${step2.y}`);
  }

  // Test 4: Hoja inestable 1 en {-11.5, 12.0, 0.5}
  console.log('🍃 Test 4: Probando hoja inestable 1...');
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(-11.5, 12.8, 0.5);
    p.velocity.set(0, -2, 0);
  });
  await page.waitForTimeout(400);

  const leaf1 = await page.evaluate(() => {
    const p = window.__game.player;
    return { y: p.position.y, isGrounded: p.isGrounded };
  });
  console.log(`🍃 Hoja 1: Y=${leaf1.y.toFixed(2)}, isGrounded=${leaf1.isGrounded}`);
  if (Math.abs(leaf1.y - 12.15) > 0.2 || !leaf1.isGrounded) {
    throw new Error(`Fallo en Hoja 1: Y=${leaf1.y}`);
  }

  // Test 5: Cima del árbol (Top Cap en y = 40.8)
  console.log('👑 Test 5: Probando cima del tronco (Arena del Jefe)...');
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(0, 41.5, 4.0);
    p.velocity.set(0, -2, 0);
  });
  await page.waitForTimeout(400);

  const summit = await page.evaluate(() => {
    const p = window.__game.player;
    return { y: p.position.y, isGrounded: p.isGrounded };
  });
  console.log(`👑 Cima: Y=${summit.y.toFixed(2)}, isGrounded=${summit.isGrounded}`);
  if (Math.abs(summit.y - 40.8) > 0.1 || !summit.isGrounded) {
    throw new Error(`Fallo en Cima: Y=${summit.y}`);
  }
  await page.screenshot({ path: 'screenshot-summit-landed.png' });
  console.log('📸 Captura guardada: screenshot-summit-landed.png');

  await browser.close();
  console.log('🏆 ¡TODAS LAS PRUEBAS DE FÍSICAS Y PLATAFORMAS PASARON AL 100%!');
}

runTest().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
