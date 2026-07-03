/**
 * Load-failure semantics inside `useReleaseComposition` (robustness fixes).
 *
 * Fix 1 — a FAILED active-release read is recorded distinctly from a genuine
 *   "no release": `activeReleaseErrorByDs[dsId]` flags it, `activeReleaseByDs`
 *   stays `null`, and `retryActiveReleases()` re-attempts and clears the flag.
 *
 * Fix 2 — a FAILED version/catalog load is NOT cached as an empty result (which
 *   would look like "no versions exist" forever): the key is absent, an error
 *   flag is set, the reactive watcher does NOT auto-retry, and the explicit
 *   `retryResourceVersions()` / `retryCatalogs()` recover it.
 *
 * Only the IO seams are mocked; the composable runs for real.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: { useDeploymentsListQuery: vi.fn() }
}))
vi.mock('@/services/v2/deployment/deployment-release-service', () => ({
  deploymentReleaseService: { getActiveReleaseComposition: vi.fn(), buildAndActivate: vi.fn() }
}))

// A registry with a single controllable `listVersions` / `listCatalog` for the
// `application` type, so the version + catalog loaders can be driven to fail/recover.
const listVersionsMock = vi.fn()
const listCatalogMock = vi.fn()
vi.mock('@/services/v2/deployment/resource-catalog-registry', () => ({
  RESOURCE_CATALOG_REGISTRY: {
    application: {
      listVersions: (...args) => listVersionsMock(...args),
      listCatalog: (...args) => listCatalogMock(...args)
    }
  }
}))

import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { useReleaseComposition } from '@/templates/release-composition/use-release-composition'

const queryStub = (body = []) => ({
  data: ref({ body }),
  isLoading: ref(false),
  isError: ref(false),
  refetch: vi.fn()
})

beforeEach(() => {
  deploymentService.useDeploymentsListQuery.mockReturnValue(queryStub([]))
  deploymentReleaseService.getActiveReleaseComposition.mockReset()
  listVersionsMock.mockReset()
  listCatalogMock.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('active-release read failure (Fix 1)', () => {
  it('flags the DS on read failure, keeps its release null, and retry clears + reloads it', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockRejectedValueOnce(new Error('boom'))

    const composition = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([])
    })
    await flushPromises()

    // Failure recorded distinctly: flag true, but the composition stays null (not
    // fabricated) so downstream readers still work.
    expect(composition.activeReleaseErrorByDs.value['ds-1']).toBe(true)
    expect(composition.activeReleaseByDs.value['ds-1']).toBeNull()

    // Retry: the read now succeeds → flag cleared, real release loaded.
    const release = { resources: [{ resource_type: 'application', global_id: 'app-1' }] }
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValueOnce(release)

    composition.retryActiveReleases()
    await flushPromises()

    expect(composition.activeReleaseErrorByDs.value['ds-1']).toBe(false)
    expect(composition.activeReleaseByDs.value['ds-1']).toEqual(release)
  })

  it('a genuine no-release (resolved null) is NOT flagged as an error', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(null)

    const composition = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([])
    })
    await flushPromises()

    expect(composition.activeReleaseByDs.value['ds-1']).toBeNull()
    expect(composition.activeReleaseErrorByDs.value['ds-1']).toBeFalsy()
  })
})

describe('version-load failure (Fix 2)', () => {
  const appVersioned = ref([{ resourceType: 'application', resourceId: 'app-1' }])

  it('does not cache an empty result on failure and does NOT auto-retry', async () => {
    listVersionsMock.mockRejectedValue(new Error('versions down'))

    const composition = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: appVersioned
    })
    await flushPromises()

    // Error flagged; NO empty entry cached (so it is not read as "no versions").
    expect(composition.hasAnyVersionsError.value).toBe(true)
    expect(composition.hasVersionsErrorFor('application', 'app-1')).toBe(true)
    expect(composition.versionOptionsFor('application', 'app-1')).toEqual([])
    expect('application:app-1' in composition.versionsByResource.value).toBe(false)

    const callsAfterFirst = listVersionsMock.mock.calls.length
    // The reactive watcher must NOT keep retrying on its own.
    await flushPromises()
    expect(listVersionsMock.mock.calls.length).toBe(callsAfterFirst)
  })

  it('retryResourceVersions() clears the error and reloads', async () => {
    listVersionsMock.mockRejectedValueOnce(new Error('versions down'))

    const composition = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: appVersioned
    })
    await flushPromises()
    expect(composition.hasAnyVersionsError.value).toBe(true)

    listVersionsMock.mockResolvedValueOnce([{ id: 'v1', state: 'ready' }])
    composition.retryResourceVersions()
    await flushPromises()

    expect(composition.hasAnyVersionsError.value).toBe(false)
    expect(composition.versionOptionsFor('application', 'app-1').length).toBeGreaterThan(0)
  })
})

describe('catalog-load failure (Fix 2)', () => {
  it('flags a catalog error without caching empty, and retryCatalogs() recovers', async () => {
    listCatalogMock.mockRejectedValueOnce(new Error('catalog down'))

    const composition = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([])
    })
    await flushPromises()

    await composition.loadCatalog('application')
    await flushPromises()

    expect(composition.hasAnyCatalogError.value).toBe(true)
    expect(composition.catalogOptionsFor('application')).toEqual([])

    listCatalogMock.mockResolvedValueOnce([{ id: 'app-1', name: 'App One' }])
    composition.retryCatalogs()
    await flushPromises()

    expect(composition.hasAnyCatalogError.value).toBe(false)
    expect(composition.catalogOptionsFor('application')).toEqual([
      { label: 'App One', value: 'app-1' }
    ])
  })
})
