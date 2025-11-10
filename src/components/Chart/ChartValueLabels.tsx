import React, { useMemo, useCallback } from 'react';
import {
  renderChartLabel,
  type ChartLabelProps,
} from './components/ChartLabel';
import {
  LayerOrder,
  useChartLayer,
  useChartSurface,
  type ChartLayerRenderer,
} from './ChartSurface';

export interface ChartValueLabelsProps extends ChartLabelProps {
  dataKey: string;
}

export const ChartValueLabels: React.FC<ChartValueLabelsProps> = ({
  dataKey,
  ...labelProps
}) => {
  const { normalizedData, getYPosition } = useChartSurface();

  const points = useMemo(
    () =>
      normalizedData
        .map((datum) => {
          const value = datum.values[dataKey];
          if (value === null || !Number.isFinite(value)) {
            return null;
          }
          return {
            x: datum.x,
            y: getYPosition(value),
            value,
          };
        })
        .filter((point): point is { x: number; y: number; value: number } => point !== null),
    [dataKey, getYPosition, normalizedData]
  );

  const draw = useCallback<ChartLayerRenderer>((context) => {
    points.forEach((point, index) => {
      renderChartLabel({
        context,
        x: point.x,
        y: point.y,
        value: point.value,
        index,
        width: 0,
        height: 0,
        ...labelProps,
      });
    });
  }, [labelProps, points]);

  const layerOptions = useMemo(() => ({ order: LayerOrder.points }), []);
  useChartLayer(draw, layerOptions);

  return null;
};
