import { describe, it, expect } from 'vitest'
import { EdgeConnectorVersionAdapter } from '@/services/v2/edge-connectors/edge-connector-version-adapter'

// Full version snapshot per connector type, mirroring `GET .../versions/{vid}`
// (clone of the resource row: type + attributes at the root, HTTP sub-resources
// nested under attributes).
const httpSnapshot = (overrides = {}) => ({
  id: 901,
  name: 'http-connector',
  type: 'http',
  active: true,
  attributes: {
    addresses: [
      {
        active: true,
        address: 'origin-a.example.com',
        http_port: 80,
        https_port: 443,
        modules: { load_balancer: { server_role: 'primary', weight: 1 } }
      },
      {
        active: true,
        address: 'origin-b.example.com',
        http_port: 80,
        https_port: 443,
        modules: { load_balancer: { server_role: 'backup', weight: 2 } }
      }
    ],
    connection_options: {
      dns_resolution: 'preserve',
      transport_policy: 'preserve',
      host: 'app.example.com',
      path_prefix: '/api',
      following_redirect: false,
      real_ip_header: 'X-Real-IP',
      real_port_header: 'X-Real-Port'
    },
    modules: {
      load_balancer: {
        enabled: true,
        config: {
          method: 'round_robin',
          max_retries: 3,
          connection_timeout: 60,
          read_write_timeout: 120
        }
      },
      origin_shield: {
        enabled: true,
        config: {
          origin_ip_acl: { enabled: true },
          hmac: {
            enabled: true,
            config: {
              type: 'aws4_hmac',
              attributes: {
                region: 'us-east-1',
                service: 's3',
                access_key: 'AKIA',
                secret_key: 'secret'
              }
            }
          }
        }
      }
    }
  },
  ...overrides
})

const storageSnapshot = (overrides = {}) => ({
  id: 902,
  name: 'storage-connector',
  type: 'storage',
  active: true,
  attributes: { bucket: 'my-bucket', prefix: '/assets' },
  ...overrides
})

const liveIngestSnapshot = (overrides = {}) => ({
  id: 903,
  name: 'live-connector',
  type: 'live_ingest',
  active: false,
  attributes: { region: 'sa-east-1' },
  ...overrides
})

const versionMeta = (snapshot) => ({
  version_id: 'AVCONN001',
  version: 3,
  state: 'draft',
  description: 'draft note',
  created_at: '2026-06-18T10:00:00Z',
  ready_at: '2026-06-18T10:05:00Z',
  last_editor: 'user@azion.com',
  ...snapshot
})

describe('EdgeConnectorVersionAdapter.transformLoadVersion - config extraction by type', () => {
  it('extracts the full HTTP snapshot (addresses + connection options + nested modules)', () => {
    const result = EdgeConnectorVersionAdapter.transformLoadVersion(versionMeta(httpSnapshot()))

    expect(result.id).toBe('AVCONN001')
    expect(result.state).toBe('draft')
    expect(result.config).toMatchObject({
      id: 901,
      name: 'http-connector',
      type: 'http',
      active: true
    })
    expect(result.config.connectionOptions).toMatchObject({
      host: 'app.example.com',
      path: '/api',
      realIpHeader: 'X-Real-IP'
    })
    expect(result.config.addresses).toHaveLength(2)
    expect(result.config.addresses[0]).toMatchObject({
      address: 'origin-a.example.com',
      serverRole: 'primary',
      weight: 1
    })
    expect(result.config.modules.loadBalancer).toMatchObject({
      enabled: true,
      config: { method: 'round_robin', maxRetries: 3 }
    })
    expect(result.config.modules.originShield.config.hmac).toMatchObject({
      enabled: true,
      config: { type: 'aws4_hmac', attributes: { accessKey: 'AKIA', secretKey: 'secret' } }
    })
  })

  it('extracts the Storage snapshot (bucket + prefix)', () => {
    const result = EdgeConnectorVersionAdapter.transformLoadVersion(versionMeta(storageSnapshot()))

    expect(result.config).toMatchObject({ id: 902, name: 'storage-connector', type: 'storage' })
    expect(result.config.connectionOptions).toEqual({ bucket: 'my-bucket', prefix: '/assets' })
  })

  it('extracts the LiveIngest snapshot (region)', () => {
    const result = EdgeConnectorVersionAdapter.transformLoadVersion(
      versionMeta(liveIngestSnapshot())
    )

    expect(result.config).toMatchObject({ id: 903, name: 'live-connector', type: 'live_ingest' })
    expect(result.config.connectionOptions).toEqual({ region: 'sa-east-1' })
  })

  it('returns config={} for a metadata-only payload (form falls back to parent)', () => {
    const result = EdgeConnectorVersionAdapter.transformLoadVersion({
      version_id: 'AVCONN009',
      state: 'ready'
    })

    expect(result.id).toBe('AVCONN009')
    expect(result.config).toEqual({})
  })

  it('unwraps a { data } envelope', () => {
    const result = EdgeConnectorVersionAdapter.transformLoadVersion({
      data: versionMeta(storageSnapshot())
    })
    expect(result.id).toBe('AVCONN001')
    expect(result.config.type).toBe('storage')
  })
})

