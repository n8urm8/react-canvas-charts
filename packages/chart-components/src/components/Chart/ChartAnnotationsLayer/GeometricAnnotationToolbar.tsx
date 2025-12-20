import React, { useCallback } from 'react'
import { Palette, Trash2, ArrowRight } from 'lucide-react'
import type { LineAnnotation, CircleAnnotation, FreehandAnnotation } from '../annotations.types'
import { useDebounce } from '../../../utils/useDebounce'
import '../ChartToolbar.css'

type GeometricAnnotation = LineAnnotation | CircleAnnotation | FreehandAnnotation

interface GeometricAnnotationToolbarProps {
  annotation: GeometricAnnotation
  onUpdate: (updates: Partial<GeometricAnnotation>) => void
  onDelete: () => void
  position: { x: number; y: number }
}

export const GeometricAnnotationToolbar: React.FC<GeometricAnnotationToolbarProps> = ({
  annotation,
  onUpdate,
  onDelete,
  position
}) => {
  const [localColor, setLocalColor] = useDebounce(annotation.color, 150, (color) =>
    onUpdate({ color } as Partial<GeometricAnnotation>)
  )

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalColor(e.target.value)
    },
    [setLocalColor]
  )

  const handleStrokeWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate({ strokeWidth: parseInt(e.target.value) } as Partial<GeometricAnnotation>)
    },
    [onUpdate]
  )

  const handleArrowStartToggle = useCallback(() => {
    if (annotation.type === 'line') {
      onUpdate({ arrowStart: !annotation.arrowStart } as Partial<LineAnnotation>)
    }
  }, [annotation, onUpdate])

  const handleArrowEndToggle = useCallback(() => {
    if (annotation.type === 'line') {
      onUpdate({ arrowEnd: !annotation.arrowEnd } as Partial<LineAnnotation>)
    }
  }, [annotation, onUpdate])

  const isLineAnnotation = annotation.type === 'line'

  return (
    <div
      className="chart-toolbar"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y - 44, // Position above the annotation
        zIndex: 1001,
        flexWrap: 'nowrap'
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <select
        value={annotation.strokeWidth}
        onChange={handleStrokeWidthChange}
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
        <option value="1">1px</option>
        <option value="2">2px</option>
        <option value="3">3px</option>
        <option value="4">4px</option>
        <option value="6">6px</option>
        <option value="8">8px</option>
      </select>

      {isLineAnnotation && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleArrowStartToggle()
            }}
            className={`chart-toolbar-button ${(annotation as LineAnnotation).arrowStart ? 'active' : ''}`}
            title="Arrow at start"
            style={{ transform: 'scaleX(-1)' }}
          >
            <span className="chart-toolbar-button-icon">
              <ArrowRight size={16} />
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleArrowEndToggle()
            }}
            className={`chart-toolbar-button ${(annotation as LineAnnotation).arrowEnd ? 'active' : ''}`}
            title="Arrow at end"
          >
            <span className="chart-toolbar-button-icon">
              <ArrowRight size={16} />
            </span>
          </button>
        </>
      )}

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

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="chart-toolbar-button"
        title="Delete"
      >
        <span className="chart-toolbar-button-icon">
          <Trash2 size={16} />
        </span>
      </button>
    </div>
  )
}
