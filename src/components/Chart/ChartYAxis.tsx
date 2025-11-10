import React, { useMemo, useCallback, useEffect } from 'react';
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
}

export const ChartYAxis: React.FC<ChartYAxisProps> = ({
  tickCount = 5,
  formatLabel,
  ...axisProps
}) => {
  const {
    chartArea,
    canvasSize,
    valueDomain,
    getYPosition,
    setAxisTicks,
  } = useChartSurface();

  const layerOptions = useMemo(() => ({ order: LayerOrder.axes }), []);

  const tickValues = useMemo(() => {
    const count = Math.max(1, tickCount);
    const range = valueDomain.paddedMax - valueDomain.paddedMin;

    if (range === 0) {
      return [valueDomain.paddedMin];
    }

    const step = range / count;
    const values: number[] = [];

    for (let i = 0; i <= count; i += 1) {
      values.push(valueDomain.paddedMin + step * i);
    }

    return values;
  }, [tickCount, valueDomain.paddedMax, valueDomain.paddedMin]);

  const tickPositions = useMemo(
    () => tickValues.map((value) => getYPosition(value)),
    [getYPosition, tickValues]
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

  useEffect(() => {
    setAxisTicks('y', {
      positions: tickPositions,
      labels: tickLabels,
      values: tickValues,
    });
    return () => {
      setAxisTicks('y', null);
    };
  }, [setAxisTicks, tickLabels, tickPositions, tickValues]);

  const draw = useCallback<ChartLayerRenderer>((context) => {
    renderChartAxis({
      context,
      type: 'y',
      startX: chartArea.x,
      startY: chartArea.y,
      endX: chartArea.x,
      endY: chartArea.y + chartArea.height,
      labels: tickLabels,
      labelPositions: tickPositions,
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      ...axisProps,
    });
  }, [
    axisProps,
    canvasSize.height,
    canvasSize.width,
    chartArea.height,
    chartArea.x,
    chartArea.y,
    tickLabels,
    tickPositions,
  ]);

  useChartLayer(draw, layerOptions);

  return null;
};
