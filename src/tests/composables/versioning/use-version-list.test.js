import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useVersionList } from '@/composables/versioning/use-version-list'

const versions = [
  { id: 'V1', state: 'ready', createdAt: '2024-01-02' },
  { id: 'V2', state: 'ready', createdAt: '2024-01-01' }
]

describe('useVersionList — activeTraffic enrichment', () => {
  it('adds activeTraffic to the matching item and null to the rest', () => {
    const activeVersions = ref(
      new Map([['V1', { deployments: [{ id: 'D1', name: 'prod', trafficRole: 'ACTIVE' }] }]])
    )

    const { items } = useVersionList(ref(versions), { activeVersions })
    const byId = Object.fromEntries(items.value.map((item) => [item.id, item]))

    expect(byId.V1.activeTraffic).toEqual({
      deployments: [{ id: 'D1', name: 'prod', trafficRole: 'ACTIVE' }]
    })
    expect(byId.V2.activeTraffic).toBeNull()
  })

  it('leaves items untouched when the map is empty', () => {
    const { items } = useVersionList(ref(versions), { activeVersions: ref(new Map()) })
    expect(items.value.every((item) => !('activeTraffic' in item))).toBe(true)
  })

  it('works without the activeVersions option', () => {
    const { items } = useVersionList(ref(versions))
    expect(items.value).toHaveLength(2)
    expect(items.value.every((item) => !('activeTraffic' in item))).toBe(true)
  })
})

describe('useVersionList — traffic filter', () => {
  const makeActive = () =>
    ref(new Map([['V1', { deployments: [{ id: 'D1', name: 'prod', trafficRole: 'ACTIVE' }] }]]))

  it('exposes the traffic filter only when there are active versions', () => {
    const withActive = useVersionList(ref(versions), { activeVersions: makeActive() })
    expect(withActive.filters.value.some((filter) => filter.key === 'traffic')).toBe(true)

    const withoutActive = useVersionList(ref(versions), { activeVersions: ref(new Map()) })
    expect(withoutActive.filters.value.some((filter) => filter.key === 'traffic')).toBe(false)
  })

  it('keeps only versions receiving traffic when the filter is active', () => {
    const { items, filterValues } = useVersionList(ref(versions), { activeVersions: makeActive() })
    filterValues.value = { ...filterValues.value, traffic: 'active' }
    expect(items.value.map((item) => item.id)).toEqual(['V1'])
  })

  it('shows every version when the traffic filter is cleared', () => {
    const { items, filterValues } = useVersionList(ref(versions), { activeVersions: makeActive() })
    filterValues.value = { ...filterValues.value, traffic: null }
    expect(items.value.map((item) => item.id).sort()).toEqual(['V1', 'V2'])
  })
})
