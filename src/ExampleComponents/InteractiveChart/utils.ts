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

export const createInitialTimeSeries = (count: number): DataPoint[] => {
  const now = Date.now();
  let lastValue = 60;

  return Array.from({ length: count }).map((_, index) => {
    const timestamp = new Date(now - (count - 1 - index) * 1000);
    const variation = (Math.random() - 0.5) * 20;
    lastValue = Math.max(0, Math.round((lastValue + variation) * 10) / 10);

    return {
      id: (index + 1).toString(),
      label: formatTimeLabel(timestamp),
      value: lastValue,
    };
  });
};

export const generateNewPoints = (
  prev: DataPoint[],
  count: number
): DataPoint[] => {
  const normalizedCount = Math.max(1, count);
  const numericIds = prev
    .map((point) => Number.parseInt(point.id, 10))
    .filter((id) => Number.isFinite(id));
  let nextIdBase = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

  const points: DataPoint[] = [];
  let previousValue = prev.length > 0 ? prev[prev.length - 1].value : 50;
  const baseTime = Date.now();

  for (let index = 0; index < normalizedCount; index += 1) {
    const variation = (Math.random() - 0.5) * 20;
    previousValue = Math.max(0, Math.round((previousValue + variation) * 10) / 10);
    const timestamp = new Date(baseTime + index);

    points.push({
      id: (nextIdBase++).toString(),
      label: formatTimeLabel(timestamp),
      value: previousValue,
    });
  }

  return points;
};
