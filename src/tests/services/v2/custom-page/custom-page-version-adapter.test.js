import { describe, it, expect } from 'vitest'
import { CustomPageVersionAdapter } from '@/services/v2/custom-page/custom-page-version-adapter'

const rawPage = (code, type = 'page_default') => ({
  code,
  page: {
    type,
    attributes: {
      content_type: 'text/html',
      response: '<h1>hi</h1>',
      custom_status_code: 404
    }
  }
})

describe('CustomPageVersionAdapter.transformListVersions', () => {
  it('normalizes a bare array into { count, body } with the shared UI shape', () => {
    const raw = [
      {
        id: 70001,
        version_id: 'AVCPG001',
        version: 1,
        state: 'ready',
        last_editor: 'user@azion.com',
        created_at: '2026-06-16T10:30:00Z',
        ready_at: '2026-06-16T10:35:00Z',
        description: 'first'
      }
    ]

    const { count, body } = CustomPageVersionAdapter.transformListVersions(raw)

    expect(count).toBe(1)
    expect(body[0]).toMatchObject({
      id: 'AVCPG001',
      state: 'ready',
      version: 1,
      comment: 'first',
      createdAt: '2026-06-16T10:30:00Z',
      lastEditor: 'user@azion.com'
    })
  })

  it('accepts paginated { results, count } and { data } envelopes, and empty input', () => {
    expect(CustomPageVersionAdapter.transformListVersions({ results: [], count: 0 })).toEqual({
      count: 0,
      body: []
    })
    expect(CustomPageVersionAdapter.transformListVersions({ data: [] })).toEqual({
      count: 0,
      body: []
    })
    expect(CustomPageVersionAdapter.transformListVersions(null)).toEqual({ count: 0, body: [] })
  })
})

describe('CustomPageVersionAdapter.transformLoadVersion', () => {
  it('reads version_id as the canonical id and extracts config preserving pages[]', () => {
    const raw = {
      id: 70001,
      version_id: 'AVCPG002',
      state: 'draft',
      name: 'maintenance',
      active: true,
      pages: [rawPage('404'), rawPage('500')],
      created_at: '2026-06-16T10:30:00Z',
      last_editor: 'user@azion.com'
    }

    const result = CustomPageVersionAdapter.transformLoadVersion(raw)

    expect(result.id).toBe('AVCPG002')
    expect(result.state).toBe('draft')
    expect(result.config.name).toBe('maintenance')
    expect(result.config.active).toBe(true)
    expect(result.config.pages).toHaveLength(2)
    expect(result.config.pages[0]).toMatchObject({ type: 'page_default' })
  })

  it('returns config={} for a metadata-only payload (form falls back to parent)', () => {
    const result = CustomPageVersionAdapter.transformLoadVersion({
      version_id: 'AVCPG003',
      state: 'ready'
    })

    expect(result.id).toBe('AVCPG003')
    expect(result.config).toEqual({})
  })

  it('unwraps a { data } envelope', () => {
    const result = CustomPageVersionAdapter.transformLoadVersion({
      data: { version_id: 'AVCPG004', state: 'draft' }
    })
    expect(result.id).toBe('AVCPG004')
  })
})

describe('CustomPageVersionAdapter payload transforms', () => {
  it('transformCreateDraftPayload maps sourceVersionId/comment and resource fields', () => {
    const payload = CustomPageVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVCPG001',
      comment: 'clone',
      name: 'cloned',
      active: true,
      pages: []
    })

    expect(payload).toMatchObject({
      source_version: 'AVCPG001',
      comment: 'clone',
      name: 'cloned',
      active: true
    })
  })

  it('transformCreateDraftPayload of a bare clone omits resource fields', () => {
    const payload = CustomPageVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVCPG001'
    })
    expect(payload).toEqual({ source_version: 'AVCPG001' })
  })

  it('transformDraftPayload maps resource fields for a PUT', () => {
    const payload = CustomPageVersionAdapter.transformDraftPayload({
      name: 'edited',
      active: false,
      pages: []
    })
    expect(payload).toMatchObject({ name: 'edited', active: false })
  })

  it('transformArchivePayload returns { comment }', () => {
    expect(CustomPageVersionAdapter.transformArchivePayload({ comment: 'bye' })).toEqual({
      comment: 'bye'
    })
  })

  it('transformBuildPayload only includes present keys', () => {
    expect(CustomPageVersionAdapter.transformBuildPayload({})).toEqual({})
    expect(
      CustomPageVersionAdapter.transformBuildPayload({ comment: 'go', trace_id: 't1' })
    ).toEqual({ comment: 'go', trace_id: 't1' })
  })
})
