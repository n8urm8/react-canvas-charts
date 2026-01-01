export interface ChartBarProps {
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  showShadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  gradient?: {
    enabled: boolean;
    startColor?: string;
    endColor?: string;
    direction?: 'vertical' | 'horizontal';
  };
}

export interface ChartBarRenderProps extends ChartBarProps {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  index: number;
}

export const defaultChartBarProps: Required<Omit<ChartBarProps, 'gradient'>> & { gradient: Required<NonNullable<ChartBarProps['gradient']>> } = {
  showBorder: false,
  borderColor: '#1f2937',
  borderWidth: 1,
  borderRadius: 0,
  showShadow: false,
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowBlur: 4,
  shadowOffsetX: 0,
  shadowOffsetY: 2,
  gradient: {
    enabled: false,
    startColor: '',
    endColor: '',
    direction: 'vertical'
  }
};

export const renderChartBar = (props: ChartBarRenderProps): void => {
  const {
    context,
    x,
    y,
    width,
    height,
    color,
    showBorder = defaultChartBarProps.showBorder,
    borderColor = defaultChartBarProps.borderColor,
    borderWidth = defaultChartBarProps.borderWidth,
    borderRadius = defaultChartBarProps.borderRadius,
    showShadow = defaultChartBarProps.showShadow,
    shadowColor = defaultChartBarProps.shadowColor,
    shadowBlur = defaultChartBarProps.shadowBlur,
    shadowOffsetX = defaultChartBarProps.shadowOffsetX,
    shadowOffsetY = defaultChartBarProps.shadowOffsetY,
    gradient = defaultChartBarProps.gradient,
  } = props;

  // Save current context state
  context.save();

  // Apply shadow if enabled
  if (showShadow) {
    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;
    context.shadowOffsetX = shadowOffsetX;
    context.shadowOffsetY = shadowOffsetY;
  }

  // Create fill style
  let fillStyle: string | CanvasGradient = color;
  
  if (gradient?.enabled) {
    const canvasGradient = gradient.direction === 'vertical'
      ? context.createLinearGradient(x, y, x, y + height)
      : context.createLinearGradient(x, y, x + width, y);
    
    canvasGradient.addColorStop(0, gradient.startColor || color);
    canvasGradient.addColorStop(1, gradient.endColor || color);
    fillStyle = canvasGradient;
  }

  context.fillStyle = fillStyle;

  // Draw bar with or without border radius
  if (borderRadius > 0) {
    drawRoundedRect(context, x, y, width, height, borderRadius);
    context.fill();
  } else {
    context.fillRect(x, y, width, height);
  }

  // Draw border if enabled
  if (showBorder) {
    context.shadowColor = 'transparent'; // Disable shadow for border
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    
    if (borderRadius > 0) {
      drawRoundedRect(context, x, y, width, height, borderRadius);
      context.stroke();
    } else {
      context.strokeRect(x, y, width, height);
    }
  }

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