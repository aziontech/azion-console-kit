import { describe, expect, it, vi, beforeEach } from 'vitest'
import { loadDomainService } from '@/services/domains-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { digitalCertificatesService } from '@/services/v2/digital-certificates/digital-certificates-service'

vi.mock('@/services/v2/digital-certificates/digital-certificates-service', () => ({
  digitalCertificatesService: {
    loadDigitalCertificate: vi.fn()
  }
}))

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
  },
  certificateMock: {
    id: '862026',
    name: 'Certificate X',
    authority: 'lets_encrypt',
    subjectName: ['*.example.com']
  }
}

const makeSut = () => {
  const sut = loadDomainService
  return {
    sut
  }
}

describe('DomainServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    digitalCertificatesService.loadDigitalCertificate.mockResolvedValue(fixtures.certificateMock)
  })

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

    expect(digitalCertificatesService.loadDigitalCertificate).toHaveBeenCalledWith({
      id: fixtures.domainMock.digital_certificate_id
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
      edgeFirewall: undefined,
      active: fixtures.domainMock.is_active,
      mtlsVerification: fixtures.domainMock.mtls_verification,
      mtlsTrustedCertificate: fixtures.domainMock.mtls_trusted_ca_certificate_id,
      environment: fixtures.domainMock.environment,
      oldDomains: ['CName 1', 'CName 2'],
      authorityCertificate: fixtures.certificateMock.authority,
      subjectNameCertificate: fixtures.certificateMock.subjectName
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

    expect(digitalCertificatesService.loadDigitalCertificate).not.toHaveBeenCalled()
    expect(result).toEqual({
      id: fixtures.domainWithoutCertificateMock.id,
      name: fixtures.domainWithoutCertificateMock.name,
      domainName: fixtures.domainWithoutCertificateMock.domain_name,
      cnames: 'CName 1\nCName 2',
      cnameAccessOnly: fixtures.domainWithoutCertificateMock.cname_access_only,
      edgeApplication: fixtures.domainWithoutCertificateMock.edge_application_id,
      edgeCertificate: 0,
      mtlsIsEnabled: fixtures.domainWithoutCertificateMock.is_mtls_enabled,
      edgeFirewall: undefined,
      active: fixtures.domainWithoutCertificateMock.is_active,
      mtlsVerification: fixtures.domainWithoutCertificateMock.mtls_verification,
      environment: fixtures.domainMock.environment,
      oldDomains: ['CName 1', 'CName 2'],
      authorityCertificate: null,
      subjectNameCertificate: null
    })
  })

  it('should fallback certificate metadata to null when the certificate request fails', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.domainMock }
    })
    digitalCertificatesService.loadDigitalCertificate.mockRejectedValueOnce(new Error('not found'))
    const { sut } = makeSut()

    const result = await sut({
      id: fixtures.domainMock.id
    })

    expect(result.authorityCertificate).toBeNull()
    expect(result.subjectNameCertificate).toBeNull()
  })

  it('should return an error when the request fails with status 400', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { detail: 'Bad Request' }
    })

    const { sut } = makeSut()

    await expect(sut({ id: 'invalid-id' })).rejects.toThrow('Bad Request')
  })
})
