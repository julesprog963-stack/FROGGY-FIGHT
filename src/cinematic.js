import * as THREE from 'three';
import { Textures } from './textures.js';
import { audio } from './audio.js';
import { createLemusBanner } from './banner.js';
import { createPatoLemusModel } from './pato-lemus-model.js';

export class CinematicIntro {
  constructor(scene, camera, player, hud, onComplete) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.hud = hud;
    this.onComplete = onComplete;

    this.isActive = true;
    this.time = 0;
    this.phase = 'sleeping'; // sleeping -> wake_up -> confrontation -> kick -> flight -> crash -> angry -> finish

    document.body.classList.add('in-cinematic');

    // Contenedores 3D de la cinemática
    this.cinematicGroup = new THREE.Group();
    this.scene.add(this.cinematicGroup);

    // Entidades y elementos clave
    this.patoLemus = null;
    this.patoHead = null;
    this.rightLegPivot = null;
    this.leftLegPivot = null;
    this.pointingArm = null;
    this.leftArm = null;
    this.talabots = [];
    this.powStar = null;
    this.zzzSprites = [];
    this.lanternLights = [];
    this.sleepingMat = null;

    // Control de sueño y despertar
    this.snoreTimer = 0;
    this.wokeUp = false;

    // Elevación a la copa del nuevo Árbol Sagrado monumental (y ≈ 54.5m)
    this.elevationY = 54.5;

    // Trayectoria de vuelo y caída libre de Frogbert desde la copa (54.5m) hasta la base (1.6m, z=16.5m)
    this.flightStartPos = new THREE.Vector3(-1.75, this.elevationY + 0.35, 31.8);
    this.flightApexPos = new THREE.Vector3(0, this.elevationY + 4.2, 29.0);
    this.flightMidPos = new THREE.Vector3(2.2, 28.0, 22.5);
    this.flightEndPos = new THREE.Vector3(0, 1.6, 16.5);
    this.flightTime = 0;

    // Control de audio
    this.kickSoundPlayed = false;
    this.flightSoundPlayed = false;
    this.crashSoundPlayed = false;
    this.angryKickPlayed = false;

