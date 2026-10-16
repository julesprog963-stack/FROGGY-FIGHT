import * as THREE from 'three';
import { TRUNK_CONFIG } from './ps2-art.js';

// 1. Mosca de pantano: vuela en patrón de ocho
export class SwampFly {
  constructor(scene, centerPos) {
    this.scene = scene;
    this.center = centerPos.clone();
    this.position = centerPos.clone();
    this.type = 'fly';
    this.alive = true;
    this.time = Math.random() * 10;

    this.mesh = new THREE.Group();
    this.createModel();
    this.scene.add(this.mesh);
  }

  createModel() {
    // Cuerpo negro rechoncho low-poly
    const bodyGeo = new THREE.DodecahedronGeometry(0.2, 0);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x284b49, flatShading: true });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.mesh.add(this.body);

    // Ojos rojos estilo mosca cartoon N64
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    [-0.1, 0.1].forEach(x => {
      const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(0.065, 0), eyeMat);
      eye.position.set(x, 0.1, 0.15);
      this.mesh.add(eye);
    });

    // Alas translúcidas que aletean rápido
    this.wings = [];
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xbbe8df, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    [-0.16, 0.16].forEach(x => {
      const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), wingMat);
      wing.position.set(x, 0.15, 0);
      wing.rotation.x = Math.PI / 2;
      this.mesh.add(wing);
      this.wings.push(wing);
    });
  }

  update(dt) {
    if (!this.alive) {
      this.mesh.visible = false;
      return;
    }
    this.time += dt * 3.5;
    // Patrón de vuelo en figura 8
    const rX = 2.2;
    const rZ = 1.4;
    this.position.x = this.center.x + Math.sin(this.time) * rX;
    this.position.y = this.center.y + Math.sin(this.time * 2) * 0.4;
    this.position.z = this.center.z + Math.sin(this.time * 2) * rZ;

    this.handleTrunkCollision();

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = Math.cos(this.time) * 1.5;

    // Aleteo supersónico
    const wingFlap = Math.sin(this.time * 25) * 0.6;
    if (this.wings[0]) this.wings[0].rotation.z = wingFlap;
    if (this.wings[1]) this.wings[1].rotation.z = -wingFlap;
  }

  handleTrunkCollision() {
    if (this.position.y < TRUNK_CONFIG.height + 0.8) {
      const trunkRadius = TRUNK_CONFIG.getRadiusAtY(this.position.y);
      const minDistance = trunkRadius + 0.55; // Margen de seguridad para que la mosca nunca penetre la corteza
      const distXZ = Math.hypot(this.position.x, this.position.z);
      if (distXZ < minDistance && distXZ > 0.001) {
        const nx = this.position.x / distXZ;
        const nz = this.position.z / distXZ;
        this.position.x = nx * minDistance;
        this.position.z = nz * minDistance;
      }
    }
  }
}

// 2. Escarabajo de corteza: camina y huye si la rana se acerca a pie
export class BarkBeetle {
  constructor(scene, startPos, walkRadius = 2.5) {
    this.scene = scene;
    this.center = startPos.clone();
    this.position = startPos.clone();
    this.type = 'beetle';
    this.alive = true;
    this.walkRadius = walkRadius;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 1.5;
    this.isFleeing = false;

    this.mesh = new THREE.Group();
    this.createModel();
    this.scene.add(this.mesh);
  }

