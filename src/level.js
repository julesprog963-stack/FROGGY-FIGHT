import * as THREE from 'three';
import { audio } from './audio.js';
import { Textures } from './textures.js';
import { TiltingLeaf, SteppingLPlatform, HangingSwingPlatform, TongueAnchor } from './leaf.js';
import { SwampFly, BarkBeetle, PatrolWasp } from './bugs.js';
import { NPC } from './npc.js';
import { Coin } from './coin.js';
import { dressTrunk, dressPlatforms, TRUNK_CONFIG } from './ps2-art.js';
import { buildForestAtmosphere } from './forest-art.js';
import { createPatoLemusModel } from './pato-lemus-model.js';

function createCylinderPlatform(mesh, radius, height) {
  const box = new THREE.Box3();
  const halfH = height * 0.5;
  box.min.set(mesh.position.x - radius, mesh.position.y - halfH, mesh.position.z - radius);
  box.max.set(mesh.position.x + radius, mesh.position.y + halfH, mesh.position.z + radius);
  return {
    mesh,
    getBounds: () => box
  };
}

// ============================================================================
// TALABOT PEQUEÑO (MINI-TALABOT DE PATRULLA EN LA BASE DEL ÁRBOL)
// Pelea con los NPCs del bosque y contra Frogbert (vulnerable a patadas traseras)
// ============================================================================
export class MiniTalabot {
  constructor(scene, homePos, targetNpc = null, particles = null) {
    this.scene = scene;
    this.particles = particles;
    this.homePos = homePos.clone();
    this.position = homePos.clone();
    this.targetNpc = targetNpc;

    this.maxHp = 2;
    this.hp = 2;
    this.alive = true;
    this.state = 'brawl'; // 'brawl' | 'chase' | 'hitstun' | 'rebooting' | 'destroyed'
    this.timer = Math.random() * Math.PI * 2;
    this.stateTimer = 0;
    this.attackCooldown = 0;
    this.clashTimer = 0;
    this.velocity = new THREE.Vector3();

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    this.sawBlade = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.visorMat = null;
    this.antennaBulbMat = null;
    this.signalBeam = null;
    this.hpPips = [];

    this.buildModel();
    this.scene.add(this.mesh);
  }

