// Surface-agnostic async-loading composable for the Release composition. The
// store (`useReleaseStore`) owns selection state; THIS owns loaded data and the
// derivations on top of it: the deployments listing, the active release per
// selected Deployment Settings, the per-type catalog versions, the client-side
// resource -> consuming-DS scan, and the (degraded-by-default) impact VM.
//
// It orchestrates existing v2 services through vue-query + plain service calls;
// it never issues raw fetch/axios and never touches the service-to-service
// reverse-lookup endpoints (verified 401, see spec §K) — Property 8 forbids
// fabricating impact or per-DS counts, so with no reverse-lookup data the impact
// is reported as unavailable with zero synthetic rows.

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
  matchFieldFor,
  normalizeResources,
  resourceKey
} from '@/services/v2/release-impact/consuming-deployments'
import { COLLECTION_TYPES } from '@/stores/release'

const versionsKey = (resourceType, resourceId) => `${resourceType}:${resourceId}`

// Publish is asynchronous: `build_and_activate` answers `202 { trace_id }` and we
// never poll (req 5.2). The service returns `{ data }` where `data` is the raw
// `202` body, so the trace id lives one or two levels in depending on whether the
// API wraps it under `data`. Read it defensively and never fabricate one.
const extractTraceId = (settledValue) => {
  const body = settledValue?.data ?? settledValue ?? null
  return body?.trace_id ?? body?.data?.trace_id ?? body?.traceId ?? null
}

// The single barrier for the versioned-URLs active limit is the publish API's
// `422` carrying error code `43007` (req 5.5/7.2): we do NOT pre-block on an
// active-count we cannot compute authoritatively — we let the request go and map
// this specific rejection to a typed marker the consumer can branch on.
export const VERSIONED_URLS_ACTIVE_LIMIT_CODE = '43007'
export const BUILD_AND_ACTIVATE_ERROR_TYPES = Object.freeze({
  VERSIONED_URLS_ACTIVE_LIMIT: 'versioned_urls_active_limit'
})

// The rejection reaching the fan-out may be an `ErrorHandler` (the v2 services'
// thrown shape: `{ status, message[], code }`) or — defensively — a raw axios
// error (`{ response: { status, data: { errors: [{ code }] } } }`). Detect the
// `422 43007` signature across both without assuming a single shape.
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

// Classify a per-DS rejection: the versioned-URLs active limit becomes a typed
// `errorType` the consumer matches on; everything else stays `null` (still
// surfaced via the raw `error`). No retry is implied — classification only.
const classifyBuildAndActivateError = (reason) =>
  isVersionedUrlsActiveLimit(reason)
    ? BUILD_AND_ACTIVATE_ERROR_TYPES.VERSIONED_URLS_ACTIVE_LIMIT
    : null

// The active release returns each consumed resource keyed by `resource_id` for
// every type except `application`, which uses `global_id`; version is pinned in
// `version_id` (spec §L). This reads the id for the dependency-instance seed.
const releaseResourceId = (resource) => resource?.resource_id ?? resource?.global_id ?? null

// The release pins the chosen version in `version_id` (spec §L); fall back to the
// other shapes the API has used so the seeded instance always carries the real id.
const releaseResourceVersion = (resource) =>
  resource?.version_id ?? resource?.resource_version_id ?? resource?.resource_version ?? null

// Does an active-release resource match the scoped override? `application` is
// matched by `global_id`, every other type by `resource_id` (req 1.5) — the same
// rule the HOP 1 contract encodes, reused here so it is never re-derived.
const matchesOverride = (releaseResource, override) =>
  releaseResource?.resource_type === override.resource_type &&
  releaseResource?.[matchFieldFor(override)] != null &&
  String(releaseResource[matchFieldFor(override)]) === String(override.resource_id)

