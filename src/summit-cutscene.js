import * as THREE from 'three';
import { TalacorpHelicopter } from './helicopter.js';
import { audio } from './audio.js';
import { createPatoLemusModel } from './pato-lemus-model.js';

export class SummitCutscene {
  constructor(scene, camera, player, boss, hud, onComplete) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.boss = boss;
    this.hud = hud;
    this.onComplete = onComplete;

    this.isActive = true;
    this.time = 0;
    this.phase = 'dialogue'; // 'dialogue' | 'heli_arrive' | 'boarding' | 'escape' | 'finished'
    this.isBoarded = false;

    document.body.classList.add('in-cinematic');

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.summitY = 56.9;

    // 1. Helicóptero corporativo TALACORP
    this.helicopter = new TalacorpHelicopter(this.scene);

    // 2. Modelo 3D PS2 de Gobernador Pato Lemus (Chaleco naranja, camisa blanca, copete pelirrojo)
    const pato = createPatoLemusModel();
    this.patoLemus = pato.mesh;
    this.patoHead = pato.headGroup;
    this.pointingArm = pato.pointingArm;
    this.leftArm = pato.leftArm;
    this.rightLegPivot = pato.rightLegPivot;
    this.leftLegPivot = pato.leftLegPivot;
    this.tieBody = pato.tieBody;
    this.crestCenter = pato.crestCenter;
    this.crestLeft = pato.crestLeft;
    this.crestRight = pato.crestRight;

    this.patoStartPos = new THREE.Vector3(0, this.summitY, 1.8);
    this.patoLemus.position.copy(this.patoStartPos);
    this.patoLemus.scale.set(1.2, 1.2, 1.2);
    this.patoLemus.rotation.set(0, 0.12, 0);
    this.group.add(this.patoLemus);

