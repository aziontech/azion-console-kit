import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { pivotTimeseries } from '../_shared/graphql/pivot-timeseries'

/**
 * Byte-equivalence oracle for the shared per-`ts` pivot/backfill/sort routine
 * (`_shared/graphql/pivot-timeseries.js`, task 11.2 / req 5.2).
 *
 * Each `describe` re-implements ONE migrated call site's pre-refactor inline
 * loop verbatim (the "oracle") and asserts `pivotTimeseries(...)` produces a
 * deep-equal array — same entry order, same keys, same values, same stored
 * `ts` — over ≥100 randomized inputs. If the extraction drifts from any site's
 * original behaviour, the matching property breaks.
 *
 * Sites covered (all last-write-wins except mergeChartBucketAliases):
 *   1. loadMetricsFallback directFields      — pickValue typeof-number, no backfill
 *   2. loadMetricsSeries series              — pickValue sum??count??avg, backfill
 *   3. loadFromEventsApi series postProcess  — pickValue count??avg??sum, no backfill
 *   4. loadMetricsAggregation direct         — pickValue typeof-number, no backfill
 *   5. loadMetricsAggregation aliases        — pickValue sum??0, no backfill
 *   8. mergeChartBucketAliases               — accumulate, String(ts) key, activeBuckets backfill
 */

const byTsAsc = (left, right) => new Date(left.ts) - new Date(right.ts)

// A pool of ISO timestamps so rows collide on `ts` (exercises the merge path).
const TS_POOL = [
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:01:00Z',
  '2024-01-01T00:02:00Z',
  '2024-01-01T00:03:00Z'
]
const arbTs = fc.constantFrom(...TS_POOL)
const arbNum = fc.oneof(fc.integer({ min: 0, max: 1000 }), fc.constant(0))

// A group is { key, rows: [{ ts, <valueFields> }] }. Rows may omit `ts` to
// prove the skip guard survives; `valueArb()` yields the value-field record.
const arbRow = (valueArb) =>
  fc.tuple(fc.oneof(arbTs, fc.constant(undefined)), valueArb()).map(([ts, val]) => ({ ts, ...val }))

const arbGroups = (valueArb, keys) =>
  fc.tuple(...keys.map(() => fc.array(arbRow(valueArb), { maxLength: 6 })))

