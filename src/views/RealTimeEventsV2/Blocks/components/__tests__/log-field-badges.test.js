/* global globalThis */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LogFieldBadges from '../log-field-badges.vue'
import PrimeButton from '@aziontech/webkit/button'

const makeSummary = () => [
  { key: 'host', value: 'example.com' },
  { key: 'status', value: 200 }
]

const mountComponent = (props = {}) =>
  mount(LogFieldBadges, {
    props: { summary: makeSummary(), ...props },
    global: {
      stubs: {
        // Stub by the actual imported component reference so Vue Test Utils resolves it
        [PrimeButton.name ?? 'PrimeButton']: {
          template:
            '<button :aria-label="ariaLabel" @click.stop="$emit(\'click\', $event)"><slot /></button>',
          props: ['icon', 'text', 'rounded', 'size', 'ariaLabel', 'aria-label'],
          emits: ['click']
        }
      },
      // Capture the webkit v-tooltip binding value so tests can assert the full
      // value reaches the (single) tooltip — the native `title` was removed to
      // avoid a double tooltip (task 15.2 follow-up).
      directives: {
        tooltip: {
          mounted(el, binding) {
            const val = binding.value?.value ?? binding.value
            if (val != null) el.setAttribute('data-tooltip-value', String(val))
          }
        }
      }
    }
  })

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── Click-to-filter: plain click → add-filter ────────────────────────────────

describe('LogFieldBadges — plain click on value span', () => {
  it('emits add-filter with the correct key and value', async () => {
    // Ensure selection appears collapsed (no text selected)
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: true })

    const wrapper = mountComponent()
    const valueSpans = wrapper.findAll('.log-badge__value')
    expect(valueSpans.length).toBeGreaterThan(0)

    // Simulate mousedown → mouseup → click on the first value span
    const span = valueSpans[0]
    await span.trigger('mousedown', { clientX: 10, clientY: 10 })
    await span.trigger('mouseup', { clientX: 10, clientY: 10 })
    await span.trigger('click', { altKey: false, clientX: 10, clientY: 10 })

    const emitted = wrapper.emitted('add-filter')
    expect(emitted).toBeTruthy()
    expect(emitted[0]).toEqual(['host', 'example.com'])
  })

  it('emits add-filter for a numeric value', async () => {
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: true })

    const wrapper = mountComponent()
    const valueSpans = wrapper.findAll('.log-badge__value')

    const span = valueSpans[1]
    await span.trigger('mousedown', { clientX: 5, clientY: 5 })
    await span.trigger('mouseup', { clientX: 5, clientY: 5 })
    await span.trigger('click', { altKey: false, clientX: 5, clientY: 5 })

    const emitted = wrapper.emitted('add-filter')
    expect(emitted).toBeTruthy()
    expect(emitted[0]).toEqual(['status', 200])
  })
})

// ─── Click-to-filter: Alt+click → exclude-filter ─────────────────────────────

describe('LogFieldBadges — Alt+click on value span', () => {
  it('emits exclude-filter with the correct key and value', async () => {
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: true })

    const wrapper = mountComponent()
    const valueSpans = wrapper.findAll('.log-badge__value')

    const span = valueSpans[0]
    await span.trigger('mousedown', { clientX: 10, clientY: 10 })
    await span.trigger('mouseup', { clientX: 10, clientY: 10 })
    await span.trigger('click', { altKey: true, clientX: 10, clientY: 10 })

    const emitted = wrapper.emitted('exclude-filter')
    expect(emitted).toBeTruthy()
    expect(emitted[0]).toEqual(['host', 'example.com'])
  })

  it('does NOT emit add-filter on Alt+click', async () => {
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: true })

    const wrapper = mountComponent()
    const span = wrapper.findAll('.log-badge__value')[0]
    await span.trigger('mousedown', { clientX: 10, clientY: 10 })
    await span.trigger('mouseup', { clientX: 10, clientY: 10 })
    await span.trigger('click', { altKey: true, clientX: 10, clientY: 10 })

    expect(wrapper.emitted('add-filter')).toBeFalsy()
  })
})

// ─── Text-selection gate: non-collapsed selection → no emit ──────────────────

describe('LogFieldBadges — click over a text selection', () => {
  it('emits neither add-filter nor exclude-filter when selection is non-collapsed', async () => {
    // Simulate user having text selected
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: false })

    const wrapper = mountComponent()
    const span = wrapper.findAll('.log-badge__value')[0]
    await span.trigger('mousedown', { clientX: 10, clientY: 10 })
    await span.trigger('mouseup', { clientX: 10, clientY: 10 })
    await span.trigger('click', { altKey: false, clientX: 10, clientY: 10 })

    expect(wrapper.emitted('add-filter')).toBeFalsy()
    expect(wrapper.emitted('exclude-filter')).toBeFalsy()
  })

  it('also suppresses Alt+click when selection is non-collapsed', async () => {
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: false })

    const wrapper = mountComponent()
    const span = wrapper.findAll('.log-badge__value')[0]
    await span.trigger('mousedown', { clientX: 10, clientY: 10 })
    await span.trigger('mouseup', { clientX: 10, clientY: 10 })
    await span.trigger('click', { altKey: true, clientX: 10, clientY: 10 })

    expect(wrapper.emitted('add-filter')).toBeFalsy()
    expect(wrapper.emitted('exclude-filter')).toBeFalsy()
  })
})

