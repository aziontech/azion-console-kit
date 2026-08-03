import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useTableDefinitionsStore } from '@/stores/table-definitions'
import { usePagedVersionList } from '@/composables/versioning/use-paged-version-list'
import { VERSION_POLL_INTERVAL_MS } from '@/services/v2/versioning/version-cache-policy'

const flush = async () => {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

let listVersionsPage

beforeEach(() => {
  useTableDefinitionsStore().setNumberOfLinesPerPage(20)
  listVersionsPage = vi.fn().mockResolvedValue({
    body: [{ id: 'V1', state: 'ready' }],
    count: 42
  })
})

const setup = (overrides = {}) =>
  usePagedVersionList({
    versionService: { listVersionsPage },
    resourceId: ref('77'),
    ...overrides
  })

describe('usePagedVersionList', () => {
  it('loads page 1 with the default page size on mount', async () => {
    const list = setup()
    await flush()

    expect(listVersionsPage).toHaveBeenCalledWith('77', {
      page: 1,
      pageSize: 20,
      skipCache: true
    })
    expect(list.items.value).toHaveLength(1)
    expect(list.totalRecords.value).toBe(42)
    expect(list.hasAnyVersions.value).toBe(true)
    expect(list.isLoading.value).toBe(false)
  })

  it('derives the page number from the paginator event', async () => {
    const list = setup()
    await flush()
    listVersionsPage.mockClear()

    list.onPage({ first: 40, rows: 20 })
    await flush()

    expect(listVersionsPage).toHaveBeenCalledWith('77', {
      page: 3,
      pageSize: 20,
      skipCache: false
    })
    expect(list.paginatorFirst.value).toBe(40)
  })

  it('honours a rows-per-page change from the paginator', async () => {
    const list = setup()
    await flush()
    listVersionsPage.mockClear()

    list.onPage({ first: 50, rows: 50 })
    await flush()

    expect(listVersionsPage).toHaveBeenCalledWith('77', {
      page: 2,
      pageSize: 50,
      skipCache: false
    })
  })

  it('resets to the first page on reload', async () => {
    const list = setup()
    await flush()
    list.onPage({ first: 40, rows: 20 })
    await flush()
    listVersionsPage.mockClear()

    list.reload()
    await flush()

    expect(list.paginatorFirst.value).toBe(0)
    expect(listVersionsPage).toHaveBeenCalledWith('77', {
      page: 1,
      pageSize: 20,
      skipCache: true
    })
  })

  it('refetches from page 1 when the resource id changes', async () => {
    const resourceId = ref('77')
    setup({ resourceId })
    await flush()
    listVersionsPage.mockClear()

    resourceId.value = '88'
    await flush()

    expect(listVersionsPage).toHaveBeenCalledWith('88', {
      page: 1,
      pageSize: 20,
      skipCache: true
    })
  })

  it('enriches rows with activeTraffic from the active versions map', async () => {
    const activeVersions = ref(new Map([['V1', { deployments: [{ id: 'd1' }] }]]))
    const list = setup({ activeVersions })
    await flush()

    expect(list.items.value[0].activeTraffic).toEqual({ deployments: [{ id: 'd1' }] })
  })

  it('leaves rows untouched when there are no active versions', async () => {
    const list = setup({ activeVersions: ref(new Map()) })
    await flush()

    expect(list.items.value[0]).toEqual({ id: 'V1', state: 'ready' })
  })

  it('flags the error state and empties the page when the request fails', async () => {
    listVersionsPage.mockRejectedValue(new Error('down'))
    const list = setup()
    await flush()

    expect(list.isError.value).toBe(true)
    expect(list.items.value).toEqual([])
    expect(list.totalRecords.value).toBe(0)
  })

  it('drops hasAnyVersions once the last version is deleted', async () => {
    const list = setup()
    await flush()
    expect(list.hasAnyVersions.value).toBe(true)

    listVersionsPage.mockResolvedValue({ body: [], count: 0 })
    list.reload()
    await flush()

    expect(list.hasAnyVersions.value).toBe(false)
  })

  it('does not carry hasAnyVersions across a resource id change', async () => {
    const resourceId = ref('77')
    const list = setup({ resourceId })
    await flush()
    expect(list.hasAnyVersions.value).toBe(true)

    listVersionsPage.mockResolvedValue({ body: [], count: 0 })
    resourceId.value = '88'
    await flush()

    expect(list.hasAnyVersions.value).toBe(false)
  })

  it('skips the request entirely for an empty resource id', async () => {
    const list = setup({ resourceId: ref('') })
    await flush()

    expect(listVersionsPage).not.toHaveBeenCalled()
    expect(list.isLoading.value).toBe(false)
  })

  it('takes its initial page size from the shared table store', async () => {
    useTableDefinitionsStore().setNumberOfLinesPerPage(100)

    setup()
    await flush()

    expect(listVersionsPage).toHaveBeenCalledWith('77', {
      page: 1,
      pageSize: 100,
      skipCache: true
    })
  })

  it('writes the chosen page size back to the shared table store', async () => {
    const store = useTableDefinitionsStore()
    const list = setup()
    await flush()

    list.onPage({ first: 0, rows: 50 })
    await flush()

    expect(store.getNumberOfLinesPerPage).toBe(50)
    expect(list.pageSize.value).toBe(50)
  })

  it('coerces a stored size that the listing cannot represent', async () => {
    useTableDefinitionsStore().setNumberOfLinesPerPage(25)

    setup()
    await flush()

    expect(listVersionsPage).toHaveBeenCalledWith('77', {
      page: 1,
      pageSize: 20,
      skipCache: true
    })
  })

  it('exposes the toolbar options for display', async () => {
    const list = setup()
    await flush()

    expect(list.filters.value.map((filter) => filter.key)).toEqual(['state'])
    expect(list.sortOptions).toHaveLength(3)
  })
})

describe('usePagedVersionList — live updates while versions are processing', () => {
  const building = { body: [{ id: 'V1', state: 'building' }], count: 1 }
  const ready = { body: [{ id: 'V1', state: 'ready' }], count: 1 }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const tick = async () => {
    vi.advanceTimersByTime(VERSION_POLL_INTERVAL_MS)
    await flush()
  }

  it('polls the current page while a version is building', async () => {
    listVersionsPage.mockResolvedValue(building)
    setup()
    await flush()
    listVersionsPage.mockClear()

    await tick()

    expect(listVersionsPage).toHaveBeenCalledWith('77', {
      page: 1,
      pageSize: 20,
      skipCache: true
    })
  })

  it('polls a queued version too', async () => {
    listVersionsPage.mockResolvedValue({ body: [{ id: 'V1', state: 'queued' }], count: 1 })
    setup()
    await flush()
    listVersionsPage.mockClear()

    await tick()

    expect(listVersionsPage).toHaveBeenCalledTimes(1)
  })

  it('never polls when every version has settled', async () => {
    listVersionsPage.mockResolvedValue(ready)
    setup()
    await flush()
    listVersionsPage.mockClear()

    await tick()
    await tick()

    expect(listVersionsPage).not.toHaveBeenCalled()
  })

  it('stops polling once the version reaches a settled state', async () => {
    listVersionsPage.mockResolvedValue(building)
    const list = setup()
    await flush()

    listVersionsPage.mockResolvedValue(ready)
    await tick()
    expect(list.items.value[0].state).toBe('ready')

    listVersionsPage.mockClear()
    await tick()
    await tick()

    expect(listVersionsPage).not.toHaveBeenCalled()
  })

  it('refreshes in the background without flipping the loading flag', async () => {
    listVersionsPage.mockResolvedValue(building)
    const list = setup()
    await flush()

    const seen = []
    vi.advanceTimersByTime(VERSION_POLL_INTERVAL_MS)
    seen.push(list.isLoading.value)
    await flush()
    seen.push(list.isLoading.value)

    expect(seen).toEqual([false, false])
  })

  it('keeps the rendered page when a background poll fails', async () => {
    listVersionsPage.mockResolvedValue(building)
    const list = setup()
    await flush()

    listVersionsPage.mockRejectedValue(new Error('down'))
    await tick()

    expect(list.isError.value).toBe(false)
    expect(list.items.value).toEqual(building.body)
  })

  it('gives up polling after a failed background refresh', async () => {
    listVersionsPage.mockResolvedValue(building)
    setup()
    await flush()

    listVersionsPage.mockRejectedValue(new Error('down'))
    await tick()

    listVersionsPage.mockClear()
    await tick()

    expect(listVersionsPage).not.toHaveBeenCalled()
  })

  it('stops polling when the scope owner asks it to', async () => {
    listVersionsPage.mockResolvedValue(building)
    const list = setup()
    await flush()

    list.stopPolling()
    listVersionsPage.mockClear()
    await tick()

    expect(listVersionsPage).not.toHaveBeenCalled()
  })

  it('ignores a superseded response so a stale page cannot win the race', async () => {
    const resolvers = []
    listVersionsPage.mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)))

    const list = setup()
    await flush()
    list.onPage({ first: 20, rows: 20 })
    await flush()

    resolvers[1]({ body: [{ id: 'V2', state: 'ready' }], count: 42 })
    await flush()
    resolvers[0]({ body: [{ id: 'V1', state: 'ready' }], count: 42 })
    await flush()

    expect(list.items.value).toEqual([{ id: 'V2', state: 'ready' }])
    expect(list.isLoading.value).toBe(false)
  })
})
