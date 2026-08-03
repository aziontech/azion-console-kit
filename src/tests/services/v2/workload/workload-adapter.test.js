import { describe, expect, it, vi, beforeEach } from 'vitest'

const hasFlagUseV6Configurations = vi.fn()
vi.mock('@/composables/user-flag', () => ({
  hasFlagUseV6Configurations: () => hasFlagUseV6Configurations(),
  hasFlagBlockApiV4: () => false
}))

import { WorkloadAdapter } from '@/services/v2/workload/workload-adapter'

const makeLoadedWorkload = (bindings, overrides = {}) => ({
  data: {
    id: 42,
    name: 'wl',
    active: true,
    workload_domain: 'wl.azion.app',
    infrastructure: 1,
    product_version: 'stable',
    workload_domain_allow_access: false,
    domains: [],
    bindings,
    protocols: { http: { http_ports: [80], https_ports: null, quic_ports: null } },
    tls: { minimum_version: null, ciphers: null, certificate: null },
    mtls: { enabled: false, config: { verification: null, certificate: null, crl: null } },
    ...overrides
  }
})

const makeCreatePayload = (
  domains,
  environmentDeployments,
  workloadHostnameAllowAccess = false
) => ({
  id: 42,
  name: 'wl',
  active: true,
  infrastructure: 1,
  workloadHostnameAllowAccess,
  domains,
  environmentDeployments,
  protocols: {
    http: {
      useHttp3: false,
      useHttps: false,
      httpPorts: [{ value: 80 }],
      httpsPorts: [{ value: 443 }],
      quicPorts: [{ value: 443 }]
    }
  },
  tls: { minimumVersion: null, ciphers: null },
  mtls: { isEnabled: false, verification: null, certificate: null, crl: null }
})

beforeEach(() => {
  hasFlagUseV6Configurations.mockReset()
  hasFlagUseV6Configurations.mockReturnValue(true)
})

describe('WorkloadAdapter.transformLoadWorkload — v6 binding domains', () => {
  it('surfaces one row per binding domain', () => {
    const result = WorkloadAdapter.transformLoadWorkload(
      makeLoadedWorkload([
        { environment_id: 'env-prod', deployment_id: 'ds-1', domains: ['shop.example.com'] }
      ]),
      null,
      []
    )

    expect(result.domains).toHaveLength(1)
    expect(result.domains[0]).toMatchObject({
      subdomain: 'shop',
      domain: 'example.com',
      environment: 'env-prod'
    })
  })

  it('produces no row for a binding with empty domains', () => {
    const result = WorkloadAdapter.transformLoadWorkload(
      makeLoadedWorkload([
        { environment_id: 'env-prod', deployment_id: 'ds-1', domains: ['shop.example.com'] },
        { environment_id: 'env-stg', deployment_id: 'ds-2', domains: [] }
      ]),
      null,
      []
    )

    expect(result.domains).toHaveLength(1)
    expect(result.domains[0].environment).toBe('env-prod')
  })

  it('reads workloadHostnameAllowAccess from the top-level workload_domain_allow_access', () => {
    const result = WorkloadAdapter.transformLoadWorkload(
      makeLoadedWorkload(
        [{ environment_id: 'env-prod', deployment_id: 'ds-1', domains: ['shop.example.com'] }],
        { workload_domain_allow_access: true }
      ),
      null,
      []
    )

    expect(result.workloadHostnameAllowAccess).toBe(true)
  })

  it('does not expose isAutoDomain or autoDomainBinding on domain rows', () => {
    const result = WorkloadAdapter.transformLoadWorkload(
      makeLoadedWorkload([
        { environment_id: 'env-prod', deployment_id: 'ds-1', domains: ['shop.example.com'] }
      ]),
      null,
      []
    )

    expect(result.domains[0]).not.toHaveProperty('isAutoDomain')
    expect(result.domains[0]).not.toHaveProperty('autoDomainBinding')
  })
})

describe('WorkloadAdapter.transformCreateWorkload — v6 binding domains', () => {
  it('builds bindings grouped by environment without auto_domain_allow_access', () => {
    const payload = makeCreatePayload(
      [
        { subdomain: 'shop', domain: 'example.com', environment: 'env-prod', certificate: 0 },
        { subdomain: '', domain: 'api.example.com', environment: 'env-stg', certificate: 5 }
      ],
      { 'env-prod': { deploymentId: 'ds-1' }, 'env-stg': { deploymentId: 'ds-2' } }
    )

    const { bindings } = WorkloadAdapter.transformCreateWorkload(payload)

    expect(bindings).toHaveLength(2)

    const prod = bindings.find((binding) => binding.environment_id === 'env-prod')
    expect(prod).toEqual({
      environment_id: 'env-prod',
      deployment_id: 'ds-1',
      certificate: null,
      domains: ['shop.example.com']
    })
    expect(prod).not.toHaveProperty('auto_domain_allow_access')

    const stg = bindings.find((binding) => binding.environment_id === 'env-stg')
    expect(stg.domains).toEqual(['api.example.com'])
    expect(stg.certificate).toBe(5)
    expect(stg).not.toHaveProperty('auto_domain_allow_access')
  })

  it('sends workload_domain_allow_access as false on create', () => {
    const payload = makeCreatePayload(
      [{ subdomain: 'shop', domain: 'example.com', environment: 'env-prod', certificate: 0 }],
      { 'env-prod': { deploymentId: 'ds-1' } },
      false
    )

    const request = WorkloadAdapter.transformCreateWorkload(payload)
    expect(request.workload_domain_allow_access).toBe(false)
  })

  it('round-trips workload_domain_allow_access unchanged on update', () => {
    const loaded = WorkloadAdapter.transformLoadWorkload(
      makeLoadedWorkload(
        [{ environment_id: 'env-prod', deployment_id: 'ds-1', domains: ['shop.example.com'] }],
        { workload_domain_allow_access: true }
      ),
      null,
      []
    )

    const payload = makeCreatePayload(
      loaded.domains,
      loaded.environmentDeployments,
      loaded.workloadHostnameAllowAccess
    )
    const request = WorkloadAdapter.transformCreateWorkload(payload)

    expect(request.workload_domain_allow_access).toBe(true)
    expect(request.bindings[0]).not.toHaveProperty('auto_domain_allow_access')
  })
})