// Map a DS's active-release resources (deployment-api shape: `application` keyed
// by `global_id`, others by `resource_id`, version pinned in `version_id`) into
// the FLAT `{ resource_id, resource_version, resource_type }` shape the adapter
// consumes — the same shape `store.composeResources()` produces, so
// `transformBuildAndActivatePayload` re-keys `application` back to `global_id`
// uniformly. Every non-scoped resource is carried over BYTE-FOR-BYTE: same id,
// same pinned version (req 5.6).
const toAdapterResources = (releaseResources) =>
  (Array.isArray(releaseResources) ? releaseResources : []).map((resource) => ({
    resource_id: releaseResourceId(resource),
    resource_version: releaseResourceVersion(resource),
    resource_type: resource?.resource_type
  }))

// Per-DS outcome markers for the scoped swap/add path: a DS whose active
// composition cannot be READ is DEGRADED and excluded. A scoped override whose
// version did NOT resolve to a concrete id (the LATEST sentinel had no loaded
// versions, so it resolved to `null`) is UNRESOLVED_VERSION: a hard error
// surfaced to the consumer, never published as `version_id: null` (the API
// rejects that). MISMATCH is retained for back-compat but no longer produced —
// a DS lacking the scoped resource now RECEIVES it (add/link) instead of being
// skipped. Reported to the consumer, never published.
export const SCOPED_PUBLISH_SKIP_REASONS = Object.freeze({
  DEGRADED: 'degraded',
  MISMATCH: 'mismatch',
  UNRESOLVED_VERSION: 'unresolved_version'
})

