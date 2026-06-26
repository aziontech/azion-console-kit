import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/services/v2/workload/workload-service', () => ({
  workloadService: { useWorkloadsListQuery: vi.fn() }
}))
vi.mock('@/services/v2/deployment/deployment-release-service', () => ({
  deploymentReleaseService: {
    getActiveReleaseComposition: vi.fn(),
    buildAndActivate: vi.fn()
  }
}))
vi.mock('@/services/v2/environment/environment-service', () => ({
  environmentService: { useEnvironmentsListQuery: vi.fn() }
}))
vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: { useDeploymentsListQuery: vi.fn() }
}))
vi.mock('@/services/v2/deploy-drawer/deploy-drawer-service', () => ({
  deployDrawerService: {
    loadWorkloadEnvironments: vi.fn(),
    enrichReleases: vi.fn(),
    resolveResourceName: vi.fn().mockResolvedValue(null)
  }
}))
vi.mock('@/services/v2/edge-app/edge-app-service', () => ({
  edgeAppService: { listEdgeApplicationsService: vi.fn() }
}))
vi.mock('@/services/v2/edge-app/edge-app-version-service', () => ({
  edgeAppVersionService: { listVersions: vi.fn() }
}))
// Catalog registry is only exercised by the workload-first editable rows;
// stub it so firewall/custom_page catalogs and versions are deterministic.
vi.mock('@/services/v2/deployment/resource-catalog-registry', () => ({
  RESOURCE_CATALOG_REGISTRY: {
    application: {
      versioned: true,
      listCatalog: vi.fn().mockResolvedValue([]),
      listVersions: vi.fn().mockResolvedValue([])
    },
    firewall: {
      versioned: true,
      listCatalog: vi.fn().mockResolvedValue([{ id: 7, name: 'My Firewall' }]),
      listVersions: vi.fn().mockResolvedValue([{ id: 'fw-1', state: 'ready' }])
    },
    custom_page: {
      versioned: true,
      listCatalog: vi.fn().mockResolvedValue([{ id: 5, name: 'Pages' }]),
      listVersions: vi.fn().mockResolvedValue([{ id: 'cp-1', state: 'ready' }])
    }
  },
  isVersionedResourceType: (type) => ['application', 'firewall', 'custom_page'].includes(type)
}))

import { workloadService } from '@/services/v2/workload/workload-service'
import { environmentService } from '@/services/v2/environment/environment-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { deployDrawerService } from '@/services/v2/deploy-drawer/deploy-drawer-service'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
import { RESOURCE_CATALOG_REGISTRY } from '@/services/v2/deployment/resource-catalog-registry'
import { useDeployDrawer, LATEST_READY } from '@/composables/deploy/use-deploy-drawer'

const WORKLOAD_ID = 'wl-1'
const ENVIRONMENT_ID = 'env-1'
const DEPLOYMENT_ID = 'dep-1'

const APP_CONTEXT = {
  resourceType: 'application',
  resourceId: 42,
  resourceName: 'My App',
  version: { id: 'v-ready' },
  versions: [{ label: 'v-ready', value: 'v-ready' }]
}

const FIREWALL_CONTEXT = {
  resourceType: 'firewall',
  resourceId: 7,
  resourceName: 'My Firewall',
  version: { id: 'fw-ready' },
  versions: [{ label: 'fw-ready', value: 'fw-ready' }]
}

const queryStub = (body) => ({
  data: ref({ body }),
  isLoading: ref(false),
  isError: ref(false),
  refetch: vi.fn()
})

const APP_RESOURCE = {
  resource_type: 'application',
  resource_id: 99,
  resource_name: 'Catalog App',
  resource_version_id: 'app-live'
}

