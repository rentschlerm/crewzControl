export const buildMultiDayHourString = (hours: Record<number | string, string | undefined>) => {
  const pairs = Object.entries(hours)
    .map(([dayKey, hour]) => {
      const dayNumber = Number(dayKey);
      const trimmedHour = typeof hour === 'string' ? hour.trim() : '';

      if (!Number.isFinite(dayNumber) || trimmedHour === '' || trimmedHour === '0.00' || trimmedHour === '0') {
        return null;
      }

      const numericValue = Number.parseFloat(trimmedHour);
      if (Number.isNaN(numericValue)) {
        return null;
      }

      return `${dayNumber}-${numericValue.toFixed(2)}`;
    })
    .filter((pair): pair is string => pair !== null);

  return pairs.join('|');
};
