// Pure aggregation over the per-DS reverse-lookup index. Given the inverted
// `workloadsByDs` (the shape `buildReverseLookupByDs` produces and the impact
// engine reads: `{ [dsId]: [{ id, name, environmentId, environmentName,
// domains[] }] }`), it computes per-DS and aggregate `totalWorkloads` /
// `totalDomains` from the FULL list, while exposing a display-capped slice
// (top-N, default 10) of workloads/domains per DS for the impact view
// (req 3.4, 3.8).
//
// `isPartial` is the honesty flag (req 3.7): the totals are derived from
// whatever the source delivered, so when the source itself was truncated at the
// page-fetch cap, the totals cannot be claimed as exact. The caller passes that
// fact in via `sourceCapped` — this function never fetches, so it cannot know
// otherwise. The display cap (top-N) does NOT make a DS partial: totals are
// still computed from the full per-DS list; only the rendered slice is trimmed.
//
// Pure: no Vue, no IO, no reactivity. Same input -> same output.

const DEFAULT_DISPLAY_CAP = 10

const toWorkloadList = (value) => (Array.isArray(value) ? value : [])

const domainsOf = (workload) => (Array.isArray(workload?.domains) ? workload.domains : [])

/** Per-DS totals from the FULL list, plus the top-N display slice. */
const summarizeDs = (workloads, cap) => {
  const list = toWorkloadList(workloads)
  const totalWorkloads = list.length
  const totalDomains = list.reduce((sum, workload) => sum + domainsOf(workload).length, 0)

  // Display cap: render at most the top-N workloads, and within them the top-N
  // domains, while the totals above stay full (req 3.8).
  const topWorkloads = list.slice(0, cap).map((workload) => ({
    id: workload?.id ?? null,
    name: workload?.name ?? null,
    environmentId: workload?.environmentId ?? null,
    environmentName: workload?.environmentName ?? null,
    domains: domainsOf(workload).slice(0, cap)
  }))

  return {
    totalWorkloads,
    totalDomains,
    // True when the display slice hides rows the totals still count.
    displayCapped:
      totalWorkloads > topWorkloads.length ||
      totalDomains > topWorkloads.reduce((sum, workload) => sum + workload.domains.length, 0),
    topWorkloads
  }
}

/**
 * @typedef {object} DsImpactTotals
 * @property {string} deploymentId
 * @property {number} totalWorkloads - Count from the full per-DS list.
 * @property {number} totalDomains - Count from the full per-DS list.
 * @property {boolean} isPartial - True when the totals are not exact (source capped).
 * @property {boolean} displayCapped - True when the top-N slice hides counted rows.
 * @property {Array<{id, name, environmentId, environmentName, domains: string[]}>} topWorkloads
 */

/**
 * Compute per-DS and aggregate impact totals over the inverted index.
 *
 * @param {Record<string, Array<{id, name, environmentId, environmentName, domains: string[]}>>} workloadsByDs
 *   The per-DS reverse-lookup index (see `buildReverseLookupByDs`).
 * @param {object} [options]
 * @param {number} [options.cap=10] - Display cap (top-N) for workloads/domains per DS.
 * @param {boolean} [options.sourceCapped=false] - Whether the workloads list the
 *   index was built from hit the page-fetch cap. When true, totals are flagged
 *   `isPartial` (req 3.7) — they are reported as a floor, never as exact.
 * @returns {{ perDs: DsImpactTotals[], totals: { dsCount: number, totalWorkloads: number, totalDomains: number, isPartial: boolean } }}
 */
export const computeImpactTotals = (
  workloadsByDs,
  { cap = DEFAULT_DISPLAY_CAP, sourceCapped = false } = {}
) => {
  const index = workloadsByDs && typeof workloadsByDs === 'object' ? workloadsByDs : {}
  // A non-positive cap would drop every row; treat it as "no display cap".
  const displayCap = Number.isInteger(cap) && cap > 0 ? cap : Infinity
  const isPartial = Boolean(sourceCapped)

  const perDs = Object.keys(index).map((deploymentId) => {
    const { totalWorkloads, totalDomains, displayCapped, topWorkloads } = summarizeDs(
      index[deploymentId],
      displayCap
    )
    return {
      deploymentId,
      totalWorkloads,
      totalDomains,
      // Capping the source makes every DS's totals a floor, not an exact value.
      isPartial,
      displayCapped,
      topWorkloads
    }
  })

  const totals = {
    dsCount: perDs.length,
    totalWorkloads: perDs.reduce((sum, entry) => sum + entry.totalWorkloads, 0),
    totalDomains: perDs.reduce((sum, entry) => sum + entry.totalDomains, 0),
    isPartial
  }

  return { perDs, totals }
}
