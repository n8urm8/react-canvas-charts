import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GripVertical, Bold, Palette } from 'lucide-react'
import { LayerOrder, useChartLayer, type ChartLayerRenderer } from './ChartSurface'
import type {
  ChartAnnotation,
  AnnotationCoordinate,
  AnnotationType,
  TextAnnotation,
  LineAnnotation,
  CircleAnnotation,
  FreehandAnnotation
} from './annotations.types'
import './ChartToolbar.css'

export interface ChartAnnotationsLayerProps {
  /** Array of annotations to render */
  annotations: ChartAnnotation[]
  /** Callback when annotations are updated */
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void
  /** Current annotation being created (controlled by parent) */
  creatingType?: AnnotationType
  /** Callback when annotation creation is in progress */
  onAnnotationCreate?: (annotation: Partial<ChartAnnotation>) => void
  /** Callback when annotation creation is complete */
  onAnnotationComplete?: (annotation: ChartAnnotation) => void
  /** Whether annotation creation is enabled */
  enableCreation?: boolean
}

// Helper to convert data space coordinates to pixel space
const toPixelSpace = (
  coord: AnnotationCoordinate,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
): { x: number; y: number } => {
  if (coord.dataSpace) {
    return {
      x: getXPosition(coord.x),
      y: getYPosition(coord.y)
    }
  }
  return { x: coord.x, y: coord.y }
}

// Render a text annotation
const renderTextAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: TextAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number,
  isHovered?: boolean
) => {
  const pos = toPixelSpace(annotation.position, getXPosition, getYPosition)
  const fontSize = annotation.fontSize ?? 14
  const fontWeight = annotation.fontWeight ?? 'normal'
  const padding = annotation.padding ?? 8
  const textAlign = 'left'

  // Get dimensions from metadata or calculate from text
  const storedWidth = annotation.metadata?.width
  const storedHeight = annotation.metadata?.height

  context.save()
  context.font = `${fontWeight} ${fontSize}px sans-serif`
  context.textAlign = textAlign
  context.textBaseline = 'top'

  let boxWidth: number
  let boxHeight: number
  let lines: string[]

  if (typeof storedWidth === 'number' && typeof storedHeight === 'number') {
    // Use stored dimensions and wrap text
    const maxWidth = storedWidth - padding * 2
    lines = []
    const words = annotation.text.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const metrics = context.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }

    // Use the stored dimensions directly for the box
    boxWidth = storedWidth
    boxHeight = storedHeight
  } else {
    // Single line, no wrapping - calculate from text
    lines = [annotation.text]
    const metrics = context.measureText(annotation.text)
    boxWidth = metrics.width + padding * 2
    boxHeight = fontSize + padding * 2
  }

  // Draw background if specified
  if (annotation.backgroundColor) {
    context.fillStyle = annotation.backgroundColor
    context.fillRect(pos.x - padding, pos.y - padding, boxWidth, boxHeight)
  }

  // Draw text (potentially multiple lines)
  context.fillStyle = annotation.color ?? '#000000'
  lines.forEach((line, index) => {
    context.fillText(line, pos.x, pos.y + index * fontSize * 1.2)
  })

  // Draw selection indicator if selected
  if (annotation.selected) {
    context.strokeStyle = '#3b82f6'
    context.lineWidth = 2
    context.strokeRect(pos.x - padding, pos.y - padding, boxWidth, boxHeight)
  }

  // Draw hover indicator
  if (isHovered && !annotation.selected) {
    context.strokeStyle = '#9ca3af'
    context.lineWidth = 1
    context.setLineDash([4, 4])
    context.strokeRect(pos.x - padding, pos.y - padding, boxWidth, boxHeight)
  }

  context.restore()
}

