const TIMESTAMP_LENGTH = 19

export const calculateVariationPercentage = (currentValue, previousValue) => {
  if (
    currentValue === null ||
    currentValue === undefined ||
    previousValue === null ||
    previousValue === undefined ||
    previousValue === 0
  ) {
    return 0
  }
  return ((currentValue - previousValue) / previousValue) * 100
}

export const getPreviousTimeRange = (tsRangeBegin, tsRangeEnd) => {
  const begin = new Date(tsRangeBegin)
  const end = new Date(tsRangeEnd)
  const difference = end - begin

  return {
    begin: new Date(begin - difference).toISOString().slice(0, TIMESTAMP_LENGTH),
    end: new Date(end - difference).toISOString().slice(0, TIMESTAMP_LENGTH)
  }
}
