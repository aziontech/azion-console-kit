import { describe, it, expect } from 'vitest'
import { EdgeAppVersionAdapter } from '@/services/v2/edge-app/edge-app-version-adapter'

const appSnapshot = (overrides = {}) => ({
  id: 60001,
  name: 'my-app',
  active: true,
  debug: false,
  modules: {
    cache: { enabled: true },
    functions: { enabled: false },
    application_accelerator: { enabled: true },
    image_processor: { enabled: false },
    tiered_cache: { enabled: true }
  },
  ...overrides
})

const versionMeta = (snapshot) => ({
  version_id: 'AVAPP0001',
  version: 3,
  state: 'draft',
  description: 'draft note',
  created_at: '2026-06-18T10:00:00Z',
  ready_at: '2026-06-18T10:05:00Z',
  last_editor: 'user@azion.com',
  ...snapshot
})

describe('EdgeAppVersionAdapter.transformLoadVersion - config extraction', () => {
  it('extracts name/active/debug and every module flag into the UI config', () => {
    const result = EdgeAppVersionAdapter.transformLoadVersion(versionMeta(appSnapshot()))

    expect(result.id).toBe('AVAPP0001')
    expect(result.state).toBe('draft')
    expect(result.comment).toBe('draft note')
    expect(result.lastEditor).toBe('user@azion.com')
    expect(result.config).toEqual({
      name: 'my-app',
      edgeCacheEnabled: true,
      edgeFunctionsEnabled: false,
      applicationAcceleratorEnabled: true,
      imageProcessorEnabled: false,
      tieredCacheEnabled: true,
      isActive: true,
      debug: false
    })
  })

  it('returns config={} for a metadata-only payload (form falls back to parent)', () => {
    const result = EdgeAppVersionAdapter.transformLoadVersion({
      version_id: 'AVAPP0009',
      state: 'ready'
    })

    expect(result.id).toBe('AVAPP0009')
    expect(result.config).toEqual({})
  })

  it('extracts a partial config, omitting absent module flags and fields', () => {
    const result = EdgeAppVersionAdapter.transformLoadVersion({
      version_id: 'AVAPP0005',
      state: 'draft',
      name: 'partial',
      modules: { cache: { enabled: true } }
    })

    expect(result.config).toEqual({ name: 'partial', edgeCacheEnabled: true })
    expect(result.config).not.toHaveProperty('edgeFunctionsEnabled')
    expect(result.config).not.toHaveProperty('isActive')
    expect(result.config).not.toHaveProperty('debug')
  })

  it('treats an absent (null/undefined) raw as an empty config', () => {
    expect(EdgeAppVersionAdapter.transformLoadVersion(null)).toBeNull()
    expect(EdgeAppVersionAdapter.transformLoadVersion({ version_id: 'X' }).config).toEqual({})
  })

  it('unwraps a { data } envelope', () => {
    const result = EdgeAppVersionAdapter.transformLoadVersion({ data: versionMeta(appSnapshot()) })
    expect(result.id).toBe('AVAPP0001')
    expect(result.config.name).toBe('my-app')
  })
})

describe('EdgeAppVersionAdapter.transformListVersions', () => {
  it('normalizes a bare array into { count, body } with config per item', () => {
    const { count, body } = EdgeAppVersionAdapter.transformListVersions([
      versionMeta(appSnapshot())
    ])

    expect(count).toBe(1)
    expect(body[0]).toMatchObject({ id: 'AVAPP0001', state: 'draft', version: 3 })
    expect(body[0].config.name).toBe('my-app')
  })

  it('accepts paginated/enveloped/empty input', () => {
    expect(EdgeAppVersionAdapter.transformListVersions({ results: [], count: 0 })).toEqual({
      count: 0,
      body: []
    })
    expect(EdgeAppVersionAdapter.transformListVersions({ data: [] })).toEqual({
      count: 0,
      body: []
    })
    expect(EdgeAppVersionAdapter.transformListVersions(null)).toEqual({ count: 0, body: [] })
  })
})

describe('EdgeAppVersionAdapter payload transforms - form -> payload at the root', () => {
  it('transformCreateDraftPayload maps sourceVersionId/comment and the module fields', () => {
    const form = EdgeAppVersionAdapter.transformLoadVersion(versionMeta(appSnapshot())).config
    const payload = EdgeAppVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVAPP0000',
      comment: 'clone',
      ...form
    })

    expect(payload.source_version).toBe('AVAPP0000')
    expect(payload.comment).toBe('clone')
    expect(payload).toMatchObject({ name: 'my-app', active: true, debug: false })
    expect(payload.modules).toEqual({
      cache: { enabled: true },
      functions: { enabled: false },
      application_accelerator: { enabled: true },
      image_processor: { enabled: false },
      tiered_cache: { enabled: true }
    })
  })

  it('transformCreateDraftPayload of a bare clone omits resource fields', () => {
    const payload = EdgeAppVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVAPP0000'
    })
    expect(payload).toEqual({ source_version: 'AVAPP0000' })
  })

  it('transformDraftPayload (PUT) maps the form back to the root modules shape', () => {
    const form = EdgeAppVersionAdapter.transformLoadVersion(versionMeta(appSnapshot())).config
    const payload = EdgeAppVersionAdapter.transformDraftPayload(form)

    expect(payload).toMatchObject({ name: 'my-app', active: true })
    expect(payload.modules.cache.enabled).toBe(true)
    expect(payload.modules.functions.enabled).toBe(false)
  })

  it('transformArchivePayload returns { comment } and transformBuildPayload only present keys', () => {
    expect(EdgeAppVersionAdapter.transformArchivePayload({ comment: 'bye' })).toEqual({
      comment: 'bye'
    })
    expect(EdgeAppVersionAdapter.transformBuildPayload({})).toEqual({})
    expect(EdgeAppVersionAdapter.transformBuildPayload({ comment: 'go', trace_id: 't1' })).toEqual({
      comment: 'go',
      trace_id: 't1'
    })
  })
})
