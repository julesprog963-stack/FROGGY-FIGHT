const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando pruebas Playwright de Expansión v2: Botón de Diálogo, Desagüe Tóxico, Blinky y Podio Pato Lemus...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto('http://127.0.0.1:5173/');
  await page.click('#btn-start');
  await page.waitForTimeout(600);

  // Cerrar diálogo introductorio
  console.log('Cerrando diálogo introductorio...');
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);

  // 1. Prueba del Botón Interactivo para hablar con NPC (Chippy la Ardilla)
  console.log('🐿️ Test 1: Probando botón táctil/clic (#btn-interact-npc) con Chippy...');
  // Posición de Chippy: (14.0, 0.5, 24.0)
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(14.0, 0.5, 22.0); // a 2 metros de Chippy
    window.__game.tpCamera.update(1/60);
  });
  await page.waitForTimeout(300);

  const btnVisible = await page.isVisible('#btn-interact-npc');
  const btnText = await page.innerText('#btn-interact-npc');
  console.log(`Botón visible: ${btnVisible}, Texto botón: "${btnText}"`);
  if (!btnVisible || !btnText.includes('CHIPPY')) {
    throw new Error(`Fallo: Botón interactivo no visible o sin nombre de Chippy: "${btnText}"`);
  }

  // Tomar captura del botón interactivo en pantalla
  await page.screenshot({ path: 'screenshot-interactive-btn.png' });
  console.log('📸 Captura guardada: screenshot-interactive-btn.png');

  // Hacer CLIC en el botón directamente (no con tecla, sino con evento de ratón/táctil)
  console.log('Haciendo clic sobre #btn-interact-npc...');
  await page.click('#btn-interact-npc', { force: true });
  await page.waitForTimeout(400);

  const dialogueVisible = await page.isVisible('#n64-dialogue-box');
  const speakerText = await page.innerText('#dialogue-speaker');
  const contentText = await page.innerText('#dialogue-content');
  console.log(`Diálogo abierto por clic: ${dialogueVisible}, Hablante: ${speakerText}`);
  console.log(`Contenido: "${contentText.substring(0, 50)}..."`);
  if (!dialogueVisible || !speakerText.includes('CHIPPY')) {
    throw new Error('Fallo: Al hacer clic en el botón no se abrió el diálogo');
  }

  // Cerrar diálogo
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);

  const diagState = await page.evaluate(() => ({
    display: document.getElementById('n64-dialogue-box').style.display,
    activeEl: document.activeElement ? document.activeElement.tagName + '#' + document.activeElement.id : 'none'
  }));
  console.log('Estado diálogo tras pulsar Space:', diagState);
  if (diagState.display === 'flex') {
    // Si aún está abierto, cerrarlo con Enter o click
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  }

  // 2. Prueba del Podio de Campaña y Valla de Pato Lemus
  console.log('🦆 Test 2: Verificando Podio Electoral y Carteles de Pato Lemus...');
  await page.evaluate(() => {
    const p = window.__game.player;
    // Posición frente al podio (-18, 0, 48)
    p.position.set(-18.0, 0.5, 42.0);
    window.__game.tpCamera.yaw = Math.PI; // Mirando hacia el sur/podio
    window.__game.tpCamera.update(1/60);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'screenshot-pato-lemus-podium.png' });
  console.log('📸 Captura guardada: screenshot-pato-lemus-podium.png');

  // 3. Prueba de Zona de Contaminación Hídrica y NPC Blinky el Pez Mutante
  console.log('🐟 Test 3: Verificando desagüe tóxico y NPC Blinky el Pez de Tres Ojos...');
  // Posición de Blinky: (-42.0, -0.6, -24.0)
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(-42.0, 0.2, -22.0); // a 2 metros de Blinky
    window.__game.tpCamera.update(1/60);
  });
  await page.waitForTimeout(400);

  const blinkyBtnVisible = await page.isVisible('#btn-interact-npc');
  const blinkyBtnText = await page.innerText('#btn-interact-npc');
  console.log(`Botón frente a Blinky: ${blinkyBtnVisible}, Texto: "${blinkyBtnText}"`);
  if (!blinkyBtnVisible || !blinkyBtnText.includes('BLINKY')) {
    throw new Error(`Fallo: Botón no detectó a Blinky: "${blinkyBtnText}"`);
  }

  await page.screenshot({ path: 'screenshot-toxic-drainage-blinky.png' });
  console.log('📸 Captura guardada: screenshot-toxic-drainage-blinky.png');

  // Hablar con Blinky haciendo clic
  await page.click('#btn-interact-npc', { force: true });
  await page.waitForTimeout(400);
  const blinkyDialogue = await page.innerText('#dialogue-content');
  const fullBlinkyText = await page.evaluate(() => window.__game.hud.currentText);
  console.log(`Diálogo de Blinky en progreso: "${blinkyDialogue}", Texto completo: "${fullBlinkyText.substring(0, 50)}..."`);
  if (!fullBlinkyText.includes('cutis') && !fullBlinkyText.includes('ojos')) {
    throw new Error('Fallo: Diálogo de Blinky incorrecto');
  }

  // Cerrar diálogo
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);

  // 4. Prueba de la Delimitación Perimetral a 72 metros
  console.log('🚧 Test 4: Verificando nueva delimitación en radio 72m...');
  const boundaryCheck = await page.evaluate(() => {
    const p = window.__game.player;
    // Paso A: A 60m (dentro del nuevo límite) NO debe rebotar
    p.position.set(0, 0, 60);
    p.velocity.set(0, 0, 5);
    window.__game.level.update(0.016, p, window.__game.hud, window.__game.input);
    const dist60 = Math.hypot(p.position.x, p.position.z);
    const unconstrainedAt60 = dist60 > 59 && p.velocity.z > 0;

    // Paso B: A 76m (fuera del límite) DEBE rebotar y mantenerse en <= 72.01m
    p.position.set(0, 0, 76);
    p.velocity.set(0, 0, 10);
    window.__game.level.update(0.016, p, window.__game.hud, window.__game.input);
    const dist76 = Math.hypot(p.position.x, p.position.z);
    const containedAt72 = dist76 <= 72.01 && p.velocity.z < 0;

    return {
      dist60,
      unconstrainedAt60,
      dist76,
      containedAt72,
      swampRadius: window.__game.level.swampRadius
    };
  });

  console.log('Resultado de pruebas de perímetro:', boundaryCheck);
  if (!boundaryCheck.unconstrainedAt60) {
    throw new Error('Fallo: El jugador fue indebidamente frenado antes de los 72m');
  }
  if (!boundaryCheck.containedAt72 || boundaryCheck.swampRadius !== 72) {
    throw new Error('Fallo: El perímetro a 72m no contuvo adecuadamente al jugador');
  }

  // Captura del perímetro amplio
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(0, 5, 58);
    window.__game.tpCamera.update(1/60);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshot-perimeter-72m.png' });
  console.log('📸 Captura guardada: screenshot-perimeter-72m.png');

  console.log('🎉 ¡TODAS LAS PRUEBAS PLAYWRIGHT v2 PASARON CON ÉXITO!');
  await browser.close();
})();
