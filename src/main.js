import * as THREE from 'three';
import { audio } from './audio.js';
import { InputManager } from './input.js';
import { Level } from './level.js';
import { Player } from './player.js';
import { BossBugZapper } from './boss.js';
import { ThirdPersonCamera } from './camera.js';
import { ParticleSystem } from './particles.js';
import { HUD } from './hud.js';

class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.state = 'start'; // 'start' | 'playing' | 'dialogue' | 'gameover' | 'victory'

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
    this.scene.background = new THREE.Color(0x111c14);
    this.scene.fog = new THREE.FogExp2(0x111c14, 0.016);

    // 2. Cámara
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.2, 350);

    // 3. Renderer con estética retro
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.container.appendChild(this.renderer.domElement);

    // 4. Iluminación estilo años 90
    const hemiLight = new THREE.HemisphereLight(0x74b9ff, 0x1e3725, 0.7);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffae6, 0.95);
    sunLight.position.set(25, 45, 30);
    this.scene.add(sunLight);

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
    startBtn.onclick = () => {
      audio.init();
      document.getElementById('start-screen').style.display = 'none';
      this.state = 'playing';

      this.hud.showDialogue(
        'FROGGY',
        '¡Croak! ¡Maldita corporación TALACORP, talaron mi árbol! ¡Subiré hasta la cima y les enseñaré quién manda!'
      );
    };

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
        this.renderer.domElement.requestPointerLock?.();
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
    this.player.position.set(0, 2, 8);
    this.player.velocity.set(0, 0, 0);
    this.player.lastCheckpoint.set(0, 2, 8);
    this.boss.hp = 3;
    this.boss.phase = 1;
    this.boss.state = 'idle';
    this.boss.mesh.visible = true;
    this.boss.mesh.scale.set(1, 1, 1);
    this.dialogueTriggeredMid = false;
    this.dialogueTriggeredBoss = false;
    this.state = 'playing';
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.08);
    this.input.updateGamepad();

    if (this.state === 'playing') {
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
        this.boss.update(dt, this.player, this.tpCamera);

        if (!this.dialogueTriggeredBoss) {
          this.dialogueTriggeredBoss = true;
          this.hud.showDialogue(
            'BUG-ZAPPER 3000',
            '¡BEEP-BOOP! ¡PLAGA ANFIBIA DETECTADA! ¡INICIANDO PROTOCOLO DE EXTERMINACIÓN DE TALACORP!'
          );
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
            'FROGGY',
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