  buildModel() {
    const hazardMat = new THREE.MeshLambertMaterial({
      map: Textures.createHazardMetal(),
      color: 0xbac4c8,
      flatShading: true
    });
    const darkMetalMat = new THREE.MeshLambertMaterial({ color: 0x1e293b, flatShading: true });
    const orangeCorpMat = new THREE.MeshLambertMaterial({ color: 0xff6b00, flatShading: true });
    const sawMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0, flatShading: true });
    this.visorMat = new THREE.MeshBasicMaterial({ color: 0xff3838 });
    this.antennaBulbMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });

    // 1. Chasis compacto blindado estilo PS2
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 0.92), hazardMat);
    body.position.y = 0.95;
    this.mesh.add(body);

    // Franja naranja corporativa de Pato Lemus / TALACORP
    const belt = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.22, 0.96), orangeCorpMat);
    belt.position.y = 0.62;
    this.mesh.add(belt);

    // 2. Cabeza angular con visor óptico rojo
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.50, 0.72), darkMetalMat);
    head.position.set(0, 1.68, 0.05);
    this.mesh.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.08), this.visorMat);
    visor.position.set(0, 1.68, 0.42);
    this.mesh.add(visor);

    // 3. Antena receptora en la cabeza (conectada a la Antena Central de la cima)
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.55, 5), darkMetalMat);
    rod.position.set(0, 2.15, 0);
    this.mesh.add(rod);

    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 8, 1, true), orangeCorpMat);
    dish.rotation.x = Math.PI;
    dish.position.set(0, 2.32, 0);
    this.mesh.add(dish);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), this.antennaBulbMat);
    bulb.position.set(0, 2.45, 0);
    this.mesh.add(bulb);

    // 4. Brazo derecho con sierra circular giratoria
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.65, 0.24), darkMetalMat);
    rArm.position.set(-0.68, 1.0, 0.25);
    rArm.rotation.x = -0.55;
    this.mesh.add(rArm);

    const saw = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.06, 12), sawMat);
    saw.rotation.z = Math.PI / 2;
    saw.position.set(-0.68, 0.72, 0.62);
    this.mesh.add(saw);
    this.sawBlade = saw;

    // 5. Brazo izquierdo con tenaza mecánica
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.62, 0.24), darkMetalMat);
    lArm.position.set(0.68, 1.0, 0.22);
    lArm.rotation.x = -0.45;
    this.mesh.add(lArm);

    // 6. Patas mecánicas articuladas
    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.46), darkMetalMat);
    this.leftLeg.position.set(-0.32, 0.28, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.46), darkMetalMat);
    this.rightLeg.position.set(0.32, 0.28, 0);
    this.mesh.add(this.rightLeg);

    // 7. Indicadores flotantes de vida (2 pips)
    [-0.18, 0.18].forEach((x) => {
      const pip = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.09, 0.06),
        new THREE.MeshBasicMaterial({ color: 0xff3838 })
      );
      pip.position.set(x, 2.72, 0);
      this.mesh.add(pip);
      this.hpPips.push(pip);
    });

    // 8. Rayo vertical de reinicio remoto desde la Antena de la Cima
    const beamGeo = new THREE.CylinderGeometry(0.18, 0.45, 28, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.signalBeam = new THREE.Mesh(beamGeo, beamMat);
    this.signalBeam.position.y = 14;
    this.signalBeam.visible = false;
    this.mesh.add(this.signalBeam);
  }

  takeKickHit(frog, camera = null) {
    if (!this.alive || this.state === 'destroyed' || this.state === 'rebooting') return;

    this.hp--;
    audio.playMetalClang();

    // Actualizar indicadores de vida
    this.hpPips.forEach((pip, idx) => {
      pip.visible = idx < this.hp;
    });

    const knockDir = this.position.clone().sub(frog.position).setY(0);
    if (knockDir.lengthSq() < 0.001) knockDir.set(0, 0, 1);
    knockDir.normalize();

    if (this.particles) {
      this.particles.spawnSparks(this.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 18);
      this.particles.spawnShockwave(this.position, 0xa3e635);
    }
    if (camera) {
      camera.addTrauma(0.32);
    }

    if (this.hp <= 0) {
      // ¡Derrotado por las patadas de Frogbert!
      audio.playExplosion();
      if (this.particles) {
        this.particles.spawnDustPuff(this.position, 22, 0x1e293b);
        this.particles.spawnSparks(this.position, 24);
      }
      // Recompensa de monedas
      if (frog && frog.collectCoin) {
        frog.collectCoin();
        audio.playCoin();
      }
      // Entra en estado de reinicio remoto mientras la Antena Central siga activa en la cima
      this.state = 'rebooting';
      this.stateTimer = 0;
      this.mesh.rotation.x = -Math.PI / 2.4;
      if (this.signalBeam) this.signalBeam.visible = true;
    } else {
      this.state = 'hitstun';
      this.stateTimer = 0.55;
      this.velocity.set(knockDir.x * 13.5, 5.5, knockDir.z * 13.5);
    }
  }

  shutDownPermanently() {
    if (this.state === 'destroyed') return;
    this.state = 'destroyed';
    this.alive = false;
    if (this.signalBeam) this.signalBeam.visible = false;
    if (this.particles) {
      this.particles.spawnShockwave(this.position, 0xfacc15);
      this.particles.spawnDustPuff(this.position, 28, 0xff6b00);
      this.particles.spawnSparks(this.position, 30);
    }
    this.mesh.visible = false;
  }

  update(dt, frog) {
    if (!this.alive || this.state === 'destroyed') return;

    this.timer += dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Parpadeo de la antena receptora
    const pulse = Math.sin(this.timer * 10) > 0;
    if (this.antennaBulbMat) {
      this.antennaBulbMat.color.setHex(pulse ? 0xff0055 : 0x7f1d1d);
    }

    if (this.state === 'rebooting') {
      this.stateTimer += dt;
      // Tiembla en el suelo recibiendo señal de la Antena Central de la cima
      this.mesh.position.y = this.homePos.y + 0.15;
      this.mesh.rotation.z = Math.sin(this.timer * 18) * 0.12;
      if (this.signalBeam) {
        this.signalBeam.rotation.y += dt * 4;
      }

      // Tras 15 segundos, la Antena Central lo reactiva si aún no ha sido destruida
      if (this.stateTimer >= 15.0) {
        this.hp = this.maxHp;
        this.hpPips.forEach(p => { p.visible = true; });
        this.state = 'brawl';
        this.mesh.rotation.set(0, 0, 0);
        this.mesh.position.y = this.homePos.y;
        if (this.signalBeam) this.signalBeam.visible = false;
        if (this.particles) this.particles.spawnSparks(this.position, 10);
      }
      return;
    }

    if (this.sawBlade) {
      this.sawBlade.rotation.x += dt * 24;
    }

    if (this.state === 'hitstun') {
      this.stateTimer -= dt;
      this.position.addScaledVector(this.velocity, dt);
      this.velocity.y -= 24 * dt;
      if (this.position.y <= this.homePos.y) {
        this.position.y = this.homePos.y;
        this.velocity.y = 0;
        this.velocity.x *= 0.8;
        this.velocity.z *= 0.8;
      }
      this.mesh.position.copy(this.position);
      this.mesh.rotation.x = Math.sin(this.stateTimer * 20) * 0.4;

      if (this.stateTimer <= 0) {
        this.state = 'chase';
        this.mesh.rotation.x = 0;
      }
      return;
    }

    // Animación de marcha en las patas
    const stride = Math.sin(this.timer * 10) * 0.45;
    if (this.leftLeg) this.leftLeg.rotation.x = stride;
    if (this.rightLeg) this.rightLeg.rotation.x = -stride;

    const distToFrog = frog ? this.position.distanceTo(frog.position) : 999;

    // Si Frogbert se acerca a la pelea (y está en la planta baja), el Mini-Talabot lo ataca
    if (frog && frog.position.y < 8.0 && distToFrog < 8.5) {
      this.state = 'chase';
      const toFrog = frog.position.clone().sub(this.position).setY(0);
      const dist = toFrog.length();
      if (dist > 0.05) {
        toFrog.normalize();
        this.mesh.rotation.y = Math.atan2(toFrog.x, toFrog.z);
        if (dist > 1.35) {
          this.position.addScaledVector(toFrog, 4.2 * dt);
        }
      }

      // Contacto ofensivo del Mini-Talabot contra Frogbert (si Frogbert no está pateando)
      if (dist < 1.55 && !frog.isKicking && this.attackCooldown <= 0 && frog.invulnerableTimer <= 0) {
        this.attackCooldown = 1.8;
        const hitDir = frog.position.clone().sub(this.position).setY(0).normalize();
        frog.takeHit(hitDir);
      }
    } else {
      // Pelea activa contra el NPC asignado o patrulla en la base del árbol
      this.state = 'brawl';
      const anchorTarget = this.targetNpc ? this.targetNpc.position : this.homePos;
      const orbitAngle = this.timer * 1.8;
      const combatOffset = new THREE.Vector3(
        Math.cos(orbitAngle) * 1.85,
        0,
        Math.sin(orbitAngle) * 1.85
      );
      const desiredPos = anchorTarget.clone().add(combatOffset);
      desiredPos.y = this.homePos.y;

      this.position.lerp(desiredPos, dt * 3.5);

      const toNpc = anchorTarget.clone().sub(this.position).setY(0);
      if (toNpc.lengthSq() > 0.01) {
        this.mesh.rotation.y = Math.atan2(toNpc.x, toNpc.z);
      }

      // Chispas de combate entre el NPC y el Mini-Talabot
      this.clashTimer += dt;
      if (this.clashTimer > 1.35) {
        this.clashTimer = 0;
        if (this.particles && this.targetNpc) {
          const midClash = this.position.clone().lerp(this.targetNpc.position, 0.5).add(new THREE.Vector3(0, 0.9, 0));
          this.particles.spawnSparks(midClash, 5);
        }
      }
    }

    // Colisión con el Gran Tronco Sagrado para que no se metan dentro
    const trunkR = TRUNK_CONFIG.getRadiusAtY(this.position.y) + 0.85;
    const distXZ = Math.hypot(this.position.x, this.position.z);
    if (distXZ < trunkR && distXZ > 0.001) {
      this.position.x = (this.position.x / distXZ) * trunkR;
      this.position.z = (this.position.z / distXZ) * trunkR;
    }

    this.mesh.position.copy(this.position);
  }
}

// ============================================================================
// ANTENA CENTRAL DE CONTROL TALACORP EN LA CIMA DEL ÁRBOL
// Controla a los Mini-Talabots de abajo; se desbloquea al derrotar a Talabot Titán
// ============================================================================
export class TalacorpAntenna {
  constructor(scene, position, particles = null, onDestroyed = null) {
    this.scene = scene;
    this.particles = particles;
    this.position = position.clone();
    this.onDestroyed = onDestroyed;

    this.maxHp = 3;
    this.hp = 3;
    this.isShielded = true;
    this.isDestroyed = false;
    this.timer = 0;
    this.shakeTimer = 0;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    this.mastGroup = null;
    this.dishesGroup = null;
    this.coreMat = null;
    this.shieldMesh = null;
    this.signalRings = [];

    this.buildModel();
    this.scene.add(this.mesh);
  }

  get isVulnerable() {
    return !this.isShielded && !this.isDestroyed;
  }

