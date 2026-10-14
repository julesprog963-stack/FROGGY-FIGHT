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

    // Contenedores 3D de la cinemática
    this.cinematicGroup = new THREE.Group();
    this.scene.add(this.cinematicGroup);

    // Entidades y elementos clave
    this.patoLemus = null;
    this.rightLegPivot = null;
    this.pointingArm = null;
    this.talabots = [];
    this.powStar = null;
    this.zzzSprites = [];
    this.lanternLights = [];
    this.sleepingMat = null;

    // Control de sueño y despertar
    this.snoreTimer = 0;
    this.wokeUp = false;

    // Elevación a la copa del Árbol Sagrado (y ≈ 38.5m)
    this.elevationY = 38.5;

    // Trayectoria de vuelo y caída libre de Frogbert desde la copa hasta la base
    this.flightStartPos = new THREE.Vector3(-1.75, this.elevationY + 0.35, 26.8);
    this.flightApexPos = new THREE.Vector3(0, this.elevationY + 3.2, 24.0);
    this.flightMidPos = new THREE.Vector3(1.2, 19.5, 17.5);
    this.flightEndPos = new THREE.Vector3(0, 1.6, 11.0);
    this.flightTime = 0;

    // Control de audio
    this.kickSoundPlayed = false;
    this.flightSoundPlayed = false;
    this.crashSoundPlayed = false;

    this.setupScene();
  }

  setupScene() {
    const ey = this.elevationY;

    // 1. ARENA DE MADERA CIRCULAR EN LA COPA DEL ÁRBOL
    const woodMat = new THREE.MeshLambertMaterial({
      color: 0x5a381e,
      flatShading: true
    });
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 0.7, 32), woodMat);
    deck.position.set(0, ey + 0.05, 22.0);
    this.cinematicGroup.add(deck);

    // Borde de tablones de la arena
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x3d2311, flatShading: true });
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(18.2, 18.2, 0.35, 32), rimMat);
    rim.position.set(0, ey + 0.35, 22.0);
    this.cinematicGroup.add(rim);

    // 2. GRAN TRONCO SAGRADO QUE ATRAVIESA TODO EL FONDO DESDE EL SUELO HASTA LA CIMA
    const trunkBarkMat = new THREE.MeshLambertMaterial({ color: 0x1f140a, flatShading: true });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 10.5, 54, 16), trunkBarkMat);
    trunk.position.set(0, 27, 0);
    this.cinematicGroup.add(trunk);

    // Vigas de soporte rústicas debajo del mirador de la copa
    const beamMat = new THREE.MeshLambertMaterial({ color: 0x2e1a0c, flatShading: true });
    [-6, 0, 6].forEach(bx => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 12, 1.2), beamMat);
      beam.position.set(bx, ey - 6, 21.0);
      beam.rotation.z = bx * 0.03;
      this.cinematicGroup.add(beam);
    });

    // Luz frontal suave directa para iluminar el rostro y traje de Pato Lemus
    const keyLight = new THREE.DirectionalLight(0xfffae6, 1.4);
    keyLight.position.set(-1, ey + 5, 32);
    this.cinematicGroup.add(keyLight);

    // 3. TORRES DE VIGILANCIA CON ESTANDARTES Y FAROLES (Izquierda y Derecha)
    this.buildWatchtower(-4.8, 19.5, 1, ey);
    this.buildWatchtower(4.8, 19.5, -1, ey);

    // 4. PILARES INDUSTRIALES DEL FONDO CON BALIZAS ROJAS (TALACORP)
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x151b22, flatShading: true });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3838 });

    const pillarCoords = [
      { x: -9.5, z: 10.0, h: 20 },
      { x: -3.8, z: 8.0, h: 26 },
      { x: 3.8, z: 8.0, h: 26 },
      { x: 9.5, z: 10.0, h: 20 }
    ];

    pillarCoords.forEach(c => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(1.6, c.h, 1.6), pillarMat);
      col.position.set(c.x, c.h * 0.5, c.z);
      this.cinematicGroup.add(col);

      // Baliza roja superior
      const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), beaconMat);
      beacon.position.set(c.x, c.h + 0.4, c.z);
      this.cinematicGroup.add(beacon);

      const redLight = new THREE.PointLight(0xff3838, 1.8, 14);
      redLight.position.set(c.x, c.h + 0.6, c.z);
      this.cinematicGroup.add(redLight);
    });

    // 5. MODELO FIEL 3D DE PATO LEMUS (Idéntico a la imagen de referencia)
    this.patoLemus = this.createPatoLemusModel();
    this.patoLemus.position.set(0.55, ey + 0.45, 22.4);
    this.patoLemus.scale.set(1.22, 1.22, 1.22);
    this.patoLemus.rotation.set(0, -0.22, 0); // Orientación de 3/4 majestuosa
    this.cinematicGroup.add(this.patoLemus);

    // TALABOTS ESCOLTAS DE TALACORP (Flanqueando a Pato Lemus)
    const talabotLeft = this.createTalabotModel(-1);
    talabotLeft.position.set(-2.8, ey + 0.45, 21.6);
    talabotLeft.rotation.y = 0.35;
    this.cinematicGroup.add(talabotLeft);
    this.talabots.push(talabotLeft);

    const talabotRight = this.createTalabotModel(1);
    talabotRight.position.set(3.4, ey + 0.45, 21.6);
    talabotRight.rotation.y = -0.35;
    this.cinematicGroup.add(talabotRight);
    this.talabots.push(talabotRight);

    // 6. ESTERILLA DE HOJAS Y ALMOHADITA DE SIESTA DE FROGBERT
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x27ae60, flatShading: true });
    const sleepingDeck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 2.6), leafMat);
    sleepingDeck.position.set(-1.75, ey + 0.12, 26.8);
    this.cinematicGroup.add(sleepingDeck);
    this.sleepingMat = sleepingDeck;

    const pillowMat = new THREE.MeshLambertMaterial({ color: 0x2ecc71, flatShading: true });
    const pillow = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.4, 8), pillowMat);
    pillow.rotation.z = Math.PI / 2;
    pillow.position.set(-1.75, ey + 0.22, 25.8);
    this.cinematicGroup.add(pillow);

    // FROGBERT EN SU SIESTA SAGRADA (Ojos cerrados, tumbado plácidamente)
    this.flightStartPos.set(-1.75, ey + 0.35, 26.8);
    this.player.position.copy(this.flightStartPos);
    this.player.mesh.position.copy(this.player.position);
    this.player.mesh.scale.set(0.72, 0.72, 0.72);
    this.player.mesh.rotation.set(-0.15, 2.95, 0);
    this.player.setSleepingPose(true);
    this.player.setAngryPose(false);
    if (this.player.backpack) this.player.backpack.visible = true;

    // LETRAS Zzz CÓMICAS FLOTANTES (Pixel-art estilo Rareware)
    this.zzzSprites = [];
    const zTexts = ['Z', 'z', 'Z'];
    const zScales = [0.45, 0.35, 0.55];
    for (let i = 0; i < 3; i++) {
      const zTex = Textures.createZzzTexture(zTexts[i]);
      const zSpriteMat = new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false });
      const zSprite = new THREE.Sprite(zSpriteMat);
      zSprite.scale.set(zScales[i], zScales[i], 1);
      zSprite.position.set(-1.6 + i * 0.25, ey + 0.95 + i * 0.35, 26.8);
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
    this.powStar.position.set(-1.15, ey + 1.25, 25.5);
    this.powStar.visible = false;
    this.cinematicGroup.add(this.powStar);

    // 8. CÁMARA INICIAL: PRIMER PLANO CÁLIDO DE FROGBERT DURMIENDO EN LA COPA
    this.camera.position.set(-0.85, ey + 1.25, 29.2);
    this.camera.lookAt(-1.75, ey + 0.55, 26.8);
    this.camera.fov = 50;
    this.camera.updateProjectionMatrix();

    // Diálogo inicial de Frogbert durmiendo
    if (this.hud) {
      this.hud.showDialogue(
        'FROGBERT',
        'Zzz... Zzz... Qué sabrosa siesta en lo alto del Árbol Sagrado... Zzz...'
      );
    }
  }

  buildWatchtower(x, z, side, y = 0) {
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x4a2e16, flatShading: true });
    const beamMat = new THREE.MeshLambertMaterial({ color: 0x3d2714, flatShading: true });
    const towerGroup = new THREE.Group();
    towerGroup.position.set(x, y, z);

    // 4 Postes verticales
    [-1.2, 1.2].forEach(px => {
      [-1.2, 1.2].forEach(pz => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 11, 6), beamMat);
        post.position.set(px, 5.5, pz);
        towerGroup.add(post);
      });
    });

    // Plataforma de madera superior
    const plat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.35, 3.0), woodMat);
    plat.position.set(0, 6.5, 0);
    towerGroup.add(plat);

    // Techo cónico
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 5), beamMat);
    roof.position.set(0, 11.2, 0);
    towerGroup.add(roof);

    // TALACORP usa el rostro de Pato Lemus en sus estandartes.
    const banner = createLemusBanner();
    banner.position.set(0, 3.8, 1.4);
    banner.rotation.y = (side === 1) ? 0.2 : -0.2; // Sutil ángulo hacia el frente
    towerGroup.add(banner);

    // Farol cálido amarillo colgante
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
    this.pointingArm = pato.pointingArm;
    this.rightLegPivot = pato.rightLegPivot;
    return pato.mesh;
  }

  createTalabotModel(side = 1) {
    const talabot = new THREE.Group();
    const metalMat = new THREE.MeshLambertMaterial({ map: Textures.createTalabotMetal(), flatShading: true });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xff3838 });
    const darkMetalMat = new THREE.MeshLambertMaterial({ color: 0x222f3e, flatShading: true });

    // Cuerpo mecánico cuadrangular
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.0), metalMat);
    body.position.y = 1.4;
    talabot.add(body);

    // Cabeza angular con visor rojo de amenaza
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.8), darkMetalMat);
    head.position.set(0, 2.3, 0.1);
    talabot.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.1), visorMat);
    visor.position.set(0, 2.3, 0.52);
    talabot.add(visor);

    // Tubo de escape trasero
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), darkMetalMat);
    exhaust.position.set(0.35 * side, 2.2, -0.45);
    exhaust.rotation.x = -0.3;
    talabot.add(exhaust);

    // Brazo con sierra mecánica circular giratoria
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), darkMetalMat);
    arm.position.set(0.85 * side, 1.3, 0.3);
    arm.rotation.x = -0.5;
    talabot.add(arm);

    const saw = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 12), metalMat);
    saw.position.set(0.85 * side, 0.75, 0.7);
    saw.rotation.z = Math.PI / 2;
    talabot.add(saw);
    talabot.sawBlade = saw;

    // Patas mecánicas
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

    // Sutil respiración del dedo apuntando durante la confrontación
    if (this.pointingArm && this.phase === 'confrontation') {
      this.pointingArm.rotation.y = Math.sin(this.time * 3.5) * 0.05;
    }

    const ey = this.elevationY;

    // MÁQUINA DE ESTADOS DE LA CINEMÁTICA
    if (this.time < 3.8) {
      // FASE 0: FROGBERT DORMIDO PLÁCIDAMENTE EN LA COPA DEL ÁRBOL (0.0s - 3.8s)
      this.phase = 'sleeping';

      // Cámara en primer plano cálido de Frogbert roncando
      this.camera.position.set(-0.85, ey + 1.25, 29.2);
      this.camera.lookAt(-1.75, ey + 0.55, 26.8);

      // Respiración sutil de la ranita dormida
      if (this.player.modelContainer) {
        this.player.modelContainer.scale.y = 1.0 + Math.sin(this.time * 3.2) * 0.06;
      }

      // Animación de letras Zzz flotantes
      this.zzzSprites.forEach(item => {
        const cycle = (this.time * 0.8 + item.offset) % 1.6;
        item.sprite.position.y = ey + 0.85 + cycle;
        item.sprite.position.x = item.baseX + Math.sin(this.time * 2.8 + item.offset) * 0.12;
        const alpha = Math.sin((cycle / 1.6) * Math.PI);
        item.sprite.material.opacity = Math.max(0, alpha);
        const sc = item.scale * (0.85 + alpha * 0.25);
        item.sprite.scale.set(sc, sc, 1);
      });

      // Sonido tierno de ronquido
      this.snoreTimer += dt;
      if (this.snoreTimer >= 1.8) {
        this.snoreTimer = 0;
        audio.playFrogSnore();
      }

      if (this.hud && this.hud.dialogueBox.style.display !== 'flex') {
        this.hud.showDialogue(
          'FROGBERT',
          'Zzz... Zzz... Qué sabrosa siesta en lo alto del Árbol Sagrado... Zzz...'
        );
      }

    } else if (this.time < 6.0) {
      // FASE 1: DESPERTAR SOBRESALTADO & TRANSICIÓN DE CÁMARA (3.8s - 6.0s)
      this.phase = 'wake_up';

      // Ocultar Zzz
      this.zzzSprites.forEach(item => { item.sprite.visible = false; });

      // Transición fluida de cámara desde el plano cercano al contrapicado épico de referencia
      const tWake = (this.time - 3.8) / 2.2;
      const easeT = tWake * tWake * (3 - 2 * tWake);
      this.camera.position.set(
        THREE.MathUtils.lerp(-0.85, -0.65, easeT),
        THREE.MathUtils.lerp(ey + 1.25, ey + 1.70, easeT),
        THREE.MathUtils.lerp(29.2, 29.2, easeT)
      );
      const lookX = THREE.MathUtils.lerp(-1.75, 0.35, easeT);
      const lookY = THREE.MathUtils.lerp(ey + 0.55, ey + 2.70, easeT);
      const lookZ = THREE.MathUtils.lerp(26.8, 22.4, easeT);
      this.camera.lookAt(lookX, lookY, lookZ);

      // Despertar sobresaltado
      if (!this.wokeUp) {
        this.wokeUp = true;
        audio.playStartledGasp();
        this.player.setSleepingPose(false);
        this.player.eyelids.forEach(el => { el.rotation.x = -Math.PI / 1.9; });
        this.player.mesh.rotation.set(-0.15, 2.95, 0);
      }

      // Pequeño salto cómico de susto
      if (this.time < 4.6) {
        const hopRatio = (this.time - 3.8) / 0.8;
        this.player.mesh.position.y = ey + 0.55 + Math.sin(hopRatio * Math.PI) * 0.4;
      } else {
        this.player.mesh.position.y = ey + 0.55;
      }

      // Sierras de Talabots acelerando
      this.talabots.forEach(tb => {
        if (tb.sawBlade) tb.sawBlade.rotation.x += dt * 10;
      });

      if (this.hud && this.time > 4.2 && this.hud.dialogueBox.innerText.indexOf('ruido') === -1) {
        this.hud.showDialogue(
          'FROGBERT',
          '¿¡EH...!? ¿¡Qué es ese ruido estridente?! ¿¡Quiénes son ustedes y qué hacen en mi árbol?!'
        );
      }

    } else if (this.time < 10.5) {
      // FASE 2: CONFRONTACIÓN ÉPICA EN LA COPA DEL ÁRBOL SAGRADO (6.0s - 10.5s)
      this.phase = 'confrontation';

      // Cámara fija en ángulo bajo contrapicado idéntico a la referencia
      this.camera.position.set(-0.65, ey + 1.70, 29.2);
      this.camera.lookAt(0.35, ey + 2.70, 22.4);

      // Frogbert en primer plano mirando hacia Pato Lemus desde atrás
      this.player.position.set(-1.75, ey + 0.55, 26.8);
      this.player.mesh.position.copy(this.player.position);
      this.player.mesh.scale.set(0.72, 0.72, 0.72);
      this.player.mesh.rotation.set(-0.15, 2.95, 0);

      // Sierras amenazantes de los Talabots
      this.talabots.forEach(tb => {
        if (tb.sawBlade) tb.sawBlade.rotation.x += dt * 18;
      });

      if (this.hud && this.hud.dialogueBox.innerText.indexOf('DUEÑO') === -1) {
        this.hud.showDialogue(
          'PATO LEMUS',
          '¡CROAK, PEQUEÑA RANA...!\nESTE BOSQUE YA TIENE DUEÑO.\nTALACORP LO HACE MÁS GRANDE... AUNQUE TENGA QUE SECARLO TODO.\n¡Y TÚ ESTÁS DESPEDIDO DE ESTE ÁRBOL!'
        );
      }

    } else if (this.time < 12.3) {
      // FASE 3: ANIMACIÓN IMPECABLE DE PATADA (/impeccable) (10.5s - 12.3s)
      this.phase = 'kick';
      if (this.hud && this.hud.dialogueBox.style.display === 'flex') {
        this.hud.closeDialogue();
      }

      const kickProgress = (this.time - 10.5) / 1.8;

      if (kickProgress < 0.35) {
        // ETAPA 1: ANTICIPACIÓN (WINDUP) - Carga hacia atrás con flexión de rodilla
        const windRatio = kickProgress / 0.35;
        if (this.patoLemus) this.patoLemus.rotation.x = -windRatio * 0.28;
        if (this.rightLegPivot) {
          this.rightLegPivot.rotation.x = -windRatio * 1.5; // Dobla rodilla hacia el pecho
          this.rightLegPivot.position.y = 1.35 + windRatio * 0.25;
        }
        if (this.pointingArm) {
          this.pointingArm.position.z = 0.4 - windRatio * 0.35; // Tensa el brazo hacia atrás
        }
      } else if (kickProgress < 0.50) {
        // ETAPA 2: SNAP EXPLOSIVO (DISPARO) - Latigazo en menos de 150ms
        const snapRatio = (kickProgress - 0.35) / 0.15;
        if (this.patoLemus) this.patoLemus.rotation.x = -0.28 + snapRatio * 0.45;
        if (this.rightLegPivot) {
          this.rightLegPivot.rotation.x = -1.5 + snapRatio * 3.35; // De -1.5 a +1.85 (estocada)
          this.rightLegPivot.position.y = 1.6 - snapRatio * 0.25;
        }
        if (this.pointingArm) {
          this.pointingArm.position.z = 0.05 + snapRatio * 0.45;
        }
      } else if (kickProgress < 0.70) {
        // ETAPA 3: HIT-STOP & IMPACTO CÓMICO ¡POW!
        if (this.rightLegPivot) this.rightLegPivot.rotation.x = 1.85;
        this.powStar.visible = true;
        const pulse = 1.4 + Math.sin((kickProgress - 0.5) * 35) * 0.4;
        this.powStar.scale.set(pulse * 1.6, pulse * 1.6, 0.6);
        this.powStar.rotation.z += dt * 15;

        // Micro-sacudida de pantalla (Screen Shake)
        this.camera.position.x = -0.65 + (Math.random() - 0.5) * 0.3;
        this.camera.position.y = ey + 1.70 + (Math.random() - 0.5) * 0.3;

        if (!this.kickSoundPlayed) {
          this.kickSoundPlayed = true;
          audio.playKickImpact();
        }

        // Frogbert ojos desorbitados y compresión cómica de impacto
        this.player.eyelids.forEach(el => { el.rotation.x = -Math.PI / 2; });
        this.player.mesh.scale.set(0.9, 0.55, 0.9);
      } else {
        // ETAPA 4: SEGUIMIENTO & POSE DE VICTORIA ARROGANTE
        this.powStar.visible = false;
        if (this.patoLemus) this.patoLemus.rotation.x = 0;
        if (this.rightLegPivot) {
          this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, dt * 8);
          this.rightLegPivot.position.y = 1.35;
        }
        // Risa de villano de Pato Lemus viendo caer a Frogbert
        if (this.patoLemus) {
          this.patoLemus.position.y = ey + 0.45 + Math.sin(this.time * 14) * 0.06;
        }
      }

    } else if (this.time < 16.0) {
      // FASE 4: CAÍDA LIBRE VERTICAL EN PICADA (38 METROS DESDE LA COPA HASTA LA BASE) (12.3s - 16.0s)
      this.phase = 'flight';
      this.player.mesh.scale.set(1, 1, 1);
      this.powStar.visible = false;
      this.flightTime += dt;
      const progress = Math.min(1.0, this.flightTime / 3.7);

      // Descenso cúbico acelerado por la gravedad
      const t = progress;
      const invT = 1.0 - t;

      // Puntos de control de la curva: Salida copa (39m) -> Salto inicial (42m) -> Caída media (20m) -> Base (1.6m)
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

      // Giros frenéticos de pánico anfibio
      this.player.mesh.rotation.x += dt * 16;
      this.player.mesh.rotation.z += dt * 10;
      this.player.mesh.rotation.y += dt * 6;

      // Cámara en picada vertiginosa persiguiendo la caída pegada al tronco
      this.camera.position.set(x + 5.2, y + 4.2, z + 7.5);
      this.camera.lookAt(this.player.position);

      if (!this.flightSoundPlayed) {
        this.flightSoundPlayed = true;
        audio.playFlightWhoosh();
      }

    } else if (this.time < 17.5) {
      // FASE 5: ATERRIZAJE FORZOSO EN LA BASE DEL ÁRBOL (16.0s - 17.5s)
      this.phase = 'crash';
      this.player.position.copy(this.flightEndPos);
      this.player.mesh.position.copy(this.player.position);
      this.player.mesh.rotation.set(0, Math.PI, 0);

      this.camera.position.lerp(new THREE.Vector3(0, 3.2, 16.5), 0.12);
      this.camera.lookAt(this.player.position);

      if (!this.crashSoundPlayed) {
        this.crashSoundPlayed = true;
        audio.playCrashLanding();
        if (this.player.particles) {
          this.player.particles.spawnDustPuff(this.player.position, 24, 0x5d4037);
        }
      }

    } else if (this.time < 22.0) {
      // FASE 6: FROGBERT ENFURECIDO ENTREGA SU MONÓLOGO DE VENGANZA (17.5s - 22.0s)
      this.phase = 'angry';
      this.player.position.copy(this.flightEndPos);
      this.player.mesh.position.copy(this.player.position);
      this.player.setSleepingPose(false);
      this.player.setAngryPose(true);
      this.player.mesh.rotation.set(0, 0, 0);

      // Partículas de humo saliendo de la cabeza de Frogbert
      if (Math.random() < 0.28 && this.player.particles) {
        const steamPos = this.player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.2, 0));
        this.player.particles.spawnDustPuff(steamPos, 2, 0xffffff);
      }

      this.camera.position.lerp(new THREE.Vector3(0, 2.8, 15.2), 0.08);
      this.camera.lookAt(this.player.position.x, this.player.position.y + 0.6, this.player.position.z);

      if (this.hud && this.hud.dialogueBox.style.display !== 'flex') {
        this.hud.showDialogue(
          'FROGBERT',
          '¡GRRR! ¡Maldito Pato Lemus y su corporación TALACORP! ¡Pisotearon mi siesta y me lanzaron desde la copa del árbol! ¡Subiré de vuelta hasta la cima y recuperaré mi hogar!'
        );
      }

    } else {
      // FASE 7: FIN DE CINEMÁTICA Y PASO A GAMEPLAY ACTIVO
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

    // Posicionar a Frogbert en la plataforma de inicio
    this.player.mesh.scale.set(1, 1, 1);
    this.player.position.set(0, 1.6, 11.0);
    this.player.mesh.position.copy(this.player.position);
    this.player.velocity.set(0, 0, 0);
    this.player.mesh.rotation.set(0, 0, 0);
    this.player.setSleepingPose(false);
    this.player.setAngryPose(true);

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
