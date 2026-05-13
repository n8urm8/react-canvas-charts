import { useRef, useCallback } from 'react';

type PitchId = string;

type Pitch = {
  id: PitchId;
  display: string;
  frequency: number;
};

const PITCHES: Pitch[] = [
  { id: 'A', display: 'A', frequency: 220 },
  { id: 'A#', display: 'A#/Bb', frequency: 233.08 },
  { id: 'B', display: 'B', frequency: 246.94 },
  { id: 'C', display: 'C', frequency: 261.63 },
  { id: 'C#', display: 'C#/Db', frequency: 277.18 },
  { id: 'D', display: 'D', frequency: 293.66 },
  { id: 'D#', display: 'D#/Eb', frequency: 311.13 },
  { id: 'E', display: 'E', frequency: 329.63 },
  { id: 'F', display: 'F', frequency: 349.23 },
  { id: 'F#', display: 'F#/Gb', frequency: 369.99 },
  { id: 'G', display: 'G', frequency: 392 },
  { id: 'G#', display: 'G#/Ab', frequency: 415.3 },
];

export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const ensureAudioGraph = useCallback(async (): Promise<AudioContext | null> => {
    let context = audioContextRef.current;

    if (!context) {
      context = new AudioContext();
      const masterGain = context.createGain();
      masterGain.gain.value = 0.1;
      masterGain.connect(context.destination);

      audioContextRef.current = context;
      masterGainRef.current = masterGain;
    }

    if (context.state === 'suspended') {
      await context.resume();
    }

    return context;
  }, []);

  const playPitch = useCallback(
    async (pitch: PitchId, durationMs: number) => {
      const context = await ensureAudioGraph();
      const masterGain = masterGainRef.current;
      if (!context || !masterGain) {
        return;
      }

      const pitchConfig = PITCHES.find((item) => item.id === pitch);
      if (!pitchConfig) {
        return;
      }

      const oscillator = context.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(pitchConfig.frequency, context.currentTime);

      const gainNode = context.createGain();
      const now = context.currentTime;
      const noteDuration = Math.max(0.05, durationMs / 1000);
      const attack = Math.min(0.02, noteDuration * 0.25);
      const releaseStart = now + noteDuration - 0.02;

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.22, now + attack);
      gainNode.gain.setValueAtTime(0.22, releaseStart);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, releaseStart + 0.02);

      oscillator.connect(gainNode);
      gainNode.connect(masterGain);

      oscillator.start(now);
      oscillator.stop(now + noteDuration);
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    },
    [ensureAudioGraph]
  );

  return { playPitch };
};