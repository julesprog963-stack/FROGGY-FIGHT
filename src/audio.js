// Sistema de Audio WebAudio procedural estilo N64 / Rareware (Banjo / Conker)
class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.musicRunning = false;
    this.currentTrack = 'jungle'; // 'jungle' | 'industrial' | 'boss'
    this.nextNoteTime = 0;
    this.step = 0;
    this.bpm = 120;
    this.timerId = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;
    this.sfxGain.connect(this.masterGain);

    this.startMusic();
  }

  toggleMute() {
    if (!this.ctx) this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
    }
    return this.isMuted;
  }

  // SFX: Salto con muelle / boing estilo Conker
  playJump(powerRatio = 0.5) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const startFreq = 140 + powerRatio * 80;
    const endFreq = 380 + powerRatio * 260;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.16);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // SFX: Aterrizaje
  playLand() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // SFX: Disparo de lengua elástica (thwip!)
  playTongueShoot() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.09);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // SFX: Anclaje de lengua a rama (plock!)
  playTongueAttach() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.04);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // SFX: Tragar bicho (slurp + chomp!)
  playEatBug() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Slurp
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(260, now);
    osc1.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Chime brillante retro (como recolectar plátano en DK64)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.07);
    osc2.frequency.setValueAtTime(1320, now + 0.13);
    gain2.gain.setValueAtTime(0.3, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.3);
  }

  // SFX: ¡1 Vida extra obtenida! Fanfarria Rareware 4 notas
  play1Up() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.4, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.22);
    });
  }

  // SFX: Moneda dorada recogida (Ding brillante retro estilo Mario / Banjo)
  playCoin() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Tono 1: B5 (987.77 Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // Tono 2: E6 (1318.51 Hz)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.07);
    gain2.gain.setValueAtTime(0.4, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.4);
  }

  // SFX: Hoja crujiendo / aviso de peligro
  playLeafCreak() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // SFX: Daño recibido
  playHurt() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // SFX: Checkpoint
  playCheckpoint() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.12); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.24); // D6
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  // SFX: Voz cómica N64 Banjo/Conker estilo "croak-gabble"
  playBlab() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const f = 160 + Math.random() * 80;
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 0.7, now + 0.06);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // SFX: Jefe golpeado (Butt-slam / Stomp)
  playBossHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Golpe metálico
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.36);
  }

  // Música dinámica sintetizada estilo N64
  setTrack(track) {
    if (this.currentTrack === track) return;
    this.currentTrack = track;
    if (track === 'boss') {
      this.bpm = 144;
    } else if (track === 'industrial') {
      this.bpm = 130;
    } else {
      this.bpm = 115;
    }
  }

  startMusic() {
    if (this.musicRunning) return;
    this.musicRunning = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduler();
  }

  scheduler() {
    if (!this.musicRunning) return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      this.playNoteStep(this.step, this.nextNoteTime);
      const secondsPerBeat = 60.0 / this.bpm;
      this.nextNoteTime += 0.25 * secondsPerBeat; // semicorchea
      this.step = (this.step + 1) % 32;
    }
    this.timerId = setTimeout(() => this.scheduler(), 35);
  }

  playNoteStep(step, time) {
    if (this.isMuted || !this.ctx) return;

    // Bajo slap estilo N64
    if (step % 4 === 0 || step % 8 === 6) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      
      let baseFreq = 65.41; // C2
      if (this.currentTrack === 'boss') {
        const bossNotes = [58.27, 58.27, 69.30, 77.78]; // A#1, D2, D#2
        baseFreq = bossNotes[Math.floor(step / 8) % 4];
      } else if (this.currentTrack === 'industrial') {
        const indNotes = [65.41, 65.41, 73.42, 61.74];
        baseFreq = indNotes[Math.floor(step / 8) % 4];
      } else {
        const jNotes = [65.41, 82.41, 98.00, 87.31]; // C2, E2, G2, F2
        baseFreq = jNotes[Math.floor(step / 8) % 4];
      }

      osc.frequency.setValueAtTime(baseFreq, time);
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.19);
    }

    // Melodía tipo xilófono / marimba de selva
    const melodySteps = [0, 3, 6, 10, 12, 14, 18, 22, 26, 28];
    if (melodySteps.includes(step)) {
      const mOsc = this.ctx.createOscillator();
      const mGain = this.ctx.createGain();
      mOsc.type = this.currentTrack === 'boss' ? 'sawtooth' : 'sine';
      
      const jungleScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      const bossScale = [233.08, 261.63, 277.18, 311.13, 349.23, 466.16];
      const scale = (this.currentTrack === 'boss') ? bossScale : jungleScale;
      const noteIdx = (step * 3) % scale.length;
      
      mOsc.frequency.setValueAtTime(scale[noteIdx], time);
      mGain.gain.setValueAtTime(this.currentTrack === 'boss' ? 0.18 : 0.22, time);
      mGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      mOsc.connect(mGain);
      mGain.connect(this.musicGain);
      mOsc.start(time);
      mOsc.stop(time + 0.13);
    }

    // Percusión / hi-hat retro
    if (step % 2 === 0) {
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'square';
      bOsc.frequency.setValueAtTime(step % 4 === 2 ? 800 : 1200, time);
      bGain.gain.setValueAtTime(0.06, time);
      bGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      bOsc.connect(bGain);
      bGain.connect(this.musicGain);
      bOsc.start(time);
      bOsc.stop(time + 0.05);
    }
  }

  // SFX Cinemática: Ronquido tierno de Frogbert dormido
  playSnore() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.7);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.72);
  }

  // SFX Cinemática: Pisada pesada de Pato Lemus y Talabots
  playHeavyStomp() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // SFX Cinemática: Patada cómica ¡POW!
  playKickImpact() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Tono descendente contundente
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // SFX Cinemática: Silbido de vuelo en arco parabólico
  playFlightWhoosh() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.8);
    osc.frequency.exponentialRampToValueAtTime(120, now + 1.8);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.85);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.9);
  }

  // SFX Cinemática: Aterrizaje brusco de Frogbert en el suelo
  playCrashLanding() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }
}

export const audio = new AudioManager();