// Render a line annotation
const renderLineAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: LineAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
) => {
  const start = toPixelSpace(annotation.start, getXPosition, getYPosition)
  const end = toPixelSpace(annotation.end, getXPosition, getYPosition)

  context.save()
  context.strokeStyle = annotation.color ?? '#000000'
  context.lineWidth = annotation.strokeWidth ?? 2

  if (annotation.dash && annotation.dash.length > 0) {
    context.setLineDash(annotation.dash)
  }

  context.beginPath()
  context.moveTo(start.x, start.y)
  context.lineTo(end.x, end.y)
  context.stroke()

  // Draw arrows if specified
  const drawArrow = (fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 10
    const angle = Math.atan2(toY - fromY, toX - fromX)
    context.beginPath()
    context.moveTo(toX, toY)
    context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6))
    context.moveTo(toX, toY)
    context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6))
    context.stroke()
  }

  if (annotation.arrowStart) {
    drawArrow(end.x, end.y, start.x, start.y)
  }
  if (annotation.arrowEnd) {
    drawArrow(start.x, start.y, end.x, end.y)
  }

  // Draw selection indicators
  if (annotation.selected) {
    context.fillStyle = '#3b82f6'
    context.fillRect(start.x - 4, start.y - 4, 8, 8)
    context.fillRect(end.x - 4, end.y - 4, 8, 8)
  }

  context.restore()
}

// Render a circle annotation
const renderCircleAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: CircleAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
) => {
  const center = toPixelSpace(annotation.center, getXPosition, getYPosition)

  context.save()
  context.strokeStyle = annotation.color ?? '#000000'
  context.lineWidth = annotation.strokeWidth ?? 2

  context.beginPath()
  context.arc(center.x, center.y, annotation.radius, 0, 2 * Math.PI)

  // Fill if specified
  if (annotation.fillColor) {
    context.fillStyle = annotation.fillColor
    context.globalAlpha = annotation.fillOpacity ?? 0.3
    context.fill()
    context.globalAlpha = 1
  }

  context.stroke()

  // Draw selection indicator
  if (annotation.selected) {
    context.strokeStyle = '#3b82f6'
    context.lineWidth = 2
    context.setLineDash([5, 5])
    context.stroke()
    context.fillStyle = '#3b82f6'
    context.fillRect(center.x - 4, center.y - 4, 8, 8)
  }

  context.restore()
}

// Render a freehand annotation
const renderFreehandAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: FreehandAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
) => {
  if (annotation.points.length < 2) return

  const points = annotation.points.map((p) => toPixelSpace(p, getXPosition, getYPosition))

  context.save()
  context.strokeStyle = annotation.color ?? '#000000'
  context.lineWidth = annotation.strokeWidth ?? 2
  context.lineCap = 'round'
  context.lineJoin = 'round'

  context.beginPath()
  context.moveTo(points[0].x, points[0].y)

  if (annotation.smoothing && annotation.smoothing > 0) {
    // Smooth the path using quadratic curves
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2
      const yc = (points[i].y + points[i + 1].y) / 2
      context.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
    }
    const last = points[points.length - 1]
    context.lineTo(last.x, last.y)
  } else {
    // Draw straight lines between points
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i].x, points[i].y)
    }
  }

  if (annotation.closed) {
    context.closePath()
  }

  context.stroke()

  // Draw selection indicators
  if (annotation.selected) {
    context.fillStyle = '#3b82f6'
    points.forEach((point, index) => {
      if (index % 5 === 0 || index === points.length - 1) {
        context.fillRect(point.x - 3, point.y - 3, 6, 6)
      }
    })
  }

  context.restore()
}

// Internal annotation editor component
interface AnnotationEditorProps {
  annotation: TextAnnotation
  onUpdate: (updates: Partial<TextAnnotation>) => void
  onClose: () => void
  chartContainerRef: HTMLElement | null
}

