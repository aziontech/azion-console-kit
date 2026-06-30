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

  import { useReleaseStore } from '@/stores/release'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { LATEST_READY } from '@/templates/release-composition/version-options'
  import { useReleaseComposition } from '@/templates/release-composition/use-release-composition'
  import { useApplicationFunctionDependencies } from '@/templates/release-composition/use-application-function-dependencies'
  import { useApplicationConnectorDependencies } from '@/templates/release-composition/use-application-connector-dependencies'
  import { useApplicationVersionReady } from '@/templates/release-composition/use-application-version-ready'
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
    firewall: ['network_list', 'waf'],
    custom_page: []
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
  //   'global'          = opened with neither (top-of-list "Deploy" button — keeps
  //                       the picker so the user chooses targets)
  const entryScenario = ref('global')
  const isFromDeployment = computed(() => entryScenario.value === 'from-deployment')

  // The consuming Deployment Settings resolved for a scoped (Scenario B) entry —
  // the SELECTABLE CANDIDATE set the picker lists (req 1.9). Populated async on
  // mount via the HOP 1 strategy; the user picks from it (nothing pre-selected).
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
    pendingDependencySelections
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
    // Dependency instances.
    Object.entries(coll.value).forEach(([type, instances]) => {
      ;(instances ?? []).forEach((instance) => add(type, instance?.resourceId))
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

  // The application-release flow is active whenever there IS a composed
  // application id — that's what makes the function-dependency detection
  // authoritative for `coll['function']` (§7.2).
  const isApplicationFlow = computed(() => composedApplicationId.value != null)

  // Dependencies are discovered from the application VERSION passed in the URL
  // (the version being released), not the application's current/live state — and
  // only when that version is `ready` (deployable). `versionId` is the scoped
  // entry's version (route → store).
  const composedVersionId = computed(() =>
    versionId.value != null && versionId.value !== '' ? String(versionId.value) : null
  )

  const versionReady = useApplicationVersionReady({
    applicationId: composedApplicationId,
    versionId: composedVersionId,
    enabled: isApplicationFlow
  })

  const dependenciesEnabled = computed(() => isApplicationFlow.value && versionReady.isReady.value)

  const functionDeps = useApplicationFunctionDependencies({
    applicationId: composedApplicationId,
    versionId: composedVersionId,
    enabled: dependenciesEnabled
  })

  const connectorDeps = useApplicationConnectorDependencies({
    applicationId: composedApplicationId,
    versionId: composedVersionId,
    enabled: dependenciesEnabled
  })

  const dependenciesLoading = computed(
    () =>
      isApplicationFlow.value &&
      (versionReady.isLoading.value ||
        functionDeps.isLoading.value ||
        connectorDeps.isLoading.value)
  )
  const dependenciesError = computed(
    () =>
      isApplicationFlow.value &&
      (versionReady.hasError.value || functionDeps.hasError.value || connectorDeps.hasError.value)
  )
  const retryDependencies = () => {
    versionReady.retry()
    functionDeps.retry()
    connectorDeps.retry()
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

  // Seed the nested dependency section from the effective DS's active release
  // (spec: no "Add" — the instance set is INHERITED). Re-runs when the effective
  // DS changes, its release finishes loading, OR the application's function/
  // connector dependencies resolve. `store.seedColl` fully replaces `coll`, so it
  // must run FIRST; then the application's functions and connectors are re-applied
  // as the authoritative source of `coll['function']`/`coll['connector']` (§7.2)
  // so the active-release seed never clobbers them regardless of which input changed.
  watch(
    [
      effDsId,
      activeReleaseByDs,
      functionDeps.functionDependencies,
      connectorDeps.connectorDependencies
    ],
    () => {
      store.seedColl(composition.dependencyResourcesFor(effDsId.value))
      if (functionDeps.functionDependencies.value?.length) {
        store.seedApplicationFunctions(functionDeps.functionDependencies.value)
      }
      if (connectorDeps.connectorDependencies.value?.length) {
        store.seedApplicationConnectors(connectorDeps.connectorDependencies.value)
      }
    },
    { immediate: true, deep: true }
  )

  // --- Entry: open the release from the route, full reset (spec §A, req 1.2) ----

  onMounted(() => {
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
          candidateResolutionFailed.value = false
          scopedCandidateDsIds.value = (result?.deployments ?? []).map((entry) =>
            String(entry.deploymentId)
          )
        })
        .catch(() => {
          // A resolution FAILURE must not block the screen (req 7.4). It is NOT a
          // genuine-empty candidate set: filtering the picker to `[]` would hide
          // every row. Flag the failure so `enrichedDeployments` lists the FULL DS
          // set instead, letting the user still pick a target.
          candidateResolutionFailed.value = true
          scopedCandidateDsIds.value = []
        })
    }

    // Capture the entry flow once: a scoped resource is Scenario B; a deployment
    // pre-selected with no scoped resource is Scenario A; neither is the global
    // "Deploy" entry (the user picks a Deployment Settings first).
    entryScenario.value = incomingScopedType
      ? 'from-resource'
      : preselectedDsIds.length
        ? 'from-deployment'
        : 'global'

    // Scenario B opens with ZERO selected DSs (req 1.9); only Scenario A carries
    // its single pre-selected deployment forward.
    store.openRelease({
      fromVersion: isFromVersion,
      scopedType: incomingScopedType,
      versionId: query.versionId ?? params.versionId ?? '',
      resourceId,
      deploymentIds: incomingScopedType ? [] : preselectedDsIds
    })

    // Prime the selectable instance catalogs the singleton selectors render:
    // the Application and each optional singleton (the composable caches per
    // type, so this never refetches on reopen).
    composition.loadCatalog('application')
    OPTIONAL_SINGLETON_TYPES.forEach((type) => composition.loadCatalog(type))

    isMounted.value = true
  })

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
      const instances = (coll.value[type] ?? []).map((instance, index) => ({
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
        open: collOpen.value[type] !== false,
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

  const onToggleGroup = ({ group }) => store.toggleCollOpen(group)
  const onInstanceResource = ({ group, id, value }) =>
    store.setCollResource({ type: group, id, resourceId: value })
  const onInstanceVersion = ({ group, id, value }) => store.setCollVer(group, id, value)
  const onRemoveInstance = ({ group, id }) => store.removeCollItem(group, id)
  // Append a blank instance the user then configures (resource + version); keep
  // the group open so the new row is visible immediately.
  const onAddInstance = ({ group }) => {
    store.addCollItem(group, { resourceId: null, version: LATEST_READY })
    if (collOpen.value[group] === false) store.toggleCollOpen(group)
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
    // Scoped (Scenario B): restrict the picker to the resolved consuming-DS
    // candidate set (req 1.9). Non-scoped flows list every Deployment Settings.
    // On a candidate-resolution FAILURE (§7.4) do NOT filter — an empty Set would
    // match nothing and block the user; fall back to the FULL list (null = no
    // filter) so the user can still pick. A genuine-empty resolution keeps the
    // (empty) candidate filter.
    const candidateSet =
      isScoped.value && !candidateResolutionFailed.value
        ? new Set(scopedCandidateDsIds.value)
        : null
    return deployments.value
      .filter((ds) => !candidateSet || candidateSet.has(String(ds.id)))
      .filter(
        (ds) =>
          !term ||
          String(ds.name ?? '')
            .toLowerCase()
            .includes(term)
      )
      .slice(0, DS_DISPLAY_CAP)
      .map((ds) => ({
        id: ds.id,
        name: ds.name,
        policyLabel: ds.policyLabel ?? mapPolicyToLabel(ds.deployment_policy),
        // SEAM 3: spread the per-DS meta only when known. `dsMetaFor` already
        // omits any field it cannot derive (returns `{}` for an unresolved DS),
        // so the picker renders `environmentName` / `workloadsCount` ONLY when
        // present — never fabricated (req 3.6, 7.3, 9.2).
        ...impact.dsMetaFor(ds.id)
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

  // --- Multi-DS gate (req 5.5): fold deployCtx over ALL selected DS, strictest --

  const blockingDs = computed(() => {
    for (const id of deploymentIds.value) {
      const ctx = store.deployCtx(id)
      if (!ctx.ok || !ctx.canDeploy) {
        const match = deployments.value.find((ds) => String(ds.id) === String(id))
        return { id, name: match?.name ?? String(id) }
      }
    }
    return null
  })

  // `deployEnabled` already gates on the effective DS; combine with the multi-DS
  // fold so any blocking DS disables the button (the store covers app/version).
  const canBuildAndActivate = computed(() => deployEnabled.value && !blockingDs.value)

  // --- Confirm + Build & activate (spec §G) ------------------------------------

  const confirmVisible = ref(false)

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

  const surfaceOutcome = (outcome) => {
    const match = deployments.value.find((ds) => String(ds.id) === String(outcome.id))
    const name = match?.name ?? String(outcome.id)
    if (outcome.ok) {
      toast.add({ closable: true, severity: 'success', summary: 'Build started', detail: name })
    } else {
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
  }

  // Async (202), no polling: surface a per-DS toast on the settled outcome and
  // navigate to the (first) deployment's releases — never await completion. The
  // store only describes the selection (pure `composePayload`); the composable
  // owns the per-DS dispatch. Fall back to the effective DS when no multi-select.
  const confirmBuildAndActivate = async () => {
    confirmVisible.value = false
    const targetDsIds = deploymentIds.value.length
      ? deploymentIds.value
      : effDsId.value
        ? [effDsId.value]
        : []
    const navigateTarget = targetDsIds[0]
    const outcomes = await composition.buildAndActivate(store.composePayload(), targetDsIds)
    outcomes.forEach(surfaceOutcome)
    if (navigateTarget != null) {
      router.push({ name: 'deployments-edit', params: { id: navigateTarget, tab: 'releases' } })
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

            <CanaryStrategyField
              v-if="showComposition"
              class="order-2 border-t border-[var(--surface-border)] pt-[var(--spacing-6)]"
              @update:enabled="onCanaryEnabled"
              @update:form="onCanaryForm"
            />

            <!-- The Deployment Settings picker is the FINAL section: it sits below
                 the composition (and canary), never the opening element (req 4.5 /
                 NRS §1.4). `order-3` + source-last keeps it last regardless of
                 which sibling sections render. -->
            <DeploymentSettingsPicker
              v-if="!isFromDeployment"
              class="order-3"
              :deployments="enrichedDeployments"
              :model-value="deploymentIds"
              :query="dsQuery"
              @update:model-value="onPickDs"
              @update:query="dsQuery = $event"
              @bind-environment="onBindEnvironment"
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
        <span
          v-if="blockingDs"
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
        <PrimeButton
          label="Cancel"
          severity="secondary"
          outlined
          size="small"
          data-testid="release-composition__cancel"
          @click="onCancel"
        />
        <PrimeButton
          label="Build & activate"
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
          label="Build & activate"
          icon="pi pi-cloud-upload"
          size="small"
          :loading="composition.isDeploying.value"
          data-testid="release-composition__confirm-build"
          @click="confirmBuildAndActivate"
        />
      </div>
    </template>
  </PrimeDialog>
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
