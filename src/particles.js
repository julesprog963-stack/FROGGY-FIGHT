import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // Geometrías reutilizables low-poly estilo N64
    this.sphereGeo = new THREE.DodecahedronGeometry(0.18, 0);
    this.cubeGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    this.ringGeo = new THREE.RingGeometry(0.2, 0.5, 8);
    this.ringGeo.rotateX(-Math.PI / 2);

    // Materiales
    this.dustMat = new THREE.MeshBasicMaterial({ color: 0xecf0f1, transparent: true, opacity: 0.85 });
    this.smokeMat = new THREE.MeshBasicMaterial({ color: 0x636e72, transparent: true, opacity: 0.8 });
    this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    this.slimeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.9 });
    this.waterMat = new THREE.MeshBasicMaterial({ color: 0x74b9ff, transparent: true, opacity: 0.7 });

    // Luciérnagas ambientales del pantano
    this.fireflies = [];
    this.initFireflies();
  }

  initFireflies() {
    const ffMat = new THREE.MeshBasicMaterial({ color: 0xa8ff78 });
    for (let i = 0; i < 35; i++) {
      const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), ffMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 18;
      const y = 1 + Math.random() * 22;
      mesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      mesh.userData = {
        baseY: y,
        speed: 0.5 + Math.random() * 0.8,
        angle: angle,
        radius: radius,
        offset: Math.random() * 10
      };
      this.scene.add(mesh);
      this.fireflies.push(mesh);
    }
  }

  // Nubes cómicas de polvo al saltar o aterrizar
  spawnDustPuff(position, count = 6, color = 0xecf0f1) {
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(this.sphereGeo, this.dustMat.clone());
      p.material.color.setHex(color);
      p.position.copy(position).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        0.1,
        (Math.random() - 0.5) * 0.6
      ));

      const angle = (i / count) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.0;
      p.userData = {
        vel: new THREE.Vector3(Math.cos(angle) * speed, 1.2 + Math.random() * 1.5, Math.sin(angle) * speed),
        life: 0.45,
        maxLife: 0.45,
        rotSpeed: (Math.random() - 0.5) * 8
      };
      this.scene.add(p);
      this.particles.push(p);
    }
  }

  // Chispas metálicas del jefe o impacto de lengua
  spawnSparks(position, count = 10) {
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(this.cubeGeo, this.sparkMat.clone());
      p.position.copy(position);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        2 + Math.random() * 6,
        (Math.random() - 0.5) * 7
      );
      p.userData = {
        vel: vel,
        life: 0.35,
        maxLife: 0.35,
        rotSpeed: (Math.random() - 0.5) * 15
      };
      this.scene.add(p);
      this.particles.push(p);
    }
  }

  // Ondas de choque en el suelo
  spawnShockwave(position, color = 0xfffae6) {
    const ringMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(this.ringGeo, ringMat);
    ring.position.copy(position).add(new THREE.Vector3(0, 0.05, 0));
    ring.userData = {
      life: 0.5,
      maxLife: 0.5,
      scaleSpeed: 14.0
    };
    this.scene.add(ring);
    this.particles.push(ring);
  }

  update(dt) {
    // 1. Actualizar luciérnagas
    const t = Date.now() * 0.001;
    this.fireflies.forEach(ff => {
      const data = ff.userData;
      data.angle += dt * 0.35 * data.speed;
      ff.position.x = Math.cos(data.angle) * data.radius;
      ff.position.z = Math.sin(data.angle) * data.radius;
      ff.position.y = data.baseY + Math.sin(t * data.speed + data.offset) * 0.8;
      const pulse = 0.5 + Math.sin(t * 3 + data.offset) * 0.5;
      ff.scale.setScalar(0.7 + pulse * 0.5);
    });

    // 2. Actualizar partículas efímeras
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const data = p.userData;
      data.life -= dt;

      if (data.life <= 0) {
        this.scene.remove(p);
        p.geometry.dispose?.();
        p.material.dispose?.();
        this.particles.splice(i, 1);
        continue;
      }

      const progress = 1 - (data.life / data.maxLife);

      if (data.vel) {
        p.position.add(data.vel.clone().multiplyScalar(dt));
        data.vel.y -= 12 * dt; // gravedad
        if (data.rotSpeed) {
          p.rotation.x += data.rotSpeed * dt;
          p.rotation.y += data.rotSpeed * dt;
        }
        p.scale.setScalar(Math.max(0.1, 1 - progress * 0.7));
      }

      if (data.scaleSpeed) {
        const s = 1 + progress * data.scaleSpeed;
        p.scale.set(s, 1, s);
      }

      if (p.material && p.material.opacity !== undefined) {
        p.material.opacity = Math.max(0, 1 - progress);
      }
    }
  }
}
