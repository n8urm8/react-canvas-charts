import React, { useMemo, useCallback } from 'react';
import {
  renderChartLine,
  type ChartLineProps,
} from './components/ChartLine';
import {
  LayerOrder,
  useChartLayer,
  useChartSurface,
  type ChartLayerRenderer,
} from './ChartSurface';

export interface ChartLineSeriesProps extends ChartLineProps {
  dataKey: string;
  seriesIndex?: number;
}

export const ChartLineSeries: React.FC<ChartLineSeriesProps> = ({
  dataKey,
  color,
  seriesIndex = 0,
  ...lineProps
}) => {
  const { normalizedData, getYPosition, getColorForKey } = useChartSurface();

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
          };
        })
        .filter((point): point is { x: number; y: number } => point !== null),
    [dataKey, getYPosition, normalizedData]
  );

  const strokeColor = useMemo(
    () => color ?? getColorForKey(dataKey),
    [color, dataKey, getColorForKey]
  );

  const draw = useCallback<ChartLayerRenderer>((context) => {
    renderChartLine({
      context,
      points,
      color: strokeColor,
      index: seriesIndex,
      ...lineProps,
    });
  }, [lineProps, points, seriesIndex, strokeColor]);

  const layerOptions = useMemo(() => ({ order: LayerOrder.series }), []);
  useChartLayer(draw, layerOptions);

  return null;
};