// ─── Hover PrimeButton: add-filter on click ───────────────────────────────────

describe('LogFieldBadges — hover PrimeButton filter actions', () => {
  // Fix C1 (render weight): the two action PrimeButtons are now MOUNTED only for
  // the badge under the pointer (v-if on hoveredIndex) instead of ~2 per badge
  // hidden via CSS opacity. The hover UX is identical; tests must hover first.
  const hoverFirstBadge = async (wrapper) => {
    await wrapper.findAll('.log-badge')[0].trigger('mouseenter')
  }

  it('mounts the action buttons only while a badge is hovered (fix C1)', async () => {
    const wrapper = mountComponent()

    // Before hover: no action buttons mounted at all.
    expect(wrapper.find('button[aria-label="Filter for value"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Filter out value"]').exists()).toBe(false)

    const badge = wrapper.findAll('.log-badge')[0]
    await badge.trigger('mouseenter')
    expect(wrapper.find('button[aria-label="Filter for value"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Filter out value"]').exists()).toBe(true)

    await badge.trigger('mouseleave')
    expect(wrapper.find('button[aria-label="Filter for value"]').exists()).toBe(false)
  })

  it('emits add-filter when the filter PrimeButton is clicked', async () => {
    const wrapper = mountComponent()
    await hoverFirstBadge(wrapper)

    // Find the rendered button with aria-label="Filter for value"
    const filterBtn = wrapper.find('button[aria-label="Filter for value"]')
    expect(filterBtn.exists()).toBe(true)
    await filterBtn.trigger('click')

    const emitted = wrapper.emitted('add-filter')
    expect(emitted).toBeTruthy()
    expect(emitted[0]).toEqual(['host', 'example.com'])
  })

  it('emits exclude-filter when the exclude PrimeButton is clicked', async () => {
    const wrapper = mountComponent()
    await hoverFirstBadge(wrapper)

    const excludeBtn = wrapper.find('button[aria-label="Filter out value"]')
    expect(excludeBtn.exists()).toBe(true)
    await excludeBtn.trigger('click')

    const emitted = wrapper.emitted('exclude-filter')
    expect(emitted).toBeTruthy()
    expect(emitted[0]).toEqual(['host', 'example.com'])
  })

  it('does NOT emit add-filter from the PrimeButton when selection is non-collapsed', async () => {
    // PrimeButton uses @click.stop directly on emit — it bypasses useClickToFilter,
    // so it should still emit regardless of selection state (it's the explicit hover control)
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: false })

    const wrapper = mountComponent()
    await hoverFirstBadge(wrapper)
    const filterBtn = wrapper.find('button[aria-label="Filter for value"]')
    expect(filterBtn.exists()).toBe(true)
    await filterBtn.trigger('click')

    // The PrimeButton bypasses the selection gate — it always emits
    const emitted = wrapper.emitted('add-filter')
    expect(emitted).toBeTruthy()
  })
})

// ─── hiddenCount prop drives "+N more" (no self-owned ResizeObserver) ─────────

describe('LogFieldBadges — hiddenCount prop', () => {
  it('renders no "+N more" badge when hiddenCount is 0 (default)', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.log-badge--more').exists()).toBe(false)
  })

  it('renders "+N more" badge from the hiddenCount prop', () => {
    const wrapper = mountComponent({ hiddenCount: 3 })
    const more = wrapper.find('.log-badge--more')
    expect(more.exists()).toBe(true)
    expect(more.text()).toBe('+3 more')
  })

  it('emits toggle-expand when the "+N more" badge is clicked', async () => {
    const wrapper = mountComponent({ hiddenCount: 2 })
    await wrapper.find('.log-badge--more').trigger('click')
    expect(wrapper.emitted('toggle-expand')).toBeTruthy()
  })

  it('reacts to hiddenCount prop changes', async () => {
    const wrapper = mountComponent({ hiddenCount: 0 })
    expect(wrapper.find('.log-badge--more').exists()).toBe(false)
    await wrapper.setProps({ hiddenCount: 5 })
    expect(wrapper.find('.log-badge--more').text()).toBe('+5 more')
  })

  it('does NOT construct a ResizeObserver (measurement moved to useOverflowMeasure)', () => {
    const roSpy = vi.fn()
    const originalRO = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      constructor(...args) {
        roSpy(...args)
      }

      observe() {}
      disconnect() {}
      unobserve() {}
    }
    try {
      mountComponent({ hiddenCount: 1 })
      expect(roSpy).not.toHaveBeenCalled()
    } finally {
      globalThis.ResizeObserver = originalRO
    }
  })
})

// ─── Highlight rendering (pre-escaped, computed once) ─────────────────────────

