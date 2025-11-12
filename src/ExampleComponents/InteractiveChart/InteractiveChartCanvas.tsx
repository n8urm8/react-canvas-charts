import React, { useMemo } from 'react';
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
}) => {
  const resolvedAxes = useMemo(() => {
    if (config.axes.length > 0) {
      return config.axes;
    }

    return [
      {
        id: 'axis-default',
        title: 'Value',
        position: 'left' as const,
      },
    ];
  }, [config.axes]);

  const axisIds = useMemo(() => resolvedAxes.map((axis) => axis.id), [resolvedAxes]);
  const fallbackAxisId = axisIds[0] ?? 'axis-default';

  const resolvedSeries = useMemo(
    () =>
      (config.series.length > 0
        ? config.series
        : [
            {
              id: 'series-default',
              name: 'Series 1',
              color: '#3b82f6',
              axisId: fallbackAxisId,
            },
          ]
      ).map((series, index) => ({
        ...series,
        axisId: axisIds.includes(series.axisId) ? series.axisId : fallbackAxisId,
        color: series.color || `hsl(${(index * 137.5) % 360}deg 70% 50%)`,
      })),
    [axisIds, config.series, fallbackAxisId]
  );

  const yKeys = useMemo(() => resolvedSeries.map((series) => series.id), [resolvedSeries]);
  const defaultColors = useMemo(
    () => resolvedSeries.map((series) => series.color),
    [resolvedSeries]
  );

  const seriesLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    resolvedSeries.forEach((series) => {
      map[series.id] = series.name || series.id;
    });
    return map;
  }, [resolvedSeries]);

  const valueScales = useMemo(
    () =>
      resolvedAxes.map((axis) => ({
        id: axis.id,
        dataKeys: resolvedSeries
          .filter((series) => series.axisId === axis.id)
          .map((series) => series.id),
      })),
    [resolvedAxes, resolvedSeries]
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <ChartSurface
        data={data}
        xKey="label"
        yKeys={yKeys}
        width="100%"
        height={config.height}
        margin={{
          top: config.padding,
          right: config.padding,
          bottom: config.padding,
          left: config.padding,
        }}
        backgroundColor="#ffffff"
        defaultColors={defaultColors}
        valueScales={valueScales}
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
          labelRotation={config.xAxisLabelRotation}
          labelOffsetY={config.xAxisLabelOffsetY}
        />
        {config.showYAxis
          ? resolvedAxes.map((axis) => (
              <ChartYAxis
                key={axis.id}
                show
                title={axis.title}
                showTitle={axis.title.length > 0}
                titleRotation={axis.title.length > 0 ? -90 : 0}
                scaleId={axis.id}
                side={axis.position}
                orientation={axis.position === 'right' ? 'right' : 'left'}
              />
            ))
          : null}

        {config.fillArea
          ? resolvedSeries.map((series) => (
              <ChartAreaSeries
                key={`area-${series.id}`}
                dataKey={series.id}
                color={series.color}
                opacity={config.fillOpacity}
              />
            ))
          : null}

        {config.showLines
          ? resolvedSeries.map((series) => (
              <ChartLineSeries
                key={`line-${series.id}`}
                dataKey={series.id}
                color={series.color}
                lineWidth={config.lineWidth}
                smooth={config.lineSmooth}
                lineDash={config.lineDash}
              />
            ))
          : null}

        {config.showPoints
          ? resolvedSeries.map((series) => (
              <ChartPointSeries
                key={`point-${series.id}`}
                dataKey={series.id}
                size={config.pointSize}
                shape={config.pointShape}
                color={series.color}
                fillColor={series.color}
              />
            ))
          : null}

        {config.showValues
          ? resolvedSeries.map((series) => (
              <ChartValueLabels key={`label-${series.id}`} dataKey={series.id} />
            ))
          : null}

        {config.enableCursor ? (
          <ChartCursorLayer snapToDataPoints={config.cursorSnapToPoints} />
        ) : null}

        {config.enableTooltip ? (
          <ChartTooltipLayer
            position={config.tooltipPosition}
            template={config.tooltipTemplate}
            seriesLabels={seriesLabelMap}
          />
        ) : null}
      </ChartSurface>
    </div>
  );
};
