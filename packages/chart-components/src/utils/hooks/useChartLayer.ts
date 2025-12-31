import { useEffect, useRef } from 'react'
import { useChartSurface } from '../context/ChartSurfaceContext'
import type {
  ChartLayerRenderer,
  ChartLayerOptions,
  ChartLayerHandle
} from '../../components/Chart/ChartSurface/ChartSurface.types'

/**
 * Hook for registering a chart layer that renders on the canvas
 * @param draw - The function that draws the layer on the canvas
 * @param options - Optional configuration for the layer (e.g., order)
 */
export const useChartLayer = (draw: ChartLayerRenderer, options?: ChartLayerOptions): void => {
  const { registerLayer } = useChartSurface()
  const drawRef = useRef(draw)
  const optionsRef = useRef(options)
  const handleRef = useRef<ChartLayerHandle | null>(null)

  drawRef.current = draw
  optionsRef.current = options

  useEffect(() => {
    const handle = registerLayer(drawRef.current, optionsRef.current)
    handleRef.current = handle
    return () => {
      handle.unregister()
      handleRef.current = null
    }
  }, [registerLayer])

  useEffect(() => {
    if (handleRef.current) {
      handleRef.current.update(drawRef.current, optionsRef.current)
    }
  }, [draw, options])
}