// `vi.clearAllMocks()` (afterEach) wipes the `mockResolvedValue` baked into the
// module-mock above, so the catalog registry stubs must be re-seeded per test;
// otherwise `listVersions`/`listCatalog` resolve to `undefined` from the second
// test onward and `resolveLatestVersion` collapses to `null`.
const wireCatalogRegistry = () => {
  RESOURCE_CATALOG_REGISTRY.application.listCatalog.mockResolvedValue([])
  RESOURCE_CATALOG_REGISTRY.application.listVersions.mockResolvedValue([])
  RESOURCE_CATALOG_REGISTRY.firewall.listCatalog.mockResolvedValue([{ id: 7, name: 'My Firewall' }])
  RESOURCE_CATALOG_REGISTRY.firewall.listVersions.mockResolvedValue([
    { id: 'fw-1', state: 'ready' }
  ])
  RESOURCE_CATALOG_REGISTRY.custom_page.listCatalog.mockResolvedValue([{ id: 5, name: 'Pages' }])
  RESOURCE_CATALOG_REGISTRY.custom_page.listVersions.mockResolvedValue([
    { id: 'cp-1', state: 'ready' }
  ])
}

// `policy` drives single/versioned derivation; `loadWorkloadEnvironments`
// returns the card the composable reads through `selectedEnvironmentCard`.
const wireListings = (policy = 'single_version') => {
  workloadService.useWorkloadsListQuery.mockReturnValue(
    queryStub([{ id: WORKLOAD_ID, name: 'Workload' }])
  )
  environmentService.useEnvironmentsListQuery.mockReturnValue(queryStub([]))
  deploymentService.useDeploymentsListQuery.mockReturnValue(queryStub([]))
  deployDrawerService.loadWorkloadEnvironments.mockResolvedValue([
    {
      id: ENVIRONMENT_ID,
      name: 'Production',
      policy,
      policyLabel: 'Single Version',
      deploymentId: DEPLOYMENT_ID,
      deploymentName: 'Deployment',
      activeRelease: null,
      activeReleaseName: null,
      consumes: false,
      workloadCount: null
    }
  ])
  deployDrawerService.enrichReleases.mockImplementation((cards) => Promise.resolve(cards))
  edgeAppService.listEdgeApplicationsService.mockResolvedValue({
    body: [{ id: 99, name: { text: 'Catalog App' } }],
    count: 1
  })
  edgeAppVersionService.listVersions.mockResolvedValue([
    { id: 'app-new', version: 'NEW', state: 'ready' },
    { id: 'app-draft', version: 'DRAFT', state: 'draft' }
  ])
}

const selectThroughToDeployment = async (drawer) => {
  drawer.selectedWorkloadId.value = WORKLOAD_ID
  await flushPromises()
  drawer.selectedEnvironmentId.value = ENVIRONMENT_ID
  await flushPromises()
}

beforeEach(() => {
  wireListings()
  wireCatalogRegistry()
  deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(null)
  deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: {} })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useDeployDrawer - case derivation and editability', () => {
  it('Case 2 (single, no release): application slot is editable, sourced from catalog', async () => {
    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.applicationReadOnly.value).toBe(false)
    expect(drawer.composition.value.applicationSlot.editable).toBe(true)
    expect(drawer.applicationOptions.value).toEqual([{ label: 'Catalog App', value: 99 }])
    expect(drawer.composition.value.scopedSlot.resourceType).toBe('firewall')
  })

  it('Case 3 (single, deployed, scoped is not application): application slot is read-only', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [APP_RESOURCE]
    })

    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.applicationReadOnly.value).toBe(true)
    expect(drawer.composition.value.applicationSlot.editable).toBe(false)
    expect(drawer.composition.value.applicationSlot.resourceId).toBe(99)
    expect(drawer.composition.value.applicationSlot.versionId).toBe('app-live')
    expect(drawer.composition.value.scopedSlot.editable).toBe(true)
  })

  it('Case 4 (versioned, no release): application slot stays editable', async () => {
    wireListings('versioned_urls')
    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.applicationReadOnly.value).toBe(false)
    expect(drawer.composition.value.applicationSlot.editable).toBe(true)
  })

  it('Case 5 (versioned, with release): application stays editable but prefilled', async () => {
    wireListings('versioned_urls')
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [APP_RESOURCE]
    })

    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.applicationReadOnly.value).toBe(false)
    expect(drawer.composition.value.applicationSlot.editable).toBe(true)
    expect(drawer.selectedApplicationId.value).toBe(99)
  })

  it('scoped is application: single deployed keeps the application editable (req 4.4)', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [{ resource_type: 'application', resource_id: 42, resource_version_id: 'v-live' }]
    })

    const drawer = useDeployDrawer(APP_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.isScopedApplication.value).toBe(true)
    expect(drawer.applicationReadOnly.value).toBe(false)
    expect(drawer.composition.value.applicationSlot.editable).toBe(true)
    expect(drawer.composition.value.scopedSlot).toBeNull()
  })
})

