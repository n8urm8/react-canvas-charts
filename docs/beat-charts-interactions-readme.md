# Beat Charts Interactions: Technical Notes and Reusable Examples

This document explains how Beat Charts is built and includes cleaned-up code examples you can reuse in blog posts.

## Overview

Beat Charts uses chart primitives as an interaction surface:

1. Chart layout and rendering are handled by `ChartSurface` and standard chart layers.
2. Sequencer note interactions are implemented with `ChartCustomTagsLayer` and custom pointer logic.
3. Playback state, transport timing, and visualizer updates are coordinated in sequencer hooks.

Main implementation files:

- `packages/demo-app/src/pages/BeatChartsPage.tsx`
- `packages/demo-app/src/pages/BeatCharts/useBeatSequencer.ts`
- `packages/demo-app/src/pages/BeatCharts/usePitchGrid.tsx`
- `packages/demo-app/src/pages/BeatCharts/components/BeatSequencerChart.tsx`
- `packages/demo-app/src/pages/BeatCharts/components/BeatFrequencyVisualizer.tsx`

Library internals that make this work:

- `packages/chart-components/src/components/Chart/ChartSurface/ChartSurface.tsx`
- `packages/chart-components/src/components/Chart/ChartCustomTagsLayer.tsx`

---

## 1) Treat the chart as a coordinate system, not just a visual

Beat Charts maps musical concepts directly to chart axes:

- X axis: beat index (time)
- Y axis: pitch row

Cleaned-up example (sequencer chart shell):

    <ChartSurface
      data={data}
      xKey="label"
      yKeys={["seqPitch"]}
      valueScales={[
        {
          id: "sequencer-pitch-scale",
          dataKeys: ["seqPitch"],
          domain: { min: 0, max: pitchRowCount - 1 }
        }
      ]}
      width={surfaceWidth}
      height={chartHeight}
      margin={margin}
      backgroundColor="#030b06"
      defaultColors={["#39ff14"]}
    >
      <ChartGridLayer show showVertical color="rgba(57,255,20,0.12)" lineWidth={1} />
      <ChartXAxis show title="Time (Beats)" showTitle maxTicks={totalSteps + 1} />
      <ChartYAxis
        show
        title="Pitch"
        showTitle
        scaleId="sequencer-pitch-scale"
        tickCount={pitchRowCount - 1}
        formatLabel={formatPitchLabel}
      />
    </ChartSurface>

Why it matters:

- Interaction math can be expressed in chart units first, then mapped back to domain values.
- Grid and axes become semantic controls, not decoration.

---

## 2) Isolate interaction math in a dedicated hook

Beat Charts keeps pointer math in `usePitchGrid`, separate from rendering.

Cleaned-up example (drag move math):

    const handleDragPointer = useCallback((event: PointerEvent) => {
      if (!dragState || dragState.mode !== "move") return

      const hostRect = sequencerChartHostRef.current?.getBoundingClientRect()
      if (!hostRect) return

      const scrollOffset = sequencerChartHostRef.current?.scrollLeft ?? 0
      const plotLeft = hostRect.left + SEQUENCER_MARGIN.left
      const plotTop = hostRect.top + SEQUENCER_MARGIN.top

      const startChartX = (dragState.startClientX - plotLeft + scrollOffset) / beatWidth
      const startChartY = (dragState.startClientY - plotTop) / pitchRowHeight
      const currentChartX = (event.clientX - plotLeft + scrollOffset) / beatWidth
      const currentChartY = (event.clientY - plotTop) / pitchRowHeight

      const deltaBeats = currentChartX - startChartX
      const deltaRows = currentChartY - startChartY

      const nextBeat = Math.round(dragState.originalStartBeat + deltaBeats)
      const nextRow = Math.round(dragState.originalPitchRow + deltaRows)

      // Clamp and commit note updates.
      updateMovedNote(nextBeat, nextRow)
    }, [dragState, beatWidth, pitchRowHeight, sequencerChartHostRef])

Why it matters:

- You can evolve interaction behavior without rewriting chart markup.
- The same state model supports click-to-place, drag-to-move, and drag-to-resize.

---

## 3) Use tag overlays for editable note blocks

Instead of drawing notes directly in canvas pixels, Beat Charts uses `ChartCustomTagsLayer` and places DOM note blocks in chart coordinates.

Cleaned-up example (interactive note overlay):

    <ChartCustomTagsLayer
      tags={noteTags}
      enableTagCreation
      creationDataKey="seqPitch"
      createTag={(placement) => {
        onCreateNote({ chartX: placement.chartX, chartY: placement.chartY })
        return null
      }}
    />