  createModel() {
    // Caparazón brillante verde/dorado metálico
    const shellGeo = new THREE.SphereGeometry(0.25, 5, 4);
    shellGeo.scale(1, 0.6, 1.3);
    const shellMat = new THREE.MeshLambertMaterial({ color: 0x00b894, flatShading: true });
    this.mesh.add(new THREE.Mesh(shellGeo, shellMat));

    // Cabeza y patitas
    const headMat = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.18), headMat);
    head.position.set(0, 0, 0.35);
    this.mesh.add(head);

    // Ojos amarillos
    [-0.08, 0.08].forEach(x => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xf1c40f }));
      eye.position.set(x, 0.08, 0.42);
      this.mesh.add(eye);
    });
  }

  update(dt, frogPos) {
    if (!this.alive) {
      this.mesh.visible = false;
      return;
    }

    // Detectar si la rana se acerca demasiado (huye!)
    const distToFrog = this.position.distanceTo(frogPos);
    if (distToFrog < 4.5) {
      this.isFleeing = true;
      this.speed = 4.2; // corre despavorido
      // Orientarse en dirección contraria a la rana
      const fleeDir = this.position.clone().sub(frogPos).setY(0).normalize();
      this.position.add(fleeDir.multiplyScalar(this.speed * dt));
      this.mesh.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);
    } else {
      this.isFleeing = false;
      this.speed = 1.5;
      this.angle += dt * 0.8;
      this.position.x = this.center.x + Math.cos(this.angle) * this.walkRadius;
      this.position.z = this.center.z + Math.sin(this.angle) * this.walkRadius;
      this.mesh.rotation.y = -this.angle + Math.PI / 2;
    }

    this.handleTrunkCollision();
    this.mesh.position.copy(this.position);
    // Tambaleo cómico al correr
    this.mesh.rotation.z = Math.sin(Date.now() * 0.02) * (this.isFleeing ? 0.3 : 0.1);
  }

  handleTrunkCollision() {
    if (this.position.y < TRUNK_CONFIG.height + 0.5) {
      const trunkRadius = TRUNK_CONFIG.getRadiusAtY(this.position.y);
      const minDistance = trunkRadius + 0.45;
      const distXZ = Math.hypot(this.position.x, this.position.z);
      if (distXZ < minDistance && distXZ > 0.001) {
        const nx = this.position.x / distXZ;
        const nz = this.position.z / distXZ;
        this.position.x = nx * minDistance;
        this.position.z = nz * minDistance;
      }
    }
  }
}

// 3. Avispa patrullera TALACORP: peligrosa pero sabrosa
export class PatrolWasp {
  constructor(scene, centerPos) {
    this.scene = scene;
    this.center = centerPos.clone();
    this.position = centerPos.clone();
    this.type = 'wasp';
    this.alive = true;
    this.time = Math.random() * 10;
    this.state = 'patrol'; // 'patrol' | 'charging'
    this.chargeCooldown = 0;

    this.leftWing = null;
    this.rightWing = null;
    this.glowLight = null;

    this.mesh = new THREE.Group();
    this.createModel();
    this.scene.add(this.mesh);
  }

