import React from 'react'
import {
  ChartCustomTagsLayer,
  ChartGridLayer,
  ChartSurface,
  ChartXAxis,
  ChartYAxis,
  type ChartCustomTag,
  type ChartTagPlacement
} from 'react-canvas-charts'

type BeatSequencerChartProps = {
  hostRef: React.RefObject<HTMLDivElement | null>
  data: Array<{ label: string; seqPitch: number }>
  noteTags: ChartCustomTag[]
  totalSteps: number
  surfaceWidth: number
  pitchRowCount: number
  chartHeight: number
  margin: { top: number; right: number; bottom: number; left: number }
  formatPitchLabel: (value: number) => string
  onCreateNote: (placement: Pick<ChartTagPlacement, 'chartX' | 'chartY'>) => void
  onPreviewNotePlacement: (placement: Pick<ChartTagPlacement, 'chartX' | 'chartY'> | null) => void
}

export const BeatSequencerChart: React.FC<BeatSequencerChartProps> = ({
  hostRef,
  data,
  noteTags,
  totalSteps,
  surfaceWidth,
  pitchRowCount,
  chartHeight,
  margin,
  formatPitchLabel,
  onCreateNote,
  onPreviewNotePlacement
}) => {
  return (
    <div
      className="beat-sequencer-scroll"
      ref={hostRef}
      onPointerMove={(event) => {
        const hostRect = event.currentTarget.getBoundingClientRect()
        const chartX = event.clientX - hostRect.left + event.currentTarget.scrollLeft
        const chartY = event.clientY - hostRect.top
        onPreviewNotePlacement({ chartX, chartY })
      }}
      onPointerLeave={() => onPreviewNotePlacement(null)}
    >
      <div className="beat-sequencer-chart-surface" style={{ width: `${surfaceWidth}px` }}>
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
          width={surfaceWidth}
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
              onCreateNote({ chartX: placement.chartX, chartY: placement.chartY })
              return null
            }}
          />
        </ChartSurface>
      </div>
    </div>
  )
}
