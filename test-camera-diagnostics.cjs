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

  // Diagnostic 1: Initial Camera State
  const initialCam = await page.evaluate(() => {
    const cam = window.__game.tpCamera;
    const p = window.__game.player;
    return {
      camPos: { x: cam.camera.position.x, y: cam.camera.position.y, z: cam.camera.position.z },
      playerPos: { x: p.position.x, y: p.position.y, z: p.position.z },
      yaw: cam.yaw,
      pitch: cam.pitch,
      distance: cam.distance
    };
  });
  console.log('📷 Estado Inicial de Cámara:', JSON.stringify(initialCam, null, 2));

  // Diagnostic 2: Move player around the trunk to opposite side (X=0, Z=-11)
  console.log('🔄 Moviendo jugador al lado opuesto del tronco (Z=-11)...');
  await page.evaluate(() => {
    const p = window.__game.player;
    p.position.set(0, 15, -11); // Froggy en el lado trasero del tronco
  });
  // Simulate 60 frames (1 second) of camera update without manual mouse drag
  await page.evaluate(() => {
    for (let i = 0; i < 60; i++) {
      window.__game.tpCamera.update(1/60);
    }
  });

  const occludedCam = await page.evaluate(() => {
    const cam = window.__game.tpCamera;
    const p = window.__game.player;
    const cPos = cam.camera.position;
    const pPos = p.position;

    // Check if line between cPos and pPos intersects trunk cylinder at radius 9.5
    // 2D line segment intersection with circle at (0,0)
    // Parameterize: P(t) = cPos + t * (pPos - cPos)
    const dx = pPos.x - cPos.x;
    const dz = pPos.z - cPos.z;
    const lenSq = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, -(cPos.x * dx + cPos.z * dz) / lenSq));
    const closestX = cPos.x + t * dx;
    const closestZ = cPos.z + t * dz;
    const minDistToTrunk = Math.hypot(closestX, closestZ);

    return {
      camPos: { x: cPos.x.toFixed(2), y: cPos.y.toFixed(2), z: cPos.z.toFixed(2) },
      playerPos: { x: pPos.x.toFixed(2), y: pPos.y.toFixed(2), z: pPos.z.toFixed(2) },
      minDistOfRayToTrunkCenter: minDistToTrunk.toFixed(2),
      isOccludedByTrunk: minDistToTrunk < 9.0
    };
  });
  console.log('🌲 Diagnóstico de Oclusión por Tronco:', JSON.stringify(occludedCam, null, 2));

  await page.screenshot({ path: 'screenshot-camera-occlusion-test.png' });
  console.log('📸 Captura de prueba de oclusión guardada');

  await browser.close();
})();
