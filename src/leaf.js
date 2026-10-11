import * as THREE from 'three';
import { Textures } from './textures.js';
import { audio } from './audio.js';

// 1. Hoja inestable que se inclina con aviso visual (temblor + cambio de color) y sonoro
export class TiltingLeaf {
  constructor(scene, position, size = { w: 3.2, d: 2.8, h: 0.3 }, tiltDirection = 'outward') {
    this.scene = scene;
    this.position = position.clone();
    this.size = size;
    this.tiltDirection = tiltDirection;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // Estado del tilt
    this.state = 'idle'; // 'idle' | 'warning' | 'tilted' | 'recovering'
    this.timer = 0;
    this.warningDuration = 1.3; // 1.3 segundos de aviso claro
    this.tiltedDuration = 2.0;  // 2 segundos inclinada
    this.currentTilt = 0;
    this.maxTilt = Math.PI / 3.4; // ~52 grados de inclinación
    this.frogOnLeaf = false;

    this.leafMesh = null;
    this.stemMesh = null;
    this.material = null;

    this.createModel();
    this.scene.add(this.mesh);
  }

  createModel() {
    this.material = new THREE.MeshLambertMaterial({
      map: Textures.createLeafTexture(),
      color: 0x55efc4,
      flatShading: true
    });

    // Forma poligonal de hoja N64
    const shape = new THREE.Shape();
    shape.moveTo(0, -this.size.d * 0.5);
    shape.quadraticCurveTo(this.size.w * 0.55, 0, 0, this.size.d * 0.5);
    shape.quadraticCurveTo(-this.size.w * 0.55, 0, 0, -this.size.d * 0.5);

    const extrudeSettings = { depth: this.size.h, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.1, bevelThickness: 0.1 };
    const leafGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    leafGeo.rotateX(Math.PI / 2);
    leafGeo.center();

    this.leafMesh = new THREE.Mesh(leafGeo, this.material);
    this.mesh.add(this.leafMesh);

    // Tallo de soporte estilo soporte de cartón L de la maqueta
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x6e4726, flatShading: true });
    const stemGeo = new THREE.BoxGeometry(0.35, 0.35, 1.4);
    this.stemMesh = new THREE.Mesh(stemGeo, stemMat);
    this.stemMesh.position.set(0, -0.3, -this.size.d * 0.45);
    this.mesh.add(this.stemMesh);
  }

  onFrogStep(dt, frog) {
    this.frogOnLeaf = true;
    if (this.state === 'idle') {
      this.state = 'warning';
      this.timer = 0;
      audio.playLeafCreak();
    } else if (this.state === 'tilted') {
      // Fuerza de resbalón: empujar a la rana hacia el borde
      const slideDir = new THREE.Vector3(0, 0, 1);
      if (this.tiltDirection === 'left') slideDir.set(-1, 0, 0);
      else if (this.tiltDirection === 'right') slideDir.set(1, 0, 0);

      frog.velocity.x += slideDir.x * 22 * dt;
      frog.velocity.z += slideDir.z * 22 * dt;
    }
  }

  update(dt) {
    if (this.state === 'warning') {
      this.timer += dt;
      // 1. Temblor visible de aviso
      const shake = Math.sin(this.timer * 40) * 0.08;
      this.leafMesh.rotation.z = shake;

      // 2. Cambio de color de advertencia: verde -> amarillo -> naranja
      const ratio = this.timer / this.warningDuration;
      if (ratio > 0.6) {
        this.material.color.setHex(0xe17055); // naranja peligro
      } else {
        this.material.color.setHex(0xfdcb6e); // amarillo aviso
      }

      if (this.timer >= this.warningDuration) {
        this.state = 'tilted';
        this.timer = 0;
        audio.playLeafCreak();
      }
    } else if (this.state === 'tilted') {
      this.timer += dt;
      // Inclinar drásticamente la hoja
      this.currentTilt = THREE.MathUtils.lerp(this.currentTilt, this.maxTilt, dt * 8);
      this.leafMesh.rotation.x = this.currentTilt;
      this.leafMesh.rotation.z = 0;
      this.material.color.setHex(0xd63031); // rojo crítico

      if (this.timer >= this.tiltedDuration) {
        this.state = 'recovering';
        this.timer = 0;
      }
    } else if (this.state === 'recovering') {
      this.timer += dt;
      // Regresar suavemente a la horizontal
      this.currentTilt = THREE.MathUtils.lerp(this.currentTilt, 0, dt * 3.5);
      this.leafMesh.rotation.x = this.currentTilt;

      if (Math.abs(this.currentTilt) < 0.04) {
        this.currentTilt = 0;
        this.leafMesh.rotation.x = 0;
        this.state = 'idle';
        this.material.color.setHex(0x55efc4); // verde saludable
      }
    } else {
      // Estado idle: balanceo suave ambiental
      this.leafMesh.rotation.x = Math.sin(Date.now() * 0.002) * 0.03;
      this.leafMesh.rotation.z = 0;
      this.material.color.setHex(0x55efc4);
    }

    this.frogOnLeaf = false;
  }

  getBounds() {
    return new THREE.Box3().setFromObject(this.leafMesh);
  }
}

