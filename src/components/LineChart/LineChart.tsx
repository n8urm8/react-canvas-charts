import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';
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
  defaultChartCursorProps,
  type ChartTitleProps,
  type ChartAxisProps,
  type ChartGridProps,
  type ChartLineProps,
  type ChartPointProps,
  type ChartLabelProps,
  type ChartCursorProps,
  type ChartTooltipProps,
  type DataPoint,
} from '../Chart';

export interface LineChartData {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartDataSeries {
  name: string;
  data: LineChartData[];
  color?: string;
  lineComponent?: ChartLineProps;
  pointComponent?: ChartPointProps;
  labelComponent?: ChartLabelProps;
}

export interface LineChartProps {
  data: LineChartData[] | LineChartDataSeries[];
  width?: number | string;
  height?: number | string;
  title?: string;
  showPoints?: boolean;
  showLines?: boolean;
  showValues?: boolean;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
  style?: React.CSSProperties;
  padding?: number;
  titleComponent?: ChartTitleProps;
  xAxisComponent?: ChartAxisProps;
  yAxisComponent?: ChartAxisProps;
  gridComponent?: ChartGridProps;
  lineComponent?: ChartLineProps;
  pointComponent?: ChartPointProps;
  labelComponent?: ChartLabelProps;
  cursorComponent?: ChartCursorProps;
  tooltipComponent?: ChartTooltipProps;
  defaultColors?: string[];
  fillArea?: boolean;
  fillOpacity?: number;
  enableCursor?: boolean;
  enableTooltip?: boolean;
  onHover?: (dataPoint: DataPoint | null) => void;
  onClick?: (dataPoint: DataPoint | null) => void;
}

interface SeriesConfig {
  key: string;
  color?: string;
  lineProps?: ChartLineProps;
  pointProps?: ChartPointProps;
  labelProps?: ChartLabelProps;
  index: number;
}

const FALLBACK_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316',
];