describe('LogFieldBadges — highlight rendering', () => {
  it('wraps the matched substring in a <mark> and escapes surrounding text', () => {
    const wrapper = mountComponent({
      summary: [{ key: 'host', value: 'a<b>example.com' }],
      searchQuery: 'example'
    })
    // Assert on the v-html payload only (element.innerHTML), not attributes.
    const innerHtml = wrapper.find('.log-badge__value').element.innerHTML
    expect(innerHtml).toContain('<mark class="search-highlight">example</mark>')
    // Untrusted "<b>" must be escaped, never rendered as markup.
    expect(innerHtml).toContain('a&lt;b&gt;')
    // No injected element node — the escaped <b> is inert text.
    expect(wrapper.find('.log-badge__value b').exists()).toBe(false)
  })

  it('escapes the value with no <mark> when searchQuery is empty', () => {
    const wrapper = mountComponent({
      summary: [{ key: 'host', value: '<script>x' }],
      searchQuery: ''
    })
    const innerHtml = wrapper.find('.log-badge__value').element.innerHTML
    expect(innerHtml).not.toContain('<mark')
    expect(innerHtml).toContain('&lt;script&gt;x')
  })
})

// ─── Task 15.2: full value preserved + tooltip exposes the complete URI ──────

describe('LogFieldBadges — full value on hover (task 15.2)', () => {
  const LONG_URI =
    '/api/v1/resources/very/deep/path/segment?query=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&page=2&extra=zzzzzzzzzz'

  it('carries the FULL untruncated value in the native title attribute', () => {
    const wrapper = mountComponent({ summary: [{ key: 'requestUri', value: LONG_URI }] })
    const value = wrapper.find('.log-badge__value')
    // NATIVE title tooltip (single, browser-rendered). The webkit v-tooltip
    // directive was removed from value spans: it rendered off-theme for
    // body-teleported tooltips AND PrimeVue 3.35's tooltip `updated` hook leaks
    // 3 DOM listeners per element per re-render — native title has zero JS cost.
    expect(value.attributes('title')).toBe(LONG_URI)
  })

  it('emits the FULL value on click, so the filter matches the applied URI', async () => {
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: true })
    const wrapper = mountComponent({ summary: [{ key: 'requestUri', value: LONG_URI }] })
    const span = wrapper.find('.log-badge__value')
    await span.trigger('mousedown', { clientX: 10, clientY: 10 })
    await span.trigger('mouseup', { clientX: 10, clientY: 10 })
    await span.trigger('click', { altKey: false, clientX: 10, clientY: 10 })
    expect(wrapper.emitted('add-filter')[0]).toEqual(['requestUri', LONG_URI])
  })

  it('shortens the DISPLAYED text (visual only) while keeping the value intact', () => {
    const wrapper = mountComponent({ summary: [{ key: 'requestUri', value: LONG_URI }] })
    const value = wrapper.find('.log-badge__value')
    // Rendered text is visually shortened (ellipsis) but the underlying value
    // (exposed via the native title tooltip) stays complete — no data-level loss.
    expect(value.element.textContent.length).toBeLessThan(LONG_URI.length)
    expect(value.attributes('title')).toBe(LONG_URI)
  })
})

// ─── Task 15.1: silent-empty summary default is now observable ───────────────

describe('LogFieldBadges — invalid summary is observable, not a silent blank (task 15.1)', () => {
  it('renders no badges and warns in dev when summary is not an array', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // A wrong binding (e.g. passing the row wrapper instead of `row.summary`)
    // used to resolve to a silent empty column. It must now be observable.
    const wrapper = mountComponent({ summary: { not: 'an array' } })
    expect(wrapper.findAll('.log-badge__value')).toHaveLength(0)
    if (import.meta.env?.DEV) {
      expect(warnSpy).toHaveBeenCalled()
    }
  })

  it('does not throw and renders empty for a missing summary', () => {
    const wrapper = mountComponent({ summary: undefined })
    expect(wrapper.findAll('.log-badge__value')).toHaveLength(0)
  })
})

// ─── Invalid value gate ───────────────────────────────────────────────────────

describe('LogFieldBadges — invalid value gate', () => {
  it('does not emit add-filter for a dash "-" value', async () => {
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: true })

    const wrapper = mountComponent({
      summary: [{ key: 'empty', value: '-' }]
    })

    const span = wrapper.find('.log-badge__value')
    await span.trigger('mousedown', { clientX: 10, clientY: 10 })
    await span.trigger('mouseup', { clientX: 10, clientY: 10 })
    await span.trigger('click', { altKey: false, clientX: 10, clientY: 10 })

    expect(wrapper.emitted('add-filter')).toBeFalsy()
  })

  it('does not emit add-filter for an empty string value', async () => {
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: true })

    const wrapper = mountComponent({
      summary: [{ key: 'empty', value: '' }]
    })

    const span = wrapper.find('.log-badge__value')
    await span.trigger('mousedown', { clientX: 10, clientY: 10 })
    await span.trigger('mouseup', { clientX: 10, clientY: 10 })
    await span.trigger('click', { altKey: false, clientX: 10, clientY: 10 })

    expect(wrapper.emitted('add-filter')).toBeFalsy()
  })
})
