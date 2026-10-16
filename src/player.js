import * as THREE from 'three';
import { Textures } from './textures.js';
import { paintedTexture, TRUNK_CONFIG } from './ps2-art.js';
import { audio } from './audio.js';

export class Player {
  constructor(scene, particles = null) {
    this.scene = scene;
    this.particles = particles;
    this.mesh = new THREE.Group();

    // Físicas y movimiento (posicionado en el hongo de inicio frente al tronco más ancho)
    this.position = new THREE.Vector3(0, 1.6, 16.5);
    this.prevPosition = this.position.clone();
    this.velocity = new THREE.Vector3();
    this.speed = 11.0;
    this.jumpForce = 14.2;
    this.gravity = -32;
    this.isGrounded = false;
    this.wasGrounded = false;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
    this.chargeTime = 0;
    this.isChargingJump = false;
    this.hitstopTimer = 0;

    // Estado de la lengua (mecánica de balanceo dinámico con cabeza sincronizada y caza)
    this.tongueState = 'idle'; // 'idle' | 'shooting' | 'attached' | 'retracting' | 'grab_boss'
    this.tongueTarget = null;
    this.tongueTargetType = null; // 'anchor' | 'bug' | 'boss'
    this.tongueAnchorPos = new THREE.Vector3();
    this.tongueLength = 0;
    this.maxTongueDist = 19.5;
    this.swingRopeLength = 0;
    this.swingVelocity = new THREE.Vector3();
    this.swingTime = 0;
    this.isSwingingBoss = false;
    this.currentBoss = null;

    // Estado de Patada con las Patas Traseras (Rear-Leg Kick estilo PS2)
    this.isKicking = false;
    this.kickTimer = 0;
    this.kickDuration = 0.38;
    this.kickCooldown = 0;
    this.kickHitTargets = new Set();
    this.kickWaveMesh = null;

    // Sistema de vidas, bichos y monedas
    this.lives = 3;
    this.bugsEaten = 0;
    this.coins = 0;
    this.totalBugsForLife = 20;
    this.lastCheckpoint = new THREE.Vector3(0, 1.6, 16.5);
    this.invulnerableTimer = 0;

    // Componentes visuales estilo PS2 / Rareware
    this.modelContainer = null;
    this.headGroup = null;
    this.body = null;
    this.belly = null;
    this.eyes = [];
    this.pupils = [];
    this.eyelids = [];
    this.cheeks = [];
    this.mouth = null;
    this.legs = [];
    this.arms = [];
    this.shadow = null;
    this.tongueMesh = null;

    // Animación
    this.animTime = 0;
    this.facingAngle = 0;
    this.squashStretch = new THREE.Vector3(1, 1, 1);

    this.createModel();
    this.createShadow();
    this.createTongueVisual();
    this.createKickEffectVisual();
    this.scene.add(this.mesh);
  }

