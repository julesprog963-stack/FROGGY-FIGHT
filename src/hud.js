import { audio } from './audio.js';

export class HUD {
  constructor() {
    this.livesElem = document.getElementById('hud-lives');
    this.bugsElem = document.getElementById('hud-bugs');
    this.coinsElem = document.getElementById('hud-coins');
    this.altitudeElem = document.getElementById('hud-altitude');
    this.interactPrompt = document.getElementById('interact-prompt');
    this.interactBtn = document.getElementById('btn-interact-npc');
    this.bossBarContainer = document.getElementById('boss-health-container');
    this.bossBarFill = document.getElementById('boss-health-fill');
    this.dialogueBox = document.getElementById('n64-dialogue-box');
    this.dialogueText = document.getElementById('dialogue-content');
    this.dialogueSpeaker = document.getElementById('dialogue-speaker');
    this.dialogueHint = this.dialogueBox ? this.dialogueBox.querySelector('.dialogue-hint') : null;
    this.victoryScreen = document.getElementById('victory-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.jumpCharge = document.getElementById('jump-charge');
    this.jumpChargeFill = document.getElementById('jump-charge-fill');
    this.jumpChargeLabel = document.getElementById('jump-charge-label');

    this.currentSpeaker = '';
    this.currentText = '';
    this.textIndex = 0;
    this.typewriterTimer = null;
    this.isTyping = false;
    this.dialogueQueue = [];
    this.onDialogueClose = null;
    this.onDialogueNext = null;
    this.lastDismissedKey = null;
    this.activeNearNpc = null;

    if (this.interactBtn) {
      this.interactBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.interactBtn.blur();
        if (this.activeNearNpc && this.dialogueBox.style.display !== 'flex') {
          this.activeNearNpc.interact(this);
        }
      });
    }

