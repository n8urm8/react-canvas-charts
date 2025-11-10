export interface DataPoint {
  id: string;
  label: string;
  value: number;
}

export type PointShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'star';

export type TooltipPosition = 'follow' | 'top' | 'bottom' | 'left' | 'right' | 'fixed';

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
  lineColor: string;
  lineSmooth: boolean;
  lineDash: number[];
  pointSize: number;
  pointShape: PointShape;
  pointColor: string;
  showGrid: boolean;
  gridColor: string;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxisTitle: string;
  yAxisTitle: string;
  xAxisTickStep: number;
  xAxisMaxTicks: number;
  cursorSnapToPoints: boolean;
  tooltipPosition: TooltipPosition;
  tooltipTemplate: string;
}

export interface ChartRecord extends Record<string, unknown> {
  label: string;
  value: number;
}
