import { describe, it, expect } from 'vitest';
import { audioEngine } from '../src/services/audio';

describe('Procedural Web Audio Engine Safety', () => {
  it('instantiates cleanly without throwing when AudioContext is mocked or unavailable', () => {
    expect(audioEngine).toBeDefined();
    expect(typeof audioEngine.startSandWhisper).toBe('function');
    expect(typeof audioEngine.stopSandWhisper).toBe('function');
    expect(typeof audioEngine.playTick).toBe('function');
    expect(typeof audioEngine.setVolume).toBe('function');
    expect(typeof audioEngine.playAlarm).toBe('function');
    expect(typeof audioEngine.testAlarm).toBe('function');
  });

  it('safely handles rapid start and stop calls without throwing', () => {
    expect(() => {
      audioEngine.startSandWhisper();
      audioEngine.stopSandWhisper();
      audioEngine.startSandWhisper();
      audioEngine.stopSandWhisper();
    }).not.toThrow();
  });

  it('safely handles alarm playback with all alarm types and volumes without throwing', () => {
    expect(() => {
      audioEngine.playAlarm('none', 0.5);
      audioEngine.playAlarm('soft', 0.2);
      audioEngine.playAlarm('standard', 0.8);
      audioEngine.playAlarm('strong', 1.0);
      audioEngine.testAlarm('standard', 0.8);
    }).not.toThrow();
  });
});