/**
 * @param {object} options
 * @param {import('vue').Ref<boolean>|(() => boolean)} [options.enabled] - Gates
 *   fetching to the screen's active state (closed/hidden never fetches; reopen
 *   reuses the vue-query cache).
 * @param {import('vue').Ref<Array>|(() => Array)} [options.selectedDsIds] - The
 *   currently selected Deployment Settings ids (owned by the store). Active
 *   releases are loaded only for these, on demand.
 * @param {import('vue').Ref<Array>|(() => Array)} [options.versionedResources] -
 *   The `{ resourceType, resourceId }` pairs whose Ready versions must be loaded
 *   for the version pickers (owned by the store's composition).
 * @param {import('vue').Ref<object>} [options.reverseLookupByDs] - SEAM 1: the
 *   DS -> Workload[] reverse index the impact engine reads. Optional; defaults to
 *   an empty internal `ref({})` so the engine degrades by default. A sibling
 *   composable (`useReleaseImpact`) owns and populates this ref when injected,
 *   feeding the engine with zero change to `buildDsImpact`/`impact` (req 9.5).
 * @param {import('@/services/v2/release-impact/consuming-deployments').ResolveConsumingDeployments} [options.resolveConsumingDeployments] -
 *   HOP 1 seam (req 1.2 / 8.3): the strategy that resolves `resource(s) ->
 *   consuming deployments`. Factory argument with a default that scans the
 *   already-loaded active releases (the in-browser strategy; tests inject a
 *   fake, the future `resourceUsageResolver` swaps in without caller change).
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

  // --- Deployments listing (vue-query, gated) ------------------------------

  const deploymentsQuery = deploymentService.useDeploymentsListQuery({ enabled: isEnabled })

  const deployments = computed(() => deploymentsQuery.data.value?.body ?? [])
  const isLoadingDeployments = computed(() => deploymentsQuery.isLoading.value)
  const hasDeploymentsError = computed(() => deploymentsQuery.isError.value)
  const refetchDeployments = () => deploymentsQuery.refetch()

  // --- Active release per selected DS --------------------------------------

  // Keyed by DS id. Each entry is the raw active release (`{ resources: [...] }`)
  // or `null` when the DS has none. The scan and the case derivation read it.
  const activeReleaseByDs = ref({})
  const activeReleaseLoadingByDs = ref({})
  const loadedDsIds = ref(new Set())

  const loadActiveRelease = async (dsId) => {
    if (dsId == null || activeReleaseLoadingByDs.value[dsId]) return
    if (loadedDsIds.value.has(dsId)) return
    activeReleaseLoadingByDs.value = { ...activeReleaseLoadingByDs.value, [dsId]: true }
    try {
      const release = await deploymentReleaseService.getActiveReleaseComposition(dsId)
      activeReleaseByDs.value = { ...activeReleaseByDs.value, [dsId]: release ?? null }
      loadedDsIds.value = new Set(loadedDsIds.value).add(dsId)
    } catch {
      // A per-DS read failure must not block the others (independent fan-out,
      // §7.3): record `null` and move on; never fabricate a composition.
      activeReleaseByDs.value = { ...activeReleaseByDs.value, [dsId]: null }
    } finally {
      activeReleaseLoadingByDs.value = { ...activeReleaseLoadingByDs.value, [dsId]: false }
    }
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

  // Load the active release for each newly selected DS once. Deselecting a DS
  // keeps its cached release (cheap, and re-selection is instant).
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

  // --- Per-type Ready versions (registry) ----------------------------------

  // Keyed `${type}:${id}`; each value is the picker options from `toVersionOptions`.
  const versionsByResource = ref({})
  const versionsLoadingByResource = ref({})

  const loadResourceVersions = async (resourceType, resourceId) => {
    const key = versionsKey(resourceType, resourceId)
    if (versionsByResource.value[key] || versionsLoadingByResource.value[key]) return
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
      versionsByResource.value = { ...versionsByResource.value, [key]: [] }
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

  // --- Per-type instance catalog (registry) --------------------------------

  // Keyed by resource type; each value is the picker options
  // (`{ label: name, value: id }`) the resource selectors render. Mirrors the
  // version-loading pattern above: services-only (registry `listCatalog`), no
  // raw HTTP, cached once per type.
  const catalogByType = ref({})
  const catalogLoadingByType = ref({})

  const loadCatalog = async (resourceType) => {
    if (!resourceType) return
    if (catalogByType.value[resourceType] || catalogLoadingByType.value[resourceType]) return
    const registry = RESOURCE_CATALOG_REGISTRY[resourceType]
    if (!registry?.listCatalog) return
    catalogLoadingByType.value = { ...catalogLoadingByType.value, [resourceType]: true }
    try {
      const raw = await registry.listCatalog()
      catalogByType.value = { ...catalogByType.value, [resourceType]: raw ?? [] }
    } catch {
      // A per-type catalog failure must not break the others or the screen:
      // record an empty catalog and let the selector show no options.
      catalogByType.value = { ...catalogByType.value, [resourceType]: [] }
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

  // --- Resource -> consuming Deployment Settings (HOP 1, delegated) ---------

  // req 1.2 / 8.3: HOP 1 (`resource -> consuming deployments`) goes through the
  // `resolveConsumingDeployments` interface. The match rule (`application` by
  // `global_id`, others by `resource_id`) and the `{ deployments,
  // matchedByDeployment }` result shape are owned by that interface's contract
  // (`@/services/v2/release-impact/consuming-deployments`) and reused here via
  // its helpers — never re-encoded.
  //
  // The DEFAULT strategy scans the already-loaded active releases: req 11.1
  // confirms there is no `resource_id` filter on the DS list (verified 400), so
  // consumption is assembled in the browser. It is a pure read over data this
  // composable already holds — no extra request, no s2s call (req 11.2) — and it
  // resolves synchronously so the route-entry preselect stays a plain array. A
  // caller injects the production fan-out resolver (or the future
  // `resourceUsageResolver`) via the `resolveConsumingDeployments` factory-arg to
  // resolve over the full inventory; the swap touches no caller.
  const matchesResource = (releaseResource, resource) =>
    releaseResource?.resource_type === resource.resource_type &&
    releaseResource?.[matchFieldFor(resource)] != null &&
    String(releaseResource[matchFieldFor(resource)]) === String(resource.resource_id)

  // Per-DS deploy context for the strictest-case gate (req 6.3): the policy and
  // the inputs `store.deployCtx` folds over (`isVersioned`/`deployed`/`hasApp`),
  // surfaced from data already loaded so the consumer can block on the most
  // restrictive selected DS without re-reading the store.
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

  // The in-browser default honouring the `resolveConsumingDeployments` contract
  // (same `{ deployments, matchedByDeployment }` shape, req 1.7). It scans the
  // loaded releases over already-resident data, so it returns SYNCHRONOUSLY —
  // the route-entry preselect contract (a plain `string[]`) depends on that.
  // Each deployment additionally carries `deployContext` (req 6.3). An injected
  // resolver (the production fan-out or the future `resourceUsageResolver`) may
  // be async; `resolveConsumingDsIds` handles either shape.
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

  // Backwards-compatible caller contract (req 1.3): the route-entry preselect
  // reads a synchronous `string[]` of DS ids for a single `(type, id)` pair. It
  // is a thin shim over the HOP 1 interface — the default resolves synchronously
  // so the array is available immediately; an injected async resolver would make
  // this a thenable the caller can await without changing the id shape.
  const resolveConsumingDsIds = (resourceType, resourceId) => {
    if (!resourceType || resourceId == null) return []
    const result = resolveConsuming({ resource_type: resourceType, resource_id: resourceId })
    if (result && typeof result.then === 'function') {
      return result.then((resolved) => resolved.deployments.map((entry) => entry.deploymentId))
    }
    return result.deployments.map((entry) => entry.deploymentId)
  }

  // --- Dependency instances inherited from a DS's active release ------------

  // Pure read over the already-loaded active release: groups its dependency-type
  // resources (`function`/`connector`/`waf`/`network_list`) into the
  // `{ [type]: [{ resourceId, version }] }` shape `store.seedColl` consumes. The
  // instance set is INHERITED (spec: no "Add"); `version` is the release's pinned
  // id, NOT the LATEST sentinel. No request, no s2s — same constraints as the scan.
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

  // --- Impact (degraded by default; never fabricated) ----------------------

  // The DS -> workloads/domains reverse lookup is service-to-service only
  // (edge-api GraphQL `workloadsByDeployment`; a tenant Token gets 401, the REST
  // `deployment_id` filter is ignored — spec §F/§K). There is therefore NO
  // browser-reachable source for the blast-radius today, so this composable does
  // not attempt the call: `reverseLookupByDs` stays empty and impact degrades.
  //
  // Property 8: with no reverse-lookup data the impact is reported as
  // unavailable and carries zero rows/totals. The aggregation below ONLY runs
  // for a DS whose reverse-lookup data is actually present — it can never
  // invent environments, workloads, domains or counts.
  //
  // SEAM 1: `reverseLookupByDs` is the engine's input ref. It is an optional
  // factory argument (default `ref({})`) so an injected, populated ref feeds the
  // engine below with zero logic change (req 9.5).
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

    // Nothing selected => no impact to preview (not "unavailable"). `totals` is
    // always a non-null object so the panel can read it unguarded.
    if (dsIds.length === 0) {
      return {
        hasSelection: false,
        isLoading: false,
        impactUnavailable: false,
        perDs: [],
        totals: { dsCount: 0, totalDomains: 0, totalWorkloads: 0 }
      }
    }

    // While the tenant-wide lookup is in flight we can't tell "zero bindings"
    // from "not loaded yet" — surface a loading state instead of flashing zeros.
    if (toValue(impactLoading)) {
      return {
        hasSelection: true,
        isLoading: true,
        impactUnavailable: false,
        perDs: [],
        totals: { dsCount: dsIds.length, totalDomains: 0, totalWorkloads: 0 }
      }
    }

    // Only a genuine lookup FAILURE degrades to "unavailable" (retry may help).
    // A successful load with no rows for a DS is a real zero, not a failure.
    if (toValue(impactFailed)) {
      return {
        hasSelection: true,
        isLoading: false,
        impactUnavailable: true,
        perDs: [],
        totals: { dsCount: dsIds.length, totalDomains: 0, totalWorkloads: 0 }
      }
    }

    // Loaded: build a branch for EVERY selected DS. A DS with no workload
    // bindings yet is a real zero (no environments, 0 workloads/domains) — shown
    // as such (Property 8: still no fabrication), never blanking the whole panel.
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

  // `Retry impact` action: no s2s call is made, so it only re-primes the inputs
  // the (future) browser-reachable lookup would feed on. Until that lookup ships
  // it is a no-op beyond refreshing the deployments listing, and impact stays
  // degraded — by design, not by failure to fabricate.
  const retryImpact = () => {
    refetchDeployments()
  }

  // --- Dispatch: build_and_activate fan-out (Property 7) -------------------

  // The composable is the layer allowed to call services, so the per-DS dispatch
  // lives here (mirrors `use-deploy-drawer.js` `deploy()`). The store hands over a
  // PURE, DISCRIMINATED `composePayload()`; this branches on `payload.scoped`:
  //
  //   non-scoped (Scenario A) → build ONE adapter payload from `payload.resources`
  //     (resources are DS-agnostic) and fan it out to every DS unchanged (req 5.1).
  //
  //   scoped (Scenario B) → build a PER-DS body: each DS's own active composition
  //     with the scoped singleton REPLACED (same resource → swap version; different
  //     resource of the same type → swap the entry) or ADDED when the DS is not
  //     linked yet (create/link), preserving every other resource byte-for-byte.
  //     A DS whose active composition cannot be READ is DEGRADED and excluded,
  //     reported and never published.
  //
  // Either way the dispatch fans out one independent `build_and_activate` per DS
  // via `Promise.allSettled` — a per-DS settled `{ id, ok, traceId, value, error,
  // errorType }`, NO retry (req 5.3). Each success carries the async `trace_id`
  // (req 5.2/11.1); the API `422 43007` is the versioned-URLs limit barrier,
  // surfaced as a typed `errorType` (req 5.5/7.2).
  const isDeploying = ref(false)

  // Read a DS's active composition for the scoped swap/add. Returns
  // `{ ok: true, resources }` (empty array when the DS has no active release, so
  // the caller can CREATE) or `{ ok: false }` only on a genuine read failure (so
  // the caller degrades). A definitively-loaded DS is keyed off `loadedDsIds`, so
  // a cached `null` from a prior failed prefetch is re-fetched, not mistaken for
  // "no release".
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

  // Settle one DS's `build_and_activate` call into the per-DS outcome shape (the
  // fulfilled/rejected fold shared by both write paths). No retry — classify only.
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

  // Non-scoped (Scenario A): one DS-agnostic adapter payload fanned out unchanged.
  const buildAndActivateShared = async (ids, resources, strategy) => {
    const payload = DeploymentAdapter.transformBuildAndActivatePayload(resources, strategy)
    const settled = await Promise.allSettled(
      ids.map((id) => deploymentReleaseService.buildAndActivate(id, payload))
    )
    return ids.map((id, index) => settleOutcome(id, settled[index]))
  }

  // Scoped (Scenario B): per-DS preserve & swap. For each DS, take its active
  // composition, swap ONLY the scoped resource's version, preserve everything
  // else byte-for-byte, and POST a per-DS body. DSs that degrade (no composition)
  // or mismatch (scoped resource absent) are excluded from the fan-out and
  // reported as `{ id, ok: false, skipped: true, skipReason }`.
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

  const buildAndActivateScoped = async (ids, override, dependencyOverrides, strategy) => {
    // Guard the null-version leak: the store resolves the LATEST sentinel to a
    // concrete `version_id` in `composePayload()` (Property 6), but when the
    // scoped resource's versions were never loaded that resolution yields `null`.
    // Posting `version_id: null` is rejected by the API, so NEVER dispatch it:
    // surface every target DS as an UNRESOLVED_VERSION hard error instead of a
    // null pin. The consumer branches on `skipReason` exactly as for degraded /
    // mismatch.
    if (override?.version == null) {
      return ids.map((id) => ({
        id,
        ok: false,
        skipped: true,
        skipReason: SCOPED_PUBLISH_SKIP_REASONS.UNRESOLVED_VERSION,
        traceId: null,
        value: null,
        error: null,
        errorType: null
      }))
    }

    const skipped = []
    const targets = []

    for (const id of ids) {
      const result = await activeReleaseResourcesFor(id)
      // A genuine read failure → degraded, excluded, never fabricated.
      if (!result.ok) {
        skipped.push({ id, skipReason: SCOPED_PUBLISH_SKIP_REASONS.DEGRADED })
        continue
      }
      const base = result.resources
      // The scoped type is a singleton (application/firewall/custom_page): at most
      // one resource of that type per release. Replace the existing one when
      // present (same resource → preserve fields, swap version; different resource
      // → swap the whole entry), or ADD it when the DS is not linked yet.
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

    const settled = await Promise.allSettled(
      targets.map((target) => deploymentReleaseService.buildAndActivate(target.id, target.payload))
    )

    const published = targets.map((target, index) => settleOutcome(target.id, settled[index]))
    const excluded = skipped.map(({ id, skipReason }) => ({
      id,
      ok: false,
      skipped: true,
      skipReason,
      traceId: null,
      value: null,
      error: null,
      errorType: null
    }))

    // Return in the caller's original `ids` order so the consumer can correlate.
    const byId = new Map(
      [...published, ...excluded].map((outcome) => [String(outcome.id), outcome])
    )
    return ids.map((id) => byId.get(String(id)))
  }

  const buildAndActivate = async (composedPayload = {}, dsIds = []) => {
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
          strategy
        )
      }
      return await buildAndActivateShared(ids, composedPayload.resources ?? [], strategy)
    } finally {
      isDeploying.value = false
    }
  }

  return {
    // deployments
    deployments,
    isLoadingDeployments,
    hasDeploymentsError,
    refetchDeployments,
    // active release per DS
    activeReleaseByDs,
    isLoadingActiveRelease,
    loadActiveRelease,
    ensureActiveReleases,
    // versions per resource
    versionsByResource,
    versionOptionsFor,
    isLoadingVersionsFor,
    loadResourceVersions,
    // instance catalog per type
    catalogByType,
    catalogOptionsFor,
    isLoadingCatalog,
    loadCatalog,
    // resource -> consuming DS: the backwards-compatible `string[]` shim (req 1.3)
    resolveConsumingDsIds,
    // resource -> consuming deployments: the full HOP 1 result (de-duped union +
    // `matchedByDeployment` + per-DS `deployContext`) for the strictest-case gate
    // (req 6.3, 8.3). Same `{ deployments, matchedByDeployment }` contract a
    // caller can also obtain by injecting the production resolver.
    resolveConsumingDeployments: resolveConsuming,
    // dependency instances inherited from a DS's active release (seeds coll)
    dependencyResourcesFor,
    // impact (degraded by default — Property 8 / req 7.2, 7.3, 11.2)
    impact,
    impactUnavailable,
    retryImpact,
    // dispatch (per-DS build_and_activate fan-out — Property 7). Each result
    // carries `traceId` (req 11.1) and a typed `errorType` for the versioned-URLs
    // active limit (req 5.5); the type catalog is re-exported so the consumer
    // matches on it without re-encoding the magic code.
    isDeploying,
    buildAndActivate,
    buildAndActivateErrorTypes: BUILD_AND_ACTIVATE_ERROR_TYPES,
    // Per-DS skip reasons for the scoped preserve-&-swap path (req 5.7/5.8) so the
    // consumer can branch on `degraded` vs `mismatch` without re-encoding them.
    scopedPublishSkipReasons: SCOPED_PUBLISH_SKIP_REASONS
  }
}
