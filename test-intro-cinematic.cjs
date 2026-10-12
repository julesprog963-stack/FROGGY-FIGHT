const { chromium } = require('playwright');

(async () => {
  console.log('🎬 Iniciando prueba de Cinemática de Introducción 3D y Transición a Gameplay...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto('http://127.0.0.1:5173/');

  // 1. Verificar Pantalla de Inicio
  console.log('📺 Verificando pantalla de inicio...');
  const titleText = await page.innerText('#start-screen .n64-logo');
  console.log('Título del juego:', titleText);
  if (!titleText.includes('EL ASCENSO DE') || !titleText.includes('FROGBERT')) {
    throw new Error(`Título no coincide: ${titleText}`);
  }

  // 2. Iniciar Aventura y Activar Cinemática
  console.log('🎮 Presionando [¡INICIAR AVENTURA!]...');
  await page.click('#btn-start');
  await page.waitForTimeout(300);

  let state = await page.evaluate(() => window.__game.state);
  console.log('Estado actual:', state);
  if (state !== 'cinematic') {
    throw new Error(`Estado debería ser "cinematic", obtenido: ${state}`);
  }

  // 3. FASE 1: Frogbert durmiendo
  console.log('💤 FASE 1: Verificando Frogbert durmiendo con Zzz y mochila...');
  const phase1 = await page.evaluate(() => {
    const c = window.__game.cinematic;
    const p = window.__game.player;
    return {
      phase: c.phase,
      time: c.time,
      frogPos: { x: p.position.x, y: p.position.y, z: p.position.z },
      hasBackpack: !!p.backpack,
      zzzCount: c.zzzSprites.length
    };
  });
  console.log('Datos Fase 1:', JSON.stringify(phase1));
  await page.screenshot({ path: 'screenshot-cinematic-sleeping.png' });
  console.log('📸 Captura: screenshot-cinematic-sleeping.png');

  // 4. FASE 2 y 3: Llegada de Pato Lemus y Diálogo
  console.log('🦆 FASE 2 & 3: Avanzando a la llegada de Pato Lemus...');
  await page.evaluate(() => {
    window.__game.cinematic.time = 4.0; // Pasa a fase arrival
    window.__game.cinematic.update(0.01);
  });
  await page.waitForTimeout(400);

  const phase2 = await page.evaluate(() => {
    const c = window.__game.cinematic;
    return {
      phase: c.phase,
      hasPatoLemus: !!c.patoLemus,
      talabotsCount: c.talabots.length,
      pointingArm: !!c.pointingArm
    };
  });
  console.log('Datos Fase 2:', JSON.stringify(phase2));

  // Avanzar al diálogo de Pato Lemus
  await page.evaluate(() => {
    window.__game.cinematic.time = 7.5; // Pasa a fase dialogue
    window.__game.cinematic.update(0.01);
  });
  await page.waitForTimeout(400);

  const dialogueInfo = await page.evaluate(() => {
    const c = window.__game.cinematic;
    const box = document.getElementById('n64-dialogue-box');
    const speaker = document.getElementById('dialogue-speaker').innerText;
    const content = document.getElementById('dialogue-content').innerText;
    return {
      phase: c.phase,
      boxVisible: box.style.display,
      speaker,
      content: content.substring(0, 60) + '...'
    };
  });
  console.log('Datos Diálogo Pato Lemus:', JSON.stringify(dialogueInfo));
  if (!dialogueInfo.speaker.includes('PATO LEMUS')) {
    throw new Error(`Hablante esperado PATO LEMUS, recibido: ${dialogueInfo.speaker}`);
  }
  await page.screenshot({ path: 'screenshot-cinematic-pato-lemus.png' });
  console.log('📸 Captura: screenshot-cinematic-pato-lemus.png');

  // 5. FASE 4: La Patada y ¡POW!
  console.log('💥 FASE 4: Ejecutando patada de Pato Lemus...');
  await page.evaluate(() => {
    window.__game.cinematic.time = 11.2; // Fase kick con powStar
    window.__game.cinematic.update(0.01);
  });
  await page.waitForTimeout(300);

  const kickInfo = await page.evaluate(() => {
    const c = window.__game.cinematic;
    return {
      phase: c.phase,
      powVisible: c.powStar ? c.powStar.visible : false,
      rightLegRotX: c.rightLegPivot ? c.rightLegPivot.rotation.x : 0
    };
  });
  console.log('Datos Patada:', JSON.stringify(kickInfo));
  await page.screenshot({ path: 'screenshot-cinematic-kick.png' });
  console.log('📸 Captura: screenshot-cinematic-kick.png');

  // 6. FASE 6 & 7: Vuelo, Aterrizaje Forzoso y Frogbert Enojado
  console.log('😡 FASE 6 & 7: Frogbert aterriza en la base del árbol enojado...');
  await page.evaluate(() => {
    window.__game.cinematic.time = 16.5; // Fase angry
    window.__game.cinematic.update(0.01);
  });
  await page.waitForTimeout(400);

  const angryInfo = await page.evaluate(() => {
    const c = window.__game.cinematic;
    const p = window.__game.player;
    const speaker = document.getElementById('dialogue-speaker').innerText;
    const content = document.getElementById('dialogue-content').innerText;
    return {
      phase: c.phase,
      playerPos: { x: p.position.x, y: p.position.y, z: p.position.z },
      speaker,
      content: content.substring(0, 60) + '...'
    };
  });
  console.log('Datos Frogbert Enojado:', JSON.stringify(angryInfo));
  if (!angryInfo.speaker.includes('FROGBERT')) {
    throw new Error(`Hablante esperado FROGBERT, recibido: ${angryInfo.speaker}`);
  }
  await page.screenshot({ path: 'screenshot-cinematic-angry-frogbert.png' });
  console.log('📸 Captura: screenshot-cinematic-angry-frogbert.png');

  // 7. Cerrar diálogo y entrar a Gameplay
  console.log('🕹️ Cerrando diálogo y validando transición a juego activo...');
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);

  // Terminar cinemática
  await page.evaluate(() => {
    window.__game.cinematic.finish();
  });
  await page.waitForTimeout(400);

  const gameState = await page.evaluate(() => {
    const p = window.__game.player;
    const cam = window.__game.tpCamera;
    return {
      state: window.__game.state,
      pos: { x: p.position.x, y: p.position.y, z: p.position.z },
      cinematicNull: window.__game.cinematic === null,
      cameraPos: { x: window.__game.camera.position.x, y: window.__game.camera.position.y, z: window.__game.camera.position.z }
    };
  });
  console.log('Estado de juego activo:', JSON.stringify(gameState));
  if (gameState.state !== 'playing') {
    throw new Error(`Estado esperado playing, obtenido: ${gameState.state}`);
  }

  await page.screenshot({ path: 'screenshot-gameplay-ready.png' });
  console.log('📸 Captura: screenshot-gameplay-ready.png');

  // 8. Probar Botón de Salto de Cinemática (Skip)
  console.log('⏭️ Probando botón de Saltarse Intro (#btn-skip-cinematic)...');
  await page.reload();
  await page.waitForTimeout(600);
  await page.click('#btn-start');
  await page.waitForTimeout(300);

  const skipBtnVisible = await page.isVisible('#btn-skip-cinematic');
  console.log('Botón de Saltar visible:', skipBtnVisible);
  if (!skipBtnVisible) {
    throw new Error('Botón #btn-skip-cinematic no se muestra al iniciar la cinemática');
  }

  await page.click('#btn-skip-cinematic');
  await page.waitForTimeout(300);

  const postSkipState = await page.evaluate(() => ({
    state: window.__game.state,
    cinematicNull: window.__game.cinematic === null,
    skipBtnDisplay: document.getElementById('btn-skip-cinematic').style.display,
    playerPos: { x: window.__game.player.position.x, y: window.__game.player.position.y, z: window.__game.player.position.z }
  }));
  console.log('Estado post-salto:', JSON.stringify(postSkipState));
  if (postSkipState.state !== 'playing' || !postSkipState.cinematicNull) {
    throw new Error('El botón de saltar cinemática no cambió el estado a playing');
  }

  console.log('✅ Todas las pruebas de cinemática completadas con éxito.');
  await browser.close();
})();
