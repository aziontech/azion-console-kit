/* global globalThis */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EventsSummaryBar from '../events-summary-bar.vue'

// Stub localStorage so collapsed-state persistence doesn't bleed between tests
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
  })
  localStorageMock.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Mount helper — EventsSummaryBar has no PrimeVue dependencies in its template,
 * so no global stubs are needed beyond the default @vue/test-utils setup.
 */
const mountBar = (kpis) =>
  mount(EventsSummaryBar, {
    props: { kpis }
  })

// ─── HTTP dataset KPIs ────────────────────────────────────────────────────────

const httpKpis = {
  total: 10000,
  clientErrors: 420,
  serverErrors: 55,
  avgRequestTime: 0.123,
  supportsStatusBreakdown: true,
  supportsRequestTime: true
}

describe('EventsSummaryBar — HTTP dataset (supportsStatusBreakdown + supportsRequestTime)', () => {
  it('renders the expanded grid by default', () => {
    const wrapper = mountBar(httpKpis)
    expect(wrapper.find('[data-testid="events-summary-bar-grid"]').exists()).toBe(true)
  })

  it('renders a numeric value for CLIENT ERRORS (4XX)', () => {
    const wrapper = mountBar(httpKpis)
    const cards = wrapper.findAll('.events-summary-bar__card')
    // eslint-disable-next-line id-length
    const clientErrorCard = cards.find((c) => c.text().includes('CLIENT ERRORS'))
    expect(clientErrorCard).toBeTruthy()
    // Should show the formatted number, not the "—" muted placeholder
    expect(clientErrorCard.find('.events-summary-bar__value').text()).not.toBe('—')
    expect(clientErrorCard.find('.events-summary-bar__value').text()).toMatch(/\d/)
  })

  it('renders a numeric value for SERVER ERRORS (5XX)', () => {
    const wrapper = mountBar(httpKpis)
    const cards = wrapper.findAll('.events-summary-bar__card')
    // eslint-disable-next-line id-length
    const serverErrorCard = cards.find((c) => c.text().includes('SERVER ERRORS'))
    expect(serverErrorCard).toBeTruthy()
    expect(serverErrorCard.find('.events-summary-bar__value').text()).not.toBe('—')
    expect(serverErrorCard.find('.events-summary-bar__value').text()).toMatch(/\d/)
  })

  it('renders a numeric value for AVG REQUEST TIME', () => {
    const wrapper = mountBar(httpKpis)
    const cards = wrapper.findAll('.events-summary-bar__card')
    // eslint-disable-next-line id-length
    const avgCard = cards.find((c) => c.text().includes('AVG REQUEST TIME'))
    expect(avgCard).toBeTruthy()
    // Should show a formatted seconds value like "0.123s"
    expect(avgCard.find('.events-summary-bar__value').text()).toMatch(/\d.*s/)
  })

  it('does NOT render "Not available for this dataset" for any card', () => {
    const wrapper = mountBar(httpKpis)
    expect(wrapper.text()).not.toContain('Not available for this dataset')
  })

  it('renders a percentage sub-label for client errors', () => {
    const wrapper = mountBar(httpKpis)
    const cards = wrapper.findAll('.events-summary-bar__card')
    // eslint-disable-next-line id-length
    const clientErrorCard = cards.find((c) => c.text().includes('CLIENT ERRORS'))
    expect(clientErrorCard.find('.events-summary-bar__sub').text()).toMatch(/% of total/)
  })
})

// ─── Non-HTTP dataset KPIs ────────────────────────────────────────────────────

const nonHttpKpis = {
  total: 5000,
  clientErrors: 0,
  serverErrors: 0,
  avgRequestTime: 0,
  supportsStatusBreakdown: false,
  supportsRequestTime: false
}