  createModel() {
    // Paleta PS2 / Rareware: verde con textura pintada, pancita cálida y ojos expresivos
    const frogMat = new THREE.MeshLambertMaterial({ color: 0xb5e65b, map: paintedTexture('skin'), flatShading: true });
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xe8ce74, flatShading: true });
    const eyeWhiteMat = new THREE.MeshLambertMaterial({ color: 0xfff6dc, emissive: 0x242318 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyelidMat = new THREE.MeshLambertMaterial({ color: 0x2e8623, flatShading: true });
    const mouthMat = new THREE.MeshLambertMaterial({ color: 0xc23616, flatShading: true });
    const padMat = new THREE.MeshLambertMaterial({ color: 0xe1b12c, flatShading: true });

    // Contenedor principal elevado a 0.60 para que la base de las patas coincida con y = 0
    this.modelContainer = new THREE.Group();
    this.modelContainer.position.y = 0.60;
    this.mesh.add(this.modelContainer);

    // 1. Cuerpo rechoncho
    const bodyGeo = new THREE.DodecahedronGeometry(0.72, 1);
    this.body = new THREE.Mesh(bodyGeo, frogMat);
    this.body.scale.set(1.1, 0.85, 1.0);
    this.modelContainer.add(this.body);

    // Pancita amarilla prominente
    const bellyGeo = new THREE.SphereGeometry(0.52, 6, 6);
    this.belly = new THREE.Mesh(bellyGeo, bellyMat);
    this.belly.position.set(0, -0.15, 0.4);
    this.belly.scale.set(0.92, 0.82, 0.52);
    this.body.add(this.belly);

    // =========================================================================
    // GRUPO ARTICULADO DE CABEZA (Ojos, Párpados, Mejillas y Boca)
    // Permite que la cabeza de Frogbert apunte y gire junto con el balanceo
    // =========================================================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.15, 0.10);
    this.modelContainer.add(this.headGroup);

    // Sacos vocales de las mejillas
    [-0.58, 0.58].forEach(x => {
      const cheekGeo = new THREE.SphereGeometry(0.24, 5, 5);
      const cheek = new THREE.Mesh(cheekGeo, bellyMat);
      cheek.position.set(x, -0.05, 0.10);
      this.headGroup.add(cheek);
      this.cheeks.push(cheek);
    });

    // 2. Ojos saltones gigantes
    const eyeGeo = new THREE.DodecahedronGeometry(0.36, 1);
    const pupilGeo = new THREE.SphereGeometry(0.13, 8, 6);
    const eyelidGeo = new THREE.SphereGeometry(0.38, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);

    [-0.38, 0.38].forEach(x => {
      const eyeBall = new THREE.Mesh(eyeGeo, eyeWhiteMat);
      eyeBall.position.set(x, 0.41, 0.16);
      this.headGroup.add(eyeBall);
      this.eyes.push(eyeBall);

      // Párpados expresivos
      const eyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
      eyelid.position.set(x, 0.43, 0.16);
      eyelid.rotation.x = -Math.PI / 2.8;
      this.headGroup.add(eyelid);
      this.eyelids.push(eyelid);

      // Pupila con brillo especular PS2
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(x, 0.43, 0.47);
      this.headGroup.add(pupil);
      this.pupils.push(pupil);

      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), eyeWhiteMat);
      glint.position.set(-0.035, 0.045, 0.105);
      pupil.add(glint);
    });

    // 3. Boca cómica con lengua asomando (vinculada a headGroup para balanceo sincronizado)
    const mouthGeo = new THREE.BoxGeometry(0.72, 0.12, 0.4);
    this.mouth = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouth.position.set(0, -0.10, 0.50);
    this.headGroup.add(this.mouth);

    const tongueTip = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.06, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xff4757 })
    );
    tongueTip.position.set(0, 0, 0.24);
    this.mouth.add(tongueTip);

    // 4. Patas traseras musculosas con dedos palmeados (para saltos y patadas PS2)
    [-0.56, 0.56].forEach(x => {
      const legGroup = new THREE.Group();
      const thighGeo = new THREE.SphereGeometry(0.35, 8, 6);
      const thigh = new THREE.Mesh(thighGeo, frogMat);
      thigh.position.set(0, 0, -0.1);
      thigh.rotation.x = 0.4;
      legGroup.add(thigh);

      // Pantorrilla / articulación elástica para la patada
      const calfGeo = new THREE.CylinderGeometry(0.16, 0.13, 0.34, 6);
      const calf = new THREE.Mesh(calfGeo, frogMat);
      calf.position.set(0, -0.18, 0.04);
      calf.rotation.x = -0.35;
      legGroup.add(calf);

      // Pie con almohadillas
      const footGeo = new THREE.BoxGeometry(0.46, 0.11, 0.58);
      const foot = new THREE.Mesh(footGeo, frogMat);
      foot.position.set(0, -0.35, 0.2);
      legGroup.add(foot);

      // 3 dedos con ventosas doradas
      [-0.14, 0, 0.14].forEach(tx => {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.045, 5), padMat);
        pad.position.set(tx, 0.06, 0.24);
        foot.add(pad);
      });

      legGroup.position.set(x, -0.2, -0.2);
      this.modelContainer.add(legGroup);
      this.legs.push(legGroup);
    });

    // 5. Patitas delanteras / brazos
    [-0.46, 0.46].forEach(x => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.48, 6), frogMat);
      arm.position.set(x, -0.2, 0.4);
      arm.rotation.x = -0.2;
      this.modelContainer.add(arm);
      this.arms.push(arm);
    });

    // 6. Mochilita marrón de explorador
    const backpackMat = new THREE.MeshLambertMaterial({ color: 0x8b4513, flatShading: true });
    const flapMat = new THREE.MeshLambertMaterial({ color: 0x5c2c10, flatShading: true });
    const buckleMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });

    this.backpack = new THREE.Group();
    const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.44, 0.32), backpackMat);
    packBody.position.set(0, 0.05, -0.68);
    this.backpack.add(packBody);

    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.24, 0.34), flapMat);
    flap.position.set(0, 0.22, -0.68);
    this.backpack.add(flap);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.06), buckleMat);
    buckle.position.set(0, 0.08, -0.85);
    this.backpack.add(buckle);

    [-0.24, 0.24].forEach(x => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.65), flapMat);
      strap.position.set(x, 0.12, -0.32);
      strap.rotation.x = -0.3;
      this.backpack.add(strap);
    });

    this.modelContainer.add(this.backpack);
  }

  createShadow() {
    const shadowGeo = new THREE.PlaneGeometry(1.7, 1.7);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: Textures.createBlobShadow(),
      transparent: true,
      depthWrite: false,
      opacity: 0.8
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);
  }

  createTongueVisual() {
    const tongueGeo = new THREE.CylinderGeometry(0.10, 0.08, 1, 8);
    tongueGeo.translate(0, 0.5, 0);
    tongueGeo.rotateX(Math.PI / 2);
    const tongueMat = new THREE.MeshBasicMaterial({ color: 0xff4757 });
    this.tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
    this.tongueMesh.visible = false;
    this.scene.add(this.tongueMesh);
  }

  createKickEffectVisual() {
    // Arco de energía PS2 para la patada con las patas traseras
    const waveGroup = new THREE.Group();
    const arcGeo = new THREE.TorusGeometry(0.95, 0.12, 6, 18, Math.PI * 1.15);
    arcGeo.rotateX(Math.PI / 2);
    this.kickWaveMat = new THREE.MeshBasicMaterial({
      color: 0xa3e635,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const arcMesh = new THREE.Mesh(arcGeo, this.kickWaveMat);
    waveGroup.add(arcMesh);

    const innerArcGeo = new THREE.TorusGeometry(0.75, 0.07, 6, 16, Math.PI * 0.95);
    innerArcGeo.rotateX(Math.PI / 2);
    const innerArc = new THREE.Mesh(
      innerArcGeo,
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 })
    );
    waveGroup.add(innerArc);

    waveGroup.visible = false;
    this.kickWaveMesh = waveGroup;
    this.mesh.add(this.kickWaveMesh);
  }

  getMouthWorldPosition(target = new THREE.Vector3()) {
    this.mesh.updateMatrixWorld(true);
    if (this.mouth) {
      this.mouth.getWorldPosition(target);
      return target;
    }
    return target.copy(this.position).add(new THREE.Vector3(0, 0.65, 0));
  }

  update(dt, input, platforms, anchors, bugs, boss, camera = null, miniTalabots = [], antenna = null) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return;
    }

    this.animTime += dt * 8;
    if (this.kickCooldown > 0) this.kickCooldown = Math.max(0, this.kickCooldown - dt);

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.mesh.visible = Math.floor(this.invulnerableTimer * 15) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }

    // 1. Verificar inicio o progreso de Patada Trasera (Rear-Leg Kick)
    this.handleKickActions(dt, input, miniTalabots, antenna, bugs, boss, camera);

    // 2. Movimiento / Balanceo de Lengua / Giro de Jefe
    if (this.isSwingingBoss || (boss && boss.state === 'grabbed')) {
      if (!this.isSwingingBoss && boss) {
        this.onBossGrabbed(boss);
      }
      this.handleBossSwing(dt, boss, input);
    } else if (this.tongueState === 'attached') {
      this.handleTongueSwing(dt, input);
    } else {
      this.handleMovement(dt, input);
      this.handleJump(dt, input, camera);
    }

    // 3. Acciones de lengua, colisiones y animaciones
    this.handleTongueActions(dt, input, anchors, bugs, boss, camera, miniTalabots, antenna);
    this.handleCollisions(dt, platforms, camera);
    this.mesh.position.copy(this.position);
    this.updateAnimation(dt, input, boss);

    // 4. Actualizar geometría de lengua DESPUÉS de rotar cabeza y cuerpo para que salga exacto de la boca
    this.syncTongueToHead();
    this.updateShadow(platforms);
  }

  handleKickActions(dt, input, miniTalabots = [], antenna = null, bugs = [], boss = null, camera = null) {
    // Detectar si hay un Mini-Talabot o la Antena justo al alcance de patada para ataque contextual
    let closeCombatTarget = null;
    let closestDist = 3.6;

    for (const bot of miniTalabots) {
      if (!bot.alive || bot.state === 'destroyed') continue;
      const d = this.position.distanceTo(bot.position);
      if (d < closestDist) {
        closestDist = d;
        closeCombatTarget = bot;
      }
    }

    if (antenna && antenna.isVulnerable && !antenna.isDestroyed) {
      const dAnt = this.position.distanceTo(antenna.position);
      if (dAnt < 4.4) {
        closeCombatTarget = antenna;
      }
    }

    const wantsContextualKick =
      input.keys.tonguePressed &&
      this.tongueState === 'idle' &&
      closeCombatTarget !== null &&
      !document.body.classList.contains('in-dialogue');

    if ((input.keys.kickPressed || wantsContextualKick) && !this.isKicking && this.kickCooldown <= 0 && !this.isSwingingBoss) {
      if (wantsContextualKick) {
        // Consumir el input para que ejecute la patada directa contra el robot/antena cercano
        input.keys.tonguePressed = false;
      }
      this.startKick(closeCombatTarget);
    }

    if (!this.isKicking) {
      if (this.kickWaveMesh) this.kickWaveMesh.visible = false;
      return;
    }

    this.kickTimer += dt;
    const progress = this.kickTimer / this.kickDuration;

    // Mostrar onda de impacto de las patas traseras
    if (this.kickWaveMesh) {
      this.kickWaveMesh.visible = progress >= 0.12 && progress <= 0.82;
      const waveScale = 0.75 + Math.sin(progress * Math.PI) * 0.65;
      this.kickWaveMesh.scale.set(waveScale, 1, waveScale);
      // Posicionar en las patas traseras proyectadas
      this.kickWaveMesh.position.set(0, 0.55, -0.85 - Math.sin(progress * Math.PI) * 0.55);
      this.kickWaveMesh.rotation.y = Math.PI;
    }

    // Ventana activa de impacto de la patada trasera (amplio radio alrededor de Frogbert)
    if (progress >= 0.10 && progress <= 0.78) {
      const kickRadius = 3.5;

      // 1. Golpear Talabots pequeños
      for (const bot of miniTalabots) {
        if (!bot.alive || bot.state === 'destroyed' || this.kickHitTargets.has(bot)) continue;
        const dist = this.position.distanceTo(bot.position);
        if (dist <= kickRadius) {
          this.kickHitTargets.add(bot);
          bot.takeKickHit(this, camera);
          this.hitstopTimer = 0.055;
        }
      }

      // 2. Golpear Antena Central en la cima del árbol
      if (antenna && !antenna.isDestroyed && !this.kickHitTargets.has(antenna)) {
        const distAnt = this.position.distanceTo(antenna.position);
        if (distAnt <= 4.5) {
          this.kickHitTargets.add(antenna);
          antenna.takeKickHit(this, camera);
          this.hitstopTimer = 0.07;
        }
      }

      // 3. Golpear avispas patrulleras cercanas con patada
      for (const bug of bugs) {
        if (!bug.alive || bug.type !== 'wasp' || this.kickHitTargets.has(bug)) continue;
        if (this.position.distanceTo(bug.position) <= 2.8) {
          this.kickHitTargets.add(bug);
          bug.alive = false;
          this.bugsEaten++;
          audio.playFrogKick();
          audio.playEatBug();
          if (this.particles) this.particles.spawnSparks(bug.position, 12);
        }
      }
    }

    if (this.kickTimer >= this.kickDuration) {
      this.isKicking = false;
      this.kickTimer = 0;
      if (this.kickWaveMesh) this.kickWaveMesh.visible = false;
    }
  }

  startKick(targetEntity = null) {
    this.isKicking = true;
    this.kickTimer = 0;
    this.kickCooldown = 0.42;
    this.kickHitTargets.clear();

    audio.playFrogKick();

    // Si hay un objetivo cercano (Talabot pequeño o Antena), orientar la patada trasera hacia él
    if (targetEntity && targetEntity.position) {
      const toTarget = targetEntity.position.clone().sub(this.position).setY(0);
      if (toTarget.lengthSq() > 0.01) {
        // Las patas traseras patean hacia atrás (-Z local), por lo que miramos en dirección opuesta para dar la coz trasera
        this.facingAngle = Math.atan2(-toTarget.x, -toTarget.z);
        this.mesh.rotation.y = this.facingAngle;
      }
    }

    // Impulso acrobático de patada
    if (this.isGrounded) {
      this.velocity.y = 4.2;
      this.isGrounded = false;
    } else {
      this.velocity.y = Math.max(this.velocity.y, 2.8);
    }

    this.squashStretch.set(0.84, 1.24, 1.18);
    if (this.particles) {
      this.particles.spawnDustPuff(this.position, 5, 0xa3e635);
    }
  }

  handleMovement(dt, input) {
    this.prevPosition.copy(this.position);

    const moveDir = new THREE.Vector3();
    if (input.keys.forward) moveDir.z -= 1;
    if (input.keys.backward) moveDir.z += 1;
    if (input.keys.left) moveDir.x -= 1;
    if (input.keys.right) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      const camAngle = input.cameraYaw || 0;
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), camAngle);

      this.velocity.x = moveDir.x * this.speed;
      this.velocity.z = moveDir.z * this.speed;

      if (!this.isKicking) {
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        // Interpolación angular suave
        let diff = targetAngle - this.facingAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.facingAngle += diff * Math.min(1, dt * 14);
        this.mesh.rotation.y = this.facingAngle;
      }
    } else {
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
    }

    this.velocity.y += this.gravity * dt;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;
  }

  handleJump(dt, input, camera) {
    if (this.isGrounded) {
      this.coyoteTime = 0.14;
    } else {
      this.coyoteTime = Math.max(0, this.coyoteTime - dt);
    }

    if (this.jumpBuffer > 0) {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    }

    if (input.keys.jumpPressed) {
      if (this.isGrounded || this.coyoteTime > 0) {
        this.isChargingJump = true;
        this.chargeTime = 0;
      } else {
        this.jumpBuffer = 0.14;
      }
    }

    if (this.isChargingJump) {
      this.chargeTime += dt;
      const chargePct = Math.min(this.chargeTime / 0.35, 1.0);
      this.squashStretch.set(1 + chargePct * 0.32, 0.80 - chargePct * 0.40, 1 + chargePct * 0.32);
      this.cheeks.forEach(c => c.scale.setScalar(1 + chargePct * 1.4));
    } else {
      this.cheeks.forEach(c => c.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 10));
    }

    if (input.keys.jumpReleased && this.isChargingJump) {
      this.isChargingJump = false;
      const chargeRatio = Math.min(this.chargeTime / 0.35, 1.0);

      if (this.coyoteTime > 0 || this.isGrounded) {
        const jumpVel = this.jumpForce * (0.85 + chargeRatio * 0.45);
        this.velocity.y = jumpVel;
        this.isGrounded = false;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        audio.playJump(chargeRatio);

        this.squashStretch.set(0.78, 1.42, 0.78);

        if (this.particles) {
          this.particles.spawnDustPuff(this.position, 7);
        }

        if (camera && chargeRatio > 0.6) {
          camera.addTrauma(0.2);
        }
      }
    }
  }

  handleTongueActions(dt, input, anchors, bugs, boss, camera, miniTalabots = [], antenna = null) {
    if (input.keys.tonguePressed && this.tongueState === 'idle' && !this.isKicking) {
      audio.playTongueShoot();
      this.findTongueTarget(anchors, bugs, boss);
    }

    if (this.tongueState === 'shooting') {
      this.tongueLength += dt * 52;
      const distToTarget = Math.max(0.2, this.position.distanceTo(this.tongueAnchorPos));

      // Mientras dispara la lengua a un ancla o insecto, orientar cabeza y cuerpo hacia el objetivo
      const toTarget = this.tongueAnchorPos.clone().sub(this.position);
      if (Math.hypot(toTarget.x, toTarget.z) > 0.1) {
        this.facingAngle = Math.atan2(toTarget.x, toTarget.z);
        this.mesh.rotation.y = this.facingAngle;
      }

      if (this.tongueLength >= distToTarget) {
        if (this.tongueTargetType === 'anchor') {
          this.tongueState = 'attached';
          this.swingTime = 0;
          // Longitud óptima de cuerda (acorta un poco si estaba muy lejos para levantar a Frogbert del suelo)
          this.swingRopeLength = Math.min(Math.max(distToTarget * 0.88, 3.8), 11.5);

          // Conservar el impulso de carrera/salto de Frogbert al engancharse al péndulo
          this.swingVelocity.copy(this.velocity);
          const ropeDir = this.position.clone().sub(this.tongueAnchorPos).normalize();
          const radialComp = this.swingVelocity.dot(ropeDir);
          this.swingVelocity.addScaledVector(ropeDir, -radialComp);

          // Si se enganchó casi quieto, darle un impulso pendular hacia adelante para que el balanceo sea fluido
          const horizSpeed = Math.hypot(this.swingVelocity.x, this.swingVelocity.z);
          if (horizSpeed < 5.5) {
            const forwardDir = new THREE.Vector3(
              Math.sin(this.facingAngle),
              0,
              Math.cos(this.facingAngle)
            );
            this.swingVelocity.addScaledVector(forwardDir, 7.5 - horizSpeed);
          }

          audio.playTongueAttach();
          if (this.particles) this.particles.spawnSparks(this.tongueAnchorPos, 7);
        } else if (this.tongueTargetType === 'bug') {
          this.tongueState = 'retracting';
          if (this.tongueTarget && this.tongueTarget.alive) {
            this.tongueTarget.alive = false;
            this.bugsEaten++;
            audio.playEatBug();
            this.hitstopTimer = 0.05;

            if (this.particles) {
              this.particles.spawnDustPuff(this.tongueAnchorPos, 5, 0x2ecc71);
            }

            if (this.bugsEaten % this.totalBugsForLife === 0) {
              this.lives++;
              audio.play1Up();
              if (camera) camera.addTrauma(0.35);
            }
          }
        } else if (this.tongueTargetType === 'boss') {
          if (boss) {
            if (boss.startGrab) {
              boss.startGrab(this);
              this.onBossGrabbed(boss);
            } else if (boss.takeHit) {
              boss.takeHit();
              this.tongueState = 'retracting';
            } else {
              this.tongueState = 'retracting';
            }
          } else {
            this.tongueState = 'retracting';
          }
          this.hitstopTimer = 0.08;
          if (this.particles) this.particles.spawnSparks(this.tongueAnchorPos, 14);
          if (camera) camera.addTrauma(0.5);
        } else {
          this.tongueState = 'retracting';
        }
      }
    } else if (this.tongueState === 'retracting') {
      this.tongueLength -= dt * 58;
      if (this.tongueLength <= 0) {
        this.tongueState = 'idle';
        this.tongueMesh.visible = false;
      }
    } else if (this.tongueState === 'attached') {
      if (input.keys.jumpPressed || input.keys.tonguePressed) {
        this.tongueState = 'idle';
        this.tongueMesh.visible = false;

        // Impulso de salida del columpio con inercia parabólica generosa
        this.velocity.copy(this.swingVelocity).multiplyScalar(1.18);
        this.velocity.y = Math.max(this.velocity.y + 7.2, 12.2);
        this.squashStretch.set(0.76, 1.38, 0.76);
        audio.playJump(0.9);

        if (this.particles) this.particles.spawnDustPuff(this.position, 8);
        if (camera) camera.addTrauma(0.25);
      }
    }
  }

  findTongueTarget(anchors, bugs, boss) {
    const headPos = this.position.clone().add(new THREE.Vector3(0, 0.85, 0));
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.facingAngle);

    let closestBug = null;
    let closestBugDist = 10.0;
    bugs.forEach(bug => {
      if (!bug.alive) return;
      const toBug = bug.position.clone().sub(headPos);
      const dist = toBug.length();
      if (dist < closestBugDist) {
        const dot = forward.dot(toBug.clone().normalize());
        if (dot > 0.20) {
          closestBug = bug;
          closestBugDist = dist;
        }
      }
    });

    if (closestBug) {
      this.tongueState = 'shooting';
      this.tongueTarget = closestBug;
      this.tongueTargetType = 'bug';
      this.tongueAnchorPos.copy(closestBug.position);
      this.tongueLength = 0;
      return;
    }

    if (boss && boss.isVulnerable) {
      const bossDist = headPos.distanceTo(boss.weakSpotPos);
      if (bossDist < this.maxTongueDist) {
        this.tongueState = 'shooting';
        this.tongueTarget = boss;
        this.tongueTargetType = 'boss';
        this.tongueAnchorPos.copy(boss.weakSpotPos);
        this.tongueLength = 0;
        return;
      }
    }

    let closestAnchor = null;
    let closestAnchorDist = this.maxTongueDist;
    anchors.forEach(anc => {
      const dist = headPos.distanceTo(anc.position);
      if (dist < closestAnchorDist && anc.position.y > headPos.y - 0.5) {
        const toAnc = anc.position.clone().sub(headPos).normalize();
        const dot = forward.dot(toAnc);
        if (dot > -0.15) {
          closestAnchor = anc;
          closestAnchorDist = dist;
        }
      }
    });

    if (closestAnchor) {
      this.tongueState = 'shooting';
      this.tongueTarget = closestAnchor;
      this.tongueTargetType = 'anchor';
      this.tongueAnchorPos.copy(closestAnchor.position);
      this.tongueLength = 0;
    } else {
      this.tongueState = 'shooting';
      this.tongueTarget = null;
      this.tongueTargetType = 'none';
      this.tongueAnchorPos.copy(headPos).add(forward.clone().multiplyScalar(7.5));
      this.tongueLength = 0;
    }
  }

  handleTongueSwing(dt, input) {
    this.prevPosition.copy(this.position);
    this.swingTime += dt;
    this.isGrounded = false;

    // 1. Vector desde el punto de anclaje hasta Frogbert
    const offset = this.position.clone().sub(this.tongueAnchorPos);
    let currentDist = offset.length();
    if (currentDist < 0.1) currentDist = 0.1;
    const ropeDir = offset.clone().divideScalar(currentDist); // Apunta del ancla hacia el jugador

    // 2. Aceleración pendular gravitatoria + bombeo activo con WASD
    const g = new THREE.Vector3(0, this.gravity * 1.12, 0);
    const radialG = ropeDir.clone().multiplyScalar(g.dot(ropeDir));
    const tangentialG = g.sub(radialG);

    const swingPush = new THREE.Vector3();
    if (input.keys.forward) swingPush.z -= 26;
    if (input.keys.backward) swingPush.z += 26;
    if (input.keys.left) swingPush.x -= 26;
    if (input.keys.right) swingPush.x += 26;
    swingPush.applyAxisAngle(new THREE.Vector3(0, 1, 0), input.cameraYaw || 0);
    // Proyectar el empuje perpendicularmente a la cuerda
    swingPush.addScaledVector(ropeDir, -swingPush.dot(ropeDir));

    this.swingVelocity.addScaledVector(tangentialG, dt);
    this.swingVelocity.addScaledVector(swingPush, dt);

    // Eliminar cualquier componente radial parásita de la velocidad para un arco circular limpio
    const radialVel = this.swingVelocity.dot(ropeDir);
    this.swingVelocity.addScaledVector(ropeDir, -radialVel);
    this.swingVelocity.multiplyScalar(Math.pow(0.992, dt * 60));

    // 3. Avanzar posición y aplicar restricción elástica de longitud de lengua
    this.position.addScaledVector(this.swingVelocity, dt);

    const newOffset = this.position.clone().sub(this.tongueAnchorPos);
    const newDir = newOffset.lengthSq() > 0.0001 ? newOffset.normalize() : ropeDir;
    const targetRopeLen = THREE.MathUtils.lerp(currentDist, this.swingRopeLength, Math.min(1, dt * 10));
    this.position.copy(this.tongueAnchorPos).addScaledVector(newDir, targetRopeLen);

    // 4. Evitar que el péndulo atraviese el tronco del árbol
    if (this.position.y < TRUNK_CONFIG.height + 0.4) {
      const trunkR = TRUNK_CONFIG.getRadiusAtY(this.position.y) + 0.55;
      const distXZ = Math.hypot(this.position.x, this.position.z);
      if (distXZ < trunkR && distXZ > 0.001) {
        const nx = this.position.x / distXZ;
        const nz = this.position.z / distXZ;
        this.position.x = nx * trunkR;
        this.position.z = nz * trunkR;
        // Rebote tangencial suave sobre la corteza
        const inVel = this.swingVelocity.x * nx + this.swingVelocity.z * nz;
        if (inVel < 0) {
          this.swingVelocity.x -= inVel * nx;
          this.swingVelocity.z -= inVel * nz;
        }
      }
    }

    this.mesh.position.copy(this.position);

    // 5. ORIENTAR CUERPO Y CABEZA CON EL BALANCEO Y EL ANCLA
    // Mezclar dirección hacia el ancla y dirección de avance para que Frogbert mire hacia donde se columpia
    const toAnchorXZ = new THREE.Vector2(
      this.tongueAnchorPos.x - this.position.x,
      this.tongueAnchorPos.z - this.position.z
    );
    const velXZ = new THREE.Vector2(this.swingVelocity.x, this.swingVelocity.z);

    let targetYaw = this.facingAngle;
    if (velXZ.lengthSq() > 1.2 && toAnchorXZ.lengthSq() > 0.05) {
      const lookVec = toAnchorXZ.clone().normalize().multiplyScalar(0.55).add(velXZ.clone().normalize().multiplyScalar(0.45));
      if (lookVec.lengthSq() > 0.01) {
        targetYaw = Math.atan2(lookVec.x, lookVec.y);
      }
    } else if (toAnchorXZ.lengthSq() > 0.05) {
      targetYaw = Math.atan2(toAnchorXZ.x, toAnchorXZ.y);
    }

    let angleDiff = targetYaw - this.facingAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.facingAngle += angleDiff * Math.min(1, dt * 12);
    this.mesh.rotation.y = this.facingAngle;
  }

  syncTongueToHead() {
    if (this.isSwingingBoss || this.tongueState === 'grab_boss') {
      const mouthWorld = this.getMouthWorldPosition();
      const targetPos = (this.currentBoss && this.currentBoss.tailHandlePos) ? this.currentBoss.tailHandlePos : this.tongueAnchorPos;
      this.updateBossTongueMesh(mouthWorld, targetPos);
      return;
    }

    if (this.tongueState === 'idle') {
      this.tongueMesh.visible = false;
      return;
    }

    const mouthWorld = this.getMouthWorldPosition();
    const totalDist = Math.max(0.1, mouthWorld.distanceTo(this.tongueAnchorPos));
    let progress = 1.0;
    if (this.tongueState === 'shooting') {
      progress = Math.min(this.tongueLength / totalDist, 1.0);
    } else if (this.tongueState === 'retracting') {
      progress = Math.max(this.tongueLength / 10.0, 0);
    }

    this.updateTongueMesh(mouthWorld, this.tongueAnchorPos, progress);
  }

  updateTongueMesh(mouthPos, target, progress) {
    this.tongueMesh.visible = true;
    const curEnd = mouthPos.clone().lerp(target, progress);

    const dist = mouthPos.distanceTo(curEnd);
    if (dist < 0.08) {
      this.tongueMesh.visible = false;
      return;
    }

    this.tongueMesh.position.copy(mouthPos);
    this.tongueMesh.scale.set(1.15, 1.15, dist);
    this.tongueMesh.lookAt(curEnd);
  }

  onBossGrabbed(boss) {
    this.isSwingingBoss = true;
    this.currentBoss = boss;
    this.tongueState = 'grab_boss';
    this.velocity.set(0, 0, 0);
    if (boss) {
      this.facingAngle = boss.spinAngle;
      this.mesh.rotation.y = boss.spinAngle;
      if (boss.tailHandlePos) {
        this.tongueAnchorPos.copy(boss.tailHandlePos);
      }
    }
  }

  onBossReleased(boss, throwVel) {
    this.isSwingingBoss = false;
    this.currentBoss = null;
    this.tongueState = 'retracting';
    this.tongueLength = 3.6;
    if (boss && boss.tailHandlePos) {
      this.tongueAnchorPos.copy(boss.tailHandlePos);
    }
    this.squashStretch.set(0.75, 1.35, 0.75);
  }

  handleBossSwing(dt, boss, input) {
    this.velocity.set(0, 0, 0);

    if (boss) {
      this.currentBoss = boss;
      this.facingAngle = boss.spinAngle;
      this.mesh.rotation.y = boss.spinAngle;

      const targetPos = boss.tailHandlePos || boss.mesh.position;
      this.tongueAnchorPos.copy(targetPos);

      if (this.particles && Math.random() < Math.min(0.85, (boss.spinSpeed || 4) / 10)) {
        const offset = (Math.random() - 0.5) * 0.9;
        const footPos = this.position.clone().add(new THREE.Vector3(offset, 0.05, offset));
        this.particles.spawnDustPuff(footPos, 2, 0xe1b12c);
      }
    }
  }

  updateBossTongueMesh(mouthWorld, targetWorld) {
    if (!this.tongueMesh) return;
    this.tongueMesh.visible = true;

    const dist = mouthWorld.distanceTo(targetWorld);
    if (dist < 0.1) {
      this.tongueMesh.visible = false;
      return;
    }

    this.tongueMesh.position.copy(mouthWorld);
    this.tongueMesh.scale.set(1.4, 1.4, dist);
    this.tongueMesh.lookAt(targetWorld);
  }

  handleCollisions(dt, platforms, camera) {
    // 1. Colisión sólida contra el Gran Tronco Sagrado (usando TRUNK_CONFIG)
    if (this.position.y < TRUNK_CONFIG.height + 0.2) {
      const trunkRadius = TRUNK_CONFIG.getRadiusAtY(this.position.y);
      const distXZ = Math.hypot(this.position.x, this.position.z);
      const minTrunkDist = trunkRadius + 0.42;
      if (distXZ < minTrunkDist && distXZ > 0.001) {
        const nx = this.position.x / distXZ;
        const nz = this.position.z / distXZ;
        this.position.x = nx * minTrunkDist;
        this.position.z = nz * minTrunkDist;

        const inwardVel = this.velocity.x * nx + this.velocity.z * nz;
        if (inwardVel < 0) {
          this.velocity.x -= inwardVel * nx;
          this.velocity.z -= inwardVel * nz;
        }
      }
    }

    // 2. Apoyo y aterrizaje vertical sobre plataformas
    this.wasGrounded = this.isGrounded;
    this.isGrounded = false;
    const footRadius = 0.58;

    let bestGroundY = -9999;
    let bestPlatform = null;

    platforms.forEach(p => {
      if (p.isWalkable === false) return;

      const box = p.getBounds ? p.getBounds() : (p.box || (p.box = new THREE.Box3().setFromObject(p.mesh)));

      if (
        this.position.x >= box.min.x - footRadius &&
        this.position.x <= box.max.x + footRadius &&
        this.position.z >= box.min.z - footRadius &&
        this.position.z <= box.max.z + footRadius
      ) {
        const topY = box.max.y;
        const dy = this.position.y - topY;
        const fallStep = Math.max(0.65, Math.abs(this.velocity.y * dt) + 0.35);

        if (this.velocity.y <= 0 && dy >= -fallStep && dy <= 0.85) {
          if (topY > bestGroundY) {
            bestGroundY = topY;
            bestPlatform = p;
          }
        }
      }
    });

    if (bestPlatform !== null && this.tongueState !== 'attached') {
      const previousVy = this.velocity.y;
      this.position.y = bestGroundY;
      this.velocity.y = 0;
      this.isGrounded = true;

      if (!this.wasGrounded) {
        if (previousVy < -4) {
          audio.playLand();
          this.squashStretch.set(1.28, 0.72, 1.28);
          if (this.particles) {
            this.particles.spawnDustPuff(this.position, 6);
          }
          if (camera && previousVy < -16) {
            camera.addTrauma(0.35);
          }
        }

        if (this.jumpBuffer > 0) {
          this.velocity.y = this.jumpForce * 0.95;
          this.isGrounded = false;
          this.jumpBuffer = 0;
          this.coyoteTime = 0;
          audio.playJump(0.5);
          this.squashStretch.set(0.8, 1.35, 0.8);
          if (this.particles) {
            this.particles.spawnDustPuff(this.position, 6);
          }
        }
      }

      if (bestPlatform.onFrogStep) {
        bestPlatform.onFrogStep(dt, this);
      }
    }

    if (this.position.y < -8) {
      this.respawnAtCheckpoint();
    }
  }

  collectCoin() {
    this.coins++;
    if (this.coins % 10 === 0) {
      this.lives++;
      audio.play1Up();
    }
  }

  takeHit(knockbackDir = null) {
    if (this.invulnerableTimer > 0) return false;
    this.lives--;
    audio.playHurt();
    this.invulnerableTimer = 1.6;
    this.tongueState = 'idle';
    if (this.tongueMesh) this.tongueMesh.visible = false;

    if (this.particles) {
      this.particles.spawnSparks(this.position, 8);
    }
    this.squashStretch.set(1.3, 0.7, 1.3);

    if (knockbackDir) {
      this.velocity.x += knockbackDir.x * 6;
      this.velocity.z += knockbackDir.z * 6;
      this.velocity.y = Math.max(this.velocity.y, 4.5);
    }

    if (this.lives <= 0) {
      this.respawnAtCheckpoint();
    }
    return true;
  }

  respawnAtCheckpoint() {
    this.lives--;
    audio.playHurt();
    this.position.copy(this.lastCheckpoint);
    this.prevPosition.copy(this.lastCheckpoint);
    this.velocity.set(0, 0, 0);
    this.invulnerableTimer = 1.8;
    this.tongueState = 'idle';
    if (this.tongueMesh) this.tongueMesh.visible = false;
  }

  setCheckpoint(pos) {
    this.lastCheckpoint.copy(pos);
    audio.playCheckpoint();
    if (this.particles) {
      this.particles.spawnSparks(pos, 15);
      this.particles.spawnShockwave(pos, 0x2ecc71);
    }
  }

  updateAnimation(dt, input, boss = null) {
    this.squashStretch.lerp(new THREE.Vector3(1, 1, 1), dt * 10);
    if (this.modelContainer) {
      this.modelContainer.scale.set(
        this.squashStretch.x,
        this.squashStretch.y,
        this.squashStretch.z
      );
    }
    this.body.scale.set(1.1, 0.85, 1.0);

    const activeBoss = boss || this.currentBoss;
    const isGrabbing = this.isSwingingBoss || (activeBoss && activeBoss.state === 'grabbed');

    // =========================================================================
    // A. ANIMACIÓN DE AGARRE Y GIRO DE JEFE (MARIO VS BOWSER)
    // =========================================================================
    if (isGrabbing && activeBoss) {
      const spinSpeed = activeBoss.spinSpeed || 4.0;
      const speedRatio = Math.min(1.0, spinSpeed / 14.0);

      const targetLeanX = -0.25 - speedRatio * 0.18;
      const targetTiltZ = -0.06 - speedRatio * 0.08;
      this.modelContainer.rotation.x = THREE.MathUtils.lerp(this.modelContainer.rotation.x, targetLeanX, dt * 12);
      this.modelContainer.rotation.z = THREE.MathUtils.lerp(this.modelContainer.rotation.z, targetTiltZ, dt * 12);
      this.modelContainer.position.y = THREE.MathUtils.lerp(this.modelContainer.position.y, 0.50 - speedRatio * 0.08, dt * 12);

      if (this.headGroup) {
        this.headGroup.rotation.set(-targetLeanX * 0.65, 0, 0);
      }

      if (this.mouth) {
        this.mouth.scale.set(1.3, 1.85, 1.25);
        this.mouth.position.set(0, -0.08, 0.55);
      }

      this.cheeks.forEach(c => {
        const s = 1.25 + speedRatio * 0.35;
        c.scale.set(s, s, s);
      });

      this.eyelids.forEach((el, i) => {
        el.rotation.x = -Math.PI / 3.0;
        el.rotation.z = (i === 0) ? -0.35 : 0.35;
      });
      this.pupils.forEach(p => {
        p.scale.set(1.25, 1.25, 1.25);
        p.visible = true;
      });

      if (this.legs.length >= 2) {
        this.legs[0].rotation.x = -0.35 + Math.sin(this.animTime * 4) * 0.12;
        this.legs[1].rotation.x = 0.35 - Math.sin(this.animTime * 4) * 0.12;
      }

      this.arms.forEach(arm => {
        arm.rotation.x = -0.75;
        arm.position.y = -0.08;
      });

      return;
    }

    // =========================================================================
    // B. ANIMACIÓN DE BALANCEO PENDULAR CON CABEZA Y CUERPO SINCRONIZADOS
    // =========================================================================
    if (this.tongueState === 'attached' || this.tongueState === 'shooting') {
      const toAnchor = this.tongueAnchorPos.clone().sub(this.position);
      const localToAnchor = toAnchor.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.facingAngle);
      const horizDist = Math.max(0.2, Math.hypot(localToAnchor.x, localToAnchor.z));

      // Ángulo de elevación hacia el ancla para que la cabeza y el cuerpo apunten a la cuerda
      const elevationAngle = Math.atan2(localToAnchor.y, horizDist);
      const localVel = this.swingVelocity.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.facingAngle);

      // El cuerpo se inclina siguiendo la tensión de la cuerda y la inercia de velocidad
      const bodyPitch = THREE.MathUtils.clamp(-elevationAngle * 0.55 + localVel.z * 0.032, -0.75, 0.65);
      const bodyRoll = THREE.MathUtils.clamp(-localVel.x * 0.038 - localToAnchor.x * 0.06, -0.55, 0.55);

      this.modelContainer.rotation.x = THREE.MathUtils.lerp(this.modelContainer.rotation.x, bodyPitch, dt * 14);
      this.modelContainer.rotation.z = THREE.MathUtils.lerp(this.modelContainer.rotation.z, bodyRoll, dt * 14);
      this.modelContainer.position.y = THREE.MathUtils.lerp(this.modelContainer.position.y, 0.60, dt * 10);

      // La cabeza gira y se eleva mirando directamente al punto de anclaje de la lengua
      if (this.headGroup) {
        const headPitch = THREE.MathUtils.clamp(-elevationAngle * 0.55 - bodyPitch * 0.6, -0.68, 0.45);
        const headYaw = THREE.MathUtils.clamp(Math.atan2(localToAnchor.x, Math.max(0.5, localToAnchor.z)) * 0.65, -0.55, 0.55);
        this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, headPitch, dt * 18);
        this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, headYaw, dt * 18);
        this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, -bodyRoll * 0.5, dt * 18);
      }

      // Boca abierta sosteniendo la lengua elástica
      if (this.mouth) {
        this.mouth.scale.set(1.22, 1.75, 1.2);
        this.mouth.position.set(0, -0.09, 0.54);
      }

      // Patas traseras ondeando con el impulso aerodinámico del columpio
      const swingTrailing = THREE.MathUtils.clamp(-localVel.z * 0.07, -0.85, 0.85);
      this.legs.forEach((leg, i) => {
        leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, -0.55 + swingTrailing + Math.sin(this.animTime * 2 + i) * 0.18, dt * 12);
        leg.scale.set(1, 1, 1);
      });

      this.arms.forEach((arm, i) => {
        arm.rotation.x = -0.65 + swingTrailing * 0.4;
        arm.position.set(i === 0 ? -0.46 : 0.46, -0.14, 0.42);
      });

      return;
    }

    // =========================================================================
    // C. ANIMACIÓN DE PATADA CON LAS PATAS TRASERAS (REAR-LEG KICK PS2)
    // =========================================================================
    if (this.isKicking) {
      const kPct = Math.min(1.0, this.kickTimer / this.kickDuration);
      const snap = Math.sin(kPct * Math.PI);

      // Frogbert se apoya/inclina hacia adelante y lanza una coz potente con ambas patas traseras
      this.modelContainer.rotation.x = THREE.MathUtils.lerp(this.modelContainer.rotation.x, 0.58 * snap, dt * 24);
      this.modelContainer.position.y = 0.60 + snap * 0.18;

      // La cabeza gira ligeramente mirando de reojo hacia atrás a su objetivo
      if (this.headGroup) {
        this.headGroup.rotation.x = -0.35 * snap;
        this.headGroup.rotation.y = 0.38 * snap;
      }

      // Ambas patas traseras se estiran explosivamente hacia atrás con escala de impacto
      this.legs.forEach((leg, i) => {
        leg.rotation.x = 1.68 * snap;
        leg.rotation.z = (i === 0 ? -0.18 : 0.18) * snap;
        const footScale = 1 + snap * 0.38;
        leg.scale.set(footScale, footScale, footScale * 1.12);
      });

      // Brazos extendidos haciendo contrapeso acrobático
      this.arms.forEach((arm, i) => {
        arm.rotation.x = -1.1 * snap;
        arm.position.set(i === 0 ? -0.46 : 0.46, -0.22, 0.45);
      });

      return;
    }

    // =========================================================================
    // D. RETORNO AL ESTADO NORMAL Y LOCOMOCIÓN
    // =========================================================================
    if (this.modelContainer) {
      this.modelContainer.rotation.x = THREE.MathUtils.lerp(this.modelContainer.rotation.x, 0, dt * 10);
      this.modelContainer.rotation.z = THREE.MathUtils.lerp(this.modelContainer.rotation.z, 0, dt * 10);
      this.modelContainer.position.y = THREE.MathUtils.lerp(this.modelContainer.position.y, 0.60, dt * 10);
    }
    if (this.headGroup) {
      this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, 0, dt * 12);
      this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, 0, dt * 12);
      this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, 0, dt * 12);
    }
    if (this.mouth) {
      this.mouth.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 10);
      this.mouth.position.set(0, -0.10, 0.50);
    }
    this.cheeks.forEach(c => c.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 10));
    this.arms.forEach((a, i) => {
      a.rotation.x = -0.2;
      a.position.set(i === 0 ? -0.46 : 0.46, -0.2, 0.4);
    });
    this.legs.forEach(leg => {
      leg.rotation.z = THREE.MathUtils.lerp(leg.rotation.z, 0, dt * 12);
      leg.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 14);
    });
    this.eyelids.forEach(el => {
      el.rotation.z = THREE.MathUtils.lerp(el.rotation.z, 0, dt * 10);
      el.rotation.x = THREE.MathUtils.lerp(el.rotation.x, -Math.PI / 2.8, dt * 10);
    });

    // Parpadeo natural PS2
    const blinkPhase = (this.animTime / 8) % 4.7;
    const blink = blinkPhase > 4.5;
    this.eyes.forEach(eye => { eye.scale.y = blink ? 0.12 : 1; });
    this.eyelids.forEach(el => { el.rotation.x = blink ? 0.25 : -Math.PI / 2.8; });
    this.pupils.forEach(p => {
      p.scale.y = blink ? 0.1 : 1.0;
    });

    if (this.isGrounded) {
      const moving = Math.hypot(this.velocity.x, this.velocity.z) > 0.5;
      if (moving) {
        const hop = Math.abs(Math.sin(this.animTime * 1.5));
        this.body.position.y = hop * 0.25;
        if (this.headGroup) this.headGroup.position.y = 0.15 + hop * 0.22;
        this.legs[0].rotation.x = Math.sin(this.animTime * 1.5) * 0.6;
        this.legs[1].rotation.x = -Math.sin(this.animTime * 1.5) * 0.6;
      } else if (!this.isChargingJump) {
        const breathe = 1 + Math.sin(this.animTime * 0.32) * 0.035;
        this.belly.scale.set(0.92 * breathe, 0.82 / breathe, 0.52 * breathe);
        this.body.position.y = Math.sin(this.animTime * 0.32) * 0.025;
        if (this.headGroup) this.headGroup.position.y = 0.15 + Math.sin(this.animTime * 0.32 - 0.3) * 0.025;
        this.legs.forEach(leg => { leg.rotation.x *= Math.exp(-dt * 9); });
      }
    } else {
      this.legs.forEach((leg, i) => {
        leg.rotation.x = Math.sin(this.animTime * 2 + i) * 0.5 - 0.4;
      });
    }
  }

  updateShadow(platforms) {
    let groundY = -999;
    const checkRadius = 0.55;

    platforms.forEach(p => {
      const box = p.getBounds ? p.getBounds() : (p.box || (p.box = new THREE.Box3().setFromObject(p.mesh)));
      if (
        this.position.x >= box.min.x - checkRadius &&
        this.position.x <= box.max.x + checkRadius &&
        this.position.z >= box.min.z - checkRadius &&
        this.position.z <= box.max.z + checkRadius
      ) {
        if (box.max.y <= this.position.y + 0.15 && box.max.y > groundY) {
          groundY = box.max.y;
        }
      }
    });

    if (groundY > -900) {
      this.shadow.visible = true;
      this.shadow.position.set(this.position.x, groundY + 0.03, this.position.z);
      const heightAbove = Math.max(0, this.position.y - groundY);
      const scale = Math.max(0.4, 1.25 - heightAbove * 0.07);
      this.shadow.scale.set(scale, scale, 1);
    } else {
      this.shadow.visible = false;
    }
  }

  setSleepingPose(sleeping) {
    if (sleeping) {
      this.modelContainer.rotation.z = Math.PI * 0.42;
      this.modelContainer.rotation.x = -Math.PI * 0.12;
      this.modelContainer.position.y = 0.28;
      this.eyelids.forEach(el => {
        el.rotation.x = 0;
      });
      this.pupils.forEach(p => { p.visible = false; });
    } else {
      this.modelContainer.rotation.z = 0;
      this.modelContainer.rotation.x = 0;
      this.modelContainer.position.y = 0.60;
      this.eyelids.forEach(el => {
        el.rotation.x = -Math.PI / 2.8;
      });
      this.pupils.forEach(p => { p.visible = true; });
    }
  }

  setAngryPose(angry) {
    if (angry) {
      this.eyelids.forEach((el, i) => {
        el.rotation.x = -Math.PI / 3.2;
        el.rotation.z = (i === 0) ? -0.35 : 0.35;
      });
      this.cheeks.forEach(c => c.scale.set(1.4, 1.4, 1.4));
      this.modelContainer.scale.set(1.05, 1.15, 1.05);
    } else {
      this.eyelids.forEach(el => {
        el.rotation.z = 0;
        el.rotation.x = -Math.PI / 2.8;
      });
      this.cheeks.forEach(c => c.scale.set(1, 1, 1));
      this.modelContainer.scale.set(1, 1, 1);
    }
  }
}
