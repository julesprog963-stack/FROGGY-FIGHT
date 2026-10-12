const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando pruebas automatizadas de Expansión del Pantano (NPCs, Monedas y Cartel)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto('http://127.0.0.1:5173/');
  await page.click('#btn-start');
  await page.waitForTimeout(600);

  // Cerrar el diálogo inicial de Froggy
  console.log('Cerrando diálogo introductorio...');
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);

  // Test 1: Recolección de Moneda
  console.log('🪙 Test 1: Probando recolección de monedas...');
  const initialCoins = await page.evaluate(() => window.__game.player.coins);
  console.log(`Monedas iniciales: ${initialCoins}`);

  // Mover a Froggy sobre la primera moneda en (0, 0.2, 13.5)
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(0, 0.2, 13.5);
  });
  await page.waitForTimeout(300);

  const collectedCoins = await page.evaluate(() => window.__game.player.coins);
  const hudCoinsText = await page.innerText('#hud-coins');
  console.log(`Monedas tras recoger: ${collectedCoins}, HUD: ${hudCoinsText}`);
  if (collectedCoins < 1) {
    throw new Error('Fallo: No se recolectó la moneda');
  }
  await page.screenshot({ path: 'screenshot-coin-collected.png' });
  console.log('📸 Captura guardada: screenshot-coin-collected.png');

  // Test 2: Interacción con NPC Chippy la Ardilla
  console.log('🐿️ Test 2: Probando interacción con Chippy la Ardilla...');
  // Posición de Chippy: (7.5, 0.5, 18.0)
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(7.5, 0.5, 16.5); // a 1.5 metros de Chippy
    window.__game.tpCamera.update(1/60);
  });
  await page.waitForTimeout(300);

  const promptVisible = await page.isVisible('#interact-prompt');
  const promptText = await page.innerText('#interact-prompt');
  console.log(`Prompt visible: ${promptVisible}, Texto: "${promptText}"`);
  if (!promptVisible || !promptText.includes('CHIPPY')) {
    throw new Error(`Fallo: Prompt no visible o incorrecto: "${promptText}"`);
  }

  // Simular pulsar 'E' para hablar
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(400);

  const dialogueVisible = await page.isVisible('#n64-dialogue-box');
  const speakerText = await page.innerText('#dialogue-speaker');
  const contentText = await page.innerText('#dialogue-content');
  console.log(`Diálogo abierto: ${dialogueVisible}, Hablante: ${speakerText}`);
  console.log(`Contenido diálogo: "${contentText.substring(0, 45)}..."`);
  if (!dialogueVisible || !speakerText.includes('CHIPPY')) {
    throw new Error('Fallo: No se abrió el diálogo de Chippy');
  }

  await page.screenshot({ path: 'screenshot-npc-chippy.png' });
  console.log('📸 Captura guardada: screenshot-npc-chippy.png');

  // Cerrar diálogo
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);

  // Test 3: Cartel de Pato Lemus y Don Caparazón
  console.log('🪧 Test 3: Verificando Cartel de Pato Lemus y Don Caparazón...');
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(-13.5, 0, 16.5); // Frente al cartel y la tortuga
    window.__game.tpCamera.update(1/60);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'screenshot-billboard-pato-lemus.png' });
  console.log('📸 Captura guardada: screenshot-billboard-pato-lemus.png');

  // Test 4: Delimitación Perimetral del Mapa
  console.log('🚧 Test 4: Verificando barrera perimetral en radio 48m...');
  const perimeterResult = await page.evaluate(() => {
    const p = window.__game.player;
    // Intentar mover a Froggy a 55m (fuera del perímetro)
    p.position.set(0, 0, 55);
    p.velocity.set(0, 0, 10);
    // Ejecutar un ciclo de nivel
    window.__game.level.update(0.016, p, window.__game.hud, window.__game.input);
    const dist = Math.hypot(p.position.x, p.position.z);
    return {
      finalDist: dist,
      pushedBack: dist <= 48.01 && p.velocity.z < 0
    };
  });
  console.log(`Distancia tras barrera: ${perimeterResult.finalDist.toFixed(2)}m (Rebotó hacia adentro: ${perimeterResult.pushedBack})`);
  if (!perimeterResult.pushedBack) {
    throw new Error('Fallo: La barrera perimetral no contuvo al jugador');
  }

  await browser.close();
  console.log('🏆 ¡TODAS LAS PRUEBAS DE LA EXPANSIÓN PASARON AL 100%!');
})();
