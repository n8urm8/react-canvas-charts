import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { GripVertical, Bold, Palette, PaintBucket, Droplets, ALargeSmall, Scan } from 'lucide-react'
import type { TextAnnotation } from './annotations.types'
import { useDebounce } from '../../../utils/hooks/useDebounce'
import '../ChartToolbar.css'

interface AnnotationEditorProps {
  annotation: TextAnnotation
  onUpdate: (updates: Partial<TextAnnotation>) => void
  onClose: () => void
  chartContainerRef: HTMLElement | null
}

const DEFAULT_TEXT_COLOR = '#111827'
const DEFAULT_BACKGROUND_COLOR = '#ffffff'

type RgbColor = { r: number; g: number; b: number }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const rgbToHex = ({ r, g, b }: RgbColor) =>
  `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`

const hexToRgb = (value: string): RgbColor | null => {
  const normalized = value.replace('#', '').trim()
  const valid = /^[0-9a-fA-F]+$/.test(normalized)
  if (!valid || (normalized.length !== 3 && normalized.length !== 6)) {
    return null
  }

  if (normalized.length === 3) {
    return {
      r: parseInt(`${normalized[0]}${normalized[0]}`, 16),
      g: parseInt(`${normalized[1]}${normalized[1]}`, 16),
      b: parseInt(`${normalized[2]}${normalized[2]}`, 16)
    }
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  }
}

const parseBackgroundColor = (value?: string): { rgb: RgbColor; alpha: number } => {
  if (!value || value.trim().length === 0 || value === 'transparent') {
    return { rgb: { r: 255, g: 255, b: 255 }, alpha: 0 }
  }

  if (value.startsWith('#')) {
    const parsed = hexToRgb(value)
    if (parsed) {
      return { rgb: parsed, alpha: 1 }
    }
  }

  const rgbaMatch = value.match(/rgba?\(([^)]+)\)/i)
  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(',').map((part) => part.trim())
    const r = Number(parts[0])
    const g = Number(parts[1])
    const b = Number(parts[2])
    const a = parts[3] !== undefined ? Number(parts[3]) : 1
    if ([r, g, b, a].every((num) => Number.isFinite(num))) {
      return {
        rgb: { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) },
        alpha: clamp(a, 0, 1)
      }
    }
  }

  return { rgb: { r: 255, g: 255, b: 255 }, alpha: 1 }
}