// 2. Plataforma escalonada fija con soporte L (fiel a la maqueta de cartón del usuario)
export class SteppingLPlatform {
  constructor(scene, position, size = { w: 2.4, d: 1.8, h: 0.35 }) {
    this.scene = scene;
    this.position = position.clone();
    this.size = size;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    const woodMat = new THREE.MeshLambertMaterial({
      map: Textures.createTreeBark(),
      color: 0xdfb48c,
      flatShading: true
    });

    // Plataforma horizontal
    const platGeo = new THREE.BoxGeometry(size.w, size.h, size.d);
    this.platMesh = new THREE.Mesh(platGeo, woodMat);
    this.mesh.add(this.platMesh);

    // Soporte vertical en forma de "L" anclado al tronco
    const bracketMat = new THREE.MeshLambertMaterial({ color: 0x8d5b32, flatShading: true });
    const bracketGeo = new THREE.BoxGeometry(0.35, 1.2, size.d * 0.7);
    const bracket = new THREE.Mesh(bracketGeo, bracketMat);
    bracket.position.set(0, -0.7, -size.d * 0.3);
    this.mesh.add(bracket);

    this.scene.add(this.mesh);
  }

  update(dt) {}

  getBounds() {
    return new THREE.Box3().setFromObject(this.platMesh);
  }
}

// 3. Plataforma colgante suspendida por cuerdas (fiel a la derecha de la maqueta)
export class HangingSwingPlatform {
  constructor(scene, position, size = { w: 3.0, d: 2.2, h: 0.3 }, ropeHeight = 4.5) {
    this.scene = scene;
    this.position = position.clone();
    this.ropeHeight = ropeHeight;
    this.size = size;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // Plataforma de madera
    const platGeo = new THREE.BoxGeometry(size.w, size.h, size.d);
    const platMat = new THREE.MeshLambertMaterial({
      map: Textures.createTreeBark(),
      color: 0xecd0a3,
      flatShading: true
    });
    this.platMesh = new THREE.Mesh(platGeo, platMat);
    this.mesh.add(this.platMesh);

    // 4 Cuerdas/lianas verticales que suben al soporte de rama
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0x2d3436 });
    const ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, ropeHeight);
    
    [
      [-size.w * 0.45, -size.d * 0.45],
      [size.w * 0.45, -size.d * 0.45],
      [-size.w * 0.45, size.d * 0.45],
      [size.w * 0.45, size.d * 0.45]
    ].forEach(([rx, rz]) => {
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      rope.position.set(rx, ropeHeight * 0.5, rz);
      this.mesh.add(rope);
    });

    this.swingAngle = 0;
    this.swingSpeed = 1.6;
    this.scene.add(this.mesh);
  }

  onFrogStep(dt, frog) {
    // Al pisar, balancea un poco más rápido
    this.swingAngle += dt * 3;
  }

  update(dt) {
    this.swingAngle += dt * this.swingSpeed;
    const sway = Math.sin(this.swingAngle) * 0.8;
    this.mesh.position.x = this.position.x + sway;
    this.platMesh.rotation.z = Math.cos(this.swingAngle) * 0.08;
  }

  getBounds() {
    return new THREE.Box3().setFromObject(this.platMesh);
  }
}

// 4. Ancla dorada para gancho de lengua en ramas
export class TongueAnchor {
  constructor(scene, position) {
    this.scene = scene;
    this.position = position.clone();
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // Anillo dorado brillante estilo N64
    const ringGeo = new THREE.TorusGeometry(0.5, 0.12, 6, 12);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.rotation.x = Math.PI / 2;
    this.mesh.add(this.ringMesh);

    // Núcleo resplandeciente
    const coreGeo = new THREE.SphereGeometry(0.2, 6, 6);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfff200 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    this.mesh.add(core);

    this.scene.add(this.mesh);
  }

  update(dt) {
    this.ringMesh.rotation.z += dt * 2.5;
  }
}