describe('EventsSummaryBar — non-HTTP dataset (supportsStatusBreakdown=false, supportsRequestTime=false)', () => {
  it('renders the expanded grid', () => {
    const wrapper = mountBar(nonHttpKpis)
    expect(wrapper.find('[data-testid="events-summary-bar-grid"]').exists()).toBe(true)
  })

  it('renders "Not available for this dataset" for CLIENT ERRORS (4XX)', () => {
    const wrapper = mountBar(nonHttpKpis)
    const cards = wrapper.findAll('.events-summary-bar__card')
    // eslint-disable-next-line id-length
    const clientErrorCard = cards.find((c) => c.text().includes('CLIENT ERRORS'))
    expect(clientErrorCard).toBeTruthy()
    expect(clientErrorCard.text()).toContain('Not available for this dataset')
  })

  it('renders "Not available for this dataset" for SERVER ERRORS (5XX)', () => {
    const wrapper = mountBar(nonHttpKpis)
    const cards = wrapper.findAll('.events-summary-bar__card')
    // eslint-disable-next-line id-length
    const serverErrorCard = cards.find((c) => c.text().includes('SERVER ERRORS'))
    expect(serverErrorCard).toBeTruthy()
    expect(serverErrorCard.text()).toContain('Not available for this dataset')
  })

  it('renders "Not available for this dataset" for AVG REQUEST TIME', () => {
    const wrapper = mountBar(nonHttpKpis)
    const cards = wrapper.findAll('.events-summary-bar__card')
    // eslint-disable-next-line id-length
    const avgCard = cards.find((c) => c.text().includes('AVG REQUEST TIME'))
    expect(avgCard).toBeTruthy()
    expect(avgCard.text()).toContain('Not available for this dataset')
  })

  it('renders the muted "—" placeholder value for all three cards', () => {
    const wrapper = mountBar(nonHttpKpis)
    const mutedValues = wrapper.findAll('.events-summary-bar__value--muted')
    expect(mutedValues.length).toBe(3)
    mutedValues.forEach((el) => expect(el.text()).toBe('—'))
  })
})

// ─── Null kpis ────────────────────────────────────────────────────────────────

describe('EventsSummaryBar — null kpis (loading / empty state)', () => {
  it('mounts without throwing when kpis is null', () => {
    expect(() => mountBar(null)).not.toThrow()
  })

  it('renders the component root element', () => {
    const wrapper = mountBar(null)
    expect(wrapper.find('[data-testid="events-summary-bar"]').exists()).toBe(true)
  })

  it('renders the expanded grid (null treated as empty object — all flags falsy)', () => {
    const wrapper = mountBar(null)
    // Grid should still render; all cards will show "Not available for this dataset"
    expect(wrapper.find('[data-testid="events-summary-bar-grid"]').exists()).toBe(true)
  })

  it('renders three muted "—" placeholders when kpis is null', () => {
    const wrapper = mountBar(null)
    const mutedValues = wrapper.findAll('.events-summary-bar__value--muted')
    expect(mutedValues.length).toBe(3)
  })
})

// ─── Toggle collapse ──────────────────────────────────────────────────────────

describe('EventsSummaryBar — collapse toggle', () => {
  it('hides the grid when the header button is clicked', async () => {
    const wrapper = mountBar(httpKpis)
    expect(wrapper.find('[data-testid="events-summary-bar-grid"]').exists()).toBe(true)
    await wrapper.find('[data-testid="events-summary-bar-toggle"]').trigger('click')
    expect(wrapper.find('[data-testid="events-summary-bar-grid"]').exists()).toBe(false)
  })

  it('shows the grid again after a second click', async () => {
    const wrapper = mountBar(httpKpis)
    const toggle = wrapper.find('[data-testid="events-summary-bar-toggle"]')
    await toggle.trigger('click')
    await toggle.trigger('click')
    expect(wrapper.find('[data-testid="events-summary-bar-grid"]').exists()).toBe(true)
  })

  it('shows inline condensed values when collapsed (HTTP dataset)', async () => {
    const wrapper = mountBar(httpKpis)
    await wrapper.find('[data-testid="events-summary-bar-toggle"]').trigger('click')
    // Inline section should appear with 4xx / 5xx / avg values
    expect(wrapper.find('.events-summary-bar__inline').exists()).toBe(true)
  })
})
