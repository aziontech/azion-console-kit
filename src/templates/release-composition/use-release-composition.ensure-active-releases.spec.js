/* eslint-env node */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'

const { deploymentsData, useDeploymentsListQuery, getActiveReleaseComposition, buildAndActivate } =
  await vi.hoisted(async () => {
    const { ref: hoistedRef } = await import('vue')
    const data = hoistedRef({ body: [] })
    return {
      deploymentsData: data,
      useDeploymentsListQuery: vi.fn(() => ({
        data,
        isLoading: hoistedRef(false),
        isError: hoistedRef(false),
        refetch: vi.fn()
      })),
      getActiveReleaseComposition: vi.fn(() => Promise.resolve(null)),
      buildAndActivate: vi.fn(() => Promise.resolve({}))
    }
  })

vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: { useDeploymentsListQuery }
}))

vi.mock('@/services/v2/deployment/deployment-release-service', () => ({
  deploymentReleaseService: { getActiveReleaseComposition, buildAndActivate }
}))

vi.mock('@/services/v2/deployment/resource-catalog-registry', () => ({
  RESOURCE_CATALOG_REGISTRY: {}
}))

import { useReleaseComposition } from './use-release-composition'

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

const idsCalled = () => getActiveReleaseComposition.mock.calls.map(([id]) => id)

describe('useReleaseComposition — ensureActiveReleases(ids)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deploymentsData.value = { body: [] }
    getActiveReleaseComposition.mockImplementation(() => Promise.resolve({ resources: [] }))
  })

  it('loads each not-yet-loaded id exactly once', async () => {
    const { ensureActiveReleases } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref([])
    })

    ensureActiveReleases(['a', 'b'])
    await flush()

    expect(getActiveReleaseComposition).toHaveBeenCalledTimes(2)
    expect(idsCalled()).toEqual(['a', 'b'])
  })

  it('does not re-fetch an id already loaded (idempotent)', async () => {
    const { ensureActiveReleases } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref([])
    })

    ensureActiveReleases(['a', 'b'])
    await flush()
    expect(getActiveReleaseComposition).toHaveBeenCalledTimes(2)

    ensureActiveReleases(['a', 'c'])
    await flush()

    expect(getActiveReleaseComposition).toHaveBeenCalledTimes(3)
    expect(idsCalled()).toEqual(['a', 'b', 'c'])
  })

  it('fires only once for duplicate ids within a single call', async () => {
    const { ensureActiveReleases } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref([])
    })

    ensureActiveReleases(['a', 'a', 'a'])
    await flush()

    expect(getActiveReleaseComposition).toHaveBeenCalledTimes(1)
    expect(idsCalled()).toEqual(['a'])
  })

  it('normalizes duplicate ids of mixed types (string vs number) to a single fetch', async () => {
    const { ensureActiveReleases } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref([])
    })

    ensureActiveReleases(['7', 7])
    await flush()

    expect(getActiveReleaseComposition).toHaveBeenCalledTimes(1)
  })

  it('isolates a per-id failure: the other ids still load and no unhandled rejection occurs', async () => {
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)

    getActiveReleaseComposition.mockImplementation((id) =>
      id === 'b' ? Promise.reject(new Error('boom')) : Promise.resolve({ resources: [] })
    )

    const { ensureActiveReleases, activeReleaseByDs } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref([])
    })

    ensureActiveReleases(['a', 'b', 'c'])
    await flush()

    expect(getActiveReleaseComposition).toHaveBeenCalledTimes(3)
    expect(idsCalled()).toEqual(['a', 'b', 'c'])
    expect(activeReleaseByDs.value.b).toBeNull()
    expect(activeReleaseByDs.value.a).toEqual({ resources: [] })
    expect(activeReleaseByDs.value.c).toEqual({ resources: [] })
    expect(unhandled).not.toHaveBeenCalled()

    process.off('unhandledRejection', unhandled)
  })

  it('is a no-op for an empty array', async () => {
    const { ensureActiveReleases } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref([])
    })

    ensureActiveReleases([])
    await flush()

    expect(getActiveReleaseComposition).not.toHaveBeenCalled()
  })

  it('is a no-op for non-array inputs', async () => {
    const { ensureActiveReleases } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref([])
    })

    ensureActiveReleases(undefined)
    ensureActiveReleases(null)
    ensureActiveReleases('a')
    ensureActiveReleases({ 0: 'a' })
    await flush()

    expect(getActiveReleaseComposition).not.toHaveBeenCalled()
  })
})
