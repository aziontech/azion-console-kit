import { ref, watch, toValue } from 'vue'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

export function useWorkloadVersionEnvironments(workloadId, versions, { service }) {
  const environments = ref([])
  const isResolving = ref(false)

  const resolve = async () => {
    const id = String(toValue(workloadId) ?? '')
    const list = toValue(versions) ?? []
    if (!id || !list.length) {
      environments.value = []
      return
    }

    const candidates = list.filter((version) => version.state === VERSION_STATES.READY)
    if (!candidates.length) {
      environments.value = []
      return
    }

    isResolving.value = true
    try {
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
    } finally {
      isResolving.value = false
    }
  }

  watch([() => toValue(workloadId), () => toValue(versions)], resolve, { immediate: true })

  return { environments, isResolving, resolve }
}
