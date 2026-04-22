/**
 * Azion GraphQL API aggregation operators.
 *
 * Per https://www.azion.com/en/documentation/devtools/graphql-api/queries/:
 *   "You can run a request with one of each of the available options:
 *    count, sum, max, min, avg, and rate, as long as each option is only
 *    used once and each operator aggregates only one dataset field at a
 *    time."
 *
 * These names show up as selectable members of every dataset's aggregated
 * GraphQL type (e.g. `HttpEventsAggregatedFieldsLogType`), but they are NOT
 * row fields — they can only appear in a selection set when an
 * `aggregate: { ... }` clause is present in the query.
 *
 * A raw list query that includes any of them without an aggregate clause is
 * rejected with:
 *   "No aggregation defined. Operation must specify a field and an
 *    aggregation operation."
 *
 * This module is the single source of truth for filtering these names out of
 * any dataset-fields pipeline (introspection cache, sidebar discovery, etc.).
 */

export const AGGREGATION_OPERATORS = Object.freeze(
  new Set(['count', 'sum', 'max', 'min', 'avg', 'rate'])
)

/**
 * @param {string} name
 * @returns {boolean}
 */
export const isAggregationOperator = (name) => AGGREGATION_OPERATORS.has(name)

/**
 * Returns a new array with every aggregation operator removed. Non-string
 * entries and falsy values are also dropped so the output is always a clean
 * list of field names.
 *
 * @param {Iterable<string> | null | undefined} fields
 * @returns {string[]}
 */
export const stripAggregationOperators = (fields) => {
  if (!fields) return []
  const result = []
  for (const name of fields) {
    if (typeof name === 'string' && name && !AGGREGATION_OPERATORS.has(name)) {
      result.push(name)
    }
  }
  return result
}
