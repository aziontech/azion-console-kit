/**
 * Pick `targetCount` items evenly distributed from `items`, optionally pinning
 * the first and/or last items in the result.
 *
 * Pure: does not mutate the input array and produces the same output for the
 * same input.
 *
 * @template T
 * @param {ReadonlyArray<T>} items - Source array (not mutated).
 * @param {number} targetCount - Desired number of items in the output.
 * @param {{ preserveFirst?: boolean, preserveLast?: boolean }} [opts]
 * @returns {T[]} A new array with at most `targetCount` items, ascending by
 *   original index, without duplicates.
 *
 * @example
 *   pickEvenlyDistributed([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, {
 *     preserveFirst: true,
 *     preserveLast: true
 *   })
 *   // => [1, 4, 7, 10]
 */
export function pickEvenlyDistributed(items, targetCount, opts = {}) {
  if (targetCount <= 0) return []
  const length = items.length
  if (length === 0) return []
  if (length <= targetCount) return [...items]

  const preserveFirst = opts.preserveFirst === true
  const preserveLast = opts.preserveLast === true

  if (targetCount === 1) {
    if (preserveFirst) return [items[0]]
    if (preserveLast) return [items[length - 1]]
    return [items[Math.floor(length / 2)]]
  }

  const indices = new Set()
  const stride = (length - 1) / (targetCount - 1)

  if (preserveFirst && preserveLast) {
    for (let step = 0; step < targetCount; step++) indices.add(Math.round(step * stride))
  } else if (preserveFirst) {
    indices.add(0)
    for (let step = 1; step < targetCount; step++) indices.add(Math.round(step * stride))
  } else if (preserveLast) {
    indices.add(length - 1)
    for (let step = 0; step < targetCount - 1; step++) indices.add(Math.round(step * stride))
  } else {
    for (let step = 0; step < targetCount; step++) indices.add(Math.round(step * stride))
  }

  // Set deduplicates collisions from rounding; sort to preserve original order.
  return [...indices].sort((left, right) => left - right).map((idx) => items[idx])
}
