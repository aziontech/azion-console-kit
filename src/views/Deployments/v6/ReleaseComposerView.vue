<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import { useToast } from '@aziontech/webkit/use-toast'

  import PrimeDialog from '@aziontech/webkit/dialog'
  import PrimeButton from '@aziontech/webkit/button'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block/index.vue'
  import ReleaseCompositionTree from '@/templates/release-composition/components/ReleaseCompositionTree.vue'
  import ReleaseDependenciesSection from '@/templates/release-composition/components/ReleaseDependenciesSection.vue'
  import DeploymentSettingsPicker from '@/templates/release-composition/components/DeploymentSettingsPicker.vue'
  // import CanaryStrategyField from '@/templates/release-composition/components/CanaryStrategyField.vue'
  import ImpactPanel from '@/templates/release-composition/components/ImpactPanel.vue'
  import DeploymentProgressDialog from '@/templates/release-composition/components/DeploymentProgressDialog.vue'
  import MessageCard from '@/components/MessageCard'

  import { useReleaseStore, ADDITIONAL_PARENT } from '@/stores/release'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { LATEST_READY } from '@/templates/release-composition/version-options'
  import { singularNounFor } from '@/templates/release-composition/resource-nouns'
  import { SKIP_MESSAGES } from '@/templates/release-composition/skip-messages'
  import { useReleaseComposition } from '@/templates/release-composition/use-release-composition'
  import { useReleaseDeployProgress } from '@/templates/release-composition/use-release-deploy-progress'
  import { classifyDeploymentsForResource } from '@/templates/release-composition/classify-deployments-for-resource'
  import {
    RELEASE_COMPOSER_ROUTE,
    releaseComposerRouteFirstRelease
  } from '@/templates/release-composition/release-composer-route'
  import { resourceBuildRoute } from '@/templates/release-composition/resource-build-route'
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

  const SINGLETON_TYPES = ['application', 'firewall', 'custom_page']
  const OPTIONAL_SINGLETON_TYPES = ['firewall', 'custom_page']

  const OWNED_COLLECTIONS = {
    application: ['function', 'connector'],
    firewall: ['function', 'network_list', 'waf'],
    custom_page: ['connector'],
    [ADDITIONAL_PARENT]: ['connector', 'network_list']
  }

  const COMPOSITION_LABELS = {
    application: 'Application',
    firewall: 'Firewall',
    custom_page: 'Custom page',
    function: 'Functions',
    connector: 'Connectors',
    network_list: 'Network Lists',
    waf: 'WAF',
    [ADDITIONAL_PARENT]: 'Include dependencies'
  }
  const labelFor = (type) => COMPOSITION_LABELS[type] ?? resolveResourceMeta(type).label

  const sharedParentLabel = (parent) =>
    parent === ADDITIONAL_PARENT ? 'the included dependencies' : `the ${singularNounFor(parent)}`

  const route = useRoute()
  const router = useRouter()
  const breadcrumbs = useBreadcrumbs()
  const toast = useToast()

  const isMounted = ref(false)

  const entryScenario = ref('global')
  const isFromDeployment = computed(() => entryScenario.value === 'from-deployment')
  const isFromWorkload = computed(() => entryScenario.value === 'from-workload')

  const workloadCandidateDsIds = ref([])

  const scopedCandidateDsIds = ref([])

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
    Object.entries(resNames.value).forEach(([type, resourceId]) => add(type, resourceId))
    const activeResources = activeReleaseByDs.value[effDsId.value]?.resources ?? []
    activeResources.forEach((resource) => {
      const type = resource?.resource_type
      if (type && resNames.value[type] === undefined) {
        add(type, resource?.resource_id ?? resource?.global_id)
      }
    })
    Object.values(coll.value).forEach((byType) => {
      Object.entries(byType ?? {}).forEach(([type, instances]) => {
        ;(instances ?? []).forEach((instance) => add(type, instance?.resourceId))
      })
    })
    return pairs
  })

  const impact = useReleaseImpact({ selectedDsIds: deploymentIds })
  const impactReason = impact.degradationReason

  const composition = useReleaseComposition({
    selectedDsIds: deploymentIds,
    versionedResources,
    reverseLookupByDs: impact.reverseLookupByDs,
    impactLoading: impact.isLoading,
    impactFailed: computed(() => impact.degradationReason.value === 'fetch_failed'),
    resolveConsumingDeployments
  })

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

  const activeReleaseVersionForDs = (dsId, type) => {
    const match = (activeReleaseByDs.value[dsId]?.resources ?? []).find(
      (resource) => resource?.resource_type === type
    )
    return match?.version_id ?? match?.resource_version_id ?? match?.resource_version ?? null
  }

  const activeReleaseVersionFor = (type) => activeReleaseVersionForDs(effDsId.value, type)

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

  // scoped type; in the global flow the application (always) plus each enabled
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

  const DEPENDENCIES_LOADING_MESSAGES = {
    application: 'Detecting functions and connectors used by this application…',
    firewall: 'Detecting functions, network lists, and WAFs used by this firewall…',
    custom_page: 'Detecting connectors used by this custom page…'
  }

  const applicationDependenciesLoading = computed(
    () =>
      isApplicationComposed.value &&
      (versionReady.isLoading.value ||
        functionDeps.isLoading.value ||
        connectorDeps.isLoading.value)
  )
  const firewallDependenciesLoading = computed(
    () =>
      isFirewallComposed.value &&
      (firewallVersionReady.isLoading.value ||
        firewallFunctionDeps.isLoading.value ||
        firewallWafDeps.isLoading.value ||
        firewallNetworkListDeps.isLoading.value)
  )
  const customPageDependenciesLoading = computed(
    () =>
      isCustomPageComposed.value &&
      (customPageVersionReady.isLoading.value || customPageConnectorDeps.isLoading.value)
  )
  const DEPENDENCIES_LOADING_BY_TYPE = {
    application: applicationDependenciesLoading,
    firewall: firewallDependenciesLoading,
    custom_page: customPageDependenciesLoading
  }
  const dependenciesLoadingFor = (type) => DEPENDENCIES_LOADING_BY_TYPE[type]?.value ?? false
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
    composition.retryResourceVersions()
    composition.retryCatalogs()
  }

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

  watch(
    [activeReleaseByDs, effDsId, resVers, coll, () => store.versionsByResource],
    () => {
      if (!isFromDeployment.value) return
      store.seedVersionsFromRelease(effDsId.value)
    },
    { immediate: true, deep: true }
  )

  let entrySeq = 0

  const openFromRoute = () => {
    const seq = ++entrySeq

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

    const seedType = query.seedType ?? params.seedType ?? null
    const seed = seedType
      ? {
          type: seedType,
          resourceId: query.seedResourceId ?? params.seedResourceId ?? '',
          versionId: query.seedVersionId ?? params.seedVersionId ?? ''
        }
      : null

    const isPickTarget = String(query.pickTarget ?? params.pickTarget ?? '') === 'true'

    if (isFromVersion && incomingScopedType && resourceId) {
      candidateResolutionFailed.value = false
      Promise.resolve(
        composition.resolveConsumingDeployments({
          resource_type: incomingScopedType,
          resource_id: resourceId
        })
      )
        .then((result) => {
          if (seq !== entrySeq) return
          candidateResolutionFailed.value = false
          scopedCandidateDsIds.value = (result?.deployments ?? []).map((entry) =>
            String(entry.deploymentId)
          )
        })
        .catch(() => {
          if (seq !== entrySeq) return
          candidateResolutionFailed.value = true
          scopedCandidateDsIds.value = []
        })
    }

    // the above is the global "Deploy" entry (the user picks a DS first).
    entryScenario.value = incomingScopedType
      ? 'from-resource'
      : isPickTarget && preselectedDsIds.length
        ? 'from-workload'
        : preselectedDsIds.length
          ? 'from-deployment'
          : 'global'

    if (entryScenario.value === 'from-workload') {
      workloadCandidateDsIds.value = preselectedDsIds.map(String)
    }

    store.openRelease({
      fromVersion: isFromVersion,
      scopedType: incomingScopedType,
      versionId: query.versionId ?? params.versionId ?? '',
      resourceId,
      deploymentIds: incomingScopedType ? [] : preselectedDsIds,
      seed
    })

    composition.loadCatalog('application')
    OPTIONAL_SINGLETON_TYPES.forEach((type) => composition.loadCatalog(type))
  }

  onMounted(() => {
    openFromRoute()
    isMounted.value = true
  })

  watch(
    () => route.fullPath,
    () => {
      if (route.name !== RELEASE_COMPOSER_ROUTE) return
      openFromRoute()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  )

  const hasSelectedDs = computed(() => deploymentIds.value.length > 0)

  const isScoped = computed(() => Boolean(scopedType.value))

  const showComposition = computed(() => hasSelectedDs.value || isScoped.value)

  const deploymentName = computed(() => {
    const match = deployments.value.find((ds) => String(ds.id) === String(effDsId.value))
    return match?.name ?? ''
  })

  const breadcrumbItems = computed(() => {
    const items = route.meta?.breadCrumbs ?? []
    const name = deploymentName.value
    const dsId = effDsId.value
    if (!isFromDeployment.value || !name || dsId == null || dsId === '') return items
    return items.map((item) =>
      item.dynamic && item.routeParam
        ? {
            ...item,
            label: name,
            to: { name: 'deployments-edit', params: { id: String(dsId), tab: 'releases' } }
          }
        : item
    )
  })

  watch(breadcrumbItems, (items) => breadcrumbs.update(items), { immediate: true })

  //   Scenario B / global → the scoped resource (or "resources") + DS count.
  const versionGateLabel = computed(() =>
    scopedType.value && scopedType.value !== 'application'
      ? singularNounFor(scopedType.value)
      : 'application'
  )

  const noticeLabel = computed(() =>
    isScoped.value ? singularNounFor(scopedType.value) : 'selected resource'
  )

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

  const collectionsFor = (parentType) =>
    (OWNED_COLLECTIONS[parentType] ?? []).map((type) => {
      const meta = resolveResourceMeta(type)
      const label = labelFor(type)
      const instances = (coll.value[parentType]?.[type] ?? []).map((instance, index) => ({
        id: index,
        resourceId: instance.resourceId,
        name: composition.resourceNameFor(type, instance.resourceId) ?? label,
        nameService: composition.resourceListService(type),
        nameLoadService: composition.resourceLoadService(type),
        version: instance.version,
        versionOptions: composition.versionOptionsFor(type, instance.resourceId),
        locked: instance.locked,
        required: instance.required,
        buildRoute: resourceBuildRoute({ type, resourceId: instance.resourceId }),
        sharedWith: store
          .sharedDependencyParentsFor(type, instance.resourceId, parentType)
          .map((parent) => sharedParentLabel(parent))
      }))
      return {
        type,
        label,
        icon: meta.icon,
        count: instances.length,
        open: collOpen.value[`${parentType}:${type}`] !== false,
        instances
      }
    })

  const excludeUsedResourcesService = (type, ownResourceId) => async (params) => {
    const response = await composition.resourceListService(type)(params)
    const used = store.usedDependencyIds(type)
    if (ownResourceId != null) used.delete(String(ownResourceId))
    return {
      ...response,
      body: (Array.isArray(response?.body) ? response.body : []).filter(
        (option) => !used.has(String(option.id))
      )
    }
  }

  const additionalCollections = computed(() =>
    collectionsFor(ADDITIONAL_PARENT).map((collection) => ({
      ...collection,
      instances: collection.instances.map((instance) => ({
        ...instance,
        nameService: excludeUsedResourcesService(collection.type, instance.resourceId),
        required: instance.resourceId != null
      }))
    }))
  )

  const resourceHasNoReadyVersion = (resourceType, resourceId) => {
    if (resourceId == null || resourceId === '') return false
    const key = `${resourceType}:${resourceId}`
    return (
      key in composition.versionsByResource.value &&
      composition.versionOptionsFor(resourceType, resourceId).length === 0
    )
  }

  const resources = computed(() => {
    if (!showComposition.value) return []

    const scoped = isScoped.value
    const types = scoped ? [scopedType.value] : SINGLETON_TYPES

    return types.map((type) => {
      const meta = resolveResourceMeta(type)
      const isApp = type === 'application'
      const isScopedType = type === scopedType.value
      const editable = isScopedType || !scoped
      const canToggle = !isApp && !scoped
      const enabled = isApp || isScopedType ? true : resEnabled.value[type] !== false

      const base = activeReleaseResources.value[type] ?? { resourceId: null, version: null }
      const catalogOptions = composition.catalogOptionsFor(type)
      const fallbackResourceId = base.resourceId ?? catalogOptions[0]?.value ?? null
      const rawName = resNames.value[type] !== undefined ? resNames.value[type] : fallbackResourceId
      const matchedOption = catalogOptions.find(
        (option) => String(option.value) === String(rawName)
      )
      const name = matchedOption ? matchedOption.value : rawName
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
        versionRequired: enabled,
        readonly: !editable,
        canToggle,
        enabled,
        name,
        nameService: composition.resourceListService(type),
        nameLoadService: composition.resourceLoadService(type),
        version,
        versionOptions: composition.versionOptionsFor(type, rawName),
        isLoadingVersions: composition.isLoadingVersionsFor(type, rawName),
        buildRoute: resourceHasNoReadyVersion(type, rawName)
          ? resourceBuildRoute({ type, resourceId: rawName })
          : null,
        ownedCollections: owned,
        hasOwned: owned.length > 0,
        dependenciesLoading: dependenciesLoadingFor(type),
        dependenciesLoadingMessage: DEPENDENCIES_LOADING_MESSAGES[type],
        lockReason: 'Kept from the active release.'
      }
    })
  })

  const showDeploymentSettingsCard = computed(() => !isFromDeployment.value)

  watch(
    versionedResources,
    (pairs) => {
      ;(pairs ?? []).forEach(({ resourceType, resourceId }) =>
        composition.ensureResourceNames(resourceType, resourceId)
      )
    },
    { immediate: true, deep: true }
  )

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

  const onTreeResource = ({ type, value }) => store.setResName(type, value)
  const onTreeVersion = ({ type, value }) => store.setResVer(type, value)
  const toggleOptional = (type) => store.toggleResource(type)

  const onToggleGroup = ({ type, group }) => store.toggleCollOpen(type, group)
  const onInstanceResource = ({ type, group, id, value }) =>
    store.setCollResource({ parent: type, type: group, id, resourceId: value })
  const onInstanceVersion = ({ type, group, id, value }) => store.setCollVer(type, group, id, value)
  const onRemoveInstance = ({ type, group, id }) => store.removeCollItem(type, group, id)
  const onAddInstance = ({ type, group }) => {
    store.addCollItem({
      parent: type,
      type: group,
      item: { resourceId: null, version: LATEST_READY }
    })
    if (collOpen.value[`${type}:${group}`] === false) store.toggleCollOpen(type, group)
  }

  const onAdditionalToggle = (type) => store.toggleCollOpen(ADDITIONAL_PARENT, type)

  const onAdditionalAdd = (type) => {
    store.addCollItem({
      parent: ADDITIONAL_PARENT,
      type,
      item: { resourceId: null, version: null, required: true }
    })
    if (collOpen.value[`${ADDITIONAL_PARENT}:${type}`] === false) {
      store.toggleCollOpen(ADDITIONAL_PARENT, type)
    }
  }

  const onAdditionalResource = ({ type, id, value }) => {
    if (value != null) {
      const used = store.usedDependencyIds(type)
      const current = coll.value[ADDITIONAL_PARENT]?.[type]?.[id]?.resourceId
      if (current != null) used.delete(String(current))
      if (used.has(String(value))) {
        toast.add({
          severity: 'warn',
          summary: 'Already in this release',
          detail:
            'This resource is already a dependency. Select its version in the group that lists it.',
          life: 5000
        })
        return
      }
    }
    store.setCollResource({ parent: ADDITIONAL_PARENT, type, id, resourceId: value })
  }

  const onAdditionalVersion = ({ type, id, value }) =>
    store.setCollVer(ADDITIONAL_PARENT, type, id, value)

  const onAdditionalRemove = ({ type, id }) => store.removeCollItem(ADDITIONAL_PARENT, type, id)

  // const onCanaryEnabled = (value) => store.toggleCanary(value)
  // const onCanaryForm = (values) => store.setCanaryForm(values)

  const retryImpact = () => {
    impact.retry()
    composition.retryImpact()
  }

  const DS_DISPLAY_CAP = 10

  const dsQuery = ref('')
  const enrichedDeployments = computed(() => {
    const term = dsQuery.value.trim().toLowerCase()
    const candidateIds = isFromWorkload.value ? new Set(workloadCandidateDsIds.value) : null
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
      ...impact.dsMetaFor(ds.id)
    }))
  })

  const enrichedDeploymentIds = computed(() => enrichedDeployments.value.map((ds) => String(ds.id)))

  watch(enrichedDeploymentIds, (ids) => composition.ensureActiveReleases(ids), { immediate: true })

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
    const scopedToApplication = scopedType.value === 'application'
    const LABELS = {
      linked: 'Already using this resource',
      available: 'Not using this resource yet',
      needsFirstRelease: 'Needs a first release',
      loadFailed: "Couldn't load the active release"
    }
    const NOTICES = {
      needsFirstRelease: 'Create a full first release, including an application, to deploy here.',
      loadFailed: "Couldn't read the active release. Retry before deploying here."
    }
    const STATUS_TAGS = {
      needsFirstRelease: 'No active release yet'
    }
    const ACTIONS = {
      needsFirstRelease: { label: 'Create first release', icon: 'pi pi-arrow-right' },
      loadFailed: { label: 'Retry', icon: 'pi pi-refresh' }
    }
    const firstReleaseSelectableInScope = (key) =>
      key === 'needsFirstRelease' && scopedToApplication
    return groups.map((group) => {
      const selectable =
        firstReleaseSelectableInScope(group.key) || !NON_SELECTABLE_GROUPS.includes(group.key)
      return {
        key: group.key,
        label: LABELS[group.key],
        selectable,
        notice: selectable ? null : (NOTICES[group.key] ?? null),
        statusTag: STATUS_TAGS[group.key] ?? null,
        action: selectable ? null : (ACTIONS[group.key] ?? null),
        deployments: group.deployments
      }
    })
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

  const onComposeFirstRelease = (dsId) =>
    router.push(
      releaseComposerRouteFirstRelease({
        deploymentId: dsId,
        scopedType: scopedType.value,
        resourceId: store.resourceId,
        versionId: versionId.value
      })
    )

  const onGroupAction = ({ groupKey, dsId }) => {
    if (groupKey === 'loadFailed') {
      composition.retryActiveReleases()
      return
    }
    if (groupKey === 'needsFirstRelease') onComposeFirstRelease(dsId)
  }

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

  const versionsStillLoading = computed(() =>
    versionedResources.value.some((resource) =>
      composition.isLoadingVersionsFor(resource.resourceType, resource.resourceId)
    )
  )

  const resourcesMissingReadyVersion = computed(() =>
    versionedResources.value.filter((resource) =>
      resourceHasNoReadyVersion(resource.resourceType, resource.resourceId)
    )
  )

  const missingReadyVersionLabel = computed(() => {
    const first = resourcesMissingReadyVersion.value[0]
    return first ? singularNounFor(first.resourceType) : ''
  })

  const canBuildAndActivate = computed(
    () =>
      deployEnabled.value &&
      !blockingDs.value &&
      !versionsStillLoading.value &&
      !resourcesMissingReadyVersion.value.length
  )

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

  const surfaceOutcome = (outcome) => {
    const match = deployments.value.find((ds) => String(ds.id) === String(outcome.id))
    const name = match?.name ?? String(outcome.id)
    if (outcome.ok) {
      toast.add({ closable: true, severity: 'success', summary: 'Deploy started', detail: name })
      return
    }
    if (outcome.skipped) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'Deployment skipped',
        detail: `${name}: ${SKIP_MESSAGES[outcome.skipReason] ?? 'No reason reported.'}`
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
      summary: 'Deploy failed',
      detail: `${name}: ${
        error?.message ?? 'Retry, or check the release for a resource without a Ready version.'
      }`
    })
  }

  const confirmBuildAndActivate = async () => {
    confirmVisible.value = false
    const targetDsIds = deploymentIds.value.length
      ? deploymentIds.value
      : effDsId.value
        ? [effDsId.value]
        : []
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
    router.push({ name: 'deployments-list' })
  }