Cleaned-up example (note tag creation in hook):

    return createChartCustomTag(
      <div
        className="beat-note beat-note--chart"
        style={{ width: `${note.durationBeats * beatWidth}px`, height: `${noteHeight}px` }}
        onPointerDown={(event) => startNoteDrag(event, note, "move")}
      >
        <span>{note.pitch}</span>
        <span
          className="beat-note-resize-handle"
          onPointerDown={(event) => startNoteDrag(event, note, "resize")}
          aria-hidden="true"
        />
      </div>,
      note.startBeat,
      rowIndexToChartY(pitchDisplayRow[note.pitch] ?? 0),
      {
        id: `sequencer-note-${note.id}`,
        dataKey: "seqPitch",
        offsetY: noteVerticalPadding,
        style: { transform: "translate(0, -50%)" }
      }
    )

Why it matters:

- Canvas stays fast for chart rendering.
- DOM stays ergonomic for interaction and accessibility.

---

## 4) Drive transport and visualizer from shared timeline state

Playback timing drives both audio and visual feedback from one source of truth.

Cleaned-up example (transport loop):

    useEffect(() => {
      if (!isPlaying) {
        clearPlaybackTimer()
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
      return () => window.clearInterval(timerId)
    }, [isPlaying, bpm, currentBeat, loopBeats, triggerBeat])

Cleaned-up example (visualizer sample generation):

    const appendVisualizerSample = useCallback((notesForStep: SequencerNote[]) => {
      const activeFrequencies = notesForStep
        .map((note) => getPitchFrequency(note.pitch))
        .filter((frequency): frequency is number => frequency !== undefined)

      const targetFrequency = activeFrequencies.length
        ? activeFrequencies.reduce((sum, f) => sum + f, 0) / activeFrequencies.length
        : 170

      setVisualizerData((previous) => {
        const next = [...previous, { label: String(sampleIndexRef.current++), frequency: targetFrequency }]
        return next.slice(-MAX_VISUALIZER_POINTS)
      })
    }, [])

Why it matters:

- Audio and visuals remain phase-aligned.
- The interface looks reactive to interaction, not loosely coupled.

---

## 5) Keep interactions stable with clamping and scroll sync

Beat Charts constrains values and synchronizes pan state with DOM scrolling.

Cleaned-up example (pan and viewport constraints):

    const visibleBeatCount = useMemo(
      () => Math.max(1, Math.floor((sequencerViewportWidth - SEQUENCER_MARGIN.left - SEQUENCER_MARGIN.right) / beatWidth)),
      [sequencerViewportWidth, beatWidth]
    )

    const maxPanBeat = useMemo(() => Math.max(0, loopBeats - visibleBeatCount), [loopBeats, visibleBeatCount])

    useEffect(() => {
      setPanBeat((previous) => clamp(previous, 0, maxPanBeat))
    }, [maxPanBeat])

    useEffect(() => {
      const host = sequencerChartHostRef.current
      if (!host) return

      isSyncingPanRef.current = true
      host.scrollLeft = panBeat * beatWidth
      window.setTimeout(() => {
        isSyncingPanRef.current = false
      }, 0)
    }, [panBeat, beatWidth])

Why it matters:

- Prevents panning beyond content bounds.
- Keeps slider state and chart scroll position in lockstep.

---

## End-to-end interaction trace (for article narrative)

1. User moves pointer over sequencer.
2. Sequencer converts pointer to chart coordinates.
3. Grid hook snaps chart coordinates to beat/pitch cell.
4. Preview tag renders a ghost note.
5. User clicks to create, or drags existing tag to move/resize.
6. Notes state updates.
7. Playback loop reads note state and triggers sound.
8. Visualizer data updates from active pitches and re-renders.

This pattern is reusable for many chart-native interactions: trading ladders, timeline editors, scheduling boards, and annotation-first analytics tools.

---

## 6) General annotations (drawing and text, not custom tags)

If you want classic chart annotations (text labels, lines, circles, freehand strokes), use `ChartAnnotationsLayer`.
Unlike `ChartCustomTagsLayer`, these annotations are rendered as drawing overlays and edited through the annotations API.

Core types are defined as:

- `text`
- `line`
- `circle`
- `freehand`

### 6.1 Minimal setup

Cleaned-up example:

    import { useState } from "react"
    import {
      ChartSurface,
      ChartLineSeries,
      ChartAnnotationsLayer,
      type ChartAnnotation,
      type AnnotationType
    } from "react-canvas-charts"

    export function AnnotatedChart({ data }: { data: Array<{ label: string; value: number }> }) {
      const [annotations, setAnnotations] = useState<ChartAnnotation[]>([])
      const [creatingType, setCreatingType] = useState<AnnotationType | undefined>()

      return (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button onClick={() => setCreatingType("text")}>Text</button>
            <button onClick={() => setCreatingType("line")}>Line</button>
            <button onClick={() => setCreatingType("circle")}>Circle</button>
            <button onClick={() => setCreatingType("freehand")}>Freehand</button>
            <button onClick={() => setCreatingType(undefined)}>Select</button>
          </div>

          <ChartSurface data={data} xKey="label" yKeys={["value"]} width="100%" height={360}>
            <ChartLineSeries dataKey="value" />
            <ChartAnnotationsLayer
              annotations={annotations}
              onAnnotationsChange={setAnnotations}
              creatingType={creatingType}
              enableCreation
              onAnnotationComplete={() => setCreatingType(undefined)}
            />
          </ChartSurface>
        </>
      )
    }

Why it matters:

- Annotation state is controlled in React.
- Creation mode can be toggled by your own toolbar.

### 6.2 Text annotation example

Cleaned-up example:

    const peakLabel: ChartAnnotation = {
      id: "text-peak",
      type: "text",
      position: { x: 12, y: 420, dataSpace: true },
      text: "Peak demand",
      fontSize: 14,
      fontWeight: "bold",
      color: "#111827",
      backgroundColor: "#fef3c7",
      padding: 8
    }

    setAnnotations((prev) => [...prev, peakLabel])

Use this when you need narrative callouts attached to data values.

### 6.3 Trend/threshold line annotation example

Cleaned-up example:

    const thresholdLine: ChartAnnotation = {
      id: "line-threshold",
      type: "line",
      start: { x: 0, y: 300, dataSpace: true },
      end: { x: 23, y: 300, dataSpace: true },
      color: "#ef4444",
      strokeWidth: 2,
      dash: [6, 4],
      arrowEnd: false
    }

    setAnnotations((prev) => [...prev, thresholdLine])

Use this for limits, alerts, and support/resistance style overlays.

### 6.4 Circle region highlight example

Cleaned-up example:

    const anomalyRegion: ChartAnnotation = {
      id: "circle-anomaly",
      type: "circle",
      center: { x: 16, y: 510, dataSpace: true },
      radius: 36,
      color: "#2563eb",
      strokeWidth: 2,
      fillColor: "#60a5fa",
      fillOpacity: 0.2
    }

    setAnnotations((prev) => [...prev, anomalyRegion])

Use this for clusters, outliers, and area emphasis.

### 6.5 Freehand sketch example

Cleaned-up example:

    const sketch: ChartAnnotation = {
      id: "freehand-1",
      type: "freehand",
      color: "#059669",
      strokeWidth: 3,
      points: [
        { x: 8, y: 460, dataSpace: true },
        { x: 9, y: 470, dataSpace: true },
        { x: 10, y: 465, dataSpace: true },
        { x: 11, y: 480, dataSpace: true }
      ],
      closed: false,
      smoothing: 0.4
    }

    setAnnotations((prev) => [...prev, sketch])

Use this for analyst markups and exploratory sketching.

### 6.6 Creation and edit callbacks

Cleaned-up example:

    const handleAnnotationsChange = (next: ChartAnnotation[]) => {
      setAnnotations(next)
      saveDraft(next)
    }

    const handleAnnotationComplete = (annotation: ChartAnnotation) => {
      analytics.track("annotation_created", {
        type: annotation.type,
        id: annotation.id
      })
    }

    <ChartAnnotationsLayer
      annotations={annotations}
      onAnnotationsChange={handleAnnotationsChange}
      creatingType={creatingType}
      onAnnotationComplete={handleAnnotationComplete}
      enableCreation
    />

Use `onAnnotationsChange` as your persistence boundary.

### 6.7 Data-space vs pixel-space placement

Annotation coordinates can be either:

1. Data space: follows the chart data/scales as the domain changes.
2. Pixel space: fixed overlay position.

Cleaned-up example:

    // Data-aligned annotation (moves with zoom/domain updates)
    position: { x: 18, y: 420, dataSpace: true }

    // Screen-fixed annotation (e.g., static watermark corner note)
    position: { x: 24, y: 24, dataSpace: false }

Rule of thumb:

- Use `dataSpace: true` for analytical meaning.
- Use `dataSpace: false` for UI-style overlays.

### 6.8 Full combined example

Cleaned-up example:

    const [annotations, setAnnotations] = useState<ChartAnnotation[]>([
      {
        id: "text-1",
        type: "text",
        position: { x: 6, y: 240, dataSpace: true },
        text: "Earnings release",
        color: "#111827",
        backgroundColor: "#dcfce7",
        padding: 6
      },
      {
        id: "line-1",
        type: "line",
        start: { x: 0, y: 200, dataSpace: true },
        end: { x: 24, y: 200, dataSpace: true },
        color: "#f97316",
        strokeWidth: 2,
        dash: [4, 4]
      }
    ])

    <ChartSurface data={data} xKey="time" yKeys={["value"]} width="100%" height={380}>
      <ChartLineSeries dataKey="value" color="#0ea5e9" />
      <ChartAnnotationsLayer
        annotations={annotations}
        onAnnotationsChange={setAnnotations}
        creatingType={creatingType}
        enableCreation
      />
    </ChartSurface>

This gives you non-custom-tag annotations with built-in hit detection, selection, and editing workflows.
