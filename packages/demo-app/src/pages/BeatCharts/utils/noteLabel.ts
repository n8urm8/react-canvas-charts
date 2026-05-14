export const formatBeatNoteLabel = (pitchDisplay: string, durationBeats: number): string => {
  const beatLabel = durationBeats === 1 ? 'beat' : 'beats'
  return `${pitchDisplay} (${durationBeats} ${beatLabel})`
}