</script>

<template>
  <ContentBlock data-testid="release-composition__view">
    <template #heading>
      <div
        class="flex flex-col gap-[var(--spacing-1)]"
        data-testid="release-composition__heading"
      >
        <PageHeadingBlock page-title="Review and deploy" />
        <h1
          class="text-heading-md font-semibold text-[var(--text-color)]"
          data-testid="release-composition__heading-title"
        >
          Review and deploy
        </h1>
        <p
          class="text-body-sm text-[var(--text-color-secondary)]"
          data-testid="release-composition__heading-description"
        >
          Confirm which Deployment Settings receive this release and the version of each resource it
          carries, then review the impact before deploying.
        </p>
      </div>
    </template>

    <template #content>
      <div
        class="flex gap-[var(--spacing-6)] max-[880px]:flex-col max-[880px]:gap-[var(--spacing-5)]"
        data-testid="release-composition__grid"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-[var(--spacing-5)]">
          <section
            class="flex flex-col overflow-hidden rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)]"
            data-testid="release-composition__composition-card"
          >
            <div
              class="flex items-center gap-[var(--spacing-2)] border-b border-[var(--surface-border)] px-[var(--spacing-4)] py-[var(--spacing-3)]"
            >
              <span
                class="inline-flex h-[var(--spacing-7)] w-[var(--spacing-7)] items-center justify-center rounded-[var(--shape-elements)] text-[var(--text-color-secondary)]"
              >
                <i class="pi pi-sitemap" />
              </span>
              <h2 class="text-body-lg text-[var(--text-color)]">Deployment topology</h2>
            </div>

            <div class="flex flex-col gap-[var(--spacing-6)] p-[var(--spacing-4)]">
              <div
                v-if="showComposition"
                class="flex flex-col gap-[var(--spacing-3)]"
                data-testid="release-composition__composition"
              >
                <MessageCard
                  type="info"
                  data-testid="release-composition__scoped-notice"
                >
                  <template v-if="isFromDeployment">
                    This release applies to
                    {{ deploymentName || 'this deployment' }}
                    and reaches every environment bound to it. Review the impact before deploying.
                  </template>
                  <template v-else-if="isFromWorkload">
                    This workload is bound to
                    {{ workloadCandidateDsIds.length }}
                    Deployment Settings, one for each environment it runs in. Deselect the ones you
                    want to skip before deploying.
                  </template>
                  <template v-else>
                    Only the
                    {{ noticeLabel }}
                    version changes. Every selected Deployment Settings keeps its own topology and
                    policy, and gets a new release where only this resource is replaced.
                  </template>
                </MessageCard>

                <div
                  v-if="dependenciesError"
                  class="flex flex-col gap-[var(--spacing-2)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-50)] px-[var(--spacing-4)] py-[var(--spacing-3)]"
                  data-testid="release-composition__dependencies-error"
                >
                  <span
                    class="flex items-center gap-[var(--spacing-2)] text-body-sm text-[var(--text-color-secondary)]"
                  >
                    <i class="pi pi-exclamation-triangle text-[var(--warning-contrast)]" />
                    Couldn't detect the dependencies used by this application.
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

                <div
                  class="flex flex-col gap-[var(--spacing-3)] border-t border-[var(--surface-border)] pt-[var(--spacing-4)]"
                  data-testid="release-composition__additional"
                >
                  <div class="flex flex-col gap-[var(--spacing-1)]">
                    <span class="text-body-sm font-medium text-[var(--text-color)]">
                      Include dependencies
                    </span>
                    <span class="text-body-xs text-[var(--text-color-secondary)]">
                      Add connectors or network lists referenced dynamically by functions that
                      aren't detected automatically.
                    </span>
                  </div>
                  <ReleaseDependenciesSection
                    :collections="additionalCollections"
                    :allow-add="true"
                    @toggle-group="onAdditionalToggle"
                    @add-instance="onAdditionalAdd"
                    @update:instance-resource="onAdditionalResource"
                    @update:instance-version="onAdditionalVersion"
                    @remove-instance="onAdditionalRemove"
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            v-if="showDeploymentSettingsCard"
            class="flex flex-col overflow-hidden rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)]"
            data-testid="release-composition__deployment-settings-card"
          >
            <div
              class="flex items-center gap-[var(--spacing-2)] border-b border-[var(--surface-border)] px-[var(--spacing-4)] py-[var(--spacing-3)]"
            >
              <span
                class="inline-flex h-[var(--spacing-7)] w-[var(--spacing-7)] items-center justify-center rounded-[var(--shape-elements)] text-[var(--text-color-secondary)]"
              >
                <i class="pi pi-cog" />
              </span>
              <h2 class="text-body-lg text-[var(--text-color)]">Deployment Settings</h2>
            </div>

            <div class="flex flex-col gap-[var(--spacing-6)] p-[var(--spacing-4)]">
              <DeploymentSettingsPicker
                v-if="!isFromDeployment"
                :groups="deploymentGroups"
                :model-value="deploymentIds"
                :query="dsQuery"
                :is-loading-meta="impact.isLoading.value"
                :meta-unavailable="impactReason === 'fetch_failed'"
                @update:model-value="onPickDs"
                @update:query="dsQuery = $event"
                @bind-environment="onBindEnvironment"
                @group-action="onGroupAction"
              />

              <!--
              <CanaryStrategyField
                v-if="showComposition"
                :class="[
                  !isFromDeployment &&
                    'border-t border-[var(--surface-border)] pt-[var(--spacing-6)]'
                ]"
                @update:enabled="onCanaryEnabled"
                @update:form="onCanaryForm"
              />
              -->
            </div>
          </section>
        </div>

        <section
          class="sticky top-[calc(3.5rem+var(--spacing-4))] flex basis-[var(--container-md)] min-w-[var(--container-xs)] flex-col self-start overflow-hidden rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] max-[880px]:static max-[880px]:min-w-0 max-[880px]:basis-auto"
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
            <h2 class="text-body-lg text-[var(--text-color)]">Impact</h2>
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
        Deploy release creates a new release on every selected Deployment Settings and deploys it in
        a single action.
      </span>
      <div class="flex items-center justify-end gap-[var(--spacing-3)]">
        <span
          v-if="blockingDs && blockingDs.reason === 'degraded'"
          class="flex items-center gap-[var(--spacing-2)] text-body-xs text-[var(--text-color-secondary)]"
          data-testid="release-composition__footer-degraded"
        >
          Couldn't read the active release for {{ blockingDs.name }}. Retry before deploying.
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
          {{ blockingDs.name }} has no application. Add one to the release to deploy.
        </span>
        <span
          v-else-if="pendingDependencySelections.length"
          class="text-body-xs text-[var(--text-color-secondary)]"
          data-testid="release-composition__footer-pending-dependencies"
        >
          Select a version for each function and connector to deploy.
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
          v-else-if="resourcesMissingReadyVersion.length"
          class="text-body-xs text-[var(--text-color-secondary)]"
          data-testid="release-composition__footer-missing-version"
        >
          Build a Ready version of the {{ missingReadyVersionLabel }} to deploy.
        </span>
        <span
          v-else-if="!versionGateSatisfied"
          class="text-body-xs text-[var(--text-color-secondary)]"
          data-testid="release-composition__footer-confirm-version"
        >
          Confirm the {{ versionGateLabel }} version to deploy.
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
    header="Deploy this release?"
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
