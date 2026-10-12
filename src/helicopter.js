import * as THREE from 'three';
import { Textures } from './textures.js';
import { audio } from './audio.js';

export class TalacorpHelicopter {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    this.mainRotor = null;
    this.tailRotor = null;
    this.searchlight = null;

    this.bladeTimer = 0;
    this.isFlying = false;
    this.rotorSpeed = 0; // rad/s
    this.targetRotorSpeed = 28;

    this.state = 'hidden'; // 'hidden' | 'arriving' | 'hovering' | 'departing'
    this.timeInState = 0;

    this.startPos = new THREE.Vector3(25, 62, -25);
    this.hoverPos = new THREE.Vector3(5, 43.5, 5);
    this.escapePos = new THREE.Vector3(-45, 75, 45);

    this.buildModel();
    this.mesh.visible = false;
    this.scene.add(this.mesh);
  }

  buildModel() {
    const yellowMat = new THREE.MeshLambertMaterial({
      color: 0xf1c40f,
      flatShading: true
    });
    const darkMat = new THREE.MeshLambertMaterial({
      color: 0x1e272e,
      flatShading: true
    });
    const hazardMat = new THREE.MeshLambertMaterial({
      map: Textures.createHazardMetal(),
      color: 0xdfe6e9,
      flatShading: true
    });
    const glassMat = new THREE.MeshLambertMaterial({
      color: 0x0984e3,
      transparent: true,
      opacity: 0.85,
      flatShading: true
    });
    const metalMat = new THREE.MeshLambertMaterial({
      color: 0x718093,
      flatShading: true
    });

    // 1. Cabina / Fuselaje Principal
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 3.8), yellowMat);
    cabin.position.set(0, 1.2, 0);
    this.mesh.add(cabin);

    // Franja inferior de peligro TALACORP
    const hazardStripe = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.45, 3.84), hazardMat);
    hazardStripe.position.set(0, 0.45, 0);
    this.mesh.add(hazardStripe);

    // Parabrisas y ventanas de cabina anguladas
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 1.2), glassMat);
    windshield.position.set(0, 1.45, 1.45);
    windshield.rotation.x = -Math.PI / 8;
    this.mesh.add(windshield);

    // Ventanas laterales
    [-1.22, 1.22].forEach(x => {
      const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 1.8), glassMat);
      sideWin.position.set(x, 1.35, -0.2);
      this.mesh.add(sideWin);
    });

    // 2. Mástil y Rotor Principal Superior
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 8), darkMat);
    mast.position.set(0, 2.45, 0);
    this.mesh.add(mast);

    this.mainRotor = new THREE.Group();
    this.mainRotor.position.set(0, 2.8, 0);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.22, 8), darkMat);
    this.mainRotor.add(hub);

    // 2 Aspas largas
    const bladeGeo = new THREE.BoxGeometry(6.6, 0.06, 0.42);
    const blade = new THREE.Mesh(bladeGeo, darkMat);
    this.mainRotor.add(blade);

    // Segunda aspa perpendicular para estilo 4 aspas
    const blade2 = new THREE.Mesh(bladeGeo, darkMat);
    blade2.rotation.y = Math.PI / 2;
    this.mainRotor.add(blade2);

    this.mesh.add(this.mainRotor);

    // 3. Cola y Rotor de Cola
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, 4.2, 6), yellowMat);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 1.35, -3.8);
    this.mesh.add(tailBoom);

    // Estabilizador vertical
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.3, 0.8), darkMat);
    fin.position.set(0, 1.8, -5.8);
    this.mesh.add(fin);

    // Rotor de cola
    this.tailRotor = new THREE.Group();
    this.tailRotor.position.set(0.2, 1.9, -5.8);
    const tailBlade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 0.18), darkMat);
    this.tailRotor.add(tailBlade);
    const tailBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 1.5), darkMat);
    this.tailRotor.add(tailBlade2);
    this.mesh.add(this.tailRotor);

    // 4. Patines de Aterrizaje
    [-1.15, 1.15].forEach(x => {
      // Barra horizontal del patín
      const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 6), metalMat);
      skid.rotation.x = Math.PI / 2;
      skid.position.set(x, 0.1, 0);
      this.mesh.add(skid);

      // Puntas curvadas hacia arriba
      const frontTip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6), metalMat);
      frontTip.position.set(x, 0.35, 2.2);
      frontTip.rotation.x = -Math.PI / 4;
      this.mesh.add(frontTip);

      // Soportes verticales que unen al fuselaje
      [-0.9, 0.9].forEach(z => {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.75, 6), metalMat);
        strut.position.set(x * 0.88, 0.45, z);
        strut.rotation.z = x > 0 ? -0.2 : 0.2;
        this.mesh.add(strut);
      });
    });

    // 5. Reflector de búsqueda inferior
    const lightCase = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 8), darkMat);
    lightCase.rotation.x = Math.PI;
    lightCase.position.set(0, 0.35, 1.4);
    this.mesh.add(lightCase);

    this.searchlight = new THREE.SpotLight(0xfef08a, 4.0, 35, Math.PI / 5, 0.6, 1.2);
    this.searchlight.position.set(0, 0.2, 1.4);
    this.searchlight.target.position.set(0, -10, 0);
    this.mesh.add(this.searchlight);
    this.mesh.add(this.searchlight.target);

    // Baliza roja superior en la cola
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xe74c3c })
    );
    beacon.position.set(0, 2.5, -5.8);
    this.mesh.add(beacon);
  }

  startArrival(hoverPosition = new THREE.Vector3(5, 43.5, 5)) {
    this.hoverPos.copy(hoverPosition);
    this.mesh.position.copy(this.startPos);
    this.mesh.visible = true;
    this.state = 'arriving';
    this.timeInState = 0;
    this.rotorSpeed = 28;
    this.isFlying = true;
  }

  startDeparture(escapePosition = new THREE.Vector3(-45, 75, 45)) {
    this.escapePos.copy(escapePosition);
    this.state = 'departing';
    this.timeInState = 0;
  }

  update(dt) {
    if (!this.mesh.visible) return;

    this.timeInState += dt;

    // Giro de rotores
    if (this.mainRotor) {
      this.mainRotor.rotation.y += dt * this.rotorSpeed;
    }
    if (this.tailRotor) {
      this.tailRotor.rotation.x += dt * (this.rotorSpeed * 1.5);
    }

    // SFX Rotores de helicóptero
    this.bladeTimer += dt;
    if (this.bladeTimer > 0.09) {
      this.bladeTimer = 0;
      audio.playHelicopterBlade();
    }

    if (this.state === 'arriving') {
      // Descenso parabólico desde startPos hasta hoverPos
      const t = Math.min(this.timeInState / 3.2, 1.0);
      const easeT = t * t * (3 - 2 * t);

      this.mesh.position.lerpVectors(this.startPos, this.hoverPos, easeT);

      // Inclinación hacia adelante durante la llegada
      const pitch = Math.sin(t * Math.PI) * 0.25;
      this.mesh.rotation.set(pitch, -Math.PI / 3, 0);

      if (t >= 1.0) {
        this.state = 'hovering';
        this.timeInState = 0;
      }

    } else if (this.state === 'hovering') {
      // Flotación suave oscilante en el aire
      const bobY = Math.sin(this.timeInState * 2.8) * 0.25;
      const wobbleZ = Math.sin(this.timeInState * 1.9) * 0.05;
      this.mesh.position.set(this.hoverPos.x, this.hoverPos.y + bobY, this.hoverPos.z);
      this.mesh.rotation.set(0.04, -Math.PI / 3 + Math.sin(this.timeInState * 1.2) * 0.04, wobbleZ);

    } else if (this.state === 'departing') {
      // Escape acelerado hacia el cielo
      const t = Math.min(this.timeInState / 3.8, 1.0);
      const easeT = t * t; // Aceleración

      this.mesh.position.lerpVectors(this.hoverPos, this.escapePos, easeT);

      // Inclinación agresiva de despegue
      this.mesh.rotation.set(0.35, -Math.PI / 3 - t * 0.3, -0.15);

      if (t >= 1.0) {
        this.mesh.visible = false;
        this.state = 'hidden';
      }
    }
  }
}