describe('EdgeConnectorVersionAdapter.transformListVersions', () => {
  it('normalizes a bare array into { count, body } with config per item', () => {
    const { count, body } = EdgeConnectorVersionAdapter.transformListVersions([
      versionMeta(storageSnapshot())
    ])

    expect(count).toBe(1)
    expect(body[0]).toMatchObject({ id: 'AVCONN001', state: 'draft', version: 3 })
    expect(body[0].config.type).toBe('storage')
  })

  it('accepts paginated/enveloped/empty input', () => {
    expect(EdgeConnectorVersionAdapter.transformListVersions({ results: [], count: 0 })).toEqual({
      count: 0,
      body: []
    })
    expect(EdgeConnectorVersionAdapter.transformListVersions(null)).toEqual({ count: 0, body: [] })
  })
})

describe('EdgeConnectorVersionAdapter payload transforms - form -> payload by type', () => {
  it('transformCreateDraftPayload maps sourceVersionId/comment and the HTTP form fields', () => {
    const form = EdgeConnectorVersionAdapter.transformLoadVersion(
      versionMeta(httpSnapshot())
    ).config
    const payload = EdgeConnectorVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVCONN000',
      comment: 'clone',
      ...form
    })

    expect(payload.source_version).toBe('AVCONN000')
    expect(payload.comment).toBe('clone')
    expect(payload).toMatchObject({ name: 'http-connector', type: 'http', active: true })
    expect(payload.attributes.connection_options).toMatchObject({
      host: 'app.example.com',
      path_prefix: '/api'
    })
    expect(payload.attributes.addresses).toHaveLength(2)
    expect(payload.attributes.modules.load_balancer.config.max_retries).toBe(3)
    expect(payload.attributes.modules.origin_shield.config.hmac.config.attributes.access_key).toBe(
      'AKIA'
    )
  })

  it('transformCreateDraftPayload of a bare clone omits resource fields', () => {
    const payload = EdgeConnectorVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVCONN000'
    })
    expect(payload).toEqual({ source_version: 'AVCONN000' })
  })

  it('transformDraftPayload (PUT) maps the Storage form back to the root payload', () => {
    const form = EdgeConnectorVersionAdapter.transformLoadVersion(
      versionMeta(storageSnapshot())
    ).config
    const payload = EdgeConnectorVersionAdapter.transformDraftPayload(form)

    expect(payload).toMatchObject({ name: 'storage-connector', type: 'storage' })
    expect(payload.attributes).toEqual({ bucket: 'my-bucket', prefix: '/assets' })
  })

  it('transformDraftPayload maps the LiveIngest form back to the root payload', () => {
    const form = EdgeConnectorVersionAdapter.transformLoadVersion(
      versionMeta(liveIngestSnapshot())
    ).config
    const payload = EdgeConnectorVersionAdapter.transformDraftPayload(form)

    expect(payload).toMatchObject({ name: 'live-connector', type: 'live_ingest', active: false })
    expect(payload.attributes).toEqual({ region: 'sa-east-1' })
  })

  it('transformArchivePayload returns { comment } and transformBuildPayload only present keys', () => {
    expect(EdgeConnectorVersionAdapter.transformArchivePayload({ comment: 'bye' })).toEqual({
      comment: 'bye'
    })
    expect(EdgeConnectorVersionAdapter.transformBuildPayload({})).toEqual({})
    expect(
      EdgeConnectorVersionAdapter.transformBuildPayload({ comment: 'go', trace_id: 't1' })
    ).toEqual({ comment: 'go', trace_id: 't1' })
  })
})
