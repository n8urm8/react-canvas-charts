import { createContext, useContext } from 'react'
import type {
  ChartSurfaceContextValue,
  ChartSurfaceStableContextValue
} from '../../components/Chart/ChartSurface/ChartSurface.types'

export const ChartSurfaceContext = createContext<ChartSurfaceContextValue | null>(null)

/**
 * Context holding only the surface's registration functions. Its value never changes, so
 * components that only register canvas layers do not re-render when data or geometry changes.
 */
export const ChartSurfaceStableContext = createContext<ChartSurfaceStableContextValue | null>(null)

/**
 * Hook to access the ChartSurface context
 * @throws Error if used outside of ChartSurface
 */
export const useChartSurface = (): ChartSurfaceContextValue => {
  const context = useContext(ChartSurfaceContext)
  if (!context) {
    throw new Error('useChartSurface must be used within a ChartSurface')
  }
  return context
}

/**
 * Hook to access the ChartSurface registration functions without subscribing to data changes.
 * Layers that read data inside their draw callback (via render helpers) should prefer this.
 * @throws Error if used outside of ChartSurface
 */
export const useChartSurfaceStable = (): ChartSurfaceStableContextValue => {
  const context = useContext(ChartSurfaceStableContext)
  if (!context) {
    throw new Error('useChartSurfaceStable must be used within a ChartSurface')
  }
  return context
}
