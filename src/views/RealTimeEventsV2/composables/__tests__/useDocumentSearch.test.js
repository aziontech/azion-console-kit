import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick, shallowRef } from 'vue'

// Mock Vue lifecycle hooks since we're testing outside a component
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onBeforeUnmount: vi.fn((cb) => cb),
    onDeactivated: vi.fn((cb) => cb)
  }
})

import { onDeactivated } from 'vue'
import { useDocumentSearch } from '../useDocumentSearch'

const makeRow = (fields) => {
  const obj = {}
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = v
  }
  return obj
}

describe('useDocumentSearch', () => {
  it('returns all rows when query is empty', () => {
    const tableData = ref([makeRow({ name: 'Alice' }), makeRow({ name: 'Bob' })])
    const { filteredData } = useDocumentSearch(tableData)
    expect(filteredData.value).toHaveLength(2)
  })

  it('filters rows based on debounced query', async () => {
    vi.useFakeTimers()
    const tableData = ref([makeRow({ name: 'Alice' }), makeRow({ name: 'Bob' })])
    const { query, filteredData } = useDocumentSearch(tableData)

    query.value = 'alice'
    await nextTick() // trigger the watcher on query
    vi.advanceTimersByTime(400)
    await nextTick() // trigger the debouncedQuery update
    await nextTick() // trigger the filteredData recomputation

    expect(filteredData.value).toHaveLength(1)
    expect(filteredData.value[0].name).toBe('Alice')
    vi.useRealTimers()
  })

  it('builds search index incrementally on loadMore (append)', async () => {
    vi.useFakeTimers()
    const tableData = ref([makeRow({ name: 'Alice' })])
    const { query, filteredData } = useDocumentSearch(tableData)
    await nextTick()

    // Simulate loadMore by appending
    tableData.value = [...tableData.value, makeRow({ name: 'Bob' })]
    await nextTick()

    query.value = 'bob'
    await nextTick()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()

    expect(filteredData.value).toHaveLength(1)
    expect(filteredData.value[0].name).toBe('Bob')
    vi.useRealTimers()
  })

  it('fully rebuilds index when tableData shrinks (new query)', async () => {
    const tableData = ref([makeRow({ name: 'Alice' }), makeRow({ name: 'Bob' })])
    const { filteredData, query } = useDocumentSearch(tableData)
    await nextTick()

    // Simulate new query — data shrinks
    tableData.value = [makeRow({ name: 'Charlie' })]
    await nextTick()

    vi.useFakeTimers()
    query.value = 'charlie'
    vi.advanceTimersByTime(400)
    await nextTick()

    expect(filteredData.value).toHaveLength(1)
    expect(filteredData.value[0].name).toBe('Charlie')
    vi.useRealTimers()
  })

  it('indexes array values in rows', async () => {
    vi.useFakeTimers()
    const tableData = ref([
      makeRow({ tags: ['important', 'urgent'] }),
      makeRow({ tags: ['normal'] })
    ])
    const { query, filteredData } = useDocumentSearch(tableData)

    query.value = 'urgent'
    await nextTick()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()

    expect(filteredData.value).toHaveLength(1)
    vi.useRealTimers()
  })

  it('indexes nested objects in arrays', async () => {
    vi.useFakeTimers()
    const tableData = ref([
      makeRow({ summary: [{ key: 'host', value: 'example.com' }] }),
      makeRow({ summary: [{ key: 'host', value: 'other.com' }] })
    ])
    const { query, filteredData } = useDocumentSearch(tableData)

    query.value = 'example.com'
    await nextTick()
    vi.advanceTimersByTime(400)
    await nextTick()
    await nextTick()

    expect(filteredData.value).toHaveLength(1)
    vi.useRealTimers()
  })

  it('highlight wraps first occurrence in mark tag', () => {
    vi.useFakeTimers()
    const tableData = ref([makeRow({ name: 'Alice' })])
    const { query, highlight, debouncedQuery } = useDocumentSearch(tableData)

    // Directly set debouncedQuery for synchronous highlight testing
    debouncedQuery.value = 'ali'

    const result = highlight('Alice in Wonderland')
    expect(result).toBe('<mark class="search-highlight">Ali</mark>ce in Wonderland')
    vi.useRealTimers()
  })

  it('highlight returns original text when no match', () => {
    const tableData = ref([])
    const { highlight, debouncedQuery } = useDocumentSearch(tableData)
    debouncedQuery.value = 'xyz'

    expect(highlight('Hello World')).toBe('Hello World')
  })

  it('highlight returns original text when query is empty', () => {
    const tableData = ref([])
    const { highlight } = useDocumentSearch(tableData)

    expect(highlight('Hello World')).toBe('Hello World')
  })

  it('registers onDeactivated hook to clear debounce timer', () => {
    const tableData = ref([])
    useDocumentSearch(tableData)

    // onDeactivated should have been called with a callback
    expect(onDeactivated).toHaveBeenCalled()
  })

  it('handles null values in rows gracefully', async () => {
    vi.useFakeTimers()
    const tableData = ref([makeRow({ name: null, status: 'ok' })])
    const { query, filteredData } = useDocumentSearch(tableData)

    query.value = 'ok'
    vi.advanceTimersByTime(400)
    await nextTick()

    expect(filteredData.value).toHaveLength(1)
    vi.useRealTimers()
  })

  it('works with shallowRef tableData', async () => {
    vi.useFakeTimers()
    const tableData = shallowRef([makeRow({ name: 'Alice' })])
    const { query, filteredData } = useDocumentSearch(tableData)

    query.value = 'alice'
    vi.advanceTimersByTime(400)
    await nextTick()

    expect(filteredData.value).toHaveLength(1)
    vi.useRealTimers()
  })
})
