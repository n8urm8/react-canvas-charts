import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { GripVertical, Bold, Palette } from 'lucide-react'
import type { TextAnnotation } from '../annotations.types'
import { useDebounce } from '../../../utils/useDebounce'
import '../ChartToolbar.css'

interface AnnotationEditorProps {
  annotation: TextAnnotation
  onUpdate: (updates: Partial<TextAnnotation>) => void
  onClose: () => void
  chartContainerRef: HTMLElement | null
}

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({
  annotation,
  onUpdate,
  onClose,
  chartContainerRef
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const textInputRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)

  const [localColor, setLocalColor] = useDebounce(annotation.color, 150, (color) => onUpdate({ color }))

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

  // Set initial content of contentEditable (only once)
  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.textContent = annotation.text
      // Focus at the end of text
      const range = document.createRange()
      const sel = window.getSelection()
      if (textInputRef.current.childNodes.length > 0) {
        range.setStart(textInputRef.current.childNodes[0], annotation.text.length)
        range.collapse(true)
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
      textInputRef.current.focus()
    }
  }, []) // Only on mount

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
    setLocalColor(e.target.value)
  }

  // Position editor so text box aligns with annotation position
  const editorTop = annotation.position.y - padding
  const editorLeft = annotation.position.x - padding

  return (
    <div
      ref={editorRef}
      data-annotation-editor
      className="pointer-events-auto"
      style={{ left: editorLeft, top: editorTop, zIndex: 1000, position: 'absolute' }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        ref={toolbarRef}
        className="chart-toolbar"
        style={{
          position: 'absolute',
          top: `-${toolbarHeight + 16}px`,
          left: 0,
          zIndex: 10,
          flexWrap: 'nowrap'
        }}
      >
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
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '4px 8px',
            backgroundColor: 'white',
            height: '28px'
          }}
        >
          {FONT_SIZES.map((size) => (
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

        <div style={{ position: 'relative' }}>
          <input
            type="color"
            value={localColor}
            onChange={handleColorChange}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button className="chart-toolbar-button" title="Color">
            <span className="chart-toolbar-button-icon">
              <Palette size={16} style={{ color: localColor }} />
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
          onBlur={(e) => {
            const newText = e.currentTarget.textContent || ''
            onUpdate({ text: newText })
            handleTextBlur()
          }}
          onKeyDown={handleTextKeyDown}
          style={{
            border: '2px dashed #60a5fa',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '4px',
            outline: 'none',
            padding: '1px 8px 8px 7px',
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
        />

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
