import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editOIDCIdentityProviderService } from '@/services/identity-providers-services/edit-oidc-identity-provider-service'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  oidcProviderMock: {
    uuid: '12345',
    name: 'Example OIDC Provider',
    authorizationUrl: 'https://example.com/auth',
    userInfoUrl: 'https://example.com/userinfo',
    tokenUrl: 'https://example.com/token',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    scopes: ['openid', 'profile', 'email']
  }
}

const makeSut = () => {
  const sut = editOIDCIdentityProviderService
  return {
    sut
  }
}

describe('editOIDCIdentityProviderService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.oidcProviderMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: expect.stringContaining(`/oidc/${fixtures.oidcProviderMock.uuid}`),
      method: 'PATCH',
      body: {
        name: fixtures.oidcProviderMock.name,
        authorization_url: fixtures.oidcProviderMock.authorizationUrl,
        userinfo_url: fixtures.oidcProviderMock.userInfoUrl,
        token_url: fixtures.oidcProviderMock.tokenUrl,
        client_id: fixtures.oidcProviderMock.clientId,
        client_secret: fixtures.oidcProviderMock.clientSecret,
        scopes: fixtures.oidcProviderMock.scopes
      }
    })
  })

  it('should return a success message when the request is successful', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.oidcProviderMock)

    expect(result).toBe('Your OIDP has been updated')
  })

  it('should throw an error with the message from the response body when statusCode is 400', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        detail: ['Invalid request parameters.']
      }
    })

    const { sut } = makeSut()
    const response = sut(fixtures.oidcProviderMock)

    await expect(response).rejects.toThrow('Invalid request parameters.')
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })

      const { sut } = makeSut()
      const response = sut(fixtures.oidcProviderMock)

      await expect(response).rejects.toThrow(expectedError)
    }
  )
})
