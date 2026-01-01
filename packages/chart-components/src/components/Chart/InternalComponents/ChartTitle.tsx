export interface ChartTitleProps {
  title?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  position?: 'top' | 'bottom';
  marginBottom?: number;
  marginTop?: number;
}

export interface ChartTitleRenderProps extends ChartTitleProps {
  context: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  y: number;
}

export const defaultChartTitleProps: Required<Omit<ChartTitleProps, 'title'>> = {
  fontSize: 20,
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  color: '#1f2937',
  fontWeight: 'bold',
  position: 'top',
  marginBottom: 10,
  marginTop: 20,
};

export const renderChartTitle = (props: ChartTitleRenderProps): number => {
  const { 
    context, 
    canvasWidth, 
    title, 
    fontSize = defaultChartTitleProps.fontSize,
    fontFamily = defaultChartTitleProps.fontFamily,
    color = defaultChartTitleProps.color,
    fontWeight = defaultChartTitleProps.fontWeight,
    marginBottom = defaultChartTitleProps.marginBottom,
    y 
  } = props;
  
  if (!title) return 0;

  context.fillStyle = color;
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  context.textAlign = 'center';
  context.fillText(title, canvasWidth / 2, y);

  return fontSize + marginBottom;
}; 