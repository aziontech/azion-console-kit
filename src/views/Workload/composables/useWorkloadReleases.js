import { ref } from 'vue'
import { useToast } from '@aziontech/webkit/use-toast'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { workloadService } from '@/services/v2/workload/workload-service'
import { aggregateReleasesByBindings } from '@/views/Workload/utils/aggregateReleasesByBindings'

const resolveDeploymentIds = (bindings) => {
  const ids = []
  const seen = new Set()

  for (const binding of bindings) {
    const deploymentId = binding?.deployment_id
    if (deploymentId == null) continue

    const key = String(deploymentId)
    if (seen.has(key)) continue
    seen.add(key)
    ids.push(key)
  }

  return ids
}

export function useWorkloadReleases({ workloadId, getWorkload } = {}) {
  const toast = useToast()

  const releases = ref([])
  const loading = ref(false)
  const error = ref(null)

  const notifyError = (detail) => {
    toast.add({ closable: true, severity: 'error', summary: 'Error', detail })
  }

  const resolveBindings = async () => {
    let workload = typeof getWorkload === 'function' ? getWorkload() : null

    if (!Array.isArray(workload?.bindings)) {
      workload = await workloadService.loadWorkload({ id: workloadId })
    }

    const bindings = Array.isArray(workload?.bindings) ? workload.bindings : []
    if (bindings.length) return bindings

    if (workload?.workloadDeploymentId != null) {
      return [{ deployment_id: workload.workloadDeploymentId }]
    }

    return []
  }

  const resolveDeploymentNames = async () => {
    try {
      const result = await deploymentService.listDeploymentsService({ pageSize: 100 })
      const deployments = Array.isArray(result?.body) ? result.body : []
      return new Map(deployments.map((deployment) => [String(deployment.id), deployment.name]))
    } catch {
      return new Map()
    }
  }

  const reload = async () => {
    loading.value = true
    error.value = null

    try {
      const bindings = await resolveBindings()
      const deploymentIds = resolveDeploymentIds(bindings)

      if (!deploymentIds.length) {
        releases.value = []
        return
      }

      const [settled, deploymentNameById] = await Promise.all([
        Promise.allSettled(
          deploymentIds.map((deploymentId) =>
            deploymentReleaseService.listReleasesService(deploymentId)
          )
        ),
        resolveDeploymentNames()
      ])

      const releasesByDeployment = new Map()
      let failures = 0

      settled.forEach((result, index) => {
        const deploymentId = deploymentIds[index]
        if (result.status === 'fulfilled') {
          releasesByDeployment.set(
            deploymentId,
            Array.isArray(result.value?.body) ? result.value.body : []
          )
        } else {
          failures += 1
          releasesByDeployment.set(deploymentId, [])
        }
      })

      releases.value = aggregateReleasesByBindings({ releasesByDeployment, deploymentNameById })

      if (failures) {
        notifyError(`Failed to load releases for ${failures} deployment(s).`)
      }
    } catch (err) {
      error.value = err
      releases.value = []
      notifyError(err?.message || 'Failed to load releases')
    } finally {
      loading.value = false
    }
  }

  return { releases, loading, error, reload }
}