describe('useDeployDrawer - noApplication (Case 1) and canDeploy', () => {
  it('blocks deploy when the editable catalog is empty', async () => {
    edgeAppService.listEdgeApplicationsService.mockResolvedValue({ body: [], count: 0 })

    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.noApplication.value).toBe(true)
    expect(drawer.composition.value.applicationSlot).toBeNull()
    expect(drawer.canDeploy.value).toBe(false)
  })

  it('blocks deploy when the read-only release carries no application (falls back to Case 1)', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [{ resource_type: 'firewall', resource_id: 7, resource_version_id: 'fw-1' }]
    })

    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.applicationReadOnly.value).toBe(true)
    expect(drawer.noApplication.value).toBe(true)
    expect(drawer.canDeploy.value).toBe(false)
  })

  it('allows deploy once application + scoped versions are present', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [APP_RESOURCE]
    })

    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.noApplication.value).toBe(false)
    expect(drawer.canDeploy.value).toBe(true)
  })

  it('blocks deploy while a release limit is reported', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [APP_RESOURCE]
    })

    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    drawer.atReleaseLimit.value = true
    await nextTick()

    expect(drawer.canDeploy.value).toBe(false)
  })
})

describe('useDeployDrawer - deploy payload per case', () => {
  it('Case 3: payload carries the current application plus the new scoped version', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [APP_RESOURCE]
    })

    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    await drawer.deploy()

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledWith(
      DEPLOYMENT_ID,
      expect.objectContaining({
        resources: [
          { global_id: 99, version_id: 'app-live', resource_type: 'application' },
          { resource_id: 7, version_id: 'fw-ready', resource_type: 'firewall' }
        ]
      })
    )
  })

  it('Cases 2/4/5: payload uses the selected application and version', async () => {
    wireListings('versioned_urls')
    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    drawer.selectedApplicationId.value = 99
    await flushPromises()
    drawer.selectedApplicationVersionId.value = 'app-new'
    await nextTick()

    await drawer.deploy()

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledWith(
      DEPLOYMENT_ID,
      expect.objectContaining({
        resources: [
          { global_id: 99, version_id: 'app-new', resource_type: 'application' },
          { resource_id: 7, version_id: 'fw-ready', resource_type: 'firewall' }
        ]
      })
    )
  })

  it('scoped is application: a single application item (no duplication, retrocompat)', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [{ resource_type: 'application', resource_id: 42, resource_version_id: 'v-live' }]
    })

    const drawer = useDeployDrawer(APP_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.canDeploy.value).toBe(true)

    await drawer.deploy()

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(1)
    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledWith(
      DEPLOYMENT_ID,
      expect.objectContaining({
        resources: [{ global_id: 42, version_id: 'v-ready', resource_type: 'application' }]
      })
    )
  })

  it('carries the active release other resources as read-only into the payload', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [
        APP_RESOURCE,
        {
          resource_type: 'custom_page',
          resource_id: 5,
          resource_version_id: 'cp-1',
          resource_name: 'Pages'
        }
      ]
    })

    const drawer = useDeployDrawer(FIREWALL_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.readOnlyResources.value).toEqual([
      { resourceType: 'custom_page', resourceId: 5, resourceName: 'Pages', resourceVersion: 'cp-1' }
    ])

    await drawer.deploy()

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledWith(
      DEPLOYMENT_ID,
      expect.objectContaining({
        resources: [
          { global_id: 99, version_id: 'app-live', resource_type: 'application' },
          { resource_id: 7, version_id: 'fw-ready', resource_type: 'firewall' },
          { resource_id: 5, version_id: 'cp-1', resource_type: 'custom_page' }
        ]
      })
    )
  })
})

