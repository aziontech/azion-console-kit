/**
 * Self-healing dataset-fields loader.
 *
 * Layers on top of `CURATED_DATASET_FIELDS` (docs-sourced):
 *   1. `getDatasetFields(dataset)` — sync. Returns the best-known field list:
 *      introspected cache if already fetched, otherwise the curated baseline.
 *   2. `loadDatasetFields(dataset)` — async. Fires GraphQL introspection for
 *      the dataset's underlying object type and replaces the in-memory cache
 *      with the live list. Memoized per dataset.
 *
 * This transparently corrects any drift between the docs and the running
 * schema (e.g. docs show `sessionId` but the backend currently only accepts
 * `sessionid`).
 */

import { loadFieldsEventsData } from '@/services/real-time-events-service'
import { CURATED_DATASET_FIELDS } from '@/services/real-time-events-service/_shared/dataset-fields'
import { AGGREGATION_OPERATORS } from '@/services/real-time-events-service/_shared/aggregation-operators'

import {
  datasetTypeMapIntrospectionQuery,
  datasetObjectFieldsIntrospectionQuery,
  datasetAggregableFieldsIntrospectionQuery
} from './introspection-queries'

const fieldsCache = new Map() // dataset → string[]
const inflight = new Map() // dataset → Promise<string[]>
let typeMapPromise = null // Promise<Map<dataset, typeName>>

const aggregableFieldsCache = new Map() // metricsDataset → Set<string>
const aggregableFieldsInflight = new Map() // metricsDataset → Promise<Set<string>>

const unwrapTypeName = (type) => {
  let cursor = type
  while (cursor) {
    if (cursor.name) return cursor.name
    cursor = cursor.ofType
  }
  return null
}

const buildTypeMap = async () => {
  if (typeMapPromise) return typeMapPromise
  typeMapPromise = (async () => {
    try {
      // `loadFieldsEventsData` returns the unwrapped `body.data` object on 200,
      // so the introspection payload is at the top level.
      const raw = await loadFieldsEventsData({ query: datasetTypeMapIntrospectionQuery })
      const fields = raw?.__type?.fields || []
      const map = new Map()
      for (const entry of fields) {
        const typeName = unwrapTypeName(entry.type)
        if (entry.name && typeName) map.set(entry.name, typeName)
      }
      return map
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[dataset-fields-loader] type map introspection failed:', error)
      typeMapPromise = null
      return new Map()
    }
  })()
  return typeMapPromise
}

/**
 * Returns the best-known field list for a dataset (sync).
 * Prefers the live introspected cache; falls back to the curated baseline.
 *
 * @param {string} dataset
 * @returns {string[]} possibly empty array; never null.
 */
export const getDatasetFields = (dataset) => {
  if (fieldsCache.has(dataset)) return fieldsCache.get(dataset)
  const curated = CURATED_DATASET_FIELDS[dataset]
  return curated ? [...curated] : []
}

/**
 * Forces an introspection of `dataset`'s object type and replaces the cache.
 * Multiple concurrent calls share the same in-flight promise.
 *
 * Fails gracefully: on any error the curated baseline continues to be served.
 *
 * @param {string} dataset
 * @returns {Promise<string[]>}
 */
export const loadDatasetFields = async (dataset) => {
  if (fieldsCache.has(dataset)) return fieldsCache.get(dataset)
  if (inflight.has(dataset)) return inflight.get(dataset)

  const task = (async () => {
    try {
      const typeMap = await buildTypeMap()
      const typeName = typeMap.get(dataset)
      if (!typeName) return getDatasetFields(dataset)

      const raw = await loadFieldsEventsData({
        query: datasetObjectFieldsIntrospectionQuery(typeName)
      })
      const fields = raw?.__type?.fields || []
      // Aggregated GraphQL types expose both row fields and aggregation
      // operators (count/sum/max/min/avg/rate). Only row fields belong in
      // this cache — operators are only valid selectors inside a query that
      // also carries an `aggregate: { ... }` clause.
      const names = fields
        .map((field) => field.name)
        .filter((name) => name && !AGGREGATION_OPERATORS.has(name))
      if (names.length) {
        fieldsCache.set(dataset, names)
        return names
      }
      return getDatasetFields(dataset)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`[dataset-fields-loader] introspection for "${dataset}" failed:`, error)
      return getDatasetFields(dataset)
    } finally {
      inflight.delete(dataset)
    }
  })()

  inflight.set(dataset, task)
  return task
}

/**
 * Returns the set of field names accepted by the `aggregate:` argument of a
 * Metrics dataset (e.g. which fields can appear inside `aggregate: { sum: … }`).
 * The set is discovered once via introspection and cached.
 *
 * Consumers should use this set to filter chart configs before issuing a query
 * — any field missing from the live enum would otherwise be rejected with a
 * 400 `Expected type "<Dataset>AggregatedFields", found <field>`.
 *
 * @param {string} metricsDataset - e.g. 'httpMetrics', 'botManagerMetrics'
 * @returns {Promise<Set<string>>} empty Set on failure (caller treats as
 *   "allow everything" to avoid masking unrelated errors).
 */
export const loadAggregableFields = async (metricsDataset) => {
  if (!metricsDataset) return new Set()
  if (aggregableFieldsCache.has(metricsDataset)) {
    return aggregableFieldsCache.get(metricsDataset)
  }
  if (aggregableFieldsInflight.has(metricsDataset)) {
    return aggregableFieldsInflight.get(metricsDataset)
  }

  const task = (async () => {
    try {
      const raw = await loadFieldsEventsData({
        query: datasetAggregableFieldsIntrospectionQuery(metricsDataset)
      })
      const values = raw?.__type?.enumValues || []
      const set = new Set(values.map((entry) => entry?.name).filter(Boolean))
      aggregableFieldsCache.set(metricsDataset, set)
      return set
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        `[dataset-fields-loader] aggregable-fields introspection for "${metricsDataset}" failed:`,
        error
      )
      return new Set()
    } finally {
      aggregableFieldsInflight.delete(metricsDataset)
    }
  })()

  aggregableFieldsInflight.set(metricsDataset, task)
  return task
}

/**
 * Sync accessor for cached aggregable fields. Returns `null` when the cache
 * hasn't been populated yet (caller should treat `null` as "unknown" and
 * avoid filtering).
 *
 * @param {string} metricsDataset
 * @returns {Set<string> | null}
 */
export const getAggregableFields = (metricsDataset) =>
  aggregableFieldsCache.get(metricsDataset) || null

/**
 * Test-only helper to reset caches. Not exported from index.js.
 * @private
 */
export const __resetDatasetFieldsCache = () => {
  fieldsCache.clear()
  inflight.clear()
  typeMapPromise = null
  aggregableFieldsCache.clear()
  aggregableFieldsInflight.clear()
}
