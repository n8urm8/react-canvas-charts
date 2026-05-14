export type PitchId = string;

export declare const useSound: () => {
  playPitch: (pitch: PitchId, durationMs: number) => Promise<void>;
};