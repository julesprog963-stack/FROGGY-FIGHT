import * as THREE from 'three';

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
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x111111, flatShading: true });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.mesh.add(this.body);

    // Ojos rojos estilo mosca cartoon N64
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    [-0.1, 0.1].forEach(x => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), eyeMat);
      eye.position.set(x, 0.1, 0.15);
      this.mesh.add(eye);
    });

    // Alas translúcidas que aletean rápido
    this.wings = [];
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xecf0f1, transparent: true, opacity: 0.75 });
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

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = Math.cos(this.time) * 1.5;

    // Aleteo supersónico
    const wingFlap = Math.sin(this.time * 25) * 0.6;
    if (this.wings[0]) this.wings[0].rotation.z = wingFlap;
    if (this.wings[1]) this.wings[1].rotation.z = -wingFlap;
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

    this.mesh.position.copy(this.position);
    // Tambaleo cómico al correr
    this.mesh.rotation.z = Math.sin(Date.now() * 0.02) * (this.isFleeing ? 0.3 : 0.1);
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

    this.mesh = new THREE.Group();
    this.createModel();
    this.scene.add(this.mesh);
  }

  createModel() {
    // Franjas de peligro amarillo/negro en el aguijón
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf39c12, flatShading: true });
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111, flatShading: true });

    const abdo = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 5), bodyMat);
    abdo.rotation.x = -Math.PI / 2.3;
    abdo.position.set(0, 0, -0.2);
    this.mesh.add(abdo);

    const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 4), blackMat);
    stinger.rotation.x = Math.PI / 2;
    stinger.position.set(0, -0.05, -0.55);
    this.mesh.add(stinger);

    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.2, 5, 5), blackMat);
    thorax.position.set(0, 0, 0.1);
    this.mesh.add(thorax);

    // Ojos morados malvados
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x9b59b6 });
    [-0.1, 0.1].forEach(x => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), eyeMat);
      eye.position.set(x, 0.1, 0.22);
      this.mesh.add(eye);
    });
  }

  update(dt, frog) {
    if (!this.alive) {
      this.mesh.visible = false;
      return;
    }
    this.time += dt * 2.5;

    const distToFrog = this.position.distanceTo(frog.position);

    if (distToFrog < 6.0 && this.chargeCooldown <= 0) {
      // Embiste a la rana
      const chargeDir = frog.position.clone().sub(this.position).normalize();
      this.position.add(chargeDir.multiplyScalar(6.5 * dt));
      this.mesh.lookAt(frog.position);

      if (distToFrog < 1.2 && frog.invulnerableTimer <= 0) {
        // Pica a la rana y la empuja
        frog.velocity.add(chargeDir.multiplyScalar(14));
        frog.respawnAtCheckpoint();
        this.chargeCooldown = 3.0;
      }
    } else {
      if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
      // Patrulla circular sobre el abismo
      this.position.x = this.center.x + Math.cos(this.time) * 3.5;
      this.position.y = this.center.y + Math.sin(this.time * 2) * 0.7;
      this.position.z = this.center.z + Math.sin(this.time) * 3.5;
      this.mesh.rotation.y = -this.time + Math.PI / 2;
    }

    this.mesh.position.copy(this.position);
  }
}