describe('pivot-timeseries oracle · byte-equivalent per site', () => {
  it('site 1/4 — directFields (typeof-number, last-write-wins, no backfill, sort)', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(
            fc.record({
              ts: fc.oneof(arbTs, fc.constant(undefined)),
              fieldA: fc.oneof(arbNum, fc.constant('x'), fc.constant(undefined))
            }),
            { maxLength: 8 }
          ),
          fc.array(
            fc.record({
              ts: fc.oneof(arbTs, fc.constant(undefined)),
              fieldB: fc.oneof(arbNum, fc.constant('x'), fc.constant(undefined))
            }),
            { maxLength: 8 }
          )
        ),
        ([rowsA, rowsB]) => {
          const fields = ['fieldA', 'fieldB']
          const dataByAlias = { fieldA: rowsA, fieldB: rowsB }

          // Oracle: legacy inline loop
          const perTs = new Map()
          for (const field of fields) {
            const rows = Array.isArray(dataByAlias[field]) ? dataByAlias[field] : []
            rows.forEach((row) => {
              if (!row?.ts) return
              if (!perTs.has(row.ts)) perTs.set(row.ts, { ts: row.ts })
              const val = row[field]
              perTs.get(row.ts)[field] = typeof val === 'number' ? val : 0
            })
          }
          const expected = Array.from(perTs.values()).sort(byTsAsc)

          const actual = pivotTimeseries(
            fields.map((field) => ({ key: field, rows: dataByAlias[field] })),
            {
              pickValue: (row, field) => (typeof row[field] === 'number' ? row[field] : 0),
              sort: true
            }
          )
          expect(actual).toEqual(expected)
        }
      ),
      { numRuns: 150 }
    )
  })

  it('site 2 — loadMetricsSeries (sum??count??avg??0, backfill, sort)', () => {
    fc.assert(
      fc.property(
        arbGroups(
          () => fc.oneof(fc.record({ sum: arbNum }), fc.record({ count: arbNum }), fc.constant({})),
          ['alpha', 'beta']
        ),
        ([rowsA, rowsB]) => {
          const names = ['alpha', 'beta']
          const byName = { alpha: rowsA, beta: rowsB }

          const perTs = new Map()
          const displayNames = []
          for (const name of names) {
            displayNames.push(name)
            const rows = Array.isArray(byName[name]) ? byName[name] : []
            rows.forEach((row) => {
              if (!row?.ts) return
              if (!perTs.has(row.ts)) perTs.set(row.ts, { ts: row.ts })
              perTs.get(row.ts)[name] = row.sum ?? row.count ?? row.avg ?? 0
            })
          }
          for (const row of perTs.values()) {
            for (const name of displayNames) if (!(name in row)) row[name] = 0
          }
          const expected = Array.from(perTs.values()).sort(byTsAsc)

          const actual = pivotTimeseries(
            names.map((name) => ({ key: name, rows: byName[name] })),
            { pickValue: (row) => row.sum ?? row.count ?? row.avg ?? 0, backfill: true, sort: true }
          )
          expect(actual).toEqual(expected)
        }
      ),
      { numRuns: 150 }
    )
  })

  it('site 3 — loadFromEventsApi series (count??avg??sum??0, no backfill, sort)', () => {
    fc.assert(
      fc.property(
        arbGroups(
          () => fc.oneof(fc.record({ count: arbNum }), fc.record({ sum: arbNum }), fc.constant({})),
          ['s0', 's1']
        ),
        ([rowsA, rowsB]) => {
          const names = ['s0', 's1']
          const byName = { s0: rowsA, s1: rowsB }

          const perTs = new Map()
          for (const name of names) {
            const rows = Array.isArray(byName[name]) ? byName[name] : []
            rows.forEach((row) => {
              if (!row?.ts) return
              if (!perTs.has(row.ts)) perTs.set(row.ts, { ts: row.ts })
              perTs.get(row.ts)[name] = row.count ?? row.avg ?? row.sum ?? 0
            })
          }
          const expected = Array.from(perTs.values()).sort(byTsAsc)

          const actual = pivotTimeseries(
            names.map((name) => ({ key: name, rows: byName[name] })),
            { pickValue: (row) => row.count ?? row.avg ?? row.sum ?? 0, sort: true }
          )
          expect(actual).toEqual(expected)
        }
      ),
      { numRuns: 150 }
    )
  })

  it('site 5 — loadMetricsAggregation aliases (sum??0, no backfill, sort)', () => {
    fc.assert(
      fc.property(
        arbGroups(
          () => fc.oneof(fc.record({ sum: arbNum }), fc.constant({})),
          ['fieldA', 'fieldB']
        ),
        ([rowsA, rowsB]) => {
          const fields = ['fieldA', 'fieldB']
          const byField = { fieldA: rowsA, fieldB: rowsB }

          const perTs = new Map()
          for (const field of fields) {
            const rows = Array.isArray(byField[field]) ? byField[field] : []
            rows.forEach((row) => {
              if (!row?.ts) return
              if (!perTs.has(row.ts)) perTs.set(row.ts, { ts: row.ts })
              perTs.get(row.ts)[field] = row.sum ?? 0
            })
          }
          const expected = Array.from(perTs.values()).sort(byTsAsc)

          const actual = pivotTimeseries(
            fields.map((field) => ({ key: field, rows: byField[field] })),
            { pickValue: (row) => row.sum ?? 0, sort: true }
          )
          expect(actual).toEqual(expected)
        }
      ),
      { numRuns: 150 }
    )
  })

  it('site 6 — loadRequestMethodChartFromMetricsApi (bucket group, sum||0, accumulate, no backfill, sort)', () => {
    const REQUEST_METHOD_BUCKETS = ['GET', 'POST', 'PUT', 'DELETE']
    const arbMethod = fc.oneof(
      fc.constantFrom('GET', 'post', 'Put', 'DELETE', 'HEAD', 'patch'),
      fc.constant(undefined)
    )
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ts: fc.oneof(arbTs, fc.constant(undefined)),
            requestMethod: arbMethod,
            sum: fc.oneof(arbNum, fc.constant(undefined))
          }),
          { maxLength: 12 }
        ),
        (rawData) => {
          // Oracle: legacy inline loop verbatim
          const perTs = new Map()
          rawData.forEach((item) => {
            if (!item?.ts) return
            const method = String(item.requestMethod || 'OTHER').toUpperCase()
            const bucket = REQUEST_METHOD_BUCKETS.includes(method) ? method : 'OTHER'
            if (!perTs.has(item.ts)) perTs.set(item.ts, { ts: item.ts })
            const entry = perTs.get(item.ts)
            entry[bucket] = (entry[bucket] || 0) + (item.sum || 0)
          })
          const expected = Array.from(perTs.values()).sort(byTsAsc)

          // Actual: the pivotTimeseries-based composition shipped in the service
          const bucketGroups = new Map()
          rawData.forEach((item) => {
            if (!item?.ts) return
            const method = String(item.requestMethod || 'OTHER').toUpperCase()
            const bucket = REQUEST_METHOD_BUCKETS.includes(method) ? method : 'OTHER'
            if (!bucketGroups.has(bucket)) bucketGroups.set(bucket, [])
            bucketGroups.get(bucket).push(item)
          })
          const actual = pivotTimeseries(
            Array.from(bucketGroups, ([key, rows]) => ({ key, rows })),
            { pickValue: (row) => row.sum || 0, accumulate: true, sort: true }
          )
          expect(actual).toEqual(expected)
        }
      ),
      { numRuns: 150 }
    )
  })

  it('site 7 — loadCacheStatusChartFromMetricsApi (status group, aggField||0, accumulate, seenStatuses backfill, sort)', () => {
    const arbStatus = fc.oneof(
      fc.constantFrom('hit', 'MISS', 'Expired', '-', 'stale'),
      fc.constant(undefined)
    )
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom('sum', 'count'),
          fc.array(
            fc
              .tuple(
                fc.oneof(arbTs, fc.constant(undefined)),
                arbStatus,
                fc.oneof(arbNum, fc.constant(undefined))
              )
              .map(([ts, upstreamCacheStatus, val]) => ({
                ts,
                upstreamCacheStatus,
                sum: val,
                count: val
              })),
            { maxLength: 12 }
          )
        ),
        ([aggReturnField, rawData]) => {
          // Oracle: legacy inline loop verbatim
          const perTs = new Map()
          const seen = new Set()
          rawData.forEach((item) => {
            if (!item?.ts) return
            const status = String(item.upstreamCacheStatus || '-').toUpperCase()
            seen.add(status)
            if (!perTs.has(item.ts)) perTs.set(item.ts, { ts: item.ts })
            perTs.get(item.ts)[status] =
              (perTs.get(item.ts)[status] || 0) + (item[aggReturnField] || 0)
          })
          const allStatuses = Array.from(seen)
          for (const row of perTs.values()) {
            for (const st of allStatuses) if (!(st in row)) row[st] = 0
          }
          const expected = Array.from(perTs.values()).sort(byTsAsc)

          // Actual: the pivotTimeseries-based composition shipped in the service
          const statusGroups = new Map()
          const seenStatuses = []
          rawData.forEach((item) => {
            if (!item?.ts) return
            const status = String(item.upstreamCacheStatus || '-').toUpperCase()
            if (!statusGroups.has(status)) {
              statusGroups.set(status, [])
              seenStatuses.push(status)
            }
            statusGroups.get(status).push(item)
          })
          const actual = pivotTimeseries(
            Array.from(statusGroups, ([key, rows]) => ({ key, rows })),
            {
              pickValue: (row) => row[aggReturnField] || 0,
              accumulate: true,
              backfill: true,
              backfillKeys: seenStatuses,
              sort: true
            }
          )
          expect(actual).toEqual(expected)
        }
      ),
      { numRuns: 150 }
    )
  })

  it('site 8 — mergeChartBucketAliases (accumulate, String(ts) key, activeBuckets backfill)', () => {
    const aliasConfig = [
      { alias: 'chart2xx', bucket: '2xx' },
      { alias: 'chart3xx', bucket: '3xx' },
      { alias: 'chart4xx', bucket: '4xx' },
      { alias: 'chart5xx', bucket: '5xx' }
    ]
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.constantFrom('chart2xx', 'chart3xx', 'chart4xx', 'chart5xx'),
          fc.array(fc.record({ ts: fc.oneof(arbTs, fc.constant(undefined)), count: arbNum }), {
            maxLength: 6
          })
        ),
        (data) => {
          // Oracle: legacy mergeChartBucketAliases verbatim
          const totalsByBucket = {}
          const perTs = new Map()
          aliasConfig.forEach(({ alias, bucket }) => {
            const rows = Array.isArray(data?.[alias]) ? data[alias] : []
            let bucketTotal = 0
            rows.forEach((row) => {
              if (!row?.ts) return
              const count = Number(row.count) || 0
              bucketTotal += count
              if (!perTs.has(String(row.ts))) perTs.set(String(row.ts), { ts: row.ts })
              perTs.get(String(row.ts))[bucket] = (perTs.get(String(row.ts))[bucket] || 0) + count
            })
            totalsByBucket[bucket] = bucketTotal
          })
          const activeBuckets = aliasConfig
            .map(({ bucket }) => bucket)
            .filter((bucket) => (totalsByBucket[bucket] || 0) > 0)
          const expectedResult = []
          perTs.forEach((entry) => {
            activeBuckets.forEach((bucket) => {
              if (entry[bucket] === undefined) entry[bucket] = 0
            })
            expectedResult.push(entry)
          })
          const expected = expectedResult.sort(byTsAsc)

          // Actual: extracted composition
          const groups = aliasConfig.map(({ alias, bucket }) => ({
            key: bucket,
            rows: Array.isArray(data?.[alias]) ? data[alias] : []
          }))
          const totals2 = {}
          groups.forEach(({ key, rows }) => {
            totals2[key] = rows.reduce(
              (sum, row) => (row?.ts ? sum + (Number(row.count) || 0) : sum),
              0
            )
          })
          const active2 = aliasConfig
            .map(({ bucket }) => bucket)
            .filter((bucket) => (totals2[bucket] || 0) > 0)
          const actual = pivotTimeseries(groups, {
            pickValue: (row) => Number(row.count) || 0,
            tsKeyOf: (row) => String(row.ts),
            accumulate: true,
            backfill: true,
            backfillKeys: active2,
            sort: true
          })
          expect(actual).toEqual(expected)
        }
      ),
      { numRuns: 150 }
    )
  })
})
