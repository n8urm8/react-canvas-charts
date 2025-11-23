import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';
import { ChartOverlayPortal, useChartSurface } from './ChartSurface';

export type ChartLegendPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ChartLegendLayout = 'horizontal' | 'vertical';

export type ChartLegendPlacement =
  | { mode?: 'anchor'; position?: ChartLegendPosition }
  | { mode: 'coordinate'; x: number | string; y: number | string };

export interface ChartLegendItem {
  /** Optional chart data key to resolve colors from the surface context. */
  dataKey?: string;
  /** Label to display for the series. Falls back to the data key when omitted. */
  label?: string;
  /** Override color for the legend marker. */
  color?: string;
}

export interface ChartLegendProps {
  /** Controls where the legend appears. Defaults to `top-right` when omitted. */
  placement?: ChartLegendPlacement;
  /** Provide custom legend entries. When omitted, all current y-keys are shown. */
  items?: ChartLegendItem[];
  /** Layout direction for entries. */
  layout?: ChartLegendLayout;
  /** Optional title displayed above the legend entries. */
  title?: string;
  /** Additional class names for the container. */
  className?: string;
  /** Class names applied to each item row. */
  itemClassName?: string;
  /** Class names applied to the color marker. */
  markerClassName?: string;
  /** Size of the color marker in pixels. */
  markerSize?: number;
}

const POSITION_CLASS_MAP: Record<ChartLegendPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

const DEFAULT_MARKER_SIZE = 12;

export const ChartLegend: React.FC<ChartLegendProps> = ({
  placement,
  items,
  layout = 'horizontal',
  title,
  className,
  itemClassName,
  markerClassName,
  markerSize = DEFAULT_MARKER_SIZE,
}) => {
  const { yKeys, getColorForKey } = useChartSurface();

  const resolvedItems = useMemo(() => {
    const fallbackItems: ChartLegendItem[] = yKeys.map((key) => ({ dataKey: key, label: key }));
    const source = items && items.length > 0 ? items : fallbackItems;

    return source
      .map((item, index) => {
        const dataKey = item.dataKey ?? fallbackItems[index]?.dataKey;
        const label = item.label ?? dataKey ?? `Series ${index + 1}`;
        const color = item.color ?? (dataKey ? getColorForKey(dataKey) : undefined);

        if (!label) {
          return null;
        }

        return {
          key: dataKey ?? `legend-${index}`,
          label,
          color: color ?? '#999999',
        };
      })
      .filter((entry): entry is { key: string; label: string; color: string } => entry !== null);
  }, [getColorForKey, items, yKeys]);

  if (resolvedItems.length === 0) {
    return null;
  }

  const formatCoordinate = (value: number | string): string => {
    if (typeof value === 'number') {
      return `${value}px`;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return '0px';
    }

    const numericPattern = /^-?\d+(?:\.\d+)?$/;
    if (numericPattern.test(trimmed)) {
      return `${trimmed}px`;
    }

    return trimmed;
  };

  const resolvedPlacement: ChartLegendPlacement = placement ?? {
    mode: 'anchor',
    position: 'top-right',
  };

  const { positionClasses, coordinateStyle } =
    resolvedPlacement.mode === 'coordinate'
      ? {
          positionClasses: undefined,
          coordinateStyle: {
            top: formatCoordinate(resolvedPlacement.y),
            left: formatCoordinate(resolvedPlacement.x),
          } as React.CSSProperties,
        }
      : {
          positionClasses: POSITION_CLASS_MAP[resolvedPlacement.position ?? 'top-right'],
          coordinateStyle: undefined,
        };
  const isVertical = layout === 'vertical';

  return (
    <ChartOverlayPortal>
      <div
        className={cn(
          'absolute pointer-events-auto  px-3 py-2 text-sm text-gray-700',
          'flex',
          isVertical ? 'flex-col gap-2' : 'flex-row flex-wrap items-center gap-4',
          positionClasses,
          className,
        )}
        style={coordinateStyle}
      >
        {title ? (
          <div className="w-full text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </div>
        ) : null}
        {resolvedItems.map((entry) => (
          <div
            key={entry.key}
            className={cn('flex items-center gap-2', itemClassName)}
          >
            <span
              className={cn('inline-flex rounded-sm', markerClassName)}
              style={{
                backgroundColor: entry.color,
                width: markerSize,
                height: markerSize,
                borderRadius: markerSize / 4,
              }}
              aria-hidden="true"
            />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </ChartOverlayPortal>
  );
};

ChartLegend.displayName = 'ChartLegend';
