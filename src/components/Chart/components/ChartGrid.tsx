export interface ChartGridProps {
  show?: boolean;
  showHorizontal?: boolean;
  showVertical?: boolean;
  color?: string;
  lineWidth?: number;
  lineDash?: number[];
  opacity?: number;
}

export interface ChartGridRenderProps extends ChartGridProps {
  context: CanvasRenderingContext2D;
  chartX: number;
  chartY: number;
  chartWidth: number;
  chartHeight: number;
  horizontalLines?: number[];
  verticalLines?: number[];
}

export const defaultChartGridProps: Required<ChartGridProps> = {
  show: true,
  showHorizontal: true,
  showVertical: false,
  color: '#e5e7eb',
  lineWidth: 0.5,
  lineDash: [],
  opacity: 1,
};

export const renderChartGrid = (props: ChartGridRenderProps): void => {
  const {
    context,
    chartX,
    chartY,
    chartWidth,
    chartHeight,
    horizontalLines = [],
    verticalLines = [],
    show = defaultChartGridProps.show,
    showHorizontal = defaultChartGridProps.showHorizontal,
    showVertical = defaultChartGridProps.showVertical,
    color = defaultChartGridProps.color,
    lineWidth = defaultChartGridProps.lineWidth,
    lineDash = defaultChartGridProps.lineDash,
    opacity = defaultChartGridProps.opacity,
  } = props;

  if (!show) return;

  // Save current context state
  context.save();

  // Set grid line style
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.globalAlpha = opacity;
  context.setLineDash(lineDash);

  // Draw horizontal grid lines
  if (showHorizontal) {
    horizontalLines.forEach((y) => {
      context.beginPath();
      context.moveTo(chartX, y);
      context.lineTo(chartX + chartWidth, y);
      context.stroke();
    });
  }

  // Draw vertical grid lines
  if (showVertical) {
    verticalLines.forEach((x) => {
      context.beginPath();
      context.moveTo(x, chartY);
      context.lineTo(x, chartY + chartHeight);
      context.stroke();
    });
  }

  // Restore context state
  context.restore();
}; 