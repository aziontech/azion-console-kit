import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// loadTotalCount issues a single aggregate count query through this adapter.
// Each test installs its own mock return via mockAdapterCount(...).
vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: { request: vi.fn() }
}))

vi.mock('@/stores/graphql-query', () => ({
  useGraphQLStore: () => ({ setQuery: vi.fn() })
}))

import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { useEventsData } from '../useEventsData.js'

const DAY = 24 * 60 * 60 * 1000

/**
 * SEAM: the displayed total count.
 *
 * `recordsFound` is the ref rendered verbatim by tab-panel-block.vue:
 *   <DiscoverToolbar :recordsFound="recordsFound" />
 *   <LoadMoreFooter  :recordsFound="recordsFound" />
 *   <ChartBlock @total-computed="setRecordsFound" />
 * So the value/format of `recordsFound.value` IS the value/format the user sees.
 *
 * Task 7.1 will make the count a numeric single-writer and drop the
 * string→numeric parse-back inside load(). These characterization assertions
 * pin the CURRENT observable displayed-total contract that must survive that
 * refactor: the value shown to the user must stay identical (same number, same
 * locale formatting, same placeholder / zero rendering).
 *
 * Public seam: loadTotalCount is internal — it is exercised here through the
 * public load(). With hasChartConfig=false the chart summary resolves to null,
 * so the count-driven writer (loadTotalCount) is the one that sets the display.
 *
 * Overlap note: setRecordsFound's positive/zero/negative formatting is already
 * covered by useEventsData.prop.test.js, and the chart-driven zero-total
 * display ('0') by useEventsData.chart-driven-fetch.spec.js. This file pins the
 * NOT-yet-covered writers/gates: the initial placeholder, the loadTotalCount
 * (active-filter) writer incl. count=0, and the single-writer gate that blocks
 * setRecordsFound from overwriting an accurate count.
 */

// A filter with an active field so hasActiveFilters() is true and
// loadTotalCount actually issues the aggregate count query inside load().
const activeFilterData = () =>
  ref({
    tsRange: {
      tsRangeBegin: new Date(Date.now() - DAY).toISOString(),
      tsRangeEnd: new Date(Date.now()).toISOString()
    },
    fields: [{ valueField: 'host', operator: 'Eq', value: 'example.com' }]
  })

function createInstance({ locale = 'en-US', filterData } = {}) {
  return useEventsData({
    filterData: filterData ?? activeFilterData(),
    // Non-empty list: an EMPTY list now authoritatively zeroes the badge
    // ("0 Documents found"), which would mask the count-path formatting these
    // tests exercise.
    listService: ref(
      vi.fn(async () => ({ data: [{ id: 'row-1', ts: 1, tsFormat: 't1', summary: [] }] }))
    ),
    loadChartAggregation: ref(vi.fn()),
    tabSelected: ref({ dataset: 'test' }),
    pageSize: ref(50),
    hasChartConfig: ref(false),
    onError: vi.fn(),
    locale
  })
}

function mockAdapterCount(count) {
  AxiosHttpClientAdapter.request.mockResolvedValue({
    statusCode: 200,
    body: { data: { test: [{ count }] } }
  })
}

describe('useEventsData — displayed total (recordsFound) observable contract', () => {
  beforeEach(() => {
    AxiosHttpClientAdapter.request.mockReset()
  })

  it('initial displayed total is the em-dash placeholder before any load', () => {
    const instance = createInstance()
    // The user sees "—" (nothing counted yet), not "0" and not an empty string.
    expect(instance.recordsFound.value).toBe('—')
  })

  it('active-filter count path shows the count formatted for the locale', async () => {
    mockAdapterCount(12345)
    const instance = createInstance({ locale: 'en-US' })

    await instance.load()

    // Displayed exactly as Intl.NumberFormat renders it for the locale.
    expect(instance.recordsFound.value).toBe(new Intl.NumberFormat('en-US').format(12345))
    // Sanity: this is a grouped, non-trivial value (guards against a raw String()).
    expect(instance.recordsFound.value).toBe('12,345')
  })

  it('count path honors the configured locale for grouping separators', async () => {
    mockAdapterCount(12345)
    const instance = createInstance({ locale: 'de-DE' })

    await instance.load()

    expect(instance.recordsFound.value).toBe(new Intl.NumberFormat('de-DE').format(12345))
    // de-DE groups with periods; must differ from the en-US comma rendering.
    expect(instance.recordsFound.value).not.toBe(new Intl.NumberFormat('en-US').format(12345))
  })

  it('active filter with zero matching rows shows "0", not the placeholder', async () => {
    // Active filter + a real count of zero: the count query resolved with 0, so
    // the displayed total is the formatted number "0" (an accurate count),
    // distinct from the not-yet-known placeholder "—".
    mockAdapterCount(0)
    const instance = createInstance({ locale: 'en-US' })

    await instance.load()

    expect(instance.recordsFound.value).toBe(new Intl.NumberFormat('en-US').format(0))
    expect(instance.recordsFound.value).toBe('0')
  })

  it('once the count path fixes an accurate count, setRecordsFound does not overwrite it', async () => {
    mockAdapterCount(7000)
    const instance = createInstance({ locale: 'en-US' })

    await instance.load()
    const fixed = instance.recordsFound.value
    expect(fixed).toBe(new Intl.NumberFormat('en-US').format(7000))

    // A later chart total arrives via @total-computed. Because the count path
    // already set an accurate count, the displayed total is NOT replaced.
    instance.setRecordsFound(999)

    expect(instance.recordsFound.value).toBe(fixed)
  })

  it('with no active filters, the chart total (setRecordsFound) drives the display', async () => {
    // No active filter → the count query is skipped entirely; recordsFound is
    // driven by the chart-reported total via @total-computed → setRecordsFound.
    const instance = createInstance({
      locale: 'en-US',
      filterData: ref({
        tsRange: {
          tsRangeBegin: new Date(Date.now() - DAY).toISOString(),
          tsRangeEnd: new Date(Date.now()).toISOString()
        },
        fields: []
      })
    })

    // The chart-provided total is what the user sees.
    instance.setRecordsFound(4200)
    expect(instance.recordsFound.value).toBe(new Intl.NumberFormat('en-US').format(4200))
  })
})
