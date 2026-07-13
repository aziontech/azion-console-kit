import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * Round-trip coverage for v6 auto-domain bindings.
 *
 * A binding created via API can carry an empty `domains[]` plus an `auto_domain`
 * string (the API-generated hostname). The console must (a) surface that binding
 * on load — reading `auto_domain` and flagging it `isAutoDomain` — and (b) send it
 * back on update as `{ domains: [], auto_domain_allow_access: true }` without ever
 * dropping it, regardless of edits.
 */

const hasFlagUseV6Configurations = vi.fn()
vi.mock('@/composables/user-flag', () => ({
  hasFlagUseV6Configurations: () => hasFlagUseV6Configurations(),
  hasFlagBlockApiV4: () => false
}))

import { WorkloadAdapter } from '@/services/v2/workload/workload-adapter'

const makeLoadedWorkload = (bindings) => ({
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
    mtls: { enabled: false, config: { verification: null, certificate: null, crl: null } }
  }
})

const makeUpdatePayload = (
  domains,
  environmentDeployments,
  workloadHostnameAllowAccess = true
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

describe('WorkloadAdapter.transformLoadWorkload — auto-domain bindings (v6)', () => {
  it('surfaces a binding with empty domains[] using its auto_domain, flagged isAutoDomain', () => {
    const result = WorkloadAdapter.transformLoadWorkload(
      makeLoadedWorkload([
        { environment_id: 'env-prod', deployment_id: 'ds-1', domains: ['shop.example.com'] },
        {
          environment_id: 'env-stg',
          deployment_id: 'ds-2',
          domains: [],
          auto_domain: 'auto-gen.azion.app',
          auto_domain_allow_access: true
        }
      ]),
      null,
      []
    )

    expect(result.domains).toHaveLength(2)

    const autoRow = result.domains.find((entry) => entry.isAutoDomain)
    expect(autoRow).toMatchObject({
      subdomain: 'auto-gen',
      domain: 'azion.app',
      environment: 'env-stg',
      isAutoDomain: true
    })

    const regularRow = result.domains.find((entry) => !entry.isAutoDomain)
    expect(regularRow.environment).toBe('env-prod')
    expect(regularRow.isAutoDomain).toBe(false)

    expect(result.environmentDeployments['env-stg']).toEqual({ deploymentId: 'ds-2' })
  })

  it('ignores auto_domain when the binding already has domains (regression)', () => {
    const result = WorkloadAdapter.transformLoadWorkload(
      makeLoadedWorkload([
        {
          environment_id: 'env-prod',
          deployment_id: 'ds-1',
          domains: ['shop.example.com'],
          auto_domain: 'auto-gen.azion.app'
        }
      ]),
      null,
      []
    )

    expect(result.domains).toHaveLength(1)
    expect(result.domains[0].isAutoDomain).toBe(false)
    expect(result.domains[0]).toMatchObject({ subdomain: 'shop', domain: 'example.com' })
  })

  it('leaves a binding with empty domains and no auto_domain producing no row', () => {
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
})

describe('WorkloadAdapter.transformCreateWorkload — auto-domain bindings (v6 update)', () => {
  it('emits the auto-domain binding with empty domains[] and auto_domain_allow_access true', () => {
    const payload = makeUpdatePayload(
      [
        {
          subdomain: 'shop',
          domain: 'example.com',
          environment: 'env-prod',
          certificate: 0,
          isAutoDomain: false
        },
        {
          subdomain: 'auto-gen',
          domain: 'azion.app',
          environment: 'env-stg',
          certificate: 0,
          isAutoDomain: true
        }
      ],
      { 'env-prod': { deploymentId: 'ds-1' }, 'env-stg': { deploymentId: 'ds-2' } }
    )

    const { bindings } = WorkloadAdapter.transformCreateWorkload(payload)

    expect(bindings).toHaveLength(2)

    const prod = bindings.find((binding) => binding.environment_id === 'env-prod')
    expect(prod.domains).toEqual(['shop.example.com'])

    const stg = bindings.find((binding) => binding.environment_id === 'env-stg')
    expect(stg.domains).toEqual([])
    expect(stg.deployment_id).toBe('ds-2')
    expect(stg.auto_domain_allow_access).toBe(true)
  })

  it('forces auto_domain_allow_access true on the auto-domain binding even when the workload switch is off', () => {
    const payload = makeUpdatePayload(
      [
        {
          subdomain: 'auto-gen',
          domain: 'azion.app',
          environment: 'env-stg',
          certificate: 0,
          isAutoDomain: true
        }
      ],
      { 'env-stg': { deploymentId: 'ds-2' } },
      false
    )

    const { bindings } = WorkloadAdapter.transformCreateWorkload(payload)

    expect(bindings).toHaveLength(1)
    expect(bindings[0].domains).toEqual([])
    expect(bindings[0].auto_domain_allow_access).toBe(true)
  })

  it('preserves auto_domain and other retrieve fields through a full load → update round-trip', () => {
    const loaded = WorkloadAdapter.transformLoadWorkload(
      makeLoadedWorkload([
        {
          id: 'bind-1',
          environment_id: 'env-stg',
          deployment_id: 'ds-2',
          domains: [],
          auto_domain: 'auto-gen.map.azionedge.net',
          auto_domain_allow_access: true,
          some_api_field: 'keep-me'
        }
      ]),
      null,
      []
    )

    const payload = makeUpdatePayload(loaded.domains, loaded.environmentDeployments, false)
    const { bindings } = WorkloadAdapter.transformCreateWorkload(payload)

    expect(bindings).toHaveLength(1)
    expect(bindings[0]).toMatchObject({
      id: 'bind-1',
      environment_id: 'env-stg',
      deployment_id: 'ds-2',
      auto_domain: 'auto-gen.map.azionedge.net',
      auto_domain_allow_access: true,
      some_api_field: 'keep-me',
      domains: []
    })
  })
})
