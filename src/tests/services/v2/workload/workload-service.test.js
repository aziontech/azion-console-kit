import { describe, expect, it, vi } from 'vitest'
import { WorkloadService } from '@/services/v2/workload/workload-service'

const rawWorkload = ({ certificate = 123 } = {}) => ({
  id: 42,
  name: 'my workload',
  active: true,
  workload_domain: 'abc123.map.azionedge.net',
  domains: ['www.example.com'],
  infrastructure: 1,
  workload_domain_allow_access: true,
  tls: { minimum_version: 'tls_1_2', ciphers: 'TLSv1.2_2021', certificate },
  protocols: {
    http: {
      versions: ['http1', 'http2'],
      http_ports: [80],
      https_ports: [443],
      quic_ports: null
    }
  },
  mtls: { enabled: false, config: { verification: null, certificate: null, crl: null } },
  product_version: '1.0'
})

const buildService = ({ workload = rawWorkload(), loadDigitalCertificate } = {}) => {
  const service = new WorkloadService()

  service.useEnsureQueryData = vi.fn((queryKey, fetcher) => fetcher())
  service.http = {
    request: vi.fn().mockResolvedValue({ data: { data: workload } })
  }
  service.workloadDeployment = {
    listWorkloadDeployment: vi
      .fn()
      .mockResolvedValue([{ id: 7, application: 1695294281, firewall: null, customPage: null }])
  }
  service.edgeDNS = {
    listEdgeDNSService: vi.fn().mockResolvedValue({ body: [] })
  }
  service.digitalCertificate = {
    loadDigitalCertificate:
      loadDigitalCertificate ??
      vi.fn().mockResolvedValue({
        id: 123,
        name: 'my-cert',
        authority: 'authority-x',
        subjectName: ['example.com']
      })
  }

  return service
}

describe('WorkloadService.loadWorkload', () => {
  it('populates certificate metadata in the load payload', async () => {
    const service = buildService()

    const result = await service.loadWorkload({ id: 42 })

    expect(service.digitalCertificate.loadDigitalCertificate).toHaveBeenCalledWith({ id: 123 })
    expect(result.authorityCertificate).toBe('authority-x')
    expect(result.subjectNameCertificate).toEqual(['example.com'])
  })

  it('falls back to null metadata when the certificate load fails', async () => {
    const service = buildService({
      loadDigitalCertificate: vi.fn().mockRejectedValue(new Error('not found'))
    })

    const result = await service.loadWorkload({ id: 42 })

    expect(result.authorityCertificate).toBeNull()
    expect(result.subjectNameCertificate).toBeNull()
  })

  it('returns null metadata without fetching when the workload has no certificate', async () => {
    const service = buildService({ workload: rawWorkload({ certificate: null }) })

    const result = await service.loadWorkload({ id: 42 })

    expect(service.digitalCertificate.loadDigitalCertificate).not.toHaveBeenCalled()
    expect(result.authorityCertificate).toBeNull()
    expect(result.subjectNameCertificate).toBeNull()
  })
})
