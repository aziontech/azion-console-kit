import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createDomainService } from '@/services/domains-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  domainMock: {
    name: 'testv4t',
    environment: '1',
    edgeApplication: 1732640034,
    edgeFirewall: 21532,
    deliveryProtocol: 'https',
    httpPort: [
      {
        name: '80 (Default)',
        value: '80'
      }
    ],
    httpsPort: [
      {
        name: '443 (Default)',
        value: '443'
      },
      {
        name: '8443',
        value: '8443'
      },
      {
        name: '9440',
        value: '9440'
      }
    ],
    quicPort: [
      {
        name: '443 (Default)',
        value: '443'
      }
    ],
    useHttps: true,
    useHttp3: true,
    cnames: 'www.testcertificate.com',
    cnameAccessOnly: true,
    mtlsIsEnabled: true,
    mtlsVerification: 'enforce',
    active: true,
    edgeCertificate: 0,
    mtlsTrustedCertificate: 72395,
    minimumTlsVersion: 'tls_1_3',
    supportedCiphers: 'TLSv1.2_2021'
  }
}

const makeSut = () => {
  const sut = createDomainService

  return {
    sut
  }
}

describe('DomainsServicesV4', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        data: {
          id: 1,
          domains: [{ domain: fixtures.domainMock.cnames }]
        }
      }
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.domainMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/workspace/workloads`,
      method: 'POST',
      body: {
        name: fixtures.domainMock.name,
        alternate_domains: [fixtures.domainMock.cnames],
        edge_application: fixtures.domainMock.edgeApplication,
        edge_firewall: fixtures.domainMock.edgeFirewall,
        active: fixtures.domainMock.active,
        tls: {
          ciphers: fixtures.domainMock.supportedCiphers,
          minimum_version: fixtures.domainMock.minimumTlsVersion
        },
        protocols: {
          http: {
            versions: ['http1', 'http2', 'http3'],
            http_ports: [80],
            https_ports: [443, 8443, 9440],
            quic_ports: [443]
          }
        },
        mtls: {
          verification: fixtures.domainMock.mtlsVerification,
          certificate: fixtures.domainMock.mtlsTrustedCertificate
        },
        domains: [{ allow_access: !fixtures.domainMock.cnameAccessOnly }],
        network_map: fixtures.domainMock.environment
      }
    })
  })

  it('should handle HTTPS without HTTP/3', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        data: {
          id: 1,
          domains: [{ domain: fixtures.domainMock.cnames }]
        }
      }
    })
    const { sut } = makeSut()
    const version = 'v4'
    fixtures.domainMock.useHttp3 = false
    await sut(fixtures.domainMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/workspace/workloads`,
      method: 'POST',
      body: {
        name: fixtures.domainMock.name,
        alternate_domains: [fixtures.domainMock.cnames],
        edge_application: fixtures.domainMock.edgeApplication,
        edge_firewall: fixtures.domainMock.edgeFirewall,
        active: fixtures.domainMock.active,
        tls: {
          ciphers: fixtures.domainMock.supportedCiphers,
          minimum_version: fixtures.domainMock.minimumTlsVersion
        },
        protocols: {
          http: {
            versions: ['http1', 'http2'],
            http_ports: [80],
            https_ports: [443, 8443, 9440],
            quic_ports: null
          }
        },
        mtls: {
          verification: fixtures.domainMock.mtlsVerification,
          certificate: fixtures.domainMock.mtlsTrustedCertificate
        },
        domains: [{ allow_access: !fixtures.domainMock.cnameAccessOnly }],
        network_map: fixtures.domainMock.environment
      }
    })
  })

  it('should handle HTTP-only configurations', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        data: {
          id: 1,
          domains: [{ domain: fixtures.domainMock.cnames }]
        }
      }
    })
    const { sut } = makeSut()
    const version = 'v4'
    fixtures.domainMock.useHttp3 = false
    fixtures.domainMock.useHttps = false
    fixtures.domainMock.edgeCertificate = 1
    await sut(fixtures.domainMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/workspace/workloads`,
      method: 'POST',
      body: {
        name: fixtures.domainMock.name,
        alternate_domains: [fixtures.domainMock.cnames],
        edge_application: fixtures.domainMock.edgeApplication,
        edge_firewall: fixtures.domainMock.edgeFirewall,
        active: fixtures.domainMock.active,
        tls: {
          certificate: fixtures.domainMock.edgeCertificate
        },
        protocols: {
          http: {
            versions: ['http1', 'http2'],
            http_ports: [80],
            https_ports: null,
            quic_ports: null
          }
        },
        mtls: {
          verification: fixtures.domainMock.mtlsVerification,
          certificate: fixtures.domainMock.mtlsTrustedCertificate
        },
        domains: [{ allow_access: !fixtures.domainMock.cnameAccessOnly }],
        network_map: fixtures.domainMock.environment
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        data: {
          id: 1,
          domains: [{ domain: fixtures.domainMock.cnames }]
        }
      }
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.domainMock)

    expect(data.feedback).toBe('Your domain has been created')
  })

  it('Should return an API error for an 400 response status', async () => {
    const errorKey = 'duplicated_domain_name'
    const apiErrorMock = 'duplicated_domain_name'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        [errorKey]: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const data = sut(fixtures.domainMock)

    expect(data).rejects.toThrow(apiErrorMock)
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.domainMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
