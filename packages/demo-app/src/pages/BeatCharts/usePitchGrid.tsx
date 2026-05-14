import { useCallback, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createChartCustomTag, type ChartCustomTag } from 'react-canvas-charts'
import { SEQUENCER_MARGIN } from './constants'
import type { SequencerNote, DragState, PitchId } from './types'
import { clamp, createNoteId } from './utils'

type SequencerPlacement = {
  chartX: number
  chartY: number
}

type GridPlacement = {
  beatIndex: number
  rowIndex: number
}

interface UsePitchGridProps {
  notes: SequencerNote[]
  activePitches: PitchId[]
  displayPitches: Array<{ id: PitchId; display: string; frequency: number }>
  currentBeat: number
  loopBeats: number
  beatWidth: number
  pitchRowHeight: number
  sequencerPlotHeight: number
  dragState: DragState | null
  sequencerChartHostRef: React.RefObject<HTMLDivElement | null>
  suppressGridClickRef: React.MutableRefObject<boolean>
  dragMovedRef: React.MutableRefObject<boolean>
  pitchDisplayRow: Record<string, number>
  maxPitchRowIndex: number
  onSetNotes: React.Dispatch<React.SetStateAction<SequencerNote[]>>
  onSetDragState: (state: DragState | null) => void
}

interface UsePitchGridReturn {
  chartYToRowIndex: (chartY: number) => number
  rowIndexToChartY: (rowIndex: number) => number
  handleDragPointer: (event: PointerEvent) => void
  handleDragEnd: () => void
  handleSequencerHoverPlacement: (placement: SequencerPlacement | null) => void
  handleSequencerTagPlacement: (placement: SequencerPlacement) => void
  removeNote: (noteId: string) => void
  startNoteDrag: (event: ReactPointerEvent<HTMLElement>, note: SequencerNote, mode: 'move' | 'resize') => void
  sequencerNoteTags: ChartCustomTag[]
  noteHeight: number
  noteVerticalPadding: number
}

