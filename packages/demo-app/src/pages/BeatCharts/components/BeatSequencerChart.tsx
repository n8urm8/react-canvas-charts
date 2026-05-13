import React from 'react'
import { ChartCustomTagsLayer, ChartGridLayer, ChartSurface, ChartXAxis, ChartYAxis, type ChartCustomTag } from 'react-canvas-charts'

type BeatSequencerChartProps = {
  hostRef: React.RefObject<HTMLDivElement | null>
  data: Array<{ label: string; seqPitch: number }>
  noteTags: ChartCustomTag[]
  totalSteps: number
  pitchRowCount: number
  chartHeight: number
  margin: { top: number; right: number; bottom: number; left: number }
  formatPitchLabel: (value: number) => string
  onCreateNote: (dataIndex: number, yValue: number) => void
}

export const BeatSequencerChart: React.FC<BeatSequencerChartProps> = ({
  hostRef,
  data,
  noteTags,
  totalSteps,
  pitchRowCount,
  chartHeight,
  margin,
  formatPitchLabel,
  onCreateNote
}) => {
  return (
    <div className="beat-sequencer-scroll" ref={hostRef}>
      <div className="beat-sequencer-chart-surface">
        <ChartSurface
          data={data}
          xKey="label"
          yKeys={['seqPitch']}
          valueScales={[
            {
              id: 'sequencer-pitch-scale',
              dataKeys: ['seqPitch'],
              domain: {
                min: 0,
                max: pitchRowCount - 1
              }
            }
          ]}
          width="100%"
          height={chartHeight}
          margin={margin}
          backgroundColor="#030b06"
          defaultColors={['#39ff14']}
        >
          <ChartGridLayer show showVertical color="rgba(57,255,20,0.12)" lineWidth={1} />
          <ChartXAxis
            show
            title="Time (Beats)"
            showTitle
            maxTicks={totalSteps + 1}
            color="rgba(57,255,20,0.6)"
            tickColor="rgba(57,255,20,0.4)"
            labelColor="#7ef29b"
            titleColor="#a5ff97"
          />
          <ChartYAxis
            show
            title="Pitch"
            showTitle
            scaleId="sequencer-pitch-scale"
            tickCount={pitchRowCount - 1}
            color="rgba(57,255,20,0.6)"
            tickColor="rgba(57,255,20,0.4)"
            labelColor="#7ef29b"
            titleColor="#a5ff97"
            formatLabel={formatPitchLabel}
          />
          <ChartCustomTagsLayer
            tags={noteTags}
            enableTagCreation
            creationDataKey="seqPitch"
            createTag={(placement) => {
              onCreateNote(placement.dataIndex, placement.yValue)
              return null
            }}
          />
        </ChartSurface>
      </div>
    </div>
  )
}
