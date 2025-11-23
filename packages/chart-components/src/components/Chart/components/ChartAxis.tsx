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
  tickStep?: number;
  maxTicks?: number;
  labelRotation?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
  
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
  orientation?: 'left' | 'right' | 'top' | 'bottom';
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
  tickStep: 1,
  maxTicks: Number.POSITIVE_INFINITY,
  
  // Axis title defaults
  title: '',
  showTitle: false,
  titleFontSize: 14,
  titleFontFamily: 'ui-sans-serif, system-ui, sans-serif',
  titleColor: '#1f2937',
  titleFontWeight: 'bold',
  titlePadding: 18,
  titlePosition: 'center',
  titleRotation: 0,
  titleOffsetX: 0,
  titleOffsetY: 0,
  orientation: 'bottom',
  labelRotation: 0,
  labelOffsetX: 0,
  labelOffsetY: 0,
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
    tickStep = defaultChartAxisProps.tickStep,
    maxTicks = defaultChartAxisProps.maxTicks,
    labelRotation = defaultChartAxisProps.labelRotation,
    labelOffsetX = defaultChartAxisProps.labelOffsetX,
    labelOffsetY = defaultChartAxisProps.labelOffsetY,
    
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
    orientation = defaultChartAxisProps.orientation,
  } = props;

  if (!show) return;

  const derivedOrientation = orientation
    ?? (type === 'x'
      ? startY <= endY ? 'bottom' : 'top'
      : 'left');

  const isHorizontal = type === 'x';
  const isTop = derivedOrientation === 'top';
  const isRight = derivedOrientation === 'right';
  let maxLabelWidth = 0;
  let maxLabelHeight = labelFontSize;
  const rotationRadians = (labelRotation * Math.PI) / 180;
  const sinRotation = Math.sin(rotationRadians);
  const cosRotation = Math.cos(rotationRadians);
  const absSin = Math.abs(sinRotation);
  const absCos = Math.abs(cosRotation);

  // Draw axis line
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();

  // Draw ticks and labels
  if (showTicks || showLabels) {
    // Determine how frequently to render ticks while always including the axis edges.
    const normalizedStep = Math.max(1, Math.round(tickStep) || 1);
    const autoStep = Number.isFinite(maxTicks) && maxTicks > 0
      ? Math.max(1, Math.ceil(labels.length / maxTicks))
      : 1;
    const effectiveStep = Math.max(normalizedStep, autoStep);

    labels.forEach((label, index) => {
      if (index >= labelPositions.length) return;
      const isEdgeLabel = index === 0 || index === labels.length - 1;
      const shouldRenderTick = (index % effectiveStep === 0) || isEdgeLabel;
      if (!shouldRenderTick) return;

      const position = labelPositions[index];
      let tickX: number, tickY: number, labelX: number, labelY: number;

      if (isHorizontal) {
        tickX = position;
        tickY = startY;
        labelX = position;
        labelY = isTop
          ? startY - labelPadding
          : startY + labelPadding + labelFontSize;
      } else {
        tickX = startX;
        tickY = position;
        labelX = isRight
          ? startX + labelPadding
          : startX - labelPadding;
        labelY = position + labelFontSize / 3;
      }

      // Draw tick
      if (showTicks) {
        context.strokeStyle = tickColor;
        context.lineWidth = 1;
        context.beginPath();
        if (isHorizontal) {
          const direction = isTop ? -1 : 1;
          context.moveTo(tickX, tickY);
          context.lineTo(tickX, tickY + direction * tickLength);
        } else {
          context.moveTo(tickX, tickY);
          const direction = isRight ? 1 : -1;
          context.lineTo(tickX + direction * tickLength, tickY);
        }
        context.stroke();
      }

      // Draw label
      if (showLabels) {
        context.fillStyle = labelColor;
        context.font = `${labelFontSize}px ${labelFontFamily}`;
        context.textAlign = isHorizontal ? 'center' : isRight ? 'left' : 'right';
        context.textBaseline = isHorizontal ? (isTop ? 'bottom' : 'top') : 'middle';

        const textWidth = context.measureText(label).width;
        const rotatedWidth = rotationRadians !== 0
          ? absCos * textWidth + absSin * labelFontSize
          : textWidth;
        const rotatedHeight = rotationRadians !== 0
          ? absSin * textWidth + absCos * labelFontSize
          : labelFontSize;

        if (isHorizontal) {
          if (rotatedHeight > maxLabelHeight) {
            maxLabelHeight = rotatedHeight;
          }
        } else if (rotatedWidth > maxLabelWidth) {
          maxLabelWidth = rotatedWidth;
        }

        let drawX = labelX;
        let drawY = labelY;

        if (isHorizontal && rotationRadians !== 0) {
          const verticalRise = absSin * textWidth;
          drawY = isTop ? drawY - verticalRise : drawY + verticalRise;
        }

        drawX += labelOffsetX;
        drawY += labelOffsetY;

        context.save();
        context.translate(drawX, drawY);
        if (rotationRadians !== 0) {
          context.rotate(rotationRadians);
        }
        context.fillText(label, 0, 0);
        context.restore();
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
    
    if (isHorizontal) {
      // X-axis title (horizontal axis)
      const axisLength = endX - startX;
      const offsetAdjustment = isTop
        ? Math.max(0, -labelOffsetY)
        : Math.max(0, labelOffsetY);
      const labelSpace = showLabels
        ? labelPadding + maxLabelHeight + offsetAdjustment
        : 0;
      const tickSpace = showTicks ? tickLength : 0;
      const offset = labelSpace + tickSpace;
      const baseY = isTop
        ? startY - titlePadding - offset
        : startY + titlePadding + offset;

      if (titlePosition === 'start') {
        titleX = startX;
        context.textAlign = 'left';
      } else if (titlePosition === 'end') {
        titleX = endX;
        context.textAlign = 'right';
      } else {
        titleX = startX + axisLength / 2;
        context.textAlign = 'center';
      }

      titleY = baseY;
      context.textBaseline = isTop ? 'bottom' : 'top';
    } else {
      // Y-axis title (vertical axis)
      const axisLength = startY - endY;

      // Calculate position to the left of the axis, considering ticks, labels, and padding
  let xOffset = titlePadding;
  if (showTicks) xOffset += tickLength;
  if (showLabels) xOffset += labelPadding + maxLabelWidth + Math.abs(labelOffsetX);

      if (isRight) {
        titleX = startX + xOffset;
      } else {
        titleX = startX - xOffset;
      }

      if (titlePosition === 'start') {
        titleY = startY;
      } else if (titlePosition === 'end') {
        titleY = endY;
      } else {
        titleY = endY + axisLength / 2;
      }

      context.textAlign = 'center';
      context.textBaseline = 'middle';
    }

    if (typeof canvasWidth === 'number') {
      titleX = Math.min(Math.max(titleX, 0), canvasWidth);
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