    // 3. Poner al jefe TALABOT TITÁN en modo latente
    if (this.boss) {
      this.boss.state = 'dormant';
      this.boss.mesh.position.set(3.2, this.summitY, -1.2);
      this.boss.mesh.lookAt(0, this.summitY, 7.5);
    }
  }

  update(dt) {
    if (!this.isActive) return;

    this.time += dt;
    const sy = this.summitY;

    if (this.helicopter) {
      this.helicopter.update(dt);
    }

    if (this.time < 4.8) {
      // ==========================================
      // FASE 1: Diálogo de confrontación y revelación de la Antena Central (0.0s - 4.8s)
      // ==========================================
      this.phase = 'dialogue';

      this.camera.position.lerp(new THREE.Vector3(-0.8, sy + 1.7, 5.2), 0.08);
      this.camera.lookAt(0, sy + 1.3, 1.2);

      if (this.patoLemus) {
        this.patoLemus.position.y = this.patoStartPos.y + Math.sin(this.time * 4) * 0.04;
      }
      if (this.pointingArm) {
        this.pointingArm.rotation.y = Math.sin(this.time * 3) * 0.08;
        this.pointingArm.rotation.x = -0.1 + Math.sin(this.time * 5) * 0.05;
      }
      if (this.patoHead) {
        this.patoHead.rotation.z = Math.sin(this.time * 2) * 0.06;
      }

      if (this.hud) {
        this.hud.showDialogue(
          'GOBERNADOR PATO LEMUS',
          '¡¿TÚ OTRA VEZ, RANA?! ¡Mientras el TALABOT TITÁN proteja mi ANTENA CENTRAL con su escudo, mis Mini-Talabots seguirán controlando la base del árbol para siempre!',
          null,
          () => {
            this.time = 4.8;
          }
        );
      }

    } else if (this.time < 8.5) {
      // ==========================================
      // FASE 2: Llegada del Helicóptero TALACORP (4.8s - 8.5s)
      // ==========================================
      if (this.phase !== 'heli_arrive') {
        this.phase = 'heli_arrive';
        this.helicopter.startArrival(new THREE.Vector3(4.2, sy + 1.6, 1.8));

        if (this.hud) {
          this.hud.showDialogue(
            'GOBERNADOR PATO LEMUS',
            '¡TALABOT TITÁN, APLÁSTALO AL ESTILO TALACORP! ¡Yo tengo agenda llena inaugurando un MegaMall! ¡ÁNIMO Y HASTA NUNCA!',
            null,
            () => {
              this.hud.closeDialogue();
              this.time = 8.5;
            }
          );
        }
      }

      this.camera.position.lerp(new THREE.Vector3(-1.2, sy + 3.0, 9.2), 0.08);
      this.camera.lookAt(1.8, sy + 2.0, 0.8);

      if (this.crestCenter) {
        this.crestCenter.rotation.x = -0.22 + Math.sin(this.time * 32) * 0.12;
      }

      if (this.patoHead) {
        this.patoHead.rotation.x = 0.15 + Math.sin(this.time * 16) * 0.12;
      }
      if (this.pointingArm) {
        this.pointingArm.rotation.z = Math.sin(this.time * 14) * 0.35;
      }

    } else if (this.time < 11.1) {
      // ==========================================
      // FASE 3: Pato Lemus sube al patín del helicóptero (8.5s - 11.1s)
      // ==========================================
      if (this.phase !== 'boarding') {
        this.phase = 'boarding';
        if (this.hud) this.hud.closeDialogue();
      }

      const boardProgress = Math.min((this.time - 8.5) / 1.4, 1.0);

      if (boardProgress < 1.0) {
        const start = this.patoStartPos;
        const target = new THREE.Vector3(3.05, sy + 1.7, 2.0);

        this.patoLemus.position.lerpVectors(start, target, boardProgress);
        this.patoLemus.position.y += Math.sin(boardProgress * Math.PI) * 0.9;

        this.patoLemus.rotation.y = Math.PI * 0.42;

        const legStride = Math.sin(boardProgress * 22) * 0.65;
        if (this.rightLegPivot) this.rightLegPivot.rotation.x = legStride;
        if (this.leftLegPivot) this.leftLegPivot.rotation.x = -legStride;

        if (this.pointingArm) this.pointingArm.rotation.set(-0.4, 0.2, 0.4);
        if (this.leftArm) this.leftArm.rotation.set(-0.4, -0.2, -0.4);

      } else if (!this.isBoarded) {
        this.isBoarded = true;
        this.group.remove(this.patoLemus);
        this.helicopter.mesh.add(this.patoLemus);

        this.patoLemus.position.set(-1.15, 0.1, 0.2);
        this.patoLemus.rotation.set(0, -0.35, 0);

        if (this.leftArm) {
          this.leftArm.rotation.set(-0.7, 0.4, 0.3);
        }
        if (this.rightLegPivot) this.rightLegPivot.rotation.x = 0;
        if (this.leftLegPivot) this.leftLegPivot.rotation.x = 0;
      }

      if (this.isBoarded) {
        if (this.pointingArm) {
          this.pointingArm.rotation.set(-1.2, 0, Math.sin(this.time * 16) * 0.45);
        }
        if (this.patoHead) {
          this.patoHead.rotation.set(0.1, -0.35, 0);
        }
      }

      this.camera.position.lerp(new THREE.Vector3(0.5, sy + 3.4, 8.2), 0.08);
      this.camera.lookAt(3.05, sy + 3.2, 2.0);

    } else if (this.time < 14.8) {
      // ==========================================
      // FASE 4: Despegue a toda potencia y despertar de Talabot (11.1s - 14.8s)
      // ==========================================
      if (this.phase !== 'escape') {
        this.phase = 'escape';
        this.helicopter.startDeparture(new THREE.Vector3(-55, sy + 45, 50));

        if (this.boss) {
          audio.playBossAlarm();
          this.boss.state = 'idle';
        }
      }

      if (this.isBoarded) {
        if (this.pointingArm) {
          this.pointingArm.rotation.set(-1.2, 0, Math.sin(this.time * 18) * 0.45);
        }
        if (this.crestCenter) {
          this.crestCenter.rotation.x = -0.22 + Math.sin(this.time * 40) * 0.15;
        }
      }

      if (this.time < 12.8) {
        const hPos = this.helicopter.mesh.position;
        this.camera.position.lerp(new THREE.Vector3(hPos.x + 8, hPos.y - 1.0, hPos.z + 14), 0.06);
        this.camera.lookAt(hPos.x, hPos.y, hPos.z);
      } else {
        const p = this.player.position;
        this.camera.position.lerp(new THREE.Vector3(p.x, p.y + 3.8, p.z + 8.5), 0.08);
        this.camera.lookAt(0, sy + 0.8, 0);
      }

    } else {
      this.finish();
    }
  }

  skip() {
    if (!this.isActive) return;
    this.finish();
  }

  finish() {
    if (!this.isActive) return;
    this.isActive = false;
    this.phase = 'finished';
    document.body.classList.remove('in-cinematic');

    if (this.hud) this.hud.closeDialogue();
    this.scene.remove(this.group);

    if (this.helicopter && this.helicopter.mesh) {
      this.helicopter.mesh.visible = false;
      this.scene.remove(this.helicopter.mesh);
    }

    if (this.boss) {
      this.boss.state = 'idle';
      audio.playBossAlarm();
    }

    if (this.onComplete) {
      this.onComplete();
    }
  }
}