const DEFAULT_SERIES_NAME = 'Series 1';

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 800,
  height = 400,
  title,
  showPoints = true,
  showLines = true,
  showValues = false,
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
  className,
  style,
  padding = 60,
  titleComponent = {},
  xAxisComponent = {},
  yAxisComponent = {},
  gridComponent = {},
  lineComponent = {},
  pointComponent = {},
  labelComponent = {},
  cursorComponent = {},
  tooltipComponent = {},
  defaultColors = FALLBACK_COLORS,
  fillArea = false,
  fillOpacity = 0.1,
  enableCursor = false,
  enableTooltip = false,
  onHover,
  onClick,
}) => {
  void textColor;
  const baseLineColor = lineComponent.color;

  const { seriesConfigs, seriesKeys, records } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        seriesConfigs: [] as SeriesConfig[],
        seriesKeys: [] as string[],
        records: [] as Record<string, number | string | null>[],
      };
    }

    const firstEntry = data[0] as LineChartDataSeries | LineChartData;
    const isMultiSeries =
      typeof firstEntry === 'object' &&
      firstEntry !== null &&
      'name' in firstEntry &&
      Array.isArray((firstEntry as LineChartDataSeries).data);

    const rawSeries: LineChartDataSeries[] = isMultiSeries
      ? (data as LineChartDataSeries[])
      : [
          {
            name: DEFAULT_SERIES_NAME,
            data: data as LineChartData[],
          },
        ];

    const resolvedSeries = rawSeries.map((series, index) => {
      const key = series.name && series.name.trim().length > 0
        ? series.name
        : `Series ${index + 1}`;

      return {
        key,
        data: Array.isArray(series.data) ? series.data : [],
        color: series.color,
        lineProps: series.lineComponent,
        pointProps: series.pointComponent,
        labelProps: series.labelComponent,
      };
    });

    const labelSet = new Set<string>();
    const labels: string[] = [];
    const valueMaps = resolvedSeries.map((series) => {
      const map = new Map<string, number>();
      series.data.forEach((point) => {
        if (!labelSet.has(point.label)) {
          labelSet.add(point.label);
          labels.push(point.label);
        }
        map.set(point.label, point.value);
      });
      return map;
    });

    const records = labels.map((label) => {
      const record: Record<string, number | string | null> = { label };
      valueMaps.forEach((map, seriesIndex) => {
        const value = map.get(label);
        record[resolvedSeries[seriesIndex].key] =
          typeof value === 'number' && Number.isFinite(value) ? value : null;
      });
      return record;
    });

    const seriesConfigs: SeriesConfig[] = resolvedSeries.map((series, index) => ({
      key: series.key,
      color: series.color,
      lineProps: series.lineProps,
      pointProps: series.pointProps,
      labelProps: series.labelProps,
      index,
    }));

    const seriesKeys = seriesConfigs.map((series) => series.key);

    return { seriesConfigs, seriesKeys, records };
  }, [data]);

  const resolvedColorPalette = useMemo(() => {
    if (seriesConfigs.length === 0) {
      return defaultColors;
    }

    const fallbackPalette = defaultColors.length > 0 ? defaultColors : FALLBACK_COLORS;

    return seriesConfigs.map((series, index) =>
      series.color ??
      series.lineProps?.color ??
      baseLineColor ??
      fallbackPalette[index % fallbackPalette.length]
    );
  }, [baseLineColor, defaultColors, seriesConfigs]);

  const chartMargin = useMemo(
    () => ({
      top: padding,
      right: padding,
      bottom: padding,
      left: padding,
    }),
    [padding]
  );

  const snapRadius = cursorComponent.snapRadius ?? defaultChartCursorProps.snapRadius;
  const snapToDataPoints =
    cursorComponent.snapToDataPoints ?? defaultChartCursorProps.snapToDataPoints;

  const surfaceClassName = cn(
    'bg-white rounded-lg shadow-sm border border-gray-200',
    className,
  );

  return (
    <ChartSurface
      data={records}
      xKey="label"
      yKeys={seriesKeys}
      width={width}
      height={height}
      margin={chartMargin}
      backgroundColor={backgroundColor}
      defaultColors={resolvedColorPalette}
      className={surfaceClassName}
      style={style}
      onHover={onHover}
      onClick={onClick}
    >
      {title ? (
        <ChartTitleLayer
          {...titleComponent}
          title={title}
        />
      ) : null}

      <ChartGridLayer {...gridComponent} />
      <ChartXAxis {...xAxisComponent} />
      <ChartYAxis {...yAxisComponent} />

      {fillArea && showLines && seriesConfigs.map((series) => {
        const seriesColor =
          series.lineProps?.color ??
          lineComponent.color ??
          series.color;

        return (
          <ChartAreaSeries
            key={`area-${series.key}`}
            dataKey={series.key}
            color={seriesColor}
            opacity={fillOpacity}
          />
        );
      })}

      {showLines && seriesConfigs.map((series) => {
        const mergedLineProps: ChartLineProps = {
          ...lineComponent,
          ...series.lineProps,
        };

        return (
          <ChartLineSeries
            key={`line-${series.key}`}
            dataKey={series.key}
            seriesIndex={series.index}
            {...mergedLineProps}
          />
        );
      })}

      {showPoints && seriesConfigs.map((series) => {
        const mergedPointProps: ChartPointProps = {
          ...pointComponent,
          ...series.pointProps,
        };

        return (
          <ChartPointSeries
            key={`points-${series.key}`}
            dataKey={series.key}
            {...mergedPointProps}
          />
        );
      })}

      {showValues && seriesConfigs.map((series) => (
        <ChartValueLabels
          key={`labels-${series.key}`}
          dataKey={series.key}
          {...labelComponent}
          {...series.labelProps}
        />
      ))}

      {enableCursor ? (
        <ChartCursorLayer
          {...cursorComponent}
          snapRadius={snapRadius}
          snapToDataPoints={snapToDataPoints}
        />
      ) : null}

      {enableTooltip ? (
        <ChartTooltipLayer
          {...tooltipComponent}
          snapRadius={snapRadius}
          snapToDataPoints={snapToDataPoints}
        />
      ) : null}
    </ChartSurface>
  );
};