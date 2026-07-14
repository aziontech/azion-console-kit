import { ref, watch } from 'vue'
import { workloadService } from '@/services/v2/workload/workload-service'

// Tenant-scoped directory that maps each `deployment_id` to its owning
// workload's display name. The Overview tab uses it to fill the Workload
// column of Live Deployments — the resource_usage endpoint (source of the
// Live table) only exposes the deployment_id/name, not the workload link.
//
// One paginated pull of GET /v4/workspace/workloads is enough: each workload
// carries a `bindings: [{ environment_id, deployment_id }]` array, so the
// deployment→workload mapping is built entirely on the client. Cost = O(pages),
// not O(active deployments).

const PAGE_SIZE = 100
const MAX_PAGES = 20

const readWorkloadName = (workload) => {
  const name = workload?.name
  if (!name) return null
  if (typeof name === 'string') return name
  return name.text ?? null
}

const collectBindings = (workload) => {
  const bindings = Array.isArray(workload?.bindings) ? workload.bindings : []
  return bindings
    .map((binding) => binding?.deployment_id)
    .filter((deploymentId) => deploymentId != null)
}

export function useWorkloadDirectory({ enabled } = {}) {
  const deploymentToWorkload = ref(new Map())
  const isLoading = ref(true)

  const fetchAll = async () => {
    const directory = new Map()
    let page = 1
    let total = Infinity

    while (page <= MAX_PAGES && directory.size < total) {
      const result = await workloadService.listWorkloads({ page, pageSize: PAGE_SIZE })
      const rows = Array.isArray(result?.body) ? result.body : []
      total = Number.isFinite(result?.count) ? result.count : rows.length

      for (const workload of rows) {
        const name = readWorkloadName(workload)
        if (!name) continue
        for (const deploymentId of collectBindings(workload)) {
          directory.set(String(deploymentId), name)
        }
      }

      if (rows.length === 0) break
      page += 1
    }

    return directory
  }

  const load = async () => {
    isLoading.value = true
    try {
      deploymentToWorkload.value = await fetchAll()
    } catch {
      // Silently fall back to an empty directory — the Workload column will
      // render "—" instead of blocking the Overview.
      deploymentToWorkload.value = new Map()
    } finally {
      isLoading.value = false
    }
  }

  // Skip the fetch entirely when the caller (e.g., resources that don't opt into
  // the Overview registry) marks it as disabled. Defaults to always enabled.
  watch(
    () => (typeof enabled === 'function' ? enabled() : (enabled ?? true)),
    (isEnabled, _prev, onCleanup) => {
      if (!isEnabled) {
        deploymentToWorkload.value = new Map()
        isLoading.value = false
        return
      }
      let cancelled = false
      load().then(() => {
        if (cancelled) return
      })
      onCleanup(() => {
        cancelled = true
      })
    },
    { immediate: true }
  )

  return { deploymentToWorkload, isLoading, refresh: load }
}
