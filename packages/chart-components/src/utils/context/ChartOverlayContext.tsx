import { createContext, useContext } from 'react'
import { createPortal } from 'react-dom'

export const ChartOverlayContainerContext = createContext<HTMLDivElement | null>(null)

/**
 * Hook to access the chart overlay container
 */
export const useChartOverlayContainer = (): HTMLDivElement | null => useContext(ChartOverlayContainerContext)

/**
 * Portal component for rendering children into the chart overlay container
 */
export const ChartOverlayPortal = ({ children }: { children?: React.ReactNode }): React.ReactPortal | null => {
  const container = useChartOverlayContainer()
  if (!container || children == null) {
    return null
  }

  return createPortal(children, container)
}
