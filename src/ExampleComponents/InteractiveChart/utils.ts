import type { DataPoint } from './types';

export const formatTimeLabel = (date: Date): string => {
  const timePart = date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `${timePart}.${date.getMilliseconds().toString().padStart(3, '0')}`;
};

export const createInitialTimeSeries = (
  seriesIds: string[],
  count: number
): DataPoint[] => {
  const now = Date.now();
  const lastValues = new Map<string, number>();

  seriesIds.forEach((seriesId, index) => {
    const base = 50 + index * 15;
    lastValues.set(seriesId, base);
  });

  return Array.from({ length: count }).map((_, index) => {
    const timestamp = new Date(now - (count - 1 - index) * 1000);
    const values: Record<string, number> = {};

    seriesIds.forEach((seriesId) => {
      const previous = lastValues.get(seriesId) ?? 50;
      const variation = (Math.random() - 0.5) * 20;
      const nextValue = Math.max(0, Math.round((previous + variation) * 10) / 10);
      lastValues.set(seriesId, nextValue);
      values[seriesId] = nextValue;
    });

    return {
      id: (index + 1).toString(),
      label: formatTimeLabel(timestamp),
      values,
    };
  });
};

export const generateNewPoints = (
  prev: DataPoint[],
  count: number,
  seriesIds: string[]
): DataPoint[] => {
  const normalizedCount = Math.max(1, count);
  const numericIds = prev
    .map((point) => Number.parseInt(point.id, 10))
    .filter((id) => Number.isFinite(id));
  let nextIdBase = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

  const points: DataPoint[] = [];
  const previousValues = new Map<string, number>();
  const lastPoint = prev[prev.length - 1];
  seriesIds.forEach((seriesId, index) => {
    if (lastPoint?.values?.[seriesId] !== undefined) {
      previousValues.set(seriesId, lastPoint.values[seriesId]);
    } else {
      previousValues.set(seriesId, 50 + index * 10);
    }
  });
  const baseTime = Date.now();

  for (let index = 0; index < normalizedCount; index += 1) {
    const timestamp = new Date(baseTime + index);
    const values: Record<string, number> = {};

    seriesIds.forEach((seriesId) => {
      const previous = previousValues.get(seriesId) ?? 50;
      const variation = (Math.random() - 0.5) * 20;
      const nextValue = Math.max(0, Math.round((previous + variation) * 10) / 10);
      previousValues.set(seriesId, nextValue);
      values[seriesId] = nextValue;
    });

    points.push({
      id: (nextIdBase++).toString(),
      label: formatTimeLabel(timestamp),
      values,
    });
  }

  return points;
};
