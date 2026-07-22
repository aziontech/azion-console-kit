import { ref, watch } from 'vue'
import { workloadService } from '@/services/v2/workload/workload-service'
import { environmentService } from '@/services/v2/environment/environment-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'

const PAGE_SIZE = 100
const MAX_PAGES = 20

const readWorkloadName = (workload) => {
  const name = workload?.name
  if (!name) return null
  if (typeof name === 'string') return name
  return name.text ?? null
}

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
        page_size: PAGE_SIZE,
        ordering: '-last_modified'
      })
    )

  const fetchEnvironments = async () => {
    try {
      const result = await environmentService.listEnvironmentsService()
      return Array.isArray(result?.body) ? result.body : []
    } catch {
      return []
    }
  }

  const fetchDeployments = async () => {
    try {
      return await paginate((page) =>
        deploymentService.listDeploymentsService({ page, pageSize: PAGE_SIZE })
      )
    } catch {
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
      deploymentToWorkload.value = new Map()
      deploymentToEnvironment.value = new Map()
      deploymentToMeta.value = new Map()
    } finally {
      isLoading.value = false
    }
  }

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
