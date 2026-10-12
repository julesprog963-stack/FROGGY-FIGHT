import * as THREE from 'three';

export class NPC {
  constructor(scene, options) {
    this.scene = scene;
    this.name = options.name || 'ANIMAL';
    this.dialogue = options.dialogue || '...';
    this.position = options.position.clone();
    this.rotationY = options.rotationY || 0;
    this.type = options.type || 'squirrel';
    this.animTime = Math.random() * Math.PI * 2;
    this.talkRadius = 3.2;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;

    this.createModel();
    this.createPromptBubble();
    this.scene.add(this.mesh);
  }

  createModel() {
    if (this.type === 'squirrel') {
      this.createSquirrelModel();
    } else if (this.type === 'turtle') {
      this.createTurtleModel();
    } else if (this.type === 'opossum') {
      this.createOpossumModel();
    }
  }

  createSquirrelModel() {
    // Ardilla Chippy con vendaje y lágrimas
    const furMat = new THREE.MeshLambertMaterial({ color: 0xb33939, flatShading: true });
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xf7d794, flatShading: true });
    const bandageMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const tearMat = new THREE.MeshBasicMaterial({ color: 0x00d2d3 });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x1e272e });

    // Cuerpo
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), furMat);
    body.position.y = 0.55;
    this.mesh.add(body);

    // Pancita
    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.25), bellyMat);
    belly.position.set(0, 0.5, 0.35);
    this.mesh.add(belly);

    // Cabeza
    this.head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), furMat);
    this.head.position.set(0, 1.1, 0.1);
    this.mesh.add(this.head);

    // Vendaje en la cabeza
    const bandage = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.18, 8), bandageMat);
    bandage.position.set(0, 1.18, 0.1);
    this.mesh.add(bandage);

    // Ojos tristes
    [-0.16, 0.16].forEach(x => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.08), blackMat);
      eye.position.set(x, 1.15, 0.45);
      this.mesh.add(eye);

      // Lágrima de píxel
      const tear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.04), tearMat);
      tear.position.set(x, 0.98, 0.46);
      this.mesh.add(tear);
    });

    // Cola esponjosa
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.38, 0.9, 6), furMat);
    tail.position.set(0, 0.8, -0.45);
    tail.rotation.x = -Math.PI / 4;
    this.mesh.add(tail);
  }

  createTurtleModel() {
    // Tortuga Don Caparazón con pancarta de huelga
    const shellMat = new THREE.MeshLambertMaterial({ color: 0x27ae60, flatShading: true });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0x78e08f, flatShading: true });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b, flatShading: true });
    const signMat = new THREE.MeshLambertMaterial({ color: 0xf5f6fa, flatShading: true });

    // Caparazón abovedado
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), shellMat);
    shell.position.y = 0.4;
    shell.scale.set(1.1, 0.7, 1.3);
    this.mesh.add(shell);

    // Cabeza de tortuga asomando
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.5), skinMat);
    this.head.position.set(0, 0.45, 0.95);
    this.mesh.add(this.head);

    // Cuatro patitas
    [[-0.6, 0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.32), skinMat);
      leg.position.set(x, 0.12, z);
      this.mesh.add(leg);
    });

    // Pancarta de huelga
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 5), woodMat);
    pole.position.set(0.65, 0.9, 0.5);
    pole.rotation.z = -0.15;
    this.mesh.add(pole);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.06), signMat);
    signBoard.position.set(0.65, 1.6, 0.5);
    signBoard.rotation.y = 0.25;
    this.mesh.add(signBoard);
  }

  createOpossumModel() {
    // Zarigüeya Pepe con pata vendada y muleta
    const furMat = new THREE.MeshLambertMaterial({ color: 0x57606f, flatShading: true });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf1f2f6, flatShading: true });
    const noseMat = new THREE.MeshLambertMaterial({ color: 0xff6b81, flatShading: true });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0xa4b0be, flatShading: true });

    // Cuerpo
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), furMat);
    body.position.y = 0.45;
    body.scale.set(1.0, 0.8, 1.4);
    this.mesh.add(body);

    // Cabeza puntiaguda
    this.head = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 5), whiteMat);
    this.head.position.set(0, 0.55, 0.75);
    this.head.rotation.x = Math.PI / 2;
    this.mesh.add(this.head);

    // Nariz rosada
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), noseMat);
    nose.position.set(0, 0.55, 1.15);
    this.mesh.add(nose);

    // Muleta de madera
    const crutch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 5), woodMat);
    crutch.position.set(0.55, 0.6, 0.2);
    crutch.rotation.z = -0.18;
    this.mesh.add(crutch);
  }

  createPromptBubble() {
    // Indicador visual flotante "!" que rota sobre la cabeza
    const bubbleGeo = new THREE.BoxGeometry(0.25, 0.5, 0.25);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    this.promptMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    this.promptMesh.position.set(0, 2.1, 0);
    this.mesh.add(this.promptMesh);
  }

  update(dt, player, hud) {
    this.animTime += dt * 3;
    // Animación sutil de respiración o temblor
    if (this.head) {
      this.head.rotation.z = Math.sin(this.animTime * 2) * 0.08;
    }
    if (this.promptMesh) {
      this.promptMesh.rotation.y += dt * 3.5;
      this.promptMesh.position.y = 2.1 + Math.sin(this.animTime) * 0.12;
    }

    // Comprobación de proximidad
    const dist = player.position.distanceTo(this.mesh.position);
    this.isNear = dist < this.talkRadius;

    if (this.promptMesh) {
      this.promptMesh.visible = this.isNear;
    }
  }

  interact(hud) {
    if (hud) {
      hud.showDialogue(this.name, this.dialogue);
    }
  }
}
