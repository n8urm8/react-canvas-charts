import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { DataPoint as CursorDataPoint } from './components/ChartCursor';
import { defaultChartCursorProps, findNearestDataPoint } from './components/ChartCursor';
import { CanvasWrapper } from '../CanvasWrapper/CanvasWrapper';
import { cn } from '../../utils/cn';

export interface ValueDomain {
  min: number;
  max: number;
  paddedMin: number;
  paddedMax: number;
}

export interface NormalizedDatum {
  index: number;
  label: string;
  x: number;
  values: Record<string, number | null>;
  raw: Record<string, unknown>;
}

export interface ChartSelectionSeriesEntry {
  index: number;
  label: string;
  value: number | null;
}

export interface ChartSelectionSeriesRange {
  min: ChartSelectionSeriesEntry;
  max: ChartSelectionSeriesEntry;
}

export interface ChartSelectionResult {
  minIndex: number;
  maxIndex: number;
  minLabel: string;
  maxLabel: string;
  series: Record<string, ChartSelectionSeriesRange>;
  rangePixels: { start: number; end: number };
}

export interface ChartArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AxisTickDescriptor {
  positions: number[];
  labels: string[];
  values?: number[];
  indices?: number[];
}

export interface AxisTickState {
  x: AxisTickDescriptor | null;
  y: AxisTickDescriptor | null;
}

interface CursorOptions {
  snapRadius: number;
  snapToDataPoints: boolean;
  snapAlongYAxis: boolean;
}

const defaultCursorOptions: CursorOptions = {
  snapRadius: defaultChartCursorProps.snapRadius,
  snapToDataPoints: defaultChartCursorProps.snapToDataPoints,
  snapAlongYAxis: defaultChartCursorProps.snapAlongYAxis,
};

export interface ChartPointer {
  x: number;
  y: number;
}

export interface ChartSurfaceRenderHelpers {
  canvasWidth: number;
  canvasHeight: number;
  chartArea: ChartArea;
  labels: string[];
  labelPositions: number[];
  normalizedData: NormalizedDatum[];
  getXPosition: (index: number) => number;
  getYPosition: (value: number) => number;
  getYPositionForScale: (scaleId: string, value: number) => number;
  getYPositionForKey: (dataKey: string, value: number) => number;
  getScaleDomain: (scaleId: string) => ValueDomain;
  getScaleIdForKey: (dataKey: string) => string;
  defaultScaleId: string;
  colorForKey: (dataKey: string, fallback?: string) => string;
  pointer: ChartPointer | null;
  dataPoints: CursorDataPoint[];
  axisTicks: AxisTickState;
  valueDomain: ValueDomain;
  valueDomainsByScale: Record<string, ValueDomain>;
  renderCycle: number;
  yAxisCounts: { left: number; right: number };
}

export type ChartLayerRenderer = (
  context: CanvasRenderingContext2D,
  helpers: ChartSurfaceRenderHelpers
) => void;

export interface ChartLayerOptions {
  order?: number;
}

interface ChartLayer {
  id: string;
  order: number;
  draw: ChartLayerRenderer;
}

export interface ValueScaleDefinition {
  id?: string;
  dataKeys?: string[];
  domain?: {
    min?: number;
    max?: number;
  };
}

export interface ChartSurfaceContextValue {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  labels: string[];
  labelPositions: number[];
  chartArea: ChartArea;
  canvasSize: { width: number; height: number };
  valueDomain: ValueDomain;
  valueDomainsByScale: Record<string, ValueDomain>;
  getXPosition: (index: number) => number;
  getYPosition: (value: number) => number;
  getYPositionForScale: (scaleId: string, value: number) => number;
  getYPositionForKey: (dataKey: string, value: number) => number;
  getScaleDomain: (scaleId: string) => ValueDomain;
  getScaleIdForKey: (dataKey: string) => string;
  defaultScaleId: string;
  normalizedData: NormalizedDatum[];
  dataPoints: CursorDataPoint[];
  axisTicks: AxisTickState;
  registerLayer: (
    draw: ChartLayerRenderer,
    options?: ChartLayerOptions
  ) => ChartLayerHandle;
  setAxisTicks: (axis: 'x' | 'y', descriptor: AxisTickDescriptor | null) => void;
  getColorForKey: (dataKey: string, fallback?: string) => string;
  registerCursorOptions: (options: Partial<CursorOptions>) => () => void;
  requestRender: () => void;
  registerYAxis: (side: 'left' | 'right') => { id: string; unregister: () => void };
  getYAxisIndex: (id: string, side: 'left' | 'right') => number;
  yAxisCounts: { left: number; right: number };
  yAxisSpacing: number;
}

export interface ChartLayerHandle {
  update: (draw: ChartLayerRenderer, options?: ChartLayerOptions) => void;
  unregister: () => void;
}

const ChartSurfaceContext = createContext<ChartSurfaceContextValue | null>(null);
const ChartOverlayContainerContext = createContext<HTMLDivElement | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useChartSurface = (): ChartSurfaceContextValue => {
  const context = useContext(ChartSurfaceContext);
  if (!context) {
    throw new Error('useChartSurface must be used within a ChartSurface');
  }
  return context;
};

const useChartOverlayContainer = (): HTMLDivElement | null =>
  useContext(ChartOverlayContainerContext);