describe('useDeployDrawer - composition degradation (Property P4)', () => {
  it('does not block the application=scoped baseline when the release fetch fails', async () => {
    const error = new Error('boom')
    deploymentReleaseService.getActiveReleaseComposition.mockRejectedValue(error)

    const drawer = useDeployDrawer(APP_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.compositionError.value).toBe(error)
    expect(drawer.readOnlyResources.value).toEqual([])
    expect(drawer.canDeploy.value).toBe(true)
  })

  it('still dispatches the single application baseline after a release fetch failure', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockRejectedValue(new Error('boom'))

    const drawer = useDeployDrawer(APP_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    await drawer.deploy()

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledWith(
      DEPLOYMENT_ID,
      expect.objectContaining({
        resources: [{ global_id: 42, version_id: 'v-ready', resource_type: 'application' }]
      })
    )
    expect(drawer.isDeploying.value).toBe(false)
  })

  it('propagates the API error without losing form state', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [{ resource_type: 'application', resource_id: 42, resource_version_id: 'v-live' }]
    })
    const apiError = new Error('422')
    deploymentReleaseService.buildAndActivate.mockRejectedValue(apiError)

    const drawer = useDeployDrawer(APP_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    await expect(drawer.deploy()).rejects.toBe(apiError)
    expect(drawer.deployError.value).toBe(apiError)
    expect(drawer.isDeploying.value).toBe(false)
    expect(drawer.selectedEnvironmentId.value).toBe(ENVIRONMENT_ID)
  })
})

