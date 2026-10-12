import * as THREE from 'three';
import { Textures } from './textures.js';
import { audio } from './audio.js';

export class Player {
  constructor(scene, particles = null) {
    this.scene = scene;
    this.particles = particles;
    this.mesh = new THREE.Group();
    
    // Físicas y movimiento
    this.position = new THREE.Vector3(0, 1.6, 11);
    this.prevPosition = this.position.clone();
    this.velocity = new THREE.Vector3();
    this.speed = 10.5;
    this.jumpForce = 13.8;
    this.gravity = -32;
    this.isGrounded = false;
    this.wasGrounded = false;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
    this.chargeTime = 0;
    this.isChargingJump = false;
    
    // Estado de la lengua (mecánica de balanceo y caza)
    this.tongueState = 'idle'; // 'idle' | 'shooting' | 'attached' | 'retracting'
    this.tongueTarget = null;
    this.tongueTargetType = null; // 'anchor' | 'bug' | 'boss'
    this.tongueAnchorPos = new THREE.Vector3();
    this.tongueLength = 0;
    this.maxTongueDist = 17;
    this.swingRopeLength = 0;
    this.swingVelocity = new THREE.Vector3();

    // Sistema de vidas y bichos
    this.lives = 3;
    this.bugsEaten = 0;
    this.totalBugsForLife = 20;
    this.lastCheckpoint = new THREE.Vector3(0, 1.6, 11);
    this.invulnerableTimer = 0;

    // Componentes visuales estilo Conker / N64
    this.modelContainer = null;
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
    this.scene.add(this.mesh);
  }

