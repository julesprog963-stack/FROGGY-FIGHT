const { chromium } = require('playwright');

(async () => {
  console.log('🎬 Iniciando suite de verificación end-to-end: Copa del Árbol, Helicóptero y Jefe Talabot 64...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto('http://127.0.0.1:5173/');

  // 1. Iniciar aventura
  console.log('🎮 Presionando [¡INICIAR AVENTURA!]...');
  await page.click('#btn-start');
  await page.waitForTimeout(400);

  // 2. Validar que la cinemática de inicio ocurre en la copa del árbol (y ≈ 38.5m)
  console.log('🌲 Validando elevación en la copa del árbol...');
  const introData = await page.evaluate(() => {
    const c = window.__game.cinematic;
    const p = window.__game.player;
    return {
      phase: c.phase,
      elevationY: c.elevationY,
      camY: window.__game.camera.position.y,
      patoY: c.patoLemus.position.y,
      frogY: p.position.y
    };
  });
  console.log('Datos de Copa del Árbol:', JSON.stringify(introData));
  if (introData.camY < 35 || introData.frogY < 35) {
    throw new Error(`La cinemática no está en la copa del árbol: camY=${introData.camY}, frogY=${introData.frogY}`);
  }

  // 3. Probar animación impecable de patada (Hitstop & POW!)
  console.log('💥 Validando animación de patada y estrella POW...');
  const kickData = await page.evaluate(() => {
    window.__game.cinematic.time = 6.8; // Fase hitstop de patada (0.50 <= kickProgress < 0.70)
    window.__game.cinematic.update(0.01);
    const c = window.__game.cinematic;
    return {
      phase: c.phase,
      powVisible: c.powStar ? c.powStar.visible : false,
      rightLegRotX: c.rightLegPivot ? c.rightLegPivot.rotation.x : 0
    };
  });
  console.log('Datos de Patada:', JSON.stringify(kickData));
  await page.screenshot({ path: 'screenshot-test-tree-kick.png' });
  if (!kickData.powVisible || kickData.rightLegRotX < 1.0) {
    throw new Error('La animación de patada impecable o powStar no se activaron correctamente');
  }
  await page.screenshot({ path: 'screenshot-test-tree-kick.png' });

  // 4. Probar caída libre vertical (38 metros hacia abajo) y aterrizaje en la base
  console.log('🪂 Validando caída vertical en picada hasta la base...');
  await page.evaluate(() => {
    window.__game.cinematic.time = 13.5; // Fase crash / angry
    window.__game.cinematic.update(0.01);
  });
  await page.waitForTimeout(400);

  const crashData = await page.evaluate(() => {
    const p = window.__game.player;
    const speaker = document.getElementById('dialogue-speaker').innerText;
    return {
      frogPos: { x: p.position.x, y: p.position.y, z: p.position.z },
      speaker
    };
  });
  console.log('Datos de Aterrizaje en Base:', JSON.stringify(crashData));
  if (crashData.frogPos.y > 5.0 || crashData.frogPos.z < 8.0) {
    throw new Error(`Frogbert no aterrizó en la base del árbol: y=${crashData.frogPos.y}`);
  }
  await page.screenshot({ path: 'screenshot-test-base-landing.png' });

  // 5. Finalizar cinemática de inicio para entrar a gameplay activo
  console.log('🕹️ Pasando a gameplay activo...');
  await page.evaluate(() => {
    window.__game.cinematic.finish();
  });
  await page.waitForTimeout(300);

  // 6. Teletransportar a Frogbert a la cima (y = 41.2) para activar la llegada a la cima
  console.log('⛰️ Teletransportando a la cima del árbol (y = 41.2)...');
  await page.evaluate(() => {
    window.__game.player.position.set(0, 41.2, 5.0);
    window.__game.player.velocity.set(0, 0, 0);
  });
  await page.waitForTimeout(500);

  // 7. Validar Cinemática de la Cima: Pato Lemus y el Helicóptero TALACORP
  console.log('🚁 Validando llegada a la cima y helicóptero de TALACORP...');
  const summitData = await page.evaluate(() => {
    const sc = window.__game.summitCutscene;
    const b = window.__game.boss;
    return {
      hasSummitCutscene: !!sc,
      isActive: sc ? sc.isActive : false,
      phase: sc ? sc.phase : 'none',
      hasHelicopter: sc && sc.helicopter ? sc.helicopter.mesh.visible : false,
      bossState: b ? b.state : 'none'
    };
  });
  console.log('Datos de Cima y Helicóptero:', JSON.stringify(summitData));
  if (!summitData.hasSummitCutscene) {
    throw new Error('No se disparó la cinemática de la cima al llegar a y=38.5');
  }

  // Avanzar a la llegada del helicóptero y despegue
  await page.evaluate(() => {
    if (window.__game.summitCutscene) {
      window.__game.summitCutscene.time = 5.5; // Fase heli_arrive
      window.__game.summitCutscene.update(0.01);
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-test-summit-helicopter.png' });

  // 8. Iniciar combate contra el TALABOT TITÁN
  console.log('🤖 Activando batalla contra el TALABOT TITÁN estilo Mario vs Bowser...');
  await page.evaluate(() => {
    if (window.__game.summitCutscene) {
      window.__game.summitCutscene.finish();
    }
    window.__game.boss.state = 'dizzy'; // Poner al jefe mareado con cola lista para agarrar
  });
  await page.waitForTimeout(300);

  // 9. Probar Agarre de Cola, Giro y Lanzamiento contra una Mina de Púas
  console.log('💥 Probando mecánica de Agarre, Giro y Lanzamiento contra mina...');
  const grabAndThrowData = await page.evaluate(() => {
    const b = window.__game.boss;
    const p = window.__game.player;

    // Agarrar la cola
    b.startGrab(p);
    const grabbedState = b.state;

    // Simular giro rápido
    b.spinSpeed = 10.0;
    b.spinAngle = 0; // Apunta hacia una mina perimetral

    // Simular lanzamiento hacia la mina en x = 10.6, z = 0
    b.throwBoss(p);
    const thrownState = b.state;

    // Colocar el jefe impactando directamente la primera mina
    const targetMine = b.mines[0];
    b.mesh.position.copy(targetMine.position);
    b.updateThrown(0.016, p);

    return {
      grabbedState,
      thrownState,
      bossHp: b.hp,
      mineActive: targetMine.active,
      bossPhase: b.phase
    };
  });
  console.log('Datos de Agarre y Lanzamiento a Mina:', JSON.stringify(grabAndThrowData));
  if (grabAndThrowData.grabbedState !== 'grabbed' || grabAndThrowData.thrownState !== 'thrown') {
    throw new Error(`Estados de lanzamiento incorrectos: ${JSON.stringify(grabAndThrowData)}`);
  }
  if (grabAndThrowData.bossHp !== 2 || grabAndThrowData.mineActive !== false) {
    throw new Error(`La mina no explotó o el jefe no recibió daño: HP=${grabAndThrowData.bossHp}, mineActive=${grabAndThrowData.mineActive}`);
  }
  await page.screenshot({ path: 'screenshot-test-bowser-mine-explosion.png' });

  // 10. Probar Caída al Vacío y Ascenso con Propulsores de Recuperación
  console.log('🚀 Probando caída libre al abismo y animación de ascenso con propulsores...');
  const fallAndAscendData = await page.evaluate(async () => {
    const b = window.__game.boss;
    const p = window.__game.player;

    // Lanzar al jefe intencionalmente hacia el vacío (lejos de las minas, por ejemplo a x=16, z=16)
    b.state = 'thrown';
    b.mesh.position.set(16, b.arenaCenter.y + 0.5, 16);
    b.throwVelocity.set(4, -1, 4);

    // Actualizar caída para que detecte que está fuera de la arena (radio 8.5)
    b.updateThrown(0.1, p);
    const fallingState = b.state; // Debe ser 'falling'

    // Simular caída durante 1 segundo
    for (let i = 0; i < 20; i++) {
      b.updateFalling(0.05, p);
    }
    const deepY = b.mesh.position.y; // Altura en lo profundo del abismo

    // Forzar transición a ascenso
    b.updateFalling(0.5, p);
    const ascendingState = b.state; // Debe ser 'ascending'

    // Simular ascenso por propulsores
    for (let i = 0; i < 40; i++) {
      b.updateAscending(0.04, p);
    }
    const highY = b.mesh.position.y; // Altura máxima sobre la copa

    // Continuar hasta el aterrizaje y recuperación en el centro
    for (let i = 0; i < 60; i++) {
      if (b.state === 'idle') break;
      b.updateAscending(0.03, p);
    }
    const finalState = b.state;
    const finalDistToCenter = Math.hypot(b.mesh.position.x - b.arenaCenter.x, b.mesh.position.z - b.arenaCenter.z);

    return {
      fallingState,
      deepY,
      ascendingState,
      highY,
      finalState,
      finalDistToCenter,
      finalY: b.mesh.position.y
    };
  });
  console.log('Datos de Caída y Ascenso:', JSON.stringify(fallAndAscendData));
  if (fallAndAscendData.fallingState !== 'falling' || fallAndAscendData.ascendingState !== 'ascending') {
    throw new Error(`Estados de caída/ascenso incorrectos: ${JSON.stringify(fallAndAscendData)}`);
  }
  if (fallAndAscendData.deepY > 30) {
    throw new Error(`El jefe no cayó al abismo: deepY=${fallAndAscendData.deepY}`);
  }
  if (fallAndAscendData.highY < 42) {
    throw new Error(`El jefe no ascendió por encima de la plataforma: highY=${fallAndAscendData.highY}`);
  }
  if (fallAndAscendData.finalDistToCenter > 1.0 || fallAndAscendData.finalState !== 'idle') {
    throw new Error(`El jefe no aterrizó recuperado en el centro: dist=${fallAndAscendData.finalDistToCenter}, state=${fallAndAscendData.finalState}`);
  }
  await page.screenshot({ path: 'screenshot-test-boss-rocket-recovery.png' });

  // 11. Probar Ataque de Salto (Stomp) y Onda Expansiva Radial
  console.log('🌊 Probando ataque de pisotón (stomp) y animación de onda expansiva...');
  const stompData = await page.evaluate(() => {
    const b = window.__game.boss;
    const p = window.__game.player;

    b.state = 'stomp';
    b.subTimer = 0;
    b.stompImpactTriggered = false;

    // 1. Fase de salto en el aire
    b.subTimer = 0.9;
    b.updateStomp(0.01, p);
    const jumpY = b.mesh.position.y;

    // 2. Fase de impacto sísmico
    b.subTimer = 1.15;
    b.updateStomp(0.01, p);
    const activeShockwaves = b.shockwaves.length;
    const shockwave = b.shockwaves[0];

    // 3. Simular expansión de la onda
    if (shockwave) {
      shockwave.update(0.4, p);
    }
    const waveRadius = shockwave ? shockwave.currentRadius : 0;
    const waveOpacity = shockwave ? shockwave.mat.opacity : 0;

    return {
      jumpY,
      activeShockwaves,
      waveRadius,
      waveOpacity
    };
  });
  console.log('Datos de Salto y Onda Expansiva:', JSON.stringify(stompData));
  if (stompData.jumpY < 42) {
    throw new Error(`El salto del pisotón no alcanzó suficiente altura: jumpY=${stompData.jumpY}`);
  }
  if (stompData.activeShockwaves < 1 || stompData.waveRadius < 3.0) {
    throw new Error(`La onda expansiva no se generó o no se expandió: ${JSON.stringify(stompData)}`);
  }
  await page.screenshot({ path: 'screenshot-test-boss-shockwave.png' });

  console.log('✅ ¡Todas las pruebas de cinemática en copa, patada, helicóptero, caída/ascenso y onda expansiva pasaron al 100%!');
  await browser.close();
})();