const AnnotationEditor: React.FC<AnnotationEditorProps> = ({ annotation, onUpdate, onClose, chartContainerRef }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const textInputRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)

  const fontSize = annotation.fontSize ?? 14
  const fontWeight = annotation.fontWeight ?? 'normal'
  const padding = annotation.padding ?? 8

  // Measure text width accurately using canvas
  const textWidth = useMemo(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return Math.max(100, annotation.text.length * fontSize * 0.6)
    ctx.font = `${fontWeight} ${fontSize}px sans-serif`
    const metrics = ctx.measureText(annotation.text)
    return Math.max(100, metrics.width)
  }, [annotation.text, fontSize, fontWeight])

  const textHeight = fontSize + padding * 2

  const [boxWidth, setBoxWidth] = useState(annotation.metadata?.width || Math.max(200, textWidth))
  const [boxHeight, setBoxHeight] = useState(annotation.metadata?.height || Math.max(50, textHeight))

  // Constants for positioning
  const toolbarHeight = 36
  const marginBetween = 8

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (editorRef.current && !editorRef.current.contains(target) && !isDragging) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, isDragging])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)

      if (chartContainerRef) {
        const chartRect = chartContainerRef.getBoundingClientRect()
        setDragOffset({
          x: e.clientX - chartRect.left - annotation.position.x,
          y: e.clientY - chartRect.top - annotation.position.y
        })
      }
    },
    [annotation.position.x, annotation.position.y, chartContainerRef]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!chartContainerRef) return
      const rect = chartContainerRef.getBoundingClientRect()
      const newX = e.clientX - rect.left - dragOffset.x
      const newY = e.clientY - rect.top - dragOffset.y
      onUpdate({ position: { x: newX, y: newY } })
    }

    const handleMouseUp = () => setIsDragging(false)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, onUpdate, chartContainerRef])

  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.focus()
      // Select all text
      const range = document.createRange()
      range.selectNodeContents(textInputRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [])

  const handleTextBlur = () => {
    // Optionally close editor on blur, or keep it open
    // onClose()
  }

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      ;(e.currentTarget as HTMLElement).blur()
      onClose()
    }
    // Allow Enter for newlines in contentEditable
  }

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!chartContainerRef || !editorRef.current) return
      const editorRect = editorRef.current.getBoundingClientRect()

      // Calculate relative to the editor's position
      const mouseX = e.clientX - editorRect.left
      const mouseY = e.clientY - editorRect.top

      const newWidth = Math.max(100, mouseX)
      const newHeight = Math.max(30, mouseY - (toolbarHeight + marginBetween))

      setBoxWidth(newWidth)
      setBoxHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    isResizing,
    annotation.position.x,
    annotation.position.y,
    annotation.metadata,
    boxWidth,
    boxHeight,
    chartContainerRef,
    onUpdate,
    padding,
    toolbarHeight,
    marginBetween
  ])

  // Save dimensions to annotation when they change and we're not actively resizing
  useEffect(() => {
    if (!isResizing) {
      const currentWidth = annotation.metadata?.width
      const currentHeight = annotation.metadata?.height

      if (currentWidth !== boxWidth || currentHeight !== boxHeight) {
        onUpdate({
          metadata: {
            ...annotation.metadata,
            width: boxWidth,
            height: boxHeight
          }
        })
      }
    }
  }, [boxWidth, boxHeight, isResizing, annotation.metadata, onUpdate])

  const toggleBold = () => {
    onUpdate({ fontWeight: fontWeight === 'bold' ? 'normal' : 'bold' })
  }

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ fontSize: Number(e.target.value) })
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ color: e.target.value })
  }

  // Position editor so text box aligns with annotation position
  const totalHeight = toolbarHeight + marginBetween + textHeight
  const editorTop = annotation.position.y - totalHeight
  const editorLeft = annotation.position.x - padding

  return (
    <div
      ref={editorRef}
      data-annotation-editor
      className="absolute pointer-events-auto"
      style={{ left: editorLeft, top: editorTop, zIndex: 1000 }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div ref={toolbarRef} className="chart-toolbar" style={{ position: 'relative', marginBottom: '0.5rem' }}>
        <div
          onMouseDown={handleMouseDown}
          className={`chart-toolbar-drag-handle ${isDragging ? 'dragging' : ''}`}
          title="Drag to move"
        >
          <GripVertical size={16} />
        </div>

        <select
          value={fontSize}
          onChange={handleFontSizeChange}
          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
          onClick={(e) => e.stopPropagation()}
          style={{ height: '28px' }}
        >
          {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>

        <button
          onClick={toggleBold}
          className={`chart-toolbar-button ${fontWeight === 'bold' ? 'active' : ''}`}
          title="Bold"
        >
          <span className="chart-toolbar-button-icon">
            <Bold size={16} />
          </span>
        </button>

        <div className="relative">
          <input
            type="color"
            value={annotation.color}
            onChange={handleColorChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="chart-toolbar-button" title="Color">
            <span className="chart-toolbar-button-icon">
              <Palette size={16} style={{ color: annotation.color }} />
            </span>
          </button>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div
          ref={textInputRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => {
            const newText = e.currentTarget.textContent || ''
            onUpdate({ text: newText })
          }}
          onBlur={handleTextBlur}
          onKeyDown={handleTextKeyDown}
          className="border-2 border-dashed border-blue-400 bg-white bg-opacity-90 rounded outline-none px-2 py-1"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight,
            color: annotation.color,
            width: `${boxWidth}px`,
            height: `${boxHeight}px`,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            resize: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {annotation.text || 'Click to edit'}
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '16px',
            height: '16px',
            cursor: 'nwse-resize',
            background: 'linear-gradient(135deg, transparent 50%, #3b82f6 50%)',
            borderBottomRightRadius: '4px',
            zIndex: 10
          }}
          title="Drag to resize"
        />
      </div>
    </div>
  )
}

