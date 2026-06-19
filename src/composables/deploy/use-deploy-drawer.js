// Orchestrator composable for the reusable Deploy/Release drawer: primes the
// listing cache on open, derives a generic composition VM (application slot +
// scoped slot + read-only resources) and dispatches the one-shot release.

import { ref, computed, watch, toValue } from 'vue'
import { workloadService } from '@/services/v2/workload/workload-service'
import { environmentService } from '@/services/v2/environment/environment-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { DeploymentAdapter } from '@/services/v2/deployment/deployment-adapter'
import { buildStrategy } from '@/services/v2/deployment/strategy-builder'
import { deployDrawerService } from '@/services/v2/deploy-drawer/deploy-drawer-service'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const APPLICATION_TYPE = 'application'
const SINGLE_VERSION = 'single_version'
const APPLICATION_CATALOG_PAGE_SIZE = 100

// Sentinel for "Track latest Ready": pin to the newest Ready version at dispatch
// time rather than a fixed short_id. Distinct from any real version id.
export const LATEST_READY = 'LATEST'

const normalizeName = (name) => (isObject(name) ? (name.text ?? '') : (name ?? ''))

// A version is deployable when it is built — `ready` or `active` (serving).
const DEPLOYABLE_STATES = ['ready', 'active']

const toVersionOptions = (versions) =>
  (Array.isArray(versions) ? versions : [])
    .filter((version) => DEPLOYABLE_STATES.includes(version?.state))
    .map((version) => ({
      label: version.comment || version.id,
      value: version.id,
      createdAt: version.createdAt ?? null,
      author: version.lastEditor || null,
      isCurrent: Boolean(version.isCurrent)
    }))

