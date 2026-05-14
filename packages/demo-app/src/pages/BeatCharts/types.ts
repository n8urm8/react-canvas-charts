import { PITCHES } from './constants'

export type PitchId = (typeof PITCHES)[number]['id']

export type SequencerNote = {
  id: string
  pitch: PitchId
  startBeat: number
  durationBeats: number
}

export type VisualizerPoint = {
  label: string
  frequency: number
}

export type DragState =
  | {
      mode: 'move'
      noteId: string
      startClientX: number
      startClientY: number
      originalStartBeat: number
      originalPitchRow: number
    }
  | {
      mode: 'resize'
      noteId: string
      startClientX: number
      originalDuration: number
      originalStartBeat: number
    }
