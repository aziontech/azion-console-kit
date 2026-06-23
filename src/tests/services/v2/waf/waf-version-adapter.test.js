import { describe, it, expect } from 'vitest'
import { WafVersionAdapter } from '@/services/v2/waf/waf-version-adapter'

// Version snapshot per `GET .../versions/{vid}`: clone of the WAF row (Main
// Settings) with engine_settings thresholds per threat at the root.
const wafSnapshot = (overrides = {}) => ({
  id: 902,
  name: 'waf-main',
  active: true,
  engine_settings: {
    attributes: {
      thresholds: [
        { threat: 'sql_injection', sensitivity: 'high' },
        { threat: 'cross_site_scripting', sensitivity: 'low' }
      ]
    }
  },
  ...overrides
})

const versionMeta = (snapshot) => ({
  version_id: 'AVWAF0001',
  version: 3,
  state: 'draft',
  description: 'draft note',
  created_at: '2026-06-18T10:00:00Z',
  ready_at: '2026-06-18T10:05:00Z',
  last_editor: 'user@azion.com',
  ...snapshot
})

describe('WafVersionAdapter.transformLoadVersion - Main Settings extraction', () => {
  it('extracts name/active + per-threat booleans and sensitivities into config', () => {
    const result = WafVersionAdapter.transformLoadVersion(versionMeta(wafSnapshot()))

    expect(result.id).toBe('AVWAF0001')
    expect(result.state).toBe('draft')
    expect(result.config).toMatchObject({ id: 902, name: 'waf-main', active: true })
    expect(result.config.sqlInjection).toBe(true)
    expect(result.config.sqlInjectionSensitivity).toBe('high')
    expect(result.config.crossSiteScripting).toBe(true)
    expect(result.config.crossSiteScriptingSensitivity).toBe('low')
  })

  it('defaults the untouched threats to disabled + medium sensitivity', () => {
    const result = WafVersionAdapter.transformLoadVersion(versionMeta(wafSnapshot()))

    expect(result.config.fileUpload).toBe(false)
    expect(result.config.fileUploadSensitivity).toBe('medium')
    expect(result.config.unwantedAccess).toBe(false)
  })

  it('normalizes a metadata-only payload to all threats disabled at medium', () => {
    const result = WafVersionAdapter.transformLoadVersion({
      version_id: 'AVWAF0009',
      state: 'ready'
    })

    expect(result.id).toBe('AVWAF0009')
    expect(result.config.sqlInjection).toBe(false)
    expect(result.config.sqlInjectionSensitivity).toBe('medium')
    expect(result.config.unwantedAccess).toBe(false)
  })

  it('unwraps a { data } envelope', () => {
    const result = WafVersionAdapter.transformLoadVersion({ data: versionMeta(wafSnapshot()) })

    expect(result.id).toBe('AVWAF0001')
    expect(result.config.name).toBe('waf-main')
  })
})

describe('WafVersionAdapter.transformListVersions', () => {
  it('normalizes a bare array into { count, body } with config per item', () => {
    const { count, body } = WafVersionAdapter.transformListVersions([versionMeta(wafSnapshot())])

    expect(count).toBe(1)
    expect(body[0]).toMatchObject({ id: 'AVWAF0001', state: 'draft', version: 3 })
    expect(body[0].config.name).toBe('waf-main')
  })

  it('accepts paginated/enveloped/empty input', () => {
    expect(WafVersionAdapter.transformListVersions({ results: [], count: 0 })).toEqual({
      count: 0,
      body: []
    })
    expect(WafVersionAdapter.transformListVersions(null)).toEqual({ count: 0, body: [] })
  })
})

describe('WafVersionAdapter payload transforms - form -> payload', () => {
  it('transformCreateDraftPayload maps sourceVersionId/comment and the WAF Main Settings', () => {
    const form = WafVersionAdapter.transformLoadVersion(versionMeta(wafSnapshot())).config
    const payload = WafVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVWAF0000',
      comment: 'clone',
      ...form
    })

    expect(payload.source_version).toBe('AVWAF0000')
    expect(payload.comment).toBe('clone')
    expect(payload).toMatchObject({ name: 'waf-main', active: true })
    expect(payload.engine_settings.attributes.thresholds).toEqual(
      expect.arrayContaining([
        { threat: 'sql_injection', sensitivity: 'high' },
        { threat: 'cross_site_scripting', sensitivity: 'low' }
      ])
    )
  })

  it('transformCreateDraftPayload of a bare clone keeps source_version, no name', () => {
    const payload = WafVersionAdapter.transformCreateDraftPayload({ sourceVersionId: 'AVWAF0000' })

    expect(payload.source_version).toBe('AVWAF0000')
    expect(payload).not.toHaveProperty('name')
    expect(payload.engine_settings.attributes.thresholds).toEqual([])
  })

  it('transformDraftPayload (PUT) maps the WAF form back to engine_settings thresholds', () => {
    const form = WafVersionAdapter.transformLoadVersion(versionMeta(wafSnapshot())).config
    const payload = WafVersionAdapter.transformDraftPayload(form)

    expect(payload).toMatchObject({ name: 'waf-main', active: true })
    expect(payload.engine_settings.attributes.thresholds).toEqual(
      expect.arrayContaining([
        { threat: 'sql_injection', sensitivity: 'high' },
        { threat: 'cross_site_scripting', sensitivity: 'low' }
      ])
    )
  })

  it('transformArchivePayload returns { comment } and transformBuildPayload only present keys', () => {
    expect(WafVersionAdapter.transformArchivePayload({ comment: 'bye' })).toEqual({
      comment: 'bye'
    })
    expect(WafVersionAdapter.transformBuildPayload({})).toEqual({})
    expect(WafVersionAdapter.transformBuildPayload({ comment: 'go', trace_id: 't1' })).toEqual({
      comment: 'go',
      trace_id: 't1'
    })
  })
})

describe('WafVersionAdapter - no logic duplication (P2)', () => {
  it('exposes the shared factory surface (normalizeVersion from createVersionAdapter)', () => {
    expect(typeof WafVersionAdapter.normalizeVersion).toBe('function')
    expect(typeof WafVersionAdapter.transformLoadVersion).toBe('function')
    expect(typeof WafVersionAdapter.transformListVersions).toBe('function')
  })
})
