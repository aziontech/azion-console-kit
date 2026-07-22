import { describe, expect, it } from 'vitest'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeVersionServiceContract } from '@/tests/shared/versioning/version-service.contract'
import { describeVersionAdapterContract } from '@/tests/shared/versioning/version-adapter.contract'

const connector = RESOURCE_TEST_REGISTRY.connector
const adapter = connector.adapter

describeVersionServiceContract(connector)
describeVersionAdapterContract(connector)

const versionMeta = (snapshot) => ({
  version_id: 'AVCONN001',
  version: 3,
  state: 'draft',
  created_at: '2026-06-18T10:00:00Z',
  ...snapshot
})

const storageSnapshot = {
  id: 902,
  name: 'storage-connector',
  type: 'storage',
  active: true,
  attributes: { bucket: 'my-bucket', prefix: '/assets' }
}

const liveIngestSnapshot = {
  id: 903,
  name: 'live-connector',
  type: 'live_ingest',
  active: false,
  attributes: { region: 'sa-east-1' }
}

describe('connector — bespoke: HTTP polymorphism (nested addresses + modules)', () => {
  it('extracts the full HTTP snapshot including load_balancer and hmac config', () => {
    const result = adapter.transformLoadVersion(connector.buildVersion())

    expect(result.config).toMatchObject({ id: 901, name: 'http-connector', type: 'http' })
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

  it('round-trips the HTTP form back to the nested snake_case payload', () => {
    const form = adapter.transformLoadVersion(connector.buildVersion()).config
    const payload = adapter.transformCreateDraftPayload({ sourceVersionId: 'AVCONN000', ...form })

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
})

describe('connector — bespoke: Storage / LiveIngest variants', () => {
  it('extracts the Storage snapshot (bucket + prefix)', () => {
    const result = adapter.transformLoadVersion(versionMeta(storageSnapshot))

    expect(result.config).toMatchObject({ id: 902, name: 'storage-connector', type: 'storage' })
    expect(result.config.connectionOptions).toEqual({ bucket: 'my-bucket', prefix: '/assets' })
  })

  it('extracts the LiveIngest snapshot (region) and round-trips the form', () => {
    const result = adapter.transformLoadVersion(versionMeta(liveIngestSnapshot))
    expect(result.config).toMatchObject({ id: 903, type: 'live_ingest' })
    expect(result.config.connectionOptions).toEqual({ region: 'sa-east-1' })

    const payload = adapter.transformDraftPayload(result.config)
    expect(payload).toMatchObject({ name: 'live-connector', type: 'live_ingest', active: false })
    expect(payload.attributes).toEqual({ region: 'sa-east-1' })
  })
})
