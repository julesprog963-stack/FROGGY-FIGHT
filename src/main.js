import * as THREE from 'three';
import { audio } from './audio.js';
import { InputManager } from './input.js';
import { Level } from './level.js';
import { Player } from './player.js';
import { BossBugZapper } from './boss.js';
import { ThirdPersonCamera } from './camera.js';
import { ParticleSystem } from './particles.js';
import { HUD } from './hud.js';
import { CinematicIntro } from './cinematic.js';
import { SummitCutscene } from './summit-cutscene.js';

class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.state = 'start'; // 'start' | 'cinematic' | 'playing' | 'gameover' | 'victory'

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.tpCamera = null;

    this.input = new InputManager();
    this.hud = new HUD();
    this.level = null;
    this.player = null;
    this.boss = null;
    this.particles = null;
    this.cinematic = null;
    this.summitCutscene = null;

    this.clock = new THREE.Clock();
    this.dialogueTriggeredMid = false;
    this.dialogueTriggeredBoss = false;

    window.__game = this;

    this.initThree();
    this.setupUI();
    this.animate();
  }

  initThree() {
    // 1. Escena y Niebla N64
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x153b35);
    this.scene.fog = new THREE.FogExp2(0x153b35, 0.014);

    // 2. Cámara
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.2, 350);

    // 3. Renderer con estética retro
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.container.appendChild(this.renderer.domElement);

    // 4. Iluminación estilo años 90
    const hemiLight = new THREE.HemisphereLight(0x91cdbb, 0x304323, 1.15);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffd39a, 1.65);
    sunLight.position.set(-18, 35, 26);
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x70c8b7, 0.65);
    rimLight.position.set(20, 24, -30);
    this.scene.add(rimLight);

    // Luz industrial verde secundaria para la zona media
    const toxicLight = new THREE.PointLight(0x00ff88, 1.3, 35);
    toxicLight.position.set(10, 22, 0);
    this.scene.add(toxicLight);

    // 5. Partículas y Entidades
    this.particles = new ParticleSystem(this.scene);
    this.level = new Level(this.scene);
    this.player = new Player(this.scene, this.particles);
    this.boss = new BossBugZapper(this.scene, new THREE.Vector3(0, 40.5, 0), this.particles);
    this.tpCamera = new ThirdPersonCamera(this.camera, this.player);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupUI() {
    const startBtn = document.getElementById('btn-start');
    const skipBtn = document.getElementById('btn-skip-cinematic');

    startBtn.onclick = () => {
      audio.init();
      document.getElementById('start-screen').style.display = 'none';
      if (skipBtn) skipBtn.style.display = 'block';

      this.state = 'cinematic';
      this.cinematic = new CinematicIntro(
        this.scene,
        this.camera,
        this.player,
        this.hud,
        () => {
          this.state = 'playing';
          if (skipBtn) skipBtn.style.display = 'none';
          this.cinematic = null;
          this.tpCamera.resetPosition();
        }
      );
    };

    if (skipBtn) {
      skipBtn.onclick = () => {
        skipBtn.blur();
        if (this.cinematic) {
          this.cinematic.skip();
        }
      };
    }

    this.input.onDialogueAdvance = () => {
      if (document.getElementById('n64-dialogue-box').style.display === 'flex') {
        this.hud.closeDialogue();
      }
    };

    const audioBtn = document.getElementById('btn-audio');
    audioBtn.onclick = () => {
      const isMuted = audio.toggleMute();
      audioBtn.textContent = isMuted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
    };

    const crtBtn = document.getElementById('btn-crt');
    const crtOverlay = document.getElementById('crt-screen');
    crtBtn.onclick = () => {
      const isVisible = crtOverlay.style.display !== 'none';
      crtOverlay.style.display = isVisible ? 'none' : 'block';
      crtBtn.textContent = isVisible ? '📺 CRT: OFF' : '📺 CRT: ON';
    };

    this.renderer.domElement.addEventListener('click', () => {
      if (this.state === 'playing') {
        if (window.matchMedia('(pointer: fine)').matches) {
          this.renderer.domElement.requestPointerLock?.();
        }
      }
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  restartGame() {
    this.player.lives = 3;
    this.player.bugsEaten = 0;
    this.player.coins = 0;
    this.player.position.set(0, 1.6, 10);
    this.player.velocity.set(0, 0, 0);
    this.player.lastCheckpoint.set(0, 1.6, 10);
    this.player.setSleepingPose(false);
    this.player.setAngryPose(true);
    this.tpCamera.resetPosition();
    this.boss.hp = 3;
    this.boss.phase = 1;
    this.boss.state = 'idle';
    this.boss.mesh.visible = true;
    this.boss.mesh.scale.set(1, 1, 1);
    this.boss.mesh.position.copy(this.boss.arenaCenter);
    this.dialogueTriggeredMid = false;
    this.dialogueTriggeredBoss = false;
    if (this.summitCutscene) {
      this.summitCutscene.finish();
      this.summitCutscene = null;
    }
    this.state = 'playing';
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.08);
    document.body.classList.toggle('is-playing', this.state === 'playing');
    this.input.updateGamepad();

    if (this.state === 'cinematic' && this.cinematic) {
      this.particles.update(dt);
      this.cinematic.update(dt);
      if (this.input.keys.jumpPressed && this.hud.dialogueBox.style.display !== 'flex') {
        this.cinematic.skip();
      }
    } else if (this.state === 'playing') {
      // Cinemática en la cima del árbol (Pato Lemus y el Helicóptero)
      if (this.summitCutscene && this.summitCutscene.isActive) {
        this.particles.update(dt);
        this.summitCutscene.update(dt);
        if (this.input.keys.jumpPressed && this.hud.dialogueBox.style.display !== 'flex') {
          this.summitCutscene.skip();
        }
        this.renderer.render(this.scene, this.camera);
        this.input.resetOneShots();
        return;
      }

      if (this.input.mouse.deltaX !== 0 || this.input.mouse.deltaY !== 0) {
        this.tpCamera.handleMouseMove(this.input.mouse.deltaX, this.input.mouse.deltaY);
      }
      if (this.input.keys.cLeft) this.tpCamera.rotateCButtons(1, dt);
      if (this.input.keys.cRight) this.tpCamera.rotateCButtons(-1, dt);

      this.input.cameraYaw = this.tpCamera.yaw;

      // Actualizar entidades con cámara y partículas
      this.particles.update(dt);
      this.player.update(dt, this.input, this.level.platforms, this.level.anchors, this.level.bugs, this.boss, this.tpCamera);
      this.level.update(dt, this.player, this.hud, this.input);
      this.tpCamera.update(dt);

      const height = this.player.position.y;
      if (height > 36) {
        audio.setTrack('boss');
        this.boss.update(dt, this.player, this.tpCamera, this.input);

        if (!this.dialogueTriggeredBoss) {
          this.dialogueTriggeredBoss = true;
          this.summitCutscene = new SummitCutscene(
            this.scene,
            this.camera,
            this.player,
            this.boss,
            this.hud,
            () => {
              this.summitCutscene = null;
              this.tpCamera.resetPosition();
            }
          );
        }

        // Guía dinámica durante el agarre estilo Mario vs Bowser
        const controlsHint = document.getElementById('controls-hint');
        if (controlsHint) {
          if (this.boss.state === 'grabbed') {
            controlsHint.innerHTML = '💥 <b>¡AGARRADO!</b> [A/D o Ratón]: Girar más rápido &nbsp;|&nbsp; <b>[ESPACIO / Clic]: LANZAR A UNA MINA CON PÚAS</b>';
            controlsHint.style.borderColor = '#f1c40f';
          } else if (this.boss.state === 'dizzy') {
            controlsHint.innerHTML = '⚡ <b>¡TALABOT ATURDIDO!</b> Acércate por la espalda o dispara tu lengua <b>[E / Clic]</b> a su cola para agarrarlo';
            controlsHint.style.borderColor = '#2ecc71';
          }
        }

        if (this.boss.state === 'defeated') {
          this.state = 'victory';
          this.hud.showVictory(() => this.restartGame());
        }
      } else if (height > 18) {
        audio.setTrack('industrial');
        if (!this.dialogueTriggeredMid) {
          this.dialogueTriggeredMid = true;
          this.hud.showDialogue(
            'FROGBERT',
            '¡Uff, tuberías de veneno! Debo tener cuidado con las hojas que tiemblan... ¡y comer moscas para ganar vidas!'
          );
        }
      } else {
        audio.setTrack('jungle');
      }

      if (this.player.lives <= 0) {
        this.state = 'gameover';
        this.hud.showGameOver(() => this.restartGame());
      }

      this.hud.update(this.player, this.level, this.boss);
    }

    this.input.resetOneShots();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
