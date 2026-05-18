import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { useClickToFilter } from '../useClickToFilter.js'

/**
 * Feature: real-time-events-enhancements
 *
 * Property 7: Click-to-filter text-selection gating
 * Validates: Requirements 5.5, 10.7
 *
 * For any click where window.getSelection() returns a non-collapsed selection
 * (isCollapsed === false), neither onAdd nor onExclude should be called,
 * regardless of the Alt modifier.
 *
 * Property 8: Click-to-filter invalid-value gating
 * Validates: Property 8, Requirement 5.7
 *
 * For any invalid value (null, undefined, '', '-'), neither onAdd nor onExclude
 * should be called.
 */

describe('useClickToFilter', () => {
  let getSelectionSpy

  beforeEach(() => {
    getSelectionSpy = vi.spyOn(window, 'getSelection')
  })

  afterEach(() => {
    getSelectionSpy.mockRestore()
  })

  describe('Property 7: text-selection gating', () => {
    it('does not emit when selection is non-collapsed', () => {
      // Mock a non-collapsed selection (user has text selected)
      getSelectionSpy.mockReturnValue({ isCollapsed: false })

      const onAdd = vi.fn()
      const onExclude = vi.fn()
      const { onValueMouseDown, onValueClick } = useClickToFilter({ onAdd, onExclude })

      // Value must pass isValid so the selection gate is actually reached.
      // Filter out empty/whitespace-only strings and the '-' placeholder.
      const arbValidValue = fc
        .string({ minLength: 1 })
        .filter((v) => v.trim() !== '' && v.trim() !== '-')

      const arbRecord = fc.record({
        key: fc.string(),
        value: arbValidValue,
        altKey: fc.boolean()
      })

      fc.assert(
        fc.property(arbRecord, ({ key, value, altKey }) => {
          onAdd.mockClear()
          onExclude.mockClear()

          // Create a fake currentTarget element with no __draggedOut flag
          const fakeEl = {}

          // Create a fake MouseEvent-like object. Real MouseEvent instances
          // expose `stopImmediatePropagation` — the composable calls it on
          // mousedown to keep PrimeVue's row listener from killing the
          // selection — so the mock must provide it.
          const mouseDownEvent = {
            currentTarget: fakeEl,
            clientX: 0,
            clientY: 0,
            stopImmediatePropagation: vi.fn(),
            stopPropagation: vi.fn(),
            preventDefault: vi.fn()
          }
          const clickEvent = {
            currentTarget: fakeEl,
            altKey,
            clientX: 0,
            clientY: 0,
            stopImmediatePropagation: vi.fn(),
            stopPropagation: vi.fn(),
            preventDefault: vi.fn()
          }

          onValueMouseDown(mouseDownEvent)
          onValueClick(clickEvent, key, value)

          expect(onAdd).not.toHaveBeenCalled()
          expect(onExclude).not.toHaveBeenCalled()
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 8: invalid-value gating', () => {
    it('does not emit for invalid values', () => {
      // Mock a collapsed selection so the selection gate does not interfere
      getSelectionSpy.mockReturnValue({ isCollapsed: true })

      const onAdd = vi.fn()
      const onExclude = vi.fn()
      const { onValueMouseDown, onValueClick } = useClickToFilter({ onAdd, onExclude })

      const arbInvalidValue = fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constantFrom('', '-')
      )

      fc.assert(
        fc.property(arbInvalidValue, (value) => {
          onAdd.mockClear()
          onExclude.mockClear()

          const fakeEl = {}
          const mouseDownEvent = {
            currentTarget: fakeEl,
            clientX: 0,
            clientY: 0,
            stopImmediatePropagation: vi.fn(),
            stopPropagation: vi.fn(),
            preventDefault: vi.fn()
          }
          const clickEvent = {
            currentTarget: fakeEl,
            altKey: false,
            clientX: 0,
            clientY: 0,
            stopImmediatePropagation: vi.fn(),
            stopPropagation: vi.fn(),
            preventDefault: vi.fn()
          }

          onValueMouseDown(mouseDownEvent)
          onValueClick(clickEvent, 'someKey', value)

          expect(onAdd).not.toHaveBeenCalled()
          expect(onExclude).not.toHaveBeenCalled()
        }),
        { numRuns: 100 }
      )
    })
  })
})
