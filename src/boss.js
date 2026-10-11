import * as THREE from 'three';
import { Textures } from './textures.js';
import { audio } from './audio.js';

export class BossBugZapper {
  constructor(scene, arenaCenter = new THREE.Vector3(0, 38, 0), particles = null) {
    this.scene = scene;
    this.particles = particles;
    this.arenaCenter = arenaCenter.clone();
    this.position = arenaCenter.clone();
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // Estado de combate
    this.maxHp = 3;
    this.hp = 3;
    this.phase = 1;
    this.state = 'idle';
    this.timer = 0;
    this.isVulnerable = false;
    this.weakSpotPos = new THREE.Vector3();

    // Partes visuales estilo Conker / N64
    this.bodyMesh = null;
    this.screenEye = null;
    this.sirenMesh = null;
    this.sirenLight = null;
    this.leftEye = null;
    this.rightEye = null;
    this.smogPipes = [];
    this.buttonMesh = null;
    this.smogClouds = [];

    this.createModel();
    this.scene.add(this.mesh);
  }

  createModel() {
    const metalMat = new THREE.MeshLambertMaterial({
      map: Textures.createHazardMetal(),
      color: 0x888888,
      flatShading: true
    });
    const rustMat = new THREE.MeshLambertMaterial({ color: 0x5a3825, flatShading: true });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });

    // 1. Orugas de tanque pesadas
    [-1.25, 1.25].forEach(x => {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 3.3), darkMat);
      tread.position.set(x, 0.45, 0);
      this.mesh.add(tread);
    });

    // 2. Chasis del robot
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.6, 2.4);
    this.bodyMesh = new THREE.Mesh(bodyGeo, metalMat);
    this.bodyMesh.position.set(0, 1.4, 0);
    this.mesh.add(this.bodyMesh);

    // 3. Sirena de alarma giratoria en la parte delantera
    const sirenGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 6);
    this.sirenMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    this.sirenMesh = new THREE.Mesh(sirenGeo, this.sirenMat);
    this.sirenMesh.position.set(0, 2.3, 1.0);
    this.mesh.add(this.sirenMesh);

    // 4. Pantalla CRT con ojos malvados animados
    const screenGeo = new THREE.BoxGeometry(1.6, 0.9, 0.2);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x00b894 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.6, 1.22);
    this.mesh.add(screen);

    const eyeGeo = new THREE.BoxGeometry(0.35, 0.12, 0.05);
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xd63031 });
    this.leftEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.leftEye.position.set(-0.4, 1.65, 1.33);
    this.leftEye.rotation.z = -0.3;
    this.mesh.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.rightEye.position.set(0.4, 1.65, 1.33);
    this.rightEye.rotation.z = 0.3;
    this.mesh.add(this.rightEye);

    // 5. Chimeneas de fumigación con hollín
    [-0.7, 0.7].forEach(x => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 1.5, 6), rustMat);
      pipe.position.set(x, 2.7, -0.6);
      pipe.rotation.x = -0.3;
      this.mesh.add(pipe);
      this.smogPipes.push(pipe);
    });

    // 6. Botón rojo de "PARADA DE EMERGENCIA" / Núcleo débil en la cabeza
    const buttonBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.3, 8), darkMat);
    buttonBase.position.set(0, 2.3, 0);
    this.mesh.add(buttonBase);

    const buttonGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 8);
    this.buttonMat = new THREE.MeshBasicMaterial({ color: 0xd63031 });
    this.buttonMesh = new THREE.Mesh(buttonGeo, this.buttonMat);
    this.buttonMesh.position.set(0, 2.55, 0);
    this.mesh.add(this.buttonMesh);

    // Nubes de humo tóxico
    const smogGeo = new THREE.DodecahedronGeometry(0.8, 0);
    const smogMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Mesh(smogGeo, smogMat.clone());
      s.visible = false;
      this.scene.add(s);
      this.smogClouds.push(s);
    }
  }

  update(dt, frog, camera = null) {
    if (this.state === 'defeated') return;

    this.timer += dt;
    this.weakSpotPos.copy(this.mesh.position).add(new THREE.Vector3(0, 2.7, 0));

    // Giro de la sirena de alarma
    if (this.sirenMesh) {
      this.sirenMesh.rotation.y += dt * 8;
      const flash = Math.sin(this.timer * 12) > 0;
      this.sirenMat.color.setHex(flash ? 0xff4757 : 0x7f1d1d);
    }

    if (this.phase === 1) {
      this.updatePhase1(dt, frog);
    } else if (this.phase === 2) {
      this.updatePhase2(dt, frog);
    } else if (this.phase === 3) {
      this.updatePhase3(dt, frog, camera);
    }

    this.bodyMesh.position.y = 1.4 + Math.sin(this.timer * 30) * 0.05;

    // Colisión de pisotón de la rana sobre el botón
    if (this.isVulnerable) {
      const distToButton = frog.position.distanceTo(this.weakSpotPos);
      if (distToButton < 1.35 && frog.velocity.y < 0) {
        this.takeHit();
        frog.velocity.y = 17;
        if (camera) camera.addTrauma(0.5);
      }
    }
  }

  updatePhase1(dt, frog) {
    this.mesh.rotation.y += dt * 1.4;
    const sweepAngle = this.timer * 2.2;

    this.smogClouds.forEach((cloud, i) => {
      cloud.visible = true;
      const dist = 3.5 + (i % 4) * 1.5;
      const angle = sweepAngle + (i / 14) * Math.PI * 2;
      cloud.position.set(
        this.arenaCenter.x + Math.cos(angle) * dist,
        this.arenaCenter.y + 0.4 + Math.sin(this.timer * 5 + i) * 0.2,
        this.arenaCenter.z + Math.sin(angle) * dist
      );

      if (frog.position.distanceTo(cloud.position) < 1.25 && frog.invulnerableTimer <= 0) {
        frog.respawnAtCheckpoint();
      }
    });

    if (this.timer > 8.0) {
      this.setOverheated(true);
      if (this.timer > 12.0) {
        this.setOverheated(false);
        this.timer = 0;
      }
    }
  }

  updatePhase2(dt, frog) {
    this.mesh.lookAt(frog.position.x, this.mesh.position.y, frog.position.z);
    this.smogClouds.forEach(c => (c.visible = false));

    const cycleTime = this.timer % 9.0;
    if (cycleTime > 5.5) {
      this.setOverheated(true);
    } else {
      this.setOverheated(false);
      const toFrog = frog.position.clone().sub(this.mesh.position).setY(0).normalize();
      this.mesh.position.add(toFrog.multiplyScalar(dt * 3.6));
    }
  }

  updatePhase3(dt, frog, camera) {
    this.buttonMat.color.setHex(0xff0055);
    this.isVulnerable = true;

    this.mesh.rotation.y += dt * 4.2;
    this.mesh.position.x = this.arenaCenter.x + Math.sin(this.timer * 2.6) * 4.2;
    this.mesh.position.z = this.arenaCenter.z + Math.cos(this.timer * 2.6) * 4.2;

    this.smogClouds.forEach((cloud, i) => {
      cloud.visible = true;
      cloud.material.color.setHex(0xff4757);
      const angle = this.timer * 4.5 + i;
      cloud.position.set(
        this.mesh.position.x + Math.cos(angle) * 3,
        this.mesh.position.y + 0.6,
        this.mesh.position.z + Math.sin(angle) * 3
      );
      if (frog.position.distanceTo(cloud.position) < 1.15 && frog.invulnerableTimer <= 0) {
        frog.respawnAtCheckpoint();
      }
    });

    // Pisotones que hacen vibrar la cámara
    if (Math.sin(this.timer * 8) > 0.95 && camera) {
      camera.addTrauma(0.12);
      if (this.particles) {
        this.particles.spawnShockwave(this.mesh.position, 0xe74c3c);
      }
    }
  }

  setOverheated(val) {
    this.isVulnerable = val;
    if (val) {
      this.buttonMat.color.setHex(0xf1c40f);
      this.buttonMesh.scale.set(1.4, 1.4, 1.4);
      // Ojos en espiral/aturdidos
      if (this.leftEye) this.leftEye.rotation.z = Math.PI / 4;
      if (this.rightEye) this.rightEye.rotation.z = -Math.PI / 4;
    } else {
      this.buttonMat.color.setHex(0xd63031);
      this.buttonMesh.scale.set(1.0, 1.0, 1.0);
      if (this.leftEye) this.leftEye.rotation.z = -0.3;
      if (this.rightEye) this.rightEye.rotation.z = 0.3;
    }
  }

  takeHit() {
    if (!this.isVulnerable) return;
    this.hp--;
    audio.playBossHit();

    if (this.particles) {
      this.particles.spawnSparks(this.weakSpotPos, 20);
      this.particles.spawnShockwave(this.mesh.position, 0xf1c40f);
    }

    if (this.hp <= 0) {
      this.state = 'defeated';
      this.smogClouds.forEach(c => (c.visible = false));
      if (this.particles) {
        this.particles.spawnDustPuff(this.mesh.position, 25, 0xe74c3c);
        this.particles.spawnSparks(this.mesh.position, 30);
      }
      this.mesh.scale.set(0.1, 0.1, 0.1);
      this.mesh.visible = false;
      return;
    }

    this.phase = 4 - this.hp;
    this.timer = 0;
    this.setOverheated(false);
  }
}
