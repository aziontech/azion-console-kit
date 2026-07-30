/**
 * Clamp an index into the inclusive range `[0, max]`. A negative `max` (empty
 * list) collapses to `0`.
 *
 * @param {number} index
 * @param {number} max
 * @returns {number}
 */
export const clampIndex = (index, max) => Math.min(Math.max(index, 0), Math.max(max, 0))

/**
 * Move the item at `fromIndex` to `targetPosition` within `items`.
 *
 * @template T
 * @param {T[]} items
 * @param {number} fromIndex - current index of the item to move
 * @param {number} targetPosition - desired destination (pre-clamp)
 * @returns {T[]} a new, reordered array
 */
export const moveItemToPosition = (items, fromIndex, targetPosition) => {
  const next = [...items]
  const targetIndex = clampIndex(targetPosition, items.length - 1)

  if (fromIndex < 0 || fromIndex >= items.length || fromIndex === targetIndex) {
    return next
  }

  const [moved] = next.splice(fromIndex, 1)
  next.splice(targetIndex, 0, moved)
  return next
}
