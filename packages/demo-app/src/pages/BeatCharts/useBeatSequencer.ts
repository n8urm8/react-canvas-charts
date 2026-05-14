import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSound } from '../../utils/soundUtils'
import {
  DEFAULT_LOOP_BEATS,
  MIN_LOOP_BEATS,
  MAX_LOOP_BEATS,
  LOOP_BEAT_STEP,
  SEQUENCER_PIXELS_PER_BEAT,
  SEQUENCER_MARGIN,
  MAX_VISUALIZER_POINTS,
  VISUALIZER_MIN_FREQUENCY,
  VISUALIZER_MAX_FREQUENCY
} from './constants'
import type { DragState, SequencerNote, VisualizerPoint, PitchId } from './types'
import { clamp, createInitialNotes, getPitchFrequency } from './utils'

export const useBeatSequencer = () => {
  const [bpm, setBpm] = useState(240)
  const [loopBeats, setLoopBeats] = useState(DEFAULT_LOOP_BEATS)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [notes, setNotes] = useState<SequencerNote[]>(createInitialNotes)
  const [activePitches, setActivePitches] = useState<PitchId[]>([])
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [sequencerViewportWidth, setSequencerViewportWidth] = useState(760)
  const [panBeat, setPanBeat] = useState(0)
  const [visualizerData, setVisualizerData] = useState<VisualizerPoint[]>(() =>
    Array.from({ length: 48 }, (_, index) => ({
      label: `${index}`,
      frequency: 220 + Math.sin(index * 0.38) * 10
    }))
  )

  const notesRef = useRef<SequencerNote[]>(createInitialNotes())
  const sequencerChartHostRef = useRef<HTMLDivElement | null>(null)
  const playbackTimerRef = useRef<number | null>(null)
  const sampleIndexRef = useRef(48)
  const lastFrequencyRef = useRef(220)
  const visualizerEnergyRef = useRef(0)
  const visualizerPhaseRef = useRef(0)
  const suppressGridClickRef = useRef(false)
  const dragMovedRef = useRef(false)
  const isSyncingPanRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  const { playPitch } = useSound()

  // Keep notesRef in sync with notes state
  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  // Listen for viewport width changes
  useEffect(() => {
    const host = sequencerChartHostRef.current
    if (!host) return

    const updateWidth = () => {
      const { width } = host.getBoundingClientRect()
      if (width > 0) {
        setSequencerViewportWidth(width)
      }
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  // Constrain state when loop length changes
  useEffect(() => {
    setCurrentBeat((previous) => clamp(previous, 0, Math.max(0, loopBeats - 1)))
    setNotes((previous) =>
      previous
        .filter((note) => note.startBeat < loopBeats)
        .map((note) => ({
          ...note,
          durationBeats: clamp(note.durationBeats, 1, Math.max(1, loopBeats - note.startBeat))
        }))
    )
  }, [loopBeats])

  const sequencerPlotWidth = useMemo(() => loopBeats * SEQUENCER_PIXELS_PER_BEAT, [loopBeats])
  const sequencerSurfaceWidth = useMemo(
    () => sequencerPlotWidth + SEQUENCER_MARGIN.left + SEQUENCER_MARGIN.right,
    [sequencerPlotWidth]
  )
  const sequencerPlotHeight = useMemo(
    () => Math.max(120, 320 - SEQUENCER_MARGIN.top - SEQUENCER_MARGIN.bottom),
    []
  )
  const beatWidth = useMemo(() => SEQUENCER_PIXELS_PER_BEAT, [])
  const visibleBeatCount = useMemo(
    () => Math.max(1, Math.floor((sequencerViewportWidth - SEQUENCER_MARGIN.left - SEQUENCER_MARGIN.right) / beatWidth)),
    [beatWidth, sequencerViewportWidth]
  )
  const maxPanBeat = useMemo(() => Math.max(0, loopBeats - visibleBeatCount), [loopBeats, visibleBeatCount])
  const pitchRowHeight = useMemo(
    () => (12 > 1 ? sequencerPlotHeight / 11 : sequencerPlotHeight),
    [sequencerPlotHeight]
  )

  // Sync pan state to max
  useEffect(() => {
    setPanBeat((previous) => clamp(previous, 0, maxPanBeat))
  }, [maxPanBeat])

  // Sync scroll position with pan beat
  useEffect(() => {
    const host = sequencerChartHostRef.current
    if (!host) return

    isSyncingPanRef.current = true
    host.scrollLeft = panBeat * beatWidth
    window.setTimeout(() => {
      isSyncingPanRef.current = false
    }, 0)
  }, [beatWidth, panBeat])

  // Listen for scroll events
  useEffect(() => {
    const host = sequencerChartHostRef.current
    if (!host) return

    const handleScroll = () => {
      if (isSyncingPanRef.current) return
      const nextPanBeat = clamp(Math.round(host.scrollLeft / beatWidth), 0, maxPanBeat)
      setPanBeat(nextPanBeat)
    }

    host.addEventListener('scroll', handleScroll)
    return () => host.removeEventListener('scroll', handleScroll)
  }, [beatWidth, maxPanBeat])

  const beatGridPoints = useMemo(() => loopBeats + 1, [loopBeats])

  const handleLoopBeatsChange = useCallback((nextBeats: number) => {
    const rounded = Math.round(nextBeats / LOOP_BEAT_STEP) * LOOP_BEAT_STEP
    setLoopBeats(clamp(rounded, MIN_LOOP_BEATS, MAX_LOOP_BEATS))
  }, [])

  const handlePanBeatChange = useCallback(
    (nextPan: number) => {
      setPanBeat(clamp(nextPan, 0, maxPanBeat))
    },
    [maxPanBeat]
  )

  const handleBpmChange = useCallback((nextBpm: number) => {
    setBpm(clamp(nextBpm || 60, 60, 500))
  }, [])

  const ensureAudioGraph = useCallback(async (): Promise<AudioContext | null> => {
    let context = audioContextRef.current
    if (!context) {
      context = new AudioContext()
      const masterGain = context.createGain()
      masterGain.gain.value = 0.1
      masterGain.connect(context.destination)
      audioContextRef.current = context
      masterGainRef.current = masterGain
    }
    if (context.state === 'suspended') {
      await context.resume()
    }
    return context
  }, [])

  const appendVisualizerSample = useCallback(
    (notesForStep: SequencerNote[]) => {
      const activeFrequencies = notesForStep.flatMap((note) => {
        const frequency = getPitchFrequency(note.pitch)
        return frequency === undefined ? [] : [frequency]
      })

      const targetFrequency =
        activeFrequencies.length > 0
          ? activeFrequencies.reduce((sum, frequency) => sum + frequency, 0) / activeFrequencies.length
          : 170

      const pitchSpread =
        activeFrequencies.length > 1 ? Math.max(...activeFrequencies) - Math.min(...activeFrequencies) : 0
      const hitStrength = clamp(activeFrequencies.length / 4, 0, 1)
      const updatedEnergy = Math.max(hitStrength, visualizerEnergyRef.current * 0.9)
      visualizerEnergyRef.current = updatedEnergy

      const sampleCount = activeFrequencies.length > 0 ? 14 : 10
      const bridgeCount = Math.max(4, Math.floor(sampleCount * 0.45))
      const flowCount = sampleCount - bridgeCount
      const burstAmplitude = 10 + updatedEnergy * 38 + pitchSpread * 0.05

      const generatedSamples: VisualizerPoint[] = []
      let currentFrequency = lastFrequencyRef.current

      // Bridge samples ease from the previous value into the new target so transitions feel fluid.
      for (let index = 0; index < bridgeCount; index += 1) {
        const t = (index + 1) / bridgeCount
        const eased = 1 - Math.pow(1 - t, 3)
        visualizerPhaseRef.current += 0.18

        const harmonic =
          Math.sin(visualizerPhaseRef.current * 1.15) * burstAmplitude * 0.22 +
          Math.sin(visualizerPhaseRef.current * 2.1) * burstAmplitude * 0.1
        const bridgeTarget = currentFrequency + (targetFrequency - currentFrequency) * eased

        currentFrequency = clamp(
          bridgeTarget + harmonic,
          VISUALIZER_MIN_FREQUENCY,
          VISUALIZER_MAX_FREQUENCY
        )

        generatedSamples.push({
          label: `${sampleIndexRef.current + index}`,
          frequency: currentFrequency
        })
      }

      for (let index = 0; index < flowCount; index += 1) {
        const progress = (index + 1) / Math.max(1, flowCount)
        visualizerPhaseRef.current += 0.34 + updatedEnergy * 0.26

        const wobble =
          Math.sin(visualizerPhaseRef.current) * burstAmplitude +
          Math.sin(visualizerPhaseRef.current * 1.9) * burstAmplitude * 0.28 +
          (Math.random() - 0.5) * burstAmplitude * 0.16

        const springPull = (targetFrequency - currentFrequency) * (0.12 + progress * 0.14)
        const idlePull = activeFrequencies.length === 0 ? (165 - currentFrequency) * 0.06 : 0

        currentFrequency = clamp(
          currentFrequency + springPull + idlePull + wobble,
          VISUALIZER_MIN_FREQUENCY,
          VISUALIZER_MAX_FREQUENCY
        )

        generatedSamples.push({
          label: `${sampleIndexRef.current + bridgeCount + index}`,
          frequency: currentFrequency
        })
      }

      sampleIndexRef.current += sampleCount
      lastFrequencyRef.current = currentFrequency

      setVisualizerData((previous) => {
        const next = [...previous, ...generatedSamples]
        return next.length <= MAX_VISUALIZER_POINTS ? next : next.slice(next.length - MAX_VISUALIZER_POINTS)
      })
    },
    []
  )

  const triggerBeat = useCallback(
    (beatIndex: number) => {
      const beatDurationMs = 60000 / bpm
      const notesForBeat = notesRef.current.filter((note) => note.startBeat === beatIndex)
      setActivePitches(notesForBeat.map((note) => note.pitch))
      notesForBeat.forEach((note) => {
        void playPitch(note.pitch, beatDurationMs * note.durationBeats)
      })
      appendVisualizerSample(notesForBeat)
    },
    [appendVisualizerSample, bpm, playPitch]
  )

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimerRef.current !== null) {
        window.clearInterval(playbackTimerRef.current)
        playbackTimerRef.current = null
      }
      setActivePitches([])
      return
    }

    const beatIntervalMs = Math.max(24, Math.round(60000 / bpm))
    triggerBeat(currentBeat)

    const timerId = window.setInterval(() => {
      setCurrentBeat((previous) => {
        const nextBeat = (previous + 1) % loopBeats
        triggerBeat(nextBeat)
        return nextBeat
      })
    }, beatIntervalMs)

    playbackTimerRef.current = timerId
    return () => {
      window.clearInterval(timerId)
      if (playbackTimerRef.current === timerId) {
        playbackTimerRef.current = null
      }
    }
  }, [bpm, currentBeat, isPlaying, loopBeats, triggerBeat])

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (playbackTimerRef.current !== null) {
        window.clearInterval(playbackTimerRef.current)
      }
      const context = audioContextRef.current
      if (context) {
        void context.close()
      }
      audioContextRef.current = null
      masterGainRef.current = null
    },
    []
  )

  return {
    // State
    bpm,
    loopBeats,
    isPlaying,
    currentBeat,
    notes,
    activePitches,
    dragState,
    sequencerViewportWidth,
    panBeat,
    visualizerData,
    // Computed
    sequencerChartHostRef,
    sequencerPlotWidth,
    sequencerSurfaceWidth,
    sequencerPlotHeight,
    beatWidth,
    visibleBeatCount,
    maxPanBeat,
    pitchRowHeight,
    beatGridPoints,
    // Handlers
    handleLoopBeatsChange,
    handlePanBeatChange,
    handleBpmChange,
    setIsPlaying,
    setCurrentBeat,
    setNotes,
    setDragState,
    setActivePitches,
    // Callbacks
    ensureAudioGraph,
    triggerBeat,
    appendVisualizerSample,
    // Refs
    notesRef,
    suppressGridClickRef,
    dragMovedRef
  }
}
