import React, { useMemo, useCallback } from 'react';
import {
  renderChartGrid,
  type ChartGridProps,
} from './components/ChartGrid';
import {
  LayerOrder,
  useChartLayer,
  type ChartLayerRenderer,
} from './ChartSurface';

export interface ChartGridLayerProps extends ChartGridProps {
  alignWithXAxisTicks?: boolean;
  alignWithYAxisTicks?: boolean;
  yTickCount?: number;
}

export const ChartGridLayer: React.FC<ChartGridLayerProps> = ({
  alignWithXAxisTicks = true,
  alignWithYAxisTicks = true,
  yTickCount = 5,
  ...gridProps
}) => {
  const layerOptions = useMemo(() => ({ order: LayerOrder.grid }), []);

  const draw = useCallback<ChartLayerRenderer>((context, helpers) => {
    const verticalLines = (alignWithXAxisTicks && helpers.axisTicks.x)
      ? helpers.axisTicks.x.positions
      : helpers.labelPositions;

    const horizontalLines = (() => {
      if (alignWithYAxisTicks && helpers.axisTicks.y) {
        return helpers.axisTicks.y.positions;
      }

      const steps = Math.max(1, yTickCount);
      const values: number[] = [];
      const range = helpers.valueDomain.paddedMax - helpers.valueDomain.paddedMin;

      for (let i = 0; i <= steps; i += 1) {
        const value = helpers.valueDomain.paddedMin + (range * i) / steps;
        values.push(helpers.getYPosition(value));
      }

      return values;
    })();

    renderChartGrid({
      context,
      chartX: helpers.chartArea.x,
      chartY: helpers.chartArea.y,
      chartWidth: helpers.chartArea.width,
      chartHeight: helpers.chartArea.height,
      horizontalLines,
      verticalLines,
      ...gridProps,
    });
  }, [alignWithXAxisTicks, alignWithYAxisTicks, gridProps, yTickCount]);

  useChartLayer(draw, layerOptions);
  return null;
};
