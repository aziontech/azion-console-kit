import { describe, expect, it, vi } from 'vitest'
import { loadDomainService } from '@/services/domains-services/v4'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const fixtures = {
  domainMock: {
    id: 1234,
    name: 'Edge App X',
    domains: [{ domain: 'www.test.com', allow_access: false }],
    alternate_domains: ['CName 1', 'CName 2'],
    tls: {
      certificate: 1,
      ciphers: 'TLSv1.2_2018',
      minimum_version: 'tls_1_0'
    },
    protocols: {
      http: {
        versions: ['http1', 'http2'],
        http_ports: [80],
        https_ports: [443],
        quic_ports: null
      }
    },
    mtls: {
      verification: 'enforce',
      certificate: 1
    },
    active: true,
    network_map: '1'
  },
  domainMockHttp3: {
    id: 1234,
    name: 'Edge App X',
    domains: [{ domain: 'www.test.com', allow_access: false }],
    alternate_domains: ['CName 1', 'CName 2'],
    tls: {
      certificate: 1,
      ciphers: 'TLSv1.2_2018',
      minimum_version: 'tls_1_0'
    },
    protocols: {
      http: {
        versions: ['http1', 'http2', 'http3'],
        http_ports: [80],
        https_ports: [443],
        quic_ports: [443]
      }
    },
    mtls: {
      verification: 'enforce',
      certificate: 1
    },
    active: true,
    network_map: '1'
  }
}

const makeSut = () => {
  const sut = loadDomainService
  return {
    sut
  }
}

describe('DomainServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: fixtures.domainMock
      }
    })
    const { sut } = makeSut()

    await sut({
      id: fixtures.domainMock.id
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/workspace/workloads/${fixtures.domainMock.id}`,
      method: 'GET'
    })
  })

  it('should correctly parse the returned a domain', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.domainMock }
    })
    const { sut } = makeSut()

    const result = await sut({
      id: fixtures.domainMock.id
    })

    expect(result).toEqual({
      id: fixtures.domainMock.id,
      name: fixtures.domainMock.name,
      domainName: fixtures.domainMock.domains[0].domain,
      cnames: 'CName 1\nCName 2',
      cnameAccessOnly: !fixtures.domainMock.domains[0].allow_access,
      mtlsIsEnabled: true,
      active: fixtures.domainMock.active,
      mtlsVerification: fixtures.domainMock.mtls.verification,
      mtlsTrustedCertificate: fixtures.domainMock.mtls.certificate,
      environment: fixtures.domainMock.network_map,
      domains: fixtures.domainMock.domains,
      edgeCertificate: fixtures.domainMock.tls.certificate,
      httpPort: [
        {
          name: '80 (Default)',
          value: 80
        }
      ],
      httpsPort: [
        {
          name: '443 (Default)',
          value: 443
        }
      ],
      quicPort: null,
      supportedCiphers: fixtures.domainMock.tls.ciphers,
      useHttp3: false,
      useHttps: true,
      minimumTlsVersion: fixtures.domainMock.tls.minimum_version
    })
  })

  it('should correctly parse the returned a domain - only http', async () => {
    fixtures.domainMock.protocols.http.https_ports = null
    fixtures.domainMock.tls.certificate = null
    fixtures.domainMock.mtls.certificate = null

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.domainMock }
    })
    const { sut } = makeSut()

    const result = await sut({
      id: fixtures.domainMock.id
    })

    expect(result).toEqual({
      id: fixtures.domainMock.id,
      name: fixtures.domainMock.name,
      domainName: fixtures.domainMock.domains[0].domain,
      cnames: 'CName 1\nCName 2',
      cnameAccessOnly: !fixtures.domainMock.domains[0].allow_access,
      mtlsIsEnabled: false,
      active: fixtures.domainMock.active,
      mtlsVerification: fixtures.domainMock.mtls.verification,
      mtlsTrustedCertificate: undefined,
      environment: fixtures.domainMock.network_map,
      domains: fixtures.domainMock.domains,
      edgeCertificate: 0,
      httpPort: [
        {
          name: '80 (Default)',
          value: 80
        }
      ],
      httpsPort: null,
      quicPort: null,
      supportedCiphers: fixtures.domainMock.tls.ciphers,
      useHttp3: false,
      useHttps: false,
      minimumTlsVersion: fixtures.domainMock.tls.minimum_version
    })
  })

  it('should correctly parse the returned a domain - http3', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.domainMockHttp3 }
    })
    const { sut } = makeSut()

    const result = await sut({
      id: fixtures.domainMock.id
    })

    expect(result).toEqual({
      id: fixtures.domainMockHttp3.id,
      name: fixtures.domainMockHttp3.name,
      domainName: fixtures.domainMockHttp3.domains[0].domain,
      cnames: 'CName 1\nCName 2',
      cnameAccessOnly: !fixtures.domainMockHttp3.domains[0].allow_access,
      mtlsIsEnabled: true,
      active: fixtures.domainMockHttp3.active,
      mtlsVerification: fixtures.domainMockHttp3.mtls.verification,
      mtlsTrustedCertificate: fixtures.domainMockHttp3.mtls.certificate,
      environment: fixtures.domainMockHttp3.network_map,
      domains: fixtures.domainMockHttp3.domains,
      edgeCertificate: fixtures.domainMockHttp3.tls.certificate,
      httpPort: [
        {
          name: '80 (Default)',
          value: 80
        }
      ],
      httpsPort: [
        {
          name: '443 (Default)',
          value: 443
        }
      ],
      quicPort: [
        {
          name: '443 (Default)',
          value: 443
        }
      ],
      supportedCiphers: fixtures.domainMockHttp3.tls.ciphers,
      useHttp3: true,
      useHttps: true,
      minimumTlsVersion: fixtures.domainMockHttp3.tls.minimum_version
    })
  })
})
