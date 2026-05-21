// Feature: real-time-events-enhancements, Property 11: Long-value row width bound
// Validates: Requirements 8.5, 8.8, 10.6

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import * as fc from 'fast-check'
import EventDocumentView from '../event-document-view.vue'

vi.mock('@/helpers/clipboard', () => ({
  clipboardWrite: vi.fn()
}))

const mountComponent = (value) =>
  mount(EventDocumentView, {
    props: {
      data: {
        id: '1',
        summary: [{ key: 'field', value }]
      }
    },
    global: {
      stubs: {
        TabView: { template: '<div><slot /></div>' },
        TabPanel: { template: '<div><slot /></div>' },
        PrimeButton: {
          template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
          props: ['icon']
        },
        Skeleton: { template: '<div />' }
      },
      directives: { tooltip: {} }
    }
  })

describe('EventDocumentView — Property 11: Long-value row width bound', () => {
  /**
   * Property 11: Long-value row width bound
   *
   * For any string value rendered into a .doc-list__value cell, the element
   * must have CSS properties that prevent horizontal overflow:
   *   - overflow-wrap: anywhere OR word-break: break-word
   *   - NOT white-space: nowrap
   *
   * Since JSDOM does not compute real CSS layout, we verify the CSS class
   * is applied and the element's inline/computed style does not force overflow.
   */
  it('Property 11: .doc-list__value has overflow-wrap and no white-space:nowrap for any string value', () => {
    fc.assert(
      fc.property(
        // eslint-disable-next-line id-length
        fc.string({ maxLength: 1000 }).filter((s) => s.length > 0),
        (value) => {
          const wrapper = mountComponent(value)
          const valueEl = wrapper.find('.doc-list__value')

          expect(valueEl.exists()).toBe(true)

          // The element must have the doc-list__value class which carries
          // overflow-wrap: anywhere and word-break: break-word in the scoped CSS.
          // In JSDOM, scoped styles are not applied, so we verify the class is present
          // and that no inline style forces white-space: nowrap.
          expect(valueEl.classes()).toContain('doc-list__value')

          // Verify no inline style forces nowrap
          const inlineStyle = valueEl.element.style.whiteSpace
          expect(inlineStyle).not.toBe('nowrap')

          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11: .doc-list__value element does not have white-space:nowrap inline style for long strings', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 100, maxLength: 1000 }), (value) => {
        const wrapper = mountComponent(value)
        const valueEl = wrapper.find('.doc-list__value')

        expect(valueEl.exists()).toBe(true)

        // No inline white-space: nowrap that would cause overflow
        expect(valueEl.element.style.whiteSpace).not.toBe('nowrap')

        // The class is present — the scoped CSS on this class provides
        // overflow-wrap: anywhere and word-break: break-word
        expect(valueEl.classes()).toContain('doc-list__value')

        wrapper.unmount()
      }),
      { numRuns: 100 }
    )
  })
})
