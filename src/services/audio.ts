/**
 * Procedural Web Audio API sound synthesizer
 * Produces organic sand trickle whisper (filtered noise) and soft vintage clock tick.
 * Zero external audio files required.
 */
class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
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
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      // Create 4 seconds of looping organic white/pink noise buffer
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter algorithm (Paul Kellet's method)
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.08;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      // Bandpass filter to simulate gentle falling sand grains
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      // Smooth fade in
      this.noiseGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 1.2);

      this.noiseNode.connect(bandpass);
      bandpass.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);

      this.noiseNode.start(0);
      this.isRunning = true;
    } catch (e) {
      console.warn('Could not start procedural sand audio:', e);
    }
  }

  public stopSandWhisper() {
    if (!this.isRunning || !this.noiseGain || !this.ctx) return;
    try {
      this.noiseGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
      setTimeout(() => {
        if (this.noiseNode) {
          try { this.noiseNode.stop(); } catch {}
          this.noiseNode.disconnect();
          this.noiseNode = null;
        }
        this.isRunning = false;
      }, 500);
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

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }
}

export const audioEngine = new ProceduralAudioEngine();
