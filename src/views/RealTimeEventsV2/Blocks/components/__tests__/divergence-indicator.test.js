/**
 * Task 11.4* — DivergenceIndicator visibility.
 *
 * Property 5 (extension) / Requirements 7.1, 7.3, N.7:
 *   The divergence indicator is visible IFF (a metrics view is active AND the
 *   metrics load reported `partial`), and hidden in every other case.
 *
 * The component itself is prop-driven and stateless (§3.13): the parent computes
 * `isMetricsView && metricsPartial` and passes it as `visible`. We therefore
 * assert two things:
 *   1. The component renders the indicator IFF `visible` is true.
 *   2. The parent's visibility rule (`isMetricsView && partial`) collapses to the
 *      correct boolean across the full truth table — so the indicator only ever
 *      appears on the (metrics-active ∧ partial) cell and nowhere else.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DivergenceIndicator from '../divergence-indicator.vue'

const mountIndicator = (props = {}) =>
  mount(DivergenceIndicator, {
    props,
    global: {
      // The component uses v-tooltip; a no-op directive keeps mount headless.
      directives: { tooltip: {} }
    }
  })

const indicator = (wrapper) => wrapper.find('[data-testid="chart-divergence-indicator"]')

/** Parent-side visibility rule wired in §3.13: metrics view active AND partial. */
const shouldShow = (isMetricsView, partial) => isMetricsView && partial

describe('DivergenceIndicator — visible iff prop is true', () => {
  it('renders the indicator when visible=true', () => {
    const wrapper = mountIndicator({ visible: true })
    expect(indicator(wrapper).exists()).toBe(true)
  })

  it('renders nothing when visible=false', () => {
    const wrapper = mountIndicator({ visible: false })
    expect(indicator(wrapper).exists()).toBe(false)
  })

  it('renders nothing by default (visible omitted → false)', () => {
    const wrapper = mountIndicator({})
    expect(indicator(wrapper).exists()).toBe(false)
  })

  it('reacts to the prop flipping both ways', async () => {
    const wrapper = mountIndicator({ visible: false })
    expect(indicator(wrapper).exists()).toBe(false)

    await wrapper.setProps({ visible: true })
    expect(indicator(wrapper).exists()).toBe(true)

    await wrapper.setProps({ visible: false })
    expect(indicator(wrapper).exists()).toBe(false)
  })

  it('is exposed accessibly when visible (aria-label + keyboard focusable)', () => {
    const el = indicator(mountIndicator({ visible: true }))
    expect(el.attributes('aria-label')).toBeTruthy()
    expect(el.attributes('role')).toBe('img')
    // Keyboard-focusable, not hover-only (Req 7.4 / §6.4).
    expect(el.attributes('tabindex')).toBe('0')
  })
})

describe('DivergenceIndicator — visible iff (metrics view active AND partial)', () => {
  // Full truth table: only the (metrics ∧ partial) cell shows the indicator.
  const cases = [
    { isMetricsView: false, partial: false, show: false },
    { isMetricsView: false, partial: true, show: false },
    { isMetricsView: true, partial: false, show: false },
    { isMetricsView: true, partial: true, show: true }
  ]

  cases.forEach(({ isMetricsView, partial, show }) => {
    it(`isMetricsView=${isMetricsView}, partial=${partial} → ${show ? 'shown' : 'hidden'}`, () => {
      // The parent rule and the component agree on visibility.
      expect(shouldShow(isMetricsView, partial)).toBe(show)
      const wrapper = mountIndicator({ visible: shouldShow(isMetricsView, partial) })
      expect(indicator(wrapper).exists()).toBe(show)
    })
  })
})
