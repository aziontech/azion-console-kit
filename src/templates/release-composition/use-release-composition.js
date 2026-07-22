import { ref, computed, watch, toValue } from 'vue'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { DeploymentAdapter } from '@/services/v2/deployment/deployment-adapter'
import { buildStrategy } from '@/services/v2/deployment/strategy-builder'
import { RESOURCE_CATALOG_REGISTRY } from '@/services/v2/deployment/resource-catalog-registry'
import {
  toVersionOptions,
  toReadyVersionOptions
} from '@/templates/release-composition/version-options'

const READY_ONLY_DEPENDENCY_TYPES = ['function', 'connector', 'waf', 'network_list']
import {
  APPLICATION_RESOURCE_TYPE,
  matchIdValue,
  normalizeResources,
  resourceKey
} from '@/services/v2/release-impact/consuming-deployments'
import { COLLECTION_TYPES } from '@/stores/release'

const versionsKey = (resourceType, resourceId) => `${resourceType}:${resourceId}`

const extractTraceId = (settledValue) => {
  const body = settledValue?.data ?? settledValue ?? null
  return body?.trace_id ?? body?.data?.trace_id ?? body?.traceId ?? null
}

export const VERSIONED_URLS_ACTIVE_LIMIT_CODE = '43007'
export const BUILD_AND_ACTIVATE_ERROR_TYPES = Object.freeze({
  VERSIONED_URLS_ACTIVE_LIMIT: 'versioned_urls_active_limit'
})

const isVersionedUrlsActiveLimit = (reason) => {
  const status = reason?.status ?? reason?.response?.status ?? null
  if (Number(status) !== 422) return false

  const apiErrors = reason?.response?.data?.errors
  const hasCodedError =
    Array.isArray(apiErrors) &&
    apiErrors.some(
      (apiError) =>
        String(apiError?.code ?? apiError?.error_code ?? '') === VERSIONED_URLS_ACTIVE_LIMIT_CODE
    )

  return hasCodedError || String(reason?.code ?? '') === VERSIONED_URLS_ACTIVE_LIMIT_CODE
}

const classifyBuildAndActivateError = (reason) =>
  isVersionedUrlsActiveLimit(reason)
    ? BUILD_AND_ACTIVATE_ERROR_TYPES.VERSIONED_URLS_ACTIVE_LIMIT
    : null

const releaseResourceId = (resource) => resource?.resource_id ?? resource?.global_id ?? null

const releaseResourceVersion = (resource) =>
  resource?.version_id ?? resource?.resource_version_id ?? resource?.resource_version ?? null

const matchesOverride = (releaseResource, override) => {
  const id = matchIdValue(releaseResource)
  return (
    releaseResource?.resource_type === override.resource_type &&
    id != null &&
    String(id) === String(override.resource_id)
  )
}

const toAdapterResources = (releaseResources) =>
  (Array.isArray(releaseResources) ? releaseResources : []).map((resource) => ({
    resource_id: releaseResourceId(resource),
    resource_version: releaseResourceVersion(resource),
    resource_type: resource?.resource_type
  }))

export const SCOPED_PUBLISH_SKIP_REASONS = Object.freeze({
  DEGRADED: 'degraded',
  MISMATCH: 'mismatch',
  UNRESOLVED_VERSION: 'unresolved_version'
})

/**
 * @param {object} options
 * @param {import('vue').Ref<boolean>|(() => boolean)} [options.enabled]
 * @param {import('vue').Ref<Array>|(() => Array)} [options.selectedDsIds]
 * @param {import('vue').Ref<Array>|(() => Array)} [options.versionedResources]
 * @param {import('vue').Ref<object>} [options.reverseLookupByDs]
 * @param {import('@/services/v2/release-impact/consuming-deployments').ResolveConsumingDeployments} [options.resolveConsumingDeployments]
 */
