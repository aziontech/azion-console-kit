import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, computed, effectScope } from 'vue'

// ── Service-boundary mocks ──────────────────────────────────────────────────
// useMetricsChart routes through these three modules. Mocking them lets us
// control resolution timing (deferred promises) to exercise supersession,
// and count invocations to assert the reload matrix / debounce coalescing.

const { loadMetricsFallback, loadMetricsSeries, loadFromEventsApi, loadMetricsAggregation } =
  vi.hoisted(() => ({
    loadMetricsFallback: vi.fn(),
    loadMetricsSeries: vi.fn(),
    loadFromEventsApi: vi.fn(),
    loadMetricsAggregation: vi.fn()
  }))

const { resolveChartApi } = vi.hoisted(() => ({ resolveChartApi: vi.fn(() => 'events') }))

vi.mock('@/services/real-time-events-service-v2/metrics-chart-service', () => ({
  loadMetricsFallback,
  loadMetricsSeries,
  loadFromEventsApi,
  loadMetricsAggregation,
  pivotGroupedData: vi.fn()
}))

vi.mock('@/services/real-time-events-service-v2/chart-api-router', () => ({
  resolveChartApi
}))

vi.mock('@/modules/filter-loaders/dataset-fields-loader', () => ({
  loadAggregableFields: vi.fn(() => Promise.resolve(null)),
  getAggregableFields: vi.fn(() => null)
}))

// vi.hoisted + vi.mock are hoisted above these imports by Vitest, so the
// composables load with the mocked service boundary already in place.
import { useMetricsChart } from '../useMetricsChart'
import { useChartConfig } from '../useChartConfig'

/** Deferred promise helper — lets a test decide exactly when a load resolves. */
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** Flush queued microtasks (awaited continuations + finally blocks). */
const flush = async (times = 6) => {
  for (let tick = 0; tick < times; tick += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve()
  }
}

const makeTsRange = (label = 'a') => ({
  tsRangeBegin: new Date('2024-01-01T00:00:00.000Z'),
  tsRangeEnd: new Date('2024-01-01T01:00:00.000Z'),
  label
})

// A config that hits the loadMetricsAggregation path (no metricsApiSeries /
// eventsApi keys) — the simplest branch to reason about for supersession.
const aggConfig = { metricsDataset: 'httpMetrics', aggregation: 'requests' }

/**
 * Run useMetricsChart inside an effect scope so onScopeDispose() has a scope to
 * bind to (avoids Vue warnings) and so tests can stop the scope explicitly.
 */
const mountMetricsChart = (filterData, options) => {
  const scope = effectScope()
  let api
  scope.run(() => {
    api = useMetricsChart(filterData, options)
  })
  return { ...api, scope }
}

beforeEach(() => {
  vi.clearAllMocks()
  resolveChartApi.mockReturnValue('events')
})

afterEach(() => {
  vi.useRealTimers()
})

