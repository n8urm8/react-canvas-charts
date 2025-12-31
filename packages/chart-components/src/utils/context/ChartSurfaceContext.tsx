import { createContext, useContext } from 'react'
import type { ChartSurfaceContextValue } from '../../components/Chart/ChartSurface/ChartSurface.types'

export const ChartSurfaceContext = createContext<ChartSurfaceContextValue | null>(null)

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
