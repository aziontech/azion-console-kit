import { ref, watch, toValue } from 'vue'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

export const ENVIRONMENT_SOURCE_PAGE_SIZE = 100

export function useWorkloadVersionEnvironments(workloadId, { service }) {
  const environments = ref([])
  const isResolving = ref(false)

  const resolve = async () => {
    const id = String(toValue(workloadId) ?? '')
    if (!id) {
      environments.value = []
      return
    }

    isResolving.value = true
    try {
      const { body } = await service.listVersionsPage(id, {
        pageSize: ENVIRONMENT_SOURCE_PAGE_SIZE,
        skipCache: true
      })

      const candidates = (Array.isArray(body) ? body : []).filter(
        (version) => version.state === VERSION_STATES.READY
      )
      if (!candidates.length) {
        environments.value = []
        return
      }

      const details = await Promise.all(
        candidates.map((version) => service.loadVersion(id, version.id).catch(() => null))
      )

      const byEnvironment = new Map()
      for (const detail of details) {
        const environmentId = detail?.environmentId
        if (!environmentId) continue

        const existing = byEnvironment.get(environmentId)
        if (!existing || Number(detail.version ?? 0) > Number(existing.version ?? 0)) {
          byEnvironment.set(environmentId, detail)
        }
      }

      environments.value = Array.from(byEnvironment.entries()).map(([environmentId, version]) => ({
        environmentId,
        deploymentId: version.deploymentId ?? null,
        version
      }))
    } catch {
      environments.value = []
    } finally {
      isResolving.value = false
    }
  }

  watch(() => toValue(workloadId), resolve, { immediate: true })

  return { environments, isResolving, resolve }
}
