/**
 * Framework-free helper that computes a Chart_Tooltip placement that stays
 * inside the chart container's bounding box while never overlapping the
 * hovered bar/point. Pure function, no Vue or DOM imports — the caller wires
 * the real `DOMRect` values in.
 *
 * Invariants enforced when the container has room for
 * `tooltipSize + 2 * padding` on each axis (see Property 10 in the feature's
 * design document):
 *   1. `left >= padding`
 *   2. `left + tooltipSize.width <= containerRect.width - padding`
 *   3. `top >= padding`
 *   4. `top + tooltipSize.height <= containerRect.height - padding`
 *   5. The output rect does not intersect the hoverRect projection.
 *
 * When the container is too small to fit the tooltip with the required
 * breathing room, the helper falls back to clamping at the padding corner
 * and relaxes the non-overlap clause (documented as a precondition of the
 * property test).
 */

/**
 * @typedef {Object} TooltipPositionInput
 * @property {DOMRect} containerRect - bounding rect of the chart container (viewport coords).
 * @property {DOMRect} hoverRect - bounding rect of the hovered element (viewport coords).
 * @property {{ width: number, height: number }} tooltipSize - measured tooltip box.
 * @property {number} [padding=8] - minimum gap between tooltip and edges / hovered element.
 */

/**
 * @typedef {Object} TooltipPositionOutput
 * @property {number} top - container-relative pixel offset.
 * @property {number} left - container-relative pixel offset.
 */

const DEFAULT_PADDING = 8

/**
 * Compute a tooltip placement relative to the container origin.
 *
 * @param {TooltipPositionInput} args
 * @returns {TooltipPositionOutput}
 */
export function computeTooltipPosition({
  containerRect,
  hoverRect,
  tooltipSize,
  padding = DEFAULT_PADDING
}) {
  const containerWidth = containerRect.width
  const containerHeight = containerRect.height
  const tooltipWidth = tooltipSize.width
  const tooltipHeight = tooltipSize.height

  // Step 1: convert hover rect to container-relative coords.
  const hover = {
    left: hoverRect.left - containerRect.left,
    right: hoverRect.right - containerRect.left,
    top: hoverRect.top - containerRect.top,
    bottom: hoverRect.bottom - containerRect.top,
    width: hoverRect.width,
    height: hoverRect.height
  }

  // Step 2: horizontal placement — prefer right, flip left on overflow, clamp.
  let left = hover.right + padding
  if (left + tooltipWidth > containerWidth - padding) {
    left = hover.left - tooltipWidth - padding
  }
  left = clamp(left, padding, containerWidth - tooltipWidth - padding)

  // Step 3: vertical placement — prefer same midpoint as hover, flip on
  // overflow, clamp.
  let top = hover.top + (hover.height - tooltipHeight) / 2
  if (top < padding) {
    top = hover.bottom + padding
  }
  if (top + tooltipHeight > containerHeight - padding) {
    top = hover.top - tooltipHeight - padding
  }
  top = clamp(top, padding, containerHeight - tooltipHeight - padding)

  // Step 4: anti-overlap — if the clamped tooltip still intersects the hover
  // rect (can happen when the container is narrow), translate it by
  // placing the tooltip on the side with the most room, then clamp again.
  // Only use an axis if the tooltip actually fits on that side without overlap.
  if (rectsIntersect({ left, top, width: tooltipWidth, height: tooltipHeight }, hover)) {
    const roomLeft = hover.left - padding
    const roomRight = containerWidth - padding - hover.right
    const roomAbove = hover.top - padding
    const roomBelow = containerHeight - padding - hover.bottom

    // Check if the tooltip can fit without overlap on each side
    const canFitRight = roomRight >= tooltipWidth
    const canFitLeft = roomLeft >= tooltipWidth
    const canFitBelow = roomBelow >= tooltipHeight
    const canFitAbove = roomAbove >= tooltipHeight

    if (canFitRight) {
      left = hover.right + padding
      left = clamp(left, padding, containerWidth - tooltipWidth - padding)
    } else if (canFitLeft) {
      left = hover.left - tooltipWidth - padding
      left = clamp(left, padding, containerWidth - tooltipWidth - padding)
    } else if (canFitBelow) {
      top = hover.bottom + padding
      top = clamp(top, padding, containerHeight - tooltipHeight - padding)
    } else if (canFitAbove) {
      top = hover.top - tooltipHeight - padding
      top = clamp(top, padding, containerHeight - tooltipHeight - padding)
    } else {
      // Container too small to avoid overlap — fall back to best available position
      const horizontalRoom = Math.max(roomLeft, roomRight)
      const verticalRoom = Math.max(roomAbove, roomBelow)
      if (horizontalRoom >= verticalRoom) {
        if (roomRight >= roomLeft) {
          left = hover.right + padding
        } else {
          left = hover.left - tooltipWidth - padding
        }
        left = clamp(left, padding, containerWidth - tooltipWidth - padding)
      } else {
        if (roomBelow >= roomAbove) {
          top = hover.bottom + padding
        } else {
          top = hover.top - tooltipHeight - padding
        }
        top = clamp(top, padding, containerHeight - tooltipHeight - padding)
      }
    }
  }

  return { top, left }
}

/**
 * Clamp `value` into `[min, max]`. When the container is so small that
 * `min > max` (i.e. the tooltip cannot fit with the requested padding),
 * default to `min` so callers at least get a deterministic, in-bounds origin.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  if (max < min) return min
  return Math.max(min, Math.min(value, max))
}

/**
 * Axis-aligned rect intersection test. Touching edges (shared boundary) are
 * treated as non-intersecting, matching the visual expectation that a
 * tooltip flush against the bar is acceptable.
 *
 * @param {{ left: number, top: number, width: number, height: number }} rectA
 * @param {{ left: number, top: number, width: number, height: number }} rectB
 * @returns {boolean}
 */
function rectsIntersect(rectA, rectB) {
  return (
    rectA.left < rectB.left + rectB.width &&
    rectA.left + rectA.width > rectB.left &&
    rectA.top < rectB.top + rectB.height &&
    rectA.top + rectA.height > rectB.top
  )
}
