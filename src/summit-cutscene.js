import * as THREE from 'three';
import { TalacorpHelicopter } from './helicopter.js';
import { audio } from './audio.js';

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
    this.phase = 'dialogue'; // 'dialogue' | 'heli_arrive' | 'board_escape' | 'finished'

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // 1. Helicóptero TALACORP
    this.helicopter = new TalacorpHelicopter(this.scene);

    // 2. Modelo 3D de Pato Lemus en la cima
    this.patoLemus = this.createPatoLemusSummitModel();
    this.patoLemus.position.set(0, 41.2, 1.5);
    this.patoLemus.rotation.set(0, Math.PI, 0); // Mirando hacia Frogbert que sube
    this.group.add(this.patoLemus);

    // Poner al jefe en modo latente
    if (this.boss) {
      this.boss.state = 'dormant';
      this.boss.mesh.position.set(3.2, 40.8, -1.0);
      this.boss.mesh.lookAt(0, 40.8, 6.0);
    }
  }

  createPatoLemusSummitModel() {
    const lemus = new THREE.Group();
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xfafafa, flatShading: true });
    const billMat = new THREE.MeshLambertMaterial({ color: 0xf39c12, flatShading: true });
    const suitMat = new THREE.MeshLambertMaterial({ color: 0x1c2833, flatShading: true });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111, flatShading: true });

    // Cabeza de pato con cresta
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), whiteMat);
    head.position.set(0, 2.5, 0);
    lemus.add(head);

    // 3 Mechones de cresta
    for (let i = -1; i <= 1; i++) {
      const feather = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.2, 4), whiteMat);
      feather.position.set(i * 0.35, 3.4, -0.3);
      feather.rotation.x = -0.55;
      lemus.add(feather);
    }

    // Pico ancho
    const bill = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 1.2), billMat);
    bill.position.set(0, 2.2, 1.1);
    lemus.add(bill);

    // Cejas de villano y ojos
    [-0.45, 0.45].forEach(x => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.1), darkMat);
      eye.position.set(x, 2.7, 0.82);
      lemus.add(eye);

      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.15), darkMat);
      brow.position.set(x, 2.95, 0.85);
      brow.rotation.z = x > 0 ? 0.35 : -0.35;
      lemus.add(brow);
    });

    // Cuerpo con traje azul oscuro
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.4), suitMat);
    body.position.set(0, 1.2, 0);
    lemus.add(body);

    // Patas de pato naranjas
    [-0.5, 0.5].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 6), billMat);
      leg.position.set(x, 0.45, 0);
      lemus.add(leg);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 1.1), billMat);
      foot.position.set(x, 0.08, 0.3);
      lemus.add(foot);
    });

    lemus.scale.set(1.15, 1.15, 1.15);
    return lemus;
  }

  update(dt) {
    if (!this.isActive) return;

    this.time += dt;
    if (this.helicopter) {
      this.helicopter.update(dt);
    }

    if (this.time < 4.5) {
      // FASE 1: Diálogo de confrontación
      this.phase = 'dialogue';

      // Cámara enfocando a Pato Lemus y el Talabot detrás
      this.camera.position.lerp(new THREE.Vector3(0, 44.5, 9.5), 0.1);
      this.camera.lookAt(0, 42.0, 1.5);

      if (this.hud && this.hud.dialogueBox.style.display !== 'flex') {
        this.hud.showDialogue(
          'PATO LEMUS',
          '¡¿TÚ OTRA VEZ, RENACUAJO INSOLENTE?! ¿Lograste escalar todo el Árbol Sagrado? ¡Una lástima que mi tiempo es demasiado valioso como para ensuciarme las plumas contigo!'
        );
      }

    } else if (this.time < 7.8) {
      // FASE 2: Llega el Helicóptero TALACORP
      if (this.phase !== 'heli_arrive') {
        this.phase = 'heli_arrive';
        this.helicopter.startArrival(new THREE.Vector3(4.5, 46.5, 3.5));

        if (this.hud) {
          this.hud.showDialogue(
            'PATO LEMUS',
            '¡TALABOT TITÁN, HAZLO PURÉ DE RANA! ¡Yo me voy en mi helicóptero a talar otro pantano! ¡JAJAJA, HASTA NUNCA!'
          );
        }
      }

      // Cámara panorámica mostrando la llegada del helicóptero
      this.camera.position.lerp(new THREE.Vector3(-6.5, 46.0, 9.5), 0.08);
      this.camera.lookAt(2.0, 43.0, 2.5);

      // Pato Lemus saluda con la mano riéndose
      if (this.patoLemus) {
        this.patoLemus.position.y = 41.2 + Math.sin(this.time * 12) * 0.08;
      }

    } else if (this.time < 11.2) {
      // FASE 3: Pato Lemus sube y el helicóptero escapa
      if (this.phase !== 'board_escape') {
        this.phase = 'board_escape';
        if (this.hud) this.hud.closeDialogue();
        this.helicopter.startDeparture(new THREE.Vector3(-45, 75, 45));

        // Pato Lemus se eleva al helicóptero
        this.patoLemus.visible = false;

        // Activar al jefe Talabot
        if (this.boss) {
          audio.playBossAlarm();
          this.boss.state = 'idle';
        }
      }

      // Cámara regresando detrás de Frogbert para iniciar el combate
      const p = this.player.position;
      this.camera.position.lerp(new THREE.Vector3(p.x, p.y + 4.5, p.z + 10.5), 0.06);
      this.camera.lookAt(0, 41.5, 0);

    } else {
      // Fin de la cinemática
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