export function useReleaseComposition({
  enabled,
  selectedDsIds,
  versionedResources,
  reverseLookupByDs = ref({}),
  resolveConsumingDeployments,
  impactLoading,
  impactFailed
} = {}) {
  const isEnabled = computed(() => Boolean(toValue(enabled) ?? true))

  const deploymentsQuery = deploymentService.useDeploymentsListQuery({ enabled: isEnabled })

  const deployments = computed(() => deploymentsQuery.data.value?.body ?? [])
  const isLoadingDeployments = computed(() => deploymentsQuery.isLoading.value)
  const hasDeploymentsError = computed(() => deploymentsQuery.isError.value)
  const refetchDeployments = () => deploymentsQuery.refetch()

  const activeReleaseByDs = ref({})
  const activeReleaseLoadingByDs = ref({})
  const loadedDsIds = ref(new Set())
  const activeReleaseErrorByDs = ref({})

  const loadActiveRelease = async (dsId) => {
    if (dsId == null || activeReleaseLoadingByDs.value[dsId]) return
    if (loadedDsIds.value.has(dsId)) return
    activeReleaseLoadingByDs.value = { ...activeReleaseLoadingByDs.value, [dsId]: true }
    try {
      const release = await deploymentReleaseService.getActiveReleaseComposition(dsId)
      activeReleaseByDs.value = { ...activeReleaseByDs.value, [dsId]: release ?? null }
      loadedDsIds.value = new Set(loadedDsIds.value).add(dsId)
      activeReleaseErrorByDs.value = { ...activeReleaseErrorByDs.value, [dsId]: false }
    } catch {
      activeReleaseByDs.value = { ...activeReleaseByDs.value, [dsId]: null }
      activeReleaseErrorByDs.value = { ...activeReleaseErrorByDs.value, [dsId]: true }
    } finally {
      activeReleaseLoadingByDs.value = { ...activeReleaseLoadingByDs.value, [dsId]: false }
    }
  }

  const retryActiveReleases = () => {
    const failedDsIds = Object.keys(activeReleaseErrorByDs.value).filter(
      (dsId) => activeReleaseErrorByDs.value[dsId]
    )
    failedDsIds.forEach((dsId) => loadActiveRelease(dsId))
  }

  const ensureActiveReleases = (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return
    const seen = new Set()
    ids.forEach((id) => {
      if (id == null) return
      const key = String(id)
      if (seen.has(key)) return
      seen.add(key)
      if (loadedDsIds.value.has(id)) return
      Promise.resolve(loadActiveRelease(id)).catch(() => {})
    })
  }

  watch(
    () => (toValue(selectedDsIds) ?? []).map((id) => String(id)).join('|'),
    () => {
      ;(toValue(selectedDsIds) ?? []).forEach((id) => loadActiveRelease(id))
    },
    { immediate: true }
  )

  const isLoadingActiveRelease = computed(() =>
    Object.values(activeReleaseLoadingByDs.value).some(Boolean)
  )

  const versionsByResource = ref({})
  const versionsLoadingByResource = ref({})
  const versionsErrorByResource = ref({})

  const loadResourceVersions = async (resourceType, resourceId) => {
    const key = versionsKey(resourceType, resourceId)
    if (
      key in versionsByResource.value ||
      versionsLoadingByResource.value[key] ||
      versionsErrorByResource.value[key]
    ) {
      return
    }
    const registry = RESOURCE_CATALOG_REGISTRY[resourceType]
    if (!registry?.listVersions) return
    versionsLoadingByResource.value = { ...versionsLoadingByResource.value, [key]: true }
    try {
      const raw = await registry.listVersions(resourceId)
      const mapVersions = READY_ONLY_DEPENDENCY_TYPES.includes(resourceType)
        ? toReadyVersionOptions
        : toVersionOptions
      versionsByResource.value = { ...versionsByResource.value, [key]: mapVersions(raw) }
    } catch {
      versionsErrorByResource.value = { ...versionsErrorByResource.value, [key]: true }
    } finally {
      versionsLoadingByResource.value = { ...versionsLoadingByResource.value, [key]: false }
    }
  }

  watch(
    () =>
      (toValue(versionedResources) ?? [])
        .filter((resource) => resource?.resourceType && resource?.resourceId != null)
        .map((resource) => versionsKey(resource.resourceType, resource.resourceId))
        .join('|'),
    () => {
      ;(toValue(versionedResources) ?? []).forEach((resource) => {
        if (resource?.resourceType && resource?.resourceId != null) {
          loadResourceVersions(resource.resourceType, resource.resourceId)
        }
      })
    },
    { immediate: true }
  )

  const versionOptionsFor = (resourceType, resourceId) =>
    versionsByResource.value[versionsKey(resourceType, resourceId)] ?? []

  const isLoadingVersionsFor = (resourceType, resourceId) =>
    Boolean(versionsLoadingByResource.value[versionsKey(resourceType, resourceId)])

  const hasVersionsErrorFor = (resourceType, resourceId) =>
    Boolean(versionsErrorByResource.value[versionsKey(resourceType, resourceId)])

  const hasAnyVersionsError = computed(() =>
    Object.values(versionsErrorByResource.value).some(Boolean)
  )

  const retryResourceVersions = () => {
    versionsErrorByResource.value = {}
    ;(toValue(versionedResources) ?? []).forEach((resource) => {
      if (resource?.resourceType && resource?.resourceId != null) {
        loadResourceVersions(resource.resourceType, resource.resourceId)
      }
    })
  }

  const catalogByType = ref({})
  const catalogLoadingByType = ref({})
  const catalogErrorByType = ref({})

  const loadCatalog = async (resourceType) => {
    if (!resourceType) return
    if (
      resourceType in catalogByType.value ||
      catalogLoadingByType.value[resourceType] ||
      catalogErrorByType.value[resourceType]
    ) {
      return
    }
    const registry = RESOURCE_CATALOG_REGISTRY[resourceType]
    if (!registry?.listCatalog) return
    catalogLoadingByType.value = { ...catalogLoadingByType.value, [resourceType]: true }
    try {
      const raw = await registry.listCatalog()
      catalogByType.value = { ...catalogByType.value, [resourceType]: raw ?? [] }
    } catch {
      catalogErrorByType.value = { ...catalogErrorByType.value, [resourceType]: true }
    } finally {
      catalogLoadingByType.value = { ...catalogLoadingByType.value, [resourceType]: false }
    }
  }

  const catalogOptionsFor = (resourceType) =>
    (catalogByType.value[resourceType] ?? []).map((item) => ({
      label: item.name,
      value: item.id
    }))

  const isLoadingCatalog = (resourceType) => Boolean(catalogLoadingByType.value[resourceType])

  const hasAnyCatalogError = computed(() => Object.values(catalogErrorByType.value).some(Boolean))

  const retryCatalogs = () => {
    const failedTypes = Object.keys(catalogErrorByType.value).filter(
      (type) => catalogErrorByType.value[type]
    )
    catalogErrorByType.value = {}
    failedTypes.forEach((type) => loadCatalog(type))
  }

  const listServiceCache = {}
  const resourceListService = (resourceType) => {
    if (!(resourceType in listServiceCache)) {
      const registry = RESOURCE_CATALOG_REGISTRY[resourceType]
      listServiceCache[resourceType] = registry?.listPage
        ? (params) => registry.listPage(params)
        : null
    }
    return listServiceCache[resourceType]
  }

  const loadServiceCache = {}
  const resourceLoadService = (resourceType) => {
    if (!(resourceType in loadServiceCache)) {
      const registry = RESOURCE_CATALOG_REGISTRY[resourceType]
      loadServiceCache[resourceType] = registry?.loadById ? (id) => registry.loadById(id) : null
    }
    return loadServiceCache[resourceType]
  }

  const resourceNameById = ref({})
  const resourceNameLoading = {}

  const ensureResourceNames = (resourceType, ids) => {
    const registry = RESOURCE_CATALOG_REGISTRY[resourceType]
    if (!registry?.loadById) return
    ;(Array.isArray(ids) ? ids : [ids]).forEach((id) => {
      if (id == null || id === '') return
      const key = versionsKey(resourceType, id)
      if (key in resourceNameById.value || resourceNameLoading[key]) return
      const inCatalog = (catalogByType.value[resourceType] ?? []).some(
        (item) => String(item?.id) === String(id)
      )
      if (inCatalog) return
      resourceNameLoading[key] = true
      Promise.resolve(registry.loadById(id))
        .then((item) => {
          if (item) resourceNameById.value = { ...resourceNameById.value, [key]: item }
        })
        .catch(() => {})
        .finally(() => {
          delete resourceNameLoading[key]
        })
    })
  }

  const resourceNameFor = (resourceType, resourceId) => {
    if (resourceId == null || resourceId === '') return null
    const cached = resourceNameById.value[versionsKey(resourceType, resourceId)]
    if (cached?.name) return cached.name
    const fromCatalog = (catalogByType.value[resourceType] ?? []).find(
      (item) => String(item?.id) === String(resourceId)
    )
    return fromCatalog?.name ?? null
  }

  const matchesResource = (releaseResource, resource) => {
    const id = matchIdValue(releaseResource)
    return (
      releaseResource?.resource_type === resource.resource_type &&
      id != null &&
      String(id) === String(resource.resource_id)
    )
  }

  const deployContextForDs = (dsId) => {
    const deployment = deployments.value.find((item) => String(item?.id) === String(dsId)) ?? null
    const release = activeReleaseByDs.value[dsId] ?? null
    const releaseResources = Array.isArray(release?.resources) ? release.resources : []
    return {
      deployment_policy: deployment?.deployment_policy ?? null,
      isVersioned: deployment?.deployment_policy === 'versioned_urls',
      deployed: Boolean(release),
      hasApp: releaseResources.some(
        (resource) => resource?.resource_type === APPLICATION_RESOURCE_TYPE
      )
    }
  }

  const scanLoadedReleases = (resources) => {
    const refs = normalizeResources(resources)
    const consumingDeployments = []
    const matchedByDeployment = new Map()
    if (refs.length === 0) return { deployments: consumingDeployments, matchedByDeployment }

    for (const [dsId, release] of Object.entries(activeReleaseByDs.value)) {
      const releaseResources = Array.isArray(release?.resources) ? release.resources : []
      const matched = []
      const activeVersionByResource = {}
      for (const resource of refs) {
        const hit = releaseResources.find((releaseResource) =>
          matchesResource(releaseResource, resource)
        )
        if (!hit) continue
        matched.push(resource)
        activeVersionByResource[resourceKey(resource)] = releaseResourceVersion(hit)
      }
      if (matched.length === 0) continue
      consumingDeployments.push({
        deploymentId: dsId,
        activeVersionByResource,
        deployContext: deployContextForDs(dsId)
      })
      matchedByDeployment.set(dsId, matched)
    }

    return { deployments: consumingDeployments, matchedByDeployment }
  }

  const resolveConsuming = resolveConsumingDeployments ?? scanLoadedReleases

  const resolveConsumingDsIds = (resourceType, resourceId) => {
    if (!resourceType || resourceId == null) return []
    const result = resolveConsuming({ resource_type: resourceType, resource_id: resourceId })
    if (result && typeof result.then === 'function') {
      return result.then((resolved) => resolved.deployments.map((entry) => entry.deploymentId))
    }
    return result.deployments.map((entry) => entry.deploymentId)
  }

  const dependencyResourcesFor = (dsId) => {
    const byType = {}
    COLLECTION_TYPES.forEach((type) => {
      byType[type] = []
    })

    const resources = activeReleaseByDs.value[dsId]?.resources ?? []
    resources.forEach((resource) => {
      const type = resource?.resource_type
      if (!COLLECTION_TYPES.includes(type)) return
      const resourceId = releaseResourceId(resource)
      if (resourceId == null) return
      byType[type].push({ resourceId, version: releaseResourceVersion(resource) })
    })

    return byType
  }

  const buildDsImpact = (dsId) => {
    const workloads = reverseLookupByDs.value[dsId] ?? []
    const environments = new Map()
    let domainCount = 0

    workloads.forEach((workload) => {
      const domains = Array.isArray(workload?.domains) ? workload.domains : []
      domainCount += domains.length
      const envId = workload?.environmentId ?? null
      if (!environments.has(envId)) {
        environments.set(envId, {
          environmentId: envId,
          environmentName: workload?.environmentName ?? null,
          workloads: []
        })
      }
      environments.get(envId).workloads.push({
        id: workload?.id ?? null,
        name: workload?.name ?? null,
        domains
      })
    })

    return {
      deploymentId: dsId,
      environments: [...environments.values()],
      totalWorkloads: new Set(workloads.map((workload) => workload?.id)).size,
      totalDomains: domainCount
    }
  }

  const impact = computed(() => {
    const dsIds = toValue(selectedDsIds) ?? []

    if (dsIds.length === 0) {
      return {
        hasSelection: false,
        isLoading: false,
        impactUnavailable: false,
        perDs: [],
        totals: { dsCount: 0, totalDomains: 0, totalWorkloads: 0 }
      }
    }

    if (toValue(impactLoading)) {
      return {
        hasSelection: true,
        isLoading: true,
        impactUnavailable: false,
        perDs: [],
        totals: { dsCount: dsIds.length, totalDomains: 0, totalWorkloads: 0 }
      }
    }

    if (toValue(impactFailed)) {
      return {
        hasSelection: true,
        isLoading: false,
        impactUnavailable: true,
        perDs: [],
        totals: { dsCount: dsIds.length, totalDomains: 0, totalWorkloads: 0 }
      }
    }

    const perDs = dsIds.map((dsId) => {
      const built = buildDsImpact(dsId)
      const deployment = deployments.value.find((item) => String(item.id) === String(dsId))
      const environments = built.environments.map((env) => {
        const rows = env.workloads.map((workload) => ({
          name: workload.name,
          domains: (workload.domains ?? []).length
        }))
        return {
          name: env.environmentName,
          wlCount: env.workloads.length,
          domains: rows.reduce((sum, row) => sum + row.domains, 0),
          rows
        }
      })
      return {
        deploymentId: dsId,
        name: deployment?.name ?? String(dsId),
        domains: built.totalDomains,
        wlCount: built.totalWorkloads,
        environments
      }
    })
    return {
      hasSelection: true,
      isLoading: false,
      impactUnavailable: false,
      perDs,
      totals: {
        dsCount: perDs.length,
        totalWorkloads: perDs.reduce((sum, entry) => sum + entry.wlCount, 0),
        totalDomains: perDs.reduce((sum, entry) => sum + entry.domains, 0)
      }
    }
  })

  const impactUnavailable = computed(() => impact.value.impactUnavailable)

  const retryImpact = () => {
    refetchDeployments()
  }

  const isDeploying = ref(false)

  const activeReleaseResourcesFor = async (dsId) => {
    if (loadedDsIds.value.has(dsId)) {
      const loaded = activeReleaseByDs.value[dsId]
      return { ok: true, resources: Array.isArray(loaded?.resources) ? loaded.resources : [] }
    }
    try {
      const release = await deploymentReleaseService.getActiveReleaseComposition(dsId)
      activeReleaseByDs.value = { ...activeReleaseByDs.value, [dsId]: release ?? null }
      loadedDsIds.value = new Set(loadedDsIds.value).add(dsId)
      return { ok: true, resources: Array.isArray(release?.resources) ? release.resources : [] }
    } catch {
      return { ok: false }
    }
  }

  const settleOutcome = (id, settled) => {
    if (settled.status === 'fulfilled') {
      return {
        id,
        ok: true,
        traceId: extractTraceId(settled.value),
        value: settled.value,
        error: null,
        errorType: null
      }
    }
    return {
      id,
      ok: false,
      traceId: null,
      value: null,
      error: settled.reason,
      errorType: classifyBuildAndActivateError(settled.reason)
    }
  }

  const skipOutcome = (id, skipReason) => ({
    id,
    ok: false,
    skipped: true,
    skipReason,
    traceId: null,
    value: null,
    error: null,
    errorType: null
  })

  const dispatchFanOut = async (targets, onOutcome) => {
    const outcomes = new Array(targets.length)
    const report = (index, outcome) => {
      outcomes[index] = outcome
      onOutcome?.(outcome)
    }
    await Promise.all(
      targets.map((target, index) =>
        deploymentReleaseService
          .buildAndActivate(target.id, target.payload)
          .then((value) => report(index, settleOutcome(target.id, { status: 'fulfilled', value })))
          .catch((reason) =>
            report(index, settleOutcome(target.id, { status: 'rejected', reason }))
          )
      )
    )
    return outcomes
  }

  const buildAndActivateShared = async (ids, resources, strategy, onOutcome) => {
    const list = Array.isArray(resources) ? resources : []
    if (list.some((resource) => resource?.resource_version == null)) {
      return ids.map((id) => {
        const outcome = skipOutcome(id, SCOPED_PUBLISH_SKIP_REASONS.UNRESOLVED_VERSION)
        onOutcome?.(outcome)
        return outcome
      })
    }
    const payload = DeploymentAdapter.transformBuildAndActivatePayload(list, strategy)
    const targets = ids.map((id) => ({ id, payload }))
    return dispatchFanOut(targets, onOutcome)
  }

  const applyDependencyOverrides = (base, dependencyOverrides) => {
    let next = base
    ;(Array.isArray(dependencyOverrides) ? dependencyOverrides : []).forEach(
      (dependencyOverride) => {
        if (dependencyOverride?.resource_id == null || dependencyOverride.resource_id === '') return
        if (dependencyOverride?.version == null) return
        if (!dependencyOverride?.resource_type) return

        let matched = false
        next = next.map((resource) => {
          if (
            resource?.resource_type === dependencyOverride.resource_type &&
            releaseResourceId(resource) != null &&
            String(releaseResourceId(resource)) === String(dependencyOverride.resource_id)
          ) {
            matched = true
            return { ...resource, version_id: dependencyOverride.version }
          }
          return resource
        })

        if (!matched) {
          next = [
            ...next,
            {
              resource_id: dependencyOverride.resource_id,
              resource_type: dependencyOverride.resource_type,
              version_id: dependencyOverride.version
            }
          ]
        }
      }
    )
    return next
  }

  const buildAndActivateScoped = async (
    ids,
    override,
    dependencyOverrides,
    strategy,
    onOutcome
  ) => {
    if (override?.version == null) {
      return ids.map((id) => {
        const outcome = skipOutcome(id, SCOPED_PUBLISH_SKIP_REASONS.UNRESOLVED_VERSION)
        onOutcome?.(outcome)
        return outcome
      })
    }

    const skipped = []
    const targets = []

    for (const id of ids) {
      const result = await activeReleaseResourcesFor(id)
      if (!result.ok) {
        const outcome = skipOutcome(id, SCOPED_PUBLISH_SKIP_REASONS.DEGRADED)
        skipped.push(outcome)
        onOutcome?.(outcome)
        continue
      }
      const base = result.resources
      const scopedEntry = {
        resource_id: override.resource_id,
        resource_type: override.resource_type,
        version_id: override.version
      }
      const sameTypeIndex = base.findIndex(
        (resource) => resource?.resource_type === override.resource_type
      )
      let swapped
      if (sameTypeIndex < 0) {
        swapped = [...base, scopedEntry]
      } else {
        const existing = base[sameTypeIndex]
        const replacement = matchesOverride(existing, override)
          ? { ...existing, version_id: override.version }
          : scopedEntry
        swapped = base.map((resource, index) => (index === sameTypeIndex ? replacement : resource))
      }
      const withDependencies = applyDependencyOverrides(swapped, dependencyOverrides)
      const payload = DeploymentAdapter.transformBuildAndActivatePayload(
        toAdapterResources(withDependencies),
        strategy
      )
      targets.push({ id, payload })
    }

    const published = await dispatchFanOut(targets, onOutcome)

    const byId = new Map([...published, ...skipped].map((outcome) => [String(outcome.id), outcome]))
    return ids.map((id) => byId.get(String(id)))
  }

  const buildAndActivate = async (composedPayload = {}, dsIds = [], { onOutcome } = {}) => {
    const ids = Array.isArray(dsIds) ? dsIds.filter((id) => id != null && id !== '') : []
    if (!ids.length) return []

    const { scoped = false, canary = false, canaryForm = {} } = composedPayload ?? {}

    const strategy = canary
      ? buildStrategy({ ...canaryForm, gradual_rollout_enabled: true })
      : undefined

    isDeploying.value = true
    try {
      if (scoped) {
        return await buildAndActivateScoped(
          ids,
          composedPayload.override ?? {},
          composedPayload.dependencyOverrides ?? [],
          strategy,
          onOutcome
        )
      }
      return await buildAndActivateShared(ids, composedPayload.resources ?? [], strategy, onOutcome)
    } finally {
      isDeploying.value = false
    }
  }

  return {
    deployments,
    isLoadingDeployments,
    hasDeploymentsError,
    refetchDeployments,
    activeReleaseByDs,
    activeReleaseErrorByDs,
    isLoadingActiveRelease,
    loadActiveRelease,
    ensureActiveReleases,
    retryActiveReleases,
    versionsByResource,
    versionOptionsFor,
    isLoadingVersionsFor,
    hasVersionsErrorFor,
    hasAnyVersionsError,
    loadResourceVersions,
    retryResourceVersions,
    catalogByType,
    catalogOptionsFor,
    isLoadingCatalog,
    hasAnyCatalogError,
    loadCatalog,
    retryCatalogs,
    resourceListService,
    resourceLoadService,
    ensureResourceNames,
    resourceNameFor,
    resolveConsumingDsIds,
    resolveConsumingDeployments: resolveConsuming,
    dependencyResourcesFor,
    impact,
    impactUnavailable,
    retryImpact,
    isDeploying,
    buildAndActivate,
    buildAndActivateErrorTypes: BUILD_AND_ACTIVATE_ERROR_TYPES,
    scopedPublishSkipReasons: SCOPED_PUBLISH_SKIP_REASONS
  }
}