export const ChartAnnotationsLayer: React.FC<ChartAnnotationsLayerProps> = ({
  annotations,
  onAnnotationsChange,
  creatingType
}) => {
  const layerOptions = useMemo(() => ({ order: LayerOrder.overlays + 5 }), [])
  const [isDrawing] = useState(false)
  const drawingPointsRef = useRef<AnnotationCoordinate[]>([])
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null)
  const chartContainerRef = useRef<HTMLDivElement | null>(null)

  // Get chart container element
  useEffect(() => {
    const findChartContainer = () => {
      // Find the chart surface container
      const chartElement = document.querySelector('.chart-surface-container')
      if (chartElement) {
        chartContainerRef.current = chartElement as HTMLDivElement
      }
    }
    findChartContainer()
  }, [])

  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      // Render all annotations
      annotations.forEach((annotation) => {
        switch (annotation.type) {
          case 'text':
            renderTextAnnotation(
              context,
              annotation,
              helpers.getXPosition,
              helpers.getYPosition,
              annotation.id === hoveredAnnotationId
            )
            break
          case 'line':
            renderLineAnnotation(context, annotation, helpers.getXPosition, helpers.getYPosition)
            break
          case 'circle':
            renderCircleAnnotation(context, annotation, helpers.getXPosition, helpers.getYPosition)
            break
          case 'freehand':
            renderFreehandAnnotation(context, annotation, helpers.getXPosition, helpers.getYPosition)
            break
        }
      })

      // Render temporary annotation during creation
      if (isDrawing && drawingPointsRef.current.length > 0 && creatingType) {
        const points = drawingPointsRef.current
        context.save()
        context.strokeStyle = '#3b82f6'
        context.lineWidth = 2
        context.setLineDash([5, 5])

        if (creatingType === 'line' && points.length >= 1) {
          const start = toPixelSpace(points[0], helpers.getXPosition, helpers.getYPosition)
          const end = points.length > 1 ? toPixelSpace(points[1], helpers.getXPosition, helpers.getYPosition) : start
          context.beginPath()
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          context.stroke()
        } else if (creatingType === 'circle' && points.length >= 1) {
          const center = toPixelSpace(points[0], helpers.getXPosition, helpers.getYPosition)
          const end = points.length > 1 ? toPixelSpace(points[1], helpers.getXPosition, helpers.getYPosition) : center
          const radius = Math.sqrt(Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2))
          context.beginPath()
          context.arc(center.x, center.y, radius, 0, 2 * Math.PI)
          context.stroke()
        } else if (creatingType === 'freehand' && points.length > 1) {
          const pixelPoints = points.map((p) => toPixelSpace(p, helpers.getXPosition, helpers.getYPosition))
          context.beginPath()
          context.moveTo(pixelPoints[0].x, pixelPoints[0].y)
          for (let i = 1; i < pixelPoints.length; i++) {
            context.lineTo(pixelPoints[i].x, pixelPoints[i].y)
          }
          context.stroke()
        }

        context.restore()
      }
    },
    [annotations, creatingType, isDrawing, hoveredAnnotationId]
  )

  useChartLayer(draw, layerOptions)

  const selectedAnnotation = selectedAnnotationId
    ? (annotations.find((a) => a.id === selectedAnnotationId && a.type === 'text') as TextAnnotation | undefined)
    : undefined

  const handleUpdateAnnotation = useCallback(
    (updates: Partial<TextAnnotation>) => {
      if (!selectedAnnotationId || !onAnnotationsChange) return

      const updatedAnnotations = annotations.map((a) =>
        a.id === selectedAnnotationId && a.type === 'text' ? ({ ...a, ...updates } as TextAnnotation) : a
      )
      onAnnotationsChange(updatedAnnotations)
    },
    [selectedAnnotationId, annotations, onAnnotationsChange]
  )

  const handleCloseEditor = useCallback(() => {
    setSelectedAnnotationId(null)
  }, [])

  // Handle hover over annotations for cursor and hover effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!chartContainerRef.current) return

      const rect = chartContainerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      let foundHover = false

      // Check if hovering over a text annotation
      for (const annotation of annotations) {
        if (annotation.type === 'text') {
          const textAnnotation = annotation as TextAnnotation
          const pos = textAnnotation.position
          const fontSize = textAnnotation.fontSize ?? 14
          const padding = textAnnotation.padding ?? 8

          // Use stored dimensions if available, otherwise calculate from text
          const storedWidth = textAnnotation.metadata?.width
          const storedHeight = textAnnotation.metadata?.height

          let bgWidth: number
          let bgHeight: number

          if (typeof storedWidth === 'number' && typeof storedHeight === 'number') {
            // Use stored dimensions
            bgWidth = storedWidth
            bgHeight = storedHeight
          } else {
            // Calculate from text
            const tempCanvas = document.createElement('canvas')
            const tempCtx = tempCanvas.getContext('2d')
            if (!tempCtx) continue

            const fontWeight = textAnnotation.fontWeight ?? 'normal'
            tempCtx.font = `${fontWeight} ${fontSize}px sans-serif`
            const metrics = tempCtx.measureText(textAnnotation.text)
            bgWidth = metrics.width + padding * 2
            bgHeight = fontSize + padding * 2
          }

          const bgX = pos.x - padding
          const bgY = pos.y - padding

          if (x >= bgX && x <= bgX + bgWidth && y >= bgY && y <= bgY + bgHeight) {
            setHoveredAnnotationId(annotation.id)
            chartContainerRef.current.style.cursor = 'text'
            foundHover = true
            break
          }
        }
      }
      if (!foundHover) {
        setHoveredAnnotationId(null)
        chartContainerRef.current.style.cursor = 'default'
      }
    }

    const container = chartContainerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => {
        container.removeEventListener('mousemove', handleMouseMove)
        container.style.cursor = 'default'
      }
    }
  }, [annotations])

  // Handle clicks on annotations to select them
  useEffect(() => {
    const handleChartClick = (e: MouseEvent) => {
      if (!chartContainerRef.current) return

      // Don't process clicks that came from the editor
      const target = e.target as HTMLElement
      if (target.closest('[data-annotation-editor]')) {
        return
      }

      const rect = chartContainerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Check if clicking on a text annotation
      for (const annotation of annotations) {
        if (annotation.type === 'text') {
          const textAnnotation = annotation as TextAnnotation
          const pos = textAnnotation.position
          const fontSize = textAnnotation.fontSize ?? 14
          const padding = textAnnotation.padding ?? 8

          // Use stored dimensions if available, otherwise calculate from text
          const storedWidth = textAnnotation.metadata?.width
          const storedHeight = textAnnotation.metadata?.height

          let bgWidth: number
          let bgHeight: number

          if (typeof storedWidth === 'number' && typeof storedHeight === 'number') {
            // Use stored dimensions
            bgWidth = storedWidth
            bgHeight = storedHeight
          } else {
            // Calculate from text
            const tempCanvas = document.createElement('canvas')
            const tempCtx = tempCanvas.getContext('2d')
            if (!tempCtx) continue

            const fontWeight = textAnnotation.fontWeight ?? 'normal'
            tempCtx.font = `${fontWeight} ${fontSize}px sans-serif`
            const metrics = tempCtx.measureText(textAnnotation.text)
            bgWidth = metrics.width + padding * 2
            bgHeight = fontSize + padding * 2
          }

          const bgX = pos.x - padding
          const bgY = pos.y - padding

          if (x >= bgX && x <= bgX + bgWidth && y >= bgY && y <= bgY + bgHeight) {
            setSelectedAnnotationId(annotation.id)
            e.stopPropagation()
            return
          }
        }
      }

      // Clicked on empty space
      setSelectedAnnotationId(null)
    }

    const container = chartContainerRef.current
    if (container) {
      container.addEventListener('click', handleChartClick)
      return () => container.removeEventListener('click', handleChartClick)
    }
  }, [annotations])

  return selectedAnnotation && chartContainerRef.current
    ? createPortal(
        <AnnotationEditor
          annotation={selectedAnnotation}
          onUpdate={handleUpdateAnnotation}
          onClose={handleCloseEditor}
          chartContainerRef={chartContainerRef.current}
        />,
        chartContainerRef.current
      )
    : null
}
