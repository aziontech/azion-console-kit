import { describe, it, expect } from 'vitest'
import { WorkloadVersionAdapter } from '@/services/v2/workload/workload-version-adapter'

describe('WorkloadVersionAdapter.transformListVersions', () => {
  it('normalizes a raw array into the shared version UI shape', () => {
    const raw = [
      {
        id: 12345,
        version_id: 'AY2JRCD3',
        version: 1,
        state: 'ready',
        last_editor: 'user@azion.com',
        created_at: '2026-06-16T10:30:00Z',
        ready_at: '2026-06-16T10:35:00Z',
        description: 'first'
      }
    ]

    const { count, body } = WorkloadVersionAdapter.transformListVersions(raw)

    expect(count).toBe(1)
    expect(body[0]).toMatchObject({
      id: 'AY2JRCD3',
      state: 'ready',
      version: 1,
      comment: 'first',
      createdAt: '2026-06-16T10:30:00Z',
      lastModified: '2026-06-16T10:35:00Z',
      lastEditor: 'user@azion.com'
    })
  })

  it('list payload leaves the environment binding null (not present in /versions)', () => {
    const { body } = WorkloadVersionAdapter.transformListVersions([
      { version_id: 'BZ3KSDE4', version: 2, state: 'draft', created_at: 'x', ready_at: null }
    ])

    expect(body[0].environmentId).toBeNull()
    expect(body[0].deploymentId).toBeNull()
    // ready_at is null on a draft → lastModified falls back to created_at
    expect(body[0].lastModified).toBe('x')
  })

  it('accepts a paginated { results, count } envelope and a { data } envelope', () => {
    expect(WorkloadVersionAdapter.transformListVersions({ results: [], count: 0 })).toEqual({
      count: 0,
      body: []
    })
    expect(WorkloadVersionAdapter.transformListVersions({ data: [] })).toEqual({
      count: 0,
      body: []
    })
  })

  it('fails soft on nullish input', () => {
    expect(WorkloadVersionAdapter.transformListVersions(null)).toEqual({ count: 0, body: [] })
  })
})

describe('WorkloadVersionAdapter.transformLoadVersion', () => {
  it('exposes the environment/deployment bindings from the DETAIL payload', () => {
    const detail = {
      id: 54321,
      version_id: 'AY2JRCD3',
      version: 1,
      state: 'ready',
      deployment_id: 'AXK29QMP',
      environment_id: 'BZ3KSDE4',
      last_editor: 'user@azion.com',
      created_at: '2026-06-16T10:30:00Z'
    }

    const result = WorkloadVersionAdapter.transformLoadVersion(detail)

    expect(result).toMatchObject({
      id: 'AY2JRCD3',
      state: 'ready',
      deploymentId: 'AXK29QMP',
      environmentId: 'BZ3KSDE4'
    })
  })

  it('canonical id is version_id, not the numeric DB id', () => {
    const result = WorkloadVersionAdapter.transformLoadVersion({ id: 999, version_id: 'ULID9' })
    expect(result.id).toBe('ULID9')
  })

  it('unwraps a { data } envelope', () => {
    const result = WorkloadVersionAdapter.transformLoadVersion({
      data: { version_id: 'X', state: 'draft' }
    })
    expect(result).toMatchObject({ id: 'X', state: 'draft' })
  })
})
