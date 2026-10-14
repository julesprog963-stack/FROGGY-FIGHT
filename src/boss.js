import * as THREE from 'three';
import { Textures } from './textures.js';
import { audio } from './audio.js';

// Mina explosiva con púas perimetral estilo Mario vs Bowser 64
export class SpikeMine {
  constructor(scene, position, particles = null) {
    this.scene = scene;
    this.particles = particles;
    this.position = position.clone();
    this.initialY = position.y;
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    this.active = true;
    this.respawnTimer = 0;
    this.timer = Math.random() * Math.PI * 2;

    this.beaconMat = null;
    this.buildModel();
    this.scene.add(this.mesh);
  }

  buildModel() {
    const mineMat = new THREE.MeshLambertMaterial({
      map: Textures.createHazardMetal(),
      color: 0x2c3e50,
      flatShading: true
    });
    const spikeMat = new THREE.MeshLambertMaterial({
      color: 0x7f8c8d,
      flatShading: true
    });
    this.beaconMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c });

    // Esfera central con blindaje
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 0), mineMat);
    this.mesh.add(body);

    // 8 Púas metálicas radiales
    const spikeGeo = new THREE.ConeGeometry(0.24, 0.75, 6);
    const spikeDirs = [
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0.7, 0, 0.7), new THREE.Vector3(-0.7, 0, -0.7)
    ];

    spikeDirs.forEach(dir => {
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.copy(dir.clone().multiplyScalar(0.95));
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      this.mesh.add(spike);
    });

    // Baliza de advertencia roja parpadeante
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), this.beaconMat);
    this.mesh.add(beacon);

    // Luz roja
    this.light = new THREE.PointLight(0xe74c3c, 2.0, 8);
    this.mesh.add(this.light);
  }

  explode() {
    if (!this.active) return;
    this.active = false;
    this.mesh.visible = false;
    this.respawnTimer = 7.0; // Reaparece en 7s si la pelea continúa

    audio.playExplosion();

    if (this.particles) {
      this.particles.spawnShockwave(this.position, 0xff3838);
      this.particles.spawnDustPuff(this.position, 35, 0x111111);
      this.particles.spawnSparks(this.position, 30);
    }
  }

  update(dt) {
    this.timer += dt;

    if (!this.active) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.active = true;
        this.mesh.visible = true;
        if (this.particles) {
          this.particles.spawnDustPuff(this.position, 12, 0xe74c3c);
        }
      }
      return;
    }

    // Flotación suave y parpadeo de alarma
    this.mesh.position.y = this.initialY + Math.sin(this.timer * 3.0) * 0.22;
    this.mesh.rotation.y += dt * 0.8;
    this.mesh.rotation.x = Math.sin(this.timer * 2.0) * 0.15;

    const flash = Math.sin(this.timer * 8.0) > 0;
    this.beaconMat.color.setHex(flash ? 0xff4757 : 0x7f1d1d);
    this.light.intensity = flash ? 3.0 : 0.8;
  }
}

