import React from 'react'
import {
  ChartCustomTagsLayer,
  ChartGridLayer,
  ChartLineSeries,
  ChartSurface,
  ChartTitleLayer,
  ChartXAxis,
  ChartYAxis,
  type ChartCustomTag
} from 'react-canvas-charts'

type BeatFrequencyVisualizerProps = {
  data: Array<{ label: string; frequency: number }>
  markerTags: ChartCustomTag[]
}

export const BeatFrequencyVisualizer: React.FC<BeatFrequencyVisualizerProps> = ({ data, markerTags }) => {
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
        margin={{ top: 50, right: 24, bottom: 36, left: 50 }}
        backgroundColor="#040906"
        defaultColors={['#39ff14']}
      >
        <ChartTitleLayer title="Audio Frequency Visualizer" color="#8eff61" />
        <ChartGridLayer show showVertical color="rgba(57,255,20,0.12)" lineWidth={1} />
        <ChartXAxis
          show
          title="Realtime Samples"
          showTitle
          color="#39ff14"
          tickColor="#1f6a1f"
          labelColor="#7ef29b"
          titleColor="#a5ff97"
          maxTicks={8}
        />
        <ChartYAxis
          show
          title="Pitch Frequency"
          showTitle
          color="#39ff14"
          tickColor="#1f6a1f"
          labelColor="#7ef29b"
          titleColor="#a5ff97"
          tickCount={5}
          scaleId="pitch-frequency-scale"
          formatLabel={(value) => `${value.toFixed(1)} Hz`}
        />
        <ChartLineSeries dataKey="frequency" color="#61ff2b" lineWidth={2.3} smooth />
        <ChartCustomTagsLayer tags={markerTags} />
      </ChartSurface>
    </div>
  )
}