  buildModel() {
    const hazardMat = new THREE.MeshLambertMaterial({
      map: Textures.createHazardMetal(),
      color: 0x95a5a6,
      flatShading: true
    });
    const darkSteelMat = new THREE.MeshLambertMaterial({ color: 0x1e293b, flatShading: true });
    const orangeMat = new THREE.MeshLambertMaterial({ color: 0xff6b00, flatShading: true });
    this.coreMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });

    // 1. Base pesada octogonal anclada a la cima
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.3, 0.9, 8), hazardMat);
    base.position.y = 0.45;
    this.mesh.add(base);

    // 2. Grupo del mástil (se inclina y daña con cada patada de Frogbert)
    this.mastGroup = new THREE.Group();
    this.mastGroup.position.y = 0.9;
    this.mesh.add(this.mastGroup);

    // Núcleo de energía de cristal vulnerable a patadas
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.8, 10), this.coreMat);
    core.position.y = 0.9;
    this.mastGroup.add(core);

    // Jaula de soporte alrededor del núcleo
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.0, 0.22), darkSteelMat);
      strut.position.set(Math.cos(a) * 1.1, 0.9, Math.sin(a) * 1.1);
      this.mastGroup.add(strut);
    }

    // Torre de celosía metálica
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.95, 5.8, 6), darkSteelMat);
    tower.position.y = 4.6;
    this.mastGroup.add(tower);

    // 3. Platos de radar parabólicos giratorios en la cúspide
    this.dishesGroup = new THREE.Group();
    this.dishesGroup.position.y = 6.8;
    this.mastGroup.add(this.dishesGroup);

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const dish = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.55, 10, 1, true), orangeMat);
      dish.position.set(Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0);
      dish.rotation.z = Math.cos(a) * 0.8;
      dish.rotation.x = Math.sin(a) * 0.8;
      this.dishesGroup.add(dish);
    }

    const topBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0055 })
    );
    topBeacon.position.y = 1.1;
    this.dishesGroup.add(topBeacon);

    // 4. Anillos de ondas de control que bajan hacia el bosque
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(1.4, 0.07, 6, 24);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      this.mesh.add(ring);
      this.signalRings.push({ mesh: ring, mat: ringMat, offset: i * 0.33 });
    }

    // 5. Escudo electromagnético protector (activo mientras vive el Jefe Talabot Titán)
    const shieldGeo = new THREE.SphereGeometry(2.6, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00d2d3,
      transparent: true,
      opacity: 0.28,
      wireframe: true
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 0.2;
    this.mesh.add(this.shieldMesh);
  }

  unlockShield() {
    if (!this.isShielded) return;
    this.isShielded = false;
    if (this.shieldMesh) {
      this.shieldMesh.visible = false;
    }
    audio.playBossAlarm();
    if (this.particles) {
      this.particles.spawnShockwave(this.position, 0x00d2d3);
      this.particles.spawnSparks(this.position.clone().add(new THREE.Vector3(0, 2.0, 0)), 30);
    }
  }

  takeKickHit(frog, camera = null) {
    if (this.isDestroyed) return;

    if (this.isShielded) {
      // Escudo aún activo: rebota con chispas azules
      audio.playMetalClang();
      if (this.particles) {
        this.particles.spawnSparks(this.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 10);
      }
      return;
    }

    this.hp--;
    this.shakeTimer = 0.45;
    audio.playMetalClang();
    audio.playBossHit();

    if (camera) camera.addTrauma(0.65);
    if (this.particles) {
      this.particles.spawnShockwave(this.position, 0xfacc15);
      this.particles.spawnSparks(this.position.clone().add(new THREE.Vector3(0, 2.0, 0)), 28);
      this.particles.spawnDustPuff(this.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 20, 0xff6b00);
    }

    // Inclinar la antena progresivamente por el daño de las patadas
    if (this.mastGroup) {
      const dmgRatio = (this.maxHp - this.hp) / this.maxHp;
      this.mastGroup.rotation.z = dmgRatio * 0.28;
      this.mastGroup.rotation.x = -dmgRatio * 0.22;
    }

    if (this.hp <= 0) {
      this.destroyAntenna(camera);
    }
  }

  destroyAntenna(camera = null) {
    this.isDestroyed = true;
    audio.playExplosion();
    if (camera) camera.addTrauma(1.0);

    this.signalRings.forEach(r => { r.mesh.visible = false; });

    if (this.mastGroup) {
      this.mastGroup.rotation.z = Math.PI / 2.3;
      this.mastGroup.position.y = 0.3;
    }
    if (this.coreMat) {
      this.coreMat.color.setHex(0x333333);
    }

    if (this.particles) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          this.particles.spawnShockwave(this.position, 0xff0055);
          this.particles.spawnDustPuff(this.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 32, 0xfacc15);
          this.particles.spawnSparks(this.position.clone().add(new THREE.Vector3(0, 2.0, 0)), 35);
        }, i * 180);
      }
    }

    if (this.onDestroyed) {
      this.onDestroyed();
    }
  }

  update(dt) {
    this.timer += dt;

    if (this.isDestroyed) return;

    if (this.dishesGroup) {
      this.dishesGroup.rotation.y += dt * (this.isShielded ? 2.2 : 5.5);
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      this.mesh.position.x = this.position.x + (Math.random() - 0.5) * 0.35;
      this.mesh.position.z = this.position.z + (Math.random() - 0.5) * 0.35;
    } else {
      this.mesh.position.copy(this.position);
    }

    // Si es vulnerable, el núcleo parpadea en verde/rojo brillante indicando que puede patearse
    if (this.coreMat) {
      if (!this.isShielded) {
        const flash = Math.sin(this.timer * 14) > 0;
        this.coreMat.color.setHex(flash ? 0xa3e635 : 0xff0055);
      } else {
        this.coreMat.color.setHex(0xff0055);
      }
    }

    // Ondas de transmisión bajando desde la antena hacia el bosque
    this.signalRings.forEach(item => {
      const cycle = (this.timer * 0.65 + item.offset) % 1.0;
      item.mesh.position.y = 7.2 - cycle * 6.8;
      const s = 1.0 + cycle * 2.4;
      item.mesh.scale.set(s, 1, s);
      item.mat.opacity = (1.0 - cycle) * 0.65;
    });
  }
}

// ============================================================================
// PORTAL DE TESTEO PARA TELETRANSPORTARSE ENTRE LA BASE Y LA CIMA/JEFE
// ============================================================================
export class TestPortal {
  constructor(scene, position, targetPosition, label = 'PORTAL TEST', color = 0x9b59b6) {
    this.scene = scene;
    this.position = position.clone();
    this.targetPosition = targetPosition.clone();
    this.label = label;
    this.color = color;
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    this.timer = 0;
    this.cooldown = 0;

    this.buildModel();
    this.scene.add(this.mesh);
  }

  buildModel() {
    const padGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.3, 16);
    const padMat = new THREE.MeshLambertMaterial({
      color: 0x1e272e,
      flatShading: true
    });
    this.padMesh = new THREE.Mesh(padGeo, padMat);
    this.padMesh.position.y = 0.15;
    this.mesh.add(this.padMesh);

    const rimGeo = new THREE.TorusGeometry(1.6, 0.09, 8, 24);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshBasicMaterial({ color: this.color });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.3;
    this.mesh.add(rim);

    const beamGeo = new THREE.CylinderGeometry(1.2, 1.2, 3.4, 16, 1, true);
    this.beamMat = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const beam = new THREE.Mesh(beamGeo, this.beamMat);
    beam.position.y = 1.8;
    this.mesh.add(beam);

    const vortexGeo = new THREE.TorusGeometry(1.15, 0.08, 8, 24);
    vortexGeo.rotateX(Math.PI / 2);
    this.vortex1 = new THREE.Mesh(vortexGeo, new THREE.MeshBasicMaterial({ color: 0xa9ffe1 }));
    this.vortex1.position.y = 1.0;
    this.mesh.add(this.vortex1);

    this.vortex2 = new THREE.Mesh(vortexGeo, new THREE.MeshBasicMaterial({ color: this.color }));
    this.vortex2.position.y = 2.2;
    this.mesh.add(this.vortex2);

    const crystalGeo = new THREE.OctahedronGeometry(0.48, 0);
    this.crystalMat = new THREE.MeshBasicMaterial({ color: this.color });
    this.crystal = new THREE.Mesh(crystalGeo, this.crystalMat);
    this.crystal.position.y = 3.6;
    this.mesh.add(this.crystal);

