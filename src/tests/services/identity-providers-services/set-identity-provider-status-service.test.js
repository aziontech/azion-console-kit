import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { setIdentityProviderStatusService } from '@/services/identity-providers-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  OIDC: {
    id: 1,
    isActive: true,
    protocol: 'OIDC'
  },
  SAML: {
    id: 1,
    isActive: false,
    protocol: 'SAML'
  }
}

const makeSut = () => {
  const sut = setIdentityProviderStatusService

  return {
    sut
  }
}

describe('SetIdentityProviderStatusService', () => {
  it('should call API with correct params to a OIDC Identity Provider', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    await sut(fixtures.OIDC)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `iam/identity_providers/oidc/${fixtures.OIDC.id}`,
      method: 'PATCH',
      body: {
        is_active: fixtures.OIDC.isActive
      }
    })
  })

  it('should call API with correct params to a SAML2 Identity Provider', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    await sut(fixtures.SAML)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `iam/identity_providers/saml2/${fixtures.SAML.id}`,
      method: 'PATCH',
      body: {
        is_active: fixtures.SAML.isActive
      }
    })
  })

  it('should return a feedback message on successfully set status', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.OIDC)

    expect(feedbackMessage).toBe('Identity Provider successfuly set as active')
  })

  it('Should return an API error for an key with value String', () => {
    const apiErrorMock = 'Unable to save the JSON Args with an invalid JSON.'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { invalid_json: apiErrorMock }
    })

    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.OIDC)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      errorKey: 'name',
      apiErrorMock: 'This field is required',
      status: 400
    },
    {
      errorKey: 'code',
      apiErrorMock: 'This field is required',
      status: 400
    },
    {
      errorKey: 'language',
      apiErrorMock: '"java" is not a valid choice. Possible choices are: [javascript, lua]',
      status: 400
    },
    {
      errorKey: 'unmapped_key',
      apiErrorMock: 'testing unmapped key',
      status: 400
    }
  ])(
    'Should return an API error for an key $errorKey',
    async ({ errorKey, apiErrorMock, status }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode: status,
        body: { [errorKey]: [apiErrorMock] }
      })
      const { sut } = makeSut()

      const feedbackMessage = sut(fixtures.OIDC)

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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.OIDC)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