// ONDA EXPANSIVA CIRCULAR ANIMADA ESTILO SUPER MARIO 64 / BOWSER
export class BossShockwave {
  constructor(scene, center, maxRadius = 12.0, duration = 1.15, color = 0xff4757) {
    this.scene = scene;
    this.center = center.clone();
    this.maxRadius = maxRadius;
    this.duration = duration;
    this.time = 0;
    this.active = true;
    this.currentRadius = 0.2;
    this.hitPlayer = false;

    this.mesh = new THREE.Group();
    this.mesh.position.set(this.center.x, this.center.y + 0.08, this.center.z);

    // 1. Anillo plano principal brillante a ras de suelo
    const ringGeo = new THREE.RingGeometry(0.8, 1.0, 32);
    ringGeo.rotateX(-Math.PI / 2);
    this.mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.ringMesh = new THREE.Mesh(ringGeo, this.mat);
    this.mesh.add(this.ringMesh);

    // 2. Halo interno dorado/amarillo
    const innerGeo = new THREE.RingGeometry(0.01, 0.8, 32);
    innerGeo.rotateX(-Math.PI / 2);
    this.innerMat = new THREE.MeshBasicMaterial({
      color: 0xf1c40f,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.innerMesh = new THREE.Mesh(innerGeo, this.innerMat);
    this.mesh.add(this.innerMesh);

    // 3. Cresta vertical 3D visible desde cualquier ángulo de cámara
    const crestGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.45, 32, 1, true);
    this.crestMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.crestMesh = new THREE.Mesh(crestGeo, this.crestMat);
    this.crestMesh.position.y = 0.22;
    this.mesh.add(this.crestMesh);

    this.scene.add(this.mesh);
  }

  update(dt, frog = null) {
    if (!this.active) return;
    this.time += dt;
    const progress = Math.min(this.time / this.duration, 1.0);

    // Expansión radial no-lineal suave (rápido al inicio, constante luego)
    this.currentRadius = Math.max(0.2, Math.sqrt(progress) * this.maxRadius);

    this.mesh.scale.set(this.currentRadius, 1.0, this.currentRadius);
    this.mat.opacity = Math.max(0, (1 - progress * progress) * 0.95);
    this.innerMat.opacity = Math.max(0, (1 - progress) * 0.35);
    this.crestMat.opacity = Math.max(0, (1 - progress) * 0.75);

    // Comprobación de impacto con Frogbert:
    // Si la onda alcanza a Frogbert mientras está en el suelo, recibe daño.
    // Si Frogbert salta por encima (no está grounded y su Y supera la onda), ¡la esquiva limpiamente!
    if (frog && !this.hitPlayer && progress < 0.95) {
      const playerDist = Math.hypot(frog.position.x - this.center.x, frog.position.z - this.center.z);
      const ringThickness = 1.35;
      if (Math.abs(playerDist - this.currentRadius) < ringThickness) {
        const isGrounded = frog.isGrounded || (frog.position.y < this.center.y + 0.85);
        if (isGrounded && frog.invulnerableTimer <= 0) {
          this.hitPlayer = true;
          frog.respawnAtCheckpoint();
        }
      }
    }

    if (progress >= 1.0) {
      this.dispose();
    }
  }

  dispose() {
    this.active = false;
    if (this.mesh && this.mesh.parent) {
      this.scene.remove(this.mesh);
      this.mesh.traverse(child => {
        if (child.geometry) child.geometry.dispose?.();
        if (child.material) child.material.dispose?.();
      });
    }
  }
}

// JEFE TALABOT TITÁN - PELEA ESTILO SUPER MARIO 64 (MARIO VS BOWSER)
export class BossTalabotTitan {
  constructor(scene, arenaCenter = new THREE.Vector3(0, 38.8, 0), particles = null) {
    this.scene = scene;
    this.particles = particles;
    this.arenaCenter = arenaCenter.clone();
    this.position = arenaCenter.clone();
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // Radio de la plataforma superior de la arena
    this.arenaRadius = 8.5;

    // Ondas de choque activas
    this.shockwaves = [];
    this.stompImpactTriggered = false;
    this.ascentPhase = 'boost_up';

    // Estado de combate
    this.maxHp = 3;
    this.hp = 3;
    this.phase = 1; // 1 | 2 | 3
    this.state = 'idle'; // 'dormant' | 'idle' | 'walk' | 'stomp' | 'charge' | 'dizzy' | 'grabbed' | 'thrown' | 'falling' | 'ascending' | 'damaged' | 'defeated'
    this.timer = 0;
    this.subTimer = 0;
    this.velocity = new THREE.Vector3();

    // Mecánica Mario vs Bowser: Agarre, Giro y Lanzamiento
    this.isGrabbed = false;
    this.spinAngle = 0;
    this.spinSpeed = 0; // rad/s
    this.minSpinToThrow = 5.5;
    this.spinSoundTimer = 0;
    this.throwVelocity = new THREE.Vector3();
    this.tailHandlePos = new THREE.Vector3();
    this.weakSpotPos = new THREE.Vector3(); // Para compatibilidad con lengua

    // Elementos visuales del modelo
    this.bodyMesh = null;
    this.sirenMesh = null;
    this.sirenMat = null;
    this.screenMesh = null;
    this.leftEye = null;
    this.rightEye = null;
    this.tailHandleMesh = null;
    this.leftSaw = null;
    this.rightSaw = null;
    this.trajectoryArrow = null;

    // 6 Minas explosivas perimetrales
    this.mines = [];
    this.buildMines();

    this.createModel();
    this.createTrajectoryArrow();
    this.scene.add(this.mesh);
  }

  buildMines() {
    const mineRadius = 10.6;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const pos = new THREE.Vector3(
        this.arenaCenter.x + Math.cos(angle) * mineRadius,
        this.arenaCenter.y + 1.2,
        this.arenaCenter.z + Math.sin(angle) * mineRadius
      );
      const mine = new SpikeMine(this.scene, pos, this.particles);
      this.mines.push(mine);
    }
  }

