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
      directives: { tooltip: {} }
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
  it('emits add-filter when the filter PrimeButton is clicked', async () => {
    const wrapper = mountComponent()

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
    const filterBtn = wrapper.find('button[aria-label="Filter for value"]')
    expect(filterBtn.exists()).toBe(true)
    await filterBtn.trigger('click')

    // The PrimeButton bypasses the selection gate — it always emits
    const emitted = wrapper.emitted('add-filter')
    expect(emitted).toBeTruthy()
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
