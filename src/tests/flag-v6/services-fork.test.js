import { describe, it, expect, vi, afterEach } from 'vitest'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { WorkloadService } from '@/services/v2/workload/workload-service'
import { WorkloadAdapter } from '@/services/v2/workload/workload-adapter'
import { variablesService } from '@/services/v2/variables'
import { flagOn, flagOff, installFlagReset, spyHttpRequest } from '../support/flag-v6'

/**
 * Services that fork on use_v6_configurations (spec flag-v6-coverage, req 4 /
 * ADR-4). The REAL services run; only the HTTP boundary and the TanStack cache
 * seam are stubbed. Assertions target OBSERVABLE effects: which URLs were
 * requested and what payload shape went over the wire — never which internal
 * function was called.
 */
installFlagReset()

afterEach(() => {
  vi.restoreAllMocks()
})

// Neutralize the TanStack cache so the real queryFn runs synchronously.
const stubQueryCache = () => {
  vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn } = {}) =>
    typeof queryFn === 'function' ? queryFn() : undefined
  )
  vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
}

// Routes the http spy by URL fragment — each real consumer gets a real-shaped body.
const routeHttpByUrl = (spy, routes) => {
  spy.mockImplementation(async ({ url }) => {
    const match = routes.find(([fragment]) => url.includes(fragment))
    return match ? match[1] : { data: {} }
  })
}

const workloadApiFixture = {
  id: 77,
  name: 'my-workload',
  active: true,
  infrastructure: 1,
  workload_domain: 'my-workload.azion.app',
  workload_domain_allow_access: true,
  domains: ['my-app.example.com'],
  bindings: [],
  protocols: {
    http: { versions: ['http1'], http_ports: [80], https_ports: null, quic_ports: null }
  },
  tls: { certificate: null, minimum_version: 'tls_1_2', ciphers: null },
  mtls: { enabled: false, config: { verification: null, certificate: null, crl: null } },
  last_editor: 'user@azion.com',
  last_modified: '2026-07-22T10:00:00Z'
}

const requestedUrls = (httpSpy) => httpSpy.spy.mock.calls.map(([request]) => request.url)

describe('workload-service#loadWorkload — the deployment call forks on the flag (req 4.1)', () => {
  const loadWorkloadWithHttpSpy = async () => {
    stubQueryCache()
    const http = spyHttpRequest()
    routeHttpByUrl(http.spy, [
      ['/77/deployments', { data: { results: [] } }],
      ['workloads/77', { data: { data: workloadApiFixture } }]
    ])
    const service = new WorkloadService()
    await service.loadWorkload({ id: 77 })
    return http
  }

  it('flag OFF (legacy): fetches the workload AND its deployments', async () => {
    flagOff()

    const http = await loadWorkloadWithHttpSpy()

    const urls = requestedUrls(http)
    expect(urls.some((url) => url.includes('workloads/77'))).toBe(true)
    expect(urls.some((url) => url.includes('/77/deployments'))).toBe(true)
  })

  it('flag ON (v6): fetches the workload and SKIPS the deployments call', async () => {
    flagOn()

    const http = await loadWorkloadWithHttpSpy()

    const urls = requestedUrls(http)
    expect(urls.some((url) => url.includes('workloads/77'))).toBe(true)
    expect(urls.some((url) => url.includes('/deployments'))).toBe(false)
  })
})

describe('variables-service#create — the wire payload forks on the flag (req 4.2)', () => {
  const formPayload = {
    key: 'MY_VAR',
    value: 'my-value',
    secret: false,
    scope: [{ type: 'global' }]
  }

  const createdApiFixture = {
    data: { uuid: 'abc-1', key: 'MY_VAR', value: 'my-value', secret: false }
  }

  const createAndCaptureBody = async () => {
    stubQueryCache()
    const http = spyHttpRequest()
    http.spy.mockResolvedValue(createdApiFixture)
    await variablesService.create(formPayload)
    const [request] = http.spy.mock.calls.at(-1)
    return request
  }

  it('flag ON (v6): sends the scope field, transformed to resource_type entries', async () => {
    flagOn()

    const request = await createAndCaptureBody()

    expect(request.method).toBe('POST')
    expect(request.body).toEqual({
      key: 'MY_VAR',
      value: 'my-value',
      secret: false,
      scope: [{ resource_type: 'global' }]
    })
  })

  it('flag OFF (legacy): sends the legacy payload WITHOUT the scope field', async () => {
    flagOff()

    const request = await createAndCaptureBody()

    expect(request.body).toEqual({
      key: 'MY_VAR',
      value: 'my-value',
      secret: false
    })
    expect(request.body).not.toHaveProperty('scope')
  })
})

describe('workload-adapter#transformCreateWorkload — wire shape forks on the flag (req 4.3)', () => {
  // One realistic form payload, transformed under BOTH modes.
  const formPayload = {
    name: 'my-workload',
    active: true,
    infrastructure: 1,
    useCustomDomain: false,
    customDomain: '',
    domains: [{ subdomain: 'app', domain: 'example.com' }],
    environmentDeployments: {},
    protocols: {
      http: {
        useHttp3: false,
        useHttps: false,
        httpPorts: [{ value: 80 }],
        httpsPorts: [{ value: 443 }],
        quicPorts: []
      }
    },
    mtls: { isEnabled: false },
    workloadHostnameAllowAccess: true
  }

  it('flag OFF (legacy): joins domains into strings and never emits bindings', () => {
    flagOff()

    const wire = WorkloadAdapter.transformCreateWorkload(formPayload)

    expect(wire.domains).toEqual(['app.example.com'])
    expect(wire).not.toHaveProperty('bindings')
    expect(wire.name).toBe('my-workload')
    expect(wire.protocols.http.http_ports).toEqual([80])
  })

  it('flag ON (v6): emits bindings and no legacy domains array', () => {
    flagOn()

    const wire = WorkloadAdapter.transformCreateWorkload(formPayload)

    expect(wire).toHaveProperty('bindings')
    expect(wire.domains).toBeUndefined()
    expect(wire.name).toBe('my-workload')
  })
})
