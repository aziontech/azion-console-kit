import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setFeatureFlags } from '@/composables/user-flag'
import { SUPPORTED_VERSIONS } from '@/helpers'
import { WorkloadVersionAdapter } from '@/services/v2/workload/workload-version-adapter'

const makeFormValues = (overrides = {}) => ({
  name: 'my-workload',
  active: true,
  infrastructure: 1,
  workloadHostnameAllowAccess: false,
  useCustomDomain: false,
  customDomain: '',
  domains: [{ subdomain: 'shop', domain: 'example.com' }],
  protocols: {
    http: {
      useHttp3: false,
      useHttps: true,
      httpPorts: [{ value: 80 }],
      httpsPorts: [{ value: 443 }],
      quicPorts: [{ value: 443 }]
    }
  },
  tls: { minimumVersion: 'tls_1_2', ciphers: null },
  mtls: { isEnabled: false, verification: null, certificate: null, crl: null },
  ...overrides
})

const makeSnapshot = (overrides = {}) => ({
  version_id: 'AY2JRCD3',
  version: 3,
  state: 'ready',
  id: 42,
  name: 'prod-workload',
  active: true,
  workload_domain: 'wl.azion.app',
  infrastructure: 1,
  product_version: 'stable',
  workload_domain_allow_access: false,
  domains: ['shop.example.com'],
  protocols: { http: { http_ports: [80], https_ports: [443], quic_ports: null } },
  tls: { minimum_version: 'tls_1_2', ciphers: null, certificate: null },
  mtls: { enabled: false, config: { verification: null, certificate: null, crl: null } },
  deployment_id: 'AXK29QMP',
  environment_id: 'BZ3KSDE4',
  last_error: null,
  ...overrides
})

beforeEach(() => {
  setFeatureFlags([])
})

afterEach(() => {
  setFeatureFlags([])
})

describe('WorkloadVersionAdapter.transformDraftPayload (real WorkloadAdapter)', () => {
  it('emits the full workload create payload at the root', () => {
    const payload = WorkloadVersionAdapter.transformDraftPayload(makeFormValues())

    expect(payload).toEqual({
      name: 'my-workload',
      active: true,
      infrastructure: 1,
      tls: { minimum_version: 'tls_1_2', ciphers: null, certificate: null },
      protocols: {
        http: {
          versions: SUPPORTED_VERSIONS.default,
          http_ports: [80],
          https_ports: [443],
          quic_ports: null
        }
      },
      mtls: {
        enabled: false,
        config: { verification: null, certificate: null, crl: null }
      },
      domains: ['shop.example.com'],
      workload_domain_allow_access: false
    })
  })

  it('includes the comment alongside the root payload when present', () => {
    const payload = WorkloadVersionAdapter.transformDraftPayload(
      makeFormValues({ comment: 'edit note' })
    )

    expect(payload.comment).toBe('edit note')
    expect(payload).toMatchObject({
      name: 'my-workload',
      active: true,
      infrastructure: 1,
      protocols: { http: { http_ports: [80], https_ports: [443] } },
      mtls: { enabled: false }
    })
  })
})

describe('WorkloadVersionAdapter.transformLoadVersion — normalizeConfig (real WorkloadAdapter)', () => {
  it('runs the real transformLoadWorkload on a full snapshot and returns the UI form shape', () => {
    const { config } = WorkloadVersionAdapter.transformLoadVersion(makeSnapshot())

    expect(config).toMatchObject({
      id: 42,
      name: 'prod-workload',
      active: true,
      infrastructure: '1',
      protocols: { http: { useHttps: true, useHttp3: false } },
      tls: { minimumVersion: 'tls_1_2' },
      mtls: { isEnabled: false }
    })
  })

  it('returns {} for a metadata-only snapshot (form falls back to the parent workload)', () => {
    const { config } = WorkloadVersionAdapter.transformLoadVersion({
      version_id: 'AY2JRCD3',
      version: 1,
      state: 'draft'
    })

    expect(config).toEqual({})
  })

  it('returns {} for a partial snapshot missing mtls', () => {
    const { config } = WorkloadVersionAdapter.transformLoadVersion({
      version_id: 'AY2JRCD3',
      state: 'ready',
      protocols: { http: { https_ports: [443] } },
      tls: { minimum_version: 'tls_1_2' }
    })

    expect(config).toEqual({})
  })
})

describe('WorkloadVersionAdapter.transformLoadVersion — mapMeta (real WorkloadAdapter)', () => {
  it('maps the deployment/environment bindings and last build error', () => {
    const result = WorkloadVersionAdapter.transformLoadVersion(
      makeSnapshot({ last_error: 'build failed' })
    )

    expect(result).toMatchObject({
      deploymentId: 'AXK29QMP',
      environmentId: 'BZ3KSDE4',
      lastError: 'build failed'
    })
  })

  it('defaults the extra meta fields to null when the payload omits them', () => {
    const result = WorkloadVersionAdapter.transformLoadVersion({
      version_id: 'AY2JRCD3',
      state: 'draft'
    })

    expect(result).toMatchObject({
      deploymentId: null,
      environmentId: null,
      lastError: null
    })
  })
})
