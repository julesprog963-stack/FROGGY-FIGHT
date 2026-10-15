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
    const optionsBtn = document.getElementById('btn-options');
    const controlsBtn = document.getElementById('btn-controls');
    const creditsBtn = document.getElementById('btn-credits');

    const modalOptions = document.getElementById('modal-options');
    const modalControls = document.getElementById('modal-controls');
    const modalCredits = document.getElementById('modal-credits');

    const audioBtn = document.getElementById('btn-audio');
    const pauseAudioBtn = document.getElementById('btn-pause-audio');
    const optAudioBtn = document.getElementById('btn-options-audio');

    const crtBtn = document.getElementById('btn-crt');
    const optCrtBtn = document.getElementById('btn-options-crt');
    const crtOverlay = document.getElementById('crt-screen');

    // Sincronización de Audio en todos los botones
    const syncAudioUI = (isMuted) => {
      const label = isMuted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
      if (audioBtn) audioBtn.textContent = label;
      if (pauseAudioBtn) pauseAudioBtn.textContent = label;
      if (optAudioBtn) optAudioBtn.textContent = label;
    };

    // Sincronización de CRT en todos los botones
    const syncCrtUI = (isOn) => {
      crtOverlay.style.display = isOn ? 'block' : 'none';
      const label = isOn ? '📺 CRT: ON' : '📺 CRT: OFF';
      if (crtBtn) crtBtn.textContent = label;
      if (optCrtBtn) optCrtBtn.textContent = label;
    };

    // Sonidos hover en botones de la pantalla de inicio
    [startBtn, optionsBtn, controlsBtn, creditsBtn].forEach((btn) => {
      if (btn) {
        btn.addEventListener('mouseenter', () => audio.playMenuHover());
        btn.addEventListener('focus', () => audio.playMenuHover());
      }
    });

    // 1. Botón JUGAR
    if (startBtn) {
      startBtn.onclick = () => {
        audio.init();
        audio.playMenuSelect();
        document.getElementById('start-screen').style.display = 'none';
        const utilBtns = document.getElementById('utility-buttons');
        if (utilBtns) utilBtns.style.display = 'flex';
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
    }

    // 2. Botón OPCIONES
    if (optionsBtn) {
      optionsBtn.onclick = () => {
        audio.init();
        audio.playMenuSelect();
        if (modalOptions) modalOptions.style.display = 'flex';
      };
    }

    // 3. Botón CONTROLES
    if (controlsBtn) {
      controlsBtn.onclick = () => {
        audio.init();
        audio.playMenuSelect();
        if (modalControls) modalControls.style.display = 'flex';
      };
    }

    // 4. Botón SALIR
    if (creditsBtn) {
      creditsBtn.onclick = () => {
        audio.init();
        audio.playMenuSelect();
        if (modalCredits) modalCredits.style.display = 'flex';
      };
    }

    // Cerrar submodales
    const closeSubmodals = () => {
      audio.playMenuSelect();
      if (modalOptions) modalOptions.style.display = 'none';
      if (modalControls) modalControls.style.display = 'none';
      if (modalCredits) modalCredits.style.display = 'none';
    };

    const closeOptBtn = document.getElementById('btn-close-options');
    if (closeOptBtn) closeOptBtn.onclick = closeSubmodals;

    const closeCtrlBtn = document.getElementById('btn-close-controls');
    if (closeCtrlBtn) closeCtrlBtn.onclick = closeSubmodals;

    const closeCredBtn = document.getElementById('btn-close-credits');
    if (closeCredBtn) closeCredBtn.onclick = closeSubmodals;

    const reloadBtn = document.getElementById('btn-action-reload');
    if (reloadBtn) {
      reloadBtn.onclick = () => {
        window.location.reload();
      };
    }

    // Botones de audio
    const toggleAudioAction = () => {
      const isMuted = audio.toggleMute();
      syncAudioUI(isMuted);
    };
    if (audioBtn) audioBtn.onclick = toggleAudioAction;
    if (pauseAudioBtn) pauseAudioBtn.onclick = toggleAudioAction;
    if (optAudioBtn) optAudioBtn.onclick = toggleAudioAction;

    // Botones de CRT
    const toggleCrtAction = () => {
      const willBeOn = crtOverlay.style.display === 'none';
      syncCrtUI(willBeOn);
    };
    if (crtBtn) crtBtn.onclick = toggleCrtAction;
    if (optCrtBtn) optCrtBtn.onclick = toggleCrtAction;

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
        this.hud.advanceDialogue();
      }
    };

    // Pausa (tecla ESC o botones en pantalla)
    this.input.onPauseToggle = () => {
      // Si estamos en la pantalla de inicio con algún submodal abierto, cerrarlo con ESC
      if (modalOptions && modalOptions.style.display === 'flex') {
        closeSubmodals();
        return;
      }
      if (modalControls && modalControls.style.display === 'flex') {
        closeSubmodals();
        return;
      }
      if (modalCredits && modalCredits.style.display === 'flex') {
        closeSubmodals();
        return;
      }
      if (this.state === 'playing' || this.isPaused) {
        this.togglePause();
      }
    };

    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      pauseBtn.onclick = (e) => {
        e.stopPropagation();
        pauseBtn.blur();
        this.togglePause();
      };
    }

    const resumeBtn = document.getElementById('btn-resume');
    if (resumeBtn) {
      resumeBtn.onclick = () => this.togglePause();
    }

    const pauseRestartBtn = document.getElementById('btn-pause-restart');
    if (pauseRestartBtn) {
      pauseRestartBtn.onclick = () => {
        this.togglePause();
        this.restartGame();
      };
    }

    const warpBtn = document.getElementById('btn-warp');
    if (warpBtn) {
      warpBtn.onclick = (e) => {
        e.stopPropagation();
        warpBtn.blur();
        this.warpPlayer();
      };
    }

    this.renderer.domElement.addEventListener('click', () => {
      if (this.state === 'playing') {
        if (window.matchMedia('(pointer: fine)').matches) {
          this.renderer.domElement.requestPointerLock?.();
        }
      }
    });
  }

  togglePause() {
    if (this.state === 'playing') {
      this.prevState = 'playing';
      this.state = 'paused';
      const pauseModal = document.getElementById('pause-screen');
      if (pauseModal) pauseModal.style.display = 'flex';
      const pauseBtn = document.getElementById('btn-pause');
      if (pauseBtn) pauseBtn.textContent = '▶️ CONTINUAR';
      if (document.exitPointerLock) document.exitPointerLock();
      audio.playPause(true);
    } else if (this.state === 'paused') {
      this.state = this.prevState || 'playing';
      const pauseModal = document.getElementById('pause-screen');
      if (pauseModal) pauseModal.style.display = 'none';
      const pauseBtn = document.getElementById('btn-pause');
      if (pauseBtn) pauseBtn.textContent = '⏸️ PAUSA [ESC]';
      this.clock.getDelta(); // Limpiar acumulador para evitar saltos temporales
      audio.playPause(false);
    }
  }

  warpPlayer() {
    if (!this.player) return;
    const warpBtn = document.getElementById('btn-warp');
    const toSummit = this.player.position.y < 30;

    if (toSummit) {
      // Teletransportar directamente a la cima frente a la arena del jefe
      this.player.position.set(0, 41.2, 5.0);
      this.player.prevPosition.copy(this.player.position);
      this.player.velocity.set(0, 0, 0);
      this.player.lastCheckpoint.set(0, 41.2, 5.0);
      if (warpBtn) warpBtn.textContent = '🌀 PORTAL: BASE';
    } else {
      // Teletransportar de vuelta a la base del pantano
      this.player.position.set(0, 1.8, 11.0);
      this.player.prevPosition.copy(this.player.position);
      this.player.velocity.set(0, 0, 0);
      this.player.lastCheckpoint.set(0, 1.6, 11.0);
      if (warpBtn) warpBtn.textContent = '🌀 PORTAL: CIMA';
    }

    if (this.particles) {
      this.particles.spawnShockwave(this.player.position, toSummit ? 0x9b59b6 : 0x00ff88);
      this.particles.spawnDustPuff(this.player.position, 25, toSummit ? 0xbb86fc : 0x00ffff);
      this.particles.spawnSparks(this.player.position, 20);
    }
    audio.playTongueShoot();
    audio.play1Up();

    if (this.tpCamera) {
      this.tpCamera.resetPosition();
    }
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

    if (this.state === 'paused') {
      this.renderer.render(this.scene, this.camera);
      this.input.resetOneShots();
      return;
    }

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

      const warpBtn = document.getElementById('btn-warp');
      if (warpBtn) {
        const toSummit = height < 30;
        const targetLabel = toSummit ? '🌀 PORTAL: CIMA' : '🌀 PORTAL: BASE';
        if (warpBtn.textContent !== targetLabel) {
          warpBtn.textContent = targetLabel;
        }
      }

      const isBossActive = this.dialogueTriggeredBoss || height >= 40.2;
      if (isBossActive && height >= 32) {
        audio.setTrack('boss');
        this.boss.update(dt, this.player, this.tpCamera, this.input);

        if (!this.dialogueTriggeredBoss && height >= 40.2) {
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
