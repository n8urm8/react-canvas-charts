export const DEFAULT_LOOP_BEATS = 36
export const MIN_LOOP_BEATS = 16
export const MAX_LOOP_BEATS = 256
export const LOOP_BEAT_STEP = 4
export const SEQUENCER_PIXELS_PER_BEAT = 34
export const MAX_VISUALIZER_POINTS = 88
export const VISUALIZER_MIN_FREQUENCY = 55
export const VISUALIZER_MAX_FREQUENCY = 420
export const ROOT_LAYOUT_SCALE_ID = 'layout-scale'
export const SEQUENCER_CHART_HEIGHT = 320

export const SEQUENCER_MARGIN = {
  top: 16,
  right: 24,
  bottom: 40,
  left: 88
}

export const PITCHES = [
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
  { id: 'G#', display: 'G#/Ab', frequency: 415.3 }
] as const
