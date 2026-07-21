import { describe, expect, it } from 'vitest'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeVersionServiceContract } from '@/tests/shared/versioning/version-service.contract'
import { describeVersionAdapterContract } from '@/tests/shared/versioning/version-adapter.contract'

// WAF — pilot for the registry-driven suite (TEST-ARCHITECTURE §3.3). The inherited
// service + shared adapter contracts run from the descriptor; the WAF Main Settings
// threat semantics (defaults, empty-thresholds clone, per-threat round trip) are
// genuinely unique and stay bespoke below.
const waf = RESOURCE_TEST_REGISTRY.waf
const adapter = waf.adapter

describeVersionServiceContract(waf)
describeVersionAdapterContract(waf)

describe('waf — bespoke: Main Settings threat semantics', () => {
  it('defaults the untouched threats to disabled + medium sensitivity', () => {
    const result = adapter.transformLoadVersion(waf.buildVersion())

    expect(result.config.fileUpload).toBe(false)
    expect(result.config.fileUploadSensitivity).toBe('medium')
    expect(result.config.unwantedAccess).toBe(false)
  })

  it('transformCreateDraftPayload of a bare clone keeps source_version, no name, empty thresholds', () => {
    const payload = adapter.transformCreateDraftPayload({ sourceVersionId: 'AVWAF0000' })

    expect(payload.source_version).toBe('AVWAF0000')
    expect(payload).not.toHaveProperty('name')
    expect(payload.engine_settings.attributes.thresholds).toEqual([])
  })

  it('transformDraftPayload maps every enabled threat back to engine_settings thresholds', () => {
    const form = adapter.transformLoadVersion(waf.buildVersion()).config
    const payload = adapter.transformDraftPayload(form)

    expect(payload).toMatchObject({ name: 'waf-main', active: true })
    expect(payload.engine_settings.attributes.thresholds).toEqual(
      expect.arrayContaining([
        { threat: 'sql_injection', sensitivity: 'high' },
        { threat: 'cross_site_scripting', sensitivity: 'low' }
      ])
    )
  })

  it('exposes the shared factory surface (normalizeVersion from createVersionAdapter)', () => {
    expect(typeof adapter.normalizeVersion).toBe('function')
    expect(typeof adapter.transformLoadVersion).toBe('function')
    expect(typeof adapter.transformListVersions).toBe('function')
  })
})
