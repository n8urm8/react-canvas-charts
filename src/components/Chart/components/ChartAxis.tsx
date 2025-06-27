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
  
  // Axis title properties
  title?: string;
  showTitle?: boolean;
  titleFontSize?: number;
  titleFontFamily?: string;
  titleColor?: string;
  titleFontWeight?: string;
  titlePadding?: number;
  titlePosition?: 'start' | 'center' | 'end';
  titleRotation?: number; // in degrees, useful for Y-axis titles
  titleOffsetX?: number;
  titleOffsetY?: number;
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
  canvasWidth?: number;
  canvasHeight?: number;
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
  
  // Axis title defaults
  title: '',
  showTitle: false,
  titleFontSize: 14,
  titleFontFamily: 'ui-sans-serif, system-ui, sans-serif',
  titleColor: '#1f2937',
  titleFontWeight: 'bold',
  titlePadding: 30,
  titlePosition: 'center',
  titleRotation: 0,
  titleOffsetX: 0,
  titleOffsetY: 0,
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
    canvasWidth,
    canvasHeight,
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
    
    // Title properties
    title = defaultChartAxisProps.title,
    showTitle = defaultChartAxisProps.showTitle,
    titleFontSize = defaultChartAxisProps.titleFontSize,
    titleFontFamily = defaultChartAxisProps.titleFontFamily,
    titleColor = defaultChartAxisProps.titleColor,
    titleFontWeight = defaultChartAxisProps.titleFontWeight,
    titlePadding = defaultChartAxisProps.titlePadding,
    titlePosition = defaultChartAxisProps.titlePosition,
    titleRotation = defaultChartAxisProps.titleRotation,
    titleOffsetX = defaultChartAxisProps.titleOffsetX,
    titleOffsetY = defaultChartAxisProps.titleOffsetY,
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

  // Draw axis title
  if (showTitle && title) {
    context.save();
    
    // Set title font and color
    context.fillStyle = titleColor;
    context.font = `${titleFontWeight} ${titleFontSize}px ${titleFontFamily}`;
    
    let titleX: number, titleY: number;
    
    if (type === 'x') {
      // X-axis title (horizontal axis)
      const axisLength = endX - startX;
      titleX = startX + axisLength / 2; // Center horizontally
      
      // Position at a fixed distance from the bottom of canvas or axis line
      if (canvasHeight) {
        // Position from bottom of canvas
        titleY = canvasHeight - 20;
      } else {
        // Fallback: position relative to axis
        titleY = startY + 35;
      }
      
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      
    } else {
      // Y-axis title (vertical axis)  
      const axisLength = startY - endY;
      
      // Calculate position to the left of the axis, considering ticks and labels
      let xOffset = 5; // Start with small base offset
      if (showTicks) xOffset += tickLength;
      if (showLabels) xOffset += 50; // Approximate space for Y-axis labels
      xOffset += 10; // Additional spacing for title
      
      titleX = startX - xOffset;
      titleY = endY + axisLength / 2; // Center vertically
      context.textAlign = 'center';
      context.textBaseline = 'middle';
    }
    
    // Apply custom offsets
    titleX += titleOffsetX;
    titleY += titleOffsetY;
    
    // Apply rotation if specified
    if (titleRotation !== 0) {
      context.translate(titleX, titleY);
      context.rotate((titleRotation * Math.PI) / 180);
      context.fillText(title, 0, 0);
    } else {
      context.fillText(title, titleX, titleY);
    }
    
    context.restore();
  }
}; 