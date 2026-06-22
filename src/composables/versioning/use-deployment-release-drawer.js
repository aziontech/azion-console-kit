// Orchestrator composable for the Deployment Release drawer: centralizes the
// state duplicated across its consumers (visibility, selected release, detail
// fetch, an explicit resolving flag + stale guard) and is the SINGLE source of
// truth for resource-name resolution, applying a deterministic fallback so a
// name never renders silently blank.

import { ref, computed, watch, toValue } from 'vue'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { resolveReleaseResources } from '@/views/Deployments/utils/resolveReleaseResources'

// Deterministic fallback when name resolution yields nothing: never a silent
// blank. Order: resolved/adapter name → resource id → label → em dash.
const FALLBACK_LABEL = '--'

const withResolvedName = (resource) => ({
  ...resource,
  name: resource?.name || resource?.id || resource?.label || FALLBACK_LABEL
})

export function useDeploymentReleaseDrawer({ release, visible, emit } = {}) {
  const detail = ref(null)
  const isLoading = ref(false)
  // Raw resources for the current detail; the final display fallback is applied
  // once in `displayRelease` so this stays the single resolution pipeline.
  const resolvedResources = ref([])
  // Explicit resolving flag (mirrors `useDeployDrawer`'s `isResolving*`): true
  // while names resolve, so the UI can show a placeholder instead of blanks.
  const isResolvingResources = ref(false)

  // Stale guard: rapid release switches must not let an older async resolution
  // overwrite a newer one (same pattern as `useDeployDrawer`'s seq counters).
  let resolveSeq = 0

  const currentRelease = computed(() => toValue(release))

  const visibleDrawer = computed({
    get: () => Boolean(toValue(visible)),
    set: (value) => emit?.('update:visible', value)
  })

  // Single fallback pass over the resolved resources: the adapter seeds `name`,
  // `resolveReleaseResources` enriches it, here we guarantee a deterministic value.
  const displayRelease = computed(() => {
    const base = detail.value ?? currentRelease.value
    if (!base) return base
    const resources = resolvedResources.value.length
      ? resolvedResources.value
      : (base.resources ?? [])
    return { ...base, resources: resources.map(withResolvedName) }
  })

  const visitUrl = computed(
    () =>
      displayRelease.value?.urls?.deployment_url || displayRelease.value?.urls?.canonical_url || ''
  )

  // Rollback for the live version, Redeploy otherwise (current behavior).
  const secondaryButtonLabel = computed(() =>
    displayRelease.value?.isCurrent ? 'Rollback' : 'Redeploy'
  )

  // Uniform rollback/redeploy contract: emit only when a release exists, so the
  // action is never a silent no-op.
  const onSecondaryAction = () => {
    const target = displayRelease.value
    if (!target) return
    emit?.(target.isCurrent ? 'rollback' : 'redeploy', target)
  }

  const resetState = () => {
    detail.value = null
    resolvedResources.value = []
    isResolvingResources.value = false
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
      resolvedResources.value = data?.resources ?? []

      // Single resolution pipeline: enrich names via the util, guarded against
      // stale writes from a newer release selection.
      const enriched = await resolveReleaseResources(data?.resources ?? [])
      if (seq !== resolveSeq) return
      resolvedResources.value = enriched
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
    visibleDrawer,
    displayRelease,
    visitUrl,
    secondaryButtonLabel,
    onSecondaryAction,
    fetchDetail
  }
}

// Consumer-facing half of the drawer composable: owns the visibility + selected
// release state that used to be duplicated as local refs in every consumer
// (`DeploymentHistoryTab`, `DeploymentVersionsList`, `WorkloadReleasesSection`).
// `actionable` declares whether this context can run rollback/redeploy so the
// drawer hides the button instead of emitting a no-op that only toasts.
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