export function useDeployDrawer(resourceContext, { visible } = {}) {
  // `enabled` gates fetching to the drawer's open state (req 1.1, 1.5): closed
  // drawer never fetches, reopen reuses the vue-query cache.
  const enabled = computed(() => Boolean(toValue(visible)))

  // Fast-path on open: prime the vue-query cache with the three listings, so card
  // derivation resolves environment/deployment names from cache (no per-id call).
  const workloadsQuery = workloadService.useWorkloadsListQuery({ enabled })
  const environmentsQuery = environmentService.useEnvironmentsListQuery({ enabled })
  const deploymentsQuery = deploymentService.useDeploymentsListQuery({ enabled })

  const queries = [workloadsQuery, environmentsQuery, deploymentsQuery]

  // Aggregated loading/error across the three listings (req 1.2, 1.4).
  const isLoading = computed(() => queries.some((query) => query.isLoading.value))
  const hasError = computed(() => queries.some((query) => query.isError.value))

  const refetch = () => {
    queries.forEach((query) => query.refetch())
  }

  // --- Step 1: workload selection -----------------------------------------

  const workloadsBody = computed(() => workloadsQuery.data.value?.body ?? [])
  const environmentsBody = computed(() => environmentsQuery.data.value?.body ?? [])
  const deploymentsBody = computed(() => deploymentsQuery.data.value?.body ?? [])

  // The displayed domain is a real CUSTOM domain from the workload bindings.
  // `workload_domain` is the internal map_name (e.g. `__v_<hash>` for a version),
  // never a user-facing domain — so it is not used here.
  const primaryDomain = (workload) =>
    (workload.bindings ?? []).flatMap((binding) => binding.domains ?? [])[0] ?? null

  // `name` comes from the workload adapter as `{ text, tagProps }`; fall back to
  // a plain string for resilience (req 2.1).
  const workloadOptions = computed(() =>
    workloadsBody.value.map((workload) => ({
      label: workload.name?.text ?? workload.name,
      value: workload.id,
      domain: primaryDomain(workload),
      environmentCount: (workload.bindings ?? []).length
    }))
  )

  const selectedWorkloadId = ref(null)

  const selectedWorkload = computed(
    () => workloadsBody.value.find((workload) => workload.id === selectedWorkloadId.value) ?? null
  )

  // Name of the selected workload, for the Environment step description.
  const selectedWorkloadName = computed(
    () => selectedWorkload.value?.name?.text ?? selectedWorkload.value?.name ?? ''
  )

  // --- Step 2: environment selection --------------------------------------

  const environmentCards = ref([])
  const isLoadingBindings = ref(false)
  const workloadHasBindings = computed(() => environmentCards.value.length > 0)

  const selectedEnvironmentId = ref(null)

  const selectedEnvironmentCard = computed(
    () => environmentCards.value.find((card) => card.id === selectedEnvironmentId.value) ?? null
  )

  const targetDeploymentId = computed(() => selectedEnvironmentCard.value?.deploymentId ?? null)

  const selectedDeploymentName = computed(() => selectedEnvironmentCard.value?.deploymentName ?? '')

  // --- Scoped resource (origin) -------------------------------------------

  const scopedType = computed(() => toValue(resourceContext)?.resourceType ?? null)
  const isScopedApplication = computed(() => scopedType.value === APPLICATION_TYPE)

  const resourceName = computed(() => toValue(resourceContext)?.resourceName ?? '')

  const versionOptions = computed(() => toValue(resourceContext)?.versions ?? [])

  const selectedVersionId = ref(toValue(resourceContext)?.version?.id ?? null)

  // The context's version arrives async (vue-query). Re-sync the pre-selected
  // scoped version once it resolves, without clobbering a user pick.
  watch(
    () => toValue(resourceContext)?.version?.id,
    (id) => {
      if (id && selectedVersionId.value == null) selectedVersionId.value = id
    },
    { immediate: true }
  )

  // Resolves the chosen scoped version to a concrete id for dispatch: the
  // LATEST_READY sentinel maps to the newest Ready option (first `isCurrent`,
  // else the first option); a pinned id is returned as-is.
  const resolvedVersionId = computed(() => {
    if (selectedVersionId.value !== LATEST_READY) return selectedVersionId.value
    const options = versionOptions.value
    const current = options.find((option) => option.isCurrent)
    return current?.value ?? options[0]?.value ?? null
  })

  const versionLabel = computed(() => {
    const id = toValue(resourceContext)?.version?.id ?? null
    if (!id) return ''
    const match = versionOptions.value.find((option) => option.value === id)
    return match?.label ?? id
  })

  watch(selectedWorkloadId, async (id) => {
    selectedEnvironmentId.value = null
    environmentCards.value = []
    if (!id) return

    // Phase 1: base cards from cache — render immediately.
    isLoadingBindings.value = true
    let base = []
    try {
      base = await deployDrawerService.loadWorkloadEnvironments(id, {
        bindings: selectedWorkload.value?.bindings,
        environments: environmentsBody.value,
        deployments: deploymentsBody.value
      })
    } catch {
      base = []
    } finally {
      isLoadingBindings.value = false
    }
    if (selectedWorkloadId.value !== id) return
    environmentCards.value = base

    // Phase 2: enrich with the active release without blocking the render.
    const enriched = await deployDrawerService
      .enrichReleases(base, toValue(resourceContext)?.resourceType)
      .catch(() => null)
    if (enriched && selectedWorkloadId.value === id) environmentCards.value = enriched
  })

  // --- Active release (baseline) ------------------------------------------

  const activeRelease = ref(null)
  const isLoadingComposition = ref(false)
  const compositionError = ref(null)

  const loadComposition = async (deploymentId) => {
    if (!deploymentId) {
      activeRelease.value = null
      compositionError.value = null
      return
    }

    isLoadingComposition.value = true
    compositionError.value = null

    try {
      activeRelease.value = await deploymentReleaseService.getActiveReleaseComposition(deploymentId)
    } catch (error) {
      compositionError.value = error
      activeRelease.value = null
    } finally {
      isLoadingComposition.value = false
    }
  }

  // The target deployment drives the composition fetch (design §3.1, §4.6).
  watch(targetDeploymentId, (deploymentId) => loadComposition(deploymentId), { immediate: true })

  const policy = computed(() => selectedEnvironmentCard.value?.policy ?? null)
  const isSingle = computed(() => policy.value === SINGLE_VERSION)
  const hasActiveRelease = computed(() => Boolean(activeRelease.value))

  // Raw parts of the active release, split into the application and the remaining
  // read-only resources (the scoped type owns its own slot).
  const releaseParts = computed(() =>
    DeploymentAdapter.transformReleaseComposition(
      activeRelease.value,
      toValue(resourceContext) ?? {}
    )
  )

  const activeReleaseApplication = computed(() => releaseParts.value.applicationFromRelease)

  // Single + deployed + scoped is NOT the application => the application slot is
  // read-only (it carries the current live application). Otherwise editable.
  const applicationReadOnly = computed(
    () => isSingle.value && hasActiveRelease.value && !isScopedApplication.value
  )

  // --- Application catalog (editable slot) ---------------------------------

  const applicationsList = ref([])
  const isLoadingApplications = ref(false)

  // Loaded for the editable cases AND the read-only one: in read-only the
  // catalog resolves the live application's NAME from its id (the release only
  // carries the version_id).
  const shouldLoadCatalog = computed(
    () => Boolean(selectedEnvironmentId.value) && !isScopedApplication.value
  )

  watch(
    shouldLoadCatalog,
    async (load) => {
      if (!load) return
      isLoadingApplications.value = true
      try {
        const { body } = await edgeAppService.listEdgeApplicationsService({
          page: 1,
          pageSize: APPLICATION_CATALOG_PAGE_SIZE
        })
        applicationsList.value = (Array.isArray(body) ? body : []).map((app) => ({
          id: app.id,
          name: normalizeName(app.name),
          versionId: app.versionId?.content ?? app.version_id ?? null
        }))
      } catch {
        applicationsList.value = []
      } finally {
        isLoadingApplications.value = false
      }
    },
    { immediate: true }
  )

  const applicationOptions = computed(() =>
    applicationsList.value.map((app) => ({ label: app.name, value: app.id }))
  )

  // Resolves the live application's NAME (the release only carries the id +
  // version): release name → catalog by id → direct fetch by id (authoritative,
  // no pagination limit) → match the bound version against the catalog.
  const liveApplicationName = ref(null)

  const resolveLiveApplicationName = async (application) => {
    if (!application) return null
    if (application.resourceName) return application.resourceName

    const list = applicationsList.value
    const byId =
      application.resourceId != null &&
      list.find((app) => String(app.id) === String(application.resourceId))
    if (byId) return byId.name

    if (application.resourceId != null) {
      try {
        const app = await edgeAppService.loadEdgeApplicationService({ id: application.resourceId })
        if (app?.name) return app.name
      } catch {
        // fall through to the version match below
      }
    }

    const byVersion = list.find((app) => app.versionId === application.resourceVersion)
    return byVersion?.name ?? null
  }

  watch(
    [activeReleaseApplication, applicationReadOnly, applicationsList],
    async ([application, readOnly]) => {
      liveApplicationName.value = readOnly ? await resolveLiveApplicationName(application) : null
    },
    { immediate: true }
  )

  const selectedApplicationId = ref(null)

  // Pre-select the active release's application when present (read-only case
  // pins it; editable Case 5 prefills it).
  watch(
    activeReleaseApplication,
    (application) => {
      if (application?.resourceId != null && selectedApplicationId.value == null) {
        selectedApplicationId.value = application.resourceId
      }
    },
    { immediate: true }
  )

  // --- Application versions (Ready) ---------------------------------------

  const applicationVersionsRaw = ref([])
  const isLoadingApplicationVersions = ref(false)
  const selectedApplicationVersionId = ref(null)

  watch(
    selectedApplicationId,
    async (id) => {
      selectedApplicationVersionId.value = null
      applicationVersionsRaw.value = []
      if (id == null || isScopedApplication.value) return
      isLoadingApplicationVersions.value = true
      try {
        applicationVersionsRaw.value = await edgeAppVersionService.listVersions(id)
      } catch {
        applicationVersionsRaw.value = []
      } finally {
        isLoadingApplicationVersions.value = false
      }
    },
    { immediate: true }
  )

  // When the scoped resource IS the application, its versions are the context's
  // versions; otherwise they come from the selected application's Ready versions.
  const applicationVersions = computed(() =>
    isScopedApplication.value
      ? versionOptions.value
      : toVersionOptions(applicationVersionsRaw.value)
  )

  // Resolves the editable application version, mapping the LATEST_READY sentinel
  // to the newest Ready option (first `isCurrent`, else the first).
  const resolvedApplicationVersionId = computed(() => {
    if (selectedApplicationVersionId.value !== LATEST_READY) {
      return selectedApplicationVersionId.value
    }
    const options = applicationVersions.value
    const current = options.find((option) => option.isCurrent)
    return current?.value ?? options[0]?.value ?? null
  })

  // --- Composition (generic VM) -------------------------------------------

  const noApplication = computed(() => {
    if (isScopedApplication.value) return false
    return applicationReadOnly.value
      ? !activeReleaseApplication.value
      : applicationsList.value.length === 0
  })

  // The application slot's effective id/version differs per case: read-only pins
  // the active release's application; editable uses the user's selection. When
  // the scoped resource is the application, the scoped selection drives both.
  const applicationSlotId = computed(() => {
    if (isScopedApplication.value) return toValue(resourceContext)?.resourceId ?? null
    if (applicationReadOnly.value) return activeReleaseApplication.value?.resourceId ?? null
    return selectedApplicationId.value
  })

  const applicationSlotVersionId = computed(() => {
    if (isScopedApplication.value) return resolvedVersionId.value
    if (applicationReadOnly.value) return activeReleaseApplication.value?.resourceVersion ?? null
    return resolvedApplicationVersionId.value
  })

  const applicationSlot = computed(() => {
    if (noApplication.value) return null
    return {
      resourceId: applicationSlotId.value,
      resourceName: isScopedApplication.value
        ? resourceName.value
        : applicationReadOnly.value
          ? liveApplicationName.value
          : (applicationsList.value.find((app) => app.id === selectedApplicationId.value)?.name ??
            null),
      versionId: applicationSlotVersionId.value,
      editable: !applicationReadOnly.value,
      options: applicationReadOnly.value ? [] : applicationOptions.value,
      versionOptions: applicationVersions.value
    }
  })

  const scopedSlot = computed(() => {
    if (isScopedApplication.value) return null
    const context = toValue(resourceContext) ?? {}
    return {
      resourceType: scopedType.value,
      resourceId: context.resourceId ?? null,
      resourceName: resourceName.value,
      versionId: resolvedVersionId.value,
      versionOptions: versionOptions.value,
      editable: true
    }
  })

  const composition = computed(() => ({
    applicationSlot: applicationSlot.value,
    scopedSlot: scopedSlot.value,
    readOnlyResources: releaseParts.value.readOnlyResources,
    noApplication: noApplication.value
  }))

  // Read-only resource NAMES, resolved by type + id (the release returns ids
  // only). Keyed `${type}:${id}`; resolution degrades to the id on miss.
  const readOnlyResourceNames = ref({})

  watch(
    () => releaseParts.value.readOnlyResources,
    async (list) => {
      for (const entry of list ?? []) {
        const key = `${entry.resourceType}:${entry.resourceId}`
        if (entry.resourceName || entry.resourceId == null || readOnlyResourceNames.value[key]) {
          continue
        }
        const name = await deployDrawerService.resolveResourceName(
          entry.resourceType,
          entry.resourceId
        )
        if (name) readOnlyResourceNames.value = { ...readOnlyResourceNames.value, [key]: name }
      }
    },
    { immediate: true }
  )

  const readOnlyResources = computed(() =>
    composition.value.readOnlyResources.map((entry) => ({
      ...entry,
      resourceName:
        entry.resourceName ??
        readOnlyResourceNames.value[`${entry.resourceType}:${entry.resourceId}`] ??
        null
    }))
  )

  // Resolved display name of the application slot (catalog-resolved in read-only).
  const applicationName = computed(() => applicationSlot.value?.resourceName ?? null)

  // --- Release limit (Case 5) ---------------------------------------------

  // Best-effort: no reliable count/limit is available from the current payload,
  // so the front does not block preventively — the API 422 is the barrier (§8).
  const atReleaseLimit = ref(false)

  // --- Canary (gradual rollout strategy) -----------------------------------

  const canaryEnabled = ref(false)
  const canaryForm = ref({})

  const setCanaryEnabled = (value) => {
    canaryEnabled.value = Boolean(value)
  }

  const setCanaryForm = (values) => {
    canaryForm.value = isObject(values) ? values : {}
  }

  const strategy = computed(() => {
    if (!canaryEnabled.value) return undefined
    return buildStrategy({ ...canaryForm.value, gradual_rollout_enabled: true })
  })

  // --- Dispatch ------------------------------------------------------------

  const isDeploying = ref(false)
  const deployError = ref(null)

  const canDeploy = computed(
    () =>
      Boolean(selectedWorkloadId.value) &&
      Boolean(selectedEnvironmentId.value) &&
      !noApplication.value &&
      Boolean(applicationSlot.value?.versionId) &&
      (isScopedApplication.value || Boolean(scopedSlot.value?.versionId)) &&
      !atReleaseLimit.value &&
      !isDeploying.value
  )

  // Builds the payload and posts the one-shot release; rethrows so the caller can
  // surface the API error without losing form state.
  const deploy = async () => {
    isDeploying.value = true
    deployError.value = null

    try {
      const context = toValue(resourceContext) ?? {}

      const applicationResource = {
        resource_id: applicationSlot.value?.resourceId,
        resource_version: applicationSlot.value?.versionId,
        resource_type: APPLICATION_TYPE,
        name: applicationSlot.value?.resourceName ?? undefined
      }

      const resources = [applicationResource]

      // When the scoped resource is the application, the application item IS the
      // scoped one — no duplicate (req 8.4).
      if (!isScopedApplication.value) {
        resources.push({
          resource_id: context.resourceId,
          resource_version: resolvedVersionId.value,
          resource_type: context.resourceType,
          name: context.resourceName
        })
      }

      readOnlyResources.value.forEach((resource) => {
        resources.push({
          resource_id: resource.resourceId,
          resource_version: resource.resourceVersion,
          resource_type: resource.resourceType,
          name: resource.resourceName ?? undefined
        })
      })

      // `strategy` is `undefined` unless canary is enabled, so the no-canary
      // path emits the INSTANT payload unchanged (req 2.1, 2.2).
      const payload = DeploymentAdapter.transformBuildAndActivatePayload(resources, strategy.value)

      return await deploymentReleaseService.buildAndActivate(targetDeploymentId.value, payload)
    } catch (error) {
      deployError.value = error
      throw error
    } finally {
      isDeploying.value = false
    }
  }

  return {
    isLoading,
    hasError,
    refetch,
    workloadOptions,
    selectedWorkloadId,
    selectedWorkloadName,
    workloadHasBindings,
    isLoadingBindings,
    environmentCards,
    selectedEnvironmentId,
    selectedEnvironmentCard,
    targetDeploymentId,
    selectedDeploymentName,
    resourceName,
    scopedType,
    isScopedApplication,
    versionLabel,
    versionOptions,
    selectedVersionId,
    resolvedVersionId,
    policy,
    isSingle,
    hasActiveRelease,
    activeRelease,
    activeReleaseApplication,
    applicationName,
    applicationReadOnly,
    applicationsList,
    applicationOptions,
    isLoadingApplications,
    selectedApplicationId,
    applicationVersions,
    isLoadingApplicationVersions,
    selectedApplicationVersionId,
    composition,
    readOnlyResources,
    noApplication,
    isLoadingComposition,
    compositionError,
    atReleaseLimit,
    canaryEnabled,
    setCanaryEnabled,
    setCanaryForm,
    strategy,
    canDeploy,
    isDeploying,
    deployError,
    deploy
  }
}
