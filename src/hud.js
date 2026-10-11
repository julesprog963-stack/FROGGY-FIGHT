import { audio } from './audio.js';

export class HUD {
  constructor() {
    this.livesElem = document.getElementById('hud-lives');
    this.bugsElem = document.getElementById('hud-bugs');
    this.altitudeElem = document.getElementById('hud-altitude');
    this.bossBarContainer = document.getElementById('boss-health-container');
    this.bossBarFill = document.getElementById('boss-health-fill');
    this.dialogueBox = document.getElementById('n64-dialogue-box');
    this.dialogueText = document.getElementById('dialogue-content');
    this.dialogueSpeaker = document.getElementById('dialogue-speaker');
    this.victoryScreen = document.getElementById('victory-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');

    this.currentText = '';
    this.textIndex = 0;
    this.typewriterTimer = null;
    this.onDialogueClose = null;
  }

  update(player, level, boss) {
    // 1. Contador de vidas y bichos
    if (this.livesElem) this.livesElem.textContent = `x ${player.lives}`;
    if (this.bugsElem) this.bugsElem.textContent = `${player.bugsEaten % 20} / 20`;

    // 2. Altitud y sector del ascenso
    if (this.altitudeElem) {
      const height = Math.max(0, Math.round(player.position.y));
      let zoneName = "Base del Tronco";
      if (height > 35) zoneName = "¡CIMA - ZONA DEL EXTERMINADOR!";
      else if (height > 25) zoneName = "Sector Tuberías TALACORP";
      else if (height > 12) zoneName = "Hojas y Lianas de la Selva";

      this.altitudeElem.textContent = `ALT: ${height}m - ${zoneName}`;
    }

    // 3. Barra del Jefe si está activo (transform scaleX para 60fps sin reflows)
    if (boss && player.position.y > 36 && boss.state !== 'defeated') {
      this.bossBarContainer.style.display = 'block';
      const ratio = Math.max(0, boss.hp / boss.maxHp);
      this.bossBarFill.style.transform = `scaleX(${ratio})`;
    } else {
      this.bossBarContainer.style.display = 'none';
    }
  }

  showDialogue(speaker, text, onClose = null) {
    this.dialogueSpeaker.textContent = speaker;
    this.dialogueBox.style.display = 'flex';
    this.currentText = text;
    this.textIndex = 0;
    this.dialogueText.textContent = '';
    this.onDialogueClose = onClose;

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
      }
    }, 28);
  }

  closeDialogue() {
    this.dialogueBox.style.display = 'none';
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    if (this.onDialogueClose) {
      this.onDialogueClose();
      this.onDialogueClose = null;
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
