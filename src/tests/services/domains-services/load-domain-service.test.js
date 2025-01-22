import { describe, expect, it, vi } from 'vitest'
import { loadDomainService } from '@/services/domains-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const fixtures = {
  domainMock: {
    id: 1234,
    name: 'Edge App X',
    domain_name: 'domain A',
    cnames: ['CName 1', 'CName 2'],
    is_active: true,
    activeSort: true,
    digital_certificate_id: '862026',
    is_mtls_enabled: true,
    edge_application_id: 'ea1234',
    mtls_trusted_ca_certificate_id: '862026',
    environment: 'preview'
  },
  domainWithoutCertificateMock: {
    id: 4321,
    name: 'Edge App Y',
    domain_name: 'domain B',
    cnames: ['CName 1', 'CName 2'],
    is_active: false,
    is_mtls_enabled: false,
    activeSort: true,
    digital_certificate_id: null,
    edge_application_id: 'ea1234',
    environment: 'preview'
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
        results: fixtures.domainMock
      }
    })
    const { sut } = makeSut()

    await sut({
      id: fixtures.domainMock.id
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/domains/${fixtures.domainMock.id}`,
      method: 'GET'
    })
  })

  it('should correctly parse the returned a domain', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.domainMock }
    })
    const { sut } = makeSut()

    const result = await sut({
      id: fixtures.domainMock.id
    })

    expect(result).toEqual({
      id: fixtures.domainMock.id,
      name: fixtures.domainMock.name,
      domainName: fixtures.domainMock.domain_name,
      cnames: 'CName 1\nCName 2',
      cnameAccessOnly: fixtures.domainMock.cname_access_only,
      edgeApplication: fixtures.domainMock.edge_application_id,
      edgeCertificate: fixtures.domainMock.digital_certificate_id,
      mtlsIsEnabled: fixtures.domainMock.is_mtls_enabled,
      active: fixtures.domainMock.is_active,
      mtlsVerification: fixtures.domainMock.mtls_verification,
      mtlsTrustedCertificate: fixtures.domainMock.mtls_trusted_ca_certificate_id,
      environment: fixtures.domainMock.environment
    })
  })

  it('should correctly parse the returned a domain without digital certificate', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.domainWithoutCertificateMock }
    })
    const { sut } = makeSut()

    const result = await sut({
      id: fixtures.domainMock.id
    })

    expect(result).toEqual({
      id: fixtures.domainWithoutCertificateMock.id,
      name: fixtures.domainWithoutCertificateMock.name,
      domainName: fixtures.domainWithoutCertificateMock.domain_name,
      cnames: 'CName 1\nCName 2',
      cnameAccessOnly: fixtures.domainWithoutCertificateMock.cname_access_only,
      edgeApplication: fixtures.domainWithoutCertificateMock.edge_application_id,
      edgeCertificate: 0,
      mtlsIsEnabled: fixtures.domainWithoutCertificateMock.is_mtls_enabled,
      active: fixtures.domainWithoutCertificateMock.is_active,
      mtlsVerification: fixtures.domainWithoutCertificateMock.mtls_verification,
      environment: fixtures.domainMock.environment
    })
  })
})
