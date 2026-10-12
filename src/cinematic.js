import * as THREE from 'three';
import { Textures } from './textures.js';
import { audio } from './audio.js';

export class CinematicIntro {
  constructor(scene, camera, player, hud, onComplete) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.hud = hud;
    this.onComplete = onComplete;

    this.isActive = true;
    this.time = 0;
    this.phase = 'sleeping'; // sleeping -> arrival -> dialogue -> kick -> flight -> crash -> angry -> finish
    
    // Contenedores 3D de la cinemática
    this.cinematicGroup = new THREE.Group();
    this.scene.add(this.cinematicGroup);

    // Entidades
    this.patoLemus = null;
    this.rightLegPivot = null;
    this.pointingArm = null;
    this.talabots = [];
    this.powStar = null;
    this.zzzSprites = [];
    this.steamPuffs = [];

    // Trayectoria de vuelo de Frogbert
    this.flightStartPos = new THREE.Vector3(0, 0.6, 25.0);
    this.flightPeakPos = new THREE.Vector3(0, 11.5, 17.5);
    this.flightEndPos = new THREE.Vector3(0, 1.6, 11.0);
    this.flightTime = 0;
    this.flightDuration = 2.0;

    this.setupScene();
  }

  setupScene() {
    // 1. Tarima / Muelle de madera donde Frogbert tomaba su siesta
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x5d4037, flatShading: true });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.6, 7.5), woodMat);
    deck.position.set(0, 0.25, 25.0);
    this.cinematicGroup.add(deck);

    // Manta de hojas suaves
    const blanketMat = new THREE.MeshLambertMaterial({ color: 0x27ae60, flatShading: true });
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 2.4), blanketMat);
    blanket.position.set(0, 0.58, 25.0);
    this.cinematicGroup.add(blanket);

    // 2. Colocar a Frogbert en su posición de siesta
    this.player.position.copy(this.flightStartPos);
    this.player.mesh.position.copy(this.player.position);
    this.player.setSleepingPose(true);
    this.player.mesh.rotation.y = Math.PI;

    // 3. Crear Zzz flotantes (letras / partículas)
    const zzzMat = new THREE.MeshBasicMaterial({ color: 0x74b9ff });
    for (let i = 0; i < 3; i++) {
      const zMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25 + i * 0.08, 0.25 + i * 0.08, 0.08), zzzMat);
      zMesh.position.set(0.4 + i * 0.35, 1.4 + i * 0.5, 25.0);
      this.cinematicGroup.add(zMesh);
      this.zzzSprites.push(zMesh);
    }

    // 4. Crear modelo fiel de Pato Lemus (según arte conceptual)
    this.patoLemus = this.createPatoLemusModel();
    this.patoLemus.position.set(0, 0.55, 21.0);
    this.patoLemus.rotation.y = 0; // Mirando hacia Frogbert (+Z)
    this.cinematicGroup.add(this.patoLemus);

    // 5. Crear 2 Talabots escoltas de TALACORP
    const talabot1 = this.createTalabotModel(-1);
    talabot1.position.set(-2.8, 0.55, 20.2);
    talabot1.rotation.y = 0.25;
    this.cinematicGroup.add(talabot1);
    this.talabots.push(talabot1);

    const talabot2 = this.createTalabotModel(1);
    talabot2.position.set(2.8, 0.55, 20.2);
    talabot2.rotation.y = -0.25;
    this.cinematicGroup.add(talabot2);
    this.talabots.push(talabot2);

    // 6. Estrella de impacto cómica ¡POW!
    const powGeo = new THREE.DodecahedronGeometry(1.6, 0);
    const powMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f, wireframe: false });
    this.powStar = new THREE.Mesh(powGeo, powMat);
    this.powStar.scale.set(1.4, 1.4, 0.4);
    this.powStar.position.set(0, 1.2, 24.2);
    this.powStar.visible = false;
    this.cinematicGroup.add(this.powStar);

    // Configurar cámara para el primer plano de Frogbert durmiendo
    this.camera.position.set(2.2, 1.6, 27.8);
    this.camera.lookAt(0, 0.6, 25.0);
  }

  createPatoLemusModel() {
    const lemusGroup = new THREE.Group();

    // Materiales del arte conceptual
    const whiteFeatherMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const billMat = new THREE.MeshLambertMaterial({ color: 0xf39c12, flatShading: true });
    const darkSuitMat = new THREE.MeshLambertMaterial({ map: Textures.createNavyPinstripe(), flatShading: true });
    const tieMat = new THREE.MeshLambertMaterial({ map: Textures.createPolkaDotTie(), flatShading: true });
    const browMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const orangeFootMat = new THREE.MeshLambertMaterial({ color: 0xe67e22, flatShading: true });

    // 1. Cabeza y tupé estilizado peinado hacia atrás
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 3.1, 0);

    const headBase = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), whiteFeatherMat);
    headBase.scale.set(1.0, 1.15, 1.05);
    headGroup.add(headBase);

    // Tupé de plumas esculpido hacia atrás (peinado distintivo de Pato Lemus)
    const crest1 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 5), whiteFeatherMat);
    crest1.position.set(0, 0.95, -0.3);
    crest1.rotation.x = -Math.PI / 3.5;
    headGroup.add(crest1);

    const crest2 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 5), whiteFeatherMat);
    crest2.position.set(-0.25, 0.85, -0.2);
    crest2.rotation.x = -Math.PI / 4;
    crest2.rotation.z = 0.2;
    headGroup.add(crest2);

    const crest3 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 5), whiteFeatherMat);
    crest3.position.set(0.25, 0.85, -0.2);
    crest3.rotation.x = -Math.PI / 4;
    crest3.rotation.z = -0.2;
    headGroup.add(crest3);

    // 2. Cejas negras anguladas de villano arrogante
    [-0.32, 0.32].forEach((x, i) => {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.18), browMat);
      brow.position.set(x, 0.38, 0.72);
      brow.rotation.z = (i === 0) ? 0.35 : -0.35;
      brow.rotation.y = (i === 0) ? -0.15 : 0.15;
      headGroup.add(brow);

      // Ojo blanco con pupila decidida
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.12), eyeWhiteMat);
      eye.position.set(x, 0.15, 0.76);
      headGroup.add(eye);

      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.08), browMat);
      pupil.position.set(x + (i === 0 ? 0.04 : -0.04), 0.15, 0.82);
      headGroup.add(pupil);
    });

    // 3. Pico anaranjado grande con sonrisa maliciosa
    const upperBill = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.95), billMat);
    upperBill.position.set(0, -0.15, 0.95);
    upperBill.rotation.x = 0.1;
    headGroup.add(upperBill);

    const lowerBill = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.18, 0.75), billMat);
    lowerBill.position.set(0, -0.32, 0.85);
    headGroup.add(lowerBill);

    lemusGroup.add(headGroup);

    // 4. Torso con chaqueta azul marino de rayas diplomáticas
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.8, 0);

    const suitJacket = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.6, 1.25), darkSuitMat);
    torsoGroup.add(suitJacket);

    // Solapas anchas de traje de negocios
    [-0.45, 0.45].forEach((x, i) => {
      const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.1, 0.15), darkSuitMat);
      lapel.position.set(x, 0.15, 0.65);
      lapel.rotation.z = (i === 0) ? -0.2 : 0.2;
      torsoGroup.add(lapel);
    });

    // Cuello de camisa blanca
    const shirtCollar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.18), whiteFeatherMat);
    shirtCollar.position.set(0, 0.58, 0.62);
    torsoGroup.add(shirtCollar);

    // Corbata oscura con lunares rojos
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.95, 0.12), tieMat);
    tie.position.set(0, 0.15, 0.68);
    torsoGroup.add(tie);

    lemusGroup.add(torsoGroup);

    // 5. Brazo izquierdo apoyado en la cadera (pose de jefe autoritario)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.95, 2.2, 0);
    const lUpper = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.75, 0.38), darkSuitMat);
    lUpper.position.set(-0.2, -0.3, 0);
    lUpper.rotation.z = 0.45;
    leftArm.add(lUpper);

    const lFore = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.65, 0.32), darkSuitMat);
    lFore.position.set(-0.35, -0.85, 0.2);
    lFore.rotation.x = -0.5;
    leftArm.add(lFore);

    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), whiteFeatherMat);
    lHand.position.set(-0.2, -1.15, 0.4);
    leftArm.add(lHand);
    lemusGroup.add(leftArm);

    // 6. Brazo derecho SEÑALANDO AL FRENTE CON EL DEDO (Pose icónica)
    this.pointingArm = new THREE.Group();
    this.pointingArm.position.set(0.95, 2.2, 0);
    const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.75, 0.38), darkSuitMat);
    rUpper.position.set(0.15, -0.15, 0.35);
    rUpper.rotation.x = -Math.PI / 2.8;
    this.pointingArm.add(rUpper);

    const rFore = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.8, 0.32), darkSuitMat);
    rFore.position.set(0.18, -0.15, 0.95);
    rFore.rotation.x = -Math.PI / 2.2;
    this.pointingArm.add(rFore);

    // Mano enguantada blanca señalando
    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), whiteFeatherMat);
    rHand.position.set(0.18, -0.15, 1.45);
    this.pointingArm.add(rHand);

    // Dedo índice acusador extendido
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 5), whiteFeatherMat);
    finger.rotation.x = Math.PI / 2;
    finger.position.set(0.18, -0.05, 1.75);
    this.pointingArm.add(finger);

    lemusGroup.add(this.pointingArm);

    // 7. Pierna izquierda (fija) y pantalón
    const lPants = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.58), darkSuitMat);
    lPants.position.set(-0.48, 0.8, 0);
    lemusGroup.add(lPants);

    const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 1.15), orangeFootMat);
    lFoot.position.set(-0.48, 0.12, 0.3);
    lemusGroup.add(lFoot);

    // 8. Pierna derecha móvil con pivote en la cadera (para la PATADA)
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.48, 1.0, 0);

    const rPants = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.58), darkSuitMat);
    rPants.position.set(0, -0.2, 0);
    this.rightLegPivot.add(rPants);

    const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 1.15), orangeFootMat);
    rFoot.position.set(0, -0.88, 0.3);
    this.rightLegPivot.add(rFoot);

    lemusGroup.add(this.rightLegPivot);

    return lemusGroup;
  }

  createTalabotModel(side = 1) {
    const talabot = new THREE.Group();
    const metalMat = new THREE.MeshLambertMaterial({ map: Textures.createTalabotMetal(), flatShading: true });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    const darkMetalMat = new THREE.MeshLambertMaterial({ color: 0x2d3436, flatShading: true });

    // Cuerpo mecánico cuadrangular
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.0), metalMat);
    body.position.y = 1.6;
    talabot.add(body);

    // Cabeza / visor angular de peligro
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.8), darkMetalMat);
    head.position.set(0, 2.5, 0.1);
    talabot.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.1), visorMat);
    visor.position.set(0, 2.5, 0.52);
    talabot.add(visor);

    // Tubo de escape trasero con humo
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), darkMetalMat);
    exhaust.position.set(0.35 * side, 2.4, -0.45);
    exhaust.rotation.x = -0.3;
    talabot.add(exhaust);

    // Brazo con sierra mecánica circular
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), darkMetalMat);
    arm.position.set(0.85 * side, 1.4, 0.3);
    arm.rotation.x = -0.5;
    talabot.add(arm);

    const saw = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 12), metalMat);
    saw.position.set(0.85 * side, 0.85, 0.7);
    saw.rotation.z = Math.PI / 2;
    talabot.add(saw);
    talabot.sawBlade = saw;

    // Patas oruga / pistones mecánicos
    [-0.45, 0.45].forEach(x => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.6), darkMetalMat);
      leg.position.set(x, 0.45, 0);
      talabot.add(leg);
    });

    return talabot;
  }

  update(dt) {
    if (!this.isActive) return;

    this.time += dt;

    // Animaciones constantes de fondo (sierras de Talabots, Zzz)
    this.talabots.forEach(t => {
      if (t.sawBlade) t.sawBlade.rotation.y += dt * 18;
    });

    // MÁQUINA DE ESTADOS DE LA CINEMÁTICA
    if (this.time < 3.2) {
      // FASE 1: Frogbert durmiendo
      this.phase = 'sleeping';
      const t = this.time / 3.2;

      // Movimiento suave de cámara rodeando a Frogbert
      this.camera.position.set(
        Math.cos(t * 1.5) * 3.2,
        1.4 + Math.sin(t * 2) * 0.2,
        25.0 + Math.sin(t * 1.5) * 2.8
      );
      this.camera.lookAt(0, 0.6, 25.0);

      // Partículas Zzz flotando
      this.zzzSprites.forEach((z, i) => {
        z.position.y += dt * 0.4;
        z.rotation.z = Math.sin(this.time * 3 + i) * 0.15;
        if (z.position.y > 3.0) z.position.y = 1.3;
      });

      if (Math.floor(this.time * 2) % 2 === 0 && Math.floor((this.time - dt) * 2) % 2 !== 0) {
        audio.playSnore();
      }

    } else if (this.time < 6.8) {
      // FASE 2: Entrada intimidante de Pato Lemus y Talabots
      this.phase = 'arrival';
      this.zzzSprites.forEach(z => { z.visible = false; });

      // Cámara dramática en contrapicado (mirando hacia Pato Lemus)
      const t = (this.time - 3.2) / 3.6;
      this.camera.position.lerp(new THREE.Vector3(-1.8, 1.1, 26.5), 0.08);
      this.camera.lookAt(0, 2.6, 21.0);

      // Animación arrogante de Pato Lemus señalando
      if (this.pointingArm) {
        this.pointingArm.rotation.y = Math.sin(this.time * 4) * 0.08;
      }

      if (this.time >= 3.2 && this.time - dt < 3.2) {
        audio.playHeavyStomp();
      }

    } else if (this.time < 10.5) {
      // FASE 3: Diálogo de Pato Lemus
      this.phase = 'dialogue';
      this.camera.position.set(-1.2, 1.2, 25.8);
      this.camera.lookAt(0, 2.5, 21.0);

      if (this.hud && this.hud.dialogueBox.style.display !== 'flex') {
        this.hud.showDialogue(
          'PATO LEMUS',
          '¡CROAK, PEQUEÑA RANA...! ESTE BOSQUE YA TIENE DUEÑO. TALACORP LO HACE MÁS GRANDE... AUNQUE TENGA QUE SECARLO.'
        );
      }

    } else if (this.time < 11.8) {
      // FASE 4: La PATADA de Pato Lemus (¡POW!)
      this.phase = 'kick';
      if (this.hud && this.hud.dialogueBox.style.display === 'flex') {
        this.hud.closeDialogue();
      }

      const kickProgress = (this.time - 10.5) / 1.3;

      // Levantar y estampar la pata derecha hacia Frogbert
      if (this.rightLegPivot) {
        if (kickProgress < 0.35) {
          // Carga hacia atrás
          this.rightLegPivot.rotation.x = -kickProgress * 2.5;
        } else if (kickProgress < 0.75) {
          // ¡Patadón hacia adelante!
          this.rightLegPivot.rotation.x = 1.6;
          this.powStar.visible = true;
          this.powStar.scale.setScalar(1.2 + Math.sin(kickProgress * 20) * 0.4);

          if (!this.kickSoundPlayed) {
            this.kickSoundPlayed = true;
            audio.playKickImpact();
          }

          // Frogbert se sobresalta y despierta
          this.player.setSleepingPose(false);
          this.player.eyelids.forEach(el => { el.rotation.x = -Math.PI / 2; }); // Ojos como platos
        } else {
          this.powStar.visible = false;
        }
      }

    } else if (this.time < 14.2) {
      // FASE 5: Vuelo en arco parabólico de Frogbert por los aires
      this.phase = 'flight';
      this.powStar.visible = false;
      this.flightTime += dt;
      const progress = Math.min(1.0, this.flightTime / 2.2);

      // Trayectoria en arco Bezier cuadrático
      // P(t) = (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2
      const invT = 1.0 - progress;
      const x = invT * invT * this.flightStartPos.x + 2 * invT * progress * this.flightPeakPos.x + progress * progress * this.flightEndPos.x;
      const y = invT * invT * this.flightStartPos.y + 2 * invT * progress * this.flightPeakPos.y + progress * progress * this.flightEndPos.y;
      const z = invT * invT * this.flightStartPos.z + 2 * invT * progress * this.flightPeakPos.z + progress * progress * this.flightEndPos.z;

      this.player.position.set(x, y, z);
      this.player.mesh.position.copy(this.player.position);

      // Rotación cómica al volar
      this.player.mesh.rotation.x += dt * 14;
      this.player.mesh.rotation.z += dt * 8;

      // Cámara persiguiendo la trayectoria del vuelo
      this.camera.position.set(x + 5.5, y + 3.5, z + 6.0);
      this.camera.lookAt(this.player.position);

      if (!this.flightSoundPlayed) {
        this.flightSoundPlayed = true;
        audio.playFlightWhoosh();
      }

    } else if (this.time < 15.6) {
      // FASE 6: Aterrizaje brusco en el suelo de la base del árbol
      this.phase = 'crash';
      this.player.position.copy(this.flightEndPos);
      this.player.mesh.position.copy(this.player.position);
      this.player.mesh.rotation.set(0, Math.PI, 0);

      // Frogbert aturdido en el suelo
      this.player.setSleepingPose(true);

      this.camera.position.lerp(new THREE.Vector3(0, 3.2, 16.5), 0.1);
      this.camera.lookAt(this.player.position);

      if (!this.crashSoundPlayed) {
        this.crashSoundPlayed = true;
        audio.playCrashLanding();
        if (this.player.particles) {
          this.player.particles.spawnDustPuff(this.player.position, 16, 0x5d4037);
        }
      }

    } else if (this.time < 19.8) {
      // FASE 7: Frogbert despierta enfurecido y entrega su monólogo
      this.phase = 'angry';
      this.player.position.copy(this.flightEndPos);
      this.player.mesh.position.copy(this.player.position);
      this.player.setSleepingPose(false);
      this.player.setAngryPose(true);
      this.player.mesh.rotation.set(0, 0, 0);

      // Partículas de vapor / humo de ira en la cabeza
      if (Math.random() < 0.25 && this.player.particles) {
        const steamPos = this.player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.2, 0));
        this.player.particles.spawnDustPuff(steamPos, 2, 0xffffff);
      }

      this.camera.position.lerp(new THREE.Vector3(0, 2.8, 15.2), 0.08);
      this.camera.lookAt(this.player.position.x, this.player.position.y + 0.6, this.player.position.z);

      if (this.hud && this.hud.dialogueBox.style.display !== 'flex') {
        this.hud.showDialogue(
          'FROGBERT',
          '¡GRRR! ¡Maldito Pato Lemus y sus hojalatas de TALACORP! ¡Pisotearon mi siesta y talaron mi bosque sagrado! ¡Subiré hasta la cima de este árbol y le daré su merecido a patadas!'
        );
      }

    } else {
      // FASE 8: Fin de cinemática -> Comienzo fluido del nivel
      this.finish();
    }
  }

  skip() {
    if (!this.isActive) return;
    this.finish();
  }

  finish() {
    this.isActive = false;

    // Limpiar elementos de la cinemática
    this.scene.remove(this.cinematicGroup);

    // Posicionar a Frogbert listo en la base del árbol
    this.player.position.set(0, 1.6, 11.0);
    this.player.mesh.position.copy(this.player.position);
    this.player.velocity.set(0, 0, 0);
    this.player.mesh.rotation.set(0, 0, 0);
    this.player.setSleepingPose(false);
    this.player.setAngryPose(true);

    // Diálogo inicial de Frogbert si no está abierto
    if (this.hud && this.hud.dialogueBox.style.display !== 'flex') {
      this.hud.showDialogue(
        'FROGBERT',
        '¡GRRR! ¡Maldito Pato Lemus y sus hojalatas de TALACORP! ¡Pisotearon mi siesta y talaron mi bosque sagrado! ¡Subiré hasta la cima de este árbol y le daré su merecido a patadas!'
      );
    }

    if (this.onComplete) {
      this.onComplete();
    }
  }
}
