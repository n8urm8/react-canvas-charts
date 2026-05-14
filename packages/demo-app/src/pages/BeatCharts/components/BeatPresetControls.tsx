import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { SequencerNote } from '../types'

const BEAT_PRESETS_STORAGE_KEY = 'beat-charts-presets-v1'
const NEW_SAVE_TARGET = '__new__'

type SavedBeatPreset = {
  id: string
  savedAt: number
  notes: SequencerNote[]
  config: {
    bpm: number
    loopBeats: number
    panBeat: number
  }
}

type BeatPresetControlsProps = {
  notes: SequencerNote[]
  bpm: number
  loopBeats: number
  panBeat: number
  onApplyPreset: (preset: { notes: SequencerNote[]; bpm: number; loopBeats: number; panBeat: number }) => void
}

export const BeatPresetControls: React.FC<BeatPresetControlsProps> = ({
  notes,
  bpm,
  loopBeats,
  panBeat,
  onApplyPreset
}) => {
  const [savedPresets, setSavedPresets] = useState<SavedBeatPreset[]>([])
  const [selectedSavePresetId, setSelectedSavePresetId] = useState(NEW_SAVE_TARGET)
  const [selectedLoadPresetId, setSelectedLoadPresetId] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const raw = window.localStorage.getItem(BEAT_PRESETS_STORAGE_KEY)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as SavedBeatPreset[]
      if (!Array.isArray(parsed)) return
      setSavedPresets(parsed)
      if (parsed[0]) {
        setSelectedSavePresetId(NEW_SAVE_TARGET)
        setSelectedLoadPresetId(parsed[0].id)
      }
    } catch {
      setSavedPresets([])
    }
  }, [])

  const persistPresets = useCallback((nextPresets: SavedBeatPreset[]) => {
    setSavedPresets(nextPresets)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BEAT_PRESETS_STORAGE_KEY, JSON.stringify(nextPresets))
    }
  }, [])

  const createPresetSnapshot = useCallback((): SavedBeatPreset => {
    const savedAt = Date.now()
    return {
      id: `${savedAt}`,
      savedAt,
      notes: notes.map((note) => ({ ...note })),
      config: {
        bpm,
        loopBeats,
        panBeat
      }
    }
  }, [notes, bpm, loopBeats, panBeat])

  const handleSavePreset = useCallback(() => {
    if (selectedSavePresetId === NEW_SAVE_TARGET) {
      const preset = createPresetSnapshot()
      const nextPresets = [preset, ...savedPresets]
      persistPresets(nextPresets)
      setSelectedSavePresetId(preset.id)
      setSelectedLoadPresetId(preset.id)
      return
    }

    if (!selectedSavePresetId) return

    const updatedPreset = createPresetSnapshot()
    let didReplace = false
    const nextPresets = savedPresets.map((preset) => {
      if (preset.id !== selectedSavePresetId) return preset
      didReplace = true
      return {
        ...updatedPreset,
        id: preset.id
      }
    })

    if (!didReplace) return
    persistPresets(nextPresets)
    setSelectedLoadPresetId(selectedSavePresetId)
  }, [createPresetSnapshot, persistPresets, savedPresets, selectedSavePresetId])

  const handleLoadPreset = useCallback(() => {
    if (!selectedLoadPresetId) return

    const preset = savedPresets.find((entry) => entry.id === selectedLoadPresetId)
    if (!preset) return

    onApplyPreset({
      notes: preset.notes.map((note) => ({ ...note })),
      bpm: preset.config.bpm,
      loopBeats: preset.config.loopBeats,
      panBeat: preset.config.panBeat
    })
  }, [onApplyPreset, savedPresets, selectedLoadPresetId])

  const presetOptions = useMemo(
    () =>
      savedPresets.map((preset) => ({
        id: preset.id,
        label: new Date(preset.savedAt).toLocaleString()
      })),
    [savedPresets]
  )

  return (
    <>
      <label className="beat-slider-group" htmlFor="beat-save-target">
        <span>Save Target</span>
        <select
          id="beat-save-target"
          className="beat-select"
          value={selectedSavePresetId}
          onChange={(event) => setSelectedSavePresetId(event.target.value)}
        >
          <option value={NEW_SAVE_TARGET}>New</option>
          {presetOptions.map((preset) => (
            <option key={`save-${preset.id}`} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      <div className="beat-control-actions">
        <button type="button" className="beat-button" onClick={handleSavePreset}>
          Save
        </button>
      </div>

      <label className="beat-slider-group" htmlFor="beat-load-target">
        <span>Load File</span>
        <select
          id="beat-load-target"
          className="beat-select"
          value={selectedLoadPresetId}
          onChange={(event) => setSelectedLoadPresetId(event.target.value)}
        >
          <option value="">Select saved file</option>
          {presetOptions.map((preset) => (
            <option key={`load-${preset.id}`} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      <div className="beat-control-actions">
        <button
          type="button"
          className="beat-button"
          onClick={handleLoadPreset}
          disabled={!selectedLoadPresetId}
        >
          Load
        </button>
      </div>
    </>
  )
}
