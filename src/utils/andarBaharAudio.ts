import { audioMaster } from './audioMaster.js';

class AndarBaharAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastAnnouncedText: string = '';
  private lastAnnounceTime: number = 0;

  constructor() {
    audioMaster.registerEngine('andarBaharAudio', {
      stop: () => this.stopAll(),
      getAudioContext: () => this.ctx,
    });
  }

  public stopAll() {
    try {
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } catch {}
  }

  private init() {
    if (typeof window === 'undefined') return;
    if (!audioMaster.isAudioAllowed(this.isMuted)) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        audioMaster.registerContext(this.ctx);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && audioMaster.isAudioAllowed(this.isMuted)) {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  // Crisp casino chip clink sound
  playChip() {
    if (this.isMuted || !audioMaster.isAudioAllowed()) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.02);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  // Realistic card sliding from dealing shoe (friction swoosh)
  playCardSlide() {
    if (this.isMuted || !audioMaster.isAudioAllowed()) return;
    try {
      this.init();
      if (!this.ctx) return;
      // White noise buffer filtered for paper swoosh
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.12);
      filter.Q.value = 1.8;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {}
  }

  // Card landing snap on table felt
  playCardFlip() {
    if (this.isMuted || !audioMaster.isAudioAllowed()) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {}
  }

  // Circular timer tick
  playCountdownTick() {
    if (this.isMuted || !audioMaster.isAudioAllowed()) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  // "No More Bets" chime
  playBetsClosed() {
    if (this.isMuted || !audioMaster.isAudioAllowed()) return;
    try {
      this.init();
      if (!this.ctx) return;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, this.ctx!.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx!.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.35);
      });
    } catch {}
  }

  // Victory fanfare and coin cascades
  playWinFanfare() {
    if (this.isMuted || !audioMaster.isAudioAllowed()) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.1);

        gain.gain.setValueAtTime(0, this.ctx!.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, this.ctx!.currentTime + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.1 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + i * 0.1);
        osc.stop(this.ctx!.currentTime + i * 0.1 + 0.45);
      });
    } catch {}
  }

  // Live Dealer vocal speech announcement (synthesized female croupier voice)
  announce(text: string) {
    if (this.isMuted || typeof window === 'undefined') return;
    const now = Date.now();
    if (this.lastAnnouncedText === text && now - this.lastAnnounceTime < 2500) {
      return;
    }
    this.lastAnnouncedText = text;
    this.lastAnnounceTime = now;

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.15; // Elegant feminine pitch
        utterance.volume = 0.85;

        // Try to select an English female voice if available
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => 
          (v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Natural') || v.name.includes('Zira')))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch {}
  }
}

export const andarBaharAudio = new AndarBaharAudio();
