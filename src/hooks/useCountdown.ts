import { useState, useEffect } from 'react';
import { calculateCountdown } from '../services/countdown';
import { CountdownState } from '../types/countdown';
import { audioEngine } from '../services/audio';

export function useCountdown(
  startedAtIso: string,
  deadlineIso: string,
  soundEnabled: boolean
): CountdownState {
  const [state, setState] = useState<CountdownState>(() =>
    calculateCountdown(startedAtIso, deadlineIso, new Date())
  );

  useEffect(() => {
    let lastSecond = -1;

    const interval = setInterval(() => {
      const now = new Date();
      const currentSec = now.getSeconds();

      const nextState = calculateCountdown(startedAtIso, deadlineIso, now);
      setState(nextState);

      // Trigger soft tick on every integer second if sound enabled
      if (soundEnabled && !nextState.isExpired && currentSec !== lastSecond) {
        lastSecond = currentSec;
        audioEngine.playTick();
      }
    }, 200); // 5Hz UI refresh keeps it snappy without CPU waste

    return () => clearInterval(interval);
  }, [startedAtIso, deadlineIso, soundEnabled]);

  return state;
}
