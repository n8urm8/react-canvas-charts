import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ChartCustomTagsLayer, ChartGridLayer, ChartSurface, createChartCustomTag, type ChartCustomTag } from 'react-canvas-charts'
import './BeatChartsPage.css'
import { BeatTransportHeader } from './BeatCharts/components/BeatTransportHeader'
import { BeatFrequencyVisualizer } from './BeatCharts/components/BeatFrequencyVisualizer'
import { BeatSequencerChart } from './BeatCharts/components/BeatSequencerChart'
import { formatBeatNoteLabel } from './BeatCharts/utils/noteLabel'
import { useSound } from '../utils/soundUtils'

const TOTAL_BEATS = 16
const BEAT_GRID_POINTS = TOTAL_BEATS + 1
const MAX_VISUALIZER_POINTS = 88
const ROOT_LAYOUT_SCALE_ID = 'layout-scale'
const SEQUENCER_CHART_HEIGHT = 320
const SEQUENCER_MARGIN = {
  top: 16,
  right: 24,
  bottom: 40,
  left: 88
}

const PITCHES = [
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

type PitchId = (typeof PITCHES)[number]['id']

type SequencerNote = {
  id: string
  pitch: PitchId
  startBeat: number
  durationBeats: number
}

type VisualizerPoint = {
  label: string
  frequency: number
}

type DragState =
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

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const createNoteId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `beat-note-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const initialNotes: SequencerNote[] = [
  { id: createNoteId(), pitch: 'A', startBeat: 0, durationBeats: 2 },
  { id: createNoteId(), pitch: 'C#', startBeat: 4, durationBeats: 2 },
  { id: createNoteId(), pitch: 'E', startBeat: 8, durationBeats: 3 },
  { id: createNoteId(), pitch: 'G', startBeat: 12, durationBeats: 2 }
]

export const BeatChartsPage: React.FC = () => {
  const displayPitches = useMemo(() => [...PITCHES].reverse(), [])
  const maxPitchRowIndex = displayPitches.length - 1

  const rowIndexToChartY = useCallback(
    (rowIndex: number) => {
      return maxPitchRowIndex - rowIndex
    },
    [maxPitchRowIndex]
  )

  const chartYToRowIndex = useCallback(
    (chartY: number) => {
      return clamp(maxPitchRowIndex - Math.round(chartY), 0, maxPitchRowIndex)
    },
    [maxPitchRowIndex]
  )

  const pitchDisplayRow = useMemo(() => {
    const map: Record<string, number> = {}
    displayPitches.forEach((pitch, index) => {
      map[pitch.id] = index
    })
    return map
  }, [displayPitches])

  const [bpm, setBpm] = useState(120)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [notes, setNotes] = useState<SequencerNote[]>(initialNotes)
  const [activePitches, setActivePitches] = useState<PitchId[]>([])
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [sequencerChartWidth, setSequencerChartWidth] = useState(760)
  const [visualizerData, setVisualizerData] = useState<VisualizerPoint[]>(() =>
    Array.from({ length: 48 }, (_, index) => ({
      label: `${index}`,
      frequency: 220
    }))
  )

  const notesRef = useRef<SequencerNote[]>(initialNotes)
  const sequencerChartHostRef = useRef<HTMLDivElement | null>(null)
  const playbackTimerRef = useRef<number | null>(null)
  const sampleIndexRef = useRef(48)
  const lastFrequencyRef = useRef(220)
  const suppressGridClickRef = useRef(false)
  const dragMovedRef = useRef(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  useEffect(() => {
    const host = sequencerChartHostRef.current
    if (!host) {
      return undefined
    }

    const updateWidth = () => {
      const { width } = host.getBoundingClientRect()
      if (width > 0) {
        setSequencerChartWidth(width)
      }
    }

    updateWidth()

    const observer = new ResizeObserver(() => {
      updateWidth()
    })
    observer.observe(host)

    return () => {
      observer.disconnect()
    }
  }, [])

  const sequencerPlotWidth = useMemo(
    () => Math.max(140, sequencerChartWidth - SEQUENCER_MARGIN.left - SEQUENCER_MARGIN.right),
    [sequencerChartWidth]
  )

  const sequencerPlotHeight = useMemo(
    () => Math.max(120, SEQUENCER_CHART_HEIGHT - SEQUENCER_MARGIN.top - SEQUENCER_MARGIN.bottom),
    []
  )

  const beatWidth = useMemo(
    () => (BEAT_GRID_POINTS > 1 ? (sequencerPlotWidth / (BEAT_GRID_POINTS - 1)) * 2 : sequencerPlotWidth),
    [sequencerPlotWidth]
  )

  const pitchRowHeight = useMemo(
    () => (displayPitches.length > 1 ? sequencerPlotHeight / (displayPitches.length - 1) : sequencerPlotHeight),
    [displayPitches.length, sequencerPlotHeight]
  )

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
        const frequency = PITCHES.find((pitch) => pitch.id === note.pitch)?.frequency
        return frequency === undefined ? [] : [frequency]
      })

      const nextFrequency =
        activeFrequencies.length > 0
          ? activeFrequencies.reduce((sum, frequency) => sum + frequency, 0) / activeFrequencies.length
          : lastFrequencyRef.current

      lastFrequencyRef.current = nextFrequency

      setVisualizerData((previous) => {
        const next = [
          ...previous,
          {
            label: `${sampleIndexRef.current}`,
            frequency: nextFrequency
          }
        ]

        sampleIndexRef.current += 1
        if (next.length <= MAX_VISUALIZER_POINTS) {
          return next
        }

        return next.slice(next.length - MAX_VISUALIZER_POINTS)
      })
    },
    []
  )

  const { playPitch } = useSound();

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

  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimerRef.current !== null) {
        window.clearInterval(playbackTimerRef.current)
        playbackTimerRef.current = null
      }

      setActivePitches([])
      return undefined
    }

    const beatIntervalMs = Math.max(24, Math.round(60000 / bpm))
    triggerBeat(currentBeat)

    const timerId = window.setInterval(() => {
      setCurrentBeat((previous) => {
        const nextBeat = (previous + 1) % TOTAL_BEATS
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
  }, [bpm, currentBeat, isPlaying, triggerBeat])

  useEffect(
    () => () => {
      if (playbackTimerRef.current !== null) {
        window.clearInterval(playbackTimerRef.current)
        playbackTimerRef.current = null
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

  useEffect(() => {
    if (!dragState) {
      return undefined
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (dragState.mode === 'move') {
        const hostRect = sequencerChartHostRef.current?.getBoundingClientRect()

        let nextBeat = dragState.originalStartBeat
        let nextRow = dragState.originalPitchRow

        if (hostRect) {
          const plotLeft = hostRect.left + SEQUENCER_MARGIN.left
          const plotTop = hostRect.top + SEQUENCER_MARGIN.top

          // Convert both drag start and current mouse position to chart coordinates
          const startChartX = (dragState.startClientX - plotLeft) / beatWidth
          const startChartY = (dragState.startClientY - plotTop) / pitchRowHeight
          const currentChartX = (event.clientX - plotLeft) / beatWidth
          const currentChartY = (event.clientY - plotTop) / pitchRowHeight

          // Calculate delta in chart units and apply to original position
          const deltaBeats = currentChartX - startChartX
          const deltaRows = currentChartY - startChartY

          nextBeat = Math.round(dragState.originalStartBeat + deltaBeats)
          nextRow = Math.round(dragState.originalPitchRow + deltaRows)
        } else {
          const deltaBeats = Math.round((event.clientX - dragState.startClientX) / beatWidth)
          const deltaRows = Math.round((event.clientY - dragState.startClientY) / pitchRowHeight)
          nextBeat = dragState.originalStartBeat + deltaBeats
          nextRow = dragState.originalPitchRow + deltaRows
        }

        if (nextBeat !== dragState.originalStartBeat || nextRow !== dragState.originalPitchRow) {
          dragMovedRef.current = true
        }

        setNotes((previous) =>
          previous.map((note) => {
            if (note.id !== dragState.noteId) {
              return note
            }

            const clampedRow = clamp(nextRow, 0, displayPitches.length - 1)
            const nextPitch = displayPitches[clampedRow]?.id ?? note.pitch
            const maxStart = TOTAL_BEATS - note.durationBeats

            return {
              ...note,
              pitch: nextPitch,
              startBeat: clamp(nextBeat, 0, Math.max(0, maxStart))
            }
          })
        )
      }

      if (dragState.mode === 'resize') {
        const deltaBeats = Math.round((event.clientX - dragState.startClientX) / beatWidth)
        if (deltaBeats !== 0) {
          dragMovedRef.current = true
        }

        setNotes((previous) =>
          previous.map((note) => {
            if (note.id !== dragState.noteId) {
              return note
            }

            const maxDuration = TOTAL_BEATS - dragState.originalStartBeat
            return {
              ...note,
              durationBeats: clamp(dragState.originalDuration + deltaBeats, 1, Math.max(1, maxDuration))
            }
          })
        )
      }
    }

    const handlePointerUp = () => {
      if (dragMovedRef.current) {
        suppressGridClickRef.current = true
      }
      dragMovedRef.current = false
      setDragState(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [beatWidth, displayPitches, dragState, pitchRowHeight])

  const handleSequencerTagPlacement = useCallback(
    (dataIndex: number, yValue: number) => {
      if (suppressGridClickRef.current) {
        suppressGridClickRef.current = false
        return
      }

      const beatIndex = clamp(dataIndex, 0, TOTAL_BEATS - 1)
      const rowIndex = chartYToRowIndex(yValue)
      const pitch = displayPitches[rowIndex]?.id ?? displayPitches[0].id

      setNotes((previous) => {
        const overlapping = previous.find(
          (note) => note.pitch === pitch && beatIndex >= note.startBeat && beatIndex < note.startBeat + note.durationBeats
        )

        if (overlapping) {
          return previous.filter((note) => note.id !== overlapping.id)
        }

        return [
          ...previous,
          {
            id: createNoteId(),
            pitch,
            startBeat: beatIndex,
            durationBeats: 1
          }
        ]
      })
    },
    [chartYToRowIndex, displayPitches]
  )

  const removeNote = useCallback((noteId: string) => {
    setNotes((previous) => previous.filter((note) => note.id !== noteId))
  }, [])

  const startNoteDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>, note: SequencerNote, mode: 'move' | 'resize') => {
      event.preventDefault()
      event.stopPropagation()

      dragMovedRef.current = false

      if (mode === 'move') {
        setDragState({
          mode,
          noteId: note.id,
          startClientX: event.clientX,
          startClientY: event.clientY,
          originalStartBeat: note.startBeat,
          originalPitchRow: pitchDisplayRow[note.pitch] ?? 0
        })
      } else {
        setDragState({
          mode,
          noteId: note.id,
          startClientX: event.clientX,
          originalDuration: note.durationBeats,
          originalStartBeat: note.startBeat
        })
      }
    },
    [pitchDisplayRow]
  )

  const visualizerChartRecords = useMemo(
    () =>
      visualizerData.map((point) => ({
        label: point.label,
        frequency: point.frequency
      })),
    [visualizerData]
  )

  const visualizerMarkerTags = useMemo<ChartCustomTag[]>(() => {
    const markerIndex = Math.max(0, visualizerData.length - 1)

    return activePitches.map((pitch, index) => {
      const pitchConfig = PITCHES.find((item) => item.id === pitch)
      const pitchLabel = pitchConfig?.display ?? pitch
      const pitchFrequency = pitchConfig?.frequency ?? 220

      return createChartCustomTag(
        <div className="beat-marker-pill">
          <span className="beat-marker-dot" />
          <span>{pitchLabel}</span>
          <span>{`${pitchFrequency.toFixed(1)} Hz`}</span>
        </div>,
        markerIndex,
        pitchFrequency,
        {
          dataKey: 'frequency',
          offsetY: -18 - (index % 2) * 20
        }
      )
    })
  }, [activePitches, visualizerData])

  const layoutData = useMemo(
    () =>
      Array.from({ length: 64 }, (_, index) => ({
        label: `${index + 1}`,
        layout: index % 2 === 0 ? 0 : 100
      })),
    []
  )

  const beatDurationMs = 60000 / bpm
  const noteVerticalPadding = Math.max(2, Math.round(pitchRowHeight * 0.12))
  const noteHeight = Math.max(14, pitchRowHeight - noteVerticalPadding * 2)

  const sequencerChartData = useMemo(
    () =>
      Array.from({ length: BEAT_GRID_POINTS }, (_, index) => ({
        label: `${index}`,
        seqPitch: 0
      })),
    []
  )

  const sequencerNoteTags = useMemo<ChartCustomTag[]>(() => {
    const playheadRow = Math.floor(maxPitchRowIndex / 2)

    const playheadTag = createChartCustomTag(
      <div className="beat-sequencer-playhead-line" style={{ height: `${sequencerPlotHeight}px` }} />,
      currentBeat,
      rowIndexToChartY(playheadRow),
      {
        id: 'sequencer-playhead',
        dataKey: 'seqPitch',
      }
    )

    const noteTags = notes.map((note) => {
      const pitch = PITCHES.find((item) => item.id === note.pitch) ?? PITCHES[0]

      return createChartCustomTag(
        <div
          className={`beat-note beat-note--chart ${activePitches.includes(note.pitch) ? 'beat-note--active' : ''}`}
          style={{
            width: `${note.durationBeats * beatWidth}px`,
            height: `${noteHeight}px`,
          }}
          onPointerDown={(event) => startNoteDrag(event, note, 'move')}
          onDoubleClick={() => removeNote(note.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' || event.key === 'Delete') {
              event.preventDefault()
              removeNote(note.id)
            }
          }}
        >
          <span>{formatBeatNoteLabel(pitch.display, note.durationBeats)}</span>
          <span
            className="beat-note-resize-handle"
            onPointerDown={(event) => startNoteDrag(event, note, 'resize')}
            aria-hidden="true"
          />
        </div>,
        note.startBeat,
        rowIndexToChartY(pitchDisplayRow[note.pitch] ?? 0),
        {
          id: `sequencer-note-${note.id}`,
          dataKey: 'seqPitch',
          offsetX: 0,
          offsetY: noteVerticalPadding,
          style: {
            transform: 'translate(0, -50%)'
          }
        }
      )
    })

    return [playheadTag, ...noteTags]
  }, [
    activePitches,
    beatWidth,
    currentBeat,
    maxPitchRowIndex,
    notes,
    pitchDisplayRow,
    rowIndexToChartY,
    sequencerPlotHeight,
    noteHeight,
    noteVerticalPadding,
    removeNote,
    startNoteDrag,
  ])

  const panelTags = useMemo<ChartCustomTag[]>(() => {
    const centerIndex = Math.floor(layoutData.length / 2)

    return [
      createChartCustomTag(
        <div className="beat-overlay-stack" role="region" aria-label="Beat visualizer and pitch sequencer">
          <div className="beat-overlay-panel beat-overlay-panel--visualizer">
            <BeatTransportHeader
              bpm={bpm}
              isPlaying={isPlaying}
              currentStep={currentBeat}
              stepDurationMs={beatDurationMs}
              onTogglePlay={() => {
                if (!isPlaying) {
                  void ensureAudioGraph()
                }
                setIsPlaying((previous) => !previous)
              }}
              onBpmChange={(nextBpm) => setBpm(clamp(nextBpm || 60, 60, 190))}
            />
            <BeatFrequencyVisualizer data={visualizerChartRecords} markerTags={visualizerMarkerTags} />
          </div>
          <section className="beat-overlay-panel beat-overlay-panel--sequencer" aria-label="Pitch sequencer">
            <div className="beat-sequencer-header">
              <h2>Pitch Grid</h2>
              <p>Click chart cells to add or remove notes. Drag blocks to move. Drag right edge to resize duration.</p>
            </div>
            <BeatSequencerChart
              hostRef={sequencerChartHostRef}
              data={sequencerChartData}
              noteTags={sequencerNoteTags}
              totalSteps={TOTAL_BEATS}
              pitchRowCount={displayPitches.length}
              chartHeight={SEQUENCER_CHART_HEIGHT}
              margin={SEQUENCER_MARGIN}
              formatPitchLabel={(value) => {
                const rowIndex = chartYToRowIndex(value)
                const pitch = displayPitches[rowIndex]
                return pitch ? `${pitch.display}` : ''
              }}
              onCreateNote={handleSequencerTagPlacement}
            />
          </section>
        </div>,
        centerIndex,
        55,
        {
          id: 'beat-overlay-stack',
          scaleId: ROOT_LAYOUT_SCALE_ID
        }
      )
    ]
  }, [
    bpm,
    currentBeat,
    ensureAudioGraph,
    handleSequencerTagPlacement,
    isPlaying,
    layoutData.length,
    beatDurationMs,
    visualizerChartRecords,
    visualizerMarkerTags,
    chartYToRowIndex,
    displayPitches,
    sequencerChartData,
    sequencerNoteTags
  ])

  return (
    <div className="beat-charts-page">
      <ChartSurface
        data={layoutData}
        xKey="label"
        yKeys={['layout']}
        valueScales={[
          {
            id: ROOT_LAYOUT_SCALE_ID,
            dataKeys: ['layout'],
            domain: {
              min: 0,
              max: 100
            }
          }
        ]}
        width="100%"
        height="100%"
        margin={{ top: 56, right: 36, bottom: 42, left: 46 }}
        backgroundColor="#010401"
        defaultColors={['#39ff14']}
      >
        <ChartGridLayer show showVertical color="rgba(57,255,20,0.12)" lineWidth={1} />
        <ChartCustomTagsLayer tags={panelTags} />
      </ChartSurface>
    </div>
  )
}