  createModel() {
    // Paleta Rareware / Conker: verde saturado con pancita amarilla y ojos expresivos
    const frogMat = new THREE.MeshLambertMaterial({ color: 0x44bd32, flatShading: true });
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xfbc531, flatShading: true });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyelidMat = new THREE.MeshLambertMaterial({ color: 0x2e8623, flatShading: true });
    const mouthMat = new THREE.MeshLambertMaterial({ color: 0xc23616, flatShading: true });
    const padMat = new THREE.MeshLambertMaterial({ color: 0xe1b12c, flatShading: true });

    // Contenedor principal elevado a 0.60 para que la base de las patas coincida exactamente con y = 0
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

    // Sacos vocales de las mejillas (se inflan al cargar el salto)
    [-0.58, 0.58].forEach(x => {
      const cheekGeo = new THREE.SphereGeometry(0.24, 5, 5);
      const cheek = new THREE.Mesh(cheekGeo, bellyMat);
      cheek.position.set(x, 0.1, 0.2);
      this.body.add(cheek);
      this.cheeks.push(cheek);
    });

    // 2. Ojos saltones gigantes estilo Conker / N64
    const eyeGeo = new THREE.DodecahedronGeometry(0.36, 1);
    const pupilGeo = new THREE.BoxGeometry(0.12, 0.22, 0.1);
    const eyelidGeo = new THREE.SphereGeometry(0.38, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);

    [-0.38, 0.38].forEach(x => {
      const eyeBall = new THREE.Mesh(eyeGeo, eyeWhiteMat);
      eyeBall.position.set(x, 0.56, 0.26);
      this.modelContainer.add(eyeBall);
      this.eyes.push(eyeBall);

      // Párpados expresivos
      const eyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
      eyelid.position.set(x, 0.58, 0.26);
      eyelid.rotation.x = -Math.PI / 2.8;
      this.modelContainer.add(eyelid);
      this.eyelids.push(eyelid);

      // Pupila cómica
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(x, 0.58, 0.57);
      this.modelContainer.add(pupil);
      this.pupils.push(pupil);
    });

    // 3. Boca cómica con lengua asomando
    const mouthGeo = new THREE.BoxGeometry(0.72, 0.12, 0.4);
    this.mouth = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouth.position.set(0, 0.05, 0.6);
    this.modelContainer.add(this.mouth);

    // Pequeña puntita de lengua rosa
    const tongueTip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.12), new THREE.MeshBasicMaterial({ color: 0xff4757 }));
    tongueTip.position.set(0, 0, 0.24);
    this.mouth.add(tongueTip);

    // 4. Patitas traseras con dedos palmeados
    [-0.56, 0.56].forEach(x => {
      const legGroup = new THREE.Group();
      const thighGeo = new THREE.BoxGeometry(0.36, 0.52, 0.62);
      const thigh = new THREE.Mesh(thighGeo, frogMat);
      thigh.position.set(0, 0, -0.1);
      thigh.rotation.x = 0.4;
      legGroup.add(thigh);

      // Pie con almohadillas
      const footGeo = new THREE.BoxGeometry(0.44, 0.1, 0.55);
      const foot = new THREE.Mesh(footGeo, frogMat);
      foot.position.set(0, -0.35, 0.2);
      legGroup.add(foot);

      // 3 dedos con ventosas
      [-0.14, 0, 0.14].forEach(tx => {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 5), padMat);
        pad.position.set(tx, 0.06, 0.24);
        foot.add(pad);
      });

      legGroup.position.set(x, -0.2, -0.2);
      this.modelContainer.add(legGroup);
      this.legs.push(legGroup);
    });

    // 5. Patitas delanteras / brazos
    [-0.46, 0.46].forEach(x => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.48, 0.2), frogMat);
      arm.position.set(x, -0.2, 0.4);
      arm.rotation.x = -0.2;
      this.modelContainer.add(arm);
      this.arms.push(arm);
    });
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
    const tongueGeo = new THREE.CylinderGeometry(0.09, 0.09, 1, 6);
    tongueGeo.translate(0, 0.5, 0);
    tongueGeo.rotateX(Math.PI / 2);
    const tongueMat = new THREE.MeshBasicMaterial({ color: 0xff4757 });
    this.tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
    this.tongueMesh.visible = false;
    this.scene.add(this.tongueMesh);
  }

  update(dt, input, platforms, anchors, bugs, boss, camera = null) {
    this.animTime += dt * 8;
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.mesh.visible = Math.floor(this.invulnerableTimer * 15) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }

    if (this.tongueState === 'attached') {
      this.handleTongueSwing(dt, input);
    } else {
      this.handleMovement(dt, input);
      this.handleJump(dt, input, camera);
    }

    this.handleTongueActions(dt, input, anchors, bugs, boss, camera);
    this.handleCollisions(dt, platforms, camera);
    this.mesh.position.copy(this.position);
    this.updateAnimation(dt, input);
    this.updateShadow(platforms);
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

      this.facingAngle = Math.atan2(moveDir.x, moveDir.z);
      this.mesh.rotation.y = this.facingAngle;
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
      this.coyoteTime -= dt;
    }

    if (input.keys.jumpPressed) {
      this.jumpBuffer = 0.12;
      this.isChargingJump = true;
      this.chargeTime = 0;
    }

    if (this.isChargingJump) {
      this.chargeTime += dt;
      // Compresión cómica de preparación
      const chargePct = Math.min(this.chargeTime / 0.35, 1.0);
      this.squashStretch.set(1 + chargePct * 0.35, 0.85 - chargePct * 0.45, 1 + chargePct * 0.35);

      // Inflar mejillas
      this.cheeks.forEach(c => c.scale.setScalar(1 + chargePct * 1.4));
    } else {
      this.cheeks.forEach(c => c.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 10));
    }

    if (input.keys.jumpReleased && this.isChargingJump) {
      this.isChargingJump = false;
      const chargeRatio = Math.min(this.chargeTime / 0.35, 1.0);

      if (this.coyoteTime > 0 || this.isGrounded) {
        const jumpVel = this.jumpForce * (0.8 + chargeRatio * 0.45);
        this.velocity.y = jumpVel;
        this.isGrounded = false;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        audio.playJump(chargeRatio);

        // Estiramiento cómico
        this.squashStretch.set(0.75, 1.45, 0.75);

        // Nubes de polvo al despegar
        if (this.particles) {
          this.particles.spawnDustPuff(this.position, 7);
        }

        if (camera && chargeRatio > 0.6) {
          camera.addTrauma(0.2);
        }
      }
    }
  }

  handleTongueActions(dt, input, anchors, bugs, boss, camera) {
    if (input.keys.tonguePressed && this.tongueState === 'idle') {
      audio.playTongueShoot();
      this.findTongueTarget(anchors, bugs, boss);
    }

    if (this.tongueState === 'shooting') {
      this.tongueLength += dt * 48;
      const distToTarget = this.position.distanceTo(this.tongueAnchorPos);
      
      this.updateTongueMesh(this.position, this.tongueAnchorPos, Math.min(this.tongueLength / distToTarget, 1.0));

      if (this.tongueLength >= distToTarget) {
        if (this.tongueTargetType === 'anchor') {
          this.tongueState = 'attached';
          this.swingRopeLength = distToTarget;
          audio.playTongueAttach();
          if (this.particles) this.particles.spawnSparks(this.tongueAnchorPos, 5);
        } else if (this.tongueTargetType === 'bug') {
          this.tongueState = 'retracting';
          if (this.tongueTarget && this.tongueTarget.alive) {
            this.tongueTarget.alive = false;
            this.bugsEaten++;
            audio.playEatBug();

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
          this.tongueState = 'retracting';
          if (boss) boss.takeHit();
          if (this.particles) this.particles.spawnSparks(this.tongueAnchorPos, 14);
          if (camera) camera.addTrauma(0.5);
        } else {
          this.tongueState = 'retracting';
        }
      }
    } else if (this.tongueState === 'retracting') {
      this.tongueLength -= dt * 55;
      this.updateTongueMesh(this.position, this.tongueAnchorPos, Math.max(this.tongueLength / 10, 0));
      if (this.tongueLength <= 0) {
        this.tongueState = 'idle';
        this.tongueMesh.visible = false;
      }
    } else if (this.tongueState === 'attached') {
      this.updateTongueMesh(this.position, this.tongueAnchorPos, 1.0);

      if (input.keys.jumpPressed || input.keys.tonguePressed) {
        this.tongueState = 'idle';
        this.tongueMesh.visible = false;
        this.velocity.copy(this.swingVelocity);
        this.velocity.y += 7.0;
        audio.playJump(0.85);

        if (this.particles) this.particles.spawnDustPuff(this.position, 6);
        if (camera) camera.addTrauma(0.25);
      }
    }
  }

  findTongueTarget(anchors, bugs, boss) {
    const headPos = this.position.clone().add(new THREE.Vector3(0, 0.85, 0));
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.facingAngle);

    let closestBug = null;
    let closestBugDist = 9.5;
    bugs.forEach(bug => {
      if (!bug.alive) return;
      const toBug = bug.position.clone().sub(headPos);
      const dist = toBug.length();
      if (dist < closestBugDist) {
        const dot = forward.dot(toBug.clone().normalize());
        if (dot > 0.25) {
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
      if (dist < closestAnchorDist && anc.position.y > headPos.y + 0.4) {
        const toAnc = anc.position.clone().sub(headPos).normalize();
        const dot = forward.dot(toAnc);
        if (dot > 0.08) {
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

    const toPlayer = this.position.clone().sub(this.tongueAnchorPos);
    toPlayer.normalize();
    this.position.copy(this.tongueAnchorPos).add(toPlayer.multiplyScalar(this.swingRopeLength));

    const g = new THREE.Vector3(0, this.gravity, 0);
    const ropeDir = this.position.clone().sub(this.tongueAnchorPos).normalize();
    const tensionForce = ropeDir.clone().multiplyScalar(-g.dot(ropeDir));
    const netAccel = g.clone().add(tensionForce);

    const swingPush = new THREE.Vector3();
    if (input.keys.forward) swingPush.z -= 20;
    if (input.keys.backward) swingPush.z += 20;
    if (input.keys.left) swingPush.x -= 20;
    if (input.keys.right) swingPush.x += 20;
    swingPush.applyAxisAngle(new THREE.Vector3(0, 1, 0), input.cameraYaw || 0);

    this.swingVelocity.add(netAccel.multiplyScalar(dt));
    this.swingVelocity.add(swingPush.multiplyScalar(dt));
    this.swingVelocity.multiplyScalar(0.985);

    this.position.add(this.swingVelocity.clone().multiplyScalar(dt));
    this.mesh.position.copy(this.position);

    if (this.swingVelocity.lengthSq() > 1) {
      this.mesh.rotation.y = Math.atan2(this.swingVelocity.x, this.swingVelocity.z);
    }
  }

  updateTongueMesh(start, target, progress) {
    this.tongueMesh.visible = true;
    const mouthPos = start.clone().add(new THREE.Vector3(0, 0.65, 0));
    const curEnd = mouthPos.clone().lerp(target, progress);

    const dist = mouthPos.distanceTo(curEnd);
    if (dist < 0.1) {
      this.tongueMesh.visible = false;
      return;
    }

    this.tongueMesh.position.copy(mouthPos);
    this.tongueMesh.scale.set(1, 1, dist);
    this.tongueMesh.lookAt(curEnd);
  }

  handleCollisions(dt, platforms, camera) {
    // 1. Colisión sólida contra el tronco central del árbol (cilindro cónico)
    if (this.position.y < 40.2) {
      const t = Math.min(Math.max(this.position.y / 40.0, 0), 1.0);
      const trunkRadius = 10.5 - t * 2.0;
      const distXZ = Math.hypot(this.position.x, this.position.z);
      const minTrunkDist = trunkRadius + 0.35;
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

    // 2. Apoyo y aterrizaje vertical sobre plataformas (Detección continua fluida)
    this.wasGrounded = this.isGrounded;
    this.isGrounded = false;
    const footRadius = 0.55;

    let bestGroundY = -9999;
    let bestPlatform = null;

    platforms.forEach(p => {
      if (p.isWalkable === false) return;

      const box = p.getBounds ? p.getBounds() : (p.box || (p.box = new THREE.Box3().setFromObject(p.mesh)));
      
      // Huella horizontal sobre la plataforma
      if (
        this.position.x >= box.min.x - footRadius &&
        this.position.x <= box.max.x + footRadius &&
        this.position.z >= box.min.z - footRadius &&
        this.position.z <= box.max.z + footRadius
      ) {
        const topY = box.max.y;
        const dy = this.position.y - topY;
        const fallStep = Math.max(0.65, Math.abs(this.velocity.y * dt) + 0.35);

        // Aterrizaje suave o pisada sobre la plataforma
        if (this.velocity.y <= 0 && dy >= -fallStep && dy <= 0.85) {
          if (topY > bestGroundY) {
            bestGroundY = topY;
            bestPlatform = p;
          }
        }
      }
    });

    if (bestPlatform !== null) {
      const previousVy = this.velocity.y;
      this.position.y = bestGroundY;
      this.velocity.y = 0;
      this.isGrounded = true;

      // Impacto de aterrizaje
      if (!this.wasGrounded && previousVy < -4) {
        audio.playLand();
        this.squashStretch.set(1.25, 0.75, 1.25);
        if (this.particles) {
          this.particles.spawnDustPuff(this.position, 6);
        }
        if (camera && previousVy < -16) {
          camera.addTrauma(0.35);
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

  updateAnimation(dt, input) {
    // Restaurar squash & stretch suavemente
    this.squashStretch.lerp(new THREE.Vector3(1, 1, 1), dt * 8);
    this.body.scale.set(
      1.1 * this.squashStretch.x,
      0.85 * this.squashStretch.y,
      1.0 * this.squashStretch.z
    );

    // Parpadeo y reacción de ojos
    const blink = Math.sin(this.animTime * 0.5) > 0.96;
    this.pupils.forEach(p => {
      p.scale.y = blink ? 0.1 : 1.0;
    });

    if (this.isGrounded) {
      const moving = Math.hypot(this.velocity.x, this.velocity.z) > 0.5;
      if (moving) {
        const hop = Math.abs(Math.sin(this.animTime * 1.5));
        this.body.position.y = hop * 0.25;
        this.legs[0].rotation.x = Math.sin(this.animTime * 1.5) * 0.6;
        this.legs[1].rotation.x = -Math.sin(this.animTime * 1.5) * 0.6;
      } else if (!this.isChargingJump) {
        const breathe = 1 + Math.sin(this.animTime * 0.8) * 0.05;
        this.belly.scale.set(0.92 * breathe, 0.82 / breathe, 0.52 * breathe);
        this.body.position.y = 0;
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
}