    const stone = new THREE.MeshLambertMaterial({ color: 0x49665c, flatShading: true });
    const gold = new THREE.MeshLambertMaterial({ color: 0xd5a954, flatShading: true });
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 2.8, 5), stone);
      pillar.position.set(side * 1.45, 1.45, 0);
      this.mesh.add(pillar);
      const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), gold);
      crown.position.set(side * 1.45, 3, 0);
      this.mesh.add(crown);
    }

    this.light = new THREE.PointLight(this.color, 2.0, 9);
    this.light.position.set(0, 2.0, 0);
    this.mesh.add(this.light);
  }

  update(dt, frog, particles = null) {
    this.timer += dt;
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.vortex1) {
      this.vortex1.rotation.z += dt * 3.2;
      this.vortex1.position.y = 1.0 + Math.sin(this.timer * 3.5) * 0.25;
    }
    if (this.vortex2) {
      this.vortex2.rotation.z -= dt * 2.6;
      this.vortex2.position.y = 2.2 + Math.cos(this.timer * 3.5) * 0.25;
    }
    if (this.crystal) {
      this.crystal.rotation.y += dt * 2.0;
      this.crystal.rotation.x = Math.sin(this.timer * 2.0) * 0.2;
      this.crystal.position.y = 3.6 + Math.sin(this.timer * 4.0) * 0.2;
    }
    if (this.beamMat) {
      this.beamMat.opacity = 0.10 + Math.sin(this.timer * 2.0) * 0.035;
    }

    if (particles && Math.random() < 0.25) {
      const pPos = this.position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 1.6,
        0.4 + Math.random() * 2.2,
        (Math.random() - 0.5) * 1.6
      ));
      particles.spawnSparks(pPos, 2);
    }

    const dist = Math.hypot(frog.position.x - this.position.x, frog.position.z - this.position.z);
    const yDiff = Math.abs(frog.position.y - this.position.y);

    if (dist < 1.7 && yDiff < 2.5 && this.cooldown <= 0) {
      this.teleport(frog, particles);
    }
  }

  teleport(frog, particles = null) {
    this.cooldown = 2.0;

    if (particles) {
      particles.spawnShockwave(frog.position, this.color);
      particles.spawnDustPuff(frog.position, 25, this.color);
      particles.spawnSparks(frog.position, 20);
    }

    audio.playTongueShoot();
    audio.play1Up();

    frog.position.copy(this.targetPosition);
    frog.prevPosition.copy(this.targetPosition);
    frog.velocity.set(0, 0, 0);

    if (this.targetPosition.y > 45) {
      frog.lastCheckpoint.copy(this.targetPosition);
    } else {
      frog.lastCheckpoint.set(0, 1.6, 16.5);
    }

    if (particles) {
      particles.spawnShockwave(this.targetPosition, this.color);
      particles.spawnDustPuff(this.targetPosition, 30, 0x00ffff);
      particles.spawnSparks(this.targetPosition, 25);
    }
  }
}

export class Level {
  constructor(scene, particles = null) {
    this.scene = scene;
    this.particles = particles;
    this.platforms = [];
    this.tiltingLeaves = [];
    this.hangingPlatforms = [];
    this.anchors = [];
    this.bugs = [];
    this.checkpoints = [];
    this.npcs = [];
    this.miniTalabots = [];
    this.coins = [];
    this.portals = [];
    this.antenna = null;
    this.swampRadius = 76.0;

    this.trunkMesh = null;
    this.trunkHeight = TRUNK_CONFIG.height; // 56m de altura monumental
    this.arenaRadius = TRUNK_CONFIG.radiusTop; // 12m de radio en la cima

    this.buildWorld();
    this.buildTrunk();
    this.buildOrganicVines();
    this.buildBioluminescentFungi();
    this.buildPlatformsFromMaquette();
    this.buildIndustrialDetails();
    this.populateBugs();
    this.buildPerimeterBarriers();
    this.buildPatoLemusBillboard();
    this.buildPatoLemusCampaignPodium();
    this.buildToxicDrainageEasterEgg();
    this.spawnNPCs();
    this.spawnMiniTalabots();
    this.buildSummitAntenna();
    this.spawnCoins();
    this.buildTestPortals();
    dressTrunk(this.trunkMesh);
    dressPlatforms(this.platforms);
    this.forestArt = buildForestAtmosphere(this.scene);
  }

  // Helper para posicionar plataformas y elementos alrededor de la corteza cónica del Gran Tronco
  trunkPoint(angleDeg, y, radialOffset = 1.6) {
    const rad = THREE.MathUtils.degToRad(angleDeg);
    const r = TRUNK_CONFIG.getRadiusAtY(y) + radialOffset;
    return new THREE.Vector3(Math.sin(rad) * r, y, Math.cos(rad) * r);
  }

  buildWorld() {
    const groundGeo = new THREE.PlaneGeometry(250, 250, 24, 24);
    const groundMat = new THREE.MeshLambertMaterial({
      color: 0x1b331b,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    this.scene.add(ground);

    const groundBox = new THREE.Box3(
      new THREE.Vector3(-125, -2, -125),
      new THREE.Vector3(125, -1, 125)
    );
    this.platforms.push({ mesh: ground, getBounds: () => groundBox });

    const waterGeo = new THREE.PlaneGeometry(240, 240);
    const waterMat = new THREE.MeshBasicMaterial({
      color: 0x0a2216,
      transparent: true,
      opacity: 0.75
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.6;
    this.scene.add(water);

    const stumpMat = new THREE.MeshLambertMaterial({ color: 0x3d2714, flatShading: true });
    for (let i = 0; i < 34; i++) {
      const angle = (i / 34) * Math.PI * 2 + (i % 3) * 0.15;
      const dist = 34 + (i % 5) * 8.5;
      const h = 2 + (i % 4) * 1.8;
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.0, h, 7), stumpMat);
      stump.position.set(Math.cos(angle) * dist, h * 0.5 - 1, Math.sin(angle) * dist);
      this.scene.add(stump);
    }
  }

  buildTrunk() {
    // Gran Tronco Sagrado mucho más alto (56m) y más ancho (radio base 15m -> cima 12m)
    const { height, radiusTop, radiusBottom } = TRUNK_CONFIG;
    const trunkGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
    const trunkMat = new THREE.MeshLambertMaterial({
      map: Textures.createTreeBark(),
      color: 0xc6a782,
      flatShading: true
    });
    this.trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    this.trunkMesh.position.y = height * 0.5;
    this.scene.add(this.trunkMesh);

    // Cima talada amplia con anillos de crecimiento (radio 12m)
    const topCapGeo = new THREE.CylinderGeometry(radiusTop, radiusTop, 0.9, 24);
    const topCapMat = new THREE.MeshLambertMaterial({
      map: Textures.createWoodRings(),
      color: 0xd4a373,
      flatShading: true
    });
    const topCap = new THREE.Mesh(topCapGeo, topCapMat);
    topCap.position.y = height + 0.45;
    this.scene.add(topCap);
    this.platforms.push(createCylinderPlatform(topCap, radiusTop, 0.9));
  }

  buildOrganicVines() {
    const vineMat = new THREE.MeshLambertMaterial({ color: 0x1b4332, flatShading: true });
    for (let i = 0; i < 5; i++) {
      const vineGroup = new THREE.Group();
      const baseAngle = (i / 5) * Math.PI * 2;
      for (let y = 2; y < this.trunkHeight - 2; y += 3.2) {
        const a = baseAngle + (y / this.trunkHeight) * Math.PI * 1.8;
        const r = TRUNK_CONFIG.getRadiusAtY(y) + 0.25;
        const segment = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 3.5, 5), vineMat);
        segment.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        segment.rotation.z = Math.cos(a) * 0.2;
        segment.rotation.x = Math.sin(a) * 0.2;
        vineGroup.add(segment);
      }
      this.scene.add(vineGroup);
    }
  }

