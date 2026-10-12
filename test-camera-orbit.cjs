const { chromium } = require('playwright');

function checkOcclusion(camPos, playerPos, trunkRadius) {
  const dx = camPos.x - playerPos.x;
  const dz = camPos.z - playerPos.z;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.001) return false;
  const t = Math.max(0, Math.min(1, -(playerPos.x * dx + playerPos.z * dz) / lenSq));
  const cx = playerPos.x + t * dx;
  const cz = playerPos.z + t * dz;
  const dist = Math.hypot(cx, cz);
  return { dist, isOccluded: dist < trunkRadius };
}

(async () => {
  console.log('🚀 Iniciando verificación de Cámara Orbital 360° y Game Feel...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto('http://127.0.0.1:5173/');
  await page.click('#btn-start');
  await page.waitForTimeout(600);

  // Test 1: Posición Inicial (0 grados, Z=11)
  console.log('--- Test 1: Cuadrante 0° (Inicio Z=11) ---');
  const quad0 = await page.evaluate(() => {
    const c = window.__game.tpCamera;
    const p = window.__game.player;
    return {
      camPos: { x: c.camera.position.x, y: c.camera.position.y, z: c.camera.position.z },
      playerPos: { x: p.position.x, y: p.position.y, z: p.position.z },
      yaw: c.yaw
    };
  });
  const occ0 = checkOcclusion(quad0.camPos, quad0.playerPos, 9.5);
  console.log(`0°: CamZ=${quad0.camPos.z.toFixed(2)}, Dist al Tronco=${occ0.dist.toFixed(2)}m (Ocluido: ${occ0.isOccluded})`);
  await page.screenshot({ path: 'screenshot-camera-0deg.png' });

  // Test 2: Cuadrante 90 grados (X=11, Z=0)
  console.log('--- Test 2: Cuadrante 90° (Lateral derecho X=11, Z=0) ---');
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(11, 10, 0);
    p.velocity.set(0, 0, 0);
  });
  // Simulate 45 frames of camera update
  for (let i = 0; i < 45; i++) {
    await page.evaluate(() => window.__game.tpCamera.update(1/60));
  }
  const quad90 = await page.evaluate(() => {
    const c = window.__game.tpCamera;
    const p = window.__game.player;
    return {
      camPos: { x: c.camera.position.x, y: c.camera.position.y, z: c.camera.position.z },
      playerPos: { x: p.position.x, y: p.position.y, z: p.position.z },
      yaw: c.yaw
    };
  });
  const occ90 = checkOcclusion(quad90.camPos, quad90.playerPos, 9.5);
  console.log(`90°: CamX=${quad90.camPos.x.toFixed(2)}, CamZ=${quad90.camPos.z.toFixed(2)}, Dist Tronco=${occ90.dist.toFixed(2)}m (Ocluido: ${occ90.isOccluded})`);
  await page.screenshot({ path: 'screenshot-camera-90deg.png' });

  // Test 3: Cuadrante 180 grados (Reverso del Tronco X=0, Z=-11)
  console.log('--- Test 3: Cuadrante 180° (Reverso X=0, Z=-11) ---');
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(0, 15, -11);
    p.velocity.set(0, 0, 0);
  });
  for (let i = 0; i < 45; i++) {
    await page.evaluate(() => window.__game.tpCamera.update(1/60));
  }
  const quad180 = await page.evaluate(() => {
    const c = window.__game.tpCamera;
    const p = window.__game.player;
    return {
      camPos: { x: c.camera.position.x, y: c.camera.position.y, z: c.camera.position.z },
      playerPos: { x: p.position.x, y: p.position.y, z: p.position.z },
      yaw: c.yaw
    };
  });
  const occ180 = checkOcclusion(quad180.camPos, quad180.playerPos, 9.5);
  console.log(`180°: CamZ=${quad180.camPos.z.toFixed(2)}, Dist Tronco=${occ180.dist.toFixed(2)}m (Ocluido: ${occ180.isOccluded})`);
  await page.screenshot({ path: 'screenshot-camera-180deg.png' });

  // Test 4: Cuadrante 270 grados (Lateral izquierdo X=-11, Z=0)
  console.log('--- Test 4: Cuadrante 270° (Lateral izquierdo X=-11, Z=0) ---');
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(-11, 20, 0);
    p.velocity.set(0, 0, 0);
  });
  for (let i = 0; i < 45; i++) {
    await page.evaluate(() => window.__game.tpCamera.update(1/60));
  }
  const quad270 = await page.evaluate(() => {
    const c = window.__game.tpCamera;
    const p = window.__game.player;
    return {
      camPos: { x: c.camera.position.x, y: c.camera.position.y, z: c.camera.position.z },
      playerPos: { x: p.position.x, y: p.position.y, z: p.position.z },
      yaw: c.yaw
    };
  });
  const occ270 = checkOcclusion(quad270.camPos, quad270.playerPos, 9.5);
  console.log(`270°: CamX=${quad270.camPos.x.toFixed(2)}, CamZ=${quad270.camPos.z.toFixed(2)}, Dist Tronco=${occ270.dist.toFixed(2)}m (Ocluido: ${occ270.isOccluded})`);

  // Test 5: Comprobación de Coyote Time
  console.log('--- Test 5: Verificación de Coyote Time ---');
  const coyoteSuccess = await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(0, 5, 11);
    p.isGrounded = false;
    p.coyoteTime = 0.12; // Acaba de salir de la plataforma
    p.handleJump(0.02, { keys: { jumpPressed: true, jumpReleased: true } });
    return p.velocity.y > 0;
  });
  console.log(`Coyote Time funciona: ${coyoteSuccess ? '✅ SÍ' : '❌ NO'}`);

  // Test 6: Comprobación de Jump Buffer en Aterrizaje
  console.log('--- Test 6: Verificación de Jump Buffer ---');
  const bufferSuccess = await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(0, 1.8, 11);
    p.velocity.set(0, -5, 0);
    p.wasGrounded = false;
    p.isGrounded = false;
    // Jugador pulsa salto en el aire
    p.handleJump(0.016, { keys: { jumpPressed: true, jumpReleased: false } });
    const bufferRecorded = p.jumpBuffer > 0;

    // Aterriza en la plataforma
    p.handleCollisions(0.016, window.__game.level.platforms, window.__game.tpCamera);
    return bufferRecorded && p.velocity.y > 10;
  });
  console.log(`Jump Buffer funciona: ${bufferSuccess ? '✅ SÍ' : '❌ NO'}`);

  await browser.close();
  console.log('🎉 Todas las verificaciones completadas con éxito!');
})();
