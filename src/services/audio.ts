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

  public suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }
}

export const audioEngine = new ProceduralAudioEngine();
