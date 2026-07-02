// Sibling composable (design §3.1 / §7.3) that owns the release blast-radius
// DATA — the per-DS reverse-lookup index the existing impact engine reads, plus
// the per-DS meta (`environmentNames` / `workloadsCount`) the DS picker rows
// spread in. It performs NO IO itself: it drives the injected `lookupService`
// (task 5.1), which is the only place that touches the tenant workloads /
// environments services (req 9.2). The engine in `use-release-composition.js`
// stays untouched and simply reads the `reverseLookupByDs` ref this owns (SEAM 1,
// req 9.5).
//
// Injection style (design decision §11): `lookupService` is a FACTORY ARGUMENT
// with a default (the production singleton) — tests pass a fake. No
// `provide/inject` (single consumer, explicit dependency, unit-testable without a
// Vue app context).
//
// Honesty contract (req 7.3 / 11.2): this composable never fabricates names or
// counts. `dsMetaFor` omits any field it cannot derive from the resolved index;
// the active version of a DS is surfaced ONLY as a single-DS hint, never as a
// cross-env "Current" claim (design §7.5, req 7.1).

import { ref, computed, toValue } from 'vue'
import { releaseImpactLookupService } from '@/services/v2/release-impact/release-impact-lookup-service'

/** Machine-readable degradation reasons the consumer maps to a partial state. */
export const DEGRADATION_REASON = Object.freeze({
  LEGACY_NO_BINDINGS: 'legacy_no_bindings',
  FETCH_FAILED: 'fetch_failed',
  CAPPED: 'capped'
})

const isPlainObject = (value) => Boolean(value) && typeof value === 'object'

/** The resolved index is empty when no DS carries any reverse-lookup row. */
const isEmptyIndex = (index) => !isPlainObject(index) || Object.keys(index).length === 0

/**
 * Own the release blast-radius data sourced from the injected `lookupService`.
 *
 * MUST be invoked from a Vue setup context: `lookupService.getReverseLookup`
 * sets up the underlying `useXxxListQuery` composables, which wrap vue-query.
 *
 * @param {object} [options]
 * @param {import('vue').Ref<Array>|(() => Array)} [options.selectedDsIds] - The
 *   currently selected Deployment Settings ids (owned by the store). Used to gate
 *   the single-DS active-version hint; the resolved index is tenant-wide.
 * @param {{ getReverseLookup: (opts: { enabled?: * }) => Promise<{ index: object, isPartial: boolean }> }} [options.lookupService]
 *   The IO seam (task 5.1). Defaults to the production singleton; tests inject a
 *   fake exposing the same `getReverseLookup` contract.
 * @param {import('vue').Ref<boolean>|(() => boolean)|boolean} [options.enabled] -
 *   Gates fetching to the screen's active state; forwarded as-is to the lookup
 *   service (closed never fetches, reopen reuses the cache).
 * @returns {{
 *   reverseLookupByDs: import('vue').Ref<object>,
 *   dsMetaFor: (dsId: (string|number)) => ({ environmentNames?: string[], workloadsCount?: number }),
 *   activeVersionHintFor: (dsId: (string|number)) => (string|number|null),
 *   isLoading: import('vue').ComputedRef<boolean>,
 *   isPartial: import('vue').ComputedRef<boolean>,
 *   degradationReason: import('vue').ComputedRef<(string|null)>,
 *   retry: () => Promise<void>
 * }}
 */
export function useReleaseImpact({
  selectedDsIds,
  lookupService = releaseImpactLookupService,
  enabled
} = {}) {
  // The engine's input ref (SEAM 1). Owned here, read by `use-release-composition`.
  const reverseLookupByDs = ref({})
  const isLoading = ref(false)
  const sourceCapped = ref(false)
  // True only when the last lookup REJECTED — distinct from an empty (legacy)
  // index, so the consumer can tell "fetch failed" from "tenant has no bindings".
  const fetchFailed = ref(false)
  // Tracks whether a lookup has settled at least once, so we don't claim
  // `legacy_no_bindings` before the first resolution.
  const hasResolved = ref(false)

  /**
   * Drive the injected lookup service and publish its result onto the owned ref.
   * A rejection degrades to `fetch_failed` with an empty index — never a
   * fabricated one (req 7.3); `retry` re-runs this.
   */
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

  // Kick off the initial lookup synchronously during setup (the lookup service
  // must run inside this setup context). The returned promise is intentionally
  // not awaited here — reactivity surfaces progress via `isLoading`.
  runLookup()

  const isPartial = computed(() => sourceCapped.value)

  // Precedence (most → least severe): a hard fetch failure dominates; an empty
  // index after a successful load means a legacy tenant (no v6 bindings); a
  // capped-but-populated result is the mildest. `null` when impact is healthy.
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
   * Per-DS meta for the picker row: `{ environmentNames, workloadsCount }`, with
   * every field OMITTED when it cannot be derived (req 3.6 / 7.3). `workloadsCount`
   * counts DISTINCT workloads (by `row.id`), and `environmentNames` lists every
   * distinct non-null environment name in first-occurrence order — included only
   * when at least one such name exists.
   *
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
   * Single-DS active-version HINT (design §7.5, req 7.1). Returns a value only
   * when EXACTLY ONE DS is selected — never aggregated across environments, so it
   * can never be mistaken for a cross-env "Current" claim. The browser-reachable
   * lookup carries no active-version field today (that lands with the deferred
   * `resourceUsageResolver`), so this resolves to `null`; the gate is what the
   * contract guarantees, not a fabricated version.
   *
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

  /** Re-trigger the lookup (consumer's "Retry impact" action, req 7.4). */
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
