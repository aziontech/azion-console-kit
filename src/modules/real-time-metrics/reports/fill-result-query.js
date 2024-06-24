import { TIME_INTERVALS } from '@modules/real-time-metrics/constants'

/**
 * Calculate the time range difference in milliseconds.
 *
 * @param {object} tsRange - The timestamp range object with 'begin' and 'end' properties.
 * @return {number} The time range difference in milliseconds.
 */
function getTsRangeDifference(tsRange) {
  const { begin, end } = tsRange
  const start = new Date(begin).getTime()
  const finish = new Date(end).getTime()

  return finish - start
}

/**
 * Determines the query interval based on the given timestamp range difference.
 *
 * @param {number} tsRangeDifference - The timestamp range difference to evaluate.
 * @return {string} The determined query interval ('minute', 'day', or 'hour').
 */
function getQueryInterval(tsRangeDifference) {
  if (tsRangeDifference < TIME_INTERVALS.RESAMPLING_INTERVALS.THREE_DAYS) return 'minute'
  if (tsRangeDifference > TIME_INTERVALS.RESAMPLING_INTERVALS.SIXTY_DAYS) return 'day'
  return 'hour'
}

/**
 * Resets the given timestamp range to the beginning of the respective time interval (minute, hour, or day) by adjusting the begin and end timestamps accordingly.
 *
 * @param {object} tsRange - The timestamp range object with begin and end properties
 * @return {object} The updated timestamp range object with adjusted begin and end timestamps
 */
function resetTsRange(tsRange) {
  const { begin, end } = tsRange
  const tsRangeDifference = getTsRangeDifference(tsRange)
  const interval = getQueryInterval(tsRangeDifference)

  const beginToUTC = new Date(begin)
  const endToUTC = new Date(end)

  if (interval === 'minute') return { begin: beginToUTC.setSeconds(0), end: endToUTC.setSeconds(0) }
  if (interval === 'hour')
    return { begin: beginToUTC.setMinutes(0, 0), end: endToUTC.setMinutes(0, 0) }
  return { begin: beginToUTC.setHours(0, 0, 0), end: endToUTC.setHours(0, 0, 0) }
}

/**
 * Resets the given result object by creating a shallow copy and setting all numeric values to 0, except for the 'ts' property.
 *
 * @param {Object} result - The result object to be reset
 * @return {Object} The shallow copy of the result object with numeric values set to 0, except for the 'ts' property
 */
function resetResult(result) {
  const shallowResult = { ...result }
  Object.keys(shallowResult).forEach((key) => {
    if (key !== 'ts') {
      shallowResult[key] = 0
    }
  })

  return shallowResult
}

/**
 * Generates default results based on a given time range, result, and interval.
 *
 * @param {Object} tsRange - An object containing the begin and end timestamps of the range.
 * @param {Object} result - The result object to be used for generating the default results.
 * @param {string} interval - The interval to be used for generating the default results.
 * @return {Array} An array of default results.
 */
function generateDefaultResults(tsRange, result, interval) {
  const intervalToBeAdded = TIME_INTERVALS.RESAMPLING_INTERVALS.INTERVAL_TO_BE_ADDED[interval]
  const { begin, end } = tsRange
  const numberOfResults = (end - begin) / intervalToBeAdded
  const defaultResults = []

  for (let idx = 1; idx <= numberOfResults; idx++) {
    const newTimestamp = new Date(intervalToBeAdded * idx + begin).fromLocaletoBeholderFormat()
    const currentResult = { ...result, ts: `${newTimestamp}Z` }
    defaultResults.push(currentResult)
  }

  return defaultResults
}

/**
 * Replaces existing objects with incoming objects based on timestamp.
 *
 * @param {Array} existingObjects - The array of existing objects.
 * @param {Array} incomingObjects - The array of incoming objects to be compared with existing objects.
 * @return {Array} The combined array of existing objects and filtered incoming objects.
 */
function replaceItemByTimestamp(existingObjects, incomingObjects) {
  const filteredIncoming = incomingObjects.filter(
    (incomingObject) =>
      !existingObjects.some(
        (obj) => new Date(obj.ts).getTime() === new Date(incomingObject.ts).getTime()
      )
  )

  return [...existingObjects, ...filteredIncoming]
}

/**
 * Sorts the given data array by timestamp.
 *
 * @param {array} data - The array of objects to be sorted
 * @return {array} The sorted data array
 */
function sortByTimestamp(data) {
  return data.sort((prev, next) => new Date(prev.ts) - new Date(next.ts))
}

/**
 * Fill missing data with zeroes and ts values when API does not return them.
 * To a better understanding: https://aziontech.atlassian.net/browse/ENG-26176
 * This file and its methods must be removed once the resampling feature is implemented in the query builder.
 *
 * @param {Object} tsRangeFilter - the timestamp range filter
 * @param {Array} data - the data to be formatted
 * @return {Array} the formatted results
 */
export default function FillResultQuery({ tsRangeFilter, data }) {
  const tsRange = resetTsRange(tsRangeFilter)
  const tsRangeDifference = getTsRangeDifference(tsRange)
  const queryInterval = getQueryInterval(tsRangeDifference)

  if (!data?.length) return []
  const resetResults = [...data].map((item) => resetResult(item))
  const defaultResults = generateDefaultResults(tsRange, resetResults[0], queryInterval)
  const filteredResults = replaceItemByTimestamp(data, defaultResults)

  return sortByTimestamp(filteredResults)
}
