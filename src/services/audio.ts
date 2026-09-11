/**
 * Procedural Web Audio API sound synthesizer
 * Produces organic sand trickle whisper (filtered pink noise) and soft vintage clock ticks.
 * Zero external audio files required.
 * Implements strict lifecycle and garbage collection safety to prevent audio graph leaks.
 */
class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private bandpassFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;
  private stopTimeout: number | null = null;

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
    }
  }

  public startSandWhisper() {
    if (this.isRunning) return;
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      // 4-second looping organic pink noise buffer
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.08;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.bandpassFilter = this.ctx.createBiquadFilter();
      this.bandpassFilter.type = 'bandpass';
      this.bandpassFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      this.bandpassFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.noiseGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 0.8);

      this.noiseNode.connect(this.bandpassFilter);
      this.bandpassFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);

      this.noiseNode.start(0);
      this.isRunning = true;
    } catch (e) {
      console.warn('Could not start sand audio:', e);
    }
  }

  public stopSandWhisper() {
    if (!this.isRunning || !this.noiseGain || !this.ctx) return;

    try {
      this.noiseGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
      this.stopTimeout = setTimeout(() => {
        if (this.noiseNode) {
          try {
            this.noiseNode.stop();
          } catch {}
          this.noiseNode.disconnect();
          this.noiseNode = null;
        }
        if (this.bandpassFilter) {
          this.bandpassFilter.disconnect();
          this.bandpassFilter = null;
        }
        if (this.noiseGain) {
          this.noiseGain.disconnect();
          this.noiseGain = null;
        }
        this.isRunning = false;
        this.stopTimeout = null;
      }, 300);
    } catch {
      this.isRunning = false;
    }
  }

  public playTick() {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain);

      // Clean disconnection on finish to prevent audio graph leaks
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  public playAlarm(type: 'none' | 'soft' | 'standard' | 'strong' = 'standard', volume: number = 0.8) {
    if (type === 'none') return;
    this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    try {
      const now = this.ctx.currentTime;
      const vol = Math.max(0, Math.min(1, volume));

      if (type === 'soft') {
        // Soft meditative double bell (528Hz Solfeggio + 660Hz)
        const notes = [
          { time: now + 0.0, freq: 528, dur: 1.4, peak: 0.3 * vol },
          { time: now + 0.22, freq: 660, dur: 1.8, peak: 0.25 * vol }
        ];

        notes.forEach(({ time, freq, dur, peak }) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(peak, time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.onended = () => {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch {}
          };

          osc.start(time);
          osc.stop(time + dur);
        });
        return;
      }

      if (type === 'strong') {
        // Assertive 3-burst chime followed by resonant chord
        const beeps = [
          { time: now + 0.00, freq: 880, dur: 0.10, peak: 0.4 * vol, type: 'triangle' as OscillatorType },
          { time: now + 0.12, freq: 1320, dur: 0.14, peak: 0.4 * vol, type: 'triangle' as OscillatorType },
          { time: now + 0.32, freq: 880, dur: 0.10, peak: 0.4 * vol, type: 'triangle' as OscillatorType },
          { time: now + 0.44, freq: 1320, dur: 0.14, peak: 0.4 * vol, type: 'triangle' as OscillatorType },
          { time: now + 0.64, freq: 880, dur: 0.10, peak: 0.4 * vol, type: 'triangle' as OscillatorType },
          { time: now + 0.76, freq: 1320, dur: 0.14, peak: 0.4 * vol, type: 'triangle' as OscillatorType },
          { time: now + 1.00, freq: 1046, dur: 1.4, peak: 0.35 * vol, type: 'sine' as OscillatorType },
          { time: now + 1.02, freq: 1318, dur: 1.4, peak: 0.25 * vol, type: 'sine' as OscillatorType }
        ];

        beeps.forEach(({ time, freq, dur, peak, type: oscType }) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = oscType;
          osc.frequency.setValueAtTime(freq, time);

          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(peak, time + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.onended = () => {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch {}
          };

          osc.start(time);
          osc.stop(time + dur);
        });
        return;
      }

      // Default / Standard: 3 double-beeps followed by a sustained chime
      const beeps = [
        { time: now + 0.00, freq: 880, dur: 0.10, peak: 0.35 * vol },
        { time: now + 0.14, freq: 1175, dur: 0.14, peak: 0.35 * vol },

        { time: now + 0.40, freq: 880, dur: 0.10, peak: 0.35 * vol },
        { time: now + 0.54, freq: 1175, dur: 0.14, peak: 0.35 * vol },

        { time: now + 0.80, freq: 880, dur: 0.10, peak: 0.35 * vol },
        { time: now + 0.94, freq: 1175, dur: 0.14, peak: 0.35 * vol },

        { time: now + 1.25, freq: 1046, dur: 1.2, peak: 0.3 * vol }
      ];

      beeps.forEach(({ time, freq, dur, peak }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = dur > 0.5 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        };

        osc.start(time);
        osc.stop(time + dur);
      });
    } catch {}
  }

  public testAlarm(type: 'none' | 'soft' | 'standard' | 'strong' = 'standard', volume: number = 0.8) {
    this.playAlarm(type, volume);
  }

  public playCompletionChime() {
    this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    try {
      // 3-tier harmonic meditation bell chime (528Hz, 792Hz, 1056Hz)
      const now = this.ctx.currentTime;
      const harmonics = [
        { freq: 528, gain: 0.18, decay: 1.8 },
        { freq: 792, gain: 0.09, decay: 1.4 },
        { freq: 1056, gain: 0.05, decay: 1.0 }
      ];

      harmonics.forEach(({ freq, gain: vol, decay }) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.onended = () => {
          try {
            osc.disconnect();
            gainNode.disconnect();
          } catch {}
        };

        osc.start(now);
        osc.stop(now + decay);
      });
    } catch {}
  }

  public suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }
}

export const audioEngine = new ProceduralAudioEngine();
