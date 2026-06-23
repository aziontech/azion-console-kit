import { describe, it, expect } from 'vitest'
import { NetworkListVersionAdapter } from '@/services/v2/network-lists/network-list-version-adapter'

// Full version snapshot per list type, mirroring `GET .../versions/{vid}`
// (clone of the resource row: name + type + items at the root).
const ipSnapshot = (overrides = {}) => ({
  id: 701,
  name: 'ip-list',
  type: 'ip_cidr',
  last_editor: 'user@azion.com',
  items: ['10.0.0.0/24', '192.168.0.1'],
  last_modified: '2026-06-18T10:00:00Z',
  ...overrides
})

const asnSnapshot = (overrides = {}) => ({
  id: 702,
  name: 'asn-list',
  type: 'asn',
  last_editor: 'user@azion.com',
  items: ['16509', '13335'],
  last_modified: '2026-06-18T10:00:00Z',
  ...overrides
})

const countriesSnapshot = (overrides = {}) => ({
  id: 703,
  name: 'countries-list',
  type: 'countries',
  last_editor: 'user@azion.com',
  items: ['BR', 'US'],
  last_modified: '2026-06-18T10:00:00Z',
  ...overrides
})

const versionMeta = (snapshot) => ({
  version_id: 'AVNL0001',
  version: 3,
  state: 'draft',
  description: 'draft note',
  created_at: '2026-06-18T10:00:00Z',
  ready_at: '2026-06-18T10:05:00Z',
  last_editor: 'user@azion.com',
  ...snapshot
})

describe('NetworkListVersionAdapter.transformLoadVersion - config extraction by type', () => {
  it('extracts the IP/CIDR snapshot (items joined by newline)', () => {
    const result = NetworkListVersionAdapter.transformLoadVersion(versionMeta(ipSnapshot()))

    expect(result.id).toBe('AVNL0001')
    expect(result.state).toBe('draft')
    expect(result.config).toMatchObject({
      id: 701,
      name: 'ip-list',
      networkListType: 'ip_cidr'
    })
    expect(result.config.itemsValues).toBe('10.0.0.0/24\n192.168.0.1')
    expect(result.config.itemsValuesCountry).toEqual([])
  })

  it('extracts the ASN snapshot (items joined by newline)', () => {
    const result = NetworkListVersionAdapter.transformLoadVersion(versionMeta(asnSnapshot()))

    expect(result.config).toMatchObject({ id: 702, name: 'asn-list', networkListType: 'asn' })
    expect(result.config.itemsValues).toBe('16509\n13335')
  })

  it('extracts the Countries snapshot (items kept as array)', () => {
    const result = NetworkListVersionAdapter.transformLoadVersion(versionMeta(countriesSnapshot()))

    expect(result.config).toMatchObject({
      id: 703,
      name: 'countries-list',
      networkListType: 'countries'
    })
    expect(result.config.itemsValuesCountry).toEqual(['BR', 'US'])
    expect(result.config.itemsValues).toBe('')
  })

  it('returns config={} for a metadata-only payload (form falls back to parent)', () => {
    const result = NetworkListVersionAdapter.transformLoadVersion({
      version_id: 'AVNL0009',
      state: 'ready'
    })

    expect(result.id).toBe('AVNL0009')
    expect(result.config).toEqual({})
  })

  it('unwraps a { data } envelope', () => {
    const result = NetworkListVersionAdapter.transformLoadVersion({
      data: versionMeta(asnSnapshot())
    })
    expect(result.id).toBe('AVNL0001')
    expect(result.config.networkListType).toBe('asn')
  })
})

describe('NetworkListVersionAdapter.transformListVersions', () => {
  it('normalizes a bare array into { count, body } with config per item', () => {
    const { count, body } = NetworkListVersionAdapter.transformListVersions([
      versionMeta(ipSnapshot())
    ])

    expect(count).toBe(1)
    expect(body[0]).toMatchObject({ id: 'AVNL0001', state: 'draft', version: 3 })
    expect(body[0].config.networkListType).toBe('ip_cidr')
  })

  it('accepts paginated/enveloped/empty input', () => {
    expect(NetworkListVersionAdapter.transformListVersions({ results: [], count: 0 })).toEqual({
      count: 0,
      body: []
    })
    expect(NetworkListVersionAdapter.transformListVersions(null)).toEqual({ count: 0, body: [] })
  })
})

describe('NetworkListVersionAdapter payload transforms - form -> payload by type', () => {
  it('transformCreateDraftPayload maps sourceVersionId/comment and the IP form items', () => {
    const form = NetworkListVersionAdapter.transformLoadVersion(versionMeta(ipSnapshot())).config
    const payload = NetworkListVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVNL0000',
      comment: 'clone',
      ...form
    })

    expect(payload.source_version).toBe('AVNL0000')
    expect(payload.comment).toBe('clone')
    expect(payload).toMatchObject({ name: 'ip-list', type: 'ip_cidr' })
    expect(payload.items).toEqual(['10.0.0.0/24', '192.168.0.1'])
  })

  it('transformCreateDraftPayload of a bare clone omits resource fields', () => {
    const payload = NetworkListVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVNL0000'
    })
    expect(payload).toEqual({ source_version: 'AVNL0000' })
  })

  it('transformDraftPayload (PUT) maps the Countries form back to the root payload', () => {
    const form = NetworkListVersionAdapter.transformLoadVersion(
      versionMeta(countriesSnapshot())
    ).config
    const payload = NetworkListVersionAdapter.transformDraftPayload(form)

    expect(payload).toMatchObject({ name: 'countries-list', type: 'countries' })
    expect(payload.items).toEqual(['BR', 'US'])
  })

  it('transformArchivePayload returns { comment } and transformBuildPayload only present keys', () => {
    expect(NetworkListVersionAdapter.transformArchivePayload({ comment: 'bye' })).toEqual({
      comment: 'bye'
    })
    expect(NetworkListVersionAdapter.transformBuildPayload({})).toEqual({})
    expect(
      NetworkListVersionAdapter.transformBuildPayload({ comment: 'go', trace_id: 't1' })
    ).toEqual({ comment: 'go', trace_id: 't1' })
  })
})
