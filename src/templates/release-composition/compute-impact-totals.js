const DEFAULT_DISPLAY_CAP = 10

const toWorkloadList = (value) => (Array.isArray(value) ? value : [])

const domainsOf = (workload) => (Array.isArray(workload?.domains) ? workload.domains : [])

const summarizeDs = (workloads, cap) => {
  const list = toWorkloadList(workloads)
  const totalWorkloads = list.length
  const totalDomains = list.reduce((sum, workload) => sum + domainsOf(workload).length, 0)

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
    displayCapped:
      totalWorkloads > topWorkloads.length ||
      totalDomains > topWorkloads.reduce((sum, workload) => sum + workload.domains.length, 0),
    topWorkloads
  }
}

/**
 * @typedef {object} DsImpactTotals
 * @property {string} deploymentId
 * @property {number} totalWorkloads
 * @property {number} totalDomains
 * @property {boolean} isPartial
 * @property {boolean} displayCapped
 * @property {Array<{id, name, environmentId, environmentName, domains: string[]}>} topWorkloads
 */

/**
 * @param {Record<string, Array<{id, name, environmentId, environmentName, domains: string[]}>>} workloadsByDs
 * @param {object} [options]
 * @param {number} [options.cap=10]
 * @param {boolean} [options.sourceCapped=false]
 * @returns {{ perDs: DsImpactTotals[], totals: { dsCount: number, totalWorkloads: number, totalDomains: number, isPartial: boolean } }}
 */
export const computeImpactTotals = (
  workloadsByDs,
  { cap = DEFAULT_DISPLAY_CAP, sourceCapped = false } = {}
) => {
  const index = workloadsByDs && typeof workloadsByDs === 'object' ? workloadsByDs : {}
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
