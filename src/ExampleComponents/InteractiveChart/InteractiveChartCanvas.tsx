import React from 'react';
import {
  ChartSurface,
  ChartGridLayer,
  ChartXAxis,
  ChartYAxis,
  ChartLineSeries,
  ChartPointSeries,
  ChartCursorLayer,
  ChartTooltipLayer,
  ChartAreaSeries,
  ChartValueLabels,
  ChartTitleLayer,
} from '../../components/Chart';
import type { ChartRecord, InteractiveChartConfig } from './types';

type InteractiveChartCanvasProps = {
  data: ChartRecord[];
  config: InteractiveChartConfig;
};

export const InteractiveChartCanvas: React.FC<InteractiveChartCanvasProps> = ({
  data,
  config,
}) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <ChartSurface
      data={data}
      xKey="label"
      yKeys={["value"]}
      width="100%"
      height={config.height}
      margin={{
        top: config.padding,
        right: config.padding,
        bottom: config.padding,
        left: config.padding,
      }}
      backgroundColor="#ffffff"
      defaultColors={[config.lineColor]}
    >
      {config.title ? <ChartTitleLayer title={config.title} /> : null}

      <ChartGridLayer
        show={config.showGrid}
        showVertical={config.showGrid}
        alignWithXAxisTicks
        color={config.gridColor}
      />
      <ChartXAxis
        show={config.showXAxis}
        title={config.xAxisTitle}
        showTitle={config.xAxisTitle.length > 0}
        tickStep={config.xAxisTickStep}
        maxTicks={config.xAxisMaxTicks > 0 ? config.xAxisMaxTicks : undefined}
      />
      <ChartYAxis
        show={config.showYAxis}
        title={config.yAxisTitle}
        showTitle={config.yAxisTitle.length > 0}
        titleRotation={config.yAxisTitle.length > 0 ? -90 : 0}
      />

      {config.fillArea ? (
        <ChartAreaSeries
          dataKey="value"
          color={config.lineColor}
          opacity={config.fillOpacity}
        />
      ) : null}

      {config.showLines ? (
        <ChartLineSeries
          dataKey="value"
          color={config.lineColor}
          lineWidth={config.lineWidth}
          smooth={config.lineSmooth}
          lineDash={config.lineDash}
        />
      ) : null}

      {config.showPoints ? (
        <ChartPointSeries
          dataKey="value"
          size={config.pointSize}
          shape={config.pointShape}
          color={config.pointColor}
          fillColor={config.pointColor}
        />
      ) : null}

      {config.showValues ? <ChartValueLabels dataKey="value" /> : null}

      {config.enableCursor ? (
        <ChartCursorLayer snapToDataPoints={config.cursorSnapToPoints} />
      ) : null}

      {config.enableTooltip ? (
        <ChartTooltipLayer
          position={config.tooltipPosition}
          template={config.tooltipTemplate}
        />
      ) : null}
    </ChartSurface>
  </div>
);
