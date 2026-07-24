import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ViewSelector from '../view-selector.vue'

/**
 * Unit tests for ViewSelector (task 7.4 extraction from event-chart.vue).
 *
 * Guards the public contract the chart shell relies on:
 *   - selecting an item emits `update:view` with the item's value and closes
 *     the menu;
 *   - opening the menu invokes the `hideTooltip` callback (residual c3 tooltip
 *     dismissal on touch);
 *   - the exposed `closeViewMenu()` closes an open menu;
 *   - the dismiss/reposition document + window listeners are removed on unmount
 *     (no leak).
 */

const VIEW_OPTIONS = [
  {
    group: 'Events',
    items: [
      { label: 'None', value: 'events:none' },
      { label: 'Status', value: 'events:status' }
    ]
  }
]

const matchMediaStub = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {
    return false
  }
})

let originalMatchMedia

beforeEach(() => {
  originalMatchMedia = window.matchMedia
  window.matchMedia = matchMediaStub
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  vi.restoreAllMocks()
})

const mountSelector = (props = {}) =>
  mount(ViewSelector, {
    attachTo: document.body,
    props: {
      view: 'events:none',
      viewOptions: VIEW_OPTIONS,
      ...props
    }
  })

const openMenu = async (wrapper) => {
  await wrapper.find('.chart-header__view-trigger').trigger('click')
  await nextTick()
}

describe('ViewSelector', () => {
  it('renders the currently selected view label on the trigger', () => {
    const wrapper = mountSelector({ view: 'events:status' })
    expect(wrapper.find('.chart-header__view-trigger-label').text()).toBe('Status')
    wrapper.unmount()
  })

  it('emits update:view with the chosen value and closes the menu on select', async () => {
    const wrapper = mountSelector()
    await openMenu(wrapper)

    const options = document.querySelectorAll('[role="option"]')
    // Pick the second option ("Status").
    options[1].click()
    await nextTick()

    expect(wrapper.emitted('update:view')).toBeTruthy()
    expect(wrapper.emitted('update:view')[0]).toEqual(['events:status'])
    // Menu closed → trigger reports collapsed.
    expect(wrapper.find('.chart-header__view-trigger').attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('invokes hideTooltip when the menu opens', async () => {
    const hideTooltip = vi.fn()
    const wrapper = mountSelector({ hideTooltip })
    await openMenu(wrapper)
    expect(hideTooltip).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('closes an open menu via the exposed closeViewMenu()', async () => {
    const wrapper = mountSelector()
    await openMenu(wrapper)
    expect(wrapper.find('.chart-header__view-trigger').attributes('aria-expanded')).toBe('true')

    wrapper.vm.closeViewMenu()
    await nextTick()
    expect(wrapper.find('.chart-header__view-trigger').attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('removes its document/window listeners on unmount (no leak)', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const winRemoveSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mountSelector()
    wrapper.unmount()

    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(winRemoveSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true)
    expect(winRemoveSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
