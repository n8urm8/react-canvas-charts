import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  renderChartAxis,
  type ChartAxisProps,
} from './components/ChartAxis';
import {
  LayerOrder,
  useChartLayer,
  useChartSurface,
  type ChartLayerRenderer,
} from './ChartSurface';

export interface ChartYAxisProps extends ChartAxisProps {
  tickCount?: number;
  formatLabel?: (value: number) => string;
  scaleId?: string;
  side?: 'left' | 'right';
  registerTicks?: boolean;
}

export const ChartYAxis: React.FC<ChartYAxisProps> = ({
  tickCount = 5,
  formatLabel,
  scaleId,
  side = 'left',
  registerTicks,
  orientation,
  ...restAxisProps
}) => {
  const {
    chartArea,
    canvasSize,
    getScaleDomain,
    getYPositionForScale,
    defaultScaleId,
    setAxisTicks,
    registerYAxis,
    getYAxisIndex,
    yAxisCounts,
    yAxisSpacing,
  } = useChartSurface();

  const resolvedScaleId = useMemo(
    () => scaleId ?? defaultScaleId,
    [scaleId, defaultScaleId]
  );

  const axisOrientation = useMemo(
    () => orientation ?? (side === 'right' ? 'right' : 'left'),
    [orientation, side]
  );

  const [registrationId, setRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    const handle = registerYAxis(side);
    setRegistrationId(handle.id);
    return () => {
      handle.unregister();
    };
  }, [registerYAxis, side]);

  const layerOptions = useMemo(() => ({ order: LayerOrder.axes }), []);

  const domain = useMemo(
    () => getScaleDomain(resolvedScaleId),
    [getScaleDomain, resolvedScaleId]
  );

  const tickValues = useMemo(() => {
    const count = Math.max(1, tickCount);
    const range = domain.paddedMax - domain.paddedMin;

    if (range === 0) {
      return [domain.paddedMin];
    }

    const step = range / count;
    const values: number[] = [];

    for (let i = 0; i <= count; i += 1) {
      values.push(domain.paddedMin + step * i);
    }

    return values;
  }, [domain.paddedMax, domain.paddedMin, tickCount]);

  const getPositionForValue = useCallback(
    (value: number) => getYPositionForScale(resolvedScaleId, value),
    [getYPositionForScale, resolvedScaleId]
  );

  const tickPositions = useMemo(
    () => tickValues.map((value) => getPositionForValue(value)),
    [getPositionForValue, tickValues]
  );

  const tickLabels = useMemo(
    () =>
      tickValues.map((value) =>
        formatLabel
          ? formatLabel(value)
          : Math.round(value).toString()
      ),
    [formatLabel, tickValues]
  );

  const shouldRegisterTicks = registerTicks ?? resolvedScaleId === defaultScaleId;

  useEffect(() => {
    if (!shouldRegisterTicks) {
      return undefined;
    }

    setAxisTicks('y', {
      positions: tickPositions,
      labels: tickLabels,
      values: tickValues,
    });
    return () => {
      setAxisTicks('y', null);
    };
  }, [setAxisTicks, shouldRegisterTicks, tickLabels, tickPositions, tickValues]);

  const axisIndex = useMemo(() => {
    if (!registrationId) {
      return -1;
    }
    return getYAxisIndex(registrationId, side);
  }, [getYAxisIndex, registrationId, side]);

  const axisX = useMemo(() => {
    if (axisIndex < 0) {
      return side === 'right'
        ? chartArea.x + chartArea.width
        : chartArea.x;
    }

    if (side === 'left') {
      const totalSpace = yAxisCounts.left * yAxisSpacing;
      const base = chartArea.x - totalSpace;
      return base + (axisIndex + 0.5) * yAxisSpacing;
    }

    const base = chartArea.x + chartArea.width;
    return base + (axisIndex + 0.5) * yAxisSpacing;
  }, [axisIndex, chartArea.width, chartArea.x, side, yAxisCounts.left, yAxisSpacing]);

  const draw = useCallback<ChartLayerRenderer>((context) => {
    renderChartAxis({
      context,
      type: 'y',
      startX: axisX,
      startY: chartArea.y,
      endX: axisX,
      endY: chartArea.y + chartArea.height,
      labels: tickLabels,
      labelPositions: tickPositions,
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      orientation: axisOrientation,
      ...restAxisProps,
    });
  }, [
    axisOrientation,
    axisX,
    canvasSize.height,
    canvasSize.width,
    chartArea.height,
    chartArea.y,
    restAxisProps,
    tickLabels,
    tickPositions,
  ]);

  useChartLayer(draw, layerOptions);

  return null;
};