    if (this.dialogueBox) {
      this.dialogueBox.addEventListener('click', (e) => {
        e.stopPropagation();
        this.advanceDialogue();
      });
    }
  }

  update(player, level, boss) {
    if (this.jumpCharge) {
      const ratio = Math.min(player.chargeTime / 0.35, 1);
      this.jumpCharge.hidden = !player.isChargingJump;
      this.jumpCharge.setAttribute('aria-valuenow', Math.round(ratio * 100));
      this.jumpChargeFill.style.transform = `scaleX(${ratio})`;
      this.jumpChargeLabel.textContent = ratio >= 1 ? '¡SUELTA PARA SALTAR!' : 'CARGANDO SALTO';
    }
    // 1. Contador de vidas, bichos y monedas
    if (this.livesElem) this.livesElem.textContent = `x ${player.lives}`;
    if (this.bugsElem) this.bugsElem.textContent = `${player.bugsEaten % 20} / 20`;
    if (this.coinsElem) this.coinsElem.textContent = `x ${player.coins.toString().padStart(2, '0')}`;

    // Prompt y botón de interacción con NPCs cercanos
    const nearNpc = level && level.npcs ? level.npcs.find(n => n.isNear) : null;
    this.activeNearNpc = nearNpc;

    if (nearNpc && this.dialogueBox.style.display !== 'flex') {
      if (this.interactBtn) this.interactBtn.style.display = 'flex';
      if (this.interactPrompt) {
        this.interactPrompt.textContent = `Hablar con ${nearNpc.name} [E / Clic]`;
      }
    } else {
      if (this.interactBtn) this.interactBtn.style.display = 'none';
    }

    // 2. Altitud y sector del ascenso
    if (this.altitudeElem) {
      const height = Math.max(0, Math.round(player.position.y));
      let zoneName = "Base del Tronco";
      if (height >= 40) zoneName = "¡CIMA - ZONA DEL EXTERMINADOR!";
      else if (height > 32) zoneName = "Ascenso Final a la Cima";
      else if (height > 22) zoneName = "Sector Tuberías TALACORP";
      else if (height > 10) zoneName = "Hojas y Lianas de la Selva";

      this.altitudeElem.textContent = `ALT: ${height}m - ${zoneName}`;
    }

    // 3. Barra del Jefe si está activo (transform scaleX para 60fps sin reflows)
    if (boss && boss.state !== 'dormant' && boss.state !== 'defeated' && (player.position.y >= 40.0 || (boss.hp < boss.maxHp && player.position.y >= 35))) {
      this.bossBarContainer.style.display = 'block';
      const ratio = Math.max(0, boss.hp / boss.maxHp);
      this.bossBarFill.style.transform = `scaleX(${ratio})`;
    } else {
      this.bossBarContainer.style.display = 'none';
    }
  }

  showDialogue(speaker, textOrLines, onClose = null, onNext = null) {
    const lines = Array.isArray(textOrLines) ? [...textOrLines] : [textOrLines];
    const initialText = lines.shift() || '';
    const dialogueKey = `${speaker}:::${initialText}`;

    // Si ya se está mostrando exactamente este diálogo (mismo orador y texto)
    if (this.dialogueBox.style.display === 'flex' && this.currentSpeaker === speaker && this.currentText === initialText) {
      return;
    }

    // Si este diálogo ya fue descartado o avanzado y la caja está cerrada, no reactivarlo en bucles de frame
    if (this.dialogueBox.style.display !== 'flex' && this.lastDismissedKey === dialogueKey) {
      return;
    }

    document.body.classList.add('in-dialogue');
    this.currentSpeaker = speaker;
    this.dialogueQueue = lines;
    this.onDialogueClose = onClose;
    this.onDialogueNext = onNext;

    if (this.dialogueSpeaker) this.dialogueSpeaker.textContent = speaker;
    if (this.interactBtn) this.interactBtn.style.display = 'none';
    this.dialogueBox.style.display = 'flex';

    this.startTypewriter(initialText);
  }

  startTypewriter(text) {
    this.currentText = text;
    this.textIndex = 0;
    this.dialogueText.textContent = '';
    this.isTyping = true;
    this.updateDialogueHint();

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    this.typewriterTimer = setInterval(() => {
      if (this.textIndex < this.currentText.length) {
        this.dialogueText.textContent += this.currentText[this.textIndex];
        this.textIndex++;
        if (this.textIndex % 2 === 0) {
          audio.playBlab();
        }
      } else {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
        this.isTyping = false;
        this.updateDialogueHint();
      }
    }, 28);
  }

  updateDialogueHint() {
    if (!this.dialogueHint) return;
    if (this.isTyping) {
      this.dialogueHint.textContent = '⏩ [ESPACIO: Omitir]';
    } else {
      const hasMore = (this.dialogueQueue && this.dialogueQueue.length > 0) || Boolean(this.onDialogueNext);
      this.dialogueHint.textContent = hasMore ? '▶ [ESPACIO: Siguiente]' : '▼ [ESPACIO: Continuar]';
    }
  }

  advanceDialogue() {
    if (this.dialogueBox.style.display !== 'flex') return;

    // 1. Si aún está escribiéndose letra por letra: COMPLETAR INMEDIATAMENTE
    if (this.isTyping) {
      if (this.typewriterTimer) {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
      }
      this.textIndex = this.currentText.length;
      this.dialogueText.textContent = this.currentText;
      this.isTyping = false;
      audio.playBlab();
      this.updateDialogueHint();
      return;
    }

    // 2. Si ya está completo: PASAR AL SIGUIENTE TEXTO EN COLA
    if (this.dialogueQueue && this.dialogueQueue.length > 0) {
      const nextLine = this.dialogueQueue.shift();
      audio.playBlab();
      this.startTypewriter(nextLine);
      return;
    }

    // 3. Si no hay más texto en cola: avanzar de fase en cinemáticas o cerrar
    this.lastDismissedKey = `${this.currentSpeaker}:::${this.currentText}`;
    const nextCb = this.onDialogueNext;
    this.onDialogueNext = null;

    if (nextCb) {
      nextCb();
    } else {
      this.closeDialogue();
    }
  }

  closeDialogue() {
    document.body.classList.remove('in-dialogue');
    this.dialogueBox.style.display = 'none';
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
    this.isTyping = false;
    this.dialogueQueue = [];
    if (this.onDialogueClose) {
      const cb = this.onDialogueClose;
      this.onDialogueClose = null;
      cb();
    }
  }

  showGameOver(onRestart) {
    this.gameOverScreen.style.display = 'flex';
    const restartBtn = document.getElementById('btn-restart');
    restartBtn.onclick = () => {
      this.gameOverScreen.style.display = 'none';
      if (onRestart) onRestart();
    };
  }

  showVictory(onRestart) {
    this.victoryScreen.style.display = 'flex';
    const nextBtn = document.getElementById('btn-victory-restart');
    nextBtn.onclick = () => {
      this.victoryScreen.style.display = 'none';
      if (onRestart) onRestart();
    };
  }
}
