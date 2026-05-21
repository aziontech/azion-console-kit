import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { computeTooltipPosition } from '../tooltip-position.js'

/**
 * Feature: real-time-events-enhancements
 *
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.8, 10.5**
 *
 * Property 10: Tooltip placement containment and non-overlap
 *
 * For any container/hover/tooltip combination where the container has room to
 * fit the tooltip with padding on at least one axis, computeTooltipPosition
 * SHALL return container-relative coords that:
 *   1. Keep the tooltip fully inside the container (with padding margin).
 *   2. Do not overlap the hovered element.
 */

describe('tooltip-position — Property 10', () => {
  it('tooltip stays inside container and does not overlap hover rect', () => {
    // Build a single chained arbitrary that produces a consistent
    // (containerRect, hoverRect, tooltipSize, padding) tuple.
    const arbInputs = fc
      .record({
        left: fc.integer({ min: 0, max: 500 }),
        top: fc.integer({ min: 0, max: 500 }),
        width: fc.integer({ min: 100, max: 800 }),
        height: fc.integer({ min: 100, max: 600 })
      })
      .chain((container) => {
        // hoverRect must be positioned inside the container
        const hoverArb = fc.record({
          left: fc.integer({
            min: container.left,
            max: container.left + container.width - 10
          }),
          top: fc.integer({
            min: container.top,
            max: container.top + container.height - 10
          }),
          width: fc.integer({ min: 5, max: 50 }),
          height: fc.integer({ min: 5, max: 50 })
        })

        return fc.record({
          containerRect: fc.constant({
            left: container.left,
            top: container.top,
            width: container.width,
            height: container.height,
            right: container.left + container.width,
            bottom: container.top + container.height
          }),
          hoverRectRaw: hoverArb,
          tooltipSize: fc.record({
            width: fc.integer({ min: 20, max: 200 }),
            height: fc.integer({ min: 20, max: 100 })
          }),
          padding: fc.integer({ min: 0, max: 16 })
        })
      })
      .map(({ containerRect, hoverRectRaw, tooltipSize, padding }) => ({
        containerRect,
        hoverRect: {
          left: hoverRectRaw.left,
          top: hoverRectRaw.top,
          width: hoverRectRaw.width,
          height: hoverRectRaw.height,
          right: hoverRectRaw.left + hoverRectRaw.width,
          bottom: hoverRectRaw.top + hoverRectRaw.height
        },
        tooltipSize,
        padding
      }))

    fc.assert(
      fc.property(arbInputs, ({ containerRect, hoverRect, tooltipSize, padding }) => {
        // Pre-condition: container must have room to fit the tooltip AND the
        // hover rect side-by-side on at least one axis (with padding).
        // This ensures the non-overlap invariant is achievable.
        const hoverRelLeft = hoverRect.left - containerRect.left
        const hoverRelRight = hoverRelLeft + hoverRect.width
        const hoverRelTop = hoverRect.top - containerRect.top
        const hoverRelBottom = hoverRelTop + hoverRect.height

        // The tooltip must fit in the container on each axis
        const tooltipFitsInContainer =
          tooltipSize.width + 2 * padding <= containerRect.width &&
          tooltipSize.height + 2 * padding <= containerRect.height

        // Horizontal: room to the right of hover OR to the left of hover
        const roomRight = containerRect.width - padding - hoverRelRight
        const roomLeft = hoverRelLeft - padding
        const fitsHorizontally = roomRight >= tooltipSize.width || roomLeft >= tooltipSize.width

        // Vertical: room below hover OR above hover
        const roomBelow = containerRect.height - padding - hoverRelBottom
        const roomAbove = hoverRelTop - padding
        const fitsVertically = roomBelow >= tooltipSize.height || roomAbove >= tooltipSize.height

        fc.pre(tooltipFitsInContainer && (fitsHorizontally || fitsVertically))

        const result = computeTooltipPosition({
          containerRect,
          hoverRect,
          tooltipSize,
          padding
        })

        // --- Containment invariants (result is container-relative) ---

        // 1. left >= padding
        expect(result.left).toBeGreaterThanOrEqual(padding)

        // 2. left + tooltipSize.width <= containerRect.width - padding
        expect(result.left + tooltipSize.width).toBeLessThanOrEqual(
          containerRect.width - padding
        )

        // 3. top >= padding
        expect(result.top).toBeGreaterThanOrEqual(padding)

        // 4. top + tooltipSize.height <= containerRect.height - padding
        expect(result.top + tooltipSize.height).toBeLessThanOrEqual(
          containerRect.height - padding
        )

        // --- Non-overlap invariant ---
        // Convert hover rect to container-relative coords (already computed above)
        const hoverRelRight2 = hoverRelLeft + hoverRect.width
        const hoverRelBottom2 = hoverRelTop + hoverRect.height

        const tooltipLeft = result.left
        const tooltipTop = result.top
        const tooltipRight = tooltipLeft + tooltipSize.width
        const tooltipBottom = tooltipTop + tooltipSize.height

        // Touching edges are OK — only strict intersection counts as overlap
        const overlaps =
          tooltipLeft < hoverRelRight2 &&
          tooltipRight > hoverRelLeft &&
          tooltipTop < hoverRelBottom2 &&
          tooltipBottom > hoverRelTop

        expect(overlaps).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})
