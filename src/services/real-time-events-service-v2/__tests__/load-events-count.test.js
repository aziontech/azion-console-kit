import { describe, it, expect, vi, beforeEach } from 'vitest'

// loadEventsCount issues its aggregate count query through the signal decorator,
// which delegates to AxiosHttpClientAdapter.request. Mock the adapter so we can
// assert the request (url/method/body/signal) and drive responses per test.
vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: { request: vi.fn() }
}))

import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEventsCount } from '../load-events-count'

const DAY = 24 * 60 * 60 * 1000

const okCount = (count) => ({ statusCode: 200, body: { data: { httpEvents: [{ count }] } } })

const tsRange = (spanMs) => ({
  tsRangeBegin: new Date(Date.now() - spanMs).toISOString(),
  tsRangeEnd: new Date(Date.now()).toISOString()
})

const activeFilters = { and: { host: 'example.com' }, in: {}, or: [] }

describe('loadEventsCount service', () => {
  beforeEach(() => {
    AxiosHttpClientAdapter.request.mockReset()
  })

  it('returns the exact count as a NUMBER (not a formatted string)', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue(okCount(12345))

    const result = await loadEventsCount({
      dataset: 'httpEvents',
      tsRange: tsRange(DAY),
      filters: activeFilters
    })

    expect(result).toBe(12345)
    expect(typeof result).toBe('number')
  })

  it('posts to the events GraphQL endpoint preserving auth/tenant transport', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue(okCount(1))

    await loadEventsCount({ dataset: 'httpEvents', tsRange: tsRange(DAY), filters: activeFilters })

    const call = AxiosHttpClientAdapter.request.mock.calls[0][0]
    expect(call.url).toBe('v4/events/graphql')
    expect(call.method).toBe('POST')
    // Aggregate count query over the requested dataset with the shared filter.
    const body = JSON.parse(call.body)
    expect(body.query).toContain('httpEvents')
    expect(body.query).toContain('aggregate: { count: rows }')
    expect(body.query).toContain('limit: 10000')
  })

  it('renders the active filter via the shared buildFilterParts (host in query + variables)', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue(okCount(1))

    await loadEventsCount({ dataset: 'httpEvents', tsRange: tsRange(DAY), filters: activeFilters })

    const body = JSON.parse(AxiosHttpClientAdapter.request.mock.calls[0][0].body)
    expect(body.query).toContain('host: $f0')
    expect(body.variables.f0).toBe('example.com')
    // tsRange is always present.
    expect(body.variables.tsBegin).toBeDefined()
    expect(body.variables.tsEnd).toBeDefined()
  })

  it('forwards an AbortSignal through the transport', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue(okCount(1))
    const controller = new AbortController()

    await loadEventsCount({
      dataset: 'httpEvents',
      tsRange: tsRange(DAY),
      filters: activeFilters,
      signal: controller.signal
    })

    expect(AxiosHttpClientAdapter.request.mock.calls[0][0].signal).toBe(controller.signal)
  })

  it('returns count 0 when the aggregate resolves to zero rows', async () => {
    AxiosHttpClientAdapter.request.mockResolvedValue({
      statusCode: 200,
      body: { data: { httpEvents: [] } }
    })

    const result = await loadEventsCount({
      dataset: 'httpEvents',
      tsRange: tsRange(DAY),
      filters: activeFilters
    })

    expect(result).toBe(0)
  })

  it('falls back to summing 24h chunks when the full-range query throws (system limit)', async () => {
    // Full range (3 days) throws once, then each 24h chunk returns a count. The
    // fallback must sum ALL chunks (never bail on an empty one).
    AxiosHttpClientAdapter.request
      .mockRejectedValueOnce(new Error('system limit')) // full range
      .mockResolvedValueOnce(okCount(10)) // chunk 1
      .mockResolvedValueOnce(okCount(0)) // chunk 2 (empty, must NOT stop)
      .mockResolvedValueOnce(okCount(5)) // chunk 3

    const onPartial = vi.fn()
    const result = await loadEventsCount({
      dataset: 'httpEvents',
      tsRange: tsRange(3 * DAY),
      filters: activeFilters,
      onPartial
    })

    expect(result).toBe(15)
    // onPartial surfaces the progressively-refined running total per batch.
    expect(onPartial).toHaveBeenCalled()
    expect(onPartial.mock.calls.at(-1)[0]).toBe(15)
  })

  it('stops the fallback walk on the first all-zero batch instead of probing every 24h chunk', async () => {
    // Full range returns non-200 → null → triggers the chunked fallback. Every
    // chunk then returns count:0. Over a 5-day range the OLD code walked one
    // request per remaining 24h chunk (1 full + 5 chunks = 6 requests) even
    // though the very first batch already proved there was nothing to sum — the
    // recurring "count:0 walked ~N requests" bug. The fix must break after the
    // first all-zero batch (1 full + one 2-chunk batch = 3 requests) and return
    // 0, letting the caller's metrics total (chartSummary.total) win.
    AxiosHttpClientAdapter.request
      .mockResolvedValueOnce({ statusCode: 500, body: {} }) // full range → null → fallback
      .mockResolvedValue(okCount(0)) // every chunk resolves empty

    const result = await loadEventsCount({
      dataset: 'httpEvents',
      tsRange: tsRange(5 * DAY),
      filters: activeFilters
    })

    expect(result).toBe(0)
    // 1 full-range attempt + at most one 2-chunk fallback batch.
    expect(AxiosHttpClientAdapter.request.mock.calls.length).toBeLessThanOrEqual(3)
  })

  it('keeps walking past an empty batch once a populated batch has been seen (no undercount)', async () => {
    // A batch that already found events must NOT trigger the early break: sparse
    // ranges can have empty 24h chunks between populated ones. Full range throws
    // → fallback; batch1 finds 10, batch2 (both chunks) is empty, batch3 finds 5.
    AxiosHttpClientAdapter.request
      .mockRejectedValueOnce(new Error('system limit')) // full range
      .mockResolvedValueOnce(okCount(10)) // batch1 chunk a
      .mockResolvedValueOnce(okCount(0)) // batch1 chunk b
      .mockResolvedValueOnce(okCount(0)) // batch2 chunk a (empty — grandTotal already 10)
      .mockResolvedValueOnce(okCount(0)) // batch2 chunk b
      .mockResolvedValueOnce(okCount(5)) // batch3 chunk a

    const result = await loadEventsCount({
      dataset: 'httpEvents',
      tsRange: tsRange(5 * DAY),
      filters: activeFilters
    })

    expect(result).toBe(15)
  })

  it('returns null when dataset or tsRange is missing (nothing to count)', async () => {
    expect(await loadEventsCount({ tsRange: tsRange(DAY), filters: activeFilters })).toBeNull()
    expect(await loadEventsCount({ dataset: 'httpEvents', filters: activeFilters })).toBeNull()
    expect(AxiosHttpClientAdapter.request).not.toHaveBeenCalled()
  })
})
