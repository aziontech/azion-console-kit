import { ref, watch } from 'vue'
import { workloadService } from '@/services/v2/workload/workload-service'
import { environmentService } from '@/services/v2/environment/environment-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'

// Tenant-scoped directories consumed by the Overview tab's Live Deployments
// table. Every map is keyed by `deployment_id` so the workload-resolver
// (called per deployment) can enrich each row in O(1):
//   - deploymentToWorkload:    deployment_id → workload.name
//   - deploymentToEnvironment: deployment_id → environment.name
//   - deploymentToMeta:        deployment_id → { updatedAt, lastModifiedBy }
//
// The resource_usage endpoint (source of the live deployments) only exposes
// `deployment_id` and the deployment's own name. Environment names live in
// `/v4/workspace/environments`, and the deployed-at timestamp + author live on
// each Deployment row (`/v4/deployments`). The workload→deployment bridge is
// the `bindings[]` array carried by every workload. One paginated pull each
// (workloads + environments + deployments) is enough for the whole tenant —
// cost = O(pages), not O(active deployments).

const PAGE_SIZE = 100
const MAX_PAGES = 20

const readWorkloadName = (workload) => {
  const name = workload?.name
  if (!name) return null
  if (typeof name === 'string') return name
  return name.text ?? null
}

// Paginate a listing that returns `{ body, count }`. Tolerates the DRF quirk of
// answering 404 for a page beyond the last one — treats it as end-of-list on
// pages > 1, but propagates a genuine failure on page 1.
const paginate = async (fetchPage) => {
  const rows = []
  let page = 1
  let total = Infinity
  while (page <= MAX_PAGES && rows.length < total) {
    let result
    try {
      result = await fetchPage(page)
    } catch (err) {
      if (page === 1) throw err
      break
    }
    const batch = Array.isArray(result?.body) ? result.body : []
    total = Number.isFinite(result?.count) ? result.count : batch.length
    rows.push(...batch)
    if (batch.length === 0) break
    page += 1
  }
  return rows
}

export function useWorkloadDirectory({ enabled } = {}) {
  const deploymentToWorkload = ref(new Map())
  const deploymentToEnvironment = ref(new Map())
  const deploymentToMeta = ref(new Map())
  const isLoading = ref(true)

  const fetchWorkloads = () =>
    paginate((page) =>
      workloadService.listWorkloads({
        page,
        pageSize: PAGE_SIZE,
        // Backend follows DRF snake_case; ship both to be tolerant of either
        // wire format (axios serializes the params object verbatim).
        page_size: PAGE_SIZE,
        ordering: '-last_modified'
      })
    )

  const fetchEnvironments = async () => {
    try {
      const result = await environmentService.listEnvironmentsService()
      return Array.isArray(result?.body) ? result.body : []
    } catch {
      // Environments API failure must not block the other directories.
      return []
    }
  }

  const fetchDeployments = async () => {
    try {
      return await paginate((page) =>
        deploymentService.listDeploymentsService({ page, pageSize: PAGE_SIZE })
      )
    } catch {
      // Deployments API failure only blanks the Deployed column; workload +
      // environment still resolve.
      return []
    }
  }

  const buildDirectories = (workloads, environments, deployments) => {
    const workloadDir = new Map()
    const environmentDir = new Map()
    const metaDir = new Map()

    const envIdToName = new Map()
    for (const env of environments) {
      if (env?.id == null) continue
      const name = typeof env?.name === 'string' ? env.name : (env?.name?.text ?? null)
      if (!name) continue
      envIdToName.set(String(env.id), name)
    }

    for (const deployment of deployments) {
      if (deployment?.id == null) continue
      metaDir.set(String(deployment.id), {
        updatedAt: deployment.updated_at ?? deployment.created_at ?? null,
        lastModifiedBy: deployment.last_modified_by ?? deployment.created_by ?? null
      })
    }

    for (const workload of workloads) {
      const workloadName = readWorkloadName(workload)
      // v6 workloads may expose the mapping as `bindings: [{deployment_id, environment_id}]`
      // OR flat as top-level `deployment_id` + `environment_id`. Handle both.
      const bindings = Array.isArray(workload?.bindings) ? workload.bindings : []
      const flatBinding =
        workload?.deployment_id != null || workload?.environment_id != null
          ? [
              {
                deployment_id: workload.deployment_id,
                environment_id: workload.environment_id
              }
            ]
          : []
      const allBindings = bindings.length > 0 ? bindings : flatBinding

      for (const binding of allBindings) {
        const deploymentId = binding?.deployment_id
        if (deploymentId == null) continue
        const key = String(deploymentId)
        if (workloadName) workloadDir.set(key, workloadName)
        const envId = binding?.environment_id
        if (envId != null) {
          const envName = envIdToName.get(String(envId))
          if (envName) environmentDir.set(key, envName)
        }
      }
    }

    return { workloadDir, environmentDir, metaDir }
  }

  const load = async () => {
    isLoading.value = true
    try {
      const [workloads, environments, deployments] = await Promise.all([
        fetchWorkloads(),
        fetchEnvironments(),
        fetchDeployments()
      ])
      const { workloadDir, environmentDir, metaDir } = buildDirectories(
        workloads,
        environments,
        deployments
      )
      deploymentToWorkload.value = workloadDir
      deploymentToEnvironment.value = environmentDir
      deploymentToMeta.value = metaDir
    } catch {
      // Silently fall back to empty directories — the affected columns render
      // "—" instead of blocking the Overview.
      deploymentToWorkload.value = new Map()
      deploymentToEnvironment.value = new Map()
      deploymentToMeta.value = new Map()
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
        deploymentToEnvironment.value = new Map()
        deploymentToMeta.value = new Map()
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

  return {
    deploymentToWorkload,
    deploymentToEnvironment,
    deploymentToMeta,
    isLoading,
    refresh: load
  }
}
