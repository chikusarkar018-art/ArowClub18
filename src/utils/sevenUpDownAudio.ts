// Web Audio API Sound Effects for 7 Up 7 Down Live Casino
import { audioMaster } from './audioMaster.js';

class SevenUpDownAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgInterval: any = null;
  private bgGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;

  constructor() {
    audioMaster.registerEngine('sevenUpDownAudio', {
      stop: () => this.stopAll(),
      getAudioContext: () => this.ctx,
    });
  }

  public stopAll() {
    try {
      this.stopCasinoMusic();
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
    if (muted) {
      this.stopCasinoMusic();
    } else {
      this.startCasinoMusic();
    }
  }

  // Authentic live casino ambient lounge music & casino room atmosphere
  startCasinoMusic() {
    if (this.isMuted || !audioMaster.isAudioAllowed()) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.isMusicPlaying) return;
      this.isMusicPlaying = true;

      // Master background gain with soft compressor/limiter
      this.bgGain = this.ctx.createGain();
      this.bgGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.bgGain.connect(this.ctx.destination);

      // Lush Casino VIP Lounge Chord Progression (Fmaj9 -> Em7 -> Dm9 -> G13 -> Cmaj9 -> Am9)
      const loungeChords = [
        { bass: 174.61, chord: [349.23, 440.00, 523.25, 659.25] }, // Fmaj9
        { bass: 164.81, chord: [329.63, 392.00, 493.88, 587.33] }, // Em7
        { bass: 146.83, chord: [293.66, 349.23, 440.00, 523.25] }, // Dm9
        { bass: 196.00, chord: [392.00, 493.88, 587.33, 659.25] }, // G13
        { bass: 130.81, chord: [261.63, 329.63, 392.00, 493.88] }, // Cmaj9
        { bass: 110.00, chord: [220.00, 261.63, 329.63, 440.00] }, // Am9
      ];
      let chordIndex = 0;
      let beatCount = 0;

      const playLoungeBar = () => {
        if (!this.ctx || !this.isMusicPlaying || !this.bgGain || this.isMuted) return;
        const current = loungeChords[chordIndex % loungeChords.length];
        chordIndex++;
        const now = this.ctx.currentTime;

        // 1. Deep warm lounge bass note
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(current.bass, now);
        bassGain.gain.setValueAtTime(0.001, now);
        bassGain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        bassOsc.connect(bassGain);
        bassGain.connect(this.bgGain);
        bassOsc.start(now);
        bassOsc.stop(now + 2.6);

        // 2. Warm Rhodes / Electric Piano chord voices with subtle chorus
        current.chord.forEach((freq, i) => {
          if (!this.ctx || !this.bgGain) return;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(freq, now);
          osc2.frequency.setValueAtTime(freq * 1.002, now); // subtle detune for Rhodes richness

          const stagger = i * 0.035; // gentle rolled chord strum
          noteGain.gain.setValueAtTime(0.001, now + stagger);
          noteGain.gain.linearRampToValueAtTime(0.028, now + stagger + 0.15);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + stagger + 2.4);

          osc1.connect(noteGain);
          osc2.connect(noteGain);
          noteGain.connect(this.bgGain);

          osc1.start(now + stagger);
          osc2.start(now + stagger);
          osc1.stop(now + stagger + 2.5);
          osc2.stop(now + stagger + 2.5);
        });

        // 3. Subtle casino room ambiance: gentle brushed jazz pulse & distant chip clink
        beatCount++;
        if (beatCount % 2 === 0) {
          // Soft distant casino chip clink in the room
          try {
            const chipOsc = this.ctx.createOscillator();
            const chipGain = this.ctx.createGain();
            chipOsc.type = 'triangle';
            chipOsc.frequency.setValueAtTime(1800 + Math.random() * 400, now + 0.4);
            chipGain.gain.setValueAtTime(0.008, now + 0.4);
            chipGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
            chipOsc.connect(chipGain);
            chipGain.connect(this.bgGain);
            chipOsc.start(now + 0.4);
            chipOsc.stop(now + 0.5);
          } catch {}
        }
      };

      playLoungeBar();
      this.bgInterval = setInterval(playLoungeBar, 2600);
    } catch {}
  }

  stopCasinoMusic() {
    this.isMusicPlaying = false;
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
    if (this.bgGain && this.ctx) {
      try {
        this.bgGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      } catch {}
    }
  }

  // Chip placement sound
  playChip() {
    if (this.isMuted || !audioMaster.isAudioAllowed()) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.03);
      osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // ignore
    }
  }

  // Card slide / deal whoosh sound
  playCardDeal() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      
      // Noise burst filtered for card sliding on felt
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.12);
      filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + 0.12);
    } catch {
      // ignore
    }
  }

  // Card landing thud on table felt
  playCardPlace() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {
      // ignore
    }
  }

  // Timer Tick
  playTick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // ignore
    }
  }

  // Round start / Place your bets announcement chime
  playStartChime() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.35);
      });
    } catch {
      // ignore
    }
  }

  // Card Flip / Reveal Sound
  playCardFlip() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.11);
    } catch {
      // ignore
    }
  }

  // Win Victory Jingle
  playWin() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.3, this.ctx!.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.1 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.1);
        osc.stop(this.ctx!.currentTime + idx * 0.1 + 0.45);
      });
    } catch {
      // ignore
    }
  }
}

export const sevenUpDownAudio = new SevenUpDownAudio();