const toBackgroundCss = (rgb: RgbColor, alpha: number): string => {
  const safeAlpha = clamp(alpha, 0, 1)
  if (safeAlpha <= 0) {
    return 'transparent'
  }
  if (safeAlpha >= 1) {
    return rgbToHex(rgb)
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeAlpha.toFixed(2)})`
}

interface ToolbarIconButtonProps {
  title: string
  active?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}

const ToolbarIconButton: React.FC<ToolbarIconButtonProps> = ({ title, active = false, onClick, children }) => (
  <button
    type="button"
    className={`chart-toolbar-button ${active ? 'active' : ''}`}
    title={title}
    onClick={onClick}
  >
    <span className="chart-toolbar-button-icon">{children}</span>
  </button>
)

interface SliderPopoverButtonProps {
  title: string
  icon: React.ReactNode
  valueLabel: string
  value: number
  min: number
  max: number
  step?: number
  isOpen: boolean
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const SliderPopoverButton: React.FC<SliderPopoverButtonProps> = ({
  title,
  icon,
  valueLabel,
  value,
  min,
  max,
  step = 1,
  isOpen,
  onToggle,
  onChange,
}) => (
  <div style={{ position: 'relative' }}>
    <ToolbarIconButton title={title} active={isOpen} onClick={onToggle}>
      {icon}
    </ToolbarIconButton>
    {isOpen ? (
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 0.35rem)',
          left: 0,
          zIndex: 30,
          backgroundColor: '#ffffff',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
          padding: '0.55rem 0.7rem',
          minWidth: '180px'
        }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div style={{ fontSize: '11px', color: '#4b5563', marginBottom: '0.35rem' }}>{valueLabel}</div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          style={{ width: '100%' }}
          title={title}
        />
      </div>
    ) : null}
  </div>
)

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({
  annotation,
  onUpdate,
  onClose,
  chartContainerRef
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const textInputRef = useRef<HTMLDivElement>(null)
  const fontColorInputRef = useRef<HTMLInputElement>(null)
  const backgroundColorInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [openPopover, setOpenPopover] = useState<'font-size' | 'border-radius' | 'transparency' | null>(null)

  const [localColor, setLocalColor] = useDebounce(annotation.color ?? DEFAULT_TEXT_COLOR, 150, (color) => onUpdate({ color }))
  const initialBackground = useMemo(() => parseBackgroundColor(annotation.backgroundColor), [annotation.backgroundColor])
  const [localBackgroundHex, setLocalBackgroundHex] = useState(rgbToHex(initialBackground.rgb))
  const [backgroundTransparency, setBackgroundTransparency] = useState(Math.round((1 - initialBackground.alpha) * 100))

  const fontSize = annotation.fontSize ?? 14
  const fontWeight = annotation.fontWeight ?? 'normal'
  const padding = 8
  const borderRadius = annotation.borderRadius ?? 4

  useEffect(() => {
    const parsed = parseBackgroundColor(annotation.backgroundColor)
    setLocalBackgroundHex(rgbToHex(parsed.rgb))
    setBackgroundTransparency(Math.round((1 - parsed.alpha) * 100))
  }, [annotation.backgroundColor])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const newHeight = Math.max(30, mouseY)

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
    padding
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

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ fontSize: Number(e.target.value) })
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalColor(e.target.value)
  }

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextHex = e.target.value
    setLocalBackgroundHex(nextHex)

    const rgb = hexToRgb(nextHex)
    if (!rgb) {
      return
    }
    const alpha = 1 - backgroundTransparency / 100
    onUpdate({ backgroundColor: toBackgroundCss(rgb, alpha) })
  }

  const handleBackgroundTransparencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTransparency = Number(e.target.value)
    setBackgroundTransparency(nextTransparency)

    const rgb = hexToRgb(localBackgroundHex) ?? parseBackgroundColor(DEFAULT_BACKGROUND_COLOR).rgb
    const alpha = 1 - nextTransparency / 100
    onUpdate({ backgroundColor: toBackgroundCss(rgb, alpha) })
  }

  const handleBorderRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ borderRadius: Number(e.target.value) })
  }

  const togglePopover = (key: 'font-size' | 'border-radius' | 'transparency') => {
    setOpenPopover((previous) => (previous === key ? null : key))
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

        <SliderPopoverButton
          title="Font size"
          icon={<ALargeSmall size={16} style={{ color: '#111827' }} />}
          valueLabel={`Font size: ${fontSize}px`}
          value={fontSize}
          min={8}
          max={120}
          step={1}
          isOpen={openPopover === 'font-size'}
          onToggle={(event) => {
            event.stopPropagation()
            togglePopover('font-size')
          }}
          onChange={handleFontSizeChange}
        />

        <ToolbarIconButton
          title="Bold"
          active={fontWeight === 'bold'}
          onClick={(event) => {
            event.stopPropagation()
            toggleBold()
          }}
        >
            <Bold size={16} />
        </ToolbarIconButton>

        <div style={{ position: 'relative' }}>
          <input
            ref={fontColorInputRef}
            type="color"
            value={localColor}
            onChange={handleColorChange}
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            aria-hidden="true"
          />
          <ToolbarIconButton
            title="Font color"
            onClick={(e) => {
              e.stopPropagation()
              fontColorInputRef.current?.click()
            }}
          >
            <Palette size={16} style={{ color: localColor }} />
          </ToolbarIconButton>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            ref={backgroundColorInputRef}
            type="color"
            value={localBackgroundHex}
            onChange={handleBackgroundColorChange}
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            aria-hidden="true"
          />
          <ToolbarIconButton
            title="Background color"
            onClick={(e) => {
              e.stopPropagation()
              backgroundColorInputRef.current?.click()
            }}
          >
            <PaintBucket size={16} style={{ color: '#111827' }} />
          </ToolbarIconButton>
        </div>

        <SliderPopoverButton
          title="Background transparency"
          icon={<Droplets size={16} style={{ color: '#111827' }} />}
          valueLabel={`Transparency: ${backgroundTransparency}%`}
          value={backgroundTransparency}
          min={0}
          max={100}
          step={1}
          isOpen={openPopover === 'transparency'}
          onToggle={(event) => {
            event.stopPropagation()
            togglePopover('transparency')
          }}
          onChange={handleBackgroundTransparencyChange}
        />

        <SliderPopoverButton
          title="Border radius"
          icon={<Scan size={16} style={{ color: '#111827' }} />}
          valueLabel={`Radius: ${borderRadius}px`}
          value={borderRadius}
          min={0}
          max={32}
          step={1}
          isOpen={openPopover === 'border-radius'}
          onToggle={(event) => {
            event.stopPropagation()
            togglePopover('border-radius')
          }}
          onChange={handleBorderRadiusChange}
        />
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
            backgroundColor: annotation.backgroundColor ?? 'transparent',
            borderRadius: `${borderRadius}px`,
            outline: 'none',
            padding: '1px 8px 8px 7px',
            fontSize: `${fontSize}px`,
            fontWeight,
            color: annotation.color ?? DEFAULT_TEXT_COLOR,
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
