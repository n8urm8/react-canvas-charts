import type { ReactNode } from 'react';

export interface DataPoint {
  id: string;
  label: string;
  values: Record<string, number>;
}

export type PointShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'star';

export type TooltipPosition = 'follow' | 'top' | 'bottom' | 'left' | 'right' | 'fixed';

export interface InteractiveChartAxisConfig {
  id: string;
  title: string;
  position: 'left' | 'right';
}

export interface InteractiveChartSeriesConfig {
  id: string;
  name: string;
  color: string;
  axisId: string;
}

export interface InteractiveChartToolbarTool {
  id: string;
  label: string;
  icon?: ReactNode;
  tooltip?: string;
  disabled?: boolean;
  ariaLabel?: string;
  showLabel?: boolean;
}

export interface InteractiveChartToolbarConfig {
  enabled?: boolean;
  tools?: InteractiveChartToolbarTool[];
  multiSelect?: boolean;
  defaultActiveIds?: string[];
  position?: {
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
  };
}

export interface InteractiveChartConfig {
  title: string;
  width: number;
  height: number;
  padding: number;
  showPoints: boolean;
  showLines: boolean;
  showValues: boolean;
  fillArea: boolean;
  fillOpacity: number;
  enableCursor: boolean;
  enableTooltip: boolean;
  lineWidth: number;
  lineSmooth: boolean;
  lineDash: number[];
  pointSize: number;
  pointShape: PointShape;
  showGrid: boolean;
  gridColor: string;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxisTitle: string;
  xAxisTickStep: number;
  xAxisMaxTicks: number;
  xAxisLabelRotation: number;
  xAxisLabelOffsetY: number;
  cursorSnapToPoints: boolean;
  cursorSnapAlongYAxis: boolean;
  tooltipPosition: TooltipPosition;
  tooltipTemplate: string;
  axes: InteractiveChartAxisConfig[];
  series: InteractiveChartSeriesConfig[];
  toolbar?: InteractiveChartToolbarConfig;
}

export type ChartRecord = {
  label: string;
} & Record<string, number>;
