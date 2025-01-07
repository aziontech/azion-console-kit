import { formatUnitValue } from './convert-number'

const LIMIT_RECORDS_FOUND = 10000

export const getRecordsFound = (totalRecords) => {
  return totalRecords >= LIMIT_RECORDS_FOUND
    ? `+ ${formatUnitValue(LIMIT_RECORDS_FOUND)}`
    : formatUnitValue(totalRecords)
}
