export interface ChartLabelProps {
  show?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  position?: 'top' | 'center' | 'bottom' | 'inside' | 'outside';
  offset?: number;
  rotation?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  formatter?: (value: number | string) => string;
}

export interface ChartLabelRenderProps extends ChartLabelProps {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  width?: number;
  height?: number;
  value: number | string;
  index: number;
}

export const defaultChartLabelProps: Required<Omit<ChartLabelProps, 'formatter' | 'backgroundColor' | 'borderColor'>> & {
  formatter?: (value: number | string) => string;
  backgroundColor?: string;
  borderColor?: string;
} = {
  show: true,
  fontSize: 14,
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  color: '#1f2937',
  fontWeight: 'normal',
  position: 'top',
  offset: 5,
  rotation: 0,
  borderWidth: 0,
  borderRadius: 0,
  padding: 0,
  formatter: undefined,
  backgroundColor: undefined,
  borderColor: undefined,
};

export const renderChartLabel = (props: ChartLabelRenderProps): void => {
  const {
    context,
    x,
    y,
    width = 0,
    height = 0,
    value,
    show = defaultChartLabelProps.show,
    fontSize = defaultChartLabelProps.fontSize,
    fontFamily = defaultChartLabelProps.fontFamily,
    color = defaultChartLabelProps.color,
    fontWeight = defaultChartLabelProps.fontWeight,
    position = defaultChartLabelProps.position,
    offset = defaultChartLabelProps.offset,
    rotation = defaultChartLabelProps.rotation,
    backgroundColor,
    borderColor,
    borderWidth = defaultChartLabelProps.borderWidth,
    borderRadius = defaultChartLabelProps.borderRadius,
    padding = defaultChartLabelProps.padding,
    formatter,
  } = props;

  if (!show) return;

  // Format the value
  const text = formatter ? formatter(value) : value.toString();

  // Calculate position
  let labelX = x;
  let labelY = y;

  switch (position) {
    case 'top':
      labelX = x + width / 2;
      labelY = y - offset;
      break;
    case 'center':
      labelX = x + width / 2;
      labelY = y + height / 2 + fontSize / 3;
      break;
    case 'bottom':
      labelX = x + width / 2;
      labelY = y + height + offset + fontSize;
      break;
    case 'inside':
      labelX = x + width / 2;
      labelY = y + height - offset;
      break;
    case 'outside':
      labelX = x + width / 2;
      labelY = y - offset;
      break;
  }

  // Save context state
  context.save();

  // Apply rotation if specified
  if (rotation !== 0) {
    context.translate(labelX, labelY);
    context.rotate((rotation * Math.PI) / 180);
    labelX = 0;
    labelY = 0;
  }

  // Draw background if specified
  if (backgroundColor) {
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const textMetrics = context.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    const bgX = labelX - textWidth / 2 - padding;
    const bgY = labelY - textHeight / 2 - padding;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding * 2;

    context.fillStyle = backgroundColor;
    
    if (borderRadius > 0) {
      drawRoundedRect(context, bgX, bgY, bgWidth, bgHeight, borderRadius);
      context.fill();
    } else {
      context.fillRect(bgX, bgY, bgWidth, bgHeight);
    }

    // Draw border if specified
    if (borderColor && borderWidth > 0) {
      context.strokeStyle = borderColor;
      context.lineWidth = borderWidth;
      
      if (borderRadius > 0) {
        drawRoundedRect(context, bgX, bgY, bgWidth, bgHeight, borderRadius);
        context.stroke();
      } else {
        context.strokeRect(bgX, bgY, bgWidth, bgHeight);
      }
    }
  }

  // Draw text
  context.fillStyle = color;
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, labelX, labelY);

  // Restore context state
  context.restore();
};

// Helper function to draw rounded rectangles
function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
} 