// ─────────────────────────────────────────────────────────────────────────────
// useMetricsChart — supersession, debounce, isLoading, error fallback
// ─────────────────────────────────────────────────────────────────────────────
describe('useMetricsChart — supersession & robustness', () => {
  it('debounce coalesces a burst of load() calls into a single runLoad', async () => {
    vi.useFakeTimers()
    loadMetricsAggregation.mockResolvedValue([{ ts: 1 }])
    const filterData = ref({ tsRange: makeTsRange() })
    const { load } = mountMetricsChart(filterData)

    load(aggConfig)
    load(aggConfig)
    load(aggConfig)
    // Nothing fired yet — still inside the 50ms window.
    expect(loadMetricsAggregation).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    await Promise.resolve()

    expect(loadMetricsAggregation).toHaveBeenCalledTimes(1)
  })

  it('stale response never overwrites a newer one (supersession token)', async () => {
    vi.useFakeTimers()
    const first = deferred()
    const second = deferred()
    loadMetricsAggregation
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)

    const filterData = ref({ tsRange: makeTsRange() })
    const { data, load } = mountMetricsChart(filterData)

    // First load fires and is in-flight (awaiting first.promise).
    load(aggConfig)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(loadMetricsAggregation).toHaveBeenCalledTimes(1)

    // Second load fires and is in-flight — this supersedes the first.
    load(aggConfig)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(loadMetricsAggregation).toHaveBeenCalledTimes(2)

    // The NEWER response resolves first with the fresh data.
    second.resolve([{ ts: 'fresh' }])
    await flush()
    expect(data.value).toEqual([{ ts: 'fresh' }])

    // The STALE response resolves later — it must be discarded.
    first.resolve([{ ts: 'stale' }])
    await flush()
    expect(data.value).toEqual([{ ts: 'fresh' }])
  })

  it('isLoading stays true for the newest load when a stale one settles', async () => {
    vi.useFakeTimers()
    const first = deferred()
    const second = deferred()
    loadMetricsAggregation
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)

    const filterData = ref({ tsRange: makeTsRange() })
    const { isLoading, load } = mountMetricsChart(filterData)

    load(aggConfig)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    load(aggConfig)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(isLoading.value).toBe(true)

    // Stale (first) settles — must NOT flip isLoading off for the newer load.
    first.resolve([{ ts: 'stale' }])
    await flush()
    expect(isLoading.value).toBe(true)

    // Newest settles — now loading is done.
    second.resolve([{ ts: 'fresh' }])
    await flush()
    expect(isLoading.value).toBe(false)
  })

  it('resets data to [] when config is missing (dataset-orphan reset)', async () => {
    vi.useFakeTimers()
    loadMetricsAggregation.mockResolvedValue([{ ts: 1 }])
    const filterData = ref({ tsRange: makeTsRange() })
    const { data, load } = mountMetricsChart(filterData)

    // Seed with real data.
    load(aggConfig)
    vi.advanceTimersByTime(50)
    await flush()
    expect(data.value).toEqual([{ ts: 1 }])

    // Orphaned selection → runLoad receives no config → data cleared, no fetch.
    loadMetricsAggregation.mockClear()
    load(null)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(data.value).toEqual([])
    expect(loadMetricsAggregation).not.toHaveBeenCalled()
  })

  it('resets data to [] when tsRange is absent', async () => {
    vi.useFakeTimers()
    const filterData = ref({})
    const { data, load } = mountMetricsChart(filterData)

    load(aggConfig)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(data.value).toEqual([])
    expect(loadMetricsAggregation).not.toHaveBeenCalled()
  })

  it('onMetricsError fallback preserved: emits a typed error and clears data', async () => {
    vi.useFakeTimers()
    loadMetricsAggregation.mockRejectedValue(new Error('boom'))
    const onError = vi.fn()
    const filterData = ref({ tsRange: makeTsRange() })
    const { data, load } = mountMetricsChart(filterData, { onError })

    load(aggConfig)
    vi.advanceTimersByTime(50)
    await flush()

    expect(onError).toHaveBeenCalledTimes(1)
    const [err, cfg] = onError.mock.calls[0]
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('MetricsChartError')
    expect(cfg).toBe(aggConfig)
    expect(data.value).toEqual([])
  })

  it('a superseded error is swallowed (does not emit onError for stale load)', async () => {
    vi.useFakeTimers()
    const first = deferred()
    const second = deferred()
    loadMetricsAggregation
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)
    const onError = vi.fn()
    const filterData = ref({ tsRange: makeTsRange() })
    const { load } = mountMetricsChart(filterData, { onError })

    load(aggConfig)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    load(aggConfig)
    vi.advanceTimersByTime(50)
    await Promise.resolve()

    // The stale (first) load rejects — must be discarded, no onError.
    first.reject(new Error('stale boom'))
    await flush()
    expect(onError).not.toHaveBeenCalled()

    // Newest resolves cleanly.
    second.resolve([{ ts: 'ok' }])
    await flush()
    expect(onError).not.toHaveBeenCalled()
  })

  it('clears the pending debounce timer on scope dispose (no leaked runLoad)', async () => {
    vi.useFakeTimers()
    loadMetricsAggregation.mockResolvedValue([{ ts: 1 }])
    const filterData = ref({ tsRange: makeTsRange() })

    const scope = effectScope()
    let api
    scope.run(() => {
      api = useMetricsChart(filterData)
    })
    api.load(aggConfig)
    scope.stop()

    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(loadMetricsAggregation).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useChartConfig — reload matrix, brush dedup, initial-load-once
// ─────────────────────────────────────────────────────────────────────────────
describe('useChartConfig — metrics reactivity matrix', () => {
  const setup = (filterDataInit) => {
    const filterData = ref(filterDataInit)
    const metricsDashboards = ref([{ id: '357548675837198933', label: 'WAF' }])
    const filterSystemRef = ref({ syncDateRangeFromExternal: vi.fn() })
    const reloadListTableWithHash = vi.fn()

    // View SoT (task 9.4): the metrics selection is a read-only computed derived
    // from the single writable `selectedView`, INJECTED into useChartConfig.
    // The test drives the selection by writing `selectedView`, never the derived
    // computed (which is now read-only) — this is the flipped dual-ownership.
    const selectedView = ref('events:none')
    const selectedMetricsDashboard = computed(() => {
      const [scheme, ...rest] = String(selectedView.value).split(':')
      return scheme === 'metrics' ? rest.join(':') || null : null
    })

    let api
    const scope = effectScope()
    scope.run(() => {
      api = useChartConfig({
        filterData,
        metricsDashboards: computed(() => metricsDashboards.value),
        filterSystemRef,
        reloadListTableWithHash,
        accountTimezone: computed(() => 'UTC'),
        selectedMetricsDashboard
      })
    })

    return { filterData, metricsDashboards, reloadListTableWithHash, selectedView, scope, ...api }
  }

  // wafThreats routes via eventsApi → resolveChartApi('events') → loadFromEventsApi.
  // Drive the selection through the single writable View source.
  const selectWaf = async (api) => {
    api.selectedView.value = 'metrics:wafThreats'
    await nextTick()
  }

  it('initial metrics selection loads exactly once (no double-fire)', async () => {
    vi.useFakeTimers()
    loadFromEventsApi.mockResolvedValue([{ ts: 1 }])
    const api = setup({ tsRange: makeTsRange(), fields: [] })

    await selectWaf(api)
    vi.advanceTimersByTime(50)
    await Promise.resolve()

    // The selectedMetricsDashboard watch fires the initial load; the filterData
    // watch has no `immediate`, so it must NOT add a second load.
    expect(loadFromEventsApi).toHaveBeenCalledTimes(1)
    api.scope.stop()
  })

  it('reloads metrics when tsRange changes while a metrics view is active', async () => {
    vi.useFakeTimers()
    loadFromEventsApi.mockResolvedValue([{ ts: 1 }])
    const api = setup({ tsRange: makeTsRange('a'), fields: [] })

    await selectWaf(api)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(loadFromEventsApi).toHaveBeenCalledTimes(1)

    api.filterData.value = { ...api.filterData.value, tsRange: makeTsRange('b') }
    await nextTick()
    vi.advanceTimersByTime(50)
    await Promise.resolve()

    expect(loadFromEventsApi).toHaveBeenCalledTimes(2)
    api.scope.stop()
  })

  it('reloads metrics when AQL fields change while a metrics view is active', async () => {
    vi.useFakeTimers()
    loadFromEventsApi.mockResolvedValue([{ ts: 1 }])
    const api = setup({ tsRange: makeTsRange(), fields: [] })

    await selectWaf(api)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(loadFromEventsApi).toHaveBeenCalledTimes(1)

    api.filterData.value = {
      ...api.filterData.value,
      fields: [{ valueField: 'host', operator: 'Eq', value: 'a.com' }]
    }
    await nextTick()
    vi.advanceTimersByTime(50)
    await Promise.resolve()

    expect(loadFromEventsApi).toHaveBeenCalledTimes(2)
    api.scope.stop()
  })

  it('does NOT request metrics in events view (no selection)', async () => {
    vi.useFakeTimers()
    loadFromEventsApi.mockResolvedValue([{ ts: 1 }])
    const api = setup({ tsRange: makeTsRange('a'), fields: [] })

    // No metrics view selected (events view). Change tsRange + fields.
    api.filterData.value = {
      tsRange: makeTsRange('b'),
      fields: [{ valueField: 'host', operator: 'Eq', value: 'a.com' }]
    }
    await nextTick()
    vi.advanceTimersByTime(50)
    await Promise.resolve()

    expect(loadFromEventsApi).not.toHaveBeenCalled()
    expect(loadMetricsAggregation).not.toHaveBeenCalled()
    expect(loadMetricsSeries).not.toHaveBeenCalled()
    api.scope.stop()
  })

  it('brush select triggers exactly one metrics reload (no double-fire)', async () => {
    vi.useFakeTimers()
    loadFromEventsApi.mockResolvedValue([{ ts: 1 }])
    const api = setup({ tsRange: makeTsRange('a'), fields: [] })

    await selectWaf(api)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(loadFromEventsApi).toHaveBeenCalledTimes(1)

    // Brush mutates filterData.tsRange; the filterData watch is the ONLY reload
    // path (handleBrushSelect must not call loadMetricsChart directly).
    api.handleBrushSelect({
      begin: new Date('2024-01-01T00:10:00.000Z'),
      end: new Date('2024-01-01T00:20:00.000Z')
    })
    await nextTick()
    vi.advanceTimersByTime(50)
    await Promise.resolve()

    expect(loadFromEventsApi).toHaveBeenCalledTimes(2)
    expect(api.reloadListTableWithHash).toHaveBeenCalledTimes(1)
    api.scope.stop()
  })

  it('reloadActiveMetrics is a no-op when no metrics view is active', async () => {
    vi.useFakeTimers()
    loadFromEventsApi.mockResolvedValue([{ ts: 1 }])
    const api = setup({ tsRange: makeTsRange(), fields: [] })

    api.reloadActiveMetrics()
    vi.advanceTimersByTime(50)
    await Promise.resolve()

    expect(loadFromEventsApi).not.toHaveBeenCalled()
    api.scope.stop()
  })

  it('reloadActiveMetrics reloads the active selection (onActivated path)', async () => {
    vi.useFakeTimers()
    loadFromEventsApi.mockResolvedValue([{ ts: 1 }])
    const api = setup({ tsRange: makeTsRange(), fields: [] })

    await selectWaf(api)
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(loadFromEventsApi).toHaveBeenCalledTimes(1)

    // Simulates tab-panel onActivated calling reloadActiveMetrics().
    api.reloadActiveMetrics()
    vi.advanceTimersByTime(50)
    await Promise.resolve()
    expect(loadFromEventsApi).toHaveBeenCalledTimes(2)
    api.scope.stop()
  })

  it('exposes metricsViewItemsFlat for the dataset-orphan reset seam', async () => {
    const api = setup({ tsRange: makeTsRange(), fields: [] })
    await nextTick()

    // The WAF dashboard's charts must surface as flat view items so the
    // component can detect an orphaned selection after a dataset change.
    const values = api.metricsViewItemsFlat.value.map((item) => item.value)
    expect(values).toContain('metrics:wafThreats')
    api.scope.stop()
  })
})
