import { AxiosHttpClientSignalDecorator } from '../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from './make-real-time-events-service'
import { buildFilterParts } from './_shared/build-filter-parts'

// One 24h chunk, used by the fallback walk (relocated verbatim from the inline
// loadTotalCount in useEventsData).
const CHUNK_MS = 24 * 60 * 60 * 1000

/**
 * Exact numeric count of events for the current range + filter.
 *
 * Relocated verbatim from the previous inline `useEventsData.loadTotalCount`
 * (design §3.10 / §12.3): it returns a NUMBER (not the pt-BR string that
 * `getTotalRecords` returns), reuses `buildFilterParts` + the caller's already
 * shared filter shape, preserves auth/tenant (same adapter + same
 * `makeRealTimeEventsBaseUrl()` endpoint used by every other events query), and
 * supports an `AbortSignal`.
 *
 * Strategy:
 *   1. Try the full range in a single aggregate `count` query.
 *   2. On failure (system limit), fall back to 24h chunks, 2 at a time,
 *      newest→oldest, summing the range. A null chunk means that per-chunk
 *      request itself failed — skip it (don't add), never treat a failure as a
 *      counted zero.
 *
 * Break-and-assume (task 15.3): once a whole batch has been probed and the
 * running total is STILL 0, every chunk seen so far was empty. The walk stops
 * there and returns 0 instead of firing one request per remaining 24h chunk
 * across a multi-day range only to keep summing zeros (the recurring "count:0
 * walked ~N requests" bug). The caller's metrics total (`chartSummary.total`)
 * then wins as the assumed total. A batch that DID find events keeps walking,
 * so sparse ranges with empty chunks BETWEEN populated ones are still fully
 * summed and never undercounted.
 *
 * The fallback invokes `onPartial(runningTotal)` after each batch so the caller
 * can surface a progressively-refined count exactly like the inline version did
 * (it wrote `recordsFound` per batch). The final resolved value is the grand
 * total.
 *
 * @param {object} args
 * @param {string} args.dataset            GraphQL dataset name (already scoped).
 * @param {{ tsRangeBegin: string, tsRangeEnd: string }} args.tsRange
 * @param {object} args.filters            `{ and, in, or }` from buildApiFilters.
 * @param {AbortSignal} [args.signal]
 * @param {(runningTotal: number) => void} [args.onPartial]
 * @returns {Promise<number|null>}         Exact count, or null if unresolved.
 */
export async function loadEventsCount({ dataset, tsRange, filters, signal, onPartial } = {}) {
  if (!dataset || !tsRange?.tsRangeBegin || !tsRange?.tsRangeEnd) return null

  const beginMs = new Date(tsRange.tsRangeBegin).getTime()
  const endMs = new Date(tsRange.tsRangeEnd).getTime()

  // Render the extra filter (and/in/or) via the shared helper so OR groups
  // produce a nested `or: [ ... ]` fragment consistent with the list query.
  const { fragments, declarations, variables: filterVars } = buildFilterParts(filters, 'f')

  const buildBody = (tsBegin, tsEnd) => {
    const vars = { tsBegin, tsEnd, ...filterVars }
    const pStr = ['$tsBegin: DateTime!', '$tsEnd: DateTime!', ...declarations].join(', ')
    const fStr = ['tsRange: { begin: $tsBegin, end: $tsEnd }', ...fragments].join(', ')
    return JSON.stringify({
      query:
        'query (' +
        pStr +
        ') { ' +
        dataset +
        '(limit: 10000, aggregate: { count: rows }, filter: { ' +
        fStr +
        ' }) { count } }',
      variables: vars
    })
  }

  const decorator = new AxiosHttpClientSignalDecorator(signal)
  const doReq = async (body) => {
    const resp = await decorator.request({
      baseURL: '/',
      url: makeRealTimeEventsBaseUrl(),
      method: 'POST',
      body
    })
    if (resp.statusCode !== 200) return null
    const rows = resp.body?.data?.[dataset]
    if (!Array.isArray(rows) || rows.length === 0) return 0
    return rows[0]?.count != null ? rows[0].count : 0
  }

  // 1) Try full range.
  try {
    const total = await doReq(
      buildBody(new Date(beginMs).toISOString(), new Date(endMs).toISOString())
    )
    if (total != null) return total
  } catch {
    /* system limit → fall through to chunked fallback */
  }

  // 2) Fallback: 24h chunks, 2 at a time, newest→oldest, summing the range.
  // Break on the FIRST all-zero batch and assume the metrics total (see the
  // "Break-and-assume" note in the doc block above).
  let grandTotal = 0
  let cursor = endMs
  while (cursor > beginMs) {
    const batch = []
    for (let bi = 0; bi < 2 && cursor > beginMs; bi++) {
      const cb = Math.max(cursor - CHUNK_MS, beginMs)
      batch.push({ begin: new Date(cb).toISOString(), end: new Date(cursor).toISOString() })
      cursor = cb
    }
    const results = await Promise.all(
      batch.map((ch) => doReq(buildBody(ch.begin, ch.end)).catch(() => 0))
    )
    for (const cnt of results) {
      if (cnt != null) grandTotal += cnt
    }
    if (typeof onPartial === 'function') onPartial(grandTotal)
    // Every chunk probed so far (newest→oldest) was empty: stop walking and let
    // the caller's metrics total win. A populated batch (grandTotal > 0) never
    // trips this, so ranges with gaps between populated windows are fully summed.
    if (grandTotal === 0) break
  }
  return grandTotal
}