  buildBioluminescentFungi() {
    const shroomColors = [0x9b59b6, 0xe67e22, 0x1abc9c, 0xf1c40f];
    const configs = [
      { angle: -42, y: 10 },
      { angle: -95, y: 18 },
      { angle: -155, y: 28 },
      { angle: 95, y: 38 },
      { angle: 38, y: 47 }
    ];

    configs.forEach((cfg, idx) => {
      const pos = this.trunkPoint(cfg.angle, cfg.y, 0.2);
      const capMat = new THREE.MeshLambertMaterial({
        color: shroomColors[idx % shroomColors.length],
        flatShading: true
      });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 0.7, 0.45, 7), capMat);
      cap.position.copy(pos);
      cap.rotation.z = (Math.random() - 0.5) * 0.35;
      this.scene.add(cap);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 0.9, 5),
        new THREE.MeshLambertMaterial({ color: 0xdfe6e9 })
      );
      stem.position.copy(pos).add(new THREE.Vector3(0, -0.45, 0));
      this.scene.add(stem);
    });
  }

  buildPlatformsFromMaquette() {
    // 1. Plataforma redonda de inicio en la base del Gran Tronco (z = 16.5)
    const startPos = new THREE.Vector3(0, 1.2, 16.5);
    const startMushroom = new THREE.Mesh(
      new THREE.CylinderGeometry(4.0, 4.3, 0.65, 14),
      new THREE.MeshLambertMaterial({ map: Textures.createWoodRings(), color: 0xeab873, flatShading: true })
    );
    startMushroom.position.copy(startPos);
    this.scene.add(startMushroom);
    this.platforms.push(createCylinderPlatform(startMushroom, 4.1, 0.65));
    this.checkpoints.push(new THREE.Vector3(0, 1.6, 16.5));

    // Ancla de práctica en la base para probar el nuevo balanceo con cabeza sincronizada
    const basePracticeAnchor = new TongueAnchor(this.scene, this.trunkPoint(14, 9.2, 3.2));
    this.anchors.push(basePracticeAnchor);

    // 2. Tramo 1: Escalones en espiral ascendente (y = 4m a 18m)
    const stepConfigs = [
      { pos: this.trunkPoint(-18, 4.2, 1.6), size: { w: 3.4, d: 2.6, h: 0.38 } },
      { pos: this.trunkPoint(-38, 7.4, 1.6), size: { w: 3.4, d: 2.6, h: 0.38 } },
      { pos: this.trunkPoint(-58, 10.8, 1.6), size: { w: 3.4, d: 2.6, h: 0.38 } }
    ];

    stepConfigs.forEach(cfg => {
      const plat = new SteppingLPlatform(this.scene, cfg.pos, cfg.size);
      this.platforms.push(plat);
    });

    // Ancla 1 de balanceo en Tramo 1
    this.anchors.push(new TongueAnchor(this.scene, this.trunkPoint(-72, 16.8, 2.8)));

    // Primera hoja inestable
    const leaf1 = new TiltingLeaf(this.scene, this.trunkPoint(-84, 14.2, 1.8), { w: 3.8, d: 3.2, h: 0.32 }, 'left');
    this.platforms.push(leaf1);
    this.tiltingLeaves.push(leaf1);

    // Checkpoint 1: Nudo del tronco (y = 18.0m)
    const knot1Pos = this.trunkPoint(-108, 18.0, 2.0);
    const knot1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.8, 0.75, 10),
      new THREE.MeshLambertMaterial({ color: 0x8e44ad, flatShading: true })
    );
    knot1.position.copy(knot1Pos);
    this.scene.add(knot1);
    this.platforms.push(createCylinderPlatform(knot1, 3.7, 0.75));
    this.checkpoints.push(knot1Pos.clone().add(new THREE.Vector3(0, 0.5, 0)));

    // 3. Tramo 2: Anillos de lengua y ascenso medio (y = 18m a 37m)
    this.anchors.push(new TongueAnchor(this.scene, this.trunkPoint(-132, 25.5, 2.8)));

    const leaf2 = new TiltingLeaf(this.scene, this.trunkPoint(-148, 22.5, 1.8), { w: 3.6, d: 3.0, h: 0.32 }, 'outward');
    this.platforms.push(leaf2);
    this.tiltingLeaves.push(leaf2);

    const platIndustrial1 = new SteppingLPlatform(this.scene, this.trunkPoint(-175, 26.2, 1.7), { w: 3.6, d: 2.6, h: 0.38 });
    this.platforms.push(platIndustrial1);

    this.anchors.push(new TongueAnchor(this.scene, this.trunkPoint(162, 33.0, 2.8)));

    // 4. Plataforma colgante suspendida
    const hangingPos = this.trunkPoint(138, 30.5, 2.2);
    const hangingPlat = new HangingSwingPlatform(this.scene, hangingPos, { w: 3.8, d: 2.8, h: 0.38 }, 5.8);
    this.platforms.push(hangingPlat);
    this.hangingPlatforms.push(hangingPlat);

    const overheadBranch = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.9, 6.4),
      new THREE.MeshLambertMaterial({ color: 0x3d2714, flatShading: true })
    );
    overheadBranch.position.set(hangingPos.x, hangingPos.y + 5.8, hangingPos.z);
    this.scene.add(overheadBranch);

    const platIndustrial2 = new SteppingLPlatform(this.scene, this.trunkPoint(112, 34.0, 1.7), { w: 3.5, d: 2.5, h: 0.38 });
    this.platforms.push(platIndustrial2);

    this.anchors.push(new TongueAnchor(this.scene, this.trunkPoint(96, 40.5, 2.8)));

    // Checkpoint 2: Nudo de tuberías (y = 37.5m)
    const knot2Pos = this.trunkPoint(82, 37.5, 2.0);
    const knot2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.8, 0.75, 10),
      new THREE.MeshLambertMaterial({ color: 0x27ae60, flatShading: true })
    );
    knot2.position.copy(knot2Pos);
    this.scene.add(knot2);
    this.platforms.push(createCylinderPlatform(knot2, 3.7, 0.75));
    this.checkpoints.push(knot2Pos.clone().add(new THREE.Vector3(0, 0.5, 0)));

    // 5. Tramo 3: Subida final hacia la Gran Copa (y = 37.5m a 56.8m)
    const leaf3 = new TiltingLeaf(this.scene, this.trunkPoint(58, 41.5, 1.8), { w: 3.6, d: 3.0, h: 0.32 }, 'right');
    this.platforms.push(leaf3);
    this.tiltingLeaves.push(leaf3);

    this.anchors.push(new TongueAnchor(this.scene, this.trunkPoint(42, 48.2, 2.8)));

    const leaf4 = new TiltingLeaf(this.scene, this.trunkPoint(34, 45.8, 1.8), { w: 3.6, d: 3.0, h: 0.32 }, 'outward');
    this.platforms.push(leaf4);
    this.tiltingLeaves.push(leaf4);

    const stepUpper1 = new SteppingLPlatform(this.scene, this.trunkPoint(16, 49.8, 1.7), { w: 3.6, d: 2.6, h: 0.4 });
    this.platforms.push(stepUpper1);

    const finalStep = new SteppingLPlatform(this.scene, this.trunkPoint(2, 53.6, 1.6), { w: 3.8, d: 2.8, h: 0.42 });
    this.platforms.push(finalStep);

    // Checkpoint 3: Cima del Gran Tronco Sagrado (y = 57.0m)
    this.checkpoints.push(new THREE.Vector3(0, this.trunkHeight + 1.0, 8.5));
  }

  buildIndustrialDetails() {
    const pipeMat = new THREE.MeshLambertMaterial({
      map: Textures.createHazardMetal(),
      color: 0x95a5a6,
      flatShading: true
    });
    const pipePos = this.trunkPoint(90, 28, 0.4);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 24, 8), pipeMat);
    pipe.position.copy(pipePos);
    this.scene.add(pipe);

    const slimeMat = new THREE.MeshBasicMaterial({
      map: Textures.createToxicSlime(),
      color: 0x00ff88
    });
    const slime = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.1, 5, 6), slimeMat);
    slime.position.set(pipePos.x, 13.5, pipePos.z);
    this.scene.add(slime);
  }

  populateBugs() {
    const flyConfigs = [
      { angle: -10, y: 5.0 },
      { angle: -30, y: 8.8 },
      { angle: -50, y: 12.2 },
      { angle: -78, y: 16.0 },
      { angle: -125, y: 21.0 },
      { angle: -162, y: 25.0 },
      { angle: 150, y: 29.5 },
      { angle: 120, y: 33.5 },
      { angle: 92, y: 39.0 },
      { angle: 66, y: 43.5 },
      { angle: 42, y: 47.5 },
      { angle: 20, y: 51.5 },
      { angle: -25, y: 58.2 },
      { angle: 25, y: 58.2 }
    ];

    flyConfigs.forEach(cfg => {
      const pos = cfg.y > this.trunkHeight
        ? new THREE.Vector3(Math.sin(cfg.angle) * 6, cfg.y, Math.cos(cfg.angle) * 6)
        : this.trunkPoint(cfg.angle, cfg.y, 2.4);
      this.bugs.push(new SwampFly(this.scene, pos));
    });

    const beetlePositions = [
      this.trunkPoint(-18, 4.7, 1.6),
      this.trunkPoint(-108, 18.6, 2.0),
      this.trunkPoint(-175, 26.7, 1.7),
      this.trunkPoint(82, 38.1, 2.0)
    ];

    beetlePositions.forEach(pos => {
      this.bugs.push(new BarkBeetle(this.scene, pos, 1.2));
    });

    const waspPositions = [
      this.trunkPoint(-95, 19.5, 2.6),
      this.trunkPoint(150, 32.0, 2.6),
      this.trunkPoint(48, 44.5, 2.6)
    ];

    waspPositions.forEach(pos => {
      this.bugs.push(new PatrolWasp(this.scene, pos));
    });
  }

  buildPerimeterBarriers() {
    const postMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d, flatShading: true });
    const beamMat = new THREE.MeshLambertMaterial({
      map: Textures.createHazardStripes(),
      flatShading: true
    });
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x2f3640, flatShading: true });
    const sludgeMat = new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.85 });
    const poster1Tex = Textures.createCampaignPoster1();
    const poster2Tex = Textures.createCampaignPoster2();

    const numPosts = 36;
    for (let i = 0; i < numPosts; i++) {
      const angle = (i / numPosts) * Math.PI * 2;
      const nextAngle = ((i + 1) / numPosts) * Math.PI * 2;
      const r = this.swampRadius;

      const px = Math.sin(angle) * r;
      const pz = Math.cos(angle) * r;
      const npx = Math.sin(nextAngle) * r;
      const npz = Math.cos(nextAngle) * r;

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 3.8, 6), postMat);
      post.position.set(px, 0.9, pz);
      this.scene.add(post);

      const midX = (px + npx) * 0.5;
      const midZ = (pz + npz) * 0.5;
      const segLen = Math.hypot(npx - px, npz - pz);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.6, 0.2), beamMat);
      beam.position.set(midX, 1.6, midZ);
      beam.rotation.y = Math.atan2(npx - px, npz - pz) - Math.PI / 2;
      this.scene.add(beam);

      if (i % 4 === 0) {
        const posterMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 2.1, 0.08),
          new THREE.MeshLambertMaterial({ map: (i % 8 === 0) ? poster1Tex : poster2Tex, flatShading: true })
        );
        posterMesh.position.set(midX * 0.98, 1.8, midZ * 0.98);
        posterMesh.rotation.y = Math.atan2(npx - px, npz - pz) - Math.PI / 2;
        this.scene.add(posterMesh);
      }

      if (i % 2 === 0) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 1.6, 8), barrelMat);
        barrel.position.set(px * 0.96, 0.2, pz * 0.96);
        if (i % 4 === 0) {
          barrel.rotation.z = Math.PI / 3;
          barrel.position.y = -0.15;
        }
        this.scene.add(barrel);

        const sludge = new THREE.Mesh(new THREE.CircleGeometry(1.6 + (i % 3) * 0.4, 8), sludgeMat);
        sludge.rotation.x = -Math.PI / 2;
        sludge.position.set(px * 0.94, -0.55, pz * 0.94);
        this.scene.add(sludge);
      }
    }
  }

  buildPatoLemusBillboard() {
    const billboardGroup = new THREE.Group();
    billboardGroup.position.set(-28, 0, 38);
    billboardGroup.rotation.y = 0.35;

    const woodPillarMat = new THREE.MeshLambertMaterial({ color: 0x5d4037, flatShading: true });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d, flatShading: true });

    [-6.2, 6.2].forEach(x => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 12, 6), woodPillarMat);
      pillar.position.set(x, 5.0, -0.2);
      billboardGroup.add(pillar);
    });

    const strut = new THREE.Mesh(new THREE.BoxGeometry(13, 0.3, 0.2), metalMat);
    strut.position.set(0, 3.5, -0.3);
    billboardGroup.add(strut);

    const boardGeo = new THREE.BoxGeometry(13.5, 6.8, 0.35);
    const billboardTex = Textures.createBillboardTexture();
    const boardMat = new THREE.MeshLambertMaterial({
      map: billboardTex,
      flatShading: true
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 7.5, 0);
    billboardGroup.add(board);

    [-4.5, 0, 4.5].forEach(x => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.8), metalMat);
      lamp.position.set(x, 11.2, 0.5);
      lamp.rotation.x = 0.4;
      billboardGroup.add(lamp);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffeaa7 }));
      bulb.position.set(x, 11.1, 0.8);
      billboardGroup.add(bulb);
    });

    this.scene.add(billboardGroup);
  }

  buildPatoLemusCampaignPodium() {
    const podiumGroup = new THREE.Group();
    podiumGroup.position.set(-18, 0, 48);
    podiumGroup.rotation.y = -0.25;

    const woodPlankMat = new THREE.MeshLambertMaterial({ color: 0xa0522d, flatShading: true });
    const orangeClothMat = new THREE.MeshLambertMaterial({ color: 0xff6b00, flatShading: true });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xf1c40f, flatShading: true });
    const darkSuitMat = new THREE.MeshLambertMaterial({ color: 0x2d3436, flatShading: true });

    const stage = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 4.2), woodPlankMat);
    stage.position.y = 0.25;
    podiumGroup.add(stage);

    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 1.2), woodPlankMat);
    step.position.set(0, 0.12, 2.3);
    podiumGroup.add(step);

    // Alfombra naranja de campaña
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 4.2), orangeClothMat);
    carpet.position.set(0, 0.52, 0);
    podiumGroup.add(carpet);

    const lectern = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), woodPlankMat);
    lectern.position.set(0, 1.3, 0.8);
    podiumGroup.add(lectern);

    const lecternPlaque = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.6, 0.05),
      new THREE.MeshLambertMaterial({ map: Textures.createCampaignPoster1(), flatShading: true })
    );
    lecternPlaque.position.set(0, 1.45, 1.23);
    podiumGroup.add(lecternPlaque);

    [-0.22, 0.22].forEach(x => {
      const micPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 4), goldMat);
      micPole.position.set(x, 2.2, 1.0);
      micPole.rotation.x = 0.3;
      podiumGroup.add(micPole);

      const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), darkSuitMat);
      micHead.position.set(x, 2.4, 1.12);
      podiumGroup.add(micHead);
    });

    [-2.8, 2.8].forEach(x => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.5, 6), darkSuitMat);
      pole.position.set(x, 2.25, 0);
      podiumGroup.add(pole);

      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 8), goldMat);
      horn.position.set(x, 4.2, 0.2);
      horn.rotation.x = Math.PI / 2;
      horn.rotation.y = (x < 0) ? 0.3 : -0.3;
      podiumGroup.add(horn);
    });

    // Figura 3D oficial del Gobernador Pato Lemus (con su chaleco naranja y tupé pelirrojo) en el podio
    const standeePato = createPatoLemusModel();
    standeePato.mesh.position.set(0, 0.52, -0.35);
    standeePato.mesh.scale.set(0.88, 0.88, 0.88);
    podiumGroup.add(standeePato.mesh);

    const backdrop = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 3.2, 0.12),
      new THREE.MeshLambertMaterial({ map: Textures.createCampaignPoster2(), flatShading: true })
    );
    backdrop.position.set(0, 2.2, -1.8);
    podiumGroup.add(backdrop);

    this.scene.add(podiumGroup);
  }

  buildToxicDrainageEasterEgg() {
    const toxicGroup = new THREE.Group();
    toxicGroup.position.set(-44, 0, -28);

    const concreteMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a, flatShading: true });
    const metalMat = new THREE.MeshLambertMaterial({ map: Textures.createHazardMetal(), flatShading: true });
    const toxicSludgeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.9 });
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x1e272e, flatShading: true });

    const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 2.2), concreteMat);
    wall.position.set(0, 2.2, 0);
    toxicGroup.add(wall);

    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 5.0, 10), metalMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(0, 1.8, 2.2);
    toxicGroup.add(pipe);

    const flowGeo = new THREE.CylinderGeometry(1.1, 1.35, 2.8, 8);
    const flow = new THREE.Mesh(flowGeo, toxicSludgeMat);
    flow.position.set(0, 0.2, 4.4);
    flow.rotation.x = 0.25;
    toxicGroup.add(flow);

    const acidPool = new THREE.Mesh(new THREE.CircleGeometry(7.8, 16), toxicSludgeMat);
    acidPool.rotation.x = -Math.PI / 2;
    acidPool.position.set(0, -0.52, 6.0);
    toxicGroup.add(acidPool);

    [
      { x: -3.2, z: 5.5, rotZ: 0.4 },
      { x: 3.5, z: 6.8, rotZ: -0.6 },
      { x: 1.2, z: 8.5, rotZ: 1.1 },
      { x: -2.0, z: 8.0, rotZ: -0.3 }
    ].forEach(b => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.5, 8), barrelMat);
      barrel.position.set(b.x, -0.3, b.z);
      barrel.rotation.z = b.rotZ;
      toxicGroup.add(barrel);
    });

    const signPolesMat = new THREE.MeshLambertMaterial({ color: 0x57606f, flatShading: true });
    [-2.2, 2.2].forEach(x => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), signPolesMat);
      pole.position.set(x, 1.3, 10.5);
      toxicGroup.add(pole);
    });

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 2.8, 0.15),
      new THREE.MeshLambertMaterial({ map: Textures.createToxicWaterSign(), flatShading: true })
    );
    signBoard.position.set(0, 2.4, 10.5);
    toxicGroup.add(signBoard);

    this.scene.add(toxicGroup);
  }

  spawnNPCs() {
    this.npcs.push(new NPC(this.scene, {
      type: 'squirrel',
      name: 'CHIPPY LA ARDILLA',
      dialogue: '¡Cuidado, Froggy! ¡El Gobernador Pato Lemus mandó estos Talabots pequeños a talar nuestras casas! ¡Dales patadas con tus patas traseras [F / Clic Derecho / E] y sube a la cima para destruir la Antena Central que los controla!',
      liberatedDialogue: '¡SÍÍÍ! ¡Destruiste la Antena Central de Pato Lemus y todos los Talabots pequeños explotaron! ¡El Árbol Sagrado está a salvo!',
      position: new THREE.Vector3(16.0, 0.5, 25.0),
      rotationY: -0.8
    }));

    this.npcs.push(new NPC(this.scene, {
      type: 'turtle',
      name: 'DON CAPARAZÓN',
      dialogue: '¡Toma esto, chatarra de TALACORP! Llevo 120 años en este pantano y ningún pato con chaleco naranja me va a desalojar. ¡Ayúdame a patear a estos robots y rompe la Antena en la cima del tronco!',
      liberatedDialogue: '¡Jajaja! ¡Mira cómo echan chispas esas hojalatas! ¡Les diste una cátedra de patadas de rana, jovencito!',
      position: new THREE.Vector3(-34.0, -0.5, 44.0),
      rotationY: 0.45
    }));

    this.npcs.push(new NPC(this.scene, {
      type: 'opossum',
      name: 'PEPE LA ZARIGÜEYA',
      dialogue: '¡Estos Talabots pequeños tienen una antena en la cabeza! Si los pateas sueltan monedas de oro, pero mientras la Antena Central en la cima del árbol siga encendida, ¡se vuelven a levantar!',
      liberatedDialogue: '¡Ya no reciben señal de la cima! ¡Gracias a tus patadas recuperamos nuestro campamento!',
      position: new THREE.Vector3(36.0, -0.5, -26.0),
      rotationY: 1.2
    }));

    this.npcs.push(new NPC(this.scene, {
      type: 'mutant_fish',
      name: 'BLINKY EL PEZ MUTANTE',
      dialogue: '¡Glub, glub! ¡Pato Lemus vino con su chaleco naranja a decir que este lodo radiactivo es "agua estilo Jalisco"! ¡Patea a este robot que me quiere pescar!',
      liberatedDialogue: '¡Glub, hurra! ¡Los Talabots cayeron al agua hechos pedazos!',
      position: new THREE.Vector3(-42.0, -0.6, -24.0),
      rotationY: 0.8
    }));
  }

  spawnMiniTalabots() {
    // Escuadrón de Mini-Talabots abajo del árbol peleando con cada NPC y patrullando la base
    const chippy = this.npcs[0];
    const donCaparazon = this.npcs[1];
    const pepe = this.npcs[2];
    const blinky = this.npcs[3];

    const spawns = [
      // 1. Dos cerca de la base frontal y de Chippy la ardilla (para pelear enseguida)
      { pos: new THREE.Vector3(6.5, -0.4, 21.5), npc: chippy },
      { pos: new THREE.Vector3(14.5, -0.4, 22.8), npc: chippy },
      // 2. Guardia en el costado izquierdo de la base del Gran Tronco
      { pos: new THREE.Vector3(-8.5, -0.4, 20.5), npc: null },
      // 3. Peleando con Don Caparazón frente al podio de Pato Lemus
      { pos: new THREE.Vector3(-31.5, -0.4, 42.5), npc: donCaparazon },
      // 4. Peleando con Pepe la Zarigüeya
      { pos: new THREE.Vector3(33.5, -0.4, -24.5), npc: pepe },
      // 5. Peleando con Blinky el Pez Mutante
      { pos: new THREE.Vector3(-39.5, -0.4, -22.5), npc: blinky }
    ];

    spawns.forEach(cfg => {
      const bot = new MiniTalabot(this.scene, cfg.pos, cfg.npc, this.particles);
      this.miniTalabots.push(bot);
    });
  }

  buildSummitAntenna() {
    // Antena Central de Control TALACORP en el extremo norte de la cima del árbol
    const antennaPos = new THREE.Vector3(0, this.trunkHeight + 0.9, -7.8);
    this.antenna = new TalacorpAntenna(this.scene, antennaPos, this.particles, () => {
      // Al destruir la Antena Central, todos los Mini-Talabots de abajo entran en cortocircuito definitivo
      this.shutDownAllMiniTalabots();
    });
  }

  shutDownAllMiniTalabots() {
    this.miniTalabots.forEach(bot => bot.shutDownPermanently());
    this.npcs.forEach(npc => {
      npc.celebrating = true;
    });
  }

  spawnCoins() {
    const coinPositions = [
      new THREE.Vector3(0, 0.2, 19.5),
      new THREE.Vector3(2.8, 0.2, 21.0),
      new THREE.Vector3(-2.8, 0.2, 21.0),
      new THREE.Vector3(0, 0.2, 24.0),

      // Zona de Chippy la ardilla
      new THREE.Vector3(12.0, 0.2, 22.0),
      new THREE.Vector3(14.0, 0.2, 21.5),
      new THREE.Vector3(18.0, 0.2, 24.0),

      // Complejo Político Pato Lemus
      new THREE.Vector3(-22.0, 0.2, 34.0),
      new THREE.Vector3(-24.0, 0.2, 36.0),
      new THREE.Vector3(-18.0, 0.6, 46.5),
      new THREE.Vector3(-18.0, 0.6, 49.5),
      new THREE.Vector3(-34.0, 0.2, 42.0),

      // Zona de Contaminación Hídrica & Blinky
      new THREE.Vector3(-40.0, 0.2, -20.0),
      new THREE.Vector3(-42.0, 0.2, -22.0),
      new THREE.Vector3(-44.0, 0.2, -25.0),

      // Zona de Pepe la Zarigüeya
      new THREE.Vector3(34.0, 0.2, -25.0),
      new THREE.Vector3(36.0, 0.2, -27.0),
      new THREE.Vector3(38.0, 0.2, -30.0),

      // En plataformas del tronco del árbol (ascenso de 56m)
      this.trunkPoint(-18, 4.9, 1.6),
      this.trunkPoint(-38, 8.1, 1.6),
      this.trunkPoint(-58, 11.5, 1.6),
      this.trunkPoint(-108, 18.8, 2.0),
      this.trunkPoint(-175, 27.0, 1.7),
      this.trunkPoint(112, 34.8, 1.7),
      this.trunkPoint(82, 38.3, 2.0),
      this.trunkPoint(16, 50.6, 1.7)
    ];

    coinPositions.forEach(pos => {
      this.coins.push(new Coin(this.scene, pos));
    });
  }

  buildTestPortals() {
    // 1. Portal en la BASE (junto al hongo de inicio en x=5.6, z=16.5)
    const basePortalPos = new THREE.Vector3(5.6, 1.2, 16.5);
    const summitDestPos = new THREE.Vector3(0, this.trunkHeight + 1.2, 7.5);
    const basePortal = new TestPortal(
      this.scene,
      basePortalPos,
      summitDestPos,
      'PORTAL CIMA 🚀',
      0x9b59b6
    );
    this.portals.push(basePortal);
    this.platforms.push(createCylinderPlatform(basePortal.padMesh, 1.6, 0.3));

    // 2. Portal en la CIMA (en el perímetro de la arena amplia para volver a la base)
    const summitPortalPos = new THREE.Vector3(8.5, this.trunkHeight + 0.9, 5.2);
    const baseDestPos = new THREE.Vector3(0, 1.8, 16.5);
    const summitPortal = new TestPortal(
      this.scene,
      summitPortalPos,
      baseDestPos,
      'PORTAL BASE 🍄',
      0x00ff88
    );
    this.portals.push(summitPortal);
    this.platforms.push(createCylinderPlatform(summitPortal.padMesh, 1.6, 0.3));
  }

  update(dt, frog, hud = null, input = null) {
    this.forestArt?.update(dt);
    this.tiltingLeaves.forEach(leaf => leaf.update(dt));
    this.hangingPlatforms.forEach(p => p.update(dt));
    this.anchors.forEach(a => a.update(dt));

    if (this.antenna) {
      this.antenna.update(dt);
    }

    this.portals.forEach(portal => {
      portal.update(dt, frog, frog.particles);
    });

    this.bugs.forEach(bug => {
      if (bug.type === 'fly') bug.update(dt);
      else if (bug.type === 'beetle') bug.update(dt, frog.position);
      else if (bug.type === 'wasp') bug.update(dt, frog);
    });

    this.coins.forEach(c => c.update(dt, frog));
    this.miniTalabots.forEach(bot => bot.update(dt, frog));
    this.npcs.forEach(n => n.update(dt, frog, hud, this.miniTalabots));

    // Interacción con NPCs al pulsar tecla E (Tongue)
    if (input && input.keys.tonguePressed) {
      const nearNpc = this.npcs.find(n => n.isNear);
      if (nearNpc && hud && hud.dialogueBox.style.display !== 'flex') {
        nearNpc.interact(hud);
      }
    }

    // Delimitación perimetral del pantano
    if (frog.position.y < 3.5) {
      const dist = Math.hypot(frog.position.x, frog.position.z);
      if (dist > this.swampRadius) {
        const nx = frog.position.x / dist;
        const nz = frog.position.z / dist;
        frog.position.x = nx * this.swampRadius;
        frog.position.z = nz * this.swampRadius;
        if (frog.velocity.x * nx + frog.velocity.z * nz > 0) {
          frog.velocity.x = -nx * 7.0;
          frog.velocity.z = -nz * 7.0;
        }
        if (frog.particles) {
          frog.particles.spawnDustPuff(frog.position, 8, 0xf1c40f);
        }
      }
    }

    this.checkpoints.forEach(cp => {
      if (frog.position.distanceTo(cp) < 3.6 && cp.y > frog.lastCheckpoint.y + 1) {
        frog.setCheckpoint(cp);
      }
    });
  }
}