/**
 * Cinemática final PS2 al destruir la Antena Central de TALACORP:
 * Muestra el colapso de la torre en la cima y corta a la base del árbol donde
 * todos los Mini-Talabots se apagan permanentemente y los NPCs festejan.
 */
export class AntennaLiberationCutscene {
  constructor(scene, camera, player, level, hud, particles, onComplete) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.level = level;
    this.hud = hud;
    this.particles = particles;
    this.onComplete = onComplete;

    this.isActive = true;
    this.time = 0;
    this.botsShutDownTriggered = false;

    document.body.classList.add('in-cinematic');

    // Colocar a Frogbert mirando hacia la antena colapsando
    this.player.position.set(0, 56.9, -3.5);
    this.player.mesh.position.copy(this.player.position);
    this.player.mesh.rotation.set(0, Math.PI, 0);

    if (this.hud) {
      this.hud.showDialogue(
        'FROGBERT',
        '¡TOMA ESO, ANTENA DE TALACORP! ¡Adiós a la señal de control remoto de Pato Lemus!',
        null,
        () => {
          if (this.time < 3.2) this.time = 3.2;
        }
      );
    }
  }

  update(dt) {
    if (!this.isActive) return;
    this.time += dt;

    if (this.time < 3.4) {
      // FASE 1: Explosiones en la Antena Central de la cima y salto de victoria de Frogbert
      this.camera.position.lerp(new THREE.Vector3(3.6, 59.5, -1.2), 0.08);
      this.camera.lookAt(0, 59.0, -7.8);

      // Frogbert salta celebrando
      const hop = Math.abs(Math.sin(this.time * 7.0)) * 0.7;
      this.player.mesh.position.set(0, 56.9 + hop, -3.5);
      this.player.mesh.rotation.y = Math.sin(this.time * 4.0) * 0.4;

      if (this.particles && Math.random() < 0.35) {
        const sparkPos = new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          57.5 + Math.random() * 4.0,
          -7.8 + (Math.random() - 0.5) * 2.0
        );
        this.particles.spawnSparks(sparkPos, 10);
      }
    } else if (this.time < 8.0) {
      // FASE 2: Corte de cámara a la base del Árbol Sagrado: ¡los Mini-Talabots caen fulminados!
      if (!this.botsShutDownTriggered) {
        this.botsShutDownTriggered = true;
        if (this.level && this.level.shutDownAllMiniTalabots) {
          this.level.shutDownAllMiniTalabots();
        }
        if (this.hud) {
          this.hud.showDialogue(
            'CHIPPY Y LOS ANIMALES',
            '¡HURRA POR FROGBERT! ¡La señal de la Antena Central se apagó y todos los Mini-Talabots quedaron hechos chatarra! ¡El Árbol Sagrado es libre!',
            null,
            () => this.finish()
          );
        }
      }

      const panAngle = (this.time - 3.4) * 0.35;
      this.camera.position.set(
        Math.sin(panAngle) * 10.0,
        4.6,
        24.5 + Math.cos(panAngle) * 2.0
      );
      this.camera.lookAt(0, 1.8, 16.5);
    } else {
      this.finish();
    }
  }

  skip() {
    if (!this.isActive) return;
    this.finish();
  }

  finish() {
    if (!this.isActive) return;
    this.isActive = false;
    document.body.classList.remove('in-cinematic');
    if (this.hud) this.hud.closeDialogue();
    if (this.level && !this.botsShutDownTriggered && this.level.shutDownAllMiniTalabots) {
      this.level.shutDownAllMiniTalabots();
    }
    if (this.onComplete) this.onComplete();
  }
}
