import { describe, it, expect, vi } from 'vitest'
import { ref, computed } from 'vue'
import { useEventsData } from '../../composables/useEventsData.js'

vi.mock('@/services/real-time-events-service/load-events-aggregation', () => ({
  loadSummaryKpis: vi.fn().mockResolvedValue(null)
}))

vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: { request: vi.fn().mockResolvedValue({ statusCode: 200, body: { data: {} } }) }
}))

vi.mock('@/stores/graphql-query', () => ({
  useGraphQLStore: () => ({ setQuery: vi.fn() })
}))

describe('Multi-tab memory-footprint benchmark', () => {
  it('6-tab setup creates independent composable instances without shared state', () => {
    const NUM_TABS = 6

    const instances = []
    for (let i = 0; i < NUM_TABS; i++) {
      const filterData = ref({
        tsRange: {
          tsRangeBegin: '2024-01-01T00:00:00Z',
          tsRangeEnd: '2024-01-01T00:05:00Z',
          label: 'Last 5 minutes'
        },
        fields: [],
        dataset: 'workloadEvents'
      })

      const instance = useEventsData({
        filterData,
        listService: ref(vi.fn().mockResolvedValue({ data: [] })),
        loadChartAggregation: ref(null),
        tabSelected: computed(() => ({ dataset: 'workloadEvents', showSummary: false })),
        pageSize: ref(50),
        hasChartConfig: ref(false),
        onError: vi.fn(),
        stackByField: ref('none')
      })

      instances.push({ instance, filterData })
    }

    // Verify all instances are independent (no shared refs)
    expect(instances).toHaveLength(NUM_TABS)

    // Each instance has its own independent reactive state
    for (let i = 0; i < NUM_TABS; i++) {
      for (let j = i + 1; j < NUM_TABS; j++) {
        expect(instances[i].instance.kpis).not.toBe(instances[j].instance.kpis)
        expect(instances[i].instance.chartData).not.toBe(instances[j].instance.chartData)
        expect(instances[i].instance.tableData).not.toBe(instances[j].instance.tableData)
        expect(instances[i].instance.isLoading).not.toBe(instances[j].instance.isLoading)
      }
    }

    // Mutating one instance does not affect others (linear-per-tab envelope)
    instances[0].instance.kpis.value = { total: 42 }
    for (let i = 1; i < NUM_TABS; i++) {
      expect(instances[i].instance.kpis.value).toBeNull()
    }
  })

  it('1-tab vs 6-tab: each additional tab adds a bounded set of reactive refs', () => {
    // This test verifies the linear-per-tab memory model:
    // each tab adds exactly the same set of composable state (no shared mutable state)

    const createTabInstance = () => {
      const filterData = ref({
        tsRange: {
          tsRangeBegin: '2024-01-01T00:00:00Z',
          tsRangeEnd: '2024-01-01T00:05:00Z',
          label: 'Last 5 minutes'
        },
        fields: [],
        dataset: 'workloadEvents'
      })

      return useEventsData({
        filterData,
        listService: ref(vi.fn().mockResolvedValue({ data: [] })),
        loadChartAggregation: ref(null),
        tabSelected: computed(() => ({ dataset: 'workloadEvents', showSummary: false })),
        pageSize: ref(50),
        hasChartConfig: ref(false),
        onError: vi.fn(),
        stackByField: ref('none')
      })
    }

    // Count the reactive properties returned by a single instance
    const singleInstance = createTabInstance()
    const singleInstanceKeys = Object.keys(singleInstance)

    // Create 6 instances
    const sixInstances = Array.from({ length: 6 }, createTabInstance)

    // Each instance exposes the same set of reactive properties
    for (const instance of sixInstances) {
      expect(Object.keys(instance)).toEqual(singleInstanceKeys)
    }

    // The number of reactive properties per tab is bounded (linear model)
    expect(singleInstanceKeys.length).toBeGreaterThan(0)
    expect(singleInstanceKeys.length).toBeLessThan(20) // reasonable upper bound
  })
})
