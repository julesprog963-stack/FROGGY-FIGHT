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

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // 1. Helicóptero corporativo TALACORP
    this.helicopter = new TalacorpHelicopter(this.scene);

    // 2. Modelo 3D de alta fidelidad de Pato Lemus (idéntico a la cinemática de inicio)
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

    // Posición inicial en la cima del tocón talado
    // Frente del modelo es +Z: rotación Y = 0 mira hacia Frogbert (hacia el sur)
    this.patoStartPos = new THREE.Vector3(0, 40.8, 1.8);
    this.patoLemus.position.copy(this.patoStartPos);
    this.patoLemus.scale.set(1.18, 1.18, 1.18);
    this.patoLemus.rotation.set(0, 0.12, 0); // Mirando al sur hacia Frogbert en 3/4
    this.group.add(this.patoLemus);

    // 3. Poner al jefe TALABOT TITÁN en modo latente
    if (this.boss) {
      this.boss.state = 'dormant';
      this.boss.mesh.position.set(2.8, 40.8, -1.2);
      this.boss.mesh.lookAt(0, 40.8, 6.0);
    }
  }

  update(dt) {
    if (!this.isActive) return;

    this.time += dt;
    if (this.helicopter) {
      this.helicopter.update(dt);
    }

    if (this.time < 4.5) {
      // ==========================================
      // FASE 1: Diálogo de confrontación (0.0s - 4.5s)
      // ==========================================
      this.phase = 'dialogue';

      // Cámara en contrapicado cinematográfico mostrando de frente el rostro y traje de Pato Lemus
      this.camera.position.lerp(new THREE.Vector3(-0.6, 42.4, 4.6), 0.08);
      this.camera.lookAt(0, 42.0, 1.8);

      // Animación altanera: señala con el dedo y mueve la cabeza
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
          'PATO LEMUS',
          '¡¿TÚ OTRA VEZ, RENACUAJO INSOLENTE?! ¿Lograste escalar todo el Árbol Sagrado? ¡Una lástima que mi tiempo es demasiado valioso como para ensuciarme las plumas contigo!',
          null,
          () => {
            this.time = 4.5;
          }
        );
      }

    } else if (this.time < 8.2) {
      // ==========================================
      // FASE 2: Llegada del Helicóptero TALACORP (4.5s - 8.2s)
      // ==========================================
      if (this.phase !== 'heli_arrive') {
        this.phase = 'heli_arrive';
        // Descenso a posición de vuelo estacionario al borde de la plataforma
        this.helicopter.startArrival(new THREE.Vector3(4.0, 42.4, 1.8));

        if (this.hud) {
          this.hud.showDialogue(
            'PATO LEMUS',
            '¡TALABOT TITÁN, HAZLO PURÉ DE RANA! ¡Yo me voy en mi helicóptero a talar otro pantano! ¡JAJAJA, HASTA NUNCA!',
            null,
            () => {
              this.hud.closeDialogue();
              this.time = 8.2;
            }
          );
        }
      }

      // Cámara panorámica encuadrando a Pato Lemus y el helicóptero llegando con reflector
      this.camera.position.lerp(new THREE.Vector3(-1.0, 43.8, 8.5), 0.08);
      this.camera.lookAt(2.0, 43.0, 1.8);

      // Efecto del viento de los rotores en el modelo de Pato Lemus
      if (this.tieBody) {
        this.tieBody.rotation.x = -0.3 + Math.sin(this.time * 28) * 0.22;
        this.tieBody.rotation.z = Math.sin(this.time * 24) * 0.16;
      }
      if (this.crestCenter) {
        this.crestCenter.rotation.x = -Math.PI / 2.6 + Math.sin(this.time * 32) * 0.12;
      }

      // Pato Lemus se ríe a carcajadas
      if (this.patoHead) {
        this.patoHead.rotation.x = 0.15 + Math.sin(this.time * 16) * 0.12;
      }
      if (this.pointingArm) {
        this.pointingArm.rotation.z = Math.sin(this.time * 14) * 0.35;
      }

    } else if (this.time < 10.8) {
      // ==========================================
      // FASE 3: Pato Lemus sube al patín del helicóptero (8.2s - 10.8s)
      // ==========================================
      if (this.phase !== 'boarding') {
        this.phase = 'boarding';
        if (this.hud) this.hud.closeDialogue();
      }

      const boardProgress = Math.min((this.time - 8.2) / 1.4, 1.0); // 0.0 a 1.0 en 1.4s

      if (boardProgress < 1.0) {
        // Corre y salta hacia el patín izquierdo del helicóptero
        const start = this.patoStartPos;
        const target = new THREE.Vector3(2.85, 42.5, 2.0);

        this.patoLemus.position.lerpVectors(start, target, boardProgress);
        this.patoLemus.position.y += Math.sin(boardProgress * Math.PI) * 0.9;

        // Orientación hacia el helicóptero
        this.patoLemus.rotation.y = Math.PI * 0.42;

        // Zancadas animadas
        const legStride = Math.sin(boardProgress * 22) * 0.65;
        if (this.rightLegPivot) this.rightLegPivot.rotation.x = legStride;
        if (this.leftLegPivot) this.leftLegPivot.rotation.x = -legStride;

        if (this.pointingArm) this.pointingArm.rotation.set(-0.4, 0.2, 0.4);
        if (this.leftArm) this.leftArm.rotation.set(-0.4, -0.2, -0.4);

      } else if (!this.isBoarded) {
        // Ha aterrizado en el patín: se ancla como hijo del helicóptero
        this.isBoarded = true;
        this.group.remove(this.patoLemus);
        this.helicopter.mesh.add(this.patoLemus);

        // Posición en el patín izquierdo
        this.patoLemus.position.set(-1.15, 0.1, 0.2);
        this.patoLemus.rotation.set(0, -0.35, 0);

        // Agarre con mano izquierda y pose de victoria/burla
        if (this.leftArm) {
          this.leftArm.rotation.set(-0.7, 0.4, 0.3);
        }
        if (this.rightLegPivot) this.rightLegPivot.rotation.x = 0;
        if (this.leftLegPivot) this.leftLegPivot.rotation.x = 0;
      }

      if (this.isBoarded) {
        // Saludo burlón desde el patín mirando a Frogbert
        if (this.pointingArm) {
          this.pointingArm.rotation.set(-1.2, 0, Math.sin(this.time * 16) * 0.45);
        }
        if (this.patoHead) {
          this.patoHead.rotation.set(0.1, -0.35, 0);
        }
      }

      // Cámara en plano medio mostrando a Pato Lemus encaramado al patín del helicóptero
      this.camera.position.lerp(new THREE.Vector3(0.5, 44.2, 7.8), 0.08);
      this.camera.lookAt(2.85, 44.2, 2.0);

    } else if (this.time < 14.5) {
      // ==========================================
      // FASE 4: Despegue a toda potencia y despertar de Talabot (10.8s - 14.5s)
      // ==========================================
      if (this.phase !== 'escape') {
        this.phase = 'escape';
        this.helicopter.startDeparture(new THREE.Vector3(-55, 88, 50));

        // Despertar del Jefe Talabot
        if (this.boss) {
          audio.playBossAlarm();
          this.boss.state = 'idle';
        }
      }

      // Pato Lemus se mantiene visible en el patín ondeando en la corriente de aire
      if (this.isBoarded) {
        if (this.pointingArm) {
          this.pointingArm.rotation.set(-1.2, 0, Math.sin(this.time * 18) * 0.45);
        }
        if (this.tieBody) {
          this.tieBody.rotation.x = -0.55 + Math.sin(this.time * 35) * 0.3;
          this.tieBody.rotation.z = Math.sin(this.time * 28) * 0.2;
        }
        if (this.crestCenter) {
          this.crestCenter.rotation.x = -Math.PI / 2.3 + Math.sin(this.time * 40) * 0.15;
        }
      }

      if (this.time < 12.5) {
        // Seguir al helicóptero que se aleja hacia la tormenta
        const hPos = this.helicopter.mesh.position;
        this.camera.position.lerp(new THREE.Vector3(hPos.x + 8, hPos.y - 1.0, hPos.z + 14), 0.06);
        this.camera.lookAt(hPos.x, hPos.y, hPos.z);
      } else {
        // Retorno hacia la arena de batalla detrás de Frogbert
        const p = this.player.position;
        this.camera.position.lerp(new THREE.Vector3(p.x, p.y + 3.8, p.z + 8.5), 0.08);
        this.camera.lookAt(0, 41.5, 0);
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
    this.isActive = false;
    this.phase = 'finished';

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
