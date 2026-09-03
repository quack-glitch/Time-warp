import { describe, it, expect } from 'vitest';
import { audioEngine } from '../src/services/audio';

describe('Procedural Web Audio Engine Safety', () => {
  it('instantiates cleanly without throwing when AudioContext is mocked or unavailable', () => {
    expect(audioEngine).toBeDefined();
    expect(typeof audioEngine.startSandWhisper).toBe('function');
    expect(typeof audioEngine.stopSandWhisper).toBe('function');
    expect(typeof audioEngine.playTick).toBe('function');
    expect(typeof audioEngine.setVolume).toBe('function');
  });

  it('safely handles rapid start and stop calls without throwing', () => {
    expect(() => {
      audioEngine.startSandWhisper();
      audioEngine.stopSandWhisper();
      audioEngine.startSandWhisper();
      audioEngine.stopSandWhisper();
    }).not.toThrow();
  });
});
