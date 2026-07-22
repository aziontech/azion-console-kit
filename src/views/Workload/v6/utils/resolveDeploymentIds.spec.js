import { describe, expect, it } from 'vitest'
import { resolveDeploymentIds } from '@/views/Workload/v6/utils/resolveDeploymentIds'

describe('resolveDeploymentIds', () => {
  it('returns an empty array for missing or non-array input', () => {
    expect(resolveDeploymentIds()).toEqual([])
    expect(resolveDeploymentIds(null)).toEqual([])
    expect(resolveDeploymentIds({})).toEqual([])
    expect(resolveDeploymentIds([])).toEqual([])
  })

  it('collects the deployment id of each binding, preserving order', () => {
    const bindings = [
      { environment_id: 'env-prod', deployment_id: 'ds-prod' },
      { environment_id: 'env-stage', deployment_id: 'ds-stage' }
    ]
    expect(resolveDeploymentIds(bindings)).toEqual(['ds-prod', 'ds-stage'])
  })

  it('deduplicates repeated deployment ids across bindings', () => {
    const bindings = [
      { deployment_id: 'ds-prod' },
      { deployment_id: 'ds-prod' },
      { deployment_id: 'ds-stage' }
    ]
    expect(resolveDeploymentIds(bindings)).toEqual(['ds-prod', 'ds-stage'])
  })

  it('skips bindings with a null/undefined deployment id', () => {
    const bindings = [
      { deployment_id: null },
      { deployment_id: 'ds-stage' },
      { environment_id: 'env-x' }
    ]
    expect(resolveDeploymentIds(bindings)).toEqual(['ds-stage'])
  })

  it('stringifies ids and dedupes numeric/string duplicates', () => {
    const bindings = [{ deployment_id: 1 }, { deployment_id: '1' }, { deployment_id: 2 }]
    expect(resolveDeploymentIds(bindings)).toEqual(['1', '2'])
  })
})
