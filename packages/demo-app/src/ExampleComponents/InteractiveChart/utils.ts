const pad2 = (value: number): string => (value < 10 ? `0${value}` : `${value}`);
const pad3 = (value: number): string => {
  if (value < 10) return `00${value}`;
  if (value < 100) return `0${value}`;
  return `${value}`;
};

export const formatTimeLabel = (date: Date): string => {
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  const milliseconds = pad3(date.getMilliseconds());

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};
