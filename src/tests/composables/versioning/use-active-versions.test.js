import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

const listResourceUsage = vi.fn()

vi.mock('@/services/v2/deployment/resource-usage-service', () => ({
  resourceUsageService: {
    listResourceUsage: (...args) => listResourceUsage(...args)
  }
}))

import { useActiveVersions } from '@/composables/versioning/use-active-versions'

const wafRow = (deploymentId, name, version, trafficRole) => ({
  deployment_id: deploymentId,
  name,
  resources: [
    { resource_type: 'waf', resource_id: 7, resource_version: version, traffic_role: trafficRole }
  ]
})

describe('useActiveVersions', () => {
  beforeEach(() => listResourceUsage.mockReset())

  it('fetches once and exposes the active-version map', async () => {
    listResourceUsage.mockResolvedValue({ body: [wafRow('D1', 'prod', 'V1', 'ACTIVE')], count: 1 })

    const { activeVersions, isActive } = useActiveVersions(
      ref({ resourceType: 'waf', resourceId: 7 })
    )
    await flushPromises()

    expect(listResourceUsage).toHaveBeenCalledTimes(1)
    expect(isActive('V1')).toBe(true)
    expect(activeVersions.value.get('V1').deployments[0].name).toBe('prod')
  })

  it('aggregates across pages until the reported count is reached', async () => {
    // Mirror the real service signature (`params = {}`): stay tolerant of an
    // argument-less invocation (the runner's post-test cleanup calls the spy with
    // no args) instead of destructuring a possibly-undefined param.
    listResourceUsage.mockImplementation((params = {}) =>
      params.page === 1
        ? Promise.resolve({ body: [wafRow('D1', 'a', 'V1', 'ACTIVE')], count: 2 })
        : Promise.resolve({ body: [wafRow('D2', 'b', 'V2', 'VALID_URL')], count: 2 })
    )

    const { activeVersions } = useActiveVersions(ref({ resourceType: 'waf', resourceId: 7 }))
    await flushPromises()

    expect(listResourceUsage).toHaveBeenCalledTimes(2)
    expect([...activeVersions.value.keys()].sort()).toEqual(['V1', 'V2'])
  })

  it('refresh re-fetches with skipCache', async () => {
    listResourceUsage.mockResolvedValue({ body: [], count: 0 })

    const { refresh } = useActiveVersions(ref({ resourceType: 'waf', resourceId: 7 }))
    await flushPromises()
    listResourceUsage.mockClear()

    await refresh()
    expect(listResourceUsage).toHaveBeenCalledWith(expect.objectContaining({ skipCache: true }))
  })

  it('stays empty and skips the request when the ref is incomplete', async () => {
    const { activeVersions } = useActiveVersions(ref({ resourceType: 'waf', resourceId: null }))
    await flushPromises()

    expect(listResourceUsage).not.toHaveBeenCalled()
    expect(activeVersions.value.size).toBe(0)
  })
})
