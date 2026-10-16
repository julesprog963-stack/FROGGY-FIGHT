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
import { SummitCutscene, AntennaLiberationCutscene } from './summit-cutscene.js';

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
    this.liberationCutscene = null;

    this.clock = new THREE.Clock();
    this.dialogueTriggeredMid = false;
    this.dialogueTriggeredBoss = false;
    this.antennaUnlocked = false;

    window.__game = this;

    this.initThree();
    this.setupUI();
    this.animate();
  }

  initThree() {
    // 1. Escena y Niebla PS2 / N64
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x193f3c);
    this.scene.fog = new THREE.FogExp2(0x193f3c, 0.015);

    // 2. Cámara
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.2, 380);

    // 3. Renderer con estética retro PS2
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.container.appendChild(this.renderer.domElement);

    // 4. Iluminación atmosférica PS2
    const hemiLight = new THREE.HemisphereLight(0x8cbeb6, 0x24372d, 0.98);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffcf87, 2.25);
    sunLight.position.set(-22, 62, 32);
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x70c8b7, 0.68);
    rimLight.position.set(24, 34, -36);
    this.scene.add(rimLight);

    // Luz industrial verde secundaria para la zona media
    const toxicLight = new THREE.PointLight(0x00ff88, 1.4, 42);
    toxicLight.position.set(14, 30, 0);
    this.scene.add(toxicLight);

    // 5. Partículas y Entidades
    this.particles = new ParticleSystem(this.scene);
    this.level = new Level(this.scene, this.particles);
    this.player = new Player(this.scene, this.particles);
    this.player.mesh.position.copy(this.player.position);
    this.boss = new BossBugZapper(this.scene, new THREE.Vector3(0, 56.9, 0), this.particles);
    this.tpCamera = new ThirdPersonCamera(this.camera, this.player);
    this.tpCamera.resetPosition();

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

    const syncAudioUI = (isMuted) => {
      const label = isMuted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
      if (audioBtn) audioBtn.textContent = label;
      if (pauseAudioBtn) pauseAudioBtn.textContent = label;
      if (optAudioBtn) optAudioBtn.textContent = label;
    };

    const syncCrtUI = (isOn) => {
      crtOverlay.style.display = isOn ? 'block' : 'none';
      const label = isOn ? '📺 CRT: ON' : '📺 CRT: OFF';
      if (crtBtn) crtBtn.textContent = label;
      if (optCrtBtn) optCrtBtn.textContent = label;
    };

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

    const toggleAudioAction = () => {
      const isMuted = audio.toggleMute();
      syncAudioUI(isMuted);
    };
    if (audioBtn) audioBtn.onclick = toggleAudioAction;
    if (pauseAudioBtn) pauseAudioBtn.onclick = toggleAudioAction;
    if (optAudioBtn) optAudioBtn.onclick = toggleAudioAction;

    const toggleCrtAction = (event) => {
      if (event?.detail > 0) event.currentTarget.blur();
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

    this.input.onPauseToggle = () => {
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
      if (this.state === 'playing' || this.state === 'paused') {
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
      this.clock.getDelta();
      audio.playPause(false);
    }
  }

  warpPlayer() {
    if (!this.player) return;
    const warpBtn = document.getElementById('btn-warp');
    const toSummit = this.player.position.y < 42;

    if (toSummit) {
      // Teletransportar directamente a la cima de 56.9m frente a la arena del jefe
      this.player.position.set(0, 57.2, 7.5);
      this.player.prevPosition.copy(this.player.position);
      this.player.velocity.set(0, 0, 0);
      this.player.lastCheckpoint.set(0, 57.2, 7.5);
      if (warpBtn) warpBtn.textContent = '🌀 PORTAL: BASE';
    } else {
      // Teletransportar de vuelta a la base del pantano (radio 15m -> z=16.5)
      this.player.position.set(0, 1.8, 16.5);
      this.player.prevPosition.copy(this.player.position);
      this.player.velocity.set(0, 0, 0);
      this.player.lastCheckpoint.set(0, 1.6, 16.5);
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
    this.player.position.set(0, 1.6, 16.5);
    this.player.prevPosition.copy(this.player.position);
    this.player.velocity.set(0, 0, 0);
    this.player.lastCheckpoint.set(0, 1.6, 16.5);
    this.player.setSleepingPose(false);
    this.player.setAngryPose(true);
    this.tpCamera.resetPosition();

    this.boss.hp = 3;
    this.boss.phase = 1;
    this.boss.state = 'idle';
    this.boss.mesh.visible = true;
    this.boss.mesh.scale.set(1, 1, 1);
    this.boss.mesh.position.copy(this.boss.arenaCenter);
    this.boss.mines.forEach((m) => {
      m.active = true;
      m.mesh.visible = true;
    });

    if (this.level && this.level.antenna) {
      const ant = this.level.antenna;
      ant.hp = ant.maxHp;
      ant.isShielded = true;
      ant.isDestroyed = false;
      ant.collapseProgress = 0;
      if (ant.shieldMesh) ant.shieldMesh.visible = true;
      if (ant.upperMastGroup) {
        ant.upperMastGroup.rotation.set(0, 0, 0);
        ant.upperMastGroup.position.set(0, 1.4, 0);
      }
      if (ant.beaconMat) ant.beaconMat.color.setHex(0xff2222);
      if (ant.beaconLight) {
        ant.beaconLight.color.setHex(0xff2222);
        ant.beaconLight.intensity = 2.2;
      }
    }

    if (this.level && this.level.miniTalabots) {
      this.level.miniTalabots.forEach((bot) => {
        bot.permanentlyShutDown = false;
        bot.isDead = false;
        bot.hp = bot.maxHp;
        bot.mesh.rotation.set(0, 0, 0);
        bot.position.copy(bot.homePos);
        bot.mesh.position.copy(bot.position);
        bot.updateHpPips();
      });
    }

    if (this.level && this.level.npcs) {
      this.level.npcs.forEach((npc) => {
        npc.celebrating = false;
      });
    }

    this.dialogueTriggeredMid = false;
    this.dialogueTriggeredBoss = false;
    this.antennaUnlocked = false;

    const controlsHint = document.getElementById('controls-hint');
    if (controlsHint) {
      controlsHint.innerHTML = '[WASD] Moverse &nbsp;|&nbsp; [ESPACIO] Cargar Salto &nbsp;|&nbsp; [E / Enter / Clic] Lengua &nbsp;|&nbsp; [F / Clic Der.] Patada Trasera<br>[Arrastrar Ratón / Q-R] Girar Cámara &nbsp;|&nbsp; [ESC] Pausa &nbsp;|&nbsp; [20 Bichos = +1 Vida]';
      controlsHint.style.borderColor = '';
    }

    if (this.summitCutscene) {
      this.summitCutscene.finish();
      this.summitCutscene = null;
    }
    if (this.liberationCutscene) {
      this.liberationCutscene.finish();
      this.liberationCutscene = null;
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

    if (this.state === 'start') {
      this.level.forestArt?.update(dt);
      this.player.animTime += dt * 8;
      this.player.updateAnimation(dt, this.input);
    }

    if (this.state === 'cinematic' && this.cinematic) {
      this.particles.update(dt);
      this.cinematic.update(dt);
      if (this.input.keys.jumpPressed && this.hud.dialogueBox.style.display !== 'flex') {
        this.cinematic.skip();
      }
    } else if (this.state === 'playing') {
      // 1. Cinemática de llegada a la cima (Gobernador Pato Lemus y Helicóptero)
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

      // 2. Cinemática final de liberación al destruir la Antena Central
      if (this.liberationCutscene && this.liberationCutscene.isActive) {
        this.particles.update(dt);
        this.level.update(dt, this.player, this.hud, this.input);
        this.liberationCutscene.update(dt);
        if (this.input.keys.jumpPressed && this.hud.dialogueBox.style.display !== 'flex') {
          this.liberationCutscene.skip();
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

      // Actualizar entidades con cámara, partículas, Mini-Talabots y Antena Central
      this.particles.update(dt);
      this.player.update(
        dt,
        this.input,
        this.level.platforms,
        this.level.anchors,
        this.level.bugs,
        this.boss,
        this.tpCamera,
        this.level.miniTalabots,
        this.level.antenna
      );
      this.level.update(dt, this.player, this.hud, this.input);
      this.tpCamera.update(dt);

      const height = this.player.position.y;

      const warpBtn = document.getElementById('btn-warp');
      if (warpBtn) {
        const toSummit = height < 42;
        const targetLabel = toSummit ? '🌀 PORTAL: CIMA' : '🌀 PORTAL: BASE';
        if (warpBtn.textContent !== targetLabel) {
          warpBtn.textContent = targetLabel;
        }
      }

      const isBossActive = this.dialogueTriggeredBoss || height >= 56.0;
      if (isBossActive && height >= 46) {
        audio.setTrack('boss');
        this.boss.update(dt, this.player, this.tpCamera, this.input);

        if (!this.dialogueTriggeredBoss && height >= 56.0) {
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

        // Guía dinámica durante el combate contra Talabot Titán y la Antena Central
        const controlsHint = document.getElementById('controls-hint');
        if (controlsHint) {
          if (this.boss.state === 'grabbed') {
            controlsHint.innerHTML = '💥 <b>¡AGARRADO!</b> [A/D o Ratón]: Girar más rápido &nbsp;|&nbsp; <b>[ESPACIO / Clic]: LANZAR A UNA MINA CON PÚAS</b>';
            controlsHint.style.borderColor = '#f1c40f';
          } else if (this.boss.state === 'dizzy') {
            controlsHint.innerHTML = '⚡ <b>¡TALABOT ATURDIDO!</b> Acércate por la espalda o dispara tu lengua <b>[E / Clic]</b> a su cola para agarrarlo';
            controlsHint.style.borderColor = '#2ecc71';
          } else if (this.boss.state === 'defeated' && this.level.antenna && !this.level.antenna.isDestroyed) {
            controlsHint.innerHTML = '📡 <b>¡ESCUDOS ABAJO!</b> Corre hacia la <b>ANTENA CENTRAL</b> en el borde norte y destrúyela con 3 patadas traseras <b>[F / Clic Der. / E]</b>';
            controlsHint.style.borderColor = '#00e5ff';
          }
        }

        if (this.boss.state === 'defeated') {
          if (!this.antennaUnlocked) {
            this.antennaUnlocked = true;
            if (this.level.antenna) {
              this.level.antenna.unlockShield();
            }
            this.hud.showDialogue(
              'FROGBERT',
              '¡El TALABOT TITÁN explotó y el escudo de la ANTENA CENTRAL cayó! ¡Ahora puedo destruir la antena en el borde norte a patadas traseras [F / Clic Derecho] para apagar a todos los Mini-Talabots de abajo!'
            );
          }

          if (this.level.antenna && this.level.antenna.isDestroyed && !this.liberationCutscene) {
            this.liberationCutscene = new AntennaLiberationCutscene(
              this.scene,
              this.camera,
              this.player,
              this.level,
              this.hud,
              this.particles,
              () => {
                this.liberationCutscene = null;
                this.state = 'victory';
                this.hud.showVictory(() => this.restartGame());
              }
            );
          }
        }
      } else if (height > 26) {
        audio.setTrack('industrial');
        if (!this.dialogueTriggeredMid) {
          this.dialogueTriggeredMid = true;
          this.hud.showDialogue(
            'FROGBERT',
            '¡Uff, el tronco es gigantesco y está lleno de tuberías de TALACORP! ¡Usaré el impulso de mi lengua para balancearme alto y comer moscas para ganar vidas!'
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
