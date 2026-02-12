import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editDomainService } from '@/services/domains-services'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/v2/digital-certificates/digital-certificates-service', () => {
  return {
    digitalCertificatesService: {
      createDigitalCertificateLetEncrypt: vi.fn()
    }
  }
})

const fixtures = {
  domainMock: {
    id: 72638,
    cnameAccessOnly: false,
    cnames: '',
    active: false,
    edgeCertificate: 123321,
    edgeApplication: 1695294281,
    mtlsIsEnabled: false,
    mtlsVerification: 'enforce',
    name: 'space X',
    mtlsTrustedCertificate: 'mtls-certf-mock'
  }
}

const makeSut = () => {
  const sut = editDomainService

  return {
    sut
  }
}

describe('DomainsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.domainMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/domains/${fixtures.domainMock.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.domainMock.name,
        cname_access_only: fixtures.domainMock.cnameAccessOnly,
        cnames: [],
        edge_firewall_id: null,
        edge_application_id: fixtures.domainMock.edgeApplication,
        digital_certificate_id: fixtures.domainMock.edgeCertificate,
        is_active: fixtures.domainMock.active,
        is_mtls_enabled: fixtures.domainMock.mtlsIsEnabled,
        mtls_verification: fixtures.domainMock.mtlsVerification
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const feedbackMessage = await sut(fixtures.domainMock)

    expect(feedbackMessage).toBe('Your domain has been edited')
  })

  it("should not recreate Let's Encrypt certificate when existing certificate is wildcard and new hostnames are not covered", async () => {
    const { digitalCertificatesService } = await import(
      '@/services/v2/digital-certificates/digital-certificates-service'
    )

    digitalCertificatesService.createDigitalCertificateLetEncrypt.mockResolvedValueOnce({ id: 999 })

    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut({
      ...fixtures.domainMock,
      authorityCertificate: 'lets_encrypt',
      edgeCertificate: 'lets_encrypt',
      oldDomains: ['a.example.com'],
      cnames: 'a.example.com\nb.other.com',
      subjectNameCertificate: ['*.example.com']
    })

    expect(digitalCertificatesService.createDigitalCertificateLetEncrypt).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          digital_certificate_id: 999
        })
      })
    )
  })

  it('should return a success message even when not provided a digital certificate', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut({ ...fixtures.domainMock, edgeCertificate: null })

    expect(feedbackMessage).toBe('Your domain has been edited')
  })

  it('Should return an API error for an 409 response status', async () => {
    const errorKey = 'duplicated_domain_name'
    const apiErrorMock = 'duplicated_domain_name'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 409,
      body: {
        [errorKey]: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.domainMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
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

    const feedbackMessage = sut(fixtures.domainMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })
})
