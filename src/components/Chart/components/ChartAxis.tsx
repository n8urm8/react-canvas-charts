export interface ChartAxisProps {
  show?: boolean;
  color?: string;
  lineWidth?: number;
  labelFontSize?: number;
  labelFontFamily?: string;
  labelColor?: string;
  showLabels?: boolean;
  showTicks?: boolean;
  tickLength?: number;
  tickColor?: string;
  labelPadding?: number;
}

export interface ChartAxisRenderProps extends ChartAxisProps {
  context: CanvasRenderingContext2D;
  type: 'x' | 'y';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  labels?: string[];
  labelPositions?: number[];
}

export const defaultChartAxisProps: Required<ChartAxisProps> = {
  show: true,
  color: '#1f2937',
  lineWidth: 1,
  labelFontSize: 12,
  labelFontFamily: 'ui-sans-serif, system-ui, sans-serif',
  labelColor: '#1f2937',
  showLabels: true,
  showTicks: true,
  tickLength: 5,
  tickColor: '#1f2937',
  labelPadding: 10,
};

export const renderChartAxis = (props: ChartAxisRenderProps): void => {
  const {
    context,
    type,
    startX,
    startY,
    endX,
    endY,
    labels = [],
    labelPositions = [],
    show = defaultChartAxisProps.show,
    color = defaultChartAxisProps.color,
    lineWidth = defaultChartAxisProps.lineWidth,
    labelFontSize = defaultChartAxisProps.labelFontSize,
    labelFontFamily = defaultChartAxisProps.labelFontFamily,
    labelColor = defaultChartAxisProps.labelColor,
    showLabels = defaultChartAxisProps.showLabels,
    showTicks = defaultChartAxisProps.showTicks,
    tickLength = defaultChartAxisProps.tickLength,
    tickColor = defaultChartAxisProps.tickColor,
    labelPadding = defaultChartAxisProps.labelPadding,
  } = props;

  if (!show) return;

  // Draw axis line
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();

  // Draw ticks and labels
  if (showTicks || showLabels) {
    labels.forEach((label, index) => {
      if (index >= labelPositions.length) return;

      const position = labelPositions[index];
      let tickX: number, tickY: number, labelX: number, labelY: number;

      if (type === 'x') {
        tickX = position;
        tickY = startY;
        labelX = position;
        labelY = startY + labelPadding + labelFontSize;
      } else {
        tickX = startX;
        tickY = position;
        labelX = startX - labelPadding;
        labelY = position + labelFontSize / 3;
      }

      // Draw tick
      if (showTicks) {
        context.strokeStyle = tickColor;
        context.lineWidth = 1;
        context.beginPath();
        if (type === 'x') {
          context.moveTo(tickX, tickY);
          context.lineTo(tickX, tickY + tickLength);
        } else {
          context.moveTo(tickX, tickY);
          context.lineTo(tickX - tickLength, tickY);
        }
        context.stroke();
      }

      // Draw label
      if (showLabels) {
        context.fillStyle = labelColor;
        context.font = `${labelFontSize}px ${labelFontFamily}`;
        context.textAlign = type === 'x' ? 'center' : 'right';
        context.fillText(label, labelX, labelY);
      }
    });
  }
}; 