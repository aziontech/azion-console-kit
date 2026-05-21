/**
 * Reactive wrapper around `dataset-fields-loader`. Components watch `dataset`
 * and always read from `fields` without caring whether the value comes from
 * the curated baseline or an introspected refresh.
 *
 * Lifecycle per dataset change:
 *   1. Emit the best-known list synchronously (curated or cached introspected).
 *   2. Fire introspection in the background; when it resolves, swap `fields`
 *      to the live schema's list and re-emit.
 */

import { ref, watch } from 'vue'

import { getDatasetFields, loadDatasetFields } from '@/modules/filter-loaders/dataset-fields-loader'

export function useDatasetFields(datasetRef) {
  const fields = ref([])
  const isRefreshing = ref(false)
  const error = ref(null)

  const refresh = async (dataset) => {
    if (!dataset) {
      fields.value = []
      return
    }

    // Synchronous baseline so the UI never waits for introspection.
    fields.value = getDatasetFields(dataset)

    isRefreshing.value = true
    error.value = null
    try {
      const live = await loadDatasetFields(dataset)
      // Guard against race: user may have switched datasets during the await.
      if (datasetRef?.value === dataset && Array.isArray(live) && live.length) {
        fields.value = live
      }
    } catch (err) {
      error.value = err
    } finally {
      if (datasetRef?.value === dataset) {
        isRefreshing.value = false
      }
    }
  }

  watch(
    () => datasetRef?.value,
    (next) => refresh(next),
    { immediate: true }
  )

  return { fields, isRefreshing, error, refresh }
}