export const usePitchGrid = ({
  notes,
  activePitches,
  displayPitches,
  currentBeat,
  loopBeats,
  beatWidth,
  pitchRowHeight,
  sequencerPlotHeight,
  dragState,
  sequencerChartHostRef,
  suppressGridClickRef,
  dragMovedRef,
  pitchDisplayRow,
  maxPitchRowIndex,
  onSetNotes,
  onSetDragState
}: UsePitchGridProps): UsePitchGridReturn => {
  const [previewPlacement, setPreviewPlacement] = useState<GridPlacement | null>(null)

  const rowIndexToChartY = useCallback(
    (rowIndex: number) => maxPitchRowIndex - rowIndex,
    [maxPitchRowIndex]
  )

  const chartYToRowIndex = useCallback(
    (chartY: number) => clamp(maxPitchRowIndex - Math.round(chartY), 0, maxPitchRowIndex),
    [maxPitchRowIndex]
  )

  const handleDragPointer = useCallback(
    (event: PointerEvent) => {
      if (!dragState) return

      if (dragState.mode === 'move') {
        const hostRect = sequencerChartHostRef.current?.getBoundingClientRect()
        let nextBeat = dragState.originalStartBeat
        let nextRow = dragState.originalPitchRow

        if (hostRect) {
          const scrollOffset = sequencerChartHostRef.current?.scrollLeft ?? 0
          const plotLeft = hostRect.left + SEQUENCER_MARGIN.left
          const plotTop = hostRect.top + SEQUENCER_MARGIN.top

          const startChartX = (dragState.startClientX - plotLeft + scrollOffset) / beatWidth
          const startChartY = (dragState.startClientY - plotTop) / pitchRowHeight
          const currentChartX = (event.clientX - plotLeft + scrollOffset) / beatWidth
          const currentChartY = (event.clientY - plotTop) / pitchRowHeight

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

        onSetNotes(
          notes.map((note) => {
            if (note.id !== dragState.noteId) return note
            const clampedRow = clamp(nextRow, 0, displayPitches.length - 1)
            const nextPitch = displayPitches[clampedRow]?.id ?? note.pitch
            const maxStart = loopBeats - note.durationBeats
            return {
              ...note,
              pitch: nextPitch,
              startBeat: clamp(nextBeat, 0, Math.max(0, maxStart))
            }
          })
        )
      } else if (dragState.mode === 'resize') {
        const deltaBeats = Math.round((event.clientX - dragState.startClientX) / beatWidth)
        if (deltaBeats !== 0) {
          dragMovedRef.current = true
        }

        onSetNotes(
          notes.map((note) => {
            if (note.id !== dragState.noteId) return note
            const maxDuration = loopBeats - dragState.originalStartBeat
            return {
              ...note,
              durationBeats: clamp(dragState.originalDuration + deltaBeats, 1, Math.max(1, maxDuration))
            }
          })
        )
      }
    },
    [dragState, sequencerChartHostRef, beatWidth, pitchRowHeight, displayPitches, loopBeats, notes, onSetNotes, dragMovedRef]
  )

  const handleDragEnd = useCallback(() => {
    if (dragMovedRef.current) {
      suppressGridClickRef.current = true
    }
    dragMovedRef.current = false
    onSetDragState(null)
  }, [suppressGridClickRef, dragMovedRef, onSetDragState])

  const getPlacementFromChartCoordinates = useCallback(
    ({ chartX, chartY }: SequencerPlacement): GridPlacement => {
      const beatIndex = clamp(Math.floor((chartX - SEQUENCER_MARGIN.left) / beatWidth), 0, loopBeats - 1)
      const rowIndex = clamp(
        Math.floor((chartY - SEQUENCER_MARGIN.top) / pitchRowHeight),
        0,
        maxPitchRowIndex
      )

      return { beatIndex, rowIndex }
    },
    [beatWidth, loopBeats, maxPitchRowIndex, pitchRowHeight]
  )

  const handleSequencerHoverPlacement = useCallback(
    (placement: SequencerPlacement | null) => {
      if (!placement) {
        setPreviewPlacement(null)
        return
      }

      const nextPlacement = getPlacementFromChartCoordinates(placement)
      setPreviewPlacement((previous) => {
        if (
          previous &&
          previous.beatIndex === nextPlacement.beatIndex &&
          previous.rowIndex === nextPlacement.rowIndex
        ) {
          return previous
        }
        return nextPlacement
      })
    },
    [getPlacementFromChartCoordinates]
  )

  const handleSequencerTagPlacement = useCallback(
    ({ chartX, chartY }: SequencerPlacement) => {
      if (suppressGridClickRef.current) {
        suppressGridClickRef.current = false
        return
      }

      const resolvedPlacement = previewPlacement ?? getPlacementFromChartCoordinates({ chartX, chartY })
      const { beatIndex, rowIndex } = resolvedPlacement
      const pitch = displayPitches[rowIndex]?.id ?? displayPitches[0].id

      onSetNotes((previous) => {
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
    [displayPitches, getPlacementFromChartCoordinates, onSetNotes, previewPlacement, suppressGridClickRef]
  )

  const removeNote = useCallback(
    (noteId: string) => {
      onSetNotes((previous) => previous.filter((note) => note.id !== noteId))
    },
    [onSetNotes]
  )

  const startNoteDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>, note: SequencerNote, mode: 'move' | 'resize') => {
      event.preventDefault()
      event.stopPropagation()
      dragMovedRef.current = false

      if (mode === 'move') {
        onSetDragState({
          mode,
          noteId: note.id,
          startClientX: event.clientX,
          startClientY: event.clientY,
          originalStartBeat: note.startBeat,
          originalPitchRow: pitchDisplayRow[note.pitch] ?? 0
        })
      } else {
        onSetDragState({
          mode,
          noteId: note.id,
          startClientX: event.clientX,
          originalDuration: note.durationBeats,
          originalStartBeat: note.startBeat
        })
      }
    },
    [pitchDisplayRow, dragMovedRef, onSetDragState]
  )

  const noteVerticalPadding = useMemo(() => Math.max(2, Math.round(pitchRowHeight * 0.12)), [pitchRowHeight])
  const noteHeight = useMemo(() => Math.max(14, pitchRowHeight - noteVerticalPadding * 2), [pitchRowHeight, noteVerticalPadding])

  const sequencerNoteTags = useMemo<ChartCustomTag[]>(() => {
    const playheadRow = Math.floor(maxPitchRowIndex / 2)

    const playheadTag = createChartCustomTag(
      <div className="beat-sequencer-playhead-line" style={{ height: `${sequencerPlotHeight}px` }} />,
      currentBeat,
      rowIndexToChartY(playheadRow),
      {
        id: 'sequencer-playhead',
        dataKey: 'seqPitch'
      }
    )

    const previewTag = previewPlacement
      ? createChartCustomTag(
          <div
            className="beat-note beat-note--chart beat-note--preview"
            style={{
              width: `${beatWidth}px`,
              height: `${noteHeight}px`
            }}
          >
            <span>{displayPitches[previewPlacement.rowIndex]?.id ?? ''}</span>
          </div>,
          previewPlacement.beatIndex,
          rowIndexToChartY(previewPlacement.rowIndex),
          {
            id: 'sequencer-note-preview',
            dataKey: 'seqPitch',
            offsetX: 0,
            offsetY: noteVerticalPadding,
            style: {
              transform: 'translate(0, -50%)',
              pointerEvents: 'none'
            }
          }
        )
      : null

    const noteTags = notes.map((note) => {
      return createChartCustomTag(
        <div
          className={`beat-note beat-note--chart ${activePitches.includes(note.pitch) ? 'beat-note--active' : ''}`}
          style={{
            width: `${note.durationBeats * beatWidth}px`,
            height: `${noteHeight}px`
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
          <span>{note.pitch}</span>
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

    return previewTag ? [playheadTag, previewTag, ...noteTags] : [playheadTag, ...noteTags]
  }, [
    maxPitchRowIndex,
    currentBeat,
    previewPlacement,
    sequencerPlotHeight,
    rowIndexToChartY,
    notes,
    activePitches,
    beatWidth,
    displayPitches,
    noteHeight,
    startNoteDrag,
    removeNote,
    pitchDisplayRow,
    noteVerticalPadding
  ])

  return {
    chartYToRowIndex,
    rowIndexToChartY,
    handleDragPointer,
    handleDragEnd,
    handleSequencerHoverPlacement,
    handleSequencerTagPlacement,
    removeNote,
    startNoteDrag,
    sequencerNoteTags,
    noteHeight,
    noteVerticalPadding
  }
}
