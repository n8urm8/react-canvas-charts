import { useCallback, useEffect, useMemo } from 'react'
import { ChartCustomTagsLayer, ChartGridLayer, ChartSurface, createChartCustomTag, type ChartCustomTag } from 'react-canvas-charts'
import './BeatChartsPage.css'
import { BeatTransportHeader } from './BeatCharts/components/BeatTransportHeader'
import { BeatFrequencyVisualizer } from './BeatCharts/components/BeatFrequencyVisualizer'
import { BeatPresetControls } from './BeatCharts/components/BeatPresetControls.tsx'
import { BeatSequencerChart } from './BeatCharts/components/BeatSequencerChart'
import {
  DEFAULT_LOOP_BEATS,
  SEQUENCER_CHART_HEIGHT,
  SEQUENCER_MARGIN,
  ROOT_LAYOUT_SCALE_ID,
  PITCHES
} from './BeatCharts/constants'
import { useBeatSequencer } from './BeatCharts/useBeatSequencer'
import { usePitchGrid } from './BeatCharts/usePitchGrid'
import { createInitialNotes } from './BeatCharts/utils'

export const BeatChartsPage: React.FC = () => {
  const sequencer = useBeatSequencer()

  const handleClearAllNotes = useCallback(() => {
    sequencer.setIsPlaying(false)
    sequencer.setCurrentBeat(0)
    sequencer.setActivePitches([])
    sequencer.setNotes([])
  }, [sequencer])

  const handleRestoreDefaults = useCallback(() => {
    sequencer.setIsPlaying(false)
    sequencer.setCurrentBeat(0)
    sequencer.setActivePitches([])
    sequencer.handleBpmChange(240)
    sequencer.handleLoopBeatsChange(DEFAULT_LOOP_BEATS)
    sequencer.setNotes(createInitialNotes())

    window.setTimeout(() => {
      sequencer.handlePanBeatChange(0)
    }, 0)
  }, [sequencer])

  const handleApplyPreset = useCallback(
    (preset: { bpm: number; loopBeats: number; panBeat: number; notes: ReturnType<typeof createInitialNotes> }) => {
      sequencer.setIsPlaying(false)
      sequencer.setCurrentBeat(0)
      sequencer.setActivePitches([])
      sequencer.handleBpmChange(preset.bpm)
      sequencer.handleLoopBeatsChange(preset.loopBeats)
      sequencer.setNotes(preset.notes.map((note) => ({ ...note })))

      window.setTimeout(() => {
        sequencer.handlePanBeatChange(preset.panBeat)
      }, 0)
    },
    [sequencer]
  )

  // Pitch display configuration
  const displayPitches = useMemo(() => [...PITCHES].reverse(), [])
  const maxPitchRowIndex = displayPitches.length - 1

  const pitchDisplayRow = useMemo(() => {
    const map: Record<string, number> = {}
    displayPitches.forEach((pitch, index) => {
      map[pitch.id] = index
    })
    return map
  }, [displayPitches])

  // Pitch grid logic
  const pitchGrid = usePitchGrid({
    notes: sequencer.notes,
    activePitches: sequencer.activePitches,
    displayPitches,
    currentBeat: sequencer.currentBeat,
    loopBeats: sequencer.loopBeats,
    beatWidth: sequencer.beatWidth,
    pitchRowHeight: sequencer.pitchRowHeight,
    sequencerPlotHeight: sequencer.sequencerPlotHeight,
    dragState: sequencer.dragState,
    sequencerChartHostRef: sequencer.sequencerChartHostRef,
    suppressGridClickRef: sequencer.suppressGridClickRef,
    dragMovedRef: sequencer.dragMovedRef,
    pitchDisplayRow,
    maxPitchRowIndex,
    onSetNotes: sequencer.setNotes,
    onSetDragState: sequencer.setDragState
  })

  // Handle drag events globally
  useEffect(() => {
    if (!sequencer.dragState) return

    const handlePointerMove = (event: PointerEvent) => {
      pitchGrid.handleDragPointer(event)
    }

    const handlePointerUp = () => {
      pitchGrid.handleDragEnd()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [sequencer.dragState, pitchGrid])

  // Visualizer setup
  const visualizerChartRecords = useMemo(
    () => sequencer.visualizerData.map((point) => ({
      label: point.label,
      frequency: point.frequency
    })),
    [sequencer.visualizerData]
  )

  const visualizerPalette = useMemo(() => {
    if (sequencer.activePitches.length === 0) {
      return {
        lineColor: '#7cff5f',
        gridColor: 'rgba(57,255,20,0.16)'
      }
    }

    const activeFrequencies = sequencer.activePitches.flatMap((pitchId) => {
      const pitch = PITCHES.find((item) => item.id === pitchId)
      return pitch ? [pitch.frequency] : []
    })

    const avgFrequency =
      activeFrequencies.length > 0
        ? activeFrequencies.reduce((sum, frequency) => sum + frequency, 0) / activeFrequencies.length
        : 220

    const normalized = Math.max(0, Math.min(1, (avgFrequency - 55) / (420 - 55)))
    const hue = Math.round(120 + normalized * 220)

    return {
      lineColor: `hsl(${hue}, 100%, 64%)`,
      gridColor: `hsla(${hue}, 100%, 52%, 0.24)`
    }
  }, [sequencer.activePitches])

  const visualizerMarkerTags = useMemo<ChartCustomTag[]>(() => {
    const markerIndex = Math.max(0, sequencer.visualizerData.length - 1)

    return sequencer.activePitches.map((pitch, index) => {
      const pitchConfig = PITCHES.find((item) => item.id === pitch)
      const pitchFrequency = pitchConfig?.frequency ?? 220

      return createChartCustomTag(
        <div
          className="beat-marker-orb"
          style={{
            animationDelay: `${index * 90}ms`
          }}
          aria-label={`${pitch} active`}
          role="img"
        >
          <span className="beat-marker-orb__core" />
        </div>,
        markerIndex,
        pitchFrequency,
        {
          dataKey: 'frequency',
          offsetY: -18 - (index % 2) * 20
        }
      )
    })
  }, [sequencer.activePitches, sequencer.visualizerData])

  // Layout data for outer canvas
  const layoutData = useMemo(
    () =>
      Array.from({ length: 64 }, (_, index) => ({
        label: `${index + 1}`,
        layout: index % 2 === 0 ? 0 : 100
      })),
    []
  )

  const beatDurationMs = 60000 / sequencer.bpm
  const sequencerChartData = useMemo(
    () =>
      Array.from({ length: sequencer.beatGridPoints }, (_, index) => ({
        label: `${index}`,
        seqPitch: 0
      })),
    [sequencer.beatGridPoints]
  )

  // Main overlay panel
  const panelTags = useMemo<ChartCustomTag[]>(() => {
    const centerIndex = Math.floor(layoutData.length / 2)

    return [
      createChartCustomTag(
        <div className="beat-overlay-stack" role="region" aria-label="Beat visualizer and pitch sequencer">
          <div className="beat-visualizer-wrapper">
            <BeatFrequencyVisualizer
              data={visualizerChartRecords}
              markerTags={visualizerMarkerTags}
              lineColor={visualizerPalette.lineColor}
              gridColor={visualizerPalette.gridColor}
            />
          </div>
          <section className="beat-overlay-panel beat-overlay-panel--sequencer" aria-label="Pitch sequencer">
            <div className="beat-overlay-header">
              <div>
                <p className="beat-kicker">Neon Sequencer Lab</p>
                <h1 className="beat-title">Beat Charts</h1></div>
              <div className="beat-transport-panel">
                <BeatTransportHeader
                  bpm={sequencer.bpm}
                  isPlaying={sequencer.isPlaying}
                  currentStep={sequencer.currentBeat}
                  totalSteps={sequencer.loopBeats}
                  stepDurationMs={beatDurationMs}
                  onTogglePlay={() => {
                    if (!sequencer.isPlaying) {
                      void sequencer.ensureAudioGraph()
                    }
                    sequencer.setIsPlaying((previous) => !previous)
                  }}
                  onBpmChange={sequencer.handleBpmChange}
                />
              </div>
            </div>
            <div className="beat-sequencer-header">
              <h2>Pitch Grid</h2>
              <p>Click chart cells to add or remove notes. Drag blocks to move. Drag right edge to resize duration.</p>
              <div className="beat-sequencer-controls">
                <label className="beat-slider-group" htmlFor="beat-loop-length">
                  <span>Loop Beats</span>
                  <input
                    id="beat-loop-length"
                    type="range"
                    min={16}
                    max={256}
                    step={4}
                    value={sequencer.loopBeats}
                    onChange={(event) => sequencer.handleLoopBeatsChange(Number(event.target.value))}
                  />
                  <input
                    type="number"
                    min={16}
                    max={256}
                    step={4}
                    value={sequencer.loopBeats}
                    onChange={(event) => sequencer.handleLoopBeatsChange(Number(event.target.value))}
                  />
                </label>
                <label className="beat-slider-group" htmlFor="beat-pan-start">
                  <span>Pan Start Beat</span>
                  <input
                    id="beat-pan-start"
                    type="range"
                    min={0}
                    max={sequencer.maxPanBeat}
                    value={sequencer.panBeat}
                    onChange={(event) => sequencer.handlePanBeatChange(Number(event.target.value))}
                  />
                  <input
                    type="number"
                    min={0}
                    max={sequencer.maxPanBeat}
                    value={sequencer.panBeat}
                    onChange={(event) => sequencer.handlePanBeatChange(Number(event.target.value))}
                  />
                </label>

                <BeatPresetControls
                  notes={sequencer.notes}
                  bpm={sequencer.bpm}
                  loopBeats={sequencer.loopBeats}
                  panBeat={sequencer.panBeat}
                  onApplyPreset={handleApplyPreset}
                />

                <div className="beat-control-actions">
                  <button type="button" className="beat-button" onClick={handleClearAllNotes}>
                    Clear All
                  </button>
                  <button type="button" className="beat-button" onClick={handleRestoreDefaults}>
                    Restore Defaults
                  </button>
                </div>
              </div>
            </div>
            <BeatSequencerChart
              hostRef={sequencer.sequencerChartHostRef}
              data={sequencerChartData}
              noteTags={pitchGrid.sequencerNoteTags}
              totalSteps={sequencer.loopBeats}
              surfaceWidth={sequencer.sequencerSurfaceWidth}
              pitchRowCount={displayPitches.length}
              chartHeight={SEQUENCER_CHART_HEIGHT}
              margin={SEQUENCER_MARGIN}
              formatPitchLabel={(value) => {
                const rowIndex = pitchGrid.chartYToRowIndex(value)
                const pitch = displayPitches[rowIndex]
                return pitch ? `${pitch.display}` : ''
              }}
              onPreviewNotePlacement={pitchGrid.handleSequencerHoverPlacement}
              onCreateNote={pitchGrid.handleSequencerTagPlacement}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    layoutData.length,
    visualizerChartRecords,
    visualizerPalette.lineColor,
    visualizerPalette.gridColor,
    visualizerMarkerTags,
    sequencer.bpm,
    sequencer.isPlaying,
    sequencer.currentBeat,
    sequencer.loopBeats,
    sequencer.beatGridPoints,
    beatDurationMs,
    sequencer.handleBpmChange,
    sequencer.setIsPlaying,
    sequencer.ensureAudioGraph,
    sequencer.handleLoopBeatsChange,
    sequencer.handlePanBeatChange,
    sequencer.maxPanBeat,
    sequencer.panBeat,
    sequencer.sequencerChartHostRef,
    sequencerChartData,
    pitchGrid.sequencerNoteTags,
    handleApplyPreset,
    handleClearAllNotes,
    handleRestoreDefaults,
    sequencer.sequencerSurfaceWidth,
    displayPitches,
    pitchGrid.chartYToRowIndex,
    pitchGrid.handleSequencerTagPlacement
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