export const ChartOverlayPortal = ({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactPortal | null => {
  const container = useChartOverlayContainer();
  if (!container || children == null) {
    return null;
  }

  return createPortal(children, container);
};

export const LayerOrder = {
  background: 0,
  grid: 10,
  area: 20,
  series: 30,
  points: 40,
  axes: 50,
  overlays: 60,
  tooltip: 70,
} as const;

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartSurfaceProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys?: string[];
  width?: number | string;
  height?: number | string;
  margin?: Partial<ChartMargin>;
  backgroundColor?: string;
  defaultColors?: string[];
  className?: string;
  style?: React.CSSProperties;
  onHover?: (dataPoint: CursorDataPoint | null) => void;
  onClick?: (dataPoint: CursorDataPoint | null) => void;
  onSelectionChange?: (selection: ChartSelectionResult | null) => void;
  valueScales?: ValueScaleDefinition[];
  children?: React.ReactNode;
  selectionResetKey?: number;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316',
];

const DEFAULT_MARGIN: ChartMargin = {
  top: 40,
  right: 40,
  bottom: 48,
  left: 56,
};

const DEFAULT_VALUE_DOMAIN: ValueDomain = {
  min: 0,
  max: 1,
  paddedMin: -0.1,
  paddedMax: 1.1,
};

const Y_AXIS_BAND_WIDTH = 48;
const MIN_SELECTION_WIDTH = 4;

const shallowEqualArray = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const mergeMargin = (custom?: ChartSurfaceProps['margin']): ChartMargin => ({
  top: custom?.top ?? DEFAULT_MARGIN.top,
  right: custom?.right ?? DEFAULT_MARGIN.right,
  bottom: custom?.bottom ?? DEFAULT_MARGIN.bottom,
  left: custom?.left ?? DEFAULT_MARGIN.left,
});

export const ChartSurface: React.FC<ChartSurfaceProps> = ({
  data,
  xKey,
  yKeys: yKeysProp,
  width = 800,
  height = 400,
  margin,
  backgroundColor = '#ffffff',
  defaultColors = DEFAULT_COLORS,
  className,
  style,
  onHover,
  onClick,
  onSelectionChange,
  valueScales,
  children,
  selectionResetKey,
}) => {
  const resolvedMargin = useMemo(() => mergeMargin(margin), [margin]);

  const resolvedYKeys = useMemo(() => {
    if (yKeysProp && yKeysProp.length > 0) {
      return yKeysProp;
    }

    const numericKeys = new Set<string>();

    data.forEach((datum) => {
      Object.entries(datum).forEach(([key, value]) => {
        if (key === xKey) return;
        if (typeof value === 'number' && Number.isFinite(value)) {
          numericKeys.add(key);
        }
      });
    });

    return Array.from(numericKeys);
  }, [data, xKey, yKeysProp]);

  const [layers, setLayers] = useState<ChartLayer[]>([]);
  const layerIdRef = useRef(0);

  const [axisTicks, setAxisTickState] = useState<AxisTickState>({
    x: null,
    y: null,
  });

  const cursorOptionsMapRef = useRef(new Map<string, Partial<CursorOptions>>());
  const [cursorOptions, setCursorOptions] = useState<CursorOptions>(
    defaultCursorOptions
  );

  const yAxisRegistryRef = useRef<{ left: string[]; right: string[] }>({
    left: [],
    right: [],
  });
  const yAxisIdRef = useRef(0);
  const [yAxisCounts, setYAxisCounts] = useState<{ left: number; right: number}>(
    () => ({ left: 0, right: 0 })
  );

  const recomputeCursorOptions = useCallback(() => {
    const aggregated: CursorOptions = { ...defaultCursorOptions };

    cursorOptionsMapRef.current.forEach((options) => {
      if (options.snapRadius !== undefined) {
        aggregated.snapRadius = options.snapRadius;
      }
      if (options.snapToDataPoints !== undefined) {
        aggregated.snapToDataPoints = options.snapToDataPoints;
      }
      if (options.snapAlongYAxis !== undefined) {
        aggregated.snapAlongYAxis = options.snapAlongYAxis;
      }
    });

    setCursorOptions((prev) =>
      prev.snapRadius === aggregated.snapRadius &&
      prev.snapToDataPoints === aggregated.snapToDataPoints &&
      prev.snapAlongYAxis === aggregated.snapAlongYAxis
        ? prev
        : aggregated
    );
  }, []);

  const registerCursorOptions = useCallback(
    (options: Partial<CursorOptions>) => {
      const id = `cursor-${cursorOptionsMapRef.current.size + 1}`;
      cursorOptionsMapRef.current.set(id, options);
      recomputeCursorOptions();

      return () => {
        cursorOptionsMapRef.current.delete(id);
        recomputeCursorOptions();
      };
    },
    [recomputeCursorOptions]
  );

  const registerYAxis = useCallback((side: 'left' | 'right') => {
    const id = `y-axis-${(yAxisIdRef.current += 1)}`;
    const registry = yAxisRegistryRef.current;
    registry[side] = [...registry[side], id];
    setYAxisCounts({
      left: registry.left.length,
      right: registry.right.length,
    });

    return {
      id,
      unregister: () => {
        const current = yAxisRegistryRef.current;
        current[side] = current[side].filter((axisId) => axisId !== id);
        setYAxisCounts({
          left: current.left.length,
          right: current.right.length,
        });
      },
    };
  }, []);

  const getYAxisIndex = useCallback((id: string, side: 'left' | 'right') => {
    const registry = yAxisRegistryRef.current;
    return registry[side].indexOf(id);
  }, []);

  const registerLayer = useCallback(
    (draw: ChartLayerRenderer, options: ChartLayerOptions = {}) => {
      const id = `layer-${layerIdRef.current += 1}`;
      const order = options.order ?? 0;

      setLayers((prev) => [...prev, { id, order, draw }]);

      const update: ChartLayerHandle['update'] = (nextDraw, nextOptions) => {
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === id
              ? {
                  id,
                  order: nextOptions?.order ?? layer.order,
                  draw: nextDraw,
                }
              : layer
          )
        );
      };

      const unregister = () => {
        setLayers((prev) => prev.filter((layer) => layer.id !== id));
      };

      return { update, unregister };
    },
    []
  );

  const setAxisTicks = useCallback(
    (axis: 'x' | 'y', descriptor: AxisTickDescriptor | null) => {
      setAxisTickState((prev) => {
        const next: AxisTickState = axis === 'x'
          ? { ...prev, x: descriptor }
          : { ...prev, y: descriptor };

        if (axis === 'x') {
          const prevPositions = prev.x?.positions ?? [];
          const nextPositions = descriptor?.positions ?? [];
          if (shallowEqualArray(prevPositions, nextPositions)) {
            return prev;
          }
        } else {
          const prevPositions = prev.y?.positions ?? [];
          const nextPositions = descriptor?.positions ?? [];
          if (shallowEqualArray(prevPositions, nextPositions)) {
            return prev;
          }
        }

        return next;
      });
    },
    []
  );

  const pointerRef = useRef<ChartPointer | null>(null);
  const [canvasSize, setCanvasSize] = useState({
    width: typeof width === 'number' ? width : 0,
    height: typeof height === 'number' ? height : 0,
  });
  const [overlayContainer, setOverlayContainer] = useState<HTMLDivElement | null>(null);
  const overlayContainerRef = useCallback((node: HTMLDivElement | null) => {
    setOverlayContainer(node);
  }, []);
  const cursorOptionsRef = useRef(cursorOptions);
  useEffect(() => {
    cursorOptionsRef.current = cursorOptions;
  }, [cursorOptions]);

  const labels = useMemo(
    () => data.map((datum) => String(datum[xKey] ?? '')),
    [data, xKey]
  );

  const chartArea = useMemo<ChartArea>(
    () => {
      const leftOffset = Math.max(0, yAxisCounts.left - 1) * Y_AXIS_BAND_WIDTH;
      const rightOffset = Math.max(0, yAxisCounts.right - 1) * Y_AXIS_BAND_WIDTH;

      return {
        x: resolvedMargin.left + leftOffset,
      y: resolvedMargin.top,
      width: Math.max(
        0,
        canvasSize.width -
          resolvedMargin.left -
          resolvedMargin.right -
            leftOffset -
            rightOffset
      ),
      height: Math.max(
        0,
        canvasSize.height - resolvedMargin.top - resolvedMargin.bottom
        ),
      };
    },
    [
      canvasSize.height,
      canvasSize.width,
      resolvedMargin.bottom,
      resolvedMargin.left,
      resolvedMargin.right,
      resolvedMargin.top,
      yAxisCounts.left,
      yAxisCounts.right,
    ]
  );

  const perKeyStats = useMemo(() => {
    const stats = new Map<string, { min: number; max: number }>();

    resolvedYKeys.forEach((key) => {
      stats.set(key, {
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
      });
    });

    data.forEach((datum) => {
      resolvedYKeys.forEach((key) => {
        const rawValue = datum[key];
        const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        if (Number.isFinite(numeric)) {
          const entry = stats.get(key);
          if (entry) {
            entry.min = Math.min(entry.min, numeric);
            entry.max = Math.max(entry.max, numeric);
          }
        }
      });
    });

    const finalized = new Map<string, { min: number; max: number }>();

    stats.forEach((value, key) => {
      let min = value.min;
      let max = value.max;

      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        min = 0;
        max = 1;
      }

      if (min === max) {
        min -= 1;
        max += 1;
      }

      finalized.set(key, { min, max });
    });

    return finalized;
  }, [data, resolvedYKeys]);

  const valueScaleState = useMemo<{
    scales: Array<{
      id: string;
      dataKeys: string[];
      domain?: ValueScaleDefinition['domain'];
    }>;
    assignments: Map<string, string>;
  }>(() => {
    const assignments = new Map<string, string>();

    if (valueScales && valueScales.length > 0) {
      const sanitized = valueScales.map((scale, index) => {
        const id = scale.id ?? `scale-${index + 1}`;
        const uniqueKeys = Array.from(
          new Set(scale.dataKeys && scale.dataKeys.length > 0 ? scale.dataKeys : resolvedYKeys)
        );
        uniqueKeys.forEach((key) => assignments.set(key, id));
        return {
          id,
          dataKeys: uniqueKeys,
          domain: scale.domain,
        };
      });

      if (sanitized.length === 0) {
        sanitized.push({ id: 'default', dataKeys: [...resolvedYKeys], domain: undefined });
      }

      resolvedYKeys.forEach((key) => {
        if (!assignments.has(key)) {
          const fallback = sanitized[0];
          fallback.dataKeys = Array.from(new Set([...fallback.dataKeys, key]));
          assignments.set(key, fallback.id);
        }
      });

      return { scales: sanitized, assignments };
    }

    const fallback = [{ id: 'default', dataKeys: [...resolvedYKeys], domain: undefined }];
    resolvedYKeys.forEach((key) => assignments.set(key, 'default'));
    return { scales: fallback, assignments };
  }, [resolvedYKeys, valueScales]);

  const resolvedValueScales = valueScaleState.scales;
  const scaleAssignments = valueScaleState.assignments;

  const valueDomainsByScale = useMemo<Record<string, ValueDomain>>(() => {
    const domains: Record<string, ValueDomain> = {};

    const computeDomain = (minValue: number, maxValue: number) => {
      let min = minValue;
      let max = maxValue;

      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        min = 0;
        max = 1;
      }

      if (min === max) {
        min -= 1;
        max += 1;
      }

      const range = max - min;
      const padding = range === 0 ? 1 : range * 0.1;

      return {
        min,
        max,
        paddedMin: min - padding,
        paddedMax: max + padding,
      };
    };

    resolvedValueScales.forEach((scale) => {
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;

      scale.dataKeys.forEach((key) => {
        const stats = perKeyStats.get(key);
        if (stats) {
          min = Math.min(min, stats.min);
          max = Math.max(max, stats.max);
        }
      });

      if (scale.domain?.min !== undefined && Number.isFinite(scale.domain.min)) {
        min = scale.domain.min;
      }
      if (scale.domain?.max !== undefined && Number.isFinite(scale.domain.max)) {
        max = scale.domain.max;
      }

      domains[scale.id] = computeDomain(min, max);
    });

    return domains;
  }, [perKeyStats, resolvedValueScales]);

  const defaultScaleId = resolvedValueScales[0]?.id ?? 'default';
  const defaultValueDomain = useMemo<ValueDomain>(
    () => valueDomainsByScale[defaultScaleId] ?? DEFAULT_VALUE_DOMAIN,
    [defaultScaleId, valueDomainsByScale]
  );

  const getScaleDomain = useCallback(
    (scaleId: string) => valueDomainsByScale[scaleId] ?? defaultValueDomain,
    [defaultValueDomain, valueDomainsByScale]
  );

  const getScaleIdForKey = useCallback(
    (dataKey: string) => scaleAssignments.get(dataKey) ?? defaultScaleId,
    [defaultScaleId, scaleAssignments]
  );

  const getYPositionForScale = useCallback(
    (scaleId: string, value: number) => {
      if (!Number.isFinite(value)) {
        return chartArea.y + chartArea.height;
      }

      const domain = valueDomainsByScale[scaleId] ?? defaultValueDomain;
      const denominator = domain.paddedMax - domain.paddedMin;

      if (denominator === 0 || chartArea.height === 0) {
        return chartArea.y + chartArea.height / 2;
      }

      const normalized = (value - domain.paddedMin) / denominator;
      const clamped = Math.max(0, Math.min(1, normalized));
      return chartArea.y + chartArea.height - clamped * chartArea.height;
    },
    [chartArea.height, chartArea.y, defaultValueDomain, valueDomainsByScale]
  );

  const getYPositionForKey = useCallback(
    (dataKey: string, value: number) => {
      const scaleId = getScaleIdForKey(dataKey);
      return getYPositionForScale(scaleId, value);
    },
    [getScaleIdForKey, getYPositionForScale]
  );

  const getYPosition = useCallback(
    (value: number) => getYPositionForScale(defaultScaleId, value),
    [defaultScaleId, getYPositionForScale]
  );

  const valueDomain = defaultValueDomain;

  const getXPosition = useCallback(
    (index: number) => {
      if (labels.length <= 1) {
        return chartArea.x + chartArea.width / 2;
      }

      const spacing = chartArea.width / Math.max(1, labels.length - 1);
      return chartArea.x + index * spacing;
    },
    [chartArea.width, chartArea.x, labels.length]
  );

  const labelPositions = useMemo(
    () => labels.map((_, index) => getXPosition(index)),
    [getXPosition, labels]
  );

  const normalizedData = useMemo<NormalizedDatum[]>(() =>
    data.map((datum, index) => {
      const values: Record<string, number | null> = {};

      resolvedYKeys.forEach((key) => {
        const rawValue = datum[key];
        const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        values[key] = Number.isFinite(numeric) ? numeric : null;
      });

      return {
        index,
        label: labels[index] ?? '',
        x: labelPositions[index] ?? chartArea.x,
        values,
        raw: datum,
      };
    }),
    [chartArea.x, data, labelPositions, labels, resolvedYKeys]
  );

  const dataPoints = useMemo<CursorDataPoint[]>(() => {
    const points: CursorDataPoint[] = [];

    normalizedData.forEach((datum) => {
      resolvedYKeys.forEach((key, seriesIndex) => {
        const value = datum.values[key];
        if (value === null || !Number.isFinite(value)) {
          return;
        }

        points.push({
          x: datum.x,
          y: getYPositionForKey(key, value),
          value,
          label: datum.label,
          seriesIndex,
          dataIndex: datum.index,
          originalData: {
            ...datum.raw,
            dataKey: key,
          },
        });
      });
    });

    return points;
  }, [getYPositionForKey, normalizedData, resolvedYKeys]);

  const colorPalette = useMemo(
    () => (defaultColors.length > 0 ? defaultColors : DEFAULT_COLORS),
    [defaultColors]
  );

  const colorMapRef = useRef(new Map<string, string>());

  useEffect(() => {
    const nextMap = new Map<string, string>();
    resolvedYKeys.forEach((key, index) => {
      const color = colorPalette[index % colorPalette.length];
      nextMap.set(key, color);
    });
    colorMapRef.current = nextMap;
  }, [colorPalette, resolvedYKeys]);

  const getColorForKey = useCallback(
    (dataKey: string, fallback?: string) => {
      if (colorMapRef.current.has(dataKey)) {
        return colorMapRef.current.get(dataKey) as string;
      }

      const color = fallback ?? colorPalette[colorMapRef.current.size % colorPalette.length];
      colorMapRef.current.set(dataKey, color);
      return color;
    },
    [colorPalette]
  );

  const layersSorted = useMemo(
    () => [...layers].sort((a, b) => a.order - b.order),
    [layers]
  );

  const baseLayers = useMemo(
    () => layersSorted.filter((layer) => layer.order < LayerOrder.overlays),
    [layersSorted]
  );

  const overlayLayers = useMemo(
    () => layersSorted.filter((layer) => layer.order >= LayerOrder.overlays),
    [layersSorted]
  );

  const dataPointsRef = useRef<CursorDataPoint[]>(dataPoints);
  useEffect(() => {
    dataPointsRef.current = dataPoints;
  }, [dataPoints]);

  const hoverHandlerRef = useRef(onHover);
  useEffect(() => {
    hoverHandlerRef.current = onHover;
  }, [onHover]);

  const clickHandlerRef = useRef(onClick);
  useEffect(() => {
    clickHandlerRef.current = onClick;
  }, [onClick]);

  const selectionHandlerRef = useRef(onSelectionChange);
  useEffect(() => {
    selectionHandlerRef.current = onSelectionChange;
  }, [onSelectionChange]);

  const axisTickStateRef = useRef(axisTicks);
  useEffect(() => {
    axisTickStateRef.current = axisTicks;
  }, [axisTicks]);

  const selectionActiveRef = useRef(false);
  const selectionStartRef = useRef<number | null>(null);
  const selectionWindowListenerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const skipClickRef = useRef(false);
  const selectionRangeRef = useRef<{ start: number; end: number } | null>(null);
  const selectionResetRef = useRef(selectionResetKey);

  useEffect(() => () => {
    if (selectionWindowListenerRef.current) {
      window.removeEventListener('mouseup', selectionWindowListenerRef.current);
      selectionWindowListenerRef.current = null;
    }
  }, []);

  const [baseRenderVersion, setBaseRenderVersion] = useState(0);
  const overlayRenderCycleRef = useRef(0);
  const overlayRedrawRef = useRef<() => void>(() => {});
  const handleOverlayRedrawRegister = useCallback((fn: (() => void) | null) => {
    overlayRedrawRef.current = fn ?? (() => {});
  }, []);

  const requestOverlayRender = useCallback(() => {
    overlayRenderCycleRef.current += 1;
    overlayRedrawRef.current();
  }, []);

  const requestRender = useCallback(() => {
    setBaseRenderVersion((version) => version + 1);
    requestOverlayRender();
  }, [requestOverlayRender]);

  useEffect(() => {
    if (selectionResetRef.current !== selectionResetKey) {
      selectionResetRef.current = selectionResetKey;
      selectionActiveRef.current = false;
      selectionStartRef.current = null;
      selectionRangeRef.current = null;
      requestOverlayRender();
    }
  }, [requestOverlayRender, selectionResetKey]);

  const updatePointer = useCallback(
    (next: ChartPointer | null) => {
      const previous = pointerRef.current;
      if (previous && next) {
        if (Math.abs(previous.x - next.x) < 0.001 && Math.abs(previous.y - next.y) < 0.001) {
          return;
        }
      } else if (!previous && !next) {
        return;
      }

      pointerRef.current = next;
      requestOverlayRender();
    },
    [requestOverlayRender]
  );

  const pendingPointerRef = useRef<{ x: number; y: number; withinChart: boolean } | null>(null);
  const pointerFrameRef = useRef<number | null>(null);

  const processPendingPointer = useCallback(() => {
    pointerFrameRef.current = null;
    const pending = pendingPointerRef.current;
    pendingPointerRef.current = null;

    if (!pending) {
      return;
    }

    if (!pending.withinChart) {
      updatePointer(null);
      hoverHandlerRef.current?.(null);
      return;
    }

    const { x, y } = pending;

    updatePointer({ x, y });

    const cursorOpts = cursorOptionsRef.current;
    if (hoverHandlerRef.current) {
      const nearest = findNearestDataPoint(
        x,
        y,
        dataPointsRef.current,
        cursorOpts.snapRadius,
        cursorOpts.snapAlongYAxis
      );

      hoverHandlerRef.current(nearest?.point ?? null);
    }
  }, [updatePointer]);

  const schedulePointerUpdate = useCallback(
    (update: { x: number; y: number; withinChart: boolean }) => {
      pendingPointerRef.current = update;
      if (pointerFrameRef.current === null) {
        pointerFrameRef.current = window.requestAnimationFrame(processPendingPointer);
      }
    },
    [processPendingPointer]
  );

  useEffect(() => () => {
    if (pointerFrameRef.current !== null) {
      cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }
  }, []);

  const getRelativePointerPosition = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((event.clientX - rect.left) * scaleX) / devicePixelRatio;
    const y = ((event.clientY - rect.top) * scaleY) / devicePixelRatio;
    return { x, y };
  }, []);

  const clampXToChart = useCallback(
    (value: number) => {
      const min = chartArea.x;
      const max = chartArea.x + chartArea.width;
      if (value <= min) return min;
      if (value >= max) return max;
      return value;
    },
    [chartArea.width, chartArea.x]
  );

  const computeSelectionResult = useCallback(
    (rawStartX: number, rawEndX: number): ChartSelectionResult | null => {
      if (labelPositions.length === 0) {
        return null;
      }

      const startClamped = clampXToChart(rawStartX);
      const endClamped = clampXToChart(rawEndX);
      const startX = Math.min(startClamped, endClamped);
      const endX = Math.max(startClamped, endClamped);

      if (endX - startX < MIN_SELECTION_WIDTH) {
        return null;
      }

      const findClosestIndex = (target: number): number => {
        let low = 0;
        let high = labelPositions.length - 1;

        while (low <= high) {
          const mid = (low + high) >> 1;
          const position = labelPositions[mid];
          if (position === target) {
            return mid;
          }
          if (position < target) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        if (low >= labelPositions.length) {
          return labelPositions.length - 1;
        }
        if (high < 0) {
          return 0;
        }

        return Math.abs(labelPositions[low] - target) < Math.abs(labelPositions[high] - target)
          ? low
          : high;
      };

      const startIndex = findClosestIndex(startX);
      const endIndex = findClosestIndex(endX);
      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);

      const startDatum = normalizedData[minIndex];
      const endDatum = normalizedData[maxIndex];

      const seriesSelections: Record<string, ChartSelectionSeriesRange> = {};

      resolvedYKeys.forEach((key) => {
        seriesSelections[key] = {
          min: {
            index: minIndex,
            label: startDatum?.label ?? labels[minIndex] ?? '',
            value: startDatum?.values[key] ?? null,
          },
          max: {
            index: maxIndex,
            label: endDatum?.label ?? labels[maxIndex] ?? '',
            value: endDatum?.values[key] ?? null,
          },
        };
      });

      return {
        minIndex,
        maxIndex,
        minLabel: labels[minIndex] ?? '',
        maxLabel: labels[maxIndex] ?? '',
        series: seriesSelections,
        rangePixels: { start: startX, end: endX },
      };
    },
    [clampXToChart, labelPositions, labels, normalizedData, resolvedYKeys]
  );

  const updateSelectionDuringDrag = useCallback(
    (currentX: number) => {
      if (!selectionActiveRef.current || selectionStartRef.current === null) {
        return;
      }

      const start = selectionStartRef.current;
      const previous = selectionRangeRef.current;
      if (previous && previous.start === start && previous.end === currentX) {
        return;
      }

      selectionRangeRef.current = { start, end: currentX };
      requestOverlayRender();

      if (!selectionHandlerRef.current) {
        return;
      }

      if (Math.abs(currentX - start) >= MIN_SELECTION_WIDTH) {
        selectionHandlerRef.current(computeSelectionResult(start, currentX));
      } else {
        selectionHandlerRef.current(null);
      }
    },
    [computeSelectionResult, requestOverlayRender]
  );

  const finalizeSelection = useCallback(
    (currentX: number | null) => {
      if (!selectionActiveRef.current || selectionStartRef.current === null) {
        return;
      }

      selectionActiveRef.current = false;

      if (selectionWindowListenerRef.current) {
        window.removeEventListener('mouseup', selectionWindowListenerRef.current);
        selectionWindowListenerRef.current = null;
      }

      const startRaw = selectionStartRef.current;
      const endRaw = currentX ?? startRaw;
      selectionStartRef.current = null;

      const start = clampXToChart(startRaw);
      const end = clampXToChart(endRaw);

      if (Math.abs(end - start) < MIN_SELECTION_WIDTH) {
        selectionRangeRef.current = null;
        requestOverlayRender();
        selectionHandlerRef.current?.(null);
        return;
      }

      const result = computeSelectionResult(start, end);

      if (!result) {
        selectionRangeRef.current = null;
        requestOverlayRender();
        selectionHandlerRef.current?.(null);
        return;
      }

      selectionRangeRef.current = {
        start: result.rangePixels.start,
        end: result.rangePixels.end,
      };
      requestOverlayRender();
      selectionHandlerRef.current?.(result);
    },
    [clampXToChart, computeSelectionResult, requestOverlayRender]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      const { x, y } = getRelativePointerPosition(event, canvas);

      const withinChart =
        x >= chartArea.x &&
        x <= chartArea.x + chartArea.width &&
        y >= chartArea.y &&
        y <= chartArea.y + chartArea.height;

      schedulePointerUpdate({ x, y, withinChart });

      if (selectionActiveRef.current) {
        const clampedX = clampXToChart(x);
        if (selectionStartRef.current !== null && Math.abs(clampedX - selectionStartRef.current) >= MIN_SELECTION_WIDTH) {
          skipClickRef.current = true;
        }
        updateSelectionDuringDrag(clampedX);
        event.preventDefault();
      }
    },
    [
      clampXToChart,
      chartArea.height,
      chartArea.width,
      chartArea.x,
      chartArea.y,
      getRelativePointerPosition,
      schedulePointerUpdate,
      updateSelectionDuringDrag,
    ]
  );

  const handleMouseLeave = useCallback(() => {
    pendingPointerRef.current = null;
    if (pointerFrameRef.current !== null) {
      cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }
    if (selectionActiveRef.current) {
      const fallback = selectionRangeRef.current ? selectionRangeRef.current.end : selectionStartRef.current;
      finalizeSelection(fallback ?? null);
    }
    updatePointer(null);
    hoverHandlerRef.current?.(null);
  }, [finalizeSelection, updatePointer]);

  const handleMouseDown = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      if (event.button !== 0) {
        return;
      }

      const { x, y } = getRelativePointerPosition(event, canvas);

      const withinChart =
        x >= chartArea.x &&
        x <= chartArea.x + chartArea.width &&
        y >= chartArea.y &&
        y <= chartArea.y + chartArea.height;

      if (!withinChart) {
        return;
      }

  const clampedX = clampXToChart(x);
  selectionActiveRef.current = true;
  selectionStartRef.current = clampedX;
  skipClickRef.current = false;
  selectionRangeRef.current = { start: clampedX, end: clampedX };
  requestOverlayRender();

      if (selectionWindowListenerRef.current) {
        window.removeEventListener('mouseup', selectionWindowListenerRef.current);
        selectionWindowListenerRef.current = null;
      }

      const handleWindowMouseUp = (windowEvent: MouseEvent) => {
        const coordinates = getRelativePointerPosition(windowEvent, canvas);
        finalizeSelection(coordinates.x);
      };

      selectionWindowListenerRef.current = handleWindowMouseUp;
      window.addEventListener('mouseup', handleWindowMouseUp);

      event.preventDefault();
    },
    [
      chartArea.height,
      chartArea.width,
      chartArea.x,
      chartArea.y,
      clampXToChart,
      finalizeSelection,
      getRelativePointerPosition,
      requestOverlayRender,
    ]
  );

  const handleMouseUp = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      if (!selectionActiveRef.current || selectionStartRef.current === null) {
        return;
      }

      const { x } = getRelativePointerPosition(event, canvas);
      const start = selectionStartRef.current;

      if (Math.abs(x - start) >= MIN_SELECTION_WIDTH) {
        skipClickRef.current = true;
      }

      finalizeSelection(x);
      event.preventDefault();
    },
    [finalizeSelection, getRelativePointerPosition]
  );

  const handleClick = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      if (!clickHandlerRef.current) return;

      if (skipClickRef.current) {
        skipClickRef.current = false;
        return;
      }

      const { x, y } = getRelativePointerPosition(event, canvas);

      const withinChart =
        x >= chartArea.x &&
        x <= chartArea.x + chartArea.width &&
        y >= chartArea.y &&
        y <= chartArea.y + chartArea.height;

      if (!withinChart) {
        clickHandlerRef.current(null);
        return;
      }

      const cursorOpts = cursorOptionsRef.current;
      const nearest = findNearestDataPoint(
        x,
        y,
        dataPointsRef.current,
        cursorOpts.snapRadius,
        cursorOpts.snapAlongYAxis
      );

      clickHandlerRef.current(nearest?.point ?? null);
    },
    [
      chartArea.height,
      chartArea.width,
      chartArea.x,
      chartArea.y,
      getRelativePointerPosition,
    ]
  );

  const drawBase = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const canvasWidth = canvas.width / devicePixelRatio;
      const canvasHeight = canvas.height / devicePixelRatio;

      if (
        Math.abs(canvasWidth - canvasSize.width) > 0.5 ||
        Math.abs(canvasHeight - canvasSize.height) > 0.5
      ) {
        setCanvasSize({ width: canvasWidth, height: canvasHeight });
      }

      context.save();
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.restore();

      if (baseLayers.length === 0) {
        return;
      }

      const helpers: ChartSurfaceRenderHelpers = {
        canvasWidth,
        canvasHeight,
        chartArea,
        labels,
        labelPositions,
        normalizedData,
        getXPosition,
        getYPosition,
        getYPositionForScale,
        getYPositionForKey,
        getScaleDomain,
        getScaleIdForKey,
        defaultScaleId,
        colorForKey: getColorForKey,
        pointer: pointerRef.current,
        dataPoints,
        axisTicks: axisTickStateRef.current,
        valueDomain,
        valueDomainsByScale,
        renderCycle: baseRenderVersion,
        yAxisCounts,
      };

      baseLayers.forEach((layer) => {
        layer.draw(context, helpers);
      });
    },
    [
      backgroundColor,
      baseLayers,
      canvasSize.height,
      canvasSize.width,
      chartArea,
      dataPoints,
      getColorForKey,
      getScaleDomain,
      getScaleIdForKey,
      getXPosition,
      getYPosition,
      getYPositionForKey,
      getYPositionForScale,
      labelPositions,
      labels,
      normalizedData,
      baseRenderVersion,
      valueDomain,
      valueDomainsByScale,
      yAxisCounts,
      defaultScaleId,
    ]
  );

  const drawOverlay = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const canvasWidth = canvas.width / devicePixelRatio;
      const canvasHeight = canvas.height / devicePixelRatio;

      context.save();
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.restore();

      const selectionRange = selectionRangeRef.current;
      if (selectionRange) {
        const rawStart = Math.min(selectionRange.start, selectionRange.end);
        const rawEnd = Math.max(selectionRange.start, selectionRange.end);
        const start = Math.max(chartArea.x, Math.min(rawStart, chartArea.x + chartArea.width));
        const end = Math.max(chartArea.x, Math.min(rawEnd, chartArea.x + chartArea.width));

        if (end - start >= 1) {
          context.save();
          context.fillStyle = 'rgba(59, 130, 246, 0.15)';
          context.fillRect(start, chartArea.y, end - start, chartArea.height);
          context.strokeStyle = 'rgba(59, 130, 246, 0.45)';
          context.lineWidth = 1;
          context.strokeRect(start + 0.5, chartArea.y + 0.5, (end - start) - 1, chartArea.height - 1);
          context.restore();
        }
      }

      if (overlayLayers.length === 0) {
        return;
      }

      const helpers: ChartSurfaceRenderHelpers = {
        canvasWidth,
        canvasHeight,
        chartArea,
        labels,
        labelPositions,
        normalizedData,
        getXPosition,
        getYPosition,
        getYPositionForScale,
        getYPositionForKey,
        getScaleDomain,
        getScaleIdForKey,
        defaultScaleId,
        colorForKey: getColorForKey,
        pointer: pointerRef.current,
        dataPoints,
        axisTicks: axisTickStateRef.current,
        valueDomain,
        valueDomainsByScale,
        renderCycle: overlayRenderCycleRef.current,
        yAxisCounts,
      };

      overlayLayers.forEach((layer) => {
        layer.draw(context, helpers);
      });
    },
    [
      chartArea,
      dataPoints,
      getColorForKey,
      getScaleDomain,
      getScaleIdForKey,
      getXPosition,
      getYPosition,
      getYPositionForKey,
      getYPositionForScale,
      labelPositions,
      labels,
      normalizedData,
      overlayLayers,
      valueDomain,
      valueDomainsByScale,
      yAxisCounts,
      defaultScaleId,
    ]
  );

  const contextValue = useMemo<ChartSurfaceContextValue>(() => ({
    data,
    xKey,
    yKeys: resolvedYKeys,
    labels,
    labelPositions,
    chartArea,
    canvasSize,
    valueDomain,
    defaultScaleId,
    valueDomainsByScale,
    getXPosition,
    getYPosition,
    getYPositionForScale,
    getYPositionForKey,
    getScaleDomain,
    getScaleIdForKey,
    normalizedData,
    dataPoints,
    axisTicks,
    registerLayer,
    setAxisTicks,
    getColorForKey,
    registerCursorOptions,
    requestRender,
    registerYAxis,
    getYAxisIndex,
    yAxisCounts,
    yAxisSpacing: Y_AXIS_BAND_WIDTH,
  }), [
    axisTicks,
    canvasSize,
    chartArea,
    data,
    dataPoints,
    defaultScaleId,
    getColorForKey,
    getScaleDomain,
    getScaleIdForKey,
    getXPosition,
    getYPosition,
    getYPositionForKey,
    getYPositionForScale,
    getYAxisIndex,
    labelPositions,
    labels,
    normalizedData,
    registerCursorOptions,
    registerLayer,
    registerYAxis,
    requestRender,
    resolvedYKeys,
    setAxisTicks,
    valueDomain,
    valueDomainsByScale,
    xKey,
    yAxisCounts,
  ]);

  return (
    <ChartSurfaceContext.Provider value={contextValue}>
      <ChartOverlayContainerContext.Provider value={overlayContainer}>
        {/* @ts-expect-error internal cssstyle version mismatch */}
        <div className={cn('relative group', className)} style={style}>
          <CanvasWrapper
            width={width}
            height={height}
            className="relative z-0"
            onDraw={drawBase}
            debugLabel="chart-base"
            canvasStyle={{ pointerEvents: 'none' }}
          />
          <CanvasWrapper
            width={width}
            height={height}
            className="absolute inset-0 z-10"
            onDraw={drawOverlay}
            debugLabel="chart-overlay"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            redrawOnPointerEvents={false}
            onRegisterRedraw={handleOverlayRedrawRegister}
          />
          <div ref={overlayContainerRef} className="pointer-events-none absolute inset-0 z-20" />
          {children}
        </div>
      </ChartOverlayContainerContext.Provider>
    </ChartSurfaceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChartLayer = (
  draw: ChartLayerRenderer,
  options?: ChartLayerOptions
): void => {
  const { registerLayer } = useChartSurface();
  const drawRef = useRef(draw);
  const optionsRef = useRef(options);
  const handleRef = useRef<ChartLayerHandle | null>(null);

  drawRef.current = draw;
  optionsRef.current = options;

  useEffect(() => {
    const handle = registerLayer(drawRef.current, optionsRef.current);
    handleRef.current = handle;
    return () => {
      handle.unregister();
      handleRef.current = null;
    };
  }, [registerLayer]);

  useEffect(() => {
    if (handleRef.current) {
      handleRef.current.update(drawRef.current, optionsRef.current);
    }
  }, [draw, options]);
};
