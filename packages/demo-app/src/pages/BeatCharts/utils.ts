import { PITCHES } from './constants'
import type { PitchId, SequencerNote } from './types'

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const createNoteId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `beat-note-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const createInitialNotes = (): SequencerNote[] => {
  // Moonlight Sonata opener inspired seed (C# minor), represented as repeating 3-note pulses.
  const sections: Array<{
    rightHand: [PitchId, PitchId, PitchId]
    repeats: number
    bass: PitchId
  }> = [
    { rightHand: ['G#', 'C#', 'E'], repeats: 4, bass: 'C#' },
    { rightHand: ['A', 'C#', 'E'], repeats: 2, bass: 'A' },
    { rightHand: ['A', 'D', 'F#'], repeats: 2, bass: 'F#' },
    { rightHand: ['G#', 'C#', 'E'], repeats: 2, bass: 'G#' },
    { rightHand: ['G#', 'D', 'F#'], repeats: 2, bass: 'G#' }
  ]

  const notes: SequencerNote[] = []
  let currentBeat = 0

  sections.forEach((section) => {
    const sectionLengthBeats = section.repeats * 3

    notes.push({
      id: createNoteId(),
      pitch: section.bass,
      startBeat: currentBeat,
      durationBeats: sectionLengthBeats
    })

    for (let repeat = 0; repeat < section.repeats; repeat += 1) {
      section.rightHand.forEach((pitch, index) => {
        notes.push({
          id: createNoteId(),
          pitch,
          startBeat: currentBeat + repeat * 3 + index,
          durationBeats: 1
        })
      })
    }

    currentBeat += sectionLengthBeats
  })

  return notes
}

export const getPitchFrequency = (pitchId: string): number => {
  return PITCHES.find((pitch) => pitch.id === pitchId)?.frequency ?? 220
}

export const getPitchDisplay = (pitchId: string): string => {
  return PITCHES.find((pitch) => pitch.id === pitchId)?.display ?? pitchId
}
