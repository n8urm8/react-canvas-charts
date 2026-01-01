import React from 'react'
import { ChartSurface } from './ChartSurface/ChartSurface'
import type { ChartSurfaceProps } from './ChartSurface/ChartSurface.types'

export interface SparkSurfaceProps extends Omit<ChartSurfaceProps, 'margin'> {
  margin?: ChartSurfaceProps['margin']
}

/**
 * SparkSurface is a thin wrapper around ChartSurface with spark chart defaults.
 * Use it with the same composable pattern as regular charts:
 *
 * @example
 * <SparkSurface data={data} width={150} height={40}>
 *   <ChartLineSeries dataKey="value" color="#10b981" />
 *   <ChartCursorLayer />
 * </SparkSurface>
 */
export const SparkSurface: React.FC<SparkSurfaceProps> = ({
  margin = { top: 2, right: 2, bottom: 2, left: 2 },
  width = 150,
  height = 40,
  children,
  ...props
}) => {
  return (
    <ChartSurface margin={margin} width={width} height={height} {...props}>
      {children}
    </ChartSurface>
  )
}
