import { describe, expect, it } from 'vitest'
import { EdgeFirewallVersionAdapter } from '@/services/v2/edge-firewall/edge-firewall-version-adapter'

const rawDetail = {
  id: 80001,
  name: 'edge-firewall-prod',
  active: true,
  edge_functions_enabled: true,
  network_protection_enabled: false,
  waf_enabled: true,
  ddos_protection_unmetered: true,
  debug_rules: false,
  version_id: 'AVFW0002',
  state: 'draft',
  description: 'my draft',
  created_at: '2026-06-16T10:30:00Z',
  last_modified: '2026-06-16T10:31:00Z',
  last_editor: 'rafael.garbinatto@azion.com'
}

describe('EdgeFirewallVersionAdapter - transformLoadVersion', () => {
  it('normalizes meta and maps firewall fields into a camelCase config', () => {
    const result = EdgeFirewallVersionAdapter.transformLoadVersion(rawDetail)

    expect(result.id).toBe('AVFW0002')
    expect(result.state).toBe('draft')
    expect(result.comment).toBe('my draft')
    expect(result.lastEditor).toBe('rafael.garbinatto@azion.com')
    expect(result.config).toEqual({
      name: 'edge-firewall-prod',
      isActive: true,
      edgeFunctionsEnabled: true,
      networkProtectionEnabled: false,
      wafEnabled: true,
      ddosProtectionUnmetered: true,
      debugRules: false
    })
  })

  it('prefers the `meta` envelope for version_id/state when present', () => {
    const result = EdgeFirewallVersionAdapter.transformLoadVersion({
      id: 999,
      meta: { version_id: 'METAID', state: 'ready' },
      name: 'fw'
    })

    expect(result.id).toBe('METAID')
    expect(result.state).toBe('ready')
  })

  it('unwraps a `{ data }` envelope', () => {
    const result = EdgeFirewallVersionAdapter.transformLoadVersion({ data: rawDetail })
    expect(result.id).toBe('AVFW0002')
  })

  it('omits config keys absent from the raw object', () => {
    const result = EdgeFirewallVersionAdapter.transformLoadVersion({
      version_id: 'X',
      state: 'draft',
      name: 'only-name'
    })
    expect(result.config).toEqual({ name: 'only-name' })
  })
})

describe('EdgeFirewallVersionAdapter - transformListVersions', () => {
  it('returns { count, body } for a bare array of metas', () => {
    const result = EdgeFirewallVersionAdapter.transformListVersions([
      { version_id: 'A', state: 'ready' },
      { version_id: 'B', state: 'draft' }
    ])

    expect(result.count).toBe(2)
    expect(result.body.map((item) => item.id)).toEqual(['A', 'B'])
    expect(result.body.map((item) => item.state)).toEqual(['ready', 'draft'])
  })

  it('handles a { count, results } envelope', () => {
    const result = EdgeFirewallVersionAdapter.transformListVersions({
      count: 1,
      results: [{ version_id: 'A', state: 'ready' }]
    })
    expect(result).toEqual({
      count: 1,
      body: [expect.objectContaining({ id: 'A', state: 'ready' })]
    })
  })

  it('returns an empty contract for nullish input', () => {
    expect(EdgeFirewallVersionAdapter.transformListVersions(null)).toEqual({ count: 0, body: [] })
  })
})

describe('EdgeFirewallVersionAdapter - payloads', () => {
  it('maps create-draft payload to snake_case root fields with source/comment', () => {
    const payload = EdgeFirewallVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'SRC',
      comment: 'clone',
      name: 'fw',
      isActive: false,
      edgeFunctionsEnabled: true,
      wafEnabled: false
    })

    expect(payload).toEqual({
      source_version: 'SRC',
      comment: 'clone',
      name: 'fw',
      active: false,
      edge_functions_enabled: true,
      waf_enabled: false
    })
  })

  it('strips undefined fields from the draft payload', () => {
    const payload = EdgeFirewallVersionAdapter.transformDraftPayload({
      name: 'fw',
      wafEnabled: true
    })

    expect(payload).toEqual({ name: 'fw', waf_enabled: true })
    expect(payload).not.toHaveProperty('active')
  })

  it('builds archive and build payloads', () => {
    expect(EdgeFirewallVersionAdapter.transformArchivePayload({ comment: 'bye' })).toEqual({
      comment: 'bye'
    })
    expect(
      EdgeFirewallVersionAdapter.transformBuildPayload({ trace_id: 't', comment: 'c' })
    ).toEqual({ trace_id: 't', comment: 'c' })
    expect(EdgeFirewallVersionAdapter.transformBuildPayload({})).toEqual({})
  })
})
