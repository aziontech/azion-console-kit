import { describe, it, expect, vi } from 'vitest'

// WorkloadAdapter.transformLoadWorkload/transformCreateWorkload read the v6 flag
// internally; stub them so these tests assert the version adapter's own logic
// (meta merge, config gating, payload assembly, undefined-strip) in isolation.
vi.mock('@/services/v2/workload/workload-adapter', () => ({
  WorkloadAdapter: {
    transformLoadWorkload: vi.fn(({ data }) => ({ loadedFrom: data.name ?? 'snapshot' })),
    transformCreateWorkload: vi.fn((source) => ({ name: source.name, protocols: source.protocols }))
  }
}))

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

  it('maps the workload-only lastError meta field (mapMeta)', () => {
    const result = WorkloadVersionAdapter.transformLoadVersion({
      version_id: 'X',
      state: 'draft',
      last_error: 'build failed'
    })
    expect(result.lastError).toBe('build failed')
  })

  it('defaults the extra meta fields to null when absent', () => {
    const result = WorkloadVersionAdapter.transformLoadVersion({ version_id: 'X', state: 'draft' })
    expect(result).toMatchObject({
      deploymentId: null,
      environmentId: null,
      lastError: null
    })
  })
})

// The refactor must keep the exact meta surface the UI/consumers read. Drift here
// (a renamed/dropped key) would silently break the versions list and editor.
describe('WorkloadVersionAdapter normalized meta shape (refactor parity)', () => {
  const EXPECTED_META_KEYS = [
    'id',
    'state',
    'version',
    'comment',
    'createdAt',
    'readyAt',
    'lastModified',
    'lastEditor',
    'sourceVersionId',
    'deploymentId',
    'environmentId',
    'lastError'
  ]

  it('exposes exactly the base meta keys + config (no missing/extra key)', () => {
    const result = WorkloadVersionAdapter.transformLoadVersion({
      version_id: 'AY2JRCD3',
      version: 1,
      state: 'ready',
      source_version_id: 'PARENT1',
      deployment_id: 'AXK29QMP',
      environment_id: 'BZ3KSDE4',
      last_error: null,
      created_at: '2026-06-16T10:30:00Z',
      ready_at: '2026-06-16T10:35:00Z',
      last_editor: 'user@azion.com',
      description: 'note'
    })

    expect(Object.keys(result).sort()).toEqual([...EXPECTED_META_KEYS, 'config'].sort())
    expect(result.sourceVersionId).toBe('PARENT1')
    expect(result.comment).toBe('note')
    expect(result.readyAt).toBe('2026-06-16T10:35:00Z')
  })
})

describe('WorkloadVersionAdapter config snapshot gating', () => {
  it('full snapshot (protocols+tls+mtls present) → config from transformLoadWorkload', () => {
    const result = WorkloadVersionAdapter.transformLoadVersion({
      version_id: 'X',
      state: 'ready',
      name: 'prod-workload',
      protocols: { http: {} },
      tls: { minimum_version: 'tls_1_2' },
      mtls: { enabled: false }
    })
    expect(result.config).toEqual({ loadedFrom: 'prod-workload' })
  })

  it('partial snapshot (missing mtls) → empty config (form falls back to parent)', () => {
    const result = WorkloadVersionAdapter.transformLoadVersion({
      version_id: 'X',
      state: 'ready',
      protocols: { http: {} },
      tls: { minimum_version: 'tls_1_2' }
    })
    expect(result.config).toEqual({})
  })

  it('metadata-only snapshot (no resource fields) → empty config', () => {
    const result = WorkloadVersionAdapter.transformLoadVersion({ version_id: 'X', state: 'draft' })
    expect(result.config).toEqual({})
  })
})

describe('WorkloadVersionAdapter.transformDraftPayload', () => {
  it('full workload payload at the root + comment', () => {
    const payload = WorkloadVersionAdapter.transformDraftPayload({
      name: 'wl',
      protocols: { http: { useHttps: true } },
      comment: 'edit'
    })
    expect(payload).toEqual({
      name: 'wl',
      protocols: { http: { useHttps: true } },
      comment: 'edit'
    })
  })

  it('bare clone (no name/protocols) skips the create transform → comment only', () => {
    const payload = WorkloadVersionAdapter.transformDraftPayload({ comment: 'just a note' })
    expect(payload).toEqual({ comment: 'just a note' })
  })

  it('strips undefined keys from the mapped fields', () => {
    const payload = WorkloadVersionAdapter.transformDraftPayload({
      name: 'wl',
      protocols: undefined
    })
    expect(payload).toEqual({ name: 'wl' })
    expect(payload).not.toHaveProperty('protocols')
  })
})

describe('WorkloadVersionAdapter.transformCreateDraftPayload', () => {
  it('clone carries source_version + comment without resource fields', () => {
    const payload = WorkloadVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'PARENT1',
      comment: 'cloned'
    })
    expect(payload).toEqual({ source_version: 'PARENT1', comment: 'cloned' })
  })

  it('clone with overrides merges the mapped resource fields', () => {
    const payload = WorkloadVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'PARENT1',
      name: 'wl',
      protocols: { http: { useHttps: true } }
    })
    expect(payload).toEqual({
      source_version: 'PARENT1',
      name: 'wl',
      protocols: { http: { useHttps: true } }
    })
  })

  it('empty body yields an empty payload', () => {
    expect(WorkloadVersionAdapter.transformCreateDraftPayload({})).toEqual({})
  })
})

describe('WorkloadVersionAdapter action payloads', () => {
  it('build/archive carry only a comment when provided, else empty', () => {
    expect(WorkloadVersionAdapter.transformBuildPayload({ comment: 'go' })).toEqual({
      comment: 'go'
    })
    expect(WorkloadVersionAdapter.transformBuildPayload({})).toEqual({})
    expect(WorkloadVersionAdapter.transformArchivePayload({ comment: 'bye' })).toEqual({
      comment: 'bye'
    })
    expect(WorkloadVersionAdapter.transformArchivePayload({})).toEqual({})
  })
})
