import { ref, computed, toValue } from 'vue'
import { releaseImpactLookupService } from '@/services/v2/release-impact/release-impact-lookup-service'

export const DEGRADATION_REASON = Object.freeze({
  LEGACY_NO_BINDINGS: 'legacy_no_bindings',
  FETCH_FAILED: 'fetch_failed',
  CAPPED: 'capped'
})

const isPlainObject = (value) => Boolean(value) && typeof value === 'object'

const isEmptyIndex = (index) => !isPlainObject(index) || Object.keys(index).length === 0

/**
 * @param {object} [options]
 * @param {import('vue').Ref<Array>|(() => Array)} [options.selectedDsIds]
 * @param {{ getReverseLookup: (opts: { enabled?: * }) => Promise<{ index: object, isPartial: boolean }> }} [options.lookupService]
 * @param {import('vue').Ref<boolean>|(() => boolean)|boolean} [options.enabled]
 * @returns {{
 * reverseLookupByDs: import('vue').Ref<object>,
 * dsMetaFor: (dsId: (string|number)) => ({ environmentNames?: string[], workloadsCount?: number }),
 * activeVersionHintFor: (dsId: (string|number)) => (string|number|null),
 * isLoading: import('vue').ComputedRef<boolean>,
 * isPartial: import('vue').ComputedRef<boolean>,
 * degradationReason: import('vue').ComputedRef<(string|null)>,
 * retry: () => Promise<void>
 * }}
 */
export function useReleaseImpact({
  selectedDsIds,
  lookupService = releaseImpactLookupService,
  enabled
} = {}) {
  const reverseLookupByDs = ref({})
  const isLoading = ref(false)
  const sourceCapped = ref(false)
  const fetchFailed = ref(false)
  const hasResolved = ref(false)

  const runLookup = async () => {
    isLoading.value = true
    fetchFailed.value = false
    try {
      const { index, isPartial } = await lookupService.getReverseLookup({ enabled })
      reverseLookupByDs.value = isPlainObject(index) ? index : {}
      sourceCapped.value = Boolean(isPartial)
    } catch {
      reverseLookupByDs.value = {}
      sourceCapped.value = false
      fetchFailed.value = true
    } finally {
      hasResolved.value = true
      isLoading.value = false
    }
  }

  runLookup()

  const isPartial = computed(() => sourceCapped.value)

  const degradationReason = computed(() => {
    if (fetchFailed.value) return DEGRADATION_REASON.FETCH_FAILED
    if (!hasResolved.value) return null
    if (isEmptyIndex(reverseLookupByDs.value)) return DEGRADATION_REASON.LEGACY_NO_BINDINGS
    if (sourceCapped.value) return DEGRADATION_REASON.CAPPED
    return null
  })

  const rowsFor = (dsId) => {
    const rows = reverseLookupByDs.value?.[dsId]
    return Array.isArray(rows) ? rows : null
  }

  /**
   * @param {(string|number)} dsId
   * @returns {{ environmentNames?: string[], workloadsCount?: number }}
   */
  const dsMetaFor = (dsId) => {
    const rows = rowsFor(dsId)
    if (!rows) return {}

    const meta = { workloadsCount: new Set(rows.map((row) => row?.id)).size }

    const environmentNames = [
      ...new Set(
        rows.map((row) => row?.environmentName).filter((name) => name != null && name !== '')
      )
    ]
    if (environmentNames.length) {
      meta.environmentNames = environmentNames
    }

    return meta
  }

  /**
   * @param {(string|number)} dsId
   * @returns {(string|number|null)}
   */
  const activeVersionHintFor = (dsId) => {
    const selected = (toValue(selectedDsIds) ?? []).map((id) => String(id))
    if (selected.length !== 1) return null
    if (String(dsId) !== selected[0]) return null

    const rows = rowsFor(dsId)
    const hint = rows?.find((row) => row?.activeVersionId != null)?.activeVersionId
    return hint ?? null
  }

  const retry = () => runLookup()

  return {
    reverseLookupByDs,
    dsMetaFor,
    activeVersionHintFor,
    isLoading: computed(() => isLoading.value),
    isPartial,
    degradationReason,
    retry
  }
}