    this.setupScene();
  }

  setupScene() {
    const ey = this.elevationY;

    // 1. ARENA DE MADERA CIRCULAR EN EL MIRADOR DE LA COPA DEL ÁRBOL
    const woodMat = new THREE.MeshLambertMaterial({
      color: 0x5a381e,
      flatShading: true
    });
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 0.7, 32), woodMat);
    deck.position.set(0, ey + 0.05, 27.0);
    this.cinematicGroup.add(deck);

    // Borde de tablones de la arena
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x3d2311, flatShading: true });
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(18.2, 18.2, 0.35, 32), rimMat);
    rim.position.set(0, ey + 0.35, 27.0);
    this.cinematicGroup.add(rim);

    // Vigas de soporte rústicas debajo del mirador de la copa
    const beamMat = new THREE.MeshLambertMaterial({ color: 0x2e1a0c, flatShading: true });
    [-6, 0, 6].forEach(bx => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 14, 1.4), beamMat);
      beam.position.set(bx, ey - 7, 26.0);
      beam.rotation.z = bx * 0.03;
      this.cinematicGroup.add(beam);
    });

    // Luz frontal cálida estilo PS2 para resaltar el chaleco naranja y rostro de Pato Lemus
    const keyLight = new THREE.DirectionalLight(0xfffae6, 1.55);
    keyLight.position.set(-1, ey + 6, 38);
    this.cinematicGroup.add(keyLight);

    const rimLight = new THREE.PointLight(0xff6b00, 1.8, 22);
    rimLight.position.set(2, ey + 4.5, 23.0);
    this.cinematicGroup.add(rimLight);

    // 3. TORRES DE VIGILANCIA CON ESTANDARTES Y FAROLES (Izquierda y Derecha)
    this.buildWatchtower(-4.8, 24.5, 1, ey);
    this.buildWatchtower(4.8, 24.5, -1, ey);

    // 4. PILARES INDUSTRIALES DEL FONDO CON BALIZAS ROJAS (TALACORP)
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x151b22, flatShading: true });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3838 });

    const pillarCoords = [
      { x: -9.5, z: 15.0, h: 24 },
      { x: -3.8, z: 13.0, h: 30 },
      { x: 3.8, z: 13.0, h: 30 },
      { x: 9.5, z: 15.0, h: 24 }
    ];

    pillarCoords.forEach(c => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(1.6, c.h, 1.6), pillarMat);
      col.position.set(c.x, ey + c.h * 0.25, c.z);
      this.cinematicGroup.add(col);

      const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), beaconMat);
      beacon.position.set(c.x, ey + c.h * 0.75 + 0.4, c.z);
      this.cinematicGroup.add(beacon);

      const redLight = new THREE.PointLight(0xff3838, 1.8, 14);
      redLight.position.set(c.x, ey + c.h * 0.75 + 0.6, c.z);
      this.cinematicGroup.add(redLight);
    });

    // 5. MODELO 3D PS2 DE GOBERNADOR PATO LEMUS (Chaleco Naranja, Camisa Blanca, Pelo Cobrizo)
    this.patoLemus = this.createPatoLemusModel();
    this.patoLemus.position.set(0.55, ey + 0.45, 27.4);
    this.patoLemus.scale.set(1.24, 1.24, 1.24);
    this.patoLemus.rotation.set(0, -0.22, 0);
    this.cinematicGroup.add(this.patoLemus);

    // MINI-TALABOTS ESCOLTAS DE TALACORP (Flanqueando a Pato Lemus con antena receptora)
    const talabotLeft = this.createTalabotModel(-1);
    talabotLeft.position.set(-2.8, ey + 0.45, 26.6);
    talabotLeft.rotation.y = 0.35;
    this.cinematicGroup.add(talabotLeft);
    this.talabots.push(talabotLeft);

    const talabotRight = this.createTalabotModel(1);
    talabotRight.position.set(3.4, ey + 0.45, 26.6);
    talabotRight.rotation.y = -0.35;
    this.cinematicGroup.add(talabotRight);
    this.talabots.push(talabotRight);

    // 6. ESTERILLA DE HOJAS Y ALMOHADITA DE SIESTA DE FROGBERT
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x27ae60, flatShading: true });
    const sleepingDeck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 2.6), leafMat);
    sleepingDeck.position.set(-1.75, ey + 0.12, 31.8);
    this.cinematicGroup.add(sleepingDeck);
    this.sleepingMat = sleepingDeck;

    const pillowMat = new THREE.MeshLambertMaterial({ color: 0x2ecc71, flatShading: true });
    const pillow = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.4, 8), pillowMat);
    pillow.rotation.z = Math.PI / 2;
    pillow.position.set(-1.75, ey + 0.22, 30.8);
    this.cinematicGroup.add(pillow);

    // FROGBERT EN SU SIESTA SAGRADA
    this.flightStartPos.set(-1.75, ey + 0.35, 31.8);
    this.player.position.copy(this.flightStartPos);
    this.player.mesh.position.copy(this.player.position);
    this.player.mesh.scale.set(0.74, 0.74, 0.74);
    this.player.mesh.rotation.set(-0.15, 2.95, 0);
    this.player.setSleepingPose(true);
    this.player.setAngryPose(false);
    if (this.player.backpack) this.player.backpack.visible = true;

    // LETRAS Zzz CÓMICAS FLOTANTES
    this.zzzSprites = [];
    const zTexts = ['Z', 'z', 'Z'];
    const zScales = [0.45, 0.35, 0.55];
    for (let i = 0; i < 3; i++) {
      const zTex = Textures.createZzzTexture(zTexts[i]);
      const zSpriteMat = new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false });
      const zSprite = new THREE.Sprite(zSpriteMat);
      zSprite.scale.set(zScales[i], zScales[i], 1);
      zSprite.position.set(-1.6 + i * 0.25, ey + 0.95 + i * 0.35, 31.8);
      this.cinematicGroup.add(zSprite);
      this.zzzSprites.push({
        sprite: zSprite,
        baseX: -1.6 + i * 0.25,
        offset: i * 0.55,
        scale: zScales[i]
      });
    }

    // 7. ESTRELLA DE IMPACTO CÓMICA ¡POW!
    const powGeo = new THREE.DodecahedronGeometry(0.55, 0);
    const powMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    this.powStar = new THREE.Mesh(powGeo, powMat);
    this.powStar.scale.set(1.4, 1.4, 0.4);
    this.powStar.position.set(-1.15, ey + 1.25, 30.5);
    this.powStar.visible = false;
    this.cinematicGroup.add(this.powStar);

    // 8. CÁMARA INICIAL: PRIMER PLANO CÁLIDO DE FROGBERT DURMIENDO EN LA COPA
    this.camera.position.set(-0.85, ey + 1.25, 34.2);
    this.camera.lookAt(-1.75, ey + 0.55, 31.8);
    this.camera.fov = 50;
    this.camera.updateProjectionMatrix();

    if (this.hud) {
      this.hud.showDialogue(
        'FROGBERT',
        'Zzz... Zzz... Qué sabrosa siesta en la copa del monumental Árbol Sagrado... Zzz...',
        null,
        () => this.advanceToWakeUp()
      );
    }
  }

  buildWatchtower(x, z, side, y = 0) {
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x4a2e16, flatShading: true });
    const beamMat = new THREE.MeshLambertMaterial({ color: 0x3d2714, flatShading: true });
    const towerGroup = new THREE.Group();
    towerGroup.position.set(x, y, z);

    [-1.2, 1.2].forEach(px => {
      [-1.2, 1.2].forEach(pz => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 11, 6), beamMat);
        post.position.set(px, 5.5, pz);
        towerGroup.add(post);
      });
    });

    const plat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.35, 3.0), woodMat);
    plat.position.set(0, 6.5, 0);
    towerGroup.add(plat);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 5), beamMat);
    roof.position.set(0, 11.2, 0);
    towerGroup.add(roof);

    const banner = createLemusBanner();
    banner.position.set(0, 3.8, 1.4);
    banner.rotation.y = (side === 1) ? 0.2 : -0.2;
    towerGroup.add(banner);

    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffd32a });
    const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), lanternMat);
    lantern.position.set(0, 5.5, 1.6);
    towerGroup.add(lantern);

    const warmLight = new THREE.PointLight(0xffd32a, 2.5, 16);
    warmLight.position.set(x, y + 5.5, z + 1.6);
    this.cinematicGroup.add(warmLight);
    this.lanternLights.push(warmLight);

    this.cinematicGroup.add(towerGroup);
  }

  createPatoLemusModel() {
    const pato = createPatoLemusModel();
    this.patoHead = pato.headGroup;
    this.pointingArm = pato.pointingArm;
    this.leftArm = pato.leftArm;
    this.rightLegPivot = pato.rightLegPivot;
    this.leftLegPivot = pato.leftLegPivot;
    return pato.mesh;
  }

  createTalabotModel(side = 1) {
    const talabot = new THREE.Group();
    const metalMat = new THREE.MeshLambertMaterial({ map: Textures.createTalabotMetal(), flatShading: true });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xff3838 });
    const darkMetalMat = new THREE.MeshLambertMaterial({ color: 0x222f3e, flatShading: true });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.0), metalMat);
    body.position.y = 1.4;
    talabot.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.8), darkMetalMat);
    head.position.set(0, 2.3, 0.1);
    talabot.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.1), visorMat);
    visor.position.set(0, 2.3, 0.52);
    talabot.add(visor);

    // Antena receptora en la cabeza (conectada a la Antena Central de la cima)
    const antPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.45, 6), darkMetalMat);
    antPole.position.set(0, 2.8, 0.1);
    talabot.add(antPole);
    const antTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), visorMat);
    antTip.position.set(0, 3.05, 0.1);
    talabot.add(antTip);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), darkMetalMat);
    exhaust.position.set(0.35 * side, 2.2, -0.45);
    exhaust.rotation.x = -0.3;
    talabot.add(exhaust);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), darkMetalMat);
    arm.position.set(0.85 * side, 1.3, 0.3);
    arm.rotation.x = -0.5;
    talabot.add(arm);

    const saw = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 12), metalMat);
    saw.position.set(0.85 * side, 0.75, 0.7);
    saw.rotation.z = Math.PI / 2;
    talabot.add(saw);
    talabot.sawBlade = saw;

    [-0.45, 0.45].forEach(x => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.6), darkMetalMat);
      leg.position.set(x, 0.4, 0);
      talabot.add(leg);
    });

    talabot.scale.set(1.1, 1.1, 1.1);
    return talabot;
  }

  update(dt) {
    if (!this.isActive) return;

    this.time += dt;

    if (this.pointingArm && this.phase === 'confrontation') {
      this.pointingArm.rotation.y = Math.sin(this.time * 4.0) * 0.08;
      this.pointingArm.rotation.x = Math.sin(this.time * 5.5) * 0.05;
    }
    if (this.patoHead && this.phase === 'confrontation') {
      this.patoHead.rotation.z = Math.sin(this.time * 2.8) * 0.06;
      this.patoHead.rotation.y = Math.cos(this.time * 2.1) * 0.08;
    }

    const ey = this.elevationY;

    if (this.time < 3.8) {
      // FASE 0: FROGBERT DORMIDO PLÁCIDAMENTE EN LA COPA DEL ÁRBOL (0.0s - 3.8s)
      this.phase = 'sleeping';

      this.camera.position.set(-0.85, ey + 1.25, 34.2);
      this.camera.lookAt(-1.75, ey + 0.55, 31.8);

      if (this.player.modelContainer) {
        this.player.modelContainer.scale.y = 1.0 + Math.sin(this.time * 3.2) * 0.06;
      }

      this.zzzSprites.forEach(item => {
        const cycle = (this.time * 0.8 + item.offset) % 1.6;
        item.sprite.position.y = ey + 0.85 + cycle;
        item.sprite.position.x = item.baseX + Math.sin(this.time * 2.8 + item.offset) * 0.12;
        const alpha = Math.sin((cycle / 1.6) * Math.PI);
        item.sprite.material.opacity = Math.max(0, alpha);
        const sc = item.scale * (0.85 + alpha * 0.25);
        item.sprite.scale.set(sc, sc, 1);
      });

      this.snoreTimer += dt;
      if (this.snoreTimer >= 1.8) {
        this.snoreTimer = 0;
        audio.playFrogSnore();
      }

      if (this.hud) {
        this.hud.showDialogue(
          'FROGBERT',
          'Zzz... Zzz... Qué sabrosa siesta en la copa del monumental Árbol Sagrado... Zzz...',
          null,
          () => this.advanceToWakeUp()
        );
      }

    } else if (this.time < 6.0) {
      // FASE 1: DESPERTAR SOBRESALTADO & TRANSICIÓN DE CÁMARA PS2 (3.8s - 6.0s)
      this.phase = 'wake_up';

      this.zzzSprites.forEach(item => { item.sprite.visible = false; });

      const tWake = (this.time - 3.8) / 2.2;
      const easeT = tWake * tWake * (3 - 2 * tWake);
      this.camera.position.set(
        THREE.MathUtils.lerp(-0.85, -0.55, easeT),
        THREE.MathUtils.lerp(ey + 1.25, ey + 2.35, easeT),
        THREE.MathUtils.lerp(34.2, 35.5, easeT)
      );
      const lookX = THREE.MathUtils.lerp(-1.75, 0.35, easeT);
      const lookY = THREE.MathUtils.lerp(ey + 0.55, ey + 2.65, easeT);
      const lookZ = THREE.MathUtils.lerp(31.8, 27.4, easeT);
      this.camera.lookAt(lookX, lookY, lookZ);

      if (!this.wokeUp) {
        this.wokeUp = true;
        audio.playStartledGasp();
        this.player.setSleepingPose(false);
        this.player.eyelids.forEach(el => { el.rotation.x = -Math.PI / 1.9; });
        this.player.mesh.rotation.set(-0.15, 2.95, 0);
      }

      if (this.time < 4.6) {
        const hopRatio = (this.time - 3.8) / 0.8;
        this.player.mesh.position.y = ey + 0.55 + Math.sin(hopRatio * Math.PI) * 0.45;
      } else {
        this.player.mesh.position.y = ey + 0.55;
      }

      this.talabots.forEach(tb => {
        if (tb.sawBlade) tb.sawBlade.rotation.x += dt * 12;
      });

      if (this.hud && this.time > 4.2) {
        this.hud.showDialogue(
          'FROGBERT',
          '¿¡EH...!? ¿¡Qué es ese ruido de motosierras?! ¿¡Y quién es ese pato con chaleco naranja en mi árbol?!',
          null,
          () => {
            this.time = 6.0;
          }
        );
      }

    } else if (this.time < 10.5) {
      // FASE 2: CONFRONTACIÓN ÉPICA CON GOBERNADOR PATO LEMUS (6.0s - 10.5s)
      this.phase = 'confrontation';
      this.zzzSprites.forEach(item => { item.sprite.visible = false; });

      // Cámara contrapicada PS2 con sutil paneo respiratorio mostrando copete cobrizo y chaleco naranja
      const camBob = Math.sin(this.time * 1.8) * 0.08;
      this.camera.position.set(-0.55 + camBob, ey + 2.35, 35.5);
      this.camera.lookAt(0.35, ey + 2.65, 27.4);

      this.player.position.set(-1.75, ey + 0.55, 31.8);
      this.player.mesh.position.copy(this.player.position);
      this.player.mesh.scale.set(0.74, 0.74, 0.74);
      this.player.mesh.rotation.set(-0.15, 2.95, 0);

      this.talabots.forEach((tb, idx) => {
        if (tb.sawBlade) tb.sawBlade.rotation.x += dt * 20;
        tb.position.y = ey + 0.45 + Math.abs(Math.sin(this.time * 5 + idx)) * 0.08;
      });

      if (this.hud) {
        this.hud.showDialogue(
          'GOBERNADOR PATO LEMUS',
          '¡ÁNIMO, PEQUEÑA RANA! ESTE BOSQUE AHORA SE MODERNIZA AL ESTILO TALACORP.\nMIS MINI-TALABOTS YA ESTÁN ABAJO PELEANDO CON TUS AMIGOS...\n¡Y TÚ QUEDAS OFICIALMENTE DESALOJADO DE MI ÁRBOL!',
          null,
          () => {
            this.time = 10.5;
          }
        );
      }

    } else if (this.time < 12.3) {
      // FASE 3: PATADA FOSFO-FOSFO DE PATO LEMUS (10.5s - 12.3s)
      this.phase = 'kick';
      if (this.hud && this.hud.dialogueBox.style.display === 'flex') {
        this.hud.closeDialogue();
      }

      const kickProgress = (this.time - 10.5) / 1.8;

      if (kickProgress < 0.35) {
        const windRatio = kickProgress / 0.35;
        if (this.patoLemus) this.patoLemus.rotation.x = -windRatio * 0.28;
        if (this.rightLegPivot) {
          this.rightLegPivot.rotation.x = -windRatio * 1.5;
          this.rightLegPivot.position.y = 1.35 + windRatio * 0.25;
        }
        if (this.pointingArm) {
          this.pointingArm.position.z = 0.4 - windRatio * 0.35;
        }
      } else if (kickProgress < 0.50) {
        const snapRatio = (kickProgress - 0.35) / 0.15;
        if (this.patoLemus) this.patoLemus.rotation.x = -0.28 + snapRatio * 0.45;
        if (this.rightLegPivot) {
          this.rightLegPivot.rotation.x = -1.5 + snapRatio * 3.35;
          this.rightLegPivot.position.y = 1.6 - snapRatio * 0.25;
        }
        if (this.pointingArm) {
          this.pointingArm.position.z = 0.05 + snapRatio * 0.45;
        }
      } else if (kickProgress < 0.70) {
        if (this.rightLegPivot) this.rightLegPivot.rotation.x = 1.85;
        this.powStar.visible = true;
        const pulse = 1.4 + Math.sin((kickProgress - 0.5) * 35) * 0.4;
        this.powStar.scale.set(pulse * 1.6, pulse * 1.6, 0.6);
        this.powStar.rotation.z += dt * 15;

        this.camera.position.x = -0.65 + (Math.random() - 0.5) * 0.32;
        this.camera.position.y = ey + 1.70 + (Math.random() - 0.5) * 0.32;

        if (!this.kickSoundPlayed) {
          this.kickSoundPlayed = true;
          audio.playKickImpact();
        }

        this.player.eyelids.forEach(el => { el.rotation.x = -Math.PI / 2; });
        this.player.mesh.scale.set(0.92, 0.52, 0.92);
      } else {
        this.powStar.visible = false;
        if (this.patoLemus) this.patoLemus.rotation.x = 0;
        if (this.rightLegPivot) {
          this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, dt * 8);
          this.rightLegPivot.position.y = 1.35;
        }
        if (this.patoLemus) {
          this.patoLemus.position.y = ey + 0.45 + Math.sin(this.time * 14) * 0.06;
        }
      }

    } else if (this.time < 16.2) {
      // FASE 4: CAÍDA LIBRE VERTICAL EN PICADA (54 METROS DESDE LA COPA HASTA LA BASE)
      this.phase = 'flight';
      this.player.mesh.scale.set(1, 1, 1);
      this.powStar.visible = false;
      this.flightTime += dt;
      const progress = Math.min(1.0, this.flightTime / 3.9);

      const t = progress;
      const invT = 1.0 - t;

      const p0 = this.flightStartPos;
      const p1 = this.flightApexPos;
      const p2 = this.flightMidPos;
      const p3 = this.flightEndPos;

      const c0 = invT * invT * invT;
      const c1 = 3 * invT * invT * t;
      const c2 = 3 * invT * t * t;
      const c3 = t * t * t;

      const x = c0 * p0.x + c1 * p1.x + c2 * p2.x + c3 * p3.x;
      const y = c0 * p0.y + c1 * p1.y + c2 * p2.y + c3 * p3.y;
      const z = c0 * p0.z + c1 * p1.z + c2 * p2.z + c3 * p3.z;

      this.player.position.set(x, y, z);
      this.player.mesh.position.copy(this.player.position);

      this.player.mesh.rotation.x += dt * 16;
      this.player.mesh.rotation.z += dt * 10;
      this.player.mesh.rotation.y += dt * 6;

      // Cámara dramática persiguiendo la caída frente al tronco colosal
      this.camera.position.set(x + 6.0 * Math.cos(progress * 3.0), y + 4.5, z + 8.0);
      this.camera.lookAt(this.player.position);

      if (!this.flightSoundPlayed) {
        this.flightSoundPlayed = true;
        audio.playFlightWhoosh();
      }

    } else if (this.time < 17.7) {
      // FASE 5: ATERRIZAJE FORZOSO EN LA BASE DEL ÁRBOL
      this.phase = 'crash';
      this.player.position.copy(this.flightEndPos);
      this.player.mesh.position.copy(this.player.position);
      this.player.mesh.rotation.set(0, Math.PI, 0);

      this.camera.position.lerp(new THREE.Vector3(0, 3.4, 22.5), 0.12);
      this.camera.lookAt(this.player.position);

      if (!this.crashSoundPlayed) {
        this.crashSoundPlayed = true;
        audio.playCrashLanding();
        if (this.player.particles) {
          this.player.particles.spawnDustPuff(this.player.position, 26, 0x5d4037);
        }
      }

    } else if (this.time < 22.5) {
      // FASE 6: FROGBERT ENFURECIDO ENSAYA SU PATADA TRASERA Y JURA VENGANZA
      this.phase = 'angry';
      this.player.position.copy(this.flightEndPos);
      this.player.mesh.position.copy(this.player.position);
      this.player.setSleepingPose(false);
      this.player.setAngryPose(true);
      this.player.mesh.rotation.set(0, 0, 0);

      // Ensayo de patada trasera en la cinemática
      if (!this.angryKickPlayed && this.time > 18.2) {
        this.angryKickPlayed = true;
        if (this.player.startKick) {
          this.player.startKick(null, [], null, null);
        }
      }

      if (Math.random() < 0.28 && this.player.particles) {
        const steamPos = this.player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.2, 0));
        this.player.particles.spawnDustPuff(steamPos, 2, 0xffffff);
      }

      this.camera.position.lerp(new THREE.Vector3(1.4, 2.8, 20.8), 0.08);
      this.camera.lookAt(this.player.position.x, this.player.position.y + 0.6, this.player.position.z);

      if (this.hud) {
        this.hud.showDialogue(
          'FROGBERT',
          '¡GRRR! ¡Maldito Gobernador Pato Lemus! ¡Patearé a sus Mini-Talabots con mis patas traseras [F / Clic Der.], subiré el gran árbol y destruiré la Antena Central de la cima!',
          null,
          () => {
            this.finish();
          }
        );
      }

    } else {
      this.finish();
    }
  }

  advanceToWakeUp() {
    this.time = 4.3;
    this.phase = 'wake_up';
    this.wokeUp = true;
    this.zzzSprites.forEach(item => { item.sprite.visible = false; });
    this.player.setSleepingPose(false);
    this.player.eyelids.forEach(el => { el.rotation.x = -Math.PI / 1.9; });
    this.player.mesh.rotation.set(-0.15, 2.95, 0);
    this.player.mesh.position.y = this.elevationY + 0.55;
    this.camera.position.set(-0.55, this.elevationY + 2.35, 35.5);
    this.camera.lookAt(0.35, this.elevationY + 2.65, 27.4);
    if (this.hud) {
      this.hud.showDialogue(
        'FROGBERT',
        '¿¡EH...!? ¿¡Qué es ese ruido de motosierras?! ¿¡Y quién es ese pato con chaleco naranja en mi árbol?!',
        null,
        () => this.advanceToConfrontation()
      );
    }
  }

  advanceToConfrontation() {
    this.time = 6.1;
    this.phase = 'confrontation';
    this.zzzSprites.forEach(item => { item.sprite.visible = false; });
    this.camera.position.set(-0.55, this.elevationY + 2.35, 35.5);
    this.camera.lookAt(0.35, this.elevationY + 2.65, 27.4);
    this.player.position.set(-1.75, this.elevationY + 0.55, 31.8);
    this.player.mesh.position.copy(this.player.position);
    this.player.mesh.scale.set(0.74, 0.74, 0.74);
    this.player.mesh.rotation.set(-0.15, 2.95, 0);
    if (this.hud) {
      this.hud.showDialogue(
        'GOBERNADOR PATO LEMUS',
        '¡ÁNIMO, PEQUEÑA RANA! ESTE BOSQUE AHORA SE MODERNIZA AL ESTILO TALACORP.\nMIS MINI-TALABOTS YA ESTÁN ABAJO PELEANDO CON TUS AMIGOS...\n¡Y TÚ QUEDAS OFICIALMENTE DESALOJADO DE MI ÁRBOL!',
        null,
        () => this.advanceToKick()
      );
    }
  }

  advanceToKick() {
    this.time = 10.5;
    this.phase = 'kick';
    if (this.hud) this.hud.closeDialogue();
  }

  skip() {
    if (!this.isActive) return;
    this.finish();
  }

  finish() {
    if (!this.isActive) return;
    this.isActive = false;
    document.body.classList.remove('in-cinematic');

    this.scene.remove(this.cinematicGroup);

    this.camera.fov = 65;
    this.camera.updateProjectionMatrix();

    // Posicionar a Frogbert en el hongo de inicio frente al tronco de 15m de radio
    this.player.mesh.scale.set(1, 1, 1);
    this.player.position.set(0, 1.6, 16.5);
    this.player.prevPosition.copy(this.player.position);
    this.player.lastCheckpoint.set(0, 1.6, 16.5);
    this.player.mesh.position.copy(this.player.position);
    this.player.velocity.set(0, 0, 0);
    this.player.mesh.rotation.set(0, 0, 0);
    this.player.setSleepingPose(false);
    this.player.setAngryPose(true);

    if (this.hud) {
      this.hud.showDialogue(
        'FROGBERT',
        '¡GRRR! ¡Los Mini-Talabots están atacando a los animales abajo del árbol! ¡Les daré patadas traseras con [F / Clic Derecho] y subiré a la cima para destruir la Antena Central!',
        null,
        () => {
          this.hud.closeDialogue();
        }
      );
    }

    if (this.onComplete) {
      this.onComplete();
    }
  }
}
