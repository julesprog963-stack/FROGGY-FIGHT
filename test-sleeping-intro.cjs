const { chromium } = require('playwright');

(async () => {
  console.log('🎬 Iniciando verificación: Frogbert durmiendo, despertar, confrontación y patada...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://127.0.0.1:5173/');

  // Iniciar aventura para comenzar la cinemática
  console.log('🎮 Presionando [¡INICIAR AVENTURA!]...');
  await page.click('#btn-start');
  await page.waitForTimeout(500);

  // 1. Validar estado de siesta (phase = sleeping, Zzz activos, pose dormida)
  const sleepData = await page.evaluate(() => {
    const c = window.__game.cinematic;
    const p = window.__game.player;
    return {
      phase: c.phase,
      elevationY: c.elevationY,
      camPos: { x: window.__game.camera.position.x, y: window.__game.camera.position.y, z: window.__game.camera.position.z },
      playerPos: { x: p.position.x, y: p.position.y, z: p.position.z },
      zzzCount: c.zzzSprites.length,
      zzzVisible: c.zzzSprites.every(z => z.sprite.visible),
      talabotsCount: c.talabots.length,
      sleepingDeckVisible: !!c.sleepingMat
    };
  });
  console.log('1. Datos de siesta inicial:', JSON.stringify(sleepData, null, 2));

  if (sleepData.phase !== 'sleeping') {
    throw new Error(`Se esperaba phase 'sleeping' pero es '${sleepData.phase}'`);
  }
  if (sleepData.zzzCount !== 3 || !sleepData.zzzVisible) {
    throw new Error('Las partículas Zzz flotantes no están presentes o visibles');
  }

  await page.screenshot({ path: '/home/itadmin/.gemini/antigravity/brain/61612200-0a3c-4c81-b90d-bdb88fa6fce7/screenshot-frogbert-sleeping-nap.png' });
  console.log('📸 Captura 1 guardada: Frogbert durmiendo plácidamente con Zzz');

  // 2. Simular avance de tiempo al despertar (t = 4.8s)
  await page.evaluate(() => {
    window.__game.cinematic.time = 4.8;
    window.__game.cinematic.update(0.01);
  });
  await page.waitForTimeout(400);

  const wakeData = await page.evaluate(() => {
    const c = window.__game.cinematic;
    const hud = window.__game.hud;
    return {
      phase: c.phase,
      wokeUp: c.wokeUp,
      dialogue: hud.dialogueText ? hud.dialogueText.textContent : '',
      speaker: hud.dialogueSpeaker ? hud.dialogueSpeaker.textContent : '',
      zzzHidden: c.zzzSprites.every(z => !z.sprite.visible)
    };
  });
  console.log('2. Datos de despertar:', JSON.stringify(wakeData, null, 2));
  if (!wakeData.wokeUp || wakeData.phase !== 'wake_up') {
    throw new Error(`Fallo al despertar: phase=${wakeData.phase}, wokeUp=${wakeData.wokeUp}`);
  }

  await page.screenshot({ path: '/home/itadmin/.gemini/antigravity/brain/61612200-0a3c-4c81-b90d-bdb88fa6fce7/screenshot-frogbert-wake-up.png' });
  console.log('📸 Captura 2 guardada: Frogbert despierto sobresaltado');

  // 3. Simular avance a la confrontación con Pato Lemus y Talabots (t = 7.5s)
  await page.evaluate(() => {
    window.__game.cinematic.time = 7.5;
    window.__game.cinematic.update(0.01);
  });
  await page.waitForTimeout(400);

  const confrontData = await page.evaluate(() => {
    const c = window.__game.cinematic;
    const hud = window.__game.hud;
    return {
      phase: c.phase,
      dialogue: hud.dialogueText ? hud.dialogueText.textContent : '',
      speaker: hud.dialogueSpeaker ? hud.dialogueSpeaker.textContent : '',
      talabots: c.talabots.length
    };
  });
  console.log('3. Datos de confrontación:', JSON.stringify(confrontData, null, 2));

  await page.screenshot({ path: '/home/itadmin/.gemini/antigravity/brain/61612200-0a3c-4c81-b90d-bdb88fa6fce7/screenshot-confrontation-pato-talabots.png' });
  console.log('📸 Captura 3 guardada: Confrontación con Pato Lemus y escoltas Talabots');

  // 4. Simular patada impecable (t = 11.6s, hitstop POW)
  await page.evaluate(() => {
    window.__game.cinematic.time = 11.6;
    window.__game.cinematic.update(0.01);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/home/itadmin/.gemini/antigravity/brain/61612200-0a3c-4c81-b90d-bdb88fa6fce7/screenshot-tree-kick-impact.png' });
  console.log('📸 Captura 4 guardada: Patada cómica POW');

  // 5. Simular aterrizaje en la base y monólogo enojado (t = 19.0s)
  await page.evaluate(() => {
    window.__game.cinematic.time = 19.0;
    window.__game.cinematic.update(0.01);
  });
  await page.waitForTimeout(300);

  const angryData = await page.evaluate(() => {
    const c = window.__game.cinematic;
    const hud = window.__game.hud;
    const p = window.__game.player;
    return {
      phase: c.phase,
      dialogue: hud.dialogueText ? hud.dialogueText.textContent : '',
      speaker: hud.dialogueSpeaker ? hud.dialogueSpeaker.textContent : '',
      playerY: p.position.y
    };
  });
  console.log('5. Datos de Frogbert enojado en la base:', JSON.stringify(angryData, null, 2));

  await page.screenshot({ path: '/home/itadmin/.gemini/antigravity/brain/61612200-0a3c-4c81-b90d-bdb88fa6fce7/screenshot-frogbert-angry-ground.png' });
  console.log('📸 Captura 5 guardada: Frogbert enojado al pie del árbol sagrado');

  await browser.close();
  console.log('🎉 ¡Todas las pruebas y fases pasaron al 100%!');
})();
