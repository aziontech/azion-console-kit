<script setup>
  /**
   * ReleaseComposerView — the full-page "Review & deploy" screen (spec §B). It is
   * a THIN view: every piece of selection state lives in `useReleaseStore` (the
   * single source of truth) and every async load lives in `useReleaseComposition`.
   * This file only:
   *   - opens the release from the route on mount (`store.openRelease`),
   *   - feeds the composable's loaded data back into the store via its setters
   *     (watchers, so the store stays the source of truth),
   *   - lays out the two columns + fixed footer with shared, surface-agnostic
   *     blocks,
   *   - gates `Build & activate` on the strictest selected DS, and
   *   - confirms then fans out `composition.buildAndActivate(store.composePayload(),
   *     store.deploymentIds)` (async 202, no polling). The composable is the layer
   *     allowed to dispatch; the store only describes the selection (`composePayload`).
   *
   * No HTTP, no business logic here — that all belongs to the store/composable.
   */
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import { useToast } from '@aziontech/webkit/use-toast'

  import PrimeDialog from '@aziontech/webkit/dialog'
  import PrimeButton from '@aziontech/webkit/button'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block/index.vue'
  import ReleaseCompositionTree from '@/templates/release-composition/components/ReleaseCompositionTree.vue'
  import DeploymentSettingsPicker from '@/templates/release-composition/components/DeploymentSettingsPicker.vue'
  import CanaryStrategyField from '@/templates/release-composition/components/CanaryStrategyField.vue'
  import ImpactPanel from '@/templates/release-composition/components/ImpactPanel.vue'
  import DeploymentProgressDialog from '@/templates/release-composition/components/DeploymentProgressDialog.vue'

  import { useReleaseStore } from '@/stores/release'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { LATEST_READY } from '@/templates/release-composition/version-options'
  import { useReleaseComposition } from '@/templates/release-composition/use-release-composition'
  import { useReleaseDeployProgress } from '@/templates/release-composition/use-release-deploy-progress'
  import { classifyDeploymentsForResource } from '@/templates/release-composition/classify-deployments-for-resource'
  import {
    RELEASE_COMPOSER_ROUTE,
    releaseComposerRouteFirstRelease
  } from '@/templates/release-composition/release-composer-route'
  import { useApplicationFunctionDependencies } from '@/templates/release-composition/use-application-function-dependencies'
  import { useApplicationConnectorDependencies } from '@/templates/release-composition/use-application-connector-dependencies'
  import { useApplicationVersionReady } from '@/templates/release-composition/use-application-version-ready'
  import { useFirewallFunctionDependencies } from '@/templates/release-composition/use-firewall-function-dependencies'
  import { useFirewallWafDependencies } from '@/templates/release-composition/use-firewall-waf-dependencies'
  import { useFirewallNetworkListDependencies } from '@/templates/release-composition/use-firewall-network-list-dependencies'
  import { useFirewallVersionReady } from '@/templates/release-composition/use-firewall-version-ready'
  import { useCustomPageConnectorDependencies } from '@/templates/release-composition/use-custom-page-connector-dependencies'
  import { useCustomPageVersionReady } from '@/templates/release-composition/use-custom-page-version-ready'
  import { useReleaseImpact } from '@/templates/release-composition/use-release-impact'
  import { resolveConsumingDeployments } from '@/services/v2/release-impact/consuming-deployments'
  import {
    resolveResourceMeta,
    mapPolicyToLabel
  } from '@/services/v2/deployment/deployment-adapter'

  defineOptions({ name: 'release-composer-view' })

  // The full composition order (preview): the application + the two optional
  // singletons. A scoped entry (opened from a single resource version) collapses
  // to just that one type.
  const SINGLETON_TYPES = ['application', 'firewall', 'custom_page']
  const OPTIONAL_SINGLETON_TYPES = ['firewall', 'custom_page']

  // UI grouping only — the payload is a flat `resources[]`. Each parent singleton
  // card nests the dependency collections it owns (the preview's `OWNED_BY`,
  // re-keyed to the real resource types: `function`/`connector`/`network_list`).
  const OWNED_COLLECTIONS = {
    application: ['function', 'connector'],
    firewall: ['function', 'network_list', 'waf'],
    custom_page: ['connector']
  }

  // Composition labels follow the Azion product names (plural for the dependency
  // collections + Custom Pages), matching the design mock. Icons still come from
  // the shared resolveResourceMeta. Kept local to this screen so the singular
  // labels resolveResourceMeta serves elsewhere stay intact.
  const COMPOSITION_LABELS = {
    application: 'Application',
    firewall: 'Firewall',
    custom_page: 'Custom Pages',
    function: 'Functions',
    connector: 'Connectors',
    network_list: 'Network Lists',
    waf: 'WAF'
  }
  const labelFor = (type) => COMPOSITION_LABELS[type] ?? resolveResourceMeta(type).label

  const route = useRoute()
  const router = useRouter()
  const breadcrumbs = useBreadcrumbs()
  const toast = useToast()

  // The footer action bar teleports into ContentBlock's sticky `#action-bar`
  // target, which only exists after this view mounts (same pattern as the
  // Version Shell footer). Gate the <Teleport> on it.
  const isMounted = ref(false)

  // Which entry flow this screen serves — captured ONCE on mount from the route, so
  // it never changes as the user edits the selection:
  //   'from-resource'   = Scenario B (scoped resource + Deployment Settings picker)
  //   'from-deployment' = Scenario A (one fixed deployment, no picker, impact only)
  //   'from-workload'   = opened from a Workload bound to MANY Deployment Settings
  //                       (one per environment) — keeps the picker, scoped to those
  //                       DSs, with all of them pre-selected so the impact is the
  //                       true aggregate across every environment (user may narrow)
  //   'global'          = opened with neither (top-of-list "Deploy" button — keeps
  //                       the picker so the user chooses targets)
  const entryScenario = ref('global')
  const isFromDeployment = computed(() => entryScenario.value === 'from-deployment')
  const isFromWorkload = computed(() => entryScenario.value === 'from-workload')

  // The Workload's bound Deployment Settings — the CANDIDATE set the picker is
  // restricted to in the 'from-workload' flow (a release started from a Workload
  // targets only that Workload's environments, never the whole tenant list).
  const workloadCandidateDsIds = ref([])

  // The consuming Deployment Settings resolved for a scoped (Scenario B) entry.
  // Populated async on mount via the HOP 1 strategy. It is NOT used to FILTER the
  // picker — filtering to these would drop the `available` and `needsFirstRelease`
  // groups (HOP 1 only returns DSs that ALREADY consume the resource). Instead it
  // is used to SORT: the consuming DSs float to the top so they land inside the
  // display cap (`DS_DISPLAY_CAP`) instead of being cut off in a large tenant.
  const scopedCandidateDsIds = ref([])

  // Whether the scoped candidate resolution FAILED (vs genuinely resolving to an
  // empty set). On failure we must NOT filter the picker to an empty candidate
  // set — that hides every row and blocks the user (§7.4). Instead we fall back
  // to the FULL DS list so the user can still pick. A genuine empty resolution
  // (the resource truly has no consuming DS) keeps the empty filter.
  const candidateResolutionFailed = ref(false)

  const store = useReleaseStore()
  const {
    deploymentIds,
    deployEnabled,
    effDsId,
    resEnabled,
    resNames,
    resVers,
    coll,
    collOpen,
    activeReleaseByDs,
    deployments,
    scopedType,
    fromVersion,
    versionId,
    pendingDependencySelections,
    versionGateSatisfied
  } = storeToRefs(store)

  // Resources the version pickers must keep Ready versions loaded for. It tracks
  // the EFFECTIVE composition — not only the user's explicit picks (`resNames`) but
  // also the defaults pre-filled from the effective DS's active release — so
  // versions load identically whether the resource was picked by the user (it lands
  // in `resNames`) or pre-filled (Scenario A reads it from the active release).
  // Reads only store state (no composable output), so it's a pure input computed.
  const versionedResources = computed(() => {
    const pairs = []
    const seen = new Set()
    const add = (resourceType, resourceId) => {
      if (resourceId == null || resourceId === '') return
      const key = `${resourceType}:${resourceId}`
      if (seen.has(key)) return
      seen.add(key)
      pairs.push({ resourceType, resourceId })
    }
    // Explicit singleton picks.
    Object.entries(resNames.value).forEach(([type, resourceId]) => add(type, resourceId))
    // Singletons pre-filled from the effective DS's active release (Scenario A),
    // unless the user already overrode them above.
    const activeResources = activeReleaseByDs.value[effDsId.value]?.resources ?? []
    activeResources.forEach((resource) => {
      const type = resource?.resource_type
      if (type && resNames.value[type] === undefined) {
        add(type, resource?.resource_id ?? resource?.global_id)
      }
    })
    // Dependency instances (nested by parent → depType).
    Object.values(coll.value).forEach((byType) => {
      Object.entries(byType ?? {}).forEach(([type, instances]) => {
        ;(instances ?? []).forEach((instance) => add(type, instance?.resourceId))
      })
    })
    return pairs
  })

  // SEAM 1 + SEAM 3: the sibling impact composable OWNS the blast-radius data —
  // it populates `reverseLookupByDs` (read unchanged by the composition's impact
  // engine) and exposes `dsMetaFor(id)` for the picker rows. It performs no IO
  // itself (delegates to its injected lookup service); created before the
  // composition so the engine reads the populated ref (design §3.1, §3.6).
  const impact = useReleaseImpact({ selectedDsIds: deploymentIds })
  // Surfaced to the ImpactPanel so the unavailable state explains WHY (req 11.2):
  // 'fetch_failed' (Retry may help) vs 'legacy_no_bindings' (data gap, Retry won't).
  const impactReason = impact.degradationReason

  const composition = useReleaseComposition({
    selectedDsIds: deploymentIds,
    versionedResources,
    reverseLookupByDs: impact.reverseLookupByDs,
    // Loading/failure signals so the impact VM can show a zero branch for a DS
    // with no bindings (real zero) yet still degrade to "unavailable" only on a
    // genuine fetch failure — and avoid flashing zeros while the lookup loads.
    impactLoading: impact.isLoading,
    impactFailed: computed(() => impact.degradationReason.value === 'fetch_failed'),
    // HOP 1 (req 1.2 / 8.3): inject the REAL consuming-deployments resolver so a
    // scoped entry resolves its candidate set over the full tenant inventory
    // (resource-usage endpoint, falling back to the client-side fan-out) instead
    // of the composable's `scanLoadedReleases` default — which only sees already
    // SELECTED DSs and so resolves to `[]` on a scoped entry (it opens with none
    // selected). `scanLoadedReleases` stays the no-injection default for callers
    // that intentionally scan only the loaded releases.
    resolveConsumingDeployments
  })

  // The application id the composition is built around: the explicit Application
  // pick first, else the scoped entry id when the screen is scoped to an
  // application version, else the application pinned by the effective DS's active
  // release. Coerced to a stable string so the composable's gate/cache key never
  // thrashes between numeric and string ids.
  const composedApplicationId = computed(() => {
    const explicit = resNames.value['application']
    const scopedAppId =
      scopedType.value === 'application' && store.resourceId != null && store.resourceId !== ''
        ? store.resourceId
        : null
    const activeAppId = (activeReleaseByDs.value[effDsId.value]?.resources ?? []).find(
      (resource) => resource?.resource_type === 'application'
    )
    const candidate =
      explicit != null && explicit !== ''
        ? explicit
        : scopedAppId != null
          ? scopedAppId
          : (activeAppId?.resource_id ?? activeAppId?.global_id ?? null)
    return candidate == null || candidate === '' ? null : String(candidate)
  })

  // The version pinned for a resource type by the effective DS's active release —
  // the fallback used when the user hasn't picked a version and no catalog version
  // has resolved yet.
  const activeReleaseVersionFor = (type) => {
    const match = (activeReleaseByDs.value[effDsId.value]?.resources ?? []).find(
      (resource) => resource?.resource_type === type
    )
    return match?.version_id ?? match?.resource_version_id ?? match?.resource_version ?? null
  }

  // The version whose dependencies each singleton exposes. Dependencies are always
  // discovered from the VERSION being released, and it is REACTIVE to the user's
  // pick in BOTH scenarios: `resVers[type]` (a scoped entry seeds it from the URL
  // version, so changing the version re-checks deps), resolved to a concrete id
  // (LATEST → latest Ready), falling back to the URL version / the version pinned
  // by the effective DS's active release.
  const composedApplicationVersionId = computed(() => {
    if (composedApplicationId.value == null) return null
    const isScopedApp = scopedType.value === 'application'
    const selected =
      resVers.value['application'] ??
      (isScopedApp && versionId.value ? versionId.value : LATEST_READY)
    const resolved = store.resolveVersion('application', composedApplicationId.value, selected)
    if (resolved != null) return String(resolved)
    if (isScopedApp && versionId.value) return String(versionId.value)
    const pin = activeReleaseVersionFor('application')
    return pin != null ? String(pin) : null
  })

  // A singleton is "composed" (its own deps must load) when its id + version
  // resolve AND it is part of the current composition: in a scoped entry ONLY the
  // scoped type; in the global flow the application (always) plus each enabled
  // optional singleton. Runs the per-resource dependency endpoints in BOTH
  // scenarios so every card shows only its OWN dependencies.
  const isApplicationComposed = computed(
    () =>
      composedApplicationId.value != null &&
      composedApplicationVersionId.value != null &&
      (scopedType.value ? scopedType.value === 'application' : true)
  )

  const versionReady = useApplicationVersionReady({
    applicationId: composedApplicationId,
    versionId: composedApplicationVersionId,
    enabled: isApplicationComposed
  })

  const dependenciesEnabled = computed(
    () => isApplicationComposed.value && versionReady.isReady.value
  )

  const functionDeps = useApplicationFunctionDependencies({
    applicationId: composedApplicationId,
    versionId: composedApplicationVersionId,
    enabled: dependenciesEnabled
  })

  const connectorDeps = useApplicationConnectorDependencies({
    applicationId: composedApplicationId,
    versionId: composedApplicationVersionId,
    enabled: dependenciesEnabled
  })

  // The firewall id the composition is built around: mirrors `composedApplicationId`
  // (explicit Firewall pick → scoped firewall entry id → firewall pinned by the
  // effective DS's active release). Firewall dependencies (functions, WAF, network
  // lists) are discovered from the firewall VERSION passed in the URL, only when
  // that version is `ready` (deployable) — mirroring the application flow (§7.2).
  const composedFirewallId = computed(() => {
    const explicit = resNames.value['firewall']
    const scopedFirewallId =
      scopedType.value === 'firewall' && store.resourceId != null && store.resourceId !== ''
        ? store.resourceId
        : null
    const activeFirewallId = (activeReleaseByDs.value[effDsId.value]?.resources ?? []).find(
      (resource) => resource?.resource_type === 'firewall'
    )
    const candidate =
      explicit != null && explicit !== ''
        ? explicit
        : scopedFirewallId != null
          ? scopedFirewallId
          : (activeFirewallId?.resource_id ?? activeFirewallId?.global_id ?? null)
    return candidate == null || candidate === '' ? null : String(candidate)
  })

  const composedFirewallVersionId = computed(() => {
    if (composedFirewallId.value == null) return null
    const isScopedFirewall = scopedType.value === 'firewall'
    const selected =
      resVers.value['firewall'] ??
      (isScopedFirewall && versionId.value ? versionId.value : LATEST_READY)
    const resolved = store.resolveVersion('firewall', composedFirewallId.value, selected)
    if (resolved != null) return String(resolved)
    if (isScopedFirewall && versionId.value) return String(versionId.value)
    const pin = activeReleaseVersionFor('firewall')
    return pin != null ? String(pin) : null
  })

  const isFirewallComposed = computed(
    () =>
      composedFirewallId.value != null &&
      composedFirewallVersionId.value != null &&
      (scopedType.value ? scopedType.value === 'firewall' : resEnabled.value['firewall'] !== false)
  )

  const firewallVersionReady = useFirewallVersionReady({
    firewallId: composedFirewallId,
    versionId: composedFirewallVersionId,
    enabled: isFirewallComposed
  })

  const firewallDependenciesEnabled = computed(
    () => isFirewallComposed.value && firewallVersionReady.isReady.value
  )

  const firewallFunctionDeps = useFirewallFunctionDependencies({
    firewallId: composedFirewallId,
    versionId: composedFirewallVersionId,
    enabled: firewallDependenciesEnabled
  })

  const firewallWafDeps = useFirewallWafDependencies({
    firewallId: composedFirewallId,
    versionId: composedFirewallVersionId,
    enabled: firewallDependenciesEnabled
  })

  const firewallNetworkListDeps = useFirewallNetworkListDependencies({
    firewallId: composedFirewallId,
    versionId: composedFirewallVersionId,
    enabled: firewallDependenciesEnabled
  })

  // The custom page id the composition is built around: mirrors
  // `composedApplicationId` (explicit Custom Page pick → scoped custom_page entry
  // id → custom page pinned by the effective DS's active release). Connector
  // dependencies are discovered from the custom page VERSION passed in the URL,
  // only when that version is `ready` (deployable) — mirroring the application flow.
  const composedCustomPageId = computed(() => {
    const explicit = resNames.value['custom_page']
    const scopedCustomPageId =
      scopedType.value === 'custom_page' && store.resourceId != null && store.resourceId !== ''
        ? store.resourceId
        : null
    const activeCustomPageId = (activeReleaseByDs.value[effDsId.value]?.resources ?? []).find(
      (resource) => resource?.resource_type === 'custom_page'
    )
    const candidate =
      explicit != null && explicit !== ''
        ? explicit
        : scopedCustomPageId != null
          ? scopedCustomPageId
          : (activeCustomPageId?.resource_id ?? activeCustomPageId?.global_id ?? null)
    return candidate == null || candidate === '' ? null : String(candidate)
  })

  const composedCustomPageVersionId = computed(() => {
    if (composedCustomPageId.value == null) return null
    const isScopedCustomPage = scopedType.value === 'custom_page'
    const selected =
      resVers.value['custom_page'] ??
      (isScopedCustomPage && versionId.value ? versionId.value : LATEST_READY)
    const resolved = store.resolveVersion('custom_page', composedCustomPageId.value, selected)
    if (resolved != null) return String(resolved)
    if (isScopedCustomPage && versionId.value) return String(versionId.value)
    const pin = activeReleaseVersionFor('custom_page')
    return pin != null ? String(pin) : null
  })

  const isCustomPageComposed = computed(
    () =>
      composedCustomPageId.value != null &&
      composedCustomPageVersionId.value != null &&
      (scopedType.value
        ? scopedType.value === 'custom_page'
        : resEnabled.value['custom_page'] !== false)
  )

  const customPageVersionReady = useCustomPageVersionReady({
    customPageId: composedCustomPageId,
    versionId: composedCustomPageVersionId,
    enabled: isCustomPageComposed
  })

  const customPageDependenciesEnabled = computed(
    () => isCustomPageComposed.value && customPageVersionReady.isReady.value
  )

  const customPageConnectorDeps = useCustomPageConnectorDependencies({
    customPageId: composedCustomPageId,
    versionId: composedCustomPageVersionId,
    enabled: customPageDependenciesEnabled
  })

  const dependenciesLoading = computed(
    () =>
      (isApplicationComposed.value &&
        (versionReady.isLoading.value ||
          functionDeps.isLoading.value ||
          connectorDeps.isLoading.value)) ||
      (isFirewallComposed.value &&
        (firewallVersionReady.isLoading.value ||
          firewallFunctionDeps.isLoading.value ||
          firewallWafDeps.isLoading.value ||
          firewallNetworkListDeps.isLoading.value)) ||
      (isCustomPageComposed.value &&
        (customPageVersionReady.isLoading.value || customPageConnectorDeps.isLoading.value))
  )
  const dependenciesError = computed(
    () =>
      (isApplicationComposed.value &&
        (versionReady.hasError.value ||
          functionDeps.hasError.value ||
          connectorDeps.hasError.value)) ||
      (isFirewallComposed.value &&
        (firewallVersionReady.hasError.value ||
          firewallFunctionDeps.hasError.value ||
          firewallWafDeps.hasError.value ||
          firewallNetworkListDeps.hasError.value)) ||
      (isCustomPageComposed.value &&
        (customPageVersionReady.hasError.value || customPageConnectorDeps.hasError.value)) ||
      // A failed version-catalog or instance-catalog load (cached as an error, not
      // an empty list) also surfaces the retryable banner — otherwise the empty
      // pickers would look like "nothing to pick" with no way to recover.
      composition.hasAnyVersionsError.value ||
      composition.hasAnyCatalogError.value
  )
  const retryDependencies = () => {
    versionReady.retry()
    functionDeps.retry()
    connectorDeps.retry()
    firewallVersionReady.retry()
    firewallFunctionDeps.retry()
    firewallWafDeps.retry()
    firewallNetworkListDeps.retry()
    customPageVersionReady.retry()
    customPageConnectorDeps.retry()
    // Re-fetch the version + instance catalogs whose loads failed (no-op when none
    // failed, since a successful load stays cached).
    composition.retryResourceVersions()
    composition.retryCatalogs()
  }

  // --- Feed composable-loaded data back into the store (single source of truth) ---

  watch(composition.deployments, (list) => store.setDeployments(list), {
    immediate: true,
    deep: true
  })

  watch(
    composition.activeReleaseByDs,
    (byDs) => {
      Object.entries(byDs ?? {}).forEach(([dsId, release]) =>
        store.setActiveReleaseByDs(dsId, release)
      )
    },
    { immediate: true, deep: true }
  )

  // Feed the per-DS active-release READ-failure flag into the store so `deployCtx`
  // blocks publish on a degraded DS. Iterate ALL entries (including `false`) so a
  // recovered read clears the store flag and re-enables the deploy.
  watch(
    composition.activeReleaseErrorByDs,
    (byDs) => {
      Object.entries(byDs ?? {}).forEach(([dsId, failed]) =>
        store.setActiveReleaseError(dsId, failed)
      )
    },
    { immediate: true, deep: true }
  )

  watch(
    composition.versionsByResource,
    (byResource) => {
      Object.entries(byResource ?? {}).forEach(([key, options]) => {
        const separator = key.indexOf(':')
        const type = key.slice(0, separator)
        const resourceId = key.slice(separator + 1)
        store.setVersionsByResource(type, resourceId, options)
      })
    },
    { immediate: true, deep: true }
  )

  // Seed each COMPOSED singleton's OWN dependency slots from its per-version
  // dependency endpoints, keyed by parent so one resource's deps never bleed into
  // another's card. Each seed runs UNCONDITIONALLY (empty array when the parent
  // isn't composed or has no deps) so a stale/other-resource slot is always
  // CLEARED, never retained — this is what stops the leak in both scenarios.
  // `restoreCollVersions` re-applies the user's picked versions across re-runs.
  // Non-scoped singletons' inherited deps are preserved by the composable's per-DS
  // read at dispatch, so they never enter `coll` here.
  watch(
    [
      effDsId,
      isApplicationComposed,
      isFirewallComposed,
      isCustomPageComposed,
      functionDeps.functionDependencies,
      connectorDeps.connectorDependencies,
      firewallFunctionDeps.functionDependencies,
      firewallWafDeps.wafDependencies,
      firewallNetworkListDeps.networkListDependencies,
      customPageConnectorDeps.connectorDependencies
    ],
    () => {
      const pickedVersions = {}
      Object.entries(coll.value).forEach(([parent, byType]) => {
        Object.entries(byType ?? {}).forEach(([type, instances]) => {
          ;(instances ?? []).forEach((instance) => {
            if (instance?.resourceId != null && instance.version != null) {
              pickedVersions[`${parent}:${type}:${instance.resourceId}`] = instance.version
            }
          })
        })
      })

      store.seedApplicationFunctions(
        isApplicationComposed.value ? (functionDeps.functionDependencies.value ?? []) : []
      )
      store.seedApplicationConnectors(
        isApplicationComposed.value ? (connectorDeps.connectorDependencies.value ?? []) : []
      )
      store.seedFirewallFunctions(
        isFirewallComposed.value ? (firewallFunctionDeps.functionDependencies.value ?? []) : []
      )
      store.seedFirewallWafs(
        isFirewallComposed.value ? (firewallWafDeps.wafDependencies.value ?? []) : []
      )
      store.seedFirewallNetworkLists(
        isFirewallComposed.value
          ? (firewallNetworkListDeps.networkListDependencies.value ?? [])
          : []
      )
      store.seedCustomPageConnectors(
        isCustomPageComposed.value
          ? (customPageConnectorDeps.connectorDependencies.value ?? [])
          : []
      )

      store.restoreCollVersions(pickedVersions)
    },
    { immediate: true, deep: true }
  )

  // --- Entry: open the release from the route, full reset (spec §A, req 1.2) ----

  // Monotonic entry token: bumped on every `openFromRoute`. The async HOP 1
  // resolution captures the token at call time and only writes its result if the
  // token is still current — a same-route re-entry (e.g. the "Compose first
  // release" CTA) thus discards a stale resolution from the previous entry instead
  // of letting it overwrite the new entry's candidate set.
  let entrySeq = 0

  const openFromRoute = () => {
    const seq = ++entrySeq

    // Reset the entry-derived refs so a re-entry (same-route navigation) never
    // inherits the previous entry's scenario/candidate state. `dsQuery` is view-local
    // (not part of the store's `openRelease` reset), so clear the picker search here
    // too, or a term typed in the previous entry would persist.
    entryScenario.value = 'global'
    scopedCandidateDsIds.value = []
    workloadCandidateDsIds.value = []
    candidateResolutionFailed.value = false
    dsQuery.value = ''

    const query = route.query
    const params = route.params
    const incomingScopedType = query.scopedType ?? params.scopedType ?? null
    const resourceId = query.resourceId ?? params.resourceId ?? ''
    const isFromVersion = String(query.fromVersion ?? '') === 'true'

    const rawDeploymentIds = query.deploymentIds ?? params.deploymentIds ?? null
    const preselectedDsIds = Array.isArray(rawDeploymentIds)
      ? rawDeploymentIds
      : rawDeploymentIds
        ? String(rawDeploymentIds).split(',').filter(Boolean)
        : []

    // "Compose first release" CTA seed: a resource + version carried into a FULL
    // (non-scoped) composition so it arrives pre-filled. Distinct from `scopedType`
    // (which would collapse the composition), so reading it never triggers a scoped
    // Scenario B — the DS opens DS-first with the Application editable.
    const seedType = query.seedType ?? params.seedType ?? null
    const seed = seedType
      ? {
          type: seedType,
          resourceId: query.seedResourceId ?? params.seedResourceId ?? '',
          versionId: query.seedVersionId ?? params.seedVersionId ?? ''
        }
      : null

    // A Workload entry with several bound Deployment Settings carries `pickTarget`
    // so the composer shows the picker (scoped to those DSs) instead of treating a
    // single pre-selected deployment as the fixed target.
    const isPickTarget = String(query.pickTarget ?? params.pickTarget ?? '') === 'true'

    // Resource-scoped entry (Scenario B): resolve the consuming Deployment
    // Settings as the selectable CANDIDATE set and present them in the picker,
    // but pre-select NONE — the user must explicitly choose which DSs to publish
    // into (req 1.9). The screen NEVER opens with deployments pre-selected.
    // `resolveConsumingDeployments` runs through the active HOP 1 strategy
    // (`resourceUsageResolver`); it may be async, so resolve it into the
    // candidate ref without ever feeding `openRelease`'s selection.
    if (isFromVersion && incomingScopedType && resourceId) {
      candidateResolutionFailed.value = false
      Promise.resolve(
        composition.resolveConsumingDeployments({
          resource_type: incomingScopedType,
          resource_id: resourceId
        })
      )
        .then((result) => {
          // Ignore a resolution that belongs to a superseded entry (Fix 4).
          if (seq !== entrySeq) return
          candidateResolutionFailed.value = false
          scopedCandidateDsIds.value = (result?.deployments ?? []).map((entry) =>
            String(entry.deploymentId)
          )
        })
        .catch(() => {
          if (seq !== entrySeq) return
          // A resolution FAILURE must not block the screen (req 7.4). It is NOT a
          // genuine-empty candidate set: filtering the picker to `[]` would hide
          // every row. Flag the failure so `enrichedDeployments` lists the FULL DS
          // set instead, letting the user still pick a target.
          candidateResolutionFailed.value = true
          scopedCandidateDsIds.value = []
        })
    }

    // Capture the entry flow once: a scoped resource is Scenario B; a Workload
    // with many bound DSs (`pickTarget`) is the multi-environment picker flow; a
    // single deployment pre-selected with no scoped resource is Scenario A; none of
    // the above is the global "Deploy" entry (the user picks a DS first).
    entryScenario.value = incomingScopedType
      ? 'from-resource'
      : isPickTarget && preselectedDsIds.length
        ? 'from-workload'
        : preselectedDsIds.length
          ? 'from-deployment'
          : 'global'

    // The 'from-workload' flow restricts the picker to the Workload's bound DSs.
    if (entryScenario.value === 'from-workload') {
      workloadCandidateDsIds.value = preselectedDsIds.map(String)
    }

    // Scenario B opens with ZERO selected DSs (req 1.9); Scenario A and the
    // 'from-workload' flow carry their pre-selected deployment(s) forward — the
    // latter pre-selects EVERY bound DS so the impact opens as the aggregate.
    store.openRelease({
      fromVersion: isFromVersion,
      scopedType: incomingScopedType,
      versionId: query.versionId ?? params.versionId ?? '',
      resourceId,
      deploymentIds: incomingScopedType ? [] : preselectedDsIds,
      seed
    })

    // Prime the selectable instance catalogs the singleton selectors render:
    // the Application and each optional singleton (the composable caches per
    // type, so this never refetches on reopen).
    composition.loadCatalog('application')
    OPTIONAL_SINGLETON_TYPES.forEach((type) => composition.loadCatalog(type))
  }

  onMounted(() => {
    openFromRoute()
    isMounted.value = true
  })

  // Same-route navigation (e.g. the "Compose first release" CTA re-targets the
  // composer with new query params) reuses this component instance, so onMounted
  // never fires again. Re-run the entry logic on every location change so the
  // screen re-initialises for the new deployment/seed. Guard on the route name so
  // navigating AWAY (to deployments/edit) never re-opens the release.
  watch(
    () => route.fullPath,
    () => {
      if (route.name !== RELEASE_COMPOSER_ROUTE) return
      openFromRoute()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  )

  // --- Composition view-models (translate store state → tree props) ------------

  const hasSelectedDs = computed(() => deploymentIds.value.length > 0)

  // True when the screen was opened scoped to a single resource version (the
  // composition collapses to just that one type, which is then editable).
  const isScoped = computed(() => Boolean(scopedType.value))

  // The scoped composition (one resource version) is shown as soon as the screen
  // opens — it does NOT wait for a Deployment Settings selection (req 1.9: the
  // screen opens with the resource filled and 0 DSs selected; the picker is the
  // final step). Non-scoped flows still gate the composition on a selected DS.
  const showComposition = computed(() => hasSelectedDs.value || isScoped.value)

  // The name of the single deployment in scope (Scenario A) — for the intro/notice.
  const deploymentName = computed(() => {
    const match = deployments.value.find((ds) => String(ds.id) === String(effDsId.value))
    return match?.name ?? ''
  })

  // Keep the breadcrumb's dynamic segment in sync with the resolved deployment
  // name — "Deployments › <name> › New release" — matching the console-wide
  // entity breadcrumb pattern. The name resolves async (deployments query), so
  // re-run update whenever it changes; PageHeadingBlock's one-shot setup update
  // isn't enough on its own.
  watch(
    deploymentName,
    (name) => breadcrumbs.update(route.meta?.breadCrumbs ?? [], route, name || undefined),
    { immediate: true }
  )

  // Composition intro (the eyebrow line above the tree):
  //   Scenario A → leads with the deployment ("a new release to <deployment>");
  //   Scenario B / global → the scoped resource (or "resources") + DS count.
  const scopedLabel = computed(() => (scopedType.value ? labelFor(scopedType.value) : ''))

  // The resource whose version the footer's version-gate hint asks the user to
  // confirm: the scoped resource in a scoped non-application entry, else the
  // Application (mirrors the store's `versionGateSatisfied` branch).
  const versionGateLabel = computed(() =>
    scopedType.value && scopedType.value !== 'application' ? scopedLabel.value : 'Application'
  )
  const selectedDsCount = computed(() => deploymentIds.value.length)
  const compositionIntro = computed(() => {
    if (isFromDeployment.value) {
      return deploymentName.value
        ? `Publishing a new release to ${deploymentName.value}`
        : 'Publishing a new release'
    }
    const label = isScoped.value ? scopedLabel.value : 'resources'
    return `Publishing ${label} to ${selectedDsCount.value} Deployment Settings`
  })

  // The notice under the intro: Scenario B names the single scoped resource that
  // changes; Scenario A states the release reaches every environment of the
  // deployment (the template branches on `isFromDeployment`).
  const noticeLabel = computed(() => (isScoped.value ? scopedLabel.value : 'selected resource'))

  // The active-release resources for the effective DS, keyed by type. This is the
  // base name/version each singleton/dependency card defaults to (overridden by
  // the store's explicit selection). Mirrors the preview's `d.resources` read.
  const activeReleaseResources = computed(() => {
    const byType = {}
    const resources = activeReleaseByDs.value[effDsId.value]?.resources ?? []
    resources.forEach((resource) => {
      const type = resource?.resource_type
      if (!type || byType[type]) return
      byType[type] = {
        resourceId: resource.resource_id ?? resource.global_id ?? null,
        version:
          resource.version_id ?? resource.resource_version_id ?? resource.resource_version ?? null
      }
    })
    return byType
  })

  // The dependency-collection VM for a parent card, in the shape
  // ReleaseDependenciesSection expects. Versions come from the composable;
  // instance selection (and the open flag + count) is store state.
  const collectionsFor = (parentType) =>
    (OWNED_COLLECTIONS[parentType] ?? []).map((type) => {
      const meta = resolveResourceMeta(type)
      const label = labelFor(type)
      const options = composition.catalogOptionsFor(type)
      const instances = (coll.value[parentType]?.[type] ?? []).map((instance, index) => ({
        id: index,
        resourceId: instance.resourceId,
        name:
          options.find((option) => String(option.value) === String(instance.resourceId))?.label ??
          label,
        options,
        version: instance.version,
        versionOptions: composition.versionOptionsFor(type, instance.resourceId),
        locked: instance.locked,
        required: instance.required
      }))
      return {
        type,
        label,
        icon: meta.icon,
        count: instances.length,
        // Expanded by default (mock); collapse only when explicitly toggled off.
        open: collOpen.value[`${parentType}:${type}`] !== false,
        instances
      }
    })

  // The composition tree view-model — a faithful port of the preview's
  // `resources` computed, re-keyed to the real resource types and wired to the
  // real store + composable. One uniform card per type.
  const resources = computed(() => {
    if (!showComposition.value) return []

    const scoped = isScoped.value
    const types = scoped ? [scopedType.value] : SINGLETON_TYPES

    return types.map((type) => {
      const meta = resolveResourceMeta(type)
      const isApp = type === 'application'
      const isScopedType = type === scopedType.value
      // This is the New Release composer: every rendered resource is editable so
      // the user can pick what to publish (Application included). A scoped entry
      // renders only its one type (also editable). Nothing is locked here — the
      // deploy gate lives on the Build & activate button (deployCtx/canDeploy).
      const editable = isScopedType || !scoped
      const canToggle = !isApp && !scoped
      // Application + the scoped type are always included; the optional
      // singletons default ON until explicitly toggled off.
      const enabled = isApp || isScopedType ? true : resEnabled.value[type] !== false

      // Base from the effective DS's active release, overridden by store state.
      // The Resource defaults to the active release's instance when present, else
      // the catalog's first option (never fabricated — only real data); the
      // Version defaults to the LATEST_READY sentinel ("latest Ready"), matching
      // the target, NOT the active release's pinned id.
      const base = activeReleaseResources.value[type] ?? { resourceId: null, version: null }
      const catalogOptions = composition.catalogOptionsFor(type)
      const fallbackResourceId = base.resourceId ?? catalogOptions[0]?.value ?? null
      const rawName = resNames.value[type] !== undefined ? resNames.value[type] : fallbackResourceId
      // Normalise the selected id to the catalog option's NATIVE value type so the
      // dropdown's strict-equality match resolves the label. A scoped entry seeds
      // `resNames[scopedType]` from the route (always a STRING), while the catalog
      // options carry numeric ids — without this coercion the strict `===` in
      // ResourceSelectField fails and the card shows the placeholder ("Select
      // Application") instead of the selected resource name + version. Fall back to
      // the raw id when the catalog has not loaded yet (never fabricated).
      const matchedOption = catalogOptions.find(
        (option) => String(option.value) === String(rawName)
      )
      const name = matchedOption ? matchedOption.value : rawName
      // Default to the LATEST_READY sentinel; a scoped-from-version entry pins
      // the promoted version. The user picks/confirms before deploy.
      const version =
        resVers.value[type] !== undefined
          ? resVers.value[type]
          : isScopedType && fromVersion.value
            ? versionId.value
            : LATEST_READY

      const owned = enabled ? collectionsFor(type) : []

      return {
        type,
        label: labelFor(type),
        icon: meta.icon,
        required: isApp,
        readonly: !editable,
        canToggle,
        enabled,
        name,
        nameOptions: composition.catalogOptionsFor(type),
        isLoadingOptions: composition.isLoadingCatalog(type),
        version,
        // Version options are loaded under the RAW id (`versionedResources` keys
        // off `resNames`/the active release), so look them up by `rawName` to stay
        // on the same store key — `name` may be the coerced catalog value.
        versionOptions: composition.versionOptionsFor(type, rawName),
        isLoadingVersions: composition.isLoadingVersionsFor(type, rawName),
        ownedCollections: owned,
        hasOwned: owned.length > 0,
        lockReason: 'Kept from the active release'
      }
    })
  })

  // Load the dependency-collection catalogs (function/connector, waf/network_list)
  // for parents whose dependencies are visible — the Application is always
  // required, the optional singletons load their dependencies once enabled. The
  // composable caches per type, so re-enabling a parent never refetches.
  const dependenciesVisibleFor = (parentType) => {
    if (!OWNED_COLLECTIONS[parentType]?.length) return false
    if (parentType === 'application') return true
    return resEnabled.value[parentType] !== false
  }

  watch(
    [hasSelectedDs, () => ({ ...resEnabled.value })],
    () => {
      Object.keys(OWNED_COLLECTIONS).forEach((parent) => {
        if (!dependenciesVisibleFor(parent)) return
        OWNED_COLLECTIONS[parent].forEach((type) => composition.loadCatalog(type))
      })
    },
    { immediate: true }
  )

  // --- Tree events → store mutations -------------------------------------------

  const onTreeResource = ({ type, value }) => store.setResName(type, value)
  const onTreeVersion = ({ type, value }) => store.setResVer(type, value)
  const toggleOptional = (type) => store.toggleResource(type)

  const onToggleGroup = ({ type, group }) => store.toggleCollOpen(type, group)
  const onInstanceResource = ({ type, group, id, value }) =>
    store.setCollResource({ parent: type, type: group, id, resourceId: value })
  const onInstanceVersion = ({ type, group, id, value }) => store.setCollVer(type, group, id, value)
  const onRemoveInstance = ({ type, group, id }) => store.removeCollItem(type, group, id)
  // Append a blank instance the user then configures (resource + version); keep
  // the group open so the new row is visible immediately.
  const onAddInstance = ({ type, group }) => {
    store.addCollItem({
      parent: type,
      type: group,
      item: { resourceId: null, version: LATEST_READY }
    })
    if (collOpen.value[`${type}:${group}`] === false) store.toggleCollOpen(type, group)
  }

  const onCanaryEnabled = (value) => store.toggleCanary(value)
  const onCanaryForm = (values) => store.setCanaryForm(values)

  // --- DS picker + impact -------------------------------------------------------

  // "Retry impact" (ImpactPanel) re-runs the blast-radius lookup that owns and
  // repopulates `reverseLookupByDs` — the real data source now — and refreshes
  // the deployments listing the picker rows read (req 7.4). The engine then
  // re-derives off the repopulated ref with no engine change.
  const retryImpact = () => {
    impact.retry()
    composition.retryImpact()
  }

  // Cap the picker list at the top 10 Deployment Settings (design §6.2 / req 3.8).
  // The DS picker is presentational and unvirtualized; the cap bounds what it
  // renders without changing the underlying selection or totals.
  const DS_DISPLAY_CAP = 10

  const dsQuery = ref('')
  const enrichedDeployments = computed(() => {
    const term = dsQuery.value.trim().toLowerCase()
    // 'from-workload': the picker is restricted to the Workload's bound DSs, so a
    // release started from a Workload never lists unrelated tenant deployments.
    const candidateIds = isFromWorkload.value ? new Set(workloadCandidateDsIds.value) : null
    // Scoped entry: float the HOP 1 consuming DSs to the top so they survive the
    // display cap. A stable sort keeps the original order within each partition, and
    // it's skipped on a failed resolution (the candidate set is empty/unreliable).
    const priorityIds =
      isScoped.value && !candidateResolutionFailed.value
        ? new Set(scopedCandidateDsIds.value)
        : null
    const filtered = deployments.value
      .filter((ds) => !candidateIds || candidateIds.has(String(ds.id)))
      .filter(
        (ds) =>
          !term ||
          String(ds.name ?? '')
            .toLowerCase()
            .includes(term)
      )
    const ordered = priorityIds
      ? filtered
          .map((ds, index) => ({ ds, index, priority: priorityIds.has(String(ds.id)) ? 0 : 1 }))
          .sort((left, right) => left.priority - right.priority || left.index - right.index)
          .map((entry) => entry.ds)
      : filtered
    return ordered.slice(0, DS_DISPLAY_CAP).map((ds) => ({
      id: ds.id,
      name: ds.name,
      binding_policy: ds.binding_policy,
      policyLabel: ds.policyLabel ?? mapPolicyToLabel(ds.deployment_policy),
      // SEAM 3: spread the per-DS meta only when known. `dsMetaFor` already
      // omits any field it cannot derive (returns `{}` for an unresolved DS),
      // so the picker renders `environmentNames` / `workloadsCount` ONLY when
      // present — never fabricated (req 3.6, 7.3, 9.2).
      ...impact.dsMetaFor(ds.id)
    }))
  })

  const enrichedDeploymentIds = computed(() => enrichedDeployments.value.map((ds) => String(ds.id)))

  watch(enrichedDeploymentIds, (ids) => composition.ensureActiveReleases(ids), { immediate: true })

  // DS ids whose active-release read FAILED — fed to the classifier so a scoped
  // entry segregates them into `loadFailed` (Retry) instead of `needsFirstRelease`
  // (which would offer a first release that overwrites the unread composition).
  const failedDsIds = computed(() =>
    Object.entries(store.activeReleaseErrorByDs)
      .filter(([, failed]) => failed)
      .map(([dsId]) => dsId)
  )

  const NON_SELECTABLE_GROUPS = ['needsFirstRelease', 'loadFailed']

  const deploymentGroups = computed(() => {
    const { groups } = classifyDeploymentsForResource({
      deployments: enrichedDeployments.value,
      activeReleaseByDs: activeReleaseByDs.value,
      scopedType: scopedType.value,
      scopedResourceId: store.resourceId,
      failedDsIds: failedDsIds.value
    })
    const LABELS = {
      linked: 'Already using this resource',
      available: 'Available — not linked yet',
      needsFirstRelease: 'Needs a first release',
      loadFailed: "Couldn't load the active release"
    }
    // Per-group notice + inline action for the non-selectable rows (the picker is
    // presentational and renders whatever arrives here).
    const NOTICES = {
      needsFirstRelease:
        'No active release — compose a full first release (with an Application) to publish here.',
      loadFailed: "Couldn't read the active release — retry before publishing here."
    }
    const ACTIONS = {
      needsFirstRelease: { label: 'Compose first release', icon: 'pi pi-arrow-right' },
      loadFailed: { label: 'Retry', icon: 'pi pi-refresh' }
    }
    return groups.map((group) => ({
      key: group.key,
      label: LABELS[group.key],
      selectable: !NON_SELECTABLE_GROUPS.includes(group.key),
      notice: NOTICES[group.key] ?? null,
      action: ACTIONS[group.key] ?? null,
      deployments: group.deployments
    }))
  })

  const onPickDs = (ids) => {
    const current = deploymentIds.value.map(String)
    const next = (ids ?? []).map(String)
    next.filter((id) => !current.includes(id)).forEach((id) => store.pickDs(id))
    current.filter((id) => !next.includes(id)).forEach((id) => store.pickDs(id))
  }

  const onBindEnvironment = () => {
    const { href } = router.resolve({ name: 'deployments' })
    window.open(href, '_blank', 'noopener')
  }

  // A scoped entry can't override a DS with no active release. The picker offers
  // that DS a "Compose first release" action instead — reopen the composer DS-first
  // (full composition) for it, carrying the scoped resource + version forward as a
  // seed so only the Application is left to pick.
  const onComposeFirstRelease = (dsId) =>
    router.push(
      releaseComposerRouteFirstRelease({
        deploymentId: dsId,
        scopedType: scopedType.value,
        resourceId: store.resourceId,
        versionId: versionId.value
      })
    )

  // The picker emits a single generic `group-action`; route it by group key. A DS
  // whose active-release read failed offers Retry (re-fetch just the failed reads);
  // one with no release at all offers "Compose first release".
  const onGroupAction = ({ groupKey, dsId }) => {
    if (groupKey === 'loadFailed') {
      composition.retryActiveReleases()
      return
    }
    if (groupKey === 'needsFirstRelease') onComposeFirstRelease(dsId)
  }

  // --- Multi-DS gate (req 5.5): fold deployCtx over ALL selected DS, strictest --

  // The strictest blocking DS, carrying WHY (`reason`) so the footer explains it:
  //   'degraded' → its active release couldn't be read (offer Retry)
  //   'no_app'   → it has no Application to publish
  const blockingDs = computed(() => {
    for (const id of deploymentIds.value) {
      const ctx = store.deployCtx(id)
      if (!ctx.ok || !ctx.canDeploy) {
        const match = deployments.value.find((ds) => String(ds.id) === String(id))
        return { id, name: match?.name ?? String(id), reason: ctx.degraded ? 'degraded' : 'no_app' }
      }
    }
    return null
  })

  // Versions still loading for a composed resource: the LATEST sentinel resolves to
  // `null` mid-load, which the dispatch guard would turn into an "unresolved" skip.
  // Gate the button on that so a too-early click can't misfire (footer shows a hint).
  const versionsStillLoading = computed(() =>
    versionedResources.value.some((resource) =>
      composition.isLoadingVersionsFor(resource.resourceType, resource.resourceId)
    )
  )

  // `deployEnabled` already gates on the effective DS; combine with the multi-DS
  // fold so any blocking DS disables the button (the store covers app/version).
  const canBuildAndActivate = computed(
    () => deployEnabled.value && !blockingDs.value && !versionsStillLoading.value
  )

  // --- Confirm + Build & activate (spec §G) ------------------------------------

  const confirmVisible = ref(false)

  const deployProgress = useReleaseDeployProgress({
    dispatch: (ids, onOutcome) =>
      composition.buildAndActivate(store.composePayload(), ids, { onOutcome }),
    resolveRow: (id) => {
      const match = deployments.value.find((ds) => String(ds.id) === String(id))
      return {
        name: match?.name ?? String(id),
        policyLabel: match?.policyLabel ?? mapPolicyToLabel(match?.deployment_policy),
        ...impact.dsMetaFor(id)
      }
    }
  })

  const impactSummary = computed(() => {
    const count = deploymentIds.value.length
    const dsWord = count === 1 ? 'Deployment Setting' : 'Deployment Settings'
    if (composition.impactUnavailable.value) {
      return `This release will go live on ${count} ${dsWord}. The previous release stays available for rollback.`
    }
    const totals = composition.impact.value.totals ?? { totalDomains: 0, totalWorkloads: 0 }
    return `This release will go live on ${count} ${dsWord} and route ${totals.totalDomains} domains across ${totals.totalWorkloads} workloads. The previous release stays available for rollback.`
  })

  const openConfirm = () => {
    if (!canBuildAndActivate.value) return
    confirmVisible.value = true
  }

  const SKIP_MESSAGES = {
    degraded: 'Could not read the active release; deployment skipped.',
    mismatch: 'The resource is not part of this deployment; skipped.',
    unresolved_version: 'No ready version resolved for the resource; skipped.'
  }

  const surfaceOutcome = (outcome) => {
    const match = deployments.value.find((ds) => String(ds.id) === String(outcome.id))
    const name = match?.name ?? String(outcome.id)
    if (outcome.ok) {
      toast.add({ closable: true, severity: 'success', summary: 'Build started', detail: name })
      return
    }
    if (outcome.skipped) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'Deployment skipped',
        detail: `${name}: ${SKIP_MESSAGES[outcome.skipReason] ?? 'Skipped.'}`
      })
      return
    }
    const error = outcome.error
    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
      return
    }
    toast.add({
      closable: true,
      severity: 'error',
      summary: 'Build failed',
      detail: `${name}: ${error?.message ?? 'Something went wrong'}`
    })
  }

  // Async (202), no polling: surface a per-DS toast on the settled outcome and
  // navigate to the first deployment whose build actually started — never await
  // completion. The store only describes the selection (pure `composePayload`);
  // the composable owns the per-DS dispatch. Fall back to the effective DS when
  // no multi-select. If every target failed or was skipped, stay on the composer
  // so the user can read the errors and retry.
  const confirmBuildAndActivate = async () => {
    confirmVisible.value = false
    const targetDsIds = deploymentIds.value.length
      ? deploymentIds.value
      : effDsId.value
        ? [effDsId.value]
        : []
    // A multi-DS release hands off to the progress dialog (per-DS status, no toasts,
    // no auto-navigation): the user watches every release settle and closes when done.
    if (targetDsIds.length > 1) {
      await deployProgress.run(targetDsIds)
      return
    }
    const outcomes = await composition.buildAndActivate(store.composePayload(), targetDsIds)
    outcomes.forEach(surfaceOutcome)
    const navigateTarget = outcomes.find((outcome) => outcome?.ok)?.id
    if (navigateTarget != null) {
      router.push({ name: 'deployments-edit', params: { id: navigateTarget, tab: 'releases' } })
    }
  }

  // Closing the progress dialog after a fully successful multi-DS release sends the
  // user to that deployment's releases tab (the single-DS path navigates the same
  // way). A partial/failed batch stays put so the user can read the failures.
  const onDeployProgressClose = () => {
    const items = deployProgress.items.value
    const allSucceeded = items.length > 0 && items.every((item) => item.status === 'done')
    const target = allSucceeded ? items[0]?.id : null
    deployProgress.close()
    if (target != null) {
      router.push({ name: 'deployments-edit', params: { id: target, tab: 'releases' } })
    }
  }

  const onCancel = () => {
    router.push({ name: 'deployments' })
  }
