import React from 'react'
import {
  ChartCustomTagsLayer,
  ChartGridLayer,
  ChartLineSeries,
  ChartSurface,
  ChartXAxis,
  ChartYAxis,
  type ChartCustomTag
} from 'react-canvas-charts'

type BeatFrequencyVisualizerProps = {
  data: Array<{ label: string; frequency: number }>
  markerTags: ChartCustomTag[]
  lineColor?: string
  gridColor?: string
}

export const BeatFrequencyVisualizer: React.FC<BeatFrequencyVisualizerProps> = ({
  data,
  markerTags,
  lineColor = '#7cff5f',
  gridColor = 'rgba(57,255,20,0.16)'
}) => {
  return (
    <div className="beat-visualizer-panel">
      <ChartSurface
        data={data}
        xKey="label"
        yKeys={['frequency']}
        valueScales={[
          {
            id: 'pitch-frequency-scale',
            dataKeys: ['frequency'],
            domain: {
              min: 55,
              max: 420
            }
          }
        ]}
        width="100%"
        height={240}
        margin={{ top: 12, right: 16, bottom: 12, left: 16 }}
        backgroundColor="#040906"
        defaultColors={[lineColor]}
      >
        <ChartGridLayer show showVertical color={gridColor} lineWidth={1} />
        <ChartXAxis show={false} />
        <ChartYAxis
          show={false}
          color="#39ff14"
          tickColor="#1f6a1f"
          labelColor="#7ef29b"
          tickCount={5}
          scaleId="pitch-frequency-scale"
          formatLabel={(value) => `${value.toFixed(1)} Hz`}
        />
        <ChartLineSeries dataKey="frequency" color={lineColor} lineWidth={3.2} smooth />
        <ChartCustomTagsLayer tags={markerTags} />
      </ChartSurface>
    </div>
  )
}
