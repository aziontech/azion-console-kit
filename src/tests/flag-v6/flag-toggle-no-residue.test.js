import { describe, it, expect, vi, afterEach } from 'vitest'
import { hasFlagUseV6Configurations } from '@/composables/user-flag'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { WorkloadService } from '@/services/v2/workload/workload-service'
import { flagOn, flagOff, installFlagReset, spyHttpRequest } from '../support/flag-v6'
import { findRoute, loadExpectedView } from '../support/flag-v6/route-tools'

/**
 * Flag toggling leaves NO residue (spec flag-v6-coverage, req 6.4/1.4 / ADR-8).
 * The composable keeps state in a module-level ref — the exact place where an
 * account switch could leak the previous mode. The ON→OFF→ON sequence is proven
 * at three levels: composable reading, route factory resolution, and the
 * service's HTTP-call set.
 */
installFlagReset()

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ON→OFF→ON — composable level', () => {
  it('every reading follows the CURRENT account state', () => {
    flagOn()
    expect(hasFlagUseV6Configurations()).toBe(true)

    flagOff()
    expect(hasFlagUseV6Configurations()).toBe(false)

    flagOn()
    expect(hasFlagUseV6Configurations()).toBe(true)
  })
})

describe('ON→OFF→ON — route factory level', () => {
  it('the edit-variables factory resolves the CURRENT mode view on every toggle', async () => {
    const route = findRoute('src/router/routes/variables-routes/index.js', 'edit-variables')
    const v6View = await loadExpectedView('@views/Variables/v6/EditView.vue')
    const legacyView = await loadExpectedView('@views/Variables/EditView.vue')

    flagOn()
    expect((await route.component()).default).toBe(v6View.default)

    flagOff()
    expect((await route.component()).default).toBe(legacyView.default)

    flagOn()
    expect((await route.component()).default).toBe(v6View.default)
  })
})

describe('ON→OFF→ON — service HTTP-call level', () => {
  const workloadApiFixture = {
    id: 77,
    name: 'toggle-workload',
    active: true,
    infrastructure: 1,
    workload_domain: 'toggle.azion.app',
    workload_domain_allow_access: true,
    domains: [],
    bindings: [],
    protocols: {
      http: { versions: ['http1'], http_ports: [80], https_ports: null, quic_ports: null }
    },
    tls: { certificate: null, minimum_version: 'tls_1_2', ciphers: null },
    mtls: { enabled: false, config: { verification: null, certificate: null, crl: null } }
  }

  const loadAndListDeploymentCalls = async () => {
    vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn } = {}) =>
      typeof queryFn === 'function' ? queryFn() : undefined
    )
    const http = spyHttpRequest()
    http.spy.mockImplementation(async ({ url }) => {
      if (url.includes('/77/deployments')) return { data: { results: [] } }
      if (url.includes('workloads/77')) return { data: { data: workloadApiFixture } }
      return { data: { results: [] } }
    })
    await new WorkloadService().loadWorkload({ id: 77 })
    const deploymentCalls = http.spy.mock.calls.filter(([request]) =>
      request.url.includes('/deployments')
    ).length
    vi.restoreAllMocks()
    return deploymentCalls
  }

  it('the deployment-call decision follows the CURRENT mode on every toggle', async () => {
    flagOn()
    expect(await loadAndListDeploymentCalls()).toBe(0)

    flagOff()
    expect(await loadAndListDeploymentCalls()).toBe(1)

    flagOn()
    expect(await loadAndListDeploymentCalls()).toBe(0)
  })
})
