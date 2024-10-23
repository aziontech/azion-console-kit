import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createDomainService } from '@/services/domains-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  domainMock: {
    cnameAccessOnly: false,
    cnames: '',
    active: false,
    edgeCertificate: 123321,
    edgeApplication: 1695294281,
    mtlsIsEnabled: false,
    mtlsVerification: 'enforce',
    name: 'space X',
    mtlsTrustedCertificate: 'mtls-certf-mock',
    environment: 'preview'
  }
}

const makeSut = () => {
  const sut = createDomainService

  return {
    sut
  }
}

describe('DomainsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.domainMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/domains`,
      method: 'POST',
      body: {
        name: fixtures.domainMock.name,
        cname_access_only: fixtures.domainMock.cnameAccessOnly,
        digital_certificate_id: fixtures.domainMock.edgeCertificate,
        cnames: [],
        is_active: fixtures.domainMock.active,
        is_mtls_enabled: fixtures.domainMock.mtlsIsEnabled,
        mtls_verification: fixtures.domainMock.mtlsVerification,
        edge_application_id: fixtures.domainMock.edgeApplication,
        mtls_trusted_ca_certificate_id: fixtures.domainMock.mtlsTrustedCertificate,
        environment: fixtures.domainMock.environment
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.domainMock)

    expect(data.feedback).toBe('Your domain has been created')
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

    const data = sut(fixtures.domainMock)

    expect(data).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      statusCode: 400,
      errorKey: 'invalid_request',
      apiErrorMock: 'invalid_request'
    },
    {
      statusCode: 409,
      errorKey: 'conflict',
      apiErrorMock: 'conflict'
    }
  ])(
    'Should return an API error for an $statusCode response status',
    async ({ statusCode, errorKey, apiErrorMock }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: {
          [errorKey]: apiErrorMock
        }
      })
      const { sut } = makeSut()

      const feedbackMessage = sut(fixtures.domainMock)

      expect(feedbackMessage).rejects.toThrow(apiErrorMock)
    }
  )

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.domainMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
