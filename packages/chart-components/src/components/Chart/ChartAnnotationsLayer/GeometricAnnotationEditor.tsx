import React, { useCallback, useState, useEffect, useRef } from 'react'
import type { LineAnnotation, CircleAnnotation, FreehandAnnotation } from '../annotations.types'

type GeometricAnnotation = LineAnnotation | CircleAnnotation | FreehandAnnotation

interface GeometricAnnotationEditorProps {
  annotation: GeometricAnnotation
  onUpdate: (updates: Partial<GeometricAnnotation>) => void
  onClose: () => void
  chartContainerRef: HTMLElement | null
  onDragStart: () => void
  onDragEnd: () => void
}

type DragMode =
  | { type: 'line-start' }
  | { type: 'line-end' }
  | { type: 'line-body'; offsetX: number; offsetY: number }
  | { type: 'circle-body'; offsetX: number; offsetY: number }
  | { type: 'circle-resize' }
  | { type: 'freehand-body'; offsetX: number; offsetY: number }
  | null

const HANDLE_SIZE = 12

export const GeometricAnnotationEditor: React.FC<GeometricAnnotationEditorProps> = ({
  annotation,
  onUpdate,
  chartContainerRef,
  onDragStart,
  onDragEnd
}) => {
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw handles overlay
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !chartContainerRef) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match chart container
    const rect = chartContainerRef.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw handles based on annotation type
    ctx.fillStyle = '#3b82f6'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2

    if (annotation.type === 'line') {
      const line = annotation as LineAnnotation

      // Draw line with highlight
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(line.start.x, line.start.y)
      ctx.lineTo(line.end.x, line.end.y)
      ctx.stroke()
      ctx.setLineDash([])

      // Start handle
      ctx.beginPath()
      ctx.arc(line.start.x, line.start.y, HANDLE_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // End handle
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(line.end.x, line.end.y, HANDLE_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
    } else if (annotation.type === 'circle') {
      const circle = annotation as CircleAnnotation

      // Draw circle with highlight
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Center handle
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(circle.center.x, circle.center.y, HANDLE_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Resize handle (on the right edge)
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(circle.center.x + circle.radius, circle.center.y, HANDLE_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
    } else if (annotation.type === 'freehand') {
      const freehand = annotation as FreehandAnnotation

      // Draw freehand path with highlight
      if (freehand.points.length > 1) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(freehand.points[0].x, freehand.points[0].y)
        for (let i = 1; i < freehand.points.length; i++) {
          ctx.lineTo(freehand.points[i].x, freehand.points[i].y)
        }
        ctx.stroke()
        ctx.setLineDash([])

        // Draw handle at start of path
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(freehand.points[0].x, freehand.points[0].y, HANDLE_SIZE / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
  }, [annotation, chartContainerRef])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!chartContainerRef) return

      const rect = chartContainerRef.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      e.stopPropagation() // Prevent other handlers from firing

      if (annotation.type === 'line') {
        const line = annotation as LineAnnotation

        // Check if clicking start handle
        const distToStart = Math.sqrt((x - line.start.x) ** 2 + (y - line.start.y) ** 2)
        if (distToStart <= HANDLE_SIZE / 2) {
          setDragMode({ type: 'line-start' })
          onDragStart()
          e.stopPropagation()
          return
        }

        // Check if clicking end handle
        const distToEnd = Math.sqrt((x - line.end.x) ** 2 + (y - line.end.y) ** 2)
        if (distToEnd <= HANDLE_SIZE / 2) {
          setDragMode({ type: 'line-end' })
          onDragStart()
          e.stopPropagation()
          return
        }

        // Otherwise, drag the whole line
        const centerX = (line.start.x + line.end.x) / 2
        const centerY = (line.start.y + line.end.y) / 2
        setDragMode({ type: 'line-body', offsetX: x - centerX, offsetY: y - centerY })
        onDragStart()
        e.stopPropagation()
      } else if (annotation.type === 'circle') {
        const circle = annotation as CircleAnnotation

        // Check if clicking resize handle
        const resizeHandleX = circle.center.x + circle.radius
        const resizeHandleY = circle.center.y
        const distToResize = Math.sqrt((x - resizeHandleX) ** 2 + (y - resizeHandleY) ** 2)
        if (distToResize <= HANDLE_SIZE / 2) {
          setDragMode({ type: 'circle-resize' })
          onDragStart()
          e.stopPropagation()
          return
        }

        // Otherwise, drag the whole circle
        setDragMode({ type: 'circle-body', offsetX: x - circle.center.x, offsetY: y - circle.center.y })
        onDragStart()
        e.stopPropagation()
      } else if (annotation.type === 'freehand') {
        const freehand = annotation as FreehandAnnotation
        if (freehand.points.length > 0) {
          // Calculate bounding box center
          const xs = freehand.points.map((p) => p.x)
          const ys = freehand.points.map((p) => p.y)
          const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
          const centerY = (Math.min(...ys) + Math.max(...ys)) / 2

          setDragMode({ type: 'freehand-body', offsetX: x - centerX, offsetY: y - centerY })
          onDragStart()
          e.stopPropagation()
        }
      }
    },
    [annotation, chartContainerRef, onDragStart]
  )

  useEffect(() => {
    if (!dragMode) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!chartContainerRef) return

      const rect = chartContainerRef.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (annotation.type === 'line') {
        const line = annotation as LineAnnotation

        if (dragMode.type === 'line-start') {
          onUpdate({ ...line, start: { x, y } })
        } else if (dragMode.type === 'line-end') {
          onUpdate({ ...line, end: { x, y } })
        } else if (dragMode.type === 'line-body') {
          const centerX = x - dragMode.offsetX
          const centerY = y - dragMode.offsetY
          const currentCenterX = (line.start.x + line.end.x) / 2
          const currentCenterY = (line.start.y + line.end.y) / 2
          const dx = centerX - currentCenterX
          const dy = centerY - currentCenterY

          onUpdate({
            ...line,
            start: { x: line.start.x + dx, y: line.start.y + dy },
            end: { x: line.end.x + dx, y: line.end.y + dy }
          })
        }
      } else if (annotation.type === 'circle') {
        const circle = annotation as CircleAnnotation

        if (dragMode.type === 'circle-resize') {
          const newRadius = Math.sqrt((x - circle.center.x) ** 2 + (y - circle.center.y) ** 2)
          onUpdate({ ...circle, radius: Math.max(10, newRadius) })
        } else if (dragMode.type === 'circle-body') {
          onUpdate({ ...circle, center: { x: x - dragMode.offsetX, y: y - dragMode.offsetY } })
        }
      } else if (annotation.type === 'freehand') {
        const freehand = annotation as FreehandAnnotation

        if (dragMode.type === 'freehand-body' && freehand.points.length > 0) {
          // Calculate current center
          const xs = freehand.points.map((p) => p.x)
          const ys = freehand.points.map((p) => p.y)
          const currentCenterX = (Math.min(...xs) + Math.max(...xs)) / 2
          const currentCenterY = (Math.min(...ys) + Math.max(...ys)) / 2

          const newCenterX = x - dragMode.offsetX
          const newCenterY = y - dragMode.offsetY
          const dx = newCenterX - currentCenterX
          const dy = newCenterY - currentCenterY

          const newPoints = freehand.points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
          onUpdate({ ...freehand, points: newPoints })
        }
      }

      e.preventDefault()
      e.stopPropagation()
    }

    const handleMouseUp = () => {
      setDragMode(null)
      onDragEnd()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragMode, annotation, onUpdate, chartContainerRef, onDragEnd])

  // Close on click outside - removed since we use hover now
  // useEffect(() => {
  //   const handleClickOutside = (e: MouseEvent) => {
  //     if (canvasRef.current && !canvasRef.current.contains(e.target as Node) && !dragMode) {
  //       onClose()
  //     }
  //   }

  //   document.addEventListener('mousedown', handleClickOutside)
  //   return () => document.removeEventListener('mousedown', handleClickOutside)
  // }, [onClose, dragMode])

  if (!chartContainerRef) return null

  const rect = chartContainerRef.getBoundingClientRect()

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: rect.width,
        height: rect.height,
        pointerEvents: 'auto',
        cursor: dragMode ? 'grabbing' : 'pointer',
        zIndex: 1000
      }}
      data-annotation-editor
    />
  )
}