  createModel() {
    // Franjas de peligro amarillo/negro en el aguijón
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf39c12, flatShading: true });
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x284b49, flatShading: true });

    const abdo = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.65, 5), bodyMat);
    abdo.rotation.x = -Math.PI / 2.3;
    abdo.position.set(0, 0, -0.2);
    this.mesh.add(abdo);

    const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 4), blackMat);
    stinger.rotation.x = Math.PI / 2;
    stinger.position.set(0, -0.05, -0.58);
    this.mesh.add(stinger);

    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.22, 5, 5), blackMat);
    thorax.position.set(0, 0, 0.1);
    this.mesh.add(thorax);

    // Ojos morados malvados
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x9b59b6 });
    [-0.1, 0.1].forEach(x => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.09), eyeMat);
      eye.position.set(x, 0.1, 0.22);
      this.mesh.add(eye);
    });

    // Alas translúcidas que aletean a alta velocidad
    const wingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const wingGeo = new THREE.PlaneGeometry(0.38, 0.2);
    wingGeo.rotateX(Math.PI / 2);

    this.leftWing = new THREE.Mesh(wingGeo, wingMat);
    this.leftWing.position.set(-0.24, 0.12, 0);
    this.mesh.add(this.leftWing);

    this.rightWing = new THREE.Mesh(wingGeo, wingMat);
    this.rightWing.position.set(0.24, 0.12, 0);
    this.mesh.add(this.rightWing);

    // Luz de advertencia ámbar para resaltar su presencia en la niebla del bosque
    this.glowLight = new THREE.PointLight(0xff9f1a, 1.2, 5.5);
    this.glowLight.position.set(0, 0, -0.15);
    this.mesh.add(this.glowLight);
  }

  hasLineOfSight(targetPos) {
    // Comprueba si el cilindro del tronco se interpone entre la avispa y el objetivo
    const avgY = (this.position.y + targetPos.y) * 0.5;
    if (avgY >= TRUNK_CONFIG.height + 0.5) return true; // Por encima de la copa del árbol
    const trunkRadius = TRUNK_CONFIG.getRadiusAtY(avgY);

    const x1 = this.position.x, z1 = this.position.z;
    const x2 = targetPos.x, z2 = targetPos.z;
    const dx = x2 - x1, dz = z2 - z1;
    const lenSq = dx * dx + dz * dz;
    if (lenSq < 0.001) return true;

    // Distancia perpendicular mínima desde el centro del tronco (0, 0) al segmento P1->P2
    const proj = -(x1 * dx + z1 * dz) / lenSq;
    const clampedT = Math.min(Math.max(proj, 0), 1.0);
    const closestX = x1 + clampedT * dx;
    const closestZ = z1 + clampedT * dz;
    const distSq = closestX * closestX + closestZ * closestZ;

    // Si el rayo pasa a menor distancia que el tronco, el árbol bloquea la visión
    return distSq >= (trunkRadius * trunkRadius);
  }

  handleTrunkCollision() {
    if (this.position.y < TRUNK_CONFIG.height + 0.8) {
      const trunkRadius = TRUNK_CONFIG.getRadiusAtY(this.position.y);
      const minDistance = trunkRadius + 0.65; // Margen de seguridad para que la avispa nunca penetre el tronco
      const distXZ = Math.hypot(this.position.x, this.position.z);
      if (distXZ < minDistance && distXZ > 0.001) {
        const nx = this.position.x / distXZ;
        const nz = this.position.z / distXZ;
        this.position.x = nx * minDistance;
        this.position.z = nz * minDistance;
      }
    }
  }

  update(dt, frog) {
    if (!this.alive) {
      this.mesh.visible = false;
      return;
    }
    this.time += dt * 2.5;

    // Aleteo rápido de alas
    const flutter = Math.sin(this.time * 42) * 0.45;
    if (this.leftWing) this.leftWing.rotation.z = flutter;
    if (this.rightWing) this.rightWing.rotation.z = -flutter;

    const distToFrog = this.position.distanceTo(frog.position);
    const canSeeFrog = this.hasLineOfSight(frog.position);

    if (distToFrog < 7.0 && this.chargeCooldown <= 0 && canSeeFrog) {
      // Embiste a la rana en línea recta pero deslizando por la corteza si colisiona
      const chargeDir = frog.position.clone().sub(this.position).normalize();
      this.position.add(chargeDir.multiplyScalar(6.8 * dt));
      this.handleTrunkCollision();
      this.mesh.lookAt(frog.position);

      if (distToFrog < 1.3 && frog.invulnerableTimer <= 0) {
        // Pica a la rana: pierde vida y tiene i-frames pero se queda en su lugar (solo vuelve al checkpoint si muere)
        const hitDir = frog.position.clone().sub(this.position).normalize();
        if (frog.takeHit) {
          frog.takeHit(hitDir);
        } else {
          frog.respawnAtCheckpoint();
        }
        this.chargeCooldown = 2.5;
      }
    } else {
      if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
      // Patrulla circular en órbita alrededor de su punto exterior
      this.position.x = this.center.x + Math.cos(this.time) * 2.8;
      this.position.y = this.center.y + Math.sin(this.time * 2) * 0.6;
      this.position.z = this.center.z + Math.sin(this.time) * 2.8;
      this.handleTrunkCollision();
      this.mesh.rotation.y = -this.time + Math.PI / 2;
    }

    this.mesh.position.copy(this.position);
  }
}
