import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { buildVersionListOptions } from '@/composables/versioning/use-version-list'

describe('buildVersionListOptions', () => {
  it('always exposes the state filter', () => {
    const { filters } = buildVersionListOptions()
    expect(filters.value.map((filter) => filter.key)).toEqual(['state'])
  })

  it('adds the traffic filter when there are active versions', () => {
    const activeVersions = ref(new Map([['V1', { deployments: [] }]]))
    const { filters } = buildVersionListOptions({ activeVersions })
    expect(filters.value.map((filter) => filter.key)).toEqual(['state', 'traffic'])
  })

  it('leaves the traffic filter out for an empty active map', () => {
    const activeVersions = ref(new Map())
    const { filters } = buildVersionListOptions({ activeVersions })
    expect(filters.value.map((filter) => filter.key)).toEqual(['state'])
  })

  it('exposes the three sort options in order', () => {
    const { sortOptions } = buildVersionListOptions()
    expect(sortOptions.map((option) => option.value)).toEqual([
      'lastModified-desc',
      'createdAt-asc',
      'state-asc'
    ])
  })

  it('prefixes the state filter options with an All Status entry', () => {
    const { filters } = buildVersionListOptions()
    const stateFilter = filters.value.find((filter) => filter.key === 'state')
    expect(stateFilter.options[0]).toEqual({ label: 'All Status', value: null })
  })
})
