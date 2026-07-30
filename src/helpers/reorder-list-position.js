/**
 * Pure, framework-agnostic list-reordering used by the Rules Engine position
 * spinners (Edge Application and Edge Firewall). Extracted from the views so the
 * clamp + move logic has a single responsibility and can be unit-tested in
 * isolation, without mounting a component or a reactive store.
 */

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
 * Single responsibility — it only reorders. The desired `targetPosition` is
 * clamped into the valid range `[0, items.length - 1]`, so a value past the end
 * lands on the last slot and a negative one on the first, instead of corrupting
 * the list through an out-of-range or negative `splice`.
 *
 * Pure: the input array is not mutated. A new array with the SAME item
 * references reordered is returned. When the item is already at the clamped
 * target — or `fromIndex` is out of range — a shallow copy is returned unchanged.
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
