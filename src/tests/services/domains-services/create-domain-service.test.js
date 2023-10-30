import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createDomainService } from '@/services/domains-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  domainMock: {
    cnameAccessOnly: false,
    cnames: '',
    edgeApplication: 1695294281,
    mtlsIsEnabled: false,
    mtlsVerification: 'enforce',
    name: 'new dsds'
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
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.domainMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `domains`,
      method: 'POST',
      body: {
        name: fixtures.domainMock.name,
        cname_access_only: fixtures.domainMock.cnameAccessOnly,
        cnames: [],
        is_mtls_enabled: fixtures.domainMock.mtlsIsEnabled,
        mtls_verification: fixtures.domainMock.mtlsVerification,
        edge_application_id: fixtures.domainMock.edgeApplication,
        mtls_trusted_ca_certificate_id: undefined
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.domainMock)

    expect(feedbackMessage).toBe('Your domain has been created')
  })

  it.each([
    {
      scenario: 'already domain name',
      apiErrorMock: 'duplicated_domain_name',
      errorKey: 'duplicated_domain_name'
    }
  ])('Should return an API error for an $scenario', async ({ errorKey, apiErrorMock }) => {
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