describe('useDeployDrawer - track latest Ready sentinel', () => {
  const CONTEXT_WITH_READY = {
    ...APP_CONTEXT,
    version: { id: 'v-current' },
    versions: [
      { id: 'v-new', value: 'v-new', label: 'NEW', isCurrent: false },
      { id: 'v-current', value: 'v-current', label: 'CUR', isCurrent: true }
    ]
  }

  it('resolves LATEST to the current Ready option at dispatch time', async () => {
    const drawer = useDeployDrawer(CONTEXT_WITH_READY, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    drawer.selectedVersionId.value = LATEST_READY
    await nextTick()

    expect(drawer.resolvedVersionId.value).toBe('v-current')

    await drawer.deploy()

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledWith(
      DEPLOYMENT_ID,
      expect.objectContaining({
        resources: [{ global_id: 42, version_id: 'v-current', resource_type: 'application' }]
      })
    )
  })

  it('keeps a pinned id distinct from the sentinel', async () => {
    const drawer = useDeployDrawer(CONTEXT_WITH_READY, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    drawer.selectedVersionId.value = 'v-new'
    await nextTick()

    expect(drawer.resolvedVersionId.value).toBe('v-new')
  })
})

describe('useDeployDrawer - canary', () => {
  it('omits a strategy when canary is disabled', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [{ resource_type: 'application', resource_id: 42, resource_version_id: 'v-live' }]
    })

    const drawer = useDeployDrawer(APP_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    await drawer.deploy()

    expect(deploymentReleaseService.buildAndActivate.mock.calls[0][1]).not.toHaveProperty(
      'strategy'
    )
  })

  it('attaches a GRADUAL strategy only when canary is enabled', async () => {
    const drawer = useDeployDrawer(APP_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    drawer.setCanaryEnabled(true)
    drawer.setCanaryForm({
      rollout_mode: 'GRADUAL',
      gradual_rollout_candidate_percentage: 20
    })
    await nextTick()

    await drawer.deploy()

    const payload = deploymentReleaseService.buildAndActivate.mock.calls[0][1]
    expect(payload.strategy.rollout_mode).toBe('GRADUAL')
    expect(payload.strategy.gradual_rollout.enabled).toBe(true)
    expect(payload.strategy.gradual_rollout.candidate_percentage).toBe(20)
  })
})

describe('useDeployDrawer - workload-first composition (application + firewall + custom_page)', () => {
  // No scoped resource → workload-first mode (opened from Workload/Deployment).
  const WORKLOAD_FIRST_CONTEXT = {}

  const selectApplication = async (drawer) => {
    drawer.selectedApplicationId.value = 99
    await flushPromises()
    drawer.selectedApplicationVersionId.value = 'app-new'
    await nextTick()
  }

  it('always offers firewall + custom_page as optional rows, empty without an active release', async () => {
    const drawer = useDeployDrawer(WORKLOAD_FIRST_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    expect(drawer.hasScopedResource.value).toBe(false)
    expect(drawer.editableResourceCards.value.map((card) => card.resourceType)).toEqual([
      'firewall',
      'custom_page'
    ])
    expect(drawer.editableResourceCards.value.every((card) => card.optional)).toBe(true)
    expect(drawer.editableResourceCards.value.every((card) => card.selectedId == null)).toBe(true)
  })

  it('pre-fills firewall + custom_page from the active release and drops unsupported types', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [
        APP_RESOURCE,
        { resource_type: 'firewall', resource_id: 7, resource_version_id: 'fw-1' },
        { resource_type: 'custom_page', resource_id: 5, resource_version_id: 'cp-1' },
        { resource_type: 'function', resource_id: 3, resource_version_id: 'fn-1' }
      ]
    })

    const drawer = useDeployDrawer(WORKLOAD_FIRST_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)

    const cards = drawer.editableResourceCards.value
    expect(cards.map((card) => card.resourceType)).toEqual(['firewall', 'custom_page'])
    expect(cards.find((card) => card.resourceType === 'firewall')).toMatchObject({
      selectedId: 7,
      selectedVersionId: 'fw-1'
    })
    expect(cards.find((card) => card.resourceType === 'custom_page')).toMatchObject({
      selectedId: 5,
      selectedVersionId: 'cp-1'
    })
    expect(cards.some((card) => card.resourceType === 'function')).toBe(false)
  })

  it('deploys application alone when the optional rows are left empty', async () => {
    const drawer = useDeployDrawer(WORKLOAD_FIRST_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)
    await selectApplication(drawer)

    expect(drawer.canDeploy.value).toBe(true)

    await drawer.deploy()

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledWith(
      DEPLOYMENT_ID,
      expect.objectContaining({
        resources: [{ global_id: 99, version_id: 'app-new', resource_type: 'application' }]
      })
    )
  })

  it('includes a filled optional resource and skips the empty one in the payload', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      resources: [{ resource_type: 'firewall', resource_id: 7, resource_version_id: 'fw-1' }]
    })

    const drawer = useDeployDrawer(WORKLOAD_FIRST_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)
    await selectApplication(drawer)

    await drawer.deploy()

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledWith(
      DEPLOYMENT_ID,
      expect.objectContaining({
        resources: [
          { global_id: 99, version_id: 'app-new', resource_type: 'application' },
          { resource_id: 7, version_id: 'fw-1', resource_type: 'firewall' }
        ]
      })
    )
  })

  it('resolves the "latest" sentinel to a concrete version_id for an optional resource', async () => {
    const drawer = useDeployDrawer(WORKLOAD_FIRST_CONTEXT, { visible: ref(true) })
    await selectThroughToDeployment(drawer)
    await selectApplication(drawer)

    drawer.setEditableResourceId('firewall', 7)
    await flushPromises()
    drawer.setEditableResourceVersion('firewall', LATEST_READY)
    await nextTick()

    await drawer.deploy()

    const payload = deploymentReleaseService.buildAndActivate.mock.calls.at(-1)[1]
    const firewall = payload.resources.find((resource) => resource.resource_type === 'firewall')
    expect(firewall).toEqual({ resource_id: 7, version_id: 'fw-1', resource_type: 'firewall' })
    expect(firewall.version_id).not.toBe(LATEST_READY)
  })
})
