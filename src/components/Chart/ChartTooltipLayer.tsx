import React, { useMemo, useCallback } from 'react';
import {
  renderChartTooltip,
  type ChartTooltipProps,
  defaultChartTooltipProps,
} from './components/ChartTooltip';
import {
  LayerOrder,
  useChartLayer,
  type ChartLayerRenderer,
} from './ChartSurface';
import {
  findNearestDataPoint,
  defaultChartCursorProps,
} from './components/ChartCursor';

export interface ChartTooltipLayerProps extends ChartTooltipProps {
  snapRadius?: number;
  snapToDataPoints?: boolean;
}

export const ChartTooltipLayer: React.FC<ChartTooltipLayerProps> = ({
  snapRadius = defaultChartCursorProps.snapRadius,
  snapToDataPoints = true,
  ...tooltipProps
}) => {
  const layerOptions = useMemo(() => ({ order: LayerOrder.tooltip }), []);

  const draw = useCallback<ChartLayerRenderer>((context, helpers) => {
    if (!helpers.pointer) {
      return;
    }

    const activePoint = snapToDataPoints
      ? findNearestDataPoint(
          helpers.pointer.x,
          helpers.pointer.y,
          helpers.dataPoints,
          snapRadius
        )?.point ?? null
      : null;

    renderChartTooltip({
      context,
      dataPoint: activePoint,
      cursorX: helpers.pointer.x,
      cursorY: helpers.pointer.y,
      chartX: helpers.chartArea.x,
      chartY: helpers.chartArea.y,
      chartWidth: helpers.chartArea.width,
      chartHeight: helpers.chartArea.height,
      canvasWidth: helpers.canvasWidth,
      canvasHeight: helpers.canvasHeight,
      ...defaultChartTooltipProps,
      ...tooltipProps,
    });
  }, [snapRadius, snapToDataPoints, tooltipProps]);

  useChartLayer(draw, layerOptions);

  return null;
};
