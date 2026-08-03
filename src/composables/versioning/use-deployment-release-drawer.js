import { ref, computed, watch, toValue } from 'vue'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { workloadService } from '@/services/v2/workload/workload-service'
import { environmentService } from '@/services/v2/environment/environment-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { resolveReleaseResources } from '@/views/Deployments/utils/resolveReleaseResources'

const FALLBACK_LABEL = '--'

const getUtcDayRange = (isoDate) => {
  if (!isoDate) return null
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  return {
    begin: new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString(),
    end: new Date(Date.UTC(year, month, day, 23, 59, 59, 999)).toISOString()
  }
}

const toResourceList = (resources) => (Array.isArray(resources) ? resources : [])

const withResolvedName = (resource) => ({
  ...resource,
  name: resource?.name || resource?.id || resource?.label || FALLBACK_LABEL
})

export function useDeploymentReleaseDrawer({ release, visible, emit } = {}) {
  const detail = ref(null)
  const isLoading = ref(false)
  const logs = ref([])
  const isLoadingLogs = ref(false)
  const resolvedResources = ref([])
  const isResolvingResources = ref(false)

  let resolveSeq = 0

  const currentRelease = computed(() => toValue(release))

  const visibleDrawer = computed({
    get: () => Boolean(toValue(visible)),
    set: (value) => emit?.('update:visible', value)
  })

  const displayRelease = computed(() => {
    const base = detail.value ?? currentRelease.value
    if (!base) return base
    const source = resolvedResources.value.length ? resolvedResources.value : (base.resources ?? [])
    const resources = toResourceList(source).map(withResolvedName)
    return { ...base, resources }
  })

  const visitUrl = computed(
    () =>
      displayRelease.value?.urls?.deployment_url || displayRelease.value?.urls?.canonical_url || ''
  )

  const secondaryButtonLabel = computed(() =>
    displayRelease.value?.isCurrent ? 'Rollback' : 'Redeploy'
  )

  const onSecondaryAction = () => {
    const target = displayRelease.value
    if (!target) return
    emit?.(target.isCurrent ? 'rollback' : 'redeploy', target)
  }

  const listEnabled = computed(() => Boolean(toValue(visible)))
  const workloadsQuery = workloadService.useWorkloadsListQuery({ enabled: listEnabled })
  const environmentsQuery = environmentService.useEnvironmentsListQuery({ enabled: listEnabled })
  const deploymentsQuery = deploymentService.useDeploymentsListQuery({ enabled: listEnabled })

  const deploymentId = computed(
    () => displayRelease.value?.deployment_id ?? currentRelease.value?.deployment_id ?? null
  )

  const environmentNameById = computed(() => {
    const map = {}
    ;(environmentsQuery.data.value?.body ?? []).forEach((environment) => {
      map[String(environment.id)] = environment.name
    })
    return map
  })

  const bindingsForDeployment = (workload) =>
    (workload.bindings ?? []).filter(
      (binding) => String(binding.deployment_id) === String(deploymentId.value)
    )

  const impactedWorkloads = computed(() => {
    if (!deploymentId.value) return []
    return (workloadsQuery.data.value?.body ?? [])
      .filter((workload) => bindingsForDeployment(workload).length > 0)
      .map((workload) => ({
        id: workload.id,
        name: workload.name?.text ?? workload.name,
        environments: bindingsForDeployment(workload).map(
          (binding) =>
            environmentNameById.value[String(binding.environment_id)] ?? binding.environment_id
        )
      }))
  })

  const impactedWorkloadCount = computed(() => impactedWorkloads.value.length)

  const isLoadingImpactedWorkloads = computed(
    () => workloadsQuery.isLoading.value || environmentsQuery.isLoading.value
  )

  const deploymentName = computed(() => {
    if (!deploymentId.value) return ''
    const match = (deploymentsQuery.data.value?.body ?? []).find(
      (deployment) => String(deployment.id) === String(deploymentId.value)
    )
    return match?.name ?? ''
  })

  const resetState = () => {
    detail.value = null
    resolvedResources.value = []
    isResolvingResources.value = false
    logs.value = []
    isLoadingLogs.value = false
  }

  const loadLogs = async (release, seq) => {
    const traceId = release?.trace_id
    const range = getUtcDayRange(release?.created_at ?? release?.audit?.requested_at)
    if (!traceId || !range) {
      if (seq === resolveSeq) logs.value = []
      return
    }

    isLoadingLogs.value = true
    try {
      const { data } = await deploymentReleaseService.getReleaseLogsService(traceId, range)
      if (seq !== resolveSeq) return
      logs.value = Array.isArray(data) ? data : []
    } catch {
      if (seq === resolveSeq) logs.value = []
    } finally {
      if (seq === resolveSeq) isLoadingLogs.value = false
    }
  }

  const fetchDetail = async () => {
    const source = currentRelease.value
    const deploymentId = source?.deployment_id
    const releaseId = source?.id
    if (!deploymentId || !releaseId) {
      detail.value = null
      return
    }

    const seq = ++resolveSeq
    isLoading.value = true
    isResolvingResources.value = true
    try {
      const { data } = await deploymentReleaseService.getReleaseByIdService(deploymentId, releaseId)
      if (seq !== resolveSeq) return
      detail.value = data
      const releaseResources = toResourceList(data?.resources)
      resolvedResources.value = releaseResources

      const enriched = await resolveReleaseResources(releaseResources)
      if (seq !== resolveSeq) return
      resolvedResources.value = enriched

      await loadLogs(data, seq)
    } catch (error) {
      if (seq !== resolveSeq) return
      detail.value = null
      resolvedResources.value = []
      emit?.('error', error)
    } finally {
      if (seq === resolveSeq) {
        isLoading.value = false
        isResolvingResources.value = false
      }
    }
  }

  watch(
    () => toValue(visible),
    (open) => {
      if (open) fetchDetail()
      else resetState()
    }
  )

  watch(
    () => currentRelease.value?.id,
    () => {
      if (toValue(visible)) fetchDetail()
    }
  )

  return {
    detail,
    isLoading,
    isResolvingResources,
    logs,
    isLoadingLogs,
    impactedWorkloads,
    impactedWorkloadCount,
    isLoadingImpactedWorkloads,
    deploymentName,
    visibleDrawer,
    displayRelease,
    visitUrl,
    secondaryButtonLabel,
    onSecondaryAction,
    fetchDetail
  }
}

export function useReleaseDrawerController({ actionable = false } = {}) {
  const visible = ref(false)
  const selectedRelease = ref(null)

  const openRelease = (release) => {
    if (!release) return
    selectedRelease.value = release
    visible.value = true
  }

  const closeDrawer = () => {
    visible.value = false
    selectedRelease.value = null
  }

  return {
    visible,
    selectedRelease,
    actionable,
    openRelease,
    closeDrawer
  }
}
