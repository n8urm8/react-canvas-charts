import React, { useMemo, useCallback, useEffect } from 'react';
import {
  renderChartCursor,
  defaultChartCursorProps,
  type ChartCursorProps,
} from './components/ChartCursor';
import {
  LayerOrder,
  useChartLayer,
  useChartSurface,
  type ChartLayerRenderer,
} from './ChartSurface';
import { findNearestDataPoint } from './components/ChartCursor';

export type ChartCursorLayerProps = ChartCursorProps;

export const ChartCursorLayer: React.FC<ChartCursorLayerProps> = ({
  snapRadius = defaultChartCursorProps.snapRadius,
  snapToDataPoints = defaultChartCursorProps.snapToDataPoints,
  ...cursorProps
}) => {
  const {
    registerCursorOptions,
  } = useChartSurface();

  useEffect(() => {
    const unregister = registerCursorOptions({
      snapRadius,
      snapToDataPoints,
    });
    return unregister;
  }, [registerCursorOptions, snapRadius, snapToDataPoints]);

  const layerOptions = useMemo(() => ({ order: LayerOrder.overlays }), []);

  const draw = useCallback<ChartLayerRenderer>((context, helpers) => {
    if (!helpers.pointer) {
      return;
    }

    const nearest = snapToDataPoints
      ? findNearestDataPoint(
          helpers.pointer.x,
          helpers.pointer.y,
          helpers.dataPoints,
          snapRadius
        )
      : null;

    renderChartCursor({
      context,
      chartX: helpers.chartArea.x,
      chartY: helpers.chartArea.y,
      chartWidth: helpers.chartArea.width,
      chartHeight: helpers.chartArea.height,
      cursorX: helpers.pointer.x,
      cursorY: helpers.pointer.y,
      snappedX: nearest?.point.x,
      snappedY: nearest?.point.y,
      snapToDataPoints,
      snapRadius,
      ...cursorProps,
    });
  }, [cursorProps, snapRadius, snapToDataPoints]);

  useChartLayer(draw, layerOptions);

  return null;
};