  createTrajectoryArrow() {
    // Flecha indicadora de lanzamiento proyectada en el suelo
    const arrowGroup = new THREE.Group();
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.85 });

    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 4.0), arrowMat);
    shaft.position.set(0, 0.05, 2.0);
    arrowGroup.add(shaft);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.4, 3), arrowMat);
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 0.05, 4.4);
    arrowGroup.add(head);

    arrowGroup.visible = false;
    this.scene.add(arrowGroup);
    this.trajectoryArrow = arrowGroup;
  }

  createModel() {
    const metalMat = new THREE.MeshLambertMaterial({
      map: Textures.createHazardMetal(),
      color: 0x95a5a6,
      flatShading: true
    });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x1e272e, flatShading: true });
    const sawMat = new THREE.MeshLambertMaterial({ color: 0xdfe6e9, flatShading: true });

    // 1. Orugas mecánicas blindadas
    [-1.4, 1.4].forEach(x => {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.1, 3.6), darkMat);
      tread.position.set(x, 0.55, 0);
      this.mesh.add(tread);

      // Ruedas de oruga
      [-1.2, 0, 1.2].forEach(z => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.0, 8), metalMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.5, z);
        this.mesh.add(wheel);
      });
    });

    // 2. Chasis Principal Angular Pesado
    const chassisGeo = new THREE.BoxGeometry(2.8, 1.8, 2.8);
    this.bodyMesh = new THREE.Mesh(chassisGeo, metalMat);
    this.bodyMesh.position.set(0, 1.6, 0);
    this.mesh.add(this.bodyMesh);

    // 3. Pantalla CRT con visores ópticos rojos
    const screenGeo = new THREE.BoxGeometry(1.8, 0.95, 0.2);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.screenMesh.position.set(0, 1.85, 1.42);
    this.mesh.add(this.screenMesh);

    const eyeGeo = new THREE.BoxGeometry(0.42, 0.16, 0.08);
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3838 });
    this.leftEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.leftEye.position.set(-0.45, 1.9, 1.52);
    this.leftEye.rotation.z = -0.35;
    this.mesh.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.rightEye.position.set(0.45, 1.9, 1.52);
    this.rightEye.rotation.z = 0.35;
    this.mesh.add(this.rightEye);

    // 4. Sirena de alarma giratoria
    const sirenGeo = new THREE.CylinderGeometry(0.25, 0.32, 0.45, 8);
    this.sirenMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    this.sirenMesh = new THREE.Mesh(sirenGeo, this.sirenMat);
    this.sirenMesh.position.set(0, 2.7, 0.6);
    this.mesh.add(this.sirenMesh);

    // 5. Chimeneas dobles de escape con humo
    [-0.8, 0.8].forEach(x => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 1.6, 6), darkMat);
      pipe.position.set(x, 2.9, -0.8);
      pipe.rotation.x = -0.3;
      this.mesh.add(pipe);
    });

    // 6. Brazos mecánicos con sierras circulares gigantes
    [-1.85, 1.85].forEach((x, idx) => {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), darkMat);
      shoulder.position.set(x, 1.7, 0.3);
      this.mesh.add(shoulder);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 1.4), metalMat);
      arm.position.set(x, 1.6, 1.1);
      this.mesh.add(arm);

      // Sierra circular
      const sawGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.08, 16);
      const saw = new THREE.Mesh(sawGeo, sawMat);
      saw.rotation.z = Math.PI / 2;
      saw.position.set(x > 0 ? x + 0.3 : x - 0.3, 1.5, 1.8);
      this.mesh.add(saw);

      if (idx === 0) this.leftSaw = saw;
      else this.rightSaw = saw;
    });

    // 7. LA COLA / MANIJA TRASERA MECÁNICA (ESTILO COLA DE BOWSER)
    // Frogbert la engancha con la lengua para levantarlo y girarlo
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 1.3, -1.6);

    const tailSocket = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.4), darkMat);
    tailGroup.add(tailSocket);

    // Asa / Aro de agarre luminoso amarillo/naranja
    const ringGeo = new THREE.TorusGeometry(0.48, 0.12, 8, 16);
    this.tailHandleMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    this.tailHandleMesh = new THREE.Mesh(ringGeo, this.tailHandleMat);
    this.tailHandleMesh.position.set(0, 0, -0.45);
    tailGroup.add(this.tailHandleMesh);

    this.mesh.add(tailGroup);
  }

  // Compatibilidad con Player y HUD
  get isVulnerable() {
    return this.state === 'dizzy';
  }

  update(dt, frog, camera = null, input = null) {
    if (this.state === 'defeated') return;

    this.timer += dt;
    this.subTimer += dt;

    // Actualizar ondas de choque activas
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      this.shockwaves[i].update(dt, frog);
      if (!this.shockwaves[i].active) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Actualizar minas perimetrales
    this.mines.forEach(m => m.update(dt));

    // Giro de sierras mecánicas
    if (this.leftSaw) this.leftSaw.rotation.x += dt * 22;
    if (this.rightSaw) this.rightSaw.rotation.x -= dt * 22;

    // Giro de sirena
    if (this.sirenMesh) {
      this.sirenMesh.rotation.y += dt * 8;
      const flash = Math.sin(this.timer * 14) > 0;
      this.sirenMat.color.setHex(flash ? 0xff4757 : 0x7f1d1d);
    }

    // Actualizar posición de la manija trasera en el espacio global
    this.mesh.localToWorld(this.tailHandlePos.set(0, 1.3, -2.1));
    this.weakSpotPos.copy(this.tailHandlePos);

    // MÁQUINA DE ESTADOS DE COMBATE (ESTILO BOWSER)
    if (this.state === 'idle') {
      this.updateIdle(dt, frog);
    } else if (this.state === 'walk') {
      this.updateWalk(dt, frog);
    } else if (this.state === 'stomp') {
      this.updateStomp(dt, frog, camera);
    } else if (this.state === 'charge') {
      this.updateCharge(dt, frog, camera);
    } else if (this.state === 'dizzy') {
      this.updateDizzy(dt, frog);
    } else if (this.state === 'grabbed') {
      this.updateGrabbed(dt, frog, input, camera);
    } else if (this.state === 'thrown') {
      this.updateThrown(dt, frog, camera);
    } else if (this.state === 'falling') {
      this.updateFalling(dt, frog, camera);
    } else if (this.state === 'ascending') {
      this.updateAscending(dt, frog, camera);
    } else if (this.state === 'damaged') {
      this.updateDamaged(dt);
    }

    // Comprobación de agarre con la lengua si el jefe está aturdido (dizzy)
    if (this.state === 'dizzy' && frog && frog.tongueState === 'attached_boss') {
      this.startGrab(frog);
    }
  }

  spawnShockwaveRing(pos, color = 0xff3838) {
    const wave = new BossShockwave(this.scene, pos, 13.0, 1.25, color);
    this.shockwaves.push(wave);
  }

  updateIdle(dt, frog) {
    if (this.subTimer > 1.2) {
      this.subTimer = 0;
      const dist = this.mesh.position.distanceTo(frog.position);
      if (this.phase >= 2 && Math.random() < 0.45) {
        this.state = 'stomp';
      } else if (dist > 5.0 || Math.random() < 0.6) {
        this.state = 'charge';
      } else {
        this.state = 'walk';
      }
    }
  }

  updateWalk(dt, frog) {
    // Giro lento encarando a Frogbert con pasos pesados
    const toFrog = frog.position.clone().sub(this.mesh.position).setY(0);
    const angle = Math.atan2(toFrog.x, toFrog.z);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, angle, dt * 2.8);

    const speed = 2.4 + (this.phase - 1) * 1.2;
    this.mesh.translateZ(speed * dt);

    // Limitar dentro de la arena o caer si excede perímetro
    const distCenter = Math.hypot(this.mesh.position.x - this.arenaCenter.x, this.mesh.position.z - this.arenaCenter.z);
    if (distCenter > 8.8) {
      this.startFalling();
      return;
    } else if (distCenter > 7.5) {
      this.mesh.position.x = this.arenaCenter.x + (this.mesh.position.x - this.arenaCenter.x) * (7.5 / distCenter);
      this.mesh.position.z = this.arenaCenter.z + (this.mesh.position.z - this.arenaCenter.z) * (7.5 / distCenter);
    }

    // Daño por contacto si embiste a Frogbert
    if (this.mesh.position.distanceTo(frog.position) < 2.0 && frog.invulnerableTimer <= 0) {
      frog.respawnAtCheckpoint();
    }

    if (this.subTimer > 3.0) {
      this.subTimer = 0;
      this.state = (Math.random() < 0.5) ? 'charge' : 'stomp';
    }
  }

  updateStomp(dt, frog, camera) {
    // Salto y pisotón con animación de onda expansiva estilo Mario vs Bowser
    if (this.subTimer < 0.35) {
      // 1. Anticipación: agacharse comprimiéndose y soltando humo de escape
      const crouch = Math.sin((this.subTimer / 0.35) * Math.PI) * 0.35;
      this.mesh.scale.set(1 + crouch * 0.2, 1 - crouch, 1 + crouch * 0.2);
      this.mesh.position.y = this.arenaCenter.y - crouch * 0.2;
      if (this.particles && Math.random() < 0.4) {
        this.particles.spawnDustPuff(this.mesh.position, 2, 0x444444);
      }
    } else if (this.subTimer < 0.85) {
      // 2. Salto propulsado hacia arriba
      const leapProgress = (this.subTimer - 0.35) / 0.5;
      this.mesh.scale.set(1, 1, 1);
      this.mesh.position.y = this.arenaCenter.y + Math.sin(leapProgress * Math.PI * 0.5) * 4.8;
      this.mesh.rotation.x = -Math.sin(leapProgress * Math.PI) * 0.25;

      if (this.particles && Math.random() < 0.5) {
        this.particles.spawnDustPuff(this.mesh.position.clone().add(new THREE.Vector3(0, -0.5, 0)), 3, 0x111111);
      }
    } else if (this.subTimer < 1.05) {
      // 3. Suspensión en el punto más alto
      this.mesh.position.y = this.arenaCenter.y + 4.8;
      this.mesh.rotation.x = 0;
      if (this.sirenMat) this.sirenMat.color.setHex(0xff0000);
    } else if (this.subTimer < 1.25) {
      // 4. ¡CAÍDA EN PICADA Y PISOTÓN SÍSMICO!
      this.mesh.position.y = this.arenaCenter.y;
      this.mesh.scale.set(1.25, 0.75, 1.25); // Squash de impacto cómico

      if (!this.stompImpactTriggered) {
        this.stompImpactTriggered = true;
        audio.playShockwaveSlam();
        if (camera) camera.addTrauma(0.75);

        // ¡Animación de Onda Expansiva en el suelo!
        this.spawnShockwaveRing(this.mesh.position, 0xff3838);

        // En fase 2 o 3, generar una segunda onda rápida consecutiva
        if (this.phase >= 2) {
          setTimeout(() => {
            if (this.state !== 'defeated') {
              this.spawnShockwaveRing(this.mesh.position, 0xf1c40f);
            }
          }, 240);
        }

        if (this.particles) {
          this.particles.spawnDustPuff(this.mesh.position, 28, 0xe74c3c);
          this.particles.spawnSparks(this.mesh.position, 25);
        }
      }
    } else if (this.subTimer < 1.6) {
      // 5. Recuperación tras el impacto
      const recProgress = (this.subTimer - 1.25) / 0.35;
      this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), recProgress);
    } else {
      this.mesh.scale.set(1, 1, 1);
      this.stompImpactTriggered = false;
      this.state = 'idle';
      this.subTimer = 0;
    }
  }

  updateCharge(dt, frog, camera) {
    // Embestida rápida en línea recta estilo Bowser
    if (this.subTimer < 0.75) {
      // Anticipación: humo de escape y encarar
      const toFrog = frog.position.clone().sub(this.mesh.position).setY(0);
      this.mesh.rotation.y = Math.atan2(toFrog.x, toFrog.z);
      if (this.particles && Math.random() < 0.4) {
        this.particles.spawnDustPuff(this.mesh.position.clone().add(new THREE.Vector3(0, 2.5, -1)), 3, 0x111111);
      }
    } else if (this.subTimer < 3.2) {
      // ¡Carrera de choque a gran velocidad!
      const chargeSpeed = 9.5 + (this.phase - 1) * 2.5;
      this.mesh.translateZ(chargeSpeed * dt);

      if (camera) camera.addTrauma(0.04);

      // Si atropella a Frogbert
      if (this.mesh.position.distanceTo(frog.position) < 2.2 && frog.invulnerableTimer <= 0) {
        frog.respawnAtCheckpoint();
      }

      // Si llega al borde de la arena: ¡Frena, derrapa y se marea!
      const distCenter = Math.hypot(this.mesh.position.x - this.arenaCenter.x, this.mesh.position.z - this.arenaCenter.z);
      if (distCenter > 8.8) {
        this.startFalling();
        return;
      } else if (distCenter >= 7.8) {
        this.mesh.position.x = this.arenaCenter.x + (this.mesh.position.x - this.arenaCenter.x) * (7.5 / distCenter);
        this.mesh.position.z = this.arenaCenter.z + (this.mesh.position.z - this.arenaCenter.z) * (7.5 / distCenter);
        this.startDizzy();
        return;
      }
    } else {
      this.startDizzy();
    }
  }

  startDizzy() {
    this.state = 'dizzy';
    this.subTimer = 0;

    // Ojos en espiral / aturdido
    if (this.leftEye) this.leftEye.rotation.z = Math.PI / 4;
    if (this.rightEye) this.rightEye.rotation.z = -Math.PI / 4;

    // La manija trasera parpadea intensamente en verde/amarillo para indicar que se puede agarrar
    this.tailHandleMat.color.setHex(0x2ecc71);

    if (this.particles) {
      this.particles.spawnDustPuff(this.tailHandlePos, 10, 0x2ecc71);
    }
  }

  updateDizzy(dt, frog) {
    // Si por alguna razón el robot está fuera de la plataforma durante mareo:
    const distCenter = Math.hypot(this.mesh.position.x - this.arenaCenter.x, this.mesh.position.z - this.arenaCenter.z);
    if (distCenter > 8.8) {
      this.startFalling();
      return;
    }

    // El robot se inclina jadeando / expulsando vapor durante 4 segundos
    this.mesh.rotation.x = Math.sin(this.subTimer * 4.0) * 0.12;

    const flash = Math.sin(this.subTimer * 12) > 0;
    this.tailHandleMat.color.setHex(flash ? 0x2ecc71 : 0xf1c40f);

    if (this.particles && Math.random() < 0.3) {
      this.particles.spawnDustPuff(this.tailHandlePos, 2, 0xffffff);
    }

    // Detección directa por proximidad de Frogbert a la manija trasera
    const distToHandle = frog.position.distanceTo(this.tailHandlePos);
    if (distToHandle < 2.4) {
      // Frogbert está pegado a la cola
      this.startGrab(frog);
      return;
    }

    // Se recupera del mareo si pasa el tiempo
    if (this.subTimer > 4.2) {
      this.recoverFromDizzy();
    }
  }

  recoverFromDizzy() {
    this.state = 'idle';
    this.subTimer = 0;
    this.mesh.rotation.x = 0;
    this.tailHandleMat.color.setHex(0xf1c40f);
    if (this.leftEye) this.leftEye.rotation.z = -0.35;
    if (this.rightEye) this.rightEye.rotation.z = 0.35;
  }

  startGrab(frog) {
    this.state = 'grabbed';
    this.isGrabbed = true;
    this.subTimer = 0;
    this.spinAngle = frog ? (frog.facingAngle || 0) : 0;
    this.spinSpeed = 4.0; // Velocidad de giro inicial

    if (frog && frog.onBossGrabbed) {
      frog.onBossGrabbed(this);
    }

    audio.playTongueShoot();

    if (this.trajectoryArrow) {
      this.trajectoryArrow.visible = true;
    }
  }

  updateGrabbed(dt, frog, input, camera) {
    // Frogbert sostiene al robot gigante por la cola y lo gira centrífugamente
    if (input) {
      // Control de giro con A/D o ratón
      if (input.keys.left) this.spinSpeed += dt * 7.0;
      if (input.keys.right) this.spinSpeed += dt * 7.0;
      if (Math.abs(input.mouse.deltaX) > 2) this.spinSpeed += Math.abs(input.mouse.deltaX) * 0.05;
    }

    // Aceleración suave constante
    this.spinSpeed = Math.min(this.spinSpeed + dt * 2.5, 14.0);
    this.spinAngle += this.spinSpeed * dt;

    // SFX: Zumbido de giro continuo
    this.spinSoundTimer += dt;
    const interval = Math.max(0.1, 0.45 - (this.spinSpeed / 14) * 0.35);
    if (this.spinSoundTimer > interval) {
      this.spinSoundTimer = 0;
      audio.playSpinWhoosh(0.8 + (this.spinSpeed / 14) * 0.8);
    }

    // Posición orbitando a Frogbert a 3.6 metros
    const orbitDist = 3.6;
    const frogPos = frog ? frog.position : this.arenaCenter;
    const bossX = frogPos.x + Math.sin(this.spinAngle) * orbitDist;
    const bossZ = frogPos.z + Math.cos(this.spinAngle) * orbitDist;

    this.mesh.position.set(bossX, this.arenaCenter.y + 0.8, bossZ);
    // Orientación: la manija trasera (z=-2.1) apunta hacia Frogbert y el frente hacia afuera,
    // con un arrastre angular centrífugo de inercia
    const dragAngle = 0.22 * (this.spinSpeed / 14.0);
    this.mesh.rotation.y = this.spinAngle + dragAngle;
    this.mesh.rotation.z = Math.sin(this.spinAngle * 2) * 0.2; // Inclinación centrífuga

    // Actualizar coordenadas globales de la manija de la cola inmediatamente
    this.mesh.localToWorld(this.tailHandlePos.set(0, 1.3, -2.1));
    this.weakSpotPos.copy(this.tailHandlePos);

    // Chispas y fricción centrífuga en las orugas
    if (this.particles && Math.random() < 0.4) {
      this.particles.spawnSparks(this.tailHandlePos, 2);
    }

    // Actualizar flecha de trayectoria en el suelo
    if (this.trajectoryArrow) {
      const throwDirAngle = this.spinAngle + Math.PI / 2;
      this.trajectoryArrow.position.set(frogPos.x, this.arenaCenter.y + 0.1, frogPos.z);
      this.trajectoryArrow.rotation.y = throwDirAngle;
    }

    // Lanzar al pulsar ESPACIO, Clic o tras tiempo máximo
    const wantsThrow = (input && (input.keys.jumpPressed || input.keys.actionPressed)) || (this.subTimer > 6.0);
    if (wantsThrow && this.subTimer > 0.4) {
      this.throwBoss(frog, camera);
    }
  }

  throwBoss(frog, camera) {
    this.state = 'thrown';
    this.isGrabbed = false;
    this.subTimer = 0;

    if (frog && frog.onBossReleased) {
      frog.onBossReleased(this, this.throwVelocity);
    }

    if (this.trajectoryArrow) {
      this.trajectoryArrow.visible = false;
    }

    // Vector de lanzamiento tangencial al giro
    const throwDirAngle = this.spinAngle + Math.PI / 2;
    const throwPower = 18.0 + (this.spinSpeed / 14.0) * 12.0;

    this.throwVelocity.set(
      Math.sin(throwDirAngle) * throwPower,
      2.5,
      Math.cos(throwDirAngle) * throwPower
    );

    audio.playThrow();

    if (camera) camera.addTrauma(0.4);
    if (this.particles) {
      this.particles.spawnShockwave(this.mesh.position, 0x2ecc71);
      this.particles.spawnSparks(this.mesh.position, 15);
    }
  }

  updateThrown(dt, frog, camera) {
    // Vuelo parabólico por los aires
    this.mesh.position.add(this.throwVelocity.clone().multiplyScalar(dt));
    this.throwVelocity.y -= 14.0 * dt; // Gravedad
    this.mesh.rotation.y += dt * 14; // Giros en el aire
    this.mesh.rotation.x += dt * 4;

    // 1. COLISIÓN CON LAS MINAS CON PÚAS PERIMETRALES (OBJETIVO PRINCIPAL)
    for (let mine of this.mines) {
      if (!mine.active) continue;
      const dist = this.mesh.position.distanceTo(mine.position);
      if (dist < 2.5) {
        // ¡IMPACTO DIRECTO CONTRA LA MINA!
        mine.explode();
        this.takeHit(camera);
        return;
      }
    }

    // 2. Si desciende al nivel de la plataforma:
    if (this.mesh.position.y <= this.arenaCenter.y) {
      const distCenter = Math.hypot(
        this.mesh.position.x - this.arenaCenter.x,
        this.mesh.position.z - this.arenaCenter.z
      );

      // Si cayó DENTRO de la plataforma circular (radio <= 8.5):
      if (distCenter <= this.arenaRadius) {
        this.mesh.position.y = this.arenaCenter.y;
        this.mesh.rotation.x = 0;
        this.mesh.rotation.z = 0;
        audio.playLand();

        if (camera) camera.addTrauma(0.35);
        if (this.particles) {
          this.particles.spawnDustPuff(this.mesh.position, 20);
        }

        // Derrapa y regresa al centro
        this.state = 'walk';
        this.subTimer = 0;
        this.recoverFromDizzy();
      } else {
        // ¡SE CAYÓ FUERA DE LA PLATAFORMA HACIA EL VACÍO!
        // No aterriza en el aire; entra en caída libre hacia el abismo
        this.startFalling();
      }
    }
  }

  startFalling() {
    this.state = 'falling';
    this.subTimer = 0;
    // Mantiene inercia horizontal reducida pero acelera fuertemente hacia abajo
    this.throwVelocity.x *= 0.35;
    this.throwVelocity.z *= 0.35;
    this.throwVelocity.y = Math.min(this.throwVelocity.y, -4.0);
  }

  updateFalling(dt, frog, camera) {
    // Caída libre acelerada hacia el abismo de la selva
    this.throwVelocity.y -= 22.0 * dt;
    this.mesh.position.add(this.throwVelocity.clone().multiplyScalar(dt));

    // Giro descontrolado / cómico cayendo al vacío
    this.mesh.rotation.x += dt * 6.0;
    this.mesh.rotation.z += dt * 4.5;
    this.mesh.rotation.y += dt * 8.0;

    // Chispas de alarma y pánico
    if (this.particles && Math.random() < 0.6) {
      this.particles.spawnSparks(this.mesh.position, 4);
      this.particles.spawnDustPuff(this.mesh.position, 2, 0x111111);
    }

    // Cuando cae lo suficiente (18 metros bajo la plataforma) o tras 1.3 segundos
    if (this.mesh.position.y <= this.arenaCenter.y - 18.0 || this.subTimer > 1.3) {
      this.startAscending();
    }
  }

  startAscending() {
    this.state = 'ascending';
    this.subTimer = 0;
    this.ascentPhase = 'boost_up';
    audio.playRocketBoost();

    // Reorientar verticalmente
    this.mesh.rotation.set(0, 0, 0);

    // Luces de emergencia a tope
    if (this.sirenMat) this.sirenMat.color.setHex(0xff0000);
  }

  updateAscending(dt, frog, camera) {
    // Estabilización vertical
    this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, dt * 8.0);
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, dt * 8.0);

    // Efecto continuo de propulsores cohete (fuego, humo y chispas bajo las orugas)
    if (this.particles) {
      [-1.4, 1.4].forEach(x => {
        const jetPos = this.mesh.position.clone().add(new THREE.Vector3(x, 0.2, 0));
        if (Math.random() < 0.8) {
          this.particles.spawnDustPuff(jetPos, 2, 0xe67e22); // Fuego naranja
          this.particles.spawnSparks(jetPos, 3); // Chispas amarillas
        }
      });
    }

    if (this.ascentPhase === 'boost_up') {
      // 1. Ascenso vertical veloz con propulsores desde abajo de la copa
      const boostSpeed = 24.0;
      this.mesh.position.y += boostSpeed * dt;

      // Guiado hacia el centro mientras sube
      this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, this.arenaCenter.x, dt * 1.5);
      this.mesh.position.z = THREE.MathUtils.lerp(this.mesh.position.z, this.arenaCenter.z, dt * 1.5);

      // Una vez que supera la plataforma con margen seguro (altura + 6.5 metros):
      if (this.mesh.position.y >= this.arenaCenter.y + 6.5) {
        this.ascentPhase = 'fly_to_center';
        this.subTimer = 0;
      }
    } else if (this.ascentPhase === 'fly_to_center') {
      // 2. Vuelo propulsado hacia el centro de la arena mientras planea arriba
      this.mesh.position.y = this.arenaCenter.y + 6.5 + Math.sin(this.subTimer * 8.0) * 0.3;

      const toCenter = new THREE.Vector2(
        this.arenaCenter.x - this.mesh.position.x,
        this.arenaCenter.z - this.mesh.position.z
      );
      const dist = toCenter.length();

      // Encarar al jugador
      if (frog) {
        const toFrog = frog.position.clone().sub(this.mesh.position).setY(0);
        this.mesh.rotation.y = Math.atan2(toFrog.x, toFrog.z);
      }

      // Desplazamiento horizontal rápido
      const flySpeed = Math.min(dist * 5.0, 16.0);
      if (dist > 0.05) {
        toCenter.normalize();
        this.mesh.position.x += toCenter.x * flySpeed * dt;
        this.mesh.position.z += toCenter.y * flySpeed * dt;
      }

      // Si ya está casi alineado con el centro de la arena (o timeout):
      if (dist < 0.8 || this.subTimer > 1.2) {
        this.ascentPhase = 'slam_land';
        this.subTimer = 0;
      }
    } else if (this.ascentPhase === 'slam_land') {
      // 3. ¡Corte de motores y caída destructiva en picada al centro!
      const dropSpeed = 30.0;
      this.mesh.position.y -= dropSpeed * dt;

      if (this.mesh.position.y <= this.arenaCenter.y) {
        // ¡Impacto contra el centro de la plataforma!
        this.mesh.position.set(this.arenaCenter.x, this.arenaCenter.y, this.arenaCenter.z);
        this.mesh.rotation.set(0, this.mesh.rotation.y, 0);

        audio.playShockwaveSlam();
        if (camera) camera.addTrauma(0.75);

        // Onda expansiva de aterrizaje y nube de polvo masiva
        this.spawnShockwaveRing(this.mesh.position, 0xf39c12);
        if (this.particles) {
          this.particles.spawnDustPuff(this.mesh.position, 35, 0xe74c3c);
          this.particles.spawnSparks(this.mesh.position, 30);
        }

        // Se recupera y vuelve a combate normal
        this.recoverFromDizzy();
        this.state = 'idle';
        this.subTimer = 0;
      }
    }
  }

  takeHit(camera = null) {
    this.hp--;
    audio.playBossHit();

    if (camera) camera.addTrauma(0.8);

    if (this.particles) {
      this.particles.spawnShockwave(this.mesh.position, 0xf1c40f);
      this.particles.spawnSparks(this.mesh.position, 35);
      this.particles.spawnDustPuff(this.mesh.position, 30, 0xe74c3c);
    }

    if (this.hp <= 0) {
      this.defeat();
      return;
    }

    // Transición de fase y recuperación
    this.phase = 4 - this.hp;
    this.state = 'damaged';
    this.subTimer = 0;
  }

  updateDamaged(dt) {
    // Tiembla con chispas de daño estructural
    this.mesh.rotation.y += dt * 6;
    this.mesh.position.y = this.arenaCenter.y + Math.sin(this.subTimer * 20) * 0.3;

    if (this.particles && Math.random() < 0.5) {
      this.particles.spawnSparks(this.mesh.position, 6);
    }

    if (this.subTimer > 2.2) {
      // Salto acrobático de vuelta al centro de la arena
      this.mesh.position.copy(this.arenaCenter);
      this.recoverFromDizzy();
      this.state = 'idle';
      this.subTimer = 0;
    }
  }

  defeat() {
    this.state = 'defeated';
    audio.playExplosion();

    // Limpiar cualquier onda activa
    this.shockwaves.forEach(w => w.dispose());
    this.shockwaves = [];

    if (this.trajectoryArrow) {
      this.trajectoryArrow.visible = false;
    }

    if (this.particles) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          this.particles.spawnShockwave(this.mesh.position, 0x2ecc71);
          this.particles.spawnDustPuff(this.mesh.position, 25, 0xf1c40f);
        }, i * 200);
      }
    }

    this.mesh.scale.set(0.1, 0.1, 0.1);
    this.mesh.visible = false;
  }
}

// Alias de retrocompatibilidad
export const BossBugZapper = BossTalabotTitan;
