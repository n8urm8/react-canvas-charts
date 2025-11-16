import type { DataPoint } from './types';

const pad2 = (value: number): string => (value < 10 ? `0${value}` : `${value}`);
const pad3 = (value: number): string => {
  if (value < 10) return `00${value}`;
  if (value < 100) return `0${value}`;
  return `${value}`;
};

const parseTimeLabel = (label: string): number | null => {
  const [timePart, milliPart] = label.split('.');
  if (!timePart || milliPart === undefined) {
    return null;
  }

  const timeComponents = timePart.split(':');
  if (timeComponents.length !== 3) {
    return null;
  }

  const [hoursStr, minutesStr, secondsStr] = timeComponents;
  const hours = Number.parseInt(hoursStr, 10);
  const minutes = Number.parseInt(minutesStr, 10);
  const seconds = Number.parseInt(secondsStr, 10);
  const milliseconds = Number.parseInt(milliPart, 10);

  if ([hours, minutes, seconds, milliseconds].some((value) => Number.isNaN(value))) {
    return null;
  }

  const parsedDate = new Date();
  parsedDate.setHours(hours, minutes, seconds, milliseconds);
  return parsedDate.getTime();
};

export const formatTimeLabel = (date: Date): string => {
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  const milliseconds = pad3(date.getMilliseconds());

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export const createInitialTimeSeries = (
  seriesIds: string[],
  count: number
): DataPoint[] => {
  const now = Date.now();
  const lastValues = new Map<string, number>();

  for (let seriesIndex = 0; seriesIndex < seriesIds.length; seriesIndex += 1) {
    const seriesId = seriesIds[seriesIndex];
    const base = 50 + seriesIndex * 15;
    lastValues.set(seriesId, base);
  }

  const points: DataPoint[] = new Array(count);
  const earliestTimestamp = now - (count - 1) * 1000;
  const timestamp = new Date(earliestTimestamp);

  for (let index = 0; index < count; index += 1) {
    if (index > 0) {
      timestamp.setTime(earliestTimestamp + index * 1000);
    }

    const values: Record<string, number> = {};

    for (let seriesIndex = 0; seriesIndex < seriesIds.length; seriesIndex += 1) {
      const seriesId = seriesIds[seriesIndex];
      const previous = lastValues.get(seriesId) ?? 50;
      const variation = (Math.random() - 0.5) * 20;
      const nextValue = Math.max(0, Math.round((previous + variation) * 10) / 10);
      lastValues.set(seriesId, nextValue);
      values[seriesId] = nextValue;
    }

    points[index] = {
      id: (index + 1).toString(),
      label: formatTimeLabel(timestamp),
      values,
    };
  }

  return points;
};

export const generateNewPoints = (
  prev: DataPoint[],
  count: number,
  seriesIds: string[]
): DataPoint[] => {
  const normalizedCount = Math.max(1, count);
  const incrementMs = 1000;

  let maxId = 0;
  for (let index = 0; index < prev.length; index += 1) {
    const parsed = Number.parseInt(prev[index].id, 10);
    if (Number.isFinite(parsed) && parsed > maxId) {
      maxId = parsed;
    }
  }
  let nextIdBase = maxId + 1;

  const points: DataPoint[] = new Array(normalizedCount);
  const previousValues = new Map<string, number>();
  const lastPoint = prev[prev.length - 1];

  for (let seriesIndex = 0; seriesIndex < seriesIds.length; seriesIndex += 1) {
    const seriesId = seriesIds[seriesIndex];
    if (lastPoint?.values?.[seriesId] !== undefined) {
      previousValues.set(seriesId, lastPoint.values[seriesId]);
    } else {
      previousValues.set(seriesId, 50 + seriesIndex * 10);
    }
  }

  let lastTimestamp = lastPoint ? parseTimeLabel(lastPoint.label) : null;
  if (lastTimestamp !== null) {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    if (lastTimestamp > now + incrementMs) {
      lastTimestamp -= dayMs;
    }
  }
  const baseTime = (lastTimestamp ?? Date.now()) + incrementMs;
  const timestamp = new Date(baseTime);

  for (let index = 0; index < normalizedCount; index += 1) {
    timestamp.setTime(baseTime + index * incrementMs);

    const values: Record<string, number> = {};

    for (let seriesIndex = 0; seriesIndex < seriesIds.length; seriesIndex += 1) {
      const seriesId = seriesIds[seriesIndex];
      const previous = previousValues.get(seriesId) ?? 50;
      const variation = (Math.random() - 0.5) * 20;
      const nextValue = Math.max(0, Math.round((previous + variation) * 10) / 10);
      previousValues.set(seriesId, nextValue);
      values[seriesId] = nextValue;
    }

    points[index] = {
      id: (nextIdBase++).toString(),
      label: formatTimeLabel(timestamp),
      values,
    };
  }

  return points;
};