</script>

<template>
  <ContentBlock data-testid="release-composition__view">
    <template #heading>
      <div
        class="flex flex-col gap-[var(--spacing-1)]"
        data-testid="release-composition__heading"
      >
        <PageHeadingBlock
          page-title="Review & deploy"
          :entity-name="deploymentName"
        />
        <h1
          class="text-heading-md font-semibold text-[var(--text-color)]"
          data-testid="release-composition__heading-title"
        >
          Review & deploy
        </h1>
        <p
          class="text-body-sm text-[var(--text-color-secondary)]"
          data-testid="release-composition__heading-description"
        >
          Compose the release on the left, review the impact on the right, then build & activate.
        </p>
      </div>
    </template>

    <template #content>
      <div
        class="release-composer__grid grid gap-[var(--spacing-5)]"
        data-testid="release-composition__grid"
      >
        <section
          class="flex flex-col overflow-hidden rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)]"
          data-testid="release-composition__composition-card"
        >
          <div
            class="flex items-center gap-[var(--spacing-2)] border-b border-[var(--surface-border)] px-[var(--spacing-4)] py-[var(--spacing-3)]"
          >
            <span
              class="inline-flex h-[var(--spacing-7)] w-[var(--spacing-7)] items-center justify-center rounded-[var(--shape-elements)] bg-[var(--surface-100)] text-[var(--text-color-secondary)]"
            >
              <i class="pi pi-sitemap" />
            </span>
            <h2 class="text-body-lg font-semibold text-[var(--text-color)]">Composition</h2>
          </div>

          <div class="flex flex-col gap-[var(--spacing-6)] p-[var(--spacing-4)]">
            <div
              v-if="showComposition"
              class="order-1 flex flex-col gap-[var(--spacing-3)]"
              data-testid="release-composition__composition"
            >
              <span class="text-overline-xs text-[var(--text-color-secondary)]">
                Release composition
              </span>
              <div class="flex items-center gap-[var(--spacing-2)]">
                <span
                  class="inline-flex h-[var(--spacing-6)] w-[var(--spacing-6)] items-center justify-center rounded-[var(--shape-elements)] bg-[var(--surface-100)] text-[var(--text-color-secondary)]"
                >
                  <i class="pi pi-sitemap" />
                </span>
                <span
                  class="text-body-lg font-semibold text-[var(--text-color)]"
                  data-testid="release-composition__intro"
                >
                  {{ compositionIntro }}
                </span>
              </div>

              <div
                class="flex items-start gap-[var(--spacing-2)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-50)] px-[var(--spacing-4)] py-[var(--spacing-3)]"
                data-testid="release-composition__scoped-notice"
              >
                <i
                  class="pi pi-info-circle mt-[var(--spacing-1)] text-[var(--text-color-secondary)]"
                />
                <span class="text-body-sm text-[var(--text-color-secondary)]">
                  <template v-if="isFromDeployment">
                    This release applies to
                    <strong class="font-semibold text-[var(--text-color)]">{{
                      deploymentName || 'this deployment'
                    }}</strong>
                    and reaches every environment that uses it — review the impact on the right
                    before activating.
                  </template>
                  <template v-else-if="isFromWorkload">
                    This Workload is bound to
                    <strong class="font-semibold text-[var(--text-color)]">{{
                      workloadCandidateDsIds.length
                    }}</strong>
                    Deployment Settings — one per environment. The release goes live on each
                    selected one; deselect any you want to skip and review the impact on the right.
                  </template>
                  <template v-else>
                    Only the
                    <strong class="font-semibold text-[var(--text-color)]">{{
                      noticeLabel
                    }}</strong>
                    version below changes. Every selected Deployment Settings keeps its own
                    composition and policy — each gets a new Release with just this resource
                    swapped.
                  </template>
                </span>
              </div>

              <div
                v-if="dependenciesLoading"
                class="flex items-center gap-[var(--spacing-2)] text-body-xs text-[var(--text-color-secondary)]"
                data-testid="release-composition__dependencies-loading"
              >
                <i class="pi pi-spinner pi-spin" />
                <span>Detecting Functions and Connectors used by this Application…</span>
              </div>

              <div
                v-else-if="dependenciesError"
                class="flex flex-col gap-[var(--spacing-2)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-50)] px-[var(--spacing-4)] py-[var(--spacing-3)]"
                data-testid="release-composition__dependencies-error"
              >
                <span
                  class="flex items-center gap-[var(--spacing-2)] text-body-sm text-[var(--text-color-secondary)]"
                >
                  <i class="pi pi-exclamation-triangle text-[var(--warning-contrast)]" />
                  Couldn't detect the dependencies used by this Application.
                </span>
                <PrimeButton
                  label="Retry"
                  icon="pi pi-refresh"
                  severity="secondary"
                  size="small"
                  class="self-start"
                  data-testid="release-composition__dependencies-retry"
                  @click="retryDependencies"
                />
              </div>

              <ReleaseCompositionTree
                :resources="resources"
                @toggle="toggleOptional"
                @update:resource="onTreeResource"
                @update:version="onTreeVersion"
                @toggle-group="onToggleGroup"
                @add-instance="onAddInstance"
                @update:instance-resource="onInstanceResource"
                @update:instance-version="onInstanceVersion"
                @remove-instance="onRemoveInstance"
              />
            </div>

            <!-- The Deployment Settings picker sits directly below the composition
                 (never the opening element; req 4.5 / NRS §1.4). Canary rollout
                 follows it as the final, optional strategy section. `order-2/3` +
                 source order keep this arrangement regardless of which sibling
                 sections render. -->
            <DeploymentSettingsPicker
              v-if="!isFromDeployment"
              class="order-2"
              :groups="deploymentGroups"
              :model-value="deploymentIds"
              :query="dsQuery"
              :is-loading-meta="impact.isLoading.value"
              @update:model-value="onPickDs"
              @update:query="dsQuery = $event"
              @bind-environment="onBindEnvironment"
              @group-action="onGroupAction"
            />

            <CanaryStrategyField
              v-if="showComposition"
              class="order-3 border-t border-[var(--surface-border)] pt-[var(--spacing-6)]"
              @update:enabled="onCanaryEnabled"
              @update:form="onCanaryForm"
            />
          </div>
        </section>

        <section
          class="release-composer__impact flex flex-col self-start overflow-hidden rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)]"
          data-testid="release-composition__impact-card"
        >
          <div
            class="flex items-center gap-[var(--spacing-2)] border-b border-[var(--surface-border)] px-[var(--spacing-4)] py-[var(--spacing-3)]"
          >
            <span
              class="inline-flex h-[var(--spacing-7)] w-[var(--spacing-7)] items-center justify-center rounded-[var(--shape-elements)] bg-[var(--surface-100)] text-[var(--text-color-secondary)]"
            >
              <i class="pi pi-bullseye" />
            </span>
            <h2 class="text-body-lg font-semibold text-[var(--text-color)]">Impact</h2>
          </div>

          <div class="p-[var(--spacing-4)]">
            <ImpactPanel
              :impact="composition.impact.value"
              :degradation-reason="impactReason"
              @retry="retryImpact"
            />
          </div>
        </section>
      </div>
    </template>
  </ContentBlock>

  <Teleport
    v-if="isMounted"
    to="#action-bar"
  >
    <div
      class="flex w-full flex-col gap-[var(--spacing-3)] border-t border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-2)] py-[var(--spacing-3)] md:flex-row md:items-center md:justify-between md:px-[var(--spacing-8)]"
      data-testid="release-composition__footer"
    >
      <span
        class="flex items-center gap-[var(--spacing-2)] text-body-xs text-[var(--text-color-secondary)]"
        data-testid="release-composition__footer-hint"
      >
        <i class="pi pi-info-circle" />
        Build &amp; activate creates, builds and activates in one action.
      </span>
      <div class="flex items-center justify-end gap-[var(--spacing-3)]">
        <!-- A degraded DS (active-release read failed) is recoverable in the
             from-deployment flow too, where the picker isn't shown — so the footer
             carries the Retry itself so the user is never stuck. -->
        <span
          v-if="blockingDs && blockingDs.reason === 'degraded'"
          class="flex items-center gap-[var(--spacing-2)] text-body-xs text-[var(--text-color-secondary)]"
          data-testid="release-composition__footer-degraded"
        >
          Couldn't read the active release for {{ blockingDs.name }} — retry before publishing.
          <PrimeButton
            label="Retry"
            icon="pi pi-refresh"
            link
            size="small"
            data-testid="release-composition__footer-degraded-retry"
            @click="composition.retryActiveReleases()"
          />
        </span>
        <span
          v-else-if="blockingDs"
          class="text-body-xs text-[var(--text-color-secondary)]"
          data-testid="release-composition__footer-blocked"
        >
          {{ blockingDs.name }} has no Application — resolve it to publish.
        </span>
        <span
          v-else-if="pendingDependencySelections.length"
          class="text-body-xs text-[var(--text-color-secondary)]"
          data-testid="release-composition__footer-pending-dependencies"
        >
          Select a version for each Function and Connector to publish.
        </span>
        <span
          v-else-if="versionsStillLoading"
          class="flex items-center gap-[var(--spacing-2)] text-body-xs text-[var(--text-color-secondary)]"
          data-testid="release-composition__footer-loading-versions"
        >
          <i class="pi pi-spinner pi-spin" />
          Loading versions…
        </span>
        <span
          v-else-if="!versionGateSatisfied"
          class="text-body-xs text-[var(--text-color-secondary)]"
          data-testid="release-composition__footer-confirm-version"
        >
          Confirm the {{ versionGateLabel }} version to publish.
        </span>
        <PrimeButton
          label="Cancel"
          severity="secondary"
          outlined
          size="small"
          data-testid="release-composition__cancel"
          @click="onCancel"
        />
        <PrimeButton
          label="Deploy release"
          icon="pi pi-cloud-upload"
          size="small"
          :disabled="!canBuildAndActivate"
          :loading="composition.isDeploying.value"
          data-testid="release-composition__build-and-activate"
          @click="openConfirm"
        />
      </div>
    </div>
  </Teleport>

  <PrimeDialog
    v-model:visible="confirmVisible"
    modal
    :block-scroll="true"
    class="max-w-[var(--container-xl)]"
    header="Build & activate this release?"
    data-testid="release-composition__confirm-dialog"
  >
    <p
      class="text-body-sm text-[var(--text-color-secondary)]"
      data-testid="release-composition__confirm-summary"
    >
      {{ impactSummary }}
    </p>
    <template #footer>
      <div class="flex items-center justify-end gap-[var(--spacing-3)]">
        <PrimeButton
          label="Cancel"
          severity="secondary"
          outlined
          size="small"
          data-testid="release-composition__confirm-cancel"
          @click="confirmVisible = false"
        />
        <PrimeButton
          label="Deploy release"
          icon="pi pi-cloud-upload"
          size="small"
          :loading="composition.isDeploying.value"
          data-testid="release-composition__confirm-build"
          @click="confirmBuildAndActivate"
        />
      </div>
    </template>
  </PrimeDialog>

  <DeploymentProgressDialog
    :visible="deployProgress.visible.value"
    :items="deployProgress.items.value"
    :counts="deployProgress.counts.value"
    :is-running="deployProgress.isRunning.value"
    :active-name="deployProgress.activeName.value"
    @retry-failed="deployProgress.retryFailed"
    @close="onDeployProgressClose"
  />
</template>

<style scoped>
  .release-composer__grid {
    grid-template-columns: minmax(0, 1fr) minmax(var(--container-xs), var(--container-md));
  }

  .release-composer__impact {
    position: sticky;
    top: var(--spacing-4);
  }

  @media (max-width: 880px) {
    .release-composer__grid {
      grid-template-columns: 1fr;
    }

    .release-composer__impact {
      position: static;
    }
  }
</style